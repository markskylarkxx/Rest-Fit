import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Lets the app call /api without CORS during development.
    proxy: { "/api": "http://localhost:4000" },
  },
});
