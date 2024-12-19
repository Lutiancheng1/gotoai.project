/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008997',
          dark: '#0367a6',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}

