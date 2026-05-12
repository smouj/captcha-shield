'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Volume2, Hand, RotateCcw, Play } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

interface Beat {
  frequency: number;
  duration: number;
  delay: number;
}

type RhythmPhase = 'idle' | 'playing' | 'reproducing' | 'evaluating';

export default function VoiceRhythmChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playStartRef = useRef<number>(0);
  const tapTimesRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<RhythmPhase>('idle');
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 60);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const solvedRef = useRef(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const beats = useMemo<Beat[]>(
    () => (instance.payload.beats as Beat[]) ?? [],
    [instance.payload.beats],
  );
  const bpm = (instance.payload.bpm as number) ?? 120;
  const patternLength = (instance.payload.patternLength as number) ?? beats.length;
  const toleranceMs = 200;

  const canvasW = 400;
  const canvasH = 200;

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

  // Compute beat absolute times
  const beatTimings = useMemo(() =>
    beats.reduce<Array<{ start: number; end: number; frequency: number }>>((acc, beat, i) => {
      const prevEnd = i > 0 ? acc[i - 1].end : 0;
      const prevDelay = i > 0 ? beats[i - 1].delay : 0;
      const start = i > 0 ? prevEnd + prevDelay : 0;
      acc.push({ start, end: start + beat.duration, frequency: beat.frequency });
      return acc;
    }, []),
  [beats]);

  const totalDuration = useMemo(
    () => beatTimings.length > 0 ? beatTimings[beatTimings.length - 1].end : 0,
    [beatTimings],
  );

  // Draw rhythm visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Background
    ctx.fillStyle = isDark ? '#1a1a2e' : '#f0f0f5';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const barY = canvasH / 2;
    const barH = 60;
    const margin = 30;
    const usableW = canvasW - margin * 2;

    // Timeline
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, barY);
    ctx.lineTo(canvasW - margin, barY);
    ctx.stroke();

    // Draw beat bars
    for (let i = 0; i < beatTimings.length; i++) {
      const bt = beatTimings[i];
      const x = margin + (bt.start / totalDuration) * usableW;
      const w = Math.max(4, ((bt.end - bt.start) / totalDuration) * usableW);
      const isActive = activeBeat === i;

      const hue = 140 + (bt.frequency - 200) / 10;
      const saturation = isActive ? 90 : 60;
      const lightness = isDark ? (isActive ? 55 : 35) : (isActive ? 50 : 65);

      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.shadowColor = isActive ? `hsl(${hue}, 90%, 50%)` : 'transparent';
      ctx.shadowBlur = isActive ? 12 : 0;

      const barHeight = isActive ? barH + 16 : barH;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, barY - barHeight / 2);
      ctx.lineTo(x + w - radius, barY - barHeight / 2);
      ctx.quadraticCurveTo(x + w, barY - barHeight / 2, x + w, barY - barHeight / 2 + radius);
      ctx.lineTo(x + w, barY + barHeight / 2 - radius);
      ctx.quadraticCurveTo(x + w, barY + barHeight / 2, x + w - radius, barY + barHeight / 2);
      ctx.lineTo(x + radius, barY + barHeight / 2);
      ctx.quadraticCurveTo(x, barY + barHeight / 2, x, barY + barHeight / 2 - radius);
      ctx.lineTo(x, barY - barHeight / 2 + radius);
      ctx.quadraticCurveTo(x, barY - barHeight / 2, x + radius, barY - barHeight / 2);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Beat number
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, x + w / 2, barY);
    }

    // Draw user taps during reproduction
    if (phase === 'reproducing' || phase === 'evaluating') {
      const reproduceStart = playStartRef.current;
      for (let i = 0; i < userTaps.length; i++) {
        const relTime = userTaps[i] - reproduceStart;
        const x = margin + (relTime / totalDuration) * usableW;
        if (x < margin || x > canvasW - margin) continue;

        ctx.beginPath();
        ctx.moveTo(x, barY - barH / 2 - 20);
        ctx.lineTo(x - 5, barY - barH / 2 - 30);
        ctx.lineTo(x + 5, barY - barH / 2 - 30);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, barY - barH / 2 - 34, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239,68,68,0.3)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Playback progress line
    if (phase === 'playing' && totalDuration > 0) {
      const progressX = margin + playbackProgress * usableW;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, barY - barH / 2 - 8);
      ctx.lineTo(progressX, barY + barH / 2 + 8);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${bpm} BPM · ${patternLength} beats`, canvasW / 2, canvasH - 10);
  }, [theme, beatTimings, totalDuration, activeBeat, phase, playbackProgress, userTaps, bpm, patternLength]);

  // Play rhythm
  const playRhythm = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    setPhase('playing');
    playStartRef.current = ctx.currentTime * 1000;
    setActiveBeat(-1);
    setPlaybackProgress(0);

    // Schedule all beats
    const startTime = ctx.currentTime;
    for (let i = 0; i < beats.length; i++) {
      const beat = beats[i];
      const offset = beatTimings[i].start / 1000;
      const dur = beat.duration / 1000;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = beat.frequency;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, startTime + offset);
      gain.gain.linearRampToValueAtTime(0.3, startTime + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + dur);

      osc.start(startTime + offset);
      osc.stop(startTime + offset + dur);
    }

    // Animate playback
    const animStart = performance.now();
    const totalMs = totalDuration;
    let animFrame: number;

    const animate = () => {
      const elapsed = performance.now() - animStart;
      const progress = Math.min(1, elapsed / totalMs);
      setPlaybackProgress(progress);

      // Find active beat
      const currentTime = elapsed;
      for (let i = 0; i < beatTimings.length; i++) {
        if (currentTime >= beatTimings[i].start && currentTime <= beatTimings[i].end) {
          setActiveBeat(i);
          break;
        } else if (i < beatTimings.length - 1 && currentTime > beatTimings[i].end) {
          setActiveBeat(-1);
        }
      }

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        setActiveBeat(-1);
        setPhase('reproducing');
        playStartRef.current = performance.now();
      }
    };
    animFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrame);
  }, [beats, beatTimings, totalDuration]);

  // Handle tap
  const handleTap = useCallback(() => {
    if (phase !== 'reproducing' || solved || failed) return;
    const now = performance.now();
    const relTime = now - playStartRef.current;
    tapTimesRef.current = [...tapTimesRef.current, relTime];
    setUserTaps([...tapTimesRef.current]);
  }, [phase, solved, failed]);

  // Submit rhythm
  const handleSubmit = useCallback(() => {
    if (phase !== 'reproducing' || solvedRef.current) return;
    setPhase('evaluating');

    const taps = tapTimesRef.current;
    if (taps.length === 0) {
      onFail('No taps recorded');
      setFailed(true);
      return;
    }

    // Match user taps to expected beats
    let matchedBeats = 0;
    const usedTaps = new Set<number>();

    for (const bt of beatTimings) {
      const beatCenter = bt.start + (bt.end - bt.start) / 2;
      let bestDist = Infinity;
      let bestTap = -1;

      for (let j = 0; j < taps.length; j++) {
        if (usedTaps.has(j)) continue;
        const dist = Math.abs(taps[j] - beatCenter);
        if (dist < bestDist && dist <= toleranceMs) {
          bestDist = dist;
          bestTap = j;
        }
      }

      if (bestTap >= 0) {
        matchedBeats++;
        usedTaps.add(bestTap);
      }
    }

    const accuracy = matchedBeats / beatTimings.length;
    if (accuracy >= 0.7 && !solvedRef.current) {
      solvedRef.current = true;
      setSolved(true);
      onSolve({
        type: ChallengeType.VOICE_RHYTHM,
        answer: taps,
        tolerance: toleranceMs,
        metadata: { accuracy, matchedBeats, totalBeats: beatTimings.length },
      });
    } else {
      setFailed(true);
      onFail(`Rhythm accuracy too low: ${Math.round(accuracy * 100)}%`);
    }
  }, [phase, beatTimings, toleranceMs, onSolve, onFail]);

  // Replay
  const handleReplay = useCallback(() => {
    tapTimesRef.current = [];
    setUserTaps([]);
    setActiveBeat(-1);
    playRhythm();
  }, [playRhythm]);

  // Reset reproduction
  const handleResetTaps = useCallback(() => {
    tapTimesRef.current = [];
    setUserTaps([]);
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
          <Volume2 className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Voice Rhythm</h3>
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
        {phase === 'idle' && 'Listen to the rhythm pattern, then reproduce it by tapping.'}
        {phase === 'playing' && 'Listen carefully to the rhythm...'}
        {phase === 'reproducing' && 'Now tap the button to reproduce the rhythm!'}
        {phase === 'evaluating' && 'Evaluating your rhythm...'}
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

      {/* Controls */}
      <div className="mt-4 space-y-3">
        {phase === 'idle' && (
          <button
            onClick={playRhythm}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" /> Play Rhythm
          </button>
        )}

        {phase === 'playing' && (
          <div className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-emerald-500" />
              Playing...
            </motion.div>
          </div>
        )}

        {phase === 'reproducing' && (
          <div className="space-y-2">
            <button
              onClick={handleTap}
              className="w-full flex items-center justify-center gap-2 px-4 py-6 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-base font-medium rounded-lg transition-all"
            >
              <Hand className="w-5 h-5" /> TAP
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleResetTaps}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                <RotateCcw className="w-3 h-3" /> Clear Taps
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-3 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Submit ({userTaps.length}/{beatTimings.length})
              </button>
            </div>
          </div>
        )}

        {phase === 'evaluating' && (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"
            />
          </div>
        )}
      </div>

      {/* Replay hint */}
      {phase === 'reproducing' && (
        <div className="mt-2 text-center">
          <button
            onClick={handleReplay}
            className={`text-xs underline ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Replay original rhythm
          </button>
        </div>
      )}

      {/* Solved/Fail overlay */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Rhythm Matched!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Rhythm Failed</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
