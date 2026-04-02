import { createBattleState, resolveBattleTurn } from "./battleResolver";
import { canTriggerEvent, canSelectChoice, evaluateCondition, findScreenByType, resolveSpecialScreenType } from "./requirements";
import { applyEffects } from "./rewards";
import type {
  BattleAction,
  BattleState,
  ChapterDefinition,
  ChapterId,
  ChapterProgressState,
  EventChoice,
  EventDefinition,
  EventVisitState,
  GameContentPack,
  LootDrop,
  LootSessionState,
  RuntimeSnapshot,
  RuntimeWarning,
  UIScreenType
} from "../types/game";

function makeWarning(
  message: string,
  source: string,
  severity: RuntimeWarning["severity"] = "warning"
): RuntimeWarning {
  return {
    message,
    source,
    severity
  };
}

function cloneRuntime(runtime: RuntimeSnapshot): RuntimeSnapshot {
  return JSON.parse(JSON.stringify(runtime)) as RuntimeSnapshot;
}

function idleBattleState(): BattleState {
  return {
    status: "idle",
    arena_tags: [],
    units: [],
    turn_count: 0,
    pending_choice_effects: [],
    victory_effects: [],
    defeat_effects: []
  };
}

function defaultProgress(chapter: ChapterDefinition, status: ChapterProgressState["status"]): ChapterProgressState {
  return {
    status,
    objective_completion: Object.fromEntries(chapter.objectives.map((objective) => [objective.objective_id, false]))
  };
}

function chapterIndex(content: GameContentPack, chapterId: ChapterId): number {
  return content.chapter_order.indexOf(chapterId);
}

function resetChapterProgress(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  chapterId: ChapterId,
  status: ChapterProgressState["status"]
): void {
  const chapter = content.chapters[chapterId];
  runtime.chapter_progress[chapterId] = defaultProgress(chapter, status);
}

function setScreen(runtime: RuntimeSnapshot, content: GameContentPack, screenType: UIScreenType): void {
  const screen = findScreenByType(content.ui_flows[runtime.current_chapter_id], screenType);
  runtime.ui_screen = screenType;
  runtime.current_screen_id = screen?.screen_id ?? null;
}

function recomputeObjectives(runtime: RuntimeSnapshot, content: GameContentPack, chapterId = runtime.current_chapter_id): void {
  const chapter = content.chapters[chapterId];
  const progress = runtime.chapter_progress[chapterId];

  if (!chapter || !progress) {
    return;
  }

  for (const objective of chapter.objectives) {
    progress.objective_completion[objective.objective_id] = objective.complete_when.every((condition) =>
      evaluateCondition(condition, runtime, [], `objective:${objective.objective_id}`)
    );
  }
}

function markEventSeen(runtime: RuntimeSnapshot, event: EventDefinition): EventVisitState {
  const chapterVisits = (runtime.visited_events[runtime.current_chapter_id] ??= {});
  const visitState = (chapterVisits[event.event_id] ??= {
    seen_count: 0,
    completed_count: 0,
    entered_once: false
  });

  visitState.seen_count += 1;
  visitState.entered_once = true;
  return visitState;
}

function completeEvent(runtime: RuntimeSnapshot, eventId: string, choiceId?: string): void {
  const visitState = (runtime.visited_events[runtime.current_chapter_id] ??= {})[eventId];
  if (!visitState) {
    return;
  }

  visitState.completed_count += 1;
  if (choiceId) {
    visitState.last_choice_id = choiceId;
  }
}

function createLootSession(
  runtime: RuntimeSnapshot,
  lootTableId: string,
  sourceEventId: string,
  drops: LootDrop[],
  pendingNextEventId?: string | null
): LootSessionState {
  return {
    loot_table_id: lootTableId,
    source_chapter_id: runtime.current_chapter_id,
    source_node_id: runtime.current_node_id ?? "unknown",
    source_event_id: sourceEventId,
    drops,
    pending_next_event_id: pendingNextEventId ?? null,
    return_screen: "world_map"
  };
}

