import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const PROMPT_ROOT = path.join(REPO_ROOT, "private", "prompts", "antigravity");

export const PRESENTATION_PROMPT_VERSION = "1.1.0";
export const PRESENTATION_PARTS = ["P2", "P3", "P4"];
export const PRESENTATION_VIDEO_DIR_BY_PART = {
  P2: "part2-video-prompts",
  P3: "part3-video-prompts",
  P4: "part4-video-prompts",
};
export const PRESENTATION_POSTER_DIR_BY_PART = {
  P2: "part2-poster-prompts",
  P3: "part3-poster-prompts",
  P4: "part4-poster-prompts",
};

const PART_META = {
  P2: { title: "Southern Checkpoint Descent", title_ko: "Part 2", minutes: 30 },
  P3: { title: "Cold Quarantine Line", title_ko: "Part 3", minutes: 30 },
  P4: { title: "Outer Sea Moral Gate", title_ko: "Part 4", minutes: 40 },
};

function exists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/u, ""));
  } catch {
    return fallback;
  }
}

function readText(filePath, fallback = "") {
  try {
    return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/u, "");
  } catch {
    return fallback;
  }
}

function normalizeStoryPath(value) {
  return String(value ?? "")
    .replace(/\\/g, "/")
    .replace(/^docs\/world\//u, "private/story/world/");
}

function extractSection(markdown, heading) {
  const regex = new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?:\\n## |$)`, "u");
  return markdown.match(regex)?.[1]?.trim() ?? "";
}

function extractFence(section) {
  const match = section.match(/```(?:text)?\s*([\s\S]*?)```/u);
  return match ? match[1].trim() : section.trim();
}

function parseHeader(markdown) {
  const headerBlock = extractSection(markdown, "Header");
  const header = {};
  for (const line of headerBlock.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) {
      continue;
    }
    const sep = trimmed.indexOf(":");
    if (sep === -1) {
      continue;
    }
    const key = trimmed.slice(2, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    header[key] = value;
  }
  return header;
}

function loadVideoPackage(partId) {
  const dirName = PRESENTATION_VIDEO_DIR_BY_PART[partId];
  const dirPath = path.join(PROMPT_ROOT, dirName);
  const manifest = readJson(path.join(dirPath, "manifest.json"), { prompts: [] });
  const promptFiles = (manifest.prompts ?? []).map((entry) => readJson(path.join(dirPath, entry.file), { ...entry, part_id: partId }));
  const endings = promptFiles.filter((entry) => entry.kind === "ending");
  const trailer = promptFiles.find((entry) => entry.kind === "trailer") ?? {
    video_id: `${partId}_TRAILER_MAIN`,
    scene_id: `${partId}_TRAILER`,
    duration: 45,
    source_art_key: `${partId.toLowerCase()}_trailer`,
    prompt_en: `${partId} trailer prompt placeholder`,
    prompt_ko_context: "",
    camera_notes: "",
    audio_notes: "",
  };
  const chapterTargets = promptFiles
    .filter((entry) => entry.kind === "opening" && entry.chapter_id)
    .map((entry) => ({ chapter_id: entry.chapter_id, minutes: 0, beat: entry.scene_id ?? entry.video_id }));

  return { trailer, endings, chapterTargets };
}

function loadPosterPackage(partId) {
  const dirName = PRESENTATION_POSTER_DIR_BY_PART[partId];
  const dirPath = path.join(PROMPT_ROOT, dirName);
  const manifest = readJson(path.join(dirPath, "manifest.json"), { posters: [] });

  return (manifest.posters ?? []).map((poster) => {
    const markdown = readText(path.join(dirPath, poster.file), "");
    const header = parseHeader(markdown);
    return {
      poster_id: poster.poster_id,
      category: poster.category,
      target_path: normalizeStoryPath(poster.target_path),
      source_art_key_hint: poster.source_art_key_hint,
      prompt_en: extractFence(extractSection(markdown, "English Prompt")),
      prompt_ko_context: extractSection(markdown, "Narrative Lens"),
      composition_notes: extractSection(markdown, "Composition Notes"),
      file: poster.file,
      header,
    };
  });
}

function buildPackage(partId) {
  const meta = PART_META[partId];
  const videos = loadVideoPackage(partId);
  const posters = loadPosterPackage(partId);

  return {
    part_id: partId,
    title: meta.title,
    title_ko: meta.title_ko,
    hook: `${partId} presentation package`,
    playtime_target_minutes: meta.minutes,
    chapter_targets: videos.chapterTargets,
    trailer: videos.trailer,
    endings: videos.endings,
    posters,
    demo_route: videos.chapterTargets.map((entry) => entry.chapter_id),
  };
}

export const PART_PRESENTATION_PACKAGES = Object.fromEntries(
  PRESENTATION_PARTS.map((partId) => [partId, buildPackage(partId)]),
);
