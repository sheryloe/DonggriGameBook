/**
 * Part 1 Korean copy linter (CH01-CH05).
 *
 * Regression guard for the damage classes found in the 2026-08-08 review. Run it
 * after any script touches chapter copy; a non-zero exit means player-facing text
 * regressed. `--json` prints the machine-readable report.
 *
 * Also importable: `private-export.mjs` calls `lintPart1Korean()` so contaminated
 * copy cannot reach the runtime pack, which is the only path to the app.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { repairJosa, withJosa } from "./lib/korean-josa.mjs";
import { INTERNAL_TERMS, SLOT_MODIFIERS, SLOT_NOUNS } from "./lib/part1-korean-copy.mjs";

/**
 * `받침 + 가` is normally a noun ending (증가, 상가, 누군가), so repairJosa leaves
 * it alone. For nouns we substitute ourselves the correct particle is knowable,
 * so those get an exact check — that is how "진실 기록가" was caught.
 */
const KNOWN_NOUNS = [
  ...new Set([
    ...Object.values(INTERNAL_TERMS),
    "기록", "보관함", "방송", "신호", "주파수", "퇴로", "소음", "오염", "물자", "생존자", "수위",
  ]),
].sort((a, b) => b.length - a.length);

const PARTICLE_PAIRS = { 이: "이/가", 가: "이/가", 은: "은/는", 는: "은/는", 을: "을/를", 를: "을/를", 과: "과/와", 와: "과/와" };

function knownNounJosaErrors(value) {
  const errors = [];
  for (const noun of KNOWN_NOUNS) {
    const re = new RegExp(`${noun}(이|가|은|는|을|를|과|와)(?=[\\s.,!?]|$)`, "gu");
    for (const match of value.matchAll(re)) {
      const particle = match[1];
      const correct = withJosa(noun, PARTICLE_PAIRS[particle]);
      if (correct !== `${noun}${particle}`) errors.push(`${noun}${particle}→${correct}`);
    }
  }
  return errors;
}

const root = process.cwd();
const chapterDir = path.join(root, "private", "content", "data", "chapters");
// Both roots serve `/generated/images`: the repo-wide public directory and the
// per-app copy the build produces. Checking only one under-reports coverage.
const imageDirs = [
  path.join(root, "public", "generated", "images"),
  path.join(root, "apps", "part1", "public", "generated", "images"),
];
const overridePath = path.join(root, "packages", "app-runtime", "src", "assets", "runtimeArtOverrides.json");
const CHAPTERS = ["ch01", "ch02", "ch03", "ch04", "ch05"];

const DEBUG_CODE = /\bCH0\d-\d{3}\b/u;
const INTERNAL_ID = /\broute\.[a-z_]+|\bEV_[A-Z0-9_]+\b|\bflag[:.][a-z0-9_]+|widget_state\./u;
const DANGLING_END = /(을|를|이|가|은|는|와|과|의|로|고|며|서|만 남)$/u;

let findings = [];
let seenFindings = new Set();
function report(rule, chapter, eventId, detail, sample) {
  // repairJosa and knownNounJosaErrors can both flag the same word; report once.
  const key = `${rule}|${chapter}|${eventId}|${detail}`;
  if (seenFindings.has(key)) return;
  seenFindings.add(key);
  findings.push({ rule, chapter, event_id: eventId, detail, sample: sample?.slice(0, 160) });
}

function textFields(event) {
  const t = event.text ?? {};
  const out = [];
  if (typeof t.summary === "string") out.push(["summary", t.summary]);
  (t.body ?? []).forEach((line, i) => out.push([`body[${i}]`, line]));
  if (typeof t.carry_line === "string") out.push(["carry_line", t.carry_line]);
  (t.scene_blocks ?? []).forEach((b, bi) => {
    (b.lines ?? []).forEach((line, li) => out.push([`scene[${bi}].${b.kind}[${li}]`, line]));
    if (typeof b.emphasis === "string") out.push([`scene[${bi}].emphasis`, b.emphasis]);
  });
  return out;
}

function hasSlotPair(value) {
  const tokens = String(value).split(/\s+/u);
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (SLOT_MODIFIERS.has(tokens[i]) && SLOT_NOUNS.has(tokens[i + 1])) return `${tokens[i]} ${tokens[i + 1]}`;
  }
  return null;
}

const imageStems = new Set();
const imageFiles = new Set();
for (const dir of imageDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    imageFiles.add(entry.name);
    imageStems.add(entry.name.replace(/\.[^.]+$/u, ""));
  }
}
const overrides = fs.existsSync(overridePath)
  ? new Map(
      (JSON.parse(fs.readFileSync(overridePath, "utf8")).mappings ?? []).flatMap((m) =>
        (m.runtime_art_keys ?? []).map((k) => [`${m.chapter_id}:${k}`, m.src]),
      ),
    )
  : new Map();

/**
 * Run every Part 1 copy rule.
 * @returns {{pass: boolean, total: number, by_rule: Record<string, number>, findings: object[]}}
 */
export function lintPart1Korean() {
  findings = [];
  seenFindings = new Set();
  for (const chapter of CHAPTERS) {
  const chapterId = chapter.toUpperCase();
  const data = JSON.parse(fs.readFileSync(path.join(chapterDir, `${chapter}.json`), "utf8"));
  const events = data.events ?? [];
  const outcomeBodies = new Map();

  for (const event of events) {
    const id = event.event_id;

    for (const [field, value] of textFields(event)) {
      if (DEBUG_CODE.test(value)) report("debug-code", chapter, id, `${field}에 내부 코드 노출`, value);
      if (INTERNAL_ID.test(value)) report("internal-id", chapter, id, `${field}에 내부 식별자 노출`, value);
      const slot = hasSlotPair(value);
      if (slot) report("slot-token", chapter, id, `${field}에 주입 슬롯 "${slot}"`, value);
      const { fixes } = repairJosa(value);
      if (fixes.length) report("josa", chapter, id, `${field} 조사 오류: ${fixes.map((f) => `${f.from}→${f.to}`).join(", ")}`, value);
      const known = knownNounJosaErrors(value);
      if (known.length) report("josa", chapter, id, `${field} 조사 오류: ${known.join(", ")}`, value);
    }

    if (typeof event.title === "string") {
      const words = event.title.replace(/\s*결과$/u, "").split(/\s+/u).filter((w) => w.length >= 2);
      const dup = words.filter((w, i) => words.indexOf(w) !== i);
      if (dup.length) report("title-duplicate", chapter, id, `제목 단어 중복: ${[...new Set(dup)].join(", ")}`, event.title);
      if (DEBUG_CODE.test(event.title)) report("debug-code", chapter, id, "제목에 내부 코드 노출", event.title);
    }

    // narration pasted into dialogue, and lines repeated inside one event
    const blocks = event.text?.scene_blocks ?? [];
    const narration = new Set(blocks.filter((b) => b.kind === "narration").flatMap((b) => b.lines ?? []));
    const seen = new Set();
    for (const block of blocks) {
      for (const line of block.lines ?? []) {
        if (block.kind === "dialogue" && narration.has(line)) {
          report("narration-in-dialogue", chapter, id, `${withJosa(block.speaker_label ?? "화자", "이/가")} 나레이션을 말함`, line);
        }
        if (seen.has(line)) report("duplicate-line", chapter, id, "이벤트 내 문장 중복", line);
        seen.add(line);
      }
    }

    // carry_line must be a sentence, not a slash-joined fragment list
    const carry = event.text?.carry_line;
    if (typeof carry === "string" && carry.split(" / ").length >= 3 && !/[.!?]$/u.test(carry.trim())) {
      report("carry-fragment", chapter, id, "carry_line이 슬래시 나열", carry);
    }

    for (const [i, choice] of (event.choices ?? []).entries()) {
      const label = String(choice.label ?? "");
      if (label.includes(" - ")) report("template-label", chapter, id, `선택${i + 1} 라벨이 템플릿 조립형`, label);
      if (DANGLING_END.test(label.trim())) report("truncated-label", chapter, id, `선택${i + 1} 라벨이 조사/연결어미로 끊김`, label);
      const labelSlot = hasSlotPair(label);
      if (labelSlot) report("slot-token", chapter, id, `선택${i + 1} 라벨에 주입 슬롯 "${labelSlot}"`, label);

      for (const field of ["preview", "gain_label", "cost_label", "risk_label"]) {
        const value = choice[field];
        if (typeof value !== "string") continue;
        const slot = hasSlotPair(value);
        if (slot) report("slot-token", chapter, id, `선택${i + 1} ${field}에 주입 슬롯 "${slot}"`, value);
        const { fixes } = repairJosa(value);
        if (fixes.length) report("josa", chapter, id, `선택${i + 1} ${field} 조사 오류`, value);
      }

      const preview = String(choice.preview ?? "");
      const freq = new Map();
      for (const w of preview.match(/[가-힣]{2,}/gu) ?? []) freq.set(w, (freq.get(w) ?? 0) + 1);
      const hot = [...freq.entries()].find(([, n]) => n >= 3);
      if (hot) report("repeated-noun", chapter, id, `선택${i + 1} 프리뷰에 "${hot[0]}" ${hot[1]}회 반복`, preview);
    }

    if (event.event_type === "outcome") {
      const key = (event.text?.body ?? []).join(" | ");
      outcomeBodies.set(key, (outcomeBodies.get(key) ?? 0) + 1);
    }

    // art_key must resolve to a real file, through the override map or directly
    const artKey = event.presentation?.art_key;
    if (artKey) {
      const src = overrides.get(`${chapterId}:${artKey}`);
      const viaOverride = src ? imageFiles.has(src.split("/").pop()) : false;
      if (!viaOverride && !imageStems.has(artKey)) {
        report("missing-art", chapter, id, `art_key "${artKey}" 해결 불가`, src ?? artKey);
      }
    }
  }

  const worst = [...outcomeBodies.entries()].sort((a, b) => b[1] - a[1])[0];
  if (worst && worst[1] > 3) {
    report("identical-outcome", chapter, "-", `동일 결과문 ${worst[1]}건 (선택이 결과에 반영되지 않음)`, worst[0]);
  }
  }

  const byRule = {};
  for (const f of findings) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
  return { pass: findings.length === 0, total: findings.length, by_rule: byRule, findings: [...findings] };
}

function main() {
  const result = lintPart1Korean();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Part 1 한국어 린트: ${result.pass ? "PASS" : `FAIL (${result.total}건)`}`);
    for (const [rule, n] of Object.entries(result.by_rule).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${rule}`);
    for (const f of result.findings.slice(0, 25)) console.log(`   - [${f.rule}] ${f.chapter}/${f.event_id} ${f.detail}\n       ${f.sample}`);
    if (result.total > 25) console.log(`   … 외 ${result.total - 25}건`);
  }
  process.exit(result.pass ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
