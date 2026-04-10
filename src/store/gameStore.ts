import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNamespacedStorageKey } from "../../packages/game-engine/src";
import { getChapterCatalogEntry } from "../../packages/world-registry/src";
import { CURRENT_APP_ID, CURRENT_PART_ID, CURRENT_PART_START_CHAPTER, CURRENT_SAVE_NAMESPACE } from "../app/appContext";
import { getPart1EndingDefinition } from "../content/part1Endings";
import { createBattleState, resolveBattleTurn } from "../engine/battleResolver";
import { canSelectChoice, canTriggerEvent, evaluateCondition, findScreenByType, resolveSpecialScreenType } from "../engine/requirements";
import { applyEffects } from "../engine/rewards";
import { loadPack } from "../loaders/contentLoader";
import type {
  BattleAction,
  ChapterDefinition,
  ChapterId,
  EndingId,
  EventChoice,
  EventDefinition,
  EventVisitState,
  GameContentPack,
  LootDrop,
  RuntimeSnapshot,
  RuntimeWarning,
  UIScreenDefinition,
  UIScreenType
} from "../types/game";

type BootState = "idle" | "loading" | "ready" | "error";

interface GameState {
  appId: typeof CURRENT_APP_ID;
  partId: typeof CURRENT_PART_ID;
  bootState: BootState;
  bootError: string | null;
  content: GameContentPack | null;
  runtime: RuntimeSnapshot | null;
  warnings: RuntimeWarning[];
  selectedChoiceId: string | null;
  galleryReturnScreenId: string | null;
  bootstrapPack: () => Promise<void>;
  startRun: (chapterId?: ChapterId) => void;
  startMission: () => void;
  moveToNode: (nodeId: string) => void;
  selectChoice: (choiceId: string) => void;
  startBossCombat: () => void;
  toggleLootSelection: (itemId: string) => void;
  confirmLoot: () => void;
  resolveBattleAction: (action: BattleAction) => void;
  confirmResult: () => void;
  openEndingGallery: () => void;
  closeEndingGallery: () => void;
  resetRun: () => void;
}

const STORAGE_NAME = `${createNamespacedStorageKey(CURRENT_SAVE_NAMESPACE)}:runtime-v3`;
const BASE_EVENT_MINUTES = 2;
const BASE_CHOICE_MINUTES = 1;

function nowIso(): string {
  return new Date().toISOString();
}

