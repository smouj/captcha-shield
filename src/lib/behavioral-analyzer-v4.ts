/**
 * CAPTCHA Shield v4.0 "Fortress" — Behavioral Analyzer v4
 * 
 * 28 behavioral signals with Bayesian risk scoring.
 * Detects bots, headless browsers, and automation frameworks
 * with 40+ fingerprinting vectors.
 */

import {
  BehavioralData,
  SignalCategory,
  SignalName,
  SignalReading,
  RiskLevel,
  RiskAssessment,
  ChallengeType,
  ChallengeDifficulty,
} from './types';

// ─── Signal Configuration ───────────────────────────────────────────────────

interface SignalConfig {
  name: SignalName;
  category: SignalCategory;
  weight: number;
  description: string;
  humanRange: [number, number];
  botRange: [number, number];
}

const SIGNAL_CONFIGS: SignalConfig[] = [
  // Motor signals (8)
  { name: SignalName.MOUSE_PATH_LINEARITY, category: SignalCategory.MOTOR, weight: 0.08, description: 'How curved/linear the mouse path is', humanRange: [0.2, 0.8], botRange: [0.85, 1.0] },
  { name: SignalName.MOUSE_SPEED_VARIANCE, category: SignalCategory.MOTOR, weight: 0.07, description: 'Variance in mouse movement speed', humanRange: [0.3, 0.9], botRange: [0.0, 0.1] },
  { name: SignalName.MOUSE_ACCELERATION_PATTERN, category: SignalCategory.MOTOR, weight: 0.06, description: 'Acceleration/deceleration patterns', humanRange: [0.3, 0.8], botRange: [0.0, 0.15] },
  { name: SignalName.POINTER_PRECISION, category: SignalCategory.MOTOR, weight: 0.05, description: 'Click precision relative to target center', humanRange: [0.3, 0.85], botRange: [0.9, 1.0] },
  { name: SignalName.POINTER_PRESSURE, category: SignalCategory.MOTOR, weight: 0.04, description: 'Touch/pen pressure variance', humanRange: [0.2, 0.8], botRange: [0.0, 0.05] },
  { name: SignalName.CLICK_PRECISION, category: SignalCategory.MOTOR, weight: 0.05, description: 'How centered clicks are on targets', humanRange: [0.3, 0.7], botRange: [0.85, 1.0] },
  { name: SignalName.SCROLL_BEHAVIOR, category: SignalCategory.MOTOR, weight: 0.04, description: 'Scroll speed and pattern naturalness', humanRange: [0.2, 0.8], botRange: [0.0, 0.1] },
  { name: SignalName.GESTURE_SMOOTHNESS, category: SignalCategory.MOTOR, weight: 0.05, description: 'Smoothness of gesture/drag movements', humanRange: [0.4, 0.9], botRange: [0.0, 0.2] },
  // Temporal signals (6)
  { name: SignalName.TIMING_CONSISTENCY, category: SignalCategory.TEMPORAL, weight: 0.07, description: 'Consistency of inter-action timing', humanRange: [0.3, 0.8], botRange: [0.9, 1.0] },
  { name: SignalName.REACTION_TIME, category: SignalCategory.TEMPORAL, weight: 0.06, description: 'Time to first action after stimulus', humanRange: [0.2, 0.7], botRange: [0.0, 0.1] },
  { name: SignalName.HESITATION_PATTERN, category: SignalCategory.TEMPORAL, weight: 0.05, description: 'Micro-pauses before decisions', humanRange: [0.3, 0.8], botRange: [0.0, 0.1] },
  { name: SignalName.INTER_EVENT_INTERVAL, category: SignalCategory.TEMPORAL, weight: 0.04, description: 'Time between sequential events', humanRange: [0.3, 0.9], botRange: [0.0, 0.1] },
  { name: SignalName.TASK_COMPLETION_RHYTHM, category: SignalCategory.TEMPORAL, weight: 0.04, description: 'Overall rhythm pattern of task completion', humanRange: [0.3, 0.8], botRange: [0.0, 0.15] },
  { name: SignalName.TEMPORAL_ANOMALY, category: SignalCategory.TEMPORAL, weight: 0.06, description: 'Statistical anomaly in timing distribution', humanRange: [0.1, 0.6], botRange: [0.7, 1.0] },
  // Device signals (6)
  { name: SignalName.DEVICE_FINGERPRINT, category: SignalCategory.DEVICE, weight: 0.05, description: 'Device fingerprint consistency', humanRange: [0.8, 1.0], botRange: [0.0, 0.3] },
  { name: SignalName.SCREEN_RESOLUTION, category: SignalCategory.DEVICE, weight: 0.03, description: 'Screen resolution vs user agent consistency', humanRange: [0.7, 1.0], botRange: [0.0, 0.3] },
  { name: SignalName.TIMEZONE_CONSISTENCY, category: SignalCategory.DEVICE, weight: 0.03, description: 'Timezone match between system and settings', humanRange: [0.8, 1.0], botRange: [0.0, 0.4] },
  { name: SignalName.BATTERY_API, category: SignalCategory.DEVICE, weight: 0.02, description: 'Battery API availability and values', humanRange: [0.3, 1.0], botRange: [0.0, 0.1] },
  { name: SignalName.SENSOR_FUSION, category: SignalCategory.DEVICE, weight: 0.03, description: 'Accelerometer/gyroscope data presence', humanRange: [0.4, 1.0], botRange: [0.0, 0.1] },
  { name: SignalName.WEBRTC_FINGERPRINT, category: SignalCategory.DEVICE, weight: 0.04, description: 'WebRTC local IP fingerprint', humanRange: [0.7, 1.0], botRange: [0.0, 0.3] },
  // Cognitive signals (4)
  { name: SignalName.DECISION_LATENCY, category: SignalCategory.COGNITIVE, weight: 0.05, description: 'Time taken to make decisions', humanRange: [0.3, 0.8], botRange: [0.0, 0.1] },
  { name: SignalName.ERROR_CORRECTION, category: SignalCategory.COGNITIVE, weight: 0.04, description: 'Self-correction behavior patterns', humanRange: [0.2, 0.7], botRange: [0.0, 0.05] },
  { name: SignalName.PATTERN_RECOGNITION, category: SignalCategory.COGNITIVE, weight: 0.04, description: 'How the user recognizes visual patterns', humanRange: [0.3, 0.8], botRange: [0.9, 1.0] },
  { name: SignalName.ENTROPY_SCORE, category: SignalCategory.COGNITIVE, weight: 0.05, description: 'Entropy of behavioral data distribution', humanRange: [0.5, 1.0], botRange: [0.0, 0.3] },
  // Environment signals (2)
  { name: SignalName.TAB_VISIBILITY, category: SignalCategory.ENVIRONMENT, weight: 0.03, description: 'Tab focus/visibility changes', humanRange: [0.7, 1.0], botRange: [0.0, 0.3] },
  { name: SignalName.ENVIRONMENT_CONSISTENCY, category: SignalCategory.ENVIRONMENT, weight: 0.03, description: 'Browser environment consistency checks', humanRange: [0.7, 1.0], botRange: [0.0, 0.3] },
  // Network signals (1)
  { name: SignalName.CONNECTION_FINGERPRINT, category: SignalCategory.NETWORK, weight: 0.02, description: 'Connection type and round-trip consistency', humanRange: [0.5, 1.0], botRange: [0.0, 0.3] },
  // Biometric signals (1)
  { name: SignalName.KEYBOARD_DYNAMICS, category: SignalCategory.BIOMETRIC, weight: 0.06, description: 'Typing rhythm and pressure patterns', humanRange: [0.3, 0.8], botRange: [0.0, 0.1] },
];

