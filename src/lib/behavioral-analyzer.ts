// ============================================
// CAPTCHA SHIELD v3.0 - Motor Anti-IA (14 señales)
// ============================================

export interface MousePoint { x: number; y: number; t: number; pressure?: number; }
export interface ClickEvent { x: number; y: number; t: number; duration?: number; }
export interface ScrollEvent { y: number; t: number; }
export interface KeyEvent { key: string; t: number; type: 'down' | 'up'; }
export interface VisibilityEvent { hidden: boolean; t: number; }

export interface BehavioralData {
  mouseMovements: MousePoint[];
  clicks: ClickEvent[];
  scrollEvents: ScrollEvent[];
  keyEvents: KeyEvent[];
  visibilityEvents: VisibilityEvent[];
  startTime: number;
  submitTime: number;
  challengeType: string;
  totalInteractions: number;
  deviceFingerprint: DeviceFingerprint;
}

export interface DeviceFingerprint {
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  webglRenderer: string;
  webglVendor: string;
  hasWebGL: boolean;
  hasCanvas: boolean;
  pluginsCount: number;
  isHeadless: boolean;
  automationDetected: boolean;
}

export interface RiskSignal {
  name: string;
  score: number;
  weight: number;
  description: string;
  category: 'movement' | 'timing' | 'device' | 'environment';
}

export interface RiskAssessment {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isBot: boolean;
  signals: RiskSignal[];
  confidence: number;
}

// ============================================
// 1. LINEALIDAD DE TRAYECTORIA (0.10)
// ============================================
function calculatePathLinearity(points: MousePoint[]): number {
  if (points.length < 3) return 0.5;

  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    pathLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (pathLength < 1) return 0.5;

  const straightLine = Math.hypot(
    points[points.length - 1].x - points[0].x,
    points[points.length - 1].y - points[0].y
  );

  const linearity = straightLine / pathLength;
  return Math.max(0, Math.min(1, (linearity - 0.5) * 2));
}

// ============================================
// 2. CONSISTENCIA TEMPORAL (0.10)
// ============================================
function calculateTimingConsistency(clicks: ClickEvent[], movements: MousePoint[]): number {
  const intervals: number[] = [];

  for (let i = 10; i < movements.length; i += 10) {
    intervals.push(movements[i].t - movements[i - 10].t);
  }
  for (let i = 1; i < clicks.length; i++) {
    intervals.push(clicks[i].t - clicks[i - 1].t);
  }

  if (intervals.length < 2) return 0.5;

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean === 0) return 0.5;

  const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
  const cv = Math.sqrt(variance) / mean;

  return Math.max(0, Math.min(1, 1 - cv / 1.5));
}

// ============================================
// 3. VARIANZA DE VELOCIDAD (0.08)
// ============================================
function calculateSpeedVariance(points: MousePoint[]): number {
  if (points.length < 5) return 0.5;

  const speeds: number[] = [];
  for (let i = 4; i < points.length; i += 4) {
    const dt = points[i].t - points[i - 4].t;
    if (dt > 0) {
      speeds.push(Math.hypot(points[i].x - points[i - 4].x, points[i].y - points[i - 4].y) / dt);
    }
  }

  if (speeds.length < 3) return 0.5;

  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  if (mean === 0) return 0.5;

  const variance = speeds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / speeds.length;
  const cv = Math.sqrt(variance) / mean;

  return Math.max(0, Math.min(1, 1 - cv / 1.2));
}

