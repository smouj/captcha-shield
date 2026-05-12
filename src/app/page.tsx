'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Lock, Eye, Fingerprint, Globe, BarChart3,
  Puzzle, Cpu, Users, ArrowRight, Github, Star, ChevronDown,
} from 'lucide-react';
import { CaptchaWidgetV4 } from '@/components/captcha/CaptchaWidgetV4';
import { AdminDashboardV4 } from '@/components/captcha/AdminDashboardV4';
import { WidgetConfig, VerificationMode, ChallengeType } from '@/lib/types';
import { getSupportedLanguages, getLanguageName, LanguageCode } from '@/lib/i18n';

// ─── Animation Variants ─────────────────────────────────────────────────────

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const CHALLENGES = [
  { type: ChallengeType.ADVERSARIAL_PUZZLE, name: 'Adversarial Puzzle', icon: Puzzle, resistance: 82, category: 'Visual', desc: 'AI struggles with adversarial noise patterns designed to confuse computer vision while remaining intuitive to humans.' },
  { type: ChallengeType.HUMAN_INTUITION_GRID, name: 'Human Intuition Grid', icon: Eye, resistance: 91, category: 'Visual', desc: 'Requires holistic scene understanding and intuition that neural networks fundamentally lack.' },
  { type: ChallengeType.PHYSICS_CHAOS, name: 'Physics Chaos', icon: Cpu, resistance: 88, category: 'Interactive', desc: 'Real-time physics simulation demands embodied understanding of gravity and balance.' },
  { type: ChallengeType.TEMPORAL_MEMORY, name: 'Temporal Memory', icon: BarChart3, resistance: 75, category: 'Cognitive', desc: 'Sequential memory tasks exploit human episodic memory which AI cannot replicate authentically.' },
  { type: ChallengeType.OPTICAL_ILLUSION_MAZE, name: 'Optical Illusion Maze', icon: Eye, resistance: 93, category: 'Visual', desc: 'Adversarial illusions trick AI vision systems while humans naturally see through them.' },
  { type: ChallengeType.VOICE_RHYTHM, name: 'Voice Rhythm', icon: Globe, resistance: 85, category: 'Audio', desc: 'Rhythmic pattern reproduction requires natural timing variance that bots cannot mimic.' },
  { type: ChallengeType.GESTURE_SIGNATURE, name: 'Gesture Signature', icon: Fingerprint, resistance: 87, category: 'Biometric', desc: 'Drawing gestures with natural motor variance is uniquely human and impossible to replay.' },
  { type: ChallengeType.CONTEXTUAL_REASONING, name: 'Contextual Reasoning', icon: Cpu, resistance: 94, category: 'Cognitive', desc: 'Requires common-sense understanding of physical world causality that AI lacks.' },
  { type: ChallengeType.LIVE_3D_BIOMETRIC, name: 'Live 3D Biometric', icon: Users, resistance: 90, category: 'Biometric', desc: 'Real-time 3D object manipulation demands spatial reasoning no bot can fake.' },
  { type: ChallengeType.ZERO_KNOWLEDGE_PROOF, name: 'Zero-Knowledge Proof', icon: Lock, resistance: 96, category: 'Crypto', desc: 'Cryptographic proof-of-work combined with visual challenge creates an impossible barrier for AI.' },
];

