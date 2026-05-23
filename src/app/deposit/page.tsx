"use client";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Check, Info, Loader2, Clock, Banknote, Repeat } from "lucide-react";
import Image from "next/image";

const DEPOSIT_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];
const DEFAULT_BANK = { bankCode: "VCB", bankAccount: "0123456789", bankAccountName: "NGUYEN VAN A", bankName: "Vietcombank" };

function DepositContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");
  const initialAmount = amountParam ? parseInt(amountParam) : 0;
  const [selectedAmount, setSelectedAmount] = useState(initialAmount > 0 ? 0 : 50000);
  const [customAmount, setCustomAmount] = useState(initialAmount > 0 ? initialAmount.toString() : "");
  const [copied, setCopied] = useState(false);
  const [bankConfig, setBankConfig] = useState(DEFAULT_BANK);
  const [activeGateway, setActiveGateway] = useState("SEPAY");
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    fetch("/api/public/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings || {};
        setBankConfig({
          bankCode: s.bankCode || DEFAULT_BANK.bankCode,
          bankAccount: s.bankAccount || DEFAULT_BANK.bankAccount,
          bankAccountName: s.bankAccountName || DEFAULT_BANK.bankAccountName,
          bankName: s.bankName || DEFAULT_BANK.bankName,
        });
        setActiveGateway(s.activePaymentGateway || "SEPAY");
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  if (status === "loading" || loadingConfig) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-divine-blue" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const userId = session.user.id;
  const amount = customAmount ? parseInt(customAmount) : selectedAmount;
  const depositContent = `NAP ${userId}`;

  const vietqrUrl = `https://img.vietqr.io/image/${bankConfig.bankCode}-${bankConfig.bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(depositContent)}&accountName=${encodeURIComponent(bankConfig.bankAccountName)}`;

  const handleCopy = async () => {
    const textarea = document.createElement("textarea");
    textarea.value = depositContent;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    try {
      document.execCommand("copy");
    } catch {
      await navigator.clipboard.writeText(depositContent);
    }
    document.body.removeChild(textarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold dark:text-main text-main">
        Nạp tiền vào ví
      </h1>
      <p className="mb-8 text-sm text-muted">
        Chuyển khoản qua VietQR để nạp tiền tự động vào tài khoản
      </p>

      {/* Gateway indicator */}
      <div className="mb-6 flex items-center gap-2 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 px-4 py-3 text-sm text-muted">
        <Repeat className="h-4 w-4 text-[var(--primary)]" />
        <span>
          Cổng thanh toán:{" "}
          <strong className="text-main">
            {activeGateway === "WEB2M" ? "Web2M" : "SePay"}
          </strong>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: QR Code */}
        <div className="rounded-xl border border-divider bg-divine-card p-6">
          <h2 className="mb-4 text-lg font-semibold dark:text-main text-main">
            Quét mã QR để chuyển khoản
          </h2>
          <div className="mb-6 flex justify-center rounded-xl bg-main p-2">
            <Image
              src={vietqrUrl}
              alt="VietQR Code"
              width={400}
              height={400}
              className="max-w-full"
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted">Số tiền cần chuyển</p>
            <p className="text-3xl font-extrabold text-divine-blue text-neon-glow">
              {amount.toLocaleString("vi-VN")}đ
            </p>
          </div>
        </div>

        {/* Right: Instructions */}
        <div className="space-y-6">
          {/* Amount Selection */}
          <div className="rounded-xl border border-divider bg-divine-card p-6">
            <h2 className="mb-4 text-lg font-semibold dark:text-main text-main">
              Chọn số tiền nạp
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {DEPOSIT_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                    selectedAmount === amt && !customAmount
                      ? "border-divine-blue bg-divine-blue/20 text-divine-blue"
                      : "border-divider bg-main text-muted hover:border-divine-blue/50 hover:text-main"
                  }`}
                >
                  {amt.toLocaleString("vi-VN")}đ
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-muted mb-1">Hoặc nhập số tiền khác</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Nhập số tiền..."
                className="w-full rounded-lg border border-divider bg-main px-4 py-2.5 text-sm text-main outline-none focus:border-divine-blue focus:ring-1 focus:ring-divine-blue"
              />
            </div>
          </div>

          {/* Transfer Info */}
          <div className="rounded-xl border border-divider bg-divine-card p-6">
            <h2 className="mb-4 text-lg font-semibold dark:text-main text-main">
              Thông tin chuyển khoản
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">Ngân hàng:</span>
                <span className="font-medium">{bankConfig.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Số tài khoản:</span>
                <span className="font-medium">{bankConfig.bankAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Chủ tài khoản:</span>
                <span className="font-medium">{bankConfig.bankAccountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <code className="rounded bg-divine-dark px-2 py-1 text-sm font-mono">{depositContent}</code>
                  <button
                    onClick={handleCopy}
                    className="rounded-lg bg-[var(--primary)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/20 transition"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Sau khi chuyển khoản, hệ thống sẽ tự động cộng tiền vào ví trong vòng 1-5 phút.
                Nếu quá 10 phút chưa nhận được, vui lòng liên hệ hỗ trợ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-divine-blue" />
      </div>
    }>
      <DepositContent />
    </Suspense>
  );
}
