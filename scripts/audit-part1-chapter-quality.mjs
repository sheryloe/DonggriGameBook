/**
 * Per-chapter Part 1 quality scorecard (CH01-CH05).
 *
 * The 950 scorecard grades Part 1 as a whole, so it cannot say which chapter is
 * weak. This grades each chapter on five 10-point lenses that an agent playthrough
 * on 2026-08-08 showed actually differ between chapters.
 *
 * Every deduction is measured, not judged: the thresholds are documented next to
 * each lens so a score can be argued with.
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const chapterDir = path.join(root, "private", "content", "data", "chapters");
const CHAPTERS = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const outputPath = path.join(root, "docs", "ops", "PART1_CHAPTER_QUALITY.json");

/** Which NPCs belong to which chapter, taken from the anchor/support portrait set. */
const CHAPTER_NPCS = {
  ch01: ["npc_yoon_haein", "npc_jung_noah"],
  ch02: ["npc_jung_noah", "npc_seo_jinseo", "npc_yoon_haein"],
  ch03: ["npc_ahn_bogyeong", "npc_ryu_seon", "npc_yoon_haein"],
  ch04: ["npc_han_somyeong", "npc_yoon_haein"],
  ch05: ["npc_kim_ara", "npc_yoon_haein"],
};

const clamp10 = (v) => Math.max(0, Math.min(10, Number(v.toFixed(1))));

function measure(chapter) {
  const data = JSON.parse(fs.readFileSync(path.join(chapterDir, `${chapter}.json`), "utf8"));
  const events = data.events ?? [];
  const incoming = new Map();
  for (const e of events) for (const c of e.choices ?? []) if (c.next_event_id) incoming.set(c.next_event_id, c);

  const m = {
    events: events.length,
    outcomes: 0,
    choices: 0,
    titleEcho: 0,
    thirdPersonInDialogue: 0,
    foreignSpeaker: 0,
    outcomeRepeatsAction: 0,
    artKeys: new Set(),
    speakers: new Set(),
    narrativeChars: 0,
    duplicateLines: 0,
    choicelessEvents: 0,
  };
  const lineCounts = new Map();

  for (const event of events) {
    const title = String(event.title ?? "").replace(/\s*결과$/u, "").trim();
    const blocks = event.text?.scene_blocks ?? [];
    const lines = blocks.flatMap((b) => b.lines ?? []).concat(event.text?.body ?? []);
    m.narrativeChars += lines.join("").length;
    for (const l of lines) lineCounts.set(l, (lineCounts.get(l) ?? 0) + 1);
    if (title.length >= 3 && lines.join(" ").split(title).length - 1 >= 2) m.titleEcho += 1;
    for (const b of blocks) {
      if (b.kind !== "dialogue") continue;
      if (b.speaker_id) {
        m.speakers.add(b.speaker_id);
        if (!(CHAPTER_NPCS[chapter] ?? []).includes(b.speaker_id)) m.foreignSpeaker += 1;
      }
      for (const l of b.lines ?? []) if (/서지훈(은|이|의|을)/u.test(l)) m.thirdPersonInDialogue += 1;
    }
    if (event.presentation?.art_key) m.artKeys.add(event.presentation.art_key);
    m.choices += (event.choices ?? []).length;
    // A combat handoff is choiceless on purpose: `eventRunner` sends an event
    // carrying a `combat` payload straight to the battle screen and never draws
    // the event card, so choices written on it would never be seen. The player's
    // agency there lives in the battle, not in a list of options.
    const handsOffToBattle = Boolean(event.combat) || event.event_type === "boss";
    if (!handsOffToBattle && (event.choices ?? []).length === 0) m.choicelessEvents += 1;
    if (event.event_type === "outcome") {
      m.outcomes += 1;
      const from = incoming.get(event.event_id);
      const stems = title.split(/\s+/u).filter((w) => w.length >= 2);
      for (const c of event.choices ?? []) {
        const label = String(c.label ?? "");
        if (label === from?.label || stems.some((s) => label.includes(s.slice(0, 2)))) m.outcomeRepeatsAction += 1;
      }
    }
  }
  m.duplicateLines = [...lineCounts.values()].filter((n) => n > 1).length;
  // Severity, not raw count: a line appearing twice across ~100 events is normal
  // for this genre, and the project's own flow audit only errors above 8. Excess
  // counts how far past a stricter 3-repeat bar a line goes.
  m.excessRepeats = [...lineCounts.values()].reduce((sum, n) => sum + Math.max(0, n - 3), 0);
  m.worstRepeat = Math.max(0, ...lineCounts.values());
  return m;
}

