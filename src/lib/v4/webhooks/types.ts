/**
 * CAPTCHA Shield v4.0 "Fortress" — Webhook Notification Types
 *
 * Type definitions for the webhook notification system. Webhooks allow
 * external services to receive real-time notifications about CAPTCHA
 * verification events such as successes, failures, and token issuances.
 */

import { ChallengeType, RiskLevel } from '@/lib/types';

// ─── Webhook Event Types ───────────────────────────────────────────────────────

/**
 * Events that can trigger a webhook notification.
 *
 * Each event type maps to a specific stage in the CAPTCHA verification flow:
 * - `verification.success` — User passed all challenges and received a token.
 * - `verification.failure` — User failed a challenge or exceeded max attempts.
 * - `verification.blocked` — User was blocked due to critical risk score.
 * - `challenge.shown` — A challenge was presented to the user.
 * - `token.issued` — A cryptographic verification token was generated.
 */
export type WebhookEventType =
  | 'verification.success'
  | 'verification.failure'
  | 'verification.blocked'
  | 'challenge.shown'
  | 'token.issued';

// ─── Webhook Event ─────────────────────────────────────────────────────────────

/**
 * A single webhook event to be delivered.
 *
 * Contains all relevant information about the event including the event type,
 * timestamp, and contextual data such as challenge type, risk score, and
 * session identifiers.
 */
export interface WebhookEvent {
  /** Unique event identifier. */
  id: string;

  /** The type of event that occurred. */
  type: WebhookEventType;

  /** Unix timestamp (ms) when the event occurred. */
  timestamp: number;

  /** The tenant ID associated with this event, if applicable. */
  tenantId?: string;

  /** The session ID of the verification attempt. */
  sessionId: string;

  /** The type of challenge involved, if applicable. */
  challengeType?: ChallengeType;

  /** The risk score at the time of the event (0–1). */
  riskScore?: number;

  /** The risk level at the time of the event. */
  riskLevel?: RiskLevel;

  /** Duration of the verification attempt in milliseconds. */
  duration?: number;

  /** Device fingerprint hash. */
  deviceFingerprint?: string;

  /** Additional metadata for the event. */
  metadata?: Record<string, unknown>;
}

// ─── Webhook Payload ───────────────────────────────────────────────────────────

/**
 * The payload delivered to a webhook endpoint via HTTP POST.
 *
 * The payload includes the event data, a unique delivery ID for idempotency,
 * and an HMAC-SHA256 signature for authenticity verification.
 */
export interface WebhookPayload {
  /** Unique delivery identifier for idempotency tracking. */
  deliveryId: string;

  /** Timestamp when the payload was created (ms since epoch). */
  createdAt: number;

  /** The event(s) included in this delivery. */
  events: WebhookEvent[];

  /** HMAC-SHA256 signature of the payload body for authenticity. */
  signature: string;

  /** The API key / tenant that owns this webhook. */
  tenantId?: string;
}

// ─── Webhook Delivery ──────────────────────────────────────────────────────────

/**
 * Record of a webhook delivery attempt.
 *
 * Tracks the status, timing, and result of each delivery, including retries
 * for failed attempts.
 */
export interface WebhookDelivery {
  /** Unique delivery identifier. */
  id: string;

  /** The webhook URL the delivery was sent to. */
  url: string;

  /** The payload that was sent. */
  payload: WebhookPayload;

  /** Current delivery status. */
  status: 'pending' | 'sent' | 'failed' | 'retrying';

  /** HTTP response status code (if available). */
  statusCode?: number;

  /** Error message (if the delivery failed). */
  error?: string;

  /** Number of retry attempts made so far. */
  retryCount: number;

  /** Maximum number of retries allowed. */
  maxRetries: number;

  /** Timestamp of the first delivery attempt (ms). */
  firstAttemptAt: number;

  /** Timestamp of the last delivery attempt (ms). */
  lastAttemptAt: number;

  /** Timestamp when the delivery was successfully completed (ms). */
  completedAt?: number;
}

// ─── Webhook Config ────────────────────────────────────────────────────────────

/**
 * Configuration for a single webhook endpoint.
 *
 * Each webhook can be configured to listen for specific events and
 * includes settings for retry behavior and rate limiting.
 */
export interface WebhookConfig {
  /** Unique webhook configuration identifier. */
  id: string;

  /** The URL to deliver webhook events to (must be HTTPS in production). */
  url: string;

  /** The events this webhook should listen for. If empty, all events are sent. */
  events: WebhookEventType[];

  /** HMAC-SHA256 secret key for signing payloads. */
  secret: string;

  /** Whether this webhook is currently active. Defaults to `true`. */
  active: boolean;

  /** Maximum number of retry attempts for failed deliveries. Defaults to `3`. */
  maxRetries: number;

  /** Whether to use batch mode (accumulate events and send in batches). */
  batchMode: boolean;

  /** Batch interval in milliseconds (only applies if `batchMode` is `true`). Defaults to `5000`. */
  batchIntervalMs: number;

  /** Maximum events per batch. Defaults to `50`. */
  maxBatchSize: number;

  /** Custom HTTP headers to include in the delivery request. */
  headers?: Record<string, string>;

  /** The tenant ID that owns this webhook. */
  tenantId?: string;

  /** Timestamp when this configuration was created. */
  createdAt: number;

  /** Timestamp when this configuration was last updated. */
  updatedAt: number;
}

// ─── Webhook Rate Limit ────────────────────────────────────────────────────────

/**
 * Internal rate-limiting state for webhook deliveries.
 */
export interface WebhookRateLimit {
  /** The window start timestamp (ms). */
  windowStart: number;

  /** Number of deliveries in the current window. */
  count: number;

  /** Maximum deliveries allowed per window. */
  maxPerMinute: number;
}
