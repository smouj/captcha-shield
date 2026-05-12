'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Brain } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

interface SceneElement {
  type: 'ball' | 'slope' | 'glass' | 'person' | 'arrow' | 'wall' | 'spring' | 'box' | 'water' | 'rope';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  color?: string;
  label?: string;
  velocity?: { dx: number; dy: number };
}

interface Option {
  id: string;
  description: string;
}

export default function ContextualReasoningChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 45);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const solvedRef = useRef(false);
  const [attempts, setAttempts] = useState(0);
  const [animFrame, setAnimFrame] = useState(0);

  const sceneType = (instance.payload.sceneType as string) ?? 'ball_slope';
  const elements = useMemo<SceneElement[]>(
    () => (instance.payload.elements as SceneElement[]) ?? [],
    [instance.payload.elements],
  );
  const options = useMemo<Option[]>(
    () => (instance.payload.options as Option[]) ?? [],
    [instance.payload.options],
  );
  const correctOptionId = (instance.payload.correctOptionId as string) ?? '';

  const canvasW = 400;
  const canvasH = 240;

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

  // Subtle animation
  useEffect(() => {
    if (solved || failed) return;
    const iv = setInterval(() => {
      setAnimFrame(f => f + 1);
    }, 100);
    return () => clearInterval(iv);
  }, [solved, failed]);

  // Draw scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
    bgGrad.addColorStop(0, isDark ? '#1a1a2e' : '#e8eaf0');
    bgGrad.addColorStop(1, isDark ? '#12122a' : '#d0d4de');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvasW; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasH);
      ctx.stroke();
    }
    for (let y = 0; y < canvasH; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
    }

    // Draw each element
    for (const el of elements) {
      ctx.save();
      ctx.translate(el.x, el.y);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

      const color = el.color ?? (isDark ? '#6a6a9a' : '#8a8ab0');

      switch (el.type) {
        case 'ball': {
          const r = el.width ?? 18;
          const bounce = Math.sin(animFrame * 0.3) * 2;
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.beginPath();
          ctx.ellipse(0, r + 4, r * 0.8, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Ball
          const ballGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3 + bounce, 2, 0, bounce, r);
          ballGrad.addColorStop(0, '#ffffff');
          ballGrad.addColorStop(0.3, color);
          ballGrad.addColorStop(1, isDark ? '#222' : '#444');
          ctx.beginPath();
          ctx.arc(0, bounce, r, 0, Math.PI * 2);
          ctx.fillStyle = ballGrad;
          ctx.fill();
          // Highlight
          ctx.beginPath();
          ctx.arc(-r * 0.25, -r * 0.3 + bounce, r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fill();
          break;
        }
        case 'slope': {
          const w = el.width ?? 120;
          const h = el.height ?? 80;
          ctx.beginPath();
          ctx.moveTo(-w / 2, h / 2);
          ctx.lineTo(w / 2, h / 2);
          ctx.lineTo(w / 2, -h / 2);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // Hatching
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 0.5;
          for (let i = -w; i < w; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, h / 2);
            ctx.lineTo(i + h, -h / 2);
            ctx.stroke();
          }
          break;
        }
        case 'glass': {
          const w = el.width ?? 30;
          const h = el.height ?? 50;
          ctx.fillStyle = isDark ? 'rgba(200,220,255,0.15)' : 'rgba(200,220,255,0.3)';
          ctx.strokeStyle = isDark ? 'rgba(200,220,255,0.5)' : 'rgba(150,180,220,0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-w / 2, -h / 2);
          ctx.lineTo(w / 2, -h / 2);
          ctx.lineTo(w / 2 - 3, h / 2);
          ctx.lineTo(-w / 2 + 3, h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Water
          const waterLevel = h * 0.6;
          ctx.fillStyle = isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)';
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 1, -h / 2 + waterLevel);
          const wave = Math.sin(animFrame * 0.4) * 2;
          ctx.quadraticCurveTo(0, -h / 2 + waterLevel + wave, w / 2 - 1, -h / 2 + waterLevel);
          ctx.lineTo(w / 2 - 3, h / 2 - 1);
          ctx.lineTo(-w / 2 + 3, h / 2 - 1);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'person': {
          const s = (el.width ?? 20) / 20;
          ctx.strokeStyle = color;
          ctx.fillStyle = color;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          // Head
          ctx.beginPath();
          ctx.arc(0, -28 * s, 6 * s, 0, Math.PI * 2);
          ctx.stroke();
          // Body
          ctx.beginPath();
          ctx.moveTo(0, -22 * s);
          ctx.lineTo(0, -4 * s);
          ctx.stroke();
          // Arms
          const armSwing = Math.sin(animFrame * 0.5) * 8 * s;
          ctx.beginPath();
          ctx.moveTo(-10 * s, -16 * s + armSwing);
          ctx.lineTo(0, -18 * s);
          ctx.lineTo(10 * s, -16 * s - armSwing);
          ctx.stroke();
          // Legs
          ctx.beginPath();
          ctx.moveTo(0, -4 * s);
          ctx.lineTo(-7 * s, 12 * s);
          ctx.moveTo(0, -4 * s);
          ctx.lineTo(7 * s, 12 * s);
          ctx.stroke();
          break;
        }
        case 'arrow': {
          const len = el.width ?? 40;
          ctx.strokeStyle = '#ef4444';
          ctx.fillStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-len / 2, 0);
          ctx.lineTo(len / 2 - 8, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(len / 2, 0);
          ctx.lineTo(len / 2 - 10, -5);
          ctx.lineTo(len / 2 - 10, 5);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'wall': {
          const w = el.width ?? 80;
          const h = el.height ?? 20;
          ctx.fillStyle = isDark ? '#3a3a5a' : '#a0a0b0';
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
          // Brick pattern
          for (let row = 0; row < h; row += 8) {
            ctx.beginPath();
            ctx.moveTo(-w / 2, -h / 2 + row);
            ctx.lineTo(w / 2, -h / 2 + row);
            ctx.stroke();
          }
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          break;
        }
        case 'spring': {
          const h = el.height ?? 40;
          const coils = 5;
          const coilW = 12;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i <= coils * 2; i++) {
            const py = -h / 2 + (i / (coils * 2)) * h;
            const px = (i % 2 === 0 ? -1 : 1) * coilW;
            if (i === 0) ctx.moveTo(0, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          break;
        }
        case 'box': {
          const w = el.width ?? 30;
          const h = el.height ?? 30;
          ctx.fillStyle = color;
          ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-w / 2, -h / 2, w, h);
          // Cross lines
          ctx.beginPath();
          ctx.moveTo(-w / 2, -h / 2);
          ctx.lineTo(w / 2, h / 2);
          ctx.moveTo(w / 2, -h / 2);
          ctx.lineTo(-w / 2, h / 2);
          ctx.stroke();
          break;
        }
        case 'water': {
          const w = el.width ?? 100;
          const h = el.height ?? 30;
          ctx.fillStyle = isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.15)';
          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          for (let i = 0; i <= w; i += 10) {
            const wave = Math.sin((i + animFrame * 3) * 0.1) * 3;
            ctx.lineTo(-w / 2 + i, wave);
          }
          ctx.lineTo(w / 2, h / 2);
          ctx.lineTo(-w / 2, h / 2);
          ctx.closePath();
          ctx.fill();
          break;
        }
        case 'rope': {
          const len = el.width ?? 60;
          ctx.strokeStyle = isDark ? '#8b7355' : '#a0895a';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-len / 2, 0);
          for (let i = 0; i <= len; i += 5) {
            const sag = Math.sin((i / len) * Math.PI) * 12 + Math.sin(animFrame * 0.3 + i * 0.1) * 2;
            ctx.lineTo(-len / 2 + i, sag);
          }
          ctx.stroke();
          break;
        }
      }

      // Label
      if (el.label) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
        ctx.font = '9px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(el.label, 0, (el.height ?? 20) / 2 + 14);
      }

      ctx.restore();
    }

    // Scene label
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(sceneType.replace(/_/g, ' '), canvasW - 8, canvasH - 6);
  }, [theme, elements, sceneType, animFrame]);

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (solved || failed) return;
      setSelectedOption(optionId);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (optionId === correctOptionId && !solvedRef.current) {
        solvedRef.current = true;
        setSolved(true);
        onSolve({
          type: ChallengeType.CONTEXTUAL_REASONING,
          answer: optionId,
          metadata: { attempts: newAttempts },
        });
      } else if (optionId !== correctOptionId) {
        if (newAttempts >= instance.maxAttempts) {
          setFailed(true);
          onFail('Too many incorrect attempts');
        }
      }
    },
    [solved, failed, attempts, correctOptionId, onSolve, onFail, instance.maxAttempts],
  );

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 45) - timeLeft) / (timeLimit ?? 45);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Contextual Reasoning</h3>
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
        Observe the scene below. What happens next? Select the most physically plausible outcome.
      </motion.p>

      {/* Timer bar */}
      <div className={`h-1.5 rounded-full mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          animate={{ width: `${(1 - timerPercent) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          className={`w-full max-w-[400px] rounded-lg border-2 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
        />
      </div>

      {/* Options */}
      <div className="mt-3 space-y-2">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt.id;
          const isCorrect = solved && opt.id === correctOptionId;
          const isWrong = selectedOption === opt.id && !solved && failed;

          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              onClick={() => handleOptionSelect(opt.id)}
              disabled={solved || failed}
              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-xs transition-all ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                  : isWrong
                    ? 'border-red-500 bg-red-500/10 text-red-500'
                    : isSelected
                      ? 'border-emerald-400 bg-emerald-400/10'
                      : isDark
                        ? 'border-gray-700 hover:border-gray-600 text-gray-300'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className={`font-semibold mr-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt.description}
            </motion.button>
          );
        })}
      </div>

      {/* Attempts */}
      <div className="flex justify-between items-center mt-3">
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Attempts: {attempts}/{instance.maxAttempts}
        </span>
        {selectedOption && !solved && !failed && selectedOption !== correctOptionId && (
          <span className="text-xs text-amber-500">Not quite — try again!</span>
        )}
      </div>

      {/* Solved/Fail overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Correct Reasoning!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Reasoning Failed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
