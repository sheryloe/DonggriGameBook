#!/usr/bin/env node
/**
 * Give the one-way events a second way through.
 *
 * See `lib/part1-second-choices.mjs` for what is added and why. This file only
 * places them: it copies the original choice's destination so both options
 * converge, leaves gain/cost labels for the preview pass to derive from the
 * effects, and refuses to run twice.
 *
 * Usage:
 *   node scripts/repair-part1-second-choices.mjs
 *   node scripts/repair-part1-second-choices.mjs --apply --confirm-part1-second-choices
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECOND_CHOICES } from "./lib/part1-second-choices.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-second-choices", "backup",
);

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-second-choices");

const byEvent = new Map(SECOND_CHOICES.map((entry) => [entry.event, entry.choice]));
let added = 0;
let already = 0;
const missing = [...byEvent.keys()];
const perChapter = {};

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  let touched = 0;

  for (const event of chapter.events) {
    const authored = byEvent.get(event.event_id);
    if (!authored) continue;
    missing.splice(missing.indexOf(event.event_id), 1);

    if ((event.choices ?? []).some((c) => c.choice_id === authored.choice_id)) { already += 1; continue; }

    // Converge: the alternative reaches the same place, at a different price.
    const original = event.choices?.[0];
    const next = original?.next_event_id ?? event.next_event_id ?? null;

    event.choices = [...(event.choices ?? []), {
      choice_id: authored.choice_id,
      label: authored.label,
      conditions: [],
      // Left blank on purpose: repair-part1-choice-previews derives all three
      // from the effects, which is the only source that cannot drift.
      preview: "",
      effects: authored.effects,
      next_event_id: next,
      intent_tags: authored.intent_tags,
      gain_label: "",
      cost_label: "",
      risk_label: "",
    }];

    console.log(`  ${chapter.chapter_id}  ${event.event_id.padEnd(34)} += ${authored.label}`);
    added += 1;
    touched += 1;
  }

  perChapter[chapter.chapter_id] = touched;
  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

console.log(`\n추가 ${added}건, 이미 있음 ${already}건`);
for (const [id, n] of Object.entries(perChapter)) console.log(`  ${id}  ${n}건`);
if (missing.length) console.log(`\n대상 이벤트를 찾지 못함: ${missing.join(", ")}`);

if (apply && confirmed) console.log(`\n적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("\n--confirm-part1-second-choices 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("\n계획만 출력했다. 적용하려면 --apply --confirm-part1-second-choices");
