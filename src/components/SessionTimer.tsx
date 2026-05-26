'use client';import { useEffect, useRef, useCallback } from 'react';import { signOut, useSession } from 'next-auth/react';import { useUIElements } from '@/components/UIElementsProvider';
export default function SessionTimer() {
  const { data: session } = useSession();
  const { settings } = useUIElements();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const minutes = parseInt(settings?.['session_timeout_minutes'] || '0', 10);
    if (!session?.user || minutes <= 0) return;
    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: '/login' });
    }, minutes * 60 * 1000);
  }, [session, settings]);
  useEffect(() => {
    resetTimer();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(ev => window.addEventListener(ev, resetTimer));
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
  return null;
}