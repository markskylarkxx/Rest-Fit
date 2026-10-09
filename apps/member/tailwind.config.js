/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0A0A0A",
        surface: "#141414",
        ink: "#F5F0EB",
        lime: {
          DEFAULT: "#C8FF00",
          hover: "#B8EF00",
        },
        // Aliases — this is the key move.
        // Every existing `brand-*` class becomes lime automatically.
        brand: {
          50: "#F5FFD9",
          100: "#EBFFB3",
          200: "#E0FF8C",
          300: "#D5FF66",
          400: "#CCFF33",
          500: "#C8FF00", // ← the real lime
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