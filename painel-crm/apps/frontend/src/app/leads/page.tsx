'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Search, Loader2, ArrowUpRight, Flame, Thermometer, Snowflake } from 'lucide-react';
import { PageTransition } from '@/components/ui/PageTransition';
import StatusBadge from '@/components/ui/StatusBadge';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Lead } from '@/types';

const TEMP_ICON: Record<string, React.ReactNode> = {
  hot: <Flame className="h-4 w-4 text-red-400" />,
  warm: <Thermometer className="h-4 w-4 text-amber-400" />,
  cold: <Snowflake className="h-4 w-4 text-blue-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  qualifying: 'bg-yellow-500/20 text-yellow-400',
  qualified: 'bg-green-500/20 text-green-400',
  converted: 'bg-cyan-500/20 text-cyan-400',
  disqualified: 'bg-red-500/20 text-red-400',
};

export default function LeadsInboxPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    async function loadLeads() {
      try {
        const res = await api.getLeads();
        setLeads(res.data || []);
      } catch (err) {
        console.error('Failed to load leads', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, [isAuthenticated, authLoading, router]);

  const filtered = leads.filter((l) => {
    const matchSearch =
      !search ||
      l.nome.toLowerCase().includes(search.toLowerCase()) ||
      l.empresa?.toLowerCase().includes(search.toLowerCase()) ||
      l.whatsapp?.includes(search);
    const matchStatus = statusFilter === 'all' || l.lead_status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">Leads do Quiz</h1>
            <p className="text-sm text-slate-400">
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nome, empresa ou whatsapp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
        >
          <option value="all">Todos os status</option>
          <option value="new">Novo</option>
          <option value="qualifying">Qualificando</option>
          <option value="qualified">Qualificado</option>
          <option value="converted">Convertido</option>
          <option value="disqualified">Desqualificado</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Segmento</th>
              <th className="px-4 py-3 text-center">Temp.</th>
              <th className="px-4 py-3 text-center">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Nenhum lead encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="transition-colors hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-slate-100">{lead.nome}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.empresa || '—'}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                    {lead.whatsapp || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{lead.segmento || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {lead.lead_temperature ? TEMP_ICON[lead.lead_temperature] : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {lead.score != null ? (
                      <span
                        className={`inline-block min-w-[2.5rem] rounded-full px-2 py-0.5 text-xs font-bold ${
                          lead.score >= 75
                            ? 'bg-green-500/20 text-green-400'
                            : lead.score >= 50
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {lead.score}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                        STATUS_COLORS[lead.lead_status] || STATUS_COLORS.new
                      }`}
                    >
                      {lead.lead_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/leads/${lead.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Ver <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}
