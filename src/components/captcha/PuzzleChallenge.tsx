'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface PuzzleChallengeProps {
  challengeData: {
    targetX: number;
    pieceX: number;
    tolerance: number;
    puzzleImage: string;
    pieceImage: string;
  };
  onVerify: (response: { value: number; tolerance: number }) => void;
}

// Generate a deterministic gradient from seed
function getGradient(seed: number): string {
  const hue1 = (seed * 37) % 360;
  const hue2 = (hue1 + 40 + (seed * 13) % 60) % 360;
  return `linear-gradient(${135 + (seed % 45)}deg, hsl(${hue1}, 65%, 45%), hsl(${hue2}, 55%, 55%))`;
}

// Generate scene elements from seed
function getSceneElements(seed: number) {
  const elements: { x: number; y: number; size: number; color: string; shape: string }[] = [];
  const rng = (n: number) => ((seed * 31 + n * 17) * 13) % 100;

  // Mountains
  for (let i = 0; i < 3; i++) {
    elements.push({
      x: rng(i) * 3,
      y: 30 + rng(i + 10) * 0.5,
      size: 30 + rng(i + 20) * 0.5,
      color: `hsl(${200 + rng(i + 30)}, 30%, ${20 + rng(i + 40) * 0.2}%)`,
      shape: 'triangle',
    });
  }

  // Sun/Moon
  elements.push({
    x: 70 + rng(50) * 0.3,
    y: 15 + rng(51) * 0.1,
    size: 8 + rng(52) * 0.1,
    color: `hsl(${40 + rng(53) * 0.2}, 80%, 60%)`,
    shape: 'circle',
  });

  // Trees
  for (let i = 0; i < 5; i++) {
    elements.push({
      x: 5 + rng(60 + i) * 1.8,
      y: 50 + rng(70 + i) * 0.3,
      size: 6 + rng(80 + i) * 0.15,
      color: `hsl(${100 + rng(90 + i) * 0.4}, 50%, ${25 + rng(100 + i) * 0.15}%)`,
      shape: 'tree',
    });
  }

  // Clouds
  for (let i = 0; i < 3; i++) {
    elements.push({
      x: 10 + rng(110 + i) * 2.5,
      y: 8 + rng(120 + i) * 0.15,
      size: 10 + rng(130 + i) * 0.1,
      color: 'rgba(255, 255, 255, 0.7)',
      shape: 'cloud',
    });
  }

  return elements;
}

