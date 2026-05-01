import { fileURLToPath } from "node:url";
import { createReadStream, existsSync, mkdirSync, readdirSync, rmSync, statSync, copyFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { defineConfig, type Plugin, type UserConfigExport } from "vite";
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

function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return Boolean(rel) && !rel.startsWith("..") && !rel.startsWith(sep);
}

function mimeType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case ".css": return "text/css; charset=utf-8";
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "text/javascript; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".mp3": return "audio/mpeg";
    case ".wav": return "audio/wav";
    case ".webp": return "image/webp";
    case ".png": return "image/png";
    case ".svg": return "image/svg+xml";
    case ".txt": return "text/plain; charset=utf-8";
    default: return "application/octet-stream";
  }
}

function copyFile(source: string, target: string): void {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

function copyDir(source: string, target: string): void {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

function copyDirFiltered(source: string, target: string, shouldCopy: (sourcePath: string) => boolean): void {
  if (!existsSync(source)) return;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const targetPath = join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirFiltered(sourcePath, targetPath, shouldCopy);
    } else if (entry.isFile() && shouldCopy(sourcePath)) {
      copyFile(sourcePath, targetPath);
    }
  }
}

function chapterIdsForPart(partId: PartConfigInput["partId"]): string[] {
  const offset = Number(partId.slice(1)) - 1;
  return Array.from({ length: 5 }, (_, index) => `ch${String(offset * 5 + index + 1).padStart(2, "0")}`);
}

function shouldCopyGeneratedImage(fileName: string, partId: PartConfigInput["partId"]): boolean {
  const lower = fileName.toLowerCase();
  const chapterIds = chapterIdsForPart(partId);
  const partPrefix = partId.toLowerCase();
  const partOnePortraits = new Set([
    "portrait_npc_yoon_haein_ch01_anchor.webp",
    "portrait_npc_yoon_haein_ch04_support.webp",
    "portrait_npc_yoon_haein_ch05_support.webp",
    "portrait_npc_jung_noah_ch01_support.webp",
    "portrait_npc_jung_noah_ch02_anchor.webp",
    "portrait_npc_seo_jinseo_ch02_support.webp",
    "portrait_npc_ahn_bogyeong_ch03_anchor.webp",
    "portrait_npc_ryu_seon_ch03_support.webp",
    "portrait_npc_han_somyeong_ch04_anchor.webp",
    "portrait_npc_kim_ara_ch05_anchor.webp",
    "portrait_npc_cha_munsik_ch20_anchor.webp",
  ]);
  const partOneThreats = new Set([
    "threat_erosion_basic.webp",
    "threat_editing_aberration.webp",
    "threat_mirror_core_lines.webp",
    "threat_picker_prime.webp",
    "threat_sluice_sac_cheongeum.webp",
    "threat_vista_amalgam_glassgarden.webp",
    "threat_gate_mauler.webp",
    "threat_sorter.webp",
  ]);

  if (lower.includes("_v01.")) {
    return false;
  }

  if (partId === "P1" && lower.startsWith("p1_survival_failure_")) {
    return true;
  }

  if (lower.startsWith("portrait_") || lower.startsWith("threat_")) {
    if (partId === "P1") {
      return partOnePortraits.has(lower) || partOneThreats.has(lower);
    }

    return chapterIds.some((chapterId) => lower.includes(`_${chapterId}_`));
  }

  return chapterIds.some((chapterId) =>
    lower.includes(`_${chapterId}_`) ||
    lower.startsWith(`bg_${chapterId}_`) ||
    lower.startsWith(`poster_${chapterId}_`) ||
    lower.startsWith(`teaser_${chapterId}_`) ||
    lower.startsWith(`${partPrefix}_${chapterId}_`)
  );
}

