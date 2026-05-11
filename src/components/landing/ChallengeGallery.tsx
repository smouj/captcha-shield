'use client';

import { motion } from 'framer-motion';
import {
  Puzzle, ScanSearch, Eye, Activity, RotateCw, Volume2, Calendar, MonitorSmartphone
} from 'lucide-react';

interface ChallengeCard {
  icon: React.ReactNode;
  name: string;
  desc: string;
  status: 'active' | 'fallback';
}

const CHALLENGES: ChallengeCard[] = [
  { icon: <Puzzle className="w-4 h-4" />, name: 'Puzzle', desc: '2-3 pieces with complex shapes (wave, tab)', status: 'active' },
  { icon: <ScanSearch className="w-4 h-4" />, name: 'Image Select', desc: '16-cell grid with complex instructions', status: 'active' },
  { icon: <Eye className="w-4 h-4" />, name: 'Visual Math', desc: 'Equations with distortion and noise', status: 'active' },
  { icon: <Activity className="w-4 h-4" />, name: 'Pattern Trace', desc: 'Memorize and reproduce a traced path', status: 'active' },
  { icon: <RotateCw className="w-4 h-4" />, name: '3D Rotation', desc: 'Cube/Prism/Pyramid with projection', status: 'active' },
  { icon: <Volume2 className="w-4 h-4" />, name: 'Audio Challenge', desc: 'Web Audio API tones + questions', status: 'active' },
  { icon: <Calendar className="w-4 h-4" />, name: 'Timeline Order', desc: 'Arrange historical events chronologically', status: 'active' },
  { icon: <MonitorSmartphone className="w-4 h-4" />, name: 'QR Verification', desc: 'QR code + 6-digit code via mobile phone', status: 'fallback' },
];

export default function ChallengeGallery() {
  return (
    <section className="py-10">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Challenge Gallery</h2>
        <p className="text-xs text-gray-500 mt-1">7 interactive challenges + 1 QR fallback, randomly assigned per attempt</p>
      </div>

      <motion.div initial={false} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {CHALLENGES.map((c, i) => (
            <motion.div
              key={c.name}
              initial={false}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`group rounded-xl p-3.5 border transition-all duration-300 ${
                c.status === 'fallback'
                  ? 'bg-purple-900/15 border-purple-500/25 hover:border-purple-500/40 hover:bg-purple-900/25'
                  : 'bg-gray-900/60 border-gray-800/50 hover:border-emerald-500/20 hover:bg-gray-900/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  c.status === 'fallback'
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {c.icon}
                </div>
                <span className={`text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  c.status === 'fallback'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {c.status}
                </span>
              </div>
              <h4 className={`text-xs font-semibold mb-0.5 ${
                c.status === 'fallback' ? 'text-purple-300' : 'text-gray-200'
              }`}>{c.name}</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
