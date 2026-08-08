/**
 * Part 1 Korean copy repair pass (CH01-CH05).
 *
 * Repairs the damage left by the chain of one-off polish/upgrade scripts:
 *   - `CH01-001` style debug codes rendered straight into player-facing prose
 *   - particles hard-coded next to interpolated nouns (주파수이, 엘리베이터을 …)
 *   - a `{수식어} {슬롯명사}` token injected in front of every gain/cost/risk label
 *   - outcome bodies identical across every branch of a chapter
 *   - choice labels assembled from those slots, several truncated mid-word
 *   - narration lines pasted into dialogue blocks and duplicated within an event
 *   - carry lines reduced to slash-joined fragments
 *   - internal identifiers (route.truth, EV_…) leaking into system lines
 *
 * Usage:
 *   node scripts/repair-part1-korean.mjs --plan
 *   node scripts/repair-part1-korean.mjs --apply --confirm-part1-korean-repair
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { repairJosa, withJosa } from "./lib/korean-josa.mjs";
import {
  ACTION_LABELS,
  ACTION_NOUNS,
  CARRY_FRAMES,
  INTERNAL_TERMS,
  OUTCOME_COST_FRAMES,
  OUTCOME_GAIN_FRAMES,
  OUTCOME_SUMMARY_FRAMES,
  PREVIEW_EXTENSIONS,
  PREVIEW_FRAMES,
  SLOT_MODIFIERS,
  SLOT_NOUNS,
  humanizeStat,
} from "./lib/part1-korean-copy.mjs";

const root = process.cwd();
const chapterDir = path.join(root, "private", "content", "data", "chapters");
const CHAPTERS = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const backupRoot = path.join(
  "G:\\Donggri_DevDrive\\storage\\codex-control\\reports\\DonggrolGameBook\\2026-08-08\\part1-korean-repair",
  "backup",
);

const DEBUG_CODE = /\bCH0\d-\d{3}\b\s*/gu;

const stats = {};
function bump(chapter, key, n = 1) {
  stats[chapter] ??= {};
  stats[chapter][key] = (stats[chapter][key] ?? 0) + n;
}

/**
 * Flow-audit contract (scripts/audit-part1-flow.mjs): a choice label may repeat at
 * most twice across all of Part 1 and must fit a 44-character card, and a preview
 * may repeat at most twice and must reach 28 characters. Counters are global
 * because the audit counts across chapters.
 */
const LABEL_MAX = 44;
const PREVIEW_MIN = 28;
const GLOBAL_REPEAT_MAX = 2;
const globalLabelCounts = new Map();
const globalPreviewCounts = new Map();

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

/* ------------------------------------------------------------------ */
/* slot stripping                                                      */
/* ------------------------------------------------------------------ */

/** Drop a leading `{수식어} {슬롯명사}` pair, e.g. "서측 표식 우회 비용" → "우회 비용". */
export function stripSlot(value) {
  if (typeof value !== "string") return value;
  const tokens = value.trim().split(/\s+/u);
  if (tokens.length >= 3 && SLOT_MODIFIERS.has(tokens[0]) && SLOT_NOUNS.has(tokens[1])) {
    return tokens.slice(2).join(" ");
  }
  return value.trim();
}

/** Remove every injected slot pair anywhere in a sentence. */
function stripSlotEverywhere(value) {
  if (typeof value !== "string") return value;
  const tokens = value.split(/(\s+)/u);
  const out = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const word = tokens[i];
    if (/^\s+$/u.test(word)) {
      out.push(word);
      continue;
    }
    const next = tokens[i + 2];
    if (SLOT_MODIFIERS.has(word) && next && SLOT_NOUNS.has(next)) {
      i += 2; // skip modifier, the space, and the slot noun
      continue;
    }
    out.push(word);
  }
  return out.join("").replace(/\s{2,}/gu, " ").trim();
}

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

const joiner = (word) => (pair) => withJosa(word, pair);

