/** @type {import('tailwindcss').Config} */
const nativewind = require('nativewind/preset');

module.exports = {
  presets: [nativewind],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chai: {
          bg: '#FFFBF5',
          surface: '#FFFFFF',
          primary: '#E8751A',
          accent: '#F7B733',
          'text-primary': '#3E2723',
          'text-secondary': '#757575',
          success: '#2E7D32',
          error: '#C62828',
          divider: '#EDE7E1',
        },
      },
    },
  },
  plugins: [],
};