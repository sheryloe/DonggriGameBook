#!/usr/bin/env node
/**
 * Is a deadline actually reachable?
 *
 * Deadlines are declared as hours after the chapter is entered, but the numbers
 * were never checked against how long the chapter takes. Measuring the shortest
 * route to each boss showed every chapter losing at least one quest — CH02 two —
 * on a run that took no detours at all. That is not tension, it is a scripted
 * loss, and two failures force the ashen escape regardless of anything else.
 *
 * This walks the same weighted graph the boss-distance audit uses and reports,
 * for every quest, the earliest in-game hour its completion event can be reached.
 * A deadline has to sit above that with room to spare, or the quest is decorative.
 *
 * Usage:
 *   node scripts/audit-part1-deadline-reach.mjs
 *   node scripts/audit-part1-deadline-reach.mjs --suggest   # proposed table
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const SURVIVAL = join(ROOT, "apps", "part1", "src", "utils", "survival.ts");

/** `eventRunner.choiceTimeCost`: an hour a choice, two if it grants loot, plus
 *  an hour to resolve a fight. */
function eventHours(event) {
  const grantsLoot = [...(event?.choices ?? []).flatMap((c) => c.effects ?? []), ...(event?.on_complete_effects ?? [])]
    .some((effect) => effect.op === "grant_loot_table");
  const fight = event?.combat || event?.event_type === "combat" || event?.event_type === "boss" ? 1 : 0;
  return (grantsLoot ? 2 : 1) + fight;
}

/** Earliest in-game hour at which each event can be reached, from chapter entry. */
export function earliestHours(chapter) {
  const byId = new Map(chapter.events.map((e) => [e.event_id, e]));
  const nodeById = new Map(chapter.nodes.map((n) => [n.node_id, n]));

  const next = new Map();
  const edge = (from, to, cost) => {
    if (!byId.has(to) || from === to) return;
    if (!next.has(from)) next.set(from, []);
    next.get(from).push({ to, cost });
  };

  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      if (choice.next_event_id) edge(event.event_id, choice.next_event_id, eventHours(event));
    }
    const ends = !(event.choices ?? []).some((c) => byId.has(c.next_event_id ?? ""));
    if (!ends) continue;
    const node = nodeById.get(event.node_id);
    const reachable = [
      { node, travel: 0 },
      ...(node?.connections ?? []).map((l) => ({ node: nodeById.get(l.to), travel: Number(l.cost?.time ?? 0) })),
    ];
    for (const { node: target, travel } of reachable) {
      let hours = travel + eventHours(event);
      for (const id of target?.event_ids ?? []) {
        edge(event.event_id, id, hours);
        hours += eventHours(byId.get(id));
      }
    }
  }

  const dist = new Map();
  let clock = 0;
  for (const id of nodeById.get(chapter.entry_node_id)?.event_ids ?? []) {
    clock += eventHours(byId.get(id));
    dist.set(id, clock);
  }

  const visited = new Set();
  for (;;) {
    let at = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (visited.has(id) || d >= best) continue;
      at = id; best = d;
    }
    if (at === null) break;
    visited.add(at);
    for (const { to, cost } of next.get(at) ?? []) {
      if (best + cost >= (dist.get(to) ?? Infinity)) continue;
      dist.set(to, best + cost);
    }
  }
  return dist;
}

export function readQuests() {
  const source = readFileSync(SURVIVAL, "utf8");
  return [...source.matchAll(
    /questId:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)",\s*\n\s*chapterId:\s*"([^"]+)",\s*\n\s*completionEventId:\s*"([^"]+)",\s*\n\s*hoursAfterChapterEntry:\s*(\d+)/gu,
  )].map(([, questId, label, chapterId, completionEventId, hours]) => ({
    questId, label, chapterId, completionEventId, hours: Number(hours),
  }));
}

export function readReach() {
  const reach = new Map();
  for (let n = 1; n <= 5; n += 1) {
    const id = `ch${String(n).padStart(2, "0")}`;
    const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
    reach.set(chapter.chapter_id, { dist: earliestHours(chapter), boss: chapter.boss_event_id });
  }
  return reach;
}

/**
 * The margin is what makes the deadline a decision rather than a formality: it
 * is how many extra screens of side content a player can afford before the quest
 * slips. Four hours is roughly four optional beats.
 */
export const MARGIN = 4;

/** Above this much slack the deadline stops applying any pressure at all. */
export const MAX_SLACK = 12;

// Importable: the deadline test asserts against the same measurement, so the
// report only runs when this file is the entry point.
if (resolve(process.argv[1] ?? "") !== fileURLToPath(import.meta.url)) {
  // imported as a library
} else {
  report();
}

function report() {
const quests = readQuests();
const reach = readReach();

console.log("quest              최단 도달  현재 기한  판정        제안");
const suggestions = [];
for (const q of quests) {
  const info = reach.get(q.chapterId);
  const earliest = info?.dist.get(q.completionEventId);
  if (earliest === undefined) {
    console.log(`  ${q.questId.padEnd(18)}${"도달 불가".padStart(9)}  ${String(`${q.hours}h`).padStart(8)}  완료 이벤트에 닿을 수 없다`);
    continue;
  }
  const suggested = earliest + MARGIN;
  const verdict = q.hours < earliest ? "구조적 실패" : q.hours < suggested ? "여유 없음" : "여유 있음";
  suggestions.push({ ...q, earliest, suggested });
  console.log(
    `  ${q.questId.padEnd(18)}${String(`${earliest}h`).padStart(9)}  ${String(`${q.hours}h`).padStart(8)}  ${verdict.padEnd(12)}${suggested}h`,
  );
}

console.log("\n보스 도달 시각 (참고)");
for (const [chapterId, info] of reach) {
  console.log(`  ${chapterId}  ${info.dist.get(info.boss) ?? "?"}h`);
}

if (process.argv.includes("--suggest")) {
  console.log("\n제안 테이블 (hoursAfterChapterEntry)");
  for (const s of suggestions) console.log(`  ${s.questId}: ${s.hours} → ${s.suggested}`);
}
}
