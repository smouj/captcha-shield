'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Brain, Eye, Activity, Zap, Lock, Fingerprint, Shield,
  Smartphone, Volume2, Calendar, RotateCw, Puzzle, ScanSearch, MonitorSmartphone
} from 'lucide-react';
import CaptchaWidget from '@/components/captcha/CaptchaWidget';
import AdminDashboard from '@/components/captcha/AdminDashboard';

type ViewMode = 'demo' | 'analytics';

const features = [
  { icon: <Fingerprint className="w-4 h-4" />, title: '14 señales de comportamiento', desc: 'Análisis profundo en tiempo real: linealidad, timing, velocidad, entropía, presión, visibilidad, fingerprinting y más.' },
  { icon: <Brain className="w-4 h-4" />, title: 'Detección de headless/automation', desc: 'Detección de navegadores headless, herramientas de automatización y entornos virtuales mediante fingerprinting avanzado.' },
  { icon: <Shield className="w-4 h-4" />, title: 'Fingerprinting de dispositivo', desc: 'WebGL renderer, canvas, plugins, hardware concurrency, maxTouchPoints y más señales de entorno para identificar bots.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Scoring multi-capa', desc: 'Puntuación de riesgo compuesta con 14 señales ponderadas, clasificación en 4 niveles y confianza calculada.' },
  { icon: <Lock className="w-4 h-4" />, title: '7 desafíos interactivos', desc: 'Puzzle, selección de imágenes, matemática visual, patrón, rotación 3D, audio y orden cronológico.' },
  { icon: <Smartphone className="w-4 h-4" />, title: 'Verificación móvil QR', desc: 'Código QR temporal + código de 6 dígitos para verificación mediante teléfono móvil.' },
];

