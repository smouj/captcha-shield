/**
 * CAPTCHA Shield v4.0 "Fortress" — Core Challenge Generation & Verification Engine
 *
 * The heart of the Fortress platform. Generates 10 distinct challenge types,
 * verifies user solutions with configurable tolerance, and selects challenges
 * based on risk assessment scores.
 *
 * Architecture:
 *   CHALLENGE_DEFINITIONS  →  Registry of metadata for all 10 types
 *   generateChallenge()    →  Creates a ChallengeInstance with random params & solution
 *   verifySolution()       →  Checks user answer against solution with tolerance
 *   selectChallenges()     →  Picks 1-2 types based on risk score, never same type twice
 *
 * @module captcha-engine-v4
 */

import {
  ChallengeType,
  ChallengeDifficulty,
  ChallengeCategory,
  ChallengeDefinition,
  ChallengeInstance,
  ChallengeSolution,
  ChallengeResult,
  RiskLevel,
} from './types';

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Returns a random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random float in [min, max). */
function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Picks a random element from an array. */
function randPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Shuffles an array in-place (Fisher-Yates) and returns it. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generates a unique challenge ID using timestamp + random suffix. */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `ch_${timestamp}_${random}`;
}

/** Angular difference in degrees, accounting for wrap-around (0-360). */
function angularDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Default expiration in ms from creation time. */
const DEFAULT_EXPIRATION_MS = 60_000;

/** Maps difficulty to max allowed attempts. */
const DIFFICULTY_MAX_ATTEMPTS: Record<ChallengeDifficulty, number> = {
  [ChallengeDifficulty.EASY]: 5,
  [ChallengeDifficulty.MEDIUM]: 3,
  [ChallengeDifficulty.HARD]: 2,
  [ChallengeDifficulty.EXTREME]: 1,
};

// ─── Challenge Definitions Registry ──────────────────────────────────────────

/**
 * Complete metadata registry for all 10 v4.0 challenge types.
 * Each entry describes the challenge's capabilities, requirements,
 * and estimated human completion time.
 */
export const CHALLENGE_DEFINITIONS: Map<ChallengeType, ChallengeDefinition> = new Map([
  [
    ChallengeType.ADVERSARIAL_PUZZLE,
    {
      type: ChallengeType.ADVERSARIAL_PUZZLE,
      name: 'Adversarial Puzzle',
      description:
        'Canvas-rendered sliding puzzle with adversarial noise overlays, distortion fields, and decoy edges designed to confuse automated solvers.',
      category: ChallengeCategory.VISUAL,
      difficulty: ChallengeDifficulty.MEDIUM,
      aiResistanceScore: 0.82,
      avgHumanTime: 18,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['audio_description', 'high_contrast'],
    },
  ],
  [
    ChallengeType.HUMAN_INTUITION_GRID,
    {
      type: ChallengeType.HUMAN_INTUITION_GRID,
      name: 'Human Intuition Grid',
      description:
        'A 4×4 grid of visual elements where one cell subtly differs. Requires human intuition to identify the "odd one out" — trivial for humans, extremely hard for AI.',
      category: ChallengeCategory.COGNITIVE,
      difficulty: ChallengeDifficulty.EASY,
      aiResistanceScore: 0.91,
      avgHumanTime: 8,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['audio_description', 'keyboard_nav'],
    },
  ],
  [
    ChallengeType.PHYSICS_CHAOS,
    {
      type: ChallengeType.PHYSICS_CHAOS,
      name: 'Physics Chaos',
      description:
        'A physics simulation where the user must balance objects on a virtual surface. Tests understanding of gravity, mass, and equilibrium.',
      category: ChallengeCategory.INTERACTIVE,
      difficulty: ChallengeDifficulty.HARD,
      aiResistanceScore: 0.88,
      avgHumanTime: 22,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['keyboard_controls', 'haptic_feedback'],
    },
  ],
  [
    ChallengeType.TEMPORAL_MEMORY,
    {
      type: ChallengeType.TEMPORAL_MEMORY,
      name: 'Temporal Memory',
      description:
        'A sequence of visual items is displayed for 1.8 seconds. The user must reproduce the exact order from memory. Exploits human episodic memory.',
      category: ChallengeCategory.COGNITIVE,
      difficulty: ChallengeDifficulty.MEDIUM,
      aiResistanceScore: 0.75,
      avgHumanTime: 12,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['audio_cue', 'extended_display_time'],
    },
  ],
  [
    ChallengeType.OPTICAL_ILLUSION_MAZE,
    {
      type: ChallengeType.OPTICAL_ILLUSION_MAZE,
      name: 'Optical Illusion Maze',
      description:
        'Navigate a maze layered with optical illusions (Moiré patterns, impossible figures) that trick computer vision but are filtered by human perception.',
      category: ChallengeCategory.VISUAL,
      difficulty: ChallengeDifficulty.HARD,
      aiResistanceScore: 0.93,
      avgHumanTime: 25,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['simplified_view', 'audio_description'],
    },
  ],
  [
    ChallengeType.VOICE_RHYTHM,
    {
      type: ChallengeType.VOICE_RHYTHM,
      name: 'Voice Rhythm',
      description:
        'Listen to an audio rhythm pattern and repeat it by tapping. Tests temporal auditory processing and motor synchronization.',
      category: ChallengeCategory.AUDIO,
      difficulty: ChallengeDifficulty.MEDIUM,
      aiResistanceScore: 0.85,
      avgHumanTime: 15,
      requiresAudio: true,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: false,
      accessibilityMode: ['visual_rhythm_display', 'haptic_beat'],
    },
  ],
  [
    ChallengeType.GESTURE_SIGNATURE,
    {
      type: ChallengeType.GESTURE_SIGNATURE,
      name: 'Gesture Signature',
      description:
        'Draw a specific gesture or shape with natural human movement. Analyzes stroke dynamics — speed variance, acceleration, and micro-tremors.',
      category: ChallengeCategory.BIOMETRIC,
      difficulty: ChallengeDifficulty.MEDIUM,
      aiResistanceScore: 0.87,
      avgHumanTime: 10,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['keyboard_path_input', 'simplified_gesture'],
    },
  ],
  [
    ChallengeType.CONTEXTUAL_REASONING,
    {
      type: ChallengeType.CONTEXTUAL_REASONING,
      name: 'Contextual Reasoning',
      description:
        'A visual scene is presented with the question "What happens next?" Requires common-sense reasoning about physical and social causality.',
      category: ChallengeCategory.COGNITIVE,
      difficulty: ChallengeDifficulty.HARD,
      aiResistanceScore: 0.94,
      avgHumanTime: 14,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['audio_description', 'text_scenarios'],
    },
  ],
  [
    ChallengeType.LIVE_3D_BIOMETRIC,
    {
      type: ChallengeType.LIVE_3D_BIOMETRIC,
      name: 'Live 3D Biometric',
      description:
        'Rotate a 3D object to match a target orientation. The rotation path must show natural acceleration curves — bots produce linear paths.',
      category: ChallengeCategory.BIOMETRIC,
      difficulty: ChallengeDifficulty.HARD,
      aiResistanceScore: 0.90,
      avgHumanTime: 16,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['keyboard_rotation', 'snap_angles'],
    },
  ],
  [
    ChallengeType.ZERO_KNOWLEDGE_PROOF,
    {
      type: ChallengeType.ZERO_KNOWLEDGE_PROOF,
      name: 'Zero-Knowledge Proof',
      description:
        'A hybrid challenge combining a proof-of-work hash puzzle with a visual discrimination task. The PoW ensures computational effort; the visual ensures human involvement.',
      category: ChallengeCategory.CRYPTO,
      difficulty: ChallengeDifficulty.EXTREME,
      aiResistanceScore: 0.96,
      avgHumanTime: 28,
      requiresAudio: false,
      requiresCamera: false,
      requiresMicrophone: false,
      canvasRendered: true,
      accessibilityMode: ['extended_time', 'simplified_visual'],
    },
  ],
]);

