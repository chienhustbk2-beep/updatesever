'use client';import { useEffect, useState } from 'react';import { useUIElements } from '@/components/UIElementsProvider';
export default function NotificationBar() {
  const { settings } = useUIElements();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true) }, []);
  if (!mounted) return null;
  const enabled = settings?.['homepage_notification_enabled'] !== 'false';
  const content = settings?.['homepage_notification_content'] || '';
  if (!enabled || !content) return null;
  const animation = settings?.['homepage_notification_animation'] || 'marquee';
  const animClass = animation === 'fadeIn' ? 'animate-fadeIn' : animation === 'slideDown' ? 'animate-slideDown' : animation === 'pulse' ? 'animate-pulse' : 'animate-marquee';
  return (
    <>
      <div className={`notification-bar ${animClass}`}>
        <div className="mx-auto max-w-7xl px-4 py-2 overflow-hidden">
          {animation === 'marquee' ? (
            <div className="whitespace-nowrap inline-block marquee-content" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="text-center" dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </div>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
        .animate-marquee .marquee-content { animation: marquee 25s linear infinite; display: inline-block; }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        @keyframes slideDown { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        @keyframes pulse-glow { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .animate-pulse { animation: pulse-glow 2s ease-in-out infinite; }
        .notification-bar { position: relative; z-index: 10; }
      `}</style>
    </>
  );
}