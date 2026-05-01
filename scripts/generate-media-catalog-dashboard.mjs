import fs from "node:fs/promises";
import path from "node:path";
import {
  PRIVATE_PACKAGED_IMAGES_ROOT,
  PRIVATE_PROMPTS_ANTIGRAVITY_ROOT,
  PUBLIC_GENERATED_ROOT,
  PUBLIC_RUNTIME_CONTENT_ROOT,
  REPO_ROOT,
  normalizeRepoPath,
  relFromRoot,
  resolveNormalizedRepoPath,
  toPosix,
} from "./private-paths.mjs";

const OUTPUT_HTML = path.join(REPO_ROOT, "media-catalog-dashboard.html");
const OUTPUT_MD = path.join(REPO_ROOT, "media-catalog.md");
const IMAGE_EXTS = [".webp", ".png", ".jpg", ".jpeg", ".svg"];
const VIDEO_EXTS = [".mp4", ".webm", ".mov", ".m4v"];
const PARTS = [
  { id: "P1", label: "Part 1", chapters: ["CH01", "CH02", "CH03", "CH04", "CH05"] },
  { id: "P2", label: "Part 2", chapters: ["CH06", "CH07", "CH08", "CH09", "CH10"] },
  { id: "P3", label: "Part 3", chapters: ["CH11", "CH12", "CH13", "CH14", "CH15"] },
  { id: "P4", label: "Part 4", chapters: ["CH16", "CH17", "CH18", "CH19", "CH20"] },
];

const CHAPTER_TITLES = {
  CH01: "여의도 송출",
  CH02: "검은 수로",
  CH03: "유리정원",
  CH04: "상자들의 전시",
  CH05: "미러필터",
  CH06: "남부 관문",
  CH07: "붉은 회랑",
  CH08: "죽은 행정실",
  CH09: "계류 창고",
  CH10: "침몰 항만",
  CH11: "천 갈래 중계",
  CH12: "편향 정거장",
  CH13: "백색 기록고",
  CH14: "의료 변전소",
  CH15: "봉인 중계로",
  CH16: "균열 항만",
  CH17: "수문 회랑",
  CH18: "염분 정거장",
  CH19: "동해 전초기지",
  CH20: "독도 관문 핵",
};

async function exists(filePath) {
  if (!filePath) return false;
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/u, ""));
  } catch {
    return fallback;
  }
}

async function listFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function findByBase(dirPath, baseName, exts) {
  const base = String(baseName ?? "").toLowerCase();
  if (!base) return null;
  const files = await listFiles(dirPath);
  const match = files.find((file) => {
    const ext = path.extname(file).toLowerCase();
    return exts.includes(ext) && path.basename(file, ext).toLowerCase() === base;
  });
  return match ? path.join(dirPath, match) : null;
}

async function findExactOrBase(filePath, exts) {
  if (!filePath) return null;
  if (await exists(filePath)) return filePath;
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  return findByBase(path.dirname(filePath), base, exts);
}

function chapterToPartId(chapterId) {
  return PARTS.find((part) => part.chapters.includes(chapterId))?.id ?? "P1";
}

function normalizeRel(value) {
  return normalizeRepoPath(toPosix(value ?? ""));
}

function makeRecord(record) {
  return {
    id: record.id,
    partId: record.partId,
    chapterId: record.chapterId,
    chapterTitle: CHAPTER_TITLES[record.chapterId] ?? record.chapterId,
    mediaType: record.mediaType,
    assetType: record.assetType ?? record.mediaType,
    title: record.title ?? record.id,
    status: record.status,
    statusDetail: record.statusDetail ?? "",
    promptPath: record.promptPath ? normalizeRel(record.promptPath) : "",
    expectedPaths: (record.expectedPaths ?? []).filter(Boolean).map(normalizeRel),
    actualPath: record.actualPath ? normalizeRel(record.actualPath) : "",
    previewPath: record.previewPath ? normalizeRel(record.previewPath) : "",
    posterPath: record.posterPath ? normalizeRel(record.posterPath) : "",
  };
}

