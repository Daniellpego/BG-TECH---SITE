import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    title: 'Confirmar exclusão?',
    description: 'Esta ação não pode ser desfeita.',
  };

  afterEach(() => jest.clearAllMocks());

  it('renders when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirmar exclusão?')).toBeInTheDocument();
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirmar exclusão?')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Confirmar'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses custom labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Sim, deletar"
        cancelLabel="Não, voltar"
      />,
    );
    expect(screen.getByText('Sim, deletar')).toBeInTheDocument();
    expect(screen.getByText('Não, voltar')).toBeInTheDocument();
  });

  it('has accessible alertdialog role', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('uses CSS variable styling (rounded-2xl)', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.className).toContain('rounded-2xl');
    expect(dialog.className).toContain('bg-[var(--bg-elevated)]');
  });
});
