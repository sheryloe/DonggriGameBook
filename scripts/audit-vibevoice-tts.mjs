import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const queueDir = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-vibevoice");
const queuePath = path.join(queueDir, "queue.json");
const auditPath = path.join(queueDir, "audit.json");
const reviewPath = path.join(queueDir, "full-review.md");
const representativeEvents = [
  "EV_CH01_BRIEFING",
  "EV_CH01_BOSS_BROADCAST",
  "EV_CH02_BLACKMARKET",
  "EV_CH02_SLUICE_BOSS",
  "EV_CH03_SKYBRIDGE",
  "EV_CH03_BOSS_GARDEN",
  "EV_CH04_BOSS_PICKER",
  "EV_CH05_BOSS_LINES",
  "EV_CH05_EXTRACTION",
];

function absolute(output) {
  return path.join(repoRoot, output.replaceAll("/", path.sep));
}

function winToWsl(filePath) {
  const absolutePath = path.resolve(filePath);
  const drive = absolutePath.slice(0, 1).toLowerCase();
  const rest = absolutePath.slice(2).replaceAll("\\", "/");
  return `/mnt/${drive}${rest}`;
}

function ffprobeDuration(filePath) {
  if (!existsSync(filePath)) return null;
  const result = spawnSync(
    "wsl",
    [
      "-e",
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      winToWsl(filePath),
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 },
  );
  if (result.status !== 0) return null;
  const value = Number(String(result.stdout).trim());
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

const hashCache = new Map();
function fileHash(filePath) {
  if (!existsSync(filePath)) return null;
  if (!hashCache.has(filePath)) {
    hashCache.set(filePath, createHash("sha256").update(readFileSync(filePath)).digest("hex"));
  }
  return hashCache.get(filePath);
}

function emptyProviderSummary() {
  return {
    total: 0,
    completed_audition: 0,
    approved_runtime: 0,
    unavailable: 0,
    failed: 0,
    missing: 0,
    profile_version_2: 0,
    missing_audition_file: 0,
    zero_byte_audition_file: 0,
    nonpositive_audition_duration: 0,
    missing_runtime_file: 0,
    zero_byte_runtime_file: 0,
    nonpositive_runtime_duration: 0,
    runtime_audition_mismatch: 0,
    by_chapter: {},
  };
}

function emptyChapterSummary() {
  return {
    total: 0,
    completed_audition: 0,
    approved_runtime: 0,
    unavailable: 0,
    failed: 0,
    missing: 0,
    profile_version_2: 0,
    missing_audition_file: 0,
    zero_byte_audition_file: 0,
    nonpositive_audition_duration: 0,
    missing_runtime_file: 0,
    zero_byte_runtime_file: 0,
    nonpositive_runtime_duration: 0,
    runtime_audition_mismatch: 0,
  };
}

function addItemToSummary(bucket, item) {
  bucket.total += 1;
  if (bucket[item.status] !== undefined) bucket[item.status] += 1;
  if (Number(item.profile_version) === 2) bucket.profile_version_2 += 1;
  if (["completed_audition", "approved_runtime"].includes(item.status) && !item.audition_exists) bucket.missing_audition_file += 1;
  if (item.audition_exists && item.audition_bytes <= 0) bucket.zero_byte_audition_file += 1;
  if (["completed_audition", "approved_runtime"].includes(item.status) && !(item.audition_duration_seconds > 0)) {
    bucket.nonpositive_audition_duration += 1;
  }
  if (item.status === "approved_runtime" && !item.runtime_exists) bucket.missing_runtime_file += 1;
  if (item.runtime_exists && item.runtime_bytes <= 0) bucket.zero_byte_runtime_file += 1;
  if (item.status === "approved_runtime" && !(item.runtime_duration_seconds > 0)) bucket.nonpositive_runtime_duration += 1;
  if (item.status === "approved_runtime" && item.runtime_matches_audition === false) bucket.runtime_audition_mismatch += 1;
}

function markdownTable(rows) {
  return rows.join("\n");
}

function passFail(condition) {
  return condition ? "PASS" : "FAIL";
}

function reviewMarkdown(audit) {
  const realtime = audit.summary["vibevoice-realtime-0.5b"] ?? emptyProviderSummary();
  const representativeRows = representativeEvents.map((eventId) => {
    const item = audit.items.find((entry) => entry.provider === "vibevoice-realtime-0.5b" && entry.event_id === eventId);
    if (!item) return `| ${eventId} | missing | - | - | - | - | - | - |`;
    return `| ${item.event_id} | ${item.status} | ${item.chapter_id} | v${item.profile_version ?? "-"} | ${item.scene_profile ?? "-"} | ${item.pressure_profile ?? "-"} | ${item.runtime_duration_seconds ?? "-"} | ${item.runtime_matches_audition ?? "-"} |`;
  });

  const chapterRows = Object.entries(realtime.by_chapter)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([chapterId, bucket]) =>
        `| ${chapterId} | ${bucket.total} | ${bucket.approved_runtime} | ${bucket.profile_version_2} | ${bucket.missing_audition_file} | ${bucket.zero_byte_audition_file} | ${bucket.nonpositive_runtime_duration} | ${bucket.runtime_audition_mismatch} |`,
    );

  const acceptance = [
    ["approved_runtime = 144", realtime.approved_runtime === 144],
    ["profile_version = 2 count = 144", realtime.profile_version_2 === 144],
    ["missing_audition_file = 0", realtime.missing_audition_file === 0],
    ["zero_byte_audition_file = 0", realtime.zero_byte_audition_file === 0],
    ["runtime duration > 0", realtime.nonpositive_runtime_duration === 0],
    ["runtime/audition match", realtime.runtime_audition_mismatch === 0],
  ];

  return [
    "# VibeVoice Part 1 Full Review",
    "",
    `Generated at: ${audit.updated_at}`,
    "",
    "## Acceptance",
    "",
    "| Check | Result |",
    "| --- | --- |",
    ...acceptance.map(([label, ok]) => `| ${label} | ${passFail(ok)} |`),
    "",
    "## Realtime 0.5B By Chapter",
    "",
    "| Chapter | Total | Approved Runtime | Profile v2 | Missing Audition | Zero Audition | Bad Runtime Duration | Runtime Mismatch |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...chapterRows,
    "",
    "## Representative Events",
    "",
    "| Event | Status | Chapter | Profile | Scene | Pressure | Runtime Duration | Runtime Matches Audition |",
    "| --- | --- | --- | --- | --- | --- | ---: | --- |",
    ...representativeRows,
    "",
    "## Provider Summary",
    "",
    "```json",
    JSON.stringify(audit.summary, null, 2),
    "```",
    "",
  ].join("\n");
}

