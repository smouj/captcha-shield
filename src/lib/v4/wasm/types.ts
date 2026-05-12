/**
 * CAPTCHA Shield v4.0 "Fortress" — WASM Module Type Definitions
 *
 * Type system for WebAssembly-accelerated challenge computations.
 * WASM modules provide near-native performance for compute-intensive
 * operations like gesture validation, physics simulation, maze
 * generation, and proof-of-work verification.
 *
 * ## Architecture
 *
 * Each WASM module follows the same pattern:
 * 1. Pure TypeScript fallback implementation (always available)
 * 2. WASM module loaded on-demand when available
 * 3. Auto-detection mechanism that selects the fastest path
 *
 * ## WASM Module Inventory
 *
 * | Module            | Purpose                    | Size    | Speedup |
 * |-------------------|----------------------------|---------|---------|
 * | challenge-wasm    | Gesture + Physics + Maze   | ~45KB   | 8-15x   |
 * | pow-wasm          | Proof-of-work computation  | ~12KB   | 20-40x  |
 *
 * ## Integration Notes
 *
 * WASM modules are compiled from Rust/C++ and placed in `public/wasm/`.
 * The TypeScript fallbacks ensure the application works in all environments,
 * including those where WASM is disabled or unsupported.
 */

// ─── WASM Configuration ──────────────────────────────────────────────────────

/**
 * Configuration for loading WASM modules.
 */
export interface WasmModuleConfig {
  /** Base URL for WASM module files */
  baseUrl: string;

  /** Whether to attempt WASM loading (can be disabled for testing) */
  enableWasm: boolean;

  /** Maximum time (ms) to wait for WASM module loading */
  loadTimeout: number;

  /** Whether to fall back to TypeScript when WASM fails */
  fallbackToTS: boolean;

  /** Module-specific paths */
  modules: {
    /** Path to the challenge computation WASM module */
    challengeWasm: string;
    /** Path to the proof-of-work WASM module */
    powWasm: string;
  };

  /** Whether to use SharedArrayBuffer for multi-threaded WASM */
  useSharedArrayBuffer: boolean;
}

/**
 * Default WASM module configuration.
 */
export const DEFAULT_WASM_CONFIG: WasmModuleConfig = {
  baseUrl: '/wasm',
  enableWasm: true,
  loadTimeout: 5000,
  fallbackToTS: true,
  modules: {
    challengeWasm: '/wasm/challenge-wasm.wasm',
    powWasm: '/wasm/pow-wasm.wasm',
  },
  useSharedArrayBuffer: false,
};

// ─── WASM Bridge ──────────────────────────────────────────────────────────────

/**
 * Bridge interface for the loaded WASM module.
 *
 * This interface mirrors the exported functions from the WASM module.
 * When WASM is not available, a TypeScript implementation that matches
 * this interface is used instead.
 *
 * ### WASM Module Export Functions
 *
 * The compiled WASM module exports the following functions:
 * - `validate_gesture_path(ptr: number, len: number): number`
 * - `compute_physics_step(state_ptr: number): number`
 * - `generate_maze_data(size: number, seed: number): number`
 * - `verify_pow(seed_ptr: number, difficulty: number, nonce: number): number`
 *
 * Memory management:
 * - All pointers refer to linear WASM memory
 * - Strings/arrays are passed as pointer+length pairs
 * - Return values are pointers to result structures in WASM memory
 */
export interface WasmBridge {
  /** Whether the WASM module is loaded and ready */
  isReady: boolean;

  /** Validate a gesture path and return a similarity score */
  validateGesturePath: (path: Array<{ x: number; y: number }>) => number;

  /** Compute one step of physics simulation */
  computePhysicsStep: (state: PhysicsState) => PhysicsState;

  /** Generate maze data for a given size and seed */
  generateMazeData: (size: number, seed: number) => MazeData;

  /** Verify a proof-of-work solution */
  verifyProofOfWork: (seed: string, difficulty: number, nonce: number) => boolean;

  /** Release the WASM module and free memory */
  dispose: () => void;
}

// ─── Physics State ────────────────────────────────────────────────────────────

/**
 * State of the physics simulation for the PhysicsChaos challenge.
 *
 * Represents the complete state of all objects in the balance beam
 * simulation, including positions, velocities, and forces.
 */
export interface PhysicsState {
  /** Current simulation time in seconds */
  time: number;

