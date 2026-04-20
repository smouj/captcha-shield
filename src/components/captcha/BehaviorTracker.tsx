'use client';

import { useEffect, useRef, useCallback } from 'react';

export interface MousePoint {
  x: number;
  y: number;
  t: number;
}

export interface ClickEvent {
  x: number;
  y: number;
  t: number;
}

export interface ScrollEvent {
  y: number;
  t: number;
}

export interface BehavioralData {
  mouseMovements: MousePoint[];
  clicks: ClickEvent[];
  scrollEvents: ScrollEvent[];
  startTime: number;
  submitTime: number;
  challengeType: string;
  totalInteractions: number;
}

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

  // Reset on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    mouseMovementsRef.current = [];
    clicksRef.current = [];
    scrollEventsRef.current = [];
  }, []);

  // Throttled mouse move handler
  const lastMoveTimeRef = useRef<number>(0);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!active) return;
    const now = Date.now();
    // Throttle to ~30ms intervals
    if (now - lastMoveTimeRef.current < 30) return;
    lastMoveTimeRef.current = now;
    mouseMovementsRef.current.push({
      x: e.clientX,
      y: e.clientY,
      t: now - startTimeRef.current,
    });
    // Limit stored points to prevent memory issues
    if (mouseMovementsRef.current.length > 500) {
      mouseMovementsRef.current = mouseMovementsRef.current.slice(-400);
    }
  }, [active]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!active) return;
    clicksRef.current.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now() - startTimeRef.current,
    });
  }, [active]);

  const handleScroll = useCallback(() => {
    if (!active) return;
    scrollEventsRef.current.push({
      y: window.scrollY,
      t: Date.now() - startTimeRef.current,
    });
    if (scrollEventsRef.current.length > 50) {
      scrollEventsRef.current = scrollEventsRef.current.slice(-40);
    }
  }, [active]);

  useEffect(() => {
    if (active) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [active, handleMouseMove, handleClick, handleScroll]);

  // Expose getData function
  const getData = useCallback(() => {
    return {
      mouseMovements: mouseMovementsRef.current,
      clicks: clicksRef.current,
      scrollEvents: scrollEventsRef.current,
      startTime: startTimeRef.current,
      submitTime: Date.now(),
      challengeType,
      totalInteractions: clicksRef.current.length,
    };
  }, [challengeType]);

  // Register getData in a ref so parent can access it
  const dataRef = useRef(getData);
  dataRef.current = getData;

  // Custom event to allow parent to get data
  useEffect(() => {
    const handler = () => {
      onData(dataRef.current());
    };
    window.addEventListener('captcha-get-data', handler);
    return () => window.removeEventListener('captcha-get-data', handler);
  }, [onData]);

  return null; // Invisible tracker
}

// Hook for components to get behavioral data
export function triggerGetData(): BehavioralData | null {
  const event = new CustomEvent('captcha-get-data', {
    detail: {},
  });
  let data: BehavioralData | null = null;
  const handler = (e: Event) => {
    // We need a different approach
  };
  return null;
}