function firstAvailableEvent(content: GameContentPack, runtime: RuntimeSnapshot, nodeId: string): EventDefinition | null {
  const chapter = content.chapters[runtime.current_chapter_id];
  const node = chapter?.nodes_by_id[nodeId];

  if (!chapter || !node) {
    return null;
  }

  const warnings: RuntimeWarning[] = [];
  return (
    node.event_ids
      .map((eventId) => chapter.events_by_id[eventId])
      .filter((event): event is EventDefinition => Boolean(event))
      .sort((left, right) => right.priority - left.priority)
      .find((event) => canTriggerEvent(event, runtime, warnings)) ?? null
  );
}

function resolveBattleChoice(event: EventDefinition, runtime: RuntimeSnapshot, content: GameContentPack): EventChoice | null {
  const warnings: RuntimeWarning[] = [];
  return (
    event.choices.find((choice) => canSelectChoice(event.event_id, choice.choice_id, runtime, content, warnings)) ??
    event.choices[0] ??
    null
  );
}

function nextChapterFromRuntime(runtime: RuntimeSnapshot, content: GameContentPack): ChapterId | undefined {
  const explicit = typeof runtime.stats["chapter.current"] === "string" ? String(runtime.stats["chapter.current"]) : "";
  if (explicit && content.chapters[explicit]) {
    return explicit;
  }

  const currentIndex = chapterIndex(content, runtime.current_chapter_id);
  const fallback = content.chapter_order[currentIndex + 1];
  return fallback && content.chapters[fallback] ? fallback : undefined;
}

function campaignCompleteAfter(content: GameContentPack, nextChapterId?: string): boolean {
  return !nextChapterId || !content.chapters[nextChapterId];
}

export function createInitialRuntime(content: GameContentPack): RuntimeSnapshot {
  const initialChapterId = content.chapter_order[0];
  const stats = Object.fromEntries(
    Object.values(content.stats_registry).map((entry) => [entry.key, entry.default])
  ) as RuntimeSnapshot["stats"];

  stats.hp = Number(stats.hp ?? 100);
  stats.max_hp = Number(stats.max_hp ?? 100);
  stats.noise = Number(stats.noise ?? 0);
  stats.contamination = Number(stats.contamination ?? 0);
  stats["route.current"] = String(stats["route.current"] ?? "none");
  stats["chapter.current"] = initialChapterId;
  stats.carry_limit = Number(stats.carry_limit ?? 12);
  stats.carry_weight = 0;

  const runtime: RuntimeSnapshot = {
    current_chapter_id: initialChapterId,
    current_node_id: null,
    current_event_id: null,
    current_screen_id: null,
    ui_screen: "chapter_briefing",
    overlays: {
      inventory: false,
      status: false,
      objectives: false,
      warnings: false
    },
    stats,
    flags: {},
    inventory: {
      quantities: {},
      equipped: {},
      carry_weight_modifier: 0
    },
    chapter_progress: {},
    visited_nodes: {},
    visited_events: {},
    loot_session: null,
    battle_state: idleBattleState(),
    chapter_outcome: null,
    campaign_complete: false,
    run_seed: `${content.manifest.game_id}:${Date.now()}`
  };

  for (const chapterId of content.chapter_order) {
    resetChapterProgress(runtime, content, chapterId, chapterId === initialChapterId ? "available" : "locked");
  }

  setScreen(runtime, content, "chapter_briefing");
  return runtime;
}

export function loadChapterRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  chapterId: string
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const chapter = content.chapters[chapterId];

  if (!chapter) {
    warnings.push(makeWarning(`Chapter ${chapterId} is missing.`, "chapter", "error"));
    return { runtime, warnings };
  }

  const nextRuntime = cloneRuntime(runtime);
  nextRuntime.current_chapter_id = chapterId;
  nextRuntime.current_node_id = null;
  nextRuntime.current_event_id = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = idleBattleState();
  nextRuntime.chapter_outcome = null;
  nextRuntime.campaign_complete = false;
  nextRuntime.stats["chapter.current"] = chapterId;
  nextRuntime.stats["route.current"] = "none";
  nextRuntime.overlays.inventory = false;
  nextRuntime.overlays.warnings = false;

  if (!nextRuntime.chapter_progress[chapterId] || nextRuntime.chapter_progress[chapterId].status === "locked") {
    resetChapterProgress(nextRuntime, content, chapterId, "available");
  }

  setScreen(nextRuntime, content, "chapter_briefing");
  recomputeObjectives(nextRuntime, content, chapterId);
  return { runtime: nextRuntime, warnings };
}

