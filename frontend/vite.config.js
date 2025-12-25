import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 👈 KHỐI SERVER MỚI ĐƯỢC THÊM
    proxy: {
      // Khi Frontend gọi /api/..., nó sẽ chuyển đến cổng 5001
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
