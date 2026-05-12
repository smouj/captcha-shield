/**
 * CAPTCHA Shield v4.0 "Fortress" — Core Type Definitions
 * 
 * Complete type system for the unbreakable CAPTCHA platform.
 * All interfaces, types, and enums used across the entire system.
 */

// ─── Challenge Types ────────────────────────────────────────────────────────

export enum ChallengeType {
  ADVERSARIAL_PUZZLE = 'adversarial_puzzle',
  HUMAN_INTUITION_GRID = 'human_intuition_grid',
  PHYSICS_CHAOS = 'physics_chaos',
  TEMPORAL_MEMORY = 'temporal_memory',
  OPTICAL_ILLUSION_MAZE = 'optical_illusion_maze',
  VOICE_RHYTHM = 'voice_rhythm',
  GESTURE_SIGNATURE = 'gesture_signature',
  CONTEXTUAL_REASONING = 'contextual_reasoning',
  LIVE_3D_BIOMETRIC = 'live_3d_biometric',
  ZERO_KNOWLEDGE_PROOF = 'zero_knowledge_proof',
}

export enum ChallengeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXTREME = 'extreme',
}

export enum ChallengeCategory {
  VISUAL = 'visual',
  AUDIO = 'audio',
  INTERACTIVE = 'interactive',
  COGNITIVE = 'cognitive',
  BIOMETRIC = 'biometric',
  CRYPTO = 'crypto',
}

export interface ChallengeDefinition {
  type: ChallengeType;
  name: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  aiResistanceScore: number; // 0-1, how impossible for AI
  avgHumanTime: number; // seconds
  requiresAudio: boolean;
  requiresCamera: boolean;
  requiresMicrophone: boolean;
  canvasRendered: boolean;
  accessibilityMode: string[];
}

export interface ChallengeInstance {
  id: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  payload: Record<string, unknown>;
  solution: ChallengeSolution;
  expiresAt: number;
  maxAttempts: number;
  attempts: number;
  createdAt: number;
}

export interface ChallengeSolution {
  type: ChallengeType;
  answer: unknown;
  tolerance?: number;
  metadata?: Record<string, unknown>;
}

export interface ChallengeResult {
  challengeId: string;
  passed: boolean;
  confidence: number; // 0-1
  timeTaken: number; // ms
  attemptNumber: number;
  behavioralData: BehavioralData;
}

// ─── Behavioral Analysis Types ──────────────────────────────────────────────

export enum SignalCategory {
  MOTOR = 'motor',
  TEMPORAL = 'temporal',
  DEVICE = 'device',
  COGNITIVE = 'cognitive',
  ENVIRONMENT = 'environment',
  NETWORK = 'network',
  BIOMETRIC = 'biometric',
}

export enum SignalName {
  // Motor signals (8)
  MOUSE_PATH_LINEARITY = 'mouse_path_linearity',
  MOUSE_SPEED_VARIANCE = 'mouse_speed_variance',
  MOUSE_ACCELERATION_PATTERN = 'mouse_acceleration_pattern',
  POINTER_PRECISION = 'pointer_precision',
  POINTER_PRESSURE = 'pointer_pressure',
  CLICK_PRECISION = 'click_precision',
  SCROLL_BEHAVIOR = 'scroll_behavior',
  GESTURE_SMOOTHNESS = 'gesture_smoothness',
  // Temporal signals (6)
  TIMING_CONSISTENCY = 'timing_consistency',
  REACTION_TIME = 'reaction_time',
  HESITATION_PATTERN = 'hesitation_pattern',
  INTER_EVENT_INTERVAL = 'inter_event_interval',
  TASK_COMPLETION_RHYTHM = 'task_completion_rhythm',
  TEMPORAL_ANOMALY = 'temporal_anomaly',
  // Device signals (6)
  DEVICE_FINGERPRINT = 'device_fingerprint',
  SCREEN_RESOLUTION = 'screen_resolution',
  TIMEZONE_CONSISTENCY = 'timezone_consistency',
  BATTERY_API = 'battery_api',
  SENSOR_FUSION = 'sensor_fusion',
  WEBRTC_FINGERPRINT = 'webrtc_fingerprint',
  // Cognitive signals (4)
  DECISION_LATENCY = 'decision_latency',
  ERROR_CORRECTION = 'error_correction',
  PATTERN_RECOGNITION = 'pattern_recognition',
  ENTROPY_SCORE = 'entropy_score',
  // Environment signals (2)
  TAB_VISIBILITY = 'tab_visibility',
  ENVIRONMENT_CONSISTENCY = 'environment_consistency',
  // Network signals (1)
  CONNECTION_FINGERPRINT = 'connection_fingerprint',
  // Biometric signals (1)
  KEYBOARD_DYNAMICS = 'keyboard_dynamics',
}

export interface SignalReading {
  name: SignalName;
  category: SignalCategory;
  value: number; // 0-1 normalized
  rawValue: number;
  weight: number;
  timestamp: number;
  confidence: number;
  anomalyScore: number; // 0-1, 0=normal, 1=definitely bot
}

