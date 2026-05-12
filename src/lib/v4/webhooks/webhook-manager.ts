/**
 * CAPTCHA Shield v4.0 "Fortress" — Webhook Manager
 *
 * Manages webhook notifications for CAPTCHA verification events. Supports:
 * - Configurable webhook URLs and event subscriptions
 * - HMAC-SHA256 payload signing for authenticity
 * - Exponential backoff retry logic (3 retries)
 * - Rate limiting (max 100 webhooks per minute)
 * - Batch mode (accumulate events and send in batches every 5s)
 *
 * @example
 * ```ts
 * const manager = getWebhookManager();
 *
 * // Register a webhook
 * manager.addWebhook({
 *   id: 'wh_1',
 *   url: 'https://example.com/webhook',
 *   events: ['verification.success', 'verification.failure'],
 *   secret: 'my-secret-key',
 *   active: true,
 *   maxRetries: 3,
 *   batchMode: false,
 *   batchIntervalMs: 5000,
 *   maxBatchSize: 50,
 *   createdAt: Date.now(),
 *   updatedAt: Date.now(),
 * });
 *
 * // Emit an event
 * manager.emit({
 *   id: 'evt_1',
 *   type: 'verification.success',
 *   timestamp: Date.now(),
 *   sessionId: 'sess_abc',
 *   riskScore: 0.12,
 * });
 * ```
 */

import {
  WebhookConfig,
  WebhookEvent,
  WebhookPayload,
  WebhookDelivery,
  WebhookRateLimit,
} from './types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_RATE_PER_MINUTE = 100;
const BATCH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 50;
const RETRY_BASE_DELAY_MS = 1000; // 1s, doubles each retry
const REQUEST_TIMEOUT_MS = 10000; // 10s
const RATE_WINDOW_MS = 60_000; // 1 minute

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generate a unique ID with a given prefix.
 *
 * @param prefix - The prefix for the ID (e.g., `'wh'`, `'dlv'`).
 * @returns A unique identifier string.
 */
function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Compute an HMAC-SHA256 signature for a payload string.
 *
 * Uses the Web Crypto API for isomorphic support.
 *
 * @param payload - The string to sign.
 * @param secret - The HMAC secret key.
 * @returns A promise that resolves to the hex-encoded signature.
 */
async function computeHMAC(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload),
  );

  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── WebhookManager ────────────────────────────────────────────────────────────

/**
 * Manages webhook registrations, event emission, delivery, and retries.
 *
 * The `WebhookManager` is the central point for all webhook operations. It
 * maintains a registry of webhook configurations, processes incoming events,
 * and delivers them to the appropriate endpoints with HMAC-SHA256 signing.
 *
 * Key features:
 * - **Event filtering**: Each webhook only receives events it subscribes to.
 * - **HMAC-SHA256 signing**: Every payload is signed so the receiver can
 *   verify authenticity using the `X-CShield-Signature` header.
 * - **Exponential backoff**: Failed deliveries are retried up to 3 times
 *   with delays of 1s, 2s, and 4s.
 * - **Rate limiting**: No more than 100 deliveries per minute per webhook.
 * - **Batch mode**: Events can be accumulated and sent in batches.
 */
export class WebhookManager {
  /** Registered webhook configurations, keyed by ID. */
  private webhooks: Map<string, WebhookConfig> = new Map();

  /** Pending events for batch mode, keyed by webhook ID. */
  private batchBuffers: Map<string, WebhookEvent[]> = new Map();

  /** Batch timers, keyed by webhook ID. */
  private batchTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /** Delivery history (most recent 1000). */
  private deliveryHistory: WebhookDelivery[] = [];

  /** Rate-limiting state, keyed by webhook ID. */
  private rateLimits: Map<string, WebhookRateLimit> = new Map();

  /** Maximum deliveries per minute per webhook. */
  private maxRatePerMinute: number;

  /** Whether the manager has been destroyed. */
  private destroyed = false;

  /**
   * Create a new WebhookManager.
   *
   * @param maxRatePerMinute - Maximum webhook deliveries per minute. Defaults to `100`.
   */
  constructor(maxRatePerMinute: number = MAX_RATE_PER_MINUTE) {
    this.maxRatePerMinute = maxRatePerMinute;
  }

  // ── Webhook Registration ─────────────────────────────────────────────────

