'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import CaptchaWidget from '@/components/captcha/CaptchaWidget';
import { Activity, Eye, BarChart3, Monitor, Zap } from 'lucide-react';

type DemoTab = 'widget' | 'telemetry';

const TELEMETRY_ITEMS = [
  { label: 'Challenge Type', value: 'puzzle', note: 'demo — randomized per session' },
  { label: 'Risk Score', value: '18%', note: 'demo — simulated scoring' },
  { label: 'Risk Level', value: 'low', note: 'demo — 4 possible levels' },
  { label: 'Confidence', value: '0.87', note: 'demo — simulated confidence' },
];

const SIGNAL_GROUPS = [
  { label: 'Movement', icon: <Activity className="w-3 h-3" />, items: ['linearity', 'speed', 'bezier', 'pointer'] },
  { label: 'Timing', icon: <Zap className="w-3 h-3" />, items: ['timing', 'hesitation', 'temporal'] },
  { label: 'Device', icon: <Monitor className="w-3 h-3" />, items: ['device', 'keyboard', 'scroll'] },
  { label: 'Environment', icon: <Eye className="w-3 h-3" />, items: ['entropy', 'pressure', 'tab', 'environment'] },
];

export default function LiveDemo() {
  const [tab, setTab] = useState<DemoTab>('widget');

  return (
    <section id="demo" className="py-10">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Live Demo</h2>
        <p className="text-xs text-gray-500 mt-1">Try the widget — all data is simulated client-side</p>
      </div>

      <div className="flex justify-center gap-1 bg-gray-900 rounded-lg p-0.5 border border-gray-800 mb-6 max-w-xs mx-auto">
        <button
          onClick={() => setTab('widget')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'widget' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Widget
        </button>
        <button
          onClick={() => setTab('telemetry')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'telemetry' ? 'bg-emerald-500/20 text-emerald-300' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Telemetry
        </button>
      </div>

      {tab === 'widget' && (
        <motion.div key="widget" initial={false} animate={{ opacity: 1 }} className="max-w-md mx-auto">
          <CaptchaWidget />
        </motion.div>
      )}

      {tab === 'telemetry' && (
        <motion.div key="telemetry" initial={false} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-4">
          {/* Simulated results */}
          <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-gray-200">Demo Telemetry</h3>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5">simulated</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TELEMETRY_ITEMS.map((item) => (
                <div key={item.label} className="bg-gray-950/50 rounded-lg p-2.5">
                  <p className="text-[10px] text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-emerald-300">{item.value}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Signal groups */}
          <div className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-gray-200">14 Behavioral Signals</h3>
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5">demo data</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SIGNAL_GROUPS.map((group) => (
                <div key={group.label} className="bg-gray-950/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-cyan-400">{group.icon}</span>
                    <span className="text-[11px] font-medium text-gray-300">{group.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((item) => (
                      <span key={item} className="text-[9px] bg-gray-800 text-gray-400 rounded px-1.5 py-0.5">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </section>
  );
}
