import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  build: {
    // Mejorar code splitting para reducir el tamaño del bundle inicial
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["lucide-react", "html2canvas", "framer-motion"],
          charts: ["recharts"],
          utils: ["date-fns", "uuid", "canvas-confetti"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
