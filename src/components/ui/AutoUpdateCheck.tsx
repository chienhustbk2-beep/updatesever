'use client';import { useEffect, useRef } from 'react';import { usePathname } from 'next/navigation';

export default function AutoUpdateCheck() {
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!pathname.startsWith('/admin')) return;

    const check = async () => {
      try {
        const prefsRes = await fetch('/api/admin/update');
        const prefs = await prefsRes.json();
        if (!prefs.autoUpdateEnabled) return;

        const lastCheck = prefs.lastCheck ? new Date(prefs.lastCheck).getTime() : 0;
        const intervalMs = (prefs.autoUpdateIntervalMinutes || 360) * 60 * 1000;
        if (Date.now() - lastCheck < intervalMs) return;

        const res = await fetch('/api/admin/update/check', { method: 'POST' });
        const data = await res.json();
        if (data.hasUpdate && prefs.latestAvailableVersion !== data.latestVersion) {
          window.dispatchEvent(new CustomEvent('update-available', { detail: { version: data.latestVersion, current: data.currentVersion } }));
        }
      } catch {}
    };

    check();
    intervalRef.current = setInterval(check, 3600000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [pathname]);

  return null;
}
