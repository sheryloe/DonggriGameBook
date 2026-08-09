#!/usr/bin/env node
/**
 * How far is the boss?
 *
 * "Decisions per minute" says how dense a chapter is on average but not what the
 * run actually feels like. What a player notices is how many screens they tap
 * through before the chapter's fight, and how many of those screens asked them
 * anything.
 *
 * The runtime moves in two ways: a choice can name the next event directly, and
 * a node can be walked to, after which its first available event fires. Both are
 * edges here, so the distance is measured over the graph the player really
 * traverses rather than over the event list.
 *
 * Usage: node scripts/audit-part1-boss-distance.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];

/**
 * `eventRunner.choiceTimeCost`: a choice costs an hour, or two if it grants a
 * loot table. Resolving an encounter adds another hour, and travel costs
 * whatever the connection says.
 */
function eventHours(event) {
  const grantsLoot = [...(event.choices ?? []).flatMap((c) => c.effects ?? []), ...(event.on_complete_effects ?? [])]
    .some((effect) => effect.op === "grant_loot_table");
  const base = grantsLoot ? 2 : 1;
  const fight = event.combat || event.event_type === "combat" || event.event_type === "boss" ? 1 : 0;
  return base + fight;
}

function analyse(chapter) {
  const byId = new Map(chapter.events.map((e) => [e.event_id, e]));
  const nodeById = new Map(chapter.nodes.map((n) => [n.node_id, n]));

  /** event -> [{to, cost}] */
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
    // An event with no choice target hands back to the map. Walking to a node
    // does not by itself show anything: `findFirstAvailableEvent` returns the
    // FIRST entry in that node's list that has not been used yet. So the k-th
    // event on a node costs k screens, because the k-1 before it must be played
    // through first. Travel itself is free; the screens are the cost.
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
        // Everything ahead of the destination in this node's list has to be
        // played through, and each of those costs its own hours.
        edge(event.event_id, id, hours);
        hours += eventHours(byId.get(id) ?? {});
      }
    }
  }

  const startIds = nodeById.get(chapter.entry_node_id)?.event_ids ?? [];
  const boss = chapter.boss_event_id;

  // Dijkstra over in-game hours. Entry-node events are played in list order, so
  // the second one already costs the first one's time.
  const starts = [];
  let clock = 0;
  for (const id of startIds) {
    clock += eventHours(byId.get(id) ?? {});
    starts.push([id, clock]);
  }
  const dist = new Map(starts);
  const parent = new Map();
  const visited = new Set();
  for (;;) {
    let at = null;
    let best = Infinity;
    for (const [id, d] of dist) {
      if (visited.has(id) || d >= best) continue;
      at = id; best = d;
    }
    if (at === null || at === boss) break;
    visited.add(at);
    for (const { to, cost } of next.get(at) ?? []) {
      const candidate = best + cost;
      if (candidate >= (dist.get(to) ?? Infinity)) continue;
      dist.set(to, candidate);
      parent.set(to, at);
    }
  }

  if (!dist.has(boss)) return { chapter_id: chapter.chapter_id, boss, reachable: false };

  const path = [];
  for (let at = boss; at !== undefined; at = parent.get(at)) path.unshift(at);

  const decisions = path.filter((id) => (byId.get(id)?.choices ?? []).length >= 2).length;
  const kinds = {};
  for (const id of path) {
    const t = byId.get(id)?.event_type ?? "?";
    kinds[t] = (kinds[t] ?? 0) + 1;
  }

  return {
    chapter_id: chapter.chapter_id,
    boss,
    reachable: true,
    // In-game hours, which is what the deadline table is denominated in.
    shortest_hours: dist.get(boss),
    named_stops: path.length,
    decisions_on_shortest: decisions,
    total_events: chapter.events.length,
    kinds,
    path,
  };
}

