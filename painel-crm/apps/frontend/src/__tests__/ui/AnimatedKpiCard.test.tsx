import React from 'react';
import { render, screen } from '@testing-library/react';
import { AnimatedKpiCard } from '../../components/ui/AnimatedKpiCard';

// useReducedMotion is mocked to return true in setup.ts,
// so useCountAnimation immediately returns target value.

describe('AnimatedKpiCard', () => {
  it('renders title', () => {
    render(<AnimatedKpiCard title="Revenue" value={1000} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders value with prefix and suffix', () => {
    render(<AnimatedKpiCard title="MRR" value={5000} prefix="R$ " suffix="/mês" />);
    // With reduced motion, value should immediately be 5000
    expect(screen.getByText(/R\$/)).toBeInTheDocument();
  });

  it('shows positive change indicator', () => {
    render(<AnimatedKpiCard title="Growth" value={100} change={12} />);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/12%/)).toBeInTheDocument();
  });

  it('shows negative change indicator', () => {
    render(<AnimatedKpiCard title="Churn" value={5} change={-3} />);
    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/3%/)).toBeInTheDocument();
  });

  it('shows neutral change indicator for zero', () => {
    render(<AnimatedKpiCard title="Flat" value={50} change={0} />);
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <AnimatedKpiCard title="Tasks" value={42} icon={<span data-testid="kpi-icon">📊</span>} />
    );
    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedKpiCard title="Test" value={10} className="custom-kpi" />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-kpi');
  });
});