export function startMissionRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const nextRuntime = cloneRuntime(runtime);
  const chapter = content.chapters[nextRuntime.current_chapter_id];
  const progress = nextRuntime.chapter_progress[nextRuntime.current_chapter_id];

  nextRuntime.current_node_id = chapter.entry_node_id;
  nextRuntime.current_event_id = null;
  nextRuntime.chapter_outcome = null;
  nextRuntime.visited_nodes[nextRuntime.current_chapter_id] = {
    ...(nextRuntime.visited_nodes[nextRuntime.current_chapter_id] ?? {}),
    [chapter.entry_node_id]: true
  };

  if (progress) {
    progress.status = "in_progress";
    progress.started_at ??= new Date().toISOString();
    progress.last_visited_node_id = chapter.entry_node_id;
  }

  setScreen(nextRuntime, content, "world_map");
  recomputeObjectives(nextRuntime, content);
  return { runtime: nextRuntime, warnings: [] };
}

export function triggerEventRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  eventId?: string
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const chapter = content.chapters[nextRuntime.current_chapter_id];

  const event =
    (eventId ? chapter?.events_by_id[eventId] : null) ??
    (nextRuntime.current_node_id ? firstAvailableEvent(content, nextRuntime, nextRuntime.current_node_id) : null);

  if (!chapter || !event) {
    warnings.push(makeWarning("No triggerable event is available.", "event", "error"));
    return { runtime, warnings };
  }

  markEventSeen(nextRuntime, event);
  nextRuntime.current_event_id = event.event_id;

  const enterEffects = applyEffects(nextRuntime, content, event.on_enter_effects, `event:${event.event_id}:enter`);
  nextRuntime.stats = enterEffects.runtime.stats;
  nextRuntime.flags = enterEffects.runtime.flags;
  nextRuntime.inventory = enterEffects.runtime.inventory;
  nextRuntime.chapter_progress = enterEffects.runtime.chapter_progress;
  nextRuntime.visited_nodes = enterEffects.runtime.visited_nodes;
  nextRuntime.visited_events = enterEffects.runtime.visited_events;
  warnings.push(...enterEffects.warnings);

  const specialScreen =
    resolveSpecialScreenType(nextRuntime.current_chapter_id, event.event_id, content.ui_flows[nextRuntime.current_chapter_id]) ??
    (event.combat ? "boss_intro" : null);

  setScreen(nextRuntime, content, (specialScreen as UIScreenType | null) ?? "event_dialogue");
  recomputeObjectives(nextRuntime, content);
  return { runtime: nextRuntime, warnings };
}

export function enterNodeRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  nodeId: string
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const chapter = content.chapters[nextRuntime.current_chapter_id];
  const node = chapter?.nodes_by_id[nodeId];

  if (!chapter || !node) {
    warnings.push(makeWarning(`Node ${nodeId} is missing.`, "map", "error"));
    return { runtime, warnings };
  }

  if (nextRuntime.current_node_id && nextRuntime.current_node_id !== nodeId) {
    const currentNode = chapter.nodes_by_id[nextRuntime.current_node_id];
    const connection = currentNode?.connections.find((entry) => entry.to === nodeId);

    if (!connection) {
      warnings.push(makeWarning(`Node ${nodeId} is not reachable from ${nextRuntime.current_node_id}.`, "map", "error"));
      return { runtime, warnings };
    }

    const allowed = connection.requires.every((condition) =>
      evaluateCondition(condition, nextRuntime, warnings, `connection:${currentNode.node_id}->${nodeId}`)
    );
    if (!allowed) {
      warnings.push(makeWarning(`Requirements are not met for ${nodeId}.`, "map", "error"));
      return { runtime, warnings };
    }

    nextRuntime.stats.noise = Number(nextRuntime.stats.noise ?? 0) + connection.cost.noise;
    nextRuntime.stats.contamination = Number(nextRuntime.stats.contamination ?? 0) + connection.cost.contamination;
  }

  nextRuntime.current_node_id = nodeId;
  nextRuntime.current_event_id = null;
  nextRuntime.visited_nodes[nextRuntime.current_chapter_id] = {
    ...(nextRuntime.visited_nodes[nextRuntime.current_chapter_id] ?? {}),
    [nodeId]: true
  };

  const progress = nextRuntime.chapter_progress[nextRuntime.current_chapter_id];
  if (progress) {
    progress.last_visited_node_id = nodeId;
  }

  const event = firstAvailableEvent(content, nextRuntime, nodeId);
  if (event) {
    return triggerEventRuntime(nextRuntime, content, event.event_id);
  }

  setScreen(nextRuntime, content, "world_map");
  recomputeObjectives(nextRuntime, content);
  return { runtime: nextRuntime, warnings };
}