const SIGNAL_CATEGORIES = [
  { name: 'Motor', count: 8, accent: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', color: '#a855f7', signals: ['Mouse Path Linearity', 'Mouse Speed Variance', 'Mouse Acceleration', 'Pointer Precision', 'Pointer Pressure', 'Click Precision', 'Scroll Behavior', 'Gesture Smoothness'] },
  { name: 'Temporal', count: 6, accent: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', color: '#06b6d4', signals: ['Timing Consistency', 'Reaction Time', 'Hesitation Pattern', 'Inter-event Interval', 'Task Rhythm', 'Temporal Anomaly'] },
  { name: 'Device', count: 6, accent: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30', color: '#14b8a6', signals: ['Device Fingerprint', 'Screen Resolution', 'Timezone Consistency', 'Battery API', 'Sensor Fusion', 'WebRTC Fingerprint'] },
  { name: 'Cognitive', count: 4, accent: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', color: '#f59e0b', signals: ['Decision Latency', 'Error Correction', 'Pattern Recognition', 'Entropy Score'] },
  { name: 'Environment', count: 2, accent: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', color: '#10b981', signals: ['Tab Visibility', 'Environment Consistency'] },
  { name: 'Network', count: 1, accent: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', color: '#f97316', signals: ['Connection Fingerprint'] },
  { name: 'Biometric', count: 1, accent: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30', color: '#f43f5e', signals: ['Keyboard Dynamics'] },
];

const DEFENSE_LAYERS = [
  { step: 1, icon: Eye, name: 'Headless Detection', desc: '40+ detection vectors for headless browsers, automation frameworks, and bot fingerprints.', color: '#ef4444' },
  { step: 2, icon: Fingerprint, name: 'Behavioral Pre-check', desc: '28 behavioral signals analyzed via Bayesian scoring before any challenge is shown.', color: '#f97316' },
  { step: 3, icon: Zap, name: 'Dynamic Challenge Selection', desc: 'Challenge type and difficulty dynamically chosen based on real-time risk assessment.', color: '#eab308' },
  { step: 4, icon: Puzzle, name: 'Interactive Challenge', desc: 'One of 10 AI-proof challenges presented with behavioral verification during interaction.', color: '#10b981' },
  { step: 5, icon: Globe, name: 'QR Mobile Verification', desc: 'High-risk sessions require cross-device verification via encrypted QR code.', color: '#14b8a6' },
  { step: 6, icon: Lock, name: 'WebAuthn / Passkey', desc: 'Hardware-backed authentication as an optional additional verification layer.', color: '#06b6d4' },
  { step: 7, icon: Shield, name: 'Cryptographic Token', desc: 'JWT HMAC-SHA256 token issued with session fingerprint and risk score embedded.', color: '#10b981' },
];

const NAV_LINKS = ['Demo', 'Architecture', 'Signals', 'Challenges', 'Dashboard', 'Install'];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Home() {
  const [lang, setLang] = useState<LanguageCode>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [installTab, setInstallTab] = useState(0);
  const [widgetConfig, setWidgetConfig] = useState<Partial<WidgetConfig>>({
    mode: VerificationMode.FORTRESS,
    language: 'en',
    theme: 'dark',
    size: 'normal',
    showRiskMeter: true,
    accessibilityMode: false,
  });
  const [telemetry] = useState({
    riskScore: 0.12,
    activeSignals: 14,
    headlessDetected: false,
    fingerprintHash: 'a7f3…e2b1',
  });

  const supportedLangs = getSupportedLanguages();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const cycleMode = () => {
    const modes: VerificationMode[] = [VerificationMode.LIGHT, VerificationMode.FORTRESS, VerificationMode.HYBRID];
    const idx = modes.indexOf(widgetConfig.mode!);
    setWidgetConfig(c => ({ ...c, mode: modes[(idx + 1) % modes.length] }));
  };

  const cycleSize = () => {
    const sizes: WidgetConfig['size'][] = ['micro', 'compact', 'normal', 'full'];
    const idx = sizes.indexOf(widgetConfig.size!);
    setWidgetConfig(c => ({ ...c, size: sizes[(idx + 1) % sizes.length] }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* ─── BG Effects ──────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-emerald-500/[0.04] rounded-full blur-[200px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-teal-500/[0.03] rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-emerald-900/[0.04] rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10">
        {/* ═══════════════════════════════════════════════════════════════════
            1. NAVIGATION BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-white leading-none">CAPTCHA Shield</h1>
                <p className="text-[10px] text-emerald-400/80 font-medium">v4.0 Fortress</p>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <button
                  key={link}
                  onClick={() => scrollTo(link.toLowerCase())}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  {link}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* GitHub Stars */}
              <a
                href="https://github.com/smouj/captcha-shield"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300 hover:text-white hover:border-white/20 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <Star className="w-3 h-3 text-amber-400" />
                <span>2.4k</span>
              </a>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-gray-300 hover:text-white transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{getLanguageName(lang)}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-40 rounded-xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    {supportedLangs.map(code => (
                      <button
                        key={code}
                        onClick={() => { setLang(code); setLangOpen(false); setWidgetConfig(c => ({ ...c, language: code })); }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-white/[0.05] transition-colors ${lang === code ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-300'}`}
                      >
                        {getLanguageName(code)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════════════════
            2. HERO SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Animated shield */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 12 }}
              className="mx-auto mb-8 w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center relative"
            >
              <Shield className="w-10 h-10 text-emerald-400" />
              <motion.div
                className="absolute inset-0 rounded-3xl border-2 border-emerald-400/40"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
            >
              <span className="text-white">The CAPTCHA That</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Nobody Breaks
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-6 text-sm md:text-base text-gray-400 max-w-2xl mx-auto"
            >
              <span className="text-emerald-400 font-semibold">10</span> AI-proof challenges ·{' '}
              <span className="text-teal-400 font-semibold">28</span> behavioral signals ·{' '}
              <span className="text-cyan-400 font-semibold">7</span> defense layers ·{' '}
              Zero-trust architecture
            </motion.p>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-wrap justify-center gap-3"
            >
              {['Open Source', '100% Client-Side', '2 Lines of Code'].map(badge => (
                <span key={badge} className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
                  {badge}
                </span>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => scrollTo('demo')}
                className="group px-8 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:bg-emerald-400 transition-all flex items-center gap-2"
              >
                Try Live Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="https://github.com/smouj/captcha-shield"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-gray-300 font-semibold text-sm hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            3. LIVE DEMO SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="demo" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Live Demo</h2>
                <p className="mt-3 text-gray-400 text-sm">Interact with the widget and configure it in real-time</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Widget */}
                <div className="lg:col-span-2 flex justify-center">
                  <div className="w-full max-w-md">
                    <CaptchaWidgetV4 config={widgetConfig} onVerify={(token) => console.log('Verified:', token)} />
                  </div>
                </div>

                {/* Config Panel */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white">Configuration</h3>

                    {/* Mode */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Verification Mode</label>
                      <button onClick={cycleMode} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-emerald-400 font-medium hover:bg-white/[0.08] transition-colors text-left">
                        {widgetConfig.mode === VerificationMode.LIGHT && '⚡ Light'}
                        {widgetConfig.mode === VerificationMode.FORTRESS && '🏰 Fortress'}
                        {widgetConfig.mode === VerificationMode.HYBRID && '🔄 Hybrid'}
                      </button>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Language</label>
                      <select
                        value={widgetConfig.language}
                        onChange={e => setWidgetConfig(c => ({ ...c, language: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] transition-colors bg-gray-900"
                      >
                        {supportedLangs.map(code => (
                          <option key={code} value={code}>{getLanguageName(code)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Theme */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Theme</label>
                      <div className="mt-1 flex gap-2">
                        {(['light', 'dark'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setWidgetConfig(c => ({ ...c, theme: t }))}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              widgetConfig.theme === t
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                : 'bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            {t === 'light' ? '☀️ Light' : '🌙 Dark'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size */}
                    <div>
                      <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Size</label>
                      <button onClick={cycleSize} className="mt-1 w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] transition-colors text-left capitalize">
                        {widgetConfig.size}
                      </button>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-1">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-gray-400">Show Risk Meter</span>
                        <div
                          onClick={() => setWidgetConfig(c => ({ ...c, showRiskMeter: !c.showRiskMeter }))}
                          className={`w-9 h-5 rounded-full transition-colors relative ${widgetConfig.showRiskMeter ? 'bg-emerald-500' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${widgetConfig.showRiskMeter ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs text-gray-400">Accessibility Mode</span>
                        <div
                          onClick={() => setWidgetConfig(c => ({ ...c, accessibilityMode: !c.accessibilityMode }))}
                          className={`w-9 h-5 rounded-full transition-colors relative ${widgetConfig.accessibilityMode ? 'bg-emerald-500' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${widgetConfig.accessibilityMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Telemetry */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Signal Telemetry
                    </h3>
                    {[
                      { label: 'Risk Score', value: `${(telemetry.riskScore * 100).toFixed(0)}%`, color: telemetry.riskScore < 0.25 ? '#10b981' : '#eab308' },
                      { label: 'Active Signals', value: `${telemetry.activeSignals}/28`, color: '#06b6d4' },
                      { label: 'Headless Detected', value: telemetry.headlessDetected ? 'Yes' : 'No', color: telemetry.headlessDetected ? '#ef4444' : '#10b981' },
                      { label: 'Device FP', value: telemetry.fingerprintHash, color: '#a855f7' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                        <span className="text-xs text-gray-500">{item.label}</span>
                        <span className="text-xs font-mono font-medium" style={{ color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            4. 10 CHALLENGES GALLERY
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="challenges" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">10 AI-Proof Challenges</h2>
                <p className="mt-3 text-gray-400 text-sm">Each challenge exploits a fundamental gap in AI capabilities</p>
              </div>

              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {CHALLENGES.map((ch, i) => (
                  <motion.div
                    key={ch.type}
                    variants={staggerItem}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] p-5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                      <ch.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{ch.name}</h3>
                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 mb-2">{ch.category}</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{ch.desc}</p>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500">AI Resistance</span>
                        <span className="text-[10px] font-mono text-emerald-400">{ch.resistance}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${ch.resistance}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.06 }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            5. 28 SIGNAL MATRIX
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="signals" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">28-Signal Matrix</h2>
                <p className="mt-3 text-gray-400 text-sm">Behavioral signals organized by category — each weighted and anomaly-scored</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {SIGNAL_CATEGORIES.map((cat, ci) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: ci * 0.06 }}
                    className={`rounded-2xl border ${cat.border} bg-white/[0.02] overflow-hidden`}
                  >
                    {/* Category header */}
                    <div className={`px-4 py-3 ${cat.bg} border-b ${cat.border}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${cat.accent}`}>{cat.name}</span>
                        <span className="text-[10px] font-mono text-gray-500">{cat.count} signals</span>
                      </div>
                    </div>
                    {/* Signals list */}
                    <div className="p-3 space-y-1.5">
                      {cat.signals.map((signal, si) => (
                        <div key={signal} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-[11px] text-gray-400 flex-1 truncate">{signal}</span>
                          <div className="w-10 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${Math.random() * 60 + 20}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5, delay: ci * 0.05 + si * 0.03 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: cat.color, opacity: 0.6 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            6. 7 DEFENSE LAYERS ARCHITECTURE
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="architecture" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">7 Defense Layers</h2>
                <p className="mt-3 text-gray-400 text-sm">Each layer independently blocks attacks — a single bypass is never enough</p>
              </div>

              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-6 md:left-8 top-8 bottom-8 w-px bg-gradient-to-b from-red-500/40 via-amber-500/40 to-emerald-500/40" />

                <div className="space-y-4">
                  {DEFENSE_LAYERS.map((layer, i) => (
                    <motion.div
                      key={layer.step}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="relative flex items-start gap-4 md:gap-6"
                    >
                      {/* Step indicator */}
                      <div className="relative z-10 shrink-0 w-12 md:w-16 h-12 md:h-16 rounded-2xl bg-gray-900 border border-white/[0.08] flex items-center justify-center" style={{ borderColor: `${layer.color}30` }}>
                        <layer.icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: layer.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5 group hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">Layer {layer.step}</span>
                          <h3 className="text-sm font-semibold text-white">{layer.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{layer.desc}</p>
                      </div>

                      {/* Arrow to next */}
                      {i < DEFENSE_LAYERS.length - 1 && (
                        <div className="hidden md:flex absolute -bottom-4 left-[30px] items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-gray-600 rotate-90" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            7. INSTALL SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="install" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Get Started in Seconds</h2>
                <p className="mt-3 text-gray-400 text-sm">Drop-in integration for any web project</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {['Quick Start', 'React Component', 'Advanced Config'].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setInstallTab(i)}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      installTab === i
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Code blocks */}
              <div className="rounded-2xl border border-white/[0.06] bg-gray-900 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 text-[11px] text-gray-500">
                    {installTab === 0 ? 'index.html' : installTab === 1 ? 'App.tsx' : 'config.js'}
                  </span>
                </div>
                <div className="p-5 font-mono text-xs md:text-sm leading-relaxed overflow-x-auto">
                  {installTab === 0 && (
                    <pre className="text-gray-300">
                      <span className="text-gray-500">{'<!-- Add to your HTML -->'}</span>{'\n'}
                      {'<div '}<span className="text-emerald-400">id</span>=<span className="text-amber-300">"captcha-shield"</span>{'></div>'}{'\n'}
                      {'<script '}<span className="text-emerald-400">src</span>=<span className="text-amber-300">"https://smouj.github.io/captcha-shield/v4/widget.js"</span>{'></script>'}
                    </pre>
                  )}
                  {installTab === 1 && (
                    <pre className="text-gray-300">
{`import { CaptchaWidgetV4 } from 'captcha-shield';

<CaptchaWidgetV4
  config={{ mode: "fortress" }}
  onVerify={(token) => console.log(token)}
/>`}
                    </pre>
                  )}
                  {installTab === 2 && (
                    <pre className="text-gray-300">
                      <span className="text-gray-500">{'// Advanced configuration'}</span>{'\n'}
                      <span className="text-cyan-400">window</span>{'.CaptchaShieldConfig = {'}{'\n'}
                      {'  mode: '}<span className="text-amber-300">"fortress"</span>{','}{'\n'}
                      {'  serverVerifyUrl: '}<span className="text-amber-300">"https://yourdomain.com/api/captcha/verify"</span>{','}{'\n'}
                      {'  maxAttempts: '}<span className="text-purple-400">2</span>{','}{'\n'}
                      {'  language: '}<span className="text-amber-300">"auto"</span>{','}{'\n'}
                      {'  theme: '}<span className="text-amber-300">"dark"</span>{','}{'\n'}
                      {'};'}
                    </pre>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            8. DASHBOARD SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="dashboard" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-7xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Analytics Dashboard</h2>
                <p className="mt-3 text-gray-400 text-sm">Real-time verification analytics, challenge distribution, risk scoring, and signal anomaly monitoring</p>
              </div>
              <AdminDashboardV4 />
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            9. ROADMAP
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Roadmap</h2>
                <p className="mt-3 text-gray-400 text-sm">Where we are and where we&apos;re going</p>
              </div>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500/60 via-amber-500/30 to-gray-700/30" />

                <div className="space-y-6">
                  {[
                    { icon: '✅', version: 'v4.0 Fortress', status: 'current', desc: '10 challenges, 28 signals, 7 defense layers, JWT tokens', color: 'emerald' },
                    { icon: '🔄', version: 'v4.1', status: 'in-progress', desc: 'TensorFlow.js Lite on-device ML model for real-time bot scoring', color: 'amber' },
                    { icon: '🔄', version: 'v4.2', status: 'planned', desc: 'WebAssembly challenge modules for near-native performance', color: 'amber' },
                    { icon: '⬜', version: 'v5.0', status: 'future', desc: 'Multi-tenant SaaS platform with team management and billing', color: 'gray' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.version}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="relative flex items-start gap-4"
                    >
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
                        item.color === 'emerald' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                        item.color === 'amber' ? 'bg-amber-500/15 border border-amber-500/25' :
                        'bg-white/[0.04] border border-white/[0.08]'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${item.color === 'emerald' ? 'text-emerald-400' : item.color === 'amber' ? 'text-amber-400' : 'text-gray-400'}`}>
                            {item.version}
                          </span>
                          {item.status === 'current' && (
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CURRENT</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            10. FOOTER
        ═══════════════════════════════════════════════════════════════════ */}
        <footer className="mt-auto border-t border-white/[0.04] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Logo + copyright */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">CAPTCHA Shield v4.0</p>
                  <p className="text-[10px] text-gray-500">&copy; {new Date().getFullYear()} CAPTCHA Shield Contributors</p>
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-6 text-xs text-gray-400">
                {[
                  { label: 'GitHub', href: 'https://github.com/smouj/captcha-shield' },
                  { label: 'Documentation', href: 'https://smouj.github.io/captcha-shield' },
                  { label: 'Security', href: 'https://github.com/smouj/captcha-shield/security' },
                  { label: 'Contributing', href: 'https://github.com/smouj/captcha-shield/blob/main/CONTRIBUTING.md' },
                ].map(link => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    {link.label}
                  </a>
                ))}
              </div>

              {/* MIT License */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-gray-400">MIT License</span>
              </div>
            </div>

            <div className="mt-6 text-center text-[11px] text-gray-600">
              Built with ❤️ for the open-source community
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
