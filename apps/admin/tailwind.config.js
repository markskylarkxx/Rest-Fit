/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F5FFD9",
          100: "#EBFFB3",
          200: "#E0FF8C",
          300: "#D5FF66",
          400: "#CCFF33",
          500: "#C8FF00",
          600: "#B8EF00",
          700: "#A3D600",
          800: "#7FA600",
          900: "#5C7A00",
        },
      },
    },
  },
  plugins: [],
};