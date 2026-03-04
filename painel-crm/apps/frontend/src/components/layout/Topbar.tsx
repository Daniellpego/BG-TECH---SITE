'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '@/design/ThemeProvider';
import { IconButton } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/lib/auth';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/pipeline': 'Pipeline',
  '/projects': 'Projetos',
  '/sla': 'SLAs',
  '/proposals': 'Propostas',
  '/contracts': 'Contratos',
  '/analytics': 'Analytics',
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + '/')) return title;
  }
  return 'CRM BG Tech';
}

export function Topbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const title = getPageTitle(pathname);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>

      <div className="flex items-center gap-2">
        <Tooltip content={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
          <IconButton
            onClick={toggleTheme}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </IconButton>
        </Tooltip>

        <Tooltip content="Notificações">
          <IconButton aria-label="Notificações">
            <Bell className="h-4 w-4" />
          </IconButton>
        </Tooltip>

        {user && (
          <div className="ml-2 pl-2 border-l border-slate-700">
            <Avatar name={user.name} size="sm" />
          </div>
        )}
      </div>
    </header>
  );
}
