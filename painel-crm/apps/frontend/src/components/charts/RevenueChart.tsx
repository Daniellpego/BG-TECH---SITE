'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { RevenueData } from '@/types';

interface RevenueChartProps {
  data: RevenueData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-300">Receita Mensal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ left: 10, right: 10 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(v) =>
              new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(v)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f1f5f9',
            }}
            formatter={(value: number) => [
              `R$ ${new Intl.NumberFormat('pt-BR').format(value)}`,
            ]}
          />
          {data[0]?.target !== undefined && (
            <Area
              type="monotone"
              dataKey="target"
              stroke="#64748b"
              fill="url(#targetGrad)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              name="Meta"
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#06b6d4"
            fill="url(#revenueGrad)"
            strokeWidth={2.5}
            name="Receita"
            dot={{ fill: '#06b6d4', r: 3 }}
            activeDot={{ r: 5, fill: '#22d3ee' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
