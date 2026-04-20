<div align="center">
<br />

<img src="public/social-banner.png" alt="CAPTCHA Shield Banner" width="600" />

<br /><br />

# 🛡️ CAPTCHA Shield

**Advanced Anti-Bot / Anti-AI CAPTCHA System**
*Sistema avanzado de CAPTCHA anti-bot y anti-IA*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-18181B?logo=shadcnui)](https://ui.shadcn.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?logo=framer)](https://www.framer.com/motion/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)

**[Live Demo](https://smouj.github.io/captcha-shield/) · [Install Guide](https://smouj.github.io/captcha-shield/) · [Theme Customizer](https://smouj.github.io/captcha-shield/)**

---

</div>

## 📖 About

**CAPTCHA Shield** is a next-generation, 100% client-side CAPTCHA system engineered to detect and block AI agents and automated bots. It combines **7 interactive challenge types** with **14 real-time behavioral signals** and **QR mobile verification** — all without requiring a backend, API keys, or database.

Deploy to any website with just **2 lines of code**:

```html
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
```

### Why CAPTCHA Shield?

Traditional CAPTCHAs (like reCAPTCHA) are increasingly bypassed by AI vision models. CAPTCHA Shield analyzes *how* the user interacts — mouse trajectory, timing, pressure, keyboard dynamics, device fingerprinting — making it extremely difficult for bots to mimic natural human behavior. The behavioral fingerprinting approach is inherently resistant to automation.

---

## ✨ Features

### 🧩 7 Interactive Challenge Types

| Challenge | Description |
|-----------|-------------|
| **Sliding Puzzle** | Canvas-based puzzle with 2-3 complex pieces (wave, tab shapes) |
| **Image Selection 4x4** | 16-cell grid of SVG shapes with semantic instructions |
| **Visual Math** | OCR-resistant equations rendered on canvas with noise/distortion |
| **Pattern Trace** | Memorize and reproduce dot-to-dot patterns (3s preview) |
| **3D Rotation** | Rotate cube/prism/pyramid to match target (±25° tolerance) |
| **Audio Challenge** | Web Audio API tones with comprehension questions |
| **Timeline Order** | Order 4-6 historical events chronologically |

### 📱 QR Mobile Verification

Generates a time-limited QR code + 6-digit code for verification via physical mobile device. 120-second countdown with manual code entry fallback.

### 🧠 14-Signal Behavioral Analysis Engine

| # | Signal | Weight | Category |
|---|--------|--------|----------|
| 1 | Path Linearity | 0.10 | Movement |
| 2 | Timing Consistency | 0.10 | Timing |
| 3 | Speed Variance | 0.08 | Movement |
| 4 | Hesitation Pattern | 0.12 | Timing |
| 5 | Movement Entropy | 0.06 | Movement |
| 6 | Bezier Curve Fit | 0.06 | Movement |
| 7 | Device Anomaly | 0.08 | Device |
| 8 | Keyboard Dynamics | 0.08 | Timing |
| 9 | Pointer Precision | 0.06 | Movement |
| 10 | Scroll Behavior | 0.04 | Movement |
| 11 | Pointer Pressure | 0.04 | Device |
| 12 | Tab Visibility | 0.06 | Environment |
| 13 | Environment Consistency | 0.06 | Environment |
| 14 | Time Anomaly | 0.06 | Timing |

**Risk Levels:** Low (<30%) · Medium (30-50%) · High (50-70%) · Critical (>70%) → Bot blocked at >65%

### 🎨 Full Theme Customization

- **3 themes:** Dark, Light
- **8 preset colors + custom hex:** Emerald, Blue, Purple, Pink, Amber, Red, Cyan, Orange
- **3 sizes:** Compact (0.85x), Normal (1x), Large (1.15x)
- **Border radius:** 0-32px slider
- **3 languages:** Spanish, English, Portuguese
- Live preview + generated config/embed code for copy-paste

### 🔒 Anti-Bot / Anti-AI Detection

- **Headless browser detection:** `navigator.webdriver`, HeadlessChrome UA, missing `navigator.languages`
- **Automation detection:** `__nightmare`, `callPhantom`, `_phantom`, Phantom/Selenium UA strings
- **Device fingerprinting:** WebGL renderer/vendor, Canvas, plugins count, hardware concurrency, maxTouchPoints, screen resolution, timezone, platform
- **Fingerprinting-resistant:** All tracking is DOM-isolated, no server-side data collection

### 📊 Analytics Dashboard

- Total attempts, success rate, average risk score
- Challenge type distribution chart
- Risk level breakdown (4 levels)
- Real-time activity log with auto-refresh
- Data stored in localStorage (200 entries max)

---

## 🚀 Installation

### Option 1: Embed Script Tag (Any Website)

```html
<!-- 1. Add container -->
<div id="captcha-shield"></div>

<!-- 2. Load widget -->
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>

<!-- 3. Receive result -->
<script>
  window.onCaptchaVerified = function(response) {
    console.log('Verified:', response);
    // response = { success, riskScore, riskLevel, token }
  };
</script>
```

### Option 2: Advanced Configuration

```html
<script>
  window.CaptchaShieldConfig = {
    theme: 'dark',           // 'dark' | 'light'
    primaryColor: '#10b981', // Any hex color
    language: 'es',          // 'es' | 'en' | 'pt'
    size: 'normal',          // 'compact' | 'normal' | 'large'
    borderRadius: '16px',
    containerId: 'captcha-shield',
    timeout: 120000,         // 2 min timeout
  };
</script>
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
```

### Option 3: Clone & Run Locally

```bash
git clone https://github.com/smouj/captcha-shield.git
cd captcha-shield
npm install
npm run dev
# Open http://localhost:3000
```

To build for GitHub Pages:

```bash
npm run build
# Output in docs/ folder
```

---

## 🔄 How It Works

```
Fingerprinting → Challenge Generation → 14-Signal Monitoring → Compound Scoring → Final Verification
```

### Risk Scoring Formula

```
risk = (
  linearity × 0.10 + timing × 0.10 + speed × 0.08 +
  hesitation × 0.12 + entropy × 0.06 + bezier × 0.06 +
  device × 0.08 + keyboard × 0.08 + pointer × 0.06 +
  scroll × 0.04 + pressure × 0.04 + tab × 0.06 +
  environment × 0.06 + temporal × 0.06
)
```

**Decision rules:**
- `isBot = true` (risk > 65%) → Always rejected
- `risk > 65%` OR wrong answer → Rejected
- `risk ≤ 65%` AND correct answer → Accepted

---

## 🏗️ Architecture

### Project Structure

```
captcha-shield/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (dark theme, Geist fonts)
│   │   ├── page.tsx                      # Landing page (Demo/Install/Customize/Analytics tabs)
│   │   ├── verify/page.tsx               # QR mobile verification page
│   │   ├── widget-embed/page.tsx         # Embeddable widget iframe page
│   │   └── globals.css                   # Tailwind CSS v4 + theme variables
│   ├── components/captcha/
│   │   ├── CaptchaWidget.tsx             # Main widget orchestrator (state machine)
│   │   ├── PuzzleChallenge.tsx           # Canvas sliding puzzle
│   │   ├── ImageSelectChallenge.tsx      # 4×4 SVG shape selection grid
│   │   ├── MathVisualChallenge.tsx       # Canvas math with distortion
│   │   ├── PatternTraceChallenge.tsx     # Dot-to-dot pattern tracing
│   │   ├── Rotation3DChallenge.tsx       # 3D shape rotation (cube/prism/pyramid)
│   │   ├── AudioChallenge.tsx            # Web Audio API tones
│   │   ├── TimelineOrderChallenge.tsx    # Historical events ordering
│   │   ├── QRVerification.tsx            # QR code + 6-digit mobile verification
│   │   ├── BehaviorTracker.tsx           # Invisible behavioral data collector
│   │   ├── CaptchaResult.tsx             # Animated result + 14-signal breakdown
│   │   ├── AdminDashboard.tsx            # Analytics panel with charts
│   │   ├── InstallGuide.tsx              # Integration guide with syntax highlighter
│   │   └── ThemeCustomizer.tsx           # Live theme customization panel
│   ├── lib/
│   │   ├── captcha-engine.ts             # 7 challenge generators + verifier
│   │   ├── behavioral-analyzer.ts        # 14-signal anti-bot engine
│   │   └── utils.ts                      # cn() utility (clsx + twMerge)
│   └── hooks/                            # use-mobile, use-toast
├── public/
│   ├── widget.js                         # Embeddable widget script (880 lines)
│   ├── logo-icon-*.png                   # Brand assets
│   └── social-banner.png                 # OG/Twitter card image
├── docs/                                 # Static export (GitHub Pages)
└── package.json
```

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | Framework with App Router (static export) |
| **React 19** | UI library |
| **TypeScript 5** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Accessible component library |
| **Framer Motion** | Smooth animations |
| **QRCode** | QR code generation |
| **HTML5 Canvas** | Challenge rendering (anti-DOM-parsing) |

### Deployment

The project uses **static export** (`output: "export"`) with `basePath: "/captcha-shield"` for deployment to GitHub Pages. The `docs/` directory is the build output.

---

## 🎯 Live Demo

Visit [smouj.github.io/captcha-shield](https://smouj.github.io/captcha-shield/) for:
- **Demo:** Interactive CAPTCHA preview
- **Instalar:** Step-by-step integration guide
- **Personalizar:** Live theme customizer with generated code
- **Analíticas:** Verification statistics dashboard

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

<div align="center">

**Built with ❤️ to protect the web from automated abuse**

</div>
