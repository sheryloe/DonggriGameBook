#!/usr/bin/env node
/**
 * Rebuild P1 choice previews from the effects they actually apply.
 *
 * 395 of 473 previews came out of five sentence frames — "…을 감수하고 …을
 * 노린다. 실패하면 …이 남는다" and four siblings, used 87/82/79/75/72 times.
 * The slots were filled with abstract nouns picked independently of the effects,
 * so 183 previews promise a cost or a gain that never arrives. The preview is
 * the only thing the player has to decide on, so that is not a wording problem.
 *
 * Deriving the text from the effect list makes the lie structurally impossible.
 * The variety then comes from the effects themselves — every choice changes a
 * different combination of things — rather than from rotating through frames,
 * which is what produced this in the first place.
 *
 * Hand-written previews that already tell the truth are left alone. The last
 * repair pass on this content overwrote authored copy with generated text, and
 * that is the mistake this file exists to avoid repeating.
 *
 * Usage:
 *   node scripts/repair-part1-choice-previews.mjs                 # plan
 *   node scripts/repair-part1-choice-previews.mjs --sample 12
 *   node scripts/repair-part1-choice-previews.mjs --apply --confirm-part1-previews
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fixJosa, josa } from "./lib/korean-josa.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "private", "content", "data");
const CHAPTER_DIR = join(DATA, "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-previews", "backup",
);

/**
 * The five frames the old generator cycled through, plus this script's own
 * output shape. Its numbers come from the effects, so when those change — the
 * late-chapter weighting doubled and tripled them — the sentences have to be
 * rebuilt or they go back to being wrong.
 */
const BOILERPLATE = [
  /감수하고 .*노린다.*실패하면.*남는다/u,
  /무릅쓰는 대신.*챙긴다.*발목을 잡는다/u,
  /먼저 잡고 빠진다.*다만.*함께 남는다/u,
  /필요하다면.*받아들인다.*그만큼.*따라온다/u,
  /챙긴다\. 대신.*생기고.*커진다/u,
  /(을|를) 얻고 .*(을|를) 치른다\./u,
  /(을|를) (얻는다|치른다)\.( 이어서 |$)/u,
  /노선을 굳힌다\./u,
];

const FACTION = {
  "reputation.record_bureau": "기록국",
  "reputation.under_market": "지하시장",
  "reputation.jamsil_lower": "잠실 아래층",
  "reputation.jamsil_upper": "잠실 상층",
  "reputation.munjeong_logistics": "문정 물류",
  "reputation.pangyo_survivors": "판교 생존자",
};

const AXIS = {
  "route.truth_score": "진실 점수",
  "route.compassion_score": "연민 점수",
  "route.control_score": "질서 점수",
  "route.underworld_score": "뒷길 점수",
  "route.strain": "누적 부담",
};

const STAT = {
  noise: "소음",
  injury: "부상",
  contamination: "오염",
  carry_weight: "적재 무게",
  reserve_lane: "예비 통로",
};

/**
 * Committing to a route is a real, lasting consequence — it is what CH05 reads
 * to decide the ending — but it was never shown to the player. The raw values
 * are internal identifiers, so they are named here rather than printed.
 */
const ROUTE_LABEL = {
  "route.truth": {
    truth: "진실 공개", silence: "침묵", probe: "탐문", witness: "증언", forensics: "감식",
  },
  "route.compassion": { rescue: "구조 우선", pragmatic: "실리 우선" },
  "route.control": {
    lock: "통제", bypass: "우회", push: "강행", assault: "돌파", hold: "관망",
    breach: "파훼", repurpose: "전용", stabilize: "안정화", advance: "전진", raid: "급습",
    medical_priority: "의료 우선", survivor_priority: "생존자 우선", logistics: "물류 우선",
  },
  "route.underworld": {
    forge: "위조", clean: "정공", force: "강압", service: "청부", broker: "중개",
  },
  // route.current names a physical path, not a stance, so it is left out: the
  // label already says which way the player is going.
};

const items = (() => {
  const raw = JSON.parse(readFileSync(join(DATA, "inventory.items.json"), "utf8"));
  const list = Array.isArray(raw) ? raw : raw.items ?? Object.values(raw);
  return new Map(list.map((i) => [i.item_id, { name: i.name_ko, category: i.category }]));
})();

const npcs = (() => {
  const raw = JSON.parse(readFileSync(join(DATA, "npc.registry.json"), "utf8"));
  const list = Array.isArray(raw) ? raw : raw.npcs ?? Object.values(raw);
  return new Map(list.map((n) => [n.npc_id, n.name_ko]));
})();

/** Ammunition is counted in 발, everything else in 개. */
function itemPhrase(target, value) {
  const id = target.replace(/^item:/u, "");
  const entry = items.get(id);
  const name = entry?.name ?? id;
  const unit = /탄약|탄$/u.test(name) ? "발" : "개";
  return `${name} ${Math.abs(value)}${unit}`;
}

