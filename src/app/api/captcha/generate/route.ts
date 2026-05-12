/**
 * CAPTCHA Shield v4.0 "Fortress" — Challenge Generation API Route
 *
 * POST /api/captcha/generate
 *
 * Generates a new CAPTCHA challenge instance. The challenge and its solution
 * are stored server-side; only the challenge payload (without the solution)
 * is returned to the client.
 *
 * Features:
 *   - Inline challenge generators for all 10 Fortress challenge types
 *   - Rate limiting: max 10 requests / minute / IP (in-memory counter)
 *   - Input validation for sessionId, riskScore, and difficulty
 *   - Automatic cleanup of expired challenges on each request
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  ChallengeType,
  ChallengeDifficulty,
  ChallengeSolution,
} from '@/lib/types';

import {
  storeChallenge,
  checkRateLimit,
  recordAnalyticsEvent,
  cleanupExpired,
} from '@/lib/captcha-store';

// ─── Inline Utility Helpers ────────────────────────────────────────────────

/** Returns a random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random float in [min, max). */
function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Picks a random element from a readonly array. */
function randPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Fisher-Yates shuffle. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generates a unique challenge ID. */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `ch_${timestamp}_${random}`;
}

// ─── Difficulty → Max Attempts Mapping ─────────────────────────────────────

const DIFFICULTY_MAX_ATTEMPTS: Record<ChallengeDifficulty, number> = {
  [ChallengeDifficulty.EASY]: 5,
  [ChallengeDifficulty.MEDIUM]: 3,
  [ChallengeDifficulty.HARD]: 2,
  [ChallengeDifficulty.EXTREME]: 1,
};

// ─── Default Expiration ────────────────────────────────────────────────────

const DEFAULT_EXPIRATION_MS = 60_000; // 1 minute

// ─── Inline Challenge Generators ───────────────────────────────────────────
// Simplified but functional generators for all 10 challenge types.
// These mirror the logic in captcha-engine-v4.ts but are self-contained
// to avoid pulling client-side code into the API route bundle.

function generateAdversarialPuzzlePayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const pieceCountByDifficulty: Record<ChallengeDifficulty, number> = {
    [ChallengeDifficulty.EASY]: 2,
    [ChallengeDifficulty.MEDIUM]: 3,
    [ChallengeDifficulty.HARD]: 4,
    [ChallengeDifficulty.EXTREME]: 5,
  };
  const pieceCount = pieceCountByDifficulty[difficulty];
  const canvasWidth = 400;
  const canvasHeight = 300;

  const noiseLevel =
    difficulty === ChallengeDifficulty.EASY ? 0.1
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.25
    : difficulty === ChallengeDifficulty.HARD ? 0.45
    : 0.65;

  const tolerance =
    difficulty === ChallengeDifficulty.EASY ? 8
    : difficulty === ChallengeDifficulty.MEDIUM ? 5
    : difficulty === ChallengeDifficulty.HARD ? 3
    : 2;

  const pieces = Array.from({ length: pieceCount }, (_, i) => ({
    id: i,
    startX: randInt(10, canvasWidth - 80),
    targetX: randInt(30, canvasWidth - 50),
    width: Math.floor(canvasWidth / (pieceCount + 1)),
    shape: randPick(['rect', 'wave', 'tab', 'jigsaw'] as const),
  }));

  const noiseConfig = {
    type: randPick(['gaussian', 'perlin', 'salt_pepper'] as const),
    intensity: noiseLevel,
    overlayOpacity: 0.15 + noiseLevel * 0.3,
    colorShift: randInt(0, 30),
  };

  const distortionField = {
    type: randPick(['wave', 'swirl', 'ripple'] as const),
    amplitude: (difficulty === ChallengeDifficulty.EASY ? 0.05 : difficulty === ChallengeDifficulty.MEDIUM ? 0.15 : difficulty === ChallengeDifficulty.HARD ? 0.3 : 0.5) * 20,
    frequency: randFloat(0.02, 0.08),
    phase: randFloat(0, Math.PI * 2),
  };

  const decoyEdges =
    difficulty === ChallengeDifficulty.EASY ? 0
    : difficulty === ChallengeDifficulty.MEDIUM ? 2
    : difficulty === ChallengeDifficulty.HARD ? 4
    : 6;

  return {
    payload: {
      canvasWidth,
      canvasHeight,
      pieceCount,
      pieces,
      noiseConfig,
      distortionField,
      decoyEdges,
      tolerance,
      seed: randInt(0, 999999),
    },
    solution: {
      type: ChallengeType.ADVERSARIAL_PUZZLE,
      answer: pieces.map((p) => ({ id: p.id, targetX: p.targetX })),
      tolerance,
      metadata: { difficulty, pieceCount },
    },
  };
}

function generateHumanIntuitionGridPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const gridSize = 4;
  const totalCells = gridSize * gridSize;
  const baseShape = randPick(['circle', 'square', 'triangle', 'hexagon', 'star', 'diamond'] as const);
  const baseColor = `hsl(${randInt(0, 360)}, ${randInt(50, 80)}%, ${randInt(45, 65)}%)`;
  const baseRotation = randInt(0, 30) * 5;
  const baseSize = randInt(28, 42);

  const differProperty =
    difficulty === ChallengeDifficulty.EASY
      ? randPick(['color', 'shape'] as const)
      : difficulty === ChallengeDifficulty.MEDIUM
        ? randPick(['color', 'rotation', 'size'] as const)
        : randPick(['rotation', 'size', 'opacity', 'stroke_dash'] as const);

  const oddIndex = randInt(0, totalCells - 1);

  const grid = Array.from({ length: totalCells }, (_, i) => {
    const isOdd = i === oddIndex;
    let cellShape = baseShape;
    let cellColor = baseColor;
    let cellRotation = baseRotation;
    let cellSize = baseSize;
    let cellOpacity = 1.0;
    let cellStrokeDash = false;

    if (isOdd) {
      switch (differProperty) {
        case 'color': {
          const hueShift = randInt(30, 50);
          const baseHue = parseInt(baseColor.match(/\d+/)?.[0] || '0');
          cellColor = `hsl(${(baseHue + hueShift) % 360}, ${randInt(50, 80)}%, ${randInt(45, 65)}%)`;
          break;
        }
        case 'shape': {
          const altShapes = (['circle', 'square', 'triangle', 'hexagon', 'star', 'diamond'] as const).filter((s) => s !== baseShape);
          cellShape = altShapes[Math.floor(Math.random() * altShapes.length)];
          break;
        }
        case 'rotation':
          cellRotation = baseRotation + randPick([15, 20, 25, -15, -20] as const);
          break;
        case 'size':
          cellSize = baseSize + randPick([6, 8, 10, -6, -8] as const);
          break;
        case 'opacity':
          cellOpacity = randFloat(0.55, 0.75);
          break;
        case 'stroke_dash':
          cellStrokeDash = true;
          break;
      }
    }

    return {
      index: i,
      shape: cellShape,
      color: cellColor,
      rotation: cellRotation,
      size: cellSize,
      opacity: cellOpacity,
      strokeDash: cellStrokeDash,
      isOdd,
    };
  });

  return {
    payload: {
      gridSize,
      grid,
      baseShape,
      baseColor,
      instruction: 'Find the cell that is different from all others',
      displayTime:
        difficulty === ChallengeDifficulty.EASY ? 5000
        : difficulty === ChallengeDifficulty.MEDIUM ? 4000
        : 3000,
    },
    solution: {
      type: ChallengeType.HUMAN_INTUITION_GRID,
      answer: { oddIndex, differProperty },
      tolerance: 0,
      metadata: { gridSize, differProperty },
    },
  };
}

function generatePhysicsChaosPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const beamLength = 600;
  const pivotX = beamLength / 2;
  const objectCount =
    difficulty === ChallengeDifficulty.EASY ? 2
    : difficulty === ChallengeDifficulty.MEDIUM ? 3
    : difficulty === ChallengeDifficulty.HARD ? 4
    : 5;

  const fixedObjects = Array.from({ length: objectCount }, (_, i) => ({
    id: i,
    mass: randInt(1, 5),
    position: randInt(30, beamLength - 30),
    shape: randPick(['circle', 'square', 'triangle'] as const),
    color: `hsl(${randInt(0, 360)}, 70%, 55%)`,
  }));

  let fixedTorque = fixedObjects.reduce(
    (sum, o) => sum + o.mass * (o.position - pivotX),
    0,
  );

  const placeableObjects: Array<{
    id: number;
    mass: number;
    shape: string;
    color: string;
  }> = [];
  const correctPositions: number[] = [];

  for (let i = 0; i < Math.ceil(objectCount / 2); i++) {
    const mass = randInt(1, 5);
    const shape = randPick(['circle', 'square', 'triangle'] as const);
    const color = `hsl(${randInt(0, 360)}, 70%, 55%)`;

    placeableObjects.push({ id: fixedObjects.length + i, mass, shape, color });

    let targetPos = pivotX + fixedTorque / mass;
    targetPos = Math.max(20, Math.min(beamLength - 20, targetPos));
    correctPositions.push(Math.round(targetPos * 10) / 10);
    fixedTorque -= mass * (targetPos - pivotX);
  }

  const tolerancePercent =
    difficulty === ChallengeDifficulty.EASY ? 0.10
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.07
    : difficulty === ChallengeDifficulty.HARD ? 0.05
    : 0.03;

  return {
    payload: {
      beamLength,
      pivotX,
      gravity: 9.81,
      fixedObjects,
      placeableObjects,
      tolerancePercent,
      simulationSpeed: 1.0,
      groundFriction: randFloat(0.2, 0.5),
      windForce: difficulty === ChallengeDifficulty.EXTREME ? randFloat(-2, 2) : 0,
    },
    solution: {
      type: ChallengeType.PHYSICS_CHAOS,
      answer: correctPositions,
      tolerance: tolerancePercent,
      metadata: { objectCount, beamLength, pivotX },
    },
  };
}

function generateTemporalMemoryPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const sequenceLength =
    difficulty === ChallengeDifficulty.EASY ? 3
    : difficulty === ChallengeDifficulty.MEDIUM ? 4
    : difficulty === ChallengeDifficulty.HARD ? 5
    : 7;

  const displayTime =
    difficulty === ChallengeDifficulty.EASY ? 2500
    : difficulty === ChallengeDifficulty.MEDIUM ? 1800
    : difficulty === ChallengeDifficulty.HARD ? 1200
    : 800;

  const symbolPool = [
    '\u{1F534}', '\u{1F535}', '\u{1F7E2}', '\u{1F7E1}', '\u{1F7E3}',
    '\u{1F7E0}', '\u26AA', '\u{1F7E4}',
    '\u25B2', '\u25C6', '\u25CF', '\u25A0', '\u2605', '\u2B1F', '\u2B21', '\u2B22',
  ];

  const shuffledPool = shuffle([...symbolPool]);
  const sequence = shuffledPool.slice(0, sequenceLength);
  const distractorCount = Math.min(4, symbolPool.length - sequenceLength);
  const distractors = shuffledPool.slice(sequenceLength, sequenceLength + distractorCount);
  const recallItems = shuffle([...sequence, ...distractors]);

  return {
    payload: {
      sequence,
      recallItems,
      displayTime,
      sequenceLength,
      instruction: 'Watch the sequence, then reproduce the exact order',
    },
    solution: {
      type: ChallengeType.TEMPORAL_MEMORY,
      answer: sequence,
      tolerance: 0,
      metadata: { sequenceLength, displayTime },
    },
  };
}

function generateOpticalIllusionMazePayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const mazeSize =
    difficulty === ChallengeDifficulty.EASY ? 8
    : difficulty === ChallengeDifficulty.MEDIUM ? 12
    : difficulty === ChallengeDifficulty.HARD ? 16
    : 20;

  type Cell = { top: boolean; right: boolean; bottom: boolean; left: boolean; visited: boolean };
  const maze: Cell[][] = [];

  for (let y = 0; y < mazeSize; y++) {
    maze[y] = [];
    for (let x = 0; x < mazeSize; x++) {
      maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
    }
  }

  // Recursive backtracking maze generation
  const stack: Array<[number, number]> = [[0, 0]];
  maze[0][0].visited = true;

  const directions: Array<[number, number, 'top' | 'right' | 'bottom' | 'left', 'bottom' | 'left' | 'top' | 'right']> = [
    [0, -1, 'top', 'bottom'],
    [1, 0, 'right', 'left'],
    [0, 1, 'bottom', 'top'],
    [-1, 0, 'left', 'right'],
  ];

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors = directions
      .map(([dx, dy, wall, opposite]) => ({ nx: cx + dx, ny: cy + dy, wall, opposite }))
      .filter(({ nx, ny }) => nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && !maze[ny][nx].visited);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const { nx, ny, wall, opposite } = randPick(neighbors);
      maze[cy][cx][wall] = false;
      maze[ny][nx][opposite] = false;
      maze[ny][nx].visited = true;
      stack.push([nx, ny]);
    }
  }

  // BFS solve
  const endX = mazeSize - 1;
  const endY = mazeSize - 1;
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: Array<[number, number]> = [[0, 0]];
  visited.add('0,0');

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    if (cx === endX && cy === endY) break;
    for (const [dx, dy, wall] of directions) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && !visited.has(key) && !maze[cy][cx][wall]) {
        visited.add(key);
        parent.set(key, `${cx},${cy}`);
        queue.push([nx, ny]);
      }
    }
  }

  const correctPath: Array<[number, number]> = [];
  let current = `${endX},${endY}`;
  while (current) {
    const [x, y] = current.split(',').map(Number);
    correctPath.unshift([x, y]);
    current = parent.get(current) || '';
  }

  const illusionTypes = ['moire', 'hermann_grid', 'cafe_wall', 'penrose_triangle', 'eszcher_stairs'] as const;
  const activeIllusions =
    difficulty === ChallengeDifficulty.EASY
      ? [randPick(illusionTypes)]
      : shuffle([...illusionTypes]).slice(0, difficulty === ChallengeDifficulty.MEDIUM ? 2 : 3);

  const illusionIntensity =
    difficulty === ChallengeDifficulty.EASY ? 0.15
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.3
    : difficulty === ChallengeDifficulty.HARD ? 0.5
    : 0.7;

  const mazeData = maze.map((row) =>
    row.map((cell) => ({
      top: cell.top,
      right: cell.right,
      bottom: cell.bottom,
      left: cell.left,
    })),
  );

  return {
    payload: {
      mazeSize,
      mazeData,
      start: { x: 0, y: 0 },
      end: { x: endX, y: endY },
      activeIllusions,
      illusionIntensity,
      wallColor: '#1a1a2e',
      pathColor: '#e0e0e0',
      illusionBlendMode: 'overlay' as const,
    },
    solution: {
      type: ChallengeType.OPTICAL_ILLUSION_MAZE,
      answer: correctPath,
      tolerance: 0,
      metadata: { mazeSize, pathLength: correctPath.length, illusionCount: activeIllusions.length },
    },
  };
}

function generateVoiceRhythmPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const beatCount =
    difficulty === ChallengeDifficulty.EASY ? 4
    : difficulty === ChallengeDifficulty.MEDIUM ? 6
    : difficulty === ChallengeDifficulty.HARD ? 8
    : 10;

  const bpm =
    difficulty === ChallengeDifficulty.EASY ? 80
    : difficulty === ChallengeDifficulty.MEDIUM ? 100
    : difficulty === ChallengeDifficulty.HARD ? 120
    : 140;

  const beatIntervalMs = 60000 / bpm;
  let activeCount = 0;

  const pattern = Array.from({ length: beatCount }, (_, i) => {
    const active = Math.random() > 0.35;
    if (active) activeCount++;
    return {
      beat: i,
      active,
      duration: active ? randInt(100, 300) : 0,
      frequency: active ? randInt(300, 800) : 0,
    };
  });

  // Ensure at least 50% active beats
  for (let i = 0; i < pattern.length && activeCount < Math.ceil(beatCount * 0.5); i++) {
    if (!pattern[i].active) {
      pattern[i].active = true;
      pattern[i].duration = randInt(100, 300);
      pattern[i].frequency = randInt(300, 800);
      activeCount++;
    }
  }

  const correctBeats = pattern.map((p, i) => (p.active ? i : -1)).filter((i) => i !== -1);

  const timingToleranceMs =
    difficulty === ChallengeDifficulty.EASY ? 300
    : difficulty === ChallengeDifficulty.MEDIUM ? 200
    : difficulty === ChallengeDifficulty.HARD ? 120
    : 80;

  return {
    payload: {
      pattern,
      bpm,
      beatIntervalMs,
      beatCount,
      audioFormat: 'webaudio' as const,
      totalDurationMs: beatCount * beatIntervalMs,
      instruction: 'Listen to the rhythm, then tap to repeat it',
    },
    solution: {
      type: ChallengeType.VOICE_RHYTHM,
      answer: { correctBeats, beatTimes: correctBeats.map((b) => b * beatIntervalMs) },
      tolerance: timingToleranceMs,
      metadata: { bpm, beatCount, timingToleranceMs },
    },
  };
}

function generateGestureSignaturePayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const canvasSize = 300;

  const gestureTemplates: Record<string, Array<{ x: number; y: number }>> = {
    circle: Array.from({ length: 24 }, (_, i) => ({
      x: 0.5 + 0.3 * Math.cos((2 * Math.PI * i) / 24),
      y: 0.5 + 0.3 * Math.sin((2 * Math.PI * i) / 24),
    })),
    triangle: [
      { x: 0.5, y: 0.15 },
      { x: 0.85, y: 0.8 },
      { x: 0.15, y: 0.8 },
      { x: 0.5, y: 0.15 },
    ],
    zigzag: [
      { x: 0.1, y: 0.3 },
      { x: 0.3, y: 0.7 },
      { x: 0.5, y: 0.3 },
      { x: 0.7, y: 0.7 },
      { x: 0.9, y: 0.3 },
    ],
    wave: Array.from({ length: 20 }, (_, i) => ({
      x: i / 19,
      y: 0.5 + 0.25 * Math.sin((2 * Math.PI * i) / 7),
    })),
    checkmark: [
      { x: 0.2, y: 0.5 },
      { x: 0.4, y: 0.75 },
      { x: 0.8, y: 0.2 },
    ],
    spiral: Array.from({ length: 30 }, (_, i) => {
      const angle = (3 * Math.PI * i) / 30;
      const r = 0.05 + (0.3 * i) / 30;
      return { x: 0.5 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle) };
    }),
  };

  const templateNames = Object.keys(gestureTemplates);
  const selectedGesture =
    difficulty === ChallengeDifficulty.EASY
      ? randPick(['circle', 'checkmark', 'triangle'] as const)
      : difficulty === ChallengeDifficulty.MEDIUM
        ? randPick(['triangle', 'zigzag', 'wave'] as const)
        : randPick(templateNames);

  const targetPath = gestureTemplates[selectedGesture].map((p) => ({
    x: Math.round(p.x * canvasSize * 10) / 10,
    y: Math.round(p.y * canvasSize * 10) / 10,
  }));

  const distanceTolerance =
    difficulty === ChallengeDifficulty.EASY ? 30
    : difficulty === ChallengeDifficulty.MEDIUM ? 20
    : difficulty === ChallengeDifficulty.HARD ? 12
    : 8;

  const coverageThreshold =
    difficulty === ChallengeDifficulty.EASY ? 0.6
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.7
    : difficulty === ChallengeDifficulty.HARD ? 0.8
    : 0.9;

  return {
    payload: {
      gestureName: selectedGesture,
      targetPath,
      canvasSize,
      distanceTolerance,
      coverageThreshold,
      instruction: `Trace the ${selectedGesture} shape with natural movement`,
      showGuide: difficulty !== ChallengeDifficulty.EXTREME,
      strokeWidth: 3,
    },
    solution: {
      type: ChallengeType.GESTURE_SIGNATURE,
      answer: { gestureName: selectedGesture, path: targetPath },
      tolerance: distanceTolerance,
      metadata: { coverageThreshold, canvasSize },
    },
  };
}

function generateContextualReasoningPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const scenarios: Array<{
    id: string;
    scene: string;
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    category: string;
  }> = [
    {
      id: 'falling_glass',
      scene: 'A glass sits on the edge of a table. A hand is pushing it toward the edge.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'The glass falls and breaks on the floor', isCorrect: true },
        { id: 'b', text: 'The glass floats upward', isCorrect: false },
        { id: 'c', text: 'The table shrinks', isCorrect: false },
        { id: 'd', text: 'The glass turns into water', isCorrect: false },
      ]),
      category: 'physics',
    },
    {
      id: 'rain_cloud',
      scene: 'Dark clouds gather overhead. The air feels humid and cool.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'It starts to rain', isCorrect: true },
        { id: 'b', text: 'Snow falls in summer', isCorrect: false },
        { id: 'c', text: 'The ground rises up', isCorrect: false },
        { id: 'd', text: 'The sun appears immediately', isCorrect: false },
      ]),
      category: 'weather',
    },
    {
      id: 'match_strike',
      scene: 'A person holds a match and strikes it against the rough side of the matchbox.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'The match produces a flame', isCorrect: true },
        { id: 'b', text: 'The match freezes', isCorrect: false },
        { id: 'c', text: 'The matchbox explodes', isCorrect: false },
        { id: 'd', text: 'The match becomes a flower', isCorrect: false },
      ]),
      category: 'physics',
    },
    {
      id: 'boiling_water',
      scene: 'A pot of water is on a stove. Steam is rising and bubbles are forming.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'The water begins to boil vigorously', isCorrect: true },
        { id: 'b', text: 'The water turns to ice', isCorrect: false },
        { id: 'c', text: 'The pot starts flying', isCorrect: false },
        { id: 'd', text: 'The water solidifies into jelly', isCorrect: false },
      ]),
      category: 'physics',
    },
    {
      id: 'ball_ramp',
      scene: 'A ball is placed at the top of a ramp tilted downward at 30 degrees.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'The ball rolls down the ramp', isCorrect: true },
        { id: 'b', text: 'The ball rolls upward', isCorrect: false },
        { id: 'c', text: 'The ball stays perfectly still', isCorrect: false },
        { id: 'd', text: 'The ramp turns into a wall', isCorrect: false },
      ]),
      category: 'physics',
    },
    {
      id: 'ice_sun',
      scene: 'An ice cube sits on a plate in direct sunlight on a hot summer day.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'The ice cube melts into water', isCorrect: true },
        { id: 'b', text: 'The ice cube grows larger', isCorrect: false },
        { id: 'c', text: 'The ice cube turns to stone', isCorrect: false },
        { id: 'd', text: 'The sun freezes', isCorrect: false },
      ]),
      category: 'physics',
    },
  ];

  // For harder difficulties, add more plausible distractors
  if (difficulty === ChallengeDifficulty.HARD || difficulty === ChallengeDifficulty.EXTREME) {
    scenarios.push(
      {
        id: 'triple_beam',
        scene: 'Three objects of different sizes sit on a balanced beam. A small weight is added to the right side.',
        question: 'What happens to the beam?',
        options: shuffle([
          { id: 'a', text: 'The beam tilts slightly to the right', isCorrect: true },
          { id: 'b', text: 'The beam tilts slightly to the left', isCorrect: false },
          { id: 'c', text: 'The beam stays perfectly level', isCorrect: false },
          { id: 'd', text: 'The beam spins in a circle', isCorrect: false },
        ]),
        category: 'physics',
      },
      {
        id: 'shadow_sun',
        scene: 'It is 4 PM. The sun is low in the sky. A tall pole casts a shadow on the ground.',
        question: 'What happens to the shadow as time passes toward evening?',
        options: shuffle([
          { id: 'a', text: 'The shadow gets longer', isCorrect: true },
          { id: 'b', text: 'The shadow gets shorter', isCorrect: false },
          { id: 'c', text: 'The shadow stays the same length', isCorrect: false },
          { id: 'd', text: 'The shadow disappears immediately', isCorrect: false },
        ]),
        category: 'physics',
      },
    );
  }

  const selectedScenario = randPick(scenarios);
  const correctOptionId = selectedScenario.options.find((o) => o.isCorrect)!.id;

  return {
    payload: {
      scenarioId: selectedScenario.id,
      scene: selectedScenario.scene,
      question: selectedScenario.question,
      options: selectedScenario.options.map((o) => ({ id: o.id, text: o.text })),
      category: selectedScenario.category,
      instruction: 'Select the most logical outcome',
    },
    solution: {
      type: ChallengeType.CONTEXTUAL_REASONING,
      answer: correctOptionId,
      tolerance: 0,
      metadata: { scenarioId: selectedScenario.id, category: selectedScenario.category },
    },
  };
}

