'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const code = searchParams.get('code') || '';

  const [phase, setPhase] = useState<'verifying' | 'success' | 'error' | 'input'>(
    code && token ? 'verifying' : 'input'
  );
  const [userInput, setUserInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Simulate verification when token + code are present
  useEffect(() => {
    if (code && token) {
      // In a real app, this would verify against a server.
      // For the static demo, we just show success since the QR code
      // was generated with valid credentials.
      const timer = setTimeout(() => {
        setPhase('success');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [code, token]);

  const handleVerify = () => {
    if (!userInput || userInput.length !== 6) {
      setErrorMsg('Introduce un código de 6 dígitos');
      return;
    }

    setPhase('verifying');
    setErrorMsg('');

    // In a real app, verify against server
    setTimeout(() => {
      // Accept any valid 6-digit code for demo
      setPhase('success');
    }, 1500);
  };

  const handleDigitChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, '');
    if (val) {
      const newInput = userInput.slice(0, index) + val + userInput.slice(index + 1);
      setUserInput(newInput.slice(0, 6));
      setErrorMsg('');

      if (newInput.length === 6) {
        setTimeout(() => {
          setUserInput(newInput.slice(0, 6));
          setPhase('verifying');
          setTimeout(() => setPhase('success'), 1500);
        }, 300);
      } else {
        // Auto-focus next input
        const next = document.querySelectorAll('.verify-digit')[index + 1] as HTMLInputElement;
        next?.focus();
      }
    } else {
      setUserInput(userInput.slice(0, index));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !userInput[index] && index > 0) {
      const prev = document.querySelectorAll('.verify-digit')[index - 1] as HTMLInputElement;
      prev?.focus();
    }
  };

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              {/* Verifying */}
              {phase === 'verifying' && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-200 mb-2">Verificando...</h2>
                  <p className="text-sm text-gray-500">Confirmando tu identidad</p>
                </motion.div>
              )}

              {/* Success */}
              {phase === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-400 mb-2">Verificación exitosa</h2>
                  <p className="text-sm text-gray-400 mb-4">Tu identidad ha sido verificada correctamente. Ya puedes volver a la página original.</p>
                  <p className="text-xs text-gray-600">Este código es de un solo uso y ha expirado.</p>
                </motion.div>
              )}

              {/* Error */}
              {phase === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-red-400 mb-2">Verificación fallida</h2>
                  <p className="text-sm text-gray-400 mb-4">{errorMsg || 'El código es incorrecto o ha expirado.'}</p>
                  <button
                    onClick={() => { setPhase('input'); setUserInput(''); setErrorMsg(''); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Intentar de nuevo
                  </button>
                </motion.div>
              )}

              {/* Manual code input */}
              {phase === 'input' && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-7 h-7 text-purple-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-200 mb-1">Verificación móvil</h2>
                  <p className="text-sm text-gray-500 mb-6">Introduce el código de 6 dígitos que aparece en tu pantalla</p>

                  <div className="flex gap-2 justify-center mb-4">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={userInput[i] || ''}
                        onChange={(e) => handleDigitChange(e.target.value, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        className="verify-digit w-10 h-12 text-center text-lg font-mono font-bold bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-colors"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-red-400 mb-3 animate-pulse">{errorMsg}</p>
                  )}

                  <button
                    onClick={handleVerify}
                    disabled={userInput.length !== 6}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Verificar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </body>
    </html>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
