/**
 * CAPTCHA Shield v4.0 "Fortress" — Analytics API Route
 *
 * POST /api/captcha/analytics
 *
 * Returns aggregated analytics data from the in-memory store.
 * Uses POST method to ensure dynamic rendering (required when
 * the project is configured with `output: "export"`).
 *
 * Request Body (optional):
 *   - from  (optional): Unix timestamp (ms) — lower bound for events
 *   - to    (optional): Unix timestamp (ms) — upper bound for events
 *   - limit (optional): Maximum number of recent events to return (default: 50)
 *
 * Response includes:
 *   - Total attempts, success/failure/block counts
 *   - Success rate
 *   - Average risk score
 *   - Challenge type distribution
 *   - Risk level distribution
 *   - Recent events (sorted newest first)
 *   - Active challenge count
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  getAggregatedAnalytics,
  getActiveChallengeCount,
} from '@/lib/captcha-store';

// ─── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse optional filter parameters from request body
  let from: number | undefined;
  let to: number | undefined;
  let limit = 50;

  try {
    const body = await request.json();
    if (typeof body.from === 'number' && body.from > 0) {
      from = body.from;
    }
    if (typeof body.to === 'number' && body.to > 0) {
      to = body.to;
    }
    if (typeof body.limit === 'number' && body.limit > 0 && body.limit <= 500) {
      limit = body.limit;
    }
  } catch {
    // Empty or invalid body — use defaults
  }

  // Also support query parameters as fallback
  const { searchParams } = request.nextUrl;
  const fromParam = searchParams.get('from');
  if (fromParam && from === undefined) {
    const parsed = parseInt(fromParam, 10);
    if (!isNaN(parsed) && parsed > 0) from = parsed;
  }
  const toParam = searchParams.get('to');
  if (toParam && to === undefined) {
    const parsed = parseInt(toParam, 10);
    if (!isNaN(parsed) && parsed > 0) to = parsed;
  }
  const limitParam = searchParams.get('limit');
  if (limitParam && limit === 50) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 500) limit = parsed;
  }

  // Fetch aggregated analytics
  const analytics = getAggregatedAnalytics(from, to, limit);

  // Get active challenge count
  const activeChallenges = getActiveChallengeCount();

  return NextResponse.json({
    success: true,
    data: {
      ...analytics,
      activeChallenges,
      serverTime: Date.now(),
      filterApplied: {
        from: from ?? null,
        to: to ?? null,
        limit,
      },
    },
  });
}
