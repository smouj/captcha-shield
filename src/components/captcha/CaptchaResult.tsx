'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface CaptchaResultProps {
  success: boolean;
  riskScore: number;
  message: string;
  signals?: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  onRetry: () => void;
}

export default function CaptchaResult({ success, riskScore, message, signals, onRetry }: CaptchaResultProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={success ? 'success' : 'fail'}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
        className="space-y-5"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              success
                ? 'bg-emerald-500/20 ring-2 ring-emerald-500/50'
                : 'bg-red-500/20 ring-2 ring-red-500/50'
            }`}
          >
            {success ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </motion.div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className={`text-lg font-semibold ${success ? 'text-emerald-400' : 'text-red-400'}`}>
            {success ? '¡Verificación exitosa!' : 'Verificación fallida'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">{message}</p>
        </div>

        {/* Risk Score */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Puntuación de riesgo</span>
            <span className={`text-xs font-mono font-bold ${
              riskScore < 0.3 ? 'text-emerald-400' :
              riskScore < 0.6 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {(riskScore * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${riskScore * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                riskScore < 0.3 ? 'bg-emerald-500' :
                riskScore < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-600">Humano</span>
            <span className="text-[10px] text-gray-600">Bot</span>
          </div>
        </div>

        {/* Behavioral Signals */}
        {signals && signals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Señales de comportamiento
            </h4>
            <div className="space-y-1.5">
              {signals.map((signal, i) => (
                <motion.div
                  key={signal.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3 text-xs"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    signal.score < 0.3 ? 'bg-emerald-500' :
                    signal.score < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 truncate">{signal.name}</span>
                      <span className="text-gray-500 font-mono ml-2">
                        {(signal.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full mt-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${signal.score * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                        className={`h-full rounded-full ${
                          signal.score < 0.3 ? 'bg-emerald-500/60' :
                          signal.score < 0.6 ? 'bg-yellow-500/60' : 'bg-red-500/60'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Retry button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {success ? 'Nuevo CAPTCHA' : 'Intentar de nuevo'}
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
