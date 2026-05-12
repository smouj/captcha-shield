/**
 * CAPTCHA Shield v4.0 "Fortress" — Server-Side In-Memory Store
 *
 * Shared state for challenge storage, rate limiting, replay protection,
 * and analytics. Designed for demo / single-instance deployment.
 * Production deployments should replace this with Redis or a database.
 *
 * @module captcha-store
 */

import {
  ChallengeType,
  ChallengeDifficulty,
  ChallengeSolution,
  AnalyticsEvent,
} from './types';

// ─── Stored Challenge ──────────────────────────────────────────────────────

export interface StoredChallenge {
  id: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
  expiresAt: number;
  maxAttempts: number;
  attempts: number;
  createdAt: number;
  sessionId: string;
  riskScore: number;
  clientIp: string;
}

// ─── Rate Limit Entry ──────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ─── In-Memory State ───────────────────────────────────────────────────────

const challenges = new Map<string, StoredChallenge>();
const usedChallengeIds = new Set<string>();
const rateLimits = new Map<string, RateLimitEntry>();
const analyticsEvents: AnalyticsEvent[] = [];

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_ANALYTICS_EVENTS = 10_000;

// ─── Challenge Operations ──────────────────────────────────────────────────

export function storeChallenge(challenge: StoredChallenge): void {
  challenges.set(challenge.id, challenge);
}

export function getChallenge(id: string): StoredChallenge | undefined {
  return challenges.get(id);
}

export function incrementAttempts(id: string): boolean {
  const challenge = challenges.get(id);
  if (!challenge) return false;
  challenge.attempts += 1;
  return challenge.attempts <= challenge.maxAttempts;
}

export function deleteChallenge(id: string): boolean {
  return challenges.delete(id);
}

export function markChallengeUsed(id: string): void {
  usedChallengeIds.add(id);
}

export function isChallengeUsed(id: string): boolean {
  return usedChallengeIds.has(id);
}

// ─── Rate Limiting ─────────────────────────────────────────────────────────

/**
 * Check if an IP is within rate limits.
 * Returns `true` if the request is ALLOWED (within limits).
 * Returns `false` if the request should be REJECTED.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let entry = rateLimits.get(ip);

  // Reset window if expired or no entry
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(ip, entry);
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limited
  }

  return true; // Within limits
}

export function getRateLimitRemaining(ip: string): number {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now >= entry.resetAt) {
    return RATE_LIMIT_MAX_REQUESTS;
  }
  return Math.max(0, RATE_LIMIT_MAX_REQUESTS - entry.count);
}

// ─── Analytics ─────────────────────────────────────────────────────────────

export function recordAnalyticsEvent(event: AnalyticsEvent): void {
  analyticsEvents.push(event);

  // Trim old events to prevent unbounded memory growth
  if (analyticsEvents.length > MAX_ANALYTICS_EVENTS) {
    analyticsEvents.splice(0, analyticsEvents.length - MAX_ANALYTICS_EVENTS);
  }
}

export function getAnalyticsEvents(
  from?: number,
  to?: number,
  limit?: number,
): AnalyticsEvent[] {
  let filtered = analyticsEvents;

  if (from) {
    filtered = filtered.filter((e) => e.timestamp >= from);
  }
  if (to) {
    filtered = filtered.filter((e) => e.timestamp <= to);
  }

  // Sort newest first
  filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);

  if (limit && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

export interface AggregatedAnalytics {
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  blockCount: number;
  successRate: number;
  avgRiskScore: number;
  challengeTypeDistribution: Record<string, number>;
  riskLevelDistribution: Record<string, number>;
  recentEvents: AnalyticsEvent[];
}

export function getAggregatedAnalytics(
  from?: number,
  to?: number,
  limit?: number,
): AggregatedAnalytics {
  const events = getAnalyticsEvents(from, to, limit);

  let totalAttempts = 0;
  let successCount = 0;
  let failureCount = 0;
  let blockCount = 0;
  let riskScoreSum = 0;
  let riskScoreCount = 0;
  const challengeTypeDist: Record<string, number> = {};
  const riskLevelDist: Record<string, number> = {};

  // Use all events (not filtered) for accurate totals
  const allEvents = getAnalyticsEvents(from, to);

  for (const event of allEvents) {
    switch (event.type) {
      case 'attempt':
        totalAttempts++;
        break;
      case 'success':
        successCount++;
        totalAttempts++;
        break;
      case 'failure':
        failureCount++;
        totalAttempts++;
        break;
      case 'block':
        blockCount++;
        break;
    }

    if (event.riskScore !== undefined) {
      riskScoreSum += event.riskScore;
      riskScoreCount++;
    }

    if (event.challengeType) {
      challengeTypeDist[event.challengeType] =
        (challengeTypeDist[event.challengeType] || 0) + 1;
    }

    if (event.riskLevel) {
      riskLevelDist[event.riskLevel] =
        (riskLevelDist[event.riskLevel] || 0) + 1;
    }
  }

  return {
    totalAttempts,
    successCount,
    failureCount,
    blockCount,
    successRate: totalAttempts > 0 ? successCount / totalAttempts : 0,
    avgRiskScore: riskScoreCount > 0 ? riskScoreSum / riskScoreCount : 0,
    challengeTypeDistribution: challengeTypeDist,
    riskLevelDistribution: riskLevelDist,
    recentEvents: events.slice(0, 50),
  };
}

// ─── Cleanup ───────────────────────────────────────────────────────────────

/**
 * Remove expired challenges and old rate limit entries.
 * Should be called periodically (e.g., on each generate request).
 */
export function cleanupExpired(): void {
  const now = Date.now();

  // Remove expired challenges
  for (const [id, challenge] of challenges) {
    if (now >= challenge.expiresAt) {
      challenges.delete(id);
    }
  }

  // Remove expired rate limit entries
  for (const [ip, entry] of rateLimits) {
    if (now >= entry.resetAt) {
      rateLimits.delete(ip);
    }
  }

  // Prune old used IDs (keep last hour)
  // This is a simple approach; production would use TTL-based storage
  if (usedChallengeIds.size > 100_000) {
    // Clear old entries aggressively if set grows too large
    usedChallengeIds.clear();
  }
}

// ─── Active Challenge Count ────────────────────────────────────────────────

export function getActiveChallengeCount(): number {
  return challenges.size;
}
