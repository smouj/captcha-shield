# Production Backend Plan / Plan de Backend en Producción

## Overview / Visión General

This document outlines the plan to upgrade CAPTCHA Shield from a client-side demo to a production-grade security system.

Este documento describe el plan para mejorar CAPTCHA Shield de un demo client-side a un sistema de seguridad en producción.

## Current Limitations / Limitaciones Actuales

| Issue | Impact | Priority |
|-------|--------|----------|
| No server-side verification | Medium | High |
| No token signing | High | Critical |
| No rate limiting | High | Critical |
| No nonce/nonce validation | High | Critical |
| No audit logging | Medium | Medium |
| No distributed bot detection | Low | Low |

## Phase 1: Core Backend (Week 1-2)

### Requirements

```bash
# Backend stack recommendation
Next.js API Routes OR Express.js + Redis
- Language: Node.js 20+
- Storage: Redis (session/token storage)
- Database: PostgreSQL (audit logs, rate limiting)
- Security: JWT signing, HMAC validation
```

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/captcha/generate` | POST | None | Generate challenge + signed token |
| `/api/captcha/verify` | POST | None | Verify solution + signature |
| `/api/captcha/stats` | GET | Admin | Analytics endpoint |
| `/api/captcha/config` | GET | None | Widget configuration |
| `/api/audit/log` | POST | None | Audit log entries |

### Token System

#### Generation Flow

1. Client requests challenge: `POST /api/captcha/generate`
2. Server generates challenge + metadata
3. Server creates signed token:

```typescript
// Token structure
interface CaptchaToken {
  challengeId: string;
  userId: string; // Random UUID per session
  timestamp: number;
  challengeType: ChallengeType;
  clientRisk: number;
  challengeData: ChallengeData;
}

// Signed token
const token = sign(captchaToken, serverPrivateKey);
```

4. Token returned to client with challenge data

#### Verification Flow

1. Client submits challenge + token: `POST /api/captcha/verify`
2. Server verifies signature: `verify(token, serverPrivateKey)`
3. Server checks nonce expiration (TTL < 30s)
4. Server validates challenge solution
5. Server calculates server-side risk score
6. Server returns verified/failure + new token

### Rate Limiting

```typescript
// Redis-based rate limiter
const limiter = new RateLimiterRedis({
  keyPrefix: 'captcha:',
  points: 10,                    // 10 challenges per window
  duration: 60,                  // per 60 seconds
  blockDuration: 300,           // block for 5 minutes after limit
});

// Usage
await limiter.consume(ipAddress);
```

## Phase 2: Advanced Features (Week 3-4)

### Distributed Detection

```typescript
// Track multiple requests from same fingerprint
interface UserFingerprint {
  id: string;
  ip: string;
  userAgent: string;
  canvasHash: string;
  webglHash: string;
  firstSeen: Date;
  requestCount: number;
}

// Anomaly detection
if (requestCount > 100 && timeSinceFirst < 60) {
  alert('Potential bot farm detected');
  blockIp(ip);
}
```

### Behavioral Analysis Backend

```typescript
// Combine client + server signals
interface CombinedRiskScore {
  clientSignals: BehavioralSignal[];
  serverSignals: ServerSignal[];
  calculatedRisk: number;
  decision: 'allow' | 'challenge' | 'block';
  reason: string;
}

function calculateServerRisk(clientData: ClientData): ServerRisk {
  const serverSignals = [
    { type: 'rate_limit_exceeded', weight: 0.3 },
    { type: 'geographic_anomaly', weight: 0.2 },
    { type: 'device_anomaly', weight: 0.2 },
    { type: 'timing_anomaly', weight: 0.3 },
  ];
  
  // Calculate weighted score
  return calculateWeightedScore(serverSignals);
}
```

### Audit Logging

```typescript
interface AuditLog {
  timestamp: Date;
  ip: string;
  userAgent: string;
  eventType: 'challenge_requested' | 'challenge_verified' | 'challenge_failed' | 'rate_limited';
  challengeType: string;
  riskScore: number;
  decision: string;
  details: Record<string, any>;
}