// ─── Per-Type Payload Generators ─────────────────────────────────────────────

/**
 * Generates an adversarial puzzle payload.
 * Creates a canvas-based sliding puzzle with noise overlays and decoy edges.
 */
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
  const noiseLevel = difficulty === ChallengeDifficulty.EASY ? 0.1
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.25
    : difficulty === ChallengeDifficulty.HARD ? 0.45
    : 0.65;

  const distortionStrength = difficulty === ChallengeDifficulty.EASY ? 0.05
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.15
    : difficulty === ChallengeDifficulty.HARD ? 0.3
    : 0.5;

  const decoyEdges = difficulty === ChallengeDifficulty.EASY ? 0
    : difficulty === ChallengeDifficulty.MEDIUM ? 2
    : difficulty === ChallengeDifficulty.HARD ? 4
    : 6;

  // Generate piece positions
  const pieces: Array<{
    id: number;
    startX: number;
    targetX: number;
    width: number;
    shape: 'rect' | 'wave' | 'tab' | 'jigsaw';
  }> = [];

  const tolerance = difficulty === ChallengeDifficulty.EASY ? 8
    : difficulty === ChallengeDifficulty.MEDIUM ? 5
    : difficulty === ChallengeDifficulty.HARD ? 3
    : 2;

  for (let i = 0; i < pieceCount; i++) {
    const pieceWidth = Math.floor(canvasWidth / (pieceCount + 1));
    const targetX = randInt(30, canvasWidth - 50);
    const shapeType = randPick(['rect', 'wave', 'tab', 'jigsaw'] as const);

    pieces.push({
      id: i,
      startX: randInt(10, canvasWidth - pieceWidth - 10),
      targetX,
      width: pieceWidth,
      shape: shapeType,
    });
  }

  // Noise configuration for canvas rendering
  const noiseConfig = {
    type: randPick(['gaussian', 'perlin', 'salt_pepper'] as const),
    intensity: noiseLevel,
    overlayOpacity: 0.15 + noiseLevel * 0.3,
    colorShift: randInt(0, 30),
  };

  // Distortion field configuration
  const distortionField = {
    type: randPick(['wave', 'swirl', 'ripple'] as const),
    amplitude: distortionStrength * 20,
    frequency: randFloat(0.02, 0.08),
    phase: randFloat(0, Math.PI * 2),
  };

  const payload = {
    canvasWidth,
    canvasHeight,
    pieceCount,
    pieces,
    noiseConfig,
    distortionField,
    decoyEdges,
    tolerance,
    seed: randInt(0, 999999),
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.ADVERSARIAL_PUZZLE,
    answer: pieces.map(p => ({ id: p.id, targetX: p.targetX })),
    tolerance,
    metadata: { difficulty, pieceCount },
  };

  return { payload, solution };
}

/**
 * Generates a 4×4 human intuition grid payload.
 * One cell is the "odd one out" with a subtle visual difference.
 */
function generateHumanIntuitionGridPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const gridSize = 4;
  const totalCells = gridSize * gridSize;

  // Base visual properties that all cells share
  const baseShape = randPick(['circle', 'square', 'triangle', 'hexagon', 'star', 'diamond'] as const);
  const baseColor = `hsl(${randInt(0, 360)}, ${randInt(50, 80)}%, ${randInt(45, 65)}%)`;
  const baseRotation = randInt(0, 30) * 5; // multiples of 5 for subtlety
  const baseSize = randInt(28, 42);

  // Choose which property differs for the odd cell
  const differProperty = difficulty === ChallengeDifficulty.EASY
    ? randPick(['color', 'shape'] as const)
    : difficulty === ChallengeDifficulty.MEDIUM
      ? randPick(['color', 'rotation', 'size'] as const)
      : randPick(['rotation', 'size', 'opacity', 'stroke_dash'] as const);

  // The odd cell index
  const oddIndex = randInt(0, totalCells - 1);

  // Build the grid
  const grid: Array<{
    index: number;
    shape: string;
    color: string;
    rotation: number;
    size: number;
    opacity: number;
    strokeDash: boolean;
    isOdd: boolean;
  }> = [];

  for (let i = 0; i < totalCells; i++) {
    const isOdd = i === oddIndex;

    let cellColor = baseColor;
    let cellRotation = baseRotation;
    let cellSize = baseSize;
    let cellOpacity = 1.0;
    let cellStrokeDash = false;
    let cellShape = baseShape;

    if (isOdd) {
      switch (differProperty) {
        case 'color': {
          // Shift hue by 30-50 degrees — noticeable but subtle
          const hueShift = randInt(30, 50);
          cellColor = `hsl(${(parseInt(baseColor.match(/\d+/)?.[0] || '0') + hueShift) % 360}, ${randInt(50, 80)}%, ${randInt(45, 65)}%)`;
          break;
        }
        case 'shape': {
          const altShapes = (['circle', 'square', 'triangle', 'hexagon', 'star', 'diamond'] as const).filter(s => s !== baseShape);
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

    grid.push({
      index: i,
      shape: cellShape,
      color: cellColor,
      rotation: cellRotation,
      size: cellSize,
      opacity: cellOpacity,
      strokeDash: cellStrokeDash,
      isOdd,
    });
  }

  const payload = {
    gridSize,
    grid,
    baseShape,
    baseColor,
    instruction: 'Find the cell that is different from all others',
    displayTime: difficulty === ChallengeDifficulty.EASY ? 5000 : difficulty === ChallengeDifficulty.MEDIUM ? 4000 : 3000,
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.HUMAN_INTUITION_GRID,
    answer: { oddIndex, differProperty },
    tolerance: 0, // exact match required
    metadata: { gridSize, differProperty },
  };

  return { payload, solution };
}

/**
 * Generates a physics chaos payload.
 * Creates a balance scenario with objects of varying mass and position.
 */
function generatePhysicsChaosPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const beamLength = 600; // px
  const pivotX = beamLength / 2;

  // Number of objects to place
  const objectCount = difficulty === ChallengeDifficulty.EASY ? 2
    : difficulty === ChallengeDifficulty.MEDIUM ? 3
    : difficulty === ChallengeDifficulty.HARD ? 4
    : 5;

  // Pre-placed (fixed) objects on the beam
  const fixedObjects: Array<{
    id: number;
    mass: number;
    position: number; // distance from left end of beam
    shape: 'circle' | 'square' | 'triangle';
    color: string;
  }> = [];

  // User-placeable objects
  const placeableObjects: Array<{
    id: number;
    mass: number;
    shape: 'circle' | 'square' | 'triangle';
    color: string;
  }> = [];

  // Calculate torque from fixed side
  let fixedTorque = 0;
  for (let i = 0; i < objectCount; i++) {
    const mass = randInt(1, 5);
    const position = randInt(30, beamLength - 30);
    const shape = randPick(['circle', 'square', 'triangle'] as const);
    const color = `hsl(${randInt(0, 360)}, 70%, 55%)`;

    fixedObjects.push({ id: i, mass, position, shape, color });
    fixedTorque += mass * (position - pivotX);
  }

  // For each placeable object, calculate the position that balances the beam
  // torque_balance: sum(mass * (pos - pivotX)) for all objects = 0
  // We add placeable objects one by one; each has a "correct" position
  const correctPositions: number[] = [];

  let remainingTorque = fixedTorque;

  for (let i = 0; i < Math.ceil(objectCount / 2); i++) {
    const mass = randInt(1, 5);
    const shape = randPick(['circle', 'square', 'triangle'] as const);
    const color = `hsl(${randInt(0, 360)}, 70%, 55%)`;

    placeableObjects.push({ id: fixedObjects.length + i, mass, shape, color });

    // Calculate balancing position: pos = pivotX + remainingTorque / mass
    let targetPos = pivotX + remainingTorque / mass;

    // Clamp to beam bounds
    targetPos = Math.max(20, Math.min(beamLength - 20, targetPos));

    correctPositions.push(Math.round(targetPos * 10) / 10);

    // Update remaining torque for multi-object scenarios
    remainingTorque -= mass * (targetPos - pivotX);
  }

  const tolerancePercent = difficulty === ChallengeDifficulty.EASY ? 0.10
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.07
    : difficulty === ChallengeDifficulty.HARD ? 0.05
    : 0.03;

  const payload = {
    beamLength,
    pivotX,
    gravity: 9.81,
    fixedObjects,
    placeableObjects,
    tolerancePercent,
    simulationSpeed: 1.0,
    groundFriction: randFloat(0.2, 0.5),
    windForce: difficulty === ChallengeDifficulty.EXTREME ? randFloat(-2, 2) : 0,
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.PHYSICS_CHAOS,
    answer: correctPositions,
    tolerance: tolerancePercent,
    metadata: { objectCount, beamLength, pivotX },
  };

  return { payload, solution };
}

/**
 * Generates a temporal memory payload.
 * Creates a sequence of items shown briefly (1.8s), user must recall order.
 */
function generateTemporalMemoryPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const sequenceLength = difficulty === ChallengeDifficulty.EASY ? 3
    : difficulty === ChallengeDifficulty.MEDIUM ? 4
    : difficulty === ChallengeDifficulty.HARD ? 5
    : 7;

  const displayTime = difficulty === ChallengeDifficulty.EASY ? 2500
    : difficulty === ChallengeDifficulty.MEDIUM ? 1800
    : difficulty === ChallengeDifficulty.HARD ? 1200
    : 800;

  // Item pool — symbols that are visually distinct
  const symbolPool = [
    '🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '🟤',
    '▲', '◆', '●', '■', '★', '⬟', '⬡', '⬢',
  ];

  // Pick unique symbols for the sequence
  const shuffledPool = shuffle([...symbolPool]);
  const sequence = shuffledPool.slice(0, sequenceLength);

  // Distractor items for the recall phase (extras not in sequence)
  const distractorCount = Math.min(4, symbolPool.length - sequenceLength);
  const distractors = shuffledPool.slice(sequenceLength, sequenceLength + distractorCount);

  // All items shown during recall (sequence items + distractors), shuffled
  const recallItems = shuffle([...sequence, ...distractors]);

  const payload = {
    sequence,
    recallItems,
    displayTime,
    sequenceLength,
    instruction: 'Watch the sequence, then reproduce the exact order',
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.TEMPORAL_MEMORY,
    answer: sequence,
    tolerance: 0, // exact order required
    metadata: { sequenceLength, displayTime },
  };

  return { payload, solution };
}

/**
 * Generates an optical illusion maze payload.
 * Creates a maze grid with illusion overlays.
 */
function generateOpticalIllusionMazePayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const mazeSize = difficulty === ChallengeDifficulty.EASY ? 8
    : difficulty === ChallengeDifficulty.MEDIUM ? 12
    : difficulty === ChallengeDifficulty.HARD ? 16
    : 20;

  // Generate a simple maze using recursive backtracking (represented as walls)
  // Each cell has walls: top, right, bottom, left
  type Cell = { top: boolean; right: boolean; bottom: boolean; left: boolean; visited: boolean };
  const maze: Cell[][] = [];

  for (let y = 0; y < mazeSize; y++) {
    maze[y] = [];
    for (let x = 0; x < mazeSize; x++) {
      maze[y][x] = { top: true, right: true, bottom: true, left: true, visited: false };
    }
  }

  // Recursive backtracking maze generation
  const stack: Array<[number, number]> = [];
  const startX = 0;
  const startY = 0;
  maze[startY][startX].visited = true;
  stack.push([startX, startY]);

  const directions: Array<[number, number, 'top' | 'right' | 'bottom' | 'left', 'bottom' | 'left' | 'top' | 'right']> = [
    [0, -1, 'top', 'bottom'],
    [1, 0, 'right', 'left'],
    [0, 1, 'bottom', 'top'],
    [-1, 0, 'left', 'right'],
  ];

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors = directions
      .map(([dx, dy, wall, opposite]) => ({
        nx: cx + dx, ny: cy + dy, wall, opposite,
      }))
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

  // Solve the maze (BFS) to get the correct path
  const endX = mazeSize - 1;
  const endY = mazeSize - 1;
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: Array<[number, number]> = [[startX, startY]];
  visited.add(`${startX},${startY}`);

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

  // Reconstruct path
  const correctPath: Array<[number, number]> = [];
  let current = `${endX},${endY}`;
  while (current) {
    const [x, y] = current.split(',').map(Number);
    correctPath.unshift([x, y]);
    current = parent.get(current) || '';
  }

  // Optical illusion overlays
  const illusionTypes = ['moire', 'hermann_grid', 'cafe_wall', 'penrose_triangle', 'eszcher_stairs'] as const;
  const activeIllusions = difficulty === ChallengeDifficulty.EASY
    ? [randPick(illusionTypes)]
    : difficulty === ChallengeDifficulty.MEDIUM
      ? shuffle([...illusionTypes]).slice(0, 2)
      : shuffle([...illusionTypes]).slice(0, 3);

  const illusionIntensity = difficulty === ChallengeDifficulty.EASY ? 0.15
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.3
    : difficulty === ChallengeDifficulty.HARD ? 0.5
    : 0.7;

  // Serialize maze walls for payload
  const mazeData = maze.map(row =>
    row.map(cell => ({
      top: cell.top,
      right: cell.right,
      bottom: cell.bottom,
      left: cell.left,
    }))
  );

  const payload = {
    mazeSize,
    mazeData,
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    activeIllusions,
    illusionIntensity,
    wallColor: '#1a1a2e',
    pathColor: '#e0e0e0',
    illusionBlendMode: 'overlay' as const,
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.OPTICAL_ILLUSION_MAZE,
    answer: correctPath,
    tolerance: 0, // path must be exact
    metadata: { mazeSize, pathLength: correctPath.length, illusionCount: activeIllusions.length },
  };

  return { payload, solution };
}

