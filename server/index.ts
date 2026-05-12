/**
 * CAPTCHA Shield v4.0 "Fortress" — Server Verification Module
 * 
 * Usage:
 *   import { verifyCaptchaShieldToken } from 'captcha-shield-server';
 *   const result = await verifyCaptchaShieldToken(token, secretKey);
 */

import { createHmac, timingSafeEqual } from 'crypto';

// Types
export interface TokenPayload {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  nbf: number;
  jti: string;
  risk: number;
  challenge: string;
  verified: string[];
  fp: string;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  payload?: TokenPayload;
  expiresAt?: number;
  riskScore?: number;
}

export interface ServerConfig {
  secretKey: string;
  issuer?: string;
  maxTokenAge?: number;        // seconds, default 60
  maxRiskScore?: number;       // 0-1, default 0.85
  requiredLayers?: string[];   // verification layers that must be present
  replayProtection?: boolean;  // default true
}

// Replay protection store
const usedTokens = new Map<string, number>();
const REPLAY_TTL = 120_000; // 2 minutes

function cleanupReplayStore(): void {
  const now = Date.now();
  for (const [jti, exp] of usedTokens) {
    if (now > exp) usedTokens.delete(jti);
  }
}

function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

function base64urlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Verify a CAPTCHA Shield v4.0 token
 * 
 * @param tokenString - The JWT token string to verify
 * @param config - Server configuration including secret key
 * @returns Verification result with validity status and payload
 */
export async function verifyCaptchaShieldToken(
  tokenString: string,
  config: ServerConfig,
): Promise<VerificationResult> {
  // Cleanup replay store periodically
  cleanupReplayStore();
  
  // 1. Parse token
  const parts = tokenString.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Invalid token format' };
  }
  
  const [headerB64, payloadB64, signatureB64] = parts;
  
  // 2. Decode header
  let header: Record<string, unknown>;
  try {
    header = JSON.parse(base64urlDecode(headerB64));
  } catch {
    return { valid: false, reason: 'Invalid token header' };
  }
  
  // 3. Verify algorithm
  if (header.alg !== 'HS256' || header.typ !== 'CSHIELD-V4') {
    return { valid: false, reason: 'Unsupported token algorithm or type' };
  }
  
  // 4. Verify signature
  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac('sha256', config.secretKey)
    .update(signingInput)
    .digest();
  const actualSig = Buffer.from(base64urlDecode(signatureB64), 'binary');
  
  try {
    if (!timingSafeEqual(expectedSig, actualSig)) {
      return { valid: false, reason: 'Invalid token signature' };
    }
  } catch {
    return { valid: false, reason: 'Signature verification failed' };
  }
  
  // 5. Decode payload
  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64));
  } catch {
    return { valid: false, reason: 'Invalid token payload' };
  }
  
  // 6. Verify expiration
  const now = Math.floor(Date.now() / 1000);
  const maxAge = config.maxTokenAge || 60;
  
  if (payload.exp && now > payload.exp) {
    return { valid: false, reason: 'Token expired' };
  }
  
  if (payload.iat && (now - payload.iat) > maxAge) {
    return { valid: false, reason: 'Token too old' };
  }
  
  // 7. Verify not-before
  if (payload.nbf && now < payload.nbf) {
    return { valid: false, reason: 'Token not yet valid' };
  }
  
  // 8. Verify issuer
  if (config.issuer && payload.iss !== config.issuer) {
    return { valid: false, reason: 'Invalid token issuer' };
  }
  
  // 9. Verify risk score
  const maxRisk = config.maxRiskScore ?? 0.85;
  if (payload.risk > maxRisk) {
    return { valid: false, reason: `Risk score too high: ${payload.risk.toFixed(2)} > ${maxRisk}` };
  }
  
  // 10. Verify required layers
  if (config.requiredLayers && config.requiredLayers.length > 0) {
    const verified = payload.verified || [];
    for (const required of config.requiredLayers) {
      if (!verified.includes(required)) {
        return { valid: false, reason: `Missing required verification layer: ${required}` };
      }
    }
  }
  
  // 11. Replay protection
  if (config.replayProtection !== false) {
    if (usedTokens.has(payload.jti)) {
      return { valid: false, reason: 'Token already used (replay detected)' };
    }
    usedTokens.set(payload.jti, Date.now() + REPLAY_TTL);
  }
  
  return {
    valid: true,
    payload,
    expiresAt: payload.exp,
    riskScore: payload.risk,
  };
}

/**
 * Express middleware for CAPTCHA Shield verification
 */
export function captchaShieldMiddleware(config: ServerConfig) {
  return async (req: { body: { captchaToken?: string } }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
    const token = req.body?.captchaToken;
    if (!token) {
      res.status(400).json({ error: 'Missing captcha token' });
      return;
    }
    
    const result = await verifyCaptchaShieldToken(token, config);
    if (!result.valid) {
      res.status(403).json({ error: 'Captcha verification failed', reason: result.reason });
      return;
    }
    
    next();
  };
}

/**
 * Next.js API route handler helper
 */
export function createCaptchaVerifier(config: ServerConfig) {
  return async function verifyHandler(token: string): Promise<VerificationResult> {
    return verifyCaptchaShieldToken(token, config);
  };
}