function createIdleBattleState(): RuntimeSnapshot["battle_state"] {
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

function mergeWarnings(current: RuntimeWarning[], next: RuntimeWarning[]): RuntimeWarning[] {
  const all = [...current, ...next];
  return all.slice(Math.max(0, all.length - 60));
}

function getFarmingRewardMultiplier(completionCount: number): number {
  if (completionCount >= 5) {
    return 0.45;
  }
  if (completionCount >= 3) {
    return 0.7;
  }
  return 1;
}

function getPartChapterIds(content: GameContentPack): ChapterId[] {
  return content.chapter_order.filter((chapterId) => getChapterCatalogEntry(chapterId)?.part_id === CURRENT_PART_ID);
}

function getChapter(content: GameContentPack, chapterId: ChapterId): ChapterDefinition {
  return content.chapters[chapterId];
}

function buildInitialStats(content: GameContentPack): RuntimeSnapshot["stats"] {
  const stats = Object.fromEntries(
    Object.values(content.stats_registry).map((entry) => [entry.key, entry.default])
  ) as RuntimeSnapshot["stats"];

  stats["route.truth"] = "silence";
  stats["route.truth_score"] = 0;
  stats["route.compassion"] = "pragmatic";
  stats["route.compassion_score"] = 0;
  stats["route.control"] = "lock";
  stats["route.control_score"] = 0;
  stats["route.underworld"] = "clean";
  stats["route.underworld_score"] = 0;
  stats["route.strain"] = 0;
  stats["chapter.current"] = CURRENT_PART_START_CHAPTER;

  return stats;
}

function buildChapterProgress(content: GameContentPack, currentChapterId: ChapterId): RuntimeSnapshot["chapter_progress"] {
  const chapterProgress: RuntimeSnapshot["chapter_progress"] = {};
  for (const chapterId of getPartChapterIds(content)) {
    const chapter = getChapter(content, chapterId);
    chapterProgress[chapterId] = {
      status:
        chapterId === currentChapterId
          ? "in_progress"
          : chapterId < currentChapterId
            ? "completed"
            : chapterId === CURRENT_PART_START_CHAPTER
              ? "available"
              : "locked",
      started_at: chapterId === currentChapterId ? nowIso() : undefined,
      objective_completion: Object.fromEntries(chapter.objectives.map((objective) => [objective.objective_id, false]))
    };
  }

  return chapterProgress;
}

function buildQuestProgress(content: GameContentPack, currentChapterId: ChapterId): RuntimeSnapshot["quest_progress"] {
  const questProgress: RuntimeSnapshot["quest_progress"] = {};
  for (const chapterId of getPartChapterIds(content)) {
    const chapter = getChapter(content, chapterId);
    questProgress[chapterId] = Object.fromEntries(
      chapter.quest_tracks.map((track) => [
        track.quest_track_id,
        {
          quest_track_id: track.quest_track_id,
          kind: track.kind,
          unlocked: track.kind === "main" || chapterId === currentChapterId,
          status: track.kind === "main" && chapterId === currentChapterId ? "active" : "locked"
        }
      ])
    );
  }
  return questProgress;
}

function buildRunMetrics(content: GameContentPack): RuntimeSnapshot["run_metrics"] {
  return {
    chapter_minutes: Object.fromEntries(getPartChapterIds(content).map((chapterId) => [chapterId, 0])),
    total_minutes: 0,
    total_moves: 0,
    total_events: 0,
    total_choices: 0
  };
}

function addRunMinutes(runtime: RuntimeSnapshot, chapterId: ChapterId, minutes: number): void {
  const numeric = Math.max(0, Number(minutes) || 0);
  runtime.run_metrics.chapter_minutes[chapterId] = Number(runtime.run_metrics.chapter_minutes[chapterId] ?? 0) + numeric;
  runtime.run_metrics.total_minutes += numeric;
}

function sanitizeRuntimeMetrics(runtime: RuntimeSnapshot): void {
  const hp = Number(runtime.stats["hp"] ?? 0);
  const maxHp = Number(runtime.stats["max_hp"] ?? hp);
  runtime.stats["max_hp"] = Math.max(1, maxHp);
  runtime.stats["hp"] = Math.min(Math.max(0, hp), Number(runtime.stats["max_hp"]));
  runtime.stats["noise"] = Math.max(0, Number(runtime.stats["noise"] ?? 0));
  runtime.stats["contamination"] = Math.max(0, Number(runtime.stats["contamination"] ?? 0));
}

function buildRuntimeSnapshot(
  content: GameContentPack,
  chapterId: ChapterId,
  preserved: Pick<RuntimeSnapshot, "unlocked_endings" | "media_seen"> | null = null
): RuntimeSnapshot {
  const chapter = getChapter(content, chapterId);
  const uiFlow = content.ui_flows[chapterId];

  return {
    current_chapter_id: chapterId,
    current_node_id: chapter.entry_node_id,
    current_event_id: null,
    current_screen_id: uiFlow?.entry_screen_id ?? null,
    ui_screen: "chapter_briefing",
    overlays: {
      inventory: false,
      status: false,
      objectives: false,
      warnings: false
    },
    stats: buildInitialStats(content),
    flags: {
      "campaign.part_id": CURRENT_PART_ID,
      "campaign.app_id": CURRENT_APP_ID
    },
    inventory: {
      quantities: {},
      equipped: {},
      carry_weight_modifier: 0
    },
    chapter_progress: buildChapterProgress(content, chapterId),
    quest_progress: buildQuestProgress(content, chapterId),
    farming_progress: {},
    run_metrics: buildRunMetrics(content),
    visited_nodes: {},
    visited_events: {},
    loot_session: null,
    battle_state: createIdleBattleState(),
    chapter_outcome: null,
    unlocked_endings: preserved?.unlocked_endings ?? {},
    media_seen: preserved?.media_seen ?? {},
    part1_carry_flags: null,
    campaign_complete: false,
    run_seed: nowIso()
  };
}

function ensureRuntimeSnapshot(content: GameContentPack, runtime: RuntimeSnapshot): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  nextRuntime.quest_progress ??= {};
  nextRuntime.farming_progress ??= {};
  nextRuntime.run_metrics ??= {
    chapter_minutes: {},
    total_minutes: 0,
    total_moves: 0,
    total_events: 0,
    total_choices: 0
  };
  nextRuntime.run_metrics.chapter_minutes ??= {};
  nextRuntime.run_metrics.total_moves = Number(nextRuntime.run_metrics.total_moves ?? 0);
  nextRuntime.run_metrics.total_events = Number(nextRuntime.run_metrics.total_events ?? 0);
  nextRuntime.run_metrics.total_choices = Number(nextRuntime.run_metrics.total_choices ?? 0);

  for (const chapterId of getPartChapterIds(content)) {
    const chapter = getChapter(content, chapterId);
    nextRuntime.chapter_progress[chapterId] ??= {
      status: chapterId === nextRuntime.current_chapter_id ? "in_progress" : "available",
      objective_completion: Object.fromEntries(chapter.objectives.map((objective) => [objective.objective_id, false]))
    };
    nextRuntime.quest_progress[chapterId] ??= {};
    nextRuntime.farming_progress[chapterId] ??= {};
    nextRuntime.run_metrics.chapter_minutes[chapterId] = Number(nextRuntime.run_metrics.chapter_minutes[chapterId] ?? 0);

    for (const track of chapter.quest_tracks) {
      nextRuntime.quest_progress[chapterId][track.quest_track_id] ??= {
        quest_track_id: track.quest_track_id,
        kind: track.kind,
        unlocked: track.kind === "main" || chapterId === nextRuntime.current_chapter_id,
        status: track.kind === "main" && chapterId === nextRuntime.current_chapter_id ? "active" : "locked"
      };
    }
  }

  nextRuntime.run_metrics.total_minutes = Object.values(nextRuntime.run_metrics.chapter_minutes).reduce(
    (sum, value) => sum + Number(value ?? 0),
    0
  );
  updateObjectives(nextRuntime, content, []);
  sanitizeRuntimeMetrics(nextRuntime);
  return nextRuntime;
}

function findScreenDefinition(content: GameContentPack, chapterId: ChapterId, screenId: string | null): UIScreenDefinition | undefined {
  if (!screenId) {
    return undefined;
  }

  return content.ui_flows[chapterId]?.screens.find((screen) => screen.screen_id === screenId);
}

