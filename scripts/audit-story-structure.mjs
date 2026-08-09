#!/usr/bin/env node
/**
 * Structural audit of the whole 20-chapter arc: story shape, NPC deployment,
 * quest wiring, progression mechanics, and cross-chapter continuity.
 *
 * The per-chapter quality audit already scores CH01-CH05 on writing. This one
 * asks a different question: does the game hold together as a game across all
 * four parts? Nothing here reads prose quality — it reads structure, so a part
 * that was authored later and thinner shows up as numbers rather than as a
 * vague sense that the back half is weaker.
 *
 * Usage:
 *   node scripts/audit-story-structure.mjs            # summary to stdout
 *   node scripts/audit-story-structure.mjs --json     # full report as JSON
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const NPC_REGISTRY = join(ROOT, "private", "content", "data", "npc.registry.json");
const REPORT_PATH = join(ROOT, "docs", "ops", "STORY_STRUCTURE_AUDIT.json");

/** CH01-CH05 is P1, CH06-CH10 is P2, and so on. */
const partOf = (n) => `P${Math.floor((n - 1) / 5) + 1}`;

function loadChapters() {
  const chapters = [];
  for (let n = 1; n <= 20; n += 1) {
    const id = `ch${String(n).padStart(2, "0")}`;
    const path = join(CHAPTER_DIR, `${id}.json`);
    if (!existsSync(path)) continue;
    chapters.push({ n, part: partOf(n), data: JSON.parse(readFileSync(path, "utf8")) });
  }
  return chapters;
}

function loadNpcNames() {
  if (!existsSync(NPC_REGISTRY)) return new Map();
  const raw = JSON.parse(readFileSync(NPC_REGISTRY, "utf8"));
  const list = Array.isArray(raw) ? raw : raw.npcs ?? Object.values(raw);
  return new Map(list.map((npc) => [npc.npc_id, npc]));
}

/** Every line of player-facing prose in an event, flattened. */
function eventProse(ev) {
  const out = [];
  const t = ev.text ?? {};
  if (t.summary) out.push(t.summary);
  if (t.carry_line) out.push(t.carry_line);
  for (const line of t.body ?? []) out.push(line);
  for (const block of t.scene_blocks ?? []) for (const line of block.lines ?? []) out.push(line);
  for (const choice of ev.choices ?? []) {
    if (choice.label) out.push(choice.label);
    if (choice.preview) out.push(choice.preview);
  }
  for (const outcome of ev.outcomes ?? []) {
    for (const line of outcome.text?.body ?? []) out.push(line);
  }
  return out;
}

