/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Mực bút" — màu chủ đạo, thay cho blue-600 mặc định
        ink: {
          50: '#EEF0F8',
          100: '#DBDFF0',
          200: '#B7BFE1',
          300: '#8E98CB',
          400: '#5F68A0',
          500: '#3D3F72',
          600: '#2E3159',
          700: '#242747',
          800: '#1B1D36',
          900: '#141527',
        },
        paper: {
          DEFAULT: '#F6F7FB',
          dark: '#15161F',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
