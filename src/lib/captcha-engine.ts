// ============================================
// CAPTCHA ENGINE - Challenge Generation & Verification
// ============================================

// Types
export interface Point {
  x: number;
  y: number;
  t?: number;
}

export interface PuzzleChallenge {
  type: 'puzzle';
  targetX: number;       // The x position where the piece should be placed (0-100%)
  pieceX: number;        // Starting x position of the puzzle piece (0-100%)
  tolerance: number;     // Pixel tolerance for correct placement
  puzzleImage: string;   // Base64 encoded background with puzzle shape
  pieceImage: string;    // Base64 encoded puzzle piece
}

export interface ImageSelectChallenge {
  type: 'image_select';
  instruction: string;   // Semantic instruction in Spanish
  grid: ImageCell[];
  correctIndices: number[];
  noiseLevel: number;
}

export interface ImageCell {
  id: number;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon';
  color: string;
  rotation: number;
  distorted: boolean;
  hasCurvedEdges: boolean;
  size: number;
}

export interface MathVisualChallenge {
  type: 'math_visual';
  equation: string;      // Display equation (e.g., "(3×7) - 4")
  answer: number;        // Correct answer
  noiseLines: number;    // Number of noise lines
  distortion: number;    // Distortion level 0-1
}

export interface PatternTraceChallenge {
  type: 'pattern_trace';
  points: PatternPoint[];
  connections: [number, number][];
  sequence: number[];    // Correct sequence of dot indices
  totalTimeLimit: number; // Max time in ms
}

export interface PatternPoint {
  id: number;
  x: number;  // 0-100%
  y: number;  // 0-100%
}

export type ChallengeData =
  | PuzzleChallenge
  | ImageSelectChallenge
  | MathVisualChallenge
  | PatternTraceChallenge;

export interface ChallengeSolution {
  type: string;
  answer: any;
}

export interface VerificationResult {
  success: boolean;
  riskScore: number;
  message: string;
}

// ============================================
// Challenge Generators
// ============================================

export function generatePuzzleChallenge(): { challenge: PuzzleChallenge; solution: ChallengeSolution } {
  const targetX = 40 + Math.random() * 25; // 40-65% from left
  const pieceX = 5 + Math.random() * 10;  // Start at 5-15% from left
  const tolerance = 5; // 5% tolerance

  // Generate a puzzle image description (rendered on client canvas)
  const seed = Math.floor(Math.random() * 10000);
  const puzzleImage = JSON.stringify({ type: 'puzzle_bg', seed, targetX, pieceWidth: 15 });
  const pieceImage = JSON.stringify({ type: 'puzzle_piece', seed, pieceX: targetX, width: 15 });

  return {
    challenge: {
      type: 'puzzle',
      targetX: Math.round(targetX * 100) / 100,
      pieceX: Math.round(pieceX * 100) / 100,
      tolerance,
      puzzleImage,
      pieceImage,
    },
    solution: {
      type: 'puzzle',
      answer: Math.round(targetX * 100) / 100,
    },
  };
}

const SHAPE_TYPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon'] as const;
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f43f5e'];

const INSTRUCTIONS = [
  { text: 'Selecciona todas las figuras con bordes curvos', check: (s: ImageCell) => s.hasCurvedEdges },
  { text: 'Selecciona todas las figuras rojas o azules', check: (s: ImageCell) => s.color === '#ef4444' || s.color === '#3b82f6' },
  { text: 'Selecciona todas las figuras que NO son cuadrados', check: (s: ImageCell) => s.shape !== 'square' },
  { text: 'Selecciona todas las figuras grandes', check: (s: ImageCell) => s.size > 35 },
  { text: 'Selecciona todas las figuras con rotación', check: (s: ImageCell) => s.rotation > 5 },
  { text: 'Selecciona todas las figuras distorsionadas', check: (s: ImageCell) => s.distorted },
  { text: 'Selecciona todas las figuras con bordes rectos', check: (s: ImageCell) => !s.hasCurvedEdges },
  { text: 'Selecciona todas las figuras verdes o amarillas', check: (s: ImageCell) => s.color === '#22c55e' || s.color === '#eab308' },
];

