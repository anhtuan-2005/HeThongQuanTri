/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1677ff',
      },
      boxShadow: {
        soft: '0 12px 40px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
}