/** Splits a choice's effects into what the player gains and what it costs. */
function readEffects(effects) {
  const gains = [];
  const costs = [];
  const routes = [];

  for (const effect of effects ?? []) {
    const target = String(effect.target ?? "");
    const value = Number(effect.value ?? 0);

    if (effect.op === "set_route" || effect.op === "set_value") {
      const named = ROUTE_LABEL[target]?.[String(effect.value ?? "")];
      if (named) routes.push(named);
      continue;
    }

    if (effect.op === "grant_item") { gains.push(itemPhrase(target, value)); continue; }
    if (effect.op === "remove_item") { costs.push(`${itemPhrase(target, value)} 소모`); continue; }
    if (effect.op === "grant_loot_table") { gains.push("보급 수색 1회"); continue; }

    if (effect.op === "add_trust") {
      const name = npcs.get(target.replace(/^trust\./u, "")) ?? "동행";
      (value >= 0 ? gains : costs).push(`${name} 신뢰 ${Math.abs(value)}`);
      continue;
    }
    if (effect.op === "add_reputation") {
      const name = FACTION[target] ?? "현지";
      (value >= 0 ? gains : costs).push(`${name} 평판 ${Math.abs(value)}`);
      continue;
    }
    if (AXIS[target]) {
      const name = AXIS[target];
      // Strain only ever accumulates, and it is always a cost.
      const isCost = target === "route.strain" ? true : value < 0;
      const bucket = isCost ? costs : gains;
      if (effect.op === "sub_stat") (value > 0 ? costs : gains).push(`${name} ${Math.abs(value)}`);
      else bucket.push(`${name} ${Math.abs(value)}`);
      continue;
    }
    if (STAT[target]) {
      const name = STAT[target];
      // Dropping noise or injury is a gain even though the stat is "bad".
      if (effect.op === "sub_stat") gains.push(`${name} ${Math.abs(value)} 감소`);
      else (value >= 0 ? costs : gains).push(`${name} ${Math.abs(value)}`);
      continue;
    }
  }
  return { gains, costs, routes };
}

