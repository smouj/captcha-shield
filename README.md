<div align="center">

<br />

<img src="public/logo-shield-white.png" alt="CAPTCHA Shield" width="128" />

<br />

# 🛡️ CAPTCHA Shield

### Embeddable anti-bot challenge UI with behavioral-risk signals

> Interfaz embebible anti-bot con desafíos interactivos, señales de riesgo comportamental y verificación QR

<br />

[![Version](https://img.shields.io/badge/v3.1.0-9b59b6?style=flat-square&label=version&labelColor=1a1a2e)](./package.json)
[![License](https://img.shields.io/badge/MIT-yellow?style=flat-square&labelColor=1a1a2e)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js&logoColor=white&labelColor=1a1a2e)](https://nextjs.org/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=1a1a2e)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black&labelColor=1a1a2e)](https://react.dev/)
[![Live Demo](https://img.shields.io/badge/demo-live-22c55e?style=flat-square&logo=github&labelColor=1a1a2e)](https://smouj.github.io/captcha-shield/)
[![CI](https://github.com/smouj/captcha-shield/actions/workflows/ci.yml/badge.svg?style=flat-square)](https://github.com/smouj/captcha-shield/actions/workflows/ci.yml)

<br />

**[🚀 Live Demo](https://smouj.github.io/captcha-shield/) · [🔒 Security Model](documentation/SECURITY_MODEL.md) · [📝 Examples](examples/vanilla.html) · [🤝 Contributing](CONTRIBUTING.md)**

</div>

---

## ⚠️ Important Security Notice

> **CAPTCHA Shield is a client-side friction layer and demo.**
> It adds meaningful friction against simple automation and collects behavioral-risk signals, but **client-side verification alone cannot guarantee protection** — any client-side check can be bypassed by a determined attacker.
>
> **Production deployments require a server-side verifier** that validates challenge responses, signs tokens, and enforces rate limits. See [Security Model](documentation/SECURITY_MODEL.md) and [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md).

---

## 📖 Table of Contents

- [What It Is](#-what-it-is)
- [What It Is Not](#-what-it-is-not)
- [Screenshots](#-screenshots)
- [Live Demo](#-live-demo)
- [Quick Embed](#-quick-embed)
- [Feature Matrix](#-feature-matrix)
- [Challenge Types](#-challenge-types)
- [Behavioral Risk Engine](#-behavioral-risk-engine)
- [Production Architecture](#-production-architecture)
- [Roadmap](#-roadmap)
- [Local Development](#-local-development)
- [Security Disclosure](#-security-disclosure)
- [License](#license)

---

## ✅ What It Is

CAPTCHA Shield is an open-source, embeddable anti-bot challenge UI built with **Next.js 16**, **React 19**, and **TypeScript**. It combines interactive challenges with real-time behavioral analysis to add friction against automated abuse:

| 🎯 Feature | 💡 Description |
|-----------|---------------|
| **7 Challenge Types** | Sliding puzzle, image select, math visual, pattern trace, 3D rotation, audio, and timeline order |
| **14 Behavioral Signals** | Mouse movement, timing patterns, device fingerprinting, environment detection |
| **QR Mobile Verification** | Second-factor verification via mobile device with QR code + 6-digit code |
| **Embeddable Widget** | Drop into any site with 2 lines of code — zero dependencies |
| **Theme Customizer** | Match your brand with live preview — colors, language, size, border radius |
| **Local Analytics** | Risk distribution, challenge performance, signal breakdown dashboard |
| **Static Demo** | GitHub Pages deployment with zero backend required |

Designed as a **foundation for a hardened anti-abuse flow**: the client collects signals and presents challenges; the server verifies and signs tokens.

## ❌ What It Is Not

| ❌ Not This | ✅ This Instead |
|------------|----------------|
| Production-grade bot protection | A **friction layer** that raises the cost of automation |
| Impossible to bypass | Client-side checks can **always be bypassed** — that's documented |
| Server-side validation | A **signal collector** that informs server-side decisions |
| Rate limiting or token signing | A **demo and embeddable widget** for anti-bot challenge UIs |
| CAPTCHA replacement for production | A **clear path** to production via server verification |

---

## 📸 Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/smouj/captcha-shield/main/public/screenshots/final-hero.png" alt="Hero Section — Security notice, badges, and CTA buttons" width="600" />
</p>

<p align="center"><em>Hero section with Security Truth Banner and interactive badges</em></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/smouj/captcha-shield/main/public/screenshots/final-challenges.png" alt="Challenge Gallery — 7 interactive challenges + QR fallback" width="290" />
  <img src="https://raw.githubusercontent.com/smouj/captcha-shield/main/public/screenshots/final-signals.png" alt="Signal Matrix — 14 behavioral signals in 4 categories" width="290" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/smouj/captcha-shield/main/public/screenshots/final-architecture.png" alt="Production Architecture — Client → Server → Token → Action" width="290" />
  <img src="https://raw.githubusercontent.com/smouj/captcha-shield/main/public/screenshots/final-mobile.png" alt="Mobile Responsive View" width="290" />
</p>

---

## 🚀 Live Demo

**👉 [https://smouj.github.io/captcha-shield/](https://smouj.github.io/captcha-shield/)**

Try the challenges, explore the behavioral signals, test the theme customizer, and check the analytics dashboard — all running as a **static site with zero backend**.

---

## 🔌 Quick Embed

### Minimal Integration

Add CAPTCHA Shield to any page with **two lines**:

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
```

### Handle Verification

```html
<script>
  window.onCaptchaVerified = function(token) {
    // ⚠️ This callback runs client-side only.
    // For production, send challenge data to your server for verification.
    console.log('Captcha passed:', token);
    document.getElementById('my-form').submit();
  };
</script>
```

> ⚠️ **Do not trust `window.onCaptchaVerified` as a security gate in production.** A bot can call this function directly. Always verify on the server.

### Advanced Configuration

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
<script>
  window.CaptchaShieldConfig = {
    primaryColor: '#10b981',    // Brand color (hex)
    language: 'en',             // 'en' | 'es'
    size: 'medium',             // 'compact' | 'medium' | 'large'
    borderRadius: 12,           // Widget border radius (px)
    timeout: 60,                // Challenge timeout (seconds)
    containerId: 'captcha-shield' // DOM container ID
  };
</script>
```

### Full Form Example

See [examples/vanilla.html](examples/vanilla.html) for a minimal integration and [examples/form-protected-demo.html](examples/form-protected-demo.html) for a form protection example with the security warning.

---

## 📊 Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| 🧩 7 Interactive Challenges | ✅ Working | Puzzle, Image, Math, Pattern, 3D, Audio, Timeline |
| 🧠 14 Behavioral Signals | ✅ Working | Movement, Timing, Device, Environment |
| 📱 QR Mobile Verification | ✅ Working | QR code + 6-digit code on second device |
| 📦 Embeddable Widget | ✅ Working | 2-line embed, zero dependencies |
| 🎨 Theme Customizer | ✅ Working | Live preview with color, language, size config |
| 📈 Local Analytics | ✅ Working | Risk distribution, challenge performance, signals |
| 🌐 GitHub Pages Demo | ✅ Live | Zero backend static deployment |
| 🔐 Server-side Verification | 📋 Planned | [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md) |
| 🔏 Signed Tokens | 📋 Planned | HMAC-SHA256, 30s TTL, single-use nonce |
| ⏱️ Rate Limiting | 📋 Planned | Per-IP and per-session limits |
| 📦 npm Package | 📋 Planned | Tree-shakeable exports (v3.3) |

---

## 🧩 Challenge Types

| # | Challenge | Description | Status |
|---|-----------|-------------|--------|
| 1 | 🧩 **Sliding Puzzle** | Drag canvas-based puzzle pieces to their correct positions | ✅ Implemented |
| 2 | 🔍 **Image Select** | Tap images matching an instruction from a 4×4 grid | ✅ Implemented |
| 3 | 🔢 **Math Visual** | Solve a visually noisy math equation with distortion | ✅ Implemented |
| 4 | ✏️ **Pattern Trace** | Connect dots in the correct sequence from memory | ✅ Implemented |
| 5 | 🔄 **3D Rotation** | Rotate a 3D shape (cube/prism/pyramid) to match target orientation | ✅ Implemented |
| 6 | 🔊 **Audio Challenge** | Listen to Web Audio API tones and answer a question | ✅ Implemented |
| 7 | 📅 **Timeline Order** | Arrange historical events in chronological order | ✅ Implemented |
| + | 📱 **QR Mobile** | Scan QR code on a second device + enter 6-digit verification code | ✅ Implemented |

> 💡 Each verification randomly selects one of the 7 challenge types. High-risk sessions can trigger additional challenges or QR verification.

---

## 🧠 Behavioral Risk Engine

14 weighted signals across 4 categories produce a composite risk score:

| 📊 Category | 🎯 Signals | ⚖️ Weight Range |
|-----------|-----------|----------------|
| **🖱️ Movement** | Mouse trajectory, drag accuracy, click precision, hover patterns | 4–10% |
| **⏱️ Timing** | Completion speed, interaction cadence, hesitation, response variance | 4–12% |
| **💻 Device** | WebGL renderer, canvas fingerprint, touch support, screen resolution | 6–8% |
| **🌐 Environment** | JS execution, automation indicators, browser APIs, visibility state | 4–6% |

### Risk Scoring

```
risk = (linearity × 0.10) + (timing × 0.10) + (speed × 0.08) +
       (hesitation × 0.12) + (entropy × 0.06) + (bézier × 0.06) +
       (device × 0.08) + (keyboard × 0.08) + (pointer × 0.06) +
       (scroll × 0.04) + (pressure × 0.04) + (tab × 0.06) +
       (environment × 0.06) + (temporal × 0.06)
```

| 🟢 Low | 🟡 Medium | 🟠 High | 🔴 Critical |
|--------|-----------|---------|-------------|
| < 30% | 30–50% | 50–70% | > 70% |
| Pass through | May prompt additional challenge | Triggers QR verification | Blocks with review |

---

## 🏗️ Production Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser   │────▶│  Backend Server  │────▶│  Protected      │
│   Widget    │     │                  │     │  Action          │
│             │◀────│  /challenge      │     │  (login, form,   │
│  - render   │     │  /verify         │────▶│   purchase, etc) │
│  - collect  │     │  - validate      │     │                  │
│  - solve    │     │  - sign token    │     │  - check token   │
│  - send     │     │  - rate limit    │     │  - verify HMAC   │
└─────────────┘     │  - log audit     │     │  - check TTL     │
                    └──────────────────┘     └──────────────────┘
```

| Layer | Responsibility | Current Status |
|-------|--------------|----------------|
| **Browser Widget** | Render challenges, collect signals, send to server | ✅ Working |
| **Backend Server** | Issue challenges, validate responses, sign tokens | 📋 Planned |
| **Protected Action** | Verify token HMAC + TTL before allowing operation | 📋 Planned |

> 💡 **Client-side demo = friction layer. Production mode = server validation required.**

See [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md) for the full reference architecture.

---

## 🗺️ Roadmap

### 🔐 v3.2 — Production Hardening
- [ ] Server verifier reference implementation (Express / Next.js route handler)
- [ ] Signed token format (HMAC-SHA256, 30s TTL, single-use nonce)
- [ ] Replay protection and rate limiting examples
- [ ] Integration examples (Next.js, Express, Django, FastAPI)

### 📦 v3.3 — Distribution
- [ ] npm package with tree-shakeable exports
- [ ] React component export (`<CaptchaShield />`)
- [ ] Vanilla JS initializer
- [ ] CDN deployment (jsDelivr / unpkg)

### 🌍 v3.4 — Quality & Integrations
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Playwright smoke tests
- [ ] i18n improvements (more languages)
- [ ] SSR compatibility

### 🏛️ v4.0 — Hardened Platform
- [ ] Full server-side verification API
- [ ] Dashboard for risk analytics
- [ ] Webhook notifications
- [ ] Rate limiting middleware
- [ ] Multi-tenant support

---

## 🛠️ Local Development

```bash
# 📦 Install dependencies
npm ci

# 💻 Development server (http://localhost:3000/captcha-shield/)
npm run dev

# ✅ Quality checks
npm run lint          # ESLint
npm run typecheck     # TypeScript strict mode
npm run check         # lint + typecheck + build

# 🏗️ Build for GitHub Pages (outputs to docs/)
npm run build

# 🧹 Clean build artifacts
npm run clean
```

### Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| [Next.js](https://nextjs.org/) | 16 | Static export framework |
| [React](https://react.dev/) | 19 | UI components |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations |
| [lucide-react](https://lucide.dev/) | — | Icons |

---

## 🔒 Security Disclosure

See [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines.

**In scope** (reportable): XSS, secret leakage, supply-chain attacks, RCE, deployment secret exposure.

**Out of scope** (not reportable): Bypassing client-side checks. This is **expected and documented** — client-side verification is a friction layer, not a security boundary. Server-side verification is required for production security.

---

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [Security Model](documentation/SECURITY_MODEL.md) | Threat model, what it protects, what it doesn't |
| [Production Backend Plan](documentation/PRODUCTION_BACKEND_PLAN.md) | Server verifier architecture and reference implementation plan |
| [API Reference](documentation/API.md) | Challenge and verification endpoint documentation |
| [Behavioral Analysis](documentation/BEHAVIORAL-ANALYSIS.md) | Deep dive into the 14-signal risk engine |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines and PR checklist |
| [Changelog](CHANGELOG.md) | Version history |
| [Security Policy](SECURITY.md) | Vulnerability disclosure |

---

## 📜 License

[MIT](./LICENSE) — Free for personal and commercial use.

---

<div align="center">

**Made by [Smouj](https://github.com/smouj) · [GitHub](https://github.com/smouj/captcha-shield) · [Website](https://smouj.github.io/captcha-shield/)**

</div>
