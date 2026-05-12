/**
 * CAPTCHA Shield v4.0 "Fortress" — Tenant Manager
 *
 * Manages multi-tenant support for the CAPTCHA Shield platform. Each tenant
 * has independent configuration, API keys, analytics, rate limiting, and
 * domain allowlists.
 *
 * Features:
 * - Unique API keys per tenant (`cs_live_` and `cs_test_` prefixes)
 * - Independent widget configuration per tenant
 * - Independent analytics and rate limiting per tenant
 * - Domain allowlist (CORS)
 * - API key rotation and revocation
 * - In-memory storage with optional localStorage persistence
 *
 * @example
 * ```ts
 * const manager = getTenantManager();
 *
 * // Register a new tenant
 * const tenant = manager.registerTenant({
 *   name: 'Acme Corp',
 *   allowedDomains: ['acme.com', 'app.acme.com'],
 *   mode: VerificationMode.FORTRESS,
 * });
 *
 * // Get tenant by API key
 * const found = manager.getTenant(tenant.liveApiKey);
 *
 * // Validate an API key
 * const valid = manager.validateApiKey(tenant.liveApiKey);
 *
 * // Rotate API key
 * const newKey = manager.rotateApiKey(tenant.id);
 *
 * // Get tenant's widget config
 * const config = manager.getTenantConfig(tenant.liveApiKey);
 * ```
 */

import {
  Tenant,
  TenantConfig,
  TenantStats,
  ApiKeyMetadata,
} from './types';

import {
  WidgetConfig,
  DEFAULT_WIDGET_CONFIG,
  VerificationMode,
  ChallengeType,
  RiskLevel,
} from '@/lib/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const LIVE_KEY_PREFIX = 'cs_live_';
const TEST_KEY_PREFIX = 'cs_test_';
const KEY_RANDOM_BYTES = 24; // 32 chars in base64url
const MAX_HOURLY_ATTEMPTS = 1000;
const RATE_WINDOW_MS = 60_000; // 1 minute
const STORAGE_KEY = 'cshield_v4_tenants';

const DEFAULT_RATE_LIMITS = {
  generatePerMinute: 60,
  verifyPerMinute: 30,
  analyticsPerMinute: 10,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate a unique tenant ID.
 *
 * @returns A tenant ID string like `tenant_abc123def456`.
 */
function generateTenantId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `tenant_${timestamp}_${random}`;
}

/**
 * Generate a cryptographically random API key with a given prefix.
 *
 * Uses `crypto.getRandomValues` for secure randomness.
 *
 * @param prefix - The key prefix (`'cs_live_'` or `'cs_test_'`).
 * @returns An API key string.
 */
