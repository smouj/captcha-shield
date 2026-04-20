'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MathVisualChallengeProps {
  challengeData: {
    equation: string;
    answer: number;
    noiseLines: number;
    distortion: number;
  };
  onVerify: (response: { answer: number }) => void;
}

function drawDistortedChar(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  distortion: number,
  fontSize: number
) {
  ctx.save();

  // Random rotation
  const rotation = (Math.random() - 0.5) * distortion * 0.3;
  const offsetX = (Math.random() - 0.5) * distortion * 8;
  const offsetY = (Math.random() - 0.5) * distortion * 6;

  ctx.translate(x + offsetX, y + offsetY);
  ctx.rotate(rotation);

  // Draw with slight scale variation
  const scaleX = 1 + (Math.random() - 0.5) * distortion * 0.2;
  const scaleY = 1 + (Math.random() - 0.5) * distortion * 0.15;
  ctx.scale(scaleX, scaleY);

  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, 0, 0);

  ctx.restore();
}

export default function MathVisualChallenge({ challengeData, onVerify }: MathVisualChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const seedRef = useRef(Math.floor(Math.random() * 100000));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const seed = seedRef.current;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Draw noise lines
    const rng = (n: number) => ((seed * 31 + n * 17) * 13 + n * 7) % 1000;
    for (let i = 0; i < challengeData.noiseLines; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${rng(i * 3) % 200 + 55}, ${rng(i * 3 + 1) % 200 + 55}, ${rng(i * 3 + 2) % 200 + 55}, 0.3)`;
      ctx.lineWidth = 1 + (rng(i + 100) % 3);
      const startX = rng(i + 200) % w;
      const startY = rng(i + 300) % h;
      ctx.moveTo(startX, startY);
      for (let j = 0; j < 5; j++) {
        ctx.lineTo(
          startX + (rng(i * 5 + j + 400) % 200) - 100,
          startY + (rng(i * 5 + j + 500) % 150) - 75
        );
      }
      ctx.stroke();
    }

    // Draw noise dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${rng(i + 600) % 200 + 55}, ${rng(i + 700) % 200 + 55}, ${rng(i + 800) % 200 + 55}, 0.2)`;
      ctx.beginPath();
      ctx.arc(rng(i + 900) % w, rng(i + 1000) % h, 1 + rng(i + 1100) % 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw the equation
    const chars = challengeData.equation.split('');
    const fontSize = 36;
    const charSpacing = 28;
    const totalWidth = chars.length * charSpacing;
    const startX = (w - totalWidth) / 2 + charSpacing / 2;
    const centerY = h / 2;

    chars.forEach((char, i) => {
      drawDistortedChar(ctx, char, startX + i * charSpacing, centerY, challengeData.distortion, fontSize);
    });

    // Add a subtle glow effect behind the equation
    ctx.globalCompositeOperation = 'destination-over';
    const glowGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, totalWidth);
    glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
    glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    // Border
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  }, [challengeData.equation, challengeData.noiseLines, challengeData.distortion]);

  const handleSubmit = useCallback(() => {
    const num = parseInt(userAnswer, 10);
    if (!isNaN(num)) {
      onVerify({ answer: num });
    }
  }, [userAnswer, onVerify]);

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={380}
          height={120}
          className="rounded-lg border border-gray-700 max-w-full"
        />
      </div>

      {/* Instruction */}
      <p className="text-sm text-gray-400 text-center">
        Resuelve la ecuación mostrada arriba
      </p>

      {/* Input */}
      <div className="flex gap-2 justify-center max-w-xs mx-auto">
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Tu respuesta..."
          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!userAnswer}
          className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-600/25"
        >
          Verificar
        </button>
      </div>
    </div>
  );
}
