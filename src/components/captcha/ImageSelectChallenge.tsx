'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ImageCell {
  id: number;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon';
  color: string;
  rotation: number;
  distorted: boolean;
  hasCurvedEdges: boolean;
  size: number;
}

interface ImageSelectChallengeProps {
  challengeData: {
    instruction: string;
    grid: ImageCell[];
    correctIndices: number[];
    noiseLevel: number;
  };
  onVerify: (response: { selectedIndices: number[] }) => void;
}

function drawShape(shape: string, size: number, color: string, rotation: number, distorted: boolean): string {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.35;
  const d = distorted ? (Math.random() - 0.5) * 8 : 0;
  const rot = `rotate(${rotation}, ${cx}, ${cy})`;

  const base = `fill="${color}" transform="${rot}"`;

  switch (shape) {
    case 'circle': {
      const extra = distorted ? ` rx="${r + d}" ry="${r - d}"` : '';
      return `<circle cx="${cx}" cy="${cy}" r="${r}" ${base}${extra} />`;
    }
    case 'square': {
      const rxVal = distorted ? String(Math.abs(d) + 3) : '2';
      return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="${rxVal}" ${base} />`;
    }
    case 'triangle': {
      const pts = [
        [cx, cy - r + d],
        [cx + r - d, cy + r * 0.7],
        [cx - r + d, cy + r * 0.7],
      ];
      const pointsStr = pts.map(p => p.join(',')).join(' ');
      return `<polygon points="${pointsStr}" ${base} />`;
    }
    case 'star': {
      const points: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? r : r * 0.45;
        const dx = distorted ? d * 0.5 : 0;
        const dy = distorted ? d * 0.3 : 0;
        points.push([
          cx + Math.cos(angle) * radius + dx,
          cy + Math.sin(angle) * radius + dy,
        ]);
      }
      const pointsStr = points.map(p => p.join(',')).join(' ');
      return `<polygon points="${pointsStr}" ${base} />`;
    }
    case 'diamond': {
      const pts = [
        [cx, cy - r + d],
        [cx + r * 0.6, cy],
        [cx, cy + r - d],
        [cx - r * 0.6, cy],
      ];
      const pointsStr = pts.map(p => p.join(',')).join(' ');
      return `<polygon points="${pointsStr}" ${base} />`;
    }
    case 'hexagon': {
      const points: number[][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const dx = distorted ? d * 0.4 : 0;
        const dy = distorted ? d * 0.4 : 0;
        points.push([
          cx + Math.cos(angle) * r + dx,
          cy + Math.sin(angle) * r + dy,
        ]);
      }
      const pointsStr = points.map(p => p.join(',')).join(' ');
      return `<polygon points="${pointsStr}" ${base} />`;
    }
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${r}" ${base} />`;
  }
}

export default function ImageSelectChallenge({ challengeData, onVerify }: ImageSelectChallengeProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelection = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleVerify = useCallback(() => {
    onVerify({ selectedIndices: Array.from(selected).sort((a, b) => a - b) });
  }, [selected, onVerify]);

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3"
      >
        <p className="text-sm font-medium text-emerald-300">
          📋 {challengeData.instruction}
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 max-w-[320px] mx-auto">
        {challengeData.grid.map((cell, index) => (
          <motion.button
            key={cell.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleSelection(cell.id)}
            className={`relative aspect-square rounded-lg border-2 transition-all duration-200 cursor-pointer
              ${selected.has(cell.id)
                ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
          >
            <svg
              viewBox={`0 0 ${cell.size + 10} ${cell.size + 10}`}
              className="w-full h-full p-1"
              dangerouslySetInnerHTML={{
                __html: drawShape(
                  cell.shape,
                  cell.size + 10,
                  cell.color,
                  cell.rotation,
                  cell.distorted
                ),
              }}
            />
            {/* Selection indicator */}
            {selected.has(cell.id) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setSelected(new Set())}
          className="px-4 py-2 text-sm text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Limpiar
        </button>
        <button
          onClick={handleVerify}
          disabled={selected.size === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-600/25"
        >
          Verificar ({selected.size} seleccionadas)
        </button>
      </div>
    </div>
  );
}
