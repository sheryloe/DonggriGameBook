import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = resolve(appRoot, "../..");

export default defineConfig({
  root: appRoot,
  plugins: [react()],
  server: {
    fs: {
      allow: [workspaceRoot]
    }
  },
  build: {
    outDir: resolve(workspaceRoot, "dist/part3"),
    emptyOutDir: true
  }
});
