import fs from "node:fs/promises";
import path from "node:path";
import {
  PRIVATE_PROMPTS_ANTIGRAVITY_ROOT,
  PRIVATE_PROMPTS_GEMINI_ROOT,
  PUBLIC_GENERATED_ROOT,
  REPO_ROOT,
  normalizeRepoPath,
  relFromRoot,
  resolveNormalizedRepoPath,
  toPosix,
} from "./private-paths.mjs";

const OUTPUT_FILE = path.join(REPO_ROOT, "media-sync-dashboard.html");
const IMAGE_EXTS = [".png", ".webp", ".jpg", ".jpeg", ".svg"];
const AUDIO_EXTS = [".wav", ".mp3", ".m4a", ".flac", ".ogg"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".m4v"];
const PARTS = ["P1", "P2", "P3", "P4"];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/u, ""));
}

async function listFileNames(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

function fileBase(fileName) {
  return path.basename(fileName, path.extname(fileName)).toLowerCase();
}

async function findFileByBase(dirPath, base, allowedExts) {
  const target = String(base ?? "").toLowerCase();
  if (!target) {
    return null;
  }
  const files = await listFileNames(dirPath);
  const match = files.find((file) => fileBase(file) === target && allowedExts.includes(path.extname(file).toLowerCase()));
  return match ? path.join(dirPath, match) : null;
}

async function findExactOrBase(filePath, allowedExts) {
  if (!filePath) {
    return null;
  }
  if (await pathExists(filePath)) {
    return filePath;
  }
  return findFileByBase(path.dirname(filePath), fileBase(filePath), allowedExts);
}

function chapterLabelFromDir(chapterDir) {
  const code = /^CH\d+/u.exec(chapterDir)?.[0] ?? chapterDir;
  const title = chapterDir
    .replace(/^CH\d+_/u, "")
    .split("_")
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(" ");
  return title ? `${code} ${title}` : code;
}

function pushRecord(records, record) {
  records.push({
    ...record,
    promptPath: record.promptPath ? toPosix(record.promptPath) : null,
    actualPath: record.actualPath ? toPosix(record.actualPath) : null,
    previewPath: record.previewPath ? toPosix(record.previewPath) : null,
    posterPath: record.posterPath ? toPosix(record.posterPath) : null,
    expectedPaths: (record.expectedPaths ?? []).filter(Boolean).map((value) => toPosix(value)),
  });
}

async function collectImageRecords() {
  const manifestPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "MASTER_ASSET_MANIFEST.json");
  if (!(await pathExists(manifestPath))) {
    return [];
  }

  const manifest = await readJson(manifestPath);
  const records = [];

  for (const asset of manifest.assets ?? []) {
    const promptPath = resolveNormalizedRepoPath(asset.prompt_file);
    const promptSegments = String(asset.prompt_file ?? "").split("/");
    const chapterDir = promptSegments[promptSegments.findIndex((segment) => segment === "chapters") + 1] ?? asset.chapter_id;
    const inboxTarget = path.join(REPO_ROOT, normalizeRepoPath(`${asset.drop_inbox_path}/${asset.filename_target}`));
    const publicByFilename = path.join(PUBLIC_GENERATED_ROOT, "images", asset.filename_target);
    const publicByArtKey = await findFileByBase(path.join(PUBLIC_GENERATED_ROOT, "images"), asset.art_key_final, IMAGE_EXTS);
    const packaged = await findFileByBase(resolveNormalizedRepoPath(asset.sync_target_path), asset.art_key_final, IMAGE_EXTS);
    const inbox = await findExactOrBase(inboxTarget, IMAGE_EXTS);
    const publicFile = await findExactOrBase(publicByFilename, IMAGE_EXTS);

    let bucket = "missing";
    let detail = "prompt_only";
    if (publicFile || publicByArtKey || packaged) {
      bucket = "completed";
      detail = "synced";
    } else if (inbox) {
      bucket = "ready";
      detail = "inbox_waiting_sync";
    }

    const actualPath = publicByArtKey || publicFile || packaged || inbox;
    pushRecord(records, {
      id: `image:${asset.asset_id}`,
      mediaType: "image",
      subtype: asset.asset_type,
      title: asset.asset_id,
      partId: asset.part_id,
      chapterKey: chapterDir,
      chapterLabel: chapterLabelFromDir(chapterDir),
      bucket,
      detail,
      promptPath: relFromRoot(promptPath),
      expectedPaths: [
        relFromRoot(inboxTarget),
        relFromRoot(path.join(PUBLIC_GENERATED_ROOT, "images", `${asset.art_key_final}.webp`)),
        relFromRoot(path.join(resolveNormalizedRepoPath(asset.sync_target_path), `${asset.art_key_final}.webp`)),
      ],
      actualPath: actualPath ? relFromRoot(actualPath) : null,
      previewPath: actualPath ? relFromRoot(actualPath) : null,
    });
  }

  return records;
}