// ============================================
// 4. PATRÓN DE HESITACIÓN (0.12)
// ============================================
function calculateHesitationScore(clicks: ClickEvent[], movements: MousePoint[], startTime: number, submitTime: number): number {
  const totalTime = submitTime - startTime;
  if (totalTime < 500) return 0.9;
  if (totalTime < 2000) return 0.85;
  if (totalTime < 3000) return 0.6;

  let pauseCount = 0;
  const PAUSE_THRESHOLD = 200;

  for (let i = 1; i < movements.length; i++) {
    if (movements[i].t - movements[i - 1].t > PAUSE_THRESHOLD) pauseCount++;
  }

  let clickHesitation = 0;
  for (const click of clicks) {
    const beforeClick = movements.filter(m => m.t < click.t);
    if (beforeClick.length > 0 && click.t - beforeClick[beforeClick.length - 1].t > 100) {
      clickHesitation++;
    }
  }

  const totalPauses = pauseCount + clickHesitation;
  const expectedPauses = Math.max(1, Math.floor(totalTime / 3000));

  if (totalPauses === 0 && totalTime > 5000) return 0.7;

  const pauseRatio = totalPauses / expectedPauses;
  return Math.max(0, Math.min(1, 1 - pauseRatio * 0.5));
}

// ============================================
// 5. ENTROPÍA DE MOVIMIENTO (0.06)
// ============================================
function calculateEntropyScore(points: MousePoint[], _clicks: ClickEvent[]): number {
  const bins = 20;
  if (points.length < 10) return 0.5;

  const xCounts = new Array(bins).fill(0);
  const yCounts = new Array(bins).fill(0);

  const xMin = Math.min(...points.map(p => p.x));
  const xMax = Math.max(...points.map(p => p.x));
  const yMin = Math.min(...points.map(p => p.y));
  const yMax = Math.max(...points.map(p => p.y));
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  for (const p of points) {
    xCounts[Math.min(bins - 1, Math.floor(((p.x - xMin) / xRange) * bins))]++;
    yCounts[Math.min(bins - 1, Math.floor(((p.y - yMin) / yRange) * bins))]++;
  }

  function entropy(counts: number[], total: number): number {
    let h = 0;
    for (const c of counts) {
      if (c > 0) { const p = c / total; h -= p * Math.log2(p); }
    }
    return h;
  }

  const maxEntropy = Math.log2(bins);
  const avgEntropy = (entropy(xCounts, points.length) + entropy(yCounts, points.length)) / 2;
  return Math.max(0, Math.min(1, 1 - avgEntropy / maxEntropy));
}

// ============================================
// 6. AJUSTE DE CURVA BÉZIER (0.06)
// ============================================
function calculateBezierFit(points: MousePoint[]): number {
  if (points.length < 6) return 0.5;

  const step = Math.max(1, Math.floor(points.length / 20));
  const sampled = points.filter((_, i) => i % step === 0);
  if (sampled.length < 4) return 0.5;

  let totalCurvature = 0;
  let count = 0;

  for (let i = 1; i < sampled.length - 1; i++) {
    const v1x = sampled[i].x - sampled[i - 1].x;
    const v1y = sampled[i].y - sampled[i - 1].y;
    const v2x = sampled[i + 1].x - sampled[i].x;
    const v2y = sampled[i + 1].y - sampled[i].y;

    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    if (len1 > 0 && len2 > 0) {
      totalCurvature += Math.abs(v1x * v2y - v1y * v2x) / (len1 * len2);
      count++;
    }
  }

  if (count === 0) return 0.5;
  return Math.max(0, Math.min(1, 1 - (totalCurvature / count) * 2));
}

// ============================================
// 7. ANOMALÍA DE DISPOSITIVO (0.08)
// ============================================
function calculateDeviceFingerprintAnomaly(fingerprint: DeviceFingerprint): number {
  let risk = 0;
  let checks = 0;

  // Sin WebGL
  if (!fingerprint.hasWebGL) { risk += 0.7; checks++; } else { checks++; }

  // Headless browser
  if (fingerprint.isHeadless) { risk += 1.0; checks++; } else { checks++; }

  // Automatización detectada
  if (fingerprint.automationDetected) { risk += 1.0; checks++; } else { checks++; }

  // Sin plugins (muy sospechoso)
  if (fingerprint.pluginsCount === 0) { risk += 0.4; checks++; } else { checks++; }

  // Canvas no disponible
  if (!fingerprint.hasCanvas) { risk += 0.6; checks++; } else { checks++; }

  // Hardware concurrency muy bajo
  if (fingerprint.hardwareConcurrency <= 1) { risk += 0.3; checks++; } else { checks++; }

  // Pantalla muy pequeña (sospechoso para bot)
  if (fingerprint.screenWidth < 320 || fingerprint.screenHeight < 320) { risk += 0.3; checks++; } else { checks++; }

  // Profundidad de color anómala
  if (fingerprint.colorDepth <= 8) { risk += 0.4; checks++; } else { checks++; }

  return checks > 0 ? Math.max(0, Math.min(1, risk / checks)) : 0.5;
}

