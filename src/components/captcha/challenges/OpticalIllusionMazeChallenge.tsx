'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Navigation, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import type { ChallengeProps } from '@/lib/types';
import { ChallengeType } from '@/lib/types';

type CellType = 0 | 1 | 2; // 0=path, 1=wall, 2=goal

const DIR_MAP: Record<string, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const DEFAULT_MAZE: CellType[][] = [
  [1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 2, 1],
  [1, 1, 1, 1, 1, 1, 1],
];

export default function OpticalIllusionMazeChallenge({
  instance,
  onSolve,
  onFail,
  theme,
  timeLimit,
  accessibilityMode,
}: ChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 90);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const solvedRef = useRef(false);
  const movePathRef = useRef<string[]>([]);

  const maze = useMemo<CellType[][]>(
    () => (instance.payload.maze as CellType[][]) ?? DEFAULT_MAZE,
    [instance.payload.maze],
  );
  const startPos = useMemo<{ x: number; y: number }>(
    () => (instance.payload.startPos as { x: number; y: number }) ?? { x: 1, y: 1 },
    [instance.payload.startPos],
  );
  const illusionType = (instance.payload.illusionType as string) ?? 'moire';

  const canvasSize = 350;
  const rows = maze.length;
  const cols = maze[0]?.length ?? 0;
  const cellSize = Math.floor(canvasSize / Math.max(rows, cols));
  const offsetX = (canvasSize - cols * cellSize) / 2;
  const offsetY = (canvasSize - rows * cellSize) / 2;

  // Initialize player position
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>(() => startPos);

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

  // Draw maze
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = isDark ? '#0f0f1e' : '#eeeef5';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw maze cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * cellSize;
        const y = offsetY + r * cellSize;
        const cell = maze[r]?.[c] ?? 1;

        if (cell === 1) {
          // Wall with optical illusion overlay
          ctx.fillStyle = isDark ? '#2a2a4a' : '#8888aa';
          ctx.fillRect(x, y, cellSize, cellSize);

          if (illusionType === 'moire') {
            // Moiré pattern
            const stripeWidth = 3;
            ctx.strokeStyle = isDark ? 'rgba(100,100,200,0.15)' : 'rgba(100,100,200,0.08)';
            ctx.lineWidth = 0.5;
            for (let s = 0; s < cellSize; s += stripeWidth) {
              ctx.beginPath();
              ctx.moveTo(x + s, y);
              ctx.lineTo(x + s + cellSize * 0.5, y + cellSize);
              ctx.stroke();
            }
            ctx.strokeStyle = isDark ? 'rgba(200,100,200,0.1)' : 'rgba(200,100,200,0.06)';
            for (let s = 0; s < cellSize; s += stripeWidth + 1) {
              ctx.beginPath();
              ctx.moveTo(x + cellSize - s, y);
              ctx.lineTo(x + cellSize * 0.5 - s, y + cellSize);
              ctx.stroke();
            }
          } else if (illusionType === 'spiral') {
            // Concentric rectangles
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
            ctx.lineWidth = 0.5;
            for (let ring = 2; ring < cellSize / 2; ring += 4) {
              ctx.strokeRect(x + ring, y + ring, cellSize - ring * 2, cellSize - ring * 2);
            }
          } else {
            // Impossible geometry hints
            ctx.strokeStyle = isDark ? 'rgba(255,200,100,0.08)' : 'rgba(200,100,50,0.06)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x, y + cellSize);
            ctx.stroke();
          }
        } else if (cell === 2) {
          // Goal
          ctx.fillStyle = isDark ? '#1a3a2a' : '#d0f0d8';
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.fillStyle = '#10b981';
          ctx.font = `${Math.floor(cellSize * 0.5)}px system-ui`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', x + cellSize / 2, y + cellSize / 2);
        } else {
          // Path
          ctx.fillStyle = isDark ? '#16162e' : '#e0e0ee';
          ctx.fillRect(x, y, cellSize, cellSize);
        }

        // Grid lines
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    // Draw player
    const px = offsetX + playerPos.x * cellSize + cellSize / 2;
    const py = offsetY + playerPos.y * cellSize + cellSize / 2;
    const playerR = cellSize * 0.3;

    // Player glow
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, playerR, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Player inner
    ctx.beginPath();
    ctx.arc(px, py, playerR * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Start marker
    const sx = offsetX + startPos.x * cellSize + cellSize / 2;
    const sy = offsetY + startPos.y * cellSize + cellSize / 2;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
    ctx.font = `${Math.floor(cellSize * 0.3)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', sx, sy + cellSize * 0.3);
  }, [maze, playerPos, theme, illusionType, rows, cols, cellSize, offsetX, offsetY, canvasSize, startPos]);

  // Move player
  const movePlayer = useCallback(
    (direction: string) => {
      if (solved || failed) return;
      const [dx, dy] = DIR_MAP[direction] ?? [0, 0];

      setPlayerPos(currentPos => {
        const newX = currentPos.x + dx;
        const newY = currentPos.y + dy;

        // Bounds check
        if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) return currentPos;
        // Wall check
        if (maze[newY]?.[newX] === 1) return currentPos;

        movePathRef.current = [...movePathRef.current, direction];
        setStepCount(movePathRef.current.length);

        // Check if reached goal
        if (maze[newY][newX] === 2 && !solvedRef.current) {
          solvedRef.current = true;
          setSolved(true);
          onSolve({
            type: ChallengeType.OPTICAL_ILLUSION_MAZE,
            answer: movePathRef.current,
            metadata: { steps: movePathRef.current.length },
          });
        }

        return { x: newX, y: newY };
      });
    },
    [solved, failed, cols, rows, maze, onSolve],
  );

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          e.preventDefault();
          movePlayer('up');
          break;
        case 'ArrowDown':
        case 's':
          e.preventDefault();
          movePlayer('down');
          break;
        case 'ArrowLeft':
        case 'a':
          e.preventDefault();
          movePlayer('left');
          break;
        case 'ArrowRight':
        case 'd':
          e.preventDefault();
          movePlayer('right');
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movePlayer]);

  const handleReset = useCallback(() => {
    setPlayerPos(startPos);
    movePathRef.current = [];
    setStepCount(0);
    setSolved(false);
    setFailed(false);
    solvedRef.current = false;
    setTimeLeft(timeLimit ?? 90);
  }, [startPos, timeLimit]);

  const isDark = theme === 'dark';
  const timerPercent = ((timeLimit ?? 90) - timeLeft) / (timeLimit ?? 90);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto p-4 rounded-xl relative ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-semibold">Optical Illusion Maze</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`text-xs font-mono ${timeLeft <= 15 ? 'text-red-500' : 'text-muted-foreground'}`}>
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
        Navigate the green dot to the star ★. Use arrow keys or buttons. Watch out for illusions!
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
          width={canvasSize}
          height={canvasSize}
          className={`w-full max-w-[350px] rounded-lg border-2 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
        />
      </div>

      {/* Direction buttons */}
      <div className="flex justify-center mt-3">
        <div className="grid grid-cols-3 gap-1 w-32">
          <div />
          <button
            onClick={() => movePlayer('up')}
            disabled={solved || failed}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} disabled:opacity-40`}
            aria-label="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          <button
            onClick={() => movePlayer('left')}
            disabled={solved || failed}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} disabled:opacity-40`}
            aria-label="Move left"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => movePlayer('down')}
            disabled={solved || failed}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} disabled:opacity-40`}
            aria-label="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => movePlayer('right')}
            disabled={solved || failed}
            className={`flex items-center justify-center p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} disabled:opacity-40`}
            aria-label="Move right"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-3">
        <button
          onClick={handleReset}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Steps: {stepCount}
          {accessibilityMode && ' · A11y: ON'}
        </span>
      </div>

      {/* Result overlays */}
      <AnimatePresence>
        {solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-emerald-500 font-bold text-lg">Maze Solved!</span>
          </motion.div>
        )}
        {failed && !solved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl backdrop-blur-sm"
          >
            <span className="text-red-500 font-bold text-lg">Time&apos;s Up!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
