'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PipelineData } from '@/types';

const STAGE_COLORS: Record<string, string> = {
  lead: '#64748b',
  qualified: '#3b82f6',
  proposal: '#a855f7',
  negotiation: '#f59e0b',
  closed_won: '#10b981',
  closed_lost: '#ef4444',
};

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  closed_won: 'Ganho',
  closed_lost: 'Perdido',
};

interface PipelineChartProps {
  data: PipelineData[];
}

export default function PipelineChart({ data }: PipelineChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: STAGE_LABELS[d.stage] || d.stage,
    fill: STAGE_COLORS[d.stage] || '#64748b',
  }));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">Pipeline por Estágio</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v) =>
              new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(v)
            }
            stroke="#888"
            fontSize={12}
          />
          <YAxis type="category" dataKey="label" width={100} stroke="#888" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1c1c1e',
              border: '1px solid #333',
              borderRadius: '0.5rem',
              color: '#f5f5f7',
            }}
            formatter={(value: number) => [
              `R$ ${new Intl.NumberFormat('pt-BR').format(value)}`,
              'Valor',
            ]}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
