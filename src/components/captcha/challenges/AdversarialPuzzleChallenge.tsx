'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Puzzle, RotateCcw } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

interface PieceState {
  id: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  placed: boolean;
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  noiseLevel: number,
) {
  const rng = (n: number) => ((seed * 31 + n * 17) * 13 + n * 7) % 1000;

  // Gradient sky
  const hue1 = (seed * 37) % 360;
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, `hsl(${hue1}, 65%, 55%)`);
  skyGrad.addColorStop(0.5, `hsl(${(hue1 + 40) % 360}, 55%, 65%)`);
  skyGrad.addColorStop(1, `hsl(${(hue1 + 80) % 360}, 45%, 75%)`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Geometric mountains
  for (let i = 0; i < 5; i++) {
    const mx = (rng(i * 3) / 1000) * w;
    const my = h * 0.35 + (rng(i * 3 + 1) / 1000) * h * 0.2;
    const mw = 50 + (rng(i * 3 + 2) / 10);
    ctx.fillStyle = `hsl(${210 + (rng(i * 7) % 50)}, 35%, ${25 + (rng(i * 8) % 20)}%)`;
    ctx.beginPath();
    ctx.moveTo(mx - mw, h * 0.72);
    ctx.lineTo(mx, my);
    ctx.lineTo(mx + mw, h * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  // Sun with glow
  const sunX = 60 + (rng(51) / 1000) * w * 0.3;
  const sunY = 25 + (rng(52) / 1000) * 20;
  ctx.fillStyle = `hsl(${45 + (rng(53) % 20)}, 90%, 65%)`;
  ctx.shadowColor = `hsl(${45}, 90%, 65%)`;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Clouds
  for (let i = 0; i < 3; i++) {
    const cx = 40 + (rng(60 + i) / 1000) * w * 0.6;
    const cy = 20 + (rng(70 + i) / 1000) * 30;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.arc(cx + 16, cy - 4, 11, 0, Math.PI * 2);
    ctx.arc(cx + 32, cy, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground
  const groundGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
  groundGrad.addColorStop(0, `hsl(${100 + (seed * 11) % 40}, 45%, 38%)`);
  groundGrad.addColorStop(1, `hsl(${90 + (seed * 13) % 30}, 35%, 25%)`);
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Adversarial noise overlay
  const noiseCount = Math.floor(noiseLevel * 300);
  for (let i = 0; i < noiseCount; i++) {
    const nx = (rng(200 + i) / 1000) * w;
    const ny = (rng(300 + i) / 1000) * h;
    const nsize = 1 + (rng(400 + i) % 3);
    ctx.fillStyle = `hsla(${rng(500 + i) % 360}, 80%, 50%, ${0.15 + (noiseLevel * 0.2)})`;
    ctx.fillRect(nx, ny, nsize, nsize);
  }
  // Random lines as adversarial noise
  const lineCount = Math.floor(noiseLevel * 15);
  for (let i = 0; i < lineCount; i++) {
    ctx.strokeStyle = `hsla(${rng(600 + i) % 360}, 70%, 50%, ${0.1 + noiseLevel * 0.1})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo((rng(700 + i) / 1000) * w, (rng(800 + i) / 1000) * h);
    ctx.lineTo((rng(900 + i) / 1000) * w, (rng(1000 + i) / 1000) * h);
    ctx.stroke();
  }
}

function drawJaggedEdge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  jagSize: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (i === 0) {
      ctx.lineTo(px, py);
    } else {
      const jx = px + (Math.random() - 0.5) * jagSize * 2;
      const jy = py + (Math.random() - 0.5) * jagSize * 2;
      ctx.lineTo(jx, jy);
      ctx.lineTo(px, py);
    }
  }
}

function createInitialPieces(
  pieceCount: number,
  piecePositions: Array<{ x: number; y: number }>,
  canvasW: number,
  canvasH: number,
): PieceState[] {
  const initPieces: PieceState[] = [];
  const cols = Math.ceil(pieceCount / 2);
  const pw = canvasW / cols;
  const ph = canvasH / 2;

  for (let i = 0; i < pieceCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const targetX = piecePositions[i]?.x ?? col * pw;
    const targetY = piecePositions[i]?.y ?? row * ph;

    const scatterX = Math.random() * (canvasW - pw);
    const scatterY = Math.random() * (canvasH - ph);

    initPieces.push({
      id: i,
      currentX: scatterX,
      currentY: scatterY,
      targetX,
      targetY,
      width: pw,
      height: ph,
      placed: false,
    });
  }
  return initPieces;
}

export default function AdversarialPuzzleChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 60);
  const [solved, setSolved] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const solvedRef = useRef(false);

  const pieceCount = (instance.payload.pieceCount as number) ?? 4;
  const noiseLevel = (instance.payload.noiseLevel as number) ?? 0.5;
  const piecePositions = useMemo<Array<{ x: number; y: number }>>(
    () => (instance.payload.piecePositions as Array<{ x: number; y: number }>) ?? [],
    [instance.payload.piecePositions],
  );

  const canvasW = 400;
  const canvasH = 280;

  // Initialize pieces with state initializer
  const [pieces, setPieces] = useState<PieceState[]>(() =>
    createInitialPieces(pieceCount, piecePositions, canvasW, canvasH),
  );

  // Create offscreen scene
  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = canvasW;
    offscreen.height = canvasH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    drawScene(ctx, canvasW, canvasH, parseInt(instance.id.slice(-4), 16) || 42, noiseLevel);
    sceneRef.current = offscreen;
  }, [instance.id, noiseLevel, canvasW, canvasH]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = sceneRef.current;
    if (!canvas || !scene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    ctx.fillStyle = isDark ? '#1a1a2e' : '#e8e8f0';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw ghost outlines for target positions
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    for (const p of pieces) {
      ctx.strokeRect(p.targetX, p.targetY, p.width, p.height);
    }
    ctx.setLineDash([]);

    // Draw each piece
    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.currentX, p.currentY, p.width, p.height);
      ctx.clip();

      // Draw scene portion at the target offset
      const srcX = p.targetX;
      const srcY = p.targetY;
      ctx.drawImage(scene, srcX, srcY, p.width, p.height, p.currentX, p.currentY, p.width, p.height);

      // Jagged edge overlay on borders
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      drawJaggedEdge(ctx, p.currentX, p.currentY, p.currentX + p.width, p.currentY, 3);
      drawJaggedEdge(ctx, p.currentX + p.width, p.currentY, p.currentX + p.width, p.currentY + p.height, 3);
      drawJaggedEdge(ctx, p.currentX + p.width, p.currentY + p.height, p.currentX, p.currentY + p.height, 3);
      drawJaggedEdge(ctx, p.currentX, p.currentY + p.height, p.currentX, p.currentY, 3);
      ctx.stroke();

      ctx.restore();

      // Highlight border for active piece
      if (dragIdx === i) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.strokeRect(p.currentX, p.currentY, p.width, p.height);
        ctx.shadowBlur = 0;
      } else if (p.placed) {
        ctx.strokeStyle = 'rgba(16,185,129,0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.currentX, p.currentY, p.width, p.height);
      }

      // Piece label
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, p.currentX + p.width / 2, p.currentY + p.height / 2);
    }
  }, [pieces, dragIdx, theme, canvasW, canvasH]);

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

  // Check placement
  const checkPlacement = useCallback(
    (updated: PieceState[]) => {
      const tolerance = 25;
      const allPlaced = updated.every(
        p =>
          Math.abs(p.currentX - p.targetX) < tolerance &&
          Math.abs(p.currentY - p.targetY) < tolerance,
      );
      if (allPlaced && !solvedRef.current) {
        solvedRef.current = true;
        setSolved(true);
        const order = updated.map(p => p.id);
        onSolve({
          type: ChallengeType.ADVERSARIAL_PUZZLE,
          answer: order,
          tolerance: 25,
        });
      }
    },
    [onSolve],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasW / rect.width;
      const sy = canvasH / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      // Read current pieces from a ref-based approach to avoid stale closure
      setPieces(currentPieces => {
        for (let i = currentPieces.length - 1; i >= 0; i--) {
          const p = currentPieces[i];
          if (
            mx >= p.currentX &&
            mx <= p.currentX + p.width &&
            my >= p.currentY &&
            my <= p.currentY + p.height
          ) {
            setDragIdx(i);
            dragOffset.current = { x: mx - p.currentX, y: my - p.currentY };
            canvas.setPointerCapture(e.pointerId);
            return currentPieces; // no mutation
          }
        }
        return currentPieces;
      });
    },
    [canvasW, canvasH],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (dragIdx === null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasW / rect.width;
      const sy = canvasH / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      setPieces(prev => {
        const next = [...prev];
        next[dragIdx] = {
          ...next[dragIdx],
          currentX: Math.max(0, Math.min(canvasW - next[dragIdx].width, mx - dragOffset.current.x)),
          currentY: Math.max(0, Math.min(canvasH - next[dragIdx].height, my - dragOffset.current.y)),
        };
        return next;
      });
    },
    [dragIdx, canvasW, canvasH],
  );

  const handlePointerUp = useCallback(() => {
    if (dragIdx === null) return;
    setPieces(prev => {
      const next = [...prev];
      const p = next[dragIdx];
      const tolerance = 25;
      const isPlaced =
        Math.abs(p.currentX - p.targetX) < tolerance &&
        Math.abs(p.currentY - p.targetY) < tolerance;
      if (isPlaced) {
        next[dragIdx] = { ...p, currentX: p.targetX, currentY: p.targetY, placed: true };
      }
      checkPlacement(next);
      return next;
    });
    setDragIdx(null);
  }, [dragIdx, checkPlacement]);

  const handleReset = useCallback(() => {
    setPieces(prev =>
      prev.map(p => ({
        ...p,
        currentX: Math.random() * (canvasW - p.width),
        currentY: Math.random() * (canvasH - p.height),
        placed: false,
      })),
    );
  }, [canvasW, canvasH]);

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 60) - timeLeft) / (timeLimit ?? 60);
  const placedCount = pieces.filter(p => p.placed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Adversarial Puzzle</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span
            className={`text-xs font-mono ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Instructions */}
      <AnimatePresence>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        >
          Drag each puzzle piece to its matching outline. Ignore the noise overlay!
        </motion.p>
      </AnimatePresence>

      {/* Timer bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${(1 - timerPercent) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className={`w-full max-w-[400px] rounded-lg border-2 cursor-grab active:cursor-grabbing ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
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
          {placedCount}/{pieceCount} placed
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
            <span className="text-emerald-500 font-bold text-lg">Solved!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
