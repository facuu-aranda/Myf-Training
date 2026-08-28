/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        ink: '#08070d',
        panel: '#12101b',
        violet: {
          400: '#b783ff',
          500: '#8b5cf6',
          600: '#7440d9',
        },
        magenta: '#ed5cff',
        cyan: '#6ee7f9',
      },
      boxShadow: {
        glow: '0 0 50px rgba(139,92,246,.18)',
        'glow-sm': '0 0 24px rgba(139,92,246,.18)',
      },
    },
  },
  plugins: [],
}
