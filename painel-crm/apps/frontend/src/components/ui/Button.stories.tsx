import type { Meta, StoryObj } from '@storybook/react';
import { Button, IconButton } from './Button';
import { Settings, Plus, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger', 'ghost', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: 'Salvar', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: 'Cancelar', variant: 'secondary' },
};

export const Danger: Story = {
  args: { children: 'Excluir', variant: 'danger', icon: <Trash2 className="h-4 w-4" /> },
};

export const Ghost: Story = {
  args: { children: 'Opções', variant: 'ghost' },
};

export const Outline: Story = {
  args: { children: 'Detalhes', variant: 'outline' },
};

export const Loading: Story = {
  args: { children: 'Salvando...', variant: 'primary', loading: true },
};

export const Disabled: Story = {
  args: { children: 'Indisponível', variant: 'primary', disabled: true },
};

export const WithIcon: Story = {
  args: { children: 'Novo Item', variant: 'primary', icon: <Plus className="h-4 w-4" /> },
};

export const SmallSize: Story = {
  args: { children: 'SM', size: 'sm', variant: 'primary' },
};

export const LargeSize: Story = {
  args: { children: 'Botão Grande', size: 'lg', variant: 'primary' },
};

export const IconOnly: Story = {
  render: () => (
    <div className="flex gap-2">
      <IconButton aria-label="Settings"><Settings className="h-4 w-4" /></IconButton>
      <IconButton variant="primary" aria-label="Add"><Plus className="h-4 w-4" /></IconButton>
      <IconButton variant="danger" aria-label="Delete"><Trash2 className="h-4 w-4" /></IconButton>
    </div>
  ),
};
