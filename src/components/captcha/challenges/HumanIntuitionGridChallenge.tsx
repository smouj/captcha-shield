'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Grid3x3, Eye } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

interface ShapeData {
  type: string;
  color: string;
  rotation: number;
  isOdd: boolean;
}

type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond' | 'hexagon';

function drawShape(
  ctx: CanvasRenderingContext2D,
  type: ShapeType,
  cx: number,
  cy: number,
  size: number,
  color: string,
  rotation: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.beginPath();

  switch (type) {
    case 'circle':
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      break;
    case 'square':
      ctx.rect(-size, -size, size * 2, size * 2);
      break;
    case 'triangle':
      ctx.moveTo(0, -size);
      ctx.lineTo(size, size * 0.8);
      ctx.lineTo(-size, size * 0.8);
      ctx.closePath();
      break;
    case 'star': {
      const spikes = 5;
      const outerR = size;
      const innerR = size * 0.45;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'heart': {
      const s = size * 0.6;
      ctx.moveTo(0, s * 0.8);
      ctx.bezierCurveTo(-s * 1.5, -s * 0.4, -s * 0.4, -s * 1.6, 0, -s * 0.6);
      ctx.bezierCurveTo(s * 0.4, -s * 1.6, s * 1.5, -s * 0.4, 0, s * 0.8);
      ctx.closePath();
      break;
    }
    case 'diamond':
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.65, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.65, 0);
      ctx.closePath();
      break;
    case 'hexagon': {
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
  }

  ctx.fill();
  ctx.restore();
}

function alterColor(base: string, amount: number): string {
  // Parse hex color and shift
  const hex = base.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

export default function HumanIntuitionGridChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 45);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const solvedRef = useRef(false);

  const gridSize = (instance.payload.gridSize as number) ?? 4;
  const shapes = useMemo<ShapeData[]>(() => (instance.payload.shapes as ShapeData[]) ?? [], [instance.payload.shapes]);
  const oddIndex = (instance.payload.oddIndex as number) ?? 0;

  const canvasSize = 360;
  const cellSize = canvasSize / gridSize;
  const shapeSize = cellSize * 0.3;
  const [attempts, setAttempts] = useState(0);

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

  // Draw grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = isDark ? '#1e1e30' : '#f5f5f8';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let i = 0; i < shapes.length; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const cx = col * cellSize + cellSize / 2;
      const cy = row * cellSize + cellSize / 2;

      // Cell background
      const isHovered = hoveredIndex === i;
      const isSelected = selectedIndex === i;
      ctx.fillStyle = isSelected
        ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
        : isHovered
          ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
          : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';

      const margin = 2;
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(col * cellSize + margin + radius, row * cellSize + margin);
      ctx.arcTo(col * cellSize + cellSize - margin, row * cellSize + margin, col * cellSize + cellSize - margin, row * cellSize + cellSize - margin, radius);
      ctx.arcTo(col * cellSize + cellSize - margin, row * cellSize + cellSize - margin, col * cellSize + margin, row * cellSize + cellSize - margin, radius);
      ctx.arcTo(col * cellSize + margin, row * cellSize + cellSize - margin, col * cellSize + margin, row * cellSize + margin, radius);
      ctx.arcTo(col * cellSize + margin, row * cellSize + margin, col * cellSize + cellSize - margin, row * cellSize + margin, radius);
      ctx.closePath();
      ctx.fill();

      // Cell border
      ctx.strokeStyle = isSelected
        ? '#10b981'
        : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      // Draw the shape
      const shape = shapes[i];
      if (shape) {
        const displayColor = shape.isOdd ? alterColor(shape.color, 30) : shape.color;
        const displayRotation = shape.isOdd ? shape.rotation + 8 : shape.rotation;

        // Subtle shadow
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        drawShape(
          ctx,
          shape.type as ShapeType,
          cx,
          cy,
          shapeSize,
          displayColor,
          displayRotation,
        );

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // If odd, add a missing detail - a tiny gap in shape outline
        if (shape.isOdd) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(cx + shapeSize * 0.5, cy - shapeSize * 0.5, 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }
  }, [shapes, gridSize, hoveredIndex, selectedIndex, theme, canvasSize, cellSize, shapeSize]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (solved || failed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasSize / rect.width;
      const sy = canvasSize / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      const col = Math.floor(mx / cellSize);
      const row = Math.floor(my / cellSize);
      const idx = row * gridSize + col;

      if (idx < 0 || idx >= shapes.length) return;

      setSelectedIndex(idx);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (idx === oddIndex && !solvedRef.current) {
        solvedRef.current = true;
        setSolved(true);
        onSolve({
          type: ChallengeType.HUMAN_INTUITION_GRID,
          answer: idx,
          metadata: { attempts: newAttempts },
        });
      } else {
        if (newAttempts >= instance.maxAttempts) {
          setFailed(true);
          onFail('Too many incorrect attempts');
        }
      }
    },
    [solved, failed, attempts, canvasSize, cellSize, gridSize, shapes.length, oddIndex, onSolve, onFail, instance.maxAttempts],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasSize / rect.width;
      const sy = canvasSize / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;
      const col = Math.floor(mx / cellSize);
      const row = Math.floor(my / cellSize);
      const idx = row * gridSize + col;
      setHoveredIndex(idx >= 0 && idx < shapes.length ? idx : null);
    },
    [canvasSize, cellSize, gridSize, shapes.length],
  );

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
          <Grid3x3 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Human Intuition Grid</h3>
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
        className={`text-xs mb-3 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
      >
        <Eye className="w-3.5 h-3.5" />
        Find the shape that is subtly different from the rest, then click it.
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
          width={canvasSize}
          height={canvasSize}
          className={`w-full max-w-[360px] rounded-lg border-2 cursor-pointer ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        />
      </div>

      {/* Attempts */}
      <div className="flex justify-between items-center mt-3">
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Attempts: {attempts}/{instance.maxAttempts}
        </span>
        {selectedIndex !== null && !solved && !failed && (
          <span className="text-xs text-amber-500">Not quite — try again!</span>
        )}
      </div>

      {/* Solved/Fail overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Correct!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Failed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
