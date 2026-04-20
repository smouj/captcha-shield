'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AudioChallengeData } from '@/lib/captcha-engine';

interface Props {
  challengeData: AudioChallengeData;
  onVerify: (response: { answer: number | string }) => void;
}

export default function AudioChallenge({ challengeData, onVerify }: Props) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { tones, question, timeLimit } = challengeData;

  const playTones = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      // Draw waveform
      const canvas = canvasRef.current;
      if (canvas) {
        const cctx = canvas.getContext('2d');
        if (cctx) {
          cctx.clearRect(0, 0, canvas.width, canvas.height);
          cctx.fillStyle = '#0f172a';
          cctx.beginPath();
          cctx.roundRect(0, 0, canvas.width, canvas.height, 8);
          cctx.fill();

          // Draw frequency bars
          const barWidth = Math.max(1, (canvas.width - 20) / tones.length - 4);
          const maxFreq = Math.max(...tones.map(t => t.frequency));
          tones.forEach((tone, i) => {
            const barHeight = (tone.frequency / maxFreq) * (canvas.height - 30);
            const x = 10 + i * (barWidth + 4);
            const grad = cctx.createLinearGradient(0, canvas.height - 10 - barHeight, 0, canvas.height - 10);
            grad.addColorStop(0, '#10b981');
            grad.addColorStop(1, '#065f46');
            cctx.fillStyle = grad;
            cctx.fillRect(x, canvas.height - 10 - barHeight, barWidth, barHeight);

            cctx.fillStyle = 'rgba(255,255,255,0.5)';
            cctx.font = '9px monospace';
            cctx.textAlign = 'center';
            cctx.fillText(`${tone.frequency}Hz`, x + barWidth / 2, canvas.height - 2);
          });
        }
      }

      // Play each tone sequentially
      let time = ctx.currentTime + 0.1;
      for (const tone of tones) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = tone.frequency;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + tone.duration / 1000);
        osc.start(time);
        osc.stop(time + tone.duration / 1000);
        time += (tone.duration + tone.gap) / 1000;
      }

      // Wait for all tones to finish
      const totalDuration = tones.reduce((sum, t) => sum + t.duration + t.gap, 0) / 1000;
      setTimeout(() => {
        setIsPlaying(false);
      }, (totalDuration + 0.2) * 1000);

    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    }

    setPlayCount(prev => prev + 1);
  }, [isPlaying, tones]);

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(() => playTones(), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const numAnswer = parseInt(userAnswer, 10);
    const answer = isNaN(numAnswer) ? userAnswer : numAnswer;
    onVerify({ answer });
  }, [userAnswer, onVerify]);

  return (
    <div className="space-y-3">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-center">
        <p className="text-xs font-medium text-emerald-300">{question}</p>
        <p className="text-[10px] text-gray-500 mt-1">{tones.length} tonos generados</p>
      </motion.div>

      {/* Waveform visualization */}
      <div className="flex justify-center">
        <canvas ref={canvasRef} width={320} height={120} className="rounded-lg border border-gray-700 max-w-full" />
      </div>

      {/* Play button */}
      <div className="flex justify-center">
        <button onClick={playTones} disabled={isPlaying}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isPlaying ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Reproduciendo...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              Reproducir ({playCount})
            </>
          )}
        </button>
      </div>

      <div className="flex gap-2 justify-center max-w-xs mx-auto">
        <input type="text" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Tu respuesta..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-center font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors" />
        <button onClick={handleSubmit} disabled={!userAnswer}
          className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/25">
          Verificar
        </button>
      </div>
    </div>
  );
}
