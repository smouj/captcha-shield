# Changelog / Registro de Cambios

All notable changes to the CAPTCHA Shield project will be documented in this file.

Todos los cambios notables al proyecto CAPTCHA Shield serán documentados en este archivo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
