/**
 * CAPTCHA Shield v4.0 "Fortress" — Challenge Verification API Route
 *
 * POST /api/captcha/verify
 *
 * Verifies a user's answer to a previously generated challenge.
 * On successful verification (and acceptable risk), a signed JWT token
 * is issued. Challenges are single-use — they are deleted after
 * verification regardless of outcome.
 *
 * Security features:
 *   - Solution verification with configurable tolerance
 *   - Behavioral data analysis for bot detection
 *   - JWT token generation via TokenManager (HMAC-SHA256)
 *   - Single-use challenges (deleted after verification)
 *   - Replay protection (used challenge IDs are tracked)
 *   - Attempt counting and max-attempts enforcement
 *   - Risk-gated token issuance
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  ChallengeType,
  BehavioralData,
  RiskLevel,
  VerificationLayer,
} from '@/lib/types';

import {
  getChallenge,
  incrementAttempts,
  deleteChallenge,
  markChallengeUsed,
  isChallengeUsed,
  recordAnalyticsEvent,
} from '@/lib/captcha-store';

import { getTokenManager } from '@/lib/token-manager';

// ─── Utility ───────────────────────────────────────────────────────────────

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `v_${timestamp}_${random}`;
}

// ─── Solution Verification Logic ───────────────────────────────────────────

/**
 * Verify a user's answer against the stored solution.
 *
 * Tolerance handling varies by challenge type:
 *   - Exact match types (tolerance=0): answer must equal solution exactly
 *   - Numeric tolerance types: answer must be within tolerance range
 *   - Angular types: uses angular difference (wrap-around at 360°)
 *   - Path types: sequence of coordinates must match within tolerance
 */
