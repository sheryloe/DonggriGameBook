#!/usr/bin/env node
/**
 * Reconnect P1 events that were authored but can never be reached.
 *
 * The runtime surfaces an event only if its id appears in `node.event_ids`
 * (`gameStore.ts` -> `findFirstAvailableEvent`). An event carries its own
 * `node_id`, and a quest track can name an `entry_event_id`, but the engine
 * reads neither of those when deciding what to show. So an event that was given
 * a node and left out of that node's list is authored, shipped, and unplayable
 * — and a side quest whose entry event is in that state can never start at all.
 *
 * The fix is to honour what the author already wrote: append the orphan to the
 * `event_ids` of the node it declares. Appending rather than inserting keeps
 * every existing sequence intact, because `findFirstAvailableEvent` returns the
 * first entry that still passes `canTriggerEvent` — so the chapter plays exactly
 * as before until its current events are used up, and only then reaches the
 * reconnected ones.
 *
 * Usage:
 *   node scripts/repair-part1-orphan-events.mjs                              # plan
 *   node scripts/repair-part1-orphan-events.mjs --apply --confirm-part1-orphan-repair
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:",
  "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-orphan-repair", "backup",
);

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-orphan-repair");

function analyse(chapter) {
  const hosted = new Set();
  for (const node of chapter.nodes) for (const id of node.event_ids ?? []) hosted.add(id);

  const linked = new Set();
  for (const ev of chapter.events) {
    for (const choice of ev.choices ?? []) {
      if (choice.next_event_id) linked.add(choice.next_event_id);
    }
  }

  const questEntry = new Map();
  for (const q of chapter.quest_tracks ?? []) {
    if (q.entry_event_id) questEntry.set(q.entry_event_id, q);
  }

  const nodesById = new Map(chapter.nodes.map((n) => [n.node_id, n]));
  const orphans = [];
  for (const ev of chapter.events) {
    if (hosted.has(ev.event_id) || linked.has(ev.event_id)) continue;
    orphans.push({
      event_id: ev.event_id,
      event_type: ev.event_type,
      node_id: ev.node_id,
      node_exists: nodesById.has(ev.node_id),
      // An event gated on conditions may still not show up after reconnection;
      // worth reporting so a silent no-op is not mistaken for a repair.
      conditions: ev.conditions ?? [],
      quest: questEntry.get(ev.event_id) ?? null,
    });
  }
  return { orphans, nodesById };
}

const summary = [];
let totalReconnected = 0;
let totalSkipped = 0;

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const { orphans, nodesById } = analyse(chapter);
  if (!orphans.length) {
    summary.push({ chapter: chapter.chapter_id, reconnected: 0, skipped: 0, quests_revived: 0 });
    continue;
  }

  const reconnected = [];
  const skipped = [];
  for (const o of orphans) {
    if (!o.node_exists) {
      skipped.push({ ...o, reason: `node ${o.node_id} does not exist` });
      continue;
    }
    reconnected.push(o);
    if (apply && confirmed) nodesById.get(o.node_id).event_ids.push(o.event_id);
  }

  const questsRevived = reconnected.filter((o) => o.quest).length;
  totalReconnected += reconnected.length;
  totalSkipped += skipped.length;
  summary.push({
    chapter: chapter.chapter_id,
    reconnected: reconnected.length,
    skipped: skipped.length,
    quests_revived: questsRevived,
  });

  console.log(`\n${chapter.chapter_id} — ${reconnected.length}개 재연결${skipped.length ? `, ${skipped.length}개 보류` : ""}`);
  for (const o of reconnected) {
    const tag = o.quest ? `  ← 사이드 퀘스트 부활: ${o.quest.title}` : "";
    const gated = o.conditions.length ? `  (조건 ${o.conditions.length}개)` : "";
    console.log(`  ${o.node_id} += ${o.event_id.padEnd(42)} ${o.event_type}${gated}${tag}`);
  }
  for (const s of skipped) console.log(`  보류 ${s.event_id} — ${s.reason}`);

  if (apply && confirmed) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

console.log("\n" + "=".repeat(60));
console.log("chapter  재연결  보류  부활한 퀘스트");
for (const s of summary) {
  console.log(`  ${s.chapter}  ${String(s.reconnected).padStart(6)}  ${String(s.skipped).padStart(4)}  ${String(s.quests_revived).padStart(12)}`);
}
console.log(`합계 재연결 ${totalReconnected}, 보류 ${totalSkipped}`);

if (apply && confirmed) {
  console.log(`\n적용 완료. 백업: ${BACKUP_DIR}`);
} else if (apply) {
  console.log("\n--confirm-part1-orphan-repair 없이는 쓰지 않는다.");
  process.exitCode = 1;
} else {
  console.log("\n계획만 출력했다. 적용하려면 --apply --confirm-part1-orphan-repair");
}
