/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs'],
  theme: {
    extend: {
      colors: {
        flow: {
          bg: '#d9d9de',
          app: '#f8f8fa',
          panel: '#ffffff',
          line: '#e9e9ed',
          text: '#1f2128',
          muted: '#8b8f9a',
          hover: '#f3f4f7',
          accent: '#1f2937',
          warn: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        shell: '14px',
        card: '10px',
      },
    },
  },
  plugins: [],
};
