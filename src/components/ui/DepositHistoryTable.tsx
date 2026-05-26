'use client';
import { useState, useEffect } from 'react';
import { Landmark, ArrowDown, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
}

export default function DepositHistoryTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/transactions?type=DEPOSIT&page=${p}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch deposit history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--success)]"><CheckCircle className="h-3 w-3" />Hoàn tất</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--warning)]"><Clock className="h-3 w-3" />Chờ xử lý</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--danger)]"><XCircle className="h-3 w-3" />Thất bại</span>;
      default:
        return <span className="text-xs text-muted">{status}</span>;
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="w-full rounded-xl border border-divider bg-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-divider bg-card">
      <div className="flex items-center justify-between border-b border-divider px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-main">
          <Landmark className="h-4 w-4 text-[var(--primary)]" />
          Lịch sử nạp tiền
        </h3>
      </div>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted">
          <ArrowDown className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">Chưa có giao dịch nạp tiền nào.</p>
        </div>
      ) : (
        <div className="divide-y divide-divider">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--success)]/10">
                  <ArrowDown className="h-4 w-4 text-[var(--success)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-main">
                    {tx.description || 'Nạp tiền'}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(tx.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--success)]">
                  +{formatAmount(tx.amount)}
                </span>
                {statusBadge(tx.status)}
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-divider px-5 py-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-divider px-3 py-1.5 text-xs font-medium text-muted hover:text-main hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="text-xs text-muted">Trang {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-divider px-3 py-1.5 text-xs font-medium text-muted hover:text-main hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