async function collectPartPosterRecords() {
  const records = [];
  for (const part of ["P2", "P3", "P4"]) {
    const manifestPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, `part${part.slice(1)}-poster-prompts`, "manifest.json");
    if (!(await pathExists(manifestPath))) {
      continue;
    }

    const manifest = await readJson(manifestPath);
    for (const poster of manifest.posters ?? []) {
      const target = await findExactOrBase(resolveNormalizedRepoPath(poster.target_path), IMAGE_EXTS);
      const promptPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, `part${part.slice(1)}-poster-prompts`, poster.file);
      pushRecord(records, {
        id: `image:${poster.poster_id}`,
        mediaType: "image",
        subtype: "part_poster",
        title: poster.poster_id,
        partId: part,
        chapterKey: "PART_POSTERS",
        chapterLabel: "Part Posters",
        bucket: target ? "completed" : "missing",
        detail: target ? "poster_ready" : "prompt_only",
        promptPath: relFromRoot(promptPath),
        expectedPaths: [normalizeRepoPath(poster.target_path)],
        actualPath: target ? relFromRoot(target) : null,
        previewPath: target ? relFromRoot(target) : null,
      });
    }
  }
  return records;
}

async function collectVideoRecords() {
  const records = [];
  for (const part of PARTS) {
    const manifestPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, `part${part.slice(1)}-video-prompts`, "manifest.json");
    if (!(await pathExists(manifestPath))) {
      continue;
    }

    const manifest = await readJson(manifestPath);
    for (const prompt of manifest.prompts ?? []) {
      const partId = manifest.part_id ?? part;
      const targetVideoPath = prompt.target_video_path ?? `public/generated/videos/${prompt.video_id}.mp4`;
      const targetPosterPath = prompt.target_poster_path ?? (prompt.source_art_key ? `public/generated/images/${prompt.source_art_key}.webp` : null);
      const promptPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, `part${partId.slice(1)}-video-prompts`, prompt.file);
      const video = await findExactOrBase(resolveNormalizedRepoPath(targetVideoPath), VIDEO_EXTS);
      const poster = targetPosterPath ? await findExactOrBase(resolveNormalizedRepoPath(targetPosterPath), IMAGE_EXTS) : null;

      let bucket = "missing";
      let detail = "prompt_only";
      if (video) {
        bucket = "completed";
        detail = "video_ready";
      } else if (poster) {
        bucket = "ready";
        detail = "poster_ready";
      }

      const chapterKey = prompt.kind === "trailer"
        ? "TRAILER"
        : prompt.kind === "ending"
          ? `${prompt.chapter_id ?? "ENDING"}_ENDINGS`
          : prompt.chapter_id ?? prompt.video_id;
      const chapterLabel = prompt.kind === "trailer"
        ? "Trailer"
        : prompt.kind === "ending"
          ? `${prompt.chapter_id ?? "Ending"} Endings`
          : prompt.chapter_id ?? prompt.video_id;

      pushRecord(records, {
        id: `video:${prompt.video_id}`,
        mediaType: "video",
        subtype: prompt.kind ?? "video",
        title: prompt.video_id,
        partId,
        chapterKey,
        chapterLabel,
        bucket,
        detail,
        promptPath: relFromRoot(promptPath),
        expectedPaths: [normalizeRepoPath(targetVideoPath), targetPosterPath ? normalizeRepoPath(targetPosterPath) : null],
        actualPath: video ? relFromRoot(video) : poster ? relFromRoot(poster) : null,
        previewPath: video ? relFromRoot(video) : null,
        posterPath: poster ? relFromRoot(poster) : null,
      });
    }
  }
  return records;
}

