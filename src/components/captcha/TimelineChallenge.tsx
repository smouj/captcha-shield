'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowRight, RotateCcw } from 'lucide-react';

interface TimelineEvent {
  id: number;
  title: string;
  date: string;
  description: string;
  year: number;
  month: number;
  day?: number;
}

interface TimelineChallengeProps {
  challengeData: {
    events: TimelineEvent[];
    correctOrder: number[];
    timeLimit: number;
  };
  onVerify: (response: { order: number[] }) => void;
}

export default function TimelineChallenge({ challengeData, onVerify }: TimelineChallengeProps) {
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [showHints, setShowHints] = useState(true);
  const [timeLeft, setTimeLeft] = useState(challengeData.timeLimit / 1000);

  const { events, correctOrder } = challengeData;

  useEffect(() => {
    // Ocultar pistas después de 5 segundos
    const hintTimer = setTimeout(() => setShowHints(false), 5000);
    return () => clearTimeout(hintTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableEvents = events.filter(e => !selectedOrder.includes(e.id));

  const selectEvent = useCallback((eventId: number) => {
    setSelectedOrder(prev => [...prev, eventId]);
  }, []);

  const removeLast = useCallback(() => {
    setSelectedOrder(prev => prev.slice(0, -1));
  }, []);

  const handleReset = useCallback(() => {
    setSelectedOrder([]);
    setShowHints(true);
    setTimeout(() => setShowHints(false), 5000);
  }, []);

  const handleVerify = useCallback(() => {
    if (selectedOrder.length === events.length) {
      onVerify({ order: selectedOrder });
    }
  }, [selectedOrder, events.length, onVerify]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">📅 Orden cronológico</span>
        <span className={`text-xs font-mono font-bold ${timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3"
      >
        <p className="text-sm font-medium text-emerald-300">
          📅 Selecciona los eventos en orden cronológico (del más antiguo al más reciente)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Haz clic en cada evento en el orden correcto
        </p>
      </motion.div>

      {/* Área de selección (timeline) */}
      <div className="bg-gray-800/50 rounded-lg p-3 min-h-[60px] border border-gray-700/50">
        <AnimatePresence mode="popLayout">
          {selectedOrder.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-3">Haz clic en los eventos para ordenarlos cronológicamente</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedOrder.map((eventId, index) => {
                const event = events.find(e => e.id === eventId);
                if (!event) return null;
                return (
                  <motion.div
                    key={`${eventId}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg px-2.5 py-1.5"
                  >
                    <span className="text-[10px] font-bold text-emerald-400 w-4">{index + 1}</span>
                    <span className="text-xs text-emerald-200">{event.title}</span>
                    {index < selectedOrder.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Tarjetas de eventos disponibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
        {availableEvents.map((event) => (
          <motion.button
            key={event.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectEvent(event.id)}
            className="text-left bg-gray-800/80 border border-gray-700 rounded-lg p-3 hover:border-emerald-500/40 hover:bg-gray-800 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate">{event.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{event.description}</p>
              </div>
              {showHints && (
                <span className="text-[10px] font-mono text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded flex-shrink-0">
                  {event.date}
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Barra de progreso */}
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            animate={{ width: `${(selectedOrder.length / events.length) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <span className="text-xs text-gray-500 font-mono">{selectedOrder.length}/{events.length}</span>
      </div>

      {/* Botones */}
      <div className="flex gap-2 justify-center">
        <button onClick={removeLast} disabled={selectedOrder.length === 0} className="px-3 py-2 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-30 transition-colors">
          Deshacer
        </button>
        <button onClick={handleReset} className="px-3 py-2 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1">
          <RotateCcw className="w-3 h-3" /> Reiniciar
        </button>
        <button
          onClick={handleVerify}
          disabled={selectedOrder.length !== events.length}
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-600/25"
        >
          Verificar
        </button>
      </div>
    </div>
  );
}