// ============================================
// 8. DINÁMICA DE TECLADO (0.08)
// ============================================
function calculateKeyboardDynamics(keyEvents: KeyEvent[]): number {
  if (keyEvents.length < 4) return 0.5;

  const keyPairs: number[] = [];
  for (let i = 1; i < keyEvents.length; i++) {
    if (keyEvents[i].type === 'down' && keyEvents[i - 1].type === 'down') {
      keyPairs.push(keyEvents[i].t - keyEvents[i - 1].t);
    }
  }

  if (keyPairs.length < 2) return 0.5;

  const mean = keyPairs.reduce((a, b) => a + b, 0) / keyPairs.length;
  if (mean === 0) return 0.9;

  const variance = keyPairs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / keyPairs.length;
  const cv = Math.sqrt(variance) / mean;

  // CV bajo = bots (timing perfecto)
  return Math.max(0, Math.min(1, 1 - cv / 1.5));
}

// ============================================
// 9. PRECISIÓN DEL PUNTERO (0.06)
// ============================================
function calculatePointerPrecision(points: MousePoint[]): number {
  if (points.length < 10) return 0.5;

  // Calcular jitter: micro-vibraciones del ratón
  const jitters: number[] = [];
  for (let i = 2; i < points.length - 2; i++) {
    const dx1 = points[i].x - points[i - 1].x;
    const dy1 = points[i].y - points[i - 1].y;
    const dx2 = points[i + 1].x - points[i].x;
    const dy2 = points[i + 1].y - points[i].y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    const angleDiff = Math.abs(angle2 - angle1);

    if (Math.hypot(dx1, dy1) > 1 && Math.hypot(dx2, dy2) > 1) {
      jitters.push(angleDiff);
    }
  }

  if (jitters.length < 5) return 0.5;

  const avgJitter = jitters.reduce((a, b) => a + b, 0) / jitters.length;

  // Los humanos tienen jitter natural, los bots son muy precisos
  // Jitter muy bajo = sospechoso
  if (avgJitter < 0.05) return 0.8;
  if (avgJitter < 0.1) return 0.5;
  return 0.2;
}

// ============================================
// 10. COMPORTAMIENTO DE SCROLL (0.04)
// ============================================
function calculateScrollBehavior(scrollEvents: ScrollEvent[], totalTime: number): number {
  if (scrollEvents.length === 0) {
    return totalTime > 10000 ? 0.3 : 0.5; // Sin scroll es OK para CAPTCHAs pequeños
  }

  if (scrollEvents.length < 3) return 0.5;

  const scrollSpeeds: number[] = [];
  for (let i = 1; i < scrollEvents.length; i++) {
    const dy = Math.abs(scrollEvents[i].y - scrollEvents[i - 1].y);
    const dt = scrollEvents[i].t - scrollEvents[i - 1].t;
    if (dt > 0) scrollSpeeds.push(dy / dt);
  }

  if (scrollSpeeds.length < 2) return 0.5;

  const mean = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
  const variance = scrollSpeeds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scrollSpeeds.length;
  const cv = Math.sqrt(variance) / (mean || 1);

  // Scroll perfectamente uniforme = bot
  return Math.max(0, Math.min(1, 1 - cv / 1.0));
}

