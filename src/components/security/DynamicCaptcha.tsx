"use client";
import { useState, useEffect, useRef } from "react";

interface DynamicCaptchaProps {
  onVerify: (token: string) => void;
}

export default function DynamicCaptcha({ onVerify }: DynamicCaptchaProps) {
  const [config, setConfig] = useState<{
    enableCaptcha: boolean;
    captchaType: string;
    siteKey: string;
  } | null>(null);
  const [sliderPos, setSliderPos] = useState(0);
  const [sliderDone, setSliderDone] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");
  const [textChallenge, setTextChallenge] = useState("");
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || d;
        setConfig({
          enableCaptcha: s.enableCaptcha === "true",
          captchaType: s.captchaType || "text",
          siteKey: s.captchaSiteKey || "",
        });
      })
      .catch(() => setConfig({ enableCaptcha: false, captchaType: "text", siteKey: "" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (config?.captchaType === "text" && config?.enableCaptcha) {
      setTextChallenge(generateTextChallenge());
    }
  }, [config]);

  function generateTextChallenge(): string {
    const a = Math.floor(10 + Math.random() * 90);
    const b = Math.floor(10 + Math.random() * 90);
    return `${a} + ${b} = ?`;
  }

  function verifyTextAnswer(answer: string): boolean {
    const match = textChallenge.match(/(\d+)\s*\+\s*(\d+)/);
    if (!match) return false;
    const expected = parseInt(match[1]) + parseInt(match[2]);
    return parseInt(answer) === expected;
  }

  const handleMouseDown = () => { isDragging.current = true };
  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const slider = sliderRef.current;
    if (!slider) return;
    const rect = slider.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const pct = slider.offsetLeft / (rect.width - slider.offsetWidth);
    if (pct > 0.9) {
      setSliderDone(true);
      onVerify("slider-verified");
    } else {
      setSliderPos(0);
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !sliderRef.current?.parentElement) return;
    const rect = sliderRef.current.parentElement.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width - sliderRef.current.offsetWidth));
    setSliderPos(x);
  };

  useEffect(() => {
    return () => { isDragging.current = false };
  }, []);

  if (loading) return null;
  if (!config?.enableCaptcha) return null;

  if (config.captchaType === "slider") {
    return (
      <div className="select-none">
        {sliderDone ? (
          <p className="text-xs text-[var(--success)]">Xac minh hoan tat</p>
        ) : (
          <div
            className="relative h-10 w-full rounded-lg border border-divider bg-main overflow-hidden cursor-pointer"
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { if (isDragging.current) { isDragging.current = false; setSliderPos(0) } }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">
              Keo thanh trot sang phai de xac minh
            </div>
            <div
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              className="absolute top-0 left-0 z-10 flex h-full w-10 cursor-grab items-center justify-center rounded-lg bg-[var(--primary)] text-white text-sm font-bold active:cursor-grabbing"
              style={{ transform: `translateX(${sliderPos}px)` }}
            >
              {">"}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (config.captchaType === "reCAPTCHA" && config.siteKey) {
    return (
      <div className="flex justify-center">
        <CaptchaWidget siteKey={config.siteKey} onVerify={onVerify} />
      </div>
    );
  }

  // Default: text captcha
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1">
        Xac minh: {textChallenge}
      </label>
      <input
        type="text"
        value={textAnswer}
        onChange={(e) => {
          setTextAnswer(e.target.value);
          if (verifyTextAnswer(e.target.value)) {
            onVerify("text-verified");
          }
        }}
        className="w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
        placeholder="Nhap ket qua..."
      />
    </div>
  );
}

// Inline reCAPTCHA wrapper (client-side only, uses global grecaptcha)
function CaptchaWidget({ siteKey, onVerify }: { siteKey: string; onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current || !containerRef.current || typeof window === "undefined") return;
    rendered.current = true;
    const win = window as any;
    if (win.grecaptcha && win.grecaptcha.render) {
      try {
        win.grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
        });
      } catch { /* ignore */ }
    } else {
      // If reCAPTCHA script not loaded, load it
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (containerRef.current && win.grecaptcha) {
          try {
            win.grecaptcha.render(containerRef.current, {
              sitekey: siteKey,
              callback: (token: string) => onVerify(token),
            });
          } catch { /* ignore */ }
        }
      };
      document.head.appendChild(script);
    }
  }, [siteKey, onVerify]);

  return <div ref={containerRef} />;
}