function generateLive3DBiometricPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const shapeTypes = ['cube', 'prism', 'pyramid', 'torus', 'dodecahedron'] as const;
  const shapeType =
    difficulty === ChallengeDifficulty.EASY
      ? 'cube'
      : difficulty === ChallengeDifficulty.MEDIUM
        ? randPick(['cube', 'prism', 'pyramid'] as const)
        : randPick(shapeTypes);

  const targetRotationX = randInt(0, 360);
  const targetRotationY = randInt(0, 360);
  const targetRotationZ = difficulty === ChallengeDifficulty.EXTREME ? randInt(0, 360) : 0;

  const angularTolerance =
    difficulty === ChallengeDifficulty.EASY ? 25
    : difficulty === ChallengeDifficulty.MEDIUM ? 15
    : difficulty === ChallengeDifficulty.HARD ? 10
    : 5;

  const surfaceFeature = {
    color: `hsl(${randInt(0, 360)}, 70%, 55%)`,
    pattern: randPick(['solid', 'striped', 'dotted', 'gradient'] as const),
    marking: randPick(['none', 'arrow', 'cross', 'dot', 'star'] as const),
    markingFace: randPick(['front', 'top', 'right'] as const),
  };

  return {
    payload: {
      shapeType,
      targetRotation: { x: targetRotationX, y: targetRotationY, z: targetRotationZ },
      angularTolerance,
      surfaceFeature,
      renderConfig: {
        width: 300,
        height: 300,
        perspective: 600,
        lighting: 'directional' as const,
        shadow: true,
      },
      instruction: `Rotate the ${shapeType} to match the target orientation`,
      showTargetPreview: difficulty !== ChallengeDifficulty.EXTREME,
    },
    solution: {
      type: ChallengeType.LIVE_3D_BIOMETRIC,
      answer: { x: targetRotationX, y: targetRotationY, z: targetRotationZ },
      tolerance: angularTolerance,
      metadata: { shapeType, angularTolerance },
    },
  };
}

function generateZeroKnowledgeProofPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  // PoW difficulty: number of leading zero bits required
  const powDifficulty =
    difficulty === ChallengeDifficulty.EASY ? 8
    : difficulty === ChallengeDifficulty.MEDIUM ? 12
    : difficulty === ChallengeDifficulty.HARD ? 16
    : 20;

  const challengeSeed = Array.from({ length: 32 }, () =>
    randInt(0, 255).toString(16).padStart(2, '0'),
  ).join('');

  // Visual discrimination component
  const gridSize = 3;
  const totalCells = gridSize * gridSize;
  const targetIndex = randInt(0, totalCells - 1);
  const targetColor = `hsl(${randInt(0, 360)}, 70%, 55%)`;

  const cells = Array.from({ length: totalCells }, (_, i) => ({
    index: i,
    isTarget: i === targetIndex,
    color: i === targetIndex ? targetColor : `hsl(${randInt(0, 360)}, 70%, 55%)`,
  }));

  return {
    payload: {
      powDifficulty,
      challengeSeed,
      visualGrid: { gridSize, cells },
      instruction: 'Solve the hash puzzle and identify the target cell',
      maxIterations: Math.pow(2, powDifficulty) * 2,
    },
    solution: {
      type: ChallengeType.ZERO_KNOWLEDGE_PROOF,
      answer: { targetIndex, powDifficulty },
      tolerance: 0,
      metadata: { powDifficulty, challengeSeed, targetIndex },
    },
  };
}

// ─── Challenge Generator Registry ──────────────────────────────────────────

type PayloadGenerator = (difficulty: ChallengeDifficulty) => {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
};

const GENERATORS: Record<ChallengeType, PayloadGenerator> = {
  [ChallengeType.ADVERSARIAL_PUZZLE]: generateAdversarialPuzzlePayload,
  [ChallengeType.HUMAN_INTUITION_GRID]: generateHumanIntuitionGridPayload,
  [ChallengeType.PHYSICS_CHAOS]: generatePhysicsChaosPayload,
  [ChallengeType.TEMPORAL_MEMORY]: generateTemporalMemoryPayload,
  [ChallengeType.OPTICAL_ILLUSION_MAZE]: generateOpticalIllusionMazePayload,
  [ChallengeType.VOICE_RHYTHM]: generateVoiceRhythmPayload,
  [ChallengeType.GESTURE_SIGNATURE]: generateGestureSignaturePayload,
  [ChallengeType.CONTEXTUAL_REASONING]: generateContextualReasoningPayload,
  [ChallengeType.LIVE_3D_BIOMETRIC]: generateLive3DBiometricPayload,
  [ChallengeType.ZERO_KNOWLEDGE_PROOF]: generateZeroKnowledgeProofPayload,
};

// ─── Challenge Type Selection by Risk ──────────────────────────────────────

/**
 * Select challenge type(s) based on the risk score.
 * Low risk → easy challenges; High risk → hard challenges.
 */
