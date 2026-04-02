import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createBattleState, resolveBattleTurn } from "../engine/battleResolver";
import {
  canSelectChoice as canSelectChoiceWithContent,
  canTriggerEvent,
  findScreenByType,
  resolveSpecialScreenType
} from "../engine/requirements";
import { applyEffects, computeCarryLimit, computeInventoryWeight, resolveLootTableDeterministically } from "../engine/rewards";
import type {
  BattleAction,
  ChapterDefinition,
  EventDefinition,
  EventVisitState,
  GameContentPack,
  OverlayKey,
  RuntimeSnapshot,
  RuntimeWarning,
  SaveSlotId,
  SaveSlotState,
  StatValue,
  UIFlow
} from "../types/game";

const STORAGE_KEY = "donggrolgamebook:runtime:v2";
const DEFAULT_SAVE_SLOT_ID = "slot-1";

const safeStorage: StateStorage = {
  getItem: (name) => (typeof window === "undefined" ? null : window.localStorage.getItem(name)),
  setItem: (name, value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(name);
    }
  }
};

function makeWarning(message: string, source: string, severity: RuntimeWarning["severity"] = "warning"): RuntimeWarning {
  return {
    message,
    source,
    severity
  };
}

function emptyRuntime(): RuntimeSnapshot {
  return {
    current_chapter_id: "CH01",
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
    stats: {},
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
    battle_state: {
      status: "idle",
      arena_tags: [],
      units: [],
      turn_count: 0,
      pending_choice_effects: [],
      victory_effects: [],
      defeat_effects: []
    },
    chapter_outcome: null,
    campaign_complete: false,
    run_seed: "boot"
  };
}

function cloneRuntime(runtime: RuntimeSnapshot): RuntimeSnapshot {
  return JSON.parse(JSON.stringify(runtime)) as RuntimeSnapshot;
}

function normalizeFlagId(flagId: string): string {
  return flagId.startsWith("flag:") ? flagId.slice(5) : flagId;
}

function normalizeFlags(flags: Record<string, boolean> | undefined): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(flags ?? {}).map(([flagId, value]) => [normalizeFlagId(flagId), value === true])
  );
}

function trimWarnings(warnings: RuntimeWarning[]): RuntimeWarning[] {
  return warnings.slice(-160);
}

function lastWarningMessage(warnings: RuntimeWarning[]): string {
  return warnings.length ? warnings[warnings.length - 1].message : "Unknown error";
}

export interface GameStoreState {
  content: GameContentPack | null;
  active_save_slot_id: SaveSlotId;
  save_slots: Record<SaveSlotId, SaveSlotState>;
  runtime: RuntimeSnapshot;
  warnings: RuntimeWarning[];
}

export interface GameStoreActions {
  hydrateContent: (content: GameContentPack) => void;
  startNewRun: () => void;
  startMission: () => void;
  createSaveSlot: (label?: string) => SaveSlotId;
  saveToSlot: (slotId?: SaveSlotId) => void;
  loadFromSlot: (slotId: SaveSlotId) => void;
  resetActiveSlot: () => void;
  loadChapter: (chapterId: string) => { ok: true } | { ok: false; reason: string };
  enterNode: (nodeId: string) => { ok: true } | { ok: false; reason: string };
  triggerEvent: (eventId?: string) => { ok: true } | { ok: false; reason: string };
  canSelectChoice: (choiceId: string) => boolean;
  applyChoice: (choiceId: string) => { ok: true } | { ok: false; reason: string };
  grantLoot: (lootTableId: string, sourceEventId: string, pendingNextEventId?: string | null) => void;
  commitLootSelection: (itemIds?: string[]) => void;
  closeLootSession: () => void;
  startBattle: () => void;
  performBattleAction: (action: BattleAction) => void;
  finishBattle: (result: "victory" | "defeat") => void;
  completeChapter: () => void;
  advanceToNextChapter: () => void;
  setFlag: (flagId: string, value: boolean) => void;
  setStat: (key: string, value: StatValue) => void;
  adjustStat: (key: string, delta: number) => void;
  grantItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => boolean;
  setScreen: (screenId: string | null, screenType: RuntimeSnapshot["ui_screen"]) => void;
  toggleOverlay: (key: keyof RuntimeSnapshot["overlays"], open?: boolean) => void;
  recomputeObjectives: (chapterId?: string) => void;
  pushWarning: (warning: RuntimeWarning | string) => void;
}

export type GameStore = GameStoreState & GameStoreActions;
type RuntimeResult = { runtime: RuntimeSnapshot; warnings: RuntimeWarning[] };

function hasUsableRuntime(runtime: RuntimeSnapshot, content: GameContentPack): boolean {
  if (!content.chapters[runtime.current_chapter_id]) {
    return false;
  }

  if (!Object.keys(runtime.chapter_progress).length) {
    return false;
  }

  if (!Object.keys(runtime.stats).length) {
    return false;
  }

  return true;
}

function recordWarnings(state: GameStoreState, warnings: RuntimeWarning[]): Pick<GameStoreState, "warnings"> {
  return {
    warnings: trimWarnings([...state.warnings, ...warnings])
  };
}

function cloneBattleState(runtime: RuntimeSnapshot): RuntimeSnapshot["battle_state"] {
  return {
    ...runtime.battle_state,
    arena_tags: [...runtime.battle_state.arena_tags],
    units: runtime.battle_state.units.map((unit) => ({ ...unit })),
    pending_choice_effects: runtime.battle_state.pending_choice_effects.map((effect) => ({ ...effect })),
    victory_effects: runtime.battle_state.victory_effects.map((effect) => ({ ...effect })),
    defeat_effects: runtime.battle_state.defeat_effects.map((effect) => ({ ...effect }))
  };
}

