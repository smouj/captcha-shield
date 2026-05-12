'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Shield, AlertTriangle, Bot,
  Activity, Clock, CheckCircle2, XCircle, Download, Trash2,
  RefreshCw, Eye, Zap, Lock, Fingerprint
} from 'lucide-react';
import {
  AnalyticsEvent, AnalyticsSummary, ChallengeType, RiskLevel,
  SignalName, SignalCategory, VerificationLayer
} from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'captcha-shield-v4-analytics';

const CHALLENGE_COLORS: Record<ChallengeType, string> = {
  [ChallengeType.ADVERSARIAL_PUZZLE]: '#10b981',
  [ChallengeType.HUMAN_INTUITION_GRID]: '#14b8a6',
  [ChallengeType.PHYSICS_CHAOS]: '#f59e0b',
  [ChallengeType.TEMPORAL_MEMORY]: '#ef4444',
  [ChallengeType.OPTICAL_ILLUSION_MAZE]: '#8b5cf6',
  [ChallengeType.VOICE_RHYTHM]: '#ec4899',
  [ChallengeType.GESTURE_SIGNATURE]: '#06b6d4',
  [ChallengeType.CONTEXTUAL_REASONING]: '#84cc16',
  [ChallengeType.LIVE_3D_BIOMETRIC]: '#f97316',
  [ChallengeType.ZERO_KNOWLEDGE_PROOF]: '#6366f1',
};

const CHALLENGE_LABELS: Record<ChallengeType, string> = {
  [ChallengeType.ADVERSARIAL_PUZZLE]: 'Adversarial Puzzle',
  [ChallengeType.HUMAN_INTUITION_GRID]: 'Human Intuition Grid',
  [ChallengeType.PHYSICS_CHAOS]: 'Physics Chaos',
  [ChallengeType.TEMPORAL_MEMORY]: 'Temporal Memory',
  [ChallengeType.OPTICAL_ILLUSION_MAZE]: 'Optical Illusion Maze',
  [ChallengeType.VOICE_RHYTHM]: 'Voice Rhythm',
  [ChallengeType.GESTURE_SIGNATURE]: 'Gesture Signature',
  [ChallengeType.CONTEXTUAL_REASONING]: 'Contextual Reasoning',
  [ChallengeType.LIVE_3D_BIOMETRIC]: 'Live 3D Biometric',
  [ChallengeType.ZERO_KNOWLEDGE_PROOF]: 'Zero Knowledge Proof',
};

const RISK_CONFIG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  [RiskLevel.LOW]: { color: '#10b981', bg: 'bg-emerald-500/20', label: 'Low' },
  [RiskLevel.MEDIUM]: { color: '#f59e0b', bg: 'bg-amber-500/20', label: 'Medium' },
  [RiskLevel.HIGH]: { color: '#f97316', bg: 'bg-orange-500/20', label: 'High' },
  [RiskLevel.CRITICAL]: { color: '#ef4444', bg: 'bg-red-500/20', label: 'Critical' },
};

const LAYER_LABELS: Record<VerificationLayer, { label: string; icon: React.ReactNode }> = {
  [VerificationLayer.BEHAVIORAL_PRECHECK]: { label: 'Behavioral Pre-check', icon: <Eye className="w-4 h-4" /> },
  [VerificationLayer.DYNAMIC_CHALLENGE]: { label: 'Dynamic Challenge', icon: <Zap className="w-4 h-4" /> },
  [VerificationLayer.QR_MOBILE]: { label: 'QR Mobile', icon: <Fingerprint className="w-4 h-4" /> },
  [VerificationLayer.WEBAUTHN_PASSKEY]: { label: 'WebAuthn Passkey', icon: <Lock className="w-4 h-4" /> },
  [VerificationLayer.CRYPTOGRAPHIC_TOKEN]: { label: 'Crypto Token', icon: <Shield className="w-4 h-4" /> },
};

const SIGNAL_GROUPS: { category: SignalCategory; label: string; color: string; signals: SignalName[] }[] = [
  {
    category: SignalCategory.MOTOR, label: 'Motor', color: '#10b981',
    signals: [
      SignalName.MOUSE_PATH_LINEARITY, SignalName.MOUSE_SPEED_VARIANCE,
      SignalName.MOUSE_ACCELERATION_PATTERN, SignalName.POINTER_PRECISION,
      SignalName.POINTER_PRESSURE, SignalName.CLICK_PRECISION,
      SignalName.SCROLL_BEHAVIOR, SignalName.GESTURE_SMOOTHNESS,
    ],
  },
  {
    category: SignalCategory.TEMPORAL, label: 'Temporal', color: '#14b8a6',
    signals: [
      SignalName.TIMING_CONSISTENCY, SignalName.REACTION_TIME,
      SignalName.HESITATION_PATTERN, SignalName.INTER_EVENT_INTERVAL,
      SignalName.TASK_COMPLETION_RHYTHM, SignalName.TEMPORAL_ANOMALY,
    ],
  },
  {
    category: SignalCategory.DEVICE, label: 'Device', color: '#f59e0b',
    signals: [
      SignalName.DEVICE_FINGERPRINT, SignalName.SCREEN_RESOLUTION,
      SignalName.TIMEZONE_CONSISTENCY, SignalName.BATTERY_API,
      SignalName.SENSOR_FUSION, SignalName.WEBRTC_FINGERPRINT,
    ],
  },
  {
    category: SignalCategory.COGNITIVE, label: 'Cognitive', color: '#ec4899',
    signals: [
      SignalName.DECISION_LATENCY, SignalName.ERROR_CORRECTION,
      SignalName.PATTERN_RECOGNITION, SignalName.ENTROPY_SCORE,
    ],
  },
  {
    category: SignalCategory.ENVIRONMENT, label: 'Environment', color: '#06b6d4',
    signals: [SignalName.TAB_VISIBILITY, SignalName.ENVIRONMENT_CONSISTENCY],
  },
  {
    category: SignalCategory.NETWORK, label: 'Network', color: '#f97316',
    signals: [SignalName.CONNECTION_FINGERPRINT],
  },
  {
    category: SignalCategory.BIOMETRIC, label: 'Biometric', color: '#8b5cf6',
    signals: [SignalName.KEYBOARD_DYNAMICS],
  },
];

const SIGNAL_DISPLAY_NAMES: Record<SignalName, string> = {
  [SignalName.MOUSE_PATH_LINEARITY]: 'Mouse Path Linearity',
  [SignalName.MOUSE_SPEED_VARIANCE]: 'Mouse Speed Variance',
  [SignalName.MOUSE_ACCELERATION_PATTERN]: 'Mouse Acceleration',
  [SignalName.POINTER_PRECISION]: 'Pointer Precision',
  [SignalName.POINTER_PRESSURE]: 'Pointer Pressure',
  [SignalName.CLICK_PRECISION]: 'Click Precision',
  [SignalName.SCROLL_BEHAVIOR]: 'Scroll Behavior',
  [SignalName.GESTURE_SMOOTHNESS]: 'Gesture Smoothness',
  [SignalName.TIMING_CONSISTENCY]: 'Timing Consistency',
  [SignalName.REACTION_TIME]: 'Reaction Time',
  [SignalName.HESITATION_PATTERN]: 'Hesitation Pattern',
  [SignalName.INTER_EVENT_INTERVAL]: 'Inter-event Interval',
  [SignalName.TASK_COMPLETION_RHYTHM]: 'Task Rhythm',
  [SignalName.TEMPORAL_ANOMALY]: 'Temporal Anomaly',
  [SignalName.DEVICE_FINGERPRINT]: 'Device Fingerprint',
  [SignalName.SCREEN_RESOLUTION]: 'Screen Resolution',
  [SignalName.TIMEZONE_CONSISTENCY]: 'Timezone Consistency',
  [SignalName.BATTERY_API]: 'Battery API',
  [SignalName.SENSOR_FUSION]: 'Sensor Fusion',
  [SignalName.WEBRTC_FINGERPRINT]: 'WebRTC Fingerprint',
  [SignalName.DECISION_LATENCY]: 'Decision Latency',
  [SignalName.ERROR_CORRECTION]: 'Error Correction',
  [SignalName.PATTERN_RECOGNITION]: 'Pattern Recognition',
  [SignalName.ENTROPY_SCORE]: 'Entropy Score',
  [SignalName.TAB_VISIBILITY]: 'Tab Visibility',
  [SignalName.ENVIRONMENT_CONSISTENCY]: 'Env Consistency',
  [SignalName.CONNECTION_FINGERPRINT]: 'Connection FP',
  [SignalName.KEYBOARD_DYNAMICS]: 'Keyboard Dynamics',
};

// ─── Animation variants ──────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function computeSummary(events: AnalyticsEvent[]): AnalyticsSummary {
  const attempts = events.filter(e => e.type === 'attempt' || e.type === 'success' || e.type === 'failure' || e.type === 'block');
  const successes = events.filter(e => e.type === 'success');
  const blocks = events.filter(e => e.type === 'block');

  const totalAttempts = attempts.length;
  const successRate = totalAttempts > 0 ? successes.length / totalAttempts : 0;

  const riskScores = attempts.filter(e => e.riskScore != null).map(e => e.riskScore as number);
  const avgRiskScore = riskScores.length > 0 ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length : 0;

  const durations = attempts.filter(e => e.duration != null).map(e => e.duration as number);
  const avgCompletionTime = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  const challengeTypeDistribution = {} as Record<ChallengeType, number>;
  for (const ct of Object.values(ChallengeType)) challengeTypeDistribution[ct] = 0;
  for (const e of attempts) {
    if (e.challengeType) challengeTypeDistribution[e.challengeType]++;
  }

  const riskLevelDistribution = {} as Record<RiskLevel, number>;
  for (const rl of Object.values(RiskLevel)) riskLevelDistribution[rl] = 0;
  for (const e of attempts) {
    if (e.riskLevel) riskLevelDistribution[e.riskLevel]++;
  }

  const blockRate = totalAttempts > 0 ? blocks.length / totalAttempts : 0;

  // Compute signal averages from metadata
  const signalSums: Record<string, { sum: number; count: number }> = {};
  for (const e of events) {
    if (e.metadata && typeof e.metadata === 'object') {
      const meta = e.metadata as Record<string, unknown>;
      if (meta.signals && typeof meta.signals === 'object') {
        const sigs = meta.signals as Record<string, unknown>;
        for (const [key, val] of Object.entries(sigs)) {
          if (typeof val === 'number') {
            if (!signalSums[key]) signalSums[key] = { sum: 0, count: 0 };
            signalSums[key].sum += val;
            signalSums[key].count++;
          }
        }
      }
    }
  }
  const topSignals = Object.entries(signalSums)
    .map(([name, { sum, count }]) => ({ name: name as SignalName, avgAnomaly: sum / count }))
    .sort((a, b) => b.avgAnomaly - a.avgAnomaly);

  const recentEvents = [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

  const hourlyMap = new Map<number, { attempts: number; successes: number }>();
  for (const e of attempts) {
    const hour = new Date(e.timestamp).getHours();
    const entry = hourlyMap.get(hour) ?? { attempts: 0, successes: 0 };
    entry.attempts++;
    if (e.type === 'success') entry.successes++;
    hourlyMap.set(hour, entry);
  }
  const hourlyActivity = Array.from(hourlyMap.entries())
    .map(([hour, { attempts, successes }]) => ({ hour, attempts, successRate: attempts > 0 ? successes / attempts : 0 }))
    .sort((a, b) => a.hour - b.hour);

  return {
    totalAttempts, successRate, avgRiskScore, avgCompletionTime,
    challengeTypeDistribution, riskLevelDistribution, blockRate,
    topSignals, hourlyActivity, recentEvents,
  };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminDashboardV4() {
  const [events, setEvents] = useState<AnalyticsEvent[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const summary = useMemo(() => computeSummary(events), [events]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setEvents(loadEvents());
      setIsRefreshing(false);
    }, 400);
  }, []);

  const clearAll = useCallback(() => {
    saveEvents([]);
    setEvents([]);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captcha-shield-v4-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [events]);

  // ─── Verification layer counts ────────────────────────────────────────────

  const layerCounts = useMemo(() => {
    const counts: Record<VerificationLayer, number> = {
      [VerificationLayer.BEHAVIORAL_PRECHECK]: 0,
      [VerificationLayer.DYNAMIC_CHALLENGE]: 0,
      [VerificationLayer.QR_MOBILE]: 0,
      [VerificationLayer.WEBAUTHN_PASSKEY]: 0,
      [VerificationLayer.CRYPTOGRAPHIC_TOKEN]: 0,
    };
    for (const e of events) {
      if (e.verificationLayers) {
        for (const layer of e.verificationLayers) {
          counts[layer]++;
        }
      }
    }
    return counts;
  }, [events]);

  const maxLayerCount = Math.max(1, ...Object.values(layerCounts));

  // ─── Signal averages map (from summary.topSignals) ───────────────────────

  const signalAvgMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of summary.topSignals) {
      map.set(s.name, s.avgAnomaly);
    }
    return map;
  }, [summary.topSignals]);

  // ─── Risk score color ────────────────────────────────────────────────────

  const riskColor = (score: number) => {
    if (score < 0.25) return '#10b981';
    if (score < 0.5) return '#f59e0b';
    if (score < 0.75) return '#f97316';
    return '#ef4444';
  };

  // ─── Max for challenge distribution ──────────────────────────────────────

  const maxChallengeCount = Math.max(1, ...Object.values(summary.challengeTypeDistribution));

  // ─── Total for risk distribution ─────────────────────────────────────────

  const totalRisk = Object.values(summary.riskLevelDistribution).reduce((a, b) => a + b, 0) || 1;

  // ─── Has data flag ───────────────────────────────────────────────────────

  const hasData = events.length > 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">CAPTCHA Shield v4.0</h1>
            <p className="text-sm text-gray-400">Fortress Analytics Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{events.length} events stored</span>
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </motion.div>
        </div>
      </div>

      {/* ── 1. Header Stats Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Verifications',
            value: summary.totalAttempts.toLocaleString(),
            icon: <Activity className="w-5 h-5" />,
            accent: 'text-emerald-400',
            bgAccent: 'bg-emerald-500/15',
          },
          {
            label: 'Success Rate',
            value: `${(summary.successRate * 100).toFixed(1)}%`,
            icon: <TrendingUp className="w-5 h-5" />,
            accent: 'text-teal-400',
            bgAccent: 'bg-teal-500/15',
            bar: summary.successRate,
          },
          {
            label: 'Avg Risk Score',
            value: summary.avgRiskScore.toFixed(3),
            icon: <AlertTriangle className="w-5 h-5" />,
            accent: '',
            bgAccent: '',
            riskIndicator: true,
          },
          {
            label: 'Bot Block Rate',
            value: `${(summary.blockRate * 100).toFixed(1)}%`,
            icon: <Bot className="w-5 h-5" />,
            accent: 'text-red-400',
            bgAccent: 'bg-red-500/15',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`p-1.5 rounded-md ${stat.riskIndicator ? '' : stat.bgAccent}`}>
                <span className={stat.riskIndicator ? '' : stat.accent}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
              {stat.riskIndicator && (
                <div
                  className="w-3 h-3 rounded-full mb-2"
                  style={{ backgroundColor: riskColor(summary.avgRiskScore) }}
                />
              )}
            </div>
            {stat.bar != null && (
              <div className="mt-3 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.bar * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── 2. Challenge Type Distribution ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Challenge Type Distribution</h2>
        </div>
        {hasData ? (
          <div className="space-y-2.5">
            {(Object.entries(summary.challengeTypeDistribution) as [ChallengeType, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([type, count], i) => (
                <motion.div
                  key={type}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-3"
                >
                  <span className="text-xs text-gray-400 w-40 md:w-48 shrink-0 truncate">
                    {CHALLENGE_LABELS[type]}
                  </span>
                  <div className="flex-1 h-5 rounded-md bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxChallengeCount) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                      className="h-full rounded-md"
                      style={{ backgroundColor: CHALLENGE_COLORS[type], opacity: 0.75 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-300 w-10 text-right">{count}</span>
                </motion.div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No challenge data yet</p>
        )}
      </motion.div>

      {/* ── Middle row: Risk + Layers ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* ── 3. Risk Level Distribution ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 md:p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Risk Level Distribution</h2>
          </div>
          {hasData ? (
            <div className="space-y-4">
              {/* Stacked bar */}
              <div className="flex h-10 rounded-lg overflow-hidden">
                {([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL] as RiskLevel[]).map(level => {
                  const pct = (summary.riskLevelDistribution[level] / totalRisk) * 100;
                  if (pct === 0) return null;
                  return (
                    <motion.div
                      key={level}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.6 }}
                      className="flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: RISK_CONFIG[level].color, opacity: 0.8 }}
                      title={`${RISK_CONFIG[level].label}: ${pct.toFixed(1)}%`}
                    >
                      {pct > 8 && `${pct.toFixed(0)}%`}
                    </motion.div>
                  );
                })}
              </div>
              {/* Legend items */}
              <div className="grid grid-cols-2 gap-3">
                {([RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL] as RiskLevel[]).map(level => {
                  const count = summary.riskLevelDistribution[level];
                  const pct = (count / totalRisk) * 100;
                  return (
                    <div key={level} className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-3">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: RISK_CONFIG[level].color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-300 font-medium">{RISK_CONFIG[level].label}</div>
                        <div className="text-[11px] text-gray-500">{count} ({pct.toFixed(1)}%)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No risk data yet</p>
          )}
        </motion.div>

        {/* ── 5. Verification Layers Breakdown ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 md:p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-semibold text-white">Verification Layers</h2>
          </div>
          {hasData ? (
            <div className="space-y-3">
              {(Object.entries(layerCounts) as [VerificationLayer, number][]).map(([layer, count], i) => (
                <motion.div
                  key={layer}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-3 rounded-lg bg-white/[0.03] p-3"
                >
                  <div className="text-teal-400 shrink-0">{LAYER_LABELS[layer].icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 font-medium mb-1.5">{LAYER_LABELS[layer].label}</div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxLayerCount) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.5 + i * 0.08 }}
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                      />
                    </div>
                  </div>
                  <span className="text-xs font-mono text-gray-300 w-10 text-right">{count}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No layer data yet</p>
          )}
        </motion.div>
      </div>

      {/* ── 4. Signal Matrix ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Fingerprint className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">28-Signal Behavioral Matrix</h2>
          <span className="text-xs text-gray-500 ml-auto">avg anomaly score</span>
        </div>
        <div className="space-y-5">
          {SIGNAL_GROUPS.map(group => (
            <div key={group.category}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label} ({group.signals.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {group.signals.map(signal => {
                  const avg = signalAvgMap.get(signal) ?? 0;
                  return (
                    <div
                      key={signal}
                      className="flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2"
                    >
                      <span className="text-[11px] text-gray-300 flex-1 min-w-0 truncate" title={SIGNAL_DISPLAY_NAMES[signal]}>
                        {SIGNAL_DISPLAY_NAMES[signal]}
                      </span>
                      <div className="w-14 h-1.5 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${avg * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: group.color, opacity: 0.7 + avg * 0.3 }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 w-7 text-right shrink-0">
                        {avg.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 6. Recent Activity Log ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-semibold text-white">Recent Activity</h2>
          <span className="text-xs text-gray-500 ml-auto">{summary.recentEvents.length} entries</span>
        </div>
        {hasData && summary.recentEvents.length > 0 ? (
          <div
            className="max-h-96 overflow-y-auto space-y-1 pr-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
          >
            <style>{`
              .custom-scroll::-webkit-scrollbar { width: 5px; }
              .custom-scroll::-webkit-scrollbar-track { background: transparent; }
              .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
              .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
            <div className="custom-scroll max-h-96 overflow-y-auto space-y-1 pr-1">
              {/* Header row */}
              <div className="grid grid-cols-[100px_1fr_70px_60px_70px] md:grid-cols-[130px_1fr_80px_80px_80px] gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-semibold border-b border-white/[0.04]">
                <span>Time</span>
                <span>Challenge</span>
                <span className="text-right">Risk</span>
                <span className="text-center">Result</span>
                <span className="text-right">Duration</span>
              </div>
              {summary.recentEvents.map((event, i) => {
                const isSuccess = event.type === 'success' || event.type === 'token_issued';
                const isFailure = event.type === 'failure';
                const isBlock = event.type === 'block';
                return (
                  <motion.div
                    key={event.id}
                    custom={i}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className={`grid grid-cols-[100px_1fr_70px_60px_70px] md:grid-cols-[130px_1fr_80px_80px_80px] gap-2 px-3 py-2 rounded-md text-xs items-center ${
                      isBlock
                        ? 'bg-red-500/[0.07]'
                        : isFailure
                        ? 'bg-orange-500/[0.05]'
                        : isSuccess
                        ? 'bg-emerald-500/[0.05]'
                        : 'bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-gray-400 font-mono text-[11px]">
                      {formatDate(event.timestamp)} {formatTime(event.timestamp)}
                    </span>
                    <span className="text-gray-300 truncate">
                      {event.challengeType ? CHALLENGE_LABELS[event.challengeType] : '—'}
                    </span>
                    <span className="text-right font-mono text-[11px]" style={{ color: riskColor(event.riskScore ?? 0) }}>
                      {event.riskScore != null ? event.riskScore.toFixed(2) : '—'}
                    </span>
                    <span className="flex items-center justify-center gap-1">
                      {isSuccess ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400 hidden md:inline">Pass</span></>
                      ) : isBlock ? (
                        <><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-red-400 hidden md:inline">Block</span></>
                      ) : isFailure ? (
                        <><XCircle className="w-3.5 h-3.5 text-orange-400" /><span className="text-orange-400 hidden md:inline">Fail</span></>
                      ) : (
                        <><Eye className="w-3.5 h-3.5 text-gray-500" /><span className="text-gray-500 hidden md:inline">View</span></>
                      )}
                    </span>
                    <span className="text-right text-gray-500 font-mono text-[11px]">
                      {event.duration != null ? `${(event.duration / 1000).toFixed(1)}s` : '—'}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <Activity className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No activity recorded yet</p>
            <p className="text-xs text-gray-600 mt-1">Complete CAPTCHA verifications to see activity here</p>
          </div>
        )}
      </motion.div>

      {/* ── 7. Export & Actions Bar ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-4"
      >
        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={exportJSON}
          disabled={events.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/15 text-teal-400 text-sm font-medium hover:bg-teal-500/25 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
        <div className="flex-1" />
        <button
          onClick={clearAll}
          disabled={events.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>
      </motion.div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="text-center text-xs text-gray-600 pb-4">
        CAPTCHA Shield v4.0 &quot;Fortress&quot; &mdash; 10 Challenge Types &bull; 28 Behavioral Signals &bull; 5 Verification Layers
      </div>
    </div>
  );
}

export default AdminDashboardV4;
