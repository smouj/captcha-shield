'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Box, RotateCcw } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType, ChallengeDifficulty } from '@/lib/types';

interface Rotation3D {
  x: number;
  y: number;
  z: number;
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function rotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function rotateZ(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}

function project(v: Vec3, cx: number, cy: number, fov: number): { x: number; y: number; z: number } {
  const scale = fov / (fov + v.z);
  return { x: cx + v.x * scale, y: cy + v.y * scale, z: v.z };
}

function getToleranceDeg(difficulty: ChallengeDifficulty): number {
  switch (difficulty) {
    case ChallengeDifficulty.EASY: return 15;
    case ChallengeDifficulty.MEDIUM: return 10;
    case ChallengeDifficulty.HARD: return 5;
    case ChallengeDifficulty.EXTREME: return 3;
    default: return 10;
  }
}

type ObjType = 'cube' | 'prism' | 'dodecahedron';

function getVertices(type: ObjType): Vec3[] {
  const s = 50;
  switch (type) {
    case 'cube':
      return [
        { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
        { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
        { x: -s, y: -s, z: s }, { x: s, y: -s, z: s },
        { x: s, y: s, z: s }, { x: -s, y: s, z: s },
      ];
    case 'prism': {
      const h = s * 0.7;
      const r = s * 0.8;
      const top: Vec3[] = [];
      const bottom: Vec3[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = Math.cos(angle) * r;
        const pz = Math.sin(angle) * r;
        top.push({ x: px, y: -h, z: pz });
        bottom.push({ x: px, y: h, z: pz });
      }
      return [...top, ...bottom];
    }
    case 'dodecahedron': {
      const phi = (1 + Math.sqrt(5)) / 2;
      const a = s * 0.5;
      const b = s * 0.5 / phi;
      return [
        { x: a, y: a, z: a }, { x: a, y: a, z: -a }, { x: a, y: -a, z: a },
        { x: a, y: -a, z: -a }, { x: -a, y: a, z: a }, { x: -a, y: a, z: -a },
        { x: -a, y: -a, z: a }, { x: -a, y: -a, z: -a },
        { x: 0, y: b, z: a * phi }, { x: 0, y: b, z: -a * phi },
        { x: 0, y: -b, z: a * phi }, { x: 0, y: -b, z: -a * phi },
        { x: b, y: a * phi, z: 0 }, { x: b, y: -a * phi, z: 0 },
        { x: -b, y: a * phi, z: 0 }, { x: -b, y: -a * phi, z: 0 },
        { x: a * phi, y: 0, z: b }, { x: a * phi, y: 0, z: -b },
        { x: -a * phi, y: 0, z: b }, { x: -a * phi, y: 0, z: -b },
      ];
    }
    default:
      return [];
  }
}

function getEdges(type: ObjType): [number, number][] {
  switch (type) {
    case 'cube':
      return [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];
    case 'prism':
      return [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
        [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6],
        [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
      ];
    case 'dodecahedron': {
      const edges: [number, number][] = [];
      const verts = getVertices('dodecahedron');
      const threshold = 60;
      for (let i = 0; i < verts.length; i++) {
        for (let j = i + 1; j < verts.length; j++) {
          const dx = verts[i].x - verts[j].x;
          const dy = verts[i].y - verts[j].y;
          const dz = verts[i].z - verts[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < threshold) edges.push([i, j]);
        }
      }
      return edges;
    }
    default:
      return [];
  }
}

export default function Live3DBiometricChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState<Rotation3D>({ x: 0, y: 0, z: 0 });
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 60);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const solvedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const objectType = (instance.payload.objectType as ObjType) ?? 'cube';
  const targetRotation = useMemo<Rotation3D>(
    () => (instance.payload.targetRotation as Rotation3D) ?? { x: 45, y: 45, z: 0 },
    [instance.payload.targetRotation],
  );
  const toleranceDeg = (instance.payload.tolerance as number) ?? getToleranceDeg(instance.difficulty);

  const vertices = useMemo(() => getVertices(objectType), [objectType]);
  const edges = useMemo(() => getEdges(objectType), [objectType]);

  const canvasW = 240;
  const canvasH = 240;
  const fov = 300;
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  // Timer
  useEffect(() => {
    if (solved || failed) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!solvedRef.current) {
            setFailed(true);
            onFail('Time ran out');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [solved, failed, onFail]);

  // Render 3D object on a canvas
  const renderObject = useCallback(
    (
      canvas: HTMLCanvasElement | null,
      rot: Rotation3D,
      showAxes: boolean,
      highlight: boolean,
    ) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isDark = theme === 'dark';
      ctx.clearRect(0, 0, canvasW, canvasH);

      // Background
      ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f5';
      ctx.fillRect(0, 0, canvasW, canvasH);

      const rx = (rot.x * Math.PI) / 180;
      const ry = (rot.y * Math.PI) / 180;
      const rz = (rot.z * Math.PI) / 180;

      // Transform vertices
      const projected = vertices.map(v => {
        let tv = rotateX(v, rx);
        tv = rotateY(tv, ry);
        tv = rotateZ(tv, rz);
        return project(tv, cx, cy, fov);
      });

      // Sort edges by average z for painter's algorithm
      const sortedEdges = [...edges].sort((a, b) => {
        const za = (projected[a[0]].z + projected[a[1]].z) / 2;
        const zb = (projected[b[0]].z + projected[b[1]].z) / 2;
        return zb - za;
      });

      // Draw edges
      for (const [i, j] of sortedEdges) {
        const p1 = projected[i];
        const p2 = projected[j];
        const avgZ = (p1.z + p2.z) / 2;
        const brightness = 0.4 + 0.6 * ((avgZ + 100) / 200);

        const edgeColor = highlight
          ? `rgba(16,185,129,${Math.min(1, brightness)})`
          : isDark
            ? `rgba(180,180,220,${Math.min(1, brightness * 0.8)})`
            : `rgba(80,80,120,${Math.min(1, brightness * 0.8)})`;

        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = highlight ? 2.5 : 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw vertices
      for (const p of projected) {
        const brightness = 0.5 + 0.5 * ((p.z + 100) / 200);
        const vertColor = highlight
          ? `rgba(16,185,129,${Math.min(1, brightness)})`
          : isDark
            ? `rgba(200,200,240,${Math.min(1, brightness)})`
            : `rgba(60,60,100,${Math.min(1, brightness)})`;
        ctx.fillStyle = vertColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, highlight ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Axes
      if (showAxes) {
        const axisLen = 70;
        const axes: [Vec3, string][] = [
          [{ x: axisLen, y: 0, z: 0 }, '#ef4444'],
          [{ x: 0, y: axisLen, z: 0 }, '#10b981'],
          [{ x: 0, y: 0, z: axisLen }, '#3b82f6'],
        ];
        const labels = ['X', 'Y', 'Z'];

        for (let ai = 0; ai < axes.length; ai++) {
          const [axis, color] = axes[ai];
          let tv = rotateX(axis, rx);
          tv = rotateY(tv, ry);
          tv = rotateZ(tv, rz);
          const p = project(tv, cx, cy, fov);

          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = color;
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(labels[ai], p.x + (p.x > cx ? 8 : -8), p.y + (p.y > cy ? 10 : -6));
        }
      }

      // Object label
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(objectType.toUpperCase(), canvasW / 2, canvasH - 6);
    },
    [theme, vertices, edges, objectType, fov, cx, cy],
  );

  // Render current rotation
  useEffect(() => {
    renderObject(canvasRef.current, rotation, true, false);
  }, [rotation, renderObject]);

  // Render target rotation
  useEffect(() => {
    renderObject(targetCanvasRef.current, targetRotation, false, true);
  }, [targetRotation, renderObject]);

  // Check match callback
  const checkMatch = useCallback((rot: Rotation3D) => {
    if (solvedRef.current) return;
    const dx = Math.abs(rot.x - targetRotation.x);
    const dy = Math.abs(rot.y - targetRotation.y);
    const dz = Math.abs(rot.z - targetRotation.z);
    // Handle angle wrapping
    const angDiff = (a: number, b: number) => {
      const diff = Math.abs(a - b) % 360;
      return Math.min(diff, 360 - diff);
    };

    if (
      angDiff(rot.x, targetRotation.x) <= toleranceDeg &&
      angDiff(rot.y, targetRotation.y) <= toleranceDeg &&
      angDiff(rot.z, targetRotation.z) <= toleranceDeg
    ) {
      solvedRef.current = true;
      setSolved(true);
      onSolve({
        type: ChallengeType.LIVE_3D_BIOMETRIC,
        answer: { x: rot.x, y: rot.y, z: rot.z },
        tolerance: toleranceDeg,
        metadata: { targetRotation, deviation: { dx, dy, dz } },
      });
    }
  }, [targetRotation, toleranceDeg, onSolve]);

  // Check match on rotation change (via scheduler to avoid effect setState)
  useEffect(() => {
    const timeout = setTimeout(() => checkMatch(rotation), 0);
    return () => clearTimeout(timeout);
  }, [rotation, checkMatch]);

  // Drag rotation
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      setIsDragging(true);
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      canvasRef.current?.setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      setRotation(prev => ({
        x: ((prev.x + dy * 0.5) % 360 + 360) % 360,
        y: ((prev.y + dx * 0.5) % 360 + 360) % 360,
        z: prev.z,
      }));
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSliderChange = useCallback(
    (axis: 'x' | 'y' | 'z', value: number) => {
      setRotation(prev => ({ ...prev, [axis]: value }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setRotation({ x: 0, y: 0, z: 0 });
  }, []);

  // Compute angular differences
  const angleDiff = (a: number, b: number) => {
    const diff = Math.abs(a - b) % 360;
    return Math.min(diff, 360 - diff);
  };

  const diffs = useMemo(() => ({
    x: angleDiff(rotation.x, targetRotation.x),
    y: angleDiff(rotation.y, targetRotation.y),
    z: angleDiff(rotation.z, targetRotation.z),
  }), [rotation, targetRotation]);

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 60) - timeLeft) / (timeLimit ?? 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-lg mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">3D Biometric</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`text-xs font-mono ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
      >
        Match the green target orientation by dragging or using sliders. Tolerance: ±{toleranceDeg}°
      </motion.p>

      {/* Timer bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${(1 - timerPercent) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Two canvases side by side */}
      <div className="flex gap-3 justify-center">
        <div className="flex flex-col items-center">
          <span className={`text-[10px] mb-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            TARGET
          </span>
          <canvas
            ref={targetCanvasRef}
            width={canvasW}
            height={canvasH}
            className={`rounded-lg border-2 border-emerald-500/40 ${isDark ? '' : ''}`}
            style={{ width: '100%', maxWidth: `${canvasW}px` }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className={`text-[10px] mb-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            YOURS
          </span>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className={`rounded-lg border-2 cursor-grab active:cursor-grabbing ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
            style={{ width: '100%', maxWidth: `${canvasW}px`, touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>
      </div>

      {/* Sliders */}
      <div className="mt-4 space-y-2">
        {(['x', 'y', 'z'] as const).map(axis => (
          <div key={axis} className="flex items-center gap-2">
            <span className={`text-xs font-mono w-4 ${axis === 'x' ? 'text-red-500' : axis === 'y' ? 'text-emerald-500' : 'text-blue-500'}`}>
              {axis.toUpperCase()}
            </span>
            <input
              type="range"
              min="0"
              max="359"
              step="1"
              value={rotation[axis]}
              onChange={e => handleSliderChange(axis, Number(e.target.value))}
              className="flex-1 h-1.5 accent-emerald-500"
            />
            <span className={`text-xs font-mono w-10 text-right ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {Math.round(rotation[axis])}°
            </span>
            <span className={`text-xs w-10 text-right ${diffs[axis] <= toleranceDeg ? 'text-emerald-500' : diffs[axis] <= toleranceDeg * 2 ? 'text-amber-500' : 'text-red-500'}`}>
              Δ{Math.round(diffs[axis])}°
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Solved/Fail overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Orientation Matched!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Time Expired</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