export function applyChoiceRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  choiceId: string
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const chapter = content.chapters[nextRuntime.current_chapter_id];
  const event = nextRuntime.current_event_id ? chapter?.events_by_id[nextRuntime.current_event_id] : null;
  const choice = event?.choices.find((entry) => entry.choice_id === choiceId);

  if (!chapter || !event || !choice) {
    warnings.push(makeWarning(`Choice ${choiceId} is not available.`, "choice", "error"));
    return { runtime, warnings };
  }

  if (!canSelectChoice(event.event_id, choice.choice_id, nextRuntime, content, warnings)) {
    warnings.push(makeWarning(`Choice ${choiceId} is locked.`, "choice", "error"));
    return { runtime, warnings };
  }

  const choiceEffects = applyEffects(nextRuntime, content, choice.effects, `choice:${choice.choice_id}`);
  nextRuntime.stats = choiceEffects.runtime.stats;
  nextRuntime.flags = choiceEffects.runtime.flags;
  nextRuntime.inventory = choiceEffects.runtime.inventory;
  nextRuntime.chapter_progress = choiceEffects.runtime.chapter_progress;
  nextRuntime.visited_nodes = choiceEffects.runtime.visited_nodes;
  nextRuntime.visited_events = choiceEffects.runtime.visited_events;
  warnings.push(...choiceEffects.warnings);

  const completeEffects = applyEffects(nextRuntime, content, event.on_complete_effects, `event:${event.event_id}:complete`);
  nextRuntime.stats = completeEffects.runtime.stats;
  nextRuntime.flags = completeEffects.runtime.flags;
  nextRuntime.inventory = completeEffects.runtime.inventory;
  nextRuntime.chapter_progress = completeEffects.runtime.chapter_progress;
  nextRuntime.visited_nodes = completeEffects.runtime.visited_nodes;
  nextRuntime.visited_events = completeEffects.runtime.visited_events;
  warnings.push(...completeEffects.warnings);

  completeEvent(nextRuntime, event.event_id, choice.choice_id);
  recomputeObjectives(nextRuntime, content);

  const grantedLoot = [...choiceEffects.grantedLoot, ...completeEffects.grantedLoot];
  const nextEventId = choice.next_event_id || event.next_event_id || null;

  if (grantedLoot.length) {
    nextRuntime.loot_session = createLootSession(
      nextRuntime,
      event.loot_table_ids?.[0] ?? "effect_loot",
      event.event_id,
      grantedLoot,
      nextEventId
    );
    setScreen(nextRuntime, content, "loot_resolution");
    return { runtime: nextRuntime, warnings };
  }

  if (nextEventId?.startsWith("END_")) {
    const completed = completeChapterRuntime(nextRuntime, content, nextEventId);
    return {
      runtime: completed.runtime,
      warnings: [...warnings, ...completed.warnings]
    };
  }

  if (nextEventId && chapter.events_by_id[nextEventId]) {
    const chained = triggerEventRuntime(nextRuntime, content, nextEventId);
    return {
      runtime: chained.runtime,
      warnings: [...warnings, ...chained.warnings]
    };
  }

  nextRuntime.current_event_id = null;
  setScreen(nextRuntime, content, "world_map");
  return { runtime: nextRuntime, warnings };
}

