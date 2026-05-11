# Security Model / Modelo de Seguridad

## What CAPTCHA Shield Protects Today

CAPTCHA Shield is designed as a **client-side friction layer** that provides:

1. **Bot Detection Heuristics**: 14 behavioral signals analyze interaction patterns
2. **Challenge Response**: 7 interactive challenges that require human-like behavior
3. **Device Fingerprinting**: WebGL, Canvas, and API detection
4. **Headless Browser Detection**: Automation framework signatures
5. **QR Mobile Fallback**: Physical device verification

**Best for**: Demo applications, lightweight friction, educational projects, widget integration.

## What CAPTCHA Shield Does NOT Protect Against

CAPTCHA Shield is **NOT production-grade security**. For production, you **MUST** add server-side verification.

**Does NOT protect against**:
- Server-side brute force attacks
- Replaying captured tokens
- Network-based bypass (proxies, man-in-the-middle)
- Credential stuffing attacks
- Automated form submissions (without client interaction)
- Distributed bot networks with real browsers

## Threat Model

| Threat | Risk Level | CAPTCHA Shield Response |
|--------|------------|------------------------|
| Simple bots (no JS) | High | ❌ Blocked by embed script |
| Headless browsers | Medium | ⚠️ Detection possible |
| AI-driven automation | Medium | ⚠️ Behavioral signals help |
| Replayed tokens | Low | ❌ No server-side validation |
| Proxy rotation | Low | ❌ No protection |
| Distributed bots | Low | ❌ No coordination detection |

## Recommended Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CAPTCHA Shield Widget (public/widget.js)           │   │
│  │  - Behavioral analysis (14 signals)                 │   │
│  │  - Challenge generation & verification              │   │
│  │  - Risk scoring (client-side)                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ postMessage / fetch
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend Server                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Token Validation                                │   │
│  │     - Signature verification                        │   │
│  │     - Nonce expiry (TTL < 30s)                      │   │
│  │     - Replay protection                             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  2. Rate Limiting                                   │   │
│  │     - Per-IP, per-session limits                    │   │
│  │     - Exponential backoff                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  3. Log Analysis                                    │   │
│  │     - Correlate client + server signals             │   │
│  │     - Alert thresholds                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Token System Design (for Production)

### Signed Tokens

```
token = base64url({
  userId: string,
  timestamp: number,
  challengeType: string,
  clientRisk: number,
  serverRisk: number | null,
  signature: HMAC-SHA256(secret, content)
})
```

### Nonce System

1. Generate `nonce = randomBytes(32).toString('hex')`
2. Store in Redis: `SETEX nonce:${nonce} 30 "pending"`
3. Include nonce in challenge response
4. On backend: verify nonce exists and is unexpired

### TTL Recommendations

| Environment | Max TTL | Notes |
|-------------|---------|-------|
| Development | 300s | 5 minutes |
| Staging | 180s | 3 minutes |
| Production | 30s | 30 seconds max |
| Critical Actions | 15s | Forms, payments, admin |

### Replay Protection

1. Track used tokens in Redis: `HSET tokens ${userId} ${token} ${expiresAt}`
2. Reject if token exists or expired
3. Use separate namespace per action type

### Rate Limiting

```javascript
// Example: Redis-based rate limiter
const limiter = new RateLimiterRedis({
  keyPrefix: 'captcha:',
  points: 5,         // 5 attempts
  duration: 60,      // per 60 seconds
});

await limiter.consume(ip);
```

## Privacy Considerations

### What Data is Collected (Client-Side Only)

- Mouse coordinates (relative to element)
- Keyboard event timing
- Scroll position changes
- Canvas rendering patterns
- WebGL renderer strings
- User agent and screen dimensions
- Time spent on challenge
- Challenge response time

### What Data is NEVER Collected

- IP addresses (client-side only)
- Cookies or local storage (except temporary session)
- Personal identifiers
- Passwords or secrets
- Network traffic content

### Data Retention

- **Client-side**: localStorage cleared on session end (5 min max)
- **Server-side**: Logs rotated weekly, deleted after 30 days

## API Security Checklist (Production)

- [ ] All API endpoints use HTTPS
- [ ] CORS restricted to domain whitelist
- [ ] Rate limiting enabled per endpoint
- [ ] Authentication required for admin endpoints
- [ ] Input validation on all user-supplied data
- [ ] Error messages generic (no stack traces)
- [ ] CORS preflight requests handled
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] CSRF tokens for state-changing operations
- [ ] Audit logs for security events

## Known Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|-----------|
| DOM manipulation | Signature verification on server |
| Script injection | CSP with `'self'` only |
| Cross-origin requests | SameSite cookies, origin checks |
| Token reuse | Single-use nonce system |
| Time shifting | TTL-based expiration |
| Bot farms | Behavioral anomaly detection |
| Headless browsers | Advanced fingerprinting |
| AI bypass | Multi-layer challenge system |

---

**Disclaimer**: CAPTCHA Shield provides **deterrence and friction**, not absolute security. For production applications, always combine with server-side verification.

**Descargo**: CAPTCHA Shield ofrece **disuasión y fricción**, no seguridad absoluta. Para aplicaciones en producción, combínalo siempre con verificación en servidor.
