'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { PatternTraceChallengeData } from '@/lib/captcha-engine';

interface Props {
  challengeData: PatternTraceChallengeData;
  onVerify: (response: { sequence: number[] }) => void;
}

export default function PatternTraceChallenge({ challengeData, onVerify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [phase, setPhase] = useState<'preview' | 'solve'>('preview');
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  const { points, connections, sequence, showTime } = challengeData;
  const size = 300;
  const dotR = 16;

  const pixelPoints = points.map(p => ({
    id: p.id,
    px: (p.x / 100) * size,
    py: (p.y / 100) * size,
  }));

  // Preview phase timer
  useEffect(() => {
    const timer = setTimeout(() => setPhase('solve'), showTime);
    return () => clearTimeout(timer);
  }, [showTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    // Fondo
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 10);
    ctx.fill();

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 30) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }

    // Conexiones guía
    if (phase === 'preview') {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < connections.length; i++) {
        const [from, to] = connections[i];
        const p1 = pixelPoints.find(p => p.id === from);
        const p2 = pixelPoints.find(p => p.id === to);
        if (i === 0 && p1) ctx.moveTo(p1.px, p1.py);
        if (p2) ctx.lineTo(p2.px, p2.py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Líneas punteadas sutiles
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (const [from, to] of connections) {
        const p1 = pixelPoints.find(p => p.id === from);
        const p2 = pixelPoints.find(p => p.id === to);
        if (p1 && p2) {
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
        }
      }
      ctx.setLineDash([]);

      // Líneas trazadas por usuario
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
    }

    // Dots
    for (const pt of pixelPoints) {
      const isSelected = userSequence.includes(pt.id);
      const order = userSequence.indexOf(pt.id);
      const isHovered = hoveredDot === pt.id;

      ctx.beginPath();
      ctx.arc(pt.px, pt.py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? 'rgba(16, 185, 129, 0.2)'
        : isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#10b981' : isHovered ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pt.px, pt.py, isSelected ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#10b981' : 'rgba(255,255,255,0.4)';
      ctx.fill();

      if (isSelected && order >= 0) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${order + 1}`, pt.px, pt.py - dotR - 8);
      }

      if (phase === 'preview') {
        const previewOrder = sequence.indexOf(pt.id);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`${previewOrder + 1}`, pt.px, pt.py - dotR - 8);
      }
    }

    // Overlay para preview
    if (phase === 'preview') {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.fillRect(0, 0, size, size);
    }
  }, [userSequence, phase, hoveredDot, pixelPoints, connections, sequence]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'solve') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = size / rect.width, sy = size / rect.height;
    const cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy;

    let closestId: number | null = null;
    let closestDist = Infinity;
    for (const pt of pixelPoints) {
      const dist = Math.hypot(pt.px - cx, pt.py - cy);
      if (dist < dotR + 8 && dist < closestDist) { closestDist = dist; closestId = pt.id; }
    }

    if (closestId !== null) {
      if (userSequence.includes(closestId)) {
        if (userSequence[userSequence.length - 1] === closestId) {
          setUserSequence(prev => prev.slice(0, -1));
        }
        return;
      }

      const newSeq = [...userSequence, closestId];
      setUserSequence(newSeq);

      if (newSeq.length === sequence.length) {
        setTimeout(() => onVerify({ sequence: newSeq }), 300);
      }
    }
  }, [phase, userSequence, sequence, pixelPoints, dotR, onVerify]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== 'solve') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (size / rect.width);
    const my = (e.clientY - rect.top) * (size / rect.height);
    let hovered: number | null = null;
    for (const pt of pixelPoints) {
      if (Math.hypot(pt.px - mx, pt.py - my) < dotR + 8) { hovered = pt.id; break; }
    }
    setHoveredDot(hovered);
  }, [phase, pixelPoints, dotR]);

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg px-3 py-2.5 text-center ${phase === 'preview' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
        <p className={`text-xs font-medium ${phase === 'preview' ? 'text-amber-300' : 'text-emerald-300'}`}>
          {phase === 'preview'
            ? `Memoriza el patrón (${Math.ceil(showTime / 1000)}s)...`
            : `Reproduce el patrón (${userSequence.length}/${sequence.length})`}
        </p>
      </motion.div>

      <div className="flex justify-center">
        <canvas ref={canvasRef} width={size} height={size}
          onClick={handleClick} onMouseMove={handleMove} onMouseLeave={() => setHoveredDot(null)}
          className={`rounded-lg cursor-pointer max-w-full border border-gray-700 ${phase === 'preview' ? 'opacity-90' : ''}`}
          style={{ touchAction: 'none' }} />
      </div>

      {phase === 'solve' && (
        <div className="flex items-center gap-3 max-w-[300px] mx-auto">
          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-emerald-500 rounded-full"
              animate={{ width: `${(userSequence.length / sequence.length) * 100}%` }} transition={{ duration: 0.2 }} />
          </div>
          <span className="text-xs text-gray-500 font-mono">{userSequence.length}/{sequence.length}</span>
        </div>
      )}

      {phase === 'solve' && (
        <div className="flex justify-center">
          <button onClick={() => setUserSequence([])}
            className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
            Reiniciar
          </button>
        </div>
      )}
    </div>
  );
}
