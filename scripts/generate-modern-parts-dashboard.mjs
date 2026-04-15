import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = process.cwd();
const CHAPTER_DIR = path.join(ROOT_DIR, "private", "content", "data", "chapters");
const ASSET_PROMPT_DIR = path.join(ROOT_DIR, "private", "prompts", "antigravity");
const OUTPUT_FILE = path.join(ROOT_DIR, "modern-ops-dashboard.html");

const PARTS = [
  {
    id: "P1",
    label: "Part 1",
    summary: "CH01-CH05",
    chapters: ["CH01", "CH02", "CH03", "CH04", "CH05"]
  },
  {
    id: "P2",
    label: "Part 2",
    summary: "CH06-CH10",
    chapters: ["CH06", "CH07", "CH08", "CH09", "CH10"]
  },
  {
    id: "P3",
    label: "Part 3",
    summary: "CH11-CH15",
    chapters: ["CH11", "CH12", "CH13", "CH14", "CH15"]
  },
  {
    id: "P4",
    label: "Part 4",
    summary: "CH16-CH20",
    chapters: ["CH16", "CH17", "CH18", "CH19", "CH20"]
  }
];

const ASSET_TYPE_TO_DIR = {
  background: "private/generated/packaged/images/bg",
  portrait: "private/generated/packaged/images/portrait",
  poster: "private/generated/packaged/images/poster",
  teaser: "private/generated/packaged/images/teaser",
  threat: "private/generated/packaged/images/threat",
  items: "private/generated/packaged/images/items",
  item: "private/generated/packaged/images/items"
};

function toPosix(value) {
  return String(value || "").replaceAll("\\", "/");
}

function normalizeRelPath(value) {
  const raw = toPosix(value).trim();
  if (!raw) {
    return "";
  }
  if (/^[a-zA-Z]:\//u.test(raw)) {
    return raw;
  }
  return raw.replace(/^\.\/+/u, "").replace(/^\/+/u, "");
}

function absPathFromRel(relPath) {
  if (!relPath) {
    return "";
  }
  if (/^[a-zA-Z]:\//u.test(relPath)) {
    return relPath;
  }
  return path.join(ROOT_DIR, relPath.replaceAll("/", path.sep));
}

function fileExists(relPath) {
  const abs = absPathFromRel(relPath);
  if (!abs) {
    return false;
  }
  return fs.existsSync(abs);
}

function readJsonWithBom(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/u, "");
  return JSON.parse(raw);
}

function listFilesRecursive(baseDir, predicate) {
  const result = [];
  if (!fs.existsSync(baseDir)) {
    return result;
  }
  const stack = [baseDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!predicate || predicate(fullPath)) {
        result.push(fullPath);
      }
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
}

function chapterFilePath(chapterId) {
  const no = String(chapterId).replace(/^CH/u, "").toLowerCase();
  return path.join(CHAPTER_DIR, `ch${no}.json`);
}

function cleanText(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    return fallback;
  }
  if (text.includes("\uFFFD") || text.includes("??")) {
    return fallback;
  }
  return text;
}

function inferPartId(chapterId) {
  for (const part of PARTS) {
    if (part.chapters.includes(chapterId)) {
      return part.id;
    }
  }
  return "P1";
}