export function generateImageSelectChallenge(): { challenge: ImageSelectChallenge; solution: ChallengeSolution } {
  // Pick a random instruction
  const instructionDef = INSTRUCTIONS[Math.floor(Math.random() * INSTRUCTIONS.length)];

  // Generate 3x3 grid
  const grid: ImageCell[] = [];
  for (let i = 0; i < 9; i++) {
    const shape = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)] as ImageCell['shape'];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const rotation = Math.floor(Math.random() * 45);
    const distorted = Math.random() > 0.7;
    const size = 20 + Math.floor(Math.random() * 40);

    const hasCurvedEdges = shape === 'circle' || shape === 'star' || shape === 'hexagon';

    grid.push({
      id: i,
      shape,
      color,
      rotation,
      distorted,
      hasCurvedEdges,
      size,
    });
  }

  // Make sure at least 2 match the instruction, and not all 9 match
  const matches = grid.filter(instructionDef.check);
  if (matches.length < 2) {
    // Force first 2 to match
    for (let i = 0; i < 2; i++) {
      const forcedShape = instructionDef.text.includes('bordes curvos')
        ? 'circle'
        : instructionDef.text.includes('bordes rectos')
          ? 'square'
          : instructionDef.text.includes('rojas o azules')
            ? 'circle'
            : 'triangle';

      const forcedColor = instructionDef.text.includes('rojas o azules')
        ? (i === 0 ? '#ef4444' : '#3b82f6')
        : instructionDef.text.includes('verdes o amarillas')
          ? (i === 0 ? '#22c55e' : '#eab308')
          : COLORS[Math.floor(Math.random() * COLORS.length)];

      grid[i].shape = forcedShape as ImageCell['shape'];
      grid[i].color = forcedColor;
      grid[i].hasCurvedEdges = forcedShape === 'circle' || forcedShape === 'star' || forcedShape === 'hexagon';
      grid[i].size = instructionDef.text.includes('grandes') ? 40 + Math.floor(Math.random() * 10) : 20 + Math.floor(Math.random() * 20);
    }
  }

  // Ensure not all match
  if (matches.length >= 9) {
    grid[8].shape = 'square';
    grid[8].hasCurvedEdges = false;
    grid[8].distorted = false;
  }

  const correctIndices = grid
    .map((cell, idx) => (instructionDef.check(cell) ? idx : -1))
    .filter(idx => idx !== -1);

  return {
    challenge: {
      type: 'image_select',
      instruction: instructionDef.text,
      grid,
      correctIndices,
      noiseLevel: 0.5,
    },
    solution: {
      type: 'image_select',
      answer: correctIndices.sort((a, b) => a - b),
    },
  };
}

export function generateMathVisualChallenge(): { challenge: MathVisualChallenge; solution: ChallengeSolution } {
  // Generate a multi-step equation
  const ops = ['+', '-', '×'] as const;
  const equations: { equation: string; answer: number }[] = [];

  // Type 1: (a × b) - c
  {
    const a = 2 + Math.floor(Math.random() * 9);
    const b = 2 + Math.floor(Math.random() * 9);
    const c = 1 + Math.floor(Math.random() * (a * b));
    equations.push({ equation: `(${a} × ${b}) - ${c}`, answer: a * b - c });
  }

  // Type 2: a + (b × c)
  {
    const a = 1 + Math.floor(Math.random() * 20);
    const b = 2 + Math.floor(Math.random() * 8);
    const c = 2 + Math.floor(Math.random() * 8);
    equations.push({ equation: `${a} + (${b} × ${c})`, answer: a + b * c });
  }

  // Type 3: (a + b) × c - d
  {
    const a = 1 + Math.floor(Math.random() * 10);
    const b = 1 + Math.floor(Math.random() * 10);
    const c = 2 + Math.floor(Math.random() * 5);
    const d = 1 + Math.floor(Math.random() * ((a + b) * c));
    equations.push({ equation: `(${a} + ${b}) × ${c} - ${d}`, answer: (a + b) * c - d });
  }

  // Type 4: a × b + c × d
  {
    const a = 2 + Math.floor(Math.random() * 5);
    const b = 2 + Math.floor(Math.random() * 5);
    const c = 2 + Math.floor(Math.random() * 5);
    const d = 2 + Math.floor(Math.random() * 5);
    equations.push({ equation: `${a} × ${b} + ${c} × ${d}`, answer: a * b + c * d });
  }

  const chosen = equations[Math.floor(Math.random() * equations.length)];

  return {
    challenge: {
      type: 'math_visual',
      equation: chosen.equation,
      answer: chosen.answer,
      noiseLines: 3 + Math.floor(Math.random() * 4),
      distortion: 0.2 + Math.random() * 0.3,
    },
    solution: {
      type: 'math_visual',
      answer: chosen.answer,
    },
  };
}

