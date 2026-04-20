'use client';

import { useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CaptchaWidget from '@/components/captcha/CaptchaWidget';

function WidgetEmbedContent() {
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'dark';
  const color = searchParams.get('color') || '#10b981';
  const lang = searchParams.get('lang') || 'es';
  const size = searchParams.get('size') || 'normal';
  const sessionId = searchParams.get('sessionId') || '';
  const instanceId = searchParams.get('instanceId') || '';
  const version = searchParams.get('v') || '3.1.0';

  const ALLOWED_ORIGIN = 'https://smouj.github.io';

  const postMessage = useCallback((type: string, data: Record<string, unknown> = {}) => {
    try {
      window.parent.postMessage(
        { type, instanceId, sessionId, ...data },
        ALLOWED_ORIGIN
      );
    } catch (e) {
      console.warn('[CAPTCHA Shield Embed] postMessage failed:', e);
    }
  }, [instanceId, sessionId]);

  // Signal ready on mount
  useEffect(() => {
    // Wait a tick for the DOM to be fully rendered
    const timer = setTimeout(() => {
      const height = document.documentElement.scrollHeight;
      postMessage('captcha-shield-ready', { height });
    }, 100);

    return () => clearTimeout(timer);
  }, [postMessage]);

  // Notify parent of resizes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height + 20; // padding
        postMessage('captcha-shield-resize', { height });
      }
    });

    resizeObserver.observe(document.body);

    return () => resizeObserver.disconnect();
  }, [postMessage]);

  // Global callback for CaptchaWidget verification
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__captchaEmbedConfig = {
      theme,
      primaryColor: color,
      language: lang,
    };

    (window as unknown as Record<string, unknown>).__captchaEmbedPostMessage = postMessage;
  }, [theme, color, lang, postMessage]);

  // Override the onCaptchaVerified to postMessage
  useEffect(() => {
    const originalHandler = (window as unknown as Record<string, unknown>).onCaptchaVerified;
    (window as unknown as Record<string, unknown>).onCaptchaVerified = (response: Record<string, unknown>) => {
      // Post to parent
      postMessage('captcha-shield-verified', { payload: response });

      // Also call any original handler
      if (typeof originalHandler === 'function') {
        originalHandler(response);
      }
    };

    return () => {
      // Restore on cleanup
      if (originalHandler) {
        (window as unknown as Record<string, unknown>).onCaptchaVerified = originalHandler;
      }
    };
  }, [postMessage]);

  const sizeScale = size === 'compact' ? 0.85 : size === 'large' ? 1.1 : 1;
  const isDark = theme === 'dark';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-2"
      style={{
        backgroundColor: isDark ? '#0a0f1a' : '#f3f4f6',
        transform: `scale(${sizeScale})`,
        transformOrigin: 'top center',
      }}
    >
      <CaptchaWidget />
    </div>
  );
}

export default function WidgetEmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Cargando widget...</p>
          </div>
        </div>
      }
    >
      <WidgetEmbedContent />
    </Suspense>
  );
}