function loadChapterData() {
  const byChapter = new Map();
  for (const part of PARTS) {
    for (const chapterId of part.chapters) {
      const chapterPath = chapterFilePath(chapterId);
      const chapterJson = readJsonWithBom(chapterPath);
      const questTracks = Array.isArray(chapterJson.quest_tracks) ? chapterJson.quest_tracks : [];
      const events = Array.isArray(chapterJson.events) ? chapterJson.events : [];

      const storyLines = questTracks
        .filter((track) => track.kind === "main")
        .map((track) => ({
          id: String(track.quest_track_id || "main_track"),
          title: cleanText(track.title, String(track.quest_track_id || "main_track")),
          summary: cleanText(track.summary, ""),
          entry_event_id: String(track.entry_event_id || "-"),
          completion_event_id: String(track.completion_event_id || "-")
        }));

      const sideQuests = questTracks
        .filter((track) => track.kind === "side")
        .map((track) => ({
          id: String(track.quest_track_id || "side_track"),
          title: cleanText(track.title, String(track.quest_track_id || "side_track")),
          summary: cleanText(track.summary, ""),
          entry_event_id: String(track.entry_event_id || "-"),
          completion_event_id: String(track.completion_event_id || "-")
        }));

      const branchQuests = events
        .filter((event) => Array.isArray(event.choices) && event.choices.length >= 2)
        .map((event) => ({
          id: String(event.event_id || "event"),
          title: cleanText(event.title, String(event.event_id || "event")),
          event_type: String(event.event_type || "unknown"),
          choices: event.choices.length
        }));

      byChapter.set(chapterId, {
        chapter_id: chapterId,
        title: cleanText(chapterJson.title, chapterId),
        story_lines: storyLines,
        side_quests: sideQuests,
        branch_quests: branchQuests
      });
    }
  }
  return byChapter;
}

function resolveImageCandidates(asset) {
  const filename = normalizeRelPath(asset.filename_target || "");
  const dropInbox = normalizeRelPath(asset.drop_inbox_path || "");
  const syncTarget = normalizeRelPath(asset.sync_target_path || "");
  const byTypeDir = ASSET_TYPE_TO_DIR[String(asset.asset_type || "").toLowerCase()] || "";
  const candidates = [];

  if (filename && dropInbox) {
    candidates.push(normalizeRelPath(path.posix.join(dropInbox, path.posix.basename(filename))));
  }
  if (filename) {
    candidates.push(normalizeRelPath(path.posix.join("public/generated/images", path.posix.basename(filename))));
  }
  if (filename && syncTarget) {
    candidates.push(normalizeRelPath(path.posix.join(syncTarget, path.posix.basename(filename))));
  }
  if (filename && byTypeDir) {
    candidates.push(normalizeRelPath(path.posix.join(byTypeDir, path.posix.basename(filename))));
  }

  const unique = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    unique.push(candidate);
  }
  return unique;
}

function pickExistingPath(candidates) {
  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }
  return "";
}

function loadImageMedia() {
  const mediaByChapter = new Map();
  const manifestFiles = listFilesRecursive(
    path.join(ASSET_PROMPT_DIR, "chapters"),
    (filePath) => filePath.endsWith("chapter_manifest.json")
  );

  for (const manifestFile of manifestFiles) {
    const manifest = readJsonWithBom(manifestFile);
    const chapterId = String(manifest.chapter_id || "").trim();
    if (!chapterId) {
      continue;
    }
    const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
    const chapterMedia = mediaByChapter.get(chapterId) || [];

    for (const asset of assets) {
      const candidates = resolveImageCandidates(asset);
      const existing = pickExistingPath(candidates);
      const preferred = existing || candidates[0] || "";
      const status = existing ? "ready" : "missing";

      chapterMedia.push({
        id: String(asset.asset_id || `${chapterId}_asset`),
        chapter_id: chapterId,
        part_id: inferPartId(chapterId),
        kind: String(asset.asset_type || "image"),
        runtime_key: String(asset.art_key_runtime || ""),
        final_key: String(asset.art_key_final || ""),
        filename: String(asset.filename_target || ""),
        path: preferred,
        status
      });
    }

    mediaByChapter.set(chapterId, chapterMedia);
  }

  return mediaByChapter;
}

