'use client';

import { motion } from 'framer-motion';
import { Monitor, Server, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

const STEPS = [
  {
    icon: <Monitor className="w-5 h-5" />,
    title: 'Client',
    desc: 'Widget renders challenge, captures 14 behavioral signals, scores risk locally.',
  },
  {
    icon: <ArrowRight className="w-4 h-4" />,
    title: '',
    desc: '',
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Server',
    desc: 'Receives encrypted token + signals. Verifies challenge integrity, validates fingerprint, cross-checks scoring.',
  },
  {
    icon: <ArrowRight className="w-4 h-4" />,
    title: '',
    desc: '',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Token',
    desc: 'Signed, time-limited token issued. Expires after use. Cannot be replayed.',
  },
];

export default function Architecture() {
  return (
    <section id="architecture" className="py-10">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Production Architecture</h2>
        <p className="text-xs text-gray-500 mt-1">Client-side is a friction layer — real security requires server verification</p>
      </div>

      <motion.div initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        {/* Flow diagram */}
        <div className="max-w-2xl mx-auto bg-gray-900/60 border border-gray-800/50 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 justify-between">
            {STEPS.map((step, i) => {
              if (!step.title) {
                return (
                  <div key={i} className="text-gray-600 hidden sm:block">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                );
              }
              return (
                <div key={i} className="flex-1 text-center px-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                    {step.icon}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-1">{step.title}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* ASCII flow for visual clarity */}
          <div className="mt-5 pt-4 border-t border-gray-800/50">
            <pre className="text-[9px] sm:text-[10px] text-emerald-400/60 font-mono leading-relaxed text-center overflow-x-auto">{`┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │───▶│  Server  │───▶│  Token   │
│  Widget  │    │ Verifier │    │  Issued  │
└──────────┘    └──────────┘    └──────────┘
  14 signals     Validate +       Signed,
  risk score     re-score         time-limited,
  + challenge    + fingerprint     single-use`}</pre>
          </div>

          {/* Warning */}
          <div className="mt-4 flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              <span className="font-semibold text-amber-300">Current v3.1 is client-only.</span> The server
              verifier module is planned for v3.2. Without it, tokens can be forged client-side. This demo
              shows the UX and signal collection — not production-ready verification.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
