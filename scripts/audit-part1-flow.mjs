import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const packPath = path.join(rootDir, "public", "runtime-content", "game-content-pack.json");
const outDir = path.join(rootDir, "output", "part1-flow-audit");
const outPath = path.join(outDir, "result.json");
const mdPath = path.join(outDir, "result.md");

const REQUIRED_CHAPTERS = ["CH01", "CH02", "CH03", "CH04", "CH05"];
const REQUIRED_REVIEW_EVENTS = [
  "EV_CH01_BRIEFING",
  "EV_CH01_BOSS_BROADCAST",
  "EV_CH02_BLACKMARKET",
  "EV_CH02_SLUICE_BOSS",
  "EV_CH03_SKYBRIDGE",
  "EV_CH03_BOSS_GARDEN",
  "EV_CH04_BOSS_PICKER",
  "EV_CH05_BOSS_LINES",
  "EV_CH05_EXTRACTION",
];

const pack = JSON.parse(await fs.readFile(packPath, "utf8"));
await fs.mkdir(outDir, { recursive: true });

const itemIds = new Set(Object.keys(pack.items ?? {}));
const enemyIds = new Set(Object.keys(pack.enemies ?? {}));
const chapters = REQUIRED_CHAPTERS.map((chapterId) => pack.chapters?.[chapterId]).filter(Boolean);
const issues = [];
const summaries = [];
const repeatedPreviewMap = new Map();
const repeatedLabelMap = new Map();

