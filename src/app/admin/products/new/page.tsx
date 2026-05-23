'use client';
import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/ui/ImageUpload';
import StickyActionBar from '@/components/ui/StickyActionBar';

interface Category { id: string; name: string; slug: string }

const typeOptions = [
  { value: 'SOFTWARE_KEY', label: 'Key bản quyền' },
  { value: 'DIGITAL_ACCOUNT', label: 'Tài khoản số' },
  { value: 'SOFTWARE_TOOL', label: 'Phần mềm' },
  { value: 'LICENSE_KEY', label: 'License Key' },
  { value: 'SUBSCRIPTION', label: 'Gói đăng ký' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', guide: '', shortDesc: '',
    price: '', salePrice: '', stock: '0', sku: '',
    type: 'SOFTWARE_KEY', categoryId: '', images: '', status: 'ACTIVE',
  });

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/categories?all=true');
        const data = await res.json();
        if (res.ok) setCategories(data.categories || []);
      } catch {}
    });
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug || !formData.price) {
      setError('Tên, slug và giá là bắt buộc');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/admin/products');
      } else {
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main pb-24">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/admin/products"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-divider text-muted hover:text-main transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold gradient-heading">Thêm sản phẩm mới</h1>
          <p className="mt-1 text-sm text-muted">Tạo sản phẩm phần mềm / key bản quyền mới</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl p-4 bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20">{error}</div>
      )}

      <div className="space-y-6">
        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-muted mb-1">Tên sản phẩm *</label>
              <input
                value={formData.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData({ ...formData, name: v, slug: generateSlug(v) });
                }}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                placeholder="VD: Windows 11 Pro License Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Slug *</label>
              <input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main font-mono focus:border-[var(--primary)] focus:outline-none"
                placeholder="windows-11-pro-key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Mã SKU</label>
              <input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                placeholder="WIN11PRO-OEM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Giá *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                placeholder="99000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Giá khuyến mãi</label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                placeholder="79000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Phân loại</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
              >
                {typeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Danh mục</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="ACTIVE">Hiển thị</option>
                <option value="DRAFT">Nháp</option>
                <option value="HIDDEN">Ẩn</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Hình ảnh</h2>
          <ImageUpload
            value={formData.images}
            onChange={(url) => setFormData({ ...formData, images: url })}
            label="Ảnh sản phẩm"
          />
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Mô tả & Hướng dẫn</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Mô tả ngắn</label>
              <input
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
                placeholder="Mô tả ngắn gọn về sản phẩm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Mô tả chi tiết</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={8}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none font-mono"
                placeholder="Nhập mô tả chi tiết sản phẩm... (hỗ trợ HTML)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Hướng dẫn sử dụng</label>
              <textarea
                value={formData.guide}
                onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
                rows={5}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none font-mono"
                placeholder="Hướng dẫn kích hoạt, cài đặt..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Tồn kho</h2>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Số lượng tồn kho</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none"
              placeholder="0"
            />
            <p className="mt-1 text-xs text-muted">Số lượng key khả dụng trong kho. Sẽ được tự động đếm sau khi nhập key.</p>
          </div>
        </div>
      </div>

      <StickyActionBar onSave={handleSubmit} onCancel={() => router.push('/admin/products')} saving={saving} />
    </div>
  );
}