export function startBattleRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const chapter = content.chapters[nextRuntime.current_chapter_id];
  const event = nextRuntime.current_event_id ? chapter?.events_by_id[nextRuntime.current_event_id] : null;

  if (!event?.combat) {
    warnings.push(makeWarning("Combat data is not available for the active event.", "battle", "error"));
    return { runtime, warnings };
  }

  const selectedChoice = resolveBattleChoice(event, nextRuntime, content);
  const battle = createBattleState(nextRuntime, content, event.combat.encounter_table_id, {
    arena_tags: event.combat.arena_tags ?? [],
    boss_id: event.combat.boss_id,
    pending_choice_effects: selectedChoice?.effects ?? [],
    pending_choice_id: selectedChoice?.choice_id,
    pending_next_event_id: selectedChoice?.next_event_id ?? event.next_event_id ?? null,
    source_event_id: event.event_id,
    victory_effects: event.combat.victory_effects,
    defeat_effects: event.combat.defeat_effects
  });

  nextRuntime.battle_state = battle.battleState;
  setScreen(nextRuntime, content, "combat_arena");
  return {
    runtime: nextRuntime,
    warnings: [...warnings, ...battle.warnings]
  };
}

export function finishBattleRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  result: "victory" | "defeat"
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const battleState = nextRuntime.battle_state;
  const chapter = content.chapters[nextRuntime.current_chapter_id];
  const sourceEvent = battleState.source_event_id ? chapter?.events_by_id[battleState.source_event_id] : null;

  const effectList = [
    ...(result === "victory" ? battleState.pending_choice_effects : []),
    ...(result === "victory" ? battleState.victory_effects : battleState.defeat_effects)
  ];
  const resolved = applyEffects(nextRuntime, content, effectList, `battle:${battleState.source_event_id ?? "unknown"}:${result}`);

  nextRuntime.stats = resolved.runtime.stats;
  nextRuntime.flags = resolved.runtime.flags;
  nextRuntime.inventory = resolved.runtime.inventory;
  nextRuntime.chapter_progress = resolved.runtime.chapter_progress;
  nextRuntime.visited_nodes = resolved.runtime.visited_nodes;
  nextRuntime.visited_events = resolved.runtime.visited_events;
  nextRuntime.battle_state = {
    ...idleBattleState(),
    status: result,
    result
  };
  warnings.push(...resolved.warnings);

  if (sourceEvent) {
    completeEvent(nextRuntime, sourceEvent.event_id, battleState.pending_choice_id);
  }
  recomputeObjectives(nextRuntime, content);

  const nextEventId =
    result === "defeat" && sourceEvent?.fail_event_id
      ? sourceEvent.fail_event_id
      : battleState.pending_next_event_id ?? sourceEvent?.next_event_id ?? null;

  if (resolved.grantedLoot.length) {
    nextRuntime.loot_session = createLootSession(
      nextRuntime,
      sourceEvent?.loot_table_ids?.[0] ?? "battle_loot",
      battleState.source_event_id ?? "unknown",
      resolved.grantedLoot,
      nextEventId
    );
    setScreen(nextRuntime, content, "loot_resolution");
    return { runtime: nextRuntime, warnings };
  }

  if (nextEventId?.startsWith("END_")) {
    const completed = completeChapterRuntime(nextRuntime, content, nextEventId);
    return {
      runtime: completed.runtime,
      warnings: [...warnings, ...completed.warnings]
    };
  }

  if (nextEventId && chapter?.events_by_id[nextEventId]) {
    const chained = triggerEventRuntime(nextRuntime, content, nextEventId);
    return {
      runtime: chained.runtime,
      warnings: [...warnings, ...chained.warnings]
    };
  }

  nextRuntime.current_event_id = null;
  setScreen(nextRuntime, content, "world_map");
  return { runtime: nextRuntime, warnings };
}

