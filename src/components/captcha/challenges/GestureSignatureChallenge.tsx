'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Pen, RotateCcw, Check } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

interface PathPoint {
  x: number;
  y: number;
}

type DrawPhase = 'idle' | 'drawing' | 'submitted';

export default function GestureSignatureChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<DrawPhase>('idle');
  const [userPath, setUserPath] = useState<PathPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 45);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const solvedRef = useRef(false);
  const pathRef = useRef<PathPoint[]>([]);
  const timestampsRef = useRef<number[]>([]);

  const referencePath = useMemo<PathPoint[]>(
    () => (instance.payload.referencePath as PathPoint[]) ?? [],
    [instance.payload.referencePath],
  );
  const tolerance = (instance.payload.tolerance as number) ?? 30;
  const shapeType = (instance.payload.shapeType as string) ?? 'wave';

  const canvasW = 380;
  const canvasH = 280;

  // Timer
  useEffect(() => {
    if (solved || failed) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!solvedRef.current) {
            setFailed(true);
            onFail('Time ran out');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [solved, failed, onFail]);

  // Resample reference path to canvas
  const scaledReference = useMemo(() => {
    if (referencePath.length === 0) return [];
    const xs = referencePath.map(p => p.x);
    const ys = referencePath.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 40;

    return referencePath.map(p => ({
      x: pad + ((p.x - minX) / rangeX) * (canvasW - pad * 2),
      y: pad + ((p.y - minY) / rangeY) * (canvasH - pad * 2),
    }));
  }, [referencePath]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f8f8fc';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Grid dots
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    for (let x = 20; x < canvasW; x += 20) {
      for (let y = 20; y < canvasH; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw reference path
    if (scaledReference.length > 1) {
      // Filled area (tolerance zone)
      ctx.strokeStyle = isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)';
      ctx.lineWidth = tolerance * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(scaledReference[0].x, scaledReference[0].y);
      for (let i = 1; i < scaledReference.length; i++) {
        ctx.lineTo(scaledReference[i].x, scaledReference[i].y);
      }
      ctx.stroke();

      // Reference path line
      ctx.strokeStyle = isDark ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.4)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(scaledReference[0].x, scaledReference[0].y);
      for (let i = 1; i < scaledReference.length; i++) {
        ctx.lineTo(scaledReference[i].x, scaledReference[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Start marker
      ctx.beginPath();
      ctx.arc(scaledReference[0].x, scaledReference[0].y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.fillStyle = isDark ? '#1a1a2e' : '#f8f8fc';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', scaledReference[0].x, scaledReference[0].y);

      // End marker
      const last = scaledReference[scaledReference.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.fillStyle = isDark ? '#1a1a2e' : '#f8f8fc';
      ctx.fillText('E', last.x, last.y);
    }

    // Draw user path
    if (userPath.length > 1) {
      // Glow
      ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(userPath[0].x, userPath[0].y);
      for (let i = 1; i < userPath.length; i++) {
        ctx.lineTo(userPath[i].x, userPath[i].y);
      }
      ctx.stroke();

      // Main line
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(userPath[0].x, userPath[0].y);
      for (let i = 1; i < userPath.length; i++) {
        ctx.lineTo(userPath[i].x, userPath[i].y);
      }
      ctx.stroke();
    }

    // Shape label
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`Trace the ${shapeType}`, canvasW / 2, canvasH - 8);
  }, [theme, scaledReference, userPath, tolerance, shapeType]);

  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = canvasW / rect.width;
    const sy = canvasH / rect.height;
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (solved || failed || phase === 'submitted') return;
      const pt = getCanvasPoint(e);
      if (!pt) return;
      setIsDrawing(true);
      setPhase('drawing');
      pathRef.current = [pt];
      timestampsRef.current = [performance.now()];
      setUserPath([pt]);
      canvasRef.current?.setPointerCapture(e.pointerId);
    },
    [solved, failed, phase, getCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const pt = getCanvasPoint(e);
      if (!pt) return;
      pathRef.current = [...pathRef.current, pt];
      timestampsRef.current = [...timestampsRef.current, performance.now()];
      setUserPath([...pathRef.current]);
    },
    [isDrawing, getCanvasPoint],
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Calculate coverage and deviation
  const evaluateGesture = useCallback(() => {
    if (scaledReference.length === 0 || userPath.length < 5) {
      onFail('Not enough points drawn');
      setFailed(true);
      return;
    }

    // Coverage: % of reference points within tolerance of a user point
    let coveredCount = 0;
    for (const rp of scaledReference) {
      let minDist = Infinity;
      for (const up of userPath) {
        const dist = Math.sqrt((rp.x - up.x) ** 2 + (rp.y - up.y) ** 2);
        if (dist < minDist) minDist = dist;
      }
      if (minDist <= tolerance) coveredCount++;
    }
    const coverage = coveredCount / scaledReference.length;

    // Average deviation
    let totalDeviation = 0;
    let deviationCount = 0;
    for (const up of userPath) {
      let minDist = Infinity;
      for (const rp of scaledReference) {
        const dist = Math.sqrt((rp.x - up.x) ** 2 + (rp.y - up.y) ** 2);
        if (dist < minDist) minDist = dist;
      }
      totalDeviation += minDist;
      deviationCount++;
    }
    const avgDeviation = deviationCount > 0 ? totalDeviation / deviationCount : Infinity;

    // Speed variance (natural human variation)
    const speeds: number[] = [];
    for (let i = 1; i < pathRef.current.length; i++) {
      const dt = timestampsRef.current[i] - timestampsRef.current[i - 1];
      if (dt > 0) {
        const dx = pathRef.current[i].x - pathRef.current[i - 1].x;
        const dy = pathRef.current[i].y - pathRef.current[i - 1].y;
        speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
      }
    }
    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const speedVariance = speeds.length > 0
      ? speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length
      : 0;

    // Pass criteria: coverage >= 60%, avgDeviation within tolerance, some speed variance (human-like)
    const passCoverage = coverage >= 0.6;
    const passDeviation = avgDeviation <= tolerance * 1.5;
    const passHuman = speedVariance > 0.0001; // Not a perfect robot

    if (passCoverage && passDeviation && passHuman && !solvedRef.current) {
      solvedRef.current = true;
      setSolved(true);
      onSolve({
        type: ChallengeType.GESTURE_SIGNATURE,
        answer: pathRef.current,
        tolerance,
        metadata: { coverage, avgDeviation, speedVariance, pathLength: pathRef.current.length },
      });
    } else if (!solvedRef.current) {
      setFailed(true);
      const reasons: string[] = [];
      if (!passCoverage) reasons.push(`Coverage ${Math.round(coverage * 100)}% < 60%`);
      if (!passDeviation) reasons.push('Too far from reference');
      if (!passHuman) reasons.push('Too precise (bot-like)');
      onFail(reasons.join('; '));
    }
  }, [scaledReference, userPath, tolerance, onSolve, onFail]);

  const handleReset = useCallback(() => {
    pathRef.current = [];
    timestampsRef.current = [];
    setUserPath([]);
    setPhase('idle');
  }, []);

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 45) - timeLeft) / (timeLimit ?? 45);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Pen className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Gesture Signature</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`text-xs font-mono ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
      >
        Trace over the dashed shape from Start (S) to End (E). Draw naturally — too-perfect tracing is rejected!
      </motion.p>

      {/* Timer bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${(1 - timerPercent) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className={`w-full max-w-[380px] rounded-lg border-2 cursor-crosshair ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <RotateCcw className="w-3 h-3" /> Clear
        </button>
        <button
          onClick={evaluateGesture}
          disabled={userPath.length < 5}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Check className="w-3 h-3" /> Submit Trace ({userPath.length} pts)
        </button>
      </div>

      {/* Shape info */}
      <div className="flex justify-between mt-2">
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Shape: {shapeType}
        </span>
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Tolerance: ±{tolerance}px
        </span>
      </div>

      {/* Solved/Fail overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Gesture Verified!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Gesture Failed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
