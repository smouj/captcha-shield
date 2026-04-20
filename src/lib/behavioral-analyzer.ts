// ============================================
// BEHAVIORAL ANALYZER - Bot Detection Engine
// ============================================

export interface BehavioralData {
  mouseMovements: MousePoint[];
  clicks: ClickEvent[];
  scrollEvents: ScrollEvent[];
  startTime: number;
  submitTime: number;
  challengeType: string;
  totalInteractions: number;
}

export interface MousePoint {
  x: number;
  y: number;
  t: number;
}

export interface ClickEvent {
  x: number;
  y: number;
  t: number;
  duration?: number;
}

export interface ScrollEvent {
  y: number;
  t: number;
}

export interface RiskAssessment {
  riskScore: number;
  isBot: boolean;
  signals: RiskSignal[];
}

export interface RiskSignal {
  name: string;
  score: number;
  weight: number;
  description: string;
}

// ============================================
// Path Linearity Analysis
// ============================================
// Bots often move in perfectly straight lines between targets
// Humans have natural curves and micro-corrections

function calculatePathLinearity(points: MousePoint[]): number {
  if (points.length < 3) return 0.5; // Not enough data

  // Calculate total path length
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    pathLength += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y
    );
  }

  if (pathLength < 1) return 0.5;

  // Calculate straight-line distance from start to end
  const straightLine = Math.hypot(
    points[points.length - 1].x - points[0].x,
    points[points.length - 1].y - points[0].y
  );

  // Linearity ratio: 1.0 = perfectly straight, 0.0 = very curved
  const linearity = straightLine / pathLength;

  // Map to risk score: higher linearity = more suspicious
  // linearity > 0.95 is very suspicious
  // linearity < 0.5 is very human-like
  return Math.max(0, Math.min(1, (linearity - 0.5) * 2));
}

// ============================================
// Timing Consistency Analysis
// ============================================
// Bots have perfectly consistent timing between events
// Humans have variable timing with natural pauses

function calculateTimingConsistency(clicks: ClickEvent[], movements: MousePoint[]): number {
  const intervals: number[] = [];

  // Get timing intervals from mouse movements (sample every 10th point to reduce noise)
  for (let i = 10; i < movements.length; i += 10) {
    intervals.push(movements[i].t - movements[i - 10].t);
  }

  // Add click-to-click intervals
  for (let i = 1; i < clicks.length; i++) {
    intervals.push(clicks[i].t - clicks[i - 1].t);
  }

  if (intervals.length < 2) return 0.5;

  // Calculate coefficient of variation (CV)
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean === 0) return 0.5;

  const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Low CV (consistent timing) = suspicious (bot-like)
  // High CV (variable timing) = human-like
  // Typical bot CV: 0.05 - 0.15
  // Typical human CV: 0.3 - 1.5
  const riskScore = Math.max(0, Math.min(1, 1 - cv / 1.5));

  return riskScore;
}

// ============================================
// Speed Variance Analysis
// ============================================
// Bots tend to move at constant speed
// Humans accelerate and decelerate naturally

function calculateSpeedVariance(points: MousePoint[]): number {
  if (points.length < 5) return 0.5;

  const speeds: number[] = [];
  for (let i = 4; i < points.length; i += 4) {
    const dx = points[i].x - points[i - 4].x;
    const dy = points[i].y - points[i - 4].y;
    const dt = points[i].t - points[i - 4].t;
    if (dt > 0) {
      speeds.push(Math.hypot(dx, dy) / dt);
    }
  }

  if (speeds.length < 3) return 0.5;

  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  if (mean === 0) return 0.5;

  const variance = speeds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / speeds.length;
  const cv = Math.sqrt(variance) / mean;

  // Low speed variance = suspicious
  const riskScore = Math.max(0, Math.min(1, 1 - cv / 1.2));

  return riskScore;
}

// ============================================
// Hesitation Score Analysis
// ============================================
// Bots don't hesitate; humans pause before actions

function calculateHesitationScore(clicks: ClickEvent[], movements: MousePoint[], startTime: number, submitTime: number): number {
  const totalTime = submitTime - startTime;
  if (totalTime < 500) return 0.9; // Too fast, very suspicious

  // Check for pauses in mouse movement
  let pauseCount = 0;
  const PAUSE_THRESHOLD = 200; // ms

  for (let i = 1; i < movements.length; i++) {
    const dt = movements[i].t - movements[i - 1].t;
    if (dt > PAUSE_THRESHOLD) {
      pauseCount++;
    }
  }

  // Check for hesitation before clicks
  let clickHesitation = 0;
  for (const click of clicks) {
    const beforeClick = movements.filter(m => m.t < click.t);
    if (beforeClick.length > 0) {
      const lastMove = beforeClick[beforeClick.length - 1];
      const gap = click.t - lastMove.t;
      if (gap > 100) clickHesitation++;
    }
  }

  // More pauses/hesitation = more human-like (lower risk)
  const totalPauses = pauseCount + clickHesitation;
  const expectedPauses = Math.max(1, Math.floor(totalTime / 3000));

  // If we have reasonable pauses, lower the score
  const pauseRatio = totalPauses / expectedPauses;

  // Also check: too fast completion (< 2s) is suspicious
  if (totalTime < 2000) return 0.85;
  if (totalTime < 3000) return 0.6;

  // No pauses at all is suspicious
  if (totalPauses === 0 && totalTime > 5000) return 0.7;

  return Math.max(0, Math.min(1, 1 - pauseRatio * 0.5));
}

// ============================================
// Entropy Score Analysis
// ============================================
// Shannon entropy of behavioral data
// Low entropy = predictable (bot-like)

function calculateEntropyScore(points: MousePoint[], clicks: ClickEvent[]): number {
  // Calculate entropy of mouse x positions (discretized)
  const bins = 20;
  const xCounts = new Array(bins).fill(0);
  const yCounts = new Array(bins).fill(0);

  if (points.length < 10) return 0.5;

  const xMin = Math.min(...points.map(p => p.x));
  const xMax = Math.max(...points.map(p => p.x));
  const yMin = Math.min(...points.map(p => p.y));
  const yMax = Math.max(...points.map(p => p.y));

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  for (const p of points) {
    const xBin = Math.min(bins - 1, Math.floor(((p.x - xMin) / xRange) * bins));
    const yBin = Math.min(bins - 1, Math.floor(((p.y - yMin) / yRange) * bins));
    xCounts[xBin]++;
    yCounts[yBin]++;
  }

  // Shannon entropy
  function entropy(counts: number[], total: number): number {
    let h = 0;
    for (const c of counts) {
      if (c > 0) {
        const p = c / total;
        h -= p * Math.log2(p);
      }
    }
    return h;
  }

  const xEntropy = entropy(xCounts, points.length);
  const yEntropy = entropy(yCounts, points.length);

  // Max entropy for 20 bins = log2(20) ≈ 4.32
  const maxEntropy = Math.log2(bins);
  const avgEntropy = (xEntropy + yEntropy) / 2;

  // Normalized entropy: 1.0 = max entropy (human-like), 0.0 = min (bot-like)
  const normalizedEntropy = avgEntropy / maxEntropy;

  // Low entropy = bot-like
  const riskScore = Math.max(0, Math.min(1, 1 - normalizedEntropy));

  return riskScore;
}

// ============================================
// Bezier Curve Fit Analysis
// ============================================
// Humans move in natural bezier curves, bots in straight lines

