// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        // Add custom color palette
        colors: {
          'brand-darkest': '#001219',     // Prussian Blue
          'brand-dark': '#005f73',        // Midnight Green
          'brand-primary': '#0a9396',     // Persian Green
          'brand-light': '#94d2bd',       // Middle Blue Green
          'brand-lightest': '#e9d8a6',    // Pale Goldenrod
          'accent-primary': '#ee9b00',    // Gamboge (Orange)
          'accent-secondary': '#ca6702', // Ochre
          'accent-dark': '#bb3e03',      // Rust
          'danger-dark': '#ae2012',       // Rufous
          'danger-darker': '#9b2226',     // Ruby Red
        }
      },
    },
    plugins: [],
  }