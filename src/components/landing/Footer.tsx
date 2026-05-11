'use client';

import Image from 'next/image';
import { Github } from 'lucide-react';

const LINKS = [
  { label: 'GitHub', href: 'https://github.com/smouj/captcha-shield', icon: <Github className="w-3.5 h-3.5" /> },
  { label: 'Demo', href: '#demo' },
  { label: 'Security Model', href: '#architecture' },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-800/50 bg-gray-950/80 backdrop-blur-md mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/20">
              <Image src="/captcha-shield/logo-icon-white.png" alt="" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400">CAPTCHA Shield</p>
              <p className="text-[9px] text-gray-600">v3.1 · Client-side friction layer</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
              >
                {'icon' in l && l.icon}
                {l.label}
              </a>
            ))}
          </div>

          <p className="text-[10px] text-gray-600">
            MIT License · Not production security alone
          </p>
        </div>
      </div>
    </footer>
  );
}
