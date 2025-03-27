/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'main-text': '#2d3436',
        'american-river': '#636e72',
        'bright-yarrow': '#fdcb6e',
        'chi-gong': '#d63031',
        'city-lights': '#dfe6e9',
        'dracula-orchid': '#2d3436',
        'electron-blue': '#0984e3',
        'exodus-fruit': '#6c5ce7',
        'fade-green': '#00b894',
        'first-date': '#fab1a0',
        'green-darner-tail': '#74b9ff',
        'lynx-white': '#f5f6fa',
        'mint-leaf': '#00cec9',
        'orange-ville': '#e17055',
        'pico-8-pink': '#fd79a8',
        'pink-glamour': '#ff7675',
        'prunus-avium': '#e84393',
        'robins-egg-blue': '#00cec9',
        'shy-moment': '#a8e6cf',
        'sour-lemon': '#ffeaa7',
      },
      screens: {
        'xs': '320px',
        'sm': '481px',
        'md': '769px',
        'lg': '1025px',
        'xl': '1201px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};