async function collectMusicRecords() {
  const manifestPath = path.join(PRIVATE_PROMPTS_GEMINI_ROOT, "boss-intro", "manifest.json");
  if (!(await pathExists(manifestPath))) {
    return [];
  }

  const manifest = await readJson(manifestPath);
  const records = [];

  for (const track of manifest.tracks ?? []) {
    const outputDir = path.join(PUBLIC_GENERATED_ROOT, "audio", "boss-intro", track.part_id);
    const outputBase = `${track.chapter_dir}_boss_intro`;
    const audio = await findFileByBase(outputDir, outputBase, AUDIO_EXTS);

    pushRecord(records, {
      id: `music:${track.track_id}`,
      mediaType: "music",
      subtype: "boss_intro",
      title: track.boss_code,
      partId: track.part_id,
      chapterKey: track.chapter_dir,
      chapterLabel: chapterLabelFromDir(track.chapter_dir),
      bucket: audio ? "completed" : "missing",
      detail: audio ? "audio_ready" : "prompt_only",
      promptPath: track.prompt_file,
      expectedPaths: [`public/generated/audio/boss-intro/${track.part_id}/${outputBase}.*`],
      actualPath: audio ? relFromRoot(audio) : null,
      previewPath: audio ? relFromRoot(audio) : null,
    });
  }

  return records;
}