export function performBattleActionRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  action: BattleAction
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const turn = resolveBattleTurn(runtime, action);
  if (!turn.outcome) {
    return turn;
  }

  const finished = finishBattleRuntime(turn.runtime, content, turn.outcome);
  return {
    runtime: finished.runtime,
    warnings: [...turn.warnings, ...finished.warnings]
  };
}

export function commitLootRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  itemIds?: string[]
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const session = nextRuntime.loot_session;

  if (!session) {
    warnings.push(makeWarning("No active loot session.", "loot", "error"));
    return { runtime, warnings };
  }

  const selected = new Set(itemIds ?? session.drops.map((drop) => drop.item_id));
  for (const drop of session.drops) {
    if (!selected.has(drop.item_id)) {
      continue;
    }

    nextRuntime.inventory.quantities[drop.item_id] = (nextRuntime.inventory.quantities[drop.item_id] ?? 0) + drop.quantity;
  }

  const recalculated = applyEffects(nextRuntime, content, [], `loot:${session.source_event_id}`);
  nextRuntime.stats = recalculated.runtime.stats;
  nextRuntime.inventory = recalculated.runtime.inventory;
  nextRuntime.loot_session = null;
  warnings.push(...recalculated.warnings);
  recomputeObjectives(nextRuntime, content);

  const nextEventId = session.pending_next_event_id;
  if (nextEventId?.startsWith("END_")) {
    const completed = completeChapterRuntime(nextRuntime, content, nextEventId);
    return {
      runtime: completed.runtime,
      warnings: [...warnings, ...completed.warnings]
    };
  }

  if (nextEventId && content.chapters[nextRuntime.current_chapter_id]?.events_by_id[nextEventId]) {
    const chained = triggerEventRuntime(nextRuntime, content, nextEventId);
    return {
      runtime: chained.runtime,
      warnings: [...warnings, ...chained.warnings]
    };
  }

  nextRuntime.current_event_id = null;
  setScreen(nextRuntime, content, session.return_screen);
  return { runtime: nextRuntime, warnings };
}

export function completeChapterRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  endToken: string
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneRuntime(runtime);
  const chapterId = nextRuntime.current_chapter_id;
  const chapter = content.chapters[chapterId];
  const progress = nextRuntime.chapter_progress[chapterId];
  const nextChapterId = nextChapterFromRuntime(nextRuntime, content);
  const campaignComplete = campaignCompleteAfter(content, nextChapterId);

  if (progress) {
    progress.status = "completed";
    progress.completed_at = new Date().toISOString();
    progress.ended_by = endToken;
  }

  nextRuntime.current_event_id = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = idleBattleState();
  nextRuntime.campaign_complete = campaignComplete;
  nextRuntime.chapter_outcome = {
    chapter_id: chapterId,
    title: chapter?.title ?? chapterId,
    summary: campaignComplete
      ? `${chapter?.title ?? chapterId} completed. No further chapter data is available, so the campaign ends here.`
      : `${chapter?.title ?? chapterId} completed. The next chapter briefing is ready.`,
    next_chapter_id: campaignComplete ? undefined : nextChapterId,
    campaign_complete: campaignComplete
  };

  if (!campaignComplete && nextChapterId && nextRuntime.chapter_progress[nextChapterId]?.status === "locked") {
    resetChapterProgress(nextRuntime, content, nextChapterId, "available");
  }

  setScreen(nextRuntime, content, "result_summary");
  recomputeObjectives(nextRuntime, content, chapterId);
  return { runtime: nextRuntime, warnings };
}

export function advanceToNextChapterRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] } {
  const nextChapterId =
    runtime.chapter_outcome?.next_chapter_id ??
    nextChapterFromRuntime(runtime, content);

  if (!nextChapterId || !content.chapters[nextChapterId]) {
    const nextRuntime = cloneRuntime(runtime);
    nextRuntime.campaign_complete = true;
    setScreen(nextRuntime, content, "result_summary");
    return {
      runtime: nextRuntime,
      warnings: [makeWarning("No next chapter data is available. Campaign is complete.", "chapter", "info")]
    };
  }

  return loadChapterRuntime(runtime, content, nextChapterId);
}
