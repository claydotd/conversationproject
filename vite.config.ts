import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import netlify from "@netlify/vite-plugin";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // This site uses Functions, Blobs, and Database — not Edge Functions.
    // Starting the Edge emulator currently fails: Deno 2.9+ rejects the
    // `--allow-scripts` flag that @netlify/edge-functions-dev still passes.
    netlify({
      edgeFunctions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@shared": path.resolve(rootDir, "shared"),
    },
  },
});
