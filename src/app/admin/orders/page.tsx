'use client';import { useState, useEffect, startTransition } from 'react';import { Search, Eye, X, Check, Loader2, AlertCircle, Mail, Phone, Calendar, DollarSign } from 'lucide-react';
interface Order { id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string | null; totalAmount: number; discountAmount: number; finalAmount: number; status: string; paymentMethod: string; paymentStatus: string; transactionCode: string | null; note: string | null; createdAt: string; updatedAt: string; user?: { id: string; name: string | null; email: string }; items: { id: string; quantity: number; price: number; total: number; product: { id: string; name: string } }[]; productKeys?: { id: string; keyValue: string; status: string }[] }
interface OrderDetail extends Order { user: { id: string; name: string | null; email: string; balance: number }; productKeys: { id: string; keyValue: string; status: string; orderId: string | null; note: string | null; soldAt: string | null; product: { id: string; name: string } }[]; downloads: { id: string; productKey: string | null; downloadUrl: string | null; expiresAt: string | null; downloadCount: number; createdAt: string }[] }
const statusLabels: Record<string, string> = { PENDING: 'Chờ xử lý', PROCESSING: 'Đang xử lý', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền' }
const statusColors: Record<string, string> = { PENDING: 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20', PROCESSING: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20', COMPLETED: 'bg-success/10 text-[var(--success)] border-[var(--success)]/20', CANCELLED: 'bg-destructive/10 text-[var(--danger)] border-[var(--danger)]/20', REFUNDED: 'bg-hover text-muted border-divider' }
const paymentMethodLabels: Record<string, string> = { BANK_TRANSFER: 'Chuyển khoản', BALANCE: 'Số dư ví', MANUAL: 'Thủ công' }

function OrderDetailModal({ order, onClose, onUpdateStatus, onRefresh }: { order: OrderDetail; onClose: () => void; onUpdateStatus: (orderId: string, status: string) => void; onRefresh: () => void }) {
  const [newStatus, setNewStatus] = useState(order.status);
  const statusOptions = Object.entries(statusLabels).filter(([k]) => k !== 'CANCELLED' && k !== 'REFUNDED');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-divider bg-card shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <div><h2 className="text-xl font-bold text-main">Chi tiết đơn hàng</h2><p className="text-sm text-[var(--primary)] font-mono">{order.orderNumber}</p></div>
          <button onClick={onClose} className="text-muted hover:text-main"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl bg-card border border-divider p-4">
            <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Thông tin khách hàng</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Email</p><p className="text-sm text-main">{order.customerEmail}</p></div></div>
              {order.customerPhone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Điện thoại</p><p className="text-sm text-main">{order.customerPhone}</p></div></div>}
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted" /><div><p className="text-xs text-muted">Ngày đặt</p><p className="text-sm text-main">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p></div></div>
            </div>
          </div>
          <div className="rounded-xl bg-card border border-divider p-4">
            <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Sản phẩm</h3>
            <div className="space-y-2">{order.items.map((item) => <div key={item.id} className="flex items-center justify-between text-sm"><span className="text-main">{item.product.name} x{item.quantity}</span><span className="text-muted">{item.total.toLocaleString('vi-VN')}đ</span></div>)}</div>
            <div className="mt-3 flex items-center justify-between border-t border-divider pt-3"><span className="text-sm text-muted">Tạm tính</span><span className="text-sm text-main">{order.totalAmount.toLocaleString('vi-VN')}đ</span></div>
            {order.discountAmount > 0 && <div className="flex items-center justify-between"><span className="text-sm text-muted">Giảm giá</span><span className="text-sm text-[var(--success)]">-{order.discountAmount.toLocaleString('vi-VN')}đ</span></div>}
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-main">Thành tiền</span><span className="text-lg font-bold text-[var(--primary)]">{order.finalAmount.toLocaleString('vi-VN')}đ</span></div>
          </div>
          {order.productKeys.length > 0 && (
            <div className="rounded-xl bg-card border border-divider p-4">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Key da cap ({order.productKeys.length})</h3>
              <div className="space-y-2">{order.productKeys.map((k) => <div key={k.id} className="flex items-center justify-between rounded-lg bg-hover/50 px-3 py-2"><span className="text-sm font-mono text-main">{k.keyValue}</span><span className={`text-xs font-medium ${k.status === 'SOLD' ? 'text-[var(--success)]' : 'text-muted'}`}>{k.status === 'SOLD' ? 'Đã bán' : k.status}</span></div>)}</div>
            </div>
          )}
          {order.note && (
            <div className="rounded-xl bg-card border border-divider p-4">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Ghi chú</h3>
              <p className="text-sm text-main">{order.note}</p>
            </div>
          )}
          <div className="rounded-xl bg-card border border-divider p-4">
            <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Cập nhật trạng thái</h3>
            <div className="flex items-center gap-3">
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
                {statusOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={() => { if (newStatus !== order.status) { onUpdateStatus(order.id, newStatus) } }} disabled={newStatus === order.status} className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary)]/90 transition disabled:opacity-50">Lưu</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => { try { const res = await fetch('/api/admin/orders');const data = await res.json();if (res.ok) setOrders(data.orders || []) } catch (err) { console.error('Failed to fetch orders:', err) } finally { setLoading(false) } };

  useEffect(() => { startTransition(() => { fetchOrders() }) }, []);

  const fetchOrderDetail = async (orderId: string) => { try { const res = await fetch(`/api/admin/orders/${orderId}`);const data = await res.json();if (res.ok) { setSelectedOrder(data.order);setShowDetail(true) } } catch (err) { console.error('Failed to fetch order detail:', err) } };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => { try { const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });const data = await res.json();if (res.ok) { setMessage({ type: 'success', text: 'Cập nhật trạng thái thành công!' });fetchOrders();if (selectedOrder?.id === orderId) { fetchOrderDetail(orderId) } } else { setMessage({ type: 'error', text: data.error }) } } catch { setMessage({ type: 'error', text: 'Có lỗi xảy ra' }) };setTimeout(() => setMessage(null), 3000) };
  const handleCancelOrder = async (orderId: string) => { try { const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }) });const data = await res.json();if (res.ok) { setMessage({ type: 'success', text: data.message });fetchOrders() } else { setMessage({ type: 'error', text: data.error }) } } catch { setMessage({ type: 'error', text: 'Có lỗi xảy ra' }) };setTimeout(() => setMessage(null), 3000) };
  const handleRefund = async (orderId: string) => { if (!window.confirm('Xác nhận hoàn tiền cho đơn hàng này?')) return; try { const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refund' }) });const data = await res.json();if (res.ok) { setMessage({ type: 'success', text: data.message });fetchOrders();if (selectedOrder?.id === orderId) { fetchOrderDetail(orderId) } } else { setMessage({ type: 'error', text: data.error }) } } catch { setMessage({ type: 'error', text: 'Có lỗi xảy ra' }) };setTimeout(() => setMessage(null), 3000) };

  const filteredOrders = orders.filter((o) => { if (search) { const s = search.toLowerCase();if (!o.orderNumber.toLowerCase().includes(s) && !o.customerName.toLowerCase().includes(s) && !o.customerEmail.toLowerCase().includes(s)) { return false } } if (statusFilter && o.status !== statusFilter) return false;if (paymentFilter && o.paymentMethod !== paymentFilter) return false;return true });

  if (loading) { return ( <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /><p className="mt-4 text-sm text-muted">Đang tải đơn hàng...</p></div></div> ) }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold gradient-heading">Quản lý Đơn hàng</h1>
        <p className="mt-2 text-sm text-muted">Tổng cộng {orders.length} đơn hàng</p>
      </div>
      {message && <div className={`mb-6 rounded-xl p-4 ${message.type === 'success' ? 'bg-success/10 text-[var(--success)] border border-[var(--success)]/20' : 'bg-destructive/10 text-[var(--danger)] border border-[var(--danger)]/20'}`}>{message.text}</div>}
      <div className="mb-6 rounded-2xl border border-divider bg-card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Tìm theo mã đơn, tên, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg bg-main border border-divider pl-10 pr-4 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />
            </div>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
            <option value="">Tất cả phương thức</option>
            {Object.entries(paymentMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="rounded-2xl border border-divider bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-hover/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Mã đơn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Khách hàng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Phương thức</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Ngày đặt</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-divider)]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center text-muted"><AlertCircle className="mb-2 h-8 w-8" /><span className="text-sm">Không tìm thấy đơn hàng nào</span></div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-hover/30 transition">
                    <td className="px-4 py-3"><span className="text-sm font-mono font-medium text-[var(--primary)]">{o.orderNumber}</span></td>
                    <td className="px-4 py-3"><div className="text-sm text-main">{o.customerName}</div><div className="text-xs text-muted">{o.customerEmail}</div></td>
                    <td className="px-4 py-3"><span className="text-sm font-semibold text-main">{o.finalAmount.toLocaleString('vi-VN')}đ</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-muted">{paymentMethodLabels[o.paymentMethod] || o.paymentMethod}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[o.status]}`}>{statusLabels[o.status] || o.status}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => fetchOrderDetail(o.id)} className="rounded-lg bg-[var(--primary)]/10 p-2 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition" title="Xem chi tiết"><Eye className="h-4 w-4" /></button>
                        {o.paymentStatus === 'PAID' && o.status !== 'REFUNDED' && (
                          <button onClick={() => handleRefund(o.id)} className="rounded-lg bg-[var(--success)]/10 p-2 text-[var(--success)] hover:bg-[var(--success)]/20 transition" title="Hoàn tiền"><DollarSign className="h-4 w-4" /></button>
                        )}
                        {(o.status === 'PENDING' || o.status === 'PROCESSING') && (
                          <button onClick={() => { if (window.confirm(`Hủy đơn hàng ${o.orderNumber}?`)) { handleCancelOrder(o.id) } }} className="rounded-lg bg-[var(--danger)]/10 p-2 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition" title="Hủy đơn"><X className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showDetail && selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setShowDetail(false)} onUpdateStatus={handleUpdateStatus} onRefresh={fetchOrders} />}
    </div>
  );
}