function loadVideoMedia() {
  const videoByPart = new Map();
  const manifestFiles = listFilesRecursive(
    ASSET_PROMPT_DIR,
    (filePath) => /part\d+-video-prompts\/manifest\.json$/u.test(toPosix(filePath))
  );

  for (const manifestFile of manifestFiles) {
    const manifest = readJsonWithBom(manifestFile);
    const prompts = Array.isArray(manifest.prompts) ? manifest.prompts : [];
    const manifestPartId = String(manifest.part_id || "").trim();

    for (const prompt of prompts) {
      const inferredPart = manifestPartId || String(prompt.video_id || "").slice(0, 2);
      const partId = PARTS.some((item) => item.id === inferredPart) ? inferredPart : "P1";
      const chapterId = String(prompt.chapter_id || "__PART__");
      const videoPath = normalizeRelPath(
        prompt.target_video_path || `public/generated/videos/${String(prompt.video_id || "video")}.mp4`
      );
      const posterPath = normalizeRelPath(
        prompt.target_poster_path ||
          `public/generated/images/${String(prompt.source_art_key || prompt.video_id || "poster")}.webp`
      );
      const videoReady = fileExists(videoPath);
      const posterReady = fileExists(posterPath);

      const entry = {
        id: String(prompt.video_id || "video"),
        scene_id: String(prompt.scene_id || ""),
        chapter_id: chapterId,
        part_id: partId,
        kind: String(prompt.kind || "video"),
        source_art_key: String(prompt.source_art_key || ""),
        video_path: videoPath,
        poster_path: posterPath,
        status: videoReady ? "ready" : "missing",
        video_ready: videoReady,
        poster_ready: posterReady
      };

      const bucket = videoByPart.get(partId) || [];
      bucket.push(entry);
      videoByPart.set(partId, bucket);
    }
  }

  return videoByPart;
}

function summarizePart(partData) {
  return partData.chapters.reduce(
    (acc, chapter) => {
      acc.chapters += 1;
      acc.main += chapter.story_lines.length;
      acc.side += chapter.side_quests.length;
      acc.branch += chapter.branch_quests.length;
      acc.images += chapter.images.length;
      acc.videos += chapter.videos.length;
      return acc;
    },
    { chapters: 0, main: 0, side: 0, branch: 0, images: 0, videos: 0 }
  );
}

function buildDashboardData() {
  const chapters = loadChapterData();
  const imageMediaByChapter = loadImageMedia();
  const videoMediaByPart = loadVideoMedia();

  const parts = PARTS.map((part) => {
    const videosForPart = videoMediaByPart.get(part.id) || [];
    const chaptersForPart = part.chapters.map((chapterId) => {
      const base = chapters.get(chapterId) || {
        chapter_id: chapterId,
        title: chapterId,
        story_lines: [],
        side_quests: [],
        branch_quests: []
      };
      const chapterVideos = videosForPart.filter((item) => item.chapter_id === chapterId);
      const chapterImages = imageMediaByChapter.get(chapterId) || [];

      return {
        ...base,
        images: chapterImages,
        videos: chapterVideos
      };
    });

    return {
      id: part.id,
      label: part.label,
      summary: part.summary,
      chapters: chaptersForPart,
      part_videos: videosForPart.filter((item) => item.chapter_id === "__PART__")
    };
  });

  return {
    generated_at: new Date().toISOString(),
    output_file: normalizeRelPath(path.relative(ROOT_DIR, OUTPUT_FILE)),
    parts: parts.map((part) => ({
      ...part,
      totals: summarizePart(part)
    }))
  };
}

function escapeForHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonForInlineScript(value) {
  return JSON.stringify(value).replace(/[<>&]/gu, (match) => {
    if (match === "<") return "\\u003c";
    if (match === ">") return "\\u003e";
    return "\\u0026";
  });
}

