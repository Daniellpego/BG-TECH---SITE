'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  GitBranch,
  FolderKanban,
  ShieldCheck,
  FileText,
  FileSignature,
  BarChart3,
  LogOut,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Rocket,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/projects', label: 'Projetos', icon: FolderKanban },
  { href: '/sla', label: 'SLAs', icon: ShieldCheck },
  { href: '/proposals', label: 'Propostas', icon: FileText },
  { href: '/contracts', label: 'Contratos', icon: FileSignature },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  manager: 'bg-purple-500/20 text-purple-400',
  sales: 'bg-blue-500/20 text-blue-500',
  delivery: 'bg-green-500/20 text-green-400',
  viewer: 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-screen flex-col bg-[var(--bg-elevated)] border-r border-[var(--border)] transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
        <Image
          src="/logo-bgtech.png"
          alt="BG Tech"
          width={36}
          height={36}
          className="shrink-0 rounded-xl"
        />
        {!collapsed && (
          <div>
            <h1 className="text-base font-semibold text-[var(--text)] tracking-tight">BG Tech</h1>
            <p className="text-[11px] text-[var(--text-tertiary)]">CRM Inteligente</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px] ${
                isActive
                  ? 'bg-[var(--bg-hover)] text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {!collapsed && 'Recolher'}
      </button>

      {/* Help & Onboarding */}
      <div className="mx-3 mb-2 space-y-0.5">
        <Link
          href="/onboarding"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Rocket className="h-4 w-4 shrink-0" />
          {!collapsed && 'Tour Interativo'}
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!collapsed && 'Central de Ajuda'}
        </Link>
      </div>

      {/* Org Selector */}
      <Link
        href="/org-selector"
        className="mx-3 mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        {!collapsed && 'Trocar Organização'}
      </Link>

      {/* User Info */}
      <div className="border-t border-[var(--border)] px-4 py-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-hover)] text-[var(--primary)] text-xs font-semibold">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{user.name}</p>
                  <span
                    className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      ROLE_COLORS[user.role] || ROLE_COLORS.viewer
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={logout}
                className="rounded-xl p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--danger)] transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          !collapsed && <p className="text-xs text-[var(--text-tertiary)]">Não autenticado</p>
        )}
      </div>
    </aside>
  );
}