function sanitizeRuntime(runtime: RuntimeSnapshot | null | undefined): RuntimeSnapshot {
  const base = emptyRuntime();
  if (!runtime) {
    return base;
  }

  return {
    ...base,
    ...runtime,
    overlays: {
      ...base.overlays,
      ...(runtime.overlays ?? {})
    } as Record<OverlayKey, boolean>,
    stats: { ...(runtime.stats ?? {}) },
    flags: normalizeFlags(runtime.flags),
    inventory: {
      ...base.inventory,
      ...(runtime.inventory ?? {}),
      quantities: { ...(runtime.inventory?.quantities ?? {}) },
      equipped: { ...(runtime.inventory?.equipped ?? {}) }
    },
    chapter_progress: Object.fromEntries(
      Object.entries(runtime.chapter_progress ?? {}).map(([chapterId, progress]) => [
        chapterId,
        {
          ...progress,
          objective_completion: { ...(progress.objective_completion ?? {}) }
        }
      ])
    ),
    visited_nodes: Object.fromEntries(
      Object.entries(runtime.visited_nodes ?? {}).map(([chapterId, nodes]) => [chapterId, { ...nodes }])
    ),
    visited_events: Object.fromEntries(
      Object.entries(runtime.visited_events ?? {}).map(([chapterId, events]) => [
        chapterId,
        Object.fromEntries(
          Object.entries(events).map(([eventId, visitState]) => [
            eventId,
            {
              ...visitState
            }
          ])
        )
      ])
    ),
    loot_session: runtime.loot_session
      ? {
          ...runtime.loot_session,
          drops: runtime.loot_session.drops.map((drop) => ({ ...drop }))
        }
      : null,
    battle_state: cloneBattleState(runtime),
    chapter_outcome: runtime.chapter_outcome ? { ...runtime.chapter_outcome } : null
  };
}

function ensureSaveSlots(
  saveSlots: Record<SaveSlotId, SaveSlotState> | undefined,
  fallbackRuntime: RuntimeSnapshot
): Record<SaveSlotId, SaveSlotState> {
  const normalized = Object.fromEntries(
    Object.entries(saveSlots ?? {}).map(([slotId, slot]) => [
      slotId,
      {
        id: slot?.id ?? slotId,
        label: slot?.label ?? (slotId === DEFAULT_SAVE_SLOT_ID ? "Main Slot" : slotId),
        updated_at: slot?.updated_at ?? new Date().toISOString(),
        snapshot: sanitizeRuntime(slot?.snapshot ?? fallbackRuntime)
      }
    ])
  ) as Record<SaveSlotId, SaveSlotState>;

  if (!normalized[DEFAULT_SAVE_SLOT_ID]) {
    normalized[DEFAULT_SAVE_SLOT_ID] = defaultSlot(fallbackRuntime);
  }

  return normalized;
}

function coerceActiveSlotId(
  preferredSlotId: SaveSlotId,
  saveSlots: Record<SaveSlotId, SaveSlotState>
): SaveSlotId {
  return saveSlots[preferredSlotId] ? preferredSlotId : DEFAULT_SAVE_SLOT_ID;
}

function syncActiveSlot(
  state: Pick<GameStoreState, "active_save_slot_id" | "save_slots">,
  runtime: RuntimeSnapshot,
  preferredSlotId = state.active_save_slot_id
): { activeSaveSlotId: SaveSlotId; saveSlots: Record<SaveSlotId, SaveSlotState> } {
  const baseSlots = ensureSaveSlots(state.save_slots, runtime);
  const activeSaveSlotId = coerceActiveSlotId(preferredSlotId, baseSlots);

  return {
    activeSaveSlotId,
    saveSlots: {
      ...baseSlots,
      [activeSaveSlotId]: touchSlot(baseSlots[activeSaveSlotId], runtime)
    }
  };
}

function withResult(state: GameStoreState, nextRuntime: RuntimeSnapshot, warnings: RuntimeWarning[]): Partial<GameStoreState> {
  const synced = syncActiveSlot(state, nextRuntime);
  return {
    runtime: nextRuntime,
    active_save_slot_id: synced.activeSaveSlotId,
    save_slots: synced.saveSlots,
    ...recordWarnings(state, warnings)
  };
}

function touchSlot(slot: SaveSlotState, runtime: RuntimeSnapshot): SaveSlotState {
  return {
    ...slot,
    updated_at: new Date().toISOString(),
    snapshot: cloneRuntime(runtime)
  };
}

function defaultSlot(runtime: RuntimeSnapshot): SaveSlotState {
  return {
    id: DEFAULT_SAVE_SLOT_ID,
    label: "Main Slot",
    updated_at: new Date().toISOString(),
    snapshot: cloneRuntime(runtime)
  };
}

function currentChapter(content: GameContentPack | null, runtime: RuntimeSnapshot): ChapterDefinition | null {
  return content?.chapters[runtime.current_chapter_id] ?? null;
}

function currentEvent(content: GameContentPack | null, runtime: RuntimeSnapshot): EventDefinition | null {
  const chapter = currentChapter(content, runtime);
  return runtime.current_event_id ? chapter?.events_by_id[runtime.current_event_id] ?? null : null;
}

function applyInventoryRecalc(runtime: RuntimeSnapshot, content: GameContentPack | null): RuntimeSnapshot {
  if (!content) {
    return runtime;
  }

  runtime.stats["carry_weight"] = computeInventoryWeight(
    runtime.inventory.quantities,
    content.items,
    runtime.inventory.carry_weight_modifier
  );
  runtime.stats["carry_limit"] = computeCarryLimit(runtime, content.items);
  return runtime;
}