async function collectImagesFromMasterManifest() {
  const manifestPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "MASTER_ASSET_MANIFEST.json");
  const manifest = await readJson(manifestPath, { assets: [] });
  const publicImageDir = path.join(PUBLIC_GENERATED_ROOT, "images");
  const records = [];

  for (const asset of manifest.assets ?? []) {
    const chapterId = String(asset.chapter_id ?? "").trim();
    if (!chapterId) continue;

    const filenameTarget = String(asset.filename_target ?? "").trim();
    const artKey = String(asset.art_key_final ?? asset.art_key_runtime ?? "").trim();
    const inboxPath = asset.drop_inbox_path && filenameTarget
      ? resolveNormalizedRepoPath(`${asset.drop_inbox_path}/${filenameTarget}`)
      : null;
    const publicByFilename = filenameTarget ? path.join(publicImageDir, filenameTarget) : null;
    const publicByArtKey = artKey ? await findByBase(publicImageDir, artKey, IMAGE_EXTS) : null;
    const packagedDir = asset.sync_target_path ? resolveNormalizedRepoPath(asset.sync_target_path) : PRIVATE_PACKAGED_IMAGES_ROOT;
    const packagedByArtKey = artKey ? await findByBase(packagedDir, artKey, IMAGE_EXTS) : null;
    const inboxFile = inboxPath ? await findExactOrBase(inboxPath, IMAGE_EXTS) : null;
    const publicFile = publicByFilename ? await findExactOrBase(publicByFilename, IMAGE_EXTS) : null;

    let status = "missing";
    let statusDetail = "manifest prompt only";
    let actual = null;
    if (publicByArtKey || publicFile || packagedByArtKey) {
      status = "completed";
      statusDetail = "public or packaged output exists";
      actual = publicByArtKey || publicFile || packagedByArtKey;
    } else if (inboxFile) {
      status = "ready";
      statusDetail = "inbox file exists, sync pending";
      actual = inboxFile;
    }

    records.push(makeRecord({
      id: `image:${asset.asset_id ?? artKey}`,
      partId: String(asset.part_id ?? chapterToPartId(chapterId)),
      chapterId,
      mediaType: "image",
      assetType: String(asset.asset_type ?? "image"),
      title: String(asset.asset_id ?? artKey),
      status,
      statusDetail,
      promptPath: asset.prompt_file ?? "",
      expectedPaths: [
        inboxPath ? relFromRoot(inboxPath) : "",
        artKey ? `public/generated/images/${artKey}.webp` : "",
        filenameTarget ? `public/generated/images/${filenameTarget}` : "",
      ],
      actualPath: actual ? relFromRoot(actual) : "",
      previewPath: actual ? relFromRoot(actual) : "",
    }));
  }

  return records;
}

async function collectImagesFromRuntimeManifest(existingIds) {
  const manifestPath = path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "runtime-asset-manifest.json");
  const manifest = await readJson(manifestPath, { mappings: [] });
  const publicImageDir = path.join(PUBLIC_GENERATED_ROOT, "images");
  const records = [];

  for (const mapping of manifest.mappings ?? []) {
    const chapterId = String(mapping.chapter_id ?? "").trim();
    if (!chapterId || !/^CH\d{2}$/u.test(chapterId)) continue;

    const artKey = String(mapping.art_key_final ?? mapping.runtime_art_key ?? "").trim();
    const runtimeKey = String(mapping.runtime_art_key ?? "").trim();
    const filenameTarget = String(mapping.filename_target ?? "").trim();
    const id = `image:runtime:${chapterId}:${runtimeKey || artKey}`;
    if (existingIds.has(id) || [...existingIds].some((value) => value.includes(String(mapping.asset_id ?? "")))) continue;

    const byArtKey = artKey ? await findByBase(publicImageDir, artKey, IMAGE_EXTS) : null;
    const byFilename = filenameTarget ? await findExactOrBase(path.join(publicImageDir, filenameTarget), IMAGE_EXTS) : null;
    const actual = byArtKey || byFilename;

    records.push(makeRecord({
      id,
      partId: chapterToPartId(chapterId),
      chapterId,
      mediaType: "image",
      assetType: "runtime",
      title: runtimeKey || artKey,
      status: actual ? "completed" : "missing",
      statusDetail: actual ? "runtime mapped output exists" : "runtime mapped output missing",
      promptPath: "",
      expectedPaths: [
        artKey ? `public/generated/images/${artKey}.webp` : "",
        filenameTarget ? `public/generated/images/${filenameTarget}` : "",
      ],
      actualPath: actual ? relFromRoot(actual) : "",
      previewPath: actual ? relFromRoot(actual) : "",
    }));
  }

  return records;
}

