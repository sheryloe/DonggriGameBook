import fs from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  PRIVATE_CONTENT_DATA_ROOT,
  PRIVATE_CONTENT_UI_ROOT,
  REPO_ROOT,
  relFromRoot,
  resolveNormalizedRepoPath
} from "./private-paths.mjs";

function createIssue(message, source, extra = {}) {
  return {
    message,
    source,
    ...extra
  };
}

export async function readJsonWithBom(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

async function loadSchema(relativePath) {
  return readJsonWithBom(path.join(REPO_ROOT, relativePath));
}

function unique(values) {
  return [...new Set(values)];
}

function isCanonicalText(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  return !/[�]|[\u0080-\u00ff]/u.test(value);
}

function normalizeRefTarget(target, prefix) {
  if (typeof target !== "string") {
    return "";
  }

  return target.startsWith(prefix) ? target.slice(prefix.length) : target;
}

function collectConditionRefs(conditions) {
  const refs = {
    flags: [],
    items: [],
    routes: [],
    stats: []
  };

  for (const condition of conditions ?? []) {
    if (typeof condition !== "string") {
      continue;
    }

    const matches = condition.match(/(?:flag|item|route):[a-z0-9_.:-]+/giu) ?? [];
    for (const token of matches) {
      if (token.startsWith("flag:")) {
        refs.flags.push(token);
      } else if (token.startsWith("item:")) {
        refs.items.push(token.slice("item:".length));
      } else if (token.startsWith("route:")) {
        refs.routes.push(token);
      }
    }

    const comparisonMatch = /^!?([a-zA-Z0-9_.:-]+)\s*(>=|<=|=|>|<)\s*([a-zA-Z0-9_.:-]+)$/u.exec(condition.trim());
    if (comparisonMatch) {
      const [, left] = comparisonMatch;
      const normalizedLeft = left?.startsWith("npc_") ? `trust.${left}` : left;
      if (
        normalizedLeft &&
        !normalizedLeft.startsWith("flag:") &&
        !normalizedLeft.startsWith("item:") &&
        !normalizedLeft.startsWith("route:") &&
        !normalizedLeft.startsWith("widget.") &&
        !normalizedLeft.startsWith("auth.") &&
        normalizedLeft !== "field_actions_remaining" &&
        normalizedLeft !== "field_actions.remaining" &&
        normalizedLeft !== "route.current" &&
        normalizedLeft !== "fail_state.active"
      ) {
        refs.stats.push(normalizedLeft);
      }
    }
  }

  return refs;
}

function validateIndexEntry(entry, indexPosition, chapterMetaIssues) {
  const requiredFields = [
    "chapter_id",
    "title",
    "file",
    "part_id",
    "sequence",
    "logline",
    "story_phase",
    "primary_tension",
    "side_quest_budget",
    "item_focus",
    "boss_presence"
  ];

  for (const field of requiredFields) {
    if (!(field in entry)) {
      chapterMetaIssues.push(createIssue(`Missing chapter index field: ${field}`, `private/content/data/chapters.index.json`, {
        chapter_id: entry.chapter_id ?? `index:${indexPosition + 1}`
      }));
    }
  }

  if (entry.sequence !== indexPosition + 1) {
    chapterMetaIssues.push(createIssue("Chapter sequence does not match index order.", "private/content/data/chapters.index.json", {
      chapter_id: entry.chapter_id,
      expected_sequence: indexPosition + 1,
      actual_sequence: entry.sequence
    }));
  }

  if (!/^P[1-4]$/u.test(String(entry.part_id ?? ""))) {
    chapterMetaIssues.push(createIssue("Invalid part_id in chapter index.", "private/content/data/chapters.index.json", {
      chapter_id: entry.chapter_id,
      actual_part_id: entry.part_id
    }));
  }

  if (typeof entry.side_quest_budget !== "number" || entry.side_quest_budget < 0) {
    chapterMetaIssues.push(createIssue("Invalid side_quest_budget in chapter index.", "private/content/data/chapters.index.json", {
      chapter_id: entry.chapter_id,
      actual_budget: entry.side_quest_budget
    }));
  }

  if (!isCanonicalText(entry.title) || !isCanonicalText(entry.logline)) {
    chapterMetaIssues.push(createIssue("Chapter index contains invalid or broken text.", "private/content/data/chapters.index.json", {
      chapter_id: entry.chapter_id
    }));
  }
}

function collectEffectStatRefs(effects) {
  const refs = [];
  for (const effect of effects ?? []) {
    if (
      (effect.op === "add_stat" || effect.op === "sub_stat") &&
      effect.target !== "field_actions_remaining" &&
      effect.target !== "field_actions.remaining"
    ) {
      refs.push(effect.target);
      continue;
    }

    if (
      effect.op === "set_value" &&
      typeof effect.target === "string" &&
      effect.target !== "field_actions_remaining" &&
      effect.target !== "field_actions.remaining" &&
      !effect.target.startsWith("auth.") &&
      !/^widget(?:_state)?\./u.test(effect.target) &&
      !effect.target.startsWith("fail_state.")
    ) {
      refs.push(effect.target);
    }
  }

  return refs;
}

function validateChapterGraph(chapter, entry, diagnostics, knownItems, knownLootTables, knownStats) {
  const source = `private/content/data/chapters/${String(entry.chapter_id ?? "").toLowerCase()}.json`;
  const objectiveIds = new Set((chapter.objectives ?? []).map((objective) => objective.objective_id));
  const questTrackIds = (chapter.quest_tracks ?? []).map((track) => track.quest_track_id);
  const eventIdList = (chapter.events ?? []).map((event) => event.event_id);
  const eventIds = new Set((chapter.events ?? []).map((event) => event.event_id));
  const nodeIds = new Set((chapter.nodes ?? []).map((node) => node.node_id));
  const sideTracks = (chapter.quest_tracks ?? []).filter((track) => track.kind === "side");

  if ((chapter.nodes ?? []).length < 3) {
    diagnostics.contract_violations.push(createIssue("Chapter must have at least 3 nodes.", source, { chapter_id: chapter.chapter_id }));
  }

  if ((chapter.events ?? []).length < 5) {
    diagnostics.contract_violations.push(createIssue("Chapter must have at least 5 events.", source, { chapter_id: chapter.chapter_id }));
  }

  if (sideTracks.length < Number(entry.side_quest_budget ?? 0)) {
    diagnostics.contract_violations.push(createIssue("Chapter side quest count is below side_quest_budget.", source, {
      chapter_id: chapter.chapter_id,
      side_quest_budget: entry.side_quest_budget,
      actual_side_tracks: sideTracks.length
    }));
  }

  if (!isCanonicalText(chapter.title)) {
    diagnostics.contract_violations.push(createIssue("Chapter title contains invalid or broken text.", source, {
      chapter_id: chapter.chapter_id
    }));
  }

  if (unique(questTrackIds).length !== questTrackIds.length) {
    diagnostics.errors.push(createIssue("Duplicate quest_track_id detected.", source, { chapter_id: chapter.chapter_id }));
  }

  if (unique(eventIdList).length !== eventIdList.length) {
    diagnostics.errors.push(createIssue("Duplicate event_id detected.", source, { chapter_id: chapter.chapter_id }));
  }

  if (!nodeIds.has(chapter.entry_node_id)) {
    diagnostics.missing_references.push(createIssue("Chapter entry_node_id points to a missing node.", source, {
      chapter_id: chapter.chapter_id,
      entry_node_id: chapter.entry_node_id
    }));
  }

  for (const exitNodeId of chapter.exit_node_ids ?? []) {
    if (!nodeIds.has(exitNodeId)) {
      diagnostics.missing_references.push(createIssue("Chapter exit_node_ids contains a missing node.", source, {
        chapter_id: chapter.chapter_id,
        exit_node_id: exitNodeId
      }));
    }
  }

  if (chapter.boss_event_id && !eventIds.has(chapter.boss_event_id)) {
    diagnostics.missing_references.push(createIssue("boss_event_id points to a missing event.", source, {
      chapter_id: chapter.chapter_id,
      boss_event_id: chapter.boss_event_id
    }));
  }

  for (const repeatableEventId of chapter.repeatable_scavenging_events ?? []) {
    if (!eventIds.has(repeatableEventId)) {
      diagnostics.missing_references.push(createIssue("repeatable_scavenging_events references a missing event.", source, {
        chapter_id: chapter.chapter_id,
        event_id: repeatableEventId
      }));
    }
  }

  for (const objective of chapter.objectives ?? []) {
    if (!/^obj_ch\d{2}_[a-z0-9_]+$/u.test(objective.objective_id)) {
      diagnostics.contract_violations.push(createIssue("Objective id format is invalid.", source, {
        chapter_id: chapter.chapter_id,
        objective_id: objective.objective_id
      }));
    }
  }

  for (const track of chapter.quest_tracks ?? []) {
    if (!/^qt_ch\d{2}_[a-z0-9_]+$/u.test(track.quest_track_id)) {
      diagnostics.contract_violations.push(createIssue("Quest track id format is invalid.", source, {
        chapter_id: chapter.chapter_id,
        quest_track_id: track.quest_track_id
      }));
    }

    for (const objectiveId of track.objective_ids ?? []) {
      if (!objectiveIds.has(objectiveId)) {
        diagnostics.missing_references.push(createIssue("Quest track references a missing objective.", source, {
          chapter_id: chapter.chapter_id,
          quest_track_id: track.quest_track_id,
          objective_id: objectiveId
        }));
      }
    }
  }

  for (const node of chapter.nodes ?? []) {
    for (const target of node.connections ?? []) {
      if (!nodeIds.has(target.to)) {
        diagnostics.missing_references.push(createIssue("Node connection points to a missing node.", source, {
          chapter_id: chapter.chapter_id,
          node_id: node.node_id,
          missing_node_id: target.to
        }));
      }
    }

    for (const eventId of node.event_ids ?? []) {
      if (!eventIds.has(eventId)) {
        diagnostics.missing_references.push(createIssue("Node references a missing event.", source, {
          chapter_id: chapter.chapter_id,
          node_id: node.node_id,
          missing_event_id: eventId
        }));
      }
    }

    for (const lootTableId of node.loot_table_ids ?? []) {
      if (!knownLootTables.has(lootTableId)) {
        diagnostics.missing_references.push(createIssue("Node references a missing loot table.", source, {
          chapter_id: chapter.chapter_id,
          node_id: node.node_id,
          loot_table_id: lootTableId
        }));
      }
    }
  }

  for (const event of chapter.events ?? []) {
    if (!nodeIds.has(event.node_id)) {
      diagnostics.missing_references.push(createIssue("Event references a missing node.", source, {
        chapter_id: chapter.chapter_id,
        event_id: event.event_id,
        missing_node_id: event.node_id
      }));
    }

    const presentationKeys = [
      event.presentation?.art_key,
      event.presentation?.cinematic_still_key
    ].filter(Boolean);

    for (const artKey of presentationKeys) {
      if (!/^[a-z0-9_]+$/u.test(String(artKey))) {
        diagnostics.contract_violations.push(createIssue("Event presentation art key format is invalid.", source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          art_key: artKey
        }));
      }
    }

    const refs = collectConditionRefs([
      ...(event.conditions ?? []),
      ...(event.choices ?? []).flatMap((choice) => choice.conditions ?? [])
    ]);

    for (const itemId of refs.items) {
      if (!knownItems.has(itemId)) {
        diagnostics.missing_references.push(createIssue("Condition references a missing item.", source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          item_id: itemId
        }));
      }
    }

    for (const statKey of refs.stats) {
      if (!knownStats.has(statKey)) {
        diagnostics.missing_references.push(createIssue("Condition references a missing stat.", source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          stat_key: statKey
        }));
      }
    }

    const effectGroups = [
      ...(event.on_enter_effects ?? []),
      ...(event.on_complete_effects ?? []),
      ...(event.choices ?? []).flatMap((choice) => choice.effects ?? [])
    ];

    for (const effect of effectGroups) {
      if (effect.op === "grant_item" || effect.op === "remove_item") {
        const itemId = normalizeRefTarget(effect.target, "item:");
        if (!knownItems.has(itemId)) {
          diagnostics.missing_references.push(createIssue("Effect references a missing item.", source, {
            chapter_id: chapter.chapter_id,
            event_id: event.event_id,
            item_id: itemId
          }));
        }
      }

      if (effect.op === "grant_loot_table") {
        const lootTableId = normalizeRefTarget(effect.target, "loot:");
        if (!knownLootTables.has(lootTableId)) {
          diagnostics.missing_references.push(createIssue("Effect references a missing loot table.", source, {
            chapter_id: chapter.chapter_id,
            event_id: event.event_id,
            loot_table_id: lootTableId
          }));
        }
      }
    }

    for (const statKey of collectEffectStatRefs(effectGroups)) {
      if (!knownStats.has(statKey)) {
        diagnostics.missing_references.push(createIssue("Effect references a missing stat.", source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          stat_key: statKey
        }));
      }
    }

    for (const refName of ["next_event_id", "fail_event_id"]) {
      const nextEventId = event[refName];
      if (nextEventId && !eventIds.has(nextEventId) && !String(nextEventId).startsWith("END_")) {
        diagnostics.missing_references.push(createIssue(`Event ${refName} points to a missing event.`, source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          next_event_id: nextEventId
        }));
      }
    }

    for (const nextEventId of (event.choices ?? []).map((choice) => choice.next_event_id).filter(Boolean)) {
      if (!eventIds.has(nextEventId) && !String(nextEventId).startsWith("END_")) {
        diagnostics.missing_references.push(createIssue("Choice points to a missing next event.", source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          next_event_id: nextEventId
        }));
      }
    }

    for (const refName of ["fail_event_id", "setback_event_id"]) {
      const combatEventId = event.combat?.[refName];
      if (combatEventId && !eventIds.has(combatEventId) && !String(combatEventId).startsWith("END_")) {
        diagnostics.missing_references.push(createIssue(`Combat ${refName} points to a missing event.`, source, {
          chapter_id: chapter.chapter_id,
          event_id: event.event_id,
          next_event_id: combatEventId
        }));
      }
    }
  }

  const chapterCinematicKeys = Object.entries(chapter.chapter_cinematic ?? {})
    .filter(([, value]) => typeof value === "string")
    .map(([key, value]) => ({ key, value }));

  for (const cinematic of chapterCinematicKeys) {
    const isTeaserPrompt = cinematic.key === "teaser_prompt_id";
    const valid = isTeaserPrompt
      ? /^[A-Z0-9_]+$/u.test(cinematic.value)
      : /^[a-z0-9_]+$/u.test(cinematic.value);
    if (!valid) {
      diagnostics.contract_violations.push(createIssue("Chapter cinematic art key format is invalid.", source, {
        chapter_id: chapter.chapter_id,
        cinematic_key: cinematic.key,
        art_key: cinematic.value
      }));
    }
  }

  for (const endingRule of chapter.ending_matrix ?? []) {
    if (!Array.isArray(endingRule.conditions) || endingRule.conditions.length === 0) {
      diagnostics.contract_violations.push(createIssue("Ending rule is missing conditions.", source, {
        chapter_id: chapter.chapter_id,
        ending_id: endingRule.ending_id
      }));
    }
  }
}