function findScreenIdByType(content: GameContentPack, chapterId: ChapterId, screenType: UIScreenType): string | null {
  return findScreenByType(content.ui_flows[chapterId], screenType)?.screen_id ?? null;
}

function markMediaSeen(runtime: RuntimeSnapshot, key: string | undefined): void {
  if (!key) {
    return;
  }

  if (!runtime.media_seen[key]) {
    runtime.media_seen[key] = nowIso();
  }
}

function markCurrentScreenMedia(runtime: RuntimeSnapshot, content: GameContentPack): void {
  const chapter = getChapter(content, runtime.current_chapter_id);
  const cinematic = chapter.chapter_cinematic;
  if (!cinematic) {
    return;
  }

  switch (runtime.ui_screen) {
    case "chapter_briefing":
      markMediaSeen(runtime, cinematic.still_art_key);
      markMediaSeen(runtime, cinematic.anchor_portrait_key);
      markMediaSeen(runtime, cinematic.support_portrait_key);
      break;
    case "world_map":
      markMediaSeen(runtime, cinematic.world_map_art_key);
      break;
    case "boss_intro":
    case "combat_arena":
      markMediaSeen(runtime, cinematic.boss_splash_key);
      break;
    case "result_summary":
      markMediaSeen(runtime, cinematic.result_card_art_key);
      break;
    default:
      break;
  }
}

function setScreen(runtime: RuntimeSnapshot, content: GameContentPack, screenType: UIScreenType, screenId?: string | null): void {
  runtime.ui_screen = screenType;
  runtime.current_screen_id = screenId ?? findScreenIdByType(content, runtime.current_chapter_id, screenType);
  markCurrentScreenMedia(runtime, content);
}

function updateObjectives(runtime: RuntimeSnapshot, content: GameContentPack, warnings: RuntimeWarning[]): void {
  const chapter = getChapter(content, runtime.current_chapter_id);
  const progress = runtime.chapter_progress[runtime.current_chapter_id];
  if (!progress) {
    return;
  }

  progress.objective_completion = Object.fromEntries(
    chapter.objectives.map((objective) => [
      objective.objective_id,
      objective.complete_when.every((condition) =>
        evaluateCondition(condition, runtime, warnings, `objective:${objective.objective_id}`)
      )
    ])
  );

  updateQuestProgress(runtime, content, warnings);
}

function updateQuestProgress(runtime: RuntimeSnapshot, content: GameContentPack, warnings: RuntimeWarning[]): void {
  const chapterId = runtime.current_chapter_id;
  const chapter = getChapter(content, chapterId);
  const chapterProgress = runtime.chapter_progress[chapterId];
  if (!chapterProgress) {
    return;
  }

  runtime.quest_progress[chapterId] ??= {};
  for (const track of chapter.quest_tracks) {
    const trackProgress = (runtime.quest_progress[chapterId][track.quest_track_id] ??= {
      quest_track_id: track.quest_track_id,
      kind: track.kind,
      unlocked: track.kind === "main",
      status: track.kind === "main" ? "active" : "locked"
    });

    const unlocked =
      track.kind === "main" ||
      !track.unlock_when ||
      track.unlock_when.every((condition) => evaluateCondition(condition, runtime, warnings, `quest:${track.quest_track_id}`));

    const completedByEvent =
      track.completion_event_id !== undefined
        ? (runtime.visited_events[chapterId]?.[track.completion_event_id]?.completed_count ?? 0) > 0
        : false;
    const objectiveIds = track.objective_ids ?? [];
    const completedByObjectives =
      objectiveIds.length > 0 && objectiveIds.every((objectiveId) => chapterProgress.objective_completion[objectiveId] === true);
    const shouldComplete = completedByEvent || completedByObjectives;

    let nextStatus: "locked" | "active" | "completed" = "locked";
    if (shouldComplete) {
      nextStatus = "completed";
    } else if (unlocked) {
      nextStatus = "active";
    }

    if (nextStatus !== "locked" && !trackProgress.started_at) {
      trackProgress.started_at = nowIso();
    }
    if (nextStatus === "completed" && !trackProgress.completed_at) {
      trackProgress.completed_at = nowIso();
    }

    trackProgress.unlocked = unlocked;
    trackProgress.status = nextStatus;
  }
}

function getOrCreateVisitState(runtime: RuntimeSnapshot, chapterId: ChapterId, eventId: string): EventVisitState {
  runtime.visited_events[chapterId] ??= {};
  runtime.visited_events[chapterId][eventId] ??= {
    seen_count: 0,
    completed_count: 0,
    entered_once: false
  };
  return runtime.visited_events[chapterId][eventId];
}

function recordNodeVisit(runtime: RuntimeSnapshot, chapterId: ChapterId, nodeId: string): void {
  runtime.visited_nodes[chapterId] ??= {};
  runtime.visited_nodes[chapterId][nodeId] = true;
  runtime.chapter_progress[chapterId] ??= {
    status: "in_progress",
    objective_completion: {}
  };
  runtime.chapter_progress[chapterId].last_visited_node_id = nodeId;
}

function findFirstAvailableEvent(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  chapterId: ChapterId,
  nodeId: string,
  warnings: RuntimeWarning[]
): EventDefinition | null {
  const chapter = getChapter(content, chapterId);
  const node = chapter.nodes_by_id[nodeId];
  if (!node) {
    warnings.push({
      message: `Node ${nodeId} is missing from ${chapterId}.`,
      source: "runtime",
      severity: "error"
    });
    return null;
  }

  for (const eventId of node.event_ids) {
    const event = chapter.events_by_id[eventId];
    if (event && canTriggerEvent(event, runtime, warnings)) {
      return event;
    }
  }

  return null;
}