export interface BehavioralData {
  signals: SignalReading[];
  compositeRiskScore: number;
  riskLevel: RiskLevel;
  timestamp: number;
  duration: number;
  eventCount: number;
  deviceFingerprint: string;
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface RiskAssessment {
  score: number; // 0-1
  level: RiskLevel;
  dominantSignals: SignalName[];
  recommendation: 'allow' | 'challenge' | 'block';
  challengeTypes: ChallengeType[];
  confidence: number;
}

// ─── Token & Verification Types ─────────────────────────────────────────────

export enum VerificationLayer {
  BEHAVIORAL_PRECHECK = 'behavioral_precheck',
  DYNAMIC_CHALLENGE = 'dynamic_challenge',
  QR_MOBILE = 'qr_mobile',
  WEBAUTHN_PASSKEY = 'webauthn_passkey',
  CRYPTOGRAPHIC_TOKEN = 'cryptographic_token',
}

export enum VerificationMode {
  LIGHT = 'light',
  FORTRESS = 'fortress',
  HYBRID = 'hybrid',
}

export interface CaptchaToken {
  header: TokenHeader;
  payload: TokenPayload;
  signature: string;
}

export interface TokenHeader {
  alg: 'HS256';
  typ: 'CSHIELD-V4';
  kid: string;
}

export interface TokenPayload {
  iss: string; // issuer
  sub: string; // session subject
  aud: string; // audience (site domain)
  iat: number; // issued at
  exp: number; // expiration
  nbf: number; // not before
  jti: string; // unique token ID (nonce)
  risk: number; // risk score
  challenge: ChallengeType;
  verified: VerificationLayer[];
  fp: string; // device fingerprint hash
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  token?: CaptchaToken;
  expiresAt?: number;
  riskScore?: number;
}

// ─── Plugin System Types ────────────────────────────────────────────────────

export interface CaptchaPlugin {
  name: string;
  version: string;
  description: string;
  challengeType?: ChallengeType;
  signalProcessor?: (data: BehavioralData) => Partial<SignalReading>;
  challengeGenerator?: (difficulty: ChallengeDifficulty) => ChallengeInstance;
  challengeRenderer?: React.ComponentType<ChallengeProps>;
  onInit?: () => void;
  onDestroy?: () => void;
}

export interface PluginRegistry {
  plugins: Map<string, CaptchaPlugin>;
  register: (plugin: CaptchaPlugin) => void;
  unregister: (name: string) => void;
  getPlugin: (name: string) => CaptchaPlugin | undefined;
  getAllPlugins: () => CaptchaPlugin[];
}

// ─── Widget Types ───────────────────────────────────────────────────────────

export enum WidgetState {
  IDLE = 'idle',
  LOADING = 'loading',
  ANALYZING = 'analyzing',
  CHALLENGING = 'challenging',
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error',
  COOLDOWN = 'cooldown',
}

export interface WidgetConfig {
  mode: VerificationMode;
  serverVerifyUrl?: string;
  maxAttempts: number;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  size: 'micro' | 'compact' | 'normal' | 'full';
  accentColor: string;
  borderRadius: number;
  showRiskMeter: boolean;
  accessibilityMode: boolean;
  onVerify?: (token: CaptchaToken) => void;
  onError?: (error: Error) => void;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  mode: VerificationMode.FORTRESS,
  maxAttempts: 2,
  language: 'en',
  theme: 'auto',
  size: 'normal',
  accentColor: '#10b981',
  borderRadius: 12,
  showRiskMeter: true,
  accessibilityMode: false,
};

// ─── Component Props ────────────────────────────────────────────────────────

export interface ChallengeProps {
  instance: ChallengeInstance;
  onSolve: (solution: ChallengeSolution) => void;
  onFail: (reason: string) => void;
  language: string;
  theme: 'light' | 'dark';
  accessibilityMode: boolean;
  timeLimit?: number;
}

// ─── i18n Types ─────────────────────────────────────────────────────────────

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh' | 'ko';

export interface TranslationStrings {
  // Widget
  widgetTitle: string;
  verifyButton: string;
  successMessage: string;
  failMessage: string;
  cooldownMessage: string;
  // Challenges
  challenges: Record<ChallengeType, {
    title: string;
    instruction: string;
    successFeedback: string;
    errorFeedback: string;
  }>;
  // Risk
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;
  // QR
  qrScanPrompt: string;
  qrCodeInput: string;
  qrTimer: string;
  // Accessibility
  accessibilityMode: string;
  audioFallback: string;
  // General
  loading: string;
  retry: string;
  cancel: string;
}

// ─── Analytics Types ────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  type: 'attempt' | 'success' | 'failure' | 'block' | 'challenge_shown' | 'token_issued';
  timestamp: number;
  challengeType?: ChallengeType;
  riskScore?: number;
  riskLevel?: RiskLevel;
  duration?: number;
  sessionId: string;
  deviceFingerprint?: string;
  verificationLayers?: VerificationLayer[];
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSummary {
  totalAttempts: number;
  successRate: number;
  avgRiskScore: number;
  avgCompletionTime: number;
  challengeTypeDistribution: Record<ChallengeType, number>;
  riskLevelDistribution: Record<RiskLevel, number>;
  blockRate: number;
  topSignals: { name: SignalName; avgAnomaly: number }[];
  hourlyActivity: { hour: number; attempts: number; successRate: number }[];
  recentEvents: AnalyticsEvent[];
}

// ─── Utility Types ──────────────────────────────────────────────────────────

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export interface AsyncResult<T> {
  data: Nullable<T>;
  error: Nullable<string>;
  loading: boolean;
}