async function main() {
  const raw = await readFile(queuePath, "utf8");
  const queue = JSON.parse(raw.replace(/^\uFEFF/u, ""));
  const items = queue.items.map((item) => {
    const auditionPath = absolute(item.audition_mp3_output);
    const runtimePath = absolute(item.runtime_mp3_output);
    const auditionExists = existsSync(auditionPath);
    const runtimeExists = existsSync(runtimePath);
    const auditionHash = auditionExists ? fileHash(auditionPath) : null;
    const runtimeHash = runtimeExists ? fileHash(runtimePath) : null;
    return {
      id: item.id,
      provider: item.provider,
      chapter_id: item.chapter_id,
      event_id: item.event_id,
      event_title: item.event_title ?? "",
      event_type: item.event_type ?? null,
      status: item.status,
      profile_version: item.profile_version ?? null,
      scene_profile: item.scene_profile ?? null,
      pressure_profile: item.pressure_profile ?? null,
      postprocess_profile: item.postprocess_profile ?? null,
      audition_exists: auditionExists,
      audition_bytes: auditionExists ? statSync(auditionPath).size : 0,
      audition_duration_seconds: auditionExists ? ffprobeDuration(auditionPath) : null,
      runtime_exists: runtimeExists,
      runtime_bytes: runtimeExists ? statSync(runtimePath).size : 0,
      runtime_duration_seconds: runtimeExists ? ffprobeDuration(runtimePath) : null,
      runtime_matches_audition: auditionExists && runtimeExists ? auditionHash === runtimeHash : null,
      last_error: item.last_error ?? null,
    };
  });

  const summary = {};
  for (const item of items) {
    summary[item.provider] ??= emptyProviderSummary();
    summary[item.provider].by_chapter[item.chapter_id] ??= emptyChapterSummary();
    addItemToSummary(summary[item.provider], item);
    addItemToSummary(summary[item.provider].by_chapter[item.chapter_id], item);
  }

  const audit = {
    version: 2,
    updated_at: new Date().toISOString(),
    queue_version: queue.version ?? null,
    profile_version: queue.profile_version ?? null,
    summary,
    representative_events: representativeEvents,
    items,
  };

  await mkdir(queueDir, { recursive: true });
  await writeFile(auditPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(reviewPath, reviewMarkdown(audit), "utf8");
  console.log(JSON.stringify({ audit: path.relative(repoRoot, auditPath), review: path.relative(repoRoot, reviewPath), summary }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
