/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH lets GitHub Pages serve the site from /<repo>/.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  test: { include: ["tests/**/*.test.ts"] },
});
