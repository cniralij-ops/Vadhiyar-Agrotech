import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer source TS/TSX modules when both TS and transpiled JS files exist.
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"]
  },
  server: {
    port: 5174
  }
});
