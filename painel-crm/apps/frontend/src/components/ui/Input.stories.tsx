import type { Meta, StoryObj } from '@storybook/react';
import { Input, Textarea } from './Input';
import { Search, Mail } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { label: 'Nome', placeholder: 'Digite seu nome...' },
};

export const WithIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'email@example.com',
    icon: <Mail className="h-4 w-4" />,
    type: 'email',
  },
};

export const WithError: Story = {
  args: { label: 'Email', value: 'invalid', error: 'Email inválido' },
};

export const WithHint: Story = {
  args: { label: 'Senha', type: 'password', hint: 'Mínimo 8 caracteres' },
};

export const Disabled: Story = {
  args: { label: 'Campo desabilitado', value: 'Somente leitura', disabled: true },
};

export const SearchInput: Story = {
  args: {
    placeholder: 'Buscar leads...',
    icon: <Search className="h-4 w-4" />,
  },
};

export const TextareaStory: Story = {
  render: () => (
    <Textarea
      label="Descrição"
      placeholder="Descreva o contexto da proposta..."
      rows={5}
    />
  ),
  name: 'Textarea',
};

export const TextareaWithError: Story = {
  render: () => (
    <Textarea
      label="Observações"
      value="Texto curto"
      error="Mínimo de 50 caracteres"
    />
  ),
  name: 'Textarea with Error',
};
