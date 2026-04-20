'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';
import BehaviorTracker from './BehaviorTracker';
import PuzzleChallenge from './PuzzleChallenge';
import ImageSelectChallenge from './ImageSelectChallenge';
import MathVisualChallenge from './MathVisualChallenge';
import PatternTraceChallenge from './PatternTraceChallenge';
import CaptchaResult from './CaptchaResult';
import type { BehavioralData } from './BehaviorTracker';

type ChallengeType = 'puzzle' | 'image_select' | 'math_visual' | 'pattern_trace';

interface ChallengeResponse {
  id: string;
  sessionId: string;
  challengeType: string;
  challengeData: any;
  createdAt: string;
  expiresAt: string;
}

interface VerifyResponse {
  success: boolean;
  riskScore: number;
  message: string;
  signals?: Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }>;
  error?: string;
}

type WidgetState = 'idle' | 'loading' | 'solving' | 'verifying' | 'result';

const CHALLENGE_LABELS: Record<ChallengeType, string> = {
  puzzle: 'Rompecabezas deslizante',
  image_select: 'Selección de imágenes',
  math_visual: 'Operación matemática visual',
  pattern_trace: 'Trazado de patrón',
};

const CHALLENGE_ICONS: Record<ChallengeType, string> = {
  puzzle: '🧩',
  image_select: '🖼️',
  math_visual: '🔢',
  pattern_trace: '🔗',
};

export default function CaptchaWidget() {
  const [state, setState] = useState<WidgetState>('idle');
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [behavioralData, setBehavioralData] = useState<BehavioralData | null>(null);
  const behavioralDataRef = useRef<BehavioralData | null>(null);

  const generateCaptcha = useCallback(async () => {
    setState('loading');
    setError(null);
    setChallenge(null);
    setVerifyResult(null);

    try {
      const sessionId = crypto.randomUUID();
      const res = await fetch('/api/captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al generar el CAPTCHA');
      }

      const data = await res.json();
      setChallenge(data);
      setState('solving');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setState('idle');
    }
  }, []);

  const handleVerify = useCallback(async (response: any) => {
    if (!challenge) return;

    setState('verifying');

    // Get behavioral data
    const bd = behavioralDataRef.current;
    const now = Date.now();

    const fullBehavioralData = bd ? {
      ...bd,
      submitTime: now,
      challengeType: challenge.challengeType,
    } : null;

    try {
      const res = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captchaId: challenge.id,
          sessionId: challenge.sessionId,
          response,
          behavioralData: fullBehavioralData,
        }),
      });

      const data = await res.json();
      setVerifyResult(data);
      setState('result');
    } catch (err) {
      setError('Error al verificar la respuesta');
      setState('solving');
    }
  }, [challenge]);

  const handleBehavioralData = useCallback((data: BehavioralData) => {
    behavioralDataRef.current = data;
    setBehavioralData(data);
  }, []);

  const renderChallenge = () => {
    if (!challenge) return null;

    const type = challenge.challengeType as ChallengeType;

    switch (type) {
      case 'puzzle':
        return <PuzzleChallenge challengeData={challenge.challengeData} onVerify={handleVerify} />;
      case 'image_select':
        return <ImageSelectChallenge challengeData={challenge.challengeData} onVerify={handleVerify} />;
      case 'math_visual':
        return <MathVisualChallenge challengeData={challenge.challengeData} onVerify={handleVerify} />;
      case 'pattern_trace':
        return <PatternTraceChallenge challengeData={challenge.challengeData} onVerify={handleVerify} />;
      default:
        return <p className="text-red-400">Tipo de desafío desconocido</p>;
    }
  };

  return (
    <div className="relative">
      {/* Behavior Tracker */}
      {state === 'solving' && (
        <BehaviorTracker
          onData={handleBehavioralData}
          active={state === 'solving'}
          challengeType={challenge?.challengeType || ''}
        />
      )}

      {/* Widget Container */}
      <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-800/50 border-b border-gray-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-200">CAPTCHA Shield</h2>
              {challenge && (
                <p className="text-[10px] text-gray-500">
                  {CHALLENGE_ICONS[challenge.challengeType as ChallengeType]}{' '}
                  {CHALLENGE_LABELS[challenge.challengeType as ChallengeType]}
                </p>
              )}
            </div>
          </div>

          {state === 'solving' && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-gray-500">Activo</span>
            </div>
          )}

          {state === 'result' && verifyResult?.success && (
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Verificado ✓
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 min-h-[320px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* Idle State */}
            {state === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto">
                  <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={64} height={64} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-200">
                    Verificación de seguridad
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Demuestra que eres humano completando el desafío
                  </p>
                </div>
                <button
                  onClick={generateCaptcha}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25"
                >
                  Iniciar verificación
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {state === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-3"
              >
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-gray-400">Generando desafío...</p>
              </motion.div>
            )}

            {/* Solving State */}
            {state === 'solving' && (
              <motion.div
                key="solving"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                {renderChallenge()}
              </motion.div>
            )}

            {/* Verifying State */}
            {state === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-3"
              >
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm text-gray-400">Verificando respuesta...</p>
              </motion.div>
            )}

            {/* Result State */}
            {state === 'result' && verifyResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <CaptchaResult
                  success={verifyResult.success}
                  riskScore={verifyResult.riskScore}
                  message={verifyResult.message}
                  signals={verifyResult.signals}
                  onRetry={generateCaptcha}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          {error && state === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-3 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-800/30 border-t border-gray-700/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-600">
            Anti-Bot v2.0 · Análisis de comportamiento activo
          </span>
          {challenge && state !== 'idle' && state !== 'loading' && (
            <button
              onClick={generateCaptcha}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              ↻ Nuevo desafío
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
