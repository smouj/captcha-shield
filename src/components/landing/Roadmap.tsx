'use client';

import { motion } from 'framer-motion';
import { Server, Package, Blocks, ShieldCheck, ArrowRight } from 'lucide-react';

interface RoadmapItem {
  version: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  status: 'current' | 'next' | 'future';
}

const ITEMS: RoadmapItem[] = [
  {
    version: 'v3.1',
    title: 'Client-side demo & signals',
    desc: '7 challenges, 14 signals, embeddable widget, theme customizer — current release.',
    icon: <Blocks className="w-4 h-4" />,
    status: 'current',
  },
  {
    version: 'v3.2',
    title: 'Server verifier module',
    desc: 'Token validation, server-side re-scoring, fingerprint verification, replay protection.',
    icon: <Server className="w-4 h-4" />,
    status: 'next',
  },
  {
    version: 'v3.3',
    title: 'npm package',
    desc: 'Publish as @captcha-shield/core + @captcha-shield/react with typed API and SSR support.',
    icon: <Package className="w-4 h-4" />,
    status: 'future',
  },
  {
    version: 'v3.4',
    title: 'Framework integrations',
    desc: 'Express middleware, Next.js API route, Cloudflare Worker, Vercel Edge Function.',
    icon: <Blocks className="w-4 h-4" />,
    status: 'future',
  },
  {
    version: 'v4.0',
    title: 'Hardened platform',
    desc: 'Rate limiting, adaptive difficulty, A/B challenge selection, analytics dashboard, SaaS option.',
    icon: <ShieldCheck className="w-4 h-4" />,
    status: 'future',
  },
];

function statusStyles(status: RoadmapItem['status']): { badge: string; dot: string } {
  switch (status) {
    case 'current': return { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' };
    case 'next': return { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-500' };
    case 'future': return { badge: 'bg-gray-700/50 text-gray-500 border-gray-700/50', dot: 'bg-gray-600' };
  }
}

export default function Roadmap() {
  return (
    <section className="py-10">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Roadmap</h2>
        <p className="text-xs text-gray-500 mt-1">From demo to production-grade platform</p>
      </div>

      <motion.div initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="max-w-xl mx-auto space-y-0">
          {ITEMS.map((item, i) => {
            const s = statusStyles(item.status);
            return (
              <div key={item.version} className="relative flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${s.dot} flex-shrink-0 mt-1`} />
                  {i < ITEMS.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-800 my-1" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-semibold text-gray-300">{item.version}</span>
                    <span className={`text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.badge}`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-0.5">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
