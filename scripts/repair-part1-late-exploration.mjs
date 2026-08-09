#!/usr/bin/env node
/**
 * Add the missing side content to CH04 and CH05.
 *
 * See `lib/part1-late-exploration.mjs` for what is added and why. This file
 * places them: builds the event in the shape the runtime expects, appends it to
 * its node's list so `findFirstAvailableEvent` can reach it, and leaves the
 * consequence text blank for the preview pass to derive from the effects.
 *
 * These end without a `next_event_id`, which hands the player back to the map.
 * That is what makes them optional, and what makes the deadline mean something:
 * time spent here is time not spent on the main route.
 *
 * Usage:
 *   node scripts/repair-part1-late-exploration.mjs
 *   node scripts/repair-part1-late-exploration.mjs --apply --confirm-part1-late-exploration
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LATE_EXPLORATION } from "./lib/part1-late-exploration.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const OVERRIDES = join(ROOT, "packages", "app-runtime", "src", "assets", "runtimeArtOverrides.json");
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-late-exploration", "backup",
);

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-late-exploration");

const overrides = JSON.parse(readFileSync(OVERRIDES, "utf8"));
const mappedKeys = new Set(overrides.mappings.flatMap((m) => m.runtime_art_keys ?? []));

function buildEvent(spec, nodeId) {
  return {
    event_id: spec.event_id,
    event_type: "exploration",
    node_id: nodeId,
    title: spec.title,
    repeatable: false,
    once_per_run: true,
    priority: 40,
    conditions: [],
    presentation: {
      layout: "choice",
      art_key: spec.art_key,
      music_key: spec.music_key,
      widget_overrides: ["loot_preview"],
    },
    text: {
      summary: spec.summary,
      body: [],
      carry_line: `${spec.title}에서 고른 쪽은 다음 판단까지 따라온다.`,
      scene_blocks: [
        {
          block_id: `${spec.event_id}_narration`,
          kind: "narration",
          lines: spec.narration,
        },
      ],
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: spec.choices.map((c) => ({
      choice_id: c.choice_id,
      label: c.label,
      conditions: [],
      // Derived by repair-part1-choice-previews from the effects, which is the
      // only source that cannot drift.
      preview: "",
      effects: c.effects,
      // No destination: the beat ends and the player returns to the map. That is
      // what makes this optional.
      next_event_id: null,
      intent_tags: c.intent_tags,
      gain_label: "",
      cost_label: "",
      risk_label: "",
    })),
    on_enter_effects: [],
    on_complete_effects: [],
  };
}

const byChapter = new Map();
for (const entry of LATE_EXPLORATION) {
  if (!byChapter.has(entry.chapter)) byChapter.set(entry.chapter, []);
  byChapter.get(entry.chapter).push(entry);
}

let added = 0;
const problems = [];

for (const [id, entries] of byChapter) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const nodeById = new Map(chapter.nodes.map((n) => [n.node_id, n]));
  const existingIds = new Set(chapter.events.map((e) => e.event_id));
  let touched = 0;

  for (const entry of entries) {
    if (existingIds.has(entry.event.event_id)) continue;
    const node = nodeById.get(entry.node);
    if (!node) { problems.push(`${entry.node} 노드가 없다`); continue; }
    if (!mappedKeys.has(entry.event.art_key)) { problems.push(`${entry.event.art_key} 아트가 매핑되지 않았다`); continue; }

    const built = buildEvent(entry.event, entry.node);
    if (apply && confirmed) {
      chapter.events.push(built);
      node.event_ids.push(built.event_id);
    }
    console.log(`  ${chapter.chapter_id}  ${entry.node}  += ${built.event_id.padEnd(30)} ${entry.event.title}`);
    added += 1;
    touched += 1;
  }

  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

console.log(`\n탐색 이벤트 ${added}개 추가 (선택지 ${added * 2}개)`);
for (const p of problems) console.log(`  문제: ${p}`);

if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-late-exploration 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-late-exploration");
