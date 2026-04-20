'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { PuzzleChallengeData } from '@/lib/captcha-engine';

interface Props {
  challengeData: PuzzleChallengeData;
  onVerify: (response: { positions: number[] }) => void;
}

export default function PuzzleChallenge({ challengeData, onVerify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPositions, setSliderPositions] = useState<number[]>(() =>
    challengeData.pieces.map(() => 0)
  );
  const [activePiece, setActivePiece] = useState<number | null>(null);
  const dragStartXRef = useRef<number>(0);
  const activePieceRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const { seed, pieces, tolerance, timeLimit } = challengeData;
  const canvasWidth = 350;
  const canvasHeight = 200;

  // Dibujar escena
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvasWidth, h = canvasHeight;

    ctx.clearRect(0, 0, w, h);

    // Cielo con gradiente
    const hue1 = (seed * 37) % 360;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, `hsl(${hue1}, 60%, 55%)`);
    skyGrad.addColorStop(0.5, `hsl(${(hue1 + 30) % 360}, 50%, 65%)`);
    skyGrad.addColorStop(1, `hsl(${(hue1 + 60) % 360}, 40%, 75%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Elementos de escena
    const rng = (n: number) => ((seed * 31 + n * 17) * 13 + n * 7) % 1000;

    // Montañas
    for (let i = 0; i < 4; i++) {
      const mx = rng(i * 3) * w / 1000;
      const my = h * 0.4 + rng(i * 3 + 1) * h * 0.2 / 1000;
      const mw = 40 + rng(i * 3 + 2) * 60 / 10;
      ctx.fillStyle = `hsl(${200 + rng(i * 7) % 40}, 30%, ${20 + rng(i * 8) % 15}%)`;
      ctx.beginPath();
      ctx.moveTo(mx - mw, h * 0.75);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx + mw, h * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    // Sol
    ctx.fillStyle = `hsl(${40 + rng(50) % 20}, 80%, 60%)`;
    ctx.beginPath();
    ctx.arc(70 + rng(51) * w * 0.2 / 1000, 20 + rng(52) * 20 / 1000, 15, 0, Math.PI * 2);
    ctx.fill();

    // Nubes
    for (let i = 0; i < 3; i++) {
      const cx = 30 + rng(60 + i) * w * 0.7 / 1000;
      const cy = 15 + rng(70 + i) * 30 / 1000;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy - 5, 10, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    // Árboles
    for (let i = 0; i < 6; i++) {
      const tx = 20 + rng(80 + i) * (w - 40) / 1000;
      const ty = h * 0.72;
      const th = 20 + rng(90 + i) * 15 / 10;
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(tx - 2, ty, 4, th * 0.4);
      ctx.fillStyle = `hsl(${100 + rng(100 + i) % 40}, 50%, ${25 + rng(110 + i) % 15}%)`;
      ctx.beginPath();
      ctx.moveTo(tx, ty - th * 0.6);
      ctx.lineTo(tx - th * 0.35, ty + th * 0.1);
      ctx.lineTo(tx + th * 0.35, ty + th * 0.1);
      ctx.closePath();
      ctx.fill();
    }

    // Suelo
    ctx.fillStyle = `hsl(${(seed * 11) % 40 + 90}, 40%, 35%)`;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);

    // Línea del horizonte
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.lineTo(w, h * 0.75);
    ctx.stroke();
  }, [seed]);

  // Dibujar cortes y piezas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Redibujar escena base (simplificado)
    const w = canvasWidth, h = canvasHeight;
    // ... (la escena ya fue dibujada arriba, aquí dibujamos overlays)

    // Dibujar áreas de corte (sombras oscuras donde van las piezas)
    for (const piece of pieces) {
      const targetPx = (piece.targetX / 100) * w;
      const piecePx = (piece.width / 100) * w;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      if (piece.shape === 'wave') {
        ctx.moveTo(targetPx, 0);
        ctx.lineTo(targetPx + piecePx, 0);
        ctx.quadraticCurveTo(targetPx + piecePx + 8, h * 0.5, targetPx + piecePx, h);
        ctx.lineTo(targetPx, h);
        ctx.quadraticCurveTo(targetPx - 8, h * 0.5, targetPx, 0);
      } else if (piece.shape === 'tab') {
        ctx.moveTo(targetPx, 0);
        ctx.lineTo(targetPx + piecePx, 0);
        ctx.lineTo(targetPx + piecePx, h * 0.4);
        ctx.arc(targetPx + piecePx, h * 0.45, piecePx * 0.25, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(targetPx + piecePx, h);
        ctx.lineTo(targetPx, h);
        ctx.lineTo(targetPx, h * 0.45);
        ctx.arc(targetPx, h * 0.4, piecePx * 0.25, Math.PI / 2, -Math.PI / 2, false);
        ctx.closePath();
      } else {
        ctx.rect(targetPx, 0, piecePx, h);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Dibujar piezas deslizantes
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      const pos = sliderPositions[i] || 0;
      const startPx = (piece.startX / 100) * w;
      const piecePx = (piece.width / 100) * w;
      const currentPx = startPx + (pos / 100) * (w - startPx - piecePx);

      ctx.save();

      // Forma de la pieza
      ctx.beginPath();
      if (piece.shape === 'wave') {
        ctx.moveTo(currentPx, 0);
        ctx.lineTo(currentPx + piecePx, 0);
        ctx.quadraticCurveTo(currentPx + piecePx + 8, h * 0.5, currentPx + piecePx, h);
        ctx.lineTo(currentPx, h);
        ctx.quadraticCurveTo(currentPx - 8, h * 0.5, currentPx, 0);
      } else if (piece.shape === 'tab') {
        ctx.moveTo(currentPx, 0);
        ctx.lineTo(currentPx + piecePx, 0);
        ctx.lineTo(currentPx + piecePx, h * 0.4);
        ctx.arc(currentPx + piecePx, h * 0.45, piecePx * 0.25, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(currentPx + piecePx, h);
        ctx.lineTo(currentPx, h);
        ctx.lineTo(currentPx, h * 0.45);
        ctx.arc(currentPx, h * 0.4, piecePx * 0.25, Math.PI / 2, -Math.PI / 2, false);
        ctx.closePath();
      } else {
        ctx.rect(currentPx, 0, piecePx, h);
      }
      ctx.clip();

      // Rellenar con color de la escena
      const hue1 = (seed * 37) % 360;
      const pieceGrad = ctx.createLinearGradient(currentPx, 0, currentPx, h);
      pieceGrad.addColorStop(0, `hsl(${hue1}, 60%, 55%)`);
      pieceGrad.addColorStop(0.5, `hsl(${(hue1 + 30) % 360}, 50%, 65%)`);
      pieceGrad.addColorStop(1, `hsl(${(hue1 + 60) % 360}, 40%, 75%)`);
      ctx.fillStyle = pieceGrad;
      ctx.fillRect(currentPx, 0, piecePx, h);

      // Suelo en pieza
      ctx.fillStyle = `hsl(${(seed * 11) % 40 + 90}, 40%, 35%)`;
      ctx.fillRect(currentPx, h * 0.75, piecePx, h * 0.25);

      ctx.restore();

      // Borde de pieza
      ctx.beginPath();
      if (piece.shape === 'wave') {
        ctx.moveTo(currentPx, 0);
        ctx.lineTo(currentPx + piecePx, 0);
        ctx.quadraticCurveTo(currentPx + piecePx + 8, h * 0.5, currentPx + piecePx, h);
        ctx.lineTo(currentPx, h);
        ctx.quadraticCurveTo(currentPx - 8, h * 0.5, currentPx, 0);
      } else if (piece.shape === 'tab') {
        ctx.moveTo(currentPx, 0);
        ctx.lineTo(currentPx + piecePx, 0);
        ctx.lineTo(currentPx + piecePx, h * 0.4);
        ctx.arc(currentPx + piecePx, h * 0.45, piecePx * 0.25, -Math.PI / 2, Math.PI / 2, false);
        ctx.lineTo(currentPx + piecePx, h);
        ctx.lineTo(currentPx, h);
        ctx.lineTo(currentPx, h * 0.45);
        ctx.arc(currentPx, h * 0.4, piecePx * 0.25, Math.PI / 2, -Math.PI / 2, false);
        ctx.closePath();
      } else {
        ctx.rect(currentPx, 0, piecePx, h);
      }
      ctx.strokeStyle = activePiece === i ? '#10b981' : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = activePiece === i ? 2.5 : 1.5;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = activePiece === i ? 10 : 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [sliderPositions, pieces, seed, activePiece]);

  const handleSliderDown = useCallback((pieceIdx: number) => (e: React.PointerEvent) => {
    setActivePiece(pieceIdx);
    activePieceRef.current = pieceIdx;
    dragStartXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleSliderMove = useCallback((e: React.PointerEvent) => {
    if (activePieceRef.current === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartXRef.current;
    const sliderMax = rect.width - 44;
    const newVal = Math.max(0, Math.min(100, (deltaX / sliderMax) * 100));

    setSliderPositions(prev => {
      const next = [...prev];
      next[activePieceRef.current!] = newVal;
      return next;
    });
  }, []);

  const handleSliderUp = useCallback(() => {
    setActivePiece(null);
    activePieceRef.current = null;
  }, []);

  const handleVerify = useCallback(() => {
    const positions = sliderPositions.map((pos, i) => {
      const startPx = (pieces[i].startX / 100) * canvasWidth;
      const piecePx = (pieces[i].width / 100) * canvasWidth;
      const currentPx = startPx + (pos / 100) * (canvasWidth - startPx - piecePx);
      return Math.round((currentPx / canvasWidth) * 100 * 100) / 100;
    });
    onVerify({ positions });
  }, [sliderPositions, pieces, onVerify]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900 mx-auto" style={{ width: '100%', maxWidth: '350px' }}>
        <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="w-full h-auto" />
      </div>

      {/* Sliders para cada pieza */}
      <div className="space-y-2 max-w-[350px] mx-auto">
        {pieces.map((piece, i) => (
          <div key={piece.id} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-4">{i + 1}</span>
            <div className="relative flex-1 h-9 bg-gray-800 rounded-lg border border-gray-700 flex items-center px-1"
              onPointerMove={handleSliderMove} onPointerUp={handleSliderUp} onPointerCancel={handleSliderUp}>
              <span className="absolute left-3 text-[10px] text-gray-600 pointer-events-none z-10">⟵ Desliza →</span>
              <div
                className="w-9 h-7 bg-emerald-500 rounded-md cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors select-none z-20"
                style={{ marginLeft: `${sliderPositions[i]}%`, transition: activePiece === i ? 'none' : 'margin-left 0.1s' }}
                onPointerDown={handleSliderDown(i)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 text-center">Desliza cada pieza a su posición correcta</p>

      <div className="flex justify-center">
        <button onClick={handleVerify} className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25">
          Verificar
        </button>
      </div>
    </div>
  );
}