function verifyAnswer(
  challengeType: ChallengeType,
  userAnswer: unknown,
  solutionAnswer: unknown,
  tolerance: number | undefined,
): boolean {
  const tol = tolerance ?? 0;

  // For exact-match challenge types (tolerance === 0)
  if (tol === 0) {
    switch (challengeType) {
      case ChallengeType.HUMAN_INTUITION_GRID: {
        // Answer: { oddIndex: number, differProperty: string }
        const user = userAnswer as Record<string, unknown> | null;
        const sol = solutionAnswer as Record<string, unknown> | null;
        if (!user || !sol) return false;
        return user.oddIndex === sol.oddIndex;
      }

      case ChallengeType.TEMPORAL_MEMORY: {
        // Answer: string[] (sequence of symbols)
        const user = userAnswer as string[] | null;
        const sol = solutionAnswer as string[] | null;
        if (!Array.isArray(user) || !Array.isArray(sol)) return false;
        if (user.length !== sol.length) return false;
        return user.every((val, idx) => val === sol[idx]);
      }

      case ChallengeType.OPTICAL_ILLUSION_MAZE: {
        // Answer: Array<[number, number]> (path coordinates)
        const user = userAnswer as Array<[number, number]> | null;
        const sol = solutionAnswer as Array<[number, number]> | null;
        if (!Array.isArray(user) || !Array.isArray(sol)) return false;
        if (user.length !== sol.length) return false;
        return user.every(
          (val, idx) => val[0] === sol[idx][0] && val[1] === sol[idx][1],
        );
      }

      case ChallengeType.CONTEXTUAL_REASONING: {
        // Answer: string (option ID)
        return userAnswer === solutionAnswer;
      }

      case ChallengeType.ZERO_KNOWLEDGE_PROOF: {
        // Answer: { targetIndex: number, hash: string }
        const user = userAnswer as Record<string, unknown> | null;
        const sol = solutionAnswer as Record<string, unknown> | null;
        if (!user || !sol) return false;
        return user.targetIndex === sol.targetIndex;
      }

      default:
        // Fallback: deep equality
        return JSON.stringify(userAnswer) === JSON.stringify(solutionAnswer);
    }
  }

  // For tolerance-based challenge types
  switch (challengeType) {
    case ChallengeType.ADVERSARIAL_PUZZLE: {
      // Answer: Array<{ id: number, targetX: number }>
      const user = userAnswer as Array<Record<string, number>> | null;
      const sol = solutionAnswer as Array<Record<string, number>> | null;
      if (!Array.isArray(user) || !Array.isArray(sol)) return false;
      if (user.length !== sol.length) return false;
      return user.every((piece, idx) => {
        const xDiff = Math.abs(piece.targetX - sol[idx].targetX);
        return xDiff <= tol;
      });
    }

    case ChallengeType.PHYSICS_CHAOS: {
      // Answer: number[] (positions)
      const user = userAnswer as number[] | null;
      const sol = solutionAnswer as number[] | null;
      if (!Array.isArray(user) || !Array.isArray(sol)) return false;
      if (user.length !== sol.length) return false;
      return user.every((pos, idx) => {
        const relativeTolerance = sol[idx] * tol;
        return Math.abs(pos - sol[idx]) <= relativeTolerance;
      });
    }

    case ChallengeType.VOICE_RHYTHM: {
      // Answer: { correctBeats: number[], tapTimes: number[] }
      const user = userAnswer as Record<string, unknown> | null;
      const sol = solutionAnswer as Record<string, unknown> | null;
      if (!user || !sol) return false;

      const userBeats = user.correctBeats as number[] | undefined;
      const solBeats = sol.correctBeats as number[] | undefined;
      if (!Array.isArray(userBeats) || !Array.isArray(solBeats)) return false;
      if (userBeats.length !== solBeats.length) return false;

      // Check that the correct beats are tapped
      const beatsMatch = userBeats.every(
        (beat, idx) => beat === solBeats[idx],
      );

      // If tap times are provided, check timing tolerance
      const userTapTimes = user.tapTimes as number[] | undefined;
      const solTapTimes = sol.beatTimes as number[] | undefined;
      if (Array.isArray(userTapTimes) && Array.isArray(solTapTimes)) {
        const timingMatch = userTapTimes.every(
          (time, idx) => idx < solTapTimes.length && Math.abs(time - solTapTimes[idx]) <= tol,
        );
        return beatsMatch && timingMatch;
      }

      return beatsMatch;
    }

    case ChallengeType.GESTURE_SIGNATURE: {
      // Answer: { gestureName: string, path: Array<{x: number, y: number}> }
      const user = userAnswer as Record<string, unknown> | null;
      const sol = solutionAnswer as Record<string, unknown> | null;
      if (!user || !sol) return false;
      if (user.gestureName !== sol.gestureName) return false;

      const userPath = user.path as Array<{ x: number; y: number }> | undefined;
      const solPath = sol.path as Array<{ x: number; y: number }> | undefined;
      if (!Array.isArray(userPath) || !Array.isArray(solPath)) return false;

      // Check that enough path points are within distance tolerance
      const coverageThreshold =
        (sol as Record<string, unknown>).coverageThreshold as number || 0.7;
      let matches = 0;

      for (const solPoint of solPath) {
        const isNear = userPath.some(
          (userPoint) =>
            Math.sqrt(
              (userPoint.x - solPoint.x) ** 2 +
              (userPoint.y - solPoint.y) ** 2,
            ) <= tol,
        );
        if (isNear) matches++;
      }

      return matches / solPath.length >= coverageThreshold;
    }

    case ChallengeType.LIVE_3D_BIOMETRIC: {
      // Answer: { x: number, y: number, z?: number }
      const user = userAnswer as Record<string, number> | null;
      const sol = solutionAnswer as Record<string, number> | null;
      if (!user || !sol) return false;

      // Angular difference with wrap-around
      const angularDiff = (a: number, b: number): number => {
        const diff = Math.abs(a - b) % 360;
        return diff > 180 ? 360 - diff : diff;
      };

      const xDiff = angularDiff(user.x, sol.x);
      const yDiff = angularDiff(user.y, sol.y);
      const zDiff = user.z !== undefined && sol.z !== undefined
        ? angularDiff(user.z, sol.z)
        : 0;

      return xDiff <= tol && yDiff <= tol && zDiff <= tol;
    }

    default:
      // Fallback: deep equality for unknown types
      return JSON.stringify(userAnswer) === JSON.stringify(solutionAnswer);
  }
}

