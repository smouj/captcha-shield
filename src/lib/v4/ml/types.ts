/**
 * CAPTCHA Shield v4.0 "Fortress" — ML Module Type Definitions
 *
 * Type system for the on-device TensorFlow.js Lite bot detection model.
 * The model architecture is designed for a compact 180KB TFLite model
 * that runs entirely client-side with no server round-trips.
 *
 * Architecture Overview:
 * ┌─────────────────────────────────────────────┐
 * │  Input: 28 behavioral signals (float32)     │
 * │  ┌─────────────────────────────────────────┐│
 * │  │ Dense(64, ReLU) + BatchNorm + Dropout   ││
 * │  │ Dense(32, ReLU) + BatchNorm + Dropout   ││
 * │  │ Dense(16, ReLU) + BatchNorm             ││
 * │  │ Dense(1, Sigmoid)                       ││
 * │  └─────────────────────────────────────────┘│
 * │  Output: bot_probability (0.0 – 1.0)        │
 * └─────────────────────────────────────────────┘
 *
 * Integration Notes:
 * - The real model would be loaded from /models/bot-detector.tflite
 * - TensorFlow.js Lite runtime adds ~120KB to the widget bundle
 * - Inference time target: <5ms on mid-range mobile devices
 * - Model is quantized (float16) to fit the 180KB budget
 */

import { SignalCategory, SignalName, RiskLevel } from '../../types';

// ─── Model Configuration ─────────────────────────────────────────────────────

/**
 * Configuration for the ML bot detection model.
 *
 * Controls model loading behavior, inference parameters,
 * and fallback strategy when the model is unavailable.
 */
export interface MLModelConfig {
  /** URL or path to the TFLite model file (.tflite or model.json) */
  modelPath: string;

  /** Maximum time (ms) to wait for model loading before fallback */
  loadTimeout: number;

  /** Minimum confidence threshold for the model prediction to be trusted */
  confidenceThreshold: number;

  /** Whether to use WebGL backend for GPU-accelerated inference */
  preferWebGL: boolean;

  /** Whether to fall back to heuristic scoring if model fails to load */
  fallbackToHeuristic: boolean;

  /** Number of inference threads (0 = auto-detect) */
  numThreads: number;

  /** Model version string for cache busting */
  modelVersion: string;

  /** Whether to log inference metrics for debugging */
  debugMode: boolean;
}

/**
 * Default ML model configuration.
 */
export const DEFAULT_ML_MODEL_CONFIG: MLModelConfig = {
  modelPath: '/models/bot-detector.tflite',
  loadTimeout: 3000,
  confidenceThreshold: 0.6,
  preferWebGL: true,
  fallbackToHeuristic: true,
  numThreads: 0,
  modelVersion: '4.0.0',
  debugMode: false,
};

// ─── Model Architecture Specification ─────────────────────────────────────────

/**
 * Specification of a single dense layer in the neural network.
 */
export interface DenseLayerSpec {
  /** Layer name for debugging and serialization */
  name: string;

  /** Number of neurons in this layer */
  units: number;

  /** Activation function */
  activation: 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';

  /** Whether batch normalization is applied after this layer */
  batchNorm: boolean;

  /** Dropout rate (0 = no dropout, only during training) */
  dropoutRate: number;

  /** Weight tensor shape: [input_dim, units] */
  weightShape: [number, number];

  /** Bias tensor shape: [units] */
  biasShape: [number];
}

/**
 * Full model architecture specification.
 * Describes the compact feed-forward network for bot detection.
 */
export interface ModelArchitectureSpec {
  /** Model identifier */
  modelId: string;

  /** Human-readable model name */
  modelName: string;

  /** Model version */
  version: string;

  /** Input shape: [batch_size, num_signals] */
  inputShape: [number, number];

  /** Output shape: [batch_size, 1] (bot probability) */
  outputShape: [number, number];

  /** Ordered list of dense layers */
  layers: DenseLayerSpec[];

  /** Total number of trainable parameters */
  totalParams: number;

  /** Model size in bytes (quantized float16) */
  modelSizeBytes: number;

  /** Signal names in the expected input order */
  signalOrder: SignalName[];

