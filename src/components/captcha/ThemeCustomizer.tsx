'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sun, Moon, Smartphone, Globe, Copy, Check, RotateCcw, Shield, Code2, ChevronRight } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Púrpura', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Ámbar', value: '#f59e0b' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Cian', value: '#06b6d4' },
  { name: 'Naranja', value: '#f97316' },
];

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

const SIZES = [
  { value: 'compact', label: 'Compacto', scale: 0.85 },
  { value: 'normal', label: 'Normal', scale: 1 },
  { value: 'large', label: 'Grande', scale: 1.15 },
];

const LABELS: Record<string, Record<string, string>> = {
  es: {
    themeCustomizer: 'Personalizador de Tema',
    preview: 'Vista previa',
    generatedCode: 'Código generado',
    theme: 'Tema',
    primaryColor: 'Color primario',
    presetColors: 'Colores predefinidos',
    customColor: 'Color personalizado',
    widgetSize: 'Tamaño del widget',
    borderRadius: 'Radio de borde',
    language: 'Idioma',
    resetAll: 'Restablecer todo',
    copyConfig: 'Copiar config',
    copyEmbed: 'Copiar embed',
    copied: '¡Copiado!',
    verify: 'Verificar',
    securityCheck: 'Verificación de seguridad',
    challengeDesc: '7 tipos de desafío + 14 señales',
    signalsActive: '14 señales activas',
    verified: 'Verificado',
    antiBot: 'Anti-Bot v3.1 · 14 señales · 7 desafíos',
    captchaTab: 'CAPTCHA',
    mobileQR: 'Móvil QR',
    configTab: 'Config',
    embedTab: 'Embed',
  },
  en: {
    themeCustomizer: 'Theme Customizer',
    preview: 'Preview',
    generatedCode: 'Generated Code',
    theme: 'Theme',
    primaryColor: 'Primary Color',
    presetColors: 'Preset Colors',
    customColor: 'Custom Color',
    widgetSize: 'Widget Size',
    borderRadius: 'Border Radius',
    language: 'Language',
    resetAll: 'Reset All',
    copyConfig: 'Copy config',
    copyEmbed: 'Copy embed',
    copied: 'Copied!',
    verify: 'Verify',
    securityCheck: 'Security Verification',
    challengeDesc: '7 challenge types + 14 signals',
    signalsActive: '14 signals active',
    verified: 'Verified',
    antiBot: 'Anti-Bot v3.0 · 14 signals · 7 challenges',
    captchaTab: 'CAPTCHA',
    mobileQR: 'Mobile QR',
    configTab: 'Config',
    embedTab: 'Embed',
  },
  pt: {
    themeCustomizer: 'Personalizador de Tema',
    preview: 'Visualização',
    generatedCode: 'Código gerado',
    theme: 'Tema',
    primaryColor: 'Cor primária',
    presetColors: 'Cores predefinidas',
    customColor: 'Cor personalizada',
    widgetSize: 'Tamanho do widget',
    borderRadius: 'Raio da borda',
    language: 'Idioma',
    resetAll: 'Restaurar tudo',
    copyConfig: 'Copiar config',
    copyEmbed: 'Copiar embed',
    copied: 'Copiado!',
    verify: 'Verificar',
    securityCheck: 'Verificação de segurança',
    challengeDesc: '7 tipos de desafio + 14 sinais',
    signalsActive: '14 sinais ativos',
    verified: 'Verificado',
    antiBot: 'Anti-Bot v3.0 · 14 sinais · 7 desafios',
    captchaTab: 'CAPTCHA',
    mobileQR: 'Móvel QR',
    configTab: 'Config',
    embedTab: 'Embed',
  },
};

