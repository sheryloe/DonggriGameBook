#!/usr/bin/env node
/**
 * Move P1 effects off stat keys nothing declares.
 *
 * `add_reputation` writes straight into the runtime stat bag (`rewards.ts`),
 * creating whatever key it is handed. So a chapter can spend reputation on
 * `rep.jamsil` for a whole act while the registry, the UI and every condition
 * only ever look at `reputation.jamsil_lower` — no error, no warning, and a
 * number the player earns that nothing will ever read.
 *
 * The six `reputation.*` keys are already registered, so this is a migration,
 * not a schema change. Which faction each `rep.*` use belongs to is decided by
 * where it happens: CH03 is a standing argument between the lower floors and the
 * upper floors, so its uses split by node rather than collapsing into one side.
 *
 * Usage:
 *   node scripts/repair-part1-stat-keys.mjs
 *   node scripts/repair-part1-stat-keys.mjs --apply --confirm-part1-stat-keys
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const REGISTRY = join(ROOT, "private", "content", "data", "stats.registry.json");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-stat-keys", "backup",
);

/** Flat renames, decided by which faction the chapter's actions actually serve. */
const RENAME = {
  "rep.yeouido": "reputation.record_bureau",
  "rep.noryangjin": "reputation.under_market",
  "rep.magok": "reputation.munjeong_logistics",
  "rep.pangyo": "reputation.pangyo_survivors",
  // 한수진 is not an NPC. 한소명 is, and is the only 한 in this part.
  "trust.npc_han_sujin": "trust.npc_han_somyeong",
};

/**
 * CH03 splits Jamsil between 안보경's lower floors and 류세온's upper floors, so
 * crediting a neutral action to one side would quietly take a position. Route it
 * by the node the action happens on; supplies moving through the contested middle
 * benefit the people living below it.
 */
const JAMSIL_BY_NODE = { default: "reputation.jamsil_lower" };
function jamsilKeyFor(nodeName) {
  return /상층/u.test(String(nodeName)) ? "reputation.jamsil_upper" : JAMSIL_BY_NODE.default;
}

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-stat-keys");

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const registered = new Set(registry.stats.map((s) => s.key));

let changed = 0;
const rows = [];

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const nodeName = Object.fromEntries(chapter.nodes.map((n) => [n.node_id, n.name]));
  let chapterChanged = 0;

  const visitEffects = (effects, where) => {
    for (const effect of effects ?? []) {
      const from = String(effect.target ?? "");
      let to = RENAME[from];
      if (from === "rep.jamsil") to = jamsilKeyFor(nodeName[where.node_id]);
      if (!to || to === from) continue;
      rows.push({ chapter: chapter.chapter_id, event: where.event_id, from, to, at: nodeName[where.node_id] ?? where.node_id });
      if (apply && confirmed) effect.target = to;
      chapterChanged += 1;
    }
  };

  for (const event of chapter.events) {
    visitEffects(event.on_enter_effects, event);
    visitEffects(event.on_complete_effects, event);
    for (const choice of event.choices ?? []) visitEffects(choice.effects, event);
    for (const outcome of event.outcomes ?? []) visitEffects(outcome.effects, event);
  }

  changed += chapterChanged;
  if (apply && confirmed && chapterChanged) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

for (const r of rows) {
  console.log(`${r.chapter}  ${r.from.padEnd(22)} → ${r.to.padEnd(32)} @${r.at}`);
}

const unregistered = [...new Set(rows.map((r) => r.to))].filter((k) => !registered.has(k));
console.log(`\n이관 ${changed}건, 대상 키 ${new Set(rows.map((r) => r.to)).size}종`);
console.log(unregistered.length
  ? `경고: 레지스트리에 없는 대상 키 — ${unregistered.join(", ")}`
  : "대상 키 전부 stats.registry에 등록되어 있다.");

if (apply && confirmed) console.log(`\n적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("\n--confirm-part1-stat-keys 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("\n계획만 출력했다. 적용하려면 --apply --confirm-part1-stat-keys");
