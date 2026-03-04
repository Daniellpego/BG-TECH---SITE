import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedKpiCard } from './AnimatedKpiCard';
import { DollarSign, Target, TrendingUp, Users } from 'lucide-react';

const meta: Meta<typeof AnimatedKpiCard> = {
  title: 'UI/AnimatedKpiCard',
  component: AnimatedKpiCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AnimatedKpiCard>;

export const Default: Story = {
  args: {
    title: 'Pipeline Total',
    value: 2450000,
    prefix: 'R$ ',
    change: 12.5,
    icon: <DollarSign className="h-5 w-5" />,
  },
};

export const Positive: Story = {
  args: {
    title: 'Oportunidades',
    value: 42,
    change: 8.2,
    icon: <Target className="h-5 w-5" />,
  },
};

export const Negative: Story = {
  args: {
    title: 'Win Rate',
    value: 68,
    suffix: '%',
    change: -3.1,
    icon: <TrendingUp className="h-5 w-5" />,
  },
};

export const NoChange: Story = {
  args: {
    title: 'Leads Ativos',
    value: 150,
    icon: <Users className="h-5 w-5" />,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AnimatedKpiCard title="Pipeline" value={2450000} prefix="R$ " change={12.5} icon={<DollarSign className="h-5 w-5" />} delay={0} />
      <AnimatedKpiCard title="Oportunidades" value={42} change={8.2} icon={<Target className="h-5 w-5" />} delay={100} />
      <AnimatedKpiCard title="Win Rate" value={68} suffix="%" change={-3.1} icon={<TrendingUp className="h-5 w-5" />} delay={200} />
      <AnimatedKpiCard title="Leads" value={150} change={0} icon={<Users className="h-5 w-5" />} delay={300} />
    </div>
  ),
  name: 'KPI Grid',
};