function generateApiKey(prefix: string): string {
  const bytes = new Uint8Array(KEY_RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  const encoded = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}${encoded}`;
}

/**
 * Create a fresh `ApiKeyMetadata` object.
 *
 * @param key - The API key string.
 * @param type - Whether this is a live or test key.
 * @param label - A human-readable label.
 * @returns A new `ApiKeyMetadata`.
 */
function createKeyMetadata(key: string, type: 'live' | 'test', label: string): ApiKeyMetadata {
  return {
    key,
    type,
    label,
    createdAt: Date.now(),
    lastUsedAt: null,
    revoked: false,
    revokedAt: null,
    replacedBy: null,
  };
}

/**
 * Create a fresh `TenantStats` object.
 *
 * @returns An initialized `TenantStats` with zero values.
 */
function createEmptyStats(): TenantStats {
  const now = Date.now();
  const hourStart = Math.floor(now / 3_600_000) * 3_600_000;

  return {
    totalAttempts: 0,
    totalSuccesses: 0,
    totalBlocked: 0,
    successRate: 0,
    avgRiskScore: 0,
    hourlyAttempts: 0,
    hourlyWindowStart: hourStart,
    riskLevelDistribution: {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    },
    challengeDistribution: {},
    lastActivityAt: null,
    rateCounters: {
      generate: { count: 0, windowStart: now },
      verify: { count: 0, windowStart: now },
      analytics: { count: 0, windowStart: now },
    },
  };
}

// ─── TenantManager ─────────────────────────────────────────────────────────────

/**
 * Manages multi-tenant support for the CAPTCHA Shield platform.
 *
 * The `TenantManager` maintains a registry of tenants, each with independent
 * configuration, API keys, analytics, and rate limiting. It supports API key
 * generation, validation, rotation, and revocation, as well as domain-based
 * access control (CORS).
 *
 * Storage is in-memory by default, with optional localStorage persistence
 * for tenant configurations and API keys (statistics are always in-memory).
 */
export class TenantManager {
  /** Tenant registry, keyed by tenant ID. */
  private tenants: Map<string, Tenant> = new Map();

  /** API key → tenant ID lookup index. */
  private apiKeyIndex: Map<string, string> = new Map();

  /** Whether to persist tenant data to localStorage. */
  private persistToStorage: boolean;

  /**
   * Create a new TenantManager.
   *
   * @param persistToStorage - Whether to persist tenant data to localStorage.
   *   Defaults to `false`.
   */
  constructor(persistToStorage: boolean = false) {
    this.persistToStorage = persistToStorage;

    if (persistToStorage) {
      this.loadFromStorage();
    }
  }

  // ── Tenant Registration ──────────────────────────────────────────────────

  /**
   * Register a new tenant with the given configuration.
   *
   * Generates a pair of API keys (`cs_live_` and `cs_test_`) and creates
   * the tenant with independent configuration, analytics, and rate limiting.
   *
   * @param config - The tenant configuration.
   * @returns The newly created tenant.
   *
   * @example
   * ```ts
   * const tenant = manager.registerTenant({
   *   name: 'Acme Corp',
   *   allowedDomains: ['acme.com'],
   *   mode: VerificationMode.FORTRESS,
   * });
   * console.log(tenant.liveApiKey); // cs_live_abc123...
   * console.log(tenant.testApiKey); // cs_test_def456...
   * ```
   */
  registerTenant(config: TenantConfig): Tenant {
    const id = generateTenantId();
    const now = Date.now();

    // Generate API keys
    const liveKey = generateApiKey(LIVE_KEY_PREFIX);
    const testKey = generateApiKey(TEST_KEY_PREFIX);

    const liveKeyMeta = createKeyMetadata(liveKey, 'live', 'Default live key');
    const testKeyMeta = createKeyMetadata(testKey, 'test', 'Default test key');

    // Build resolved config
    const resolvedConfig: Tenant['config'] = {
      name: config.name,
      description: config.description ?? '',
      contactEmail: config.contactEmail ?? '',
      metadata: config.metadata ?? {},
      mode: config.mode ?? VerificationMode.FORTRESS,
      language: config.language ?? 'en',
      theme: config.theme ?? 'auto',
      allowedChallenges: config.allowedChallenges ?? [],
      allowedDomains: config.allowedDomains,
      widgetConfig: config.widgetConfig ?? {},
      maxAttemptsPerHour: config.maxAttemptsPerHour ?? MAX_HOURLY_ATTEMPTS,
      rateLimits: {
        generatePerMinute: config.rateLimits?.generatePerMinute ?? DEFAULT_RATE_LIMITS.generatePerMinute,
        verifyPerMinute: config.rateLimits?.verifyPerMinute ?? DEFAULT_RATE_LIMITS.verifyPerMinute,
        analyticsPerMinute: config.rateLimits?.analyticsPerMinute ?? DEFAULT_RATE_LIMITS.analyticsPerMinute,
      },
      active: config.active ?? true,
    };

    const tenant: Tenant = {
      id,
      config: resolvedConfig,
      apiKeys: [liveKeyMeta, testKeyMeta],
      liveApiKey: liveKey,
      testApiKey: testKey,
      createdAt: now,
      updatedAt: now,
      active: resolvedConfig.active,
      stats: createEmptyStats(),
    };

    // Register
    this.tenants.set(id, tenant);
    this.apiKeyIndex.set(liveKey, id);
    this.apiKeyIndex.set(testKey, id);

    this.persistIfNeeded();

    return tenant;
  }

  // ── Tenant Lookup ────────────────────────────────────────────────────────

  /**
   * Get a tenant by its API key.
   *
   * Looks up the API key in the index and returns the associated tenant.
   * Revoked keys will not match.
   *
   * @param apiKey - The API key to look up.
   * @returns The tenant, or `null` if not found or the key is revoked.
   */
  getTenant(apiKey: string): Tenant | null {
    const tenantId = this.apiKeyIndex.get(apiKey);
    if (!tenantId) return null;

    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    // Check if the key is revoked
    const keyMeta = tenant.apiKeys.find((k) => k.key === apiKey);
    if (keyMeta?.revoked) return null;

    // Update last used timestamp
    if (keyMeta) {
      keyMeta.lastUsedAt = Date.now();
    }

    return tenant;
  }

  /**
   * Get a tenant by its ID.
   *
   * @param tenantId - The tenant ID.
   * @returns The tenant, or `null` if not found.
   */
  getTenantById(tenantId: string): Tenant | null {
    return this.tenants.get(tenantId) ?? null;
  }

  /**
   * Get all registered tenants.
   *
   * @returns An array of all tenants.
   */
  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  // ── API Key Validation ───────────────────────────────────────────────────

  /**
   * Validate an API key.
   *
   * Checks that the key exists, is not revoked, and belongs to an active tenant.
   *
   * @param apiKey - The API key to validate.
   * @returns `true` if the key is valid and usable.
   */
  validateApiKey(apiKey: string): boolean {
    const tenant = this.getTenant(apiKey);
    return tenant !== null && tenant.active;
  }

  /**
   * Check if an API key is a live key.
   *
   * @param apiKey - The API key to check.
   * @returns `true` if the key starts with `cs_live_`.
   */
  isLiveKey(apiKey: string): boolean {
    return apiKey.startsWith(LIVE_KEY_PREFIX);
  }

  /**
   * Check if an API key is a test key.
   *
   * @param apiKey - The API key to check.
   * @returns `true` if the key starts with `cs_test_`.
   */
  isTestKey(apiKey: string): boolean {
    return apiKey.startsWith(TEST_KEY_PREFIX);
  }

  // ── Tenant Config ────────────────────────────────────────────────────────

  /**
   * Get the widget configuration for a tenant.
   *
   * Merges the tenant's custom widget configuration with the default
   * configuration, producing a complete `WidgetConfig` for the widget.
   *
   * @param apiKey - The tenant's API key.
   * @returns The merged `WidgetConfig`, or the default config if the tenant
   *   is not found.
   */
  getTenantConfig(apiKey: string): WidgetConfig {
    const tenant = this.getTenant(apiKey);
    if (!tenant) return { ...DEFAULT_WIDGET_CONFIG };

    const base: WidgetConfig = {
      ...DEFAULT_WIDGET_CONFIG,
      mode: tenant.config.mode,
      language: tenant.config.language,
      theme: tenant.config.theme,
    };

    return { ...base, ...tenant.config.widgetConfig };
  }

  // ── API Key Rotation ─────────────────────────────────────────────────────

  /**
   * Rotate the API key for a tenant.
   *
   * Generates a new API key of the same type (live or test) as the current
   * active key. The old key is marked as revoked and linked to the new key
   * via `replacedBy`.
   *
   * @param tenantId - The ID of the tenant whose key should be rotated.
   * @param keyType - The type of key to rotate (`'live'` or `'test'`).
   *   Defaults to `'live'`.
   * @returns The new API key string.
   * @throws Error if the tenant is not found.
   *
   * @example
   * ```ts
   * const newKey = manager.rotateApiKey('tenant_abc123', 'live');
   * console.log(newKey); // cs_live_newrandomkey...
   * ```
   */
  rotateApiKey(tenantId: string, keyType: 'live' | 'test' = 'live'): string {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Find the current active key of the given type
    const currentKey = tenant.apiKeys.find(
      (k) => k.type === keyType && !k.revoked,
    );
    if (!currentKey) {
      throw new Error(`No active ${keyType} key found for tenant: ${tenantId}`);
    }

    // Generate new key
    const prefix = keyType === 'live' ? LIVE_KEY_PREFIX : TEST_KEY_PREFIX;
    const newKey = generateApiKey(prefix);
    const newKeyMeta = createKeyMetadata(newKey, keyType, `Rotated ${keyType} key`);

    // Revoke old key
    currentKey.revoked = true;
    currentKey.revokedAt = Date.now();
    currentKey.replacedBy = newKey;

    // Remove old key from index, add new key
    this.apiKeyIndex.delete(currentKey.key);
    this.apiKeyIndex.set(newKey, tenantId);

    // Add new key to tenant
    tenant.apiKeys.push(newKeyMeta);

    // Update convenience shortcuts
    if (keyType === 'live') {
      tenant.liveApiKey = newKey;
    } else {
      tenant.testApiKey = newKey;
    }

    tenant.updatedAt = Date.now();
    this.persistIfNeeded();

    return newKey;
  }

  // ── API Key Revocation ───────────────────────────────────────────────────

  /**
   * Revoke an API key.
   *
   * The key will no longer be usable for authentication. This is a
   * destructive action — the key cannot be un-revoked.
   *
   * @param apiKey - The API key to revoke.
   * @throws Error if the key is not found.
   */
  revokeApiKey(apiKey: string): void {
    const tenantId = this.apiKeyIndex.get(apiKey);
    if (!tenantId) {
      throw new Error(`API key not found: ${apiKey}`);
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found for API key: ${apiKey}`);
    }

    const keyMeta = tenant.apiKeys.find((k) => k.key === apiKey);
    if (!keyMeta) {
      throw new Error(`API key metadata not found: ${apiKey}`);
    }

    if (keyMeta.revoked) {
      return; // Already revoked
    }

    keyMeta.revoked = true;
    keyMeta.revokedAt = Date.now();

    // Remove from index
    this.apiKeyIndex.delete(apiKey);

    tenant.updatedAt = Date.now();
    this.persistIfNeeded();
  }

  // ── Domain Validation ────────────────────────────────────────────────────

  /**
   * Check if a domain is allowed for a given tenant.
   *
   * @param apiKey - The tenant's API key.
   * @param domain - The domain to check (e.g., `'example.com'`).
   * @returns `true` if the domain is in the tenant's allowlist.
   */
  isDomainAllowed(apiKey: string, domain: string): boolean {
    const tenant = this.getTenant(apiKey);
    if (!tenant) return false;

    const allowed = tenant.config.allowedDomains;
    if (allowed.includes('*')) return true;

    return allowed.some((allowedDomain) => {
      // Support wildcard subdomains like *.example.com
      if (allowedDomain.startsWith('*.')) {
        const baseDomain = allowedDomain.slice(2);
        return domain === baseDomain || domain.endsWith(`.${baseDomain}`);
      }
      return domain === allowedDomain;
    });
  }

  // ── Rate Limiting ────────────────────────────────────────────────────────

  /**
   * Check and increment the rate limit counter for a tenant's API endpoint.
   *
   * Uses a sliding window of 1 minute per endpoint type.
   *
   * @param apiKey - The tenant's API key.
   * @param endpoint - The endpoint type to check.
   * @returns `true` if the request is within rate limits, `false` if limited.
   */
  checkRateLimit(apiKey: string, endpoint: 'generate' | 'verify' | 'analytics'): boolean {
    const tenant = this.getTenant(apiKey);
    if (!tenant) return false;

    const now = Date.now();
    const counter = tenant.stats.rateCounters[endpoint];
    const limit = tenant.config.rateLimits[`${endpoint}PerMinute` as keyof typeof tenant.config.rateLimits];

    // Reset window if expired
    if (now - counter.windowStart >= RATE_WINDOW_MS) {
      counter.windowStart = now;
      counter.count = 0;
    }

    if (counter.count >= (limit ?? Infinity)) {
      return false;
    }

    counter.count++;
    return true;
  }

  // ── Statistics ───────────────────────────────────────────────────────────

  /**
   * Record a verification attempt for a tenant.
   *
   * Updates the tenant's statistics including attempt counts, success rates,
   * risk distributions, and hourly tracking.
   *
   * @param apiKey - The tenant's API key.
   * @param result - The result of the verification attempt.
   */
  recordAttempt(apiKey: string, result: {
    success: boolean;
    blocked?: boolean;
    riskScore?: number;
    riskLevel?: RiskLevel;
    challengeType?: ChallengeType;
  }): void {
    const tenant = this.getTenant(apiKey);
    if (!tenant) return;

    const stats = tenant.stats;
    const now = Date.now();

    stats.totalAttempts++;
    stats.lastActivityAt = now;

    if (result.success) {
      stats.totalSuccesses++;
    }
    if (result.blocked) {
      stats.totalBlocked++;
    }

    // Recompute success rate
    stats.successRate = stats.totalAttempts > 0
      ? stats.totalSuccesses / stats.totalAttempts
      : 0;

    // Update average risk score
    if (result.riskScore !== undefined) {
      const totalRisk = stats.avgRiskScore * (stats.totalAttempts - 1) + result.riskScore;
      stats.avgRiskScore = totalRisk / stats.totalAttempts;
    }

    // Update risk level distribution
    if (result.riskLevel) {
      stats.riskLevelDistribution[result.riskLevel] =
        (stats.riskLevelDistribution[result.riskLevel] ?? 0) + 1;
    }

    // Update challenge distribution
    if (result.challengeType) {
      stats.challengeDistribution[result.challengeType] =
        (stats.challengeDistribution[result.challengeType] ?? 0) + 1;
    }

    // Update hourly attempts
    const hourStart = Math.floor(now / 3_600_000) * 3_600_000;
    if (hourStart > stats.hourlyWindowStart) {
      stats.hourlyAttempts = 1;
      stats.hourlyWindowStart = hourStart;
    } else {
      stats.hourlyAttempts++;
    }
  }

  /**
   * Get statistics for a tenant.
   *
   * @param apiKey - The tenant's API key.
   * @returns The tenant's statistics, or `null` if the tenant is not found.
   */
  getTenantStats(apiKey: string): TenantStats | null {
    const tenant = this.getTenant(apiKey);
    return tenant?.stats ?? null;
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  /**
   * Persist tenant data to localStorage if persistence is enabled.
   *
   * Only tenant configurations and API keys are persisted; statistics
   * are always in-memory and reset on reload.
   */
  private persistIfNeeded(): void {
    if (!this.persistToStorage) return;

    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      const data = Array.from(this.tenants.entries()).map(([id, tenant]) => ({
        id,
        config: tenant.config,
        apiKeys: tenant.apiKeys,
        liveApiKey: tenant.liveApiKey,
        testApiKey: tenant.testApiKey,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        active: tenant.active,
      }));

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage not available or quota exceeded — silently continue
    }
  }

  /**
   * Load tenant data from localStorage if persistence is enabled.
   *
   * Reconstructs the tenant registry and API key index from persisted data.
   * Statistics are always initialized fresh.
   */
  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored) as Array<{
        id: string;
        config: Tenant['config'];
        apiKeys: ApiKeyMetadata[];
        liveApiKey: string;
        testApiKey: string;
        createdAt: number;
        updatedAt: number;
        active: boolean;
      }>;

      for (const item of data) {
        const tenant: Tenant = {
          id: item.id,
          config: item.config,
          apiKeys: item.apiKeys,
          liveApiKey: item.liveApiKey,
          testApiKey: item.testApiKey,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          active: item.active,
          stats: createEmptyStats(),
        };

        this.tenants.set(item.id, tenant);

        // Rebuild API key index (skip revoked keys)
        for (const keyMeta of item.apiKeys) {
          if (!keyMeta.revoked) {
            this.apiKeyIndex.set(keyMeta.key, item.id);
          }
        }
      }
    } catch {
      // Corrupted or unavailable — start fresh
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Remove a tenant entirely.
   *
   * Revokes all API keys and removes the tenant from the registry.
   *
   * @param tenantId - The ID of the tenant to remove.
   * @returns `true` if the tenant was found and removed.
   */
  removeTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;

    // Remove all API keys from index
    for (const keyMeta of tenant.apiKeys) {
      this.apiKeyIndex.delete(keyMeta.key);
    }

    this.tenants.delete(tenantId);
    this.persistIfNeeded();

    return true;
  }

  /**
   * Get summary statistics across all tenants.
   *
   * @returns An object with aggregate statistics.
   */
  getGlobalStats(): {
    totalTenants: number;
    activeTenants: number;
    totalApiKeys: number;
    activeApiKeys: number;
    totalAttempts: number;
    totalSuccesses: number;
  } {
    const tenants = Array.from(this.tenants.values());
    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t) => t.active).length,
      totalApiKeys: tenants.reduce((sum, t) => sum + t.apiKeys.length, 0),
      activeApiKeys: tenants.reduce(
        (sum, t) => sum + t.apiKeys.filter((k) => !k.revoked).length,
        0,
      ),
      totalAttempts: tenants.reduce((sum, t) => sum + t.stats.totalAttempts, 0),
      totalSuccesses: tenants.reduce((sum, t) => sum + t.stats.totalSuccesses, 0),
    };
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────────

let instance: TenantManager | undefined;

/**
 * Get the singleton `TenantManager` instance.
 *
 * The first call creates the manager without localStorage persistence.
 * Subsequent calls return the same instance.
 *
 * To create a manager with persistence, use `new TenantManager(true)`.
 *
 * @returns The shared `TenantManager`.
 */
export function getTenantManager(): TenantManager {
  if (!instance) {
    instance = new TenantManager();
  }
  return instance;
}
