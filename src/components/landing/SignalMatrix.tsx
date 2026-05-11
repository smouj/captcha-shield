'use client';

import { motion } from 'framer-motion';
import { MousePointerClick, Clock, Monitor, Eye } from 'lucide-react';

interface SignalGroup {
  name: string;
  icon: React.ReactNode;
  color: string;
  signals: { key: string; label: string; weight: string }[];
}

const SIGNAL_GROUPS: SignalGroup[] = [
  {
    name: 'Movement',
    icon: <MousePointerClick className="w-4 h-4" />,
    color: 'emerald',
    signals: [
      { key: 'linearity', label: 'Path linearity', weight: '0.10' },
      { key: 'speed', label: 'Mouse speed', weight: '0.08' },
      { key: 'bezier', label: 'Bézier curvature', weight: '0.06' },
      { key: 'pointer', label: 'Pointer precision', weight: '0.06' },
    ],
  },
  {
    name: 'Timing',
    icon: <Clock className="w-4 h-4" />,
    color: 'cyan',
    signals: [
      { key: 'timing', label: 'Timing consistency', weight: '0.10' },
      { key: 'hesitation', label: 'Hesitation patterns', weight: '0.12' },
      { key: 'temporal', label: 'Temporal entropy', weight: '0.06' },
    ],
  },
  {
    name: 'Device',
    icon: <Monitor className="w-4 h-4" />,
    color: 'violet',
    signals: [
      { key: 'device', label: 'Device fingerprint', weight: '0.08' },
      { key: 'keyboard', label: 'Keyboard dynamics', weight: '0.08' },
      { key: 'scroll', label: 'Scroll behavior', weight: '0.04' },
    ],
  },
  {
    name: 'Environment',
    icon: <Eye className="w-4 h-4" />,
    color: 'amber',
    signals: [
      { key: 'entropy', label: 'Behavioral entropy', weight: '0.06' },
      { key: 'pressure', label: 'Touch/pen pressure', weight: '0.04' },
      { key: 'tab', label: 'Tab visibility', weight: '0.06' },
      { key: 'environment', label: 'Environment signals', weight: '0.06' },
    ],
  },
];

function colorClasses(color: string): { bg: string; text: string; border: string; bar: string } {
  const map: Record<string, { bg: string; text: string; border: string; bar: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', bar: 'bg-cyan-500' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', bar: 'bg-violet-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', bar: 'bg-amber-500' },
  };
  return map[color] ?? map.emerald;
}

export default function SignalMatrix() {
  return (
    <section className="py-10">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Signal Matrix</h2>
        <p className="text-xs text-gray-500 mt-1">14 weighted behavioral signals across 4 categories</p>
      </div>

      <motion.div initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="grid sm:grid-cols-2 gap-3">
          {SIGNAL_GROUPS.map((group) => {
            const c = colorClasses(group.color);
            return (
              <div key={group.name} className="bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-7 h-7 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center ${c.text}`}>
                    {group.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200">{group.name}</h3>
                  <span className="text-[9px] text-gray-500 ml-auto">{group.signals.length} signals</span>
                </div>
                <div className="space-y-2">
                  {group.signals.map((s) => {
                    const weightNum = parseFloat(s.weight);
                    const barWidth = `${Math.round(weightNum * 500)}%`;
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-32 truncate">{s.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.bar} opacity-60`} style={{ width: barWidth }} />
                        </div>
                        <span className={`text-[10px] font-mono ${c.text}`}>{s.weight}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Formula */}
        <div className="mt-4 bg-gray-900/60 border border-gray-800/50 rounded-xl p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">Composite Score Formula</p>
          <code className="text-[10px] sm:text-xs text-emerald-400/80 leading-relaxed block overflow-x-auto whitespace-nowrap">
            risk = Σ(signal × weight) → low (&lt;30%) · medium (30-50%) · high (50-70%) · critical (&gt;70%)
          </code>
        </div>
      </motion.div>
    </section>
  );
}