const challengeTypes = [
  { icon: <Puzzle className="w-4 h-4" />, name: 'Rompecabezas', desc: '2-3 piezas con formas complejas (onda, tab)' },
  { icon: <ScanSearch className="w-4 h-4" />, name: 'Selección 4x4', desc: '16 celdas con instrucciones complejas' },
  { icon: <Eye className="w-4 h-4" />, name: 'Matemática visual', desc: 'Ecuaciones con distorsión y ruido' },
  { icon: <Activity className="w-4 h-4" />, name: 'Patrón memorizado', desc: 'Memoriza y reproduce el trazado' },
  { icon: <RotateCw className="w-4 h-4" />, name: 'Rotación 3D', desc: 'Cubo/Prisma/Pirámide con proyección' },
  { icon: <Volume2 className="w-4 h-4" />, name: 'Desafío de audio', desc: 'Tones Web Audio API + preguntas' },
  { icon: <Calendar className="w-4 h-4" />, name: 'Orden cronológico', desc: 'Eventos históricos en orden' },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('demo');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* BG effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/3 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/3 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/20">
                <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-100 tracking-tight">CAPTCHA Shield</h1>
                <p className="text-[9px] text-gray-500 -mt-0.5">Sistema Anti-Bot/AI v3.0</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800">
              <button onClick={() => setViewMode('demo')}
                className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === 'demo' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}>
                Demo
              </button>
              <button onClick={() => setViewMode('analytics')}
                className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${viewMode === 'analytics' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}>
                Analíticas
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <section className="py-10 sm:py-14 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-300">14 señales activas · 7 desafíos · Verificación QR</span>
              </motion.div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-50 tracking-tight">
                Verificación inteligente
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-purple-400">anti-bot / anti-IA</span>
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
                Sistema CAPTCHA de nueva generación con 14 señales de comportamiento, fingerprinting de dispositivo, 7 tipos de desafío interactivos y verificación móvil QR para máxima seguridad.
              </p>
            </motion.div>
          </section>

          {/* Demo / Analytics */}
          <section className="pb-10">
            {viewMode === 'demo' ? (
              <motion.div key="demo" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                className="max-w-md mx-auto">
                <CaptchaWidget />
              </motion.div>
            ) : (
              <motion.div key="analytics" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
                <AdminDashboard />
              </motion.div>
            )}
          </section>

          {/* Challenge Types */}
          <section className="pb-14">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="text-center mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-100">7 tipos de desafío + QR</h3>
                <p className="text-xs text-gray-500 mt-1">Cada verificación genera un desafío aleatorio entre los 7 tipos disponibles</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {challengeTypes.map((ct, i) => (
                  <motion.div key={ct.name} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className="group bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-3.5 hover:border-emerald-500/20 hover:bg-gray-900/80 transition-all duration-300">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 mb-2 group-hover:bg-emerald-500/15 transition-colors">
                      {ct.icon}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-200 mb-0.5">{ct.name}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{ct.desc}</p>
                  </motion.div>
                ))}
                {/* QR */}
                <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: 7 * 0.05 }}
                  className="group bg-purple-900/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-3.5 hover:border-purple-500/40 hover:bg-purple-900/30 transition-all duration-300">
                  <div className="w-8 h-8 bg-purple-500/15 rounded-lg flex items-center justify-center text-purple-400 mb-2">
                    <MonitorSmartphone className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-purple-300 mb-0.5">Verificación QR</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Código QR + 6 dígitos. Requiere teléfono físico.</p>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Features */}
          <section className="pb-14">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="text-center mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-100">Motor anti-IA de 14 señales</h3>
                <p className="text-xs text-gray-500 mt-1">Análisis multicapa que combina movimiento, temporización, dispositivo y entorno</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {features.map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                    className="group bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-3.5 hover:border-emerald-500/20 hover:bg-gray-900/80 transition-all duration-300">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 mb-2 group-hover:bg-emerald-500/15 transition-colors">
                      {f.icon}
                    </div>
                    <h4 className="text-xs font-semibold text-gray-200 mb-1">{f.title}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* How it works */}
          <section className="pb-14">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <div className="text-center mb-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-100">Cómo funciona</h3>
              </div>
              <div className="max-w-2xl mx-auto bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5 sm:p-6 space-y-4">
                <Step number={1} title="Fingerprinting de dispositivo" desc="Se analiza WebGL, Canvas, plugins, hardware concurrency, resolución, timezone y se detectan navegadores headless y herramientas de automatización." />
                <Step number={2} title="Generación de desafío" desc="Se genera aleatoriamente uno de 7 tipos de desafío interactivo o se activa la verificación QR con código de 6 dígitos." />
                <Step number={3} title="Monitoreo de 14 señales" desc="Durante la interacción se capturan movimientos, clics, teclado, presión, scroll, visibilidad de pestaña y más datos comportamentales." />
                <Step number={4} title="Scoring compuesto" desc="Las 14 señales se combinan con pesos específicos para generar una puntuación de riesgo con 4 niveles: bajo, medio, alto y crítico." />
                <Step number={5} title="Verificación final" desc="Se combina el resultado del desafío con el análisis comportamental. Solo las interacciones que pasan ambos filtros son verificadas." />

                <div className="mt-6 pt-4 border-t border-gray-800/50">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Fórmula de scoring (14 señales)</h4>
                  <div className="bg-gray-950 rounded-lg p-3 font-mono text-[10px] text-emerald-400/90 leading-relaxed overflow-x-auto">
                    <p>riesgo = (</p>
                    <p className="pl-3">linealidad x 0.10 + timing x 0.10 + velocidad x 0.08 +</p>
                    <p className="pl-3">hesitación x 0.12 + entropía x 0.06 + bézier x 0.06 +</p>
                    <p className="pl-3">dispositivo x 0.08 + teclado x 0.08 + puntero x 0.06 +</p>
                    <p className="pl-3">scroll x 0.04 + presión x 0.04 + pestaña x 0.06 +</p>
                    <p className="pl-3">entorno x 0.06 + temporal x 0.06</p>
                    <p>)</p>
                    <p className="mt-1 text-gray-600">Niveles: bajo (&lt;30%) · medio (30-50%) · alto (50-70%) · crítico (&gt;70%)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-md mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={14} height={14} className="opacity-40" />
              <span className="text-[10px] text-gray-600">CAPTCHA Shield v3.0 — Sistema Anti-Bot/AI</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              <span>7 desafíos</span>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-700" />
              <span>14 señales</span>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-700" />
              <span>QR móvil</span>
              <span className="w-0.5 h-0.5 rounded-full bg-gray-700" />
              <span>Fingerprinting</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 bg-emerald-500/15 rounded-lg flex items-center justify-center border border-emerald-500/20">
        <span className="text-xs font-bold text-emerald-400">{number}</span>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-200 mb-0.5">{title}</h4>
        <p className="text-[10px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