// ─── Headless Browser Detection Vectors ─────────────────────────────────────

interface HeadlessIndicator {
  name: string;
  check: () => boolean; // true = likely headless
  weight: number;
}

const HEADLESS_CHECKS: HeadlessIndicator[] = [
  { name: 'webdriver', check: () => !!(navigator as unknown as Record<string, unknown>).webdriver, weight: 0.15 },
  { name: 'headless_chrome', check: () => /HeadlessChrome/i.test(navigator.userAgent), weight: 0.15 },
  { name: 'phantom_js', check: () => !!(window as unknown as Record<string, unknown>).__phantomas || /PhantomJS/i.test(navigator.userAgent), weight: 0.15 },
  { name: 'no_plugins', check: () => navigator.plugins.length === 0, weight: 0.05 },
  { name: 'no_languages', check: () => !navigator.languages || navigator.languages.length === 0, weight: 0.05 },
  { name: 'no_webgl', check: () => { try { return !document.createElement('canvas').getContext('webgl'); } catch { return true; } }, weight: 0.08 },
  { name: 'no_touch', check: () => navigator.maxTouchPoints === 0 && !('ontouchstart' in window), weight: 0.02 },
  { name: 'automation_flags', check: () => !!(window as unknown as Record<string, unknown>).__selenium_unwrapped || !!(window as unknown as Record<string, unknown>).__nightmare || !!(window as unknown as Record<string, unknown>).__puppeteer_evaluation_script__, weight: 0.12 },
  { name: 'chrome_runtime', check: () => !!(window as unknown as Record<string, unknown>).chrome && !((window as unknown as Record<string, unknown>).chrome as unknown as Record<string, unknown>)?.runtime, weight: 0.04 },
  { name: 'permissions_api', check: () => { try { return navigator.permissions.query({ name: 'notifications' }).then((r: PermissionStatus) => r.state === 'denied' && Notification.permission === 'default').catch(() => false) as unknown as boolean; } catch { return false; } }, weight: 0.03 },
  { name: 'canvas_fingerprint', check: () => { try { const c = document.createElement('canvas'); c.width = 16; c.height = 16; const ctx = c.getContext('2d'); if (!ctx) return true; ctx.fillText('x', 0, 8); return c.toDataURL().length < 100; } catch { return true; } }, weight: 0.05 },
  { name: 'battery_missing', check: () => !('getBattery' in navigator), weight: 0.02 },
  { name: 'connection_missing', check: () => !('connection' in navigator), weight: 0.02 },
  { name: 'hardware_concurrency', check: () => navigator.hardwareConcurrency === undefined || navigator.hardwareConcurrency <= 1, weight: 0.03 },
  { name: 'device_memory', check: () => !(navigator as unknown as Record<string, unknown>).deviceMemory, weight: 0.02 },
  { name: 'screen_dimensions', check: () => screen.width === 0 || screen.height === 0, weight: 0.08 },
  { name: 'color_depth', check: () => screen.colorDepth < 24, weight: 0.03 },
  { name: 'timezone_offset', check: () => { const d = new Date(); return Math.abs(d.getTimezoneOffset() - new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTimezoneOffset()) > 720; }, weight: 0.02 },
  { name: 'worker_support', check: () => typeof Worker === 'undefined', weight: 0.03 },
  { name: 'speech_synthesis', check: () => !('speechSynthesis' in window), weight: 0.02 },
];