/**
 * Generates a voice rhythm payload.
 * Creates an audio rhythm pattern that the user must repeat by tapping.
 */
function generateVoiceRhythmPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const beatCount = difficulty === ChallengeDifficulty.EASY ? 4
    : difficulty === ChallengeDifficulty.MEDIUM ? 6
    : difficulty === ChallengeDifficulty.HARD ? 8
    : 10;

  const bpm = difficulty === ChallengeDifficulty.EASY ? 80
    : difficulty === ChallengeDifficulty.MEDIUM ? 100
    : difficulty === ChallengeDifficulty.HARD ? 120
    : 140;

  const beatIntervalMs = 60000 / bpm;

  // Generate a rhythm pattern: each beat is either 'on' or 'off'
  // Ensure at least 50% beats are 'on'
  const pattern: Array<{ beat: number; active: boolean; duration: number; frequency: number }> = [];
  let activeCount = 0;

  for (let i = 0; i < beatCount; i++) {
    const active = Math.random() > 0.35; // ~65% active
    if (active) activeCount++;
    pattern.push({
      beat: i,
      active,
      duration: active ? randInt(100, 300) : 0,
      frequency: active ? randInt(300, 800) : 0,
    });
  }

  // Ensure minimum active beats
  if (activeCount < Math.ceil(beatCount * 0.5)) {
    for (let i = 0; i < pattern.length && activeCount < Math.ceil(beatCount * 0.5); i++) {
      if (!pattern[i].active) {
        pattern[i].active = true;
        pattern[i].duration = randInt(100, 300);
        pattern[i].frequency = randInt(300, 800);
        activeCount++;
      }
    }
  }

  // The correct answer is the sequence of active beat indices
  const correctBeats = pattern
    .map((p, i) => p.active ? i : -1)
    .filter(i => i !== -1);

  // Timing tolerance: how close the user's taps must be to the correct beat times
  const timingToleranceMs = difficulty === ChallengeDifficulty.EASY ? 300
    : difficulty === ChallengeDifficulty.MEDIUM ? 200
    : difficulty === ChallengeDifficulty.HARD ? 120
    : 80;

  const payload = {
    pattern,
    bpm,
    beatIntervalMs,
    beatCount,
    audioFormat: 'webaudio' as const,
    totalDurationMs: beatCount * beatIntervalMs,
    instruction: 'Listen to the rhythm, then tap to repeat it',
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.VOICE_RHYTHM,
    answer: { correctBeats, beatTimes: correctBeats.map(b => b * beatIntervalMs) },
    tolerance: timingToleranceMs,
    metadata: { bpm, beatCount, timingToleranceMs },
  };

  return { payload, solution };
}

/**
 * Generates a gesture signature payload.
 * Creates a target gesture path the user must trace with natural movement.
 */
function generateGestureSignaturePayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const canvasSize = 300;

  // Define gesture templates (normalized 0-1 coordinates)
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
  const selectedGesture = difficulty === ChallengeDifficulty.EASY
    ? randPick(['circle', 'checkmark', 'triangle'] as const)
    : difficulty === ChallengeDifficulty.MEDIUM
      ? randPick(['triangle', 'zigzag', 'wave'] as const)
      : randPick(templateNames as unknown as readonly string[]) as string;

  const targetPath = gestureTemplates[selectedGesture].map(p => ({
    x: Math.round(p.x * canvasSize * 10) / 10,
    y: Math.round(p.y * canvasSize * 10) / 10,
  }));

  // Path similarity tolerance (proportion of points that must be within distance)
  const distanceTolerance = difficulty === ChallengeDifficulty.EASY ? 30
    : difficulty === ChallengeDifficulty.MEDIUM ? 20
    : difficulty === ChallengeDifficulty.HARD ? 12
    : 8;

  // Minimum percentage of path points the user must trace
  const coverageThreshold = difficulty === ChallengeDifficulty.EASY ? 0.6
    : difficulty === ChallengeDifficulty.MEDIUM ? 0.7
    : difficulty === ChallengeDifficulty.HARD ? 0.8
    : 0.9;

  const payload = {
    gestureName: selectedGesture,
    targetPath,
    canvasSize,
    distanceTolerance,
    coverageThreshold,
    instruction: `Trace the ${selectedGesture} shape with natural movement`,
    showGuide: difficulty !== ChallengeDifficulty.EXTREME,
    strokeWidth: 3,
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.GESTURE_SIGNATURE,
    answer: { gestureName: selectedGesture, path: targetPath },
    tolerance: distanceTolerance,
    metadata: { coverageThreshold, canvasSize },
  };

  return { payload, solution };
}

/**
 * Generates a contextual reasoning payload.
 * Presents a visual scenario and asks "What happens next?"
 */
function generateContextualReasoningPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  // Scenario templates with visual descriptions and correct outcomes
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
      scene: 'Dark clouds gather overhead. The air feels humid and cool. People look up at the sky.',
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
      scene: 'A pot of water is on a stove. Steam is rising and bubbles are forming at the bottom.',
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
      id: 'dog_leash',
      scene: 'A person holding a dog leash opens the front door. The dog is excited and wagging its tail.',
      question: 'What happens next?',
      options: shuffle([
        { id: 'a', text: 'The dog goes for a walk outside', isCorrect: true },
        { id: 'b', text: 'The dog starts cooking dinner', isCorrect: false },
        { id: 'c', text: 'The door disappears', isCorrect: false },
        { id: 'd', text: 'The person turns into a cat', isCorrect: false },
      ]),
      category: 'social',
    },
    {
      id: 'ball_ramp',
      scene: 'A ball is placed at the top of a ramp. The ramp is tilted downward at 30 degrees.',
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
      id: 'traffic_light',
      scene: 'A car approaches an intersection. The traffic light turns from green to yellow.',
      question: 'What should the driver do next?',
      options: shuffle([
        { id: 'a', text: 'Slow down and prepare to stop', isCorrect: true },
        { id: 'b', text: 'Accelerate to maximum speed', isCorrect: false },
        { id: 'c', text: 'Close their eyes', isCorrect: false },
        { id: 'd', text: 'Turn off the engine', isCorrect: false },
      ]),
      category: 'social',
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

  // Select scenario based on difficulty (harder = more plausible distractors)
  let selectedScenario = randPick(scenarios);

  // For harder difficulties, modify distractors to be more plausible
  if (difficulty === ChallengeDifficulty.HARD || difficulty === ChallengeDifficulty.EXTREME) {
    const hardScenarios: typeof scenarios = [
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
    ];
    selectedScenario = randPick([...scenarios, ...hardScenarios]);
  }

  const correctOptionId = selectedScenario.options.find(o => o.isCorrect)!.id;

  const payload = {
    scenarioId: selectedScenario.id,
    scene: selectedScenario.scene,
    question: selectedScenario.question,
    options: selectedScenario.options.map(o => ({ id: o.id, text: o.text })),
    category: selectedScenario.category,
    instruction: 'Select the most logical outcome',
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.CONTEXTUAL_REASONING,
    answer: correctOptionId,
    tolerance: 0,
    metadata: { scenarioId: selectedScenario.id, category: selectedScenario.category },
  };

  return { payload, solution };
}

/**
 * Generates a live 3D biometric payload.
 * Creates a 3D object with a target rotation the user must match.
 */
function generateLive3DBiometricPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  const shapeTypes = ['cube', 'prism', 'pyramid', 'torus', 'dodecahedron'] as const;
  const shapeType = difficulty === ChallengeDifficulty.EASY
    ? 'cube'
    : difficulty === ChallengeDifficulty.MEDIUM
      ? randPick(['cube', 'prism', 'pyramid'] as const)
      : randPick(shapeTypes);

  // Target rotation angles (degrees)
  const targetRotationX = randInt(0, 360);
  const targetRotationY = randInt(0, 360);
  const targetRotationZ = difficulty === ChallengeDifficulty.EXTREME ? randInt(0, 360) : 0;

  // Angular tolerance in degrees
  const angularTolerance = difficulty === ChallengeDifficulty.EASY ? 25
    : difficulty === ChallengeDifficulty.MEDIUM ? 15
    : difficulty === ChallengeDifficulty.HARD ? 10
    : 5;

  // Rotation speed metrics for biometric analysis
  const expectedRotationDuration = randFloat(1500, 4000); // ms
  const expectedAccelerationVariance = randFloat(0.1, 0.4); // humans vary; bots are linear

  // Surface features for visual matching
  const surfaceFeature = {
    color: `hsl(${randInt(0, 360)}, 70%, 55%)`,
    pattern: randPick(['solid', 'striped', 'dotted', 'gradient'] as const),
    marking: randPick(['none', 'arrow', 'cross', 'dot', 'star'] as const),
    markingFace: randPick(['front', 'top', 'right'] as const),
  };

  const payload = {
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
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.LIVE_3D_BIOMETRIC,
    answer: { x: targetRotationX, y: targetRotationY, z: targetRotationZ },
    tolerance: angularTolerance,
    metadata: {
      angularTolerance,
      expectedRotationDuration,
      expectedAccelerationVariance,
    },
  };

  return { payload, solution };
}

/**
 * Generates a zero-knowledge proof payload.
 * Combines a proof-of-work hash puzzle with a visual discrimination task.
 */
function generateZeroKnowledgeProofPayload(difficulty: ChallengeDifficulty): {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
} {
  // Proof-of-work parameters
  const powDifficulty = difficulty === ChallengeDifficulty.EASY ? 2
    : difficulty === ChallengeDifficulty.MEDIUM ? 3
    : difficulty === ChallengeDifficulty.HARD ? 4
    : 5; // number of leading zeros required in hash

  const challenge = generateId().replace(/_/g, '');
  const nonceLength = difficulty === ChallengeDifficulty.EASY ? 4
    : difficulty === ChallengeDifficulty.MEDIUM ? 6
    : difficulty === ChallengeDifficulty.HARD ? 8
    : 10;

  // Generate a simple hash (client will compute SHA-256)
  const powConfig = {
    algorithm: 'SHA-256' as const,
    challenge,
    leadingZeros: powDifficulty,
    maxNonce: Math.pow(16, nonceLength),
    nonceCharset: '0123456789abcdef',
  };

  // Visual discrimination component — find the image patch that matches
  const gridSize = difficulty === ChallengeDifficulty.EASY ? 2
    : difficulty === ChallengeDifficulty.MEDIUM ? 3
    : difficulty === ChallengeDifficulty.HARD ? 4
    : 5;

  const targetPatchId = randInt(0, gridSize * gridSize - 1);

  // Generate visual patches with subtle differences
  const patches: Array<{
    id: number;
    pattern: string;
    rotation: number;
    colorShift: number;
    isTarget: boolean;
  }> = [];

  for (let i = 0; i < gridSize * gridSize; i++) {
    patches.push({
      id: i,
      pattern: randPick(['stripes', 'dots', 'grid', 'waves'] as const),
      rotation: i === targetPatchId ? 0 : randInt(-15, 15),
      colorShift: i === targetPatchId ? 0 : randInt(-20, 20),
      isTarget: i === targetPatchId,
    });
  }

  const payload = {
    powConfig,
    visualChallenge: {
      gridSize,
      patches,
      instruction: 'Find the patch that exactly matches the target, and solve the hash puzzle',
    },
    combinedInstruction: 'Complete both the visual match and the hash puzzle to pass',
  };

  const solution: ChallengeSolution = {
    type: ChallengeType.ZERO_KNOWLEDGE_PROOF,
    answer: { targetPatchId, powChallenge: challenge, leadingZeros: powDifficulty },
    tolerance: 0,
    metadata: { powDifficulty, gridSize },
  };

  return { payload, solution };
}

// ─── Generator Dispatch Table ────────────────────────────────────────────────

type PayloadGenerator = (difficulty: ChallengeDifficulty) => {
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
};

