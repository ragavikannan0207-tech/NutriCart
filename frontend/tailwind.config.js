/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // NutriCart brand palette — deep forest green + sage accents on warm cream
        forest: {
          50: '#f1f7f2',
          100: '#dcecdf',
          200: '#bbd8c1',
          300: '#8fbd99',
          400: '#5f9c6d',
          500: '#3f7f4e',
          600: '#2f663c',
          700: '#285231',
          800: '#22422a',
          900: '#1d3724',
          950: '#0e1f14',
        },
        sage: {
          50: '#f5f7f3',
          100: '#e8ede2',
          200: '#d2dcc7',
          300: '#b0c2a0',
          400: '#8ba376',
          500: '#6d8758',
          600: '#546b43',
          700: '#425336',
          800: '#37442e',
          900: '#2f3a29',
        },
        cream: {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f4efe2',
          300: '#ebe3d0',
          400: '#ded2b6',
        },
        ink: {
          500: '#5b6b60',
          600: '#42534a',
          700: '#2f3d35',
          800: '#23302a',
          900: '#182320',
        },
        clay: {
          100: '#fdeee6',
          400: '#e08a5f',
          500: '#c96f42',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 35, 32, 0.04), 0 6px 18px -8px rgba(24, 35, 32, 0.12)',
        lift: '0 2px 4px rgba(24, 35, 32, 0.05), 0 18px 38px -18px rgba(24, 35, 32, 0.25)',
        inset: 'inset 0 1px 2px rgba(24, 35, 32, 0.04)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'fade-in-up': 'fade-in-up 260ms ease-out both',
        'slide-in-right': 'slide-in-right 260ms ease-out both',
        'scale-in': 'scale-in 180ms ease-out both',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