function dedupeWords(text, maxWords = 6) {
  const words = text.trim().split(/\s+/u);
  const seen = new Set();
  const kept = [];
  for (const w of words) {
    const key = w.replace(/[.,!?]$/u, "");
    if (key.length >= 2 && seen.has(key)) continue;
    seen.add(key);
    kept.push(w);
  }
  return kept.slice(0, maxWords).join(" ");
}

/** Short adverbial that distinguishes sibling choices, derived from real effects. */
function effectQualifier(choice) {
  const effects = choice.effects ?? [];
  const stat = (target) => effects.find((e) => String(e.target ?? "").endsWith(target));
  const noiseDown = effects.find((e) => e.op === "sub_stat" && String(e.target).includes("noise"));
  const noiseUp = effects.find((e) => e.op === "add_stat" && String(e.target).includes("noise") && Number(e.value) > 0);
  const contamination = stat("contamination");
  const injury = stat("injury");
  if (noiseDown) return "조용히";
  if (injury) return "부상을 감수하고";
  if (contamination && Number(contamination.value) > 0) return "오염을 무릅쓰고";
  if (noiseUp && Number(noiseUp.value) >= 3) return "소리를 내고라도";
  if (noiseUp) return "서둘러";
  if (effects.some((e) => e.op === "grant_loot_table" || e.op === "grant_item")) return "물자를 챙기며";
  if (effects.some((e) => e.op === "add_trust" || e.op === "add_reputation")) return "사람을 먼저 보고";
  return "";
}

/* ------------------------------------------------------------------ */
/* per-field repairs                                                   */
/* ------------------------------------------------------------------ */

const PARTICLE_PAIR = {
  이: "이/가", 가: "이/가",
  은: "은/는", 는: "은/는",
  을: "을/를", 를: "을/를",
  과: "과/와", 와: "과/와",
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/**
 * Swap an internal identifier for its Korean name and recompute any particle that
 * was attached to it. `route.truth가` must become `진실 기록이`, not `진실 기록가`.
 */
function replaceWithParticle(text, pattern, resolve) {
  return text.replace(new RegExp(`${pattern}(이|가|은|는|을|를|과|와)?`, "gu"), (match, particle, ...rest) => {
    const korean = resolve(match.replace(/(이|가|은|는|을|를|과|와)$/u, ""), rest);
    if (!particle) return korean;
    return withJosa(korean, PARTICLE_PAIR[particle]);
  });
}

function cleanInternalIds(text, eventTitleById) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const [id, korean] of Object.entries(INTERNAL_TERMS)) {
    out = replaceWithParticle(out, escapeRegex(id), () => korean);
  }
  out = replaceWithParticle(out, "\\bEV_[A-Z0-9_]+\\b", (id) => eventTitleById.get(id) ?? "다음 장면");
  out = out.replace(/\bflag:[a-z0-9_]+\b/giu, "선택 기록");
  out = out.replace(DEBUG_CODE, "");
  return out.replace(/\s{2,}/gu, " ").trim();
}

/**
 * Pick the shortest still-distinctive form of a label.
 *
 * Turning "멈춘 로비 북문 기록 - 기록 회수" into "기록을 회수한다" makes it readable
 * but collides globally, so the escalation adds the real location and the real
 * trade-off — the same way the hand-authored labels read ("냉동창고부터 수색한다").
 */
function uniqueLabel(base, { node, qualifier, gain }, siblingLabels) {
  const gainClause = gain ? `${withJosa(gain, "을/를")} 노리고` : null;
  const candidates = [
    base,
    node ? `${node}에서 ${base}` : null,
    qualifier ? `${qualifier} ${base}` : null,
    qualifier && node ? `${qualifier} ${node}에서 ${base}` : null,
    gainClause ? `${gainClause} ${base}` : null,
    gainClause && node ? `${node}에서 ${gainClause} ${base}` : null,
  ].filter((c) => c && c.length <= LABEL_MAX);

  for (const candidate of candidates) {
    if (siblingLabels.has(candidate)) continue;
    if ((globalLabelCounts.get(candidate) ?? 0) >= GLOBAL_REPEAT_MAX) continue;
    return candidate;
  }
  return candidates.find((c) => !siblingLabels.has(c)) ?? candidates[0] ?? base;
}

