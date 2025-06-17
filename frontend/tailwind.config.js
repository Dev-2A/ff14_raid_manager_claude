/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 게임스러운 블루 계열 색상
        primary: {
          50: '#e6f3ff',
          100: '#b3daff',
          200: '#80c1ff',
          300: '#4da8ff',
          400: '#1a8fff',
          500: '#0076e6',
          600: '#005db3',
          700: '#004480',
          800: '#002b4d',
          900: '#00121a',
        },
        // 다크 테마 색상
        dark: {
          50: '#4a5568',
          100: '#2d3748',
          200: '#1a202c',
          300: '#171923',
          400: '#0f1117',
          500: '#0a0c10',
          600: '#06080a',
          700: '#030405',
          800: '#010203',
          900: '#000000',
        },
        // 게임 UI 강조 색상
        accent: {
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
          legendary: '#ff8000',
          epic: '#a335ee',
          rare: '#0070dd',
          uncommon: '#1eff00',
          common: '#ffffff',
        },
        // 상태 색상
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        gaming: ['Orbitron', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'game-pattern': "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23004480' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
      },
      boxShadow: {
        'game': '0 0 20px rgba(0, 118, 230, 0.5)',
        'game-hover': '0 0 30px rgba(0, 118, 230, 0.8)',
        'inner-game': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}