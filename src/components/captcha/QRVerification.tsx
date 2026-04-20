'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import QRCode from 'qrcode';

interface Props {
  onVerified: (success: boolean, code: string) => void;
}

export default function QRVerification({ onVerified }: Props) {
  const [phase, setPhase] = useState<'idle' | 'generating' | 'waiting' | 'input' | 'verified' | 'expired'>('idle');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [code, setCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateQR = useCallback(async () => {
    setPhase('generating');
    const newCode = String(Math.floor(100000 + Math.random() * 900000));
    setCode(newCode);

    try {
      const url = `https://smouj.github.io/captcha-shield/verify?token=${sessionId}&code=${newCode}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#e2e8f0', light: '#0f172a' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
      setPhase('waiting');
      setTimeLeft(120);
      setShowHint(false);
      setUserInput('');

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setPhase('idle');
    }
  }, [sessionId]);

  const handleVerifyCode = useCallback(() => {
    if (userInput === code) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('verified');
      onVerified(true, code);
    } else {
      setUserInput('');
      // Shake animation handled by UI
    }
  }, [userInput, code, onVerified]);

  const handleBack = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('idle');
    onVerified(false, '');
  }, [onVerified]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* Idle */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto">
              <Image src="/logo-icon-white.png" alt="CAPTCHA Shield" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Verificación móvil</h3>
              <p className="text-xs text-gray-500 mt-1">Verifícate con tu teléfono móvil mediante código QR</p>
            </div>
            <button onClick={generateQR}
              className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/25">
              Generar código QR
            </button>
          </motion.div>
        )}

        {/* Generating */}
        {phase === 'generating' && (
          <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
            <span className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin inline-block" />
            <p className="text-xs text-gray-400 mt-3">Generando código de verificación...</p>
          </motion.div>
        )}

        {/* Waiting / QR Display */}
        {(phase === 'waiting' || phase === 'input') && (
          <motion.div key="waiting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-[#0f172a] p-3 rounded-xl border border-gray-700">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Código QR de verificación" width={180} height={180} className="rounded-lg" />
                )}
              </div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-xs text-gray-400">Escanea este código con tu móvil</p>
              <p className={`text-sm font-mono font-bold mt-1 ${timeLeft < 30 ? 'text-red-400' : 'text-purple-400'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-3 max-w-[300px] mx-auto">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-[10px] text-gray-500">o introduce el código manualmente</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            {/* Code input */}
            <div className="space-y-2">
              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={userInput[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val) {
                        const newInput = userInput.slice(0, i) + val + userInput.slice(i + 1);
                        setUserInput(newInput.slice(0, 6));
                        if (newInput.length === 6) {
                          setTimeout(() => {
                            const fullCode = newInput.slice(0, 6);
                            setUserInput(fullCode);
                            if (fullCode === code) {
                              if (timerRef.current) clearInterval(timerRef.current);
                              setPhase('verified');
                              onVerified(true, code);
                            } else {
                              setUserInput('');
                            }
                          }, 100);
                        }
                      } else {
                        setUserInput(userInput.slice(0, i));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !userInput[i] && i > 0) {
                        const prev = document.querySelectorAll('.code-digit')[i - 1] as HTMLInputElement;
                        prev?.focus();
                      }
                    }}
                    className="w-9 h-11 text-center text-lg font-mono font-bold bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-colors code-digit"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {userInput.length === 6 && userInput !== code && (
                <p className="text-xs text-red-400 text-center animate-pulse">Código incorrecto, inténtalo de nuevo</p>
              )}
            </div>

            {/* Hint for demo */}
            {!showHint && (
              <div className="text-center">
                <button onClick={() => setShowHint(true)} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                  ¿No tienes el móvil? Obtén código de prueba
                </button>
              </div>
            )}

            {showHint && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-amber-300">Código de prueba: <span className="font-mono font-bold">{code}</span></p>
                <p className="text-[10px] text-gray-500 mt-0.5">(Solo para demostración)</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-center pt-1">
              <button onClick={handleBack}
                className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                Volver
              </button>
              <button onClick={generateQR}
                className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                Nuevo código
              </button>
            </div>
          </motion.div>
        )}

        {/* Verified */}
        {phase === 'verified' && (
          <motion.div key="verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/50 flex items-center justify-center mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-400">Verificación móvil exitosa</h3>
              <p className="text-xs text-gray-500 mt-1">Tu identidad ha sido verificada mediante tu dispositivo móvil</p>
            </div>
          </motion.div>
        )}

        {/* Expired */}
        {phase === 'expired' && (
          <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-red-500/20 ring-2 ring-red-500/50 flex items-center justify-center mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-400">Código expirado</h3>
              <p className="text-xs text-gray-500 mt-1">El tiempo de verificación ha terminado</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={handleBack}
                className="px-3 py-1.5 text-xs text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                Volver
              </button>
              <button onClick={generateQR}
                className="px-4 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors">
                Generar nuevo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