function score(chapter, m) {
  const ev = Math.max(1, m.events);
  // 1) 문장 품질: 제목 메아리가 없고, 같은 문장이 3회를 넘겨 반복되지 않을수록 만점
  const prose = clamp10(10 - (m.titleEcho / ev) * 40 - (m.excessRepeats / ev) * 20);
  // 2) 화자 일관성: 외부 챕터 NPC가 없고 대사에 3인칭 서술이 없을수록 만점
  const voice = clamp10(10 - m.foreignSpeaker * 3 - (m.thirdPersonInDialogue / ev) * 30);
  // 3) 선택 설계: 결과 화면이 방금 한 행동을 되풀이하지 않고, 이벤트당 선택이 충분할수록 만점
  const agency = clamp10(10 - (m.outcomeRepeatsAction / Math.max(1, m.outcomes)) * 12 - (m.choicelessEvents / ev) * 10);
  // 4) 연출 자산: 이벤트 대비 고유 배경/초상 종류 (12종 이상이면 만점)
  const art = clamp10((m.artKeys.size / 12) * 10);
  // 5) 밀도: 이벤트당 서사 분량 (140자 기준 만점, 과하면 감점 없음)
  const density = clamp10((m.narrativeChars / ev / 140) * 10);
  const total = Number((prose + voice + agency + art + density).toFixed(1));
  return { prose, voice, agency, art, density, total };
}

const rows = [];
for (const chapter of CHAPTERS) {
  const m = measure(chapter);
  const s = score(chapter, m);
  rows.push({
    chapter: chapter.toUpperCase(),
    title: JSON.parse(fs.readFileSync(path.join(chapterDir, `${chapter}.json`), "utf8")).title,
    events: m.events,
    outcomes: m.outcomes,
    choices: m.choices,
    art_keys: m.artKeys.size,
    speakers: m.speakers.size,
    defects: {
      title_echo: m.titleEcho,
      third_person_in_dialogue: m.thirdPersonInDialogue,
      foreign_speaker: m.foreignSpeaker,
      outcome_repeats_action: m.outcomeRepeatsAction,
      duplicate_line_types: m.duplicateLines,
      worst_line_repeat: m.worstRepeat,
      excess_repeats_over_3: m.excessRepeats,
      choiceless_events: m.choicelessEvents,
    },
    score: s,
  });
}

const report = {
  schema: "donggrol.part1_chapter_quality.v1",
  generated_at: new Date().toISOString(),
  method: "agent playthrough on 2026-08-08 plus static measurement; each lens is 10 points, 50 per chapter",
  lenses: {
    prose: "제목 메아리와 3회를 넘는 문장 반복",
    voice: "화자 일관성과 대사 안 3인칭 서술",
    agency: "결과 화면의 행동 되풀이와 선택 없는 이벤트",
    art: "이벤트가 쓰는 고유 아트 종류",
    density: "이벤트당 서사 분량",
  },
  chapters: rows,
  part_average: Number((rows.reduce((a, r) => a + r.score.total, 0) / rows.length).toFixed(1)),
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.table(rows.map((r) => ({
  chapter: r.chapter, title: r.title, events: r.events,
  문장: r.score.prose, 화자: r.score.voice, 선택: r.score.agency, 연출: r.score.art, 밀도: r.score.density,
  총점: r.score.total,
})));
console.log(`\nPart 1 평균: ${report.part_average} / 50`);
console.log(`출력: ${path.relative(root, outputPath).replace(/\\/gu, "/")}`);