// ============================================
// 11. PRESIÓN DEL PUNTERO (0.04)
// ============================================
function calculatePointerPressure(points: MousePoint[]): number {
  const pressurePoints = points.filter(p => p.pressure !== undefined && p.pressure !== null);

  if (pressurePoints.length < 5) return 0.3; // Sin datos de presión = OK (muchos browsers no lo soportan)

  const pressures = pressurePoints.map(p => p.pressure!);
  const mean = pressures.reduce((a, b) => a + b, 0) / pressures.length;

  // Presión siempre 0.5 = sospechoso (valor por defecto de bots)
  if (mean === 0.5 && pressures.every(p => p === 0.5)) return 0.8;

  // Variación de presión = humano
  const variance = pressures.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pressures.length;
  const cv = Math.sqrt(variance) / (mean || 1);

  return Math.max(0, Math.min(1, 1 - cv * 2));
}

// ============================================
// 12. VISIBILIDAD DE PESTAÑA (0.06)
// ============================================
function calculateTabVisibility(visibilityEvents: VisibilityEvent[], totalTime: number): number {
  if (visibilityEvents.length === 0) return 0.2; // Sin eventos = probablemente pestaña visible todo el tiempo

  let hiddenTime = 0;
  for (let i = 1; i < visibilityEvents.length; i++) {
    if (visibilityEvents[i - 1].hidden) {
      hiddenTime += visibilityEvents[i].t - visibilityEvents[i - 1].t;
    }
  }

  // Si el último evento era hidden
  if (visibilityEvents[visibilityEvents.length - 1].hidden) {
    hiddenTime += totalTime - visibilityEvents[visibilityEvents.length - 1].t;
  }

  const hiddenRatio = totalTime > 0 ? hiddenTime / totalTime : 0;

  // Cambió de pestaña durante el CAPTCHA = sospechoso
  if (hiddenRatio > 0.5) return 0.9;
  if (hiddenRatio > 0.2) return 0.7;
  if (hiddenRatio > 0) return 0.4;

  return 0.1;
}

// ============================================
// 13. CONSISTENCIA DE ENTORNO (0.06)
// ============================================
function calculateEnvironmentConsistency(fingerprint: DeviceFingerprint): number {
  let risk = 0;
  let checks = 0;

  // Plataforma vacía o sospechosa
  if (!fingerprint.platform || fingerprint.platform === 'Linux x86_64' && fingerprint.maxTouchPoints > 0) {
    risk += 0.3;
  }
  checks++;

  // Hardware concurrency anómalo
  if (fingerprint.hardwareConcurrency > 32) { risk += 0.4; }
  else if (fingerprint.hardwareConcurrency <= 0) { risk += 0.5; }
  checks++;

  // Resolución extrema (indicativo de VM)
  if (fingerprint.screenWidth > 3840 && fingerprint.screenHeight > 2160) { risk += 0.2; }
  checks++;

  // Timezone/Language mismatch raro
  if (!fingerprint.timezone || fingerprint.timezone.length < 2) { risk += 0.3; }
  checks++;

  // MaxTouchPoints en desktop = raro
  if (fingerprint.maxTouchPoints > 10) { risk += 0.3; }
  checks++;

  return checks > 0 ? Math.max(0, Math.min(1, risk / checks)) : 0.3;
}

// ============================================
// 14. ANOMALÍA TEMPORAL (0.06)
// ============================================
function calculateTimeAnomaly(challengeType: string, startTime: number, submitTime: number, clicks: ClickEvent[]): number {
  const totalTime = submitTime - startTime;

  // Tiempos mínimos por tipo de desafío
  const minTimes: Record<string, number> = {
    puzzle: 3000,
    image_select: 4000,
    math_visual: 3000,
    pattern_trace: 5000,
    rotation_3d: 4000,
    audio: 8000,
    timeline_order: 5000,
    multi_step: 5000,
  };

  const minTime = minTimes[challengeType] || 3000;

  // Imposiblemente rápido
  if (totalTime < minTime * 0.3) return 0.95;
  if (totalTime < minTime * 0.5) return 0.8;
  if (totalTime < minTime * 0.7) return 0.5;

  // Demasiado lento (podría ser un bot con delay intencional)
  if (totalTime > 120000) return 0.4;

  // Pocos clics para el tiempo transcurrido
  const clicksPerSecond = clicks.length / (totalTime / 1000);
  if (clicksPerSecond > 10) return 0.7; // Demasiado rápido

  return 0.1;
}

