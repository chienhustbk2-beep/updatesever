'use client';
import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Category { id: string; name: string }

interface AdminProductFormProps {
  categories: Category[]
}

export default function AdminProductForm({ categories }: AdminProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [description, setDescription] = useState('');
  const [guide, setGuide] = useState('');
  const [bulkDiscounts, setBulkDiscounts] = useState<{ minQty: string; discount: string }[]>([]);
  const addBulkDiscount = () => { setBulkDiscounts([...bulkDiscounts, { minQty: '', discount: '' }]) };
  const removeBulkDiscount = (index: number) => setBulkDiscounts(bulkDiscounts.filter((_, i) => i !== index));
  const updateBulkDiscount = (index: number, field: 'minQty' | 'discount', value: string) => {
    const updated = [...bulkDiscounts];
    updated[index][field] = value;
    setBulkDiscounts(updated);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description,
      guide,
      price: parseFloat(formData.get('price') as string),
      salePrice: formData.get('salePrice') ? parseFloat(formData.get('salePrice') as string) : null,
      stock: parseInt(formData.get('stock') as string),
      sku: formData.get('sku') as string,
      type: formData.get('type') as string,
      categoryId: formData.get('categoryId') as string,
      images: formData.get('images') as string,
      bulkDiscounts: bulkDiscounts
        .filter(d => d.minQty && d.discount)
        .map(d => ({ minQty: parseInt(d.minQty), discount: parseFloat(d.discount) })),
    };
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', text: result.error || 'Tạo sản phẩm thất bại' });
        return;
      }
      setMessage({ type: 'success', text: 'Tạo sản phẩm thành công!' });
      (e.target as HTMLFormElement).reset();
      setDescription('');
      setGuide('');
    } catch {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-divider bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-main">Thêm sản phẩm mới</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted">Tên sản phẩm *</label>
          <input name="name" required
            className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted">Slug *</label>
          <input name="slug" required placeholder="ten-san-pham"
            className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted">Giá *</label>
            <input name="price" type="number" required min="0"
              className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted">Giá khuyến mãi</label>
            <input name="salePrice" type="number" min="0"
              className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted">Số lượng (stock)</label>
            <input name="stock" type="number" defaultValue="0"
              className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted">SKU</label>
            <input name="sku"
              className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted">Loại sản phẩm</label>
          <select name="type"
            className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
            <option value="SOFTWARE_KEY">Key bản quyền</option>
            <option value="DIGITAL_ACCOUNT">Tài khoản số</option>
            <option value="SOFTWARE_TOOL">Phần mềm & Tool</option>
            <option value="LICENSE_KEY">License Key</option>
            <option value="SUBSCRIPTION">Gói đăng ký</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted">Danh mục</label>
          <select name="categoryId"
            className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary">
            <option value="">-- Không chọn --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted">URL hình ảnh</label>
          <input name="images"
            className="mt-1 w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          <p className="mt-1 text-xs text-muted">Up ảnh lên <a href="https://freeimage.host/" target="_blank" className="text-[var(--primary)] underline">freeimage.host</a> → copy Direct Link → dán vào đây</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Mô tả</label>
          <RichTextEditor value={description} onChange={setDescription} placeholder="Nhập mô tả sản phẩm..." minHeight="200px" />
        </div>
        <div className="rounded-lg border border-divider bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-main">Khuyến mãi theo số lượng</h3>
            <button type="button" onClick={addBulkDiscount} className="flex items-center gap-1 text-xs font-medium text-primary">
              <Plus className="h-3 w-3" /> Thêm mức
            </button>
          </div>
          <div className="space-y-2">
            {bulkDiscounts.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="number" min="1" value={d.minQty} onChange={(e) => updateBulkDiscount(i, 'minQty', e.target.value)}
                  placeholder="Số lượng tối thiểu"
                  className="w-32 rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                <span className="text-xs text-muted">giảm</span>
                <input type="number" min="0" max="100" value={d.discount} onChange={(e) => updateBulkDiscount(i, 'discount', e.target.value)}
                  placeholder="%"
                  className="w-20 rounded-lg border border-divider bg-main px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                <span className="text-xs text-muted">%</span>
                <button type="button" onClick={() => removeBulkDiscount(i)} className="p-1 text-danger hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {bulkDiscounts.length === 0 && <p className="text-xs text-muted">Chưa có khuyến mãi theo số lượng</p>}
          </div>
        </div>
        <div className="rounded-lg border border-divider bg-card p-4">
          <h3 className="text-sm font-semibold text-main mb-3">Hướng dẫn sử dụng</h3>
          <RichTextEditor value={guide} onChange={setGuide} placeholder="Nhập hướng dẫn sử dụng..." minHeight="200px" />
        </div>
        {message && (
          <div className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'}`}>
            {message.text}
          </div>
        )}
        <button type="submit" disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-70">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...</> : 'Tạo sản phẩm'}
        </button>
      </form>
    </div>
  );
}
