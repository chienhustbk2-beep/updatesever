'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface Permissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface ModulePerms {
  admin: Permissions;
  staff: Permissions;
}

export default function PermissionGuard({ children, role }: { children: React.ReactNode; role: string }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch('/api/admin/permissions');
        const data = await res.json();
        if (res.ok && data.savedConfig?.routes) {
          const routes: Record<string, ModulePerms> = data.savedConfig.routes;
          const sortedKeys = Object.keys(routes).sort((a, b) => b.length - a.length);
          const moduleKey = sortedKeys.find((key) => pathname === key || pathname.startsWith(key + '/'));
          if (moduleKey) {
            const roleKey = role === 'ADMIN' ? 'admin' : 'staff';
            const perms = routes[moduleKey]?.[roleKey];
            if (perms && perms.view === false) {
              setAllowed(false);
              return;
            }
          }
        }
        setAllowed(true);
      } catch {
        setAllowed(true);
      }
    };
    checkPermission();
  }, [pathname, role]);

  if (allowed === null) return null;

  if (allowed === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
            <ShieldAlert className="h-8 w-8 text-[var(--danger)]" />
          </div>
          <h2 className="text-xl font-bold text-main">Không có quyền truy cập</h2>
          <p className="mt-2 text-sm text-muted">Bạn không có quyền xem trang này.</p>
          <Link href="/admin" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--primary)]/90">
            <ArrowLeft className="h-4 w-4" /> Về trang Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