// ============================================
// ANÁLISIS PRINCIPAL
// ============================================

export function analyzeBehavior(data: BehavioralData): RiskAssessment {
  const signals: RiskSignal[] = [];
  const { mouseMovements, clicks, scrollEvents, keyEvents, visibilityEvents, startTime, submitTime, challengeType, deviceFingerprint } = data;

  // 1. Linealidad de trayectoria
  const linearity = calculatePathLinearity(mouseMovements);
  signals.push({
    name: 'Linealidad de trayectoria',
    score: linearity, weight: 0.10, category: 'movement',
    description: linearity > 0.7 ? 'Trayectoria demasiado recta (sospechoso)' : 'Trayectoria natural con curvas',
  });

  // 2. Consistencia temporal
  const timing = calculateTimingConsistency(clicks, mouseMovements);
  signals.push({
    name: 'Consistencia temporal',
    score: timing, weight: 0.10, category: 'timing',
    description: timing > 0.7 ? 'Intervalos demasiado consistentes' : 'Variación temporal natural',
  });

  // 3. Varianza de velocidad
  const speed = calculateSpeedVariance(mouseMovements);
  signals.push({
    name: 'Varianza de velocidad',
    score: speed, weight: 0.08, category: 'movement',
    description: speed > 0.7 ? 'Velocidad demasiado constante' : 'Aceleración/desaceleración natural',
  });

  // 4. Patrón de hesitación
  const hesitation = calculateHesitationScore(clicks, mouseMovements, startTime, submitTime);
  signals.push({
    name: 'Patrón de hesitación',
    score: hesitation, weight: 0.12, category: 'timing',
    description: hesitation > 0.7 ? 'Sin pausas naturales' : 'Pausas naturales detectadas',
  });

  // 5. Entropía de movimiento
  const entropy = calculateEntropyScore(mouseMovements, clicks);
  signals.push({
    name: 'Entropía de movimiento',
    score: entropy, weight: 0.06, category: 'movement',
    description: entropy > 0.7 ? 'Movimientos predecibles' : 'Buena entropía en movimientos',
  });

  // 6. Ajuste de curva Bézier
  const bezier = calculateBezierFit(mouseMovements);
  signals.push({
    name: 'Ajuste de curva Bézier',
    score: bezier, weight: 0.06, category: 'movement',
    description: bezier > 0.7 ? 'Sin curvas naturales' : 'Curvas Bézier naturales',
  });

  // 7. Anomalía de dispositivo
  const deviceAnomaly = calculateDeviceFingerprintAnomaly(deviceFingerprint);
  signals.push({
    name: 'Anomalía de dispositivo',
    score: deviceAnomaly, weight: 0.08, category: 'device',
    description: deviceAnomaly > 0.7 ? 'Dispositivo sospechoso detectado' : 'Dispositivo legítimo',
  });

  // 8. Dinámica de teclado
  const keyboardDyn = calculateKeyboardDynamics(keyEvents);
  signals.push({
    name: 'Dinámica de teclado',
    score: keyboardDyn, weight: 0.08, category: 'timing',
    description: keyboardDyn > 0.7 ? 'Ritmo de teclado automatizado' : 'Ritmo de teclado natural',
  });

  // 9. Precisión del puntero
  const pointerPrecision = calculatePointerPrecision(mouseMovements);
  signals.push({
    name: 'Precisión del puntero',
    score: pointerPrecision, weight: 0.06, category: 'movement',
    description: pointerPrecision > 0.7 ? 'Precisión excesiva (posible bot)' : 'Micro-temblores naturales',
  });

  // 10. Comportamiento de scroll
  const scrollBehavior = calculateScrollBehavior(scrollEvents, submitTime - startTime);
  signals.push({
    name: 'Comportamiento de scroll',
    score: scrollBehavior, weight: 0.04, category: 'movement',
    description: scrollBehavior > 0.7 ? 'Scroll sintético detectado' : 'Scroll natural',
  });

  // 11. Presión del puntero
  const pressure = calculatePointerPressure(mouseMovements);
  signals.push({
    name: 'Presión del puntero',
    score: pressure, weight: 0.04, category: 'device',
    description: pressure > 0.7 ? 'Valores de presión sospechosos' : 'Presión natural',
  });

  // 12. Visibilidad de pestaña
  const tabVis = calculateTabVisibility(visibilityEvents, submitTime - startTime);
  signals.push({
    name: 'Visibilidad de pestaña',
    score: tabVis, weight: 0.06, category: 'environment',
    description: tabVis > 0.7 ? 'Cambio de pestaña detectado' : 'Pestaña activa durante toda la verificación',
  });

  // 13. Consistencia de entorno
  const envConsistency = calculateEnvironmentConsistency(deviceFingerprint);
  signals.push({
    name: 'Consistencia de entorno',
    score: envConsistency, weight: 0.06, category: 'environment',
    description: envConsistency > 0.7 ? 'Inconsistencias en el entorno' : 'Entorno consistente',
  });

  // 14. Anomalía temporal
  const timeAnomaly = calculateTimeAnomaly(challengeType, startTime, submitTime, clicks);
  signals.push({
    name: 'Anomalía temporal',
    score: timeAnomaly, weight: 0.06, category: 'timing',
    description: timeAnomaly > 0.7 ? 'Tiempo de resolución anómalo' : 'Tiempo de resolución normal',
  });

  // Calcular puntuación ponderada
  let totalRisk = 0;
  let totalWeight = 0;

  for (const signal of signals) {
    totalRisk += signal.score * signal.weight;
    totalWeight += signal.weight;
  }

  const finalScore = totalWeight > 0 ? totalRisk / totalWeight : 0.5;
  const roundedScore = Math.round(finalScore * 100) / 100;

  const riskLevel = finalScore < 0.3 ? 'low'
    : finalScore < 0.5 ? 'medium'
    : finalScore < 0.7 ? 'high'
    : 'critical';

  // Confianza basada en cantidad de datos
  const dataPoints = mouseMovements.length + clicks.length + keyEvents.length;
  const confidence = Math.min(1, dataPoints / 50);

  return {
    riskScore: roundedScore,
    riskLevel,
    isBot: finalScore > 0.65,
    signals,
    confidence,
  };
}

