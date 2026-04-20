'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { MathVisualChallengeData } from '@/lib/captcha-engine';

interface Props {
  challengeData: MathVisualChallengeData;
  onVerify: (response: { answer: number }) => void;
}

export default function MathVisualChallenge({ challengeData, onVerify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const seedRef = useRef(Math.floor(Math.random() * 100000));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    const seed = seedRef.current;
    const rng = (n: number) => ((seed * 31 + n * 17) * 13 + n * 7) % 1000;

    // Fondo
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 15) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    for (let i = 0; i < h; i += 15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

    // Líneas de ruido
    for (let i = 0; i < challengeData.noiseLines; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${rng(i * 3) % 200 + 55}, ${rng(i * 3 + 1) % 200 + 55}, ${rng(i * 3 + 2) % 200 + 55}, 0.35)`;
      ctx.lineWidth = 1 + (rng(i + 100) % 3);
      const sx = rng(i + 200) % w, sy = rng(i + 300) % h;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 6; j++) {
        ctx.lineTo(sx + (rng(i * 5 + j + 400) % 250) - 125, sy + (rng(i * 5 + j + 500) % 180) - 90);
      }
      ctx.stroke();
    }

    // Puntos de ruido
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(${rng(i + 600) % 200 + 55}, ${rng(i + 700) % 200 + 55}, ${rng(i + 800) % 200 + 55}, 0.25)`;
      ctx.beginPath();
      ctx.arc(rng(i + 900) % w, rng(i + 1000) % h, 0.5 + rng(i + 1100) % 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ecuación distorsionada
    const chars = challengeData.equation.split('');
    const fontSize = 32;
    const charSpacing = 26;
    const totalWidth = chars.length * charSpacing;
    const startX = (w - totalWidth) / 2 + charSpacing / 2;
    const centerY = h / 2;

    chars.forEach((char, i) => {
      ctx.save();
      const rotation = (Math.random() - 0.5) * challengeData.distortion * 0.4;
      const offX = (Math.random() - 0.5) * challengeData.distortion * 10;
      const offY = (Math.random() - 0.5) * challengeData.distortion * 8;
      const scaleX = 1 + (Math.random() - 0.5) * challengeData.distortion * 0.25;
      const scaleY = 1 + (Math.random() - 0.5) * challengeData.distortion * 0.2;

      ctx.translate(startX + i * charSpacing + offX, centerY + offY);
      ctx.rotate(rotation);
      ctx.scale(scaleX, scaleY);

      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    // Glow
    ctx.globalCompositeOperation = 'destination-over';
    const glow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, totalWidth);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
    glow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }, [challengeData]);

  const handleSubmit = useCallback(() => {
    const num = parseInt(userAnswer, 10);
    if (!isNaN(num)) onVerify({ answer: num });
  }, [userAnswer, onVerify]);

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <canvas ref={canvasRef} width={380} height={100} className="rounded-lg border border-gray-700 max-w-full" />
      </div>
      <p className="text-xs text-gray-500 text-center">Resuelve la ecuación con distorsión</p>
      <div className="flex gap-2 justify-center max-w-xs mx-auto">
        <input type="number" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Respuesta..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
          autoFocus />
        <button onClick={handleSubmit} disabled={!userAnswer}
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/25">
          Verificar
        </button>
      </div>
    </div>
  );
}
