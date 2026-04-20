// ============================================
// CAPTCHA SHIELD v3.0 - Motor de desafíos (client-side)
// ============================================

export interface ChallengeData {
  type: ChallengeType;
  [key: string]: any;
}

export type ChallengeType =
  | 'puzzle'
  | 'image_select'
  | 'math_visual'
  | 'pattern_trace'
  | 'rotation_3d'
  | 'audio'
  | 'timeline_order'
  | 'multi_step';

export interface PuzzleChallengeData extends ChallengeData {
  type: 'puzzle';
  seed: number;
  targetX: number;
  pieceCount: number;
  pieces: PuzzlePiece[];
  tolerance: number;
  timeLimit: number;
}

export interface PuzzlePiece {
  id: number;
  startX: number;
  targetX: number;
  width: number;
  height: number;
  shape: 'rect' | 'wave' | 'tab';
}

export interface ImageSelectChallengeData extends ChallengeData {
  type: 'image_select';
  instruction: string;
  gridSize: number;
  grid: ImageCell[];
  correctIndices: number[];
  timeLimit: number;
}

export interface ImageCell {
  id: number;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon' | 'pentagon' | 'cross';
  color: string;
  secondaryColor: string;
  rotation: number;
  distorted: boolean;
  hasCurvedEdges: boolean;
  size: number;
  hasGradient: boolean;
  hasShadow: boolean;
}

export interface MathVisualChallengeData extends ChallengeData {
  type: 'math_visual';
  equation: string;
  answer: number;
  noiseLines: number;
  distortion: number;
  timeLimit: number;
}

export interface PatternTraceChallengeData extends ChallengeData {
  type: 'pattern_trace';
  points: PatternPoint[];
  connections: [number, number][];
  sequence: number[];
  showTime: number;
  timeLimit: number;
}

export interface PatternPoint {
  id: number;
  x: number;
  y: number;
}

export interface Rotation3DChallengeData extends ChallengeData {
  type: 'rotation_3d';
  shapeType: 'cube' | 'prism' | 'pyramid';
  targetRotationX: number;
  targetRotationY: number;
  timeLimit: number;
}

export interface AudioChallengeData extends ChallengeData {
  type: 'audio';
  tones: AudioTone[];
  question: string;
  answer: number | string;
  timeLimit: number;
}

export interface AudioTone {
  frequency: number;
  duration: number;
  gap: number;
}

export interface TimelineOrderChallengeData extends ChallengeData {
  type: 'timeline_order';
  events: TimelineEvent[];
  correctOrder: number[];
  timeLimit: number;
}

export interface TimelineEvent {
  id: number;
  title: string;
  date: string;
  year: number;
  month: number;
  day: number;
}

export interface MultiStepChallengeData extends ChallengeData {
  type: 'multi_step';
  steps: string[];
  honeypotFields: string[];
}

// ============================================
// GENERADORES DE DESAFÍOS
// ============================================

function rng(seed: number, n: number): number {
  return ((seed * 31 + n * 17) * 13 + n * 7) % 1000;
}

function rngFloat(seed: number, n: number, min: number, max: number): number {
  return min + (rng(seed, n) / 1000) * (max - min);
}

// 1. SLIDING PUZZLE (mejorado)
export function generatePuzzleChallenge(): PuzzleChallengeData {
  const seed = Math.floor(Math.random() * 100000);
  const pieceCount = 2 + Math.floor(Math.random() * 2); // 2-3 piezas
  const canvasWidth = 350;
  const tolerance = 6;

  const pieces: PuzzlePiece[] = [];
  const usedPositions = new Set<number>();

  for (let i = 0; i < pieceCount; i++) {
    const pieceWidth = 12 + Math.floor(Math.random() * 8);
    const shape: PuzzlePiece['shape'] = (['rect', 'wave', 'tab'] as const)[Math.floor(Math.random() * 3)];

    let targetX: number;
    do {
      targetX = 25 + Math.floor(Math.random() * 50);
    } while (
      Array.from(usedPositions).some(
        pos => Math.abs(pos - targetX) < pieceWidth + 5
      )
    );
    usedPositions.add(targetX);

    pieces.push({
      id: i,
      startX: 2 + i * (100 / pieceCount),
      targetX,
      width: pieceWidth,
      height: 100,
      shape,
    });
  }

  return {
    type: 'puzzle',
    seed,
    targetX: pieces[0].targetX,
    pieceCount,
    pieces,
    tolerance,
    timeLimit: 30000,
  };
}