export async function validatePrivateContent() {
  const diagnostics = {
    warnings: [],
    errors: [],
    contract_violations: [],
    missing_references: []
  };

  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const chapterSchema = await loadSchema("schemas/chapter_event.schema.json");
  const itemSchema = await loadSchema("schemas/inventory_item.schema.json");
  const uiSchema = await loadSchema("schemas/ui_flow.schema.json");

  const validateChapterSchema = ajv.compile(chapterSchema);
  const validateItemSchema = ajv.compile(itemSchema);
  const validateUiSchema = ajv.compile(uiSchema);

  const indexPath = path.join(PRIVATE_CONTENT_DATA_ROOT, "chapters.index.json");
  const itemsPath = path.join(PRIVATE_CONTENT_DATA_ROOT, "inventory.items.json");
  const lootTablesPath = path.join(PRIVATE_CONTENT_DATA_ROOT, "loot_tables.json");
  const uiRoot = PRIVATE_CONTENT_UI_ROOT;

  const chaptersIndex = await readJsonWithBom(indexPath);
  const itemsRegistry = await readJsonWithBom(itemsPath);
  const lootTables = await readJsonWithBom(lootTablesPath);
  const statsRegistry = await readJsonWithBom(path.join(PRIVATE_CONTENT_DATA_ROOT, "stats.registry.json"));

  if (!validateItemSchema(itemsRegistry)) {
    diagnostics.errors.push(createIssue("Inventory item schema validation failed.", relFromRoot(itemsPath), {
      schema_errors: validateItemSchema.errors
    }));
  }

  const knownItems = new Set((itemsRegistry.items ?? []).map((item) => item.item_id));
  const knownLootTables = new Set((lootTables.loot_tables ?? []).map((table) => table.loot_table_id));
  const knownStats = new Set((statsRegistry.stats ?? []).map((stat) => stat.key));
  const seenChapterIds = new Set();

  for (const [indexPosition, entry] of (chaptersIndex.chapters ?? []).entries()) {
    validateIndexEntry(entry, indexPosition, diagnostics.contract_violations);

    if (seenChapterIds.has(entry.chapter_id)) {
      diagnostics.errors.push(createIssue("Duplicate chapter_id in chapters index.", relFromRoot(indexPath), {
        chapter_id: entry.chapter_id
      }));
      continue;
    }
    seenChapterIds.add(entry.chapter_id);

    const chapterPath = resolveNormalizedRepoPath(entry.file ?? `data/chapters/${String(entry.chapter_id).toLowerCase()}.json`);
    const uiPath = path.join(uiRoot, `${String(entry.chapter_id).toLowerCase()}.ui_flow.json`);

    let chapter;
    try {
      chapter = await readJsonWithBom(chapterPath);
    } catch (error) {
      diagnostics.errors.push(createIssue("Chapter file is missing or unreadable.", relFromRoot(chapterPath), {
        chapter_id: entry.chapter_id,
        detail: error instanceof Error ? error.message : String(error)
      }));
      continue;
    }

    if (!validateChapterSchema(chapter)) {
      diagnostics.errors.push(createIssue("Chapter schema validation failed.", relFromRoot(chapterPath), {
        chapter_id: entry.chapter_id,
        schema_errors: validateChapterSchema.errors
      }));
      continue;
    }

    validateChapterGraph(chapter, entry, diagnostics, knownItems, knownLootTables, knownStats);

    try {
      const uiFlow = await readJsonWithBom(uiPath);
      if (!validateUiSchema(uiFlow)) {
        diagnostics.errors.push(createIssue("UI flow schema validation failed.", relFromRoot(uiPath), {
          chapter_id: entry.chapter_id,
          schema_errors: validateUiSchema.errors
        }));
      } else if (uiFlow.chapter_id !== entry.chapter_id) {
        diagnostics.errors.push(createIssue("UI flow chapter_id does not match chapter index.", relFromRoot(uiPath), {
          chapter_id: entry.chapter_id,
          ui_chapter_id: uiFlow.chapter_id
        }));
      }
    } catch (error) {
      diagnostics.errors.push(createIssue("UI flow file is missing or unreadable.", relFromRoot(uiPath), {
        chapter_id: entry.chapter_id,
        detail: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  return {
    ok: diagnostics.errors.length === 0 && diagnostics.contract_violations.length === 0 && diagnostics.missing_references.length === 0,
    chapter_count: (chaptersIndex.chapters ?? []).length,
    item_count: (itemsRegistry.items ?? []).length,
    loot_table_count: (lootTables.loot_tables ?? []).length,
    diagnostics
  };
}
