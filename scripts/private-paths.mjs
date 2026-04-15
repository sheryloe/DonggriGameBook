import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, "..");

export const PRIVATE_ROOT = path.join(REPO_ROOT, "private");
export const PRIVATE_STORY_ROOT = path.join(PRIVATE_ROOT, "story");
export const PRIVATE_STORY_CONCEPT_ROOT = path.join(PRIVATE_STORY_ROOT, "concept_arc_01_05");
export const PRIVATE_STORY_WORLD_ROOT = path.join(PRIVATE_STORY_ROOT, "world");

export const PRIVATE_CONTENT_ROOT = path.join(PRIVATE_ROOT, "content");
export const PRIVATE_CONTENT_MANIFEST = path.join(PRIVATE_CONTENT_ROOT, "package_manifest.json");
export const PRIVATE_CONTENT_DATA_ROOT = path.join(PRIVATE_CONTENT_ROOT, "data");
export const PRIVATE_CONTENT_UI_ROOT = path.join(PRIVATE_CONTENT_ROOT, "ui");

export const PRIVATE_PROMPTS_ROOT = path.join(PRIVATE_ROOT, "prompts");
export const PRIVATE_PROMPTS_ANTIGRAVITY_ROOT = path.join(PRIVATE_PROMPTS_ROOT, "antigravity");
export const PRIVATE_PROMPTS_GEMINI_ROOT = path.join(PRIVATE_PROMPTS_ROOT, "gemini-lyria3");

export const PRIVATE_GENERATED_ROOT = path.join(PRIVATE_ROOT, "generated");
export const PRIVATE_PACKAGED_ROOT = path.join(PRIVATE_GENERATED_ROOT, "packaged");
export const PRIVATE_PACKAGED_IMAGES_ROOT = path.join(PRIVATE_PACKAGED_ROOT, "images");
export const PRIVATE_LEGACY_ROOT = path.join(PRIVATE_GENERATED_ROOT, "legacy");
export const PRIVATE_LEGACY_IMG_ROOT = path.join(PRIVATE_LEGACY_ROOT, "img");
export const PRIVATE_LEGACY_MUSIC_ROOT = path.join(PRIVATE_LEGACY_ROOT, "music");

export const PUBLIC_ROOT = path.join(REPO_ROOT, "public");
export const PUBLIC_GENERATED_ROOT = path.join(PUBLIC_ROOT, "generated");
export const PUBLIC_RUNTIME_CONTENT_ROOT = path.join(PUBLIC_ROOT, "runtime-content");

export function toPosix(value) {
  return String(value).replace(/\\/g, "/");
}

export function relFromRoot(value) {
  return toPosix(path.relative(REPO_ROOT, value));
}

export function resolveRepo(...segments) {
  return path.join(REPO_ROOT, ...segments);
}

export function normalizeRepoPath(value) {
  if (!value) {
    return value;
  }

  const normalized = toPosix(String(value).trim());
  if (!normalized) {
    return normalized;
  }

  if (normalized.startsWith("private/") || normalized.startsWith("public/") || normalized.startsWith("schemas/")) {
    return normalized;
  }

  if (normalized === "package_manifest.json") {
    return "private/content/package_manifest.json";
  }

  if (normalized.startsWith("docs/concept_arc_01_05_md/")) {
    return normalized.replace("docs/concept_arc_01_05_md/", "private/story/concept_arc_01_05/");
  }

  if (normalized.startsWith("docs/world/")) {
    return normalized.replace("docs/world/", "private/story/world/");
  }

  if (normalized.startsWith("docs/asset-prompt-pack/")) {
    return normalized.replace("docs/asset-prompt-pack/", "private/prompts/antigravity/");
  }

  if (normalized.startsWith("docs/audio-prompt-pack/")) {
    return normalized.replace("docs/audio-prompt-pack/", "private/prompts/gemini-lyria3/");
  }

  if (normalized.startsWith("codex_webgame_pack/data/")) {
    return normalized.replace("codex_webgame_pack/data/", "private/content/data/");
  }

  if (normalized.startsWith("data/")) {
    return normalized.replace("data/", "private/content/data/");
  }

  if (normalized.startsWith("codex_webgame_pack/img/")) {
    return normalized.replace("codex_webgame_pack/img/", "private/generated/packaged/images/");
  }

  if (normalized.startsWith("ui/")) {
    return normalized.replace("ui/", "private/content/ui/");
  }

  if (normalized.startsWith("img/")) {
    return normalized.replace("img/", "private/generated/legacy/img/");
  }

  if (normalized.startsWith("music/")) {
    return normalized.replace("music/", "private/generated/legacy/music/");
  }

  return normalized;
}

export function resolveNormalizedRepoPath(value) {
  return path.join(REPO_ROOT, ...toPosix(normalizeRepoPath(value)).split("/"));
}

export function normalizeAssetDirectory(value) {
  return normalizeRepoPath(String(value ?? "").replace(/\/?$/u, "/"));
}
