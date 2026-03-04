'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

const PUBLIC_ROUTES = ['/login'];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <AuthProvider>
      {isPublic ? (
        <>{children}</>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      )}
    </AuthProvider>
  );
}
