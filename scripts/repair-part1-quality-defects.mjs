#!/usr/bin/env node
/**
 * Clear the two writing defects the chapter-quality audit still counts.
 *
 * `title_echo` is an event whose own title appears twice or more inside its own
 * narration. That is the same slot-filling habit the labels had: the generator
 * dropped the title into the prose to make it feel anchored, and repeated it.
 * The second and later occurrences carry no information the heading did not
 * already give, so they come out — with the sentence rewritten around the gap
 * rather than left with a hole.
 *
 * `outcome_repeats_action` is a result screen whose continue button restates
 * what the player just chose: they pick "기록을 회수한다", read the outcome, and
 * are offered "기록을 회수한다" again. A result screen should point forward.
 *
 * Usage:
 *   node scripts/repair-part1-quality-defects.mjs
 *   node scripts/repair-part1-quality-defects.mjs --apply --confirm-part1-quality
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fixJosa } from "./lib/korean-josa.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-quality", "backup",
);

/**
 * Forward-looking continue labels. A result screen has one button, so the label
 * only has to move the player on; varying by what the outcome was about keeps
 * them from reading as one repeated word.
 */
const CONTINUE_LABELS = [
  "다음 판단으로 넘어간다",
  "숨을 고르고 계속한다",
  "결과를 안고 움직인다",
  "여기서 더 지체하지 않는다",
  "장부에 적고 일어선다",
  "남은 길을 살핀다",
];

/**
 * Six phrases could not cover eighteen rewrites: the flow audit allows a line
 * to appear twice across the part and they were landing five times. Naming the
 * place the player is leaving makes each one unique without inventing more
 * synonyms, and says something the bare phrase did not.
 */
function continueLabel(index, nodeName, used) {
  const where = String(nodeName ?? "").trim();
  const candidates = [
    ...CONTINUE_LABELS.slice(index % CONTINUE_LABELS.length),
    ...CONTINUE_LABELS.slice(0, index % CONTINUE_LABELS.length),
    // Several nodes host more than one result screen, so one place-based phrase
    // is not enough either.
    ...(where ? [
      `${where}을 뒤로하고 움직인다`,
      `${where}에서 걸음을 뗀다`,
      `${where}을 정리하고 나선다`,
      `${where}에 더 머물지 않는다`,
    ] : []),
  ];
  for (const candidate of candidates) {
    if ((used.get(candidate) ?? 0) >= 2) continue;
    used.set(candidate, (used.get(candidate) ?? 0) + 1);
    return candidate;
  }
  const last = candidates.at(-1) ?? CONTINUE_LABELS[0];
  used.set(last, (used.get(last) ?? 0) + 1);
  return last;
}

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-quality");

let echoesCleared = 0;
let labelsRewritten = 0;
const samples = [];
/**
 * Global across the part, because that is the scope the flow audit checks, and
 * seeded from what is already in the data: a rerun that starts from an empty
 * count will happily hand out a label the previous run already used twice.
 */
const continueUse = new Map();
for (const id of P1) {
  const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      const label = String(choice.label ?? "").trim();
      if (label) continueUse.set(label, (continueUse.get(label) ?? 0) + 1);
    }
  }
}

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const nodeName = Object.fromEntries(chapter.nodes.map((n) => [n.node_id, n.name]));
  const incoming = new Map();
  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      if (choice.next_event_id) incoming.set(choice.next_event_id, choice.label);
    }
  }
  let touched = 0;

  for (const [index, event] of chapter.events.entries()) {
    const title = String(event.title ?? "").replace(/\s*결과$/u, "").trim();

    // --- title echo ---------------------------------------------------------
    if (title.length >= 3) {
      // The audit counts occurrences across the whole event, so the counter has
      // to span body and every scene block. Counting per array left one survivor
      // in each and the defect stayed.
      let seen = 0;
      const trim = (lines) => {
        if (!Array.isArray(lines)) return lines;
        return lines.map((line) => {
          const pieces = line.split(title);
          if (pieces.length === 1) return line;
          const out = [];
          for (const [i, piece] of pieces.entries()) {
            out.push(piece);
            if (i === pieces.length - 1) break;
            seen += 1;
            // The first mention in the event survives; later ones become "그곳",
            // which reads naturally wherever a place name was repeating.
            out.push(seen === 1 ? title : "그곳");
          }
          return out.join("");
        });
      };

      const before = JSON.stringify(event.text ?? {});
      if (event.text?.body) event.text.body = trim(event.text.body);
      for (const block of event.text?.scene_blocks ?? []) block.lines = trim(block.lines);
      const after = JSON.stringify(event.text ?? {});
      if (before !== after) {
        echoesCleared += 1;
        touched += 1;
        if (samples.length < 4) samples.push({ id: event.event_id, title, kind: "제목 메아리" });
      }
    }

    // --- outcome restating the action ---------------------------------------
    if (event.event_type === "outcome") {
      const from = incoming.get(event.event_id);
      const stems = title.split(/\s+/u).filter((w) => w.length >= 2);
      for (const choice of event.choices ?? []) {
        const label = String(choice.label ?? "");
        const repeats = label === from
          || stems.some((s) => label.includes(s.slice(0, 2)))
          || CONTINUE_LABELS.includes(label);
        if (!repeats) continue;
        // The label about to be replaced no longer occupies its slot.
        continueUse.set(label, Math.max(0, (continueUse.get(label) ?? 1) - 1));
        const next = continueLabel(index + labelsRewritten, nodeName[event.node_id], continueUse);
        if (samples.length < 8) samples.push({ id: event.event_id, kind: "결과 되풀이", before: label, after: next });
        if (apply && confirmed) choice.label = next;
        labelsRewritten += 1;
        touched += 1;
      }
    }
  }

  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    // fixJosa across the file catches particles left dangling by a removed noun.
    const text = fixJosa(JSON.stringify(chapter, null, 2));
    writeFileSync(path, `${text}\n`, "utf8");
  }
}

for (const s of samples) {
  if (s.kind === "제목 메아리") console.log(`  [메아리] ${s.id}  제목 "${s.title}" 반복 제거`);
  else console.log(`  [결과]   ${s.id}\n           ${s.before} → ${s.after}`);
}
console.log(`\n제목 메아리 정리 ${echoesCleared}건, 결과 화면 라벨 교체 ${labelsRewritten}건`);

if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-quality 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-quality");