const GENERATORS: Map<ChallengeType, PayloadGenerator> = new Map([
  [ChallengeType.ADVERSARIAL_PUZZLE, generateAdversarialPuzzlePayload],
  [ChallengeType.HUMAN_INTUITION_GRID, generateHumanIntuitionGridPayload],
  [ChallengeType.PHYSICS_CHAOS, generatePhysicsChaosPayload],
  [ChallengeType.TEMPORAL_MEMORY, generateTemporalMemoryPayload],
  [ChallengeType.OPTICAL_ILLUSION_MAZE, generateOpticalIllusionMazePayload],
  [ChallengeType.VOICE_RHYTHM, generateVoiceRhythmPayload],
  [ChallengeType.GESTURE_SIGNATURE, generateGestureSignaturePayload],
  [ChallengeType.CONTEXTUAL_REASONING, generateContextualReasoningPayload],
  [ChallengeType.LIVE_3D_BIOMETRIC, generateLive3DBiometricPayload],
  [ChallengeType.ZERO_KNOWLEDGE_PROOF, generateZeroKnowledgeProofPayload],
]);

// ─── Main Public API ─────────────────────────────────────────────────────────

/**
 * Generates a challenge instance for the specified type and difficulty.
 *
 * If `type` is not provided, a random type is selected weighted by AI resistance.
 * If `difficulty` is not provided, it defaults to `MEDIUM`.
 *
 * @param type - The challenge type to generate (optional, random if omitted)
 * @param difficulty - The difficulty level (optional, defaults to MEDIUM)
 * @returns A fully populated ChallengeInstance ready for client rendering
 *
 * @example
 * ```ts
 * const instance = generateChallenge(ChallengeType.TEMPORAL_MEMORY, ChallengeDifficulty.HARD);
 * // instance.payload contains the sequence data
 * // instance.solution contains the correct answer
 * ```
 */
export function generateChallenge(
  type?: ChallengeType,
  difficulty?: ChallengeDifficulty,
): ChallengeInstance {
  const resolvedDifficulty = difficulty ?? ChallengeDifficulty.MEDIUM;
  const resolvedType = type ?? selectWeightedRandomType();

  const generator = GENERATORS.get(resolvedType);
  if (!generator) {
    throw new Error(`No generator registered for challenge type: ${resolvedType}`);
  }

  const { payload, solution } = generator(resolvedDifficulty);
  const now = Date.now();

  return {
    id: generateId(),
    type: resolvedType,
    difficulty: resolvedDifficulty,
    payload,
    solution,
    expiresAt: now + DEFAULT_EXPIRATION_MS,
    maxAttempts: DIFFICULTY_MAX_ATTEMPTS[resolvedDifficulty],
    attempts: 0,
    createdAt: now,
  };
}

/**
 * Verifies a user's answer against the challenge solution.
 *
 * Supports tolerance-based verification for challenges that allow approximate
 * answers (e.g., physics balance within 5%, 3D rotation within 15 degrees).
 * Exact-match challenges (temporal memory, grid) require zero tolerance.
 *
 * @param instance - The challenge instance being verified
 * @param userAnswer - The user's submitted answer (structure varies by type)
 * @returns A ChallengeResult indicating pass/fail with confidence score
 *
 * @example
 * ```ts
 * const result = verifySolution(instance, { x: 182, y: 45 });
 * if (result.passed) { /* user succeeded *\/ }
 * ```
 */
