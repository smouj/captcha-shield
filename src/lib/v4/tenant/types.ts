/**
 * CAPTCHA Shield v4.0 "Fortress" — Multi-Tenant Types
 *
 * Type definitions for multi-tenant support. Each tenant has independent
 * configuration, analytics, rate limiting, and domain allowlists.
 */

import {
  WidgetConfig,
  ChallengeType,
  VerificationMode,
  RiskLevel,
} from '@/lib/types';

// ─── API Key Metadata ──────────────────────────────────────────────────────────

/**
 * Metadata about an API key, including its type, creation info, and rotation state.
 */
export interface ApiKeyMetadata {
  /** The full API key string (prefixed `cs_live_` or `cs_test_`). */
  key: string;

  /** Whether this is a live or test key. */
  type: 'live' | 'test';

  /** A human-readable label for this key. */
  label: string;

  /** Timestamp when this key was created (ms since epoch). */
  createdAt: number;

  /** Timestamp when this key was last used (ms since epoch). */
  lastUsedAt: number | null;

  /** Whether this key has been revoked. */
  revoked: boolean;

  /** Timestamp when this key was revoked, if applicable. */
  revokedAt: number | null;

  /** The ID of the key that replaced this one (after rotation). */
  replacedBy: string | null;
}

// ─── Tenant Config ─────────────────────────────────────────────────────────────

/**
 * Configuration for creating or updating a tenant.
 *
 * Each tenant has fully independent settings for the CAPTCHA Shield widget,
 * including verification mode, allowed challenge types, and domain restrictions.
 */
export interface TenantConfig {
  /** A human-readable name for the tenant (e.g., company or site name). */
  name: string;

  /** Optional description of the tenant. */
  description?: string;

  /** The verification mode for this tenant. Defaults to `'fortress'`. */
  mode?: VerificationMode;

  /** Language code for widget UI. Defaults to `'en'`. */
  language?: string;

  /** Theme for the widget. Defaults to `'auto'`. */
  theme?: 'light' | 'dark' | 'auto';

  /**
   * Challenge types this tenant is allowed to use.
   * If empty, all challenge types are available.
   * Defaults to `[]` (all allowed).
   */
  allowedChallenges?: ChallengeType[];

  /**
   * Domain allowlist for CORS.
   * Only requests from these domains will be accepted.
   * Use `['*']` to allow all domains (not recommended for production).
   */
  allowedDomains: string[];

  /** Custom widget configuration overrides for this tenant. */
  widgetConfig?: Partial<WidgetConfig>;

  /** Maximum verification attempts per hour for this tenant. Defaults to `1000`. */
  maxAttemptsPerHour?: number;

  /** Custom rate-limiting overrides. */
  rateLimits?: {
    /** Maximum generate requests per minute. Defaults to `60`. */
    generatePerMinute?: number;
    /** Maximum verify requests per minute. Defaults to `30`. */
    verifyPerMinute?: number;
    /** Maximum analytics requests per minute. Defaults to `10`. */
    analyticsPerMinute?: number;
  };

  /** Whether this tenant is active. Defaults to `true`. */
  active?: boolean;

  /** Contact email for the tenant. */
  contactEmail?: string;

  /** Arbitrary metadata for the tenant. */
  metadata?: Record<string, unknown>;
}

// ─── Tenant ────────────────────────────────────────────────────────────────────

/**
 * A fully resolved tenant with all runtime data.
 *
 * Contains the tenant's configuration, API keys, statistics, and
 * operational state.
 */
export interface Tenant {
  /** Unique tenant identifier. */
  id: string;

  /** The tenant configuration. */
  config: Required<Omit<TenantConfig, 'description' | 'contactEmail' | 'metadata' | 'widgetConfig' | 'rateLimits'>> & {
    description: string;
    contactEmail: string;
    metadata: Record<string, unknown>;
    widgetConfig: Partial<WidgetConfig>;
    rateLimits: NonNullable<TenantConfig['rateLimits']>;
  };

  /** API keys associated with this tenant. */
  apiKeys: ApiKeyMetadata[];

  /** Current live API key (convenience shortcut). */
  liveApiKey: string;

  /** Current test API key (convenience shortcut). */
  testApiKey: string;

  /** Timestamp when the tenant was created. */
  createdAt: number;

  /** Timestamp when the tenant was last updated. */
  updatedAt: number;

  /** Whether the tenant is currently active. */
  active: boolean;

  /** Statistics for this tenant. */
  stats: TenantStats;
}

// ─── Tenant Stats ──────────────────────────────────────────────────────────────

/**
 * Runtime statistics for a tenant.
 *
 * Tracks verification counts, success rates, and rate-limiting counters
 * independently for each tenant.
 */
export interface TenantStats {
  /** Total verification attempts. */
  totalAttempts: number;

  /** Total successful verifications. */
  totalSuccesses: number;

  /** Total blocked verifications. */
  totalBlocked: number;

  /** Success rate (0–1). */
  successRate: number;

  /** Average risk score across all attempts. */
  avgRiskScore: number;

  /** Attempts in the current hour. */
  hourlyAttempts: number;

  /** Start of the current hour window (ms since epoch). */
  hourlyWindowStart: number;

  /** Distribution of risk levels. */
  riskLevelDistribution: Record<RiskLevel, number>;

  /** Distribution of challenge types used. */
  challengeDistribution: Partial<Record<ChallengeType, number>>;

  /** Last activity timestamp. */
  lastActivityAt: number | null;

  /** Rate-limiting counters. */
  rateCounters: {
    generate: { count: number; windowStart: number };
    verify: { count: number; windowStart: number };
    analytics: { count: number; windowStart: number };
  };
}
