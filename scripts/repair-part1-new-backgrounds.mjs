#!/usr/bin/env node
/**
 * Register the new painted backgrounds and put them on screen.
 *
 * Each P1 chapter leaned on one background for a fifth to a quarter of its
 * events — CH01 showed the flooded archive nineteen times, CH05 the server hall
 * sixteen — so a run read as the same room over and over. These five paintings
 * are second views of those same locations, so they can take a share of that
 * load without contradicting anything the prose says.
 *
 * They are also the first assets in the new direction: painted key art with one
 * strong light source and a limited palette, rather than the documentary
 * realism the old prompt pack specified. That style was not an accident — the
 * pack put `documentary lighting` in every template — and it read badly at phone
 * size, where photographic detail turns to mush and a painted plane does not.
 *
 * Usage:
 *   node scripts/repair-part1-new-backgrounds.mjs
 *   node scripts/repair-part1-new-backgrounds.mjs --apply --confirm-part1-new-backgrounds
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const OVERRIDES = join(ROOT, "packages", "app-runtime", "src", "assets", "runtimeArtOverrides.json");
const IMAGES = join(ROOT, "public", "generated", "images");
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-new-backgrounds", "backup",
);

/** `takeFrom` is the overworked key each new painting relieves. */
const BACKGROUNDS = [
  { chapter: "ch01", key: "p1_ch01_archive_stacks_deep", file: "p1_ch01_archive_stacks_deep.jpg", takeFrom: "p1_ch01_flooded_archive_room" },
  { chapter: "ch02", key: "p1_ch02_market_backlane", file: "p1_ch02_market_backlane.jpg", takeFrom: "bg_noryangjin_market" },
  { chapter: "ch03", key: "p1_ch03_atrium_upper_gallery", file: "p1_ch03_atrium_upper_gallery.jpg", takeFrom: "bg_jamsil_showroom" },
  { chapter: "ch04", key: "p1_ch04_sorting_junction", file: "p1_ch04_sorting_junction.jpg", takeFrom: "bg_delivery_tunnel" },
  { chapter: "ch05", key: "p1_ch05_cold_aisle", file: "p1_ch05_cold_aisle.jpg", takeFrom: "bg_arkp_serverhall" },
];

/** Half of the overworked key's events move across, so neither view dominates. */
const SHARE = 0.5;

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-new-backgrounds");

const overrides = JSON.parse(readFileSync(OVERRIDES, "utf8"));
let registered = 0;
let reassigned = 0;
const problems = [];

for (const bg of BACKGROUNDS) {
  if (!existsSync(join(IMAGES, bg.file))) { problems.push(`${bg.file} 파일이 없다`); continue; }

  const chapterId = bg.chapter.toUpperCase();
  if (!overrides.mappings.some((m) => (m.runtime_art_keys ?? []).includes(bg.key))) {
    if (apply && confirmed) {
      overrides.mappings.push({
        chapter_id: chapterId,
        runtime_art_keys: [bg.key],
        src: `/generated/images/${bg.file}`,
      });
    }
    registered += 1;
  }

  const path = join(CHAPTER_DIR, `${bg.chapter}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const users = chapter.events.filter((e) => e.presentation?.art_key === bg.takeFrom);
  const moving = Math.floor(users.length * SHARE);

  // Take every other one so the two views alternate through the chapter rather
  // than splitting it into a first half and a second half.
  let moved = 0;
  for (const [index, event] of users.entries()) {
    if (index % 2 === 0 || moved >= moving) continue;
    if (apply && confirmed) event.presentation.art_key = bg.key;
    moved += 1;
  }
  reassigned += moved;
  console.log(`  ${chapterId}  ${bg.takeFrom} ${users.length}회 중 ${moved}회 → ${bg.key}`);

  if (apply && confirmed && moved) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${bg.chapter}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

if (apply && confirmed) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = join(BACKUP_DIR, "runtimeArtOverrides.json");
  if (!existsSync(backup)) copyFileSync(OVERRIDES, backup);
  writeFileSync(OVERRIDES, `${JSON.stringify(overrides, null, 2)}\n`, "utf8");
}

console.log(`\n매핑 등록 ${registered}건, 이벤트 재배정 ${reassigned}건`);
for (const p of problems) console.log(`  문제: ${p}`);

if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-new-backgrounds 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-new-backgrounds");
