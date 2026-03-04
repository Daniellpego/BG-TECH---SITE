'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from '@/design/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import Sidebar from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const PUBLIC_ROUTES = ['/login'];

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            {isPublic ? (
              <>{children}</>
            ) : (
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Topbar />
                  <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
              </div>
            )}
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
