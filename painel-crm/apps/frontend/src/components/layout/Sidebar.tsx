'use client';

import Link from 'next/link';
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
  sales: 'bg-cyan-500/20 text-cyan-400',
  delivery: 'bg-green-500/20 text-green-400',
  viewer: 'bg-slate-500/20 text-slate-400',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 font-bold text-slate-950 text-sm">
          BG
        </div>
        <div>
          <h1 className="text-base font-bold text-white">BG Tech</h1>
          <p className="text-[11px] text-slate-500">CRM Inteligente</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Org Selector */}
      <Link
        href="/org-selector"
        className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
      >
        <Building2 className="h-4 w-4" />
        Trocar Organização
      </Link>

      {/* User Info */}
      <div className="border-t border-slate-800 px-4 py-4">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <span
                className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  ROLE_COLORS[user.role] || ROLE_COLORS.viewer
                }`}
              >
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-600">Não autenticado</p>
        )}
      </div>
    </aside>
  );
}
