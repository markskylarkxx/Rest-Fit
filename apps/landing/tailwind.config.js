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
          amber: {
            DEFAULT: "#F59E0B",
          },
        },
        fontFamily: {
          sans: ["Inter", "system-ui", "sans-serif"],
        },
        borderRadius: {
          card: "16px",
          button: "12px",
        },
      },
    },
    plugins: [],
  };