export default function PuzzleChallenge({ challengeData, onVerify }: PuzzleChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderX, setSliderX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const seed = Math.floor(Math.random() * 10000);
  const gradient = getGradient(seed);
  const sceneElements = getSceneElements(seed);

  const puzzleWidth = 15; // 15% of canvas width
  const canvasWidth = 350;
  const canvasHeight = 200;

  // Draw the background scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasWidth;
    const h = canvasHeight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    const hue1 = (seed * 37) % 360;
    skyGrad.addColorStop(0, `hsl(${hue1}, 60%, 55%)`);
    skyGrad.addColorStop(0.6, `hsl(${(hue1 + 30) % 360}, 50%, 65%)`);
    skyGrad.addColorStop(1, `hsl(${(hue1 + 60) % 360}, 40%, 75%)`);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw scene elements
    for (const el of sceneElements) {
      ctx.save();
      const ex = (el.x / 100) * w;
      const ey = (el.y / 100) * h;
      const es = (el.size / 100) * w;

      if (el.shape === 'triangle') {
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - es, ey + es * 0.8);
        ctx.lineTo(ex + es, ey + es * 0.8);
        ctx.closePath();
        ctx.fill();
      } else if (el.shape === 'circle') {
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(ex, ey, es / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (el.shape === 'tree') {
        // Trunk
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(ex - es * 0.1, ey, es * 0.2, es * 0.4);
        // Foliage
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.moveTo(ex, ey - es * 0.3);
        ctx.lineTo(ex - es * 0.3, ey + es * 0.1);
        ctx.lineTo(ex + es * 0.3, ey + es * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex, ey - es * 0.6);
        ctx.lineTo(ex - es * 0.25, ey - es * 0.15);
        ctx.lineTo(ex + es * 0.25, ey - es * 0.15);
        ctx.closePath();
        ctx.fill();
      } else if (el.shape === 'cloud') {
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(ex, ey, es * 0.3, 0, Math.PI * 2);
        ctx.arc(ex + es * 0.25, ey - es * 0.1, es * 0.25, 0, Math.PI * 2);
        ctx.arc(ex - es * 0.25, ey - es * 0.05, es * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Ground
    ctx.fillStyle = `hsl(${(seed * 11) % 40 + 90}, 40%, 35%)`;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);

    // Draw the puzzle cutout (dark area where piece should go)
    const targetPx = (challengeData.targetX / 100) * w;
    const piecePx = (puzzleWidth / 100) * w;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    // Draw puzzle piece shape with a tab
    ctx.beginPath();
    ctx.moveTo(targetPx, 0);
    ctx.lineTo(targetPx + piecePx, 0);
    ctx.lineTo(targetPx + piecePx, h * 0.35);
    ctx.arc(targetPx + piecePx, h * 0.4, piecePx * 0.3, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(targetPx + piecePx, h);
    ctx.lineTo(targetPx, h);
    ctx.lineTo(targetPx, h * 0.4);
    ctx.arc(targetPx, h * 0.35, piecePx * 0.3, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();

    // Draw border around cutout
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [seed, sceneElements, challengeData.targetX]);

  // Draw the puzzle piece that slides
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We redraw the piece overlay on each slider change
    // Clear the piece area first by redrawing everything
    // This is handled by the main draw effect, so we just draw the piece here

    const w = canvasWidth;
    const h = canvasHeight;
    const piecePx = (puzzleWidth / 100) * w;
    const pieceStartPx = (challengeData.pieceX / 100) * w;
    const currentPx = pieceStartPx + (sliderX / 100) * (w - pieceStartPx - piecePx);

    // Draw the piece with the correct content (we'll use a simple colored rectangle for now)
    // In a real implementation, we'd clip from the background
    ctx.save();

    // Create the puzzle piece shape
    ctx.beginPath();
    ctx.moveTo(currentPx, 0);
    ctx.lineTo(currentPx + piecePx, 0);
    ctx.lineTo(currentPx + piecePx, h * 0.35);
    ctx.arc(currentPx + piecePx, h * 0.4, piecePx * 0.3, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(currentPx + piecePx, h);
    ctx.lineTo(currentPx, h);
    ctx.lineTo(currentPx, h * 0.4);
    ctx.arc(currentPx, h * 0.35, piecePx * 0.3, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.clip();

    // Fill with a semi-transparent version of the gradient
    const pieceGrad = ctx.createLinearGradient(currentPx, 0, currentPx + piecePx, h);
    const hue1 = (seed * 37) % 360;
    pieceGrad.addColorStop(0, `hsl(${hue1}, 60%, 55%)`);
    pieceGrad.addColorStop(0.6, `hsl(${(hue1 + 30) % 360}, 50%, 65%)`);
    pieceGrad.addColorStop(1, `hsl(${(hue1 + 60) % 360}, 40%, 75%)`);
    ctx.fillStyle = pieceGrad;
    ctx.fillRect(currentPx, 0, piecePx, h);

    // Ground in piece
    ctx.fillStyle = `hsl(${(seed * 11) % 40 + 90}, 40%, 35%)`;
    ctx.fillRect(currentPx, h * 0.75, piecePx, h * 0.25);

    // Add some detail to make it look like the scene
    ctx.fillStyle = `hsl(${(seed * 11) % 40 + 90}, 40%, 30%)`;
    ctx.fillRect(currentPx, h * 0.75, piecePx, 2);

    ctx.restore();

    // Draw piece border
    ctx.beginPath();
    ctx.moveTo(currentPx, 0);
    ctx.lineTo(currentPx + piecePx, 0);
    ctx.lineTo(currentPx + piecePx, h * 0.35);
    ctx.arc(currentPx + piecePx, h * 0.4, piecePx * 0.3, -Math.PI / 2, Math.PI / 2, false);
    ctx.lineTo(currentPx + piecePx, h);
    ctx.lineTo(currentPx, h);
    ctx.lineTo(currentPx, h * 0.4);
    ctx.arc(currentPx, h * 0.35, piecePx * 0.3, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [sliderX, seed, challengeData.pieceX]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartXRef.current;
      const sliderMax = containerRef.current.scrollWidth - 44;
      const newVal = Math.max(0, Math.min(100, (deltaX / sliderMax) * 100));
      setSliderX(newVal);
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Calculate where the piece is now
      const pieceStartPx = (challengeData.pieceX / 100) * canvasWidth;
      const piecePx = (puzzleWidth / 100) * canvasWidth;
      const currentPx = pieceStartPx + (sliderX / 100) * (canvasWidth - pieceStartPx - piecePx);
      const currentValue = (currentPx / canvasWidth) * 100;
      onVerify({ value: currentValue, tolerance: challengeData.tolerance });
    }
  }, [isDragging, sliderX, challengeData, onVerify]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900"
        style={{ width: '100%', maxWidth: '350px' }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-auto"
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {/* Slider track */}
      <div className="relative w-full max-w-[350px] h-10 bg-gray-800 rounded-lg border border-gray-700 flex items-center px-2">
        <span className="absolute left-3 text-xs text-gray-400 z-10 pointer-events-none">
          ⟵ Desliza →
        </span>
        <div
          ref={sliderRef}
          className="absolute left-2 w-10 h-8 bg-emerald-500 rounded-md cursor-grab active:cursor-grabbing flex items-center justify-center shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-colors select-none"
          style={{
            left: `${Math.min(sliderX / 100 * (100 - 12), 100 - 12)}%`,
            marginLeft: '0',
            position: 'relative',
            left: `${sliderX}%`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-gray-500 text-center">
        Desliza la pieza del rompecabezas para completar la imagen
      </p>
    </div>
  );
}