function deriveEventScreenType(content: GameContentPack, runtime: RuntimeSnapshot, eventId: string): UIScreenType {
  const special = resolveSpecialScreenType(runtime.current_chapter_id, eventId, content.ui_flows[runtime.current_chapter_id]);
  if (special === "safehouse" || special === "route_select") {
    return special;
  }

  const chapter = getChapter(content, runtime.current_chapter_id);
  if (chapter.boss_event_id === eventId) {
    return "boss_intro";
  }

  return "event_dialogue";
}

function openEvent(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  event: EventDefinition,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  nextRuntime.current_event_id = event.event_id;
  nextRuntime.current_node_id = event.node_id;
  recordNodeVisit(nextRuntime, nextRuntime.current_chapter_id, event.node_id);

  const visitState = getOrCreateVisitState(nextRuntime, nextRuntime.current_chapter_id, event.event_id);
  visitState.seen_count += 1;
  nextRuntime.run_metrics.total_events += 1;
  addRunMinutes(nextRuntime, nextRuntime.current_chapter_id, BASE_EVENT_MINUTES);

  if (!visitState.entered_once && event.on_enter_effects.length > 0) {
    const effectResult = applyEffects(nextRuntime, content, event.on_enter_effects, `enter:${event.event_id}`);
    Object.assign(nextRuntime, effectResult.runtime);
    warnings.push(...effectResult.warnings);
  }

  visitState.entered_once = true;
  sanitizeRuntimeMetrics(nextRuntime);
  setScreen(nextRuntime, content, deriveEventScreenType(content, nextRuntime, event.event_id));
  updateObjectives(nextRuntime, content, warnings);
  return nextRuntime;
}

function summarizeChapter(runtime: RuntimeSnapshot, chapterId: ChapterId): string {
  const truth = String(runtime.stats["route.truth"] ?? "silence");
  const compassion = String(runtime.stats["route.compassion"] ?? "pragmatic");
  const control = String(runtime.stats["route.control"] ?? "lock");
  const strain = Number(runtime.stats["route.strain"] ?? 0);
  return `${chapterId} 종료. truth=${truth}, compassion=${compassion}, control=${control}, strain=${strain}.`;
}

function buildCarryFlags(runtime: RuntimeSnapshot, endingId: EndingId) {
  const evidenceComplete = Boolean(runtime.flags["part1_evidence_bundle_complete"]);
  const kimAraAlive = runtime.flags["ch05_kim_ara_alive"] === true;
  const base = getPart1EndingDefinition(endingId).carry_flags;

  return {
    ...base,
    truth_route: String(runtime.stats["route.truth"] ?? base.truth_route),
    compassion_route: String(runtime.stats["route.compassion"] ?? base.compassion_route),
    control_route: String(runtime.stats["route.control"] ?? base.control_route),
    underworld_route: String(runtime.stats["route.underworld"] ?? base.underworld_route),
    strain: Number(runtime.stats["route.strain"] ?? base.strain),
    kim_ara_alive: kimAraAlive,
    evidence_bundle_complete: evidenceComplete
  };
}

function resolveEndingId(content: GameContentPack, runtime: RuntimeSnapshot, warnings: RuntimeWarning[]): EndingId {
  const chapter = getChapter(content, runtime.current_chapter_id);
  const evidenceComplete =
    runtime.flags["part1_evidence_ch01"] === true &&
    runtime.flags["part1_evidence_ch02"] === true &&
    runtime.flags["part1_evidence_ch03"] === true &&
    runtime.flags["part1_evidence_ch04"] === true;

  runtime.flags["part1_evidence_bundle_complete"] = evidenceComplete;

  const orderedRules = [...chapter.ending_matrix].sort((left, right) => right.priority - left.priority);
  for (const rule of orderedRules) {
    const matched = rule.conditions.every((condition) =>
      evaluateCondition(condition, runtime, warnings, `ending:${rule.ending_id}`)
    );
    if (matched) {
      return rule.ending_id;
    }
  }

  return "P1_END_ASHEN_ESCAPE";
}

function finalizeChapterOutcome(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  endToken: string,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  const chapterId = nextRuntime.current_chapter_id;
  const chapter = getChapter(content, chapterId);
  const chapterEntry = getChapterCatalogEntry(chapterId);
  const progress = nextRuntime.chapter_progress[chapterId];
  if (progress) {
    progress.status = "completed";
    progress.completed_at = nowIso();
    progress.ended_by = endToken;
  }

  if (chapterId === "CH05") {
    const endingId = resolveEndingId(content, nextRuntime, warnings);
    const endingDef = getPart1EndingDefinition(endingId);
    const carryFlags = buildCarryFlags(nextRuntime, endingId);
    const unlockedAt = nextRuntime.unlocked_endings[endingId] ?? nowIso();

    nextRuntime.unlocked_endings[endingId] = unlockedAt;
    nextRuntime.part1_carry_flags = carryFlags;
    nextRuntime.flags["part1.ending_id"] = endingId;
    nextRuntime.chapter_outcome = {
      chapter_id: chapterId,
      title: chapter.title,
      summary: endingDef.summary,
      next_chapter_id: chapterEntry?.next_chapter_id,
      campaign_complete: true,
      ending_id: endingDef.ending_id,
      ending_title: endingDef.title,
      carry_flags: carryFlags
    };
    nextRuntime.campaign_complete = true;
    markMediaSeen(nextRuntime, endingDef.art_key);
    markMediaSeen(nextRuntime, endingDef.thumb_key);
  } else {
    nextRuntime.chapter_outcome = {
      chapter_id: chapterId,
      title: chapter.title,
      summary: summarizeChapter(nextRuntime, chapterId),
      next_chapter_id: chapterEntry?.next_chapter_id,
      campaign_complete: false
    };
  }

  nextRuntime.current_event_id = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = createIdleBattleState();
  setScreen(nextRuntime, content, "result_summary");
  updateObjectives(nextRuntime, content, warnings);
  return nextRuntime;
}

