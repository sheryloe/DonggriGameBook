import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CHAPTER_DIR = path.join(ROOT, "codex_webgame_pack", "data", "chapters");
const UI_DIR = path.join(ROOT, "ui");
const DOCS_WORLD_DIR = path.join(ROOT, "docs", "world");
const PUBLIC_DIR = path.join(ROOT, "public");

const STORY_CONTRACT_PATH = path.join(DOCS_WORLD_DIR, "part2-4-story-contract-v2.md");
const ENDING_MATRIX_PATH = path.join(DOCS_WORLD_DIR, "part2-4-ending-matrix-v1.md");
const PLAYTIME_BUDGET_PATH = path.join(DOCS_WORLD_DIR, "part2-4-playtime-budget-v1.md");

const PARTS = {
  P2: {
    title: "Part 2 Story Pipeline",
    summary: "Convoy pressure, forged clearance, and witness routing.",
    chapters: ["CH06", "CH07", "CH08", "CH09", "CH10"],
    axes: ["official_lane", "broker_lane", "witness_chain", "capacity_ethics", "harbor_force"],
    palette: {
      bg: "#151110",
      panel: "#241714",
      panel2: "#1c1312",
      line: "#6b3024",
      muted: "#c8b7af"
    }
  },
  P3: {
    title: "Part 3 Story Pipeline",
    summary: "Certification, public evidence, medical reserve, and relay power.",
    chapters: ["CH11", "CH12", "CH13", "CH14", "CH15"],
    axes: ["p3.route_access", "p3.public_evidence", "p3.medical_reserve", "p3.power_margin", "p3.sacrifice_load"],
    palette: {
      bg: "#10171d",
      panel: "#1c2830",
      panel2: "#162028",
      line: "#47606d",
      muted: "#c5d1d8"
    }
  },
  P4: {
    title: "Part 4 Story Pipeline",
    summary: "Judgement boards, public support, broadcast readiness, and gate doctrine.",
    chapters: ["CH16", "CH17", "CH18", "CH19", "CH20"],
    axes: ["order_score", "witness_score", "solidarity_score", "public_support", "broadcast_ready", "capacity_pressure"],
    palette: {
      bg: "#0f1417",
      panel: "#1a2328",
      panel2: "#141c20",
      line: "#4e6a73",
      muted: "#c5d1d6"
    }
  }
};

const CHAPTER_TARGETS = {
  CH06: 5,
  CH07: 6,
  CH08: 6,
  CH09: 6,
  CH10: 7,
  CH11: 5,
  CH12: 6,
  CH13: 7,
  CH14: 5,
  CH15: 7,
  CH16: 6,
  CH17: 7,
  CH18: 10,
  CH19: 8,
  CH20: 9
};

const CLIMAX_CHAPTERS = new Set(["CH10", "CH15", "CH20"]);

const LOCKED_RULES = [
  ["General density", "At least 8 events, 12 choices, 2 optional field actions, 1 result event"],
  ["Climax density", "CH10, CH15, CH20 require at least 10 events, 15 choices, and an explicit ending gate"],
  ["Side structure", "No forced SIDE_A -> SIDE_B -> BOSS chain; field action budget remains capped at 2"],
  ["Boss closure", "Boss victory must close through EV_CH##_RESULT or END_CH##_X without self-loop"],
  ["Failure routing", "No blind bounce to the map; fail or setback events stay diegetic"],
  ["Replay rewards", "P2 and P3 expand ending spread, P4 expands epilogue variation within 3 endings"],
  ["Repeatable farming", "Only designated scavenging events loop, soft cap remains after the second pass"]
];

