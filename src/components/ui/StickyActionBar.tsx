"use client";
import { Loader2 } from "lucide-react";

interface StickyActionBarProps {
  onSave: () => void;
  onCancel?: () => void;
  saving?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
}

export default function StickyActionBar({
  onSave,
  onCancel,
  saving,
  saveLabel = "Lưu thay đổi",
  cancelLabel = "Hủy",
}: StickyActionBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 border-t border-divider bg-card/95 backdrop-blur-md shadow-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm text-muted hidden sm:block">
          {saving ? "Đang lưu dữ liệu..." : "Bạn có thay đổi chưa lưu"}
        </p>
        <div className="flex w-full sm:w-auto gap-3">
          {onCancel && <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none rounded-xl border border-divider bg-card px-6 py-2.5 text-sm font-medium text-muted transition hover:bg-hover"
          >
            {cancelLabel}
          </button>}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 sm:flex-none rounded-xl bg-[var(--primary)] px-8 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--primary)]/90 disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </span>
            ) : (
              saveLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
