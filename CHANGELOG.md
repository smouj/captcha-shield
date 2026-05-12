# Changelog / Registro de Cambios

All notable changes to the CAPTCHA Shield project will be documented in this file.

Todos los cambios notables al proyecto CAPTCHA Shield serán documentados en este archivo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.0.0] - 2025-01-XX

### 🏛️ The Unbreakable CAPTCHA

The most significant update in CAPTCHA Shield history. v4.0 "Fortress" is a complete rewrite introducing 10 AI-proof challenges, 28 behavioral signals, 7 defense layers, Bayesian risk scoring, JWT cryptographic tokens, plugin system, and 8-language support.

### Added

- **10 AI-proof interactive challenges**: Adversarial Puzzle, Human Intuition Grid, Physics Chaos, Temporal Memory, Optical Illusion Maze, Voice Rhythm, Gesture Signature, Contextual Reasoning, Live 3D Biometric, Zero-Knowledge Proof
- **28 behavioral signals** (up from 14) with Bayesian risk scoring across 7 categories (Motor, Temporal, Device, Cognitive, Environment, Network, Biometric)
- **Multi-layer verification**: Behavioral pre-check → Dynamic challenge → QR mobile → WebAuthn/Passkey → Cryptographic JWT token
- **3 verification modes**: Light (minimal friction), Fortress (maximum security, default), Hybrid (adaptive)
- **JWT token generation** with HMAC-SHA256 (60s TTL, ephemeral private key, single-use nonce)
- **Plugin system** for community challenges with lifecycle hooks (onInit, onDestroy) and `createPlugin()` factory
- **i18n support** for 8 languages (en, es, fr, de, pt, ja, zh, ko) with auto-detection
- **Admin dashboard** with real-time analytics, 28-signal matrix, challenge distribution, risk levels, and export
- **WCAG 2.2 AA accessibility** support with keyboard navigation, screen reader labels, audio fallbacks, and extended time
- **Zero telemetry** by default
- **TensorFlow.js Lite** on-device ML model architecture
- **WebAssembly module stubs** for critical challenges
- **Code obfuscation** for production widget.js
- **CDN integration** (jsDelivr/unpkg) for widget.js distribution
- **Webhook notifications** support for verification events
- **Multi-tenant support** for SaaS deployments
- **React npm package** export for direct component integration
- **QR mobile verification** (120s timeout, 6-digit code, second-device proof)
- **Headless browser detection** (40+ vectors including Puppeteer, Selenium, Playwright)
- **Device fingerprinting** (WebRTC, Battery API, Sensor Fusion, Screen Resolution, Timezone)
- **Dynamic challenge difficulty** selection based on risk score (Easy → Medium → Hard → Extreme)
- **Instant block** at >40% risk score
- **Cooldown system** (5s × attempts, capped at 60s)
- **Shadow DOM widget** with 3-retry exponential backoff and fallback UI
- **API routes**: `POST /api/captcha/generate`, `POST /api/captcha/verify`, `GET /api/captcha/analytics`
- **Server verification module** (`captcha-shield-server`): one-line backend verification with Express middleware, Next.js helper, and standalone function

### Changed

- Complete rewrite of behavioral analyzer (v3 14 signals → v4 28 signals with Bayesian inference)
- Upgraded from v3.1 to v4.0 "Fortress" architecture
- Enhanced token security (HMAC-SHA256 with ephemeral keys, replacing client-only verification)
- Improved widget with risk meter visualization and verification layer progress indicator
- Challenge types redesigned with adversarial noise overlays and Canvas/WebGL rendering
- Risk scoring upgraded from weighted average to Bayesian inference with prior probabilities

### Breaking Changes

- **Widget API completely redesigned** for v4.0 — all configuration keys changed
- **Token format changed** to CSHIELD-V4 JWT (incompatible with v3 tokens)
- **API routes require** `export const dynamic = "force-dynamic"` for static export compatibility
- **Configuration format changed** — see migration guide below

