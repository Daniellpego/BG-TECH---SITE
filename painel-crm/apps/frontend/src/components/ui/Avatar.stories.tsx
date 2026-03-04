import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: { name: 'Daniel Pegoraro', size: 'md' },
};

export const Small: Story = {
  args: { name: 'João Silva', size: 'sm' },
};

export const Large: Story = {
  args: { name: 'Maria Souza', size: 'lg' },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Ana Clara" size="sm" />
      <Avatar name="Bruno Lima" size="md" />
      <Avatar name="Carlos Mendes" size="lg" />
    </div>
  ),
  name: 'All Sizes',
};

export const MultipleUsers: Story = {
  render: () => (
    <div className="flex -space-x-2">
      {['Daniel P.', 'Ana C.', 'Bruno L.', 'Carlos M.', 'Diana F.'].map((name) => (
        <Avatar key={name} name={name} size="md" className="ring-2 ring-slate-900" />
      ))}
    </div>
  ),
  name: 'Stacked Avatars',
};