  /**
   * Register a new webhook configuration.
   *
   * If a webhook with the same ID already exists, it will be replaced.
   *
   * @param config - The webhook configuration to register.
   */
  addWebhook(config: WebhookConfig): void {
    this.webhooks.set(config.id, config);

    // Initialize rate limit tracker
    if (!this.rateLimits.has(config.id)) {
      this.rateLimits.set(config.id, {
        windowStart: Date.now(),
        count: 0,
        maxPerMinute: this.maxRatePerMinute,
      });
    }

    // Initialize batch buffer if batch mode
    if (config.batchMode && !this.batchBuffers.has(config.id)) {
      this.batchBuffers.set(config.id, []);
    }
  }

  /**
   * Remove a webhook configuration.
   *
   * @param webhookId - The ID of the webhook to remove.
   * @returns `true` if the webhook was found and removed.
   */
  removeWebhook(webhookId: string): boolean {
    // Clear batch timer if exists
    const timer = this.batchTimers.get(webhookId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(webhookId);
    }

    this.batchBuffers.delete(webhookId);
    this.rateLimits.delete(webhookId);
    return this.webhooks.delete(webhookId);
  }

  /**
   * Get a webhook configuration by ID.
   *
   * @param webhookId - The webhook ID.
   * @returns The webhook configuration, or `undefined` if not found.
   */
  getWebhook(webhookId: string): WebhookConfig | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * Get all registered webhook configurations.
   *
   * @returns An array of all webhook configurations.
   */
  getAllWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Update a webhook configuration.
   *
   * Only the provided fields are updated; omitted fields remain unchanged.
   *
   * @param webhookId - The ID of the webhook to update.
   * @param updates - Partial configuration updates.
   * @returns The updated configuration, or `undefined` if not found.
   */
  updateWebhook(
    webhookId: string,
    updates: Partial<WebhookConfig>,
  ): WebhookConfig | undefined {
    const existing = this.webhooks.get(webhookId);
    if (!existing) return undefined;

    const updated: WebhookConfig = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot be changed
      updatedAt: Date.now(),
    };

    this.webhooks.set(webhookId, updated);

    // Handle batch mode changes
    if (updates.batchMode === true && !this.batchBuffers.has(webhookId)) {
      this.batchBuffers.set(webhookId, []);
    } else if (updates.batchMode === false) {
      // Flush existing batch buffer
      const buffer = this.batchBuffers.get(webhookId);
      if (buffer && buffer.length > 0) {
        this.deliverBatch(webhookId, buffer);
      }
      this.batchBuffers.delete(webhookId);
      const timer = this.batchTimers.get(webhookId);
      if (timer) {
        clearTimeout(timer);
        this.batchTimers.delete(webhookId);
      }
    }