interface ThemeSettings {
  theme: 'dark' | 'light';
  primaryColor: string;
  size: string;
  radius: number;
  language: string;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  theme: 'dark',
  primaryColor: '#10b981',
  size: 'normal',
  radius: 16,
  language: 'es',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ThemeCustomizer() {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [copiedTab, setCopiedTab] = useState<'config' | 'embed' | null>(null);
  const [hexInput, setHexInput] = useState('#10b981');
  const [hexError, setHexError] = useState(false);

  const t = LABELS[settings.language] || LABELS.es;
  const sizeScale = SIZES.find(s => s.value === settings.size)?.scale ?? 1;
  const isDark = settings.theme === 'dark';

  // Color helpers for the preview
  const previewVars = useMemo(() => {
    const pc = settings.primaryColor;
    return {
      widgetBg: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      headerBg: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(243, 244, 246, 0.8)',
      headerBorder: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.6)',
      outerBorder: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.6)',
      titleColor: isDark ? '#e5e7eb' : '#1f2937',
      subtitleColor: isDark ? '#6b7280' : '#9ca3af',
      footerBg: isDark ? 'rgba(31, 41, 55, 0.3)' : 'rgba(249, 250, 251, 0.6)',
      footerBorder: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(209, 213, 219, 0.6)',
      footerText: isDark ? '#4b5563' : '#d1d5db',
      primaryBtn: pc,
      primaryBtnHover: lightenColor(pc, 20),
      primaryBtnShadow: hexToRgba(pc, 0.25),
      signalDot: pc,
      verifiedBg: hexToRgba(pc, 0.1),
      verifiedText: lightenColor(pc, 40),
      tabActiveBg: hexToRgba(pc, 0.15),
      tabActiveBorder: hexToRgba(pc, 0.3),
      tabActiveText: lightenColor(pc, 60),
      tabInactiveText: isDark ? '#6b7280' : '#9ca3af',
      contentBg: isDark ? 'rgba(17, 24, 39, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      iconBg: hexToRgba(pc, 0.15),
    };
  }, [settings.theme, settings.primaryColor]);

  // Generate config code
  const configCode = useMemo(() => {
    const config = {
      theme: settings.theme,
      primaryColor: settings.primaryColor,
      size: settings.size,
      borderRadius: settings.radius + 'px',
      language: settings.language,
    };
    return `window.CaptchaShieldConfig = ${JSON.stringify(config, null, 2)};`;
  }, [settings]);

  // Generate embed code
  const embedCode = useMemo(() => {
    return `<div id="captcha-shield"></div>
<script>
  ${configCode}
</script>
<script src="https://smouj.github.io/captcha-shield/widget.js"></script>
<script>
  window.onCaptchaVerified = function(response) {
    console.log('Verificado:', response);
  };
</script>`;
  }, [configCode]);

  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setHexInput(DEFAULT_SETTINGS.primaryColor);
    setHexError(false);
    setCopiedTab(null);
  }, []);

  const handleHexSubmit = useCallback(() => {
    const hex = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setPrimaryColor(hex);
      setHexError(false);
    } else {
      setHexError(true);
    }
  }, [hexInput]);

  const handleCopy = useCallback(async (tab: 'config' | 'embed') => {
    const code = tab === 'config' ? configCode : embedCode;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    }
  }, [configCode, embedCode]);

  // Alias to avoid ambiguity
  function setPrimaryColor(color: string) {
    updateSetting('primaryColor', color);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: hexToRgba(settings.primaryColor, 0.15) }}
        >
          <Palette className="w-5 h-5" style={{ color: settings.primaryColor }} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-200">{t.themeCustomizer}</h2>
          <p className="text-xs text-gray-500">Personaliza la apariencia del widget en tiempo real</p>
        </div>
      </motion.div>

      {/* Two column layout: Controls on left, Preview on right */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Controls Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 space-y-5"
        >
          {/* Theme Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              {t.theme}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSetting('theme', 'dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 border border-gray-600'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700/30 hover:text-gray-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Oscuro
              </button>
              <button
                onClick={() => updateSetting('theme', 'light')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  !isDark
                    ? 'bg-gray-700 text-gray-200 border border-gray-600'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700/30 hover:text-gray-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Claro
              </button>
            </div>
          </div>

          {/* Primary Color */}
          <div className="space-y-2.5">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              {t.primaryColor}
            </label>
            {/* Preset Colors */}
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((color) => (
                <motion.button
                  key={color.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setPrimaryColor(color.value);
                    setHexInput(color.value);
                    setHexError(false);
                  }}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    settings.primaryColor === color.value
                      ? 'border-gray-500 bg-gray-800/80'
                      : 'border-gray-700/30 bg-gray-800/30 hover:border-gray-600/50'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full border-2 transition-shadow ${
                      settings.primaryColor === color.value
                        ? 'border-white/30 shadow-lg'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-[9px] text-gray-500 truncate w-full text-center">
                    {color.name}
                  </span>
                  {settings.primaryColor === color.value && (
                    <motion.div
                      layoutId="color-check"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Check className="w-2.5 h-2.5 text-gray-900" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
            {/* Custom Hex Input */}
            <div className="flex gap-2 items-center">
              <div
                className="w-8 h-8 rounded-lg border border-gray-600/50 flex-shrink-0 transition-colors"
                style={{ backgroundColor: hexError ? '#ef4444' : hexInput }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  setHexError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleHexSubmit();
                }}
                onBlur={handleHexSubmit}
                placeholder="#10b981"
                className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 transition-colors"
              />
              <button
                onClick={handleHexSubmit}
                className="px-3 py-2 text-xs font-medium text-gray-300 bg-gray-800/60 border border-gray-700/50 rounded-lg hover:bg-gray-700/60 transition-colors flex-shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {hexError && (
              <p className="text-[10px] text-red-400">Color inválido. Usa formato hexadecimal #RRGGBB</p>
            )}
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              {t.widgetSize}
            </label>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateSetting('size', s.value)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    settings.size === s.value
                      ? 'text-gray-200 border-gray-600'
                      : 'text-gray-500 border-gray-700/30 bg-gray-800/30 hover:text-gray-300'
                  }`}
                  style={
                    settings.size === s.value
                      ? { backgroundColor: hexToRgba(settings.primaryColor, 0.12), borderColor: hexToRgba(settings.primaryColor, 0.3) }
                      : undefined
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">{t.borderRadius}</label>
              <span className="text-xs font-mono text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-md">
                {settings.radius}px
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={0}
                max={32}
                step={1}
                value={settings.radius}
                onChange={(e) => updateSetting('radius', Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${settings.primaryColor} 0%, ${settings.primaryColor} ${(settings.radius / 32) * 100}%, rgba(55, 65, 81, 0.5) ${(settings.radius / 32) * 100}%, rgba(55, 65, 81, 0.5) 100%)`,
                }}
              />
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t.language}
            </label>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => updateSetting('language', lang.code)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    settings.language === lang.code
                      ? 'text-gray-200 border-gray-600'
                      : 'text-gray-500 border-gray-700/30 bg-gray-800/30 hover:text-gray-300'
                  }`}
                  style={
                    settings.language === lang.code
                      ? { backgroundColor: hexToRgba(settings.primaryColor, 0.12), borderColor: hexToRgba(settings.primaryColor, 0.3) }
                      : undefined
                  }
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-400 bg-gray-800/40 border border-gray-700/30 rounded-lg hover:text-gray-200 hover:bg-gray-700/40 hover:border-gray-600/50 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.resetAll}
          </motion.button>
        </motion.div>

        {/* Live Preview Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
              {t.preview}
            </h3>
            <span className="text-[9px] font-mono text-gray-600 bg-gray-800/60 px-2 py-0.5 rounded-md">
              {settings.size} · {settings.radius}px
            </span>
          </div>

          {/* Preview container with centered scaled widget */}
          <div className="flex-1 flex items-center justify-center py-4">
            <div
              style={{
                transform: `scale(${sizeScale})`,
                transformOrigin: 'center center',
              }}
            >
              {/* ---- Visual Preview that mimics the CaptchaWidget ---- */}
              <div
                className="w-[340px] overflow-hidden"
                style={{
                  backgroundColor: previewVars.widgetBg,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${previewVars.outerBorder}`,
                  borderRadius: settings.radius + 'px',
                  boxShadow: isDark
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    : '0 20px 40px -12px rgba(0, 0, 0, 0.12)',
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{
                    backgroundColor: previewVars.headerBg,
                    borderBottom: `1px solid ${previewVars.headerBorder}`,
                    borderTopLeftRadius: settings.radius + 'px',
                    borderTopRightRadius: settings.radius + 'px',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: previewVars.iconBg }}
                    >
                      <Shield className="w-4 h-4" style={{ color: settings.primaryColor }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold" style={{ color: previewVars.titleColor }}>
                        CAPTCHA Shield
                      </p>
                      <p className="text-[9px]" style={{ color: previewVars.subtitleColor }}>
                        🧩 {settings.language === 'en' ? 'Puzzle Challenge' : settings.language === 'pt' ? 'Desafio Puzzle' : 'Desafío Puzzle'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: previewVars.signalDot }}
                    />
                    <span className="text-[9px]" style={{ color: previewVars.subtitleColor }}>
                      {t.signalsActive}
                    </span>
                  </div>
                </div>

                {/* Tab selector */}
                <div
                  className="flex gap-1 px-4 py-2"
                  style={{ backgroundColor: isDark ? 'rgba(31, 41, 55, 0.3)' : 'rgba(243, 244, 246, 0.5)' }}
                >
                  <div
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg"
                    style={{
                      backgroundColor: previewVars.tabActiveBg,
                      color: previewVars.tabActiveText,
                      border: `1px solid ${previewVars.tabActiveBorder}`,
                    }}
                  >
                    <Shield className="w-3 h-3" /> {t.captchaTab}
                  </div>
                  <div
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg"
                    style={{ color: previewVars.tabInactiveText }}
                  >
                    <Smartphone className="w-3 h-3" /> {t.mobileQR}
                  </div>
                </div>

                {/* Content Area */}
                <div
                  className="p-4 flex flex-col items-center justify-center"
                  style={{
                    backgroundColor: previewVars.contentBg,
                    minHeight: '180px',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: previewVars.iconBg }}
                  >
                    <Shield className="w-6 h-6" style={{ color: settings.primaryColor }} />
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: previewVars.titleColor }}>
                    {t.securityCheck}
                  </p>
                  <p className="text-xs mb-4" style={{ color: previewVars.subtitleColor }}>
                    {t.challengeDesc}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{
                      backgroundColor: previewVars.primaryBtn,
                      boxShadow: `0 8px 20px -4px ${previewVars.primaryBtnShadow}`,
                    }}
                  >
                    {t.verify}
                  </motion.button>
                </div>

                {/* Footer */}
                <div
                  className="px-4 py-2 flex items-center justify-between"
                  style={{
                    backgroundColor: previewVars.footerBg,
                    borderTop: `1px solid ${previewVars.footerBorder}`,
                    borderBottomLeftRadius: settings.radius + 'px',
                    borderBottomRightRadius: settings.radius + 'px',
                  }}
                >
                  <span className="text-[9px]" style={{ color: previewVars.footerText }}>
                    {t.antiBot}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: previewVars.verifiedBg,
                        color: previewVars.verifiedText,
                      }}
                    >
                      ✓ {t.verified}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Generated Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden"
      >
        {/* Code tabs header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-semibold text-gray-400">{t.generatedCode}</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleCopy('config')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md border transition-all ${
                copiedTab === 'config'
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-gray-500 border-gray-700/30 hover:text-gray-300 hover:border-gray-600/50'
              }`}
            >
              {copiedTab === 'config' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedTab === 'config' ? t.copied : t.copyConfig}
            </button>
            <button
              onClick={() => handleCopy('embed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md border transition-all ${
                copiedTab === 'embed'
                  ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                  : 'text-gray-500 border-gray-700/30 hover:text-gray-300 hover:border-gray-600/50'
              }`}
            >
              {copiedTab === 'embed' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedTab === 'embed' ? t.copied : t.copyEmbed}
            </button>
          </div>
        </div>

        {/* Code content */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          <pre className="p-4 text-[11px] leading-relaxed font-mono text-gray-400 overflow-x-auto">
            <code>{embedCode}</code>
          </pre>
        </div>
      </motion.div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(55, 65, 81, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.6);
        }
        /* Range input thumb */
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(0, 0, 0, 0.15);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: box-shadow 0.15s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid rgba(0, 0, 0, 0.15);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