function rebuildLabel(choice, index, siblingLabels) {
  const raw = String(choice.label ?? "").trim();
  let base = null;

  if (raw.includes(" - ")) {
    const action = raw.split(" - ").pop().trim();
    base = ACTION_LABELS[action] ?? null;
    if (!base) {
      const cleaned = stripSlotEverywhere(action);
      base = ACTION_LABELS[cleaned] ?? null;
    }
  }

  if (!base) {
    const cleaned = stripSlotEverywhere(raw);
    // Already a natural sentence? keep it.
    if (/(다|요)$/u.test(cleaned) && !cleaned.includes(" - ")) return cleaned;
    base = ACTION_LABELS[cleaned] ?? cleaned;
  }

  // A label ending on a bare action noun is a fragment; make it something the
  // player does.
  const lastToken = base.trim().split(/\s+/u).pop() ?? "";
  if (ACTION_NOUNS.has(lastToken)) base = `${base}한다`;

  const label = uniqueLabel(base, {
    node: choice.__nodeName ?? null,
    qualifier: effectQualifier(choice),
    gain: stripSlot(choice.gain_label),
  }, siblingLabels);

  siblingLabels.add(label);
  globalLabelCounts.set(label, (globalLabelCounts.get(label) ?? 0) + 1);
  return label;
}

/**
 * Rebuild a preview only when the original was contaminated by an injected slot.
 * The hand-authored previews ("9mm 탄 4발을 써서 즉시 돌파한다. 대신 소음이 4 올라
 * 뒤쪽 위협이 빨리 깨어난다.") are better than anything a frame can produce, and
 * overwriting them is exactly the mistake that produced this cleanup.
 */
function rebuildPreview(choice, index) {
  const extension = PREVIEW_EXTENSIONS[choice.choice_id];
  if (extension) return extension;

  const original = choice.preview;
  if (typeof original === "string" && original && stripSlotEverywhere(original) === original.trim()) {
    return null;
  }
  const gain = stripSlot(choice.gain_label);
  const cost = stripSlot(choice.cost_label);
  const risk = stripSlot(choice.risk_label);
  if (!gain || !cost || !risk) return null;
  const args = { g: joiner(gain), c: joiner(cost), r: joiner(risk) };

  // Walk the frames until one is long enough for the card and not already used
  // twice elsewhere in Part 1. Sibling choices can share identical gain/cost/risk
  // labels, which exhausts the frames, so the location prefix widens the pool.
  const node = choice.__nodeName;
  const prefixes = node ? ["", `${node}에서는 `] : [""];
  let fallback = null;
  for (const prefix of prefixes) {
    for (let step = 0; step < PREVIEW_FRAMES.length; step += 1) {
      let candidate = `${prefix}${PREVIEW_FRAMES[(index + step) % PREVIEW_FRAMES.length](args)}`;
      if (candidate.length < PREVIEW_MIN && node) candidate = `${node}에서의 판단이다. ${candidate}`;
      fallback ??= candidate;
      if (candidate.length >= PREVIEW_MIN && (globalPreviewCounts.get(candidate) ?? 0) < GLOBAL_REPEAT_MAX) {
        globalPreviewCounts.set(candidate, (globalPreviewCounts.get(candidate) ?? 0) + 1);
        return candidate;
      }
    }
  }
  globalPreviewCounts.set(fallback, (globalPreviewCounts.get(fallback) ?? 0) + 1);
  return fallback;
}

function rebuildOutcomeText(choice, index) {
  const gain = humanizeStat(stripSlot(choice.gain_label));
  const cost = humanizeStat(stripSlot(choice.cost_label));
  const risk = humanizeStat(stripSlot(choice.risk_label));
  if (!gain || !cost || !risk) return null;
  const g = joiner(gain);
  const c = joiner(cost);
  const r = joiner(risk);
  return {
    summary: OUTCOME_SUMMARY_FRAMES[index % OUTCOME_SUMMARY_FRAMES.length]({ g, c }),
    body: [
      OUTCOME_GAIN_FRAMES[index % OUTCOME_GAIN_FRAMES.length]({ g }),
      OUTCOME_COST_FRAMES[index % OUTCOME_COST_FRAMES.length]({ c, r }),
    ],
  };
}