function continueFromNextTarget(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  nextEventId: string | null | undefined,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  if (!nextEventId) {
    const nextRuntime = structuredClone(runtime);
    nextRuntime.current_event_id = null;
    nextRuntime.loot_session = null;
    setScreen(nextRuntime, content, "world_map");
    return nextRuntime;
  }

  if (nextEventId.startsWith("END_")) {
    return finalizeChapterOutcome(content, runtime, nextEventId, warnings);
  }

  const event = getChapter(content, runtime.current_chapter_id).events_by_id[nextEventId];
  if (!event) {
    warnings.push({
      message: `Next event ${nextEventId} is missing.`,
      source: "runtime",
      severity: "warning"
    });
    const nextRuntime = structuredClone(runtime);
    setScreen(nextRuntime, content, "world_map");
    return nextRuntime;
  }

  return openEvent(content, runtime, event, warnings);
}

function applyLootDrops(runtime: RuntimeSnapshot): void {
  if (!runtime.loot_session) {
    return;
  }

  for (const drop of runtime.loot_session.drops) {
    if (!drop.selected) {
      continue;
    }

    runtime.inventory.quantities[drop.item_id] = (runtime.inventory.quantities[drop.item_id] ?? 0) + drop.quantity;
  }
}

function applyRepeatFarmingPenalty(
  runtime: RuntimeSnapshot,
  chapterId: ChapterId,
  event: EventDefinition,
  completionCount: number
): void {
  runtime.farming_progress[chapterId] ??= {};
  runtime.farming_progress[chapterId][event.event_id] = completionCount;

  if (!event.repeatable || completionCount < 3) {
    return;
  }

  runtime.stats["noise"] = Number(runtime.stats["noise"] ?? 0) + 1;
  if (completionCount >= 5) {
    runtime.stats["contamination"] = Number(runtime.stats["contamination"] ?? 0) + 1;
  }
  sanitizeRuntimeMetrics(runtime);
}

function finalizeEventChoice(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  event: EventDefinition,
  choice: EventChoice,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const previousCompletedCount =
    runtime.visited_events[runtime.current_chapter_id]?.[event.event_id]?.completed_count ?? 0;
  const completionCount = previousCompletedCount + 1;
  const rewardMultiplier = event.repeatable ? getFarmingRewardMultiplier(completionCount) : 1;
  const effectResult = applyEffects(
    runtime,
    content,
    [...choice.effects, ...event.on_complete_effects],
    `choice:${choice.choice_id}`,
    { rewardMultiplier }
  );
  let nextRuntime = effectResult.runtime;
  warnings.push(...effectResult.warnings);

  const visitState = getOrCreateVisitState(nextRuntime, nextRuntime.current_chapter_id, event.event_id);
  visitState.completed_count += 1;
  visitState.last_choice_id = choice.choice_id;
  nextRuntime.run_metrics.total_choices += 1;
  addRunMinutes(nextRuntime, nextRuntime.current_chapter_id, BASE_CHOICE_MINUTES);
  applyRepeatFarmingPenalty(nextRuntime, nextRuntime.current_chapter_id, event, visitState.completed_count);

  updateObjectives(nextRuntime, content, warnings);

  const nextEventId = choice.next_event_id ?? event.next_event_id ?? null;
  if (effectResult.grantedLoot.length > 0) {
    nextRuntime.loot_session = {
      loot_table_id: `${event.event_id}:granted`,
      source_chapter_id: nextRuntime.current_chapter_id,
      source_node_id: event.node_id,
      source_event_id: event.event_id,
      drops: effectResult.grantedLoot.map((drop: LootDrop) => ({ ...drop })),
      pending_next_event_id: nextEventId,
      return_screen: "world_map"
    };
    setScreen(nextRuntime, content, "loot_resolution");
    return nextRuntime;
  }

  return continueFromNextTarget(content, nextRuntime, nextEventId, warnings);
}

