'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Rotation3DChallengeData } from '@/lib/captcha-engine';

interface Props {
  challengeData: Rotation3DChallengeData;
  onVerify: (response: { rotationX: number; rotationY: number }) => void;
}

function project3D(x: number, y: number, z: number, rotX: number, rotY: number): [number, number] {
  // Rotate Y
  let rx = x * Math.cos(rotY) - z * Math.sin(rotY);
  let rz = x * Math.sin(rotY) + z * Math.cos(rotY);
  let ry = y;
  // Rotate X
  let ry2 = ry * Math.cos(rotX) - rz * Math.sin(rotX);
  let rz2 = ry * Math.sin(rotX) + rz * Math.cos(rotX);
  // Perspective
  const scale = 300 / (300 + rz2);
  return [rx * scale, ry2 * scale];
}

function draw3DShape(ctx: CanvasRenderingContext2D, shape: string, rotX: number, rotY: number, cx: number, cy: number, s: number, color: string) {
  const rX = (rotX * Math.PI) / 180;
  const rY = (rotY * Math.PI) / 180;

  if (shape === 'cube') {
    const vertices = [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s],
    ];
    const faces = [
      [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
      [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5],
    ];
    const projected = vertices.map(v => project3D(v[0], v[1], v[2], rX, rY));

    // Sort faces by average z (painter's algorithm)
    const faceDepths = faces.map((face, i) => ({
      face,
      depth: face.reduce((sum, vi) => {
        const [,,z] = (() => {
          const x = vertices[vi][0], y = vertices[vi][1], z = vertices[vi][2];
          let rz = x * Math.sin(rY) + z * Math.cos(rY);
          return [0, 0, rz];
        })();
        return sum + z;
      }, 0) / face.length,
      idx: i,
    }));
    faceDepths.sort((a, b) => a.depth - b.depth);

    for (const { face } of faceDepths) {
      ctx.beginPath();
      face.forEach((vi, i) => {
        const [px, py] = projected[vi];
        if (i === 0) ctx.moveTo(cx + px, cy + py);
        else ctx.lineTo(cx + px, cy + py);
      });
      ctx.closePath();
      const shade = faceDepths.indexOf(faceDepths.find(f => f.face === face)!) * 0.12;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3 + shade;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (shape === 'prism') {
    const top = [[-s, -s * 0.6, 0], [s, -s * 0.6, 0], [0, -s * 0.6, -s * 1.2]];
    const bot = [[-s, s * 0.6, 0], [s, s * 0.6, 0], [0, s * 0.6, -s * 1.2]];
    const allVerts = [...top, ...bot];
    const projected = allVerts.map(v => project3D(v[0], v[1], v[2], rX, rY));

    const faces = [
      [0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [0, 2, 5, 3],
    ];

    for (const face of faces) {
      ctx.beginPath();
      face.forEach((vi, i) => {
        const [px, py] = projected[vi];
        if (i === 0) ctx.moveTo(cx + px, cy + py);
        else ctx.lineTo(cx + px, cy + py);
      });
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else {
    // Pyramid
    const apex = [0, -s, 0];
    const base = [[-s, s, -s], [s, s, -s], [s, s, s], [-s, s, s]];
    const allVerts = [apex, ...base];
    const projected = allVerts.map(v => project3D(v[0], v[1], v[2], rX, rY));

    const faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [1, 2, 3, 4],
    ];

    for (const face of faces) {
      ctx.beginPath();
      face.forEach((vi, i) => {
        const [px, py] = projected[vi];
        if (i === 0) ctx.moveTo(cx + px, cy + py);
        else ctx.lineTo(cx + px, cy + py);
      });
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

export default function Rotation3DChallenge({ challengeData, onVerify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userRotX, setUserRotX] = useState(0);
  const [userRotY, setUserRotY] = useState(0);
  const canvasSize = 280;

  const { shapeType, targetRotationX, targetRotationY } = challengeData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(0, 0, canvasSize, canvasSize, 10);
    ctx.fill();

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < canvasSize; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasSize, i); ctx.stroke();
    }

    // User shape
    draw3DShape(ctx, shapeType, userRotX, userRotY, canvasSize / 2, canvasSize / 2 - 10, 40, '#10b981');

    // Border
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasSize - 1, canvasSize - 1);
  }, [userRotX, userRotY, shapeType, canvasSize]);

  const handleVerify = useCallback(() => {
    onVerify({ rotationX: userRotX, rotationY: userRotY });
  }, [userRotX, userRotY, onVerify]);

  const shapeLabels: Record<string, string> = { cube: 'Cubo', prism: 'Prisma', pyramid: 'Pirámide' };

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-center">
        <p className="text-xs font-medium text-emerald-300">
          Rota el {shapeLabels[shapeType]} para que coincida con el ángulo objetivo
        </p>
        <p className="text-[10px] text-gray-500 mt-1">
          Objetivo: X={targetRotationX}° Y={targetRotationY}°
        </p>
      </motion.div>

      <div className="flex justify-center">
        <canvas ref={canvasRef} width={canvasSize} height={canvasSize}
          className="rounded-lg border border-gray-700 max-w-full" />
      </div>

      <div className="max-w-[300px] mx-auto space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 w-8">Eje X</span>
          <input type="range" min="0" max="360" value={userRotX}
            onChange={(e) => setUserRotX(parseInt(e.target.value))}
            className="flex-1 accent-emerald-500" />
          <span className="text-[10px] text-gray-400 font-mono w-8">{userRotX}°</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 w-8">Eje Y</span>
          <input type="range" min="0" max="360" value={userRotY}
            onChange={(e) => setUserRotY(parseInt(e.target.value))}
            className="flex-1 accent-emerald-500" />
          <span className="text-[10px] text-gray-400 font-mono w-8">{userRotY}°</span>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={handleVerify}
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25">
          Verificar rotación
        </button>
      </div>
    </div>
  );
}
