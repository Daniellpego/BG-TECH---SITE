import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          navy: '#0A1628',
          card: '#131F35',
          hover: '#182640',
          input: '#0F1D32',
        },
        brand: {
          blue: '#1A6AAA',
          cyan: '#00C8F0',
          'cyan-light': '#40D8EE',
          'cyan-lighter': '#80EEFF',
          'blue-secondary': '#2B7AB5',
          'blue-deep': '#153B5F',
        },
        status: {
          positive: '#10B981',
          negative: '#EF4444',
          warning: '#F59E0B',
        },
        text: {
          primary: '#F0F4F8',
          secondary: '#94A3B8',
          dark: '#475569',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  plugins: [],
}
export default config