function addIssue(chapterId, eventId, severity, message) {
  issues.push({ chapterId, eventId, severity, message });
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function targetId(target = "") {
  return String(target).replace(/^(item|flag|stat|enemy|trust|node):/u, "");
}

function collectNextIds(choice) {
  const ids = [];
  if (choice.next_event_id) ids.push(choice.next_event_id);
  for (const effect of choice.effects ?? []) {
    if (effect.next_event_id) ids.push(effect.next_event_id);
    if (effect.target && String(effect.op ?? "").includes("event")) ids.push(targetId(effect.target));
  }
  return ids.filter(Boolean);
}

function checkChoiceSemantics(chapter, event, choice) {
  const label = normalizeText(choice.label);
  const preview = normalizeText(choice.preview);
  const chapterId = chapter.chapter_id;
  const eventId = event.event_id;

  if (!label) addIssue(chapterId, eventId, "error", `choice ${choice.choice_id} label is empty`);
  if (!preview) addIssue(chapterId, eventId, "error", `choice ${choice.choice_id} preview is empty`);
  if (label.length > 26) addIssue(chapterId, eventId, "warn", `choice ${choice.choice_id} label is too long: ${label}`);
  if (preview.length < 22) addIssue(chapterId, eventId, "warn", `choice ${choice.choice_id} preview is too short: ${preview}`);
  if (preview.includes("선택.") && preview.startsWith(`${event.title}에서`)) {
    addIssue(chapterId, eventId, "warn", `choice ${choice.choice_id} preview is mechanically templated`);
  }

  const labelKey = `${chapterId}:${eventId}:${label}`;
  const previewKey = `${chapterId}:${eventId}:${preview}`;
  repeatedLabelMap.set(labelKey, [...(repeatedLabelMap.get(labelKey) ?? []), choice.choice_id]);
  repeatedPreviewMap.set(previewKey, [...(repeatedPreviewMap.get(previewKey) ?? []), choice.choice_id]);

  for (const effect of choice.effects ?? []) {
    const op = String(effect.op ?? "");
    const target = String(effect.target ?? "");
    const id = targetId(target);
    if (op === "grant_item" && !itemIds.has(id)) {
      addIssue(chapterId, eventId, "error", `choice ${choice.choice_id} grants unknown item ${target}`);
    }
    if (op === "start_battle" && !enemyIds.has(id)) {
      addIssue(chapterId, eventId, "error", `choice ${choice.choice_id} starts unknown enemy/group ${target}`);
    }
  }
}

for (const chapter of chapters) {
  const chapterId = chapter.chapter_id;
  const events = chapter.events ?? [];
  const eventById = new Map(events.map((event) => [event.event_id, event]));
  const nodeIds = new Set((chapter.nodes ?? []).map((node) => node.node_id));
  const edgeMap = new Map();
  let choiceCount = 0;

  for (const event of events) {
    if (event.node_id && !nodeIds.has(event.node_id)) {
      addIssue(chapterId, event.event_id, "error", `event references unknown node ${event.node_id}`);
    }

    const nextIds = [];
    for (const choice of event.choices ?? []) {
      choiceCount += 1;
      checkChoiceSemantics(chapter, event, choice);
      for (const nextId of collectNextIds(choice)) {
        nextIds.push(nextId);
        if (!eventById.has(nextId) && !/^END_CH\d{2}$/u.test(nextId)) {
          addIssue(chapterId, event.event_id, "error", `choice ${choice.choice_id} points to unknown event ${nextId}`);
        }
      }
    }
    edgeMap.set(event.event_id, nextIds);
  }

  const startEvents = events.filter((event) => event.node_id === chapter.entry_node_id || /BRIEFING|BRIEF/u.test(event.event_id));
  const stack = [...new Set(startEvents.map((event) => event.event_id))];
  const reachable = new Set(stack);
  while (stack.length > 0) {
    const eventId = stack.pop();
    for (const nextId of edgeMap.get(eventId) ?? []) {
      if (!reachable.has(nextId)) {
        reachable.add(nextId);
        stack.push(nextId);
      }
    }
  }

  const unreachable = events.filter((event) => !reachable.has(event.event_id));
  const endingEvents = events.filter((event) => {
    const choices = event.choices ?? [];
    return choices.length === 0 || choices.some((choice) => (choice.effects ?? []).some((effect) => effect.op === "complete_chapter"));
  });

  summaries.push({
    chapterId,
    title: chapter.title,
    events: events.length,
    choices: choiceCount,
    reachableEvents: reachable.size,
    unreachableEvents: unreachable.length,
    endingEvents: endingEvents.map((event) => event.event_id),
  });
}

for (const [key, ids] of repeatedLabelMap.entries()) {
  if (ids.length > 1) {
    const [chapterId, eventId, label] = key.split(":");
    addIssue(chapterId, eventId, "warn", `duplicate choice label in same event: ${label}`);
  }
}

for (const [key, ids] of repeatedPreviewMap.entries()) {
  if (ids.length > 1) {
    const [chapterId, eventId] = key.split(":");
    addIssue(chapterId, eventId, "warn", `duplicate choice preview in same event: ${ids.join(", ")}`);
  }
}

const reviewEvents = REQUIRED_REVIEW_EVENTS.map((eventId) => {
  const chapter = chapters.find((candidate) => (candidate.events ?? []).some((event) => event.event_id === eventId));
  const event = chapter?.events?.find((candidate) => candidate.event_id === eventId);
  return {
    eventId,
    chapterId: chapter?.chapter_id ?? null,
    title: event?.title ?? null,
    eventType: event?.event_type ?? null,
    choices: (event?.choices ?? []).map((choice) => ({
      label: choice.label,
      preview: choice.preview,
      next_event_id: choice.next_event_id ?? null,
    })),
  };
});

const result = {
  generatedAt: new Date().toISOString(),
  chapters: summaries,
  reviewEvents,
  issueCount: issues.length,
  errors: issues.filter((issue) => issue.severity === "error"),
  warnings: issues.filter((issue) => issue.severity === "warn"),
};

const md = [
  "# Part 1 Flow Audit",
  "",
  `- issueCount: ${result.issueCount}`,
  `- errors: ${result.errors.length}`,
  `- warnings: ${result.warnings.length}`,
  "",
  "## Chapter Summary",
  "",
  "| chapter | events | choices | reachable | unreachable | endings |",
  "|---|---:|---:|---:|---:|---|",
  ...summaries.map((chapter) => `| ${chapter.chapterId} | ${chapter.events} | ${chapter.choices} | ${chapter.reachableEvents} | ${chapter.unreachableEvents} | ${chapter.endingEvents.join(", ")} |`),
  "",
  "## Review Events",
  "",
  ...reviewEvents.flatMap((event) => [
    `### ${event.eventId}`,
    "",
    `- chapter: ${event.chapterId ?? "missing"}`,
    `- title: ${event.title ?? "missing"}`,
    `- type: ${event.eventType ?? "missing"}`,
    "",
    ...event.choices.map((choice) => `- ${choice.label}: ${choice.preview}`),
    "",
  ]),
  "## Issues",
  "",
  ...(issues.length
    ? issues.map((issue) => `- [${issue.severity}] ${issue.chapterId} ${issue.eventId}: ${issue.message}`)
    : ["- none"]),
  "",
].join("\n");

await fs.writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
await fs.writeFile(mdPath, md, "utf8");

console.log(JSON.stringify({
  issueCount: result.issueCount,
  errors: result.errors.length,
  warnings: result.warnings.length,
  chapters: summaries.map(({ chapterId, events, choices, unreachableEvents }) => ({ chapterId, events, choices, unreachableEvents })),
  output: path.relative(rootDir, outPath),
}, null, 2));
