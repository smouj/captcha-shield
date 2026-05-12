/**
 * CAPTCHA Shield v4.0 "Fortress" — Plugin System
 *
 * A lightweight, type-safe plugin architecture that lets third-party
 * modules register challenge generators, signal processors, and
 * custom renderers with the CAPTCHA engine.
 *
 * Usage:
 * ```ts
 * const registry = getPluginRegistry();
 *
 * registry.register(createPlugin({
 *   name: 'anti-ml-puzzle',
 *   version: '1.0.0',
 *   description: 'Adversarial puzzle generator resistant to ML solvers',
 *   challengeType: ChallengeType.ADVERSARIAL_PUZZLE,
 *   challengeGenerator: (difficulty) => generatePuzzle(difficulty),
 * }));
 *
 * const generators = registry.getChallengeGenerators();
 * const processors  = registry.getSignalProcessors();
 * ```
 */

import {
  CaptchaPlugin,
  PluginRegistry,
  ChallengeType,
  ChallengeDifficulty,
  ChallengeInstance,
  BehavioralData,
  SignalReading,
} from './types';

// ─── CaptchaPluginRegistry ────────────────────────────────────────────────────

/**
 * Central registry for CAPTCHA plugins.
 *
 * Implements the {@link PluginRegistry} interface and adds convenience methods
 * for querying challenge generators, signal processors, and lifecycle hooks.
 *
 * Plugins are stored in a `Map<string, CaptchaPlugin>` keyed by their `name`.
 * Attempting to register two plugins with the same name will replace the
 * previous entry (with a warning logged to the console).
 */
export class CaptchaPluginRegistry implements PluginRegistry {
  public plugins: Map<string, CaptchaPlugin>;

  constructor() {
    this.plugins = new Map();
  }

  // ── Registration ─────────────────────────────────────────────────────────

  /**
   * Register a plugin with the system.
   *
   * If a plugin with the same name already exists it will be replaced and a
   * warning will be printed to the console.
   *
   * @param plugin - The plugin to register. Must have a unique `name`.
   */
  register(plugin: CaptchaPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(
        `[CaptchaPluginRegistry] Plugin "${plugin.name}" is already registered. It will be replaced.`,
      );
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Remove a previously registered plugin by name.
   *
   * If the plugin defines an `onDestroy` lifecycle hook it will be called
   * during unregistration to allow for cleanup (e.g. closing WebSockets,
   * revoking event listeners, etc.).
   *
   * @param name - The name of the plugin to remove.
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin?.onDestroy) {
      plugin.onDestroy();
    }
    this.plugins.delete(name);
  }

  // ── Lookup ───────────────────────────────────────────────────────────────

  /**
   * Retrieve a single plugin by name.
   *
   * @param name - The plugin name.
   * @returns The plugin, or `undefined` if not found.
   */
  getPlugin(name: string): CaptchaPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Return all registered plugins as an array.
   *
   * @returns A new array containing every plugin (order is insertion order).
   */
  getAllPlugins(): CaptchaPlugin[] {
    return Array.from(this.plugins.values());
  }

  // ── Query helpers ────────────────────────────────────────────────────────

  /**
   * Build a `Map<ChallengeType, CaptchaPlugin>` of all plugins that provide
   * a challenge generator.
   *
   * Only plugins that declare **both** `challengeType` and
   * `challengeGenerator` are included. If multiple plugins declare the same
   * `challengeType`, the last one registered wins.
   *
   * @returns A map from challenge type to the plugin that handles it.
   */
  getChallengeGenerators(): Map<ChallengeType, CaptchaPlugin> {
    const generators = new Map<ChallengeType, CaptchaPlugin>();

    this.plugins.forEach((plugin) => {
      if (plugin.challengeType && plugin.challengeGenerator) {
        generators.set(plugin.challengeType, plugin);
      }
    });

    return generators;
  }

  /**
   * Collect all signal processor functions from registered plugins.
   *
   * Each plugin may optionally define a `signalProcessor` that enriches or
   * transforms the behavioural data collected during a verification session.
   *
   * @returns An array of signal processor functions.
   */
  getSignalProcessors(): ((data: BehavioralData) => Partial<SignalReading>)[] {
    const processors: ((data: BehavioralData) => Partial<SignalReading>)[] = [];

    this.plugins.forEach((plugin) => {
      if (plugin.signalProcessor) {
        processors.push(plugin.signalProcessor);
      }
    });

    return processors;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Call `onInit` on every registered plugin, in insertion order.
   *
   * This should be invoked once after all plugins have been registered
   * (e.g. at application startup).
   */
  initializeAll(): void {
    this.plugins.forEach((plugin) => {
      if (plugin.onInit) {
        plugin.onInit();
      }
    });
  }

  /**
   * Call `onDestroy` on every registered plugin, in insertion order.
   *
   * This should be invoked on application shutdown to allow plugins to
   * release resources.
   */
  destroyAll(): void {
    this.plugins.forEach((plugin) => {
      if (plugin.onDestroy) {
        plugin.onDestroy();
      }
    });
  }
}