// ─── Behavioral Analyzer Class ──────────────────────────────────────────────

export class BehavioralAnalyzerV4 {
  private events: Map<string, unknown[]> = new Map();
  private signalReadings: SignalReading[] = [];
  private startTime: number = Date.now();
  private eventCount: number = 0;
  private deviceFingerprint: string = '';
  private headlessScore: number = 0;

  constructor() {
    this.computeDeviceFingerprint();
    this.detectHeadless();
  }

  // ─── Event Collection ──────────────────────────────────────────────────

  recordEvent(type: string, data: unknown): void {
    if (!this.events.has(type)) {
      this.events.set(type, []);
    }
    this.events.get(type)!.push({ ...data as object, _t: Date.now() });
    this.eventCount++;
  }

  // ─── Signal Computation ────────────────────────────────────────────────

  computeAllSignals(): SignalReading[] {
    const readings: SignalReading[] = [];

    for (const config of SIGNAL_CONFIGS) {
      const reading = this.computeSignal(config);
      readings.push(reading);
    }

    this.signalReadings = readings;
    return readings;
  }

  private computeSignal(config: SignalConfig): SignalReading {
    let value = 0.5; // default neutral
    let rawValue = 0;

    switch (config.name) {
      // ── Motor signals ──
      case SignalName.MOUSE_PATH_LINEARITY: {
        const moves = this.events.get('mousemove') || [];
        if (moves.length < 3) { value = 0.5; break; }
        const points = moves.map((e: unknown) => {
          const ev = e as Record<string, unknown>;
          return { x: ev.clientX as number, y: ev.clientY as number };
        });
        value = computeLinearity(points);
        rawValue = value;
        break;
      }
      case SignalName.MOUSE_SPEED_VARIANCE: {
        const moves = this.events.get('mousemove') || [];
        if (moves.length < 3) { value = 0.5; break; }
        const speeds: number[] = [];
        for (let i = 1; i < moves.length; i++) {
          const prev = moves[i - 1] as Record<string, unknown>;
          const curr = moves[i] as Record<string, unknown>;
          const dx = (curr.clientX as number) - (prev.clientX as number);
          const dy = (curr.clientY as number) - (prev.clientY as number);
          const dt = ((curr._t as number) - (prev._t as number)) || 1;
          speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
        }
        const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const variance = speeds.reduce((a, b) => a + (b - mean) ** 2, 0) / speeds.length;
        value = Math.min(1, variance / 500);
        rawValue = variance;
        break;
      }
      case SignalName.MOUSE_ACCELERATION_PATTERN: {
        const moves = this.events.get('mousemove') || [];
        if (moves.length < 4) { value = 0.5; break; }
        const accels: number[] = [];
        for (let i = 2; i < moves.length; i++) {
          const p0 = moves[i - 2] as Record<string, unknown>;
          const p1 = moves[i - 1] as Record<string, unknown>;
          const p2 = moves[i] as Record<string, unknown>;
          const v1 = Math.sqrt(((p1.clientX as number) - (p0.clientX as number)) ** 2 + ((p1.clientY as number) - (p0.clientY as number)) ** 2);
          const v2 = Math.sqrt(((p2.clientX as number) - (p1.clientX as number)) ** 2 + ((p2.clientY as number) - (p1.clientY as number)) ** 2);
          accels.push(Math.abs(v2 - v1));
        }
        const accelVariance = accels.reduce((a, b) => a + (b - accels.reduce((x, y) => x + y, 0) / accels.length) ** 2, 0) / accels.length;
        value = Math.min(1, accelVariance / 200);
        rawValue = accelVariance;
        break;
      }
      case SignalName.POINTER_PRECISION: {
        const clicks = this.events.get('click') || [];
        if (clicks.length === 0) { value = 0.5; break; }
        const precisions = clicks.map((e: unknown) => {
          const ev = e as Record<string, unknown>;
          return (ev.offsetX !== undefined && ev.targetWidth !== undefined) ? 1 - Math.abs((ev.offsetX as number) - (ev.targetWidth as number) / 2) / ((ev.targetWidth as number) / 2) : 0.5;
        });
        value = precisions.reduce((a, b) => a + b, 0) / precisions.length;
        rawValue = value;
        break;
      }
      case SignalName.POINTER_PRESSURE: {
        const pointers = this.events.get('pointerdown') || [];
        if (pointers.length === 0) { value = 0.5; break; }
        const pressures = pointers.map((e: unknown) => (e as Record<string, unknown>).pressure as number || 0.5);
        const pVariance = pressures.reduce((a, b) => a + (b - pressures.reduce((x, y) => x + y, 0) / pressures.length) ** 2, 0) / pressures.length;
        value = Math.min(1, pVariance * 10);
        rawValue = pVariance;
        break;
      }
      case SignalName.CLICK_PRECISION: {
        const clicks = this.events.get('click') || [];
        if (clicks.length === 0) { value = 0.5; break; }
        const centerOffsets = clicks.map((e: unknown) => {
          const ev = e as Record<string, unknown>;
          if (ev.targetCenterX && ev.clientX) {
            return Math.abs((ev.clientX as number) - (ev.targetCenterX as number));
          }
          return 20; // moderate offset if unknown
        });
        const avgOffset = centerOffsets.reduce((a, b) => a + b, 0) / centerOffsets.length;
        value = 1 - Math.min(1, avgOffset / 50);
        rawValue = avgOffset;
        break;
      }
      case SignalName.SCROLL_BEHAVIOR: {
        const scrolls = this.events.get('scroll') || [];
        if (scrolls.length < 2) { value = 0.5; break; }
        const deltas = scrolls.map((e: unknown) => (e as Record<string, unknown>).deltaY as number || 0);
        const sVariance = deltas.reduce((a, b) => a + (b - deltas.reduce((x, y) => x + y, 0) / deltas.length) ** 2, 0) / deltas.length;
        value = Math.min(1, sVariance / 10000);
        rawValue = sVariance;
        break;
      }
      case SignalName.GESTURE_SMOOTHNESS: {
        const gestures = this.events.get('gesture') || [];
        if (gestures.length < 3) { value = 0.5; break; }
        const pts = gestures.map((e: unknown) => {
          const ev = e as Record<string, unknown>;
          return { x: ev.clientX as number || 0, y: ev.clientY as number || 0 };
        });
        value = computeSmoothness(pts);
        rawValue = value;
        break;
      }

      // ── Temporal signals ──
      case SignalName.TIMING_CONSISTENCY: {
        const clicks = this.events.get('click') || [];
        if (clicks.length < 2) { value = 0.5; break; }
        const intervals: number[] = [];
        for (let i = 1; i < clicks.length; i++) {
          intervals.push(((clicks[i] as Record<string, unknown>)._t as number) - ((clicks[i - 1] as Record<string, unknown>)._t as number));
        }
        const coeffOfVariation = stdDev(intervals) / (mean(intervals) || 1);
        value = 1 - Math.min(1, coeffOfVariation / 2);
        rawValue = coeffOfVariation;
        break;
      }
      case SignalName.REACTION_TIME: {
        const stimuli = this.events.get('stimulus_shown') || [];
        const firstActions = this.events.get('first_action') || [];
        if (stimuli.length === 0 || firstActions.length === 0) { value = 0.5; break; }
        const reactionTimes = firstActions.map((e: unknown, i: number) => {
          if (i >= stimuli.length) return 300;
          return ((e as Record<string, unknown>)._t as number) - ((stimuli[i] as Record<string, unknown>)._t as number);
        });
        const avgRT = mean(reactionTimes);
        // Humans: 200-500ms, Bots: <50ms or very consistent
        value = avgRT < 50 ? 0.05 : avgRT < 150 ? 0.3 : avgRT < 400 ? 0.7 : 0.5;
        rawValue = avgRT;
        break;
      }
      case SignalName.HESITATION_PATTERN: {
        const moves = this.events.get('mousemove') || [];
        if (moves.length < 5) { value = 0.5; break; }
        // Detect micro-pauses (speed drops below threshold)
        const speeds: number[] = [];
        for (let i = 1; i < moves.length; i++) {
          const prev = moves[i - 1] as Record<string, unknown>;
          const curr = moves[i] as Record<string, unknown>;
          const dx = (curr.clientX as number) - (prev.clientX as number);
          const dy = (curr.clientY as number) - (prev.clientY as number);
          const dt = ((curr._t as number) - (prev._t as number)) || 1;
          speeds.push(Math.sqrt(dx * dx + dy * dy) / dt);
        }
        const hesitations = speeds.filter(s => s < 0.05).length;
        value = Math.min(1, hesitations / (speeds.length * 0.1));
        rawValue = hesitations;
        break;
      }
      case SignalName.INTER_EVENT_INTERVAL: {
        const allEvents = this.getAllEventsSorted();
        if (allEvents.length < 3) { value = 0.5; break; }
        const intervals: number[] = [];
        for (let i = 1; i < allEvents.length; i++) {
          intervals.push(allEvents[i].t - allEvents[i - 1].t);
        }
        const cv = stdDev(intervals) / (mean(intervals) || 1);
        value = 1 - Math.min(1, cv / 2);
        rawValue = cv;
        break;
      }
      case SignalName.TASK_COMPLETION_RHYTHM: {
        const completions = this.events.get('task_step') || [];
        if (completions.length < 2) { value = 0.5; break; }
        const steps: number[] = completions.map((e: unknown) => (e as Record<string, unknown>)._t as number);
        const diffs: number[] = [];
        for (let i = 1; i < steps.length; i++) diffs.push(steps[i] - steps[i - 1]);
        const cv = stdDev(diffs) / (mean(diffs) || 1);
        value = 1 - Math.min(1, cv / 1.5);
        rawValue = cv;
        break;
      }
      case SignalName.TEMPORAL_ANOMALY: {
        const allEvents = this.getAllEventsSorted();
        if (allEvents.length < 5) { value = 0.5; break; }
        // Check for statistically unlikely timing patterns
        const intervals: number[] = [];
        for (let i = 1; i < allEvents.length; i++) {
          intervals.push(allEvents[i].t - allEvents[i - 1].t);
        }
        const m = mean(intervals);
        const sd = stdDev(intervals);
        const zScores = intervals.map(i => Math.abs(i - m) / (sd || 1));
        const maxZ = Math.max(...zScores);
        value = maxZ > 3 ? 0.2 : maxZ > 2 ? 0.5 : 0.8;
        rawValue = maxZ;
        break;
      }

      // ── Device signals ──
      case SignalName.DEVICE_FINGERPRINT: {
        value = this.deviceFingerprint ? 0.8 : 0.2;
        rawValue = this.deviceFingerprint.length;
        break;
      }
      case SignalName.SCREEN_RESOLUTION: {
        const hasRes = screen.width > 0 && screen.height > 0;
        const hasColorDepth = screen.colorDepth >= 24;
        const hasPixelRatio = window.devicePixelRatio > 0;
        value = (hasRes && hasColorDepth && hasPixelRatio) ? 0.9 : 0.2;
        rawValue = screen.width * screen.height;
        break;
      }
      case SignalName.TIMEZONE_CONSISTENCY: {
        const dateOffset = new Date().getTimezoneOffset();
        const intlOffset = Intl.DateTimeFormat().resolvedOptions().timeZone;
        value = (dateOffset !== undefined && intlOffset) ? 0.9 : 0.2;
        rawValue = dateOffset;
        break;
      }
      case SignalName.BATTERY_API: {
        value = 'getBattery' in navigator ? 0.7 : 0.3;
        rawValue = 'getBattery' in navigator ? 1 : 0;
        break;
      }
      case SignalName.SENSOR_FUSION: {
        const hasAccelerometer = 'Accelerometer' in window;
        const hasGyroscope = 'Gyroscope' in window;
        const hasDeviceMotion = 'DeviceMotionEvent' in window;
        value = (hasAccelerometer || hasGyroscope || hasDeviceMotion) ? 0.8 : 0.3;
        rawValue = [hasAccelerometer, hasGyroscope, hasDeviceMotion].filter(Boolean).length;
        break;
      }
      case SignalName.WEBRTC_FINGERPRINT: {
        value = 'RTCPeerConnection' in window ? 0.7 : 0.2;
        rawValue = 'RTCPeerConnection' in window ? 1 : 0;
        break;
      }

      // ── Cognitive signals ──
      case SignalName.DECISION_LATENCY: {
        const decisions = this.events.get('decision') || [];
        if (decisions.length === 0) { value = 0.5; break; }
        const latencies = decisions.map((e: unknown) => (e as Record<string, unknown>).latency as number || 300);
        const avgLatency = mean(latencies);
        value = avgLatency < 80 ? 0.1 : avgLatency < 200 ? 0.5 : 0.8;
        rawValue = avgLatency;
        break;
      }
      case SignalName.ERROR_CORRECTION: {
        const corrections = this.events.get('correction') || [];
        const totalActions = this.eventCount || 1;
        const correctionRate = corrections.length / totalActions;
        value = correctionRate > 0.02 ? 0.8 : 0.2;
        rawValue = correctionRate;
        break;
      }
      case SignalName.PATTERN_RECOGNITION: {
        // Based on how quickly and consistently the user identifies patterns
        const patternTimes = this.events.get('pattern_identified') || [];
        if (patternTimes.length === 0) { value = 0.5; break; }
        const times = patternTimes.map((e: unknown) => (e as Record<string, unknown>).time as number || 1000);
        const consistency = 1 - Math.min(1, stdDev(times) / (mean(times) || 1));
        value = consistency > 0.7 ? 0.3 : 0.7; // Very consistent = possibly AI
        rawValue = consistency;
        break;
      }
      case SignalName.ENTROPY_SCORE: {
        const allEvents = this.getAllEventsSorted();
        if (allEvents.length < 5) { value = 0.5; break; }
        // Shannon entropy of event types
        const typeCounts: Record<string, number> = {};
        allEvents.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
        const total = allEvents.length;
        let entropy = 0;
        Object.values(typeCounts).forEach(count => {
          const p = count / total;
          if (p > 0) entropy -= p * Math.log2(p);
        });
        value = Math.min(1, entropy / 3); // Max entropy for 8 event types
        rawValue = entropy;
        break;
      }

      // ── Environment signals ──
      case SignalName.TAB_VISIBILITY: {
        const visibilityChanges = this.events.get('visibilitychange') || [];
        value = visibilityChanges.length > 0 ? 0.8 : 0.4;
        rawValue = visibilityChanges.length;
        break;
      }
      case SignalName.ENVIRONMENT_CONSISTENCY: {
        // Check if browser APIs are consistent
        const consistent = !!(
          window.localStorage &&
          window.sessionStorage &&
          window.indexedDB &&
          'fetch' in window
        );
        value = consistent ? 0.8 : 0.2;
        rawValue = consistent ? 1 : 0;
        break;
      }

      // ── Network signals ──
      case SignalName.CONNECTION_FINGERPRINT: {
        const conn = (navigator as unknown as Record<string, unknown>).connection as Record<string, unknown> | undefined;
        value = conn ? 0.7 : 0.3;
        rawValue = conn ? 1 : 0;
        break;
      }

      // ── Biometric signals ──
      case SignalName.KEYBOARD_DYNAMICS: {
        const keydowns = this.events.get('keydown') || [];
        if (keydowns.length < 3) { value = 0.5; break; }
        const keyIntervals: number[] = [];
        for (let i = 1; i < keydowns.length; i++) {
          keyIntervals.push(((keydowns[i] as Record<string, unknown>)._t as number) - ((keydowns[i - 1] as Record<string, unknown>)._t as number));
        }
        const cv = stdDev(keyIntervals) / (mean(keyIntervals) || 1);
        value = cv > 0.2 ? 0.7 : 0.2; // Variance in typing = human
        rawValue = cv;
        break;
      }
    }

    // Compute anomaly score based on distance from human range
    const anomalyScore = computeAnomaly(value, config.humanRange, config.botRange);

    return {
      name: config.name,
      category: config.category,
      value: Math.max(0, Math.min(1, value)),
      rawValue,
      weight: config.weight,
      timestamp: Date.now(),
      confidence: Math.min(1, this.eventCount / 50),
      anomalyScore,
    };
  }