function buildHtml(data) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  const browserScript = [
    'var data = JSON.parse(document.getElementById("dashboard-data").textContent);',
    'var state = { part: "P1", type: "all", status: "all", query: "" };',
    'var partTabs = document.getElementById("partTabs");',
    'var typeFilters = document.getElementById("typeFilters");',
    'var statusFilters = document.getElementById("statusFilters");',
    'var summary = document.getElementById("summary");',
    'var chapterList = document.getElementById("chapterList");',
    'var searchInput = document.getElementById("searchInput");',
    'var commandBar = document.getElementById("commandBar");',
    'var typeOptions = [{ value: "all", label: "All Media" }, { value: "image", label: "Images" }, { value: "music", label: "Music" }, { value: "video", label: "Videos" }];',
    'var statusOptions = [{ value: "all", label: "All Status" }, { value: "completed", label: "Completed" }, { value: "ready", label: "Ready" }, { value: "missing", label: "Missing" }];',
    'function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\\\"", "&quot;").replaceAll("\'", "&#39;"); }',
    'function copyText(value) { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(value).catch(function () { fallbackCopyText(value); }); return; } fallbackCopyText(value); }',
    'function fallbackCopyText(value) { var textarea = document.createElement("textarea"); textarea.value = value; textarea.setAttribute("readonly", "true"); textarea.style.position = "fixed"; textarea.style.opacity = "0"; document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); textarea.remove(); }',
    'function renderButtons(container, options, currentValue, onClick) { container.innerHTML = ""; options.forEach(function (option) { var button = document.createElement("button"); button.type = "button"; button.textContent = option.label; if (option.value === currentValue) { button.classList.add("active"); } button.addEventListener("click", function () { onClick(option.value); }); container.appendChild(button); }); }',
    'function getFilteredItems() { var query = state.query.trim().toLowerCase(); return data.items.filter(function (item) { if (item.partId !== state.part) return false; if (state.type !== "all" && item.mediaType !== state.type) return false; if (state.status !== "all" && item.bucket !== state.status) return false; if (!query) return true; return [item.title, item.chapterLabel, item.detail, item.promptPath || "", item.actualPath || ""].concat(item.expectedPaths || []).join(" ").toLowerCase().includes(query); }); }',
    'function chapterSortKey(chapterKey) { var match = /^CH(\\d+)/.exec(chapterKey); if (match) return Number(match[1]); if (chapterKey === "PART_POSTERS") return 200; if (chapterKey === "TRAILER") return 300; if (chapterKey.indexOf("_ENDINGS") >= 0) return 250; return 400; }',
    'function renderCommandBar() { var partNo = state.part.replace("P", ""); var commands = [{ label: "Image Sync Dry Run", value: "npm run assets:sync -- --part " + state.part + " --dry-run" }, { label: "Image Sync Apply", value: "npm run assets:sync -- --part " + state.part }, { label: "Open Antigravity", value: "ii .\\\\private\\\\prompts\\\\antigravity\\\\chapters" }, { label: "Open Gemini Boss", value: "ii .\\\\private\\\\prompts\\\\gemini-lyria3\\\\boss-intro\\\\" + state.part }, { label: "Open Video Prompts", value: "ii .\\\\private\\\\prompts\\\\antigravity\\\\part" + partNo + "-video-prompts" }]; commandBar.innerHTML = ""; commands.forEach(function (command) { var box = document.createElement("div"); box.className = "command"; box.innerHTML = "<strong>" + escapeHtml(command.label) + "</strong><code>" + escapeHtml(command.value) + "</code>"; var button = document.createElement("button"); button.type = "button"; button.textContent = "Copy"; button.addEventListener("click", function () { copyText(command.value); }); box.appendChild(button); commandBar.appendChild(box); }); }',
    'function renderSummary(items) { var cards = [["Total", items.length, state.part + " visible items"], ["Completed", items.filter(function (item) { return item.bucket === "completed"; }).length, "synced or generated output exists"], ["Ready", items.filter(function (item) { return item.bucket === "ready"; }).length, "inbox image or poster exists"], ["Missing", items.filter(function (item) { return item.bucket === "missing"; }).length, "prompt exists but output does not"], ["Images", items.filter(function (item) { return item.mediaType === "image"; }).length, "chapter assets and part posters"], ["Music", items.filter(function (item) { return item.mediaType === "music"; }).length, "boss intro tracks"], ["Videos", items.filter(function (item) { return item.mediaType === "video"; }).length, "openings, endings, trailers"]]; summary.innerHTML = cards.map(function (card) { return "<article class=\"stat\"><h2>" + card[0] + "</h2><div class=\"value\">" + card[1] + "</div><p class=\"hint\">" + escapeHtml(card[2]) + "</p></article>"; }).join(""); }',
    'function previewHtml(item) { if (item.mediaType === "image" && item.previewPath) { return "<img src=\"" + escapeHtml(item.previewPath) + "\" alt=\"" + escapeHtml(item.title) + "\" loading=\"lazy\" />"; } if (item.mediaType === "video") { if (item.previewPath) { var poster = item.posterPath ? " poster=\\\"" + escapeHtml(item.posterPath) + "\\\"" : ""; return "<video controls preload=\"none\"" + poster + "><source src=\"" + escapeHtml(item.previewPath) + "\" /></video>"; } if (item.posterPath) { return "<img src=\"" + escapeHtml(item.posterPath) + "\" alt=\"" + escapeHtml(item.title) + " poster\" loading=\"lazy\" />"; } } if (item.mediaType === "music" && item.previewPath) { return "<audio controls preload=\"none\"><source src=\"" + escapeHtml(item.previewPath) + "\" /></audio>"; } return "<div class=\"placeholder\">No preview available yet.</div>"; }',
    'function renderCards(items) { if (items.length === 0) { chapterList.innerHTML = "<div class=\"empty\">No items match the current filters.</div>"; return; } var grouped = new Map(); items.forEach(function (item) { var current = grouped.get(item.chapterKey) || { label: item.chapterLabel, items: [] }; current.items.push(item); grouped.set(item.chapterKey, current); }); var sorted = Array.from(grouped.entries()).sort(function (left, right) { return chapterSortKey(left[0]) - chapterSortKey(right[0]); }); chapterList.innerHTML = sorted.map(function (entry) { var group = entry[1]; var completed = group.items.filter(function (item) { return item.bucket === "completed"; }).length; var ready = group.items.filter(function (item) { return item.bucket === "ready"; }).length; var missing = group.items.filter(function (item) { return item.bucket === "missing"; }).length; var cards = group.items.sort(function (a, b) { return a.mediaType.localeCompare(b.mediaType) || a.title.localeCompare(b.title); }).map(function (item) { return "<article class=\"card\"><div class=\"preview\">" + previewHtml(item) + "</div><div class=\"body\"><div class=\"card-top\"><span class=\"pill " + item.bucket + "\">" + escapeHtml(item.bucket) + "</span><span class=\"type\">" + escapeHtml(item.mediaType + " / " + item.subtype) + "</span></div><div><h3>" + escapeHtml(item.title) + "</h3><p class=\"meta\">" + escapeHtml(item.detail) + "</p></div><div class=\"paths\"><div><small>Prompt</small><code>" + escapeHtml(item.promptPath || "-") + "</code></div><div><small>Expected</small><code>" + escapeHtml((item.expectedPaths || []).join("\\n") || "-") + "</code></div><div><small>Actual</small><code>" + escapeHtml(item.actualPath || "-") + "</code></div></div></div></article>"; }).join(""); return "<section class=\"chapter\"><div class=\"chapter-head\"><div><h2>" + escapeHtml(group.label) + "</h2><p>" + group.items.length + " assets</p></div><div class=\"chips\"><span class=\"chip\">Completed " + completed + "</span><span class=\"chip\">Ready " + ready + "</span><span class=\"chip\">Missing " + missing + "</span></div></div><div class=\"cards\">" + cards + "</div></section>"; }).join(""); }',
    'function render() { renderButtons(partTabs, data.parts.map(function (part) { return { value: part, label: part }; }), state.part, function (value) { state.part = value; render(); }); renderButtons(typeFilters, typeOptions, state.type, function (value) { state.type = value; render(); }); renderButtons(statusFilters, statusOptions, state.status, function (value) { state.status = value; render(); }); renderCommandBar(); var items = getFilteredItems(); renderSummary(items); renderCards(items); }',
    'searchInput.addEventListener("input", function (event) { state.query = event.target.value; render(); });',
    'render();',
  ].join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Media Sync Dashboard</title>
  <style>
    :root {
      --bg: #f4efe7;
      --panel: #fffaf2;
      --panel-strong: #f8f1e7;
      --text: #1f1a17;
      --muted: #6f675f;
      --line: #d8cfc2;
      --accent: #a6482d;
      --accent-2: #245f73;
      --ok: #2c6e49;
      --ready: #b36a1e;
      --missing: #8f3131;
      --shadow: 0 18px 40px rgba(49, 33, 20, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top right, rgba(166, 72, 45, 0.10), transparent 32%), linear-gradient(180deg, #faf6ef 0%, var(--bg) 100%);
      color: var(--text);
      font-family: "Segoe UI", "Noto Sans KR", sans-serif;
    }
    .shell { width: min(1440px, calc(100vw - 32px)); margin: 24px auto 48px; }
    .hero, .panel { background: rgba(255, 250, 242, 0.92); backdrop-filter: blur(10px); border: 1px solid rgba(216, 207, 194, 0.8); border-radius: 24px; box-shadow: var(--shadow); }
    .hero { padding: 28px; display: grid; gap: 20px; }
    .eyebrow { display: inline-flex; padding: 8px 12px; border-radius: 999px; background: var(--panel-strong); color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(30px, 4vw, 52px); line-height: 1; letter-spacing: -0.04em; }
    .hero p { margin: 0; color: var(--muted); max-width: 900px; line-height: 1.6; }
    .command-bar { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .command { background: var(--panel-strong); border: 1px solid var(--line); border-radius: 18px; padding: 14px; display: grid; gap: 10px; }
    .command code { display: block; padding: 10px; background: rgba(31, 26, 23, 0.05); border-radius: 12px; font-size: 12px; overflow-wrap: anywhere; }
    button { appearance: none; border: 1px solid var(--line); background: white; color: var(--text); padding: 10px 14px; border-radius: 999px; font: inherit; cursor: pointer; }
    button.active { background: var(--accent); border-color: var(--accent); color: white; }
    .controls { margin-top: 20px; display: grid; gap: 16px; }
    .panel { padding: 20px; }
    .toolbar { display: grid; gap: 16px; }
    .tabs, .filters { display: flex; gap: 10px; flex-wrap: wrap; }
    .search { width: 100%; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--line); background: white; font: inherit; }
    .summary { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    .stat { padding: 18px; border-radius: 20px; background: var(--panel-strong); border: 1px solid var(--line); display: grid; gap: 8px; }
    .value { font-size: 30px; font-weight: 800; letter-spacing: -0.04em; }
    .hint { color: var(--muted); font-size: 13px; }
    .chapter-list { display: grid; gap: 18px; }
    .chapter { border: 1px solid var(--line); border-radius: 22px; background: white; padding: 18px; display: grid; gap: 14px; }
    .chapter-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .chapter-head h2 { margin: 0; font-size: 20px; }
    .chapter-head p { margin: 4px 0 0; color: var(--muted); font-size: 13px; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 700; background: var(--panel-strong); border: 1px solid var(--line); }
    .cards { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); }
    .card { border: 1px solid var(--line); border-radius: 20px; overflow: hidden; background: #fffdf9; display: grid; }
    .preview { aspect-ratio: 16 / 10; background: linear-gradient(135deg, rgba(36, 95, 115, 0.15), rgba(166, 72, 45, 0.08)); display: grid; place-items: center; }
    .preview img, .preview video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .preview audio { width: calc(100% - 24px); }
    .placeholder { padding: 18px; color: var(--muted); font-size: 13px; text-align: center; line-height: 1.6; }
    .body { padding: 16px; display: grid; gap: 12px; }
    .card-top { display: flex; justify-content: space-between; gap: 10px; align-items: center; }
    .card h3 { margin: 0; font-size: 18px; line-height: 1.25; overflow-wrap: anywhere; }
    .meta, .paths small { color: var(--muted); }
    .pill { display: inline-flex; align-items: center; padding: 7px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .pill.completed { background: rgba(44, 110, 73, 0.14); color: var(--ok); }
    .pill.ready { background: rgba(179, 106, 30, 0.16); color: var(--ready); }
    .pill.missing { background: rgba(143, 49, 49, 0.12); color: var(--missing); }
    .type { font-size: 12px; font-weight: 700; color: var(--accent-2); }
    .paths { display: grid; gap: 8px; font-size: 12px; }
    .paths code { display: block; background: rgba(31, 26, 23, 0.05); padding: 8px 10px; border-radius: 10px; overflow-wrap: anywhere; white-space: pre-wrap; }
    .empty { padding: 40px 20px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 20px; background: rgba(255,255,255,0.7); }
    @media (max-width: 700px) { .shell { width: min(100vw - 20px, 100%); } .hero, .panel { border-radius: 20px; } .hero { padding: 20px; } .panel { padding: 16px; } .cards { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="shell">
    <section class="hero">
      <div>
        <span class="eyebrow">Media Ops</span>
        <h1>Media Sync Dashboard</h1>
      </div>
      <p>이미지, 음악, 영상 생성 상태를 Part → Chapter 기준으로 한 번에 검토하는 운영 대시보드입니다. 버튼은 실제 실행 버튼이 아니라 PowerShell 명령 복사용입니다.</p>
      <div class="command-bar" id="commandBar"></div>
    </section>
    <div class="controls">
      <section class="panel toolbar">
        <div class="tabs" id="partTabs"></div>
        <div class="filters" id="typeFilters"></div>
        <div class="filters" id="statusFilters"></div>
        <input class="search" id="searchInput" type="search" placeholder="Search chapter, asset id, boss, prompt path" />
      </section>
      <section class="panel"><div class="summary" id="summary"></div></section>
      <section class="panel"><div class="chapter-list" id="chapterList"></div></section>
    </div>
  </div>
  <script type="application/json" id="dashboard-data">${payload}</script>
  <script>${browserScript}</script>
</body>
</html>`;
}

async function main() {
  const [images, posters, videos, music] = await Promise.all([
    collectImageRecords(),
    collectPartPosterRecords(),
    collectVideoRecords(),
    collectMusicRecords(),
  ]);

  const items = [...images, ...posters, ...videos, ...music];
  const html = buildHtml({ generatedAt: new Date().toISOString(), parts: PARTS, items });
  await fs.writeFile(OUTPUT_FILE, html, "utf8");

  const summary = items.reduce((acc, item) => {
    const key = `${item.mediaType}:${item.bucket}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    output: relFromRoot(OUTPUT_FILE),
    items: items.length,
    summary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
