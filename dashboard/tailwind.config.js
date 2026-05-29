/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#000000',
          900: '#050505',
          800: '#0B0B0C',
          700: '#171717',
          600: '#2A2A2A',
          500: '#3D3D3D',
          400: '#555555',
        },
        gold: {
          800: '#6F530F',
          700: '#8B6914',
          600: '#A87820',
          500: '#C4942A',
          400: '#D4A84A',
          300: '#E4C06E',
          200: '#EDD08E',
          100: '#F5E4B8',
        },
        premium: {
          black: '#000000',
          charcoal: '#101010',
          panel: '#161616',
          line: '#2A2418',
          offwhite: '#F5F5F0',
        },
        gray: {
          900: '#111111',
          800: '#1A1A1A',
          600: '#666666',
          500: '#A7A29A',
          400: '#BDB8AF',
          300: '#D7D2C8',
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
