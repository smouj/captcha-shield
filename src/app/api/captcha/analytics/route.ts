import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Total sessions
    const totalSessions = await db.captchaSession.count();

    // Verified sessions
    const verifiedSessions = await db.captchaSession.count({
      where: { verified: true },
    });

    // Total logs
    const totalLogs = await db.captchaLog.count();

    // Success logs
    const successLogs = await db.captchaLog.count({
      where: { action: 'success' },
    });

    // Fail logs
    const failLogs = await db.captchaLog.count({
      where: { action: 'fail' },
    });

    // Average risk score
    const avgRiskResult = await db.captchaLog.aggregate({
      _avg: { score: true },
      where: { score: { not: null } },
    });

    // Challenge type distribution
    const typeDistribution = await db.captchaSession.groupBy({
      by: ['challengeType'],
      _count: { id: true },
    });

    // Recent logs (last 20)
    const recentLogs = await db.captchaLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        captcha: {
          select: { challengeType: true },
        },
      },
    });

    // Average time to solve (successful ones)
    const successfulSessions = await db.captchaSession.findMany({
      where: { verified: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      totalSessions,
      verifiedSessions,
      successRate: totalSessions > 0 ? Math.round((verifiedSessions / totalSessions) * 100) : 0,
      totalAttempts: totalLogs,
      successfulAttempts: successLogs,
      failedAttempts: failLogs,
      averageRiskScore: avgRiskResult._avg.score ? Math.round(avgRiskResult._avg.score * 100) / 100 : 0,
      challengeTypeDistribution: typeDistribution.map(t => ({
        type: t.challengeType,
        count: t._count.id,
      })),
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        action: log.action,
        challengeType: log.captcha.challengeType,
        score: log.score,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Error al obtener las analíticas' },
      { status: 500 }
    );
  }
}
