'use client';

import { useEffect, useRef, useCallback } from 'react';
import { collectDeviceFingerprint, type BehavioralData, type DeviceFingerprint, type MousePoint, type ClickEvent, type ScrollEvent, type KeyEvent, type VisibilityEvent } from '@/lib/behavioral-analyzer';

interface BehaviorTrackerProps {
  onData: (data: BehavioralData) => void;
  active: boolean;
  challengeType: string;
}

export default function BehaviorTracker({ onData, active, challengeType }: BehaviorTrackerProps) {
  const startTimeRef = useRef<number>(Date.now());
  const mouseMovementsRef = useRef<MousePoint[]>([]);
  const clicksRef = useRef<ClickEvent[]>([]);
  const scrollEventsRef = useRef<ScrollEvent[]>([]);
  const keyEventsRef = useRef<KeyEvent[]>([]);
  const visibilityEventsRef = useRef<VisibilityEvent[]>([]);
  const deviceFingerprintRef = useRef<DeviceFingerprint | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const clickStartTimesRef = useRef<Map<number, number>>(new Map());
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildAndSendData = useCallback(() => {
    const bd: BehavioralData = {
      mouseMovements: [...mouseMovementsRef.current],
      clicks: [...clicksRef.current],
      scrollEvents: [...scrollEventsRef.current],
      keyEvents: [...keyEventsRef.current],
      visibilityEvents: [...visibilityEventsRef.current],
      startTime: startTimeRef.current,
      submitTime: Date.now(),
      challengeType,
      totalInteractions: mouseMovementsRef.current.length + clicksRef.current.length + keyEventsRef.current.length,
      deviceFingerprint: deviceFingerprintRef.current || {
        screenWidth: 0, screenHeight: 0, colorDepth: 0, timezone: '', language: '',
        platform: '', hardwareConcurrency: 0, maxTouchPoints: 0, webglRenderer: '',
        webglVendor: '', hasWebGL: false, hasCanvas: false, pluginsCount: 0,
        isHeadless: false, automationDetected: false,
      },
    };
    onData(bd);
  }, [onData, challengeType]);

  useEffect(() => {
    if (!active) return;

    startTimeRef.current = Date.now();
    mouseMovementsRef.current = [];
    clicksRef.current = [];
    scrollEventsRef.current = [];
    keyEventsRef.current = [];
    visibilityEventsRef.current = [];
    deviceFingerprintRef.current = collectDeviceFingerprint();

    // Sync behavioral data to parent every 2 seconds
    syncTimerRef.current = setInterval(() => {
      buildAndSendData();
    }, 2000);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      // Send final data on unmount so parent always has latest
      buildAndSendData();
    };
  }, [active, buildAndSendData]);

  const handleMouseMove = useCallback((e: PointerEvent) => {
    if (!active) return;
    const now = Date.now();
    if (now - lastMoveTimeRef.current < 25) return;
    lastMoveTimeRef.current = now;
    mouseMovementsRef.current.push({
      x: e.clientX,
      y: e.clientY,
      t: now - startTimeRef.current,
      pressure: e.pressure,
    });
    if (mouseMovementsRef.current.length > 600) {
      mouseMovementsRef.current = mouseMovementsRef.current.slice(-500);
    }
  }, [active]);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!active) return;
    clickStartTimesRef.current.set(e.pointerId, Date.now() - startTimeRef.current);
  }, [active]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!active) return;
    const startT = clickStartTimesRef.current.get(e.pointerId);
    clicksRef.current.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now() - startTimeRef.current,
      duration: startT ? (Date.now() - startTimeRef.current) - startT : undefined,
    });
    clickStartTimesRef.current.delete(e.pointerId);
  }, [active]);

  const handleScroll = useCallback(() => {
    if (!active) return;
    scrollEventsRef.current.push({
      y: window.scrollY,
      t: Date.now() - startTimeRef.current,
    });
    if (scrollEventsRef.current.length > 60) {
      scrollEventsRef.current = scrollEventsRef.current.slice(-50);
    }
  }, [active]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!active) return;
    keyEventsRef.current.push({ key: e.key, t: Date.now() - startTimeRef.current, type: 'down' });
    if (keyEventsRef.current.length > 200) keyEventsRef.current = keyEventsRef.current.slice(-150);
  }, [active]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!active) return;
    keyEventsRef.current.push({ key: e.key, t: Date.now() - startTimeRef.current, type: 'up' });
  }, [active]);

  const handleVisibility = useCallback(() => {
    if (!active) return;
    visibilityEventsRef.current.push({
      hidden: document.hidden,
      t: Date.now() - startTimeRef.current,
    });
  }, [active]);

  useEffect(() => {
    if (active) {
      window.addEventListener('pointermove', handleMouseMove);
      window.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        window.removeEventListener('pointermove', handleMouseMove);
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        document.removeEventListener('visibilitychange', handleVisibility);
      };
    }
  }, [active, handleMouseMove, handlePointerDown, handlePointerUp, handleScroll, handleKeyDown, handleKeyUp, handleVisibility]);

  return null;
}
