'use client'
import { useState, useEffect, startTransition } from 'react'
import { Eye, EyeOff, GripVertical, Plus, Save, Trash2, Edit2, X, Check, Layout, Gift } from 'lucide-react'
import AdminPromotionModal from '@/components/admin/AdminPromotionModal'

interface UIElement {
  id: string
  name: string
  key: string
  section: string
  isVisible: boolean
  sortOrder: number
  position: string
  customText: string | null
  customColor: string | null
}

const DEFAULT_ELEMENTS = [
  { name: 'Hero Banner', key: 'hero_banner', section: 'homepage', position: 'top' },
  { name: 'Features Section', key: 'features_section', section: 'homepage', position: 'middle' },
  { name: 'Products Section', key: 'products_section', section: 'homepage', position: 'middle' },
  { name: 'Why Choose Us', key: 'why_choose_us', section: 'homepage', position: 'middle' },
  { name: 'CTA - Sẵn sàng trải nghiệm', key: 'trust_badges', section: 'homepage', position: 'bottom' },
  { name: 'Header Logo', key: 'header_logo', section: 'header', position: 'left' },
  { name: 'Header Search', key: 'header_search', section: 'header', position: 'center' },
  { name: 'Header Cart', key: 'header_cart', section: 'header', position: 'right' },
  { name: 'Header User Menu', key: 'header_user', section: 'header', position: 'right' },
  { name: 'Header Deposit', key: 'header_deposit', section: 'header', position: 'right' },
  { name: 'Header Theme Toggle', key: 'header_theme', section: 'header', position: 'right' },
  { name: 'Footer', key: 'footer', section: 'footer', position: 'bottom' },
  { name: 'Product Reviews', key: 'product_reviews', section: 'product', position: 'bottom' },
  { name: 'Related Products', key: 'related_products', section: 'product', position: 'bottom' },
  { name: 'Dashboard Balance', key: 'dashboard_balance', section: 'dashboard', position: 'top' },
  { name: 'Dashboard Orders', key: 'dashboard_orders', section: 'dashboard', position: 'middle' },
  { name: 'Dashboard Keys', key: 'dashboard_keys', section: 'dashboard', position: 'bottom' },
]

const sectionLabels: Record<string, string> = {
  homepage: 'Trang chủ',
  header: 'Header',
  footer: 'Footer',
  product: 'Trang sản phẩm',
  dashboard: 'Dashboard khách hàng',
  cart: 'Giỏ hàng',
  deposit: 'Nạp tiền',
}

function EditForm({
  element,
  onSave,
  onCancel,
}: {
  element: UIElement
  onSave: (el: UIElement) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<UIElement>({ ...element })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Tên</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg bg-main border border-divider px-3 py-1.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Vị trí</label>
          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full rounded-lg bg-main border border-divider px-3 py-1.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="default">Mặc định</option>
            <option value="top">Trên</option>
            <option value="bottom">Dưới</option>
            <option value="left">Trái</option>
            <option value="right">Phải</option>
            <option value="center">Giữa</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Text tùy chỉnh</label>
        <input
          value={form.customText || ''}
          onChange={(e) => setForm({ ...form, customText: e.target.value })}
          className="w-full rounded-lg bg-main border border-divider px-3 py-1.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
          placeholder="Để trống nếu không dùng"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Màu tùy chỉnh</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={form.customColor || '#8b5cf6'}
            onChange={(e) => setForm({ ...form, customColor: e.target.value })}
            className="h-9 w-12 rounded-lg bg-main border border-divider cursor-pointer"
          />
          <input
            value={form.customColor || ''}
            onChange={(e) => setForm({ ...form, customColor: e.target.value })}
            className="flex-1 rounded-lg bg-main border border-divider px-3 py-1.5 text-sm text-main font-mono focus:border-[var(--primary)] focus:outline-none"
            placeholder="#8b5cf6"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-content transition hover:bg-primary"
        >
          <Check className="h-3 w-3" />
          Lưu
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-hover"
        >
          Hủy
        </button>
      </div>
    </div>
  )
}

