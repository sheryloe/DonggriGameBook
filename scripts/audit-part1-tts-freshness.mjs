#!/usr/bin/env node
/**
 * Does every narration line have audio that says the same thing?
 *
 * `audit-part1-tts-script-drift.mjs` answers a narrower question: which of the
 * original 144 files drifted from a snapshot taken on 2026-08-08. That was the
 * right question while the scripts were being repaired against that baseline.
 * It cannot answer whether the audio shipping today matches the text shipping
 * today, because it only looks at those 144 and only at that snapshot.
 *
 * This compares the current chapter text to the current manifest and the files
 * on disk: every event that should be voiced has a file, the file was written
 * after the text it speaks, and nothing is left over from a line that no longer
 * exists.
 *
 * Usage: node scripts/audit-part1-tts-freshness.mjs
 */

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const MANIFEST = join(ROOT, "private", "prompts", "media-production", "part1", "tts-mp3", "manifest.json");
const AUDIO_ROOT = join(ROOT, "public", "generated", "audio", "tts", "P1");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];

if (!existsSync(MANIFEST)) {
  console.error("manifest 가 없다. generate-part1-tts-mp3.mjs --dry-run 을 먼저 실행한다.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const rows = Array.isArray(manifest) ? manifest : manifest.items ?? manifest.entries ?? [];

/** The line the manifest says each file should speak. */
const expected = new Map(rows.map((r) => [r.event_id, r]));

const chapterMTime = new Map();
for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  chapterMTime.set(id.toUpperCase(), statSync(path).mtimeMs);
}

let voiced = 0;
let missing = 0;
let stale = 0;
const problems = [];

for (const row of rows) {
  const out = join(ROOT, String(row.output ?? "").replaceAll("/", "\\"));
  if (!existsSync(out)) {
    missing += 1;
    problems.push(`파일 없음: ${row.event_id}`);
    continue;
  }
  voiced += 1;
  const audioAt = statSync(out).mtimeMs;
  const textAt = chapterMTime.get(row.chapter_id) ?? 0;
  if (audioAt < textAt) {
    stale += 1;
    problems.push(`대본보다 오래됨: ${row.event_id}`);
  }
}

/**
 * Audio that belongs to a screen rather than an event, so it is not in the
 * event manifest and is not left over. `FIRST_SCREEN_CH01` is loaded directly
 * by `BriefingScreen.tsx`.
 */
const NOT_EVENT_AUDIO = new Set(["FIRST_SCREEN_CH01"]);

/** Files whose event is no longer in the manifest are left over from old text. */
let orphaned = 0;
if (existsSync(AUDIO_ROOT)) {
  for (const chapter of readdirSync(AUDIO_ROOT, { withFileTypes: true })) {
    if (!chapter.isDirectory()) continue;
    for (const file of readdirSync(join(AUDIO_ROOT, chapter.name))) {
      if (!file.endsWith(".mp3")) continue;
      const eventId = file.replace(/\.mp3$/u, "");
      if (NOT_EVENT_AUDIO.has(eventId)) continue;
      if (!expected.has(eventId)) {
        orphaned += 1;
        problems.push(`대본에 없는 음성: ${chapter.name}/${file}`);
      }
    }
  }
}

console.log(`대본 항목 ${rows.length}`);
console.log(`  음성 있음   ${voiced}`);
console.log(`  파일 없음   ${missing}`);
console.log(`  대본보다 오래됨 ${stale}`);
console.log(`  대본에 없는 음성 ${orphaned}`);
for (const p of problems.slice(0, 12)) console.log(`    ${p}`);
if (problems.length > 12) console.log(`    ... 외 ${problems.length - 12}건`);

const pass = missing === 0 && stale === 0 && orphaned === 0;
console.log(`\nPart 1 TTS 신선도: ${pass ? "PASS" : "FAIL"}`);
if (!pass) process.exitCode = 1;
