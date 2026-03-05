/**
 * Design Tokens — BG Tech CRM (Apple-minimal edition)
 *
 * Central source of truth for colors, spacing, radii, fonts, and motion tokens.
 * Inspired by Apple's Human Interface Guidelines: clean, generous whitespace,
 * refined typography, subtle depth through shadows rather than borders.
 */

export const colors = {
  primary: {
    50: '#f0f5ff',
    100: '#e0ebff',
    200: '#c2d6ff',
    300: '#94b8ff',
    400: '#6699ff',
    500: '#3478f6',
    600: '#2361d9',
    700: '#1a4db3',
    800: '#143d8c',
    900: '#0f2e66',
  },
  accent: {
    50: '#effcf6',
    100: '#d0f5e3',
    200: '#a2ebc8',
    300: '#5ed8a0',
    400: '#30c77d',
    500: '#1aad65',
    600: '#128c50',
    700: '#0e6e3f',
    800: '#0b5731',
    900: '#084025',
  },
  danger: {
    50: '#fff1f1',
    100: '#ffe0e0',
    200: '#ffc7c7',
    400: '#ff6b6b',
    500: '#ff3b30',
    600: '#d92d24',
    700: '#b31e18',
  },
  warning: {
    50: '#fff9eb',
    100: '#fff0c7',
    400: '#ffcc00',
    500: '#f5a623',
    600: '#d4901e',
  },
  surface: {
    dark: {
      bg: '#000000',
      elevated: '#1c1c1e',
      card: '#1c1c1e',
      hover: '#2c2c2e',
      border: '#38383a',
      muted: '#636366',
      text: '#f5f5f7',
      textSecondary: '#a1a1a6',
      textTertiary: '#636366',
    },
    light: {
      bg: '#f5f5f7',
      elevated: '#ffffff',
      card: '#ffffff',
      hover: '#f0f0f2',
      border: '#d2d2d7',
      muted: '#8e8e93',
      text: '#1d1d1f',
      textSecondary: '#6e6e73',
      textTertiary: '#8e8e93',
    },
  },
} as const;

export const spacing = {
  '2xs': '0.125rem',
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3rem',
  '4xl': '4rem',
} as const;

export const radii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const fonts = {
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const motion = {
  quick: { duration: 0.16, ease: [0.2, 0.0, 0.0, 1.0] },
  medium: { duration: 0.28, ease: [0.2, 0.0, 0.0, 1.0] },
  slow: { duration: 0.44, ease: [0.2, 0.0, 0.0, 1.0] },
  spring: { type: 'spring' as const, stiffness: 350, damping: 30 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 18 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
} as const;

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 8px 28px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04)',
  xl: '0 16px 48px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.06)',
  glow: '0 0 20px rgba(52, 120, 246, 0.15)',
  glowAccent: '0 0 20px rgba(26, 173, 101, 0.15)',
} as const;
