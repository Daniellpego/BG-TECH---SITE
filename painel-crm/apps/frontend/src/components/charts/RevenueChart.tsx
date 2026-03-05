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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">Receita Mensal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ left: 10, right: 10 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3478f6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#3478f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#888" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#888" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="month" stroke="#888" fontSize={12} />
          <YAxis
            stroke="#888"
            fontSize={12}
            tickFormatter={(v) =>
              new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(v)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1c1c1e',
              border: '1px solid #333',
              borderRadius: '0.5rem',
              color: '#f5f5f7',
            }}
            formatter={(value: number) => [
              `R$ ${new Intl.NumberFormat('pt-BR').format(value)}`,
            ]}
          />
          {data[0]?.target !== undefined && (
            <Area
              type="monotone"
              dataKey="target"
              stroke="#888"
              fill="url(#targetGrad)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              name="Meta"
            />
          )}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3478f6"
            fill="url(#revenueGrad)"
            strokeWidth={2.5}
            name="Receita"
            dot={{ fill: '#3478f6', r: 3 }}
            activeDot={{ r: 5, fill: '#5a9cff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
