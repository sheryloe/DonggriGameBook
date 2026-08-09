#!/usr/bin/env node
/**
 * Check that a choice's preview tells the truth about what the choice does.
 *
 * The preview is the only thing the player has to decide on. If it promises a
 * cost or a gain the effects never apply, the decision was made on fiction —
 * which is worse than having no preview at all, because the player believes it.
 *
 * Only unambiguous claims are checked. A preview saying "긴장이 1 오른다" is a
 * claim about `route.strain`; a preview saying "위험을 감수한다" is mood and is
 * left alone. Combat and boss events are exempt for injury and noise, since the
 * battle resolver applies those rather than the choice effects.
 *
 * Usage:
 *   node scripts/audit-part1-choice-truth.mjs
 *   node scripts/audit-part1-choice-truth.mjs --list   # every mismatch
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const REPORT = join(ROOT, "docs", "ops", "PART1_CHOICE_TRUTH.json");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];

/**
 * Vocabulary the previews actually use, mapped to the resource each names.
 * Kept deliberately narrow: every entry here is a phrase that can only mean
 * that one resource, so a mismatch is a real defect rather than a reading.
 */
const VOCAB = [
  { resource: "noise", re: /소음|위치 노출|동선 증가|교신 노출/u },
  { resource: "injury", re: /부상|전투 피해|몸 상태 부담/u },
  { resource: "contamination", re: /오염|감염 노출|감염 위험/u },
  { resource: "strain", re: /긴장|피로 누적|레이드 부담/u },
  { resource: "trust", re: /신뢰/u },
  { resource: "reputation", re: /평판|신망/u },
];

/** What the effects on a choice genuinely change. */
function producedResources(effects) {
  const out = new Set();
  for (const effect of effects ?? []) {
    const target = String(effect.target ?? "");
    if (target === "noise") out.add("noise");
    if (target === "injury") out.add("injury");
    if (target === "contamination") out.add("contamination");
    if (target === "strain" || target === "route.strain" || target === "route.strain_score") out.add("strain");
    if (target.startsWith("trust.")) out.add("trust");
    if (target.startsWith("rep.") || target.startsWith("reputation.")) out.add("reputation");
  }
  return out;
}

const rows = [];
const perChapter = {};

for (const id of P1) {
  const chapter = JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8"));
  const stats = { checked: 0, mismatched: 0 };

  for (const event of chapter.events) {
    // The battle resolver, not the choice, applies damage and noise in a fight.
    const combatDriven = event.event_type === "combat" || event.event_type === "boss";
    const exempt = combatDriven ? new Set(["injury", "noise"]) : new Set();

    for (const choice of event.choices ?? []) {
      const preview = String(choice.preview ?? "");
      if (!preview) continue;

      // "위치 노출을 막는다" names a resource in order to say it does NOT change.
      // Only a phrase left un-negated is a promise the effects have to keep.
      const claimed = VOCAB.filter((v) => {
        const hit = v.re.exec(preview);
        if (!hit) return false;
        const tail = preview.slice(hit.index + hit[0].length, hit.index + hit[0].length + 14);
        return !/막는|않는|없|피하|피한|줄이|줄인|덜어|덜고|아끼/u.test(tail);
      }).map((v) => v.resource);
      if (!claimed.length) continue;

      stats.checked += 1;
      const produced = producedResources(choice.effects);
      const unmet = claimed.filter((r) => !produced.has(r) && !exempt.has(r));
      if (!unmet.length) continue;

      stats.mismatched += 1;
      rows.push({
        chapter_id: chapter.chapter_id,
        event_id: event.event_id,
        event_type: event.event_type,
        choice_id: choice.choice_id,
        label: choice.label,
        preview,
        claimed,
        produced: [...produced],
        unmet,
      });
    }
  }
  perChapter[chapter.chapter_id] = stats;
}

const totals = Object.values(perChapter).reduce(
  (acc, s) => ({ checked: acc.checked + s.checked, mismatched: acc.mismatched + s.mismatched }),
  { checked: 0, mismatched: 0 },
);

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(
  REPORT,
  `${JSON.stringify({ schema: "donggrol.part1_choice_truth.v1", totals, per_chapter: perChapter, mismatches: rows }, null, 2)}\n`,
  "utf8",
);

const pct = totals.checked ? Math.round((totals.mismatched / totals.checked) * 100) : 0;
console.log(`자원 변화를 명시한 선택지: ${totals.checked}`);
console.log(`그중 효과가 따라오지 않는 것: ${totals.mismatched} (${pct}%)`);
for (const [id, s] of Object.entries(perChapter)) {
  const p = s.checked ? Math.round((s.mismatched / s.checked) * 100) : 0;
  console.log(`  ${id}  ${String(s.mismatched).padStart(3)} / ${String(s.checked).padStart(3)}  (${p}%)`);
}

if (process.argv.includes("--list")) {
  for (const r of rows) {
    console.log(`\n[${r.chapter_id}] ${r.event_id} · ${r.choice_id} (${r.event_type})`);
    console.log(`  라벨    : ${r.label}`);
    console.log(`  미리보기: ${r.preview}`);
    console.log(`  약속    : ${r.claimed.join(", ")}   실제: ${r.produced.join(", ") || "(자원 변화 없음)"}`);
    console.log(`  미충족  : ${r.unmet.join(", ")}`);
  }
}

console.log(`\n보고서: ${REPORT.replace(`${ROOT}\\`, "")}`);