function emptyBattleState(): RuntimeSnapshot["battle_state"] {
  return emptyRuntime().battle_state;
}

function createDefaultStats(content: GameContentPack): RuntimeSnapshot["stats"] {
  return Object.fromEntries(
    Object.entries(content.stats_registry).map(([key, entry]) => [key, entry.default])
  );
}

function createInitialChapterProgress(content: GameContentPack): RuntimeSnapshot["chapter_progress"] {
  return Object.fromEntries(
    content.chapter_order.map((chapterId, index) => [
      chapterId,
      {
        status: index === 0 ? "available" : "locked",
        objective_completion: Object.fromEntries(
          content.chapters[chapterId].objectives.map((objective) => [objective.objective_id, false])
        )
      }
    ])
  );
}

function withScreen(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  uiScreen: RuntimeSnapshot["ui_screen"]
): RuntimeSnapshot {
  return {
    ...runtime,
    ui_screen: uiScreen,
    current_screen_id: findScreenByType(content.ui_flows[runtime.current_chapter_id], uiScreen)?.screen_id ?? null
  };
}

function cloneVisitState(visitState: EventVisitState | undefined): EventVisitState {
  return visitState
    ? { ...visitState }
    : {
        seen_count: 0,
        completed_count: 0,
        entered_once: false
      };
}

function markEventEntered(runtime: RuntimeSnapshot, eventId: string): RuntimeSnapshot {
  const nextRuntime = cloneRuntime(runtime);
  const chapterVisits = { ...(nextRuntime.visited_events[nextRuntime.current_chapter_id] ?? {}) };
  const visitState = cloneVisitState(chapterVisits[eventId]);
  visitState.seen_count += 1;
  visitState.entered_once = true;
  chapterVisits[eventId] = visitState;
  nextRuntime.visited_events[nextRuntime.current_chapter_id] = chapterVisits;
  return nextRuntime;
}

function markEventCompleted(runtime: RuntimeSnapshot, eventId: string, choiceId?: string): RuntimeSnapshot {
  const nextRuntime = cloneRuntime(runtime);
  const chapterVisits = { ...(nextRuntime.visited_events[nextRuntime.current_chapter_id] ?? {}) };
  const visitState = cloneVisitState(chapterVisits[eventId]);
  visitState.completed_count += 1;
  visitState.entered_once = true;
  if (choiceId) {
    visitState.last_choice_id = choiceId;
  }
  chapterVisits[eventId] = visitState;
  nextRuntime.visited_events[nextRuntime.current_chapter_id] = chapterVisits;
  return nextRuntime;
}

function recomputeObjectivesForRuntime(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  chapterId = runtime.current_chapter_id
): RuntimeSnapshot {
  const nextRuntime = cloneRuntime(runtime);
  const chapter = content.chapters[chapterId];
  const progress = nextRuntime.chapter_progress[chapterId];
  if (!chapter || !progress) {
    return nextRuntime;
  }

  for (const objective of chapter.objectives) {
    progress.objective_completion[objective.objective_id] = objective.complete_when.some((group) => {
      return group.split("|").every((condition) => {
        if (condition.startsWith("flag:")) {
          return nextRuntime.flags[normalizeFlagId(condition)] === true;
        }

        const itemMatch = /^item:([^>]+)>=(\d+)$/u.exec(condition);
        if (itemMatch) {
          const [, itemId, rawQty] = itemMatch;
          return (nextRuntime.inventory.quantities[itemId] ?? 0) >= Number(rawQty);
        }

        return Boolean(nextRuntime.stats[condition]);
      });
    });
  }

  return nextRuntime;
}

function nextChapterIdFor(content: GameContentPack, chapterId: string): string | null {
  const index = content.chapter_order.indexOf(chapterId);
  if (index < 0 || index === content.chapter_order.length - 1) {
    return null;
  }

  return content.chapter_order[index + 1] ?? null;
}

function currentNodeEventId(runtime: RuntimeSnapshot, content: GameContentPack): string | null {
  const chapter = currentChapter(content, runtime);
  const node = runtime.current_node_id ? chapter?.nodes_by_id[runtime.current_node_id] : null;
  if (!chapter || !node) {
    return null;
  }

  const warnings: RuntimeWarning[] = [];
  const candidate =
    node.event_ids
      .map((eventId) => chapter.events_by_id[eventId])
      .filter((event): event is EventDefinition => Boolean(event))
      .sort((left, right) => right.priority - left.priority)
      .find((event) => canTriggerEvent(event, runtime, warnings)) ?? null;

  return candidate?.event_id ?? null;
}

function createInitialRuntimeLocal(content: GameContentPack): RuntimeSnapshot {
  const chapterId = content.chapter_order[0] ?? "CH01";
  const runtime = applyInventoryRecalc(
    {
      ...emptyRuntime(),
      current_chapter_id: chapterId,
      stats: createDefaultStats(content),
      chapter_progress: createInitialChapterProgress(content)
    },
    content
  );

  runtime.stats["chapter.current"] = chapterId;
  return withScreen(runtime, content, "chapter_briefing");
}

