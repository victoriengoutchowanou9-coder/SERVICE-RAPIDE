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
          50: '#eceaff',
          100: '#e0dcff',
          200: '#c7c1fb',
          500: '#5b50d6',
          600: '#4036ae',
          700: '#2b2670',
          800: '#231f5c',
          900: '#16133a',
        },
        safari: {
          yellow: '#f59e0b',
          orange: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}