// Store in PostgreSQL
INSERT INTO audit_logs (...)
VALUES (...);
```

## Phase 3: Security Hardening (Week 5)

### Security Headers

```nginx
# Nginx / Express headers
add_header Content-Security-Policy "default-src 'self'";
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

### Input Validation

```typescript
// Zod schema validation
const VerifySchema = z.object({
  token: z.string().min(100),  // Signed token
  solution: z.record(z.string()),
  clientRisk: z.number().min(0).max(100),
  nonce: z.string().uuid(),
  timestamp: z.number().int().positive(),
});

type VerifyRequest = z.infer<typeof VerifySchema>;
```

### SQL Injection Prevention

```typescript
// Always use parameterized queries
const query = 'INSERT INTO audit_logs (...) VALUES ($1, $2, $3)';
await db.query(query, [values]);
```

## Phase 4: Deployment (Week 6)

### Infrastructure

```bash
# Recommended stack
- Backend: Vercel Serverless Functions OR Railway/Render
- Storage: Redis Cloud (free tier)
- Database: Supabase (PostgreSQL)
- Monitoring: Sentry + Logflare
- CDN: Cloudflare
```

### Environment Variables

```bash
# .env.production
CAPTCHA_SECRET_KEY=your-secure-secret-key
CAPTCHA_PUBLIC_KEY=your-public-key
REDIS_URL=redis://... (from Redis Cloud)
DATABASE_URL=postgres://... (from Supabase)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_POINTS=10
RATE_LIMIT_WINDOW=60
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - uses: vercel/actions/upload@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## Testing Checklist

- [ ] Token generation produces unique signatures
- [ ] Token verification rejects tampered tokens
- [ ] Rate limiting blocks excessive requests
- [ ] Nonce expiration prevents replay attacks
- [ ] Server-side risk calculation is accurate
- [ ] Audit logs capture all events
- [ ] Security headers are present
- [ ] Input validation rejects invalid data
- [ ] Database queries are parameterized
- [ ] Secrets are never logged
- [ ] Error messages are generic (no stack traces)

## Migration Path

| Phase | Status | Notes |
|-------|--------|-------|
| Token generation | ✅ Planned | Use JWT or NaCl |
| Token verification | ✅ Planned | Verify signatures |
| Rate limiting | ✅ Planned | Redis-based |
| Nonce system | ✅ Planned | TTL < 30s |
| Audit logging | ✅ Planned | PostgreSQL |
| Distributed detection | ❌ Future | Behavioral analysis |
| Admin dashboard | ❌ Future | Analytics UI |

## Security Checklist (Production)

- [ ] HTTPS enforced (HSTS header)
- [ ] CORS restricted to domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Security headers set
- [ ] Error messages generic
- [ ] Secrets in environment variables
- [ ] Database connection secure
- [ ] Audit logging enabled
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] Security scanning in CI/CD

## Cost Estimation

| Service | Estimated Cost |
|---------|----------------|
| Redis Cloud | $5/mo (500MB) |
| Supabase | $25/mo (500k rows) |
| Vercel (serverless) | Free (500k req/mo) |
| Sentry | Free (10k events/mo) |
| **Total** | **~$30/mo** |

## Success Metrics

| Metric | Target |
|--------|--------|
| Block rate | >95% (bots) |
| False positive rate | <1% |
| Average challenge time | <30s |
| API latency | <100ms |
| Uptime | 99.9% |

---

**Next Steps**:

1. Set up backend repository
2. Implement token generation + signing
3. Add Redis storage
4. Implement rate limiting
5. Add audit logging
6. Write security tests
7. Deploy to staging
8. Load testing
9. Security audit
10. Production deployment

---

**Disclaimer**: This plan is a starting point. Adjust based on your specific requirements, traffic volume, and security needs.

**Descargo**: Este plan es un punto de partida. Ajusta según tus requisitos específicos, volumen de tráfico y necesidades de seguridad.
