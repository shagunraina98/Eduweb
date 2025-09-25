/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00CFFF',
        secondary: '#FFD7A4',
        muted: '#9F9884',
        background: '#F5F7FA',
        card: '#FFFFFF',
        textPrimary: '#1F1F1F',
        textSecondary: '#6B6B6B',
      }
    }
  },
  plugins: []
}
