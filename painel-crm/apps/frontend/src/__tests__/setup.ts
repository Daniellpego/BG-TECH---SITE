import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true, // disable animations in tests
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: new Proxy({} as Record<string, React.FC<any>>, {
      get: (_target, prop: string) => {
        // Return a plain HTML element for each motion.* component
        return ({ children, ...props }: any) => {
          const React = require('react');
          // Remove motion-specific props
          const {
            initial, animate, exit, transition, whileHover, whileTap,
            whileDrag, whileFocus, whileInView, layout, variants,
            ...htmlProps
          } = props;
          return React.createElement(prop, htmlProps, children);
        };
      },
    }),
  };
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}
Object.defineProperty(window, 'IntersectionObserver', { value: MockIntersectionObserver });

// Mock matchMedia (for useReducedMotion)
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockReturnValue({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});
