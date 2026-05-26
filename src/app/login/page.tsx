'use client';import { Suspense, useState, useEffect } from 'react';import { signIn, useSession } from 'next-auth/react';import { useRouter, useSearchParams } from 'next/navigation';import Link from 'next/link';import { Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';import DynamicCaptcha from '@/components/security/DynamicCaptcha';import { useUIElements } from '@/components/UIElementsProvider'

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { settings } = useUIElements();

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);
  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginCaptcha, setLoginCaptcha] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [regCaptcha, setRegCaptcha] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setMode('login');
      setRegistered(true);
      setTimeout(() => setRegistered(false), 4000);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();setLoginError('');setLoginLoading(true);
    try {
      const result = await signIn('credentials', { email: loginEmail, password: loginPassword, captchaToken: loginCaptcha, redirect: false });
      if (result?.error) setLoginError('Email hoặc mật khẩu không đúng');
      else { router.push('/dashboard'); router.refresh() }
    } catch { setLoginError('Có lỗi xảy ra') } finally { setLoginLoading(false) }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();setRegError('');
    if (regPassword !== regConfirm) { setRegError('Mật khẩu xác nhận không khớp'); return }
    if (regPassword.length < 6) { setRegError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    if (!agreeTerms) { setRegError('Vui lòng đồng ý với điều khoản'); return }
    setRegLoading(true);
    try {
      const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, captchaToken: regCaptcha }) });
      const data = await res.json();
      if (!res.ok) { setRegError(data.error || 'Đăng ký thất bại'); return }
      router.push('/login?registered=true');
    } catch { setRegError('Có lỗi xảy ra') } finally { setRegLoading(false) }
  };

  const tabClass = (tab: 'login' | 'register') =>
    `flex-1 py-3 text-sm font-semibold text-center transition-all cursor-pointer rounded-lg ${mode === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <style>{`@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.animate-fadeSlide{animation:fadeSlide .25s ease-out}`}</style>
      <div className="w-full max-w-md">
        {registered && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Đăng ký thành công! Vui lòng đăng nhập.
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            {settings.siteLogo ? (
              <img src={settings.siteLogo} alt="" className="mx-auto mb-3 h-14 w-14 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-lg">{settings.siteName ? settings.siteName[0].toUpperCase() : '?'}</div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{settings.siteName ? `Chào mừng bạn đến với ${settings.siteName}` : 'Chào mừng bạn'}</h1>
            <p className="mt-1 text-sm text-gray-500">Đăng nhập hoặc tạo tài khoản</p>
          </div>

          <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
            <div className={tabClass('login')} onClick={() => setMode('login')}>Đăng nhập</div>
            <div className={tabClass('register')} onClick={() => setMode('register')}>Đăng ký</div>
          </div>

          <div key={mode} className="animate-fadeSlide">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{loginError}</div>}
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Email của bạn" />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showLoginPw ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Mật khẩu" />
                <button type="button" onClick={() => setShowLoginPw(!showLoginPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><EyeOff className="h-4 w-4" /></button>
              </div>
              <DynamicCaptcha onVerify={t => setLoginCaptcha(t)} />
              <button type="submit" disabled={loginLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-400 hover:to-indigo-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-60">
                {loginLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</> : 'Đăng nhập'}
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">hoặc</span></div>
              </div>
              <button type="button" onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Đăng nhập với Google
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {regError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-200">{regError}</div>}
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Tên của bạn" />
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Email của bạn" />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type={showRegPw ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Mật khẩu" />
                <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showRegPw ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} required className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="Xác nhận mật khẩu" />
              </div>
              <DynamicCaptcha onVerify={t => setRegCaptcha(t)} />
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                <span className="text-xs text-gray-500">Tôi đồng ý với <Link href="/terms" className="text-blue-500 hover:text-blue-600 underline">Điều khoản & Chính sách bảo mật</Link></span>
              </label>
              <button type="submit" disabled={regLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-400 hover:to-indigo-500 hover:shadow-xl active:scale-[0.98] disabled:opacity-60">
                {regLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</> : 'Tạo tài khoản'}
              </button>
            </form>
          )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">SSL Secured Encrypted</p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>}>
      <AuthContent />
    </Suspense>
  )
}