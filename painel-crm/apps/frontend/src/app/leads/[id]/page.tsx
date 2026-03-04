'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Loader2,
  Phone,
  Mail,
  Building2,
  Flame,
  Thermometer,
  Snowflake,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
} from 'lucide-react';
import * as api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Lead } from '@/types';

const TEMP_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  hot: { icon: <Flame className="h-5 w-5" />, label: 'Quente', color: 'text-red-400 bg-red-500/10' },
  warm: { icon: <Thermometer className="h-5 w-5" />, label: 'Morno', color: 'text-amber-400 bg-amber-500/10' },
  cold: { icon: <Snowflake className="h-5 w-5" />, label: 'Frio', color: 'text-blue-400 bg-blue-500/10' },
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400',
  qualifying: 'bg-yellow-500/20 text-yellow-400',
  qualified: 'bg-green-500/20 text-green-400',
  converted: 'bg-cyan-500/20 text-cyan-400',
  disqualified: 'bg-red-500/20 text-red-400',
};

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-800/50 p-4">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated || !id) return;

    async function load() {
      try {
        const res = await api.getLead(id);
        setLead(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Lead não encontrado.</p>
        <button onClick={() => router.push('/leads')} className="text-sm text-cyan-400 hover:underline">
          Voltar para Leads
        </button>
      </div>
    );
  }

  const temp = lead.lead_temperature ? TEMP_CONFIG[lead.lead_temperature] : null;
  const qualData = (lead.raw_quiz_response as any)?.qualification;

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/leads')}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">{lead.nome}</h1>
          <div className="mt-1 flex items-center gap-3">
            {lead.empresa && (
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <Building2 className="h-3.5 w-3.5" /> {lead.empresa}
              </span>
            )}
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                STATUS_COLORS[lead.lead_status] || STATUS_COLORS.new
              }`}
            >
              {lead.lead_status}
            </span>
            {temp && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${temp.color}`}>
                {temp.icon} {temp.label}
              </span>
            )}
            {lead.score != null && (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  lead.score >= 75
                    ? 'bg-green-500/20 text-green-400'
                    : lead.score >= 50
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                Score: {lead.score}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact + Quiz Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={lead.whatsapp} />
        <InfoCard icon={<Mail className="h-4 w-4" />} label="E-mail" value={lead.email} />
        <InfoCard icon={<Target className="h-4 w-4" />} label="Segmento" value={lead.segmento} />
        <InfoCard icon={<AlertTriangle className="h-4 w-4" />} label="Dor Principal" value={lead.dor_principal} />
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Horas Perdidas" value={lead.horas_perdidas} />
        <InfoCard icon={<DollarSign className="h-4 w-4" />} label="Faturamento" value={lead.faturamento} />
        <InfoCard icon={<Target className="h-4 w-4" />} label="Maturidade" value={lead.maturidade} />
        <InfoCard icon={<Clock className="h-4 w-4" />} label="Janela de Decisão" value={lead.janela_decisao} />
        <InfoCard icon={<DollarSign className="h-4 w-4" />} label="Custo Mensal" value={lead.custo_mensal} />
      </div>

      {/* Tags */}
      {lead.lead_tags && lead.lead_tags.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {lead.lead_tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Qualification Result (from Agent) */}
      {qualData && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase text-slate-500">
            <Brain className="h-4 w-4 text-cyan-400" /> Resultado da Qualificação (IA)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {qualData.summary && (
              <div className="sm:col-span-2 rounded-lg bg-slate-800/50 p-4 text-sm text-slate-300">
                {qualData.summary}
              </div>
            )}
            {qualData.budget_estimate_brl != null && (
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs text-slate-500">Budget Estimado</p>
                <p className="text-lg font-bold text-green-400">
                  R$ {Number(qualData.budget_estimate_brl).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
            {qualData.lead_category && (
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs text-slate-500">Categoria</p>
                <p className="mt-1 text-sm font-semibold text-slate-200 uppercase">{qualData.lead_category}</p>
              </div>
            )}
            {qualData.risk_flags?.length > 0 && (
              <div className="sm:col-span-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs font-semibold text-red-400 mb-2">Riscos Identificados</p>
                <ul className="space-y-1 text-sm text-red-300">
                  {qualData.risk_flags.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}
            {qualData.recommended_actions?.length > 0 && (
              <div className="sm:col-span-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                <p className="text-xs font-semibold text-cyan-400 mb-2">Ações Recomendadas</p>
                <ul className="space-y-1 text-sm text-cyan-300">
                  {qualData.recommended_actions.map((a: string, i: number) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw Quiz Response */}
      {lead.raw_quiz_response && Object.keys(lead.raw_quiz_response).length > 0 && (
        <details className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <summary className="cursor-pointer text-sm font-semibold uppercase text-slate-500 hover:text-slate-300">
            Resposta Bruta do Quiz (JSON)
          </summary>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-400 leading-relaxed">
            {JSON.stringify(lead.raw_quiz_response, null, 2)}
          </pre>
        </details>
      )}

      {/* Linked Opportunity */}
      {lead.opportunity_id && (
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <p className="text-sm text-cyan-400">
            ✓ Lead convertido em oportunidade{' '}
            <a href={`/opportunities/${lead.opportunity_id}`} className="underline hover:text-cyan-300">
              {lead.opportunity_id}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
