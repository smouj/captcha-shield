/**
 * CAPTCHA Shield v4.0 "Fortress" — CDN Integration Types
 *
 * Type definitions for CDN deployment configuration of the CAPTCHA Shield
 * widget script. Supports jsDelivr and unpkg as CDN providers with
 * version-pinned URLs, SRI hashes, and auto-detection of the latest version.
 */

// ─── CDN Provider ──────────────────────────────────────────────────────────────

/**
 * Supported CDN providers for hosting the CAPTCHA Shield widget script.
 *
 * - `jsdelivr` — jsDelivr CDN (default). Fast global CDN with npm mirroring,
 *   SNI-based SSL, and multi-origin fallback.
 * - `unpkg` — unpkg CDN. Simple npm-based CDN with automatic directory
 *   listing and file serving.
 */
export type CDNProvider = 'jsdelivr' | 'unpkg';

// ─── CDN Options ───────────────────────────────────────────────────────────────

/**
 * Options for generating CDN URLs and script tags.
 *
 * @example
 * ```ts
 * const url = getCDNUrl({
 *   provider: 'jsdelivr',
 *   version: '4.0.0',
 *   minified: true,
 * });
 * // => 'https://cdn.jsdelivr.net/npm/captcha-shield@4.0.0/v4/widget.min.js'
 * ```
 */
export interface CDNOptions {
  /** CDN provider to use. Defaults to `'jsdelivr'`. */
  provider?: CDNProvider;

  /** Package version to pin. Defaults to `'latest'`. */
  version?: string;

  /**
   * Whether to use the minified build (`widget.min.js`).
   * When `true`, the URL points to the `.min.js` variant.
   * Defaults to `true`.
   */
  minified?: boolean;

  /**
   * Custom path to the widget script within the npm package.
   * Defaults to `'v4/widget.js'` (or `'v4/widget.min.js'` if minified).
   */
  customPath?: string;

  /**
   * Subresource Integrity hash algorithm to use.
   * Only relevant when generating script tags with SRI.
   * Defaults to `'sha384'`.
   */
  integrityAlgorithm?: 'sha256' | 'sha384' | 'sha512';

  /**
   * Whether to include `crossorigin="anonymous"` on the script tag.
   * Required for SRI to work with CDN resources.
   * Defaults to `true`.
   */
  crossOrigin?: boolean;

  /**
   * Whether to add `async` and `defer` attributes to the script tag.
   * Defaults to `true`.
   */
  asyncDefer?: boolean;
}

// ─── CDN Config ────────────────────────────────────────────────────────────────

/**
 * Full CDN configuration with resolved URLs and metadata.
 *
 * This is the resolved output after processing `CDNOptions`, containing
 * all derived values such as the final URL, SRI hash, and version info.
 */
export interface CDNConfig {
  /** The CDN provider used. */
  provider: CDNProvider;

  /** The resolved version string (may differ from input if `'latest'` was used). */
  version: string;

  /** The full URL to the widget script on the CDN. */
  url: string;

  /** The Subresource Integrity hash string (e.g., `sha384-abc123...`). */
  sriHash: string | null;

  /** The algorithm used for the SRI hash. */
  integrityAlgorithm: 'sha256' | 'sha384' | 'sha512';

  /** Whether this config uses a minified build. */
  minified: boolean;

  /** The complete `<script>` tag HTML string with SRI attributes. */
  scriptTag: string;

  /** The CSP `<meta>` tag for allowing the CDN domain. */
  metaTag: string;

  /** Timestamp when this config was resolved. */
  resolvedAt: number;
}

// ─── CDN Provider URL Templates ────────────────────────────────────────────────

/**
 * URL templates for each CDN provider.
 * `{version}` and `{path}` are replaced at runtime.
 */
export const CDN_URL_TEMPLATES: Record<CDNProvider, string> = {
  jsdelivr: 'https://cdn.jsdelivr.net/npm/captcha-shield@{version}/{path}',
  unpkg: 'https://unpkg.com/captcha-shield@{version}/{path}',
};

// ─── NPM Registry ──────────────────────────────────────────────────────────────

/**
 * The npm registry endpoint used for auto-detecting the latest version.
 */
export const NPM_REGISTRY_URL = 'https://registry.npmjs.org/captcha-shield/latest';
