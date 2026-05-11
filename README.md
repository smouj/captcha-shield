<div align="center">
<br />

<img src="public/social-banner.png" alt="CAPTCHA Shield Banner" width="600" />

<br /><br />

# 🛡️ CAPTCHA Shield

**Embeddable anti-bot verification UI with behavioral-risk signals, interactive challenges, and QR fallback**

*Interfaz embebible de verificación anti-bot con señales de riesgo comportamental, desafíos interactivos y modo QR*

[![Version](https://img.shields.io/badge/version-3.1.0-9b59b6.svg)](./package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![GitHub Pages](https://img.shields.io/badge/demo-live-22c55e?logo=github)](https://smouj.github.io/captcha-shield/)
[![CI](https://github.com/smouj/captcha-shield/actions/workflows/ci.yml/badge.svg)](https://github.com/smouj/captcha-shield/actions/workflows/ci.yml)

**[Live Demo](https://smouj.github.io/captcha-shield/) · [Security Model](documentation/SECURITY_MODEL.md) · [Examples](examples/vanilla.html) · [Contributing](CONTRIBUTING.md)**

---

</div>

## ⚠️ Important Security Note

**CAPTCHA Shield is currently a client-side verification demo and embeddable UI widget.** It adds meaningful friction against simple automation and collects behavioral-risk signals, but **client-side verification alone cannot guarantee protection** — any client-side check can be bypassed by a determined attacker.

**Production deployments require a server-side verifier** that validates challenge responses, signs tokens, and enforces rate limits. See [Security Model](documentation/SECURITY_MODEL.md) and [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md) for the recommended architecture.

---

## What It Is

CAPTCHA Shield is an open-source, embeddable anti-bot verification UI built with Next.js. It combines interactive challenges with real-time behavioral analysis to add friction against automated abuse:

- **7 challenge types** — sliding puzzle, image select, math visual, pattern trace, 3D rotation, audio, and timeline order
- **14 behavioral signals** — mouse movement, timing patterns, device fingerprinting, environment detection
- **QR mobile verification** — second-factor verification via mobile device
- **Embeddable widget** — drop into any site with 2 lines of code
- **Theme customizer** — match your brand with live preview
- **Local analytics** — risk distribution, challenge performance, signal breakdown
- **Static GitHub Pages demo** — zero backend required to try it

Designed as a **foundation for a hardened anti-abuse flow**: the client collects signals and presents challenges; the server verifies and signs tokens.

---

## En Español

CAPTCHA Shield es una interfaz embebible de verificación anti-bot con señales de riesgo comportamental, 7 desafíos interactivos, verificación QR y un motor de análisis de comportamiento. Funciona como demo y widget client-side; para protección real en producción se requiere verificación en servidor. Ver [Security Model](documentation/SECURITY_MODEL.md).

---

## Features

| Feature | Status |
|---------|--------|
| 7 interactive challenges | ✅ Working |
| 14 behavioral-risk signals | ✅ Working |
| QR / mobile verification | ✅ Working |
| Embeddable widget (`widget.js`) | ✅ Working |
| Theme customizer with live preview | ✅ Working |
| Local analytics dashboard | ✅ Working |
| GitHub Pages static demo | ✅ Live |
| Server-side verification | 📋 Planned — see [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md) |
| Signed tokens | 📋 Planned |
| Rate limiting | 📋 Planned |
| npm package | 📋 Planned (v3.3) |

---

## Live Demo

**👉 [https://smouj.github.io/captcha-shield/](https://smouj.github.io/captcha-shield/)**

Try the challenges, explore the behavioral signals, test the theme customizer, and check the analytics dashboard — all running as a static site with zero backend.

---

## Quick Embed

Add CAPTCHA Shield to any page with two lines:

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
```

Handle verification:

```html
<script>
  window.onCaptchaVerified = function(token) {
    // IMPORTANT: This callback runs client-side only.
    // For production, send the challenge data to your server for verification.
    console.log('Captcha passed:', token);
    document.getElementById('my-form').submit();
  };
</script>
```

> ⚠️ **Do not trust `window.onCaptchaVerified` as a security gate in production.** A bot can call this function directly. See [Production Warning](#production-warning) below.

---

## Advanced Config

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
<script>
  window.captchaShieldConfig = {
    primaryColor: '#3b82f6',
    language: 'en',
    size: 'medium',
    borderRadius: 12,
    timeout: 60,
    containerId: 'captcha-shield'
  };
</script>
```

---

## Production Warning

**Client-side verification is not security.** It is a friction layer and signal collector.

A production-ready anti-abuse system requires:

1. **Server challenge issuance** — the server creates the challenge and sends it to the client
2. **Server response verification** — the server validates the answer, not the client
3. **Signed tokens** — after verification, the server issues a signed, time-limited token
4. **Token validation on protected actions** — your backend checks the token before allowing the action
5. **Rate limiting** — prevent brute-force attempts per IP/session
6. **Replay protection** — each token is single-use with a short TTL

See [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md) for the full architecture.

---

## Challenge Types

| # | Challenge | Description |
|---|-----------|-------------|
| 1 | **Sliding Puzzle** | Drag canvas-based puzzle pieces to their correct positions |
| 2 | **Image Select** | Tap images matching an instruction from a grid |
| 3 | **Math Visual** | Solve a visually noisy math equation |
| 4 | **Pattern Trace** | Connect dots in the correct sequence |
| 5 | **3D Rotation** | Rotate a 3D shape to match a target orientation |
| 6 | **Audio** | Listen to tones and answer a question |
| 7 | **Timeline Order** | Arrange events in chronological order |

---

## Behavioral Risk Engine

The behavioral analyzer collects 14 signals across 4 categories:

| Category | Signals |
|----------|---------|
| **Movement** | Mouse trajectory smoothness, click precision, hover patterns, drag accuracy |
| **Timing** | Challenge completion speed, interaction cadence, response time variance |
| **Device** | Touch support, screen resolution, WebGL capabilities, canvas fingerprint |
| **Environment** | JavaScript execution context, automation indicators, browser features |

Risk is scored 0–100 and classified as Low / Medium / High. High-risk sessions can trigger additional challenges or QR verification.

---

## Architecture

```
captcha-shield/
├── src/
│   ├── app/                    # Next.js pages (home, verify, widget-embed)
│   ├── components/
│   │   ├── captcha/            # Challenge components (7 types + widget, result, QR)
│   │   └── ui/                 # shadcn/ui primitives
│   ├── lib/
│   │   ├── captcha-engine.ts  # Challenge generation and verification
│   │   └── behavioral-analyzer.ts  # 14-signal risk engine
│   └── hooks/                  # React hooks (toast)
├── public/
│   ├── widget.js               # Embeddable script
│   └── social-banner.png       # GitHub social preview
├── docs/                       # GitHub Pages build output (auto-generated)
├── examples/
│   ├── vanilla.html            # Minimal integration example
│   └── form-protected-demo.html # Form protection example
├── .github/workflows/ci.yml   # CI: lint, typecheck, build
├── docs/
│   ├── SECURITY_MODEL.md      # Threat model and architecture
│   └── PRODUCTION_BACKEND_PLAN.md  # Server verifier reference
├── SECURITY.md                 # Vulnerability disclosure policy
├── CONTRIBUTING.md             # Contribution guidelines
└── CHANGELOG.md                # Version history
```

---

## Local Development

```bash
# Install
npm ci

# Development server
npm run dev

# Quality checks
npm run lint
npm run typecheck
npm run check          # lint + typecheck + build

# Build for GitHub Pages
npm run build

# Clean build artifacts
npm run clean
```

---

## Production Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser   │────▶│  Backend Server  │────▶│  Protected      │
│   Widget    │     │                  │     │  Action          │
│             │◀────│  /challenge      │     │  (login, form,   │
│  - render   │     │  /verify         │────▶│   purchase, etc) │
│  - collect  │     │  - validate      │     │                  │
│  - solve    │     │  - sign token    │     │  - check token   │
│  - send     │     │  - rate limit    │     │  - verify HMAC   │
└─────────────┘     │  - log audit    │     │  - check TTL     │
                    └──────────────────┘     └──────────────────┘
```

**Client-side demo**: widget renders challenges and collects behavioral signals.  
**Production**: server issues challenges, verifies responses, signs tokens, enforces limits.  
**Protected action**: backend validates the signed token before allowing the operation.

---

## Roadmap

### v3.2 — Production Hardening
- [ ] Server verifier reference implementation (Express / Next.js route handler)
- [ ] Signed token format (HMAC-SHA256, 30s TTL, single-use nonce)
- [ ] Replay protection and rate limiting examples
- [ ] Playwright smoke tests
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Integration examples (Next.js, Express, Django)

### v3.3 — Distribution
- [ ] npm package with tree-shakeable exports
- [ ] React component export (`<CaptchaShield />`)
- [ ] Vanilla JS initializer
- [ ] Typed config schema (JSON Schema)
- [ ] CDN deployment (jsDelivr / unpkg)

---

## Security Disclosure

See [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines.

**Scope**: CAPTCHA Shield is a client-side demo. Bypassing client-side checks is expected and documented — it is not a vulnerability. Server-side verification is required for production security.

---

## License

[MIT](./LICENSE)

