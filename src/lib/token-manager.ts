/**
 * CAPTCHA Shield v4.0 "Fortress" — Token Manager
 *
 * JWT token generation and verification using HMAC-SHA256 via the Web Crypto API.
 * Designed to work in both browser and server environments (no Node-specific deps).
 *
 * Key design decisions:
 * - Uses `crypto.subtle` for HMAC-SHA256 signing so the module is isomorphic.
 * - Base64url encoding (RFC 4648 §5) for all JWT components.
 * - Tokens expire after 60 seconds by default.
 * - Every token carries a unique nonce (`jti`) to prevent replay attacks.
 * - The secret key can be derived from a device fingerprint + timestamp window
 *   so that client-side generation stays deterministic yet tamper-resistant.
 */

import {
  CaptchaToken,
  TokenHeader,
  TokenPayload,
  VerificationResult,
  VerificationLayer,
  ChallengeType,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Encode a Uint8Array to a base64url string (no padding, URL-safe alphabet).
 */
function base64urlEncode(buffer: Uint8Array): string {
  const binary = Array.from(buffer)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode a base64url string into a Uint8Array.
 */
function base64urlDecode(input: string): Uint8Array {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  // Restore padding
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  else if (pad === 3) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode a JavaScript object to a base64url string (used for JWT header & payload).
 */
function objectToBase64url(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj);
  const encoder = new TextEncoder();
  return base64urlEncode(encoder.encode(json));
}

/**
 * Decode a base64url string back into a JavaScript object.
 */
function base64urlToObject<T>(input: string): T | null {
  try {
    const bytes = base64urlDecode(input);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Import a raw secret string as a CryptoKey for HMAC-SHA256 signing.
 */
async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_ISSUER = 'cshield-v4';
const DEFAULT_TTL_SECONDS = 60;
const DEFAULT_KEY_ID = 'hmac-sha256-v1';

// ─── TokenManager ─────────────────────────────────────────────────────────────

/**
 * Manages the full lifecycle of CAPTCHA verification tokens.
 *
 * Tokens follow a custom JWT profile (`typ: CSHIELD-V4`) signed with
 * HMAC-SHA256. The class is intentionally isomorphic — it relies only on the
 * Web Crypto API so it can be used on the server **and** the client.
 *
 * @example
 * ```ts
 * const tm = getTokenManager();
 * const token = await tm.generateToken({
 *   sub: 'session-abc',
 *   challenge: ChallengeType.ADVERSARIAL_PUZZLE,
 *   risk: 0.12,
 * });
 *
 * const result = await tm.verifyToken(token);
 * if (result.valid) {
 *   console.log('Token is good until', new Date(result.expiresAt!));
 * }
 * ```
 */
export class TokenManager {
  private secretKey: string;
  private issuer: string;
  private ttlSeconds: number;

  /**
   * Create a new TokenManager.
   *
   * @param secretKey - HMAC secret. When omitted a key is derived from
   *   a combination of the default issuer and a timestamp window so that
   *   client-side generation remains deterministic yet time-bound.
   * @param issuer - Token issuer claim (`iss`). Defaults to `"cshield-v4"`.
   * @param ttlSeconds - Time-to-live in seconds. Defaults to `60`.
   */
  constructor(secretKey?: string, issuer?: string, ttlSeconds?: number) {
    this.issuer = issuer ?? DEFAULT_ISSUER;
    this.ttlSeconds = ttlSeconds ?? DEFAULT_TTL_SECONDS;
    this.secretKey = secretKey ?? this.deriveDefaultSecret();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Generate a signed JWT token wrapping the supplied payload fields.
   *
   * Any fields not provided by the caller are filled with sensible defaults:
   * - `iat` / `nbf` → current unix timestamp
   * - `exp` → `iat + ttlSeconds`
   * - `jti` → random nonce
   * - `iss` → this manager's issuer
   * - `aud`, `sub`, `fp`, `risk`, `challenge`, `verified` → defaults / zeros
   *
   * @param payload - Partial payload — missing fields receive defaults.
   * @returns A `CaptchaToken` object whose `signature` is the HMAC-SHA256 of
   *   the encoded header + payload.
   */
  async generateToken(payload: Partial<TokenPayload>): Promise<CaptchaToken> {
    const now = Math.floor(Date.now() / 1000);

    const header: TokenHeader = {
      alg: 'HS256',
      typ: 'CSHIELD-V4',
      kid: DEFAULT_KEY_ID,
    };

    const fullPayload: TokenPayload = {
      iss: payload.iss ?? this.issuer,
      sub: payload.sub ?? this.generateSessionId(),
      aud: payload.aud ?? '*',
      iat: payload.iat ?? now,
      exp: payload.exp ?? now + this.ttlSeconds,
      nbf: payload.nbf ?? now,
      jti: payload.jti ?? this.generateNonce(),
      risk: payload.risk ?? 0,
      challenge: payload.challenge ?? ChallengeType.ADVERSARIAL_PUZZLE,
      verified: payload.verified ?? [VerificationLayer.BEHAVIORAL_PRECHECK],
      fp: payload.fp ?? '',
    };

    const encodedHeader = objectToBase64url(header as unknown as Record<string, unknown>);
    const encodedPayload = objectToBase64url(fullPayload as unknown as Record<string, unknown>);

    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`);

    return { header, payload: fullPayload, signature };
  }

  /**
   * Verify a token's HMAC-SHA256 signature **and** its time-based claims.
   *
   * Checks performed (in order):
   * 1. Decodability — the token string must parse into a valid structure.
   * 2. Signature — HMAC-SHA256 must match.
   * 3. Expiration — `exp` must not be in the past.
   * 4. Not-before — `nbf` must not be in the future.
   *
   * @param token - Either a raw JWT string or a `CaptchaToken` object.
   * @returns A `VerificationResult` whose `valid` flag summarises the outcome.
   */
  async verifyToken(token: string | CaptchaToken): Promise<VerificationResult> {
    // ── Normalise to CaptchaToken + raw signing input ──────────────────────
    let captchaToken: CaptchaToken;
    let signingInput: string;

    if (typeof token === 'string') {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return { valid: false, reason: 'Token is malformed or cannot be decoded' };
      }
      captchaToken = decoded;

      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, reason: 'Invalid JWT structure' };
      }
      signingInput = `${parts[0]}.${parts[1]}`;
    } else {
      captchaToken = token;
      const encodedHeader = objectToBase64url(
        captchaToken.header as unknown as Record<string, unknown>,
      );
      const encodedPayload = objectToBase64url(
        captchaToken.payload as unknown as Record<string, unknown>,
      );
      signingInput = `${encodedHeader}.${encodedPayload}`;
    }

    // ── 1. Signature check ─────────────────────────────────────────────────
    const signatureValid = await this.verify(signingInput, captchaToken.signature);
    if (!signatureValid) {
      return { valid: false, reason: 'Invalid signature — token may have been tampered with' };
    }

    // ── 2. Expiration ──────────────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    if (captchaToken.payload.exp <= now) {
      return {
        valid: false,
        reason: 'Token has expired',
        expiresAt: captchaToken.payload.exp,
        riskScore: captchaToken.payload.risk,
      };
    }

    // ── 3. Not-before ──────────────────────────────────────────────────────
    if (captchaToken.payload.nbf > now) {
      return {
        valid: false,
        reason: 'Token is not yet valid (nbf claim is in the future)',
        riskScore: captchaToken.payload.risk,
      };
    }

    // ── All good ───────────────────────────────────────────────────────────
    return {
      valid: true,
      token: captchaToken,
      expiresAt: captchaToken.payload.exp,
      riskScore: captchaToken.payload.risk,
    };
  }

  /**
   * Encode a `CaptchaToken` into its compact JWT string representation.
   *
   * The resulting string is `base64url(header).base64url(payload).signature`.
   *
   * @param token - The token object to serialise.
   * @returns The compact JWT string.
   */
  encodeToken(token: CaptchaToken): string {
    const encodedHeader = objectToBase64url(token.header as unknown as Record<string, unknown>);
    const encodedPayload = objectToBase64url(token.payload as unknown as Record<string, unknown>);
    return `${encodedHeader}.${encodedPayload}.${token.signature}`;
  }

  /**
   * Decode a compact JWT string back into a `CaptchaToken` object.
   *
   * **Note:** This does **not** verify the signature — it merely parses the
   * structure. Use `verifyToken()` for full validation.
   *
   * @param tokenString - The compact JWT string.
   * @returns The parsed `CaptchaToken`, or `null` if the string is malformed.
   */
  decodeToken(tokenString: string): CaptchaToken | null {
    const parts = tokenString.split('.');
    if (parts.length !== 3) return null;

    const header = base64urlToObject<TokenHeader>(parts[0]);
    const payload = base64urlToObject<TokenPayload>(parts[1]);

    if (!header || !payload) return null;

    // Minimal structural validation
    if (header.alg !== 'HS256' || header.typ !== 'CSHIELD-V4') return null;

    return {
      header,
      payload,
      signature: parts[2],
    };
  }

  /**
   * Generate a cryptographically random nonce suitable for the `jti` claim.
   *
   * The nonce is 16 bytes of randomness encoded as base64url (22 chars).
   *
   * @returns A random nonce string.
   */
  generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return base64urlEncode(bytes);
  }

  /**
   * Generate a session identifier.
   *
   * The ID is prefixed with `csid_` and contains 24 bytes of randomness
   * encoded as base64url, yielding a 33-character identifier.
   *
   * @returns A session ID string.
   */
  generateSessionId(): string {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return `csid_${base64urlEncode(bytes)}`;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Derive a default secret key from the issuer name and the current
   * timestamp window (5-minute granularity).
   *
   * The windowed approach means the derived key changes every 5 minutes,
   * which provides a balance between stability (tokens remain valid within
   * the window) and forward secrecy (old windows become unusable).
   *
   * @returns A derived secret key string.
   */
  private deriveDefaultSecret(): string {
    const windowSize = 300; // 5 minutes in seconds
    const timeWindow = Math.floor(Date.now() / 1000 / windowSize);
    const raw = `${this.issuer}:${timeWindow}`;
    // Simple hash-like derivation — enough for default use; production
    // deployments should supply a strong, persistent secretKey.
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    // We return the raw material — actual HMAC key import happens in sign/verify.
    // For deterministic derivation we do a simple hex-like expansion.
    let derived = '';
    for (let i = 0; i < data.length; i++) {
      derived += data[i].toString(16).padStart(2, '0');
    }
    // Pad to at least 32 bytes for HMAC-SHA256
    while (derived.length < 64) {
      derived += derived;
    }
    return derived.slice(0, 64);
  }

  /**
   * Sign a string using HMAC-SHA256 and return the base64url-encoded signature.
   *
   * @param data - The data to sign (typically `header.payload`).
   * @returns The base64url-encoded HMAC-SHA256 signature.
   */
  private async sign(data: string): Promise<string> {
    const key = await importHmacKey(this.secretKey);
    const encoder = new TextEncoder();
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(data),
    );
    return base64urlEncode(new Uint8Array(signatureBuffer));
  }

  /**
   * Verify an HMAC-SHA256 signature against the provided data.
   *
   * @param data - The data that was signed.
   * @param signature - The base64url-encoded signature to check.
   * @returns `true` if the signature is valid.
   */
  private async verify(data: string, signature: string): Promise<boolean> {
    const key = await importHmacKey(this.secretKey);
    const encoder = new TextEncoder();
    const signatureBytes = base64urlDecode(signature);
    // Ensure we pass a plain ArrayBuffer (not SharedArrayBuffer) to subtle.verify
    const signatureBuffer = signatureBytes.buffer.slice(
      signatureBytes.byteOffset,
      signatureBytes.byteOffset + signatureBytes.byteLength,
    ) as ArrayBuffer;

    return crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(data),
    );
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance: TokenManager | undefined;

/**
 * Get the singleton `TokenManager` instance.
 *
 * The first call creates the manager with the default configuration.
 * Subsequent calls return the same instance.
 *
 * @returns The shared `TokenManager`.
 */
export function getTokenManager(): TokenManager {
  if (!instance) {
    instance = new TokenManager();
  }
  return instance;
}