#### Migration Guide (v3.x → v4.0)

```diff
- // v3.x configuration
- window.CaptchaShieldConfig = {
-   riskThreshold: 0.65,
-   challengeType: 'puzzle',
-   language: 'es',
- };

+ // v4.0 configuration
+ window.CaptchaShieldConfig = {
+   mode: 'fortress',           // replaces riskThreshold + challengeType
+   language: 'es',             // same key, now supports 8 languages
+   showRiskMeter: true,        // new: risk meter visualization
+   accessibilityMode: false,   // new: WCAG 2.2 AA support
+ };
```

```diff
- // v3.x token verification (client-only)
- const isValid = verifyTokenLocally(token);

+ // v4.0 token verification (server-side)
+ import { verifyCaptchaShieldToken } from 'captcha-shield-server';
+ const result = await verifyCaptchaShieldToken(token, {
+   secretKey: process.env.CAPTCHA_SECRET!,
+ });
```

---

## [3.1.0] - 2025-04-20

### Added / Añadido
- **7 Challenge Types**: Sliding puzzle, image selection, visual math, pattern trace, 3D rotation, audio, timeline
- **14-Signal Behavioral Analysis Engine**: Comprehensive behavioral risk scoring
- **QR Mobile Verification**: Time-limited QR + 6-digit code fallback
- **Theme Customizer**: Live preview with generated embed code
- **Admin Analytics Dashboard**: Real-time stats, challenge distribution, activity log
- **Widget Embed System**: Self-contained iframe widget with postMessage API
- **Behavioral Data Tracker**: Invisible mouse/click/scroll collector with throttling
- **Risk Scoring System**: Weighted composite score with configurable threshold
- **Canvas-Based Rendering**: Anti-DOM-parsing challenge display
- **Dark Theme UI**: Glassmorphism design with emerald accents and Framer Motion animations
- **Responsive Design**: Mobile-first, fully responsive layout
- **Session Management**: 5-minute expiration, single-use verification
- **Bilingual UI**: Spanish language interface

### Security / Seguridad
- Challenge solutions are never sent to the client
- Risk threshold: scores above 65% are rejected
- Session expiration prevents replay attacks
- Single-use verification prevents double submissions
- Canvas-based rendering prevents DOM parsing attacks

### Technical / Técnico
- Next.js 16 with App Router
- TypeScript 5 with strict mode
- Tailwind CSS 4 with shadcn/ui components
- Framer Motion for animations
- Static export for GitHub Pages deployment

---

## [3.0.0] - 2025-04-15

### Added / Añadido
- **4 Challenge Types**: Sliding puzzle, image selection, visual math, pattern trace
- **6-Signal Behavioral Analysis Engine**: Path linearity, timing consistency, speed variance, hesitation, entropy, Bezier fit
- **Admin Analytics Dashboard**: Real-time stats, challenge distribution, activity log
- **Behavioral Data Tracker**: Invisible mouse/click/scroll collector with throttling
- **Risk Scoring System**: Weighted composite score with configurable threshold
- **Canvas-Based Rendering**: Anti-DOM-parsing challenge display
- **Dark Theme UI**: Glassmorphism design with emerald accents and Framer Motion animations
- **Responsive Design**: Mobile-first, fully responsive layout
- **Session Management**: 5-minute expiration, single-use verification
- **IP/User-Agent Logging**: For security auditing
- **SQLite Database**: Zero-config Prisma ORM setup
- **Bilingual UI**: Spanish language interface

### Security / Seguridad
- Challenge solutions are never sent to the client
- Risk threshold: scores above 70% are always rejected
- Session expiration prevents replay attacks
- Single-use verification prevents double submissions

### Technical / Técnico
- Next.js 16 with App Router
- TypeScript 5 with strict mode
- Tailwind CSS 4 with shadcn/ui components
- Framer Motion for animations
- Prisma ORM with SQLite