function calculateBezierFit(points: MousePoint[]): number {
  if (points.length < 6) return 0.5;

  // Sample points (take every Nth point)
  const step = Math.max(1, Math.floor(points.length / 20));
  const sampled = points.filter((_, i) => i % step === 0);

  if (sampled.length < 4) return 0.5;

  // Calculate average curvature
  let totalCurvature = 0;
  let curvatureCount = 0;

  for (let i = 1; i < sampled.length - 1; i++) {
    const p0 = sampled[i - 1];
    const p1 = sampled[i];
    const p2 = sampled[i + 1];

    // Vectors
    const v1x = p1.x - p0.x;
    const v1y = p1.y - p0.y;
    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;

    // Cross product magnitude (curvature indicator)
    const cross = Math.abs(v1x * v2y - v1y * v2x);
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 > 0 && len2 > 0) {
      const curvature = cross / (len1 * len2);
      totalCurvature += curvature;
      curvatureCount++;
    }
  }

  if (curvatureCount === 0) return 0.5;

  const avgCurvature = totalCurvature / curvatureCount;

  // High curvature variation = human-like
  // Low curvature (straight lines) = bot-like
  // avgCurvature range: 0 (straight) to ~1 (very curved)
  const riskScore = Math.max(0, Math.min(1, 1 - avgCurvature * 2));

  return riskScore;
}

// ============================================
// Main Behavioral Analysis
// ============================================

export function analyzeBehavior(behavioralData: BehavioralData): RiskAssessment {
  const signals: RiskSignal[] = [];
  let totalRisk = 0;
  let totalWeight = 0;

  const { mouseMovements, clicks, scrollEvents, startTime, submitTime } = behavioralData;

  // 1. Path Linearity (weight: 0.20)
  const linearity = calculatePathLinearity(mouseMovements);
  signals.push({
    name: 'Linealidad de trayectoria',
    score: linearity,
    weight: 0.20,
    description: linearity > 0.7
      ? 'La trayectoria del ratón es demasiado recta'
      : 'La trayectoria del ratón parece natural',
  });

  // 2. Timing Consistency (weight: 0.20)
  const timing = calculateTimingConsistency(clicks, mouseMovements);
  signals.push({
    name: 'Consistencia temporal',
    score: timing,
    weight: 0.20,
    description: timing > 0.7
      ? 'Los intervalos de tiempo son demasiado consistentes'
      : 'Los intervalos de tiempo muestran variación natural',
  });

  // 3. Speed Variance (weight: 0.15)
  const speed = calculateSpeedVariance(mouseMovements);
  signals.push({
    name: 'Varianza de velocidad',
    score: speed,
    weight: 0.15,
    description: speed > 0.7
      ? 'La velocidad del ratón es demasiado constante'
      : 'La velocidad del ratón varía naturalmente',
  });

  // 4. Hesitation Score (weight: 0.25)
  const hesitation = calculateHesitationScore(clicks, mouseMovements, startTime, submitTime);
  signals.push({
    name: 'Patrón de hesitación',
    score: hesitation,
    weight: 0.25,
    description: hesitation > 0.7
      ? 'No se detectan pausas naturales'
      : 'Se detectan pausas naturales en la interacción',
  });

  // 5. Entropy Score (weight: 0.10)
  const entropy = calculateEntropyScore(mouseMovements, clicks);
  signals.push({
    name: 'Entropía de movimiento',
    score: entropy,
    weight: 0.10,
    description: entropy > 0.7
      ? 'Los movimientos son demasiado predecibles'
      : 'Los movimientos tienen buena entropía',
  });

  // 6. Bezier Curve Fit (weight: 0.10)
  const bezier = calculateBezierFit(mouseMovements);
  signals.push({
    name: 'Ajuste de curva Bézier',
    score: bezier,
    weight: 0.10,
    description: bezier > 0.7
      ? 'Los movimientos no siguen curvas naturales'
      : 'Los movimientos siguen curvas Bézier naturales',
  });

  // Calculate weighted risk score
  for (const signal of signals) {
    totalRisk += signal.score * signal.weight;
    totalWeight += signal.weight;
  }

  const finalScore = totalWeight > 0 ? totalRisk / totalWeight : 0.5;

  return {
    riskScore: Math.round(finalScore * 100) / 100,
    isBot: finalScore > 0.7,
    signals,
  };
}