  /** Signal categories and their indices in the input tensor */
  categoryIndices: Record<SignalCategory, number[]>;

  /** Pre-processing normalization parameters per signal */
  normalizationParams: {
    /** Per-signal mean values for standardization */
    mean: number[];
    /** Per-signal standard deviation values for standardization */
    std: number[];
  };
}

/**
 * The actual model architecture for the CAPTCHA Shield v4 bot detector.
 *
 * This is a 4-layer feed-forward network optimized for the 28-signal input:
 * - Layer 1: 64 units (compresses 28 → 64 with learned features)
 * - Layer 2: 32 units (bottleneck for generalization)
 * - Layer 3: 16 units (compact representation)
 * - Layer 4: 1 unit (bot probability via sigmoid)
 *
 * Total parameters: ~4,500 (float16 quantized → ~9KB raw weights)
 * With TFLite metadata and op definitions: ~180KB total
 */
export const BOT_DETECTOR_ARCHITECTURE: ModelArchitectureSpec = {
  modelId: 'captcha-shield-v4-bot-detector',
  modelName: 'CAPTCHA Shield v4 Bot Detector',
  version: '4.0.0',
  inputShape: [1, 28],
  outputShape: [1, 1],
  layers: [
    {
      name: 'dense_1',
      units: 64,
      activation: 'relu',
      batchNorm: true,
      dropoutRate: 0.3,
      weightShape: [28, 64],
      biasShape: [64],
    },
    {
      name: 'dense_2',
      units: 32,
      activation: 'relu',
      batchNorm: true,
      dropoutRate: 0.2,
      weightShape: [64, 32],
      biasShape: [32],
    },
    {
      name: 'dense_3',
      units: 16,
      activation: 'relu',
      batchNorm: true,
      dropoutRate: 0.0,
      weightShape: [32, 16],
      biasShape: [16],
    },
    {
      name: 'output',
      units: 1,
      activation: 'sigmoid',
      batchNorm: false,
      dropoutRate: 0.0,
      weightShape: [16, 1],
      biasShape: [1],
    },
  ],
  totalParams: 4513,
  modelSizeBytes: 184320, // ~180KB
  signalOrder: [
    // Motor signals (8)
    SignalName.MOUSE_PATH_LINEARITY,
    SignalName.MOUSE_SPEED_VARIANCE,
    SignalName.MOUSE_ACCELERATION_PATTERN,
    SignalName.POINTER_PRECISION,
    SignalName.POINTER_PRESSURE,
    SignalName.CLICK_PRECISION,
    SignalName.SCROLL_BEHAVIOR,
    SignalName.GESTURE_SMOOTHNESS,
    // Temporal signals (6)
    SignalName.TIMING_CONSISTENCY,
    SignalName.REACTION_TIME,
    SignalName.HESITATION_PATTERN,
    SignalName.INTER_EVENT_INTERVAL,
    SignalName.TASK_COMPLETION_RHYTHM,
    SignalName.TEMPORAL_ANOMALY,
    // Device signals (6)
    SignalName.DEVICE_FINGERPRINT,
    SignalName.SCREEN_RESOLUTION,
    SignalName.TIMEZONE_CONSISTENCY,
    SignalName.BATTERY_API,
    SignalName.SENSOR_FUSION,
    SignalName.WEBRTC_FINGERPRINT,
    // Cognitive signals (4)
    SignalName.DECISION_LATENCY,
    SignalName.ERROR_CORRECTION,
    SignalName.PATTERN_RECOGNITION,
    SignalName.ENTROPY_SCORE,
    // Environment signals (2)
    SignalName.TAB_VISIBILITY,
    SignalName.ENVIRONMENT_CONSISTENCY,
    // Network signals (1)
    SignalName.CONNECTION_FINGERPRINT,
    // Biometric signals (1)
    SignalName.KEYBOARD_DYNAMICS,
  ],
  categoryIndices: {
    [SignalCategory.MOTOR]: [0, 1, 2, 3, 4, 5, 6, 7],
    [SignalCategory.TEMPORAL]: [8, 9, 10, 11, 12, 13],
    [SignalCategory.DEVICE]: [14, 15, 16, 17, 18, 19],
    [SignalCategory.COGNITIVE]: [20, 21, 22, 23],
    [SignalCategory.ENVIRONMENT]: [24, 25],
    [SignalCategory.NETWORK]: [26],
    [SignalCategory.BIOMETRIC]: [27],
  },
  normalizationParams: {
    // Mean values for each of the 28 signals (pre-trained)
    mean: [
      0.52, 0.55, 0.48, 0.56, 0.50, 0.54, 0.53, 0.58,  // Motor
      0.60, 0.52, 0.55, 0.58, 0.56, 0.42,                // Temporal
      0.72, 0.78, 0.80, 0.58, 0.55, 0.65,                // Device
      0.55, 0.45, 0.52, 0.68,                             // Cognitive
      0.65, 0.70,                                          // Environment
      0.58,                                                 // Network
      0.50,                                                 // Biometric
    ],
    // Standard deviation values for each of the 28 signals
    std: [
      0.22, 0.28, 0.20, 0.18, 0.25, 0.16, 0.30, 0.20,  // Motor
      0.15, 0.22, 0.25, 0.20, 0.18, 0.22,                // Temporal
      0.18, 0.12, 0.10, 0.35, 0.30, 0.22,                // Device
      0.20, 0.18, 0.25, 0.22,                             // Cognitive
      0.28, 0.20,                                          // Environment
      0.30,                                                 // Network
      0.25,                                                 // Biometric
    ],
  },
};