export function verifySolution(
  instance: ChallengeInstance,
  userAnswer: unknown,
): ChallengeResult {
  const { solution, type } = instance;
  const startTime = performance.now();

  // Check expiration
  if (Date.now() > instance.expiresAt) {
    return {
      challengeId: instance.id,
      passed: false,
      confidence: 0,
      timeTaken: Math.round(performance.now() - startTime),
      attemptNumber: instance.attempts + 1,
      behavioralData: {
        signals: [],
        compositeRiskScore: 0.8,
        riskLevel: RiskLevel.HIGH,
        timestamp: Date.now(),
        duration: 0,
        eventCount: 0,
        deviceFingerprint: '',
      },
    };
  }

  // Check attempt limit
  if (instance.attempts >= instance.maxAttempts) {
    return {
      challengeId: instance.id,
      passed: false,
      confidence: 0,
      timeTaken: Math.round(performance.now() - startTime),
      attemptNumber: instance.attempts,
      behavioralData: {
        signals: [],
        compositeRiskScore: 0.9,
        riskLevel: RiskLevel.CRITICAL,
        timestamp: Date.now(),
        duration: 0,
        eventCount: 0,
        deviceFingerprint: '',
      },
    };
  }

  let passed = false;
  let confidence = 0;

  switch (type) {
    case ChallengeType.ADVERSARIAL_PUZZLE: {
      const correctPositions = solution.answer as Array<{ id: number; targetX: number }>;
      const userPositions = userAnswer as Array<{ id: number; x: number }>;
      const tolerance = solution.tolerance ?? 5;

      if (!Array.isArray(userPositions) || userPositions.length !== correctPositions.length) {
        passed = false;
        confidence = 0;
      } else {
        let allWithinTolerance = true;
        let totalError = 0;

        for (const correct of correctPositions) {
          const userPos = userPositions.find(u => u.id === correct.id);
          if (!userPos) {
            allWithinTolerance = false;
            break;
          }
          const error = Math.abs(userPos.x - correct.targetX);
          totalError += error;
          if (error > tolerance) {
            allWithinTolerance = false;
          }
        }

        passed = allWithinTolerance;
        // Confidence inversely proportional to total error
        const maxPossibleError = tolerance * correctPositions.length;
        confidence = allWithinTolerance
          ? Math.max(0.5, 1 - totalError / maxPossibleError)
          : Math.max(0, 1 - totalError / (maxPossibleError * 2));
      }
      break;
    }

    case ChallengeType.HUMAN_INTUITION_GRID: {
      const correctAnswer = solution.answer as { oddIndex: number; differProperty: string };
      const userSelection = userAnswer as { selectedIndex: number };

      if (typeof userSelection?.selectedIndex !== 'number') {
        passed = false;
        confidence = 0;
      } else {
        passed = userSelection.selectedIndex === correctAnswer.oddIndex;
        confidence = passed ? 1.0 : 0;
      }
      break;
    }

    case ChallengeType.PHYSICS_CHAOS: {
      const correctPositions = solution.answer as number[];
      const userPositions = userAnswer as number[];
      const tolerancePercent = solution.tolerance ?? 0.05;

      if (!Array.isArray(userPositions) || userPositions.length !== correctPositions.length) {
        passed = false;
        confidence = 0;
      } else {
        let allWithinTolerance = true;
        let totalRelativeError = 0;

        for (let i = 0; i < correctPositions.length; i++) {
          const error = Math.abs(userPositions[i] - correctPositions[i]);
          const relativeError = correctPositions[i] !== 0
            ? error / Math.abs(correctPositions[i])
            : error / 300; // fallback for 0-position
          totalRelativeError += relativeError;

          if (relativeError > tolerancePercent) {
            allWithinTolerance = false;
          }
        }

        passed = allWithinTolerance;
        const avgRelativeError = totalRelativeError / correctPositions.length;
        confidence = passed
          ? Math.max(0.6, 1 - avgRelativeError / tolerancePercent)
          : Math.max(0, 0.5 - avgRelativeError);
      }
      break;
    }

    case ChallengeType.TEMPORAL_MEMORY: {
      const correctSequence = solution.answer as string[];
      const userSequence = userAnswer as string[];

      if (!Array.isArray(userSequence) || userSequence.length !== correctSequence.length) {
        passed = false;
        confidence = 0;
      } else {
        let correctCount = 0;
        for (let i = 0; i < correctSequence.length; i++) {
          if (userSequence[i] === correctSequence[i]) {
            correctCount++;
          }
        }
        passed = correctCount === correctSequence.length;
        confidence = correctCount / correctSequence.length;
      }
      break;
    }

    case ChallengeType.OPTICAL_ILLUSION_MAZE: {
      const correctPath = solution.answer as Array<[number, number]>;
      const userPath = userAnswer as Array<[number, number]>;

      if (!Array.isArray(userPath) || userPath.length === 0) {
        passed = false;
        confidence = 0;
      } else {
        // Check if the user path reaches the end through valid moves
        const lastCorrect = correctPath[correctPath.length - 1];
        const lastUser = userPath[userPath.length - 1];

        // Path must reach the end cell
        const reachesEnd = lastUser && lastUser[0] === lastCorrect[0] && lastUser[1] === lastCorrect[1];

        // Calculate what fraction of the user's path overlaps with valid cells
        const validCells = new Set(correctPath.map(([x, y]) => `${x},${y}`));
        let validMoves = 0;
        for (const [x, y] of userPath) {
          if (validCells.has(`${x},${y}`)) validMoves++;
        }

        const pathAccuracy = userPath.length > 0 ? validMoves / userPath.length : 0;
        passed = reachesEnd && pathAccuracy >= 0.8;
        confidence = reachesEnd ? Math.max(0.5, pathAccuracy) : pathAccuracy * 0.5;
      }
      break;
    }

    case ChallengeType.VOICE_RHYTHM: {
      const correctData = solution.answer as { correctBeats: number[]; beatTimes: number[] };
      const userTaps = userAnswer as number[]; // timestamps in ms
      const timingTolerance = solution.tolerance ?? 200;

      if (!Array.isArray(userTaps) || userTaps.length !== correctData.correctBeats.length) {
        // Wrong number of taps
        const lengthDiff = Math.abs((userTaps as unknown[])?.length ?? 0) - correctData.correctBeats.length;
        passed = false;
        confidence = Math.max(0, 0.5 - lengthDiff * 0.1);
      } else {
        let onTimeCount = 0;
        let totalOffsetMs = 0;

        for (let i = 0; i < correctData.beatTimes.length; i++) {
          const offset = Math.abs((userTaps[i] ?? 0) - correctData.beatTimes[i]);
          totalOffsetMs += offset;
          if (offset <= timingTolerance) {
            onTimeCount++;
          }
        }

        const rhythmAccuracy = onTimeCount / correctData.beatTimes.length;
        passed = rhythmAccuracy >= 0.7; // at least 70% of taps must be on time
        // Confidence combines accuracy with timing precision
        const avgOffsetMs = totalOffsetMs / correctData.beatTimes.length;
        confidence = rhythmAccuracy * Math.max(0.3, 1 - avgOffsetMs / 1000);
      }
      break;
    }

    case ChallengeType.GESTURE_SIGNATURE: {
      const correctData = solution.answer as { gestureName: string; path: Array<{ x: number; y: number }> };
      const userPathData = userAnswer as { points: Array<{ x: number; y: number }>; gestureName?: string };
      const distanceTolerance = solution.tolerance ?? 20;
      const coverageThreshold = (solution.metadata?.coverageThreshold as number) ?? 0.7;

      if (!userPathData?.points || userPathData.points.length < 3) {
        passed = false;
        confidence = 0;
      } else {
        // Calculate how many target points are "covered" by user points
        let coveredCount = 0;
        for (const targetPoint of correctData.path) {
          const isCovered = userPathData.points.some(
            userPoint => Math.hypot(userPoint.x - targetPoint.x, userPoint.y - targetPoint.y) <= distanceTolerance,
          );
          if (isCovered) coveredCount++;
        }

        const coverage = coveredCount / correctData.path.length;
        passed = coverage >= coverageThreshold;
        confidence = coverage;
      }
      break;
    }

    case ChallengeType.CONTEXTUAL_REASONING: {
      const correctOptionId = solution.answer as string;
      const userOption = userAnswer as { selectedOptionId: string };

      if (!userOption?.selectedOptionId) {
        passed = false;
        confidence = 0;
      } else {
        passed = userOption.selectedOptionId === correctOptionId;
        confidence = passed ? 1.0 : 0;
      }
      break;
    }

    case ChallengeType.LIVE_3D_BIOMETRIC: {
      const correctRotation = solution.answer as { x: number; y: number; z: number };
      const userRotation = userAnswer as { x: number; y: number; z: number };
      const angularTolerance = solution.tolerance ?? 15;

      if (typeof userRotation?.x !== 'number' || typeof userRotation?.y !== 'number') {
        passed = false;
        confidence = 0;
      } else {
        const diffX = angularDiff(userRotation.x, correctRotation.x);
        const diffY = angularDiff(userRotation.y, correctRotation.y);
        const diffZ = correctRotation.z
          ? angularDiff(userRotation.z ?? 0, correctRotation.z)
          : 0;

        const maxDiff = Math.max(diffX, diffY, diffZ);
        passed = maxDiff <= angularTolerance;

        // Confidence decreases as angular error increases
        confidence = passed
          ? Math.max(0.5, 1 - maxDiff / angularTolerance)
          : Math.max(0, 0.5 - maxDiff / 360);
      }
      break;
    }

    case ChallengeType.ZERO_KNOWLEDGE_PROOF: {
      const correctData = solution.answer as { targetPatchId: number; powChallenge: string; leadingZeros: number };
      const userZkpAnswer = userAnswer as { selectedPatchId: number; powNonce: string; hash?: string };

      // Verify visual component
      const visualCorrect = userZkpAnswer?.selectedPatchId === correctData.targetPatchId;

      // Verify proof-of-work component
      let powCorrect = false;
      if (userZkpAnswer?.hash && userZkpAnswer?.powNonce) {
        // Check that the hash has the required number of leading zeros
        const leadingZeros = '0'.repeat(correctData.leadingZeros);
        powCorrect = userZkpAnswer.hash.startsWith(leadingZeros);
      }

      passed = visualCorrect && powCorrect;
      confidence = visualCorrect && powCorrect ? 1.0 : visualCorrect ? 0.4 : powCorrect ? 0.3 : 0;
      break;
    }

    default: {
      passed = false;
      confidence = 0;
    }
  }

  return {
    challengeId: instance.id,
    passed,
    confidence: Math.round(confidence * 1000) / 1000,
    timeTaken: Math.round(performance.now() - startTime),
    attemptNumber: instance.attempts + 1,
    behavioralData: {
      signals: [],
      compositeRiskScore: passed ? 0.1 : 0.6,
      riskLevel: passed ? RiskLevel.LOW : RiskLevel.MEDIUM,
      timestamp: Date.now(),
      duration: 0,
      eventCount: 0,
      deviceFingerprint: '',
    },
  };
}

