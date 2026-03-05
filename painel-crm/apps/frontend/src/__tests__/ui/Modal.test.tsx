import React from 'react';
import { render, screen } from '@testing-library/react';
import Modal from '../../components/ui/Modal';

describe('Modal', () => {
  it('renders title and children when open', () => {
    render(
      <Modal isOpen onClose={jest.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()} title="Hidden Modal">
        <p>Hidden</p>
      </Modal>,
    );
    expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
  });

  it('uses Apple-style rounded-2xl', () => {
    const { container } = render(
      <Modal isOpen onClose={jest.fn()} title="Styled">
        <p>Content</p>
      </Modal>,
    );
    const dialog = container.querySelector('.rounded-2xl');
    expect(dialog).toBeInTheDocument();
  });
});