  /** Time step for this simulation step (seconds) */
  deltaTime: number;

  /** The balance beam object */
  beam: PhysicsBeam;

  /** Objects placed on the beam */
  objects: PhysicsObject[];

  /** Gravitational acceleration (m/s²) */
  gravity: number;

  /** Whether the beam has tipped over */
  isTipped: boolean;

  /** Total angular momentum */
  angularMomentum: number;
}

/**
 * The balance beam in the physics simulation.
 */
export interface PhysicsBeam {
  /** Beam center X position */
  centerX: number;

  /** Beam center Y position */
  centerY: number;

  /** Current rotation angle (radians) */
  angle: number;

  /** Angular velocity (radians/second) */
  angularVelocity: number;

  /** Beam length */
  length: number;

  /** Beam mass */
  mass: number;

  /** Moment of inertia */
  momentOfInertia: number;

  /** Damping coefficient (friction) */
  damping: number;
}

/**
 * A physics object that can be placed on the beam.
 */
export interface PhysicsObject {
  /** Unique object identifier */
  id: string;

  /** Object type */
  type: 'circle' | 'square' | 'triangle' | 'diamond';

  /** X position on the beam (relative to center) */
  x: number;

  /** Y position on the beam */
  y: number;

  /** X velocity */
  vx: number;

  /** Y velocity */
  vy: number;

  /** Object mass */
  mass: number;

  /** Object size (radius for circle, half-width for others) */
  size: number;

  /** Whether the object is being dragged by the user */
  isDragging: boolean;

  /** Friction coefficient between object and beam */
  friction: number;
}

// ─── Maze Data ────────────────────────────────────────────────────────────────

/**
 * Generated maze data for the OpticalIllusionMaze challenge.
 *
 * The maze is represented as a 2D grid where each cell has walls
 * on its four sides. This representation is efficient for both
 * rendering and pathfinding.
 */
export interface MazeData {
  /** Grid width (number of cells) */
  width: number;

  /** Grid height (number of cells) */
  height: number;

  /** Seed used for generation (for reproducibility) */
  seed: number;

  /** 2D grid of cells with wall information */
  cells: MazeCell[][];

  /** Start position (row, col) */
  start: [number, number];

  /** End position (row, col) */
  end: [number, number];

  /** Optimal path length (for difficulty calibration) */
  optimalPathLength: number;

  /** Number of dead ends (for difficulty calibration) */
  deadEnds: number;

  /** Illusion type to apply */
  illusionType: 'moire' | 'spiral' | 'impossible' | 'none';
}

/**
 * A single cell in the maze grid.
 */
export interface MazeCell {
  /** Row index */
  row: number;

  /** Column index */
  col: number;

  /** Whether the north wall exists */
  wallNorth: boolean;

  /** Whether the south wall exists */
  wallSouth: boolean;

  /** Whether the east wall exists */
  wallEast: boolean;

  /** Whether the west wall exists */
  wallWest: boolean;

  /** Whether this cell has been visited (for generation) */
  visited: boolean;

  /** Distance from start (for solution path) */
  distance: number;
}

// ─── Proof of Work Types ──────────────────────────────────────────────────────

/**
 * Result of a proof-of-work computation.
 */
export interface PowResult {
  /** The nonce that satisfies the difficulty requirement */
  nonce: number;

  /** The resulting hash as a hex string */
  hash: string;

  /** Number of iterations attempted */
  iterations: number;

  /** Computation time in milliseconds */
  computeTimeMs: number;
}

// ─── WASM Loading State ───────────────────────────────────────────────────────

/**
 * State of WASM module loading.
 */
export type WasmLoadState =
  | 'uninitialized'
  | 'checking_support'
  | 'loading'
  | 'compiling'
  | 'instantiating'
  | 'ready'
  | 'error'
  | 'not_supported';

/**
 * Information about the WASM runtime environment.
 */
export interface WasmRuntimeInfo {
  /** Whether WebAssembly is supported */
  supported: boolean;

  /** Whether SharedArrayBuffer is available */
  sharedArrayBuffer: boolean;

  /** Whether streaming compilation is supported */
  streamingCompilation: boolean;

  /** Whether SIMD instructions are available */
  simd: boolean;

  /** Whether bulk memory operations are available */
  bulkMemory: boolean;

  /** Maximum memory size in pages (64KB each) */
  maxMemoryPages: number;
}
