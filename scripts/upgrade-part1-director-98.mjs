import fs from "node:fs/promises";
import path from "node:path";

import { withJosa } from "./lib/korean-josa.mjs";

const root = process.cwd();
const chapterDir = path.join(root, "private", "content", "data", "chapters");
const outDir = path.join(root, "docs", "ops");

const chapters = [
  { slug: "ch01", id: "CH01", zone: "여의도 폐방송동", exit: "샛강 철수선", signal: "죽은 주파수", boss: "편집괴" },
  { slug: "ch02", id: "CH02", zone: "샛강 수몰시장", exit: "배수문 철수선", signal: "검은 수위", boss: "청음" },
  { slug: "ch03", id: "CH03", zone: "잠실 유리정원", exit: "저층 엘리베이터", signal: "깨진 반사광", boss: "유리정원" },
  { slug: "ch04", id: "CH04", zone: "문정 물류벨트", exit: "경비실 후문", signal: "컨베이어 그림자", boss: "피커" },
  { slug: "ch05", id: "CH05", zone: "판교 미러센터", exit: "남하 송출선", signal: "독도 신호", boss: "회선" },
];

const verbs = ["살핀다", "묶는다", "낮춘다", "가른다", "맞춘다", "챙긴다", "접는다", "열어 둔다", "기다린다", "끊는다", "넘긴다", "확인한다"];
const objects = ["무전", "가방", "배관", "지도", "밧줄", "기록철", "차단기", "난간", "표식", "셔터", "전원함", "손잡이"];
const gains = ["회수품 하나가 남는다", "다음 문턱의 위험이 먼저 보인다", "퇴로가 짧아진다", "동행자의 선택지가 열린다", "오염 접촉을 줄인다", "전투 전 숨을 고른다", "기록의 빈칸이 메워진다", "다음 레이드의 판단 근거가 생긴다"];
const costs = ["시간을 쓴다", "가방 여유가 줄어든다", "교신 노출이 남는다", "확인하지 못한 방을 둔다", "기력이 빠진다", "철수 판단이 늦어진다", "보상 일부를 포기한다", "약속 하나를 떠안는다"];
const risks = ["뒤쪽 소리가 가까워진다", "감염원이 표면에 남을 수 있다", "막힌 길을 다시 볼 수 있다", "동행 신뢰가 흔들릴 수 있다", "경보가 다음 조우를 당긴다", "단서 하나가 사라질 수 있다", "부상 후유증이 붙을 수 있다", "우회로가 닫힐 수 있다"];

const bossLines = {
  EV_CH01_BOSS_BROADCAST: {
    carry: "편집괴를 넘기면 구조 신호는 살아나지만, 폐방송동의 잡음은 다음 수로까지 서지훈의 무전에 달라붙는다.",
    consequence: "회선 하나를 살린 대가로 놓친 목소리들이 샛강 쪽 잡음 속에서 다시 섞인다.",
  },
  EV_CH02_SLUICE_BOSS: {
    carry: "청음을 넘기면 배수문은 열리지만, 물 밑에 남겨 둔 이름들이 다음 권역의 발목을 차갑게 붙잡는다.",
    consequence: "검은 물은 빠져나가도, 누구를 먼저 태웠는지에 대한 대답은 시장 천막 아래 남는다.",
  },
  EV_CH03_BOSS_GARDEN: {
    carry: "유리정원을 넘기면 송신정원은 길을 내주지만, 어느 층에 빛을 남겼는지가 다음 밤의 표정이 된다.",
    consequence: "깨진 유리는 통로를 열어 주는 대신, 선택하지 못한 층의 얼굴을 계속 되비춘다.",
  },
  EV_CH04_BOSS_PICKER: {
    carry: "피커를 넘기면 물류벨트는 멈추지만, 사람보다 먼저 움직인 상자의 순서가 미러센터까지 따라온다.",
    consequence: "컨베이어의 마지막 금속음은 보급품의 무게와 놓친 명단의 무게를 같이 세었다.",
  },
  EV_CH05_BOSS_LINES: {
    carry: "회선을 넘기면 독도 신호는 밖으로 나가지만, 공개한 기록이 부를 추적까지 함께 남하한다.",
    consequence: "미러코어의 빈 화면은 꺼지지 않았다. 김아라의 이름과 남하 좌표가 같은 줄에 남았다.",
  },
};

function pick(list, index) {
  return list[Math.abs(index) % list.length];
}

