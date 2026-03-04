import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../../components/ui/Avatar';

describe('Avatar', () => {
  it('shows initials when no src', () => {
    render(<Avatar name="Daniel Pegoraro" />);
    expect(screen.getByText('DP')).toBeInTheDocument();
  });

  it('shows single initial for single name', () => {
    render(<Avatar name="Daniel" />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders image when src provided', () => {
    render(<Avatar name="Test User" src="/avatar.jpg" />);
    const img = screen.getByAltText('Test User');
    expect(img).toHaveAttribute('src', '/avatar.jpg');
  });

  it('applies size classes', () => {
    const { container } = render(<Avatar name="Test" size="lg" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('h-12');
    expect(el.className).toContain('w-12');
  });

  it('has proper aria-label', () => {
    render(<Avatar name="Maria Silva" />);
    expect(screen.getByRole('img', { name: 'Maria Silva' })).toBeInTheDocument();
  });
});