// ─── createPlugin helper ──────────────────────────────────────────────────────

/**
 * Factory function to create a well-typed {@link CaptchaPlugin} from a
 * configuration object.
 *
 * This is the recommended way to define a plugin — it ensures all required
 * fields are present and provides a clear, declarative structure.
 *
 * @example
 * ```ts
 * const myPlugin = createPlugin({
 *   name: 'my-custom-puzzle',
 *   version: '1.0.0',
 *   description: 'A custom puzzle that AI cannot solve',
 *   challengeType: ChallengeType.ADVERSARIAL_PUZZLE,
 *   challengeGenerator: (difficulty) => ({
 *     id: crypto.randomUUID(),
 *     type: ChallengeType.ADVERSARIAL_PUZZLE,
 *     difficulty,
 *     payload: { /* puzzle data *\/ },
 *     solution: { type: ChallengeType.ADVERSARIAL_PUZZLE, answer: 42 },
 *     expiresAt: Date.now() + 60_000,
 *     maxAttempts: 3,
 *     attempts: 0,
 *     createdAt: Date.now(),
 *   }),
 *   signalProcessor: (data) => ({
 *     name: SignalName.ENTROPY_SCORE,
 *     category: SignalCategory.COGNITIVE,
 *     value: 0.73,
 *     rawValue: 0.73,
 *     weight: 1.0,
 *     timestamp: Date.now(),
 *     confidence: 0.9,
 *     anomalyScore: 0.1,
 *   }),
 * });
 * ```
 *
 * @param config - Plugin configuration.
 * @param config.name - Unique identifier for the plugin.
 * @param config.version - Semver version string.
 * @param config.description - Human-readable description.
 * @param config.challengeType - The challenge type this plugin handles (optional).
 * @param config.challengeGenerator - Factory for challenge instances (optional).
 * @param config.signalProcessor - Signal enrichment function (optional).
 * @returns A fully-formed {@link CaptchaPlugin}.
 */
export function createPlugin(config: {
  name: string;
  version: string;
  description: string;
  challengeType?: ChallengeType;
  challengeGenerator?: (difficulty: ChallengeDifficulty) => ChallengeInstance;
  signalProcessor?: (data: BehavioralData) => Partial<SignalReading>;
}): CaptchaPlugin {
  return {
    name: config.name,
    version: config.version,
    description: config.description,
    challengeType: config.challengeType,
    challengeGenerator: config.challengeGenerator,
    signalProcessor: config.signalProcessor,
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance: CaptchaPluginRegistry | undefined;

/**
 * Get the singleton {@link CaptchaPluginRegistry} instance.
 *
 * The first call creates the registry. Subsequent calls return the same
 * instance.
 *
 * @returns The shared plugin registry.
 */
export function getPluginRegistry(): CaptchaPluginRegistry {
  if (!instance) {
    instance = new CaptchaPluginRegistry();
  }
  return instance;
}