const ENDING_METADATA = {
  CH10: {
    chapter: "CH10",
    items: [
      { choiceId: "ch10_ending_a", pills: ["route.current=official_lane", "flag:ch10_ending_a"] },
      { choiceId: "ch10_ending_b", pills: ["route.current=witness_chain", "flag:ch10_ending_b"] },
      { choiceId: "ch10_ending_c", pills: ["route.current=broker_lane", "flag:ch10_ending_c"] },
      { choiceId: "ch10_ending_d", pills: ["flag:ch10_manifest_done", "flag:ch10_smoke_done"] },
      { choiceId: "ch10_ending_e", pills: ["flag:ch10_ending_e"] }
    ]
  },
  CH15: {
    chapter: "CH15",
    items: [
      { choiceId: "ch15_ending_a", pills: ["route.current=certified_passage", "flag:ch15_ending_a"] },
      { choiceId: "ch15_ending_b", pills: ["route.current=public_breach", "flag:ch15_ending_b"] },
      { choiceId: "ch15_ending_c", pills: ["route.current=cold_mercy", "flag:ch15_ending_c"] },
      { choiceId: "ch15_ending_d", pills: ["flag:ch15_action_a_done", "flag:ch15_action_b_done"] },
      { choiceId: "ch15_ending_e", pills: ["flag:ch15_ending_e"] }
    ]
  },
  CH20: {
    chapter: "CH20",
    items: [
      { choiceId: "ch20_ending_a", pills: ["route.current=order_score", "flag:ch20_ending_a"] },
      { choiceId: "ch20_ending_b", pills: ["route.current=solidarity_score", "flag:ch20_ending_b"] },
      { choiceId: "ch20_ending_c", pills: ["route.current=witness_score", "flag:ch20_ending_c"] }
    ]
  }
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  fs.writeFileSync(filePath, `${value.trim()}\n`, "utf8");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function deepReplaceExact(target, from, to) {
  if (Array.isArray(target)) {
    for (let index = 0; index < target.length; index += 1) {
      target[index] = deepReplaceExact(target[index], from, to);
    }
    return target;
  }
  if (target && typeof target === "object") {
    for (const key of Object.keys(target)) {
      target[key] = deepReplaceExact(target[key], from, to);
    }
    return target;
  }
  return target === from ? to : target;
}

function getPendingFlag(choice) {
  const effect = (choice.effects || []).find(
    (entry) => entry.op === "set_flag" && typeof entry.target === "string" && entry.target.startsWith("flag:") && entry.target.endsWith("_pending")
  );
  return effect?.target ?? null;
}

function includesFlag(list, flag) {
  return Array.isArray(list) && list.includes(flag);
}

function inferActionEventId(chapter, choice) {
  const pendingFlag = getPendingFlag(choice);
  if (!pendingFlag) {
    return null;
  }

  const match = chapter.events.find((event) => {
    if (event.event_id === `EV_${chapter.chapter_id}_FIELD_HUB`) {
      return false;
    }
    return includesFlag(event.conditions, pendingFlag) || includesFlag(event.requires, pendingFlag);
  });

  return match?.event_id ?? null;
}

function normalizeFieldActions(chapter) {
  const hubId = `EV_${chapter.chapter_id}_FIELD_HUB`;
  const hub = chapter.events.find((event) => event.event_id === hubId);
  if (!hub) {
    return [`missing field hub ${hubId}`];
  }

  const warnings = [];
  for (const choice of hub.choices || []) {
    const match = /^ch\d+_field_([ab])$/.exec(choice.choice_id);
    if (!match) {
      continue;
    }

    const suffix = match[1].toUpperCase();
    const expectedId = `EV_${chapter.chapter_id}_ACTION_${suffix}`;
    const actualId = inferActionEventId(chapter, choice);

    if (!actualId) {
      warnings.push(`no pending-flag action target for ${chapter.chapter_id}:${choice.choice_id}`);
      continue;
    }

    if (actualId !== expectedId) {
      deepReplaceExact(chapter, actualId, expectedId);
    }

    choice.next_event_id = expectedId;
  }

  return warnings;
}

function countChoices(chapter) {
  return (chapter.events || []).reduce((total, event) => total + (event.choices?.length || 0), 0);
}

function validateChapter(chapter) {
  const warnings = [];
  const choiceCount = countChoices(chapter);
  if ((chapter.events || []).length < 8) {
    warnings.push(`${chapter.chapter_id}: event count below 8`);
  }
  if (choiceCount < 12) {
    warnings.push(`${chapter.chapter_id}: choice count below 12`);
  }
  if (CLIMAX_CHAPTERS.has(chapter.chapter_id) && choiceCount < 15) {
    warnings.push(`${chapter.chapter_id}: climax choice count below 15`);
  }
  return warnings;
}

function buildPipelineHtml(partId, chapters) {
  const part = PARTS[partId];
  const endings = ENDING_METADATA[part.chapters.at(-1)]?.items ?? [];
  const accent = part.palette;
  const chapterCards = chapters
    .map((chapter) => {
      const nodes = (chapter.nodes || [])
        .map((node) => {
          const eventList = (node.event_ids || [])
            .map((eventId) => `<li>${escapeHtml(eventId)}</li>`)
            .join("");
          return `<div class="node"><strong>${escapeHtml(node.name)}</strong><div class="small">${escapeHtml(node.node_type)}</div><ul>${eventList}</ul></div>`;
        })
        .join("");

      return `<article class="chapter"><div class="row"><h2>${escapeHtml(chapter.chapter_id)} - ${escapeHtml(
        chapter.title
      )}</h2><div class="meta">${chapter.estimated_first_run_minutes}m | ${chapter.events.length} events | ${countChoices(chapter)} choices</div></div><div class="pills">${part.axes
        .map((axis) => `<span class="pill">${escapeHtml(axis)}</span>`)
        .join("")}</div><div class="graph">${nodes}</div></article>`;
    })
    .join("");

  const endingCards = endings
    .map((entry) => {
      const chapter = chapters.at(-1);
      const choice = chapter.events
        .find((event) => event.event_id === `EV_${chapter.chapter_id}_RESULT`)
        ?.choices?.find((item) => item.choice_id === entry.choiceId);
      if (!choice) {
        return "";
      }
      return `<article class="ending"><div class="small">${escapeHtml(chapter.chapter_id)}</div><h3>${escapeHtml(
        choice.label
      )}</h3><p>${escapeHtml(choice.preview || "")}</p><div class="pills">${entry.pills
        .map((pill) => `<span class="pill">${escapeHtml(pill)}</span>`)
        .join("")}</div></article>`;
    })
    .join("");

  const demoCards = chapters
    .map((chapter) => {
      const demoRoute = Array.isArray(chapter.demo_route) ? chapter.demo_route : [];
      return `<article class="ending"><div class="small">${escapeHtml(chapter.chapter_id)}</div><h3>Demo Route</h3><div class="pills">${demoRoute
        .map((eventId) => `<span class="pill">${escapeHtml(eventId)}</span>`)
        .join("")}</div></article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(part.title)}</title>
  <style>
    :root { --bg:${accent.bg}; --panel:${accent.panel}; --panel2:${accent.panel2}; --line:${accent.line}; --muted:${accent.muted}; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:"Segoe UI",sans-serif; background:linear-gradient(180deg,#0b0f12,var(--bg)); color:#eef3f6; }
    header { padding:28px 24px 16px; border-bottom:1px solid var(--line); }
    main { display:grid; grid-template-columns:1.3fr .9fr; gap:16px; padding:16px; }
    .panel { background:rgba(255,255,255,.03); border:1px solid var(--line); border-radius:18px; padding:16px; }
    .chapter,.ending { background:var(--panel); border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px; margin-bottom:12px; }
    .graph { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; margin-top:12px; }
    .node { background:var(--panel2); border:1px solid rgba(255,255,255,.08); border-radius:12px; padding:10px; }
    .row { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
    .pills { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
    .pill { display:inline-flex; padding:6px 10px; border-radius:999px; border:1px solid var(--line); color:var(--muted); font-size:12px; }
    .meta,.small,p { color:var(--muted); }
    ul { margin:8px 0 0 16px; padding:0; color:var(--muted); font-size:12px; }
    h1,h2,h3 { margin:0; }
    h3 { margin-bottom:8px; }
    @media (max-width:980px) { main { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(part.title)}</h1>
    <p>${escapeHtml(part.summary)}</p>
    <div class="pills">${part.axes.map((axis) => `<span class="pill">${escapeHtml(axis)}</span>`).join("")}</div>
  </header>
  <main>
    <section class="panel">
      <h2>Chapter Graph</h2>
      ${chapterCards}
    </section>
    <section class="panel">
      <h2>Ending Matrix</h2>
      ${endingCards}
      <h2>Demo Route</h2>
      ${demoCards}
    </section>
  </main>
</body>
</html>`;
}

function buildStoryContractMarkdown() {
  const rows = [
    "| Part | Target time | Chapter budget | Endings | Core axes |",
    "| --- | ---: | --- | --- | --- |"
  ];

  for (const [partId, part] of Object.entries(PARTS)) {
    const totalMinutes = part.chapters.reduce((sum, chapterId) => sum + CHAPTER_TARGETS[chapterId], 0);
    const chapterBudget = part.chapters.map((chapterId) => `${chapterId} ${CHAPTER_TARGETS[chapterId]}m`).join(" / ");
    const endingNames = (ENDING_METADATA[part.chapters.at(-1)]?.items || [])
      .map((item) => item.choiceId.replace(/^ch\d+_/, "").toUpperCase())
      .join(", ");
    rows.push(`| ${partId} | ${totalMinutes}m | ${chapterBudget} | ${endingNames} | ${part.axes.join(", ")} |`);
  }

  const ruleRows = [
    "| Rule | Locked value |",
    "| --- | --- |",
    ...LOCKED_RULES.map(([rule, value]) => `| ${rule} | ${value} |`)
  ];

  return `
# Part 2-4 Story Contract v2

## Locked content contract
${rows.join("\n")}

## Locked rules
${ruleRows.join("\n")}

## Scope
- Part 1 remains the regression baseline only.
- Part 2, Part 3, and Part 4 keep the expanded branching already authored in chapter JSON and UI flow data.
- Field action budget stays capped at 2 and only the scavenging event remains repeatable.
- Climax chapters keep explicit ending gates: CH10 has 5 endings, CH15 has 5 endings, CH20 has 3 endings.
`.trim();
}

function buildEndingMatrixMarkdown(chaptersById) {
  const lines = ["# Part 2-4 Ending Matrix v1", ""];
  for (const part of Object.values(PARTS)) {
    const endingChapterId = part.chapters.at(-1);
    const chapter = chaptersById.get(endingChapterId);
    const resultEvent = chapter.events.find((event) => event.event_id === `EV_${chapter.chapter_id}_RESULT`);
    lines.push(`## ${part.title.replace(" Pipeline", "")}`);
    for (const metadata of ENDING_METADATA[endingChapterId]?.items || []) {
      const choice = resultEvent?.choices?.find((item) => item.choice_id === metadata.choiceId);
      if (!choice) {
        continue;
      }
      lines.push(`- ${choice.label}: ${choice.preview}`);
      lines.push(`  - Gates: ${metadata.pills.join(", ")}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function buildPlaytimeBudgetMarkdown() {
  const lines = [
    "# Part 2-4 Playtime Budget v1",
    "",
    "| Chapter | Target minutes | Notes |",
    "| --- | ---: | --- |"
  ];

  for (const [partId, part] of Object.entries(PARTS)) {
    for (const chapterId of part.chapters) {
      const note = CLIMAX_CHAPTERS.has(chapterId)
        ? "Climax chapter with ending gate"
        : chapterId === "CH18"
          ? "Judgement hub chapter with hearing + vote"
          : "Standard chapter budget";
      lines.push(`| ${chapterId} (${partId}) | ${CHAPTER_TARGETS[chapterId]} | ${note} |`);
    }
  }

  lines.push("");
  lines.push("## Tolerance");
  lines.push("- Part 2 and Part 3 target a first-run total of 30 minutes within +/- 3 minutes.");
  lines.push("- Part 4 targets a first-run total of 40 minutes within +/- 4 minutes.");
  return lines.join("\n");
}

function normalizeChapterUi(ui, chapter) {
  ui.notes = Array.from(new Set([...(ui.notes || []), `part:${chapter.ui_profile?.part_id || chapter.part_id || "P?"}`]));
  return ui;
}

function ensureChapterTargets(chapter) {
  const targetMinutes = CHAPTER_TARGETS[chapter.chapter_id];
  if (targetMinutes) {
    chapter.estimated_first_run_minutes = targetMinutes;
  }
}

function main() {
  const warnings = [];
  const chaptersByPart = new Map();
  const chaptersById = new Map();

  for (const [partId, part] of Object.entries(PARTS)) {
    const normalized = [];
    for (const chapterId of part.chapters) {
      const chapterFile = path.join(CHAPTER_DIR, `${chapterId.toLowerCase()}.json`);
      const uiFile = path.join(UI_DIR, `${chapterId.toLowerCase()}.ui_flow.json`);
      const chapter = readJson(chapterFile);
      const ui = readJson(uiFile);

      ensureChapterTargets(chapter);
      warnings.push(...normalizeFieldActions(chapter));
      warnings.push(...validateChapter(chapter));
      normalizeChapterUi(ui, chapter);

      writeJson(chapterFile, chapter);
      writeJson(uiFile, ui);

      normalized.push(chapter);
      chaptersById.set(chapterId, chapter);
    }
    chaptersByPart.set(partId, normalized);
  }

  writeText(STORY_CONTRACT_PATH, buildStoryContractMarkdown());
  writeText(ENDING_MATRIX_PATH, buildEndingMatrixMarkdown(chaptersById));
  writeText(PLAYTIME_BUDGET_PATH, buildPlaytimeBudgetMarkdown());

  writeText(path.join(PUBLIC_DIR, "part2-story-pipeline.html"), buildPipelineHtml("P2", chaptersByPart.get("P2")));
  writeText(path.join(PUBLIC_DIR, "part3-story-pipeline.html"), buildPipelineHtml("P3", chaptersByPart.get("P3")));
  writeText(path.join(PUBLIC_DIR, "part4-story-pipeline.html"), buildPipelineHtml("P4", chaptersByPart.get("P4")));

  const summary = [];
  for (const [partId, chapters] of chaptersByPart.entries()) {
    const totalMinutes = chapters.reduce((sum, chapter) => sum + (chapter.estimated_first_run_minutes || 0), 0);
    summary.push(`${partId}: ${chapters.length} chapters, ${totalMinutes}m budget`);
  }

  console.log("normalized Part 2-4 content");
  for (const line of summary) {
    console.log(`- ${line}`);
  }
  if (warnings.length > 0) {
    console.log("warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }
}

main();