  // ─── Risk Scoring (Bayesian) ───────────────────────────────────────────

  computeRiskAssessment(): RiskAssessment {
    const signals = this.computeAllSignals();
    
    // Bayesian risk scoring
    const priorBot = 0.15; // Prior probability of being a bot
    const priorHuman = 1 - priorBot;

    // Likelihood: P(signals | bot) vs P(signals | human)
    let logLikelihoodBot = 0;
    let logLikelihoodHuman = 0;

    for (const signal of signals) {
      const config = SIGNAL_CONFIGS.find(c => c.name === signal.name);
      if (!config) continue;

      // Use anomaly score to weight the signal
      const botLikelihood = signal.anomalyScore;
      const humanLikelihood = 1 - signal.anomalyScore;

      // Add weighted log-likelihood
      logLikelihoodBot += Math.log(Math.max(0.001, botLikelihood)) * config.weight;
      logLikelihoodHuman += Math.log(Math.max(0.001, humanLikelihood)) * config.weight;
    }

    // Posterior probability using Bayes' theorem
    const logPosteriorBot = Math.log(priorBot) + logLikelihoodBot;
    const logPosteriorHuman = Math.log(priorHuman) + logLikelihoodHuman;

    // Normalize
    const maxLog = Math.max(logPosteriorBot, logPosteriorHuman);
    const posteriorBot = Math.exp(logPosteriorBot - maxLog);
    const posteriorHuman = Math.exp(logPosteriorHuman - maxLog);

    const riskScore = posteriorBot / (posteriorBot + posteriorHuman);

    // Add headless detection bonus
    const adjustedRisk = Math.min(1, riskScore + this.headlessScore * 0.3);

    // Determine risk level
    const level = this.getRiskLevel(adjustedRisk);

    // Identify dominant signals (highest anomaly)
    const dominantSignals = signals
      .filter(s => s.anomalyScore > 0.5)
      .sort((a, b) => b.anomalyScore - a.anomalyScore)
      .slice(0, 5)
      .map(s => s.name);

    // Determine recommendation and challenge types
    const { recommendation, challengeTypes } = this.getRecommendation(adjustedRisk, level);

    return {
      score: adjustedRisk,
      level,
      dominantSignals,
      recommendation,
      challengeTypes,
      confidence: Math.min(1, this.eventCount / 30),
    };
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 0.8) return RiskLevel.CRITICAL;
    if (score >= 0.5) return RiskLevel.HIGH;
    if (score >= 0.25) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private getRecommendation(
    score: number,
    level: RiskLevel
  ): { recommendation: 'allow' | 'challenge' | 'block'; challengeTypes: ChallengeType[] } {
    if (level === RiskLevel.CRITICAL || score > 0.85) {
      return { recommendation: 'block', challengeTypes: [] };
    }

    // Select challenge types based on risk and dominant signals
    const challengeTypes: ChallengeType[] = [];

    if (level === RiskLevel.LOW) {
      // Easy challenge for low risk
      challengeTypes.push(
        randomChoice([ChallengeType.ADVERSARIAL_PUZZLE, ChallengeType.HUMAN_INTUITION_GRID, ChallengeType.ZERO_KNOWLEDGE_PROOF])
      );
    } else if (level === RiskLevel.MEDIUM) {
      // Medium challenges
      challengeTypes.push(
        randomChoice([ChallengeType.TEMPORAL_MEMORY, ChallengeType.GESTURE_SIGNATURE, ChallengeType.OPTICAL_ILLUSION_MAZE])
      );
    } else {
      // Hard challenges for high risk
      challengeTypes.push(
        randomChoice([ChallengeType.PHYSICS_CHAOS, ChallengeType.CONTEXTUAL_REASONING, ChallengeType.LIVE_3D_BIOMETRIC])
      );
      // Add a second challenge for very high risk
      if (score > 0.65) {
        challengeTypes.push(
          randomChoice([ChallengeType.VOICE_RHYTHM, ChallengeType.TEMPORAL_MEMORY, ChallengeType.GESTURE_SIGNATURE])
        );
      }
    }

    return {
      recommendation: level === RiskLevel.LOW ? 'allow' : 'challenge',
      challengeTypes,
    };
  }

