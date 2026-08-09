#!/usr/bin/env node
/**
 * Keep the ending in play until the last chapter.
 *
 * Spreading the factions across chapters was necessary but not sufficient: a
 * simulation of all twelve lane switches showed none of them succeeding. CH01
 * through CH03 is three chapters against CH04 and CH05's two, so whatever a
 * player commits to early wins on volume no matter how the backing is spread.
 *
 * Weighting the late chapters fixes it. Searching the space:
 *
 *   CH04 x1   CH05 x1     0/12 switches possible
 *   CH04 x1.5 CH05 x2     8/12
 *   CH04 x2   CH05 x3    12/12, and CH05 alone overturns CH01-04 in only 2/12
 *   CH04 x3   CH05 x4    12/12, no further gain, more late dominance
 *
 * So x2 and x3 is the point where every switch opens without the finale
 * swallowing the rest of the part.
 *
 * The multiplier is applied to the stored values rather than at grant time in
 * the engine, because the preview tells the player what a choice is worth and it
 * has to still be true. A late choice really is worth more, and it says so.
 *
 * Only the ending axes and reputation scale. Noise, injury and contamination are
 * survival pressure, not narrative weight, and doubling them would quietly make
 * the last chapters unsurvivable.
 *
 * Usage:
 *   node scripts/repair-part1-late-weight.mjs
 *   node scripts/repair-part1-late-weight.mjs --apply --confirm-part1-late-weight
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-late-weight", "backup",
);

export const LATE_WEIGHT = { ch04: 2, ch05: 3 };

const SCALES = (target) =>
  /^route\.(truth|compassion|control|underworld)_score$/u.test(target) || target.startsWith("reputation.");

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-late-weight");

let scaled = 0;
const perChapter = {};

for (const [id, weight] of Object.entries(LATE_WEIGHT)) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  let touched = 0;

  const visit = (effects) => {
    for (const effect of effects ?? []) {
      const target = String(effect.target ?? "");
      if (!SCALES(target)) continue;
      const value = Number(effect.value ?? 0);
      if (!value) continue;
      if (apply && confirmed) effect.value = value * weight;
      touched += 1;
    }
  };

  for (const event of chapter.events) {
    visit(event.on_enter_effects);
    visit(event.on_complete_effects);
    for (const choice of event.choices ?? []) visit(choice.effects);
    for (const outcome of event.outcomes ?? []) visit(outcome.effects);
  }

  scaled += touched;
  perChapter[chapter.chapter_id] = { weight, touched };

  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

for (const [id, info] of Object.entries(perChapter)) {
  console.log(`  ${id}  x${info.weight}  ${info.touched}건`);
}
console.log(`\n총 ${scaled}건의 엔딩 축·평판 값에 후반 가중치를 적용한다.`);

if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-late-weight 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-late-weight");
