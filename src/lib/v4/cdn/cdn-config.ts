/**
 * CAPTCHA Shield v4.0 "Fortress" — CDN Configuration Module
 *
 * Provides utilities for generating CDN URLs, Subresource Integrity (SRI) hashes,
 * and complete `<script>` tags for embedding the CAPTCHA Shield widget via CDN.
 *
 * Supported CDN providers:
 * - **jsDelivr** — Global CDN with npm mirroring and SNI-based SSL.
 * - **unpkg** — Simple npm-based CDN with automatic file serving.
 *
 * @example
 * ```ts
 * import { getCDNUrl, generateScriptTag, getSRIHash } from '@/lib/v4/cdn/cdn-config';
 *
 * // Get a version-pinned CDN URL
 * const url = getCDNUrl({ provider: 'jsdelivr', version: '4.0.0' });
 *
 * // Generate an SRI hash for local file content
 * const sri = getSRIHash(fileContent);
 *
 * // Generate a complete script tag with SRI
 * const tag = generateScriptTag({ provider: 'jsdelivr', version: '4.0.0' });
 * ```
 */

import {
  CDNOptions,
  CDNConfig,
  CDNProvider,
  CDN_URL_TEMPLATES,
  NPM_REGISTRY_URL,
} from './types';

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_VERSION = '4.0.0';
const DEFAULT_PROVIDER: CDNProvider = 'jsdelivr';
const DEFAULT_INTEGRITY_ALGORITHM = 'sha384';
const DEFAULT_MINIFIED_PATH = 'v4/widget.min.js';
const DEFAULT_PATH = 'v4/widget.js';

// ─── Latest Version Cache ──────────────────────────────────────────────────────

let latestVersionCache: { version: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Helper: Resolve Widget Path ───────────────────────────────────────────────

/**
 * Resolve the widget script path based on options.
 *
 * @param options - CDN options containing `minified` and `customPath`.
 * @returns The path within the npm package.
 */
function resolvePath(options: CDNOptions): string {
  if (options.customPath) return options.customPath;
  return options.minified !== false ? DEFAULT_MINIFIED_PATH : DEFAULT_PATH;
}

// ─── Helper: Base64 Encode Uint8Array ──────────────────────────────────────────

/**
 * Encode a `Uint8Array` as a standard base64 string.
 *
 * @param buffer - The byte array to encode.
 * @returns A base64-encoded string.
 */
function base64Encode(buffer: Uint8Array): string {
  const binary = Array.from(buffer)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  return btoa(binary);
}

// ─── getCDNUrl ─────────────────────────────────────────────────────────────────

/**
 * Generate a CDN URL for the CAPTCHA Shield widget script.
 *
 * Builds a version-pinned URL pointing to the widget script on the specified
 * CDN provider. If `version` is `'latest'`, the function will attempt to
 * auto-detect the latest version from the npm registry (with caching).
 *
 * @param options - Configuration options for the CDN URL.
 * @returns The full CDN URL string.
 *
 * @example
 * ```ts
 * getCDNUrl({ provider: 'jsdelivr', version: '4.0.0', minified: true });
 * // => 'https://cdn.jsdelivr.net/npm/captcha-shield@4.0.0/v4/widget.min.js'
 *
 * getCDNUrl({ provider: 'unpkg', version: '4.0.0' });
 * // => 'https://unpkg.com/captcha-shield@4.0.0/v4/widget.min.js'
 *
 * getCDNUrl({ customPath: 'v4/widget.debug.js', version: '4.0.0' });
 * // => 'https://cdn.jsdelivr.net/npm/captcha-shield@4.0.0/v4/widget.debug.js'
 * ```
 */
export function getCDNUrl(options: CDNOptions = {}): string {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  const version = options.version ?? DEFAULT_VERSION;
  const path = resolvePath(options);

  const template = CDN_URL_TEMPLATES[provider];
  return template.replace('{version}', version).replace('{path}', path);
}

// ─── getSRIHash ────────────────────────────────────────────────────────────────

/**
 * Generate a Subresource Integrity (SRI) hash from script content.
 *
 * Uses the Web Crypto API to compute a SHA hash of the provided content and
 * returns the SRI string in the format `{algorithm}-{base64_hash}`.
 *
 * This function is isomorphic and works in both browser and Node.js environments
 * (as long as `crypto.subtle` is available).
 *
 * @param content - The JavaScript source code to hash.
 * @param algorithm - The hash algorithm to use. Defaults to `'sha384'`.
 * @returns A promise that resolves to the SRI hash string (e.g., `sha384-abc123...`).
 *
 * @example
 * ```ts
 * const content = await fetch('/v4/widget.min.js').then(r => r.text());
 * const sri = await getSRIHash(content, 'sha384');
 * // => 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC'
 * ```
 */
export async function getSRIHash(
  content: string,
  algorithm: 'sha256' | 'sha384' | 'sha512' = DEFAULT_INTEGRITY_ALGORITHM,
): Promise<string> {
  const algorithmMap: Record<string, string> = {
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
  };

  const cryptoAlgorithm = algorithmMap[algorithm];
  const encoder = new TextEncoder();
  const data = encoder.encode(content);

  const hashBuffer = await crypto.subtle.digest(cryptoAlgorithm, data);
  const hashArray = new Uint8Array(hashBuffer);
  const base64 = base64Encode(hashArray);

  return `${algorithm}-${base64}`;
}

// ─── fetchLatestVersion ────────────────────────────────────────────────────────

/**
 * Auto-detect the latest version of `captcha-shield` from the npm registry.
 *
 * Results are cached for 5 minutes to avoid excessive API calls.
 *
 * @returns A promise that resolves to the latest version string, or falls
 *   back to `DEFAULT_VERSION` if the registry is unreachable.
 */
export async function fetchLatestVersion(): Promise<string> {
  // Return cached version if still fresh
  if (latestVersionCache && Date.now() - latestVersionCache.fetchedAt < CACHE_TTL_MS) {
    return latestVersionCache.version;
  }

  try {
    const response = await fetch(NPM_REGISTRY_URL, {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`Registry returned ${response.status}`);
    }

    const data = await response.json() as { version?: string };
    const version = data.version;

    if (version && /^\d+\.\d+\.\d+/.test(version)) {
      latestVersionCache = { version, fetchedAt: Date.now() };
      return version;
    }

    throw new Error('Invalid version format in registry response');
  } catch {
    // Fallback to cached version or default
    return latestVersionCache?.version ?? DEFAULT_VERSION;
  }
}

// ─── resolveCDNConfig ──────────────────────────────────────────────────────────

/**
 * Fully resolve CDN configuration including URL, SRI hash, and HTML tags.
 *
 * This is the most comprehensive function — it resolves the CDN URL, attempts
 * to fetch the script content to compute a real SRI hash, and generates both
 * the `<script>` tag and the CSP `<meta>` tag.
 *
 * If the script content cannot be fetched (e.g., in a build environment),
 * the `sriHash` will be `null` and the script tag will omit the `integrity`
 * attribute.
 *
 * @param options - CDN options.
 * @returns A promise that resolves to a complete `CDNConfig`.
 */
export async function resolveCDNConfig(options: CDNOptions = {}): Promise<CDNConfig> {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  const minified = options.minified !== false;
  const integrityAlgorithm = options.integrityAlgorithm ?? DEFAULT_INTEGRITY_ALGORITHM;
  const crossOrigin = options.crossOrigin !== false;
  const asyncDefer = options.asyncDefer !== false;

  // Resolve version
  let version = options.version ?? DEFAULT_VERSION;
  if (version === 'latest') {
    version = await fetchLatestVersion();
  }

  const url = getCDNUrl({ ...options, version });

  // Try to fetch content for SRI hash
  let sriHash: string | null = null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const content = await response.text();
      sriHash = await getSRIHash(content, integrityAlgorithm);
    }
  } catch {
    // SRI hash unavailable — script tag will omit integrity attribute
  }

  // Build script tag
  const scriptAttrs: string[] = [
    `src="${url}"`,
  ];

  if (sriHash) {
    scriptAttrs.push(`integrity="${sriHash}"`);
  }
  if (crossOrigin) {
    scriptAttrs.push('crossorigin="anonymous"');
  }
  if (asyncDefer) {
    scriptAttrs.push('async', 'defer');
  }

  const scriptTag = `<script ${scriptAttrs.join(' ')}></` + `script>`;

  // Build CSP meta tag
  const cspDomain = provider === 'jsdelivr'
    ? 'cdn.jsdelivr.net'
    : 'unpkg.com';
  const metaTag = `<meta http-equiv="Content-Security-Policy" content="script-src 'self' ${cspDomain};">`;

  return {
    provider,
    version,
    url,
    sriHash,
    integrityAlgorithm,
    minified,
    scriptTag,
    metaTag,
    resolvedAt: Date.now(),
  };
}

