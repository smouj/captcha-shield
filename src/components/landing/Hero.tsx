'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Shield, Activity, Scan, Code2, Github, BookOpen, AlertTriangle } from 'lucide-react';

const BADGES = [
  { label: '7 Challenges', icon: <Shield className="w-3 h-3" /> },
  { label: '14 Signals', icon: <Activity className="w-3 h-3" /> },
  { label: 'QR Mobile', icon: <Scan className="w-3 h-3" /> },
  { label: 'Embeddable', icon: <Code2 className="w-3 h-3" /> },
];

export default function Hero() {
  return (
    <section className="pt-12 pb-8 sm:pt-16 sm:pb-10 text-center">
      {/* Logo */}
      <motion.div initial={false} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.3 }}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <Image
            src="/captcha-shield/logo-shield-white.png"
            alt="CAPTCHA Shield"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-50 tracking-tight leading-tight">
          Embeddable anti-bot
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            challenge UI
          </span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
          Install in 2 lines. 7 interactive challenges, 14 behavioral signals,
          QR mobile fallback. Client-side friction layer for bot detection —
          server verification required for production.
        </p>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-wrap justify-center gap-2 mt-5"
      >
        {BADGES.map((b) => (
          <span
            key={b.label}
            className="inline-flex items-center gap-1.5 bg-gray-900/80 border border-gray-700/50 rounded-full px-3 py-1 text-[11px] font-medium text-gray-300"
          >
            {b.icon}
            {b.label}
          </span>
        ))}
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="flex flex-wrap justify-center gap-3 mt-6"
      >
        <a
          href="#demo"
          className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
        >
          <Shield className="w-4 h-4" /> Try Demo
        </a>
        <a
          href="https://github.com/smouj/captcha-shield"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700/50 rounded-xl hover:bg-gray-750 hover:text-gray-100 transition-colors inline-flex items-center gap-2"
        >
          <Github className="w-4 h-4" /> View GitHub
        </a>
        <a
          href="#architecture"
          className="px-5 py-2.5 text-sm font-medium text-gray-400 bg-gray-900/60 border border-gray-700/30 rounded-xl hover:bg-gray-800/80 hover:text-gray-200 transition-colors inline-flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" /> Security Model
        </a>
      </motion.div>

      {/* Security Truth Banner */}
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-6 mx-auto max-w-xl"
      >
        <div className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-amber-200/80 leading-relaxed">
            <span className="font-semibold text-amber-300">Security notice:</span>{' '}
            Client-side verification alone is <span className="font-semibold text-amber-300">NOT production security</span>.
            This is a friction layer and demo. Production requires server-side verification (see{' '}
            <a href="#architecture" className="underline text-amber-300 hover:text-amber-200">architecture</a>).
          </p>
        </div>
      </motion.div>
    </section>
  );
}
