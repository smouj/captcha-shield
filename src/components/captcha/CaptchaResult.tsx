'use client';

import { motion } from 'framer-motion';
import type { RiskAssessment } from '@/lib/behavioral-analyzer';

interface Props {
  success: boolean;
  riskScore: number;
  riskLevel: string;
  message: string;
  signals: RiskAssessment['signals'];
  timeTaken: number;
  onRetry: () => void;
}

const levelColors: Record<string, { text: string; bg: string; bar: string; dot: string }> = {
  low: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', bar: 'bg-yellow-500', dot: 'bg-yellow-500' },
  high: { text: 'text-orange-400', bg: 'bg-orange-500/10', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  critical: { text: 'text-red-400', bg: 'bg-red-500/10', bar: 'bg-red-500', dot: 'bg-red-500' },
};

const categoryLabels: Record<string, string> = {
  movement: 'Movimiento',
  timing: 'Temporización',
  device: 'Dispositivo',
  environment: 'Entorno',
};

export default function CaptchaResult({ success, riskScore, riskLevel, message, signals, timeTaken, onRetry }: Props) {
  const colors = levelColors[riskLevel] || levelColors.medium;
  const timeStr = timeTaken < 1000 ? `${timeTaken}ms` : `${(timeTaken / 1000).toFixed(1)}s`;

  return (
    <div className="space-y-4">
      {/* Icon + Message */}
      <div className="flex justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${success ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50' : 'bg-red-500/20 ring-2 ring-red-500/50'}`}>
          {success ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          )}
        </motion.div>
      </div>

      <div className="text-center">
        <h3 className={`text-base font-semibold ${success ? 'text-emerald-400' : 'text-red-400'}`}>
          {success ? 'Verificación exitosa' : 'Verificación fallida'}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{message}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500">Nivel</p>
          <p className={`text-xs font-bold ${colors.text}`}>{riskLevel.toUpperCase()}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500">Tiempo</p>
          <p className="text-xs font-bold text-gray-300">{timeStr}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 text-center">
          <p className="text-[10px] text-gray-500">Riesgo</p>
          <p className={`text-xs font-bold ${colors.text}`}>{(riskScore * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Risk bar */}
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-gray-400">Puntuación de riesgo</span>
          <span className={`text-xs font-mono font-bold ${colors.text}`}>{(riskScore * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-900 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${riskScore * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${colors.bar}`} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-600">Humano</span>
          <span className="text-[9px] text-gray-600">Bot</span>
        </div>
      </div>

      {/* Signals grouped by category */}
      {signals && signals.length > 0 && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">14 señales de comportamiento</h4>
          {(['movement', 'timing', 'device', 'environment'] as const).map(cat => {
            const catSignals = signals.filter(s => s.category === cat);
            if (catSignals.length === 0) return null;
            return (
              <div key={cat} className="space-y-1">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider pl-1">{categoryLabels[cat]}</p>
                {catSignals.map((signal, i) => {
                  const sc = signal.score < 0.3 ? levelColors.low : signal.score < 0.6 ? levelColors.medium : signal.score < 0.75 ? levelColors.high : levelColors.critical;
                  return (
                    <motion.div key={signal.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }} className="flex items-center gap-2 text-[11px]">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 truncate">{signal.name}</span>
                          <span className="text-gray-500 font-mono ml-1">{(signal.score * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-0.5 bg-gray-800 rounded-full mt-0.5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${signal.score * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.4 + i * 0.04 }}
                            className={`h-full rounded-full ${sc.bar}`} />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onRetry}
          className="px-5 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
          {success ? 'Nuevo CAPTCHA' : 'Intentar de nuevo'}
        </motion.button>
      </div>
    </div>
  );
}