// ============================================
// FINGERPRINTING
// ============================================

export function collectDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === 'undefined') {
    return {
      screenWidth: 0, screenHeight: 0, colorDepth: 0, timezone: '', language: '',
      platform: '', hardwareConcurrency: 0, maxTouchPoints: 0, webglRenderer: '',
      webglVendor: '', hasWebGL: false, hasCanvas: false, pluginsCount: 0,
      isHeadless: false, automationDetected: false,
    };
  }

  const nav = navigator as any;

  // WebGL
  let webglRenderer = '';
  let webglVendor = '';
  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      hasWebGL = true;
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    }
  } catch {}

  // Canvas
  let hasCanvas = false;
  try {
    const c = document.createElement('canvas');
    c.getContext('2d');
    hasCanvas = true;
  } catch {}

  // Headless browser detection
  const isHeadless = !!nav.webdriver
    || /HeadlessChrome/i.test(nav.userAgent)
    || !nav.languages
    || nav.plugins.length === 0 && !nav.maxTouchPoints;

  // Automation detection
  const automationDetected = !!nav.webdriver
    || !!(window as any).__nightmare
    || !!(window as any).callPhantom
    || !!(window as any)._phantom
    || /phantom/i.test(nav.userAgent)
    || /selenium/i.test(nav.userAgent)
    || /driver/i.test(nav.userAgent);

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: nav.language || '',
    platform: nav.platform || '',
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    maxTouchPoints: nav.maxTouchPoints || 0,
    webglRenderer,
    webglVendor,
    hasWebGL,
    hasCanvas,
    pluginsCount: nav.plugins ? nav.plugins.length : 0,
    isHeadless,
    automationDetected,
  };
}
