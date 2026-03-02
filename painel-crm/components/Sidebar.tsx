'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Briefcase,
  FileText,
  KanbanSquare,
  LayoutDashboard,
} from 'lucide-react';

const menuItems = [
  { label: 'Visão Executiva', href: '/', icon: LayoutDashboard },
  { label: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
  { label: 'Contas', href: '/accounts', icon: Briefcase },
  { label: 'SLAs', href: '/slas', icon: Activity },
  { label: 'Propostas', href: '/proposals', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-white/10 bg-[#03050a]/80 p-6 backdrop-blur-xl">
      <div className="mb-8 border-b border-white/10 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">BG Tech</p>
        <h1 className="mt-2 text-lg font-bold text-slate-100">CRM Agêntico</h1>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                isActive
                  ? 'border-sky-400/30 bg-sky-400/10 text-sky-200'
                  : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
