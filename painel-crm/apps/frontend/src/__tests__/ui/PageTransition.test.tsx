import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/ui/PageTransition';

describe('PageTransition', () => {
  it('renders children', () => {
    render(
      <PageTransition>
        <p>Page content</p>
      </PageTransition>
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('wraps children in a div', () => {
    const { container } = render(
      <PageTransition>
        <p>Hello</p>
      </PageTransition>
    );
    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});

describe('StaggerContainer + StaggerItem', () => {
  it('renders all stagger items', () => {
    render(
      <StaggerContainer>
        <StaggerItem><span>Item 1</span></StaggerItem>
        <StaggerItem><span>Item 2</span></StaggerItem>
        <StaggerItem><span>Item 3</span></StaggerItem>
      </StaggerContainer>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <StaggerContainer className="grid-custom">
        <StaggerItem><span>A</span></StaggerItem>
      </StaggerContainer>
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('grid-custom');
  });
});
