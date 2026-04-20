'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, Eye, Activity, Zap, Lock, Fingerprint, Gauge } from 'lucide-react';
import CaptchaWidget from '@/components/captcha/CaptchaWidget';
import AdminDashboard from '@/components/captcha/AdminDashboard';

type ViewMode = 'demo' | 'analytics';

const features = [
  {
    icon: <Fingerprint className="w-5 h-5" />,
    title: 'Análisis de comportamiento',
    description: 'Monitoreo en tiempo real de movimientos del ratón, patrones de clic y velocidad para detectar automatización.',
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'Detección de entropía',
    description: 'Evaluación de Shannon entropy para identificar patrones predecibles típicos de bots.',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Resistencia a OCR',
    description: 'Ecuaciones matemáticas renderizadas en canvas con distorsión y ruido visual.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Verificación multi-capa',
    description: 'Combinación de desafío correcto + análisis comportamental para máxima seguridad.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: '4 tipos de desafío',
    description: 'Rompecabezas deslizante, selección de imágenes, matemática visual y trazado de patrones.',
  },
  {
    icon: <Gauge className="w-5 h-5" />,
    title: 'Puntuación de riesgo',
    description: 'Sistema de scoring basado en linealidad, timing, velocidad, hesitación y curvas Bézier.',
  },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('demo');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/3 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/3 rounded-full blur-[200px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100 tracking-tight">CAPTCHA Shield</h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">Sistema Anti-Bot v2.0</p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800">
              <button
                onClick={() => setViewMode('demo')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'demo'
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'analytics'
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Analíticas
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero Section */}
          <section className="py-12 sm:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', bounce: 0.4 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Análisis de comportamiento activo</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-50 tracking-tight">
                Verificación de seguridad
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                  inteligente anti-bot
                </span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Sistema CAPTCHA avanzado que combina desafíos interactivos con análisis profundo de
                comportamiento para distinguir entre humanos y bots automatizados.
              </p>
            </motion.div>
          </section>

          {/* Demo / Analytics Section */}
          <section className="pb-12">
            <AnimatePresence mode="wait">
              {viewMode === 'demo' ? (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-md mx-auto"
                >
                  <CaptchaWidget />
                </motion.div>
              ) : (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminDashboard />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Features Section */}
          <section className="pb-16 sm:pb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-10">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-100">
                  Protección multicapa contra bots
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto">
                  Cada verificación analiza múltiples señales comportamentales para garantizar la autenticidad
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="group bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5 hover:border-emerald-500/20 hover:bg-gray-900/80 transition-all duration-300"
                  >
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500/15 transition-colors">
                      {feature.icon}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-200 mb-1.5">{feature.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* How It Works */}
          <section className="pb-16 sm:pb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-10">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-100">
                  ¿Cómo funciona el análisis?
                </h3>
              </div>

              <div className="max-w-3xl mx-auto bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 sm:p-8">
                <div className="space-y-6">
                  <Step
                    number={1}
                    title="Captura de datos comportamentales"
                    description="Se registran todos los movimientos del ratón, clics, scroll y tiempos de interacción mientras el usuario resuelve el CAPTCHA."
                  />
                  <Step
                    number={2}
                    title="Análisis de patrones"
                    description="El motor de análisis calcula métricas como linealidad de trayectoria, consistencia temporal, varianza de velocidad, hesitación y entropía."
                  />
                  <Step
                    number={3}
                    title="Scoring de riesgo"
                    description="Cada señal contribuye con un peso específico al score final. Puntuaciones altas (>70%) indican comportamiento automatizado."
                  />
                  <Step
                    number={4}
                    title="Verificación compuesta"
                    description="Se combina la respuesta del desafío con el análisis comportamental. Solo las interacciones que pasan ambos filtros son verificadas."
                  />
                </div>

                {/* Scoring Formula */}
                <div className="mt-8 pt-6 border-t border-gray-800/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Fórmula de scoring
                  </h4>
                  <div className="bg-gray-950 rounded-lg p-4 font-mono text-xs text-emerald-400/90 leading-relaxed overflow-x-auto">
                    <p>riesgo = (</p>
                    <p className="pl-4">linealidad × 0.20 +</p>
                    <p className="pl-4">timing × 0.20 +</p>
                    <p className="pl-4">velocidad × 0.15 +</p>
                    <p className="pl-4">hesitación × 0.25 +</p>
                    <p className="pl-4">entropía × 0.10 +</p>
                    <p className="pl-4">bézier × 0.10</p>
                    <p>)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-md mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500/50" />
              <span className="text-xs text-gray-600">CAPTCHA Shield — Sistema Anti-Bot</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>4 tipos de desafío</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Análisis comportamental</span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span>Scoring de riesgo</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center border border-emerald-500/20">
        <span className="text-sm font-bold text-emerald-400">{number}</span>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-0.5">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
