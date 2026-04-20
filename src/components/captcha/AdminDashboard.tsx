'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BarChart3, Activity, Clock, RefreshCw, Smartphone, Shield, Fingerprint, Zap } from 'lucide-react';

interface AttemptLog {
  id: string;
  timestamp: number;
  challengeType: string;
  success: boolean;
  riskScore: number;
  riskLevel: string;
}

const TYPE_LABELS: Record<string, string> = {
  puzzle: 'Rompecabezas',
  image_select: 'Selección',
  math_visual: 'Matemática',
  pattern_trace: 'Patrón',
  rotation_3d: '3D Rotación',
  audio: 'Audio',
  timeline_order: 'Cronológico',
  qr_mobile: 'QR Móvil',
};

const TYPE_COLORS: Record<string, string> = {
  puzzle: 'bg-blue-500',
  image_select: 'bg-purple-500',
  math_visual: 'bg-amber-500',
  pattern_trace: 'bg-cyan-500',
  rotation_3d: 'bg-pink-500',
  audio: 'bg-orange-500',
  timeline_order: 'bg-teal-500',
  qr_mobile: 'bg-purple-400',
};

const STORAGE_KEY = 'captcha-shield-logs';

function loadLogs(): AttemptLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLogs(logs: AttemptLog[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch {}
}

export function getAnalytics() {
  const logs = loadLogs();
  const total = logs.length;
  const successful = logs.filter(l => l.success).length;
  const failed = logs.filter(l => !l.success).length;
  const avgRisk = total > 0 ? logs.reduce((sum, l) => sum + l.riskScore, 0) / total : 0;
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

  const typeDist: Record<string, number> = {};
  for (const log of logs) {
    typeDist[log.challengeType] = (typeDist[log.challengeType] || 0) + 1;
  }

  const levelDist = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const log of logs) {
    levelDist[log.riskLevel as keyof typeof levelDist] = (levelDist[log.riskLevel as keyof typeof levelDist] || 0) + 1;
  }

  return { total, successful, failed, avgRisk, successRate, typeDist, levelDist, recentLogs: logs.slice(0, 20) };
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<ReturnType<typeof getAnalytics> | null>(null);

  const refresh = useCallback(() => {
    setAnalytics(getAnalytics());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const maxTypeCount = Math.max(...Object.values(analytics.typeDist), 1);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard icon={<Image src="/captcha-shield/logo-icon-white.png" alt="" width={14} height={14} className="w-3.5 h-3.5" />}
          label="Total" value={analytics.total} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={<Activity className="w-3.5 h-3.5" />}
          label="Tasa éxito" value={`${analytics.successRate}%`} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={<Fingerprint className="w-3.5 h-3.5" />}
          label="Riesgo prom." value={`${(analytics.avgRisk * 100).toFixed(0)}%`} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={<Smartphone className="w-3.5 h-3.5" />}
          label="QR móvil" value={analytics.typeDist['qr_mobile'] || 0} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Type distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-gray-200 mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Distribución por tipo
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.typeDist).length > 0 ? (
              Object.entries(analytics.typeDist).map(([type, count]) => (
                <div key={type} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-300">{TYPE_LABELS[type] || type}</span>
                    <span className="text-gray-500 font-mono">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxTypeCount) * 100}%` }}
                      transition={{ duration: 0.5 }} className={`h-full rounded-full ${TYPE_COLORS[type] || 'bg-gray-500'}`} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-600 text-center py-3">Sin datos</p>
            )}
          </div>
        </motion.div>

        {/* Risk level distribution */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-gray-200 mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Nivel de riesgo
          </h3>
          <div className="space-y-2">
            {[
              { level: 'low', label: 'Bajo', color: 'bg-emerald-500' },
              { level: 'medium', label: 'Medio', color: 'bg-yellow-500' },
              { level: 'high', label: 'Alto', color: 'bg-orange-500' },
              { level: 'critical', label: 'Crítico', color: 'bg-red-500' },
            ].map(item => (
              <div key={item.level} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-12">{item.label}</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: analytics.total > 0 ? `${(analytics.levelDist[item.level as keyof typeof analytics.levelDist] / analytics.total) * 100}%` : '0%' }}
                    transition={{ duration: 0.5 }} className={`h-full rounded-full ${item.color}`} />
                </div>
                <span className="text-[10px] text-gray-500 font-mono w-6 text-right">{analytics.levelDist[item.level as keyof typeof analytics.levelDist]}</span>
              </div>
            ))}
          </div>

          {/* Success/Fail */}
          <div className="flex items-end gap-3 mt-4 pt-3 border-t border-gray-700/50">
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold text-emerald-400">{analytics.successful}</span>
              <div className="w-full h-16 bg-emerald-500/20 rounded-t-lg relative overflow-hidden"
                style={{ height: `${Math.max((analytics.successful / Math.max(analytics.total, 1)) * 60, 8)}px` }}>
                <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="w-full bg-emerald-500/50 rounded-t-lg absolute bottom-0" />
              </div>
              <span className="text-[9px] text-gray-500">OK</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold text-red-400">{analytics.failed}</span>
              <div className="w-full h-16 bg-red-500/20 rounded-t-lg relative overflow-hidden"
                style={{ height: `${Math.max((analytics.failed / Math.max(analytics.total, 1)) * 60, 8)}px` }}>
                <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} className="w-full bg-red-500/50 rounded-t-lg absolute bottom-0" />
              </div>
              <span className="text-[9px] text-gray-500">Fallo</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent logs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Actividad reciente
          </h3>
          <button onClick={refresh} className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5" /> Actualizar
          </button>
        </div>

        {analytics.recentLogs.length > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {analytics.recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-300 flex-1 truncate">{TYPE_LABELS[log.challengeType] || log.challengeType}</span>
                <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${log.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {log.success ? 'OK' : 'Fallo'}
                </span>
                <span className="text-[9px] text-gray-600 font-mono">{(log.riskScore * 100).toFixed(0)}%</span>
                <span className="text-[9px] text-gray-600">{new Date(log.timestamp).toLocaleTimeString('es')}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-600 text-center py-3">Sin actividad. Completa un CAPTCHA para ver datos aquí.</p>
        )}

        {/* Clear data */}
        {analytics.total > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-700/50">
            <button onClick={() => { localStorage.removeItem(STORAGE_KEY); refresh(); }}
              className="text-[9px] text-gray-600 hover:text-red-400 transition-colors">
              Limpiar datos de sesión
            </button>
          </div>
        )}
      </motion.div>

      {/* Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-xs font-semibold text-gray-200">Motor de análisis v3.1</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="text-gray-400">Señales de comportamiento:</div>
          <div className="text-emerald-400 font-mono">14 señales</div>
          <div className="text-gray-400">Tipos de desafío:</div>
          <div className="text-emerald-400 font-mono">7 tipos + QR</div>
          <div className="text-gray-400">Fingerprinting:</div>
          <div className="text-emerald-400 font-mono">WebGL + Canvas</div>
          <div className="text-gray-400">Detección de bots:</div>
          <div className="text-emerald-400 font-mono">Headless + Automation</div>
          <div className="text-gray-400">Almacenamiento:</div>
          <div className="text-gray-400 font-mono">localStorage</div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; bg: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3">
      <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center ${color} mb-1.5`}>{icon}</div>
      <p className="text-base font-bold text-gray-200">{value}</p>
      <p className="text-[9px] text-gray-500">{label}</p>
    </motion.div>
  );
}