/**
 * Selects 1-2 challenge types based on the user's risk score.
 *
 * Risk score mapping:
 *   - LOW (0.0-0.3):    1 easy/medium challenge
 *   - MEDIUM (0.3-0.6): 1 medium/hard challenge
 *   - HIGH (0.6-0.8):   2 challenges, at least one hard
 *   - CRITICAL (0.8-1): 2 challenges, at least one extreme
 *
 * Never selects the same type twice.
 *
 * @param riskScore - A normalized risk score from 0 (trusted) to 1 (malicious)
 * @returns An array of 1-2 ChallengeType values to present to the user
 *
 * @example
 * ```ts
 * const types = selectChallenges(0.75); // HIGH risk → 2 challenges
 * // e.g., [ChallengeType.PHYSICS_CHAOS, ChallengeType.LIVE_3D_BIOMETRIC]
 * ```
 */
export function selectChallenges(riskScore: number): ChallengeType[] {
  const clampedScore = Math.max(0, Math.min(1, riskScore));

  // Categorize all challenge types by difficulty
  const easyTypes = [ChallengeType.HUMAN_INTUITION_GRID, ChallengeType.TEMPORAL_MEMORY];
  const mediumTypes = [
    ChallengeType.ADVERSARIAL_PUZZLE,
    ChallengeType.VOICE_RHYTHM,
    ChallengeType.GESTURE_SIGNATURE,
  ];
  const hardTypes = [
    ChallengeType.PHYSICS_CHAOS,
    ChallengeType.OPTICAL_ILLUSION_MAZE,
    ChallengeType.CONTEXTUAL_REASONING,
    ChallengeType.LIVE_3D_BIOMETRIC,
  ];
  const extremeTypes = [ChallengeType.ZERO_KNOWLEDGE_PROOF];

  const selected: ChallengeType[] = [];

  if (clampedScore < 0.3) {
    // LOW risk: 1 easy or medium challenge
    const pool = [...easyTypes, ...mediumTypes];
    selected.push(randPick(shuffle(pool)));
  } else if (clampedScore < 0.6) {
    // MEDIUM risk: 1 medium or hard challenge
    const pool = [...mediumTypes, ...hardTypes];
    selected.push(randPick(shuffle(pool)));
  } else if (clampedScore < 0.8) {
    // HIGH risk: 2 challenges, at least one hard
    selected.push(randPick(shuffle(hardTypes)));

    // Second challenge from medium or hard (different type)
    const secondPool = [...mediumTypes, ...hardTypes].filter(t => t !== selected[0]);
    selected.push(randPick(shuffle(secondPool)));
  } else {
    // CRITICAL risk: 2 challenges, at least one extreme
    selected.push(randPick(shuffle(extremeTypes)));

    // Second challenge from hard or extreme (different type)
    const secondPool = [...hardTypes, ...extremeTypes].filter(t => t !== selected[0]);
    selected.push(randPick(shuffle(secondPool)));
  }

  // Safety check: ensure no duplicates (shouldn't happen with filter above, but guard anyway)
  const unique = Array.from(new Set(selected));
  return unique;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Selects a random challenge type weighted by AI resistance score.
 * Higher AI resistance = higher probability of selection.
 * This ensures the most effective challenges are used more often when
 * no specific type is requested.
 */
function selectWeightedRandomType(): ChallengeType {
  const types = Array.from(CHALLENGE_DEFINITIONS.values());
  const totalWeight = types.reduce((sum, def) => sum + def.aiResistanceScore, 0);

  let random = Math.random() * totalWeight;
  for (const def of types) {
    random -= def.aiResistanceScore;
    if (random <= 0) {
      return def.type;
    }
  }

  // Fallback (should not reach here)
  return types[types.length - 1].type;
}

/**
 * Returns the difficulty level appropriate for a given risk score.
 * Utility function for external consumers that need a single difficulty.
 *
 * @param riskScore - Normalized risk score 0-1
 * @returns The matching ChallengeDifficulty level
 */
export function difficultyFromRiskScore(riskScore: number): ChallengeDifficulty {
  const clamped = Math.max(0, Math.min(1, riskScore));
  if (clamped < 0.25) return ChallengeDifficulty.EASY;
  if (clamped < 0.5) return ChallengeDifficulty.MEDIUM;
  if (clamped < 0.75) return ChallengeDifficulty.HARD;
  return ChallengeDifficulty.EXTREME;
}

/**
 * Generates multiple challenge instances for a given risk score.
 * Convenience function that combines `selectChallenges` and `generateChallenge`.
 *
 * @param riskScore - Normalized risk score 0-1
 * @returns Array of ChallengeInstance objects, one per selected type
 */
export function generateChallengesForRisk(riskScore: number): ChallengeInstance[] {
  const types = selectChallenges(riskScore);
  const difficulty = difficultyFromRiskScore(riskScore);

  return types.map(type => generateChallenge(type, difficulty));
}

/**
 * Checks whether a challenge instance has expired.
 *
 * @param instance - The challenge instance to check
 * @returns True if the current time is past the instance's expiration
 */
export function isExpired(instance: ChallengeInstance): boolean {
  return Date.now() > instance.expiresAt;
}

/**
 * Increments the attempt counter on a challenge instance.
 * Returns a new object with the updated attempt count.
 *
 * @param instance - The challenge instance to update
 * @returns A new ChallengeInstance with attempts incremented
 */
export function incrementAttempt(instance: ChallengeInstance): ChallengeInstance {
  return {
    ...instance,
    attempts: instance.attempts + 1,
  };
}

/**
 * Gets the remaining time (in ms) before a challenge instance expires.
 *
 * @param instance - The challenge instance to check
 * @returns Remaining milliseconds (0 if already expired)
 */
export function getRemainingTime(instance: ChallengeInstance): number {
  const remaining = instance.expiresAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Gets the definition metadata for a specific challenge type.
 *
 * @param type - The challenge type to look up
 * @returns The ChallengeDefinition, or undefined if not found
 */
export function getChallengeDefinition(type: ChallengeType): ChallengeDefinition | undefined {
  return CHALLENGE_DEFINITIONS.get(type);
}

/**
 * Returns all registered challenge definitions as an array.
 * Useful for rendering challenge type selectors or documentation.
 */
export function getAllChallengeDefinitions(): ChallengeDefinition[] {
  return Array.from(CHALLENGE_DEFINITIONS.values());
}
