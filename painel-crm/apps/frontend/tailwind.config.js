/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3478f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        primary: {
          DEFAULT: '#3478f6',
          hover: '#2c6ae0',
        },
        accent: {
          DEFAULT: '#30d158',
        },
        danger: {
          DEFAULT: '#ff453a',
        },
        warning: {
          DEFAULT: '#ffd60a',
        },
      },
    },
  },
  plugins: [],
};
