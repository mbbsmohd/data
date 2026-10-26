/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#1E5BF9',
          darkBlue: '#0F3ECC',
          green: '#00B977',
          mint: '#E6FAF2',
          card: '#F4F7FC',
        }
      }
    },
  },
  plugins: [],
}
