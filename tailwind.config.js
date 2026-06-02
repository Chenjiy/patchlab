/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        display: ['"ZCOOL KuaiLe"', 'serif'],
      },
      colors: {
        background: '#FAF7F2',
        card: '#FFFFFF',
        primary: { DEFAULT: '#D8A7B1', dark: '#C48D9A', light: '#EDD5DB' },
        secondary: { DEFAULT: '#BFD8C2', dark: '#A3C4A8' },
        accent: { DEFAULT: '#E9D8A6', dark: '#D4C080' },
        'text-primary': '#4A3F3A',
        'text-secondary': '#8A7F78',
        border: '#E8DED6',
        canvas: '#F4EFE7',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(74,63,58,0.08)',
        card: '0 4px 20px rgba(74,63,58,0.10)',
        'card-hover': '0 8px 32px rgba(74,63,58,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

