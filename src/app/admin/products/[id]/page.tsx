'use client';
import { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/ui/ImageUpload';
import StickyActionBar from '@/components/ui/StickyActionBar';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Category { id: string; name: string; slug: string }

interface ProductData {
  id: string; name: string; slug: string; price: number; salePrice: number | null;
  stock: number; status: string; type: string; description: string | null;
  shortDesc: string | null; guide: string | null; sku: string | null;
  images: string; categoryId: string | null; availableKeys: number; soldKeys: number; keyCount: number;
}

const typeOptions = [
  { value: 'SOFTWARE_KEY', label: 'Key bản quyền' },
  { value: 'DIGITAL_ACCOUNT', label: 'Tài khoản số' },
  { value: 'SOFTWARE_TOOL', label: 'Phần mềm' },
  { value: 'LICENSE_KEY', label: 'License Key' },
  { value: 'SUBSCRIPTION', label: 'Gói đăng ký' },
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [productId, setProductId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', guide: '', shortDesc: '',
    price: '', salePrice: '', stock: '', sku: '',
    type: 'SOFTWARE_KEY', categoryId: '', images: '', status: 'ACTIVE',
  });

  useEffect(() => {
    startTransition(async () => {
      const { id } = await params;
      setProductId(id);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch('/api/admin/categories?all=true'),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        if (prodRes.ok && prodData.product) {
          const p = prodData.product;
          setFormData({
            name: p.name || '',
            slug: p.slug || '',
            description: p.description || '',
            guide: p.guide || '',
            shortDesc: p.shortDesc || '',
            price: p.price?.toString() || '',
            salePrice: p.salePrice?.toString() || '',
            stock: p.availableKeys?.toString() || '0',
            sku: p.sku || '',
            type: p.type || 'SOFTWARE_KEY',
            categoryId: p.categoryId || '',
            images: p.images || '',
            status: p.status || 'ACTIVE',
          });
        }
        if (catRes.ok) setCategories(catData.categories || []);
      } catch {
        setError('Không thể tải dữ liệu sản phẩm');
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      setError('Tên và giá là bắt buộc');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
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

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/products');
      else { const d = await res.json(); setError(d.error); }
    } catch {
      setError('Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-divider text-muted hover:text-main transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold gradient-heading">Sửa sản phẩm</h1>
            <p className="mt-1 text-sm text-muted">{formData.name}</p>
          </div>
        </div>
        <button onClick={handleDelete} className="flex items-center gap-2 rounded-xl border border-[var(--danger)]/30 px-4 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition">
          <Trash2 className="h-4 w-4" />
          Xóa sản phẩm
        </button>
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
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Đường dẫn</label>
              <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main font-mono focus:border-[var(--primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Mã SKU</label>
              <input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Giá *</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Giá khuyến mãi</label>
              <input type="number" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Loại</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
                {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Danh mục</label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Trạng thái</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
                <option value="ACTIVE">Hiển thị</option>
                <option value="DRAFT">Nháp</option>
                <option value="HIDDEN">Ẩn</option>
                <option value="OUT_OF_STOCK">Hết hàng</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Hình ảnh</h2>
          <ImageUpload value={formData.images} onChange={(url) => setFormData({ ...formData, images: url })} />
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Mô tả & Hướng dẫn</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Mô tả ngắn</label>
              <input value={formData.shortDesc} onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                className="w-full rounded-xl bg-main border border-divider px-4 py-2.5 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Mô tả chi tiết</label>
              <RichTextEditor
                value={formData.description}
                onChange={(val) => setFormData({ ...formData, description: val })}
                placeholder="Nhập mô tả chi tiết sản phẩm..."
                minHeight="250px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Hướng dẫn</label>
              <RichTextEditor
                value={formData.guide}
                onChange={(val) => setFormData({ ...formData, guide: val })}
                placeholder="Nhập hướng dẫn sử dụng..."
                minHeight="200px"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-bold text-main mb-4">Tồn kho (tự động)</h2>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Số lượng Key khả dụng</label>
            <input type="number" value={formData.stock} readOnly
              className="w-full rounded-xl bg-hover border border-divider px-4 py-2.5 text-sm text-muted cursor-not-allowed" />
            <p className="mt-1 text-xs text-muted">Tự động đếm từ số key đang ở trạng thái AVAILABLE trong kho.</p>
          </div>
        </div>
      </div>

      <StickyActionBar onSave={handleSubmit} onCancel={() => router.push('/admin/products')} saving={saving} />
    </div>
  );
}
