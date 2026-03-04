import React from 'react';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with aria-hidden', () => {
    const { container } = render(<Skeleton className="h-4 w-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies pulse animation class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
  });

  it('applies correct rounded class', () => {
    const { container } = render(<Skeleton rounded="full" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('rounded-full');
  });

  it('applies inline width and height styles', () => {
    const { container } = render(<Skeleton width="200px" height="40px" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('40px');
  });
});

describe('SkeletonCard', () => {
  it('renders 3 skeleton bars', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons).toHaveLength(3);
  });
});

describe('SkeletonTable', () => {
  it('renders header + 5 rows by default', () => {
    const { container } = render(<SkeletonTable />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons).toHaveLength(6); // 1 header + 5 rows
  });

  it('renders custom number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons).toHaveLength(4); // 1 header + 3 rows
  });
});