async function collectVideos() {
  const records = [];
  for (const part of PARTS) {
    const manifestPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, `part${part.id.slice(1)}-video-prompts`, "manifest.json");
    const manifest = await readJson(manifestPath, { prompts: [] });
    for (const prompt of manifest.prompts ?? []) {
      const videoId = String(prompt.video_id ?? "").trim();
      if (!videoId) continue;

      const chapterId = String(prompt.chapter_id ?? part.chapters[0]).trim();
      const targetVideo = prompt.target_video_path ?? `public/generated/videos/${videoId}.mp4`;
      const targetPoster = prompt.target_poster_path ?? (prompt.source_art_key ? `public/generated/images/${prompt.source_art_key}.webp` : "");
      const videoFile = await findExactOrBase(resolveNormalizedRepoPath(targetVideo), VIDEO_EXTS);
      const posterFile = targetPoster ? await findExactOrBase(resolveNormalizedRepoPath(targetPoster), IMAGE_EXTS) : null;

      let status = "missing";
      let statusDetail = "video and poster missing";
      if (videoFile) {
        status = "completed";
        statusDetail = "video output exists";
      } else if (posterFile) {
        status = "ready";
        statusDetail = "poster exists, video missing";
      }

      records.push(makeRecord({
        id: `video:${videoId}`,
        partId: part.id,
        chapterId: /^CH\d{2}$/u.test(chapterId) ? chapterId : part.chapters[0],
        mediaType: "video",
        assetType: String(prompt.kind ?? "video"),
        title: videoId,
        status,
        statusDetail,
        promptPath: path.join(`private/prompts/antigravity/part${part.id.slice(1)}-video-prompts`, prompt.file ?? ""),
        expectedPaths: [targetVideo, targetPoster],
        actualPath: videoFile ? relFromRoot(videoFile) : posterFile ? relFromRoot(posterFile) : "",
        previewPath: videoFile ? relFromRoot(videoFile) : "",
        posterPath: posterFile ? relFromRoot(posterFile) : "",
      }));
    }
  }
  return records;
}

