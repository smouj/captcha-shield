# Changelog / Registro de Cambios

All notable changes to the CAPTCHA Shield project will be documented in this file.

Todos los cambios notables al proyecto CAPTCHA Shield serán documentados en este archivo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.0.0] — 2025-05-12 — "Fortress"

### 🏛️ The Unbreakable CAPTCHA

The most significant update in CAPTCHA Shield history. v4.0 "Fortress" introduces 10 AI-proof challenges, 28 behavioral signals, 7 defense layers, Bayesian risk scoring, JWT cryptographic tokens, plugin system, and 8-language support.

### Added / Añadido

#### 🧩 10 AI-Proof Challenges (replaces 7 previous)
- **Adversarial Puzzle**: Canvas-rendered puzzle with adversarial noise overlays that confuse all vision AI models (82% AI resistance)
- **Human Intuition Grid**: 4×4 grid where one shape is subtly different — only humans detect it (91% AI resistance)
- **Physics Chaos**: Drag objects on a balance beam to achieve equilibrium — requires real physics intuition (88% AI resistance)
- **Temporal Memory**: 6-event sequence shown for 1.8s, then reproduce exact order (75% AI resistance)
- **Optical Illusion Maze**: Navigate maze with Moiré/Hermann/Penrose illusion overlays (93% AI resistance)
- **Voice Rhythm**: Repeat audio rhythm pattern via tapping (85% AI resistance)
- **Gesture Signature**: Trace a gesture with natural movement — detects automated precision (87% AI resistance)
- **Contextual Reasoning**: "What happens next?" — only humans understand physical/social causality (94% AI resistance)
- **Live 3D Biometric**: Rotate 3D object to match target orientation (90% AI resistance)
- **Zero-Knowledge Proof**: SHA-256 proof-of-work + visual patch matching (96% AI resistance)

#### 🧠 28 Behavioral Signals (up from 14)
- **Motor (8)**: Mouse path linearity, speed variance, acceleration pattern, pointer precision, pointer pressure, click precision, scroll behavior, gesture smoothness
- **Temporal (6)**: Timing consistency, reaction time, hesitation pattern, inter-event interval, task completion rhythm, temporal anomaly
- **Device (6)**: Device fingerprint, screen resolution, timezone consistency, battery API, sensor fusion (accelerometer/gyroscope), WebRTC fingerprint
- **Cognitive (4)**: Decision latency, error correction, pattern recognition, entropy score
- **Environment (2)**: Tab visibility, environment consistency
- **Network (1)**: Connection fingerprint
- **Biometric (1)**: Keyboard dynamics

#### 🛡️ 7 Defense Layers
1. Headless browser detection (40+ fingerprinting vectors)
2. Behavioral pre-check (28 signals, Bayesian scoring)
3. Dynamic challenge selection (risk-adaptive)
4. Interactive challenge (Canvas/WebGL rendered)
5. QR mobile verification (120s, 6-digit code)
6. WebAuthn/Passkey (optional, biometric)
7. Cryptographic token (JWT HMAC-SHA256, 60s TTL, single-use nonce)

#### 🔐 Token System
- **JWT HMAC-SHA256 tokens** with Web Crypto API
- **60-second TTL** by default (configurable)
- **Single-use nonce** (jti claim) prevents replay attacks
- **Token payload** includes: risk score, challenge type, verified layers, device fingerprint hash
- **Server verification module** (`captcha-shield-server`): one-line backend verification

#### 🧩 Plugin System
- Register custom challenge types
- Register custom signal processors
- Lifecycle hooks (onInit, onDestroy)
- `createPlugin()` factory helper

#### 🌍 Internationalization (8 languages)
- English, Español, Français, Deutsch, Português, 日本語, 中文, 한국어
- Automatic browser language detection
- All challenge strings translated

#### 📊 Enhanced Analytics Dashboard
- 4 stat cards (total, success rate, risk score, block rate)
- Challenge type distribution chart (10 types)
- Risk level distribution visualization
- 28-signal behavioral matrix with category grouping
- Verification layers breakdown
- Recent activity log with custom scrollbar
- Export as JSON

#### 🔌 Widget v4
- Shadow DOM isolation
- 3-retry with exponential backoff
- Fallback UI on failure
- All v4.0 config options
- Public API: `reset()`, `destroy()`, `getToken()`, `on()`, `off()`
- Auto-resize via ResizeObserver

#### 📡 API Routes
- `POST /api/captcha/generate` — Create challenge (rate-limited, 10/min/IP)
- `POST /api/captcha/verify` — Verify solution (single-use, replay-protected)
- `GET /api/captcha/analytics` — Aggregated analytics

#### ♿ Accessibility
- WCAG 2.2 AA compliance
- Accessibility mode toggle (simplified challenges + audio/QR fallback)
- Keyboard navigation for all challenges
- Screen reader labels
- ARIA attributes on interactive elements

#### 🎨 UI/UX
- Widget sizes: micro, compact, normal, full
- Theme: light, dark, auto
- Configurable accent color and border radius
- Risk meter visualization
- Multi-layer verification progress indicator
- Framer Motion animations throughout

### Technical / Técnico
- **Next.js 16** + React 19 + TypeScript 5
- **Tailwind CSS 4** with shadcn/ui
- **Web Crypto API** for JWT signing
- **Canvas/WebGL** rendering for all challenges
- **Bayesian risk scoring** with adaptive thresholds
- **In-memory store** with rate limiting and replay protection
- Static export for GitHub Pages deployment

### Security / Seguridad
- Solutions never sent to client (server-side storage)
- HMAC-SHA256 signature verification with timing-safe comparison
- 40+ headless browser detection vectors
- Instant block if risk > 85%
- Challenge warning if risk > 40%
- Rate limiting: 10 requests/minute/IP
- Single-use challenges and tokens
- Replay protection via nonce tracking
- Device fingerprint consistency checks

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
