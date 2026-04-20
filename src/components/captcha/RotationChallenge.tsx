'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface RotationChallengeProps {
  challengeData: {
    shapeType: 'cube' | 'prism';
    targetAngleX: number;
    targetAngleY: number;
    tolerance: number;
    timeLimit: number;
    vertices: number[][];
    edges: number[][];
  };
  onVerify: (response: { angleX: number; angleY: number; tolerance: number }) => void;
}

// Proyección perspectiva 3D
function project3D(vertex: number[], angleX: number, angleY: number): [number, number, number] {
  const [x, y, z] = vertex;
  const radX = (angleX * Math.PI) / 180;
  const radY = (angleY * Math.PI) / 180;

  // Rotación en X
  const y1 = y * Math.cos(radX) - z * Math.sin(radX);
  const z1 = y * Math.sin(radX) + z * Math.cos(radX);

  // Rotación en Y
  const x2 = x * Math.cos(radY) + z1 * Math.sin(radY);
  const z2 = -x * Math.sin(radY) + z1 * Math.cos(radY);

  // Proyección perspectiva
  const fov = 4;
  const scale = fov / (fov + z2);

  return [x2 * scale, y1 * scale, z2];
}

export default function RotationChallenge({ challengeData, onVerify }: RotationChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userAngleX, setUserAngleX] = useState(0);
  const [userAngleY, setUserAngleY] = useState(0);
  const [timeLeft, setTimeLeft] = useState(challengeData.timeLimit / 1000);

  const { shapeType, targetAngleX, targetAngleY, tolerance, vertices, edges } = challengeData;
  const canvasSize = 250;
  const scale = 60;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dibujar forma 3D
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvasSize;
    const h = canvasSize;
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Fondo
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(w - 12, 0);
    ctx.arcTo(w, 0, w, 12, 12);
    ctx.lineTo(w, h - 12);
    ctx.arcTo(w, h, w - 12, h, 12);
    ctx.lineTo(12, h);
    ctx.arcTo(0, h, 0, h - 12, 12);
    ctx.lineTo(0, 12);
    ctx.arcTo(0, 0, 12, 0, 12);
    ctx.closePath();
    ctx.fill();

    // Cuadrícula
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 25) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    // Dibujar forma con ángulo del usuario
    const projected = vertices.map(v => project3D(v, userAngleX, userAngleY));

    // Ordenar aristas por profundidad para pintar atrás-adelante
    const edgeData = edges.map(([a, b]) => {
      const avgZ = (projected[a][2] + projected[b][2]) / 2;
      return { a, b, avgZ };
    }).sort((a, b) => a.avgZ - b.avgZ);

    for (const edge of edgeData) {
      const [x1, y1, z1] = projected[edge.a];
      const [x2, y2, z2] = projected[edge.b];
      const avgZ = edge.avgZ;

      // Color basado en profundidad
      const brightness = Math.max(40, Math.min(90, 65 - avgZ * 15));
      ctx.strokeStyle = `hsl(160, 70%, ${brightness}%)`;
      ctx.lineWidth = 2 + (1 - avgZ * 0.1);
      ctx.shadowColor = 'rgba(16, 185, 129, 0.3)';
      ctx.shadowBlur = 4;

      ctx.beginPath();
      ctx.moveTo(halfW + x1 * scale, halfH + y1 * scale);
      ctx.lineTo(halfW + x2 * scale, halfH + y2 * scale);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Dibujar vértices
    for (let i = 0; i < projected.length; i++) {
      const [x, y, z] = projected[i];
      const radius = Math.max(2, 4 - z * 0.5);
      const brightness = Math.max(50, Math.min(95, 70 - z * 15));

      ctx.fillStyle = `hsl(160, 70%, ${brightness}%)`;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(halfW + x * scale, halfH + y * scale, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Indicador de ángulo actual
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`X: ${userAngleX.toFixed(0)}° Y: ${userAngleY.toFixed(0)}°`, halfW, h - 15);

  }, [userAngleX, userAngleY, vertices, edges, canvasSize]);

  // Dibujar vista previa del objetivo (pequeña)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Indicador del ángulo objetivo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`Objetivo: X=${targetAngleX}° Y=${targetAngleY}° (±${tolerance}°)`, canvasSize / 2, 18);
  }, [targetAngleX, targetAngleY, tolerance]);

  const handleVerify = useCallback(() => {
    onVerify({ angleX: userAngleX, angleY: userAngleY, tolerance });
  }, [userAngleX, userAngleY, tolerance, onVerify]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">🔄 {shapeType === 'cube' ? 'Rotación de cubo' : 'Rotación de prisma'}</span>
        <span className={`text-xs font-mono font-bold ${timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      <div className="flex justify-center">
        <canvas ref={canvasRef} width={canvasSize} height={canvasSize} className="rounded-lg border border-gray-700 max-w-full" />
      </div>

      <div className="space-y-3 max-w-xs mx-auto">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Eje X (vertical)</span>
            <span className="font-mono">{userAngleX.toFixed(0)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={userAngleX}
            onChange={e => setUserAngleX(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Eje Y (horizontal)</span>
            <span className="font-mono">{userAngleY.toFixed(0)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={userAngleY}
            onChange={e => setUserAngleY(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleVerify}
          className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25"
        >
          Verificar rotación
        </button>
      </div>
    </div>
  );
}
