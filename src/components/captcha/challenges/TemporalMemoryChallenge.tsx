'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Brain, RotateCcw } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

type Phase = 'ready' | 'showing' | 'input' | 'success' | 'failed';

export default function TemporalMemoryChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('ready');
  const activeIdxRef = useRef<number | null>(null);
  const [canvasTick, setCanvasTick] = useState(0);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 60);
  const solvedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sequence = useMemo<number[]>(
    () => (instance.payload.sequence as number[]) ?? [0, 3, 5, 2, 4, 1],
    [instance.payload.sequence],
  );
  const circleCount = (instance.payload.circleCount as number) ?? 9;
  const showDuration = (instance.payload.showDuration as number) ?? 1800;
  const gridSize = (instance.payload.gridSize as number) ?? 3;

  const canvasSize = 340;
  const padding = 30;
  const gap = 15;
  const circleR = Math.max(
    10,
    (canvasSize - padding * 2 - gap * (gridSize - 1)) / (gridSize * 2),
  );
  const cellSize = circleR * 2 + gap;

  // Circle positions
  const circlePositions = useMemo(
    () =>
      Array.from({ length: circleCount }, (_, i) => {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const totalW = gridSize * cellSize - gap;
        const offsetX = (canvasSize - totalW) / 2;
        return {
          cx: offsetX + col * cellSize + circleR,
          cy: padding + row * cellSize + circleR,
        };
      }),
    [circleCount, gridSize, cellSize, gap, circleR, canvasSize, padding],
  );

  // Start showing sequence
  const startChallenge = useCallback(() => {
    setPhase('showing');
    setUserSequence([]);
    activeIdxRef.current = null;

    // Animate the sequence using setTimeout chain
    const stepDuration = showDuration / sequence.length;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < sequence.length; i++) {
      const showTimeout = setTimeout(() => {
        activeIdxRef.current = sequence[i];
        setCanvasTick(t => t + 1);
      }, i * stepDuration);

      const hideTimeout = setTimeout(() => {
        activeIdxRef.current = null;
        setCanvasTick(t => t + 1);
      }, (i + 0.7) * stepDuration);

      timeouts.push(showTimeout, hideTimeout);
    }

    // Transition to input phase
    const endTimeout = setTimeout(() => {
      activeIdxRef.current = null;
      setPhase('input');
    }, sequence.length * stepDuration + 400);
    timeouts.push(endTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [sequence, showDuration]);

  // Global timer (only during input phase)
  useEffect(() => {
    if (phase === 'success' || phase === 'failed') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (phase !== 'input') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!solvedRef.current) {
            setPhase('failed');
            onFail('Time ran out');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, onFail]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const activeIdx = activeIdxRef.current;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f5';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw circles
    for (let i = 0; i < circleCount; i++) {
      const { cx, cy } = circlePositions[i];
      const isActive = activeIdx === i;
      const isUserSelected = userSequence.includes(i);
      const isHovered = hoveredIdx === i;
      const userOrder = userSequence.indexOf(i);

      // Glow effect for active
      if (isActive) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 20;
      }

      // Circle fill
      const baseColor = isDark ? '#2a2a4e' : '#d8d8e8';
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
      ctx.fillStyle = isActive
        ? '#10b981'
        : isUserSelected
          ? 'rgba(16,185,129,0.3)'
          : isHovered && phase === 'input'
            ? isDark ? '#3a3a5e' : '#c8c8d8'
            : baseColor;
      ctx.fill();

      // Border
      ctx.strokeStyle = isActive
        ? '#10b981'
        : isUserSelected
          ? '#10b981'
          : isHovered && phase === 'input'
            ? isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
            : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = isActive ? 3 : isUserSelected ? 2 : 1.5;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Sequence number for user selection
      if (isUserSelected && userOrder >= 0) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${userOrder + 1}`, cx, cy);
      }

      // Index number (subtle) in input phase
      if (!isUserSelected && phase === 'input') {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i + 1}`, cx, cy);
      }

      // Active number during showing phase
      if (isActive) {
        const seqOrder = sequence.indexOf(i);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${seqOrder + 1}`, cx, cy);
      }
    }
  }, [phase, canvasTick, userSequence, hoveredIdx, theme, circleCount, circlePositions, circleR, canvasSize, sequence]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== 'input') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasSize / rect.width;
      const sy = canvasSize / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      for (let i = 0; i < circleCount; i++) {
        const { cx, cy } = circlePositions[i];
        const dist = Math.hypot(mx - cx, my - cy);
        if (dist < circleR + 5) {
          if (userSequence.includes(i)) return;

          const newSeq = [...userSequence, i];
          setUserSequence(newSeq);

          // Check if sequence matches
          if (newSeq.length === sequence.length) {
            const isCorrect = newSeq.every((val, idx) => val === sequence[idx]);
            if (isCorrect && !solvedRef.current) {
              solvedRef.current = true;
              setPhase('success');
              onSolve({
                type: ChallengeType.TEMPORAL_MEMORY,
                answer: newSeq,
                metadata: { length: newSeq.length },
              });
            } else {
              setPhase('failed');
              onFail('Incorrect sequence');
            }
          }
          return;
        }
      }
    },
    [phase, userSequence, sequence, circleCount, circlePositions, circleR, canvasSize, onSolve, onFail],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== 'input') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasSize / rect.width;
      const sy = canvasSize / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      let found: number | null = null;
      for (let i = 0; i < circleCount; i++) {
        const { cx, cy } = circlePositions[i];
        if (Math.hypot(mx - cx, my - cy) < circleR + 5) {
          found = i;
          break;
        }
      }
      setHoveredIdx(found);
    },
    [phase, circleCount, circlePositions, circleR, canvasSize],
  );

  const handleReset = useCallback(() => {
    setUserSequence([]);
    setPhase('ready');
    setTimeLeft(timeLimit ?? 60);
    activeIdxRef.current = null;
  }, [timeLimit]);

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 60) - timeLeft) / (timeLimit ?? 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Temporal Memory</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`text-xs font-mono ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Instructions */}
      <AnimatePresence mode="wait">
        {phase === 'ready' && (
          <motion.p
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Watch the sequence of circles light up, then repeat it in order.
          </motion.p>
        )}
        {phase === 'showing' && (
          <motion.p
            key="showing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs mb-3 text-amber-400 font-medium"
          >
            Watch carefully... Memorize the order!
          </motion.p>
        )}
        {phase === 'input' && (
          <motion.p
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            Now click the circles in the same order ({userSequence.length}/{sequence.length})
          </motion.p>
        )}
      </AnimatePresence>

      {/* Timer bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <motion.div
          className={`h-full rounded-full ${phase === 'showing' ? 'bg-amber-500' : 'bg-emerald-500'}`}
          animate={{ width: `${(1 - timerPercent) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className={`w-full max-w-[340px] rounded-lg border-2 ${phase === 'input' ? 'cursor-pointer' : 'cursor-default'} ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-3">
        {phase === 'ready' ? (
          <button
            onClick={startChallenge}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
        {phase === 'input' && (
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {userSequence.length}/{sequence.length}
          </span>
        )}
      </div>

      {/* Result overlays */}
      <AnimatePresence>
        {phase === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Correct!</span>
          </motion.div>
        )}
        {phase === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Wrong order!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