  // ─── Device Fingerprinting ─────────────────────────────────────────────

  private computeDeviceFingerprint(): void {
    try {
      const components = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.language,
        navigator.hardwareConcurrency,
        (navigator as unknown as Record<string, unknown>).deviceMemory,
        navigator.maxTouchPoints,
        navigator.plugins.length,
        window.devicePixelRatio,
      ];
      this.deviceFingerprint = simpleHash(components.join('|'));
    } catch {
      this.deviceFingerprint = 'unknown';
    }
  }

  // ─── Headless Detection ────────────────────────────────────────────────

  private detectHeadless(): void {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const check of HEADLESS_CHECKS) {
      try {
        const result = check.check();
        if (result) {
          weightedScore += check.weight;
        }
        totalWeight += check.weight;
      } catch {
        // Skip checks that throw
      }
    }

    this.headlessScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private getAllEventsSorted(): { type: string; t: number }[] {
    const all: { type: string; t: number }[] = [];
    this.events.forEach((evts, type) => {
      evts.forEach((e: unknown) => {
        all.push({ type, t: (e as Record<string, unknown>)._t as number });
      });
    });
    return all.sort((a, b) => a.t - b.t);
  }

  getBehavioralData(): BehavioralData {
    const signals = this.signalReadings.length > 0 ? this.signalReadings : this.computeAllSignals();
    const assessment = this.computeRiskAssessment();

    return {
      signals,
      compositeRiskScore: assessment.score,
      riskLevel: assessment.level,
      timestamp: Date.now(),
      duration: Date.now() - this.startTime,
      eventCount: this.eventCount,
      deviceFingerprint: this.deviceFingerprint,
    };
  }

  getHeadlessScore(): number {
    return this.headlessScore;
  }

  getDeviceFingerprint(): string {
    return this.deviceFingerprint;
  }

  getSignalCount(): number {
    return SIGNAL_CONFIGS.length;
  }

  static getSignalConfigs(): SignalConfig[] {
    return [...SIGNAL_CONFIGS];
  }

  static getHeadlessChecks(): string[] {
    return HEADLESS_CHECKS.map(c => c.name);
  }

  reset(): void {
    this.events.clear();
    this.signalReadings = [];
    this.startTime = Date.now();
    this.eventCount = 0;
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function computeLinearity(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0.5;
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  
  let ssxx = 0, ssyy = 0, ssxy = 0;
  for (const p of points) {
    ssxx += (p.x - meanX) ** 2;
    ssyy += (p.y - meanY) ** 2;
    ssxy += (p.x - meanX) * (p.y - meanY);
  }
  
  const denom = Math.sqrt(ssxx * ssyy);
  if (denom === 0) return 1;
  return Math.abs(ssxy / denom);
}

function computeSmoothness(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0.5;
  const angles: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const v1x = points[i].x - points[i - 1].x;
    const v1y = points[i].y - points[i - 1].y;
    const v2x = points[i + 1].x - points[i].x;
    const v2y = points[i + 1].y - points[i].y;
    const dot = v1x * v2x + v1y * v2y;
    const cross = v1x * v2y - v1y * v2x;
    angles.push(Math.abs(Math.atan2(cross, dot)));
  }
  const avgAngle = mean(angles);
  return 1 - Math.min(1, avgAngle / Math.PI);
}

function computeAnomaly(value: number, humanRange: [number, number], botRange: [number, number]): number {
  const humanCenter = (humanRange[0] + humanRange[1]) / 2;
  const botCenter = (botRange[0] + botRange[1]) / 2;
  const distToHuman = Math.abs(value - humanCenter);
  const distToBot = Math.abs(value - botCenter);
  const totalDist = distToHuman + distToBot;
  return totalDist === 0 ? 0.5 : distToHuman / totalDist;
}

function mean(arr: number[]): number {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36).padStart(8, '0');
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Singleton Instance ──────────────────────────────────────────────────────

let analyzerInstance: BehavioralAnalyzerV4 | null = null;

export function getBehavioralAnalyzer(): BehavioralAnalyzerV4 {
  if (!analyzerInstance) {
    analyzerInstance = new BehavioralAnalyzerV4();
  }
  return analyzerInstance;
}

export function resetAnalyzer(): void {
  if (analyzerInstance) {
    analyzerInstance.reset();
  }
  analyzerInstance = null;
}
