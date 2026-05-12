'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Scale, RotateCcw } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

interface PhysObject {
  id: number;
  weight: number;
  position: number; // -1 to 1 relative to pivot
  color: string;
  radius: number;
}

function calcTorque(objects: PhysObject[], pivot: number): number {
  return objects.reduce((sum, obj) => sum + obj.weight * (obj.position - pivot), 0);
}

const OBJECT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function PhysicsChaosChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 60);
  const [solved, setSolved] = useState(false);
  const solvedRef = useRef(false);
  const dragOffset = useRef(0);

  const rawObjects = useMemo<Array<{ weight: number; position: number }>>(
    () => (instance.payload.objects as Array<{ weight: number; position: number }>) ?? [],
    [instance.payload.objects],
  );
  const beamLength = (instance.payload.beamLength as number) ?? 400;
  const pivotPosition = (instance.payload.pivotPosition as number) ?? 0;

  const canvasW = 440;
  const canvasH = 300;
  const pivotX = canvasW / 2;
  const pivotY = canvasH * 0.45;
  const beamHalf = beamLength / 2;
  const tolerance = 0.06;

  // Initialize objects with state initializer
  const [objects, setObjects] = useState<PhysObject[]>(() =>
    rawObjects.map((obj, i) => ({
      id: i,
      weight: obj.weight,
      position: obj.position,
      color: OBJECT_COLORS[i % OBJECT_COLORS.length],
      radius: 14 + obj.weight * 6,
    })),
  );

  // Timer
  useEffect(() => {
    if (solved) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!solvedRef.current) onFail('Time ran out');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [solved, onFail]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f5';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Calculate tilt
    const torque = calcTorque(objects, pivotPosition);
    const maxTilt = 15 * (Math.PI / 180);
    const tiltAngle = Math.max(-maxTilt, Math.min(maxTilt, torque * 0.03));

    // Draw fulcrum (triangle)
    ctx.fillStyle = isDark ? '#4a4a6a' : '#8a8aaa';
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX - 20, pivotY + 40);
    ctx.lineTo(pivotX + 20, pivotY + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isDark ? '#6a6a8a' : '#aaaacc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw beam with rotation
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(tiltAngle);

    // Beam
    const beamGrad = ctx.createLinearGradient(-beamHalf, -6, beamHalf, 6);
    beamGrad.addColorStop(0, isDark ? '#5a5a7a' : '#a0a0c0');
    beamGrad.addColorStop(0.5, isDark ? '#7a7a9a' : '#c0c0e0');
    beamGrad.addColorStop(1, isDark ? '#5a5a7a' : '#a0a0c0');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-beamHalf, -6);
    ctx.lineTo(beamHalf, -6);
    ctx.lineTo(beamHalf, 6);
    ctx.lineTo(-beamHalf, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isDark ? '#8a8aaa' : '#b0b0d0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tick marks
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    for (let x = -beamHalf; x <= beamHalf; x += beamHalf / 5) {
      ctx.beginPath();
      ctx.moveTo(x, -6);
      ctx.lineTo(x, 6);
      ctx.stroke();
    }

    // Draw objects on beam
    for (const obj of objects) {
      const objX = obj.position * beamHalf;
      const objY = -6 - obj.radius;

      // Weight label
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${obj.weight}kg`, objX, objY);

      // Object circle
      ctx.beginPath();
      ctx.arc(objX, objY - obj.radius - 2, obj.radius, 0, Math.PI * 2);
      ctx.fillStyle = obj.color;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Object weight text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${obj.weight}`, objX, objY - obj.radius - 2);

      // Small indicator for draggable
      if (dragIdx === obj.id) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(objX, objY - obj.radius - 2, obj.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();

    // Torque indicator
    const balancePercent = Math.abs(torque);
    const isBalanced = balancePercent < 0.3;
    ctx.fillStyle = isBalanced
      ? '#10b981'
      : balancePercent < 1
        ? '#f59e0b'
        : '#ef4444';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      isBalanced ? '✓ Balanced' : `Torque: ${torque > 0 ? '→' : '←'} ${Math.abs(torque).toFixed(1)}`,
      pivotX,
      canvasH - 20,
    );

    // Balance meter
    const meterY = canvasH - 50;
    const meterW = 160;
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX - meterW / 2, meterY);
    ctx.lineTo(pivotX + meterW / 2, meterY);
    ctx.stroke();

    // Indicator dot
    const dotX = pivotX + Math.max(-meterW / 2, Math.min(meterW / 2, torque * 15));
    ctx.beginPath();
    ctx.arc(dotX, meterY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isBalanced ? '#10b981' : '#ef4444';
    ctx.fill();

    // Center mark
    ctx.beginPath();
    ctx.arc(pivotX, meterY, 2, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
    ctx.fill();
  }, [objects, dragIdx, theme, beamHalf, pivotPosition, pivotX, pivotY, canvasW, canvasH]);

  // Check balance
  const checkBalance = useCallback(
    (updated: PhysObject[]) => {
      const torque = calcTorque(updated, pivotPosition);
      if (Math.abs(torque) < tolerance && !solvedRef.current) {
        solvedRef.current = true;
        setSolved(true);
        onSolve({
          type: ChallengeType.PHYSICS_CHAOS,
          answer: updated.map(o => o.position),
          tolerance,
          metadata: { finalTorque: torque },
        });
      }
    },
    [pivotPosition, tolerance, onSolve],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasW / rect.width;
      const mx = (e.clientX - rect.left) * sx;

      // Calculate tilt for proper coordinate transform
      setObjects(currentObjects => {
        const torque = calcTorque(currentObjects, pivotPosition);
        const tiltAngle = Math.max(-0.26, Math.min(0.26, torque * 0.03));

        for (let i = currentObjects.length - 1; i >= 0; i--) {
          const obj = currentObjects[i];
          const objScreenX = pivotX + obj.position * beamHalf * Math.cos(tiltAngle);
          const dist = Math.abs(mx - objScreenX);
          if (dist < obj.radius + 10) {
            setDragIdx(obj.id);
            dragOffset.current = mx - objScreenX;
            canvas.setPointerCapture(e.pointerId);
            break;
          }
        }
        return currentObjects;
      });
    },
    [canvasW, pivotPosition, pivotX, beamHalf],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragIdx === null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasW / rect.width;
      const mx = (e.clientX - rect.left) * sx;

      const newPos = (mx - pivotX) / beamHalf;
      const clamped = Math.max(-0.95, Math.min(0.95, newPos));

      setObjects(prev =>
        prev.map(o => (o.id === dragIdx ? { ...o, position: clamped } : o)),
      );
    },
    [dragIdx, pivotX, beamHalf, canvasW],
  );

  const handlePointerUp = useCallback(() => {
    if (dragIdx === null) return;
    setObjects(prev => {
      checkBalance(prev);
      return prev;
    });
    setDragIdx(null);
  }, [dragIdx, checkBalance]);

  const handleReset = useCallback(() => {
    setObjects(prev =>
      prev.map((o, i) => ({
        ...o,
        position: rawObjects[i]?.position ?? 0,
      })),
    );
  }, [rawObjects]);

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
          <Scale className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Physics Chaos</h3>
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
        Drag the weights along the beam until it balances. The scale tilts based on torque!
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
          className={`w-full max-w-[440px] rounded-lg border-2 cursor-grab active:cursor-grabbing ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-3">
        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {objects.length} weights to balance
        </span>
      </div>

      {/* Solved overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Balanced!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
