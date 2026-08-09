#!/usr/bin/env node
/**
 * Let the ending stay in play until the last chapter.
 *
 * The ending scores four lanes from a route axis plus the factions that would
 * have to carry that ending out. But reputation was authored per district, and
 * a district only appears in its own chapter: under_market exists in CH02 and
 * nowhere else, jamsil_lower and jamsil_upper only in CH03, munjeong only in
 * CH04. Since backing is half the score, that left the smuggling ending 87%
 * decided by the end of CH02 — no play in CH03, CH04 or CH05 could reach it.
 *
 * The fix is not more content. A faction is not the people who live in a
 * district; it is the people who back a way of doing things, and the player
 * commits to a way of doing things in every chapter. Route commitments are
 * already spread across all five — truth is chosen 5/3/4/1/4 times, control
 * 4/7/5/3/4 — so tying backing to the stance rather than the place distributes
 * it without inventing a single event.
 *
 * Explicit reputation already authored on a choice is left as it is; this only
 * adds backing where a choice takes a side and nobody was recorded as noticing.
 *
 * Usage:
 *   node scripts/repair-part1-faction-spread.mjs
 *   node scripts/repair-part1-faction-spread.mjs --apply --confirm-part1-faction-spread
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-faction-spread", "backup",
);

/**
 * Who is glad you did that.
 *
 * The record bureau backs anything that leaves a record. The under market backs
 * anything that goes around the official channel. The lower floors back putting
 * people first, the upper floors back keeping the list, and Munjeong logistics
 * backs whatever keeps throughput up. Pangyo is deliberately absent: those
 * survivors are only met at the mirror centre, and an ending that needs them
 * should still have to earn them there.
 */
const BACKING = {
  "route.truth": {
    truth: "reputation.record_bureau",
    witness: "reputation.record_bureau",
    probe: "reputation.record_bureau",
    forensics: "reputation.record_bureau",
    silence: "reputation.jamsil_upper",
  },
  "route.compassion": {
    rescue: "reputation.jamsil_lower",
    pragmatic: "reputation.munjeong_logistics",
  },
  "route.control": {
    lock: "reputation.jamsil_upper",
    assault: "reputation.jamsil_upper",
    raid: "reputation.jamsil_upper",
    advance: "reputation.jamsil_upper",
    stabilize: "reputation.jamsil_upper",
    logistics: "reputation.munjeong_logistics",
    push: "reputation.munjeong_logistics",
    medical_priority: "reputation.jamsil_lower",
    survivor_priority: "reputation.jamsil_lower",
    bypass: "reputation.under_market",
    breach: "reputation.under_market",
    repurpose: "reputation.under_market",
    // hold commits to nothing yet, so nobody owes you for it.
  },
  "route.underworld": {
    forge: "reputation.under_market",
    broker: "reputation.under_market",
    service: "reputation.under_market",
    force: "reputation.under_market",
    clean: "reputation.record_bureau",
  },
};

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-faction-spread");

let added = 0;
let alreadyBacked = 0;
let noBacking = 0;
const grid = {};

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  grid[chapter.chapter_id] = {};
  let touched = 0;

  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      const effects = choice.effects ?? [];
      const commitment = effects.find(
        (e) => (e.op === "set_route" || e.op === "set_value") && BACKING[String(e.target ?? "")],
      );
      if (!commitment) continue;

      const faction = BACKING[String(commitment.target)][String(commitment.value ?? "")];
      if (!faction) { noBacking += 1; continue; }

      // Someone already wrote down who this pleased; do not double-count it.
      if (effects.some((e) => e.op === "add_reputation")) { alreadyBacked += 1; continue; }

      if (apply && confirmed) {
        effects.push({ op: "add_reputation", target: faction, value: 1 });
        choice.effects = effects;
      }
      grid[chapter.chapter_id][faction] = (grid[chapter.chapter_id][faction] ?? 0) + 1;
      added += 1;
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

const FACTIONS = [
  "reputation.record_bureau", "reputation.under_market", "reputation.jamsil_lower",
  "reputation.jamsil_upper", "reputation.munjeong_logistics",
];

console.log("추가되는 지지 (노선 확정 선택지 기준)");
console.log("세력                    CH01 CH02 CH03 CH04 CH05  합계");
for (const f of FACTIONS) {
  const row = P1.map((_, i) => grid[`CH0${i + 1}`]?.[f] ?? 0);
  console.log(
    `  ${f.replace("reputation.", "").padEnd(22)}${row.map((n) => String(n).padStart(4)).join(" ")}` +
    `${String(row.reduce((s, n) => s + n, 0)).padStart(6)}`,
  );
}
console.log(`\n추가 ${added}건, 이미 평판이 있어 건너뜀 ${alreadyBacked}건, 지지 세력 없는 노선 ${noBacking}건`);

if (apply && confirmed) console.log(`\n적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("\n--confirm-part1-faction-spread 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("\n계획만 출력했다. 적용하려면 --apply --confirm-part1-faction-spread");