export default function AdminUICustomizationPage() {
  const [elements, setElements] = useState<UIElement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('all')
  const [editingElement, setEditingElement] = useState<UIElement | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [newElement, setNewElement] = useState({ name: '', key: '', section: 'homepage', position: 'default' })

  useEffect(() => {
    startTransition(() => {
      fetchElements()
    })
  }, [])

  const fetchElements = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const res = await fetch('/api/admin/ui-elements', { signal: controller.signal })
      clearTimeout(timeoutId)
      const data = await res.json()
      if (res.ok) {
        setElements(data.elements || [])
      }
    } catch (err) {
      console.error('Failed to fetch UI elements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (element: UIElement) => {
    try {
      const res = await fetch(`/api/admin/ui-elements/${element.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !element.isVisible }),
      })
      if (res.ok) fetchElements()
    } catch (err) {
      console.error('Failed to toggle visibility:', err)
    }
  }

  const handleSaveElement = async (element: UIElement) => {
    try {
      const res = await fetch(`/api/admin/ui-elements/${element.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: element.name,
          customText: element.customText,
          customColor: element.customColor,
          position: element.position,
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã lưu!' })
        fetchElements()
        setEditingElement(null)
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDeleteElement = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa element này?')) return
    try {
      const res = await fetch(`/api/admin/ui-elements/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã xóa!' })
        fetchElements()
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleAddElement = async () => {
    if (!newElement.name || !newElement.key) {
      setMessage({ type: 'error', text: 'Tên và key là bắt buộc' })
      return
    }
    try {
      const res = await fetch('/api/admin/ui-elements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newElement),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã thêm element mới!' })
        setShowAddForm(false)
        setNewElement({ name: '', key: '', section: 'homepage', position: 'default' })
        fetchElements()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleInitDefaults = async () => {
    if (!confirm('Lưu các giá trị hiện tại làm mặc định và cập nhật element?')) return
    try {
      const curRes = await fetch('/api/admin/ui-elements')
      const curData = await curRes.json()
      const curElems: UIElement[] = curData.elements || []
      for (const def of DEFAULT_ELEMENTS) {
        const existing = curElems.find((e) => e.key === def.key)
        if (existing) {
          await fetch(`/api/admin/ui-elements/${existing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: def.name, position: def.position, section: def.section }),
          })
        } else {
          await fetch('/api/admin/ui-elements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...def, isVisible: true, sortOrder: 0 }),
          })
        }
      }
      setMessage({ type: 'success', text: 'Đã cập nhật toàn bộ element mặc định!' })
      fetchElements()
    } catch (err) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const sections = ['all', ...new Set(elements.map((e) => e.section))]
  const filteredElements = activeSection === 'all' ? elements : elements.filter((e) => e.section === activeSection)
  const groupedElements = filteredElements.reduce((acc, el) => {
    if (!acc[el.section]) acc[el.section] = []
    acc[el.section].push(el)
    return acc
  }, {} as Record<string, UIElement[]>)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold gradient-heading">Tùy chỉnh Giao diện</h1>
          <p className="mt-2 text-sm text-muted">Quản lý hiển thị, vị trí và nội dung các thành phần giao diện</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleInitDefaults}
            className="flex items-center gap-2 rounded-xl bg-card border border-divider px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-hover"
          >
            <Layout className="h-4 w-4" />
            Khôi phục mặc định
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content shadow-lg transition hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            Thêm element
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 ${
            message.type === 'success'
              ? 'bg-success/10 text-success border border-[var(--success)]/20'
              : 'bg-destructive/10 text-destructive border border-[var(--danger)]/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeSection === section ? 'bg-primary text-primary-content' : 'bg-card text-muted hover:text-main'
            }`}
          >
            {section === 'all' ? 'Tất cả' : sectionLabels[section] || section}
          </button>
        ))}
      </div>

      {Object.entries(groupedElements).length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted">
          <Layout className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">Chưa có element nào</p>
          <p className="text-sm mt-1">Nhấn &quot;Khôi phục mặc định&quot; để tạo các element cơ bản</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedElements).map(([section, sectionElements]) => (
            <div key={section} className="rounded-2xl border border-divider bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-divider bg-card">
                <h3 className="text-sm font-semibold text-primary">
                  {sectionLabels[section] || section} ({sectionElements.length})
                </h3>
              </div>
              <div className="divide-y divide-color">
                {sectionElements.map((element) => (
                  <div key={element.id} className="p-4 hover:bg-hover transition">
                    {editingElement?.id === element.id ? (
                      <EditForm
                        element={editingElement}
                        onSave={handleSaveElement}
                        onCancel={() => setEditingElement(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-main">{element.name}</p>
                            <p className="text-xs text-muted font-mono">{element.key}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              element.position === 'top'
                                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                : element.position === 'bottom'
                                  ? 'bg-orange-100 text-amber-600'
                                  : element.position === 'left'
                                    ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                    : element.position === 'right'
                                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                      : 'bg-hover text-muted'
                            }`}
                          >
                            {element.position}
                          </span>
                          {element.customText && (
                            <span className="text-xs text-muted truncate max-w-[150px]">
                              &quot;{element.customText}&quot;
                            </span>
                          )}
                          <button
                            onClick={() => setEditingElement(element)}
                            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-hover transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleVisibility(element)}
                            className={`p-1.5 rounded-lg transition ${
                              element.isVisible
                                ? 'text-success hover:bg-success/10'
                                : 'text-muted hover:bg-hover'
                            }`}
                          >
                            {element.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteElement(element.id)}
                            className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-divider bg-card shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-main">Thêm UI Element</h2>
              <button onClick={() => setShowAddForm(false)} className="text-muted hover:text-main">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Tên hiển thị</label>
                <input
                  value={newElement.name}
                  onChange={(e) => setNewElement({ ...newElement, name: e.target.value })}
                  className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                  placeholder="VD: Hero Banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Key (duy nhất)</label>
                <input
                  value={newElement.key}
                  onChange={(e) => setNewElement({ ...newElement, key: e.target.value })}
                  className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main font-mono focus:border-[var(--primary)] focus:outline-none"
                  placeholder="VD: hero_banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Section</label>
                <select
                  value={newElement.section}
                  onChange={(e) => setNewElement({ ...newElement, section: e.target.value })}
                  className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                >
                  {Object.entries(sectionLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Vị trí</label>
                <select
                  value={newElement.position}
                  onChange={(e) => setNewElement({ ...newElement, position: e.target.value })}
                  className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="default">Mặc định</option>
                  <option value="top">Trên cùng</option>
                  <option value="bottom">Dưới cùng</option>
                  <option value="left">Bên trái</option>
                  <option value="right">Bên phải</option>
                  <option value="center">Giữa</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-muted transition hover:bg-hover"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddElement}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content transition hover:bg-primary"
                >
                  <Plus className="inline h-4 w-4 mr-1" />
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-divider bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-main">Quản lý Khuyến Mãi</h2>
              <p className="text-xs text-muted">Xem và quản lý các chương trình khuyến mãi, mã giảm giá</p>
            </div>
          </div>
          <button
            onClick={() => setShowPromoModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
          >
            <Gift className="h-4 w-4" />
            Xem khuyến mãi
          </button>
        </div>
      </div>

      {showPromoModal && <AdminPromotionModal onClose={() => setShowPromoModal(false)} />}
    </div>
  )
}
