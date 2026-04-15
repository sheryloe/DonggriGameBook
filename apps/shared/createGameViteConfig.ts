import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig, type UserConfigExport } from "vite";
import react from "@vitejs/plugin-react";

type PartConfigInput = {
  appUrl: string;
  partId: "P1" | "P2" | "P3" | "P4";
  appId: string;
  outDirName: "part1" | "part2" | "part3" | "part4";
};

function normalizeModuleId(id: string): string {
  return id.replace(/\\/gu, "/");
}

function createManualChunks(id: string): string | undefined {
  const normalized = normalizeModuleId(id);

  if (normalized.includes("/node_modules/react/") || normalized.includes("/node_modules/react-dom/")) {
    return "vendor-react";
  }

  if (normalized.includes("/node_modules/react-router")) {
    return "vendor-router";
  }

  if (normalized.includes("/node_modules/zustand/")) {
    return "vendor-state";
  }

  if (normalized.includes("/node_modules/ajv/")) {
    return "vendor-ajv";
  }

  if (
    normalized.includes("/packages/app-runtime/src/loaders/contentLoader.ts") ||
    normalized.includes("/packages/app-runtime/src/assets/manifest.ts") ||
    normalized.includes("/packages/world-registry/")
  ) {
    return "runtime-content-core";
  }

  if (
    normalized.includes("/packages/app-runtime/src/assets/runtimeMedia.tsx") ||
    normalized.includes("/packages/app-runtime/src/content/")
  ) {
    return "runtime-app";
  }

  if (
    normalized.includes("/packages/app-runtime/src/App.tsx") ||
    normalized.includes("/packages/app-runtime/src/components/") ||
    normalized.includes("/packages/app-runtime/src/screens/") ||
    normalized.includes("/packages/app-runtime/src/styles/")
  ) {
    return "runtime-app";
  }

  if (
    normalized.includes("/packages/app-runtime/src/store/") ||
    normalized.includes("/packages/app-runtime/src/engine/") ||
    normalized.includes("/packages/app-runtime/src/types/") ||
    normalized.includes("/packages/app-runtime/src/app/") ||
    normalized.includes("/packages/app-runtime/src/lib/") ||
    normalized.includes("/packages/app-runtime/src/services/")
  ) {
    return "runtime-app";
  }

  return undefined;
}

export function createGameViteConfig(input: PartConfigInput): UserConfigExport {
  const appRoot = fileURLToPath(new URL(".", input.appUrl));
  const workspaceRoot = resolve(appRoot, "../..");

  return defineConfig({
    root: appRoot,
    publicDir: resolve(workspaceRoot, "public"),
    plugins: [react()],
    define: {
      "import.meta.env.VITE_PART_ID": JSON.stringify(input.partId),
      "import.meta.env.VITE_APP_ID": JSON.stringify(input.appId),
      "import.meta.env.VITE_SAVE_SLOT": JSON.stringify("main")
    },
    server: {
      fs: {
        allow: [workspaceRoot]
      }
    },
    build: {
      outDir: resolve(workspaceRoot, `dist/${input.outDirName}`),
      emptyOutDir: true,
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks: createManualChunks
        }
      }
    }
  });
}
