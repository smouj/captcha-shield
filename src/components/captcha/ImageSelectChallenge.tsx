'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ImageSelectChallengeData, ImageCell } from '@/lib/captcha-engine';

interface Props {
  challengeData: ImageSelectChallengeData;
  onVerify: (response: { selectedIndices: number[] }) => void;
}

function drawShape(cell: ImageCell): string {
  const s = cell.size + 10;
  const cx = s / 2, cy = s / 2, r = s * 0.35;
  const d = cell.distorted ? (Math.random() - 0.5) * 6 : 0;
  const rot = `rotate(${cell.rotation}, ${cx}, ${cy})`;

  const fill = cell.hasGradient
    ? `<defs><linearGradient id="g${cell.id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${cell.color}"/><stop offset="100%" style="stop-color:${cell.secondaryColor}"/></linearGradient></defs>`
    : '';
  const f = cell.hasGradient ? `fill="url(#g${cell.id})"` : `fill="${cell.color}"`;
  const base = `${f} transform="${rot}"`;
  const shadow = cell.hasShadow ? `filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"` : '';

  const noiseLine = cell.distorted
    ? `<line x1="0" y1="${s * Math.random()}" x2="${s}" y2="${s * Math.random()}" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>`
    : '';

  switch (cell.shape) {
    case 'circle':
      return `${fill}<circle cx="${cx}" cy="${cy}" r="${r}" ${base} ${shadow}/>${noiseLine}`;
    case 'square': {
      const rxVal = cell.distorted ? String(Math.abs(d) + 3) : '2';
      return `${fill}<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="${rxVal}" ${base} ${shadow}/>${noiseLine}`;
    }
    case 'triangle': {
      const pts = [[cx, cy - r + d], [cx + r - d, cy + r * 0.7], [cx - r + d, cy + r * 0.7]].map(p => p.join(',')).join(' ');
      return `${fill}<polygon points="${pts}" ${base} ${shadow}/>${noiseLine}`;
    }
    case 'star': {
      const pts: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? r : r * 0.45;
        pts.push([cx + Math.cos(angle) * radius + (cell.distorted ? d * 0.5 : 0), cy + Math.sin(angle) * radius]);
      }
      return `${fill}<polygon points="${pts.map(p => p.join(',')).join(' ')}" ${base} ${shadow}/>${noiseLine}`;
    }
    case 'diamond': {
      const pts = [[cx, cy - r + d], [cx + r * 0.6, cy], [cx, cy + r - d], [cx - r * 0.6, cy]].map(p => p.join(',')).join(' ');
      return `${fill}<polygon points="${pts}" ${base} ${shadow}/>${noiseLine}`;
    }
    case 'hexagon': {
      const pts: number[][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
      }
      return `${fill}<polygon points="${pts.map(p => p.join(',')).join(' ')}" ${base} ${shadow}/>${noiseLine}`;
    }
    case 'pentagon': {
      const pts: number[][] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
      }
      return `${fill}<polygon points="${pts.map(p => p.join(',')).join(' ')}" ${base} ${shadow}/>${noiseLine}`;
    }
    case 'cross': {
      const t = r * 0.35;
      return `${fill}<path d="M${cx - t},${cy - r} L${cx + t},${cy - r} L${cx + t},${cy - t} L${cx + r},${cy - t} L${cx + r},${cy + t} L${cx + t},${cy + t} L${cx + t},${cy + r} L${cx - t},${cy + r} L${cx - t},${cy + t} L${cx - r},${cy + t} L${cx - r},${cy - t} L${cx - t},${cy - t} Z" ${base} ${shadow}/>${noiseLine}`;
    }
    default:
      return `${fill}<circle cx="${cx}" cy="${cy}" r="${r}" ${base}/>`;
  }
}

export default function ImageSelectChallenge({ challengeData, onVerify }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const renderRef = useRef(0);
  renderRef.current++;

  const toggleSelection = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleVerify = useCallback(() => {
    onVerify({ selectedIndices: Array.from(selected).sort((a, b) => a - b) });
  }, [selected, onVerify]);

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5">
        <p className="text-xs font-medium text-emerald-300 leading-relaxed">
          {challengeData.instruction}
        </p>
      </motion.div>

      <div className="grid grid-cols-4 gap-1.5 max-w-[340px] mx-auto">
        {challengeData.grid.map((cell) => (
          <motion.button
            key={cell.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleSelection(cell.id)}
            className={`relative aspect-square rounded-md border-2 transition-all duration-200 cursor-pointer
              ${selected.has(cell.id)
                ? 'border-emerald-400 bg-emerald-500/15 shadow-lg shadow-emerald-500/20'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
          >
            <svg viewBox={`0 0 ${cell.size + 10} ${cell.size + 10}`} className="w-full h-full p-0.5"
              dangerouslySetInnerHTML={{ __html: drawShape(cell) }} />
            {selected.has(cell.id) && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2 justify-center">
        <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
          Limpiar
        </button>
        <button onClick={handleVerify} disabled={selected.size === 0}
          className="px-5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-600/25">
          Verificar ({selected.size})
        </button>
      </div>
    </div>
  );
}