function prepareChapterRuntime(runtime: RuntimeSnapshot, content: GameContentPack, chapterId: string): RuntimeResult {
  const chapter = content.chapters[chapterId];
  if (!chapter) {
    return {
      runtime,
      warnings: [makeWarning(`Chapter ${chapterId} is missing.`, "chapter", "error")]
    };
  }

  const nextRuntime = cloneRuntime(runtime);
  nextRuntime.current_chapter_id = chapterId;
  nextRuntime.current_node_id = null;
  nextRuntime.current_event_id = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = emptyBattleState();
  nextRuntime.chapter_outcome = null;
  nextRuntime.campaign_complete = false;
  nextRuntime.overlays = { ...emptyRuntime().overlays };
  nextRuntime.stats["chapter.current"] = chapterId;

  if (!nextRuntime.chapter_progress[chapterId]) {
    nextRuntime.chapter_progress[chapterId] = {
      status: "available",
      objective_completion: Object.fromEntries(chapter.objectives.map((objective) => [objective.objective_id, false]))
    };
  } else if (nextRuntime.chapter_progress[chapterId].status === "locked") {
    nextRuntime.chapter_progress[chapterId].status = "available";
  }

  return {
    runtime: withScreen(recomputeObjectivesForRuntime(nextRuntime, content, chapterId), content, "chapter_briefing"),
    warnings: []
  };
}

function startMissionRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack): RuntimeResult {
  const chapter = currentChapter(content, runtime);
  if (!chapter) {
    return {
      runtime,
      warnings: [makeWarning(`Chapter ${runtime.current_chapter_id} is missing.`, "mission", "error")]
    };
  }

  const nextRuntime = cloneRuntime(runtime);
  nextRuntime.current_node_id = chapter.entry_node_id;
  nextRuntime.current_event_id = null;
  nextRuntime.chapter_progress[chapter.chapter_id] = {
    ...nextRuntime.chapter_progress[chapter.chapter_id],
    status: "in_progress",
    started_at: nextRuntime.chapter_progress[chapter.chapter_id]?.started_at ?? new Date().toISOString(),
    last_visited_node_id: chapter.entry_node_id
  };
  nextRuntime.visited_nodes[chapter.chapter_id] = {
    ...(nextRuntime.visited_nodes[chapter.chapter_id] ?? {}),
    [chapter.entry_node_id]: true
  };

  return {
    runtime: withScreen(nextRuntime, content, "world_map"),
    warnings: []
  };
}

function triggerEventRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack, eventId?: string): RuntimeResult {
  const chapter = currentChapter(content, runtime);
  const resolvedEventId = eventId ?? currentNodeEventId(runtime, content);
  if (!chapter || !resolvedEventId) {
    return {
      runtime: withScreen({ ...runtime, current_event_id: null }, content, "world_map"),
      warnings: resolvedEventId
        ? [makeWarning(`Chapter ${runtime.current_chapter_id} is missing.`, "event", "error")]
        : []
    };
  }

  const event = chapter.events_by_id[resolvedEventId];
  if (!event) {
    return {
      runtime,
      warnings: [makeWarning(`Event ${resolvedEventId} is missing.`, "event", "error")]
    };
  }

  const warnings: RuntimeWarning[] = [];
  if (!canTriggerEvent(event, runtime, warnings)) {
    return {
      runtime,
      warnings: warnings.length ? warnings : [makeWarning(`Event ${resolvedEventId} is not available.`, "event", "error")]
    };
  }

  let nextRuntime = cloneRuntime(runtime);
  nextRuntime.current_node_id = event.node_id;
  nextRuntime.current_event_id = event.event_id;
  nextRuntime.chapter_progress[nextRuntime.current_chapter_id] = {
    ...nextRuntime.chapter_progress[nextRuntime.current_chapter_id],
    last_visited_node_id: event.node_id
  };
  nextRuntime.visited_nodes[nextRuntime.current_chapter_id] = {
    ...(nextRuntime.visited_nodes[nextRuntime.current_chapter_id] ?? {}),
    [event.node_id]: true
  };
  nextRuntime = markEventEntered(nextRuntime, event.event_id);

  const enterResolution = applyEffects(nextRuntime, content, event.on_enter_effects, `event:${event.event_id}:enter`);
  nextRuntime = recomputeObjectivesForRuntime(applyInventoryRecalc(enterResolution.runtime, content), content);

  const specialScreen =
    event.event_type === "boss"
      ? "boss_intro"
      : resolveSpecialScreenType(nextRuntime.current_chapter_id, event.event_id, content.ui_flows[nextRuntime.current_chapter_id]) ??
        "event_dialogue";

  return {
    runtime: withScreen(nextRuntime, content, specialScreen as RuntimeSnapshot["ui_screen"]),
    warnings: [...warnings, ...enterResolution.warnings]
  };
}

function enterNodeRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack, nodeId: string): RuntimeResult {
  const chapter = currentChapter(content, runtime);
  if (!chapter) {
    return {
      runtime,
      warnings: [makeWarning(`Chapter ${runtime.current_chapter_id} is missing.`, "node", "error")]
    };
  }

  const node = chapter.nodes_by_id[nodeId];
  if (!node) {
    return {
      runtime,
      warnings: [makeWarning(`Node ${nodeId} is missing in ${chapter.chapter_id}.`, "node", "error")]
    };
  }

  const nextRuntime = cloneRuntime(runtime);
  const currentNode = nextRuntime.current_node_id ? chapter.nodes_by_id[nextRuntime.current_node_id] ?? null : null;
  const canTravel =
    !currentNode ||
    currentNode.node_id === nodeId ||
    currentNode.connections.some((connection) => connection.to === nodeId) ||
    nodeId === chapter.entry_node_id;

  if (!canTravel) {
    return {
      runtime,
      warnings: [makeWarning(`Node ${nodeId} is not reachable from ${currentNode?.node_id ?? "entry"}.`, "node", "error")]
    };
  }

  if (currentNode && currentNode.node_id !== nodeId) {
    const connection = currentNode.connections.find((entry) => entry.to === nodeId);
    if (connection) {
      nextRuntime.stats.noise = Number(nextRuntime.stats.noise ?? 0) + connection.cost.noise;
      nextRuntime.stats.contamination = Number(nextRuntime.stats.contamination ?? 0) + connection.cost.contamination;
    }
  }

  nextRuntime.current_node_id = nodeId;
  nextRuntime.current_event_id = null;
  nextRuntime.chapter_progress[nextRuntime.current_chapter_id] = {
    ...nextRuntime.chapter_progress[nextRuntime.current_chapter_id],
    last_visited_node_id: nodeId
  };
  nextRuntime.visited_nodes[nextRuntime.current_chapter_id] = {
    ...(nextRuntime.visited_nodes[nextRuntime.current_chapter_id] ?? {}),
    [nodeId]: true
  };

  const availableEventId = currentNodeEventId(nextRuntime, content);
  if (availableEventId) {
    return triggerEventRuntimeLocal(nextRuntime, content, availableEventId);
  }

  return {
    runtime: withScreen(recomputeObjectivesForRuntime(nextRuntime, content), content, "world_map"),
    warnings: []
  };
}

function completeChapterRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack, endedBy: string): RuntimeResult {
  const chapter = currentChapter(content, runtime);
  if (!chapter) {
    return {
      runtime,
      warnings: [makeWarning(`Chapter ${runtime.current_chapter_id} is missing.`, "chapter", "error")]
    };
  }

  const nextChapterId = nextChapterIdFor(content, chapter.chapter_id);
  const nextRuntime = recomputeObjectivesForRuntime(cloneRuntime(runtime), content);
  nextRuntime.current_event_id = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = emptyBattleState();
  nextRuntime.chapter_progress[chapter.chapter_id] = {
    ...nextRuntime.chapter_progress[chapter.chapter_id],
    status: "completed",
    completed_at: new Date().toISOString(),
    ended_by: endedBy
  };

  if (nextChapterId) {
    nextRuntime.chapter_progress[nextChapterId] = {
      ...nextRuntime.chapter_progress[nextChapterId],
      status: nextRuntime.chapter_progress[nextChapterId]?.status === "completed" ? "completed" : "available"
    };
  }

  nextRuntime.chapter_outcome = {
    chapter_id: chapter.chapter_id,
    title: chapter.title,
    summary: nextChapterId
      ? `${chapter.title} completed. Objectives and route state were carried into ${nextChapterId}.`
      : `${chapter.title} completed. No further chapter data is available, so the campaign is closed here.`,
    next_chapter_id: nextChapterId ?? undefined,
    campaign_complete: nextChapterId === null
  };
  nextRuntime.campaign_complete = nextChapterId === null;

  return {
    runtime: withScreen(nextRuntime, content, "result_summary"),
    warnings: []
  };
}

function applyChoiceRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack, choiceId: string): RuntimeResult {
  const event = currentEvent(content, runtime);
  if (!event) {
    return {
      runtime,
      warnings: [makeWarning("No active event is available for the selected choice.", "choice", "error")]
    };
  }

  const choice = event.choices.find((entry) => entry.choice_id === choiceId);
  if (!choice) {
    return {
      runtime,
      warnings: [makeWarning(`Choice ${choiceId} is missing from ${event.event_id}.`, "choice", "error")]
    };
  }

  const warnings: RuntimeWarning[] = [];
  if (!canSelectChoiceWithContent(event.event_id, choice.choice_id, runtime, content, warnings)) {
    return { runtime, warnings };
  }

  let nextRuntime = markEventCompleted(runtime, event.event_id, choice.choice_id);
  const effectResolution = applyEffects(nextRuntime, content, choice.effects, `choice:${choice.choice_id}`);
  nextRuntime = effectResolution.runtime;
  const completionResolution = applyEffects(nextRuntime, content, event.on_complete_effects, `event:${event.event_id}:complete`);
  nextRuntime = recomputeObjectivesForRuntime(applyInventoryRecalc(completionResolution.runtime, content), content);

  const grantedLoot = [...effectResolution.grantedLoot, ...completionResolution.grantedLoot];
  if (grantedLoot.length) {
    return {
      runtime: withScreen(
        {
          ...nextRuntime,
          loot_session: {
            loot_table_id: grantedLoot.map((drop) => drop.item_id).join("+"),
            source_chapter_id: nextRuntime.current_chapter_id,
            source_node_id: nextRuntime.current_node_id ?? event.node_id,
            source_event_id: event.event_id,
            drops: grantedLoot,
            pending_next_event_id: choice.next_event_id ?? event.next_event_id ?? null,
            return_screen: "event_dialogue"
          }
        },
        content,
        "loot_resolution"
      ),
      warnings: [...warnings, ...effectResolution.warnings, ...completionResolution.warnings]
    };
  }

  const nextEventId = choice.next_event_id ?? event.next_event_id ?? null;
  if (nextEventId?.startsWith("END_")) {
    const chapterResult = completeChapterRuntimeLocal(nextRuntime, content, nextEventId);
    return {
      runtime: chapterResult.runtime,
      warnings: [...warnings, ...effectResolution.warnings, ...completionResolution.warnings, ...chapterResult.warnings]
    };
  }

  if (nextEventId) {
    const chainedRuntime = {
      ...nextRuntime,
      current_node_id: currentChapter(content, nextRuntime)?.events_by_id[nextEventId]?.node_id ?? nextRuntime.current_node_id
    };
    const chainResult = triggerEventRuntimeLocal(chainedRuntime, content, nextEventId);
    return {
      runtime: chainResult.runtime,
      warnings: [...warnings, ...effectResolution.warnings, ...completionResolution.warnings, ...chainResult.warnings]
    };
  }

  return {
    runtime: withScreen(nextRuntime, content, "world_map"),
    warnings: [...warnings, ...effectResolution.warnings, ...completionResolution.warnings]
  };
}

function startBattleRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack): RuntimeResult {
  const event = currentEvent(content, runtime);
  if (!event?.combat) {
    return {
      runtime,
      warnings: [makeWarning("No combat event is active.", "battle", "error")]
    };
  }

  const bossChoice = event.choices[0];
  const battleStateResult = createBattleState(runtime, content, event.combat.encounter_table_id, {
    arena_tags: event.combat.arena_tags ?? [],
    boss_id: event.combat.boss_id,
    pending_choice_effects: bossChoice?.effects ?? [],
    pending_choice_id: bossChoice?.choice_id,
    pending_next_event_id: bossChoice?.next_event_id ?? event.next_event_id ?? null,
    source_event_id: event.event_id,
    victory_effects: event.combat.victory_effects,
    defeat_effects: event.combat.defeat_effects
  });

  return {
    runtime: withScreen(
      {
        ...runtime,
        battle_state: battleStateResult.battleState
      },
      content,
      "combat_arena"
    ),
    warnings: battleStateResult.warnings
  };
}

function finishBattleRuntimeLocal(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  resultType: "victory" | "defeat"
): RuntimeResult {
  const event = currentEvent(content, runtime);
  const battleState = runtime.battle_state;
  const nextRuntime = cloneRuntime(runtime);
  nextRuntime.battle_state = {
    ...emptyBattleState(),
    result: resultType,
    status: resultType
  };

  const effectList =
    resultType === "victory"
      ? [...battleState.victory_effects, ...battleState.pending_choice_effects]
      : battleState.defeat_effects;
  const effectResolution = applyEffects(nextRuntime, content, effectList, `battle:${battleState.source_event_id ?? "unknown"}`);
  const resolvedRuntime = recomputeObjectivesForRuntime(applyInventoryRecalc(effectResolution.runtime, content), content);

  if (resultType === "victory" && event) {
    const completedRuntime = markEventCompleted(resolvedRuntime, event.event_id, battleState.pending_choice_id);
    const nextEventId = battleState.pending_next_event_id ?? null;
    if (nextEventId?.startsWith("END_")) {
      const chapterResult = completeChapterRuntimeLocal(completedRuntime, content, nextEventId);
      return {
        runtime: chapterResult.runtime,
        warnings: [...effectResolution.warnings, ...chapterResult.warnings]
      };
    }

    if (nextEventId) {
      const chainResult = triggerEventRuntimeLocal(completedRuntime, content, nextEventId);
      return {
        runtime: chainResult.runtime,
        warnings: [...effectResolution.warnings, ...chainResult.warnings]
      };
    }

    return {
      runtime: withScreen(completedRuntime, content, "world_map"),
      warnings: effectResolution.warnings
    };
  }

  return {
    runtime: withScreen(resolvedRuntime, content, "boss_intro"),
    warnings: effectResolution.warnings
  };
}

function performBattleActionRuntimeLocal(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  action: BattleAction
): RuntimeResult {
  const turn = resolveBattleTurn(runtime, action);
  if (turn.outcome) {
    const finished = finishBattleRuntimeLocal(turn.runtime, content, turn.outcome);
    return {
      runtime: finished.runtime,
      warnings: [...turn.warnings, ...finished.warnings]
    };
  }

  return {
    runtime: turn.runtime,
    warnings: turn.warnings
  };
}

function commitLootRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack, itemIds?: string[]): RuntimeResult {
  const lootSession = runtime.loot_session;
  if (!lootSession) {
    return {
      runtime,
      warnings: [makeWarning("No loot session is active.", "loot", "error")]
    };
  }

  const selectedIds = new Set(itemIds && itemIds.length ? itemIds : lootSession.drops.map((drop) => drop.item_id));
  const nextRuntime = cloneRuntime(runtime);
  for (const drop of lootSession.drops) {
    if (!selectedIds.has(drop.item_id)) {
      continue;
    }

    nextRuntime.inventory.quantities[drop.item_id] =
      (nextRuntime.inventory.quantities[drop.item_id] ?? 0) + drop.quantity;
  }

  nextRuntime.loot_session = null;
  const resolvedRuntime = recomputeObjectivesForRuntime(applyInventoryRecalc(nextRuntime, content), content);
  const pendingNextEventId = lootSession.pending_next_event_id;

  if (pendingNextEventId?.startsWith("END_")) {
    return completeChapterRuntimeLocal(resolvedRuntime, content, pendingNextEventId);
  }

  if (pendingNextEventId) {
    return triggerEventRuntimeLocal(resolvedRuntime, content, pendingNextEventId);
  }

  return {
    runtime: withScreen(resolvedRuntime, content, "world_map"),
    warnings: []
  };
}

