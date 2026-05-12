'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Shield, Hash, RotateCcw, Eye } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

type ZKPPhase = 'visual' | 'pow' | 'evaluating';

interface PatchData {
  color: string;
  pattern: 'solid' | 'striped' | 'dotted' | 'gradient';
  variant: number;
}

// Simple hash function for PoW (djb2 variant + hex)
function simpleHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(12, '0');
}

export default function ZeroKnowledgeProofChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<ZKPPhase>('visual');
  const [selectedPatches, setSelectedPatches] = useState<number[]>([]);
  const [visualAnswer, setVisualAnswer] = useState<string>('');
  const [powNonce, setPowNonce] = useState<number>(0);
  const [powWorking, setPowWorking] = useState(false);
  const [powProgress, setPowProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 60);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const solvedRef = useRef(false);
  const powAnimRef = useRef<number>(0);

  const patches = useMemo<PatchData[]>(
    () => (instance.payload.patches as PatchData[]) ?? [],
    [instance.payload.patches],
  );
  const targetPattern = (instance.payload.targetPattern as string) ?? 'match_pair';
  const powDifficulty = (instance.payload.powDifficulty as number) ?? 2;
  const powPrefix = (instance.payload.powPrefix as string) ?? '0';

  const canvasSize = 300;
  const gridSize = 3;
  const cellSize = canvasSize / gridSize;

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

  // Determine correct visual answer
  const correctVisual = useMemo(() => {
    if (targetPattern === 'match_pair') {
      // Find the pair of matching patches
      for (let i = 0; i < patches.length; i++) {
        for (let j = i + 1; j < patches.length; j++) {
          if (
            patches[i].color === patches[j].color &&
            patches[i].pattern === patches[j].pattern &&
            patches[i].variant === patches[j].variant
          ) {
            return `${i},${j}`;
          }
        }
      }
    } else if (targetPattern === 'odd_one_out') {
      // Find the odd patch
      const colorCounts = new Map<string, number>();
      for (const p of patches) {
        const key = `${p.color}-${p.pattern}`;
        colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
      }
      for (let i = 0; i < patches.length; i++) {
        const key = `${patches[i].color}-${patches[i].pattern}`;
        if (colorCounts.get(key) === 1) return String(i);
      }
    }
    return '0';
  }, [patches, targetPattern]);

  // Draw patch grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f5';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    for (let i = 0; i < patches.length; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = col * cellSize;
      const y = row * cellSize;
      const patch = patches[i];
      const isSelected = selectedPatches.includes(i);

      // Cell background
      const margin = 3;
      const radius = 8;
      ctx.fillStyle = isSelected
        ? isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)'
        : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)';

      ctx.beginPath();
      ctx.moveTo(x + margin + radius, y + margin);
      ctx.arcTo(x + cellSize - margin, y + margin, x + cellSize - margin, y + cellSize - margin, radius);
      ctx.arcTo(x + cellSize - margin, y + cellSize - margin, x + margin, y + cellSize - margin, radius);
      ctx.arcTo(x + margin, y + cellSize - margin, x + margin, y + margin, radius);
      ctx.arcTo(x + margin, y + margin, x + cellSize - margin, y + margin, radius);
      ctx.closePath();
      ctx.fill();

      // Patch rendering
      const cx = x + cellSize / 2;
      const cy = y + cellSize / 2;
      const pSize = cellSize * 0.32;

      ctx.save();
      ctx.translate(cx, cy);

      switch (patch.pattern) {
        case 'solid': {
          ctx.fillStyle = patch.color;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();
          // Inner highlight
          const sg = ctx.createRadialGradient(-pSize * 0.2, -pSize * 0.2, 0, 0, 0, pSize);
          sg.addColorStop(0, 'rgba(255,255,255,0.3)');
          sg.addColorStop(1, 'transparent');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'striped': {
          ctx.fillStyle = patch.color;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();
          // Stripes
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.clip();
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 3;
          for (let sx = -pSize; sx < pSize; sx += 8 + patch.variant) {
            ctx.beginPath();
            ctx.moveTo(sx, -pSize);
            ctx.lineTo(sx, pSize);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }
        case 'dotted': {
          ctx.fillStyle = patch.color;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();
          // Dots
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';
          const dotSpacing = 10 + patch.variant * 2;
          for (let dx = -pSize; dx < pSize; dx += dotSpacing) {
            for (let dy = -pSize; dy < pSize; dy += dotSpacing) {
              ctx.beginPath();
              ctx.arc(dx, dy, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
          break;
        }
        case 'gradient': {
          const gg = ctx.createLinearGradient(-pSize, -pSize, pSize, pSize);
          gg.addColorStop(0, patch.color);
          gg.addColorStop(1, isDark ? '#1a1a2e' : '#ffffff');
          ctx.fillStyle = gg;
          ctx.beginPath();
          ctx.arc(0, 0, pSize, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();

      // Selection border
      if (isSelected) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + margin + radius, y + margin);
        ctx.arcTo(x + cellSize - margin, y + margin, x + cellSize - margin, y + cellSize - margin, radius);
        ctx.arcTo(x + cellSize - margin, y + cellSize - margin, x + margin, y + cellSize - margin, radius);
        ctx.arcTo(x + margin, y + cellSize - margin, x + margin, y + margin, radius);
        ctx.arcTo(x + margin, y + margin, x + cellSize - margin, y + margin, radius);
        ctx.closePath();
        ctx.stroke();
      }

      // Index label
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(i + 1), x + cellSize / 2, y + cellSize - 4);
    }

    // Grid lines
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvasSize, i * cellSize);
      ctx.stroke();
    }
  }, [theme, patches, selectedPatches, cellSize]);

  // Handle patch click
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase !== 'visual' || solved || failed) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = canvasSize / rect.width;
      const sy = canvasSize / rect.height;
      const mx = (e.clientX - rect.left) * sx;
      const my = (e.clientY - rect.top) * sy;

      const col = Math.floor(mx / cellSize);
      const row = Math.floor(my / cellSize);
      const idx = row * gridSize + col;

      if (idx < 0 || idx >= patches.length) return;

      if (targetPattern === 'match_pair') {
        setSelectedPatches(prev => {
          if (prev.includes(idx)) return prev.filter(p => p !== idx);
          if (prev.length >= 2) return [prev[1], idx];
          return [...prev, idx];
        });
      } else {
        setSelectedPatches([idx]);
      }
    },
    [phase, solved, failed, patches.length, targetPattern, cellSize, gridSize],
  );

  // Submit visual answer
  const handleVisualSubmit = useCallback(() => {
    if (selectedPatches.length === 0) return;

    let answer: string;
    if (targetPattern === 'match_pair') {
      answer = selectedPatches.sort((a, b) => a - b).join(',');
    } else {
      answer = String(selectedPatches[0]);
    }

    setVisualAnswer(answer);

    if (answer === correctVisual) {
      setPhase('pow');
      setSelectedPatches([]);
    } else {
      onFail('Incorrect visual pattern');
      setFailed(true);
    }
  }, [selectedPatches, targetPattern, correctVisual, onFail]);

  // PoW solver
  const solvePow = useCallback(() => {
    if (powWorking) return;
    setPowWorking(true);
    setPowProgress(0);

    const prefix = powPrefix.repeat(powDifficulty);
    let nonce = 0;
    const maxNonce = 100000;

    const step = () => {
      const batchSize = 500;
      for (let i = 0; i < batchSize && nonce < maxNonce; i++) {
        const hash = simpleHash(`${visualAnswer}:${nonce}`);
        if (hash.startsWith(prefix)) {
          setPowNonce(nonce);
          setPowWorking(false);
          setPowProgress(100);

          if (!solvedRef.current) {
            solvedRef.current = true;
            setSolved(true);
            onSolve({
              type: ChallengeType.ZERO_KNOWLEDGE_PROOF,
              answer: { visualAnswer, powNonce: nonce },
              metadata: { hash, powDifficulty, attempts: nonce },
            });
          }
          return;
        }
        nonce++;
      }

      setPowProgress((nonce / maxNonce) * 100);
      if (nonce < maxNonce) {
        powAnimRef.current = requestAnimationFrame(step);
      } else {
        setPowWorking(false);
        onFail('Proof-of-work failed');
        setFailed(true);
      }
    };

    powAnimRef.current = requestAnimationFrame(step);
  }, [powWorking, powPrefix, powDifficulty, visualAnswer, onSolve, onFail]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (powAnimRef.current) cancelAnimationFrame(powAnimRef.current);
    };
  }, []);

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 60) - timeLeft) / (timeLimit ?? 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Zero-Knowledge Proof</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`text-xs font-mono ${timeLeft <= 10 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="flex gap-1 mb-3">
        <div className={`flex-1 h-1.5 rounded-full ${phase === 'visual' ? 'bg-emerald-500' : 'bg-emerald-500/60'}`} />
        <div className={`flex-1 h-1.5 rounded-full ${phase === 'pow' || solved ? 'bg-emerald-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
      </div>

      {/* Visual Phase */}
      {phase === 'visual' && (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs mb-3 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            {targetPattern === 'match_pair'
              ? 'Find the matching pair of patches and select both.'
              : 'Find the patch that is different from all the others.'}
          </motion.p>

          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className={`w-full max-w-[300px] rounded-lg border-2 cursor-pointer ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
              onClick={handleCanvasClick}
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setSelectedPatches([])}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
            <button
              onClick={handleVisualSubmit}
              disabled={selectedPatches.length === 0 || (targetPattern === 'match_pair' && selectedPatches.length < 2)}
              className="flex-1 px-3 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Confirm Selection ({selectedPatches.length}/{targetPattern === 'match_pair' ? 2 : 1})
            </button>
          </div>
        </>
      )}

      {/* PoW Phase */}
      {(phase === 'pow' || phase === 'evaluating') && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Visual verification passed. Now complete the proof-of-work:
              </p>
              <p className="text-xs font-mono text-emerald-500">
                Find nonce where hash({visualAnswer}:nonce) starts with &quot;{powPrefix.repeat(powDifficulty)}&quot;
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                <Hash className={`w-10 h-10 ${powWorking ? 'text-emerald-500' : solved ? 'text-emerald-500' : isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
            </div>

            {powWorking && (
              <div>
                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    animate={{ width: `${powProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className={`text-xs text-center mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Mining... {Math.round(powProgress)}%
                </p>
              </div>
            )}

            {!powWorking && !solved && (
              <button
                onClick={solvePow}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Hash className="w-4 h-4" /> Compute Proof
              </button>
            )}

            {solved && (
              <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <p className="text-xs text-emerald-500 font-mono">
                  Nonce: {powNonce}
                </p>
                <p className="text-xs text-emerald-500/70 font-mono">
                  Hash: {simpleHash(`${visualAnswer}:${powNonce}`)}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Timer bar */}
      <div className={`h-1.5 rounded-full mt-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${(1 - timerPercent) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Solved/Fail overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Proof Verified!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Verification Failed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