function createChapterStartRuntime(content: GameContentPack, runtime: RuntimeSnapshot, chapterId: ChapterId): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  const chapter = getChapter(content, chapterId);
  nextRuntime.current_chapter_id = chapterId;
  nextRuntime.current_node_id = chapter.entry_node_id;
  nextRuntime.current_event_id = null;
  nextRuntime.chapter_outcome = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = createIdleBattleState();
  nextRuntime.campaign_complete = false;
  nextRuntime.stats["chapter.current"] = chapterId;

  nextRuntime.chapter_progress[chapterId] ??= {
    status: "available",
    objective_completion: Object.fromEntries(chapter.objectives.map((objective) => [objective.objective_id, false]))
  };
  nextRuntime.chapter_progress[chapterId].status = "in_progress";
  nextRuntime.chapter_progress[chapterId].started_at ??= nowIso();
  nextRuntime.quest_progress[chapterId] ??= Object.fromEntries(
    chapter.quest_tracks.map((track) => [
      track.quest_track_id,
      {
        quest_track_id: track.quest_track_id,
        kind: track.kind,
        unlocked: track.kind === "main",
        status: track.kind === "main" ? "active" : "locked"
      }
    ])
  );
  nextRuntime.farming_progress[chapterId] ??= {};
  nextRuntime.run_metrics.chapter_minutes[chapterId] = Number(nextRuntime.run_metrics.chapter_minutes[chapterId] ?? 0);
  setScreen(nextRuntime, content, "chapter_briefing", content.ui_flows[chapterId]?.entry_screen_id ?? null);
  updateObjectives(nextRuntime, content, []);
  return nextRuntime;
}

const initialState: Omit<
  GameState,
  | "bootstrapPack"
  | "startRun"
  | "startMission"
  | "moveToNode"
  | "selectChoice"
  | "startBossCombat"
  | "toggleLootSelection"
  | "confirmLoot"
  | "resolveBattleAction"
  | "confirmResult"
  | "openEndingGallery"
  | "closeEndingGallery"
  | "resetRun"
