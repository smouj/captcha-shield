'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, Code, Globe, Server, Zap, Shield,
  Smartphone, Palette, FileCode, BarChart3,
  Lock, Puzzle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Copy Button                                                        */
/* ------------------------------------------------------------------ */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback noop – clipboard may not be available */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md bg-gray-800/70 text-gray-400 hover:text-gray-200 hover:bg-gray-700/70 border border-gray-700/50 transition-all duration-200 z-10"
      title="Copiar al portapapeles"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Copiado</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copiar</span>
        </>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Code Block                                                         */
/* ------------------------------------------------------------------ */
function CodeBlock({
  code,
  language,
  highlight = 'html',
}: {
  code: string;
  language: string;
  highlight?: 'html' | 'jsx' | 'javascript';
}) {
  return (
    <div className="relative group">
      {/* Language badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-800/70 text-gray-500 border border-gray-700/50 z-10">
        <Code className="w-3 h-3" />
        <span className="text-[10px] font-medium">{language}</span>
      </div>

      <CopyButton text={code} />

      <div className="bg-gray-950 border border-gray-800/60 rounded-xl p-4 pt-10 overflow-x-auto">
        <pre className="text-[11px] sm:text-xs leading-relaxed font-mono">
          <SyntaxHighlighter code={code} variant={highlight} />
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lightweight syntax highlighter (span-based, no deps)               */
/* ------------------------------------------------------------------ */
function SyntaxHighlighter({
  code,
  variant,
}: {
  code: string;
  variant: 'html' | 'jsx' | 'javascript';
}) {
  const lines = code.split('\n');

  const renderLine = (line: string, i: number) => {
    const tokens = tokenize(line, variant);
    return (
      <div key={i} className="flex">
        <span className="select-none text-gray-700 w-8 text-right mr-4 flex-shrink-0">
          {i + 1}
        </span>
        <span className="text-gray-300">
          {tokens.map((t, j) => (
            <span key={j} className={t.color}>
              {t.text}
            </span>
          ))}
        </span>
      </div>
    );
  };

  return <>{lines.map(renderLine)}</>;
}

interface Token {
  text: string;
  color: string;
}

const C = {
  comment: 'text-gray-600',
  tag: 'text-red-400',
  attr: 'text-purple-400',
  string: 'text-emerald-400',
  keyword: 'text-purple-400',
  func: 'text-blue-400',
  number: 'text-amber-400',
  property: 'text-cyan-300',
  variable: 'text-gray-300',
  operator: 'text-gray-500',
  punctuation: 'text-gray-500',
  type: 'text-yellow-300',
  default: 'text-gray-300',
};

function tokenize(line: string, variant: 'html' | 'jsx' | 'javascript'): Token[] {
  const tokens: Token[] = [];

  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('<!--')) {
    return [{ text: line, color: C.comment }];
  }

  if (variant === 'html') {
    return tokenizeHTML(line);
  }
  if (variant === 'jsx') {
    return tokenizeJSX(line);
  }
  return tokenizeJS(line);
}

function tokenizeHTML(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;

  // Full-line comment
  if (rest.trimStart().startsWith('<!--')) {
    return [{ text: rest, color: C.comment }];
  }

  while (rest.length > 0) {
    // Opening tag
    if (rest.startsWith('</')) {
      const idx = rest.indexOf('>');
      if (idx !== -1) {
        tokens.push({ text: rest.slice(0, idx + 1), color: C.tag });
        rest = rest.slice(idx + 1);
      } else {
        tokens.push({ text: rest, color: C.tag });
        rest = '';
      }
    } else if (rest.startsWith('<')) {
      const match = rest.match(/^<(\w[\w-]*)/);
      if (match) {
        tokens.push({ text: `<${match[1]}`, color: C.tag });
        rest = rest.slice(match[0].length);

        // Parse attributes inside the tag
        while (rest.length > 0 && !rest.startsWith('>') && !rest.startsWith('/>')) {
          const wsMatch = rest.match(/^(\s+)/);
          if (wsMatch) {
            tokens.push({ text: wsMatch[1], color: C.default });
            rest = rest.slice(wsMatch[1].length);
            continue;
          }
          // Attribute name
          const attrMatch = rest.match(/^([\w-]+)(=)?/);
          if (attrMatch) {
            tokens.push({ text: attrMatch[1], color: C.attr });
            rest = rest.slice(attrMatch[1].length);
            if (attrMatch[2]) {
              tokens.push({ text: '=', color: C.operator });
              rest = rest.slice(1);
              // String value
              if (rest.startsWith('"')) {
                const qIdx = rest.indexOf('"', 1);
                if (qIdx !== -1) {
                  tokens.push({ text: rest.slice(0, qIdx + 1), color: C.string });
                  rest = rest.slice(qIdx + 1);
                }
              } else if (rest.startsWith("'")) {
                const qIdx = rest.indexOf("'", 1);
                if (qIdx !== -1) {
                  tokens.push({ text: rest.slice(0, qIdx + 1), color: C.string });
                  rest = rest.slice(qIdx + 1);
                }
              }
            }
            continue;
          }
          // Self-close />
          if (rest.startsWith('/>')) {
            tokens.push({ text: '/>', color: C.tag });
            rest = rest.slice(2);
            break;
          }
          break;
        }
        if (rest.startsWith('>')) {
          tokens.push({ text: '>', color: C.tag });
          rest = rest.slice(1);
        }
      } else {
        tokens.push({ text: rest[0], color: C.default });
        rest = rest.slice(1);
      }
    } else {
      tokens.push({ text: rest[0], color: C.default });
      rest = rest.slice(1);
    }
  }

  return tokens;
}

function tokenizeJSX(line: string): Token[] {
  const tokens: Token[] = [];

  if (line.trimStart().startsWith('//')) {
    return [{ text: line, color: C.comment }];
  }
  if (line.trimStart().startsWith('/*')) {
    return [{ text: line, color: C.comment }];
  }

  // Detect HTML tags inside JSX
  if (/<\w/.test(line) && !line.trimStart().startsWith('//')) {
    return tokenizeJSXLine(line);
  }

  // Regular JS/JSX line
  return tokenizeJS(line);
}

function tokenizeJSXLine(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;

  while (rest.length > 0) {
    // Indent / whitespace
    if (/^\s+/.test(rest)) {
      const m = rest.match(/^(\s+)/);
      tokens.push({ text: m![1], color: C.default });
      rest = rest.slice(m![1].length);
      continue;
    }

    // Comment
    if (rest.trimStart().startsWith('//')) {
      tokens.push({ text: rest, color: C.comment });
      rest = '';
      break;
    }

    // JSX Tag
    if (rest.match(/^<\/?[\w]/)) {
      const isClosing = rest.startsWith('</');
      const match = rest.match(/^<\/?(\w[\w.]*)/);
      if (match) {
        tokens.push({
          text: rest.slice(0, match[0].length),
          color: isClosing ? C.tag : C.tag,
        });
        rest = rest.slice(match[0].length);

        // Attributes
        while (rest.length > 0 && !rest.startsWith('>') && !rest.startsWith('/>')) {
          const ws = rest.match(/^(\s+)/);
          if (ws) { tokens.push({ text: ws[1], color: C.default }); rest = rest.slice(ws[1].length); continue; }
          if (rest.startsWith('/>')) { tokens.push({ text: '/>', color: C.tag }); rest = rest.slice(2); break; }
          const attrM = rest.match(/^([\w:.-]+)(=)?/);
          if (attrM) {
            tokens.push({ text: attrM[1], color: C.attr });
            rest = rest.slice(attrM[1].length);
            if (attrM[2]) {
              tokens.push({ text: '=', color: C.operator });
              rest = rest.slice(1);
              // Brace expression
              if (rest.startsWith('{')) {
                const braceEnd = findMatchingBrace(rest);
                if (braceEnd !== -1) {
                  const inner = rest.slice(1, braceEnd);
                  const innerTokens = tokenizeJS(inner.trim());
                  tokens.push({ text: '{', color: C.punctuation });
                  tokens.push(...innerTokens);
                  tokens.push({ text: '}', color: C.punctuation });
                  rest = rest.slice(braceEnd + 1);
                }
              } else if (rest.startsWith('"')) {
                const qIdx = rest.indexOf('"', 1);
                if (qIdx !== -1) {
                  tokens.push({ text: rest.slice(0, qIdx + 1), color: C.string });
                  rest = rest.slice(qIdx + 1);
                }
              }
            }
            continue;
          }
          break;
        }
        if (rest.startsWith('>')) { tokens.push({ text: '>', color: C.tag }); rest = rest.slice(1); }
      } else {
        tokens.push({ text: rest[0], color: C.default });
        rest = rest.slice(1);
      }
    } else {
      // Regular JS token
      const jsTokens = tokenizeJSOnce(rest);
      tokens.push(...jsTokens.tokens);
      rest = jsTokens.rest;
    }
  }

  return tokens;
}

function findMatchingBrace(s: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function tokenizeJSOnce(line: string): { tokens: Token[]; rest: string } {
  if (line.length === 0) return { tokens: [], rest: '' };

  // Whitespace
  const ws = line.match(/^(\s+)/);
  if (ws) return { tokens: [{ text: ws[1], color: C.default }], rest: line.slice(ws[1].length) };

  // Comment
  if (line.startsWith('//')) return { tokens: [{ text: line, color: C.comment }], rest: '' };

  // String (double-quote)
  if (line.startsWith('"')) {
    const idx = line.indexOf('"', 1);
    const end = idx !== -1 ? idx + 1 : line.length;
    return { tokens: [{ text: line.slice(0, end), color: C.string }], rest: line.slice(end) };
  }
  // String (single-quote)
  if (line.startsWith("'")) {
    const idx = line.indexOf("'", 1);
    const end = idx !== -1 ? idx + 1 : line.length;
    return { tokens: [{ text: line.slice(0, end), color: C.string }], rest: line.slice(end) };
  }
  // Template literal
  if (line.startsWith('`')) {
    const idx = line.indexOf('`', 1);
    const end = idx !== -1 ? idx + 1 : line.length;
    return { tokens: [{ text: line.slice(0, end), color: C.string }], rest: line.slice(end) };
  }

  // Number
  const numMatch = line.match(/^(\d+(\.\d+)?)/);
  if (numMatch) return { tokens: [{ text: numMatch[1], color: C.number }], rest: line.slice(numMatch[1].length) };

  // Identifier / keyword
  const identMatch = line.match(/^([a-zA-Z_$][\w$]*)/);
  if (identMatch) {
    const keywords = ['import', 'from', 'export', 'default', 'function', 'const', 'let', 'var', 'return', 'if', 'else', 'new', 'this', 'class', 'extends', 'typeof', 'async', 'await', 'window'];
    const builtins = ['true', 'false', 'null', 'undefined'];
    const word = identMatch[1];
    let color = C.func;
    if (keywords.includes(word)) color = C.keyword;
    else if (builtins.includes(word)) color = C.type;
    else if (line.slice(word.length).match(/^\s*\(/)) color = C.func;
    else if (line.slice(word.length).match(/^\s*=/)) color = C.property;
    else color = C.variable;
    return { tokens: [{ text: word, color }], rest: line.slice(word.length) };
  }

  // Arrow
  if (line.startsWith('=>')) return { tokens: [{ text: '=>', color: C.operator }], rest: line.slice(2) };

  // Operator / punctuation
  return { tokens: [{ text: line[0], color: C.punctuation }], rest: line.slice(1) };
}

function tokenizeJS(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;
  let iterations = 0;
  while (rest.length > 0 && iterations < 200) {
    iterations++;
    const result = tokenizeJSOnce(rest);
    tokens.push(...result.tokens);
    rest = result.rest;
  }
  if (rest.length > 0) tokens.push({ text: rest, color: C.default });
  return tokens;
}

/* ------------------------------------------------------------------ */
/*  Raw code strings (for clipboard)                                   */
/* ------------------------------------------------------------------ */
const scriptTagCode = `<!-- 1. Añade el contenedor -->
<div id="captcha-shield"></div>

<!-- 2. Carga el widget -->
<script src="https://smouj.github.io/captcha-shield/widget.js"><\/script>

<!-- 3. Recibe el resultado -->
<script>
  window.onCaptchaVerified = function(response) {
    console.log('Verificado:', response);
    // response = { success, riskScore, riskLevel, token }
  };
<\/script>`;

const reactCode = `import CaptchaWidget from 'captcha-shield';

function MyForm() {
  return (
    <form onSubmit={handleSubmit}>
      <CaptchaWidget
        theme="dark"
        primaryColor="#10b981"
        onVerified={(res) => console.log(res)}
      />
      <button type="submit">Enviar</button>
    </form>
  );
}`;

const configCode = `window.CaptchaShieldConfig = {
  theme: 'dark',           // 'dark' | 'light'
  primaryColor: '#10b981', // Any hex color
  language: 'es',          // 'es' | 'en' | 'pt'
  size: 'normal',          // 'compact' | 'normal' | 'large'
  borderRadius: '16px',
  containerId: 'captcha-shield',
  timeout: 120000,         // 2 min timeout
  onStart: () => {},
  onExpired: () => {},
};`;

/* ------------------------------------------------------------------ */
/*  Tab data                                                           */
/* ------------------------------------------------------------------ */
type TabKey = 'script' | 'react' | 'config';

const tabs: { key: TabKey; label: string; icon: ReactNode; description: string }[] = [
  {
    key: 'script',
    label: 'Script Tag',
    icon: <Globe className="w-3.5 h-3.5" />,
    description: 'La forma más fácil — 2 líneas de código en cualquier sitio web',
  },
  {
    key: 'react',
    label: 'React',
    icon: <Code className="w-3.5 h-3.5" />,
    description: 'Componente para Next.js, React, Vite y Remix',
  },
  {
    key: 'config',
    label: 'Configuración',
    icon: <Server className="w-3.5 h-3.5" />,
    description: 'Personalización avanzada mediante objeto de configuración',
  },
];

/* ------------------------------------------------------------------ */
/*  Features data                                                      */
/* ------------------------------------------------------------------ */
const features = [
  {
    icon: <Puzzle className="w-5 h-5" />,
    emoji: '🧩',
    title: '7 tipos de desafío',
    desc: 'Puzzle, imágenes, matemáticas, patrón, 3D, audio, cronológico',
    accent: 'emerald',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    emoji: '🛡️',
    title: '14 señales anti-bot',
    desc: 'Análisis comportamental profundo en tiempo real',
    accent: 'emerald',
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    emoji: '📱',
    title: 'Verificación QR',
    desc: 'Código QR + 6 dígitos desde el móvil',
    accent: 'purple',
  },
  {
    icon: <Palette className="w-5 h-5" />,
    emoji: '🎨',
    title: 'Personalizable',
    desc: 'Colores, tema, tamaño y bordes configurables',
    accent: 'emerald',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    emoji: '⚡',
    title: 'Ligero',
    desc: 'Cero dependencias en el sitio host, carga vía iframe',
    accent: 'amber',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    emoji: '🔒',
    title: 'Shadow DOM',
    desc: 'Aislado del CSS del sitio, sin conflictos visuales',
    accent: 'blue',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    emoji: '🌐',
    title: 'Multi-idioma',
    desc: 'Español, inglés y portugués',
    accent: 'emerald',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    emoji: '📊',
    title: 'Analíticas',
    desc: 'Dashboard con estadísticas de verificación',
    accent: 'purple',
  },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function InstallGuide() {
  const [activeTab, setActiveTab] = useState<TabKey>('script');

  return (
    <div className="space-y-6">
      {/* ---------- Section header ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <FileCode className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-100 tracking-tight">
            Integración en tu sitio
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
          Instala CAPTCHA Shield en cualquier sitio web con solo 2 líneas de código.
          Compatible con HTML, React, Next.js, Vite, Remix y más.
        </p>
      </motion.div>

      {/* ---------- Tab selector ---------- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-2 sm:gap-0 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-xl p-1.5 sm:p-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                relative flex items-center gap-2.5 px-4 py-3 rounded-lg text-left transition-all duration-200
                ${
                  isActive
                    ? 'bg-gray-800/80 text-gray-100 border border-gray-700/50 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 border border-transparent'
                }
              `}
            >
              <div
                className={`
                  flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors
                  ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-gray-800 text-gray-600'
                  }
                `}
              >
                {tab.icon}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold block">{tab.label}</span>
                <span className="text-[10px] text-gray-500 leading-snug block hidden sm:block">
                  {tab.description}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-emerald-500 rounded-r-full sm:block hidden"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* ---------- Code panels ---------- */}
      <AnimatePresence mode="wait">
        {activeTab === 'script' && (
          <motion.div
            key="script"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Explanation */}
            <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center mt-0.5">
                <Zap className="w-3 h-3 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-300 mb-1">
                  Método más rápido
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Añade el contenedor, carga el script y recibe el resultado en tu callback.
                  Funciona en cualquier sitio HTML sin configuración adicional.
                </p>
              </div>
            </div>
            <CodeBlock
              code={scriptTagCode}
              language="HTML"
              highlight="html"
            />
          </motion.div>
        )}

        {activeTab === 'react' && (
          <motion.div
            key="react"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-blue-500/15 flex items-center justify-center mt-0.5">
                <Code className="w-3 h-3 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-blue-300 mb-1">
                  Componente React
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Importa el componente CaptchaWidget y úsalo en tus formularios.
                  Compatible con Next.js App Router, Pages Router, Vite y Remix.
                </p>
              </div>
            </div>
            <CodeBlock
              code={reactCode}
              language="JSX / React"
              highlight="jsx"
            />
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-start gap-3 bg-purple-500/5 border border-purple-500/15 rounded-xl p-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center mt-0.5">
                <Palette className="w-3 h-3 text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-purple-300 mb-1">
                  Configuración avanzada
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Define el objeto <code className="text-purple-300 font-mono">window.CaptchaShieldConfig</code> antes
                  de cargar el script para personalizar tema, colores, idioma y comportamiento.
                </p>
              </div>
            </div>
            <CodeBlock
              code={configCode}
              language="JavaScript"
              highlight="javascript"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Features grid ---------- */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="pt-4"
      >
        <div className="text-center mb-6">
          <h4 className="text-sm sm:text-base font-bold text-gray-200">
            ¿Qué incluye?
          </h4>
          <p className="text-[10px] text-gray-500 mt-1">
            Todo lo que necesitas para proteger tu sitio contra bots y automatización
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`
                group relative bg-gray-900/60 backdrop-blur-sm border rounded-xl p-4
                hover:bg-gray-900/80 transition-all duration-300 cursor-default
                ${
                  f.accent === 'purple'
                    ? 'border-purple-500/20 hover:border-purple-500/40'
                    : f.accent === 'amber'
                    ? 'border-amber-500/20 hover:border-amber-500/40'
                    : f.accent === 'blue'
                    ? 'border-blue-500/20 hover:border-blue-500/40'
                    : 'border-gray-800/50 hover:border-emerald-500/20'
                }
              `}
            >
              {/* Icon + emoji */}
              <div className="flex items-start justify-between mb-2.5">
                <div
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                    ${
                      f.accent === 'purple'
                        ? 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/15'
                        : f.accent === 'amber'
                        ? 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/15'
                        : f.accent === 'blue'
                        ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/15'
                        : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15'
                    }
                  `}
                >
                  {f.icon}
                </div>
                <span className="text-lg">{f.emoji}</span>
              </div>

              <h5 className="text-xs font-semibold text-gray-200 mb-1">{f.title}</h5>
              <p className="text-[10px] text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
