'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Fingerprint,
  QrCode,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

// ─── Type imports ─────────────────────────────────────────────────────────────
import {
  WidgetState,
  WidgetConfig,
  DEFAULT_WIDGET_CONFIG,
  VerificationMode,
  VerificationLayer,
  ChallengeType,
  ChallengeInstance,
  ChallengeSolution,
  RiskAssessment,
  CaptchaToken,
  ChallengeProps,
  ChallengeDifficulty,
} from '@/lib/types';

// ─── Behavioral Analyzer ──────────────────────────────────────────────────────
import { BehavioralAnalyzerV4, getBehavioralAnalyzer } from '@/lib/behavioral-analyzer-v4';

// ─── Token Manager ────────────────────────────────────────────────────────────
import { TokenManager, getTokenManager } from '@/lib/token-manager';

// ─── i18n ─────────────────────────────────────────────────────────────────────
import { getTranslations, detectLanguage, LanguageCode } from '@/lib/i18n';

// ─── Challenge Components (all default exports) ──────────────────────────────
import AdversarialPuzzleChallenge from './challenges/AdversarialPuzzleChallenge';
import HumanIntuitionGridChallenge from './challenges/HumanIntuitionGridChallenge';
import PhysicsChaosChallenge from './challenges/PhysicsChaosChallenge';
import TemporalMemoryChallenge from './challenges/TemporalMemoryChallenge';
import OpticalIllusionMazeChallenge from './challenges/OpticalIllusionMazeChallenge';
import VoiceRhythmChallenge from './challenges/VoiceRhythmChallenge';
import GestureSignatureChallenge from './challenges/GestureSignatureChallenge';
import ContextualReasoningChallenge from './challenges/ContextualReasoningChallenge';
import Live3DBiometricChallenge from './challenges/Live3DBiometricChallenge';
import ZeroKnowledgeProofChallenge from './challenges/ZeroKnowledgeProofChallenge';

// ─── QR Verification ─────────────────────────────────────────────────────────
import QRVerification from './QRVerification';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CaptchaWidgetV4Props {
  config?: Partial<WidgetConfig>;
  onVerify?: (token: CaptchaToken) => void;
  onError?: (error: Error) => void;
}

// ─── Challenge Component Map ─────────────────────────────────────────────────

const CHALLENGE_COMPONENTS: Record<ChallengeType, React.ComponentType<ChallengeProps>> = {
  [ChallengeType.ADVERSARIAL_PUZZLE]: AdversarialPuzzleChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.HUMAN_INTUITION_GRID]: HumanIntuitionGridChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.PHYSICS_CHAOS]: PhysicsChaosChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.TEMPORAL_MEMORY]: TemporalMemoryChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.OPTICAL_ILLUSION_MAZE]: OpticalIllusionMazeChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.VOICE_RHYTHM]: VoiceRhythmChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.GESTURE_SIGNATURE]: GestureSignatureChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.CONTEXTUAL_REASONING]: ContextualReasoningChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.LIVE_3D_BIOMETRIC]: Live3DBiometricChallenge as React.ComponentType<ChallengeProps>,
  [ChallengeType.ZERO_KNOWLEDGE_PROOF]: ZeroKnowledgeProofChallenge as React.ComponentType<ChallengeProps>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function pickChallengeTypes(riskAssessment: RiskAssessment): ChallengeType[] {
  const types = riskAssessment.challengeTypes;
  // Ensure no duplicates
  return [...new Set(types)];
}

function createChallengeInstance(type: ChallengeType, difficulty: ChallengeDifficulty): ChallengeInstance {
  const now = Date.now();
  return {
    id: generateId(),
    type,
    difficulty,
    payload: generatePayload(type),
    solution: { type, answer: null },
    expiresAt: now + 120_000, // 2 minutes
    maxAttempts: 3,
    attempts: 0,
    createdAt: now,
  };
}

