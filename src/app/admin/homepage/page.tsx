'use client';import { useState, useEffect, startTransition } from 'react';import { Save, Loader2, Home, Truck, Globe, Star, Image as ImageIcon } from 'lucide-react';import ToggleSwitch from '@/components/ui/ToggleSwitch';

const TABS = [
  { id: 'cta', label: 'CTA', icon: Home },
  { id: 'trust', label: 'Thống kê', icon: Star },
  { id: 'hero', label: 'Banner', icon: ImageIcon },
];

const DEFAULT_CTA_KEYS = [
  { key: 'homepage_cta_badge', label: 'Badge (nhãn)', default: 'Kích hoạt tự động 24/7 - Nhận key ngay sau thanh toán' },
  { key: 'homepage_cta_title', label: 'Tiêu đề', default: 'Sẵn sàng trải nghiệm DigitalShop?' },
  { key: 'homepage_cta_desc', label: 'Mô tả', default: 'Hàng ngàn khách hàng đã tin tưởng sử dụng dịch vụ. Tham gia ngay để nhận ưu đãi đặc biệt dành cho thành viên mới.' },
  { key: 'homepage_cta_register', label: 'Nút "Đăng ký ngay"', default: 'Đăng ký ngay' },
  { key: 'homepage_cta_explore', label: 'Nút "Khám phá sản phẩm"', default: 'Khám phá sản phẩm' },
];

const TRUST_ITEMS = [
  { prefix: 'homepage_trust_1', label: 'Thống kê 1' },
  { prefix: 'homepage_trust_2', label: 'Thống kê 2' },
  { prefix: 'homepage_trust_3', label: 'Thống kê 3' },
  { prefix: 'homepage_trust_4', label: 'Thống kê 4' },
];

