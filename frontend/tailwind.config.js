/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FF14 느낌의 파란색 계열 커스텀 색상
        primary: {
          50: '#e6f1ff',
          100: '#b3d4ff',
          200: '#80b8ff',
          300: '#4d9bff',
          400: '#1a7eff',
          500: '#0066e6',
          600: '#0052b3',
          700: '#003d80',
          800: '#00294d',
          900: '#001433',
        },
        secondary: {
          50: '#f0f4ff',
          100: '#d6e0ff',
          200: '#bdcdff',
          300: '#a3b9ff',
          400: '#8aa6ff',
          500: '#7092ff',
          600: '#5a7acc',
          700: '#436199',
          800: '#2d4866',
          900: '#162f33',
        },
        accent: {
          gold: '#ffd700',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        }
      },
      fontFamily: {
        'game': ['"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'game': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'game-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}