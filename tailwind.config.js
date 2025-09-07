/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust to your project structure
  ],
  theme: {
    extend: {}, // Extend Tailwind theme here if needed
  },
  plugins: [
    // Custom plugin to hide scrollbars
    ({ addUtilities }) => {
      addUtilities({
        /* Universal scrollbar hide */
        ".scrollbar-hide": {
          "scrollbar-width": "none", // Firefox
          "-ms-overflow-style": "none", // IE 10+
        },
        /* Webkit browsers (Chrome, Safari, Opera) */
        ".scrollbar-hide::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};
