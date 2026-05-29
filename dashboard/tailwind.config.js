/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060E1A',
          900: '#0A1628',
          800: '#0D1F3C',
          700: '#142D58',
          600: '#1A3A70',
          500: '#1F4788',
          400: '#2554A0',
        },
        gold: {
          700: '#8B6914',
          600: '#A87820',
          500: '#C4942A',
          400: '#D4A84A',
          300: '#E4C06E',
          200: '#EDD08E',
          100: '#F5E4B8',
        },
        gray: {
          900: '#111827',
          800: '#1F2937',
          600: '#4B5563',
          500: '#ADB5BD',
          400: '#9CA3AF',
          300: '#D1D5DB',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