function generatePayload(type: ChallengeType): Record<string, unknown> {
  switch (type) {
    case ChallengeType.ADVERSARIAL_PUZZLE:
      return { pieceCount: 4, noiseLevel: 0.5, piecePositions: [] };
    case ChallengeType.HUMAN_INTUITION_GRID:
      return { gridSize: 3, oddIndex: Math.floor(Math.random() * 9) };
    case ChallengeType.PHYSICS_CHAOS:
      return { objectCount: 5, targetWeight: 100 };
    case ChallengeType.TEMPORAL_MEMORY:
      return { sequenceLength: 5, showTime: 3000 };
    case ChallengeType.OPTICAL_ILLUSION_MAZE:
      return { mazeSize: 10, illusionStrength: 0.6 };
    case ChallengeType.VOICE_RHYTHM:
      return { patternLength: 4, bpm: 120 };
    case ChallengeType.GESTURE_SIGNATURE:
      return { gestureType: 'circle', complexity: 2 };
    case ChallengeType.CONTEXTUAL_REASONING:
      return { sceneType: 'kitchen', optionCount: 4 };
    case ChallengeType.LIVE_3D_BIOMETRIC:
      return { objectType: 'cube', targetRotation: { x: 45, y: 30, z: 0 } };
    case ChallengeType.ZERO_KNOWLEDGE_PROOF:
      return {
        patches: Array.from({ length: 9 }, (_, i) => ({
          color: `hsl(${(i * 40) % 360}, 70%, 60%)`,
          pattern: (['solid', 'striped', 'dotted', 'gradient'] as const)[i % 4],
          variant: i % 3,
        })),
        targetPattern: 'odd_one_out',
        powDifficulty: 2,
        powPrefix: '0',
      };
    default:
      return {};
  }
}

function riskToColor(score: number): string {
  if (score < 0.25) return '#10b981'; // green
  if (score < 0.5) return '#eab308'; // yellow
  if (score < 0.75) return '#f97316'; // orange
  return '#ef4444'; // red
}

function riskToLabel(score: number, t: ReturnType<typeof getTranslations>): string {
  if (score < 0.25) return t.riskLow;
  if (score < 0.5) return t.riskMedium;
  if (score < 0.75) return t.riskHigh;
  return t.riskCritical;
}

// ─── Verification Layer Indicator ────────────────────────────────────────────

