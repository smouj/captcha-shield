import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateRandomChallenge } from '@/lib/captcha-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Se requiere un ID de sesión' },
        { status: 400 }
      );
    }

    // Generate a random challenge
    const { challenge, solution } = generateRandomChallenge();

    // Create session in database
    const captchaSession = await db.captchaSession.create({
      data: {
        sessionId,
        challengeType: challenge.type,
        challengeData: JSON.stringify(challenge),
        solution: JSON.stringify(solution),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    // Return challenge data (without solution!)
    return NextResponse.json({
      id: captchaSession.id,
      sessionId: captchaSession.sessionId,
      challengeType: captchaSession.challengeType,
      challengeData: challenge,
      createdAt: captchaSession.createdAt,
      expiresAt: captchaSession.expiresAt,
    });
  } catch (error) {
    console.error('Error generating captcha:', error);
    return NextResponse.json(
      { error: 'Error al generar el CAPTCHA' },
      { status: 500 }
    );
  }
}
