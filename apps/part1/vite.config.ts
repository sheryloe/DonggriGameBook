import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = resolve(appRoot, "../..");

export default defineConfig({
  root: appRoot,
  plugins: [react()],
  define: {
    "import.meta.env.VITE_PART_ID": JSON.stringify("P1"),
    "import.meta.env.VITE_APP_ID": JSON.stringify("donggrolgamebook-p1"),
    "import.meta.env.VITE_SAVE_SLOT": JSON.stringify("main")
  },
  server: {
    fs: {
      allow: [workspaceRoot]
    }
  },
  build: {
    outDir: resolve(workspaceRoot, "dist/part1"),
    emptyOutDir: true
  }
});