const rows = P1.map((id) => analyse(JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"))));

/** Deadlines are declared in survival.ts as hours after the chapter is entered. */
const survival = readFileSync(join(ROOT, "apps", "part1", "src", "utils", "survival.ts"), "utf8");
const deadlines = new Map();
for (const m of survival.matchAll(
  /questId:\s*"([^"]+)",\s*\n\s*label:\s*"([^"]+)",\s*\n\s*chapterId:\s*"([^"]+)",\s*\n\s*completionEventId:\s*"([^"]+)",\s*\n\s*hoursAfterChapterEntry:\s*(\d+)/gu,
)) {
  const [, questId, label, chapterId, , hours] = m;
  if (!deadlines.has(chapterId)) deadlines.set(chapterId, []);
  deadlines.get(chapterId).push({ questId, label, hours: Number(hours) });
}

console.log("chapter  보스까지 최소 시간  화면  그중 선택  챕터 전체 이벤트");
for (const r of rows) {
  if (!r.reachable) { console.log(`  ${r.chapter_id}  보스(${r.boss})에 도달할 수 없다`); continue; }
  console.log(
    `  ${r.chapter_id}  ${String(`${r.shortest_hours}시간`).padStart(15)}  ${String(r.named_stops).padStart(4)}  ${String(r.decisions_on_shortest).padStart(9)}  ${String(r.total_events).padStart(14)}`,
  );
}

console.log("\n마감과 비교 — 보스까지 직진했을 때 이미 지난 기한");
for (const r of rows) {
  if (!r.reachable) continue;
  const list = deadlines.get(r.chapter_id) ?? [];
  if (!list.length) { console.log(`  ${r.chapter_id}  기한 없음`); continue; }
  const expired = list.filter((d) => d.hours < r.shortest_hours);
  const tag = expired.length ? `${expired.length}건 만료: ${expired.map((d) => `${d.label}(${d.hours}h)`).join(", ")}` : "만료 없음";
  console.log(`  ${r.chapter_id}  보스 ${r.shortest_hours}h · 기한 ${list.map((d) => `${d.hours}h`).join("/")} → ${tag}`);
}

console.log("\n최단 경로의 화면 구성");
for (const r of rows) {
  if (!r.reachable) continue;
  const kinds = Object.entries(r.kinds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`  ${r.chapter_id}  ${kinds}`);
}

console.log("\n반복 가능한 곁길 (시간을 더 쓰게 만드는 것)");
for (const [index, id] of P1.entries()) {
  const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
  const repeatable = chapter.events.filter((e) => e.repeatable);
  const hours = repeatable.reduce((sum, e) => sum + eventHours(e), 0);
  console.log(
    `  ${chapter.chapter_id}  반복 이벤트 ${String(repeatable.length).padStart(2)}개 · 한 바퀴 ${String(hours).padStart(2)}시간` +
    `  (보스까지 ${rows[index].shortest_hours}시간)`,
  );
}

/**
 * A screen is one thing to read and one decision to make, so about a minute of
 * real time. That makes the real budget a screen count, and it is the binding
 * constraint: the in-game clock is fiction and can be set to whatever the design
 * needs, but a player's half hour cannot.
 */
const MINUTES_PER_SCREEN = 1;
const REAL_TIME_BUDGET_MIN = 30;

/**
 * Each chapter now declares the budget it is designed to (`estimated_first_run
 * _minutes`), so the main route has to fit inside it with room for side content.
 * A chapter whose shortest path already exceeds its budget cannot offer the
 * player any choice about what to skip — the run is the main route and nothing
 * else — and that shows up here rather than in a playtest.
 */
console.log("\n주 경로가 챕터 예산 안에 들어가는가");
console.log("chapter  주 경로  예산  곁길 여유  판정");
for (const [index, id] of P1.entries()) {
  const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
  const r = rows[index];
  const budget = chapter.estimated_first_run_minutes ?? 0;
  const slack = budget - r.named_stops;
  const verdict = slack < 0 ? "예산 초과 — 주 경로를 덜어내야 한다" : slack < 3 ? "여유 부족" : "여유 있음";
  console.log(
    `  ${chapter.chapter_id}  ${String(`${r.named_stops}화면`).padStart(7)}  ${String(`${budget}분`).padStart(4)}` +
    `  ${String(`${slack}화면`).padStart(9)}  ${verdict}`,
  );
}

console.log(`\n실시간 예산 (화면당 ${MINUTES_PER_SCREEN}분, 챕터 상한 ${REAL_TIME_BUDGET_MIN}분)`);
console.log("chapter  최단 화면  전부 보면  주장 분량  전부 볼 때 실시간  예산 대비");
for (const [index, id] of P1.entries()) {
  const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
  const r = rows[index];
  const all = chapter.events.length;
  const fullMinutes = all * MINUTES_PER_SCREEN;
  const over = fullMinutes / REAL_TIME_BUDGET_MIN;
  console.log(
    `  ${chapter.chapter_id}  ${String(r.named_stops).padStart(9)}  ${String(all).padStart(9)}  ` +
    `${String(`${chapter.estimated_first_run_minutes}분`).padStart(9)}  ${String(`${fullMinutes}분`).padStart(16)}  ${over.toFixed(1)}배`,
  );
}

console.log(`\n30분 예산이면 화면 ${REAL_TIME_BUDGET_MIN}개다. 그만큼 진행했을 때 게임 내 경과 시간:`);
for (const [index, id] of P1.entries()) {
  const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
  const r = rows[index];
  // Screens beyond the shortest path are side content at roughly an hour each.
  const extraScreens = Math.max(0, REAL_TIME_BUDGET_MIN - r.named_stops);
  const hoursAt30 = r.shortest_hours + extraScreens;
  const list = deadlines.get(r.chapter_id) ?? [];
  console.log(
    `  ${chapter.chapter_id}  보스 ${String(`${r.shortest_hours}h`).padStart(4)} + 곁길 ${String(extraScreens).padStart(2)}화면` +
    ` → 약 ${String(`${hoursAt30}h`).padStart(4)}   현재 기한 ${list.map((d) => `${d.hours}h`).join("/") || "없음"}`,
  );
}

if (process.argv.includes("--path")) {
  for (const r of rows) {
    if (!r.reachable) continue;
    console.log(`\n${r.chapter_id} 최단 경로`);
    for (const [i, id] of r.path.entries()) console.log(`  ${String(i + 1).padStart(2)}. ${id}`);
  }
}
