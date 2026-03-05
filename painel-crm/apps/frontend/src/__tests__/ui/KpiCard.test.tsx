import React from 'react';
import { render, screen } from '@testing-library/react';
import KpiCard from '../../components/ui/KpiCard';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Pipeline" value={9700000} prefix="R$ " />);
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/9\.700\.000/)).toBeInTheDocument();
  });

  it('renders change indicator', () => {
    render(<KpiCard title="MRR" value={207000} change={5.7} />);
    expect(screen.getByText(/\+5\.7%/)).toBeInTheDocument();
  });

  it('renders negative change', () => {
    render(<KpiCard title="Ticket" value={100} change={-2.4} />);
    expect(screen.getByText(/-2\.4%/)).toBeInTheDocument();
  });

  it('uses CSS variable styling', () => {
    const { container } = render(<KpiCard title="Test" value={100} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('rounded-2xl');
    expect(card.className).toContain('bg-[var(--bg-elevated)]');
  });

  it('renders icon when provided', () => {
    render(<KpiCard title="Test" value={100} icon={<span data-testid="icon">★</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders suffix', () => {
    const { container } = render(<KpiCard title="Win Rate" value={32} suffix="%" />);
    const valueEl = container.querySelector('p.text-2xl, p.font-bold');
    expect(valueEl?.textContent).toContain('%');
  });
});