function auditChapter(ch) {
  const d = ch.data;
  const events = d.events ?? [];
  const nodes = d.nodes ?? [];
  const eventIds = new Set(events.map((e) => e.event_id));
  const nodeIds = new Set(nodes.map((nd) => nd.node_id));

  // --- flow graph -----------------------------------------------------------
  // Events are reached either by being listed on a node the player can walk to,
  // or by a choice pointing at them. Anything in neither set is authored but
  // unplayable.
  // `END_CH07`, `END_CH07_RESOLVED` and friends are chapter-exit sentinels, not
  // events. A choice pointing at one is how a chapter ends, so they are not
  // broken links.
  const isExitSentinel = (id) => /^END_CH\d\d(_[A-Z_]+)?$/.test(id);

  const linkedTo = new Set();
  const danglingLinks = [];
  const exitLinks = new Set();
  for (const ev of events) {
    for (const choice of ev.choices ?? []) {
      const next = choice.next_event_id;
      if (!next) continue;
      if (eventIds.has(next)) linkedTo.add(next);
      else if (isExitSentinel(next)) exitLinks.add(next);
      else danglingLinks.push({ from: ev.event_id, choice: choice.choice_id, to: next });
    }
  }
  const nodeHosted = new Set();
  for (const nd of nodes) for (const id of nd.event_ids ?? []) nodeHosted.add(id);

  const orphanEvents = events
    .filter((e) => !nodeHosted.has(e.event_id) && !linkedTo.has(e.event_id))
    .map((e) => e.event_id);

  const deadEndEvents = events
    .filter((e) => (e.choices ?? []).length === 0 && (e.outcomes ?? []).length === 0)
    .map((e) => e.event_id);

  // Nodes the travel graph never points at, ignoring the entry node itself.
  const nodeTargets = new Set([d.entry_node_id]);
  for (const nd of nodes) for (const c of nd.connections ?? []) nodeTargets.add(c.to);
  const unreachableNodes = nodes.filter((nd) => !nodeTargets.has(nd.node_id)).map((nd) => nd.node_id);
  const brokenConnections = [];
  for (const nd of nodes) {
    for (const c of nd.connections ?? []) {
      if (!nodeIds.has(c.to)) brokenConnections.push({ from: nd.node_id, to: c.to });
    }
  }

  // --- npc deployment -------------------------------------------------------
  const npcEventCount = new Map();
  const npcSpokenLines = new Map();
  for (const ev of events) {
    for (const id of ev.npc_ids ?? []) npcEventCount.set(id, (npcEventCount.get(id) ?? 0) + 1);
    for (const block of ev.text?.scene_blocks ?? []) {
      if (block.kind !== "dialogue" || !block.speaker_id) continue;
      const prev = npcSpokenLines.get(block.speaker_id) ?? 0;
      npcSpokenLines.set(block.speaker_id, prev + (block.lines ?? []).length);
    }
  }
  const npcOnNodes = new Set();
  for (const nd of nodes) for (const id of nd.npc_ids ?? []) npcOnNodes.add(id);

  // --- quests ---------------------------------------------------------------
  const quests = d.quest_tracks ?? [];
  const objectives = d.objectives ?? [];
  const objectiveIds = new Set(objectives.map((o) => o.objective_id));
  const claimedObjectives = new Set();
  const questProblems = [];
  for (const q of quests) {
    for (const oid of q.objective_ids ?? []) {
      claimedObjectives.add(oid);
      if (!objectiveIds.has(oid)) questProblems.push({ quest: q.quest_track_id, missing_objective: oid });
    }
    if (q.entry_event_id && !eventIds.has(q.entry_event_id)) {
      questProblems.push({ quest: q.quest_track_id, missing_entry_event: q.entry_event_id });
    }
    if (q.completion_event_id && !eventIds.has(q.completion_event_id)) {
      questProblems.push({ quest: q.quest_track_id, missing_completion_event: q.completion_event_id });
    }
    if (!(q.objective_ids ?? []).length) questProblems.push({ quest: q.quest_track_id, no_objectives: true });
  }
  const unclaimedObjectives = objectives
    .filter((o) => !claimedObjectives.has(o.objective_id))
    .map((o) => o.objective_id);

  // --- mechanics ------------------------------------------------------------
  const eventTypes = {};
  const effectOps = {};
  const artKeys = new Map();
  const musicKeys = new Map();
  let choiceCount = 0;
  let choicelessChoiceEvents = 0;
  let singleChoiceEvents = 0;
  for (const ev of events) {
    eventTypes[ev.event_type ?? "?"] = (eventTypes[ev.event_type ?? "?"] ?? 0) + 1;
    const art = ev.presentation?.art_key;
    if (art) artKeys.set(art, (artKeys.get(art) ?? 0) + 1);
    const music = ev.presentation?.music_key;
    if (music) musicKeys.set(music, (musicKeys.get(music) ?? 0) + 1);
    const cs = ev.choices ?? [];
    choiceCount += cs.length;
    if (ev.event_type === "choice" && cs.length === 0) choicelessChoiceEvents += 1;
    if (cs.length === 1) singleChoiceEvents += 1;
    for (const c of cs) for (const e of c.effects ?? []) effectOps[e.op] = (effectOps[e.op] ?? 0) + 1;
    for (const e of ev.on_enter_effects ?? []) effectOps[e.op] = (effectOps[e.op] ?? 0) + 1;
    for (const e of ev.on_complete_effects ?? []) effectOps[e.op] = (effectOps[e.op] ?? 0) + 1;
  }

  const prose = events.flatMap(eventProse);
  const chars = prose.reduce((sum, line) => sum + line.length, 0);

  return {
    chapter_id: d.chapter_id,
    part: ch.part,
    title: d.title,
    nodes: nodes.length,
    events: events.length,
    choices: choiceCount,
    prose_lines: prose.length,
    prose_chars: chars,
    estimated_first_run_minutes: d.estimated_first_run_minutes ?? null,
    quest_tracks: quests.length,
    quest_kinds: quests.reduce((acc, q) => ({ ...acc, [q.kind ?? "?"]: (acc[q.kind ?? "?"] ?? 0) + 1 }), {}),
    objectives: objectives.length,
    boss_event_id: d.boss_event_id ?? null,
    carryover_keys: d.carryover_keys ?? [],
    event_types: eventTypes,
    effect_ops: effectOps,
    distinct_art_keys: artKeys.size,
    max_art_key_reuse: artKeys.size ? Math.max(...artKeys.values()) : 0,
    distinct_music_keys: musicKeys.size,
    npcs: [...new Set([...npcEventCount.keys(), ...npcOnNodes])],
    npc_event_count: Object.fromEntries([...npcEventCount].sort((a, b) => b[1] - a[1])),
    npc_spoken_lines: Object.fromEntries([...npcSpokenLines].sort((a, b) => b[1] - a[1])),
    problems: {
      orphan_events: orphanEvents,
      dead_end_events: deadEndEvents,
      dangling_choice_links: danglingLinks,
      unreachable_nodes: unreachableNodes,
      broken_connections: brokenConnections,
      quest_problems: questProblems,
      objectives_not_in_any_quest: unclaimedObjectives,
      choice_events_without_choices: choicelessChoiceEvents,
      single_choice_events: singleChoiceEvents,
    },
  };
}