function copyPartPublicAssets(workspaceRoot: string, outDirName: string, partId: PartConfigInput["partId"]): void {
  const publicRoot = resolve(workspaceRoot, "public");
  const outRoot = resolve(workspaceRoot, `dist/${outDirName}`);
  const partNumber = partId.slice(1);

  for (const fileName of ["manifest.json", "robots.txt", "_headers", "_redirects"]) {
    const source = join(publicRoot, fileName);
    if (existsSync(source)) {
      copyFile(source, join(outRoot, fileName));
    }
  }

  copyDir(join(publicRoot, "runtime-content"), join(outRoot, "runtime-content"));
  copyDir(join(publicRoot, "audio"), join(outRoot, "audio"));
  const ttsSource = join(publicRoot, "generated", "audio", "tts", partId);
  const hasCompressedTts = existsSync(ttsSource) && readdirSync(ttsSource, { recursive: true }).some((entry) => String(entry).toLowerCase().endsWith(".mp3"));
  copyDirFiltered(
    ttsSource,
    join(outRoot, "generated", "audio", "tts", partId),
    (sourcePath) => (hasCompressedTts ? sourcePath.toLowerCase().endsWith(".mp3") : sourcePath.toLowerCase().endsWith(".wav")),
  );
  copyDir(join(publicRoot, "generated", "audio", "sfx", partId), join(outRoot, "generated", "audio", "sfx", partId));
  copyDir(join(publicRoot, "generated", "audio", "bgm", partId), join(outRoot, "generated", "audio", "bgm", partId));

  const imagesRoot = join(publicRoot, "generated", "images");
  const targetImagesRoot = join(outRoot, "generated", "images");
  if (existsSync(imagesRoot)) {
    for (const entry of readdirSync(imagesRoot, { withFileTypes: true })) {
      if (entry.isFile() && shouldCopyGeneratedImage(entry.name, partId)) {
        copyFile(join(imagesRoot, entry.name), join(targetImagesRoot, entry.name));
      }
    }
  }

  const iconsRoot = join(publicRoot, "generated", "icons");
  if (existsSync(iconsRoot)) {
    copyDir(iconsRoot, join(outRoot, "generated", "icons"));
  }

  const staleVideos = join(outRoot, "generated", "videos");
  if (existsSync(staleVideos)) {
    rmSync(staleVideos, { recursive: true, force: true });
  }

  const staleInbox = join(outRoot, "generated", "images", "inbox");
  if (existsSync(staleInbox)) {
    rmSync(staleInbox, { recursive: true, force: true });
  }

  console.log(`[part-public-assets] copied ${partId} assets for part${partNumber}`);
}

function createPartPublicAssetsPlugin(workspaceRoot: string, input: PartConfigInput): Plugin {
  const publicRoot = resolve(workspaceRoot, "public");

  return {
    name: "part-public-assets",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = decodeURIComponent(String(req.url ?? "").split("?")[0] ?? "");
        const shouldServe =
          urlPath.startsWith("/generated/") ||
          urlPath.startsWith("/runtime-content/") ||
          urlPath.startsWith("/audio/") ||
          ["/manifest.json", "/robots.txt", "/_headers", "/_redirects"].includes(urlPath);

        if (!shouldServe) {
          next();
          return;
        }

        const filePath = resolve(publicRoot, `.${urlPath}`);
        if (!isInside(publicRoot, filePath) || !existsSync(filePath) || !statSync(filePath).isFile()) {
          next();
          return;
        }

        res.setHeader("Content-Type", mimeType(filePath));
        createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      copyPartPublicAssets(workspaceRoot, input.outDirName, input.partId);
    }
  };
}

export function createGameViteConfig(input: PartConfigInput): UserConfigExport {
  const appRoot = fileURLToPath(new URL(".", input.appUrl));
  const workspaceRoot = resolve(appRoot, "../..");

  return defineConfig({
    root: appRoot,
    publicDir: false,
    plugins: [react(), createPartPublicAssetsPlugin(workspaceRoot, input)],
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
