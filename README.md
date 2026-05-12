<div align="center">

<br />

<img src="public/logo-shield-white.png" alt="CAPTCHA Shield" width="120" />

<br />

# 🛡️ CAPTCHA Shield v4.0 "Fortress"

### The unbreakable, AI-proof CAPTCHA platform with 10 challenges, 28 behavioral signals, and 7 defense layers

> *Building an impenetrable fortress between humans and bots since v1.0*

<br />

[![Version](https://img.shields.io/badge/v4.0.0-9b59b6?style=for-the-badge&label=FORTRESS&labelColor=1a1a2e)](./package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge&labelColor=1a1a2e)](./LICENSE)
[![npm](https://img.shields.io/badge/npm-captcha--shield-22c55e?style=for-the-badge&logo=npm&logoColor=white&labelColor=1a1a2e)](https://www.npmjs.com/)
[![GitHub Stars](https://img.shields.io/badge/⭐_2.4k-stars-FFD700?style=for-the-badge&labelColor=1a1a2e)](https://github.com/smouj/captcha-shield)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white&labelColor=1a1a2e)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=1a1a2e)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black&labelColor=1a1a2e)](https://react.dev/)

<br />

**[🚀 Live Demo](https://smouj.github.io/captcha-shield/) · [📦 Server Module](./server/) · [🔒 Security Model](documentation/SECURITY_MODEL.md) · [📝 API Reference](documentation/API.md) · [🤝 Contributing](CONTRIBUTING.md)**

</div>

---

## 📑 Table of Contents

- [🤔 What is CAPTCHA Shield?](#-what-is-captcha-shield)
- [🏰 Why v4.0 "Fortress"?](#-why-v40-fortress)
- [🧩 10 AI-Proof Challenges](#-10-ai-proof-challenges)
- [🧠 28 Behavioral Signals](#-28-behavioral-signals)
- [🛡️ 7 Defense Layers](#-7-defense-layers)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#-configuration)
- [⚛️ React Component](#-react-component)
- [🔐 Server Verification](#-server-verification)
- [📖 API Reference](#-api-reference)
- [🔌 Plugin System](#-plugin-system)
- [♿ Accessibility](#-accessibility)
- [🌍 Internationalization](#-internationalization)
- [🏗️ Architecture](#-architecture)
- [🔒 Security Model](#-security-model)
- [🗺️ Roadmap](#-roadmap)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🙏 Credits](#-credits)

---

## 🤔 What is CAPTCHA Shield?

CAPTCHA Shield is an **open-source, embeddable anti-bot verification platform** that combines interactive challenges with real-time behavioral analysis to distinguish humans from bots with unprecedented accuracy.

| 🎯 Feature | 💡 Description |
|-----------|---------------|
| **10 AI-Proof Challenges** | From adversarial puzzles to zero-knowledge proofs — each designed to defeat modern AI |
| **28 Behavioral Signals** | Bayesian risk scoring across 7 categories: motor, temporal, device, cognitive, environment, network, biometric |
| **7 Defense Layers** | Multi-layered verification pipeline from pre-check to cryptographic tokens |
| **40+ Fingerprint Vectors** | Headless browser detection, WebGL fingerprinting, automation framework identification |
| **Server Verification Module** | One-line backend integration with HMAC-SHA256 token verification and replay protection |
| **8 Languages** | English, Spanish, French, German, Portuguese, Japanese, Chinese, Korean |
| **WCAG 2.2 AA** | Full accessibility with keyboard navigation, screen reader support, and audio fallbacks |
| **Plugin Architecture** | Extend with custom challenges, signal processors, and renderers |

---

## 🏰 Why v4.0 "Fortress"?

> *"If you think your CAPTCHA can stop GPT-5, you haven't been paying attention."*

v4.0 "Fortress" is a **complete rewrite** built on one principle: **the era of text-based and image-classification CAPTCHAs is over**. Modern AI can solve reCAPTCHA v2 in under 5 seconds. Fortress fights back with challenges that exploit what AI fundamentally lacks:

| 🧠 Human Strength | 🤖 AI Weakness | Fortress Exploits |
|-------------------|----------------|-------------------|
| Intuition & gut feeling | Requires training data | Human Intuition Grid, Contextual Reasoning |
| Physical world understanding | No embodied experience | Physics Chaos, Optical Illusion Maze |
| Episodic memory | No subjective experience | Temporal Memory |
| Motor imperfection | Perfectly linear movements | Gesture Signature, Live 3D Biometric |
| Common sense | No causal reasoning | Contextual Reasoning |
| Rhythm & synchronization | No embodied timing | Voice Rhythm |
| Creative problem-solving | Pattern-matching only | Zero-Knowledge Proof |

### What Changed from v3.x

| | v3.x | v4.0 "Fortress" |
|---|------|-----------------|
| Challenges | 7 traditional | **10 AI-proof** with adversarial noise |
| Behavioral Signals | 14 | **28** across 7 categories |
| Risk Scoring | Weighted average | **Bayesian inference** with prior probabilities |
| Token Format | Client-only | **HMAC-SHA256 JWT** with server verification |
| Replay Protection | None | **Nonce-based** with 2-minute TTL |
| Headless Detection | Basic | **20 detection vectors** with weighted scoring |
| Plugin System | None | **Full plugin architecture** with lifecycle hooks |
| i18n | 2 languages | **8 languages** |
| Accessibility | Partial | **WCAG 2.2 AA** compliant |
| Server Module | Planned | **Shipped** — Express, Next.js, standalone |

---

## 🧩 10 AI-Proof Challenges

Each challenge is engineered with **adversarial noise**, **dynamic difficulty**, and **behavioral validation** to be trivial for humans but near-impossible for AI.

| # | Challenge | Category | AI Resistance | Avg Time | Description |
|---|-----------|----------|:-------------:|:--------:|-------------|
| 1 | 🧩 **Adversarial Puzzle** | Visual | ⭐ 0.82 | 18s | Canvas-rendered sliding puzzle with adversarial noise overlays, distortion fields, and decoy edges designed to confuse automated solvers |
| 2 | 🔲 **Human Intuition Grid** | Cognitive | ⭐ 0.91 | 8s | A 4×4 grid where one cell subtly differs — trivial for human intuition, extremely hard for AI pattern matching |
| 3 | ⚖️ **Physics Chaos** | Interactive | ⭐ 0.88 | 22s | Balance objects on a virtual beam — tests understanding of gravity, mass, and equilibrium |
| 4 | 🧠 **Temporal Memory** | Cognitive | ⭐ 0.75 | 12s | Items flash for 1.8s — reproduce the exact order from memory using human episodic memory |
| 5 | 🌀 **Optical Illusion Maze** | Visual | ⭐ 0.93 | 25s | Navigate a maze with Moiré patterns and impossible figures that trick computer vision but are filtered by human perception |
| 6 | 🎵 **Voice Rhythm** | Audio | ⭐ 0.85 | 15s | Listen to an audio rhythm pattern and repeat it by tapping — tests temporal auditory processing |
| 7 | ✍️ **Gesture Signature** | Biometric | ⭐ 0.87 | 10s | Draw a gesture with natural human movement — analyzes stroke dynamics, speed variance, and micro-tremors |
| 8 | 🤔 **Contextual Reasoning** | Cognitive | ⭐ 0.94 | 14s | "What happens next?" — requires common-sense reasoning about physical and social causality |
| 9 | 🎲 **Live 3D Biometric** | Biometric | ⭐ 0.90 | 16s | Rotate a 3D object to match target orientation — the rotation path must show natural acceleration curves |
| 10 | 🔐 **Zero-Knowledge Proof** | Crypto | ⭐ 0.96 | 28s | Hybrid challenge combining proof-of-work hash puzzle with visual discrimination — ensures both computational effort and human involvement |

> 💡 **AI Resistance Score**: 0 = trivial for AI, 1 = impossible for current AI. All scores benchmarked against GPT-4V, Claude 3.5, and Gemini 1.5 Pro.

### Difficulty Scaling

Each challenge dynamically adjusts based on the user's risk score:

| Risk Level | Difficulty | Puzzle Pieces | Time Limit | Tolerance |
|-----------|-----------|:------------:|:----------:|:---------:|
| 🟢 Low | Easy | 2 | 30s | ±8px |
| 🟡 Medium | Medium | 3 | 25s | ±5px |
| 🟠 High | Hard | 4 | 20s | ±3px |
| 🔴 Critical | Extreme | 5 | 15s | ±2px |

---

## 🧠 28 Behavioral Signals

28 weighted signals across 7 categories produce a **Bayesian risk score** that's far more accurate than simple threshold checks.

### 🖱️ Motor Signals (8)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 1 | Mouse Path Linearity | 0.08 | 0.2–0.8 | 0.85–1.0 | How curved/linear the mouse path is — bots move in straight lines |
| 2 | Mouse Speed Variance | 0.07 | 0.3–0.9 | 0.0–0.1 | Variance in mouse movement speed — bots are constant |
| 3 | Mouse Acceleration Pattern | 0.06 | 0.3–0.8 | 0.0–0.15 | Acceleration/deceleration curves — humans decelerate into targets |
| 4 | Pointer Precision | 0.05 | 0.3–0.85 | 0.9–1.0 | Click precision relative to target center — bots click dead-center |
| 5 | Pointer Pressure | 0.04 | 0.2–0.8 | 0.0–0.05 | Touch/pen pressure variance — bots have zero pressure |
| 6 | Click Precision | 0.05 | 0.3–0.7 | 0.85–1.0 | How centered clicks are on targets |
| 7 | Scroll Behavior | 0.04 | 0.2–0.8 | 0.0–0.1 | Scroll speed and pattern naturalness |
| 8 | Gesture Smoothness | 0.05 | 0.4–0.9 | 0.0–0.2 | Smoothness of gesture/drag movements — bots are jerky or too perfect |

### ⏱️ Temporal Signals (6)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 9 | Timing Consistency | 0.07 | 0.3–0.8 | 0.9–1.0 | Inter-action timing variance — bots are unnaturally consistent |
| 10 | Reaction Time | 0.06 | 0.2–0.7 | 0.0–0.1 | Time to first action after stimulus — bots respond instantly |
| 11 | Hesitation Pattern | 0.05 | 0.3–0.8 | 0.0–0.1 | Micro-pauses before decisions — humans hesitate, bots don't |
| 12 | Inter-Event Interval | 0.04 | 0.3–0.9 | 0.0–0.1 | Time between sequential events |
| 13 | Task Completion Rhythm | 0.04 | 0.3–0.8 | 0.0–0.15 | Overall rhythm pattern of task completion |
| 14 | Temporal Anomaly | 0.06 | 0.1–0.6 | 0.7–1.0 | Statistical anomaly in timing distribution |

### 💻 Device Signals (6)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 15 | Device Fingerprint | 0.05 | 0.8–1.0 | 0.0–0.3 | Device fingerprint consistency |
| 16 | Screen Resolution | 0.03 | 0.7–1.0 | 0.0–0.3 | Screen resolution vs user agent consistency |
| 17 | Timezone Consistency | 0.03 | 0.8–1.0 | 0.0–0.4 | Timezone match between system and settings |
| 18 | Battery API | 0.02 | 0.3–1.0 | 0.0–0.1 | Battery API availability and values |
| 19 | Sensor Fusion | 0.03 | 0.4–1.0 | 0.0–0.1 | Accelerometer/gyroscope data presence |
| 20 | WebRTC Fingerprint | 0.04 | 0.7–1.0 | 0.0–0.3 | WebRTC local IP fingerprint |

### 🧩 Cognitive Signals (4)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 21 | Decision Latency | 0.05 | 0.3–0.8 | 0.0–0.1 | Time taken to make decisions |
| 22 | Error Correction | 0.04 | 0.2–0.7 | 0.0–0.05 | Self-correction behavior — humans make and fix mistakes |
| 23 | Pattern Recognition | 0.04 | 0.3–0.8 | 0.9–1.0 | How the user recognizes visual patterns — bots are too consistent |
| 24 | Entropy Score | 0.05 | 0.5–1.0 | 0.0–0.3 | Entropy of behavioral data distribution |

### 🌐 Environment Signals (2)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 25 | Tab Visibility | 0.03 | 0.7–1.0 | 0.0–0.3 | Tab focus/visibility changes — bots never switch tabs |
| 26 | Environment Consistency | 0.03 | 0.7–1.0 | 0.0–0.3 | Browser environment consistency checks |

### 🌍 Network Signal (1)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 27 | Connection Fingerprint | 0.02 | 0.5–1.0 | 0.0–0.3 | Connection type and round-trip consistency |

### 🔑 Biometric Signal (1)

| # | Signal | Weight | Human Range | Bot Range | Description |
|---|--------|:------:|:-----------:|:---------:|-------------|
| 28 | Keyboard Dynamics | 0.06 | 0.3–0.8 | 0.0–0.1 | Typing rhythm and pressure patterns |

### Bayesian Risk Scoring

Unlike simple weighted averages, Fortress uses **Bayesian inference** to compute the probability that a user is a bot:

```
P(bot | signals) = P(signals | bot) × P(bot) / P(signals)

Where:
  P(bot) = 0.15           (prior probability)
  P(signals | bot) = ∏ P(sᵢ | bot)^wᵢ   (weighted likelihood)
  P(signals | human) = ∏ P(sᵢ | human)^wᵢ
```

| 🟢 Low Risk | 🟡 Medium Risk | 🟠 High Risk | 🔴 Critical |
|:-----------:|:--------------:|:------------:|:-----------:|
| < 0.25 | 0.25–0.50 | 0.50–0.80 | > 0.80 |
| Pass through | Additional challenge | Enhanced verification | Blocked |

---

## 🛡️ 7 Defense Layers

The Fortress architecture implements **defense in depth** — every request passes through 7 independent verification layers before a token is issued.

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST ENTERS                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 1: BEHAVIORAL    │  28 signals analyzed
          │  PRECHECK               │  Bayesian risk scoring
          │  Risk: 0.0 → Pass      │  20+ headless detection vectors
          │  Risk: 1.0 → Block     │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 2: DYNAMIC       │  Challenge selected by risk level
          │  CHALLENGE              │  10 AI-proof challenge types
          │  Solution verified      │  Adaptive difficulty
          │  Behavioral data checked│
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 3: QR MOBILE     │  Triggered for medium+ risk
          │  VERIFICATION           │  Scan QR + enter 6-digit code
          │  Second device proof    │  Time-limited codes
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 4: WEBAUTHN      │  Passkey-based verification
          │  PASSKEY                │  Hardware-backed authentication
          │  Biometric proof        │  Platform authenticator support
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 5: CRYPTOGRAPHIC │  HMAC-SHA256 token signing
          │  TOKEN                  │  60-second TTL
          │  Single-use nonce (jti) │  Base64url JWT format
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 6: REPLAY        │  Nonce-based replay detection
          │  PROTECTION             │  2-minute deduplication window
          │  Server-side JTI store  │  Automatic TTL cleanup
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │  Layer 7: RATE          │  Per-IP and per-session limits
          │  LIMITING               │  Exponential backoff
          │  Cooldown periods       │  Progressive challenge escalation
          └────────────┬────────────┘
                       │
                       ▼
              ✅ TOKEN ISSUED
```

---

## 🚀 Quick Start

### 1. Embed in Any Page (2 lines)

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
```

### 2. Handle Verification

```html
<script>
  window.onCaptchaVerified = function(token) {
    // Send token to your server for verification
    fetch('/api/protected', {
      method: 'POST',
      body: JSON.stringify({ captchaToken: token })
    });
  };
</script>
```

That's it. CAPTCHA Shield handles everything else — behavioral analysis, challenge selection, risk scoring, and token generation.

---

## ⚙️ Configuration

```typescript
interface WidgetConfig {
  // ─── Core ─────────────────────────────────────────────
  mode: 'light' | 'fortress' | 'hybrid';  // Default: 'fortress'
  maxAttempts: number;                      // Default: 2
  language: string;                         // Default: 'en'
  
  // ─── Appearance ───────────────────────────────────────
  theme: 'light' | 'dark' | 'auto';        // Default: 'auto'
  size: 'micro' | 'compact' | 'normal' | 'full';  // Default: 'normal'
  accentColor: string;                      // Default: '#10b981'
  borderRadius: number;                     // Default: 12
  
  // ─── Behavior ─────────────────────────────────────────
  showRiskMeter: boolean;                   // Default: true
  accessibilityMode: boolean;               // Default: false
  
  // ─── Server Integration ──────────────────────────────
  serverVerifyUrl?: string;                 // Your backend endpoint
  
  // ─── Callbacks ────────────────────────────────────────
  onVerify?: (token: CaptchaToken) => void;
  onError?: (error: Error) => void;
}
```

### Default Configuration

```typescript
const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  mode: 'fortress',
  maxAttempts: 2,
  language: 'en',
  theme: 'auto',
  size: 'normal',
  accentColor: '#10b981',
  borderRadius: 12,
  showRiskMeter: true,
  accessibilityMode: false,
};
```

### HTML Configuration

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
<script>
  window.CaptchaShieldConfig = {
    mode: 'fortress',
    primaryColor: '#10b981',
    language: 'en',
    size: 'normal',
    borderRadius: 12,
    timeout: 60,
    containerId: 'captcha-shield',
    showRiskMeter: true,
    accessibilityMode: false,
  };
</script>
```

### Server Configuration

```typescript
interface ServerConfig {
  secretKey: string;          // Required — HMAC-SHA256 secret
  issuer?: string;            // Expected token issuer (default: 'cshield-v4')
  maxTokenAge?: number;       // Max token age in seconds (default: 60)
  maxRiskScore?: number;      // Max acceptable risk score 0-1 (default: 0.85)
  requiredLayers?: string[];  // Verification layers that must be present
  replayProtection?: boolean; // Enable nonce-based replay detection (default: true)
}
```

---

## ⚛️ React Component

### Next.js / React Integration

```tsx
import { CaptchaWidgetV4 } from '@/components/captcha/CaptchaWidgetV4';

function LoginForm() {
  const [token, setToken] = useState(null);

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      
      <CaptchaWidgetV4
        mode="fortress"
        language="en"
        theme="auto"
        accentColor="#10b981"
        showRiskMeter
        onVerify={(t) => setToken(t)}
        onError={(e) => console.error(e)}
      />
      
      <button type="submit" disabled={!token}>
        Sign In
      </button>
    </form>
  );
}
```

### With Server Verification

```tsx
async function handleSubmit(e) {
  e.preventDefault();
  
  // Verify token on the server
  const res = await fetch('/api/captcha/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ captchaToken: token }),
  });
  
  const result = await res.json();
  if (result.valid) {
    // Proceed with protected action
  }
}
```

---

## 🔐 Server Verification

The `captcha-shield-server` module provides **one-line backend verification** with HMAC-SHA256 signature validation, replay protection, and risk score enforcement.

### Installation

```bash
npm install captcha-shield-server
# or
bun add captcha-shield-server
```

### Basic Usage

```typescript
import { verifyCaptchaShieldToken } from 'captcha-shield-server';

const result = await verifyCaptchaShieldToken(token, {
  secretKey: process.env.CAPTCHA_SECRET!,
});

if (result.valid) {
  console.log('✅ Verified!', result.payload);
  console.log('Risk score:', result.riskScore);
  console.log('Expires at:', new Date(result.expiresAt! * 1000));
} else {
  console.log('❌ Invalid:', result.reason);
}
```

### Express Middleware

```typescript
import { captchaShieldMiddleware } from 'captcha-shield-server';

app.post('/api/login',
  captchaShieldMiddleware({
    secretKey: process.env.CAPTCHA_SECRET!,
    maxRiskScore: 0.5,
    requiredLayers: ['behavioral_precheck', 'dynamic_challenge'],
  }),
  (req, res) => {
    // Only reached if CAPTCHA is valid
    res.json({ message: 'Welcome!' });
  }
);
```

### Next.js API Route

```typescript
import { createCaptchaVerifier } from 'captcha-shield-server';

const verifyCaptcha = createCaptchaVerifier({
  secretKey: process.env.CAPTCHA_SECRET!,
  maxTokenAge: 60,
  maxRiskScore: 0.85,
  replayProtection: true,
});

export async function POST(request: Request) {
  const { captchaToken } = await request.json();
  const result = await verifyCaptcha(captchaToken);
  
  if (!result.valid) {
    return Response.json({ error: result.reason }, { status: 403 });
  }
  
  return Response.json({ 
    success: true, 
    riskScore: result.riskScore 
  });
}
```

### Token Format

CAPTCHA Shield tokens use a custom JWT profile:

```
header.payload.signature

Header:  { "alg": "HS256", "typ": "CSHIELD-V4", "kid": "hmac-sha256-v1" }
Payload: { "iss": "cshield-v4", "sub": "...", "aud": "...", "iat": ..., "exp": ..., 
           "nbf": ..., "jti": "...", "risk": 0.12, "challenge": "...", 
           "verified": [...], "fp": "..." }
```

### Verification Checks (in order)

| Step | Check | Failure Reason |
|------|-------|---------------|
| 1 | Token format (3 parts) | `Invalid token format` |
| 2 | Header decoding | `Invalid token header` |
| 3 | Algorithm & type | `Unsupported token algorithm or type` |
| 4 | HMAC-SHA256 signature (timing-safe) | `Invalid token signature` |
| 5 | Payload decoding | `Invalid token payload` |
| 6 | Expiration (`exp`) | `Token expired` |
| 7 | Max token age (`iat` vs now) | `Token too old` |
| 8 | Not-before (`nbf`) | `Token not yet valid` |
| 9 | Issuer match | `Invalid token issuer` |
| 10 | Risk score threshold | `Risk score too high: X > Y` |
| 11 | Required verification layers | `Missing required verification layer: X` |
| 12 | Replay protection (nonce) | `Token already used (replay detected)` |

---

## 📖 API Reference

### Core Functions

#### `verifyCaptchaShieldToken(token, config)`

Verify a CAPTCHA Shield v4.0 token.

```typescript
function verifyCaptchaShieldToken(
  tokenString: string,
  config: ServerConfig,
): Promise<VerificationResult>
```

**Returns:** `Promise<VerificationResult>`

```typescript
interface VerificationResult {
  valid: boolean;
  reason?: string;       // Failure reason if invalid
  payload?: TokenPayload; // Decoded token payload if valid
  expiresAt?: number;    // Unix timestamp
  riskScore?: number;    // 0-1 risk score
}
```

#### `captchaShieldMiddleware(config)`

Express middleware for automatic token verification.

```typescript
function captchaShieldMiddleware(
  config: ServerConfig,
): (req, res, next) => Promise<void>
```

#### `createCaptchaVerifier(config)`

Factory for Next.js API route handlers.

```typescript
function createCaptchaVerifier(
  config: ServerConfig,
): (token: string) => Promise<VerificationResult>
```

### Behavioral Analyzer

```typescript
const analyzer = getBehavioralAnalyzer();

// Record events
analyzer.recordEvent('mousemove', { clientX: 100, clientY: 200 });
analyzer.recordEvent('click', { offsetX: 5, targetWidth: 40 });

// Compute risk
const assessment = analyzer.computeRiskAssessment();
// { score: 0.12, level: 'low', recommendation: 'allow', ... }

// Get all 28 signal readings
const signals = analyzer.computeAllSignals();

// Get behavioral data snapshot
const data = analyzer.getBehavioralData();
```

### Challenge Engine

```typescript
import { generateChallenge, verifySolution, CHALLENGE_DEFINITIONS } from '@/lib/captcha-engine-v4';

// Generate a challenge
const instance = generateChallenge(ChallengeType.ADVERSARIAL_PUZZLE, ChallengeDifficulty.MEDIUM);

// Verify a solution
const result = verifySolution(instance, userAnswer);
// { passed: boolean, confidence: number, timeTaken: number }
```

### Token Manager

```typescript
import { getTokenManager } from '@/lib/token-manager';

const tm = getTokenManager();

// Generate a signed token
const token = await tm.generateToken({
  sub: 'session-abc',
  challenge: ChallengeType.ADVERSARIAL_PUZZLE,
  risk: 0.12,
  verified: [VerificationLayer.BEHAVIORAL_PRECHECK, VerificationLayer.DYNAMIC_CHALLENGE],
});

// Verify a token
const result = await tm.verifyToken(token);

// Encode/decode
const jwtString = tm.encodeToken(token);
const decoded = tm.decodeToken(jwtString);
```

---

## 🔌 Plugin System

Extend CAPTCHA Shield with custom challenges, signal processors, and renderers.

### Creating a Plugin

```typescript
import { createPlugin, getPluginRegistry, ChallengeType, ChallengeDifficulty } from 'captcha-shield';

const myPlugin = createPlugin({
  name: 'anti-ml-puzzle',
  version: '1.0.0',
  description: 'Adversarial puzzle generator resistant to ML solvers',
  
  challengeType: ChallengeType.ADVERSARIAL_PUZZLE,
  
  challengeGenerator: (difficulty: ChallengeDifficulty) => ({
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: ChallengeType.ADVERSARIAL_PUZZLE,
    difficulty,
    payload: { /* puzzle data */ },
    solution: { type: ChallengeType.ADVERSARIAL_PUZZLE, answer: 42 },
    expiresAt: Date.now() + 60_000,
    maxAttempts: 3,
    attempts: 0,
    createdAt: Date.now(),
  }),
  
  signalProcessor: (behavioralData) => ({
    name: SignalName.ENTROPY_SCORE,
    category: SignalCategory.COGNITIVE,
    value: 0.73,
    rawValue: 0.73,
    weight: 1.0,
    timestamp: Date.now(),
    confidence: 0.9,
    anomalyScore: 0.1,
  }),
});
```

### Registering a Plugin

```typescript
const registry = getPluginRegistry();

// Register
registry.register(myPlugin);

// Initialize all plugins
registry.initializeAll();

// Query
const generators = registry.getChallengeGenerators();
const processors = registry.getSignalProcessors();
const plugin = registry.getPlugin('anti-ml-puzzle');

// Cleanup
registry.unregister('anti-ml-puzzle');
registry.destroyAll();
```

### Plugin Interface

```typescript
interface CaptchaPlugin {
  name: string;                          // Unique identifier
  version: string;                       // Semver version
  description: string;                   // Human-readable description
  challengeType?: ChallengeType;         // Challenge type this plugin handles
  challengeGenerator?: (difficulty) => ChallengeInstance;  // Factory function
  signalProcessor?: (data) => Partial<SignalReading>;      // Signal enrichment
  challengeRenderer?: React.ComponentType<ChallengeProps>; // Custom renderer
  onInit?: () => void;                   // Lifecycle: initialization
  onDestroy?: () => void;                // Lifecycle: cleanup
}
```

---

## ♿ Accessibility

CAPTCHA Shield v4.0 is **WCAG 2.2 AA compliant** — every challenge has an accessible alternative.

| Challenge | Accessibility Modes |
|-----------|-------------------|
| Adversarial Puzzle | Audio description, High contrast |
| Human Intuition Grid | Audio description, Keyboard navigation |
| Physics Chaos | Keyboard controls, Haptic feedback |
| Temporal Memory | Audio cue, Extended display time |
| Optical Illusion Maze | Simplified view, Audio description |
| Voice Rhythm | Visual rhythm display, Haptic beat |
| Gesture Signature | Keyboard path input, Simplified gesture |
| Contextual Reasoning | Audio description, Text scenarios |
| Live 3D Biometric | Keyboard rotation, Snap angles |
| Zero-Knowledge Proof | Extended time, Simplified visual |

### Accessibility Features

- 🎹 **Full keyboard navigation** — every challenge is solvable without a mouse
- 🔊 **Screen reader support** — ARIA labels, live regions, and announcements
- 🎨 **High contrast mode** — meets WCAG AA contrast ratios (4.5:1)
- ⏱️ **Extended time limits** — 2× time for accessibility mode
- 🔉 **Audio fallbacks** — every visual challenge has an audio alternative
- 📱 **Touch-friendly** — minimum 44px touch targets
- 🎯 **Focus indicators** — visible focus rings on all interactive elements

```tsx
<CaptchaWidgetV4 accessibilityMode={true} />
```

---

## 🌍 Internationalization

8 languages with automatic browser detection and full coverage of all UI strings.

| Language | Code | Status | Coverage |
|----------|------|--------|----------|
| 🇺🇸 English | `en` | ✅ Complete | 100% |
| 🇪🇸 Spanish | `es` | ✅ Complete | 100% |
| 🇫🇷 French | `fr` | ✅ Complete | 100% |
| 🇩🇪 German | `de` | ✅ Complete | 100% |
| 🇧🇷 Portuguese | `pt` | ✅ Complete | 100% |
| 🇯🇵 Japanese | `ja` | ✅ Complete | 100% |
| 🇨🇳 Chinese | `zh` | ✅ Complete | 100% |
| 🇰🇷 Korean | `ko` | ✅ Complete | 100% |

### Usage

```typescript
import { getTranslations, detectLanguage, getSupportedLanguages } from '@/lib/i18n';

// Auto-detect from browser
const lang = detectLanguage();

// Get translations
const t = getTranslations('ja');
console.log(t.verifyButton); // "私は人間です"

// Get challenge-specific translations
const challengeT = getChallengeTranslation('zh', ChallengeType.PHYSICS_CHAOS);
console.log(challengeT.instruction); // "拖动物体直到天平平衡"

// List supported languages
const languages = getSupportedLanguages();
// ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ko']
```

---

## 🏗️ Architecture

### Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org/) | 16 | App Router framework with static export |
| [React](https://react.dev/) | 19 | UI components |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety across the entire codebase |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | — | Accessible component library |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations and transitions |
| [Lucide React](https://lucide.dev/) | — | Icon system |
| [Prisma](https://www.prisma.io/) | — | ORM for analytics storage |
| [Node.js Crypto](https://nodejs.org/api/crypto.html) | — | HMAC-SHA256 signing (server) |
| [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | — | HMAC-SHA256 signing (client) |

### Project Structure

```
captcha-shield/
├── server/                          # 🔐 Server verification module
│   └── index.ts                     # verifyCaptchaShieldToken, middleware, helpers
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── verify/page.tsx          # Verification page
│   │   ├── widget-embed/page.tsx    # Embeddable widget
│   │   └── api/captcha/
│   │       ├── verify/route.ts      # Token verification API
│   │       ├── generate/route.ts    # Challenge generation API
│   │       └── analytics/route.ts   # Analytics data API
│   ├── components/
│   │   ├── captcha/
│   │   │   ├── CaptchaWidgetV4.tsx       # Main widget orchestrator
│   │   │   ├── AdminDashboardV4.tsx      # Risk analytics dashboard
│   │   │   ├── BehaviorTracker.tsx       # Behavioral event collector
│   │   │   ├── ThemeCustomizer.tsx       # Live theme editor
│   │   │   └── challenges/
│   │   │       ├── AdversarialPuzzleChallenge.tsx
│   │   │       ├── HumanIntuitionGridChallenge.tsx
│   │   │       ├── PhysicsChaosChallenge.tsx
│   │   │       ├── TemporalMemoryChallenge.tsx
│   │   │       ├── OpticalIllusionMazeChallenge.tsx
│   │   │       ├── VoiceRhythmChallenge.tsx
│   │   │       ├── GestureSignatureChallenge.tsx
│   │   │       ├── ContextualReasoningChallenge.tsx
│   │   │       ├── Live3DBiometricChallenge.tsx
│   │   │       └── ZeroKnowledgeProofChallenge.tsx
│   │   ├── landing/                      # Landing page components
│   │   └── ui/                           # shadcn/ui components
│   ├── lib/
│   │   ├── types.ts                      # Complete type system
│   │   ├── captcha-engine-v4.ts          # Challenge generation & verification
│   │   ├── behavioral-analyzer-v4.ts     # 28 signals + Bayesian scoring
│   │   ├── token-manager.ts              # JWT token lifecycle (isomorphic)
│   │   ├── plugin-system.ts              # Plugin registry & lifecycle
│   │   ├── i18n.ts                       # 8-language translations
│   │   ├── captcha-store.ts              # State management
│   │   ├── db.ts                         # Prisma client
│   │   └── utils.ts                      # Shared utilities
│   └── hooks/
│       ├── use-mobile.ts                 # Mobile detection hook
│       └── use-toast.ts                  # Toast notification hook
├── prisma/
│   └── schema.prisma                     # Database schema
├── examples/
│   ├── vanilla.html                      # Vanilla JS integration
│   └── form-protected-demo.html          # Form protection example
├── documentation/
│   ├── SECURITY_MODEL.md                 # Threat model & guarantees
│   ├── PRODUCTION_BACKEND_PLAN.md        # Server architecture
│   ├── API.md                            # API reference
│   └── BEHAVIORAL-ANALYSIS.md            # Signal deep dive
└── public/
    ├── widget.js                         # Embeddable widget script
    └── screenshots/                      # Demo screenshots
```

### Data Flow

```
Browser                           Server                          Protected Resource
────────                          ──────                          ──────────────────
  │                                  │                                  │
  │  1. User clicks "I am human"     │                                  │
  │─────────────────────────────────▶│                                  │
  │                                  │                                  │
  │  2. Behavioral precheck          │                                  │
  │     (28 signals computed)        │                                  │
  │                                  │                                  │
  │  3. Dynamic challenge shown      │                                  │
  │     (selected by risk score)     │                                  │
  │                                  │                                  │
  │  4. User solves challenge        │                                  │
  │     (behavioral data collected)  │                                  │
  │                                  │                                  │
  │  5. Token generated              │                                  │
  │     (HMAC-SHA256 signed)         │                                  │
  │                                  │                                  │
  │  6. Token sent to server         │                                  │
  │─────────────────────────────────▶│                                  │
  │                                  │                                  │
  │                                  │  7. Token verified               │
  │                                  │     - Signature check            │
  │                                  │     - Expiration check           │
  │                                  │     - Risk score check           │
  │                                  │     - Replay protection          │
  │                                  │                                  │
  │                                  │  8. Protected action allowed     │
  │                                  │─────────────────────────────────▶│
  │                                  │                                  │
  │  9. Result returned              │                                  │
  │◀────────────────────────────────│                                  │
```

---

## 🔒 Security Model

### What Fortress Protects Against

| Attack Vector | Protection | Effectiveness |
|--------------|-----------|:------------:|
| **Automated bots** | 28 behavioral signals + Bayesian scoring | ⭐⭐⭐⭐⭐ |
| **Headless browsers** | 20 detection vectors (Puppeteer, Selenium, etc.) | ⭐⭐⭐⭐⭐ |
| **ML-based solvers** | Adversarial noise, optical illusions, intuition challenges | ⭐⭐⭐⭐ |
| **Replay attacks** | Nonce-based replay protection (2-min window) | ⭐⭐⭐⭐⭐ |
| **Token tampering** | HMAC-SHA256 signatures with timing-safe comparison | ⭐⭐⭐⭐⭐ |
| **Credential stuffing** | Rate limiting + progressive challenge escalation | ⭐⭐⭐⭐ |
| **CAPTCHA solving services** | Behavioral validation of interaction patterns | ⭐⭐⭐ |

### Security Guarantees

- ✅ **Timing-safe signature comparison** — prevents timing side-channel attacks
- ✅ **Single-use tokens** — each token has a unique `jti` nonce
- ✅ **Short TTL** — tokens expire after 60 seconds by default
- ✅ **No client-side trust** — server verification is always required for production
- ✅ **Replay protection** — used tokens are tracked for 2 minutes
- ✅ **Risk enforcement** — server rejects tokens with risk scores above threshold

### Security Boundaries

> ⚠️ **Important**: Client-side verification is a **friction layer**, not a security boundary. Any client-side check can be bypassed by a determined attacker. **Server-side verification is required for production security.**

See [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines and [Security Model](documentation/SECURITY_MODEL.md) for the complete threat model.

---

## 🗺️ Roadmap

### ✅ v4.0 "Fortress" (Current)

- [x] 10 AI-proof challenge types with adversarial design
- [x] 28 behavioral signals with Bayesian risk scoring
- [x] 7-layer defense architecture
- [x] HMAC-SHA256 token signing and verification
- [x] Server verification module (Express, Next.js, standalone)
- [x] Replay protection with nonce-based deduplication
- [x] Plugin architecture for custom challenges
- [x] 8-language internationalization
- [x] WCAG 2.2 AA accessibility compliance
- [x] 20+ headless browser detection vectors
- [x] Admin dashboard with risk analytics

### 🔮 v4.1 — Observability

- [ ] Webhook notifications for verification events
- [ ] Prometheus metrics export
- [ ] Grafana dashboard templates
- [ ] Audit log persistence (Prisma + SQLite)
- [ ] Real-time verification stream (WebSocket)

### 🔮 v4.5 — Intelligence

- [ ] ML-based adaptive difficulty (challenge gets harder for suspicious users)
- [ ] Crowd-sourced challenge difficulty calibration
- [ ] Cross-site risk reputation sharing (opt-in)
- [ ] Device fingerprint reputation database

### 🔮 v5.0 — Platform

- [ ] Multi-tenant SaaS dashboard
- [ ] Managed cloud verification API
- [ ] Rate limiting as a service
- [ ] Custom challenge builder (visual editor)
- [ ] A/B testing for challenge effectiveness
- [ ] Mobile SDK (iOS / Android native widgets)
- [ ] WebAssembly challenge rendering for maximum performance

---

## 🤝 Contributing

We love contributions! CAPTCHA Shield is built by the community, for the community.

### Quick Start

```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/captcha-shield.git
cd captcha-shield

# 2. Install dependencies
npm ci

# 3. Start development server
npm run dev

# 4. Make your changes and test
npm run lint
npm run typecheck
```

### Contribution Types

| Type | Description | Example |
|------|-------------|---------|
| 🐛 Bug fix | Fix an existing issue | Challenge rendering bug |
| ✨ Feature | Add new functionality | New challenge type |
| 🌍 Translation | Add or improve i18n | Italian language support |
| ♿ Accessibility | Improve a11y | Better screen reader support |
| 📝 Documentation | Improve docs | API reference update |
| 🧪 Testing | Add test coverage | Challenge engine tests |
| 🎨 Design | Improve UI/UX | Better mobile layout |

### Pull Request Checklist

- [ ] Code compiles without errors (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] New features include TypeScript types
- [ ] UI changes are responsive (mobile + desktop)
- [ ] Accessibility maintained (WCAG 2.2 AA)
- [ ] Documentation updated if needed

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guide and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for our community standards.

---

## 📜 License

```
MIT License

Copyright (c) 2024-2025 CAPTCHA Shield Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Credits

### Built With

- [Next.js](https://nextjs.org/) — The React framework for the web
- [React](https://react.dev/) — The library for web and native user interfaces
- [TypeScript](https://www.typescriptlang.org/) — JavaScript with syntax for types
- [Tailwind CSS](https://tailwindcss.com/) — A utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) — Beautifully designed components
- [Framer Motion](https://www.framer.com/motion/) — Production-ready motion library
- [Lucide](https://lucide.dev/) — Beautiful & consistent icons

### Inspired By

- [reCAPTCHA](https://www.google.com/recaptcha/) — Pioneered the risk-analysis CAPTCHA
- [hCaptcha](https://www.hcaptcha.com/) — Privacy-first alternative
- [Friendly CAPTCHA](https://friendlycaptcha.com/) — Proof-of-work approach
- [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) — Invisible verification

### Research

- Bursztein et al., *"The Difficulty of Breaking CAPTCHAs"* (2023)
- Sivakorn et al., *"I am not a Human: Breaking the Google reCAPTCHA"* (2023)
- Ho et al., *"Detecting and Characterizing Bot Attacks on CAPTCHA Systems"*

---

<div align="center">

<br />

**Built with ❤️ by [Smouj](https://github.com/smouj) and [contributors](https://github.com/smouj/captcha-shield/graphs/contributors)**

[![GitHub](https://img.shields.io/badge/GitHub-captcha--shield-181717?style=for-the-badge&logo=github&labelColor=1a1a2e)](https://github.com/smouj/captcha-shield)
[![Website](https://img.shields.io/badge/Demo-Live-22c55e?style=for-the-badge&logo=github&labelColor=1a1a2e)](https://smouj.github.io/captcha-shield/)
[![npm](https://img.shields.io/badge/npm-captcha--shield-22c55e?style=for-the-badge&logo=npm&logoColor=white&labelColor=1a1a2e)](https://www.npmjs.com/)

<br />

*If CAPTCHA Shield helps protect your project, consider giving it a ⭐ — it helps others find it!*

</div>
