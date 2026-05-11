'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Play, Code, Palette, BarChart3
} from 'lucide-react';
import CaptchaWidget from '@/components/captcha/CaptchaWidget';
import AdminDashboard from '@/components/captcha/AdminDashboard';
import InstallGuide from '@/components/captcha/InstallGuide';
import ThemeCustomizer from '@/components/captcha/ThemeCustomizer';
import Hero from '@/components/landing/Hero';
import LiveDemo from '@/components/landing/LiveDemo';
import EmbedBuilder from '@/components/landing/EmbedBuilder';
import ChallengeGallery from '@/components/landing/ChallengeGallery';
import SignalMatrix from '@/components/landing/SignalMatrix';
import Architecture from '@/components/landing/Architecture';
import Roadmap from '@/components/landing/Roadmap';
import Footer from '@/components/landing/Footer';

type ViewMode = 'demo' | 'install' | 'customize' | 'analytics';

const TABS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'demo', label: 'Demo', icon: <Play className="w-3 h-3" /> },
  { id: 'install', label: 'Instalar', icon: <Code className="w-3 h-3" /> },
  { id: 'customize', label: 'Personalizar', icon: <Palette className="w-3 h-3" /> },
  { id: 'analytics', label: 'Analíticas', icon: <BarChart3 className="w-3 h-3" /> },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('demo');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* BG effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/3 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/3 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/20">
                <Image src="/captcha-shield/logo-shield-white.png" alt="CAPTCHA Shield" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-100 tracking-tight">CAPTCHA Shield</h1>
                <p className="text-[9px] text-gray-500 -mt-0.5">Anti-Bot Challenge UI v3.1</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-900 rounded-lg p-0.5 border border-gray-800">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setViewMode(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                    viewMode === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <Hero />

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Interactive Tabs */}
          <section className="py-6">
            {viewMode === 'demo' && (
              <motion.div key="demo" initial={false} animate={{ opacity: 1 }}>
                <div className="max-w-md mx-auto">
                  <CaptchaWidget />
                </div>
              </motion.div>
            )}
            {viewMode === 'install' && (
              <motion.div key="install" initial={false} animate={{ opacity: 1 }}>
                <InstallGuide />
              </motion.div>
            )}
            {viewMode === 'customize' && (
              <motion.div key="customize" initial={false} animate={{ opacity: 1 }}>
                <ThemeCustomizer />
              </motion.div>
            )}
            {viewMode === 'analytics' && (
              <motion.div key="analytics" initial={false} animate={{ opacity: 1 }}>
                <AdminDashboard />
              </motion.div>
            )}
          </section>

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Live Demo section */}
          <LiveDemo />

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Embed Builder */}
          <EmbedBuilder />

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Challenge Gallery */}
          <ChallengeGallery />

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Signal Matrix */}
          <SignalMatrix />

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Production Architecture */}
          <Architecture />

          {/* Section divider */}
          <div className="border-t border-gray-800/30 my-2" />

          {/* Roadmap */}
          <Roadmap />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
