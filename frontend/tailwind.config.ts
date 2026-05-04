import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#ffffff',
          surface: '#ffffff',
          card: '#ffffff',
          hover: '#f4f4f5',
        },
        brand: {
          from: '#18181b',
          to: '#27272a',
          500: '#18181b',
          600: '#000000',
        },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        text: {
          primary: '#09090b',
          secondary: '#52525b',
          muted: '#a1a1aa',
          faint: '#d4d4d8',
        },
        border: {
          DEFAULT: '#e4e4e7',
          bright: '#d4d4d8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
        'gradient-surface': 'none',
        'gradient-card': 'none',
        'gradient-sidebar': 'none',
      },
      backdropBlur: {
        xs: '2px',
        card: '12px',
      },
      borderRadius: {
        card: '24px',
        btn: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.02), 0 10px 40px -10px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 6px rgba(0, 0, 0, 0.02), 0 20px 40px -10px rgba(0,0,0,0.05)',
        glow: 'none',
        btn: '0 1px 2px rgba(0,0,0,0.05)',
        'btn-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
