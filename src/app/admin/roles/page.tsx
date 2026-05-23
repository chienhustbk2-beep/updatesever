'use client';import { useState, useEffect } from 'react';import { Shield, Check, X, Save, Loader2, AlertCircle } from 'lucide-react';
interface Permissions { view: boolean; create: boolean; edit: boolean; delete: boolean }
interface ModulePerms { admin: Permissions; staff: Permissions }
const modules = [
  { key: '/admin', label: 'Dashboard', desc: 'Xem tổng quan doanh thu, đơn hàng...' },
  { key: '/admin/products', label: 'Sản phẩm', desc: 'Thêm, sửa, xóa sản phẩm' },
  { key: '/admin/categories', label: 'Danh mục', desc: 'Quản lý danh mục sản phẩm' },
  { key: '/admin/orders', label: 'Đơn hàng', desc: 'Xem và xử lý đơn hàng' },
  { key: '/admin/users', label: 'Người dùng', desc: 'Quản lý người dùng' },
  { key: '/admin/transactions', label: 'Giao dịch', desc: 'Duyệt nạp tiền' },
  { key: '/admin/keys', label: 'Nhập Kho Key', desc: 'Import key sản phẩm' },
  { key: '/admin/ui-customization', label: 'Tùy chỉnh UI', desc: 'Ẩn/hiện, sắp xếp UI' },
  { key: '/admin/homepage', label: 'Nội dung Trang chủ', desc: 'Quản lý nội dung trang chủ' },
  { key: '/admin/tickets', label: 'Ticket hỗ trợ', desc: 'Trả lời ticket' },
  { key: '/admin/settings', label: 'Cấu hình', desc: 'Cấu hình hệ thống' },
  { key: '/admin/audit-logs', label: 'Nhật ký', desc: 'Xem lịch sử thao tác' },
  { key: '/admin/roles', label: 'Phân quyền', desc: 'Quản lý quyền truy cập' },
];
const permLabels = { view: 'Xem', create: 'Thêm', edit: 'Sửa', delete: 'Xóa' };
const defaultPerms = (isAdmin: boolean): Permissions => ({ view: isAdmin, create: isAdmin, edit: isAdmin, delete: isAdmin });

export default function AdminRolesPage() {
  const [perms, setPerms] = useState<Record<string, ModulePerms>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchData() }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/permissions');
      const data = await res.json();
      if (res.ok) {
        const saved = data.savedConfig || {};
        const merged: Record<string, ModulePerms> = {};
        modules.forEach((mod) => {
          const existing = saved[mod.key];
          merged[mod.key] = {
            admin: existing?.admin || defaultPerms(true),
            staff: existing?.staff || defaultPerms(false),
          };
        });
        setPerms(merged);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (moduleKey: string, role: 'admin' | 'staff', perm: keyof Permissions) => {
    setPerms((prev) => {
      const next = { ...prev };
      next[moduleKey] = {
        ...next[moduleKey],
        [role]: { ...next[moduleKey][role], [perm]: !next[moduleKey][role][perm] },
      };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const config: Record<string, { admin: Permissions; staff: Permissions }> = {};
      Object.entries(perms).forEach(([key, val]) => { config[key] = val; });
      const res = await fetch('/api/admin/permissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: config }),
      });
      if (res.ok) setMessage({ type: 'success', text: 'Lưu phân quyền thành công!' });
      else { const d = await res.json(); setMessage({ type: 'error', text: d.error }); }
    } catch { setMessage({ type: 'error', text: 'Có lỗi xảy ra' }); }
    finally { setSaving(false); setTimeout(() => setMessage(null), 3000); }
  };

  if (loading) return (<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /></div>);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-[var(--primary)]"><Shield className="h-5 w-5" /><span className="text-sm font-semibold uppercase">Phân quyền</span></div>
          <h1 className="mt-1 text-3xl font-extrabold gradient-heading">Vai trò & Quyền hạn</h1>
          <p className="mt-1 text-sm text-muted">Phân quyền chi tiết 4 cấp độ: Xem - Thêm - Sửa - Xóa cho từng module</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-40">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {message && <div className={`mb-6 rounded-xl p-4 border ${message.type === 'success' ? 'bg-success/10 text-[var(--success)] border-[var(--success)]/20' : 'bg-destructive/10 text-[var(--danger)] border-[var(--danger)]/20'}`}>{message.text}</div>}

      <div className="rounded-2xl border border-divider bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-hover/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase w-48">Module</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Mô tả</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-muted uppercase" colSpan={4}>Admin</th>
                <th className="px-2 py-3 text-center text-xs font-semibold text-muted uppercase" colSpan={4}>Staff</th>
              </tr>
              <tr className="border-b border-divider bg-hover/30">
                <th></th><th></th>
                {['admin', 'staff'].map((role) => (
                  (['view', 'create', 'edit', 'delete'] as const).map((p) => (
                    <th key={`${role}-${p}`} className="px-2 py-2 text-center text-[10px] font-semibold text-muted uppercase w-14">{permLabels[p]}</th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-divider)]">
              {modules.map((mod) => {
                const p = perms[mod.key];
                if (!p) return null;
                return (
                  <tr key={mod.key} className="hover:bg-hover/30 transition">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-main">{mod.label}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-muted">{mod.desc}</span></td>
                    {(['admin', 'staff'] as const).map((role) => (
                      (['view', 'create', 'edit', 'delete'] as const).map((perm) => (
                        <td key={`${mod.key}-${role}-${perm}`} className="px-2 py-3 text-center">
                          <button
                            onClick={() => toggle(mod.key, role, perm)}
                            className={`mx-auto flex h-7 w-7 items-center justify-center rounded-lg transition ${
                              p[role][perm]
                              ? 'bg-[var(--primary)] text-white shadow-sm'
                              : 'bg-hover text-muted hover:bg-[var(--primary)]/10'
                            }`}
                          >
                            {p[role][perm] ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      ))
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
