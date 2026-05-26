'use client';import { useState, useEffect } from 'react';import Link from 'next/link';import { usePathname, useRouter } from 'next/navigation';import { useTheme } from '@/components/ThemeProvider';import { Moon, Sun, ShoppingCart, User, LogOut, Search, LayoutDashboard, Wallet, ChevronDown } from 'lucide-react';import { useSession, signOut } from 'next-auth/react';import { useUIElements } from '@/components/UIElementsProvider';import SiteName from '@/components/ui/SiteName';
import { useHydrated } from '@/store/useHydratedStore';
import { useCartStore } from '@/store/useCartStore';
export default function Header() {  const pathname = usePathname(); const router = useRouter();
  const isAdminRoute = pathname?.startsWith('/admin');
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const hydrated = useHydrated();
  const cartItems = useCartStore((state) => state.cartItems);
  const totalItems = hydrated ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const { isVisible, getSetting, t, settings } = useUIElements();
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) { const d = await res.json(); setLiveBalance(d.user?.balance ?? null) }
      } catch {}
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    const onFocus = () => fetchBalance();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
  }, [session?.user?.id]);
  const displayBalance = liveBalance ?? (session?.user as any)?.balance ?? 0;
  if (isAdminRoute) {    return (      <header className="sticky top-0 z-50 border-b border-divider header-blur">        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-primary">            <LayoutDashboard className="h-4 w-4" />            <span>Quản trị</span>          </Link>          <div className="flex items-center gap-3">            <button              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}              className="rounded-full p-2 text-muted transition hover:bg-[var(--primary)]/10 hover:text-primary"            >              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}            </button>            <Link href="/" className="text-xs text-muted hover:text-main transition">              ← Về trang chủ            </Link>          </div>        </div>      </header>    );  }
const showSearch = isVisible('header_search');
  const showDeposit = isVisible('header_deposit');
  const showThemeToggle = isVisible('header_theme');
  const showCart = isVisible('header_cart');
  const showUserMenu = isVisible('header_user');
return (    <header className="sticky top-0 z-50 border-b border-divider header-blur">      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">        {/* Logo */}        <div className="flex items-center gap-2">          <button            onClick={() => {              if (pathname === '/') {                window.scrollTo(0, 0);                window.location.reload()              } else {                router.push('/')              }            }}            className="text-xl font-bold tracking-tight"          >            <span className="text-divine-blue text-neon-glow-sm">{settings.siteName || ''}</span>          </button>        </div>        {/* Search Bar */}
        {showSearch && (
          <form action="/products" method="get" className="mx-4 hidden flex-1 max-w-xl sm:flex">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="q"
                placeholder={t('search.placeholder')}
                className="w-full rounded-full border border-divider bg-[var(--bg-input)] py-2.5 pl-11 pr-4 text-sm text-main outline-none transition placeholder:text-muted focus:border-[var(--primary)]/50 focus:bg-[var(--bg-card)] focus:ring-1 focus:ring-[var(--primary)]/30"
              />
            </div>
          </form>
        )}
        {/* Right Actions */}        <div className="flex items-center gap-1.5">          {/* Theme Toggle */}          {showThemeToggle && (            <button              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}              className="rounded-full p-2.5 text-muted transition hover:bg-[var(--primary)]/10 hover:text-primary"              aria-label="Toggle theme"            >              {theme === 'dark' ? (                <Sun className="h-5 w-5" />              ) : (                <Moon className="h-5 w-5" />              )}            </button>          )}          {/* Cart */}          {showCart && (            <button              onClick={() => {                if (session) {                  router.push('/cart')                } else {                  router.push('/login')                }              }}              className="relative rounded-full p-2.5 text-muted transition hover:bg-[var(--primary)]/10 hover:text-primary"            >              <ShoppingCart className="h-5 w-5" />              {totalItems > 0 && (                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-divine-red text-xs font-bold text-white box-neon-glow">                  {totalItems > 99 ? '99+' : totalItems}                </span>              )}            </button>          )}          {/* Deposit */}          {showDeposit && session && (            <Link              href="/deposit"              className={`rounded-full px-4 py-2 text-sm font-bold transition hover:bg-amber-500/20`}              style={getSetting('header_deposit')?.customColor ? { color: getSetting('header_deposit')!.customColor! } : undefined}            >              {getSetting('header_deposit')?.customText || t('nav.deposit')}            </Link>          )}          {/* User Menu */}          {showUserMenu && (            status === 'loading' ? (              <div className="h-8 w-8 animate-pulse rounded-full bg-card" />            ) : session ? (              <div className="relative group flex items-center gap-3">                <div className="hidden sm:flex items-center gap-1.5 text-sm">                  <User className="h-4 w-4 text-muted" />                  <span className="font-medium text-main max-w-[100px] truncate">                    {session.user?.name || session.user?.email}                  </span>                </div>                <Link href="/deposit" className="flex items-center gap-1 rounded-lg bg-[var(--success)]/10 px-3 py-1.5 text-sm font-bold text-[var(--success)] transition hover:bg-[var(--success)]/20">                  <Wallet className="h-3.5 w-3.5" />                  {displayBalance.toLocaleString('vi-VN')}d</Link>                <button                  onClick={() => { useCartStore.getState().clearCart(); signOut({ callbackUrl: '/' }) }}                  className="rounded-full p-2 text-muted transition hover:bg-divine-red/10 hover:text-divine-red"                  title={t('nav.logout')}                >                  <LogOut className="h-5 w-5" />                </button>                <div className="relative">                  <button className="rounded-full p-2 text-muted transition hover:bg-[var(--primary)]/10 hover:text-primary">                    <ChevronDown className="h-4 w-4" />                  </button>                  <div className="absolute right-0 top-full hidden group-hover:block">                    <div className="mt-2 w-48 rounded-xl border border-divider bg-card py-2 shadow-2xl">                      <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-muted hover:bg-[var(--primary)]/10 hover:text-primary">                        {t('nav.dashboard')}                      </Link>                      {session.user?.role === 'ADMIN' && (                        <Link href="/admin" className="block px-4 py-2.5 text-sm text-primary hover:bg-[var(--primary)]/10">                          {t('nav.admin')}                        </Link>                      )}                    </div>                  </div>                </div>              </div>            ) : (              <div className="flex items-center gap-2">                <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-primary hover:bg-[var(--primary)]/5">                  {t('nav.login')}                </Link>                <Link href="/register" className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 !text-white hover:from-blue-600 hover:to-indigo-700 px-4 py-2 text-sm font-semibold transition">                  {t('nav.register')}                </Link>              </div>            )          )}        </div>      </div>    </header>  )}