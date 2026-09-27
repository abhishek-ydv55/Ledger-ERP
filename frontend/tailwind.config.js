/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      colors: {
        espresso: {
          50: '#F9F8F6',
          100: '#F2EFEA',
          200: '#E4DDD4',
          300: '#D0C4B4',
          400: '#B09F8C',
          500: '#8E7B68',
          600: '#6E5D4E',
          700: '#53453A',
          800: '#392F28',
          900: '#221C18',
          950: '#14100D',
        },
        brass: {
          50: '#FBF8EE',
          100: '#F5EFCF',
          200: '#EAD99B',
          300: '#DDC067',
          400: '#D4B043',
          500: '#C5A059',
          600: '#A37E3B',
          700: '#7E5D2E',
          800: '#644828',
          900: '#523A24',
          950: '#2C1D10',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
}