function buildHtml(data) {
  const jsonPayload = jsonForInlineScript(data);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Modern Ops Dashboard</title>
  <style>
    :root {
      --bg: #0a0f14;
      --panel: #111a24;
      --panel-2: #172433;
      --line: #2e4b66;
      --text: #e7f0f8;
      --muted: #99aec1;
      --accent: #5bb4ff;
      --ok: #35c47a;
      --warn: #e89b39;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top, #1a2b3d 0%, var(--bg) 45%);
      color: var(--text);
      font-family: "Segoe UI", "Malgun Gothic", Arial, sans-serif;
    }
    .wrap {
      max-width: 1600px;
      margin: 0 auto;
      padding: 16px;
      display: grid;
      gap: 14px;
    }
    .panel {
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(16, 26, 36, 0.92);
      padding: 14px;
    }
    h1, h2, h3, h4, p {
      margin: 0;
    }
    .header h1 {
      font-size: 24px;
    }
    .header p {
      margin-top: 8px;
      color: var(--muted);
      font-size: 14px;
    }
    .controls {
      display: grid;
      gap: 10px;
      margin-top: 12px;
    }
    .tabs, .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: #11253a;
      color: var(--text);
      padding: 7px 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
    }
    button.active {
      border-color: var(--accent);
      background: #183754;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(6, minmax(100px, 1fr));
      gap: 10px;
    }
    .summary-card {
      border: 1px solid #345a79;
      border-radius: 10px;
      background: var(--panel-2);
      padding: 10px;
    }
    .summary-card .label {
      display: block;
      color: var(--muted);
      font-size: 12px;
    }
    .summary-card strong {
      display: block;
      margin-top: 6px;
      font-size: 20px;
    }
    .chapter-list {
      display: grid;
      gap: 12px;
    }
    .chapter-card {
      border: 1px solid #365777;
      border-radius: 12px;
      background: #102030;
      padding: 12px;
      display: grid;
      gap: 10px;
    }
    .chapter-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }
    .chapter-head .meta {
      color: var(--muted);
      font-size: 12px;
      margin-top: 4px;
    }
    .badge-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .badge {
      border: 1px solid #446c8f;
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 12px;
      color: #cbe6ff;
      background: #16324a;
      white-space: nowrap;
    }
    .quest-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .quest-block {
      border: 1px solid #33526d;
      border-radius: 10px;
      background: var(--panel);
      padding: 10px;
      min-height: 150px;
      display: grid;
      gap: 8px;
    }
    .quest-block h4 {
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .quest-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 7px;
    }
    .quest-item {
      border: 1px solid #304a62;
      border-radius: 8px;
      background: #132637;
      padding: 8px;
      font-size: 12px;
      display: grid;
      gap: 4px;
    }
    .quest-item .muted {
      color: #9fb8cb;
      font-size: 11px;
      line-height: 1.35;
    }
    .empty {
      border: 1px dashed #39556f;
      border-radius: 8px;
      padding: 9px;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
    }
    .media-section {
      display: grid;
      gap: 12px;
    }
    .media-chapter {
      border: 1px solid #355a78;
      border-radius: 12px;
      background: #102131;
      padding: 10px;
      display: grid;
      gap: 10px;
    }
    .media-grids {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .media-block {
      border: 1px solid #35506b;
      border-radius: 10px;
      background: var(--panel);
      padding: 10px;
      display: grid;
      gap: 8px;
    }
    .media-list {
      display: grid;
      gap: 8px;
      max-height: 460px;
      overflow: auto;
      padding-right: 2px;
    }
    .media-card {
      border: 1px solid #304a62;
      border-radius: 8px;
      background: #122434;
      padding: 8px;
      display: grid;
      gap: 6px;
    }
    .media-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .status {
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid #44647f;
    }
    .status.ready {
      border-color: #3c7e56;
      color: #a2f1c5;
      background: #163429;
    }
    .status.missing {
      border-color: #7a5f33;
      color: #ffd6a1;
      background: #3a2b14;
    }
    .thumb {
      width: 100%;
      max-height: 160px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #2f4a63;
      background: #0d1822;
    }
    .video {
      width: 100%;
      max-height: 190px;
      border-radius: 6px;
      border: 1px solid #2f4a63;
      background: #09121b;
    }
    .path-line {
      word-break: break-all;
      font-size: 11px;
      color: #96afc3;
      line-height: 1.35;
    }
    a.path-link {
      color: #8fd0ff;
      text-decoration: none;
    }
    a.path-link:hover {
      text-decoration: underline;
    }
    @media (max-width: 1200px) {
      .summary-grid {
        grid-template-columns: repeat(3, minmax(100px, 1fr));
      }
      .quest-grid {
        grid-template-columns: 1fr;
      }
      .media-grids {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 390px) {
      .wrap { padding: 10px; }
      .panel { padding: 10px; }
      .summary-grid {
        grid-template-columns: 1fr 1fr;
      }
      .header h1 {
        font-size: 20px;
      }
      .chapter-head {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="panel header">
      <h1>Modern Operations Dashboard</h1>
      <p>Standalone HTML for Part 1-4 quest and media review (no server required).</p>
      <div class="controls">
        <div id="part-tabs" class="tabs"></div>
        <div id="media-filters" class="filters"></div>
      </div>
    </section>
    <section class="panel">
      <h2 id="part-title"></h2>
      <p id="part-subtitle" style="margin-top:6px;color:var(--muted);"></p>
      <div id="part-summary" class="summary-grid" style="margin-top:12px;"></div>
    </section>
    <section class="panel">
      <h2>Quest Board</h2>
      <div id="chapter-list" class="chapter-list" style="margin-top:10px;"></div>
    </section>
    <section class="panel">
      <h2>Media Review Board</h2>
      <div id="media-board" class="media-section" style="margin-top:10px;"></div>
    </section>
  </div>

  <script id="dashboard-data" type="application/json">${jsonPayload}</script>
  <script>
    (() => {
      const data = JSON.parse(document.getElementById("dashboard-data").textContent);
      const state = {
        partId: data.parts[0]?.id || "P1",
        mediaFilter: "all"
      };

      const partTabs = document.getElementById("part-tabs");
      const mediaFilters = document.getElementById("media-filters");
      const partTitle = document.getElementById("part-title");
      const partSubtitle = document.getElementById("part-subtitle");
      const partSummary = document.getElementById("part-summary");
      const chapterList = document.getElementById("chapter-list");
      const mediaBoard = document.getElementById("media-board");

      function esc(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
      }

      function activePart() {
        return data.parts.find((part) => part.id === state.partId) || data.parts[0];
      }

      function mediaAllowed(status) {
        if (state.mediaFilter === "all") return true;
        return status === state.mediaFilter;
      }

      function renderTabs() {
        partTabs.innerHTML = data.parts
          .map((part) => {
            const active = part.id === state.partId ? "active" : "";
            return \`<button class="\${active}" data-part="\${part.id}">\${esc(part.label)}</button>\`;
          })
          .join("");

        for (const button of partTabs.querySelectorAll("button[data-part]")) {
          button.addEventListener("click", () => {
            state.partId = button.dataset.part;
            render();
          });
        }
      }

      function renderFilters() {
        const defs = [
          { id: "all", label: "Media: all" },
          { id: "ready", label: "Media: ready" },
          { id: "missing", label: "Media: missing" }
        ];
        mediaFilters.innerHTML = defs
          .map((def) => {
            const active = def.id === state.mediaFilter ? "active" : "";
            return \`<button class="\${active}" data-filter="\${def.id}">\${def.label}</button>\`;
          })
          .join("");

        for (const button of mediaFilters.querySelectorAll("button[data-filter]")) {
          button.addEventListener("click", () => {
            state.mediaFilter = button.dataset.filter;
            render();
          });
        }
      }

      function renderSummary(part) {
        partTitle.textContent = \`\${part.label} dashboard\`;
        partSubtitle.textContent = \`\${part.summary} | generated: \${data.generated_at}\`;
        partSummary.innerHTML = [
          ["chapters", part.totals.chapters],
          ["story lines", part.totals.main],
          ["branch quests", part.totals.branch],
          ["side quests", part.totals.side],
          ["image assets", part.totals.images],
          ["video assets", part.totals.videos + part.part_videos.length]
        ]
          .map(
            ([label, count]) =>
              \`<article class="summary-card"><span class="label">\${esc(label)}</span><strong>\${count}</strong></article>\`
          )
          .join("");
      }

      function renderQuestList(items, mode) {
        if (!Array.isArray(items) || items.length === 0) {
          return '<div class="empty">No data</div>';
        }
        return \`<ul class="quest-list">\${items
          .map((item) => {
            if (mode === "branch") {
              return \`
                <li class="quest-item">
                  <strong>\${esc(item.title)}</strong>
                  <span class="muted">id: \${esc(item.id)} | type: \${esc(item.event_type)}</span>
                  <span class="muted">choices: \${item.choices}</span>
                </li>
              \`;
            }
            return \`
              <li class="quest-item">
                <strong>\${esc(item.title)}</strong>
                <span class="muted">\${esc(item.summary || item.id)}</span>
                <span class="muted">entry: \${esc(item.entry_event_id)} | done: \${esc(item.completion_event_id)}</span>
              </li>
            \`;
          })
          .join("")}</ul>\`;
      }

      function renderChapters(part) {
        chapterList.innerHTML = part.chapters
          .map((chapter) => {
            return \`
              <article class="chapter-card">
                <header class="chapter-head">
                  <div>
                    <h3>\${esc(chapter.chapter_id)} - \${esc(chapter.title)}</h3>
                    <div class="meta">Quest + media alignment review</div>
                  </div>
                  <div class="badge-group">
                    <span class="badge">main \${chapter.story_lines.length}</span>
                    <span class="badge">branch \${chapter.branch_quests.length}</span>
                    <span class="badge">side \${chapter.side_quests.length}</span>
                    <span class="badge">img \${chapter.images.length}</span>
                    <span class="badge">video \${chapter.videos.length}</span>
                  </div>
                </header>
                <div class="quest-grid">
                  <section class="quest-block">
                    <h4>Story Lines <span>\${chapter.story_lines.length}</span></h4>
                    \${renderQuestList(chapter.story_lines, "main")}
                  </section>
                  <section class="quest-block">
                    <h4>Branch Quests <span>\${chapter.branch_quests.length}</span></h4>
                    \${renderQuestList(chapter.branch_quests, "branch")}
                  </section>
                  <section class="quest-block">
                    <h4>Side Quests <span>\${chapter.side_quests.length}</span></h4>
                    \${renderQuestList(chapter.side_quests, "side")}
                  </section>
                </div>
              </article>
            \`;
          })
          .join("");
      }

      function renderImageCard(asset) {
        const statusClass = asset.status === "ready" ? "ready" : "missing";
        const thumb = asset.path
          ? \`<img class="thumb" src="\${esc(asset.path)}" alt="\${esc(asset.id)}" loading="lazy" />\`
          : '<div class="empty">No path</div>';
        const pathLine = asset.path
          ? \`<a class="path-link" href="\${esc(asset.path)}" target="_blank" rel="noreferrer">\${esc(asset.path)}</a>\`
          : "no target path";
        return \`
          <article class="media-card">
            <div class="media-top">
              <strong>\${esc(asset.id)}</strong>
              <span class="status \${statusClass}">\${esc(asset.status)}</span>
            </div>
            \${thumb}
            <div class="path-line">\${pathLine}</div>
            <div class="path-line">kind: \${esc(asset.kind)} | runtime: \${esc(asset.runtime_key || "-")}</div>
          </article>
        \`;
      }

      function renderVideoCard(video) {
        const statusClass = video.status === "ready" ? "ready" : "missing";
        let mediaView = '<div class="empty">video missing</div>';
        if (video.video_ready) {
          mediaView = \`<video class="video" controls preload="none" poster="\${esc(video.poster_path || "")}">
            <source src="\${esc(video.video_path)}" type="video/mp4" />
          </video>\`;
        } else if (video.poster_ready) {
          mediaView = \`<img class="thumb" src="\${esc(video.poster_path)}" alt="\${esc(video.id)} poster" loading="lazy" />\`;
        }
        return \`
          <article class="media-card">
            <div class="media-top">
              <strong>\${esc(video.id)}</strong>
              <span class="status \${statusClass}">\${esc(video.status)}</span>
            </div>
            \${mediaView}
            <div class="path-line"><a class="path-link" href="\${esc(video.video_path)}" target="_blank" rel="noreferrer">\${esc(video.video_path)}</a></div>
            <div class="path-line">poster: \${esc(video.poster_path || "-")}</div>
          </article>
        \`;
      }

      function renderMedia(part) {
        const chapterSections = [];
        for (const chapter of part.chapters) {
          const imageItems = chapter.images.filter((item) => mediaAllowed(item.status));
          const videoItems = chapter.videos.filter((item) => mediaAllowed(item.status));
          if (imageItems.length === 0 && videoItems.length === 0) {
            continue;
          }

          chapterSections.push(\`
            <section class="media-chapter">
              <header class="chapter-head">
                <div>
                  <h3>\${esc(chapter.chapter_id)} media</h3>
                  <div class="meta">\${esc(chapter.title)}</div>
                </div>
                <div class="badge-group">
                  <span class="badge">images \${imageItems.length}</span>
                  <span class="badge">videos \${videoItems.length}</span>
                </div>
              </header>
              <div class="media-grids">
                <section class="media-block">
                  <h4>Image Assets</h4>
                  <div class="media-list">
                    \${imageItems.length > 0 ? imageItems.map(renderImageCard).join("") : '<div class="empty">No image entries</div>'}
                  </div>
                </section>
                <section class="media-block">
                  <h4>Video Assets</h4>
                  <div class="media-list">
                    \${videoItems.length > 0 ? videoItems.map(renderVideoCard).join("") : '<div class="empty">No video entries</div>'}
                  </div>
                </section>
              </div>
            </section>
          \`);
        }

        const partVideos = (part.part_videos || []).filter((item) => mediaAllowed(item.status));
        const partVideoSection = partVideos.length
          ? \`
            <section class="media-chapter">
              <header class="chapter-head">
                <div>
                  <h3>Part-level videos</h3>
                  <div class="meta">trailer or non-chapter prompts</div>
                </div>
                <div class="badge-group">
                  <span class="badge">videos \${partVideos.length}</span>
                </div>
              </header>
              <section class="media-block">
                <h4>Part Videos</h4>
                <div class="media-list">\${partVideos.map(renderVideoCard).join("")}</div>
              </section>
            </section>
          \`
          : "";

        if (chapterSections.length === 0 && !partVideoSection) {
          mediaBoard.innerHTML = '<div class="empty">No media entries matched current filter.</div>';
          return;
        }
        mediaBoard.innerHTML = chapterSections.join("") + partVideoSection;
      }

      function render() {
        const part = activePart();
        renderTabs();
        renderFilters();
        renderSummary(part);
        renderChapters(part);
        renderMedia(part);
      }

      render();
    })();
  </script>
</body>
</html>`;
}

function main() {
  const data = buildDashboardData();
  const html = buildHtml(data);
  fs.writeFileSync(OUTPUT_FILE, `${html}\n`, "utf8");

  console.log("modern ops dashboard generated");
  console.log(`- output: ${OUTPUT_FILE}`);
  for (const part of data.parts) {
    const totalVideos = part.totals.videos + part.part_videos.length;
    console.log(
      `- ${part.id} chapters=${part.totals.chapters} main=${part.totals.main} branch=${part.totals.branch} side=${part.totals.side} images=${part.totals.images} videos=${totalVideos}`
    );
  }
}

main();

