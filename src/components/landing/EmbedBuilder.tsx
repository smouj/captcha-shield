'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, AlertTriangle, Code2 } from 'lucide-react';

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
] as const;

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'auto', label: 'Auto' },
] as const;

const SIZES = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
] as const;

function generateSnippet(language: string, theme: string, size: string): string {
  return `<!-- CAPTCHA Shield v3.1 – Client-side friction layer -->
<div id="captcha-shield"></div>
<script src="https://smouj.github.io/captcha-shield/captcha-shield.js"></script>
<script>
  CaptchaShield.init({
    container: '#captcha-shield',
    language: '${language}',
    theme: '${theme}',
    size: '${size}',
  });
</script>`;
}

export default function EmbedBuilder() {
  const [language, setLanguage] = useState('es');
  const [theme, setTheme] = useState('dark');
  const [size, setSize] = useState('default');
  const [copied, setCopied] = useState(false);

  const snippet = generateSnippet(language, theme, size);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <section className="py-10">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100">Embed Builder</h2>
        <p className="text-xs text-gray-500 mt-1">Configure and copy the embed snippet for your site</p>
      </div>

      <motion.div initial={false} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
        {/* Config row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Code snippet */}
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-emerald-300 transition-colors bg-gray-800 border border-gray-700/50 rounded-lg px-2.5 py-1"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <pre className="bg-gray-950 border border-gray-800/50 rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed">
            <code className="text-emerald-400/90">{snippet}</code>
          </pre>
        </div>

        {/* Security warning */}
        <div className="flex items-start gap-2.5 mt-4 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            <span className="font-semibold text-amber-300">Important:</span> This embeds a client-side friction layer only.
            For production, you must validate tokens server-side. See{' '}
            <a href="#architecture" className="underline text-amber-300 hover:text-amber-200">production architecture</a>.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