function isFragmentCarry(value) {
  return typeof value === "string" && value.split(" / ").length >= 3 && !/[.!?]$/u.test(value.trim());
}

/* ------------------------------------------------------------------ */
/* main pass                                                           */
/* ------------------------------------------------------------------ */

function repairChapter(chapterKey, data) {
  const events = data.events ?? [];
  const eventTitleById = new Map(events.map((e) => [e.event_id, String(e.title ?? "").trim()]));

  // choice that leads to each outcome event
  const outcomeSource = new Map();
  events.forEach((event) => {
    (event.choices ?? []).forEach((choice) => {
      if (choice.next_event_id) outcomeSource.set(choice.next_event_id, { event, choice });
    });
  });

  const nodeNameById = new Map((data.nodes ?? []).map((n) => [n.node_id, String(n.name ?? "").trim()]));

  // --- pass 1: clean every choice, then rebuild label/preview ---
  let choiceIndex = 0;
  for (const event of events) {
    const siblingLabels = new Set();
    const nodeName = nodeNameById.get(event.node_id) || null;
    for (const choice of event.choices ?? []) {
      // transient: consumed by uniqueLabel/rebuildPreview, deleted below
      Object.defineProperty(choice, "__nodeName", { value: nodeName, enumerable: false, configurable: true });
      for (const field of ["gain_label", "cost_label", "risk_label"]) {
        const before = choice[field];
        const after = stripSlot(before);
        if (after !== before) {
          choice[field] = after;
          bump(chapterKey, "슬롯제거_라벨");
        }
      }

      const newLabel = rebuildLabel(choice, choiceIndex, siblingLabels);
      if (newLabel && newLabel !== choice.label) {
        choice.label = newLabel;
        bump(chapterKey, "선택지_재작성");
      }

      const newPreview = rebuildPreview(choice, choiceIndex);
      if (newPreview && newPreview !== choice.preview) {
        choice.preview = newPreview;
        bump(chapterKey, "프리뷰_재작성");
      } else if (typeof choice.preview === "string") {
        globalPreviewCounts.set(choice.preview, (globalPreviewCounts.get(choice.preview) ?? 0) + 1);
      }
      delete choice.__nodeName;
      choiceIndex += 1;
    }
  }

  // --- pass 2: outcome events written from the choice that produced them ---
  let outcomeIndex = 0;
  for (const event of events) {
    if (event.event_type !== "outcome") continue;
    const source = outcomeSource.get(event.event_id);
    if (!source) continue;
    const rebuilt = rebuildOutcomeText(source.choice, outcomeIndex);
    if (!rebuilt) continue;
    event.text ??= {};
    event.text.summary = rebuilt.summary;
    event.text.body = rebuilt.body;
    bump(chapterKey, "결과문_재작성");

    const cleanTitle = dedupeWords(stripSlotEverywhere(String(event.title ?? "").replace(/\s*이후:.*$/u, "")), 5);
    const finalTitle = /결과$/u.test(cleanTitle) ? cleanTitle : `${cleanTitle} 결과`.trim();
    if (finalTitle && finalTitle !== event.title) {
      event.title = finalTitle;
      bump(chapterKey, "제목_정리");
    }
    outcomeIndex += 1;
  }

  // --- pass 3: prose repairs on every event ---
  for (const event of events) {
    const text = event.text;
    if (!text) continue;

    if (typeof event.title === "string") {
      const t = dedupeWords(cleanInternalIds(stripSlotEverywhere(event.title), eventTitleById), 6);
      if (t && t !== event.title) {
        event.title = t;
        bump(chapterKey, "제목_정리");
      }
    }

    const scrub = (value) => {
      if (typeof value !== "string") return value;
      const cleaned = cleanInternalIds(stripSlotEverywhere(value), eventTitleById);
      const { text: fixed, fixes } = repairJosa(cleaned);
      if (fixes.length) bump(chapterKey, "조사_교정", fixes.length);
      if (DEBUG_CODE.test(value)) bump(chapterKey, "디버그코드_제거");
      DEBUG_CODE.lastIndex = 0;
      return fixed;
    };

    if (typeof text.summary === "string") text.summary = scrub(text.summary);
    if (Array.isArray(text.body)) text.body = text.body.map(scrub).filter(Boolean);

    // carry line: rebuild the slash-fragment ones, scrub the rest
    if (isFragmentCarry(text.carry_line)) {
      const first = (event.choices ?? [])[0];
      const gain = first ? stripSlot(first.gain_label) : null;
      const cost = first ? stripSlot(first.cost_label) : null;
      if (gain && cost) {
        const frame = CARRY_FRAMES[outcomeIndex % CARRY_FRAMES.length];
        text.carry_line = frame({ g: joiner(gain), c: joiner(cost) });
      } else {
        text.carry_line = stripSlotEverywhere(text.carry_line.split(" / ")[0]);
      }
      bump(chapterKey, "carry_line_문장화");
    } else if (typeof text.carry_line === "string") {
      text.carry_line = scrub(text.carry_line);
    }

    // scene blocks: scrub, drop narration pasted into dialogue, dedupe within event
    if (Array.isArray(text.scene_blocks)) {
      const originalBlocks = text.scene_blocks.map((b) => ({ ...b, lines: [...(b.lines ?? [])] }));
      const narration = new Set(
        text.scene_blocks.filter((b) => b.kind === "narration").flatMap((b) => b.lines ?? []),
      );
      // Dedupe on the *scrubbed* value: two lines can differ only by an injected
      // slot token and collapse into the same sentence once it is removed.
      const seen = new Set();
      for (const block of text.scene_blocks) {
        if (!Array.isArray(block.lines)) continue;
        const kept = [];
        for (const line of block.lines) {
          if (block.kind === "dialogue" && narration.has(line)) {
            bump(chapterKey, "대사속_나레이션_제거");
            continue;
          }
          const cleaned = scrub(line);
          if (!cleaned || seen.has(cleaned)) {
            bump(chapterKey, "이벤트내_중복제거");
            continue;
          }
          seen.add(cleaned);
          kept.push(cleaned);
        }
        block.lines = kept;
        if (typeof block.emphasis === "string") {
          const sentences = [...new Set(scrub(block.emphasis).split(/(?<=[.!?])\s+/u).map((s) => s.trim()).filter(Boolean))];
          const merged = sentences.slice(0, 2).join(" ");
          if (merged !== block.emphasis) bump(chapterKey, "emphasis_중복정리");
          block.emphasis = merged;
        }
      }

      // Never leave an event with no renderable line: the runtime would silently
      // fall back to `text.body`, which outcome events do not always have.
      text.scene_blocks = text.scene_blocks.filter((b) => (b.lines ?? []).length > 0);
      if (text.scene_blocks.length === 0) {
        const first = originalBlocks.find((b) => (b.lines ?? []).length > 0);
        if (first) text.scene_blocks = [{ ...first, lines: [scrub(first.lines[0])] }];
      }
    }
  }

  // --- pass 4: final josa sweep across every remaining string ---
  const sweep = (node) => {
    if (typeof node === "string") {
      const { text: fixed, fixes } = repairJosa(node);
      if (fixes.length) bump(chapterKey, "조사_교정_최종", fixes.length);
      return fixed;
    }
    if (Array.isArray(node)) return node.map(sweep);
    if (node && typeof node === "object") {
      for (const key of Object.keys(node)) {
        if (key.endsWith("_id") || key === "op" || key === "target" || key === "art_key" || key === "music_key") continue;
        node[key] = sweep(node[key]);
      }
      return node;
    }
    return node;
  };
  for (const event of events) {
    if (event.text) event.text = sweep(event.text);
    for (const choice of event.choices ?? []) {
      choice.label = sweep(choice.label);
      choice.preview = sweep(choice.preview);
      choice.gain_label = sweep(choice.gain_label);
      choice.cost_label = sweep(choice.cost_label);
      choice.risk_label = sweep(choice.risk_label);
    }
  }

  return data;
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const plan = args.includes("--plan");
const apply = args.includes("--apply");
const sample = args.includes("--sample");
const confirmed = args.includes("--confirm-part1-korean-repair");
if (Number(plan) + Number(apply) + Number(sample) !== 1) {
  console.error("choose exactly one of --plan, --sample, or --apply");
  process.exit(1);
}
if (apply && !confirmed) {
  console.error("--apply requires --confirm-part1-korean-repair");
  process.exit(1);
}

const results = [];
for (const chapterKey of CHAPTERS) {
  const file = path.join(chapterDir, `${chapterKey}.json`);
  const original = fs.readFileSync(file);
  const data = JSON.parse(original.toString("utf8"));
  const before = JSON.parse(original.toString("utf8"));
  const repaired = repairChapter(chapterKey, data);
  const output = Buffer.from(`${JSON.stringify(repaired, null, 2)}\n`, "utf8");
  results.push({ chapterKey, file, original, output, before, after: repaired });
}

if (sample) {
  for (const { chapterKey, before, after } of results) {
    console.log(`\n${"=".repeat(76)}\n### ${chapterKey} — ${after.title}\n${"=".repeat(76)}`);
    const beforeById = new Map((before.events ?? []).map((e) => [e.event_id, e]));
    const outcomes = (after.events ?? []).filter((e) => e.event_type === "outcome").slice(0, 2);
    const normals = (after.events ?? []).filter((e) => e.event_type !== "outcome").slice(1, 3);
    for (const event of [...normals, ...outcomes]) {
      const old = beforeById.get(event.event_id);
      console.log(`\n[${event.event_type}] ${event.event_id}`);
      console.log(`  제목  BEFORE: ${old?.title}`);
      console.log(`        AFTER : ${event.title}`);
      if (event.text?.summary) {
        console.log(`  요약  BEFORE: ${old?.text?.summary}`);
        console.log(`        AFTER : ${event.text.summary}`);
      }
      if (Array.isArray(event.text?.body) && event.text.body.length) {
        console.log(`  본문  BEFORE: ${JSON.stringify(old?.text?.body)}`);
        console.log(`        AFTER : ${JSON.stringify(event.text.body)}`);
      }
      if (event.text?.carry_line) {
        console.log(`  이월  BEFORE: ${old?.text?.carry_line}`);
        console.log(`        AFTER : ${event.text.carry_line}`);
      }
      (event.choices ?? []).forEach((c, i) => {
        const oc = (old?.choices ?? [])[i];
        console.log(`  선택${i + 1} BEFORE: ${oc?.label}`);
        console.log(`         AFTER : ${c.label}`);
        console.log(`         프리뷰 BEFORE: ${oc?.preview}`);
        console.log(`         프리뷰 AFTER : ${c.preview}`);
      });
    }
  }
  process.exit(0);
}

if (plan) {
  console.log(JSON.stringify({
    mode: "plan",
    chapters: results.map((r) => ({
      chapter: r.chapterKey,
      before_bytes: r.original.length,
      after_bytes: r.output.length,
      before_sha256: sha256(r.original),
      after_sha256: sha256(r.output),
      changed: sha256(r.original) !== sha256(r.output),
    })),
    repairs: stats,
  }, null, 2));
  process.exit(0);
}

fs.mkdirSync(backupRoot, { recursive: true });
const written = [];
for (const r of results) {
  const backup = path.join(backupRoot, `${r.chapterKey}.json`);
  if (!fs.existsSync(backup)) fs.writeFileSync(backup, r.original);
  fs.writeFileSync(r.file, r.output);
  written.push({
    chapter: r.chapterKey,
    file: r.file,
    backup,
    before_bytes: r.original.length,
    before_sha256: sha256(r.original),
    after_bytes: r.output.length,
    after_sha256: sha256(r.output),
  });
}

console.log(JSON.stringify({ mode: "apply", pass: true, backup_root: backupRoot, written, repairs: stats }, null, 2));