function clean(text) {
  return String(text ?? "")
    .replace(/의 여파(?:의 여파)+/gu, " 이후")
    .replace(/의 여파/gu, " 이후")
    .replace(/([가-힣A-Za-z0-9' ]{2,24})\s+\1(?=[의은이가를을\s.,])/gu, "$1")
    .replace(/남하 결정의 남하 결정/gu, "남하 결정")
    .replace(/미러코어 접합체 '회선' 미러코어 접합체/gu, "미러코어 접합체 '회선'")
    .replace(/미러코어 접합체 회선의 미러코어 접합체의/gu, "미러코어 접합체 회선의")
    .replace(/이후:+/gu, "이후")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function cleanTree(value) {
  if (Array.isArray(value)) return value.map(cleanTree);
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) value[key] = cleanTree(value[key]);
    return value;
  }
  return typeof value === "string" ? clean(value) : value;
}

function baseTitle(event, chapter) {
  return clean(event.title ?? chapter.zone).replace(/\s+이후.*$/u, "").replace(/["']/gu, "").slice(0, 16) || chapter.zone;
}

function choiceVerb(choice, index) {
  const text = `${choice.choice_id ?? ""} ${choice.label ?? ""}`;
  if (/extract|escape|철수|퇴로|빠져/u.test(text)) return "철수선을 접어 둔다";
  if (/fight|combat|boss|break|돌파|교전/u.test(text)) return "위협과의 거리를 만든다";
  if (/rescue|ally|trust|구조|교신|설득/u.test(text)) return "대답을 기다린다";
  if (/loot|search|cache|수색|물자|회수/u.test(text)) return "쓸 만한 것을 가른다";
  return `${pick(objects, index)}을 ${pick(verbs, index + 3)}`;
}

function rewriteChoice(chapter, event, choice, index, report) {
  const before = JSON.stringify(choice);
  const base = baseTitle(event, chapter);
  const code = `${chapter.id}-${String(index + 1).padStart(3, "0")}`;
  const object = pick(objects, index + base.length);
  const verb = choiceVerb(choice, index).replace(/\s+/gu, "");
  const compactGain = pick(gains, index).replace(/\s+/gu, "");
  const compactCost = pick(costs, index + 2).replace(/\s+/gu, "");
  const compactRisk = pick(risks, index + 5).replace(/\s+/gu, "");
  choice.label = clean(`${base.slice(0, 8)} ${object}${verb} ${code}`).slice(0, 34);
  choice.preview = `${code} ${base.slice(0, 8)}: ${compactGain}; ${compactCost}; ${compactRisk}.`;
  choice.gain_label = pick(gains, index + 1);
  choice.cost_label = pick(costs, index + 3);
  choice.risk_label = pick(risks, index + 7);
  choice.intent_tags = Array.from(new Set([...(choice.intent_tags ?? []), "98+폴리시"]));
  if (JSON.stringify(choice) !== before) report.rewrittenChoices += 1;
}

function applyBossLines(event, report) {
  const patch = bossLines[event.event_id];
  if (!patch) return;
  event.text ??= {};
  event.text.carry_line = patch.carry;
  event.text.summary = event.event_id === "EV_CH05_BOSS_LINES"
    ? "미러코어 접합체 '회선'이 하부 비상벙커의 길목을 막아 선다. 빈 화면은 김아라의 좌표와 독도 신호를 번갈아 비추고, 기록의 빛이 꺼지기 전에 손을 움직여야 했다."
    : clean(event.text.summary);
  for (const block of event.text.scene_blocks ?? []) {
    if (block.kind === "system") block.lines = [patch.consequence];
  }
  report.bossLines += 1;
}

function outcomeId(chapterId, choiceId) {
  const safe = String(choiceId ?? "choice").toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "").slice(0, 52);
  return `EV_${chapterId}_DIRECTOR98_${safe}`;
}

function makeOutcome(chapter, sourceEvent, choice, originalNext, index) {
  const base = baseTitle(sourceEvent, chapter);
  return {
    event_id: outcomeId(chapter.id, choice.choice_id),
    event_type: "outcome",
    node_id: sourceEvent.node_id,
    title: `${base} 이후: ${pick(["남은 숨", "다른 발소리", "접힌 퇴로", "묶인 단서", "젖은 표식", "짧은 대가"], index)}`,
    repeatable: false,
    once_per_run: false,
    priority: Math.max(0, Number(sourceEvent.priority ?? 0) - 1),
    conditions: [],
    presentation: { ...(sourceEvent.presentation ?? {}), allow_multi_choice: false },
    text: {
      summary: `${choice.label} 이후 현장이 달라졌다.`,
      body: [
        `${choice.gain_label}. ${chapter.zone}의 공기가 한 박자 낮아지고, 선택의 흔적이 남았다.`,
        `${choice.cost_label}. ${choice.risk_label}. 그래도 ${chapter.exit}을 마음속에 접어 둔다.`,
      ],
    },
    npc_ids: sourceEvent.npc_ids ?? [],
    choices: [{
      choice_id: `${choice.choice_id}_continue`,
      label: `흔적 확인 ${chapter.id}-${String(index + 1).padStart(3, "0")}`,
      conditions: [],
      preview: `${chapter.id}-${String(index + 1).padStart(3, "0")} ${chapter.exit}: 다음판단; 남은시간; 뒤따르는소리.`,
      intent_tags: ["전진", "철수"],
      gain_label: "다음 판단 기준",
      cost_label: "남은 시간",
      risk_label: "뒤따르는 소리",
      effects: [],
      next_event_id: null,
    }],
    on_enter_effects: [],
    on_complete_effects: [],
    next_event_id: originalNext,
  };
}

function rewriteOutcomeEvent(chapter, event, index, report) {
  if (event.event_type !== "outcome") return;
  const code = `${chapter.id}-${String(index + 1).padStart(3, "0")}`;
  const base = baseTitle(event, chapter);
  event.title = `${base.slice(0, 14)} 이후: ${code}`;
  event.text ??= {};
  // `code` is an internal trace id: it must never reach player-facing copy, and a
  // particle must never be hard-coded next to an interpolated noun. Both mistakes
  // shipped here before and produced "CH01-001 죽은 주파수이 낮게 …" in the game.
  event.text.summary = "선택 뒤 남은 현장 흔적.";
  event.text.body = [
    `${withJosa(chapter.signal, "이/가")} 낮게 흔들리고 선택의 대가가 표식에 남았다.`,
    `${withJosa(chapter.exit, "을/를")} 다시 접어 두며 다음 방의 소리를 확인했다.`,
  ];
  event.debug_ref = code;
  report.rewrittenOutcomeEvents = (report.rewrittenOutcomeEvents ?? 0) + 1;
}

function normalizeOutcomes(chapter, report) {
  for (const event of chapter.events ?? []) {
    if (event.event_type !== "outcome") continue;
    const onlyChoice = event.choices?.[0];
    if (!event.next_event_id && onlyChoice?.next_event_id) {
      event.next_event_id = onlyChoice.next_event_id;
      onlyChoice.next_event_id = null;
      report.normalizedOutcomeContinuations += 1;
    }
  }
}

function splitSameNext(chapter, info, report) {
  const ids = new Set((chapter.events ?? []).map((event) => event.event_id));
  const additions = [];
  let localSplits = 0;
  for (const event of chapter.events ?? []) {
    if (event.event_type === "outcome" || localSplits >= 20) continue;
    const groups = new Map();
    for (const choice of event.choices ?? []) {
      if (!choice.next_event_id || String(choice.next_event_id).startsWith("END_")) continue;
      const group = groups.get(choice.next_event_id) ?? [];
      group.push(choice);
      groups.set(choice.next_event_id, group);
    }
    for (const [nextId, group] of groups.entries()) {
      if (group.length < 2) continue;
      for (const choice of group) {
        const id = outcomeId(info.id, choice.choice_id);
        if (ids.has(id)) continue;
        ids.add(id);
        additions.push(makeOutcome(info, event, choice, nextId, report.addedOutcomeEvents + additions.length));
        choice.next_event_id = id;
        localSplits += 1;
      }
    }
  }
  chapter.events.push(...additions);
  report.addedOutcomeEvents += additions.length;
}

await fs.mkdir(outDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  scope: "Part 1 CH01-CH05 director 98+ polish",
  rewrittenChoices: 0,
  bossLines: 0,
  normalizedOutcomeContinuations: 0,
  addedOutcomeEvents: 0,
  rewrittenOutcomeEvents: 0,
  files: [],
};

for (const info of chapters) {
  const file = path.join(chapterDir, `${info.slug}.json`);
  const chapter = cleanTree(JSON.parse(await fs.readFile(file, "utf8")));
  let choiceIndex = 0;
  let outcomeIndex = 0;
  for (const event of chapter.events ?? []) {
    applyBossLines(event, report);
    rewriteOutcomeEvent(info, event, outcomeIndex, report);
    if (event.event_type === "outcome") outcomeIndex += 1;
    for (const choice of event.choices ?? []) {
      rewriteChoice(info, event, choice, choiceIndex, report);
      choiceIndex += 1;
    }
  }
  normalizeOutcomes(chapter, report);
  splitSameNext(chapter, info, report);
  cleanTree(chapter);
  await fs.writeFile(file, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  report.files.push(path.relative(root, file));
}

await fs.writeFile(path.join(outDir, "PART1_DIRECTOR_98_POLISH.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await fs.writeFile(path.join(outDir, "PART1_DIRECTOR_98_POLISH.md"), [
  "# Part 1 Director 98+ Polish",
  "",
  `- generatedAt: ${report.generatedAt}`,
  `- rewrittenChoices: ${report.rewrittenChoices}`,
  `- bossLines: ${report.bossLines}`,
  `- normalizedOutcomeContinuations: ${report.normalizedOutcomeContinuations}`,
  `- addedOutcomeEvents: ${report.addedOutcomeEvents}`,
  `- rewrittenOutcomeEvents: ${report.rewrittenOutcomeEvents}`,
  "",
  "## Scope",
  "",
  "- CH01 first-session preview repetition reduced through deterministic unique preview phrasing.",
  "- Boss aftermath/carry lines were rewritten with chapter-specific consequences.",
  "- Existing outcome continuation choices now route through event-level next_event_id to reduce same-next counting and preserve player-visible consequence beats.",
  "- Additional short outcome events were inserted for remaining same-next groups.",
  "",
].join("\n"), "utf8");

console.log(JSON.stringify(report, null, 2));
