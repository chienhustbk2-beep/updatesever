'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, Calendar, Wallet, ShoppingCart, Key, DollarSign, Lock, Unlock, Loader2, AlertCircle, CheckCircle, XCircle, Clock, Edit, X, Shield, FileText, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';

interface OrderItem { id: string; quantity: number; price: number; product: { name: string } }
interface Order { id: string; orderNumber: string; finalAmount: number; status: string; createdAt: string; items: OrderItem[] }
interface Tx { id: string; type: string; amount: number; description: string | null; status: string; createdAt: string }
interface Download { id: string; productKey: string | null; downloadUrl: string | null; downloadCount: number; createdAt: string; order: { orderNumber: string } }
interface AuditLog { id: string; action: string; details: string | null; ipAddress: string | null; createdAt: string }
interface UserDetail {
  id: string; email: string; name: string | null; phone: string | null;
  lastSeen: string | null; balance: number; role: string; isActive: boolean; createdAt: string; updatedAt: string;
  _count: { orders: number; transactions: number; downloads: number; reviews: number; supportTickets: number };
  orders: Order[]; transactions: Tx[]; downloads: Download[]; auditLogs: AuditLog[];
}

  const roleLabels: Record<string, string> = { ADMIN: 'Quản trị viên', STAFF: 'Nhân viên', CUSTOMER: 'Khách hàng' };
  const roleColors: Record<string, string> = { ADMIN: 'bg-destructive/10 text-[var(--danger)] border-[var(--danger)]/20', STAFF: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20', CUSTOMER: 'bg-success/10 text-[var(--success)] border-[var(--success)]/20' };
  const statusLabels: Record<string, string> = { PENDING: 'Chờ xử lý', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền' };
  const txTypeLabels: Record<string, string> = { DEPOSIT: 'Nạp tiền', PAYMENT: 'Thanh toán', REFUND: 'Hoàn tiền' };
  const txTypeColors: Record<string, string> = { DEPOSIT: 'text-[var(--success)]', PAYMENT: 'text-[var(--danger)]', REFUND: 'text-[var(--primary)]' };
  const orderStatusColors: Record<string, string> = { PENDING: 'text-[var(--warning)] bg-[var(--warning)]/10', PROCESSING: 'text-[var(--primary)] bg-[var(--primary)]/10', COMPLETED: 'text-[var(--success)] bg-success/10', CANCELLED: 'text-[var(--danger)] bg-destructive/10', REFUNDED: 'text-muted bg-[var(--bg-hover)]' };

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [showEdit, setShowEdit] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [balanceForm, setBalanceForm] = useState('');
  const [passwordForm, setPasswordForm] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const loadUser = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`);
    const data = await res.json();
    if (res.ok) setUser(data.user);
    else setError(data.error || 'Không tìm thấy người dùng');
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { id } = await params;
        await loadUser(id);
      } catch {
        setError('Internal server error');
      }
      setLoading(false);
    })();
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const openEdit = () => {
    if (!user) return;
    setEditForm({ name: user.name || '', email: user.email, phone: user.phone || '', role: user.role });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!user) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) { showMsg('success', 'Cập nhật thông tin thành công!'); setShowEdit(false); await loadUser(user.id); }
      else showMsg('error', data.error);
    } catch { showMsg('error', 'Có lỗi xảy ra'); }
    setEditLoading(false);
  };

  const handleToggleActive = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (res.ok) { showMsg('success', user.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'); await loadUser(user.id); }
      else showMsg('error', data.error);
    } catch { showMsg('error', 'Có lỗi xảy ra'); }
  };

  const handleBalance = async () => {
    if (!user) return;
    const amount = parseFloat(balanceForm);
    if (isNaN(amount) || amount === 0) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balanceAdjustment: amount }),
      });
      const data = await res.json();
      if (res.ok) { showMsg('success', `${amount > 0 ? 'Cộng' : 'Trừ'} ${Math.abs(amount).toLocaleString('vi-VN')}đ thành công`); setShowBalance(false); setBalanceForm(''); await loadUser(user.id); }
      else showMsg('error', data.error);
    } catch { showMsg('error', 'Có lỗi xảy ra'); }
    setEditLoading(false);
  };

  const handlePassword = async () => {
    if (!user) return;
    if (passwordForm.length < 6) { showMsg('error', 'Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (passwordForm !== passwordConfirm) { showMsg('error', 'Mật khẩu xác nhận không khớp'); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm }),
      });
      const data = await res.json();
      if (res.ok) { showMsg('success', 'Đổi mật khẩu thành công!'); setShowPassword(false); setPasswordForm(''); setPasswordConfirm(''); }
      else showMsg('error', data.error);
    } catch { showMsg('error', 'Có lỗi xảy ra'); }
    setEditLoading(false);
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center">      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>;
  if (error || !user) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <AlertCircle className="h-12 w-12 text-[var(--danger)]" />
      <p className="text-lg font-medium text-main">{error || 'Không tìm thấy người dùng'}</p>
          <Link href="/admin/users" className="rounded-xl bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">Quay lại</Link>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {message && (
        <div className={`mb-6 rounded-xl p-4 text-sm ${message.type === 'success' ? 'bg-success/10 text-[var(--success)] border border-[var(--success)]/20' : 'bg-destructive/10 text-[var(--danger)] border border-[var(--danger)]/20'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users" className="flex h-10 w-10 items-center justify-center rounded-xl border border-divider text-muted hover:text-main transition" style={{ backgroundColor: 'var(--bg-card)' }}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-[var(--primary)] to-purple-400 bg-clip-text text-transparent">{user.name || 'Người dùng'}</h1>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${roleColors[user.role] || ''}`}>{roleLabels[user.role] || user.role}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-success/10 text-[var(--success)]' : 'bg-destructive/10 text-[var(--danger)]'}`}>
                {user.isActive ? <><CheckCircle className="h-3 w-3" /> Hoạt động</> : <><Lock className="h-3 w-3" /> Đã khóa</>}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={openEdit} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
            <Edit className="h-4 w-4" /> Sửa thông tin
          </button>
          <button onClick={() => { setShowBalance(true); setBalanceForm(''); }} className="flex items-center gap-2 rounded-xl bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
            <Wallet className="h-4 w-4" /> Cộng/Trừ tiền
          </button>
          <button onClick={() => { setShowPassword(true); setPasswordForm(''); setPasswordConfirm(''); }} className="flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">
            <Key className="h-4 w-4" /> Đổi mật khẩu
          </button>
          <button onClick={handleToggleActive} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${user.isActive ? 'bg-destructive hover:opacity-90' : 'bg-success hover:opacity-90'}`}>
            {user.isActive ? <><Lock className="h-4 w-4" /> Khóa</> : <><Unlock className="h-4 w-4" /> Mở khóa</>}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Thông tin cá nhân */}
        <div className="rounded-2xl border border-divider bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10"><Mail className="h-4 w-4 text-[var(--primary)]" /></div>
            <h2 className="text-lg font-bold text-main">Thông tin cá nhân</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <InfoCard icon={Mail} label="Email" value={user.email} />
            <InfoCard icon={Phone} label="Số điện thoại" value={user.phone || 'Chưa cập nhật'} />
            <InfoCard icon={Shield} label="Vai trò" value={roleLabels[user.role] || user.role} />
            <InfoCard icon={Wallet} label="Số dư" value={`${user.balance.toLocaleString('vi-VN')}đ`} highlight />
            <InfoCard icon={Clock} label="Online cuối" value={user.lastSeen ? new Date(user.lastSeen).toLocaleString('vi-VN') : 'Chưa có dữ liệu'} />
            <InfoCard icon={Calendar} label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString('vi-VN')} />
            <InfoCard icon={Calendar} label="Cập nhật" value={new Date(user.updatedAt).toLocaleDateString('vi-VN')} />
            <InfoCard icon={CheckCircle} label="Trạng thái" value={user.isActive ? 'Đang hoạt động' : 'Đã khóa'} />
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Thống kê</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard icon={ShoppingCart} label="Đơn hàng" value={user._count.orders} color="text-purple-500" />
            <StatCard icon={DollarSign} label="Giao dịch" value={user._count.transactions} color="text-[var(--success)]" />
            <StatCard icon={Key} label="Lượt tải" value={user._count.downloads} color="text-purple-500" />
            <StatCard icon={Star} label="Đánh giá" value={user._count.reviews} color="text-[var(--warning)]" />
            <StatCard icon={MessageSquare} label="Ticket" value={user._count.supportTickets} color="text-rose-500" />
          </div>
        </div>

        {/* Đơn hàng */}
        <div className="rounded-2xl border border-divider bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-bold text-main">Đơn hàng ({user.orders.length})</h2>
          </div>
          {user.orders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted"><ShoppingCart className="h-10 w-10 opacity-30 mb-2" /><p className="text-sm">Chưa có đơn hàng</p></div>
          ) : (
            <div className="space-y-2">
              {user.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-xl p-4 transition" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-main font-mono">#{order.orderNumber}</p>
                    <p className="text-xs text-muted truncate">{new Date(order.createdAt).toLocaleDateString('vi-VN')} - {order.items.map(i => i.product.name).join(', ')}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-bold text-main">{order.finalAmount.toLocaleString('vi-VN')}đ</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusColors[order.status] || ''}`}>{statusLabels[order.status] || order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Giao dịch */}
        <div className="rounded-2xl border border-divider bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-[var(--success)]" />
            <h2 className="text-lg font-bold text-main">Giao dịch ({user.transactions.length})</h2>
          </div>
          {user.transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted"><DollarSign className="h-10 w-10 opacity-30 mb-2" /><p className="text-sm">Chưa có giao dịch</p></div>
          ) : (
            <div className="space-y-2">
              {user.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl p-3 transition" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${tx.status === 'SUCCESS' ? 'bg-success/10' : tx.status === 'FAILED' ? 'bg-destructive/10' : 'bg-[var(--warning)]/10'}`}>
                      {tx.status === 'SUCCESS' ? <CheckCircle className="h-4 w-4 text-[var(--success)]" /> : tx.status === 'FAILED' ? <XCircle className="h-4 w-4 text-[var(--danger)]" /> : <Clock className="h-4 w-4 text-[var(--warning)]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-main truncate">
                        <span className={`font-medium ${txTypeColors[tx.type] || ''}`}>{txTypeLabels[tx.type] || tx.type}</span>
                        {tx.description && <span className="text-muted"> - {tx.description}</span>}
                      </p>
                      <p className="text-xs text-muted">{new Date(tx.createdAt).toLocaleDateString('vi-VN')} {new Date(tx.createdAt).toLocaleTimeString('vi-VN')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ml-3 ${tx.amount > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lịch sử tải */}
        {user.downloads.length > 0 && (
          <div className="rounded-2xl border border-divider bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-[var(--primary)]" />
              <h2 className="text-lg font-bold text-main">Lịch sử tải ({user.downloads.length})</h2>
            </div>
            <div className="space-y-2">
              {user.downloads.map((dl) => (
                <div key={dl.id} className="flex items-center justify-between rounded-xl p-3" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div>
                    <p className="text-sm text-main">Đơn #{dl.order.orderNumber}</p>
                    <p className="text-xs text-muted">{new Date(dl.createdAt).toLocaleDateString('vi-VN')} · {dl.downloadCount} lượt tải</p>
                  </div>
                  {dl.productKey && <code className="text-xs font-mono text-muted px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-hover)' }}>{dl.productKey}</code>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Logs */}
        {user.auditLogs.length > 0 && (
          <div className="rounded-2xl border border-divider bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted" />
              <h2 className="text-lg font-bold text-main">Nhật ký hoạt động ({user.auditLogs.length})</h2>
            </div>
            <div className="space-y-1">
              {user.auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg p-2.5 text-xs" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-[var(--primary)] flex-shrink-0">{log.action}</span>
                    {log.details && <span className="text-muted truncate">{log.details}</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    {log.ipAddress && <span className="text-muted font-mono">{log.ipAddress}</span>}
                    <span className="text-muted">{new Date(log.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Sửa thông tin */}
      {showEdit && (
        <Modal onClose={() => setShowEdit(false)} title="Sửa thông tin người dùng">
          <div className="space-y-4">
            <Field label="Tên"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }} /></Field>
            <Field label="Email"><input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }} /></Field>
            <Field label="Số điện thoại"><input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }} /></Field>
            <Field label="Vai trò">
              <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }}>
                <option value="CUSTOMER">Khách hàng</option><option value="STAFF">Nhân viên</option><option value="ADMIN">Quản trị viên</option>
              </select>
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEdit(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>Hủy</button>
              <button onClick={handleEdit} disabled={editLoading} className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {editLoading ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Đang lưu...</> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Cộng/Trừ tiền */}
      {showBalance && (
        <Modal onClose={() => setShowBalance(false)} title="Cộng/Trừ số dư">
          <div className="space-y-4">
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <span className="text-muted">Số dư hiện tại: </span>
              <span className="font-bold text-[var(--success)]">{user.balance.toLocaleString('vi-VN')}đ</span>
            </div>
            <Field label="Số tiền (dương = cộng, âm = trừ)">
              <input type="number" value={balanceForm} onChange={e => setBalanceForm(e.target.value)} placeholder="VD: 50000 hoặc -20000" className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }} />
            </Field>
            <div className="flex gap-2">
              <button onClick={() => setBalanceForm('50000')} className="flex-1 rounded-lg px-3 py-2 text-xs text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>+50,000đ</button>
              <button onClick={() => setBalanceForm('100000')} className="flex-1 rounded-lg px-3 py-2 text-xs text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>+100,000đ</button>
              <button onClick={() => setBalanceForm('-50000')} className="flex-1 rounded-lg px-3 py-2 text-xs text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>-50,000đ</button>
              <button onClick={() => setBalanceForm('-100000')} className="flex-1 rounded-lg px-3 py-2 text-xs text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>-100,000đ</button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowBalance(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>Hủy</button>
              <button onClick={handleBalance} disabled={editLoading || !balanceForm} className="flex-1 rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {editLoading ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Đang xử lý...</> : 'Xác nhận'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Đổi mật khẩu */}
      {showPassword && (
        <Modal onClose={() => setShowPassword(false)} title="Đổi mật khẩu">
          <div className="space-y-4">
            <Field label="Mật khẩu mới">
              <input type="password" value={passwordForm} onChange={e => setPasswordForm(e.target.value)} placeholder="Ít nhất 6 ký tự" className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }} />
            </Field>
            <Field label="Xác nhận mật khẩu">
              <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" className="w-full rounded-lg px-3 py-2.5 text-sm text-main focus:outline-none focus:ring-1 ring-[var(--primary)]" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-divider)' }} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowPassword(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition" style={{ backgroundColor: 'var(--bg-hover)' }}>Hủy</button>
              <button onClick={handlePassword} disabled={editLoading || !passwordForm || !passwordConfirm} className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {editLoading ? <><Loader2 className="inline h-4 w-4 animate-spin" /> Đang xử lý...</> : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10 flex-shrink-0"><Icon className="h-4 w-4 text-[var(--primary)]" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className={`text-sm font-medium truncate ${highlight ? 'text-[var(--success)] font-bold' : 'text-main'}`}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-hover)' }}>
      <Icon className={`h-5 w-5 ${color}`} />
      <div>
        <p className="text-lg font-bold text-main">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-divider bg-card shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-main">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-main transition"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}
