import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonCard, SkeletonTable } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { className: 'h-4 w-48' },
};

export const Circle: Story = {
  args: { className: 'h-12 w-12', rounded: 'full' },
};

export const Card: Story = {
  render: () => <SkeletonCard />,
  name: 'Skeleton Card',
};

export const Table: Story = {
  render: () => <SkeletonTable rows={5} />,
  name: 'Skeleton Table',
};

export const LoadingDashboard: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable />
    </div>
  ),
  name: 'Loading Dashboard',
};