function createChapterBuckets(records) {
  const parts = PARTS.map((part) => {
    const chapters = part.chapters.map((chapterId) => {
      const items = records.filter((record) => record.partId === part.id && record.chapterId === chapterId);
      return {
        id: chapterId,
        title: CHAPTER_TITLES[chapterId] ?? chapterId,
        items,
        counts: countRecords(items),
      };
    });
    const items = chapters.flatMap((chapter) => chapter.items);
    return {
      id: part.id,
      label: part.label,
      chapters,
      counts: countRecords(items),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    parts,
    totals: countRecords(records),
  };
}

function countRecords(records) {
  const counts = {
    total: records.length,
    image: 0,
    video: 0,
    completed: 0,
    ready: 0,
    missing: 0,
  };
  for (const record of records) {
    counts[record.mediaType] = (counts[record.mediaType] ?? 0) + 1;
    counts[record.status] = (counts[record.status] ?? 0) + 1;
  }
  return counts;
}

function escHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineJson(value) {
  return JSON.stringify(value).replace(/[<>&]/gu, (char) => (
    char === "<" ? "\\u003c" : char === ">" ? "\\u003e" : "\\u0026"
  ));
}

function renderHtml(data) {
  const payload = inlineJson(data);
  const script = `
const data = JSON.parse(document.getElementById("dashboard-data").textContent);
const state = { part: "P1", type: "all", status: "all", query: "" };
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
function activePart() { return data.parts.find((part) => part.id === state.part) || data.parts[0]; }
function matches(item) {
  if (state.type !== "all" && item.mediaType !== state.type) return false;
  if (state.status !== "all" && item.status !== state.status) return false;
  if (!state.query.trim()) return true;
  const haystack = [item.id, item.title, item.chapterId, item.chapterTitle, item.assetType, item.promptPath, item.actualPath, ...(item.expectedPaths || [])].join(" ").toLowerCase();
  return haystack.includes(state.query.trim().toLowerCase());
}
function renderButtons(id, values, current, onClick) {
  $(id).innerHTML = values.map((item) => '<button class="' + (item.value === current ? 'active' : '') + '" data-value="' + esc(item.value) + '">' + esc(item.label) + '</button>').join("");
  $(id).querySelectorAll("button").forEach((button) => button.addEventListener("click", () => onClick(button.dataset.value)));
}
function renderSummary(counts) {
  $("summary").innerHTML = [
    ["전체", counts.total],
    ["이미지", counts.image],
    ["영상", counts.video],
    ["완료", counts.completed],
    ["대기", counts.ready],
    ["누락", counts.missing],
  ].map(([label, value]) => '<article class="stat"><span>' + esc(label) + '</span><strong>' + (value || 0) + '</strong></article>').join("");
}
function preview(item) {
  if (item.mediaType === "image" && item.previewPath) return '<img src="' + esc(item.previewPath) + '" alt="' + esc(item.title) + '" loading="lazy" />';
  if (item.mediaType === "video" && item.previewPath) return '<video controls preload="none" poster="' + esc(item.posterPath || "") + '"><source src="' + esc(item.previewPath) + '" /></video>';
  if (item.mediaType === "video" && item.posterPath) return '<img src="' + esc(item.posterPath) + '" alt="' + esc(item.title) + '" loading="lazy" />';
  return '<div class="empty-preview">미리보기 없음</div>';
}
function renderCard(item) {
  return '<article class="card ' + esc(item.status) + '">' +
    '<div class="preview">' + preview(item) + '</div>' +
    '<div class="card-body">' +
      '<div class="topline"><span class="pill">' + esc(item.status) + '</span><span>' + esc(item.mediaType + " / " + item.assetType) + '</span></div>' +
      '<h3>' + esc(item.title) + '</h3>' +
      '<p>' + esc(item.statusDetail) + '</p>' +
      '<div class="paths"><small>prompt</small><code>' + esc(item.promptPath || "-") + '</code><small>expected</small><code>' + esc((item.expectedPaths || []).join("\\n") || "-") + '</code><small>actual</small><code>' + esc(item.actualPath || "-") + '</code></div>' +
    '</div>' +
  '</article>';
}
function renderChapters(part) {
  const chapters = part.chapters.map((chapter) => {
    const items = chapter.items.filter(matches);
    if (!items.length) return "";
    const counts = items.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {});
    return '<section class="chapter">' +
      '<header><div><h2>' + esc(chapter.id + " " + chapter.title) + '</h2><p>' + items.length + '개 산출물</p></div><div class="chips"><span>완료 ' + (counts.completed || 0) + '</span><span>대기 ' + (counts.ready || 0) + '</span><span>누락 ' + (counts.missing || 0) + '</span></div></header>' +
      '<div class="grid">' + items.map(renderCard).join("") + '</div>' +
    '</section>';
  }).join("");
  $("chapters").innerHTML = chapters || '<section class="empty">현재 필터와 일치하는 산출물이 없습니다.</section>';
}
function render() {
  renderButtons("part-tabs", data.parts.map((part) => ({ value: part.id, label: part.label })), state.part, (value) => { state.part = value; render(); });
  renderButtons("type-tabs", [{ value: "all", label: "전체" }, { value: "image", label: "이미지" }, { value: "video", label: "영상" }], state.type, (value) => { state.type = value; render(); });
  renderButtons("status-tabs", [{ value: "all", label: "전체 상태" }, { value: "completed", label: "완료" }, { value: "ready", label: "대기" }, { value: "missing", label: "누락" }], state.status, (value) => { state.status = value; render(); });
  const part = activePart();
  $("title-line").textContent = part.label + " / 이미지·영상 산출물";
  const visibleItems = part.chapters.flatMap((chapter) => chapter.items).filter(matches);
  renderSummary(visibleItems.reduce((acc, item) => { acc.total += 1; acc[item.mediaType] = (acc[item.mediaType] || 0) + 1; acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, { total: 0, image: 0, video: 0, completed: 0, ready: 0, missing: 0 }));
  renderChapters(part);
}
$("search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
render();`;

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Media Catalog Dashboard</title>
  <style>
    :root {
      --bg: #11100d;
      --panel: #f8f1e5;
      --card: #fffaf1;
      --line: #dacbb8;
      --text: #211a14;
      --muted: #76695d;
      --accent: #9e3f28;
      --blue: #1f6372;
      --ok: #28724b;
      --ready: #a7641d;
      --miss: #9d3029;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--text);
      background:
        radial-gradient(circle at 10% 0%, rgba(158, 63, 40, .35), transparent 34%),
        radial-gradient(circle at 90% 10%, rgba(31, 99, 114, .28), transparent 32%),
        linear-gradient(180deg, #191510 0%, var(--bg) 100%);
      font-family: "Segoe UI", "Noto Sans KR", sans-serif;
    }
    .shell { width: min(1560px, calc(100vw - 28px)); margin: 24px auto 48px; display: grid; gap: 16px; }
    .hero, .panel, .chapter { border: 1px solid rgba(218, 203, 184, .68); background: rgba(248, 241, 229, .95); border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,.22); }
    .hero { padding: 26px; display: grid; gap: 16px; }
    .eyebrow { color: var(--accent); font-weight: 900; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
    h1 { margin: 0; font-size: clamp(32px, 4.5vw, 58px); line-height: .96; letter-spacing: -.055em; }
    .hero p { margin: 0; color: var(--muted); line-height: 1.65; max-width: 960px; }
    .toolbar, .panel { padding: 18px; }
    .toolbar { display: grid; gap: 12px; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    button { border: 1px solid var(--line); background: var(--card); color: var(--text); border-radius: 999px; padding: 9px 13px; font: inherit; font-weight: 800; cursor: pointer; }
    button.active { background: var(--text); color: var(--panel); border-color: var(--text); }
    input { width: 100%; border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; font: inherit; background: var(--card); }
    .summary { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
    .stat { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 16px; display: grid; gap: 6px; }
    .stat span { color: var(--muted); font-size: 13px; }
    .stat strong { font-size: 30px; letter-spacing: -.04em; }
    .chapter { padding: 18px; display: grid; gap: 14px; }
    .chapter header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .chapter h2 { margin: 0; font-size: 22px; }
    .chapter p { margin: 4px 0 0; color: var(--muted); }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chips span { background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 800; }
    .grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; overflow: hidden; display: grid; }
    .preview { aspect-ratio: 16 / 10; background: linear-gradient(135deg, rgba(31,99,114,.2), rgba(158,63,40,.12)); display: grid; place-items: center; }
    .preview img, .preview video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .empty-preview { color: var(--muted); padding: 24px; }
    .card-body { padding: 15px; display: grid; gap: 10px; }
    .topline { display: flex; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 12px; font-weight: 800; }
    .pill { color: white; background: var(--miss); border-radius: 999px; padding: 5px 8px; text-transform: uppercase; }
    .completed .pill { background: var(--ok); }
    .ready .pill { background: var(--ready); }
    .card h3 { margin: 0; font-size: 18px; overflow-wrap: anywhere; }
    .card p { margin: 0; color: var(--muted); }
    .paths { display: grid; gap: 6px; }
    .paths small { color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
    code { white-space: pre-wrap; word-break: break-word; background: rgba(33,26,20,.06); border-radius: 10px; padding: 8px; font-size: 12px; }
    .empty { padding: 36px; text-align: center; border: 1px dashed var(--line); border-radius: 20px; color: var(--muted); background: rgba(255,250,241,.72); }
    @media (max-width: 700px) { .shell { width: min(100vw - 18px, 100%); margin-top: 12px; } .hero, .panel, .chapter { border-radius: 18px; } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="eyebrow">Image / Video Ops</div>
      <h1>Part별 챕터별 미디어 산출물 관리</h1>
      <p>이미지와 영상 산출물을 실제 파일 상태 기준으로 정리합니다. 완료는 public/packaged 결과물이 있는 상태, 대기는 inbox 또는 포스터만 있는 상태, 누락은 prompt/manifest만 있는 상태입니다.</p>
    </section>
    <section class="panel toolbar">
      <div class="row" id="part-tabs"></div>
      <div class="row" id="type-tabs"></div>
      <div class="row" id="status-tabs"></div>
      <input id="search" type="search" placeholder="챕터, 파일명, art key, prompt 경로 검색" />
    </section>
    <section class="panel">
      <h2 id="title-line" style="margin:0 0 14px;"></h2>
      <div id="summary" class="summary"></div>
    </section>
    <section id="chapters" style="display:grid;gap:16px;"></section>
  </main>
  <script type="application/json" id="dashboard-data">${payload}</script>
  <script>${script}</script>
</body>
</html>
`;
}

function renderMd(data) {
  const lines = [];
  lines.push("# Media Catalog Dashboard");
  lines.push("");
  lines.push(`- Generated: \`${data.generatedAt}\``);
  lines.push("- Scope: images + videos only");
  lines.push("- Status: `completed` = public/packaged output exists, `ready` = inbox or poster exists, `missing` = prompt/manifest only");
  lines.push("");
  lines.push("## Part Summary");
  lines.push("");
  lines.push("| Part | Total | Images | Videos | Completed | Ready | Missing |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|");
  for (const part of data.parts) {
    lines.push(`| ${part.label} | ${part.counts.total} | ${part.counts.image} | ${part.counts.video} | ${part.counts.completed} | ${part.counts.ready} | ${part.counts.missing} |`);
  }
  lines.push("");

  for (const part of data.parts) {
    lines.push(`## ${part.label}`);
    lines.push("");
    lines.push("| Chapter | Total | Images | Videos | Completed | Ready | Missing |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|");
    for (const chapter of part.chapters) {
      lines.push(`| ${chapter.id} ${chapter.title} | ${chapter.counts.total} | ${chapter.counts.image} | ${chapter.counts.video} | ${chapter.counts.completed} | ${chapter.counts.ready} | ${chapter.counts.missing} |`);
    }
    lines.push("");
    for (const chapter of part.chapters) {
      if (!chapter.items.length) continue;
      lines.push(`### ${chapter.id} ${chapter.title}`);
      lines.push("");
      lines.push("| Status | Type | Title | Actual | Prompt |");
      lines.push("|---|---|---|---|---|");
      for (const item of chapter.items) {
        lines.push(`| ${item.status} | ${item.mediaType}/${item.assetType} | ${item.title} | ${item.actualPath || "-"} | ${item.promptPath || "-"} |`);
      }
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const imageRecords = await collectImagesFromMasterManifest();
  const existingIds = new Set(imageRecords.map((record) => record.id));
  const runtimeRecords = await collectImagesFromRuntimeManifest(existingIds);
  const videoRecords = await collectVideos();
  const records = [...imageRecords, ...runtimeRecords, ...videoRecords];
  const data = createChapterBuckets(records);

  await fs.writeFile(OUTPUT_HTML, renderHtml(data), "utf8");
  await fs.writeFile(OUTPUT_MD, renderMd(data), "utf8");

  console.log(JSON.stringify({
    html: relFromRoot(OUTPUT_HTML),
    markdown: relFromRoot(OUTPUT_MD),
    totals: data.totals,
    parts: Object.fromEntries(data.parts.map((part) => [part.id, part.counts])),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