// ─── Risk Assessment from Behavioral Data ──────────────────────────────────

function assessBehavioralRisk(behavioralData: BehavioralData | undefined): {
  riskScore: number;
  riskLevel: RiskLevel;
  reason?: string;
} {
  if (!behavioralData) {
    // No behavioral data provided — assume moderate risk
    return { riskScore: 0.5, riskLevel: RiskLevel.MEDIUM, reason: 'no_behavioral_data' };
  }

  const compositeRisk = behavioralData.compositeRiskScore;

  if (compositeRisk >= 0.85) {
    return { riskScore: compositeRisk, riskLevel: RiskLevel.CRITICAL, reason: 'critical_risk_behavior' };
  }
  if (compositeRisk >= 0.5) {
    return { riskScore: compositeRisk, riskLevel: RiskLevel.HIGH, reason: 'high_risk_behavior' };
  }
  if (compositeRisk >= 0.25) {
    return { riskScore: compositeRisk, riskLevel: RiskLevel.MEDIUM };
  }
  return { riskScore: compositeRisk, riskLevel: RiskLevel.LOW };
}

// ─── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse request body
  let body: {
    challengeId: string;
    answer: unknown;
    behavioralData?: BehavioralData;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, reason: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // Validate required fields
  if (!body.challengeId || typeof body.challengeId !== 'string') {
    return NextResponse.json(
      { success: false, reason: 'challengeId is required and must be a string' },
      { status: 400 },
    );
  }

  if (body.answer === undefined || body.answer === null) {
    return NextResponse.json(
      { success: false, reason: 'answer is required' },
      { status: 400 },
    );
  }

  const { challengeId, answer, behavioralData } = body;

  // ── Replay Protection ─────────────────────────────────────────────────
  if (isChallengeUsed(challengeId)) {
    recordAnalyticsEvent({
      id: generateId(),
      type: 'block',
      timestamp: Date.now(),
      sessionId: '',
      metadata: { reason: 'replay_attack', challengeId },
    });

    return NextResponse.json(
      { success: false, reason: 'Challenge has already been used (replay detected)' },
      { status: 403 },
    );
  }

  // ── Challenge Lookup ──────────────────────────────────────────────────
  const challenge = getChallenge(challengeId);

  if (!challenge) {
    return NextResponse.json(
      { success: false, reason: 'Challenge not found or expired' },
      { status: 404 },
    );
  }

  // ── Expiration Check ──────────────────────────────────────────────────
  const now = Date.now();
  if (now >= challenge.expiresAt) {
    // Clean up expired challenge
    deleteChallenge(challengeId);
    markChallengeUsed(challengeId);

    return NextResponse.json(
      { success: false, reason: 'Challenge has expired' },
      { status: 410 },
    );
  }

  // ── Attempt Limit ─────────────────────────────────────────────────────
  const withinLimits = incrementAttempts(challengeId);
  if (!withinLimits) {
    deleteChallenge(challengeId);
    markChallengeUsed(challengeId);

    recordAnalyticsEvent({
      id: generateId(),
      type: 'failure',
      timestamp: now,
      challengeType: challenge.type,
      riskScore: challenge.riskScore,
      sessionId: challenge.sessionId,
      metadata: { reason: 'max_attempts_exceeded', attempts: challenge.attempts },
    });

    return NextResponse.json(
      { success: false, reason: `Maximum attempts (${challenge.maxAttempts}) exceeded` },
      { status: 429 },
    );
  }

  // ── Solution Verification ─────────────────────────────────────────────
  const isCorrect = verifyAnswer(
    challenge.type,
    answer,
    challenge.solution.answer,
    challenge.solution.tolerance,
  );

  // ── Single-Use: Delete challenge after verification ───────────────────
  deleteChallenge(challengeId);
  markChallengeUsed(challengeId);

  // ── Behavioral Risk Assessment ────────────────────────────────────────
  const behavioralRisk = assessBehavioralRisk(behavioralData);

  // Combine challenge risk and behavioral risk
  const combinedRisk = Math.max(
    challenge.riskScore,
    behavioralRisk.riskScore,
  );

  if (!isCorrect) {
    // Record failure event
    recordAnalyticsEvent({
      id: generateId(),
      type: 'failure',
      timestamp: now,
      challengeType: challenge.type,
      riskScore: combinedRisk,
      riskLevel: behavioralRisk.riskLevel,
      sessionId: challenge.sessionId,
      deviceFingerprint: behavioralData?.deviceFingerprint,
      duration: behavioralData?.duration,
      metadata: {
        reason: 'incorrect_answer',
        attemptNumber: challenge.attempts,
      },
    });

    return NextResponse.json({
      success: false,
      reason: 'Incorrect answer',
      attemptsRemaining: challenge.maxAttempts - challenge.attempts,
    });
  }

  // ── Answer is correct — check risk before issuing token ───────────────

  if (behavioralRisk.riskLevel === RiskLevel.CRITICAL) {
    recordAnalyticsEvent({
      id: generateId(),
      type: 'block',
      timestamp: now,
      challengeType: challenge.type,
      riskScore: combinedRisk,
      riskLevel: RiskLevel.CRITICAL,
      sessionId: challenge.sessionId,
      deviceFingerprint: behavioralData?.deviceFingerprint,
      duration: behavioralData?.duration,
      metadata: { reason: 'critical_risk_block', behavioralReason: behavioralRisk.reason },
    });

    return NextResponse.json({
      success: false,
      reason: 'Answer correct but risk assessment blocked token issuance. Please retry with a new challenge.',
    });
  }

  // ── Issue JWT Token ──────────────────────────────────────────────────
  try {
    const tokenManager = getTokenManager();

    const verificationLayers: VerificationLayer[] = [
      VerificationLayer.BEHAVIORAL_PRECHECK,
      VerificationLayer.DYNAMIC_CHALLENGE,
    ];

    // If risk was low, add cryptographic token layer
    if (combinedRisk < 0.25) {
      verificationLayers.push(VerificationLayer.CRYPTOGRAPHIC_TOKEN);
    }

    const token = await tokenManager.generateToken({
      sub: challenge.sessionId || tokenManager.generateSessionId(),
      challenge: challenge.type,
      risk: combinedRisk,
      verified: verificationLayers,
      fp: behavioralData?.deviceFingerprint || '',
    });

    const expiresAt = token.payload.exp;
    const tokenString = tokenManager.encodeToken(token);

    // Record success event
    recordAnalyticsEvent({
      id: generateId(),
      type: 'success',
      timestamp: now,
      challengeType: challenge.type,
      riskScore: combinedRisk,
      riskLevel: behavioralRisk.riskLevel,
      sessionId: challenge.sessionId,
      deviceFingerprint: behavioralData?.deviceFingerprint,
      duration: behavioralData?.duration,
      verificationLayers,
      metadata: { tokenIssued: true },
    });

    // Record token issued event
    recordAnalyticsEvent({
      id: generateId(),
      type: 'token_issued',
      timestamp: now,
      challengeType: challenge.type,
      riskScore: combinedRisk,
      riskLevel: behavioralRisk.riskLevel,
      sessionId: challenge.sessionId,
      verificationLayers,
    });

    return NextResponse.json({
      success: true,
      token: tokenString,
      expiresAt,
      riskScore: combinedRisk,
    });
  } catch (error) {
    // Token generation failed — this is a server error
    console.error('[CAPTCHA Shield] Token generation failed:', error);

    recordAnalyticsEvent({
      id: generateId(),
      type: 'failure',
      timestamp: now,
      challengeType: challenge.type,
      riskScore: combinedRisk,
      sessionId: challenge.sessionId,
      metadata: { reason: 'token_generation_error' },
    });

    return NextResponse.json(
      { success: false, reason: 'Token generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