// ─── generateScriptTag ─────────────────────────────────────────────────────────

/**
 * Generate a complete `<script>` tag for embedding the CAPTCHA Shield widget
 * via CDN, optionally with Subresource Integrity (SRI).
 *
 * If `options.version` is `'latest'`, this function will auto-detect the
 * latest version from npm. If SRI hash computation fails (e.g., the CDN
 * resource is unreachable), the tag is still generated but without the
 * `integrity` attribute.
 *
 * @param options - CDN options including provider, version, and SRI settings.
 * @returns A promise that resolves to the `<script>` HTML tag string.
 *
 * @example
 * ```ts
 * const tag = await generateScriptTag({ provider: 'jsdelivr', version: '4.0.0' });
 * // => '<script src="https://cdn.jsdelivr.net/npm/captcha-shield@4.0.0/v4/widget.min.js"
 * //      integrity="sha384-..." crossorigin="anonymous" async defer><\/script>'
 * ```
 */
export async function generateScriptTag(options: CDNOptions = {}): Promise<string> {
  const config = await resolveCDNConfig(options);
  return config.scriptTag;
}

// ─── getIntegrityMeta ──────────────────────────────────────────────────────────

/**
 * Generate a `<meta>` tag for Content Security Policy that allows the
 * specified CDN domain as a script source.
 *
 * This meta tag should be placed in the `<head>` of the HTML document
 * to allow the CDN-hosted widget script to execute.
 *
 * @param options - CDN options. Only `provider` is used to determine the domain.
 * @returns The `<meta>` HTML tag string for CSP.
 *
 * @example
 * ```ts
 * const meta = getIntegrityMeta({ provider: 'jsdelivr' });
 * // => '<meta http-equiv="Content-Security-Policy" content="script-src \'self\' cdn.jsdelivr.net;">'
 * ```
 */
export function getIntegrityMeta(options: CDNOptions = {}): string {
  const provider = options.provider ?? DEFAULT_PROVIDER;
  const cspDomain = provider === 'jsdelivr'
    ? 'cdn.jsdelivr.net'
    : 'unpkg.com';
  return `<meta http-equiv="Content-Security-Policy" content="script-src 'self' ${cspDomain};">`;
}