// 2. IMAGE SELECT (mejorado a 4x4)
const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond', 'hexagon', 'pentagon', 'cross'] as const;
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#14b8a6', '#f43f5e', '#06b6d4',
];
const SECONDARY_COLORS = [
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb',
  '#9333ea', '#db2777', '#0d9488', '#e11d48', '#0891b2',
];

const INSTRUCTIONS = [
  { text: 'Selecciona todas las figuras rojas con bordes curvos que NO sean círculos', check: (c: ImageCell) => (c.color === '#ef4444' || c.color === '#f43f5e') && c.hasCurvedEdges && c.shape !== 'circle' },
  { text: 'Selecciona todas las figuras que tengan degradado y sean verdes o azules', check: (c: ImageCell) => c.hasGradient && (c.color === '#22c55e' || c.color === '#3b82f6' || c.color === '#06b6d4') },
  { text: 'Selecciona todas las figuras distorsionadas con bordes rectos', check: (c: ImageCell) => c.distorted && !c.hasCurvedEdges },
  { text: 'Selecciona todas las figuras pequeñas con sombra', check: (c: ImageCell) => c.size < 35 && c.hasShadow },
  { text: 'Selecciona las figuras que sean amarillas O púrpura pero NO estrellas', check: (c: ImageCell) => (c.color === '#eab308' || c.color === '#a855f7') && c.shape !== 'star' },
  { text: 'Selecciona todas las figuras grandes rotadas más de 20 grados', check: (c: ImageCell) => c.size > 35 && c.rotation > 20 },
];

export function generateImageSelectChallenge(): ImageSelectChallengeData {
  const gridSize = 16;
  const instructionDef = INSTRUCTIONS[Math.floor(Math.random() * INSTRUCTIONS.length)];
  const grid: ImageCell[] = [];

  for (let i = 0; i < gridSize; i++) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    const color = COLORS[colorIdx];
    const secondaryColor = SECONDARY_COLORS[colorIdx];
    const rotation = Math.floor(Math.random() * 45);
    const distorted = Math.random() > 0.7;
    const size = 20 + Math.floor(Math.random() * 35);
    const hasCurvedEdges = ['circle', 'star', 'hexagon', 'pentagon'].includes(shape);
    const hasGradient = Math.random() > 0.6;
    const hasShadow = Math.random() > 0.5;

    grid.push({
      id: i, shape, color, secondaryColor, rotation, distorted,
      hasCurvedEdges, size, hasGradient, hasShadow,
    });
  }

  // Garantizar al menos 3 coincidencias
  let matchCount = grid.filter(instructionDef.check).length;
  let attempts = 0;
  while (matchCount < 3 && attempts < 20) {
    const idx = Math.floor(Math.random() * gridSize);
    const forcedShape = instructionDef.text.includes('bordes curvos') ? 'star'
      : instructionDef.text.includes('bordes rectos') ? 'square'
      : instructionDef.text.includes('estrellas') ? 'circle'
      : SHAPES[Math.floor(Math.random() * SHAPES.length)];

    const forcedColor = instructionDef.text.includes('rojas') ? '#ef4444'
      : instructionDef.text.includes('verdes') ? '#22c55e'
      : instructionDef.text.includes('azules') ? '#3b82f6'
      : instructionDef.text.includes('amarillas') ? '#eab308'
      : instructionDef.text.includes('púrpura') ? '#a855f7'
      : COLORS[Math.floor(Math.random() * COLORS.length)];

    grid[idx] = {
      ...grid[idx],
      shape: forcedShape as ImageCell['shape'],
      color: forcedColor,
      secondaryColor: SECONDARY_COLORS[COLORS.indexOf(forcedColor)] || forcedColor,
      hasCurvedEdges: ['circle', 'star', 'hexagon', 'pentagon'].includes(forcedShape),
      hasGradient: instructionDef.text.includes('degradado') ? true : grid[idx].hasGradient,
      hasShadow: instructionDef.text.includes('sombra') ? true : grid[idx].hasShadow,
      size: instructionDef.text.includes('grandes') ? 40 + Math.floor(Math.random() * 10)
        : instructionDef.text.includes('pequeñas') ? 20 + Math.floor(Math.random() * 10)
        : grid[idx].size,
      rotation: instructionDef.text.includes('rotadas') ? 25 + Math.floor(Math.random() * 15) : grid[idx].rotation,
      distorted: instructionDef.text.includes('distorsionadas') ? true : grid[idx].distorted,
    };
    matchCount = grid.filter(instructionDef.check).length;
    attempts++;
  }

  const correctIndices = grid.map((c, i) => instructionDef.check(c) ? i : -1).filter(i => i !== -1);

  return {
    type: 'image_select',
    instruction: instructionDef.text,
    gridSize,
    grid,
    correctIndices,
    timeLimit: 25000,
  };
}