function advanceToNextChapterRuntimeLocal(runtime: RuntimeSnapshot, content: GameContentPack): RuntimeResult {
  const requestedChapterId =
    runtime.chapter_outcome?.next_chapter_id ??
    (typeof runtime.stats["chapter.current"] === "string" ? String(runtime.stats["chapter.current"]) : null);

  if (!requestedChapterId || !content.chapters[requestedChapterId]) {
    return {
      runtime: {
        ...runtime,
        campaign_complete: true
      },
      warnings: []
    };
  }

  return prepareChapterRuntime(runtime, content, requestedChapterId);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      content: null,
      active_save_slot_id: DEFAULT_SAVE_SLOT_ID,
      save_slots: {
        [DEFAULT_SAVE_SLOT_ID]: defaultSlot(emptyRuntime())
      },
      runtime: emptyRuntime(),
      warnings: [],

      hydrateContent: (content) => {
        set((state) => {
          const persistedRuntime = sanitizeRuntime(state.runtime);
          const runtime = hasUsableRuntime(persistedRuntime, content)
            ? applyInventoryRecalc(cloneRuntime(persistedRuntime), content)
            : createInitialRuntimeLocal(content);
          const synced = syncActiveSlot(
            {
              active_save_slot_id: coerceActiveSlotId(state.active_save_slot_id, ensureSaveSlots(state.save_slots, runtime)),
              save_slots: ensureSaveSlots(state.save_slots, runtime)
            },
            runtime
          );
          return {
            content,
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots,
            ...recordWarnings(state, content.warnings)
          };
        });
      },

      startNewRun: () => {
        const content = get().content;
        if (!content) {
          return;
        }

        const runtime = createInitialRuntimeLocal(content);
        set((state) => {
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots,
            warnings: trimWarnings([...state.warnings, ...content.warnings])
          };
        });
      },

      startMission: () => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = startMissionRuntimeLocal(get().runtime, content);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      createSaveSlot: (label) => {
        const slotId = `slot-${Date.now()}`;
        set((state) => ({
          save_slots: {
            ...state.save_slots,
            [slotId]: {
              id: slotId,
              label: label ?? `Slot ${Object.keys(state.save_slots).length + 1}`,
              updated_at: new Date().toISOString(),
              snapshot: cloneRuntime(state.runtime)
            }
          }
        }));
        return slotId;
      },

      saveToSlot: (slotId) => {
        set((state) => {
          const targetId = slotId ?? state.active_save_slot_id;
          const saveSlots = ensureSaveSlots(state.save_slots, state.runtime);
          return {
            active_save_slot_id: targetId,
            save_slots: {
              ...saveSlots,
              [targetId]: touchSlot(
                saveSlots[targetId] ?? {
                  id: targetId,
                  label: targetId === DEFAULT_SAVE_SLOT_ID ? "Main Slot" : targetId,
                  updated_at: new Date().toISOString(),
                  snapshot: cloneRuntime(state.runtime)
                },
                state.runtime
              )
            }
          };
        });
      },

      loadFromSlot: (slotId) => {
        set((state) => {
          const saveSlots = ensureSaveSlots(state.save_slots, state.runtime);
          const slot = saveSlots[slotId];
          if (!slot) {
            return {
              warnings: trimWarnings([...state.warnings, makeWarning(`Save slot ${slotId} is missing.`, "save")])
            };
          }

          const runtime = applyInventoryRecalc(sanitizeRuntime(slot.snapshot), state.content);
          return {
            active_save_slot_id: slotId,
            runtime,
            save_slots: {
              ...saveSlots,
              [slotId]: {
                ...slot,
                snapshot: cloneRuntime(runtime)
              }
            }
          };
        });
      },

      resetActiveSlot: () => {
        const content = get().content;
        if (!content) {
          return;
        }

        const runtime = createInitialRuntimeLocal(content);
        set((state) => {
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      loadChapter: (chapterId) => {
        const content = get().content;
        if (!content) {
          return { ok: false as const, reason: "Content is not loaded." };
        }

        const outcome = prepareChapterRuntime(get().runtime, content, chapterId);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
        return outcome.warnings.some((warning) => warning.severity === "error")
          ? { ok: false as const, reason: lastWarningMessage(outcome.warnings) }
          : { ok: true as const };
      },

      enterNode: (nodeId) => {
        const content = get().content;
        if (!content) {
          return { ok: false as const, reason: "Content is not loaded." };
        }

        const outcome = enterNodeRuntimeLocal(get().runtime, content, nodeId);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
        return outcome.warnings.some((warning) => warning.severity === "error")
          ? { ok: false as const, reason: lastWarningMessage(outcome.warnings) }
          : { ok: true as const };
      },

      triggerEvent: (eventId) => {
        const content = get().content;
        if (!content) {
          return { ok: false as const, reason: "Content is not loaded." };
        }

        const outcome = triggerEventRuntimeLocal(get().runtime, content, eventId);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
        return outcome.warnings.some((warning) => warning.severity === "error")
          ? { ok: false as const, reason: lastWarningMessage(outcome.warnings) }
          : { ok: true as const };
      },

      canSelectChoice: (choiceId) => {
        const state = get();
        if (!state.content || !state.runtime.current_event_id) {
          return false;
        }

        const warnings: RuntimeWarning[] = [];
        return canSelectChoiceWithContent(
          state.runtime.current_event_id,
          choiceId,
          state.runtime,
          state.content,
          warnings
        );
      },

      applyChoice: (choiceId) => {
        const content = get().content;
        if (!content) {
          return { ok: false as const, reason: "Content is not loaded." };
        }

        const outcome = applyChoiceRuntimeLocal(get().runtime, content, choiceId);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
        return outcome.warnings.some((warning) => warning.severity === "error")
          ? { ok: false as const, reason: lastWarningMessage(outcome.warnings) }
          : { ok: true as const };
      },

      grantLoot: (lootTableId, sourceEventId, pendingNextEventId) => {
        const state = get();
        const content = state.content;
        if (!content) {
          return;
        }

        const drops = resolveLootTableDeterministically(
          content,
          state.runtime,
          lootTableId,
          1,
          `manual-loot:${sourceEventId}`,
          []
        );
        set((current) => {
          const runtime = withScreen(
            {
              ...current.runtime,
              loot_session: {
                loot_table_id: lootTableId,
                source_chapter_id: current.runtime.current_chapter_id,
                source_node_id: current.runtime.current_node_id ?? "unknown",
                source_event_id: sourceEventId,
                drops,
                pending_next_event_id: pendingNextEventId ?? null,
                return_screen: "world_map"
              }
            },
            content,
            "loot_resolution"
          );
          const synced = syncActiveSlot(current, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      commitLootSelection: (itemIds) => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = commitLootRuntimeLocal(get().runtime, content, itemIds);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      closeLootSession: () => {
        set((state) => {
          if (!state.content) {
            return {};
          }

          const runtime = withScreen(
            {
              ...state.runtime,
              loot_session: null
            },
            state.content,
            "world_map"
          );
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      startBattle: () => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = startBattleRuntimeLocal(get().runtime, content);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      performBattleAction: (action) => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = performBattleActionRuntimeLocal(get().runtime, content, action);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      finishBattle: (resultType) => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = finishBattleRuntimeLocal(get().runtime, content, resultType);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      completeChapter: () => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = completeChapterRuntimeLocal(get().runtime, content, `END_${get().runtime.current_chapter_id}`);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      advanceToNextChapter: () => {
        const content = get().content;
        if (!content) {
          return;
        }

        const outcome = advanceToNextChapterRuntimeLocal(get().runtime, content);
        set((state) => withResult(state, outcome.runtime, outcome.warnings));
      },

      setFlag: (flagId, value) => {
        set((state) => {
          const runtime = {
            ...state.runtime,
            flags: {
              ...state.runtime.flags,
              [normalizeFlagId(flagId)]: value
            }
          };
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      setStat: (key, value) => {
        set((state) => {
          const runtime = applyInventoryRecalc(
            {
              ...state.runtime,
              stats: {
                ...state.runtime.stats,
                [key]: value
              }
            },
            state.content
          );
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      adjustStat: (key, delta) => {
        set((state) => {
          const runtime = applyInventoryRecalc(
            {
              ...state.runtime,
              stats: {
                ...state.runtime.stats,
                [key]: Number(state.runtime.stats[key] ?? 0) + delta
              }
            },
            state.content
          );
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      grantItem: (itemId, quantity = 1) => {
        set((state) => {
          const runtime = applyInventoryRecalc(
            {
              ...state.runtime,
              inventory: {
                ...state.runtime.inventory,
                quantities: {
                  ...state.runtime.inventory.quantities,
                  [itemId]: (state.runtime.inventory.quantities[itemId] ?? 0) + quantity
                }
              }
            },
            state.content
          );
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      removeItem: (itemId, quantity = 1) => {
        const state = get();
        const current = state.runtime.inventory.quantities[itemId] ?? 0;
        if (current < quantity) {
          return false;
        }

        set((snapshot) => {
          const runtime = applyInventoryRecalc(
            {
              ...snapshot.runtime,
              inventory: {
                ...snapshot.runtime.inventory,
                quantities: {
                  ...snapshot.runtime.inventory.quantities,
                  [itemId]: current - quantity
                }
              }
            },
            snapshot.content
          );
          const synced = syncActiveSlot(snapshot, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
        return true;
      },

      setScreen: (screenId, screenType) => {
        set((state) => {
          const runtime = {
            ...state.runtime,
            current_screen_id: screenId,
            ui_screen: screenType
          };
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      toggleOverlay: (key, open) => {
        set((state) => {
          const runtime = {
            ...state.runtime,
            overlays: {
              ...state.runtime.overlays,
              [key]: open ?? !state.runtime.overlays[key]
            }
          };
          const synced = syncActiveSlot(state, runtime);
          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      recomputeObjectives: (chapterId) => {
        const state = get();
        const content = state.content;
        if (!content) {
          return;
        }

        const targetChapterId = chapterId ?? state.runtime.current_chapter_id;
        const chapter = content.chapters[targetChapterId];
        if (!chapter) {
          return;
        }

        set((snapshot) => {
          if (!snapshot.content?.chapters[targetChapterId]) {
            return {};
          }
          const runtime = recomputeObjectivesForRuntime(snapshot.runtime, snapshot.content, targetChapterId);
          const synced = syncActiveSlot(snapshot, runtime);

          return {
            runtime,
            active_save_slot_id: synced.activeSaveSlotId,
            save_slots: synced.saveSlots
          };
        });
      },

      pushWarning: (warning) => {
        set((state) => ({
          warnings: trimWarnings([
            ...state.warnings,
            typeof warning === "string" ? makeWarning(warning, "manual") : warning
          ])
        }));
      }
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        active_save_slot_id: state.active_save_slot_id,
        save_slots: state.save_slots,
        runtime: state.runtime
      }),
      merge: (persistedState, currentState) => {
        const typedPersisted = persistedState as Partial<GameStoreState> | undefined;
        const runtime = sanitizeRuntime(typedPersisted?.runtime ?? currentState.runtime);
        const saveSlots = ensureSaveSlots(typedPersisted?.save_slots ?? currentState.save_slots, runtime);
        const activeSaveSlotId = coerceActiveSlotId(
          typedPersisted?.active_save_slot_id ?? currentState.active_save_slot_id,
          saveSlots
        );

        return {
          ...currentState,
          runtime,
          save_slots: saveSlots,
          active_save_slot_id: activeSaveSlotId
        };
      }
    }
  )
);

export function selectCurrentChapter(state: GameStoreState): ChapterDefinition | null {
  return currentChapter(state.content, state.runtime);
}

export function selectCurrentUiFlow(state: GameStoreState): UIFlow | null {
  return state.content?.ui_flows[state.runtime.current_chapter_id] ?? null;
}

export function selectCurrentEvent(state: GameStoreState): EventDefinition | null {
  return currentEvent(state.content, state.runtime);
}

export function selectCurrentVisitState(state: GameStoreState): EventVisitState | null {
  const chapterVisits = state.runtime.visited_events[state.runtime.current_chapter_id] ?? {};
  return state.runtime.current_event_id ? chapterVisits[state.runtime.current_event_id] ?? null : null;
}
