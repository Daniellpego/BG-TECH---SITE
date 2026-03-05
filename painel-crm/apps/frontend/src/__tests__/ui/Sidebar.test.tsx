import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard',
}));

// Mock useAuth
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: null, logout: jest.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import Sidebar from '../../components/layout/Sidebar';

describe('Sidebar', () => {
  it('renders the BG Tech logo', () => {
    render(<Sidebar />);
    expect(screen.getByText('BG')).toBeInTheDocument();
    expect(screen.getByText('BG Tech')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Projetos')).toBeInTheDocument();
    expect(screen.getByText('SLAs')).toBeInTheDocument();
    expect(screen.getByText('Propostas')).toBeInTheDocument();
  });

  it('renders help and onboarding links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Tour Interativo')).toBeInTheDocument();
    expect(screen.getByText('Central de Ajuda')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(<Sidebar />);
    const dashLink = screen.getByText('Dashboard').closest('a');
    expect(dashLink?.className).toContain('text-[var(--primary)]');
  });

  it('can collapse sidebar', () => {
    render(<Sidebar />);
    const collapseBtn = screen.getByText('Recolher');
    fireEvent.click(collapseBtn);
    // After collapse, labels should be hidden (sidebar is 72px)
    expect(screen.queryByText('BG Tech')).not.toBeInTheDocument();
  });

  it('uses CSS variable colors', () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector('aside');
    expect(aside?.className).toContain('bg-[var(--bg-elevated)]');
    expect(aside?.className).toContain('border-[var(--border)]');
  });
});