function selectChallengeType(riskScore: number): ChallengeType {
  if (riskScore < 0.25) {
    return randPick([
      ChallengeType.HUMAN_INTUITION_GRID,
      ChallengeType.ADVERSARIAL_PUZZLE,
    ]);
  } else if (riskScore < 0.5) {
    return randPick([
      ChallengeType.TEMPORAL_MEMORY,
      ChallengeType.GESTURE_SIGNATURE,
      ChallengeType.VOICE_RHYTHM,
    ]);
  } else if (riskScore < 0.75) {
    return randPick([
      ChallengeType.PHYSICS_CHAOS,
      ChallengeType.OPTICAL_ILLUSION_MAZE,
      ChallengeType.CONTEXTUAL_REASONING,
      ChallengeType.LIVE_3D_BIOMETRIC,
    ]);
  } else {
    return randPick([
      ChallengeType.ZERO_KNOWLEDGE_PROOF,
      ChallengeType.OPTICAL_ILLUSION_MAZE,
      ChallengeType.LIVE_3D_BIOMETRIC,
    ]);
  }
}

/**
 * Select difficulty based on risk score.
 */
function selectDifficulty(riskScore: number, requestedDifficulty?: string): ChallengeDifficulty {
  // If client requests a specific difficulty, validate and use it
  if (requestedDifficulty) {
    const valid = Object.values(ChallengeDifficulty) as string[];
    if (valid.includes(requestedDifficulty)) {
      return requestedDifficulty as ChallengeDifficulty;
    }
  }

  if (riskScore < 0.2) return ChallengeDifficulty.EASY;
  if (riskScore < 0.5) return ChallengeDifficulty.MEDIUM;
  if (riskScore < 0.8) return ChallengeDifficulty.HARD;
  return ChallengeDifficulty.EXTREME;
}

// ─── Client IP Extraction ──────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  // Try common proxy headers first
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}

// ─── POST Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    recordAnalyticsEvent({
      id: generateId(),
      type: 'block',
      timestamp: Date.now(),
      sessionId: '',
      metadata: { reason: 'rate_limit_exceeded', ip: clientIp },
    });

    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Max 10 requests per minute.' },
      { status: 429 },
    );
  }

  // Cleanup expired challenges periodically
  cleanupExpired();

  // Parse and validate request body
  let body: {
    sessionId?: string;
    riskScore?: number;
    difficulty?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  // Validate sessionId
  const sessionId = body.sessionId || '';
  if (sessionId.length > 256) {
    return NextResponse.json(
      { success: false, error: 'sessionId too long (max 256 characters)' },
      { status: 400 },
    );
  }

  // Validate riskScore
  const riskScore = typeof body.riskScore === 'number' ? body.riskScore : 0.15;
  if (riskScore < 0 || riskScore > 1) {
    return NextResponse.json(
      { success: false, error: 'riskScore must be between 0 and 1' },
      { status: 400 },
    );
  }

  // Validate difficulty
  if (body.difficulty) {
    const validDifficulties = Object.values(ChallengeDifficulty) as string[];
    if (!validDifficulties.includes(body.difficulty)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`,
        },
        { status: 400 },
      );
    }
  }

  // Select challenge type and difficulty
  const challengeType = selectChallengeType(riskScore);
  const difficulty = selectDifficulty(riskScore, body.difficulty);

  // Generate challenge
  const generator = GENERATORS[challengeType];
  const { payload, solution } = generator(difficulty);

  const now = Date.now();
  const challengeId = generateId();

  // Store challenge with solution
  storeChallenge({
    id: challengeId,
    type: challengeType,
    difficulty,
    payload,
    solution,
    expiresAt: now + DEFAULT_EXPIRATION_MS,
    maxAttempts: DIFFICULTY_MAX_ATTEMPTS[difficulty],
    attempts: 0,
    createdAt: now,
    sessionId,
    riskScore,
    clientIp,
  });

  // Record analytics
  recordAnalyticsEvent({
    id: generateId(),
    type: 'challenge_shown',
    timestamp: now,
    challengeType,
    riskScore,
    sessionId,
    metadata: { difficulty, challengeId },
  });

  // Return challenge WITHOUT solution
  return NextResponse.json({
    success: true,
    challenge: {
      id: challengeId,
      type: challengeType,
      difficulty,
      payload,
      expiresAt: now + DEFAULT_EXPIRATION_MS,
      maxAttempts: DIFFICULTY_MAX_ATTEMPTS[difficulty],
    },
  });
}
