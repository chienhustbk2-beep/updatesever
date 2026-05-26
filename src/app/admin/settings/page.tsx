'use client';import { useState, useEffect, startTransition } from 'react';import { Save, Loader2, Check, AlertCircle, Settings, CreditCard, Mail, Shield, Globe, MessageCircle, MessageSquare, ThumbsUp, Banknote, Copy, CheckCircle2, Repeat, KeyRound, Gift, Plus, Trash2, RefreshCw } from 'lucide-react';
import StickyActionBar from '@/components/ui/StickyActionBar';
import ImageUrlInput from '@/components/ui/ImageUrlInput';
import DepositBonusEditor from '@/components/ui/DepositBonusEditor';
interface SettingsData { siteName: string; siteLogo: string; contactEmail: string; contactPhone: string; footerText: string; bankName: string; bankAccount: string; bankAccountName: string; bankCode: string; smtpHost: string; smtpPort: string; smtpUser: string; smtpPassword: string; smtpFromEmail: string; contactZalo: string; contactTelegram: string; contactFacebook: string; activePaymentGateway: string; web2mApiToken: string; web2mEndpoint: string; web2mBankPassword: string; depositPrefix: string; enableCaptcha: string; captchaType: string; captchaSiteKey: string; captchaSecretKey: string; maxLoginAttempts: string; lockoutMinutes: string; session_timeout_minutes: string; deposit_bonus_rules: string; update_version_url: string; update_zip_url: string }
const defaultSettings: SettingsData = {  siteName: '',  siteLogo: '',  contactEmail: '',  contactPhone: '',  footerText: '',  bankName: '',  bankAccount: '',  bankAccountName: '',  bankCode: '',  smtpHost: '',  smtpPort: '587',  smtpUser: '',  smtpPassword: '',  smtpFromEmail: '',  contactZalo: '',  contactTelegram: '',  contactFacebook: '',  activePaymentGateway: 'WEB2M',  web2mApiToken: '',  web2mEndpoint: 'https://api.web2m.com',  web2mBankPassword: '',  depositPrefix: 'MMO',  enableCaptcha: 'false',  captchaType: 'reCAPTCHA',  captchaSiteKey: '',  captchaSecretKey: '',  maxLoginAttempts: '5',  lockoutMinutes: '15',  session_timeout_minutes: '0',  deposit_bonus_rules: '',  update_version_url: '',  update_zip_url: ''}
export default function AdminSettingsPage() {  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false); const [copied2, setCopied2] = useState(false);
  const fetchSettings = async () => {    try {      const res = await fetch('/api/admin/settings');
  const data = await res.json();
  if (res.ok) {        setSettings({ ...defaultSettings, ...data.settings })      }
} catch (err) {      console.error('Failed to fetch settings:', err)    } finally {      setLoading(false) } }; useEffect(() => {    startTransition(() => {      fetchSettings()    })  }, []);
  const handleSave = async () => {    setSaving(true);setMessage(null);
try {      const res = await fetch('/api/admin/settings', {        method: 'POST',        headers: { 'Content-Type': 'application/json' },        body: JSON.stringify({ settings }),      });
  const data = await res.json();
  if (res.ok) {        setMessage({ type: 'success', text: 'Luu cau hinh thanh cong!' })      } else {        setMessage({ type: 'error', text: data.error })      }
} catch {      setMessage({ type: 'error', text: 'Co loi xay ra' })    } finally {      setSaving(false)    }    setTimeout(() => setMessage(null), 3000)  };
const tabs = [    { id: 'general', label: 'Chung', icon: Globe },    { id: 'payment', label: 'Thanh toan', icon: CreditCard },    { id: 'email', label: 'Email', icon: Mail },    { id: 'contact', label: 'Lien he', icon: MessageCircle },    { id: 'security', label: 'Bao mat', icon: Shield },    { id: 'update', label: 'Cap nhat', icon: RefreshCw },  ];if (loading) {    return (      <div className="flex min-h-[60vh] items-center justify-center">        <div className="text-center">          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />          <p className="mt-4 text-sm text-muted">Dang tai cau hinh...</p>        </div>      </div>    )  }
return (    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 text-main">      {/* Header */}      <div className="mb-8">        <h1 className="text-3xl font-extrabold gradient-heading">          Cau hinh He thong        </h1>        <p className="mt-2 text-sm text-muted">          Quan ly cac thiet lap chung cua he thong        </p>      </div>      {/* Message */}      {message && (        <div className={('mb-6 rounded-xl p-4 ') + (message.type === 'success' ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20' : 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20')}>{message.text}</div>      )}      {/* Tabs */}      <div className="mb-6 flex gap-2 border-b border-divider">        {tabs.map((tab) => {          const Icon = tab.icon; return (            <button              key={tab.id}              onClick={() => setActiveTab(tab.id)}              className={('flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ') + (activeTab === tab.id ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-muted hover:text-muted')}>              <Icon className="h-4 w-4" />              {tab.label}            </button>          )        })}      </div>      {/* Tab Content */}      <div className="rounded-2xl border border-divider bg-card p-6">
        {activeTab === 'general' && (          <div className="space-y-4">            <h2 className="text-lg font-bold text-main mb-4">Cau hinh chung</h2>            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">              <div>                <label className="block text-sm font-medium text-muted mb-1">Ten website</label>                <input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />              </div>              <div>                <ImageUrlInput                  value={settings.siteLogo}                  onChange={(value) => setSettings({ ...settings, siteLogo: value })}                  label="URL Logo"                  placeholder="https://i.ibb.co/..."                />                <p className="mt-1 text-xs text-muted">Dán link từ <a href="https://imgbb.com" target="_blank" className="text-[var(--primary)] underline">ImgBB</a> → tự động chuyển thành direct link</p>              </div>              <div>                <label className="block text-sm font-medium text-muted mb-1">Email lien he</label>                <input value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />              </div>              <div>                <label className="block text-sm font-medium text-muted mb-1">So dien thoai</label>                <input value={settings.contactPhone} onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />              </div>              <div className="sm:col-span-2">                <label className="block text-sm font-medium text-muted mb-1">Footer text</label>                <input value={settings.footerText} onChange={(e) => setSettings({ ...settings, footerText: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />              </div>            </div>          </div>        )}
        {activeTab === 'payment' && (          <div className="space-y-6">            <h2 className="text-lg font-bold text-main mb-4">Cau hinh thanh toan</h2>            {/* Cong thanh toan tu dong */}            <div className="rounded-xl bg-card border border-divider p-5">              <h3 className="text-sm font-semibold text-[var(--primary)] mb-4 flex items-center gap-2"><Repeat className="h-4 w-4" />Cong thanh toan tu dong</h3>              <div className="space-y-3">                <label className={('flex items-center gap-3 p-4 rounded-lg border border-divider bg-main cursor-pointer transition hover:border-[var(--primary)]/50 ') + (settings.activePaymentGateway === 'WEB2M' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : '')}><input type="radio" name="gateway" value="WEB2M" checked={settings.activePaymentGateway === 'WEB2M'} onChange={() => setSettings({...settings, activePaymentGateway: 'WEB2M'})} className="h-4 w-4 text-[var(--primary)]" /><div><p className="text-sm font-medium text-main">Su dung Web2M</p><p className="text-xs text-muted">Ket noi qua Web2M API - Dong bo giao dich tu dong</p></div></label>              </div>            </div>            {/* Thong tin chuyen khoan */}            <div className="rounded-xl bg-card border border-divider p-4">              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Thong tin chuyen khoan</h3>              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">                <div className="sm:col-span-2"><label className="block text-sm font-medium text-muted mb-1">Ten ngan hang</label><input value={settings.bankName} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>                <div><label className="block text-sm font-medium text-muted mb-1">So tai khoan</label><input value={settings.bankAccount} onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>                <div><label className="block text-sm font-medium text-muted mb-1">Ten chu tai khoan</label><input value={settings.bankAccountName} onChange={(e) => setSettings({ ...settings, bankAccountName: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>                <div className="sm:col-span-2"><label className="block text-sm font-medium text-muted mb-1">Ngan hang</label><select value={settings.bankCode} onChange={(e) => { const code = e.target.value; setSettings({ ...settings, bankCode: code, web2mEndpoint: code ? `https://api.web2m.com/historyapi${code.toLowerCase()}v3` : settings.web2mEndpoint }) }} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none"><option value="">-- Chon ngan hang --</option><option value="VCB">Vietcombank</option><option value="BIDV">BIDV</option><option value="VTB">VietinBank</option><option value="AGB">Agribank</option><option value="MB">MB Bank</option><option value="TCB">Techcombank</option><option value="ACB">ACB</option><option value="HDB">HD Bank</option><option value="VPB">VPBank</option><option value="TPB">TPBank</option><option value="SCB">SCB</option><option value="VIB">VIB</option><option value="SHB">SHB</option><option value="OCB">OCB</option><option value="MSB">MSB</option><option value="LPB">LPBank</option><option value="NAMAB">Nam A Bank</option><option value="PB">Public Bank</option><option value="EIB">Eximbank</option><option value="SSB">SeABank</option><option value="BVB">Bao Viet Bank</option><option value="SGB">Sai Gon Bank</option><option value="ABB">ABBANK</option><option value="KLB">Kien Long Bank</option><option value="STB">Sacombank</option><option value="DAB">Dong A Bank</option></select></div>              </div>            </div>            {/* Web2M Config */}            <div className="rounded-xl bg-card border border-divider p-5">              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2"><KeyRound className="h-4 w-4" />Cau hinh Web2M</h3>              <div className="grid grid-cols-1 gap-4">                <div><label className="block text-sm font-medium text-muted mb-1">Token Bank Lấy từ Web2M</label><input value={settings.web2mApiToken} onChange={(e) => setSettings({...settings, web2mApiToken: e.target.value})} type="password" placeholder="Nhap API Token tu Web2M" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>                <div>                  <label className="block text-sm font-medium text-muted mb-1">Web2M API Endpoint</label>                  <input value={settings.web2mEndpoint} onChange={(e) => setSettings({...settings, web2mEndpoint: e.target.value})} placeholder="https://api.web2m.com" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />                  {settings.bankCode && <p className="text-xs text-muted mt-1">Tu dong: https://api.web2m.com/historyapi{settings.bankCode.trim().toLowerCase()}v3</p>}                </div>                <div><label className="block text-sm font-medium text-muted mb-1">Mật Khẩu Ngân Hàng</label><input value={settings.web2mBankPassword} onChange={(e)=>setSettings({...settings,web2mBankPassword:e.target.value})} type="password" placeholder="Enter Internet Banking password" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>              </div>              <div className="mt-4">                <p className="text-sm text-muted mb-2">Cron Job URL (de dong bo tu dong):</p>                <div className="flex items-center gap-2 rounded-lg bg-main border border-divider p-3">                  <code className="text-sm text-main font-mono break-all flex-1">{typeof window !== 'undefined' ? (window.location.origin + '/api/web2m/sync') : ''}</code>                  <button onClick={() => { if (typeof window !== 'undefined') { navigator.clipboard.writeText(window.location.origin + '/api/web2m/sync').then(() => { setCopied2(true);setTimeout(() => setCopied2(false), 2000) }).catch(() => {}) } }} className="shrink-0 flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-primary/20 transition"><Copy className="h-3 w-3" />{copied2 ? 'Da copy' : 'Copy'}</button>                </div>              </div>            </div>            {/* Tuy chinh cu phap nap */}            <div className="rounded-xl bg-card border border-divider p-4">              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3 flex items-center gap-2"><Settings className="h-4 w-4" />Tuy chinh cu phap nap tien</h3>              <div className="flex items-center gap-2">                <input value={settings.depositPrefix} onChange={(e) => setSettings({...settings, depositPrefix: e.target.value})} placeholder="MMO" className="w-24 rounded-lg bg-card border border-divider px-3 py-2 text-sm text-main font-mono text-center focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" />                <code className="text-sm text-muted font-mono">{'{userId}'}</code>                <span className="text-xs text-muted">VD: {settings.depositPrefix || 'MMO'} 123456</span>              </div>              <p className="text-xs text-muted mt-2">Khach hang chuyen khoan voi noi dung: <code className="bg-main px-1 rounded text-xs font-mono">{settings.depositPrefix || 'MMO'} 123456</code></p>            </div>            {/* Khuyen mai nap tien */}            <div className="rounded-xl bg-card border border-divider p-5">              <h3 className="text-sm font-semibold text-[var(--primary)] mb-4 flex items-center gap-2"><Gift className="h-4 w-4" />Khuyen mai nap tien</h3>              <DepositBonusEditor value={settings.deposit_bonus_rules || ''} onChange={(v) => setSettings({...settings, deposit_bonus_rules: v})} />            </div>          </div>        )}
        {activeTab === 'email' && (          <div className="space-y-4">            <h2 className="text-lg font-bold text-main mb-4">Cau hinh Email (SMTP)</h2>            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">              <div><label className="block text-sm font-medium text-muted mb-1">SMTP Host</label><input value={settings.smtpHost} onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>              <div><label className="block text-sm font-medium text-muted mb-1">SMTP Port</label><input value={settings.smtpPort} onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })} placeholder="587" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>              <div><label className="block text-sm font-medium text-muted mb-1">SMTP User</label><input value={settings.smtpUser} onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>              <div><label className="block text-sm font-medium text-muted mb-1">SMTP Password</label><input value={settings.smtpPassword} onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })} type="password" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>              <div className="sm:col-span-2"><label className="block text-sm font-medium text-muted mb-1">From Email</label><input value={settings.smtpFromEmail} onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })} placeholder="noreply@yourdomain.com" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]" /></div>            </div>          </div>        )}
        {activeTab === 'contact' && (          <div className="space-y-4">            <h2 className="text-lg font-bold text-main mb-4">Cau hinh Lien he</h2>            <p className="text-sm text-muted mb-4">Cai dat cac kenh lien he hien thi tren website. Icons se xuat hien o goc duoi ben phai man hinh.</p>            <div className="rounded-xl bg-card border border-divider p-5">              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">                <div>                  <label className="block text-sm font-medium text-muted mb-1.5">Zalo (URL)</label>                  <div className="flex items-center gap-2">                    <MessageCircle className="h-4 w-4 text-[var(--primary)] shrink-0" />                    <input value={settings.contactZalo} onChange={(e) => setSettings({ ...settings, contactZalo: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" placeholder="https://zalo.me/0123456789" />                  </div>                </div>                <div>                  <label className="block text-sm font-medium text-muted mb-1.5">Telegram (URL)</label>                  <div className="flex items-center gap-2">                    <MessageSquare className="h-4 w-4 text-[var(--primary)] shrink-0" />                    <input value={settings.contactTelegram} onChange={(e) => setSettings({ ...settings, contactTelegram: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" placeholder="https://t.me/username" />                  </div>                </div>                <div>                  <label className="block text-sm font-medium text-muted mb-1.5">Facebook (URL)</label>                  <div className="flex items-center gap-2">                    <ThumbsUp className="h-4 w-4 text-[var(--primary)] shrink-0" />                    <input value={settings.contactFacebook} onChange={(e) => setSettings({ ...settings, contactFacebook: e.target.value })} className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" placeholder="https://facebook.com/username" />                  </div>                </div>              </div>            </div>          </div>        )}
        {activeTab === 'security' && (          <div className="space-y-4">            <h2 className="text-lg font-bold text-main mb-4">Bao mat & Phan quyen</h2>            <div className="rounded-xl bg-card border border-divider p-4">              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Phan quyen vai tro</h3>              <div className="space-y-3">                <div className="flex items-center justify-between rounded-lg bg-card p-3"><div><p className="text-sm font-medium text-main">Quan tri vien (Admin)</p><p className="text-xs text-muted">Toan quyen truy cap</p></div><span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--danger)]/10 text-[var(--danger)]">Full Access</span></div>                <div className="flex items-center justify-between rounded-lg bg-card p-3"><div><p className="text-sm font-medium text-main">Nhan vien (Staff)</p><p className="text-xs text-muted">Quan ly don hang, san pham. Khong xem cau hinh he thong.</p></div><span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">Limited</span></div>                <div className="flex items-center justify-between rounded-lg bg-card p-3"><div><p className="text-sm font-medium text-main">Khach hang (Customer)</p><p className="text-xs text-muted">Chi truy cap trang khach hang</p></div><span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">Basic</span></div>              </div>            </div>

          </div>
        )}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-main mb-4">Cau hinh bao mat</h2>

            <div className="rounded-xl bg-card border border-divider p-5">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Captcha</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg bg-card p-3 border border-divider">
                  <div>
                    <p className="text-sm font-medium text-main">Bat Captcha</p>
                    <p className="text-xs text-muted">Bao ve dang nhap / dang ky</p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, enableCaptcha: settings.enableCaptcha === 'true' ? 'false' : 'true'})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableCaptcha === 'true' ? 'bg-[var(--primary)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableCaptcha === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Captcha Type</label>
                  <select value={settings.captchaType} onChange={(e)=>setSettings({...settings,captchaType:e.target.value})}
                    className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none">
                    <option value="text">Text (Math)</option>
                    <option value="slider">Slider (Drag)</option>
                    <option value="reCAPTCHA">Google reCAPTCHA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">reCAPTCHA Site Key</label>
                  <input value={settings.captchaSiteKey} onChange={(e)=>setSettings({...settings,captchaSiteKey:e.target.value})}
                    placeholder="Required for reCAPTCHA" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">reCAPTCHA Secret Key</label>
                  <input value={settings.captchaSecretKey} onChange={(e)=>setSettings({...settings,captchaSecretKey:e.target.value})}
                    type="password" placeholder="Required for reCAPTCHA" className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-divider p-5">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Dang nhap</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">So lan dang nhap toi da</label>
                  <input type="number" value={settings.maxLoginAttempts} onChange={(e)=>setSettings({...settings,maxLoginAttempts:e.target.value})}
                    className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Khoa trong (phut)</label>
                  <input type="number" value={settings.lockoutMinutes} onChange={(e)=>setSettings({...settings,lockoutMinutes:e.target.value})}
                    className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-divider p-5">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Phien dang nhap</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">Tu dong dang xuat sau (phut)</label>
                  <input type="number" value={settings.session_timeout_minutes} onChange={(e)=>setSettings({...settings,session_timeout_minutes:e.target.value})}
                    className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main focus:border-[var(--primary)] focus:outline-none" />
                  <p className="mt-1 text-xs text-muted">De trong hoac 0 de tat. Nguoi dung se tu dong dang xuat sau thoi gian nay neu khong thao tac.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-divider p-4">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Nhat ky hoat dong</h3>
              <p className="text-sm text-muted">Tat ca hanh dong quan trong cua quan tri vien deu duoc ghi log: sua san pham, cap nhat don hang, thay doi cau hinh...</p>
              <a href="/admin/audit-logs" className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary)] transition">Xem nhat ky hoat dong {'>'}</a>
            </div>
          </div>
        )}
        {activeTab === 'update' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-main mb-4">Cau hinh cap nhat tu dong</h2>
            <p className="text-sm text-muted mb-4">Nhap URL chua PAT token de he thong tu dong tai ban cap nhat tu GitHub. Neu da co trong <code className="bg-hover px-1 rounded">.env</code> thi khong can nhap.</p>

            <div className="rounded-xl bg-card border border-divider p-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">UPDATE_VERSION_URL</label>
                  <input value={settings.update_version_url} onChange={(e)=>setSettings({...settings, update_version_url: e.target.value})}
                    placeholder="https://<PAT>@raw.githubusercontent.com/owner/repo/main/version.txt"
                    className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none font-mono" />
                  <p className="mt-1 text-xs text-muted">Duong dan den file version.txt tren GitHub raw</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">UPDATE_ZIP_URL</label>
                  <input value={settings.update_zip_url} onChange={(e)=>setSettings({...settings, update_zip_url: e.target.value})}
                    placeholder="https://<PAT>@raw.githubusercontent.com/owner/repo/main/update.zip"
                    className="w-full rounded-lg bg-main border border-divider px-3 py-2 text-sm text-main placeholder-muted focus:border-[var(--primary)] focus:outline-none font-mono" />
                  <p className="mt-1 text-xs text-muted">Duong dan den file update.zip tren GitHub raw</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-card border border-divider p-5">
              <h3 className="text-sm font-semibold text-[var(--primary)] mb-3">Vi du URL hop le</h3>
              <code className="block bg-hover rounded-lg p-3 text-xs font-mono text-main break-all">
UPDATE_VERSION_URL=https://ghp_xxx...xxx@raw.githubusercontent.com/chienhustbk2-beep/updatesever/main/version.txt{'\n'}
UPDATE_ZIP_URL=https://ghp_xxx...xxx@raw.githubusercontent.com/chienhustbk2-beep/updatesever/main/update.zip</code>
              <p className="mt-2 text-xs text-muted">Thay <code className="bg-hover px-1 rounded">ghp_xxx...xxx</code> bang PAT token cua ban.</p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-divider flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-content transition hover:bg-primary disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Dang luu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Luu cau hinh
              </>
            )}
          </button>
        </div>
      </div>
      <StickyActionBar onSave={handleSave} saving={saving} />
    </div>  )}