'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface PatternPoint {
  id: number;
  x: number;
  y: number;
}

interface PatternTraceChallengeProps {
  challengeData: {
    points: PatternPoint[];
    connections: [number, number][];
    sequence: number[];
    totalTimeLimit: number;
  };
  onVerify: (response: { sequence: number[] }) => void;
}

export default function PatternTraceChallenge({ challengeData, onVerify }: PatternTraceChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const { points, connections, sequence } = challengeData;
  const canvasSize = 300;
  const dotRadius = 18;

  // Map point percentages to canvas pixels
  const pixelPoints = points.map(p => ({
    id: p.id,
    px: (p.x / 100) * canvasSize,
    py: (p.y / 100) * canvasSize,
  }));

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasSize;
    const h = canvasSize;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 12);
    ctx.fill();

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Draw guide lines (faint connections)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const [from, to] of connections) {
      const p1 = pixelPoints.find(p => p.id === from);
      const p2 = pixelPoints.find(p => p.id === to);
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Draw user's traced lines
    if (userSequence.length > 1) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const first = pixelPoints.find(p => p.id === userSequence[0]);
      if (first) {
        ctx.moveTo(first.px, first.py);
        for (let i = 1; i < userSequence.length; i++) {
          const pt = pixelPoints.find(p => p.id === userSequence[i]);
          if (pt) ctx.lineTo(pt.px, pt.py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw dots
    for (const pt of pixelPoints) {
      const isSelected = userSequence.includes(pt.id);
      const selectionOrder = userSequence.indexOf(pt.id);
      const isError = errorIndex === pt.id;
      const isHovered = hoveredDot === pt.id;

      // Outer ring
      ctx.beginPath();
      ctx.arc(pt.px, pt.py, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? isError
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(16, 185, 129, 0.15)'
        : isHovered
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = isSelected
        ? isError
          ? '#ef4444'
          : '#10b981'
        : isHovered
          ? 'rgba(255, 255, 255, 0.4)'
          : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(pt.px, pt.py, isSelected ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? isError
          ? '#ef4444'
          : '#10b981'
        : 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Selection order number
      if (isSelected && selectionOrder >= 0) {
        ctx.fillStyle = isSelected ? (isError ? '#ef4444' : '#10b981') : 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 11px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${selectionOrder + 1}`, pt.px, pt.py - dotRadius - 10);
      }
    }

  }, [userSequence, errorIndex, hoveredDot, pixelPoints, connections]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // Find closest dot
      let closestId: number | null = null;
      let closestDist = Infinity;

      for (const pt of pixelPoints) {
        const dist = Math.hypot(pt.px - clickX, pt.py - clickY);
        if (dist < dotRadius + 5 && dist < closestDist) {
          closestDist = dist;
          closestId = pt.id;
        }
      }

      if (closestId !== null) {
        // Check if already selected (deselect)
        if (userSequence.includes(closestId)) {
          // Only allow deselecting the last one
          if (userSequence[userSequence.length - 1] === closestId) {
            setUserSequence(prev => prev.slice(0, -1));
            setErrorIndex(null);
          }
          return;
        }

        const newSequence = [...userSequence, closestId];
        setUserSequence(newSequence);
        setErrorIndex(null);

        // Check if sequence length matches (auto-verify when all dots selected)
        if (newSequence.length === sequence.length) {
          // Small delay to show the last click
          setTimeout(() => {
            onVerify({ sequence: newSequence });
          }, 300);
        }
      }
    },
    [userSequence, sequence, pixelPoints, dotRadius, onVerify]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let hovered: number | null = null;
      for (const pt of pixelPoints) {
        if (Math.hypot(pt.px - mouseX, pt.py - mouseY) < dotRadius + 5) {
          hovered = pt.id;
          break;
        }
      }
      setHoveredDot(hovered);
    },
    [pixelPoints, dotRadius]
  );

  const handleReset = useCallback(() => {
    setUserSequence([]);
    setErrorIndex(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-center"
      >
        <p className="text-sm font-medium text-emerald-300">
          🔗 Haz clic en los puntos en el orden correcto ({sequence.length} puntos)
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Sigue las líneas punteadas como guía. Haz clic en el último punto para deseleccionarlo.
        </p>
      </motion.div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredDot(null)}
          className="rounded-lg cursor-pointer max-w-full border border-gray-700"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 max-w-[300px] mx-auto">
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            animate={{ width: `${(userSequence.length / sequence.length) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <span className="text-xs text-gray-500 font-mono">
          {userSequence.length}/{sequence.length}
        </span>
      </div>

      {/* Reset button */}
      <div className="flex justify-center">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}