> = {
  appId: CURRENT_APP_ID,
  partId: CURRENT_PART_ID,
  bootState: "idle",
  bootError: null,
  content: null,
  runtime: null,
  warnings: [],
  selectedChoiceId: null,
  galleryReturnScreenId: null
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      bootstrapPack: async () => {
        if (get().bootState === "loading" || get().content) {
          return;
        }

        set({ bootState: "loading", bootError: null });
        try {
          const content = await loadPack();
          const persistedRuntime = get().runtime;
          const runtime =
            persistedRuntime && content.chapters[persistedRuntime.current_chapter_id]
              ? ensureRuntimeSnapshot(content, persistedRuntime)
              : buildRuntimeSnapshot(content, CURRENT_PART_START_CHAPTER, null);

          set({
            bootState: "ready",
            content,
            runtime,
            warnings: content.warnings
          });
        } catch (error) {
          set({
            bootState: "error",
            bootError: error instanceof Error ? error.message : String(error)
          });
        }
      },

      startRun: (chapterId = CURRENT_PART_START_CHAPTER) => {
        const { content, runtime } = get();
        if (!content) {
          return;
        }

        const freshRuntime = buildRuntimeSnapshot(content, chapterId, {
          unlocked_endings: runtime?.unlocked_endings ?? {},
          media_seen: runtime?.media_seen ?? {}
        });
        set({
          runtime: freshRuntime,
          selectedChoiceId: null,
          galleryReturnScreenId: null,
          warnings: []
        });
      },

      startMission: () => {
        const { content, runtime } = get();
        if (!content || !runtime) {
          return;
        }

        const nextRuntime = structuredClone(runtime);
        setScreen(nextRuntime, content, "world_map");
        updateObjectives(nextRuntime, content, []);
        set({ runtime: nextRuntime });
      },

      moveToNode: (nodeId) => {
        const { content, runtime, warnings } = get();
        if (!content || !runtime) {
          return;
        }

        const chapterId = runtime.current_chapter_id;
        const chapter = getChapter(content, chapterId);
        const localWarnings: RuntimeWarning[] = [];
        const nextRuntime = structuredClone(runtime);
        const currentNodeId = runtime.current_node_id;

        if (!chapter.nodes_by_id[nodeId]) {
          localWarnings.push({
            message: `Cannot move to missing node ${nodeId}.`,
            source: "moveToNode",
            severity: "warning"
          });
          set({
            runtime,
            warnings: mergeWarnings(warnings, localWarnings),
            selectedChoiceId: null
          });
          return;
        }

        if (currentNodeId && currentNodeId !== nodeId) {
          const currentNode = chapter.nodes_by_id[currentNodeId];
          const connection = currentNode?.connections.find((entry) => entry.to === nodeId);
          if (!connection) {
            localWarnings.push({
              message: `Route ${currentNodeId} -> ${nodeId} is not connected.`,
              source: "moveToNode",
              severity: "warning"
            });
            set({
              runtime,
              warnings: mergeWarnings(warnings, localWarnings),
              selectedChoiceId: null
            });
            return;
          }

          const canTraverse = connection.requires.every((condition) =>
            evaluateCondition(condition, nextRuntime, localWarnings, `connection:${currentNodeId}->${nodeId}`)
          );
          if (!canTraverse) {
            localWarnings.push({
              message: `Route ${currentNodeId} -> ${nodeId} requirements are not met.`,
              source: "moveToNode",
              severity: "warning"
            });
            set({
              runtime,
              warnings: mergeWarnings(warnings, localWarnings),
              selectedChoiceId: null
            });
            return;
          }

          nextRuntime.stats["noise"] = Number(nextRuntime.stats["noise"] ?? 0) + Number(connection.cost.noise ?? 0);
          nextRuntime.stats["contamination"] =
            Number(nextRuntime.stats["contamination"] ?? 0) + Number(connection.cost.contamination ?? 0);
          nextRuntime.run_metrics.total_moves += 1;
          addRunMinutes(nextRuntime, chapterId, Number(connection.cost.time ?? 0));
          sanitizeRuntimeMetrics(nextRuntime);
        }

        nextRuntime.current_node_id = nodeId;
        recordNodeVisit(nextRuntime, chapterId, nodeId);

        const event = findFirstAvailableEvent(content, nextRuntime, chapterId, nodeId, localWarnings);
        if (!event) {
          setScreen(nextRuntime, content, "world_map");
          set({
            runtime: nextRuntime,
            warnings: mergeWarnings(warnings, localWarnings),
            selectedChoiceId: null
          });
          return;
        }

        const openedRuntime = openEvent(content, nextRuntime, event, localWarnings);
        set({
          runtime: openedRuntime,
          warnings: mergeWarnings(warnings, localWarnings),
          selectedChoiceId: null
        });
      },

      selectChoice: (choiceId) => {
        const { content, runtime, warnings } = get();
        if (!content || !runtime || !runtime.current_event_id) {
          return;
        }

        const localWarnings: RuntimeWarning[] = [];
        const chapter = getChapter(content, runtime.current_chapter_id);
        const event = chapter.events_by_id[runtime.current_event_id];
        const choice = event?.choices.find((entry) => entry.choice_id === choiceId);
        if (!event || !choice) {
          return;
        }

        if (!canSelectChoice(event.event_id, choiceId, runtime, content, localWarnings)) {
          set({ warnings: mergeWarnings(warnings, localWarnings) });
          return;
        }

        if (runtime.ui_screen === "boss_intro" && event.combat) {
          set({
            selectedChoiceId: choiceId,
            warnings: mergeWarnings(warnings, localWarnings)
          });
          return;
        }

        if (event.combat) {
          const battleResult = createBattleState(runtime, content, event.combat.encounter_table_id, {
            arena_tags: event.combat.arena_tags ?? [],
            boss_id: event.combat.boss_id,
            pending_choice_effects: choice.effects,
            pending_choice_id: choice.choice_id,
            pending_next_event_id: choice.next_event_id,
            source_event_id: event.event_id,
            victory_effects: [...event.combat.victory_effects, ...event.on_complete_effects],
            defeat_effects: event.combat.defeat_effects
          });

          const nextRuntime = structuredClone(runtime);
          nextRuntime.battle_state = battleResult.battleState;
          setScreen(nextRuntime, content, "combat_arena");
          set({
            runtime: nextRuntime,
            selectedChoiceId: choiceId,
            warnings: mergeWarnings(warnings, [...localWarnings, ...battleResult.warnings])
          });
          return;
        }

        const nextRuntime = finalizeEventChoice(content, runtime, event, choice, localWarnings);
        set({
          runtime: nextRuntime,
          selectedChoiceId: null,
          warnings: mergeWarnings(warnings, localWarnings)
        });
      },

      startBossCombat: () => {
        const { content, runtime, selectedChoiceId, warnings } = get();
        if (!content || !runtime || !runtime.current_event_id || !selectedChoiceId) {
          return;
        }

        const chapter = getChapter(content, runtime.current_chapter_id);
        const event = chapter.events_by_id[runtime.current_event_id];
        const choice = event?.choices.find((entry) => entry.choice_id === selectedChoiceId);
        if (!event || !choice || !event.combat) {
          return;
        }

        const battleResult = createBattleState(runtime, content, event.combat.encounter_table_id, {
          arena_tags: event.combat.arena_tags ?? [],
          boss_id: event.combat.boss_id,
          pending_choice_effects: choice.effects,
          pending_choice_id: choice.choice_id,
          pending_next_event_id: choice.next_event_id,
          source_event_id: event.event_id,
          victory_effects: [...event.combat.victory_effects, ...event.on_complete_effects],
          defeat_effects: event.combat.defeat_effects
        });

        const nextRuntime = structuredClone(runtime);
        nextRuntime.battle_state = battleResult.battleState;
        setScreen(nextRuntime, content, "combat_arena");
        set({
          runtime: nextRuntime,
          warnings: mergeWarnings(warnings, battleResult.warnings)
        });
      },

      toggleLootSelection: (itemId) => {
        const { runtime } = get();
        if (!runtime?.loot_session) {
          return;
        }

        const nextRuntime = structuredClone(runtime);
        const drop = nextRuntime.loot_session?.drops.find((entry) => entry.item_id === itemId);
        if (drop) {
          drop.selected = !drop.selected;
        }

        set({ runtime: nextRuntime });
      },

      confirmLoot: () => {
        const { content, runtime, warnings } = get();
        if (!content || !runtime?.loot_session) {
          return;
        }

        const localWarnings: RuntimeWarning[] = [];
        const nextRuntime = structuredClone(runtime);
        applyLootDrops(nextRuntime);
        const nextEventId = nextRuntime.loot_session?.pending_next_event_id;
        nextRuntime.loot_session = null;
        const routedRuntime = continueFromNextTarget(content, nextRuntime, nextEventId, localWarnings);
        set({
          runtime: routedRuntime,
          warnings: mergeWarnings(warnings, localWarnings)
        });
      },

      resolveBattleAction: (action) => {
        const { content, runtime, warnings } = get();
        if (!content || !runtime) {
          return;
        }

        const turnResult = resolveBattleTurn(runtime, action);
        const localWarnings = [...turnResult.warnings];
        let nextRuntime = turnResult.runtime;

        if (turnResult.outcome === "victory") {
          const currentEventId = nextRuntime.battle_state.source_event_id ?? nextRuntime.current_event_id;
          const event = currentEventId
            ? getChapter(content, nextRuntime.current_chapter_id).events_by_id[currentEventId]
            : null;

          if (event) {
            const choice = event.choices.find(
              (entry) => entry.choice_id === nextRuntime.battle_state.pending_choice_id
            );
            const previousCompletedCount =
              nextRuntime.visited_events[nextRuntime.current_chapter_id]?.[event.event_id]?.completed_count ?? 0;
            const completionCount = previousCompletedCount + 1;
            const rewardMultiplier = event.repeatable ? getFarmingRewardMultiplier(completionCount) : 1;
            const effectResult = applyEffects(
              nextRuntime,
              content,
              [...nextRuntime.battle_state.pending_choice_effects, ...nextRuntime.battle_state.victory_effects],
              `battle:${event.event_id}:victory`,
              { rewardMultiplier }
            );
            nextRuntime = effectResult.runtime;
            localWarnings.push(...effectResult.warnings);

            const visitState = getOrCreateVisitState(nextRuntime, nextRuntime.current_chapter_id, event.event_id);
            visitState.completed_count += 1;
            visitState.last_choice_id = choice?.choice_id;
            nextRuntime.run_metrics.total_choices += 1;
            addRunMinutes(nextRuntime, nextRuntime.current_chapter_id, BASE_CHOICE_MINUTES);
            applyRepeatFarmingPenalty(nextRuntime, nextRuntime.current_chapter_id, event, visitState.completed_count);
            nextRuntime.battle_state = createIdleBattleState();
            updateObjectives(nextRuntime, content, localWarnings);

            if (effectResult.grantedLoot.length > 0) {
              nextRuntime.loot_session = {
                loot_table_id: `${event.event_id}:victory`,
                source_chapter_id: nextRuntime.current_chapter_id,
                source_node_id: event.node_id,
                source_event_id: event.event_id,
                drops: effectResult.grantedLoot.map((drop) => ({ ...drop })),
                pending_next_event_id: choice?.next_event_id ?? event.next_event_id ?? null,
                return_screen: "world_map"
              };
              setScreen(nextRuntime, content, "loot_resolution");
            } else {
              nextRuntime = continueFromNextTarget(
                content,
                nextRuntime,
                choice?.next_event_id ?? event.next_event_id ?? null,
                localWarnings
              );
            }
          }
        } else if (turnResult.outcome === "defeat") {
          const effectResult = applyEffects(
            nextRuntime,
            content,
            nextRuntime.battle_state.defeat_effects,
            `battle:${nextRuntime.battle_state.source_event_id ?? "unknown"}:defeat`
          );
          nextRuntime = effectResult.runtime;
          localWarnings.push(...effectResult.warnings);
          nextRuntime.battle_state = createIdleBattleState();
          nextRuntime.current_event_id = null;
          setScreen(nextRuntime, content, "world_map");
        }

        set({
          runtime: nextRuntime,
          warnings: mergeWarnings(warnings, localWarnings)
        });
      },

      confirmResult: () => {
        const { content, runtime } = get();
        if (!content || !runtime?.chapter_outcome) {
          return;
        }

        if (runtime.chapter_outcome.ending_id) {
          get().openEndingGallery();
          return;
        }

        const nextChapterId = runtime.chapter_outcome.next_chapter_id;
        if (nextChapterId && getChapterCatalogEntry(nextChapterId)?.part_id === CURRENT_PART_ID) {
          const nextRuntime = createChapterStartRuntime(content, runtime, nextChapterId);
          set({
            runtime: nextRuntime,
            selectedChoiceId: null,
            galleryReturnScreenId: null
          });
          return;
        }

        get().openEndingGallery();
      },

      openEndingGallery: () => {
        const { content, runtime } = get();
        if (!content || !runtime) {
          return;
        }

        const nextRuntime = structuredClone(runtime);
        const fallbackScreenId = nextRuntime.current_screen_id ?? findScreenIdByType(content, "CH05", "result_summary");
        setScreen(nextRuntime, content, "ending_gallery", findScreenIdByType(content, "CH05", "ending_gallery"));
        set({
          runtime: nextRuntime,
          galleryReturnScreenId: fallbackScreenId
        });
      },

      closeEndingGallery: () => {
        const { content, runtime, galleryReturnScreenId } = get();
        if (!content || !runtime) {
          return;
        }

        const nextRuntime = structuredClone(runtime);
        const hasEnding = Boolean(nextRuntime.chapter_outcome?.ending_id);
        const returnScreenId = hasEnding
          ? findScreenIdByType(content, "CH05", "result_summary")
          : galleryReturnScreenId ?? content.ui_flows[nextRuntime.current_chapter_id]?.entry_screen_id ?? null;
        const returnChapterId = hasEnding ? ("CH05" as ChapterId) : nextRuntime.current_chapter_id;
        const returnScreen = findScreenDefinition(content, returnChapterId, returnScreenId);
        nextRuntime.current_screen_id = returnScreen?.screen_id ?? returnScreenId ?? null;
        nextRuntime.ui_screen = (returnScreen?.screen_type ?? "chapter_briefing") as UIScreenType;
        markCurrentScreenMedia(nextRuntime, content);

        set({
          runtime: nextRuntime,
          galleryReturnScreenId: null
        });
      },

      resetRun: () => {
        get().startRun(CURRENT_PART_START_CHAPTER);
      }
    }),
    {
      name: STORAGE_NAME,
      version: 3,
      partialize: (state) => ({
        runtime: state.runtime
      })
    }
  )
);
