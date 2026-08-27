import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // ECharts dans son propre chunk : il change rarement, autant le laisser en cache.
        manualChunks: { echarts: ["echarts/core", "echarts/charts", "echarts/renderers"] },
      },
    },
  },
});