// 3. MATH VISUAL (mejorado)
export function generateMathVisualChallenge(): MathVisualChallengeData {
  const generators: () => { equation: string; answer: number }[] = [
    () => {
      const a = 2 + Math.floor(Math.random() * 9);
      const b = 2 + Math.floor(Math.random() * 9);
      const c = 1 + Math.floor(Math.random() * (a * b));
      return { equation: `(${a} × ${b}) - ${c}`, answer: a * b - c };
    },
    () => {
      const a = 1 + Math.floor(Math.random() * 20);
      const b = 2 + Math.floor(Math.random() * 8);
      const c = 2 + Math.floor(Math.random() * 8);
      return { equation: `${a} + (${b} × ${c})`, answer: a + b * c };
    },
    () => {
      const b = 2 + Math.floor(Math.random() * 8);
      const result = 5 + Math.floor(Math.random() * 15);
      const a = result * b;
      return { equation: `${a} ÷ ${b}`, answer: result };
    },
    () => {
      const a = 1 + Math.floor(Math.random() * 10);
      const b = 1 + Math.floor(Math.random() * 10);
      const c = 2 + Math.floor(Math.random() * 5);
      const d = 1 + Math.floor(Math.random() * ((a + b) * c));
      return { equation: `(${a} + ${b}) × ${c} - ${d}`, answer: (a + b) * c - d };
    },
    () => {
      const a = 2 + Math.floor(Math.random() * 5);
      const b = 2 + Math.floor(Math.random() * 5);
      const c = 2 + Math.floor(Math.random() * 5);
      const d = 2 + Math.floor(Math.random() * 5);
      return { equation: `${a} × ${b} + ${c} × ${d}`, answer: a * b + c * d };
    },
    () => {
      const a = 10 + Math.floor(Math.random() * 50);
      const b = 5 + Math.floor(Math.random() * 20);
      const c = 3 + Math.floor(Math.random() * 15);
      return { equation: `${a} - ${b} + ${c}`, answer: a - b + c };
    },
  ];

  const chosen = generators[Math.floor(Math.random() * generators.length)]();

  return {
    type: 'math_visual',
    equation: chosen.equation,
    answer: chosen.answer,
    noiseLines: 5 + Math.floor(Math.random() * 5),
    distortion: 0.3 + Math.random() * 0.3,
    timeLimit: 20000,
  };
}

// 4. PATTERN TRACE (mejorado)
export function generatePatternTraceChallenge(): PatternTraceChallengeData {
  const numPoints = 6 + Math.floor(Math.random() * 3);
  const points: PatternPoint[] = [];
  const margin = 15;

  for (let i = 0; i < numPoints; i++) {
    let x: number, y: number;
    let tooClose = true;
    let attempts = 0;
    while (tooClose && attempts < 100) {
      x = margin + Math.random() * (100 - 2 * margin);
      y = margin + Math.random() * (100 - 2 * margin);
      tooClose = points.some(p => Math.hypot(p.x - x, p.y - y) < 18);
      attempts++;
    }
    if (tooClose) {
      x = margin + (i * (100 - 2 * margin)) / (numPoints - 1);
      y = 30 + Math.random() * 40;
    }
    points.push({ id: i, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  }

  const sequence = Array.from({ length: numPoints }, (_, i) => i);
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  const connections: [number, number][] = [];
  for (let i = 0; i < sequence.length - 1; i++) {
    connections.push([sequence[i], sequence[i + 1]]);
  }

  return {
    type: 'pattern_trace',
    points,
    connections,
    sequence,
    showTime: 3000,
    timeLimit: 15000,
  };
}

// 5. 3D ROTATION CHALLENGE
export function generateRotation3DChallenge(): Rotation3DChallengeData {
  const shapes: Array<'cube' | 'prism' | 'pyramid'> = ['cube', 'prism', 'pyramid'];
  const shapeType = shapes[Math.floor(Math.random() * shapes.length)];

  return {
    type: 'rotation_3d',
    shapeType,
    targetRotationX: Math.floor(Math.random() * 360),
    targetRotationY: Math.floor(Math.random() * 360),
    timeLimit: 25000,
  };
}

// 6. AUDIO CHALLENGE
export function generateAudioChallenge(): AudioChallengeData {
  const challenges: () => AudioChallengeData = () => {
    const numTones = 3 + Math.floor(Math.random() * 4);
    const tones: AudioTone[] = [];
    const usedFreqs = new Set<number>();

    for (let i = 0; i < numTones; i++) {
      let freq: number;
      do {
        freq = 200 + Math.floor(Math.random() * 600);
      } while (usedFreqs.has(freq));
      usedFreqs.add(freq);
      tones.push({
        frequency: freq,
        duration: 200 + Math.floor(Math.random() * 300),
        gap: 100 + Math.floor(Math.random() * 100),
      });
    }

    const highestIdx = tones.reduce((max, t, i, arr) => t.frequency > arr[max].frequency ? i : max, 0);
    const lowestIdx = tones.reduce((min, t, i, arr) => t.frequency < arr[min].frequency ? i : min, 0);

    const questionTypes = [
      { question: `¿Cuántos tonos escuchaste?`, answer: numTones },
      { question: `¿Cuál fue el tono más agudo? (posición ${highestIdx + 1} = respuesta)`, answer: highestIdx + 1 },
      { question: `¿Cuántos tonos eran más graves que 400Hz?`, answer: tones.filter(t => t.frequency < 400).length },
      { question: `¿En qué posición estaba el tono más grave?`, answer: lowestIdx + 1 },
    ];

    const chosen = questionTypes[Math.floor(Math.random() * questionTypes.length)];

    return {
      type: 'audio',
      tones,
      question: chosen.question,
      answer: chosen.answer,
      timeLimit: 30000,
    };
  };

  return challenges();
}

// 7. TIMELINE ORDER CHALLENGE
const HISTORICAL_EVENTS = [
  { title: 'Invención de la imprenta', year: 1440, month: 1, day: 1 },
  { title: 'Caída del Imperio Romano', year: 476, month: 9, day: 4 },
  { title: 'Descubrimiento de América', year: 1492, month: 10, day: 12 },
  { title: 'Revolución Francesa', year: 1789, month: 7, day: 14 },
  { title: 'Primer vuelo del Wright Bros.', year: 1903, month: 12, day: 17 },
  { title: 'Fin de la Primera Guerra Mundial', year: 1918, month: 11, day: 11 },
  { title: 'Invención del transistor', year: 1947, month: 12, day: 23 },
  { title: 'Llegada a la Luna', year: 1969, month: 7, day: 20 },
  { title: 'Caída del Muro de Berlín', year: 1989, month: 11, day: 9 },
  { title: 'Nacimiento de la WWW', year: 1991, month: 8, day: 6 },
  { title: 'Lanzamiento del iPhone', year: 2007, month: 6, day: 29 },
  { title: 'Primera imagen de un agujero negro', year: 2019, month: 4, day: 10 },
  { title: 'Independencia de EE.UU.', year: 1776, month: 7, day: 4 },
  { title: 'Invención del teléfono', year: 1876, month: 3, day: 10 },
  { title: 'Inicio de la Segunda Guerra Mundial', year: 1939, month: 9, day: 1 },
];

export function generateTimelineOrderChallenge(): TimelineOrderChallengeData {
  const count = 4 + Math.floor(Math.random() * 3);
  const shuffled = [...HISTORICAL_EVENTS].sort(() => Math.random() - 0.5).slice(0, count);

  const events: TimelineEvent[] = shuffled.map((e, i) => ({
    id: i,
    title: e.title,
    date: `${e.day}/${e.month}/${e.year}`,
    year: e.year,
    month: e.month,
    day: e.day,
  }));

  // Orden correcto cronológico
  const correctOrder = events
    .map((e, i) => ({ idx: i, year: e.year, month: e.month, day: e.day }))
    .sort((a, b) => a.year - b.year || a.month - b.month || a.day - b.day)
    .map(e => e.idx);

  return {
    type: 'timeline_order',
    events: events.sort(() => Math.random() - 0.5),
    correctOrder,
    timeLimit: 20000,
  };
}

// 8. MULTI-STEP / HONEYPOT
export function generateMultiStepChallenge(): MultiStepChallengeData {
  return {
    type: 'multi_step',
    steps: [
      'Paso 1: Confirma que no eres un robot',
      'Paso 2: Marca la casilla correcta',
      'Paso 3: Verificación final',
    ],
    honeypotFields: [
      'website_url',
      'company_name',
      'fax_number',
    ],
  };
}

// ============================================
// FACTORY
// ============================================

export function generateRandomChallenge(): ChallengeData {
  const types: ChallengeType[] = [
    'puzzle', 'image_select', 'math_visual', 'pattern_trace',
    'rotation_3d', 'audio', 'timeline_order',
  ];
  const type = types[Math.floor(Math.random() * types.length)];

  switch (type) {
    case 'puzzle': return generatePuzzleChallenge();
    case 'image_select': return generateImageSelectChallenge();
    case 'math_visual': return generateMathVisualChallenge();
    case 'pattern_trace': return generatePatternTraceChallenge();
    case 'rotation_3d': return generateRotation3DChallenge();
    case 'audio': return generateAudioChallenge();
    case 'timeline_order': return generateTimelineOrderChallenge();
    default: return generatePuzzleChallenge();
  }
}

// ============================================
// VERIFICACIÓN DE SOLUCIONES
// ============================================

export function verifySolution(challenge: ChallengeData, response: any): { success: boolean; message: string } {
  switch (challenge.type) {
    case 'puzzle': {
      const pieces = (challenge as PuzzleChallengeData).pieces;
      const userPositions = response.positions as number[];
      if (!userPositions || userPositions.length !== pieces.length) {
        return { success: false, message: 'Posiciones incompletas' };
      }
      const tolerance = (challenge as PuzzleChallengeData).tolerance;
      let allCorrect = true;
      for (let i = 0; i < pieces.length; i++) {
        if (Math.abs(userPositions[i] - pieces[i].targetX) > tolerance) {
          allCorrect = false;
          break;
        }
      }
      return allCorrect
        ? { success: true, message: 'Rompecabezas completado correctamente' }
        : { success: false, message: 'Las piezas no están en la posición correcta' };
    }

    case 'image_select': {
      const correct = (challenge as ImageSelectChallengeData).correctIndices.sort((a, b) => a - b);
      const selected = (response.selectedIndices as number[]).sort((a, b) => a - b);
      if (JSON.stringify(correct) === JSON.stringify(selected)) {
        return { success: true, message: 'Selección correcta' };
      }
      return { success: false, message: 'Selección incorrecta. Revisa la instrucción.' };
    }

    case 'math_visual': {
      const correct = (challenge as MathVisualChallengeData).answer;
      const userAnswer = parseInt(response.answer, 10);
      if (!isNaN(userAnswer) && userAnswer === correct) {
        return { success: true, message: 'Ecuación resuelta correctamente' };
      }
      return { success: false, message: 'Respuesta incorrecta. Inténtalo de nuevo.' };
    }

    case 'pattern_trace': {
      const correct = (challenge as PatternTraceChallengeData).sequence;
      const userSeq = response.sequence as number[];
      if (JSON.stringify(correct) === JSON.stringify(userSeq)) {
        return { success: true, message: 'Patón trazado correctamente' };
      }
      return { success: false, message: 'Secuencia incorrecta. Observa las líneas guía.' };
    }

    case 'rotation_3d': {
      const ch = challenge as Rotation3DChallengeData;
      const userX = response.rotationX as number;
      const userY = response.rotationY as number;
      const tolerance = 25;
      const xDiff = Math.abs(userX - ch.targetRotationX);
      const yDiff = Math.abs(userY - ch.targetRotationY);
      if (xDiff <= tolerance && yDiff <= tolerance) {
        return { success: true, message: 'Rotación correcta' };
      }
      return { success: false, message: `Rotación incorrecta (X: ${xDiff.toFixed(0)}°, Y: ${yDiff.toFixed(0)}° de diferencia)` };
    }

    case 'audio': {
      const correct = (challenge as AudioChallengeData).answer;
      const userAnswer = isNaN(parseInt(response.answer, 10)) ? response.answer : parseInt(response.answer, 10);
      if (userAnswer === correct) {
        return { success: true, message: 'Respuesta de audio correcta' };
      }
      return { success: false, message: 'Respuesta incorrecta. Escucha de nuevo.' };
    }

    case 'timeline_order': {
      const correct = (challenge as TimelineOrderChallengeData).correctOrder;
      const userOrder = (response.order as number[]).sort((a, b) => a - b);
      const correctSorted = [...correct].sort((a, b) => a - b);
      if (JSON.stringify(userOrder) === JSON.stringify(correctSorted)) {
        return { success: true, message: 'Orden cronológico correcto' };
      }
      return { success: false, message: 'Orden incorrecto. Revisa las fechas.' };
    }

    default:
      return { success: false, message: 'Tipo de desafío desconocido' };
  }
}

// ============================================
// LABELS E ICONOS
// ============================================

export const CHALLENGE_LABELS: Record<ChallengeType, string> = {
  puzzle: 'Rompecabezas deslizante',
  image_select: 'Selección de imágenes',
  math_visual: 'Operación matemática visual',
  pattern_trace: 'Trazado de patrón',
  rotation_3d: 'Rotación 3D',
  audio: 'Desafío de audio',
  timeline_order: 'Orden cronológico',
  multi_step: 'Verificación multi-paso',
};

export const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  puzzle: '🧩',
  image_select: '🖼️',
  math_visual: '🔢',
  pattern_trace: '🔗',
  rotation_3d: '🎲',
  audio: '🔊',
  timeline_order: '📅',
  multi_step: '✅',
};
