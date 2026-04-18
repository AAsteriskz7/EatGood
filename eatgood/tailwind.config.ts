import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#059669',
          light: '#10B981',
          muted: '#D1FAE5',
          subtle: '#ECFDF5',
        },
        surface: {
          base: '#F9FAFB',
          elevated: '#FFFFFF',
          muted: '#F3F4F6',
          strong: '#E5E7EB',
        },
        content: {
          primary: '#111827',
          secondary: '#4B5563',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          strong: '#D1D5DB',
        },
        feedback: {
          error: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-dm)', 'sans-serif'],
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        nav: '0 -1px 0 0 rgb(0 0 0 / 0.06)',
        action: '0 4px 16px 0 rgb(5 150 105 / 0.35)',
      },
      borderRadius: {
        card: '1rem',
        chip: '0.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
