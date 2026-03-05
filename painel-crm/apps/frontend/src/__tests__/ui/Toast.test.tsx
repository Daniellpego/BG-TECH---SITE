import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../../components/ui/Toast';

function TestTrigger() {
  const { addToast, toasts } = useToast();
  return (
    <>
      <button onClick={() => addToast({ type: 'success', title: 'Sucesso!' })}>
        trigger-success
      </button>
      <button onClick={() => addToast({ type: 'error', title: 'Erro!' })}>
        trigger-error
      </button>
      <span data-testid="count">{toasts.length}</span>
    </>
  );
}

describe('Toast', () => {
  it('renders no toasts initially', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    );
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('adds a toast when triggered', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('trigger-success'));
    expect(screen.getByText('Sucesso!')).toBeInTheDocument();
  });

  it('shows dismiss button', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('trigger-error'));
    expect(screen.getByText('Erro!')).toBeInTheDocument();
    expect(screen.getByLabelText('Fechar notificação')).toBeInTheDocument();
  });

  it('dismisses toast on button click', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('trigger-success'));
    expect(screen.getByText('Sucesso!')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Fechar notificação'));
    expect(screen.queryByText('Sucesso!')).not.toBeInTheDocument();
  });

  it('uses CSS variable styling', () => {
    render(
      <ToastProvider>
        <TestTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('trigger-success'));
    const toast = screen.getByRole('alert');
    expect(toast.className).toContain('rounded-2xl');
  });
});
