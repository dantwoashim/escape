import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: ["es2019", "chrome80"],
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