export function generatePatternTraceChallenge(): { challenge: PatternTraceChallenge; solution: ChallengeSolution } {
  // Generate random dots
  const numPoints = 4 + Math.floor(Math.random() * 3); // 4-6 points
  const points: PatternPoint[] = [];

  const margin = 15;
  for (let i = 0; i < numPoints; i++) {
    let x: number, y: number;
    let tooClose = true;
    let attempts = 0;

    while (tooClose && attempts < 100) {
      x = margin + Math.random() * (100 - 2 * margin);
      y = margin + Math.random() * (100 - 2 * margin);
      tooClose = points.some(p => Math.hypot(p.x - x, p.y - y) < 20);
      attempts++;
    }

    if (tooClose) {
      x = margin + (i * (100 - 2 * margin)) / (numPoints - 1);
      y = 30 + Math.random() * 40;
    }

    points.push({ id: i, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }

  // Create a random correct sequence (permutation of all points)
  const sequence = Array.from({ length: numPoints }, (_, i) => i);
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  // Create connections from the sequence
  const connections: [number, number][] = [];
  for (let i = 0; i < sequence.length - 1; i++) {
    connections.push([sequence[i], sequence[i + 1]]);
  }

  return {
    challenge: {
      type: 'pattern_trace',
      points,
      connections,
      sequence,
      totalTimeLimit: 15000,
    },
    solution: {
      type: 'pattern_trace',
      answer: sequence,
    },
  };
}

// ============================================
// Challenge Factory
// ============================================

const CHALLENGE_TYPES = ['puzzle', 'image_select', 'math_visual', 'pattern_trace'] as const;

export function generateRandomChallenge(): { challenge: ChallengeData; solution: ChallengeSolution } {
  const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];

  switch (type) {
    case 'puzzle':
      return generatePuzzleChallenge();
    case 'image_select':
      return generateImageSelectChallenge();
    case 'math_visual':
      return generateMathVisualChallenge();
    case 'pattern_trace':
      return generatePatternTraceChallenge();
  }
}

// ============================================
// Solution Verification
// ============================================

export function verifySolution(solutionData: string, response: any): VerificationResult {
  let solution: ChallengeSolution;
  try {
    solution = JSON.parse(solutionData);
  } catch {
    return { success: false, riskScore: 1, message: 'Solución inválida' };
  }

  switch (solution.type) {
    case 'puzzle': {
      const { answer } = solution;
      const userAnswer = response.value;
      const tolerance = response.tolerance || 5;
      const diff = Math.abs(parseFloat(userAnswer) - parseFloat(answer));
      if (diff <= tolerance) {
        return { success: true, riskScore: 0, message: 'Verificación exitosa' };
      }
      return { success: false, riskScore: 0.5, message: `Posición incorrecta. Diferencia: ${diff.toFixed(1)}%` };
    }

    case 'image_select': {
      const correct = (solution.answer as number[]).sort((a: number, b: number) => a - b);
      const userSelected = (response.selectedIndices as number[]).sort((a: number, b: number) => a - b);
      if (JSON.stringify(correct) === JSON.stringify(userSelected)) {
        return { success: true, riskScore: 0, message: 'Verificación exitosa' };
      }
      return { success: false, riskScore: 0.5, message: 'Selección incorrecta. Inténtalo de nuevo.' };
    }

    case 'math_visual': {
      const correct = solution.answer;
      const userAnswer = parseInt(response.answer, 10);
      if (!isNaN(userAnswer) && userAnswer === correct) {
        return { success: true, riskScore: 0, message: 'Verificación exitosa' };
      }
      return { success: false, riskScore: 0.5, message: 'Respuesta incorrecta. Inténtalo de nuevo.' };
    }

    case 'pattern_trace': {
      const correct = solution.answer as number[];
      const userSequence = response.sequence as number[];
      if (JSON.stringify(correct) === JSON.stringify(userSequence)) {
        return { success: true, riskScore: 0, message: 'Verificación exitosa' };
      }
      return { success: false, riskScore: 0.5, message: 'Secuencia incorrecta. Inténtalo de nuevo.' };
    }

    default:
      return { success: false, riskScore: 1, message: 'Tipo de desafío desconocido' };
  }
}