function joinKo(parts) {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]}${josa(parts[0], "과/와")} ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, ${parts.at(-1)}`;
}

/**
 * The structured labels are not a safe source either.
 *
 * Across P1 there are 1419 gain/cost/risk values but only 282 distinct ones, and
 * 1161 of them come from about sixty abstract phrases repeated ten times or more
 * — 기력 소모 ×27, 위치 노출 ×26, 추가 확인 ×26. Only 73 values contain a number
 * at all. So the same generator that produced the five preview frames also
 * filled the labels, from its own pool, and neither layer was ever checked
 * against the effects.
 *
 * That leaves the effect list as the only thing on a choice that is true by
 * construction. Everything the player is shown about consequences is written
 * from it here.
 */
function renderConsequence(choice, nodeName) {
  const { gains, costs, routes } = readEffects(choice.effects);
  if (!gains.length && !costs.length && !routes.length) return null;

  const gain = gains.length ? joinKo(gains) : "";
  const cost = costs.length ? joinKo(costs) : "";

  const ledger = gain && cost
    ? `${gain}${josa(gain, "을/를")} 얻고 ${cost}${josa(cost, "을/를")} 치른다.`
    : gain
      ? `${gain}${josa(gain, "을/를")} 얻는다.`
      : cost
        ? `${cost}${josa(cost, "을/를")} 치른다.`
        : "";

  const commitment = routes.length ? `${joinKo(routes)} 노선을 굳힌다.` : "";
  const body = [ledger, commitment].filter(Boolean).join(" ");

  // Many choices cost exactly one noise, so the bare readout would repeat
  // eighteen times and trip the flow audit's two-per-game limit on identical
  // copy — and at eleven characters it also lands under the card's minimum.
  // Naming the place fixes both, and is true: the same cost in the flooded
  // archive is not the same moment as in the rooftop mast.
  const where = String(nodeName ?? "").trim();
  const preview = where ? `${where}에서 ${body}` : body;

  return { preview, gain, cost };
}

/** The card wants at least 28 characters, and two choices in one event must not
 *  read alike. Both are answered by naming where the choice leads: it is real
 *  information, it differs per choice, and it is the one thing the consequence
 *  readout leaves out. */
const PREVIEW_MIN = 28;
function qualify(preview, nextTitle, needsDistinction) {
  const short = preview.length < PREVIEW_MIN;
  if (!short && !needsDistinction) return preview;
  const title = String(nextTitle ?? "").trim();
  if (!title) return preview;
  return `${preview.replace(/\.$/u, "")}. 이어서 ${title}.`;
}

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-previews");
const sampleIdx = process.argv.indexOf("--sample");
const sampleN = sampleIdx >= 0 ? Number(process.argv[sampleIdx + 1] ?? 10) : 0;

const loaded = P1.map((id) => ({
  id,
  path: join(CHAPTER_DIR, `${id}.json`),
  chapter: JSON.parse(readFileSync(join(CHAPTER_DIR, `${id}.json`), "utf8")),
}));

/**
 * Rather than hard-coding the generator's vocabulary, find it: a phrase the
 * old pass reached for ten or more times across five chapters is a pool entry,
 * not something someone wrote for that choice.
 */
const POOL_THRESHOLD = 10;
const labelUse = new Map();
for (const { chapter } of loaded) {
  for (const event of chapter.events) {
    for (const choice of event.choices ?? []) {
      for (const field of ["gain_label", "cost_label", "risk_label"]) {
        const value = String(choice[field] ?? "").trim();
        if (value) labelUse.set(value, (labelUse.get(value) ?? 0) + 1);
      }
    }
  }
}
const pool = new Set([...labelUse].filter(([, n]) => n >= POOL_THRESHOLD).map(([v]) => v));

let previewsRewritten = 0;
let labelsRewritten = 0;
let risksCleared = 0;
let keptAuthored = 0;
let noMaterialEffects = 0;
const samples = [];
const perChapter = {};

for (const { id, path, chapter } of loaded) {
  let touched = 0;
  const nodeName = Object.fromEntries(chapter.nodes.map((n) => [n.node_id, n.name]));
  const eventTitle = Object.fromEntries(chapter.events.map((e) => [e.event_id, e.title]));

  for (const event of chapter.events) {
    // Choices in one event can share effects — a locker opens the same way
    // whether the player was after the records or the survivor — so the plain
    // readout would repeat inside a single card.
    const bodyCount = new Map();
    for (const choice of event.choices ?? []) {
      const draft = renderConsequence(choice, nodeName[event.node_id]);
      if (draft) bodyCount.set(draft.preview, (bodyCount.get(draft.preview) ?? 0) + 1);
    }

    for (const choice of event.choices ?? []) {
      const built = renderConsequence(choice, nodeName[event.node_id]);
      // A choice that only sets flags or picks a route changes no resource, so
      // there is no honest consequence readout to write. Left as authored.
      if (!built) { noMaterialEffects += 1; continue; }

      const existingPreview = String(choice.preview ?? "");
      // A newly authored choice arrives with these blank on purpose, so that
      // everything the player is told about consequences comes from one place.
      const previewIsBoilerplate = !existingPreview || BOILERPLATE.some((re) => re.test(existingPreview));
      const nextPreview = fixJosa(qualify(
        built.preview,
        eventTitle[choice.next_event_id],
        (bodyCount.get(built.preview) ?? 0) > 1,
      ));

      if (previewIsBoilerplate) {
        if (samples.length < sampleN) {
          samples.push({ chapter: chapter.chapter_id, event: event.event_id, label: choice.label, before: existingPreview, after: nextPreview });
        }
        if (apply && confirmed) choice.preview = nextPreview;
        previewsRewritten += 1;
        touched += 1;
      } else {
        keptAuthored += 1;
      }

      // The compact view reads these first, so a pool phrase here outranks the
      // corrected prose. Replace them from the same source.
      for (const [field, value] of [["gain_label", built.gain], ["cost_label", built.cost]]) {
        const current = String(choice[field] ?? "").trim();
        if (current && !pool.has(current)) continue;
        if (apply && confirmed) choice[field] = value;
        labelsRewritten += 1;
        touched += 1;
      }

      // "risk" is a forecast, not an effect; there is nothing in the data to
      // derive it from. A pool phrase there is pure decoration, so clear it and
      // let the compact view fall back to gain and cost.
      if (pool.has(String(choice.risk_label ?? "").trim())) {
        if (apply && confirmed) choice.risk_label = "";
        risksCleared += 1;
        touched += 1;
      }
    }
  }

  perChapter[chapter.chapter_id] = touched;
  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

for (const s of samples) {
  console.log(`[${s.chapter}] ${s.event}`);
  console.log(`  라벨 : ${s.label}`);
  console.log(`  이전 : ${s.before}`);
  console.log(`  이후 : ${s.after}\n`);
}

console.log(`반복 어휘 풀 크기: ${pool.size}개 (${POOL_THRESHOLD}회 이상 재사용된 값)`);
console.log(`템플릿 미리보기 교체: ${previewsRewritten}`);
console.log(`풀에서 나온 gain/cost 라벨 교체: ${labelsRewritten}`);
console.log(`풀에서 나온 risk 라벨 제거: ${risksCleared}`);
console.log(`손으로 쓴 미리보기 보존: ${keptAuthored}`);
console.log(`자원 변화가 없어 손대지 않음: ${noMaterialEffects}`);
for (const [id, n] of Object.entries(perChapter)) console.log(`  ${id}  ${n}건 수정`);

if (apply && confirmed) console.log(`\n적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("\n--confirm-part1-previews 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("\n계획만 출력했다. 적용하려면 --apply --confirm-part1-previews");
