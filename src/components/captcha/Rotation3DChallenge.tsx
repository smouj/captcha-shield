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

// Compute full 3D z-depth after both rotations
function computeDepth(x: number, y: number, z: number, rotX: number, rotY: number): number {
  // Rotate Y
  const rz = x * Math.sin(rotY) + z * Math.cos(rotY);
  const ry = y;
  // Rotate X
  const rz2 = ry * Math.sin(rotX) + rz * Math.cos(rotX);
  return rz2;
}

function draw3DShape(ctx: CanvasRenderingContext2D, shape: string, rotX: number, rotY: number, cx: number, cy: number, s: number, color: string, doSort: boolean = true) {
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

    // Sort faces by average z (painter's algorithm) - FIXED: use full rotation
    const faceDepths = faces.map((face, i) => ({
      face,
      depth: face.reduce((sum, vi) => {
        return sum + computeDepth(vertices[vi][0], vertices[vi][1], vertices[vi][2], rX, rY);
      }, 0) / face.length,
      idx: i,
    }));
    if (doSort) faceDepths.sort((a, b) => a.depth - b.depth);

    faceDepths.forEach(({ face }, sortedIdx) => {
      ctx.beginPath();
      face.forEach((vi, i) => {
        const [px, py] = projected[vi];
        if (i === 0) ctx.moveTo(cx + px, cy + py);
        else ctx.lineTo(cx + px, cy + py);
      });
      ctx.closePath();
      const shade = sortedIdx * 0.12;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3 + shade;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  } else if (shape === 'prism') {
    const top = [[-s, -s * 0.6, 0], [s, -s * 0.6, 0], [0, -s * 0.6, -s * 1.2]];
    const bot = [[-s, s * 0.6, 0], [s, s * 0.6, 0], [0, s * 0.6, -s * 1.2]];
    const allVerts = [...top, ...bot];
    const projected = allVerts.map(v => project3D(v[0], v[1], v[2], rX, rY));

    const faces = [
      [0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [0, 2, 5, 3],
    ];

    if (doSort) {
      const faceDepths = faces.map((face, i) => ({
        face,
        depth: face.reduce((sum, vi) => {
          return sum + computeDepth(allVerts[vi][0], allVerts[vi][1], allVerts[vi][2], rX, rY);
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
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else {
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
  } else {
    // Pyramid
    const apex = [0, -s, 0];
    const base = [[-s, s, -s], [s, s, -s], [s, s, s], [-s, s, s]];
    const allVerts = [apex, ...base];
    const projected = allVerts.map(v => project3D(v[0], v[1], v[2], rX, rY));

    const faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1], [1, 2, 3, 4],
    ];

    if (doSort) {
      const faceDepths = faces.map((face, i) => ({
        face,
        depth: face.reduce((sum, vi) => {
          return sum + computeDepth(allVerts[vi][0], allVerts[vi][1], allVerts[vi][2], rX, rY);
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
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else {
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
}

function drawRoundRectBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(w - 10, 0);
  ctx.arcTo(w, 0, w, 10, 10);
  ctx.lineTo(w, h - 10);
  ctx.arcTo(w, h, w - 10, h, 10);
  ctx.lineTo(10, h);
  ctx.arcTo(0, h, 0, h - 10, 10);
  ctx.lineTo(0, 10);
  ctx.arcTo(0, 0, 10, 0, 10);
  ctx.closePath();
}

export default function Rotation3DChallenge({ challengeData, onVerify }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement>(null);
  const [userRotX, setUserRotX] = useState(0);
  const [userRotY, setUserRotY] = useState(0);
  const canvasSize = 280;
  const targetSize = 120;

  const { shapeType, targetRotationX, targetRotationY } = challengeData;

  // Draw target shape (reference)
  useEffect(() => {
    const canvas = targetCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.fillStyle = '#1e293b';
    drawRoundRectBg(ctx, targetSize, targetSize);
    ctx.fill();

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < targetSize; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, targetSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(targetSize, i); ctx.stroke();
    }

    // Target shape (smaller)
    draw3DShape(ctx, shapeType, targetRotationX, targetRotationY, targetSize / 2, targetSize / 2, 25, '#f59e0b', true);

    // Border
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, targetSize - 1, targetSize - 1);
  }, [shapeType, targetRotationX, targetRotationY, targetSize]);

  // Draw user shape (main canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = '#0f172a';
    drawRoundRectBg(ctx, canvasSize);
    ctx.fill();

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < canvasSize; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvasSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvasSize, i); ctx.stroke();
    }

    // User shape
    draw3DShape(ctx, shapeType, userRotX, userRotY, canvasSize / 2, canvasSize / 2 - 10, 40, '#10b981', true);

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
          Rota el {shapeLabels[shapeType]} hasta que coincida con el objetivo
        </p>
      </motion.div>

      <div className="flex items-start gap-3 justify-center">
        {/* Target reference */}
        <div className="flex-shrink-0">
          <p className="text-[9px] text-amber-400 font-medium text-center mb-1">Objetivo</p>
          <canvas ref={targetCanvasRef} width={targetSize} height={targetSize}
            className="rounded-lg border border-amber-500/30" />
        </div>

        {/* User shape */}
        <div className="flex-shrink-0">
          <p className="text-[9px] text-emerald-400 font-medium text-center mb-1">Tu figura</p>
          <canvas ref={canvasRef} width={canvasSize} height={canvasSize}
            className="rounded-lg border border-gray-700 max-w-full" />
        </div>
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
