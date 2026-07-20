/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#06080c',
          base: '#0c0f16',
          surface: '#161b26',
          surfaceLight: '#222938',
        },
        tech: {
          cyan: '#00ccff',
          purple: '#a855f7',
          amber: '#f59e0b',
          emerald: '#10b981',
          crimson: '#ef4444',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 208, 255, 0.2)',
        glowPurple: '0 0 20px rgba(168, 85, 247, 0.2)',
      }
    },
  },
  plugins: [],
}
