'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { TimelineOrderChallengeData } from '@/lib/captcha-engine';

interface Props {
  challengeData: TimelineOrderChallengeData;
  onVerify: (response: { order: number[] }) => void;
}

export default function TimelineOrderChallenge({ challengeData, onVerify }: Props) {
  const [userOrder, setUserOrder] = useState<number[]>([]);

  const { events, correctOrder } = challengeData;

  const handleEventClick = useCallback((id: number) => {
    setUserOrder(prev => {
      if (prev.includes(id)) {
        // Deselect last only
        if (prev[prev.length - 1] === id) return prev.slice(0, -1);
        return prev;
      }
      const next = [...prev, id];
      if (next.length === events.length) {
        setTimeout(() => onVerify({ order: next }), 300);
      }
      return next;
    });
  }, [events.length, onVerify]);

  const handleReset = useCallback(() => setUserOrder([]), []);

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-center">
        <p className="text-xs font-medium text-emerald-300">
          Ordena los eventos cronológicamente ({events.length} eventos)
        </p>
        <p className="text-[10px] text-gray-500 mt-1">Haz clic en el orden correcto. El último clic se puede deseleccionar.</p>
      </motion.div>

      <div className="grid gap-2 max-w-[340px] mx-auto">
        {events.map((event) => {
          const orderIdx = userOrder.indexOf(event.id);
          const isSelected = orderIdx !== -1;

          return (
            <motion.button
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEventClick(event.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-md shadow-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}
            >
              {/* Order number */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-500'}`}>
                {isSelected ? orderIdx + 1 : '?'}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isSelected ? 'text-emerald-300' : 'text-gray-300'}`}>
                  {event.title}
                </p>
              </div>

              {/* Date */}
              <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                {event.date}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 max-w-[340px] mx-auto">
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-emerald-500 rounded-full"
            animate={{ width: `${(userOrder.length / events.length) * 100}%` }} transition={{ duration: 0.2 }} />
        </div>
        <span className="text-xs text-gray-500 font-mono">{userOrder.length}/{events.length}</span>
      </div>

      <div className="flex justify-center">
        <button onClick={handleReset} className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
          Reiniciar
        </button>
      </div>
    </div>
  );
}
