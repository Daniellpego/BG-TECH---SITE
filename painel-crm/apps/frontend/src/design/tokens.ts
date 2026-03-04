/**
 * Design Tokens — BG Tech CRM
 *
 * Central source of truth for colors, spacing, radii, fonts, and motion tokens.
 * Consumed by Tailwind config and ThemeProvider.
 */

export const colors = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  accent: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  surface: {
    dark: {
      bg: '#0f172a',       // slate-900
      card: '#1e293b',     // slate-800
      hover: '#334155',    // slate-700
      border: '#475569',   // slate-600
      muted: '#64748b',    // slate-500
      text: '#f1f5f9',     // slate-100
      textMuted: '#94a3b8', // slate-400
    },
    light: {
      bg: '#f8fafc',
      card: '#ffffff',
      hover: '#f1f5f9',
      border: '#e2e8f0',
      muted: '#94a3b8',
      text: '#0f172a',
      textMuted: '#64748b',
    },
  },
} as const;

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
} as const;

export const radii = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
} as const;

export const fonts = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const motion = {
  quick: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  medium: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  slow: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  glow: '0 0 20px rgb(59 130 246 / 0.3)',
} as const;