function main() {
  const chapters = loadChapters();
  const npcs = loadNpcNames();
  const perChapter = chapters.map(auditChapter);

  // --- per part -------------------------------------------------------------
  const parts = {};
  for (const c of perChapter) {
    const p = (parts[c.part] ??= {
      chapters: 0, events: 0, choices: 0, prose_chars: 0, nodes: 0,
      quest_tracks: 0, objectives: 0, minutes: 0, distinct_art_keys: 0,
    });
    p.chapters += 1;
    p.events += c.events;
    p.choices += c.choices;
    p.prose_chars += c.prose_chars;
    p.nodes += c.nodes;
    p.quest_tracks += c.quest_tracks;
    p.objectives += c.objectives;
    p.minutes += c.estimated_first_run_minutes ?? 0;
    p.distinct_art_keys += c.distinct_art_keys;
  }

  // --- npc across the whole arc ---------------------------------------------
  const npcSpan = new Map();
  for (const c of perChapter) {
    for (const [id, count] of Object.entries(c.npc_event_count)) {
      const rec = npcSpan.get(id) ?? { npc_id: id, name: npcs.get(id)?.name_ko ?? "?", chapters: [], parts: new Set(), events: 0 };
      rec.chapters.push(c.chapter_id);
      rec.parts.add(c.part);
      rec.events += count;
      npcSpan.set(id, rec);
    }
  }
  const npcArc = [...npcSpan.values()]
    .map((r) => ({ ...r, parts: [...r.parts].sort(), chapter_count: r.chapters.length }))
    .sort((a, b) => b.events - a.events);

  const registeredButUnused = [...npcs.keys()].filter((id) => !npcSpan.has(id));
  const usedButUnregistered = [...npcSpan.keys()].filter((id) => !npcs.has(id));

  // --- carryover continuity -------------------------------------------------
  // A carryover key that no later chapter declares is a thread the player is
  // told matters and then never hears about again.
  const carryDeclared = new Map();
  for (const c of perChapter) for (const k of c.carryover_keys) {
    if (!carryDeclared.has(k)) carryDeclared.set(k, []);
    carryDeclared.get(k).push(c.chapter_id);
  }
  const carrySingleChapter = [...carryDeclared].filter(([, v]) => v.length === 1).map(([k, v]) => ({ key: k, only_in: v[0] }));

  const report = {
    generated_for: "P1-P4 structural review",
    chapters: perChapter,
    parts,
    npc_arc: npcArc,
    npc_registry: {
      registered: npcs.size,
      registered_but_never_used: registeredButUnused,
      used_but_unregistered: usedByUnregisteredSafe(usedButUnregistered),
    },
    carryover: {
      declared_keys: carryDeclared.size,
      single_chapter_keys: carrySingleChapter,
    },
    totals: {
      chapters: perChapter.length,
      events: perChapter.reduce((s, c) => s + c.events, 0),
      choices: perChapter.reduce((s, c) => s + c.choices, 0),
      prose_chars: perChapter.reduce((s, c) => s + c.prose_chars, 0),
      problems: perChapter.reduce((s, c) =>
        s + c.problems.orphan_events.length + c.problems.dead_end_events.length
        + c.problems.dangling_choice_links.length + c.problems.unreachable_nodes.length
        + c.problems.broken_connections.length + c.problems.quest_problems.length, 0),
    },
  };

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const pad = (v, n) => String(v).padStart(n);
  console.log("chapter  part  events  choices  nodes  quests  objs  prose(k)  min  art");
  for (const c of perChapter) {
    console.log(
      `${c.chapter_id}     ${c.part}   ${pad(c.events, 6)}  ${pad(c.choices, 7)}  ${pad(c.nodes, 5)}  ${pad(c.quest_tracks, 6)}  ${pad(c.objectives, 4)}  ${pad((c.prose_chars / 1000).toFixed(1), 8)}  ${pad(c.estimated_first_run_minutes ?? "-", 3)}  ${pad(c.distinct_art_keys, 3)}`,
    );
  }
  console.log("\npart totals");
  for (const [p, v] of Object.entries(parts)) {
    console.log(`  ${p}  events ${pad(v.events, 4)}  choices ${pad(v.choices, 4)}  prose ${pad((v.prose_chars / 1000).toFixed(0), 4)}k  quests ${pad(v.quest_tracks, 3)}  minutes ${pad(v.minutes, 4)}`);
  }
  console.log(`\nNPCs in registry: ${npcs.size}  |  appearing in chapters: ${npcArc.length}`);
  console.log("NPC reach (top 12 by event appearances):");
  for (const r of npcArc.slice(0, 12)) {
    console.log(`  ${r.name.padEnd(6)} ${String(r.npc_id).padEnd(22)} parts ${r.parts.join(",").padEnd(11)} chapters ${pad(r.chapter_count, 2)}  events ${pad(r.events, 3)}`);
  }
  if (registeredButUnused.length) console.log(`\nregistered but never used: ${registeredButUnused.join(", ")}`);
  console.log(`\ntotal structural problems: ${report.totals.problems}`);
  console.log(`report: ${REPORT_PATH.replace(`${ROOT}\\`, "")}`);
}

/** Kept separate so an empty list reads as an empty list, not as `undefined`. */
function usedByUnregisteredSafe(list) {
  return list ?? [];
}

main();
