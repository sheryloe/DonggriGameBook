#!/usr/bin/env node
/**
 * Use the art each chapter already has.
 *
 * Every chapter maps a `briefing_p1_chXX` key to its own key-art poster and a
 * `map_p1_chXX` key to a route diagram, and no event referenced either: the
 * briefing screen was showing the same corridor background as the events after
 * it, and route-scouting events showed the room they were standing in rather
 * than the map they were reading.
 *
 * `result_p1_chXX` is deliberately left alone. It points at the same file as
 * `briefing_p1_chXX`, so using it would raise the distinct-key count in the
 * quality audit without the player seeing anything new — which is measuring
 * better rather than being better.
 *
 * Usage:
 *   node scripts/repair-part1-art-variety.mjs
 *   node scripts/repair-part1-art-variety.mjs --apply --confirm-part1-art-variety
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const OVERRIDES = join(ROOT, "packages", "app-runtime", "src", "assets", "runtimeArtOverrides.json");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-art-variety", "backup",
);

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-art-variety");

const overrides = JSON.parse(readFileSync(OVERRIDES, "utf8"));
const mapped = new Set(overrides.mappings.flatMap((m) => m.runtime_art_keys ?? []));

/** The events a route diagram genuinely belongs on. */
const READS_THE_MAP = /경로|노선|루트|정찰|지도|진입로|동선|우회/u;

let assigned = 0;
const perChapter = {};

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const briefingKey = `briefing_p1_${id}`;
  const mapKey = `map_p1_${id}`;
  const changes = [];

  for (const event of chapter.events) {
    const current = event.presentation?.art_key;

    if (event.event_type === "briefing" && mapped.has(briefingKey) && current !== briefingKey) {
      changes.push({ event: event.event_id, from: current, to: briefingKey });
      if (apply && confirmed) event.presentation.art_key = briefingKey;
      continue;
    }

    // One per chapter: the first scouting beat, where a diagram is what the
    // character is actually looking at.
    const alreadyMapped = changes.some((c) => c.to === mapKey);
    const scouting = event.event_type === "exploration" && READS_THE_MAP.test(String(event.title ?? ""));
    if (scouting && !alreadyMapped && mapped.has(mapKey) && current !== mapKey) {
      changes.push({ event: event.event_id, from: current, to: mapKey });
      if (apply && confirmed) event.presentation.art_key = mapKey;
    }
  }

  for (const c of changes) console.log(`  ${chapter.chapter_id}  ${c.event.padEnd(38)} ${c.from} → ${c.to}`);
  assigned += changes.length;
  perChapter[chapter.chapter_id] = changes.length;

  if (apply && confirmed && changes.length) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

console.log(`\n배정 ${assigned}건`);
for (const [id, n] of Object.entries(perChapter)) console.log(`  ${id}  ${n}건`);

if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-art-variety 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-art-variety");