// ─── Prediction Types ─────────────────────────────────────────────────────────

/**
 * Result of a bot probability prediction from the ML model.
 *
 * Contains the primary bot probability score along with
 * interpretability signals for explainability.
 */
export interface MLPrediction {
  /** Primary bot probability score (0 = definitely human, 1 = definitely bot) */
  botProbability: number;

  /** Confidence in the prediction (0 = uncertain, 1 = very confident) */
  confidence: number;

  /** Risk level derived from the bot probability */
  riskLevel: RiskLevel;

  /** Which signal categories contributed most to the prediction */
  topContributingCategories: {
    category: SignalCategory;
    contribution: number; // 0-1, relative importance
  }[];

  /** Individual signal contributions to the prediction (top 5 by magnitude) */
  topSignalContributions: {
    signal: SignalName;
    value: number;
    contribution: number; // signed, positive = toward bot
  }[];

  /** Inference time in milliseconds */
  inferenceTimeMs: number;

  /** Whether this prediction came from the ML model or heuristic fallback */
  source: 'ml_model' | 'heuristic_fallback';

  /** Timestamp of the prediction */
  timestamp: number;
}

/**
 * Real-time metrics about the ML model's performance.
 */
export interface MLModelMetrics {
  /** Number of inferences performed since model load */
  totalInferences: number;

  /** Average inference time in milliseconds */
  avgInferenceTimeMs: number;

  /** 95th percentile inference time in milliseconds */
  p95InferenceTimeMs: number;

  /** Number of times the heuristic fallback was used */
  fallbackCount: number;

  /** Model load time in milliseconds */
  modelLoadTimeMs: number;

  /** Whether the model is currently loaded and ready */
  isModelReady: boolean;

  /** Whether WebGL backend is being used */
  usingWebGL: boolean;

  /** Memory usage estimate in bytes */
  estimatedMemoryBytes: number;

  /** Model accuracy on validation set (from training metadata) */
  validationAccuracy: number;

  /** False positive rate on validation set */
  falsePositiveRate: number;

  /** False negative rate on validation set */
  falseNegativeRate: number;
}

/**
 * Internal state of the ML model during loading.
 */
export type MLModelLoadState =
  | 'uninitialized'
  | 'loading_runtime'
  | 'loading_model'
  | 'warming_up'
  | 'ready'
  | 'error'
  | 'fallback';

/**
 * Event emitted by the ML model during its lifecycle.
 */
export interface MLModelEvent {
  type: 'load_start' | 'load_complete' | 'load_error' | 'inference' | 'fallback';
  timestamp: number;
  data?: Record<string, unknown>;
}
