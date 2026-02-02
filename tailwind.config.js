/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0D17',
          800: '#0F1117',
          700: '#151824',
          600: '#1A1F2E',
          500: '#252A3A',
        },
        accent: {
          primary: '#10B981',
          dark: '#059669',
          light: '#34D399',
          mint: '#ECFDF5',
          emerald: '#10B981',
        },
      },
    },
  },
  plugins: [],
}
