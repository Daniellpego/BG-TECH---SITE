import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../../components/ui/Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies success variant styles', () => {
    render(<Badge variant="success">OK</Badge>);
    const badge = screen.getByText('OK');
    expect(badge.className).toContain('text-green');
  });

  it('applies danger variant styles', () => {
    render(<Badge variant="danger">Error</Badge>);
    const badge = screen.getByText('Error');
    expect(badge.className).toContain('text-red');
  });

  it('renders dot indicator', () => {
    const { container } = render(<Badge variant="success" dot>Active</Badge>);
    const dot = container.querySelector('.rounded-full.bg-green-400');
    expect(dot).toBeInTheDocument();
  });

  it('supports small size', () => {
    render(<Badge size="sm">Small</Badge>);
    const badge = screen.getByText('Small');
    expect(badge.className).toContain('text-[10px]');
  });
});