export default function AdminHomepagePage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('cta');
  const [heroSlides, setHeroSlides] = useState<Record<string, string>[]>([]);
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [trustEnabled, setTrustEnabled] = useState(true);
  const [ctaEnabled, setCtaEnabled] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings || {});
        setHeroEnabled(data.settings?.homepage_hero_enabled !== 'false');
        setTrustEnabled(data.settings?.homepage_trust_enabled !== 'false');
        setCtaEnabled(data.settings?.homepage_cta_enabled !== 'false');
        try { const s = JSON.parse(data.settings?.hero_banner_slides || '[]'); if (Array.isArray(s)) setHeroSlides(s); } catch {}
      }
    } catch (err) { console.error('Failed to fetch settings:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { startTransition(() => fetchSettings()); }, []);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...settings,
            hero_banner_slides: JSON.stringify(heroSlides),
            homepage_hero_enabled: String(heroEnabled),
            homepage_trust_enabled: String(trustEnabled),
            homepage_cta_enabled: String(ctaEnabled),
          }
        }),
      });
      const data = await res.json();
      if (res.ok) setMessage({ type: 'success', text: 'Đã lưu nội dung trang chủ!' });
      else setMessage({ type: 'error', text: data.error || 'Lỗi khi lưu' });
    } catch { setMessage({ type: 'error', text: 'Có lỗi xảy ra' }); }
    finally { setSaving(false); }
    setTimeout(() => setMessage(null), 3000);
  };

  const updateHeroSlide = (idx: number, field: string, value: string) => {
    setHeroSlides(prev => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next });
  };
  const addHeroSlide = () => {
    setHeroSlides(prev => [...prev, { id: String(Date.now()), title: '', subtitle: '', description: '', price: '', originalPrice: '', badge: '', slug: '', gradient: 'from-[var(--accent-color)] via-[var(--accent-color)] to-[var(--bg-primary)]', image: '' }]);
  };
  const removeHeroSlide = (idx: number) => {
    setHeroSlides(prev => prev.filter((_, i) => i !== idx));
  };
  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return (<div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" /><p className="mt-4 text-sm text-muted">Đang tải dữ liệu...</p></div></div>);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'cta':
        return (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10"><Home className="h-5 w-5 text-[var(--primary)]" /></div><div><h2 className="text-lg font-bold text-main">Khu vực "Sẵn sàng trải nghiệm"</h2><p className="text-xs text-muted">Nội dung chính, nút bấm của khu vực CTA</p></div></div>
              <ToggleSwitch checked={ctaEnabled} onChange={setCtaEnabled} />
            </div>
            {ctaEnabled && <div className="grid grid-cols-1 gap-4">{DEFAULT_CTA_KEYS.map((item) => (<div key={item.key}><label className="block text-sm font-medium text-muted mb-1">{item.label}</label>{item.key === 'homepage_cta_desc' ? (<textarea value={settings[item.key] || ''} onChange={(e) => updateField(item.key, e.target.value)} rows={3} placeholder={item.default} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" />) : (<input value={settings[item.key] || ''} onChange={(e) => updateField(item.key, e.target.value)} placeholder={item.default} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" />)}</div>))}</div>}
          </>
        );
      case 'trust':
        return (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><Star className="h-5 w-5 text-[var(--success)]" /></div><div><h2 className="text-lg font-bold text-main">4 Thẻ Thống kê Tin cậy</h2><p className="text-xs text-muted">Giá trị và nhãn hiển thị trên các thẻ số liệu</p></div></div>
              <ToggleSwitch checked={trustEnabled} onChange={setTrustEnabled} />
            </div>
            {trustEnabled && <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{TRUST_ITEMS.map((item) => (<div key={item.prefix} className="rounded-xl border border-divider bg-main p-4"><h3 className="text-sm font-semibold text-main mb-3">{item.label}</h3><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-muted mb-1">Giá trị (VD: 99%)</label><input value={settings[`${item.prefix}_value`] || ''} onChange={(e) => updateField(`${item.prefix}_value`, e.target.value)} placeholder="99%" className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" /></div><div><label className="block text-xs text-muted mb-1">Nhãn (VD: Khách hàng hài lòng)</label><input value={settings[`${item.prefix}_label`] || ''} onChange={(e) => updateField(`${item.prefix}_label`, e.target.value)} placeholder="Khách hàng hài lòng" className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" /></div></div></div>))}</div>}
          </>
        );
      case 'hero':
        return (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--warning)]/10"><ImageIcon className="h-5 w-5 text-[var(--warning)]" /></div><div><h2 className="text-lg font-bold text-main">Slider Banner (Hero)</h2><p className="text-xs text-muted">Quản lý các slide hiển thị trên banner trang chủ</p></div></div>
              <ToggleSwitch checked={heroEnabled} onChange={setHeroEnabled} />
            </div>
            {heroEnabled && <div className="space-y-4">{heroSlides.map((slide, idx) => (<div key={idx} className="rounded-xl border border-divider bg-main p-4"><div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-main">Slide #{idx + 1}</h3><button onClick={() => removeHeroSlide(idx)} className="text-xs text-[var(--danger)] hover:text-[var(--danger)]/80 transition">Xóa slide</button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-xs text-muted mb-1">Tiêu đề</label><input value={slide.title} onChange={e => updateHeroSlide(idx, 'title', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div><label className="block text-xs text-muted mb-1">Phụ đề</label><input value={slide.subtitle} onChange={e => updateHeroSlide(idx, 'subtitle', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div className="md:col-span-2"><label className="block text-xs text-muted mb-1">Mô tả</label><textarea value={slide.description} onChange={e => updateHeroSlide(idx, 'description', e.target.value)} rows={2} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div><label className="block text-xs text-muted mb-1">Giá</label><input value={slide.price} onChange={e => updateHeroSlide(idx, 'price', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div><label className="block text-xs text-muted mb-1">Giá gốc</label><input value={slide.originalPrice} onChange={e => updateHeroSlide(idx, 'originalPrice', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div><label className="block text-xs text-muted mb-1">Badge (VD: -70%)</label><input value={slide.badge} onChange={e => updateHeroSlide(idx, 'badge', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div><label className="block text-xs text-muted mb-1">Slug sản phẩm</label><input value={slide.slug} onChange={e => updateHeroSlide(idx, 'slug', e.target.value)} placeholder="ten-san-pham" className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main" /></div><div><label className="block text-xs text-muted mb-1">Màu gradient</label><input value={slide.gradient} onChange={e => updateHeroSlide(idx, 'gradient', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main font-mono text-xs" /></div><div><label className="block text-xs text-muted mb-1">URL ảnh</label><input value={slide.image} onChange={e => updateHeroSlide(idx, 'image', e.target.value)} className="w-full rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main font-mono text-xs" /></div></div></div>))}<button onClick={addHeroSlide} className="w-full rounded-lg border-2 border-dashed border-divider py-3 text-sm text-muted hover:text-main hover:border-[var(--primary)]/40 transition">+ Thêm slide mới</button></div>}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold gradient-heading">Nội dung Trang chủ</h1>
          <p className="mt-2 text-sm text-muted">Quản lý toàn bộ nội dung trang chủ</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-lg transition hover:bg-primary disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Đang lưu...' : 'Lưu tất cả'}
        </button>
      </div>

      {message && <div className={`mb-6 rounded-xl p-4 ${message.type === 'success' ? 'bg-success/10 text-[var(--success)] border border-[var(--success)]/20' : 'bg-destructive/10 text-[var(--danger)] border border-[var(--danger)]/20'}`}>{message.text}</div>}

      <div className="mb-6 flex gap-1 rounded-2xl border border-divider bg-card p-1" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} role="tab" aria-selected={activeTab === tab.id}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-muted hover:text-main hover:bg-hover'
              }`}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-divider bg-card p-6">
        {renderTabContent()}
      </div>

      <div className="mt-6 rounded-2xl border border-divider bg-card p-4">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-muted shrink-0 mt-0.5" />
          <div><p className="text-sm text-muted"><strong>Lưu ý:</strong> Nếu để trống một trường, hệ thống sẽ tự động dùng nội dung mặc định. Dùng toggle để bật/tắt từng khu vực.</p></div>
        </div>
      </div>
    </div>
  );
}