    return updated;
  }

  // ── Event Emission ───────────────────────────────────────────────────────

  /**
   * Emit a webhook event to all matching webhooks.
   *
   * The event is delivered to every webhook that:
   * 1. Is active.
   * 2. Subscribes to the event's type (or subscribes to all events).
   *
   * If a webhook is in batch mode, the event is buffered instead of
   * delivered immediately.
   *
   * @param event - The webhook event to emit.
   */
  async emit(event: WebhookEvent): Promise<void> {
    if (this.destroyed) return;

    for (const [webhookId, config] of this.webhooks) {
      // Check if webhook is active
      if (!config.active) continue;

      // Check if webhook subscribes to this event type
      if (config.events.length > 0 && !config.events.includes(event.type)) continue;

      // Check rate limit
      if (!this.checkRateLimit(webhookId)) continue;

      if (config.batchMode) {
        // Buffer the event
        this.bufferEvent(webhookId, event);
      } else {
        // Deliver immediately
        await this.deliverEvent(webhookId, config, [event]);
      }
    }
  }

  /**
   * Emit multiple events at once.
   *
   * Events are grouped by matching webhook and delivered according to
   * each webhook's batch/individual mode.
   *
   * @param events - The array of webhook events to emit.
   */
  async emitBatch(events: WebhookEvent[]): Promise<void> {
    for (const event of events) {
      await this.emit(event);
    }
  }

  // ── Delivery ─────────────────────────────────────────────────────────────

  /**
   * Deliver events to a single webhook endpoint.
   *
   * Signs the payload with HMAC-SHA256 and posts it via HTTP.
   * On failure, the delivery is retried with exponential backoff.
   *
   * @param webhookId - The webhook configuration ID.
   * @param config - The webhook configuration.
   * @param events - The events to deliver.
   */
  private async deliverEvent(
    webhookId: string,
    config: WebhookConfig,
    events: WebhookEvent[],
  ): Promise<void> {
    const deliveryId = generateId('dlv');
    const now = Date.now();

    // Build payload
    const payloadBody = JSON.stringify({
      deliveryId,
      createdAt: now,
      events,
      tenantId: config.tenantId,
    });

    const signature = await computeHMAC(payloadBody, config.secret);

    const payload: WebhookPayload = {
      deliveryId,
      createdAt: now,
      events,
      signature,
      tenantId: config.tenantId,
    };

    const delivery: WebhookDelivery = {
      id: deliveryId,
      url: config.url,
      payload,
      status: 'pending',
      retryCount: 0,
      maxRetries: config.maxRetries,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };

    await this.attemptDelivery(delivery, config);
  }

  /**
   * Attempt a single webhook delivery with retry logic.
   *
   * @param delivery - The delivery record.
   * @param config - The webhook configuration.
   */
  private async attemptDelivery(
    delivery: WebhookDelivery,
    config: WebhookConfig,
  ): Promise<void> {
    try {
      delivery.status = delivery.retryCount > 0 ? 'retrying' : 'pending';

      const body = JSON.stringify({
        deliveryId: delivery.payload.deliveryId,
        createdAt: delivery.payload.createdAt,
        events: delivery.payload.events,
        tenantId: delivery.payload.tenantId,
      });

      const signature = await computeHMAC(body, config.secret);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-CShield-Signature': signature,
        'X-CShield-Delivery': delivery.id,
        'X-CShield-Event-Count': String(delivery.payload.events.length),
        ...config.headers,
      };

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      delivery.statusCode = response.status;
      delivery.lastAttemptAt = Date.now();

      if (response.ok) {
        delivery.status = 'sent';
        delivery.completedAt = Date.now();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      delivery.error = errorMessage;
      delivery.lastAttemptAt = Date.now();

      // Retry with exponential backoff
      if (delivery.retryCount < delivery.maxRetries) {
        delivery.retryCount++;
        delivery.status = 'retrying';

        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, delivery.retryCount - 1);
        setTimeout(() => {
          if (!this.destroyed) {
            this.attemptDelivery(delivery, config);
          }
        }, delay);
      } else {
        delivery.status = 'failed';
      }
    }

    // Record delivery
    this.recordDelivery(delivery);
  }

  // ── Batch Mode ───────────────────────────────────────────────────────────

  /**
   * Buffer an event for batch delivery.
   *
   * Starts a batch timer if one isn't already running. The timer fires
   * after `config.batchIntervalMs` and delivers all accumulated events.
   * If the buffer reaches `config.maxBatchSize`, the batch is flushed immediately.
   *
   * @param webhookId - The webhook ID.
   * @param event - The event to buffer.
   */
  private bufferEvent(webhookId: string, event: WebhookEvent): void {
    let buffer = this.batchBuffers.get(webhookId);
    if (!buffer) {
      buffer = [];
      this.batchBuffers.set(webhookId, buffer);
    }

    buffer.push(event);

    const config = this.webhooks.get(webhookId);
    if (!config) return;

    // Flush immediately if max batch size reached
    if (buffer.length >= (config.maxBatchSize || MAX_BATCH_SIZE)) {
      this.flushBatch(webhookId);
      return;
    }

    // Start timer if not already running
    if (!this.batchTimers.has(webhookId)) {
      const timer = setTimeout(() => {
        this.flushBatch(webhookId);
      }, config.batchIntervalMs || BATCH_INTERVAL_MS);

      this.batchTimers.set(webhookId, timer);
    }
  }

  /**
   * Flush a batch buffer for a webhook, delivering all accumulated events.
   *
   * @param webhookId - The webhook ID.
   */
  private flushBatch(webhookId: string): void {
    const timer = this.batchTimers.get(webhookId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(webhookId);
    }

    const buffer = this.batchBuffers.get(webhookId);
    if (!buffer || buffer.length === 0) return;

    // Take all events from buffer
    const events = [...buffer];
    buffer.length = 0;

    const config = this.webhooks.get(webhookId);
    if (config && config.active) {
      this.deliverBatch(webhookId, events);
    }
  }

  /**
   * Deliver a batch of events to a webhook.
   *
   * @param webhookId - The webhook ID.
   * @param events - The events to deliver.
   */
  private deliverBatch(webhookId: string, events: WebhookEvent[]): void {
    const config = this.webhooks.get(webhookId);
    if (!config) return;

    // Check rate limit
    if (!this.checkRateLimit(webhookId)) return;

    this.deliverEvent(webhookId, config, events);
  }

  // ── Rate Limiting ────────────────────────────────────────────────────────

  /**
   * Check if a webhook is within its rate limit.
   *
   * Uses a sliding window of 1 minute. If the limit has been reached,
   * the delivery is skipped.
   *
   * @param webhookId - The webhook ID to check.
   * @returns `true` if the delivery is allowed, `false` if rate-limited.
   */
  private checkRateLimit(webhookId: string): boolean {
    let rateLimit = this.rateLimits.get(webhookId);
    if (!rateLimit) {
      rateLimit = {
        windowStart: Date.now(),
        count: 0,
        maxPerMinute: this.maxRatePerMinute,
      };
      this.rateLimits.set(webhookId, rateLimit);
    }

    const now = Date.now();

    // Reset window if it has expired
    if (now - rateLimit.windowStart >= RATE_WINDOW_MS) {
      rateLimit.windowStart = now;
      rateLimit.count = 0;
    }

    if (rateLimit.count >= rateLimit.maxPerMinute) {
      return false; // Rate limited
    }

    rateLimit.count++;
    return true;
  }

  // ── Delivery History ─────────────────────────────────────────────────────

  /**
   * Record a delivery in the history.
   *
   * Maintains a maximum of 1000 recent deliveries.
   *
   * @param delivery - The delivery to record.
   */
  private recordDelivery(delivery: WebhookDelivery): void {
    this.deliveryHistory.push(delivery);

    // Trim to last 1000
    if (this.deliveryHistory.length > 1000) {
      this.deliveryHistory = this.deliveryHistory.slice(-1000);
    }
  }

  /**
   * Get the delivery history.
   *
   * @param limit - Maximum number of deliveries to return. Defaults to `100`.
   * @returns An array of recent webhook deliveries.
   */
  getDeliveryHistory(limit: number = 100): WebhookDelivery[] {
    return this.deliveryHistory.slice(-limit);
  }

  /**
   * Get deliveries for a specific webhook.
   *
   * @param webhookId - The webhook ID to filter by.
   * @param limit - Maximum number of deliveries to return. Defaults to `50`.
   * @returns An array of deliveries for the specified webhook.
   */
  getWebhookDeliveries(webhookId: string, limit: number = 50): WebhookDelivery[] {
    return this.deliveryHistory
      .filter((d) => d.url === this.webhooks.get(webhookId)?.url)
      .slice(-limit);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Destroy the webhook manager and clean up all resources.
   *
   * Clears all batch timers, buffers, and webhook configurations.
   * After destruction, no further events will be processed.
   */
  destroy(): void {
    this.destroyed = true;

    // Clear all batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();
    this.batchBuffers.clear();
    this.webhooks.clear();
    this.rateLimits.clear();
  }

  /**
   * Get statistics about the webhook manager.
   *
   * @returns An object with webhook and delivery statistics.
   */
  getStats(): {
    totalWebhooks: number;
    activeWebhooks: number;
    batchModeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingDeliveries: number;
  } {
    const webhooks = Array.from(this.webhooks.values());
    const total = this.deliveryHistory.length;

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter((w) => w.active).length,
      batchModeWebhooks: webhooks.filter((w) => w.batchMode).length,
      totalDeliveries: total,
      successfulDeliveries: this.deliveryHistory.filter((d) => d.status === 'sent').length,
      failedDeliveries: this.deliveryHistory.filter((d) => d.status === 'failed').length,
      pendingDeliveries: this.deliveryHistory.filter(
        (d) => d.status === 'pending' || d.status === 'retrying',
      ).length,
    };
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────────────

let instance: WebhookManager | undefined;

/**
 * Get the singleton `WebhookManager` instance.
 *
 * The first call creates the manager with the default rate limit of
 * 100 deliveries per minute. Subsequent calls return the same instance.
 *
 * @returns The shared `WebhookManager`.
 */
export function getWebhookManager(): WebhookManager {
  if (!instance) {
    instance = new WebhookManager();
  }
  return instance;
}
