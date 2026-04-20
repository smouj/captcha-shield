'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader2, Shield, Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import BehaviorTracker from './BehaviorTracker';
import PuzzleChallenge from './PuzzleChallenge';
import ImageSelectChallenge from './ImageSelectChallenge';
import MathVisualChallenge from './MathVisualChallenge';
import PatternTraceChallenge from './PatternTraceChallenge';
import Rotation3DChallenge from './Rotation3DChallenge';
import AudioChallenge from './AudioChallenge';
import TimelineOrderChallenge from './TimelineOrderChallenge';
import QRVerification from './QRVerification';
import CaptchaResult from './CaptchaResult';
import { generateRandomChallenge, verifySolution, CHALLENGE_LABELS, CHALLENGE_ICONS, type ChallengeData, type ChallengeType } from '@/lib/captcha-engine';
import { analyzeBehavior, type BehavioralData, type RiskAssessment } from '@/lib/behavioral-analyzer';

type WidgetState = 'idle' | 'loading' | 'solving' | 'verifying' | 'result' | 'qr';
type VerifyMode = 'captcha' | 'qr';

interface AttemptLog {
  id: string;
  timestamp: number;
  challengeType: string;
  success: boolean;
  riskScore: number;
  riskLevel: string;
}

export default function CaptchaWidget() {
  const [state, setState] = useState<WidgetState>('idle');
  const [verifyMode, setVerifyMode] = useState<VerifyMode>('captcha');
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    riskScore: number;
    riskLevel: string;
    message: string;
    signals: RiskAssessment['signals'];
    deviceFingerprint: any;
    timeTaken: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const failCountRef = useRef(0);
  const [cooldown, setCooldown] = useState(0);
  const [logs, setLogs] = useState<AttemptLog[]>([]);
  const [challengeStartTime, setChallengeStartTime] = useState(0);
  const behavioralDataRef = useRef<BehavioralData | null>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      }), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const generateCaptcha = useCallback(() => {
    if (cooldown > 0) return;
    setState('loading');
    setError(null);
    setChallenge(null);
    setResult(null);

    // Simular delay de generación
    setTimeout(() => {
      const ch = generateRandomChallenge();
      setChallenge(ch);
      setChallengeStartTime(Date.now());
      setState('solving');
    }, 300);
  }, [cooldown]);

  const handleBehavioralData = useCallback((data: BehavioralData) => {
    behavioralDataRef.current = data;
  }, []);

  const handleVerify = useCallback((response: any) => {
    if (!challenge) return;
    setState('verifying');

    const bd = behavioralDataRef.current;
    const now = Date.now();

    const fullData: BehavioralData = bd ? {
      ...bd,
      submitTime: now,
      challengeType: challenge.type,
    } : {
      mouseMovements: [],
      clicks: [],
      scrollEvents: [],
      keyEvents: [],
      visibilityEvents: [],
      startTime: challengeStartTime,
      submitTime: now,
      challengeType: challenge.type,
      totalInteractions: 0,
      deviceFingerprint: { screenWidth: 0, screenHeight: 0, colorDepth: 0, timezone: '', language: '', platform: '', hardwareConcurrency: 0, maxTouchPoints: 0, webglRenderer: '', webglVendor: '', hasWebGL: false, hasCanvas: false, pluginsCount: 0, isHeadless: false, automationDetected: false },
    };

    setTimeout(() => {
      const verification = verifySolution(challenge, response);
      const riskAssessment = analyzeBehavior(fullData);
      const timeTaken = now - challengeStartTime;

      if (!verification.success || riskAssessment.isBot) {
        const newFailCount = failCountRef.current + 1;
        failCountRef.current = newFailCount;
        setFailCount(newFailCount);
        if (newFailCount >= 3) {
          setCooldown(30);
        }
      } else {
        failCountRef.current = 0;
        setFailCount(0);
      }

      const logEntry: AttemptLog = {
        id: crypto.randomUUID(),
        timestamp: now,
        challengeType: challenge.type,
        success: verification.success && !riskAssessment.isBot,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
      };
      setLogs(prev => {
        const updated = [logEntry, ...prev].slice(0, 50);
        try {
          const existing = JSON.parse(localStorage.getItem('captcha-shield-logs') || '[]') as AttemptLog[];
          localStorage.setItem('captcha-shield-logs', JSON.stringify([logEntry, ...existing].slice(0, 200)));
        } catch {}
        return updated;
      });

      setResult({
        success: verification.success && !riskAssessment.isBot,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        message: riskAssessment.isBot
          ? 'Comportamiento sospechoso detectado. Automatización identificada.'
          : verification.message,
        signals: riskAssessment.signals,
        deviceFingerprint: fullData.deviceFingerprint,
        timeTaken,
      });
      setState('result');
    }, 500);
  }, [challenge, challengeStartTime, failCount]);

  const handleQRVerified = useCallback((success: boolean, _code: string) => {
    if (success) {
      setResult({
        success: true,
        riskScore: 0,
        riskLevel: 'low',
        message: 'Verificación móvil completada con éxito',
        signals: [],
        deviceFingerprint: null,
        timeTaken: 0,
      });
      setLogs(prev => {
        const logEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          challengeType: 'qr_mobile',
          success: true,
          riskScore: 0,
          riskLevel: 'low',
        };
        try {
          const existing = JSON.parse(localStorage.getItem('captcha-shield-logs') || '[]') as AttemptLog[];
          localStorage.setItem('captcha-shield-logs', JSON.stringify([logEntry, ...existing].slice(0, 200)));
        } catch {}
        return [logEntry, ...prev].slice(0, 50);
      });
      setState('result');
    }
  }, []);

  const renderChallenge = () => {
    if (!challenge) return null;
    switch (challenge.type as ChallengeType) {
      case 'puzzle': return <PuzzleChallenge challengeData={challenge} onVerify={handleVerify} />;
      case 'image_select': return <ImageSelectChallenge challengeData={challenge} onVerify={handleVerify} />;
      case 'math_visual': return <MathVisualChallenge challengeData={challenge} onVerify={handleVerify} />;
      case 'pattern_trace': return <PatternTraceChallenge challengeData={challenge} onVerify={handleVerify} />;
      case 'rotation_3d': return <Rotation3DChallenge challengeData={challenge} onVerify={handleVerify} />;
      case 'audio': return <AudioChallenge challengeData={challenge} onVerify={handleVerify} />;
      case 'timeline_order': return <TimelineOrderChallenge challengeData={challenge} onVerify={handleVerify} />;
      default: return <p className="text-red-400 text-sm">Tipo desconocido</p>;
    }
  };

  return (
    <div className="relative">
      {state === 'solving' && (
        <BehaviorTracker onData={handleBehavioralData} active={state === 'solving'} challengeType={challenge?.type || ''} />
      )}

      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden">
              <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={28} height={28} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-gray-200">CAPTCHA Shield</h2>
              {challenge && (
                <p className="text-[9px] text-gray-500">
                  {CHALLENGE_ICONS[challenge.type as ChallengeType]} {CHALLENGE_LABELS[challenge.type as ChallengeType]}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state === 'solving' && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-gray-500">14 señales activas</span>
              </div>
            )}
            {state === 'result' && result?.success && (
              <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Verificado
              </span>
            )}
          </div>
        </div>

        {/* Verify mode selector (only in idle) */}
        {state === 'idle' && !error && cooldown === 0 && (
          <div className="flex gap-1 px-4 py-2 bg-gray-800/30">
            <button onClick={() => setVerifyMode('captcha')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all
                ${verifyMode === 'captcha' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}>
              <Shield className="w-3 h-3" /> CAPTCHA
            </button>
            <button onClick={() => setVerifyMode('qr')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-all
                ${verifyMode === 'qr' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}>
              <Smartphone className="w-3 h-3" /> Móvil QR
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 min-h-[280px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {state === 'idle' && verifyMode === 'captcha' && cooldown === 0 && !error && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto">
                  <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={56} height={56} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">Verificación de seguridad</h3>
                  <p className="text-xs text-gray-500 mt-0.5">7 tipos de desafío + análisis de 14 señales</p>
                </div>
                <button onClick={generateCaptcha}
                  className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25">
                  Iniciar verificación
                </button>
              </motion.div>
            )}

            {state === 'idle' && verifyMode === 'qr' && cooldown === 0 && (
              <motion.div key="qr-idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <QRVerification onVerified={handleQRVerified} />
              </motion.div>
            )}

            {state === 'idle' && cooldown > 0 && (
              <motion.div key="cooldown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm text-amber-300">Demasiados intentos fallidos</p>
                <p className="text-xs text-gray-500">Espera <span className="font-mono text-amber-400">{cooldown}s</span> antes de reintentar</p>
              </motion.div>
            )}

            {state === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-2">
                <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Generando desafío...</p>
              </motion.div>
            )}

            {state === 'solving' && (
              <motion.div key="solving" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
                {renderChallenge()}
              </motion.div>
            )}

            {state === 'verifying' && (
              <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-2">
                <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Analizando 14 señales de comportamiento...</p>
              </motion.div>
            )}

            {state === 'result' && result && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <CaptchaResult
                  success={result.success}
                  riskScore={result.riskScore}
                  riskLevel={result.riskLevel}
                  message={result.message}
                  signals={result.signals}
                  timeTaken={result.timeTaken}
                  onRetry={generateCaptcha}
                />
              </motion.div>
            )}

            {error && state === 'idle' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-800/30 border-t border-gray-700/50 flex items-center justify-between">
          <span className="text-[9px] text-gray-600">Anti-Bot v3.0 · 14 señales · 7 desafíos</span>
          <div className="flex items-center gap-2">
            {failCount > 0 && (
              <span className="text-[9px] text-amber-500">Fallos: {failCount}/3</span>
            )}
            {challenge && state !== 'idle' && state !== 'loading' && (
              <button onClick={generateCaptcha} className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5" /> Nuevo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
