'use client';import { useEffect, useState, useCallback } from 'react';import { useUIElements } from '@/components/UIElementsProvider';import { X, Sparkles } from 'lucide-react';
const LS_KEY = 'promo_popup_closed';
const COOLDOWN = 3600000;
export default function PromoPopup() {
  const { settings } = useUIElements();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => { setMounted(true) }, []);
  useEffect(() => {
    if (!mounted) return;
    const enabled = settings?.['homepage_promo_enabled'] !== 'false';
    const content = settings?.['homepage_promo_content'] || '';
    if (!enabled || !content) return;
    try {
      const closed = localStorage.getItem(LS_KEY);
      if (closed) {
        const ts = parseInt(closed, 10);
        if (Date.now() - ts < COOLDOWN) return;
        localStorage.removeItem(LS_KEY);
      }
    } catch {}
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, [mounted, settings]);
  const handleClose = useCallback(() => {
    setShow(false);
  }, []);
  if (!mounted) return null;
  const enabled = settings?.['homepage_promo_enabled'] !== 'false';
  const content = settings?.['homepage_promo_content'] || '';
  if (!enabled || !content || !show) return null;
  const title = settings?.['homepage_promo_title'] || 'Khuyến Mãi Đặc Biệt';
  const titleColor = settings?.['homepage_promo_title_color'] || '#ffffff';
  const gradFrom = settings?.['homepage_promo_gradient_from'] || '#3b82f6';
  const gradTo = settings?.['homepage_promo_gradient_to'] || '#8b5cf6';
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
        <div className="relative mx-4 w-full max-w-lg animate-scaleIn" onClick={e => e.stopPropagation()}>
          <div className="relative overflow-hidden rounded-2xl bg-main shadow-2xl border border-divider">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-color)]/5 pointer-events-none" />
            <div className="relative">
              <div className="px-6 py-4" style={{ background: `linear-gradient(to right, ${gradFrom}, ${gradTo})` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-5 w-5 shrink-0" style={{ color: titleColor }} />
                    <span className="text-sm font-bold uppercase tracking-wider truncate" style={{ color: titleColor }}>{title}</span>
                  </div>
                  <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition shrink-0 ml-2">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
              <div className="border-t border-divider px-6 py-4 bg-card">
                <button onClick={handleClose} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-divider px-4 py-2.5 text-sm font-medium text-muted hover:text-main hover:bg-hover transition">
                  Bỏ qua phiên này
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.35s ease-out; }
      `}</style>
    </>
  );
}