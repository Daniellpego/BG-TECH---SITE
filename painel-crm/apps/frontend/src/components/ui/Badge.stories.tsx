import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'danger', 'info', 'outline'] },
    size: { control: 'select', options: ['sm', 'md'] },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: 'Default', variant: 'default' } };
export const Success: Story = { args: { children: 'Ativo', variant: 'success', dot: true } };
export const Warning: Story = { args: { children: 'Atenção', variant: 'warning', dot: true } };
export const Danger: Story = { args: { children: 'Erro', variant: 'danger', dot: true } };
export const Info: Story = { args: { children: 'Info', variant: 'info' } };
export const Outline: Story = { args: { children: 'Outline', variant: 'outline' } };
export const Small: Story = { args: { children: 'Hot', variant: 'danger', size: 'sm' } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="success" dot>Ativo</Badge>
      <Badge variant="warning" dot>Pendente</Badge>
      <Badge variant="danger" dot>Erro</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};
