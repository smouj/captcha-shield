import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySolution } from '@/lib/captcha-engine';
import { analyzeBehavior } from '@/lib/behavioral-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { captchaId, response, behavioralData, sessionId } = body;

    if (!captchaId || !response) {
      return NextResponse.json(
        { error: 'Datos de verificación incompletos' },
        { status: 400 }
      );
    }

    // Find the captcha session
    const captchaSession = await db.captchaSession.findUnique({
      where: { id: captchaId },
      include: { logs: true },
    });

    if (!captchaSession) {
      return NextResponse.json(
        { error: 'Sesión de CAPTCHA no encontrada' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > captchaSession.expiresAt) {
      return NextResponse.json(
        { error: 'CAPTCHA expirado', success: false, riskScore: 1 },
        { status: 400 }
      );
    }

    // Check if already verified
    if (captchaSession.verified) {
      return NextResponse.json(
        { error: 'CAPTCHA ya verificado', success: false, riskScore: 1 },
        { status: 400 }
      );
    }

    // Log the attempt
    await db.captchaLog.create({
      data: {
        sessionId: sessionId || captchaSession.sessionId,
        captchaId: captchaSession.id,
        action: 'attempt',
        behavioralData: JSON.stringify(behavioralData || {}),
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
      },
    });

    // Analyze behavioral data
    let riskScore = 0;
    const riskAssessment = behavioralData
      ? analyzeBehavior(behavioralData)
      : { riskScore: 0.5, isBot: false, signals: [] };

    riskScore = riskAssessment.riskScore;

    // High risk always fails
    if (riskScore > 0.7) {
      await db.captchaLog.create({
        data: {
          sessionId: sessionId || captchaSession.sessionId,
          captchaId: captchaSession.id,
          action: 'fail',
          behavioralData: JSON.stringify({
            ...behavioralData,
            riskSignals: riskAssessment.signals,
          }),
          score: riskScore,
        },
      });

      return NextResponse.json({
        success: false,
        riskScore,
        message: 'Análisis de comportamiento sospechoso. Se detectó un patrón de automatización.',
        signals: riskAssessment.signals,
      });
    }

    // Verify the solution
    const verification = verifySolution(captchaSession.solution, response);

    if (verification.success) {
      // Mark as verified
      await db.captchaSession.update({
        where: { id: captchaSession.id },
        data: {
          verified: true,
          riskScore: Math.max(riskScore, 0.1),
        },
      });

      await db.captchaLog.create({
        data: {
          sessionId: sessionId || captchaSession.sessionId,
          captchaId: captchaSession.id,
          action: 'success',
          behavioralData: JSON.stringify({
            ...behavioralData,
            riskSignals: riskAssessment.signals,
          }),
          score: riskScore,
        },
      });

      return NextResponse.json({
        success: true,
        riskScore,
        message: 'Verificación exitosa',
        signals: riskAssessment.signals,
      });
    } else {
      await db.captchaLog.create({
        data: {
          sessionId: sessionId || captchaSession.sessionId,
          captchaId: captchaSession.id,
          action: 'fail',
          behavioralData: JSON.stringify({
            ...behavioralData,
            riskSignals: riskAssessment.signals,
          }),
          score: riskScore,
        },
      });

      return NextResponse.json({
        success: false,
        riskScore,
        message: verification.message,
        signals: riskAssessment.signals,
      });
    }
  } catch (error) {
    console.error('Error verifying captcha:', error);
    return NextResponse.json(
      { error: 'Error al verificar el CAPTCHA' },
      { status: 500 }
    );
  }
}
