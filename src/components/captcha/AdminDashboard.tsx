'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BarChart3, Activity, Clock, RefreshCw } from 'lucide-react';

interface Analytics {
  totalSessions: number;
  verifiedSessions: number;
  successRate: number;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  averageRiskScore: number;
  challengeTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    challengeType: string;
    score: number | null;
    createdAt: string;
  }>;
}

const TYPE_LABELS: Record<string, string> = {
  puzzle: '🧩 Rompecabezas',
  image_select: '🖼️ Selección',
  math_visual: '🔢 Matemática',
  pattern_trace: '🔗 Patrón',
};

const TYPE_COLORS: Record<string, string> = {
  puzzle: 'bg-blue-500',
  image_select: 'bg-purple-500',
  math_visual: 'bg-amber-500',
  pattern_trace: 'bg-cyan-500',
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/captcha/analytics');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
      if (!cancelled) setLoading(false);
    };

    fetchAnalytics();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchAnalytics, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    fetch('/api/captcha/analytics')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setAnalytics(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-10 text-gray-500">
        No hay datos disponibles todavía
      </div>
    );
  }

  const maxTypeCount = Math.max(
    ...analytics.challengeTypeDistribution.map(d => d.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<Image src="/logo-icon-white.png" alt="" width={16} height={16} className="w-4 h-4" />}
          label="Total sesiones"
          value={analytics.totalSessions}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Tasa de éxito"
          value={`${analytics.successRate}%`}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Puntuación promedio"
          value={(analytics.averageRiskScore * 100).toFixed(0) + '%'}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Total intentos"
          value={analytics.totalAttempts}
          color="text-purple-400"
          bg="bg-purple-500/10"
        />
      </div>

      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Challenge Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Distribución por tipo
          </h3>
          <div className="space-y-3">
            {analytics.challengeTypeDistribution.length > 0 ? (
              analytics.challengeTypeDistribution.map(d => (
                <div key={d.type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{TYPE_LABELS[d.type] || d.type}</span>
                    <span className="text-gray-500 font-mono">{d.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxTypeCount) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${TYPE_COLORS[d.type] || 'bg-gray-500'}`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-600 text-center py-4">Sin datos</p>
            )}
          </div>
        </motion.div>

        {/* Success/Fail Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Resumen de intentos
          </h3>

          {/* Visual breakdown */}
          <div className="flex items-end gap-4 mb-4 h-32">
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-lg font-bold text-emerald-400">{analytics.successfulAttempts}</span>
              <div className="w-full bg-emerald-500/20 rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max((analytics.successfulAttempts / Math.max(analytics.totalAttempts, 1)) * 100, 10)}%` }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.8 }}
                  className="w-full bg-emerald-500/60 rounded-t-lg absolute bottom-0"
                />
              </div>
              <span className="text-[10px] text-gray-500">Exitosos</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-lg font-bold text-red-400">{analytics.failedAttempts}</span>
              <div className="w-full bg-red-500/20 rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max((analytics.failedAttempts / Math.max(analytics.totalAttempts, 1)) * 100, 10)}%` }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.8 }}
                  className="w-full bg-red-500/60 rounded-t-lg absolute bottom-0"
                />
              </div>
              <span className="text-[10px] text-gray-500">Fallidos</span>
            </div>
          </div>

          {/* Verified sessions */}
          <div className="pt-3 border-t border-gray-700/50">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Sesiones verificadas</span>
              <span className="text-gray-300 font-mono">{analytics.verifiedSessions} / {analytics.totalSessions}</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analytics.successRate}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Logs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Actividad reciente
          </h3>
          <button
            onClick={handleRefresh}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar">
          {analytics.recentLogs.length > 0 ? (
            analytics.recentLogs.map(log => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  log.action === 'success' ? 'bg-emerald-500' :
                  log.action === 'fail' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-300">
                      {TYPE_LABELS[log.challengeType] || log.challengeType}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      log.action === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                      log.action === 'fail' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {log.action === 'success' ? 'OK' : log.action === 'fail' ? 'Fallo' : 'Intento'}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {log.score !== null && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      {(log.score * 100).toFixed(0)}%
                    </span>
                  )}
                  <p className="text-[10px] text-gray-600">
                    {new Date(log.createdAt).toLocaleTimeString('es')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-600 text-center py-4">Sin actividad registrada</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4"
    >
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center ${color} mb-2`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-gray-200">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </motion.div>
  );
}
