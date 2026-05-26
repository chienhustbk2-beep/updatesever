'use client';import { useState, useEffect, useRef, useCallback } from 'react';import { useSession } from 'next-auth/react';import { CircleDollarSign, X, CheckCircle } from 'lucide-react';

interface Deposit {
  amount: number;
  createdAt: string;
}

export default function DepositNotification() {
  const { data: session, update } = useSession();
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [visible, setVisible] = useState(false);
  const lastCheckRef = useRef('');

  const checkDeposits = useCallback(async () => {
    try {
      await fetch('/api/web2m/sync');
      await new Promise(r => setTimeout(r, 1500));
      const since = lastCheckRef.current;
      const res = await fetch(`/api/user/recent-deposit?since=${encodeURIComponent(since)}`);
      const data = await res.json();
      if (data.success && data.deposits?.length > 0) {
        const latest = data.deposits[0];
        lastCheckRef.current = latest.createdAt;
        setDeposit({ amount: latest.amount, createdAt: latest.createdAt });
        setVisible(true);
        update();
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => setDeposit(null), 300);
        }, 5000);
      }
    } catch {}
  }, [update]);

  useEffect(() => {
    if (!session?.user?.id) return;
    lastCheckRef.current = new Date().toISOString();
    checkDeposits();
    const interval = setInterval(checkDeposits, 10000);
    const onVisible = () => { if (document.visibilityState === 'visible') checkDeposits() };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) };
  }, [session?.user?.id, checkDeposits]);

  if (!deposit) return null;

  return (
    <>
      {visible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 transition-opacity duration-300"
            onClick={() => { setVisible(false); setTimeout(() => setDeposit(null), 300) }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] max-w-[90vw] overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 shadow-inner">
                <CircleDollarSign className="h-10 w-10 text-emerald-500" />
              </div>
              <div className="mb-1 flex items-center justify-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-emerald-500">
                  Nạp tiền thành công
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">Bạn vừa nạp</p>
              <p className="mt-1 text-5xl font-black text-gray-800">
                {deposit.amount.toLocaleString('vi-VN')}
                <span className="text-xl font-bold text-gray-400 ml-1">đ</span>
              </p>
              <p className="mt-2 text-xs text-gray-300">
                {new Date(deposit.createdAt).toLocaleString('vi-VN')}
              </p>
              <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-600">
                  Số dư đã được cập nhật
                </p>
              </div>
            </div>
            <button
              onClick={() => { setVisible(false); setTimeout(() => setDeposit(null), 300) }}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-300 transition hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