const VERIFICATION_LAYERS: { layer: VerificationLayer; icon: React.ElementType; label: string }[] = [
  { layer: VerificationLayer.BEHAVIORAL_PRECHECK, icon: Fingerprint, label: 'Behavioral' },
  { layer: VerificationLayer.DYNAMIC_CHALLENGE, icon: Shield, label: 'Challenge' },
  { layer: VerificationLayer.QR_MOBILE, icon: QrCode, label: 'QR / Passkey' },
  { layer: VerificationLayer.CRYPTOGRAPHIC_TOKEN, icon: KeyRound, label: 'Token' },
];

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function CaptchaWidgetV4({ config, onVerify, onError }: CaptchaWidgetV4Props) {
  // ── Merged config ──────────────────────────────────────────────────────────
  const mergedConfig: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG, ...config };

  // ── Core state ─────────────────────────────────────────────────────────────
  const [state, setState] = useState<WidgetState>(WidgetState.IDLE);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [challengeInstances, setChallengeInstances] = useState<ChallengeInstance[]>([]);
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<CaptchaToken | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [completedLayers, setCompletedLayers] = useState<VerificationLayer[]>([]);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const analyzerRef = useRef<BehavioralAnalyzerV4 | null>(null);
  const tokenManagerRef = useRef<TokenManager | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  // ── Derived values ─────────────────────────────────────────────────────────
  const lang: LanguageCode = (detectLanguage() as LanguageCode) ?? 'en';
  const t = getTranslations(lang);
  const isDark = mergedConfig.theme === 'dark' || (mergedConfig.theme === 'auto' && (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches));
  const resolvedTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const isMicro = mergedConfig.size === 'micro';
  const isCompact = mergedConfig.size === 'compact';
  const isFull = mergedConfig.size === 'full';
  const currentChallenge = challengeInstances[currentChallengeIdx] ?? null;
  const currentRiskScore = riskAssessment?.score ?? 0;

  // ── Initialize behavioral analyzer ─────────────────────────────────────────
  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = getBehavioralAnalyzer();
    }
    if (!tokenManagerRef.current) {
      tokenManagerRef.current = getTokenManager();
    }
  }, []);

  // ── Behavioral event tracking ──────────────────────────────────────────────
  useEffect(() => {
    const analyzer = analyzerRef.current;
    if (!analyzer) return;

    const handleMouseMove = (e: MouseEvent) => {
      analyzer.recordEvent('mousemove', { clientX: e.clientX, clientY: e.clientY });
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      analyzer.recordEvent('click', {
        clientX: e.clientX,
        clientY: e.clientY,
        offsetX: e.offsetX,
        targetWidth: target?.offsetWidth,
        targetCenterX: target ? target.getBoundingClientRect().left + target.offsetWidth / 2 : undefined,
      });
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      analyzer.recordEvent('keydown', { key: e.key, code: e.code });
    };
    const handleScroll = () => {
      analyzer.recordEvent('scroll', { scrollY: window.scrollY });
    };
    const handleVisibilityChange = () => {
      analyzer.recordEvent('visibilitychange', { hidden: document.hidden });
    };
    const handlePointerDown = (e: PointerEvent) => {
      analyzer.recordEvent('pointerdown', { pressure: e.pressure, pointerType: e.pointerType });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  // ── Cooldown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldownSeconds]);

  // ── Start verification flow ────────────────────────────────────────────────
  const startVerification = useCallback(() => {
    if (cooldownSeconds > 0) return;

    setState(WidgetState.LOADING);
    setErrorMessage(null);
    setCaptchaToken(null);
    setCompletedLayers([]);
    setShowRiskWarning(false);
    setShowQR(false);

    // Small delay for loading animation
    setTimeout(() => {
      try {
        const analyzer = analyzerRef.current;
        if (!analyzer) {
          throw new Error('Behavioral analyzer not initialized');
        }

        setState(WidgetState.ANALYZING);

        // Compute risk assessment
        const assessment = analyzer.computeRiskAssessment();
        setRiskAssessment(assessment);

        // Check if risk is too high → block immediately
        if (assessment.score >= 0.85) {
          setState(WidgetState.FAILED);
          setErrorMessage(t.riskCritical);
          const newFail = failCountRef.current + 1;
          failCountRef.current = newFail;
          setFailCount(newFail);
          enforceCooldown(newFail);
          onError?.(new Error('Blocked: critical risk score'));
          return;
        }

        // Show warning for elevated risk
        if (assessment.score > 0.4) {
          setShowRiskWarning(true);
        }

        // Mark behavioral pre-check as completed
        setCompletedLayers([VerificationLayer.BEHAVIORAL_PRECHECK]);

        // Select challenges based on risk
        const selectedTypes = pickChallengeTypes(assessment);
        if (selectedTypes.length === 0) {
          // Very low risk — skip directly to token generation
          generateAndIssueToken(assessment, []);
          return;
        }

        // Create challenge instances
        const difficulty = assessment.score > 0.6
          ? ChallengeDifficulty.HARD
          : assessment.score > 0.3
            ? ChallengeDifficulty.MEDIUM
            : ChallengeDifficulty.EASY;

        const instances = selectedTypes.map((type, idx) =>
          createChallengeInstance(
            type,
            idx === 0 ? difficulty : ChallengeDifficulty.MEDIUM,
          ),
        );

        setChallengeInstances(instances);
        setCurrentChallengeIdx(0);
        setState(WidgetState.CHALLENGING);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState(WidgetState.ERROR);
        setErrorMessage(error.message);
        onError?.(error);
      }
    }, 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooldownSeconds, t, onError]);

  // ── Generate and issue token ───────────────────────────────────────────────
  const generateAndIssueToken = useCallback(
    async (assessment: RiskAssessment, layers: VerificationLayer[]) => {
      setState(WidgetState.VERIFYING);

      try {
        const tm = tokenManagerRef.current;
        const analyzer = analyzerRef.current;
        if (!tm || !analyzer) throw new Error('Token manager not initialized');

        const allLayers: VerificationLayer[] = [
          VerificationLayer.BEHAVIORAL_PRECHECK,
          VerificationLayer.DYNAMIC_CHALLENGE,
          ...layers,
          VerificationLayer.CRYPTOGRAPHIC_TOKEN,
        ];

        const token = await tm.generateToken({
          risk: assessment.score,
          challenge: challengeInstances[0]?.type ?? ChallengeType.ZERO_KNOWLEDGE_PROOF,
          verified: allLayers,
          fp: analyzer.getDeviceFingerprint(),
        });

        setCompletedLayers(allLayers);
        setCaptchaToken(token);
        setState(WidgetState.SUCCESS);
        onVerify?.(token);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState(WidgetState.FAILED);
        setErrorMessage(error.message);
        onError?.(error);
      }
    },
    [challengeInstances, onVerify, onError],
  );

  // ── Challenge solved handler ───────────────────────────────────────────────
  const handleChallengeSolve = useCallback(
    (_solution: ChallengeSolution) => {
      // Mark dynamic challenge layer as completed
      const newLayers = [...completedLayers, VerificationLayer.DYNAMIC_CHALLENGE];
      setCompletedLayers(newLayers);

      // If there are more challenges, advance to the next one
      if (currentChallengeIdx < challengeInstances.length - 1) {
        setCurrentChallengeIdx((prev) => prev + 1);
        return;
      }

      // All challenges completed — check if QR/Passkey is needed
      if (mergedConfig.mode === VerificationMode.FORTRESS && currentRiskScore > 0.5) {
        setShowQR(true);
        return;
      }

      // Proceed to token generation
      const assessment = riskAssessment;
      if (assessment) {
        generateAndIssueToken(assessment, []);
      }
    },
    [completedLayers, currentChallengeIdx, challengeInstances.length, mergedConfig.mode, currentRiskScore, riskAssessment, generateAndIssueToken],
  );

  // ── Challenge failed handler ───────────────────────────────────────────────
  const handleChallengeFail = useCallback(
    (reason: string) => {
      const newFail = failCountRef.current + 1;
      failCountRef.current = newFail;
      setFailCount(newFail);

      setState(WidgetState.FAILED);
      setErrorMessage(reason || t.failMessage);
      enforceCooldown(newFail);
    },
    [t.failMessage, enforceCooldown],
  );

  // ── QR verification handler ────────────────────────────────────────────────
  const handleQRVerified = useCallback(
    (success: boolean, _code: string) => {
      if (success) {
        const newLayers = [...completedLayers, VerificationLayer.QR_MOBILE];
        setCompletedLayers(newLayers);

        const assessment = riskAssessment;
        if (assessment) {
          generateAndIssueToken(assessment, [VerificationLayer.QR_MOBILE]);
        }
      } else {
        setState(WidgetState.FAILED);
        setErrorMessage(t.failMessage);
      }
    },
    [completedLayers, riskAssessment, generateAndIssueToken, t.failMessage],
  );

  // ── Cooldown enforcement ───────────────────────────────────────────────────
  const enforceCooldown = useCallback((attempts: number) => {
    const cooldown = Math.min(5 * attempts, 60); // 5s * attempts, capped at 60s
    if (cooldown > 0) {
      setCooldownSeconds(cooldown);
    }
  }, []);

  // ── Reset / retry ──────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (cooldownSeconds > 0) return;
    setState(WidgetState.IDLE);
    setErrorMessage(null);
    setChallengeInstances([]);
    setCurrentChallengeIdx(0);
    setCompletedLayers([]);
    setShowRiskWarning(false);
    setShowQR(false);
    analyzerRef.current?.reset();
  }, [cooldownSeconds]);

  // ── Render: Risk Meter ─────────────────────────────────────────────────────
  const renderRiskMeter = () => {
    if (!mergedConfig.showRiskMeter || isMicro) return null;

    const score = currentRiskScore;
    const color = riskToColor(score);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Risk Score
          </span>
          <span className="text-[10px] font-mono" style={{ color }}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, #10b981, #eab308, #f97316, #ef4444)`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(score * 100, 2)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {riskToLabel(score, t)}
        </p>
      </div>
    );
  };

  // ── Render: Verification Layers Progress ───────────────────────────────────
  const renderLayerProgress = () => {
    if (isMicro || isCompact) return null;

    return (
      <div className="flex items-center gap-1">
        {VERIFICATION_LAYERS.map(({ layer, icon: Icon, label }) => {
          const isCompleted = completedLayers.includes(layer);
          return (
            <div key={layer} className="flex items-center gap-0.5" title={label}>
              <motion.div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-600'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}
                animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Icon className="w-2.5 h-2.5" />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render: Challenge Component ────────────────────────────────────────────
  const renderChallenge = () => {
    if (!currentChallenge) return null;

    const ChallengeComponent = CHALLENGE_COMPONENTS[currentChallenge.type];
    if (!ChallengeComponent) {
      return (
        <div className={`p-4 rounded-lg text-center ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          Unknown challenge type: {currentChallenge.type}
        </div>
      );
    }

    return (
      <ChallengeComponent
        instance={currentChallenge}
        onSolve={handleChallengeSolve}
        onFail={handleChallengeFail}
        language={mergedConfig.language}
        theme={resolvedTheme}
        accessibilityMode={mergedConfig.accessibilityMode}
        timeLimit={120}
      />
    );
  };

  // ── Render: Micro size (just checkbox) ─────────────────────────────────────
  if (isMicro) {
    return (
      <button
        onClick={state === WidgetState.IDLE ? startVerification : undefined}
        disabled={state !== WidgetState.IDLE}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 border
          ${state === WidgetState.SUCCESS
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            : state === WidgetState.FAILED || state === WidgetState.ERROR
              ? 'bg-red-500/15 border-red-500/40 text-red-400'
              : isDark
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500/50'
                : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-500/50'
          }
        `}
        aria-label={state === WidgetState.SUCCESS ? 'Verified' : 'Verify you are human'}
      >
        {state === WidgetState.LOADING || state === WidgetState.ANALYZING || state === WidgetState.VERIFYING ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : state === WidgetState.SUCCESS ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : state === WidgetState.FAILED || state === WidgetState.ERROR ? (
          <XCircle className="w-3.5 h-3.5" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        <span>
          {state === WidgetState.SUCCESS
            ? t.successMessage
            : state === WidgetState.LOADING || state === WidgetState.ANALYZING
              ? t.loading
              : state === WidgetState.VERIFYING
                ? t.loading
                : state === WidgetState.FAILED || state === WidgetState.ERROR
                  ? t.failMessage
                  : t.verifyButton}
        </span>
      </button>
    );
  }

  // ── Render: Full widget ────────────────────────────────────────────────────
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border transition-colors duration-300
        ${isDark
          ? 'bg-gray-900/95 border-gray-700/50 shadow-2xl shadow-black/40'
          : 'bg-white border-gray-200 shadow-xl shadow-gray-200/60'
        }
        ${isFull ? 'w-full' : 'w-full max-w-md'}
      `}
      style={{ borderRadius: mergedConfig.borderRadius }}
      role="region"
      aria-label="CAPTCHA verification widget"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className={`
          flex items-center justify-between px-4 py-2.5 border-b
          ${isDark ? 'bg-gray-800/60 border-gray-700/50' : 'bg-gray-50 border-gray-100'}
        `}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${mergedConfig.accentColor}20` }}
          >
            <Shield className="w-4 h-4" style={{ color: mergedConfig.accentColor }} />
          </div>
          <div>
            <h2 className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {t.widgetTitle}
            </h2>
            {!isCompact && (
              <p className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                v4.0 Fortress · 28 signals · 10 challenges
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renderLayerProgress()}

          {state === WidgetState.SUCCESS && (
            <span
              className="text-[9px] font-medium px-2 py-0.5 rounded-full"
              style={{
                color: mergedConfig.accentColor,
                backgroundColor: `${mergedConfig.accentColor}15`,
              }}
            >
              Verified
            </span>
          )}

          {(state === WidgetState.CHALLENGING || state === WidgetState.ANALYZING) && (
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: mergedConfig.accentColor }}
              />
              <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {state === WidgetState.ANALYZING ? 'Analyzing' : 'Active'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Risk Meter (compact+ sizes) ────────────────────────────────────── */}
      {!isMicro && (
        <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-800/50' : 'border-gray-50'}`}>
          {renderRiskMeter()}
        </div>
      )}

      {/* ── Risk Warning ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRiskWarning && state !== WidgetState.SUCCESS && state !== WidgetState.FAILED && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`
                mx-4 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                ${isDark
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                  : 'bg-amber-50 border border-amber-200 text-amber-700'
                }
              `}
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t.riskMedium}</span>
              <button
                onClick={() => setShowRiskWarning(false)}
                className={`ml-auto text-[10px] underline ${isDark ? 'text-amber-400/70' : 'text-amber-600/70'}`}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content Area ───────────────────────────────────────────────────── */}
      <div className={`
        p-4 min-h-[260px] flex items-center justify-center
        ${isFull ? 'min-h-[320px]' : ''}
      `}>
        <AnimatePresence mode="wait">
          {/* ─── IDLE ──────────────────────────────────────────────────────── */}
          {state === WidgetState.IDLE && cooldownSeconds === 0 && (
            <motion.div key="idle" {...fadeInUp} className="text-center space-y-4 w-full">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${mergedConfig.accentColor}15` }}
              >
                <Shield className="w-7 h-7" style={{ color: mergedConfig.accentColor }} />
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {t.widgetTitle}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  28 behavioral signals · AI-resistant challenges
                </p>
              </div>
              <button
                onClick={startVerification}
                className="px-6 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: mergedConfig.accentColor,
                  boxShadow: `0 8px 24px ${mergedConfig.accentColor}30`,
                }}
              >
                {t.verifyButton}
              </button>

              {/* Accessibility mode toggle */}
              {mergedConfig.accessibilityMode && (
                <div className={`flex items-center justify-center gap-2 text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Fingerprint className="w-3 h-3" />
                  <span>{t.accessibilityMode}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── LOADING ──────────────────────────────────────────────────── */}
          {state === WidgetState.LOADING && (
            <motion.div key="loading" {...fadeInUp} className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 mx-auto"
              >
                <Loader2
                  className="w-10 h-10"
                  style={{ color: mergedConfig.accentColor }}
                />
              </motion.div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.loading}
              </p>
            </motion.div>
          )}

          {/* ─── ANALYZING ────────────────────────────────────────────────── */}
          {state === WidgetState.ANALYZING && (
            <motion.div key="analyzing" {...fadeInUp} className="text-center space-y-3">
              <div className="relative w-16 h-16 mx-auto">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: `${mergedConfig.accentColor}40`, borderTopColor: 'transparent' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Fingerprint
                    className="w-7 h-7"
                    style={{ color: mergedConfig.accentColor }}
                  />
                </div>
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Analyzing behavioral signals...
                </p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  28 signals · Bayesian risk scoring
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── CHALLENGING ──────────────────────────────────────────────── */}
          {state === WidgetState.CHALLENGING && !showQR && (
            <motion.div key={`challenge-${currentChallengeIdx}`} {...scaleIn} className="w-full">
              {/* Multi-challenge indicator */}
              {challengeInstances.length > 1 && (
                <div className="flex items-center gap-1 mb-3">
                  {challengeInstances.map((_, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 h-1 rounded-full transition-colors ${
                        idx < currentChallengeIdx
                          ? 'bg-emerald-500'
                          : idx === currentChallengeIdx
                            ? ''
                            : isDark
                              ? 'bg-gray-800'
                              : 'bg-gray-200'
                      }`}
                      style={idx === currentChallengeIdx ? { backgroundColor: mergedConfig.accentColor } : undefined}
                    />
                  ))}
                </div>
              )}
              {renderChallenge()}
            </motion.div>
          )}

          {/* ─── QR VERIFICATION ──────────────────────────────────────────── */}
          {state === WidgetState.CHALLENGING && showQR && (
            <motion.div key="qr" {...fadeInUp} className="w-full">
              <div className="mb-3 text-center">
                <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.qrScanPrompt}
                </p>
              </div>
              <QRVerification onVerified={handleQRVerified} />
            </motion.div>
          )}

          {/* ─── VERIFYING ────────────────────────────────────────────────── */}
          {state === WidgetState.VERIFYING && (
            <motion.div key="verifying" {...fadeInUp} className="text-center space-y-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              >
                <KeyRound
                  className="w-10 h-10 mx-auto"
                  style={{ color: mergedConfig.accentColor }}
                />
              </motion.div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Generating cryptographic token...
                </p>
                <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  HMAC-SHA256 · CSHIELD-V4 JWT
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── SUCCESS ──────────────────────────────────────────────────── */}
          {state === WidgetState.SUCCESS && captchaToken && (
            <motion.div key="success" {...scaleIn} className="text-center space-y-4 w-full">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${mergedConfig.accentColor}20` }}
              >
                <CheckCircle2
                  className="w-9 h-9"
                  style={{ color: mergedConfig.accentColor }}
                />
              </motion.div>

              <div>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {t.successMessage}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Risk score: {(captchaToken.payload.risk * 100).toFixed(0)}% ·
                  Layers: {captchaToken.payload.verified.length}
                </p>
              </div>

              {/* Token display (compact) */}
              {isFull && (
                <div
                  className={`
                    mx-auto max-w-sm p-3 rounded-lg font-mono text-[10px] break-all
                    ${isDark ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-50 text-gray-500 border border-gray-200'}
                  `}
                >
                  <span className={`text-[9px] font-sans block mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Token (JWT)
                  </span>
                  {getTokenManager().encodeToken(captchaToken).slice(0, 80)}...
                </div>
              )}

              {/* Verification layers completed */}
              <div className="flex items-center justify-center gap-2">
                {completedLayers.map((layer) => {
                  const info = VERIFICATION_LAYERS.find((l) => l.layer === layer);
                  if (!info) return null;
                  return (
                    <div
                      key={layer}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-md text-[10px]
                        ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}
                      `}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{info.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── FAILED ───────────────────────────────────────────────────── */}
          {(state === WidgetState.FAILED || state === WidgetState.ERROR) && (
            <motion.div key="failed" {...scaleIn} className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  isDark ? 'bg-red-500/20' : 'bg-red-50'
                }`}
              >
                <XCircle className={`w-9 h-9 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              </motion.div>

              <div>
                <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {state === WidgetState.ERROR ? 'Error' : t.failMessage}
                </h3>
                {errorMessage && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {errorMessage}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleRetry}
                  disabled={cooldownSeconds > 0}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg
                    transition-all duration-200
                    ${cooldownSeconds > 0
                      ? isDark
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'text-white hover:scale-[1.02] active:scale-[0.98]'
                    }
                  `}
                  style={
                    cooldownSeconds > 0
                      ? undefined
                      : { backgroundColor: mergedConfig.accentColor }
                  }
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cooldownSeconds > 0 ? '' : ''}`} />
                  {cooldownSeconds > 0 ? `${t.cooldownMessage} ${cooldownSeconds}s` : t.retry}
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── COOLDOWN (idle with cooldown) ────────────────────────────── */}
          {state === WidgetState.IDLE && cooldownSeconds > 0 && (
            <motion.div key="cooldown" {...fadeInUp} className="text-center space-y-3">
              <AlertTriangle className={`w-10 h-10 mx-auto ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                  {t.cooldownMessage}
                </p>
                <p className={`text-lg font-mono font-bold mt-1 ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>
                  {cooldownSeconds}s
                </p>
              </div>
              <div className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Failed attempts: {failCount}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div
        className={`
          px-4 py-2 border-t flex items-center justify-between
          ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50/50 border-gray-100'}
        `}
      >
        <span className={`text-[9px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          CAPTCHA Shield v4.0 · 28 signals · 10 challenges
        </span>
        <div className="flex items-center gap-3">
          {failCount > 0 && state !== WidgetState.SUCCESS && (
            <span className={`text-[9px] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
              Fails: {failCount}/{mergedConfig.maxAttempts}
            </span>
          )}
          {state !== WidgetState.IDLE && state !== WidgetState.SUCCESS && (
            <button
              onClick={handleRetry}
              className={`
                flex items-center gap-1 text-[9px] transition-colors
                ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { CaptchaWidgetV4Props };
export default CaptchaWidgetV4;
