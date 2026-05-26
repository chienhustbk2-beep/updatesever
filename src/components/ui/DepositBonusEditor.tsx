'use client';
import { useState } from 'react';
import { Plus, Trash2, Gift } from 'lucide-react';

interface BonusRule {
  minAmount: number;
  bonus: number;
  label: string;
}

interface DepositBonusEditorProps {
  value: string;
  onChange: (json: string) => void;
}

export default function DepositBonusEditor({ value, onChange }: DepositBonusEditorProps) {
  const [rules, setRules] = useState<BonusRule[]>(() => {
    try { const arr = JSON.parse(value || '[]'); return Array.isArray(arr) ? arr : []; }
    catch { return []; }
  });

  const updateRules = (newRules: BonusRule[]) => {
    setRules(newRules);
    onChange(JSON.stringify(newRules));
  };

  const addRule = () => {
    updateRules([...rules, { minAmount: 0, bonus: 0, label: '' }]);
  };

  const removeRule = (idx: number) => {
    updateRules(rules.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, field: keyof BonusRule, val: string) => {
    const updated = [...rules];
    if (field === 'label') {
      updated[idx][field] = val;
    } else {
      updated[idx][field] = parseInt(val) || 0;
    }
    updateRules(updated);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted px-1">
        <div className="col-span-3">Số tiền nạp tối thiểu</div>
        <div className="col-span-3">Thưởng (VND)</div>
        <div className="col-span-5">Mô tả / Nhãn</div>
        <div className="col-span-1" />
      </div>
      {rules.map((rule, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3">
            <input type="number" min="0" step="1000" value={rule.minAmount || ''}
              onChange={(e) => updateRule(idx, 'minAmount', e.target.value)}
              placeholder="50000"
              className="w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div className="col-span-3">
            <input type="number" min="0" step="1000" value={rule.bonus || ''}
              onChange={(e) => updateRule(idx, 'bonus', e.target.value)}
              placeholder="5000"
              className="w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div className="col-span-5">
            <input value={rule.label}
              onChange={(e) => updateRule(idx, 'label', e.target.value)}
              placeholder="Nạp 50k tặng 5k"
              className="w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
          </div>
          <div className="col-span-1 flex justify-center">
            <button type="button" onClick={() => removeRule(idx)}
              className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addRule}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:opacity-80 transition">
        <Plus className="h-4 w-4" /> Thêm mức thưởng
      </button>
      {rules.length > 0 && (
        <div className="rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/10 p-3">
          <p className="text-xs text-muted">
            <strong className="text-main">Xem trước:</strong> Khi user nạp tiền, hệ thống sẽ tự động kiểm tra các mốc và cộng thưởng tương ứng.
          </p>
          <ul className="mt-2 space-y-1">
            {rules.sort((a, b) => a.minAmount - b.minAmount).map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted">
                <Gift className="h-3 w-3 text-[var(--primary)]" />
                Nạp từ <strong className="text-main">{r.minAmount.toLocaleString('vi-VN')}đ</strong> →
                thưởng <strong className="text-[var(--success)]">+{r.bonus.toLocaleString('vi-VN')}đ</strong>
                {r.label && <span className="text-muted">({r.label})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
