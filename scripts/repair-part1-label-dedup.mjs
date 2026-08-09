#!/usr/bin/env node
/**
 * Keep any choice label from appearing more than twice across P1.
 *
 * The flow audit treats a third occurrence as an error, on the grounds that a
 * line the player meets three times in one part stops reading as writing and
 * starts reading as furniture. Repair passes that rewrite labels can trip this
 * on their own — a pass that assigns from a fixed pool, or that qualifies by
 * node when several result screens sit on the same node, will collide — and
 * they cannot catch it themselves because by then the label no longer looks
 * like the thing they were fixing.
 *
 * So this runs last and looks only at the outcome: whatever is over the limit,
 * whoever put it there.
 *
 * Usage:
 *   node scripts/repair-part1-label-dedup.mjs
 *   node scripts/repair-part1-label-dedup.mjs --apply --confirm-part1-label-dedup
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fixJosa } from "./lib/korean-josa.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const LIMIT = 2;
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-label-dedup", "backup",
);

/** Ways to say "leave here" that differ by more than a synonym. */
function variants(nodeName, eventTitle) {
  const where = String(nodeName ?? "").trim();
  const what = String(eventTitle ?? "").replace(/\s*결과$/u, "").trim();
  return [
    where && `${where}에서 걸음을 뗀다`,
    where && `${where}을 정리하고 나선다`,
    where && `${where}에 더 머물지 않는다`,
    what && `${what}을 여기서 접는다`,
    what && `${what} 뒤를 정리한다`,
    where && `${where}의 문을 닫는다`,
    what && `${what}에서 손을 뗀다`,
  ].filter(Boolean);
}

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-label-dedup");

const loaded = P1.map((id) => ({
  id,
  path: join(CHAPTER_DIR, `${id}.json`),
  chapter: JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8")),
}));

const counts = new Map();
for (const { chapter } of loaded) {
  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      const label = String(choice.label ?? "").trim();
      if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }
}

const over = new Set([...counts].filter(([, n]) => n > LIMIT).map(([label]) => label));
console.log(`${LIMIT}회를 넘긴 라벨 ${over.size}종`);

let renamed = 0;
const seen = new Map();

for (const { id, path, chapter } of loaded) {
  const nodeName = Object.fromEntries(chapter.nodes.map((n) => [n.node_id, n.name]));
  let touched = 0;

  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      const label = String(choice.label ?? "").trim();
      if (!over.has(label)) continue;

      const used = (seen.get(label) ?? 0) + 1;
      seen.set(label, used);
      // The first two keep it; only the surplus gets renamed.
      if (used <= LIMIT) continue;

      const next = variants(nodeName[event.node_id], event.title)
        .find((candidate) => (counts.get(candidate) ?? 0) < LIMIT);
      if (!next) { console.log(`  대체안 없음: ${event.event_id} ${label}`); continue; }

      counts.set(next, (counts.get(next) ?? 0) + 1);
      counts.set(label, (counts.get(label) ?? 1) - 1);
      console.log(`  ${chapter.chapter_id}  ${event.event_id.padEnd(46)} ${label} → ${next}`);
      if (apply && confirmed) choice.label = fixJosa(next);
      renamed += 1;
      touched += 1;
    }
  }

  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

console.log(`\n재명명 ${renamed}건`);
if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-label-dedup 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-label-dedup");
