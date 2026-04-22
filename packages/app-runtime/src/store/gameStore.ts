import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNamespacedStorageKey } from "@donggrol/game-engine";
import { getChapterCatalogEntry } from "@donggrol/world-registry";
import { CURRENT_APP_ID, CURRENT_PART_ID, CURRENT_PART_START_CHAPTER, CURRENT_SAVE_NAMESPACE } from "../app/appContext";
import { getPart1EndingDefinition } from "../content/part1Endings";
import { createBattleState, resolveBattleTurn } from "../engine/battleResolver";
import {
  canSelectChoice,
  canTriggerEvent,
  evaluateCondition,
  findScreenByType,
  resolveSpecialScreenId,
  resolveSpecialScreenType,
  resolveTransitionTarget
} from "../engine/requirements";
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
  StoryLogEntry,
  RuntimeWarning,
  UIScreenDefinition,
  UIScreenType
} from "../types/game";

type BootState = "idle" | "loading" | "ready" | "error";

interface ChapterResultPayload {
  chapter_id: ChapterId;
  ended_by: string;
  selected_route?: string;
  title?: string;
  summary?: string;
  carry_line?: string;
  chapter_minutes: number;
  total_minutes: number;
  objective_summary: Array<{
    objective_id: string;
    text: string;
    required: boolean;
    completed: boolean;
  }>;
  quest_summary: Array<{
    quest_track_id: string;
    title: string;
    kind: "main" | "side";
    status: "locked" | "active" | "completed";
  }>;
  widget_state: Record<string, string | number | boolean>;
  active_flags: string[];
  notes?: string[];
  epilogue_card_ids?: string[];
}

interface EndingGalleryRuntimeEntry {
  ending_id: string;
  chapter_id: ChapterId;
  title: string;
  summary: string;
  hint: string;
  art_key: string;
  thumb_key: string;
  video_id?: string;
  unlocked_at?: string;
}

interface FailStateSnapshot {
  source_event_id?: string | null;
  reason: "fail" | "setback";
  failed_at: string;
}

type ExtendedRuntimeSnapshot = Omit<
  RuntimeSnapshot,
  "chapter_result_payload" | "ending_gallery" | "route_unlocks" | "node_unlocks" | "field_actions_remaining" | "fail_state" | "chapter_widgets_state"
> & {
  chapter_result_payload?: ChapterResultPayload | null;
  ending_gallery?: Record<string, EndingGalleryRuntimeEntry>;
  route_unlocks?: Record<string, boolean>;
  node_unlocks?: Record<string, boolean>;
  field_actions_remaining?: number | Record<ChapterId, number>;
  fail_state?: FailStateSnapshot | null;
  chapter_widgets_state?: Record<ChapterId, Record<string, { widget_id: string; value: string | number | boolean }>>;
};

type ExtendedChapterOutcome = NonNullable<RuntimeSnapshot["chapter_outcome"]> & {
  chapter_result_payload?: ChapterResultPayload;
  gallery_chapter_id?: ChapterId;
  result_variant?: string;
};

interface AuthoredOutcomeSource {
  title?: string;
  summary?: string;
  carryLine?: string;
  speakerLabels: string[];
  resultVariant?: string;
}

interface FlowTarget {
  nextEventId?: string | null;
  nextNodeId?: string | null;
  failEventId?: string | null;
  setbackEventId?: string | null;
  mode?: "default" | "fail" | "setback";
}

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
  proceedHub: () => void;
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

function asExtendedRuntime(runtime: RuntimeSnapshot): ExtendedRuntimeSnapshot {
  return runtime as ExtendedRuntimeSnapshot;
}

function buildGenericEndingArtKey(endingId: string): string {
  return `ending_${endingId.toLowerCase().replace(/_end_/u, "_")}`;
}

function buildGenericEndingThumbKey(endingId: string): string {
  return `ending_thumb_${endingId.toLowerCase().replace(/_end_/u, "_")}`;
}

function getChapterCompletionFlag(chapterId: ChapterId): string {
  return `chapter_${chapterId.slice(2)}_completed`;
}

function isChapterMarkedComplete(runtime: RuntimeSnapshot, chapterId: ChapterId): boolean {
  return runtime.flags[getChapterCompletionFlag(chapterId)] === true || runtime.chapter_progress[chapterId]?.status === "completed";
}

function readFlowLink(source: unknown, key: string): string | null | undefined {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const value = (source as Record<string, unknown>)[key];
  if (typeof value === "string") {
    return value;
  }

  if (value === null) {
    return null;
  }

  return undefined;
}

function buildChoiceFlowTarget(event: EventDefinition, choice?: EventChoice | null, mode: FlowTarget["mode"] = "default"): FlowTarget {
  return {
    mode,
    nextEventId: choice?.next_event_id ?? event.next_event_id ?? null,
    nextNodeId: readFlowLink(choice, "next_node_id") ?? readFlowLink(event, "next_node_id") ?? null,
    failEventId: readFlowLink(choice, "fail_event_id") ?? event.fail_event_id ?? readFlowLink(event, "fail_event_id") ?? null,
    setbackEventId: readFlowLink(choice, "setback_event_id") ?? readFlowLink(event, "setback_event_id") ?? null
  };
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

function compactNarrativeText(value: string | null | undefined): string {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

function summarizeNarrative(text: string | null | undefined, fallback: string): string {
  const normalized = compactNarrativeText(text) || fallback;
  return normalized.length > 140 ? `${normalized.slice(0, 140).trimEnd()}...` : normalized;
}

function getSceneBlockLines(event: EventDefinition): string[] {
  return (event.text.scene_blocks ?? [])
    .flatMap((block) => block.lines)
    .map((line) => compactNarrativeText(line))
    .filter(Boolean);
}

function getEventStorySummary(event: EventDefinition, fallback?: string): string {
  const source = [
    getSceneBlockLines(event).join(" "),
    event.text.body.join(" "),
    event.text.summary,
    event.text.carry_line,
    fallback,
    event.title
  ].find((candidate) => compactNarrativeText(candidate).length > 0);

  return summarizeNarrative(source, fallback ?? event.text.summary ?? event.title);
}

function getEventSpeakerLabels(event: EventDefinition): string[] {
  const labels = new Set(
    (event.text.scene_blocks ?? [])
      .map((block) => compactNarrativeText(block.speaker_label))
      .filter(Boolean)
  );

  return [...labels];
}

function isOutcomeBoundaryEvent(event: EventDefinition, endToken: string): boolean {
  return (
    typeof event.presentation?.result_variant === "string" ||
    (typeof event.next_event_id === "string" && (event.next_event_id === endToken || event.next_event_id.startsWith("END_"))) ||
    (event.choices ?? []).some(
      (choice) => typeof choice.next_event_id === "string" && (choice.next_event_id === endToken || choice.next_event_id.startsWith("END_"))
    ) ||
    /(?:RESULT|EXTRACTION|BOSS|RESOLVED)/u.test(event.event_id)
  );
}

function getAuthoredOutcomeSummary(event: EventDefinition): string {
  const authoredSummary = compactNarrativeText(event.text.summary);
  if (authoredSummary) {
    return summarizeNarrative(authoredSummary, event.title);
  }

  return getEventStorySummary(event, event.title);
}

function resolveAuthoredOutcomeSource(
  chapter: ChapterDefinition,
  runtime: RuntimeSnapshot,
  endToken: string
): AuthoredOutcomeSource | null {
  if (!runtime.current_event_id) {
    return null;
  }

  const currentEvent = chapter.events_by_id[runtime.current_event_id];
  if (!currentEvent || !isOutcomeBoundaryEvent(currentEvent, endToken)) {
    return null;
  }

  const speakerLabels = getEventSpeakerLabels(currentEvent);
  return {
    title: compactNarrativeText(currentEvent.title) || undefined,
    summary: getAuthoredOutcomeSummary(currentEvent),
    carryLine: compactNarrativeText(currentEvent.text.carry_line) || undefined,
    speakerLabels,
    resultVariant: currentEvent.presentation?.result_variant ?? undefined
  };
}

function appendStoryLogEntry(runtime: RuntimeSnapshot, entry: StoryLogEntry): void {
  runtime.story_log ??= [];
  runtime.story_log.push(entry);
  runtime.story_log = runtime.story_log.slice(-24);
}

function recordEventStory(
  runtime: RuntimeSnapshot,
  event: EventDefinition,
  stage: "entry" | "choice",
  overrides?: Partial<Pick<StoryLogEntry, "title" | "summary" | "carry_line" | "speaker_labels" | "screen_type">>
): void {
  appendStoryLogEntry(runtime, {
    entry_id: `${event.event_id}:${stage}:${runtime.run_metrics.total_events}:${runtime.run_metrics.total_choices}:${runtime.story_log.length}`,
    chapter_id: runtime.current_chapter_id,
    node_id: event.node_id,
    event_id: event.event_id,
    title: overrides?.title ?? event.title,
    summary: overrides?.summary ?? getEventStorySummary(event),
    carry_line: overrides?.carry_line ?? event.text.carry_line,
    speaker_labels: overrides?.speaker_labels ?? getEventSpeakerLabels(event),
    created_at: nowIso(),
    screen_type: overrides?.screen_type ?? runtime.ui_screen
  });
}

function getChapterOutcomeCarryLine(chapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (chapterId === "CH05") {
    return "臾대꼫吏?湲곕줉? ?앸굹吏 ?딆븯?? ?ㅼ쓬 ?뚰듃??寃臾멸낵 紐낅떒?? 吏湲?遺숈옟? 吏꾩떎??媛믪쓣 ?ㅼ떆 臾쇱뼱??寃껋씠??";
  }
  if (chapterId === "CH10") {
    return "遺?먯뿉???④꺼 ???쇨뎬?ㅼ? 洹몃?濡??щ씪吏吏 ?딅뒗?? ?ㅼ쓬 ?뚰듃??洹?二꾧컪怨?湲곕줉??諛섎룞 ?꾩뿉??諛붾줈 ?쒖옉?쒕떎.";
  }
  if (chapterId === "CH15") {
    return "寃⑸━?좎뿉??諛?대궦 ?좏깮? 留덉?留?援ъ뿭源뚯? ?곕씪?⑤떎. ?댁젣 ?⑥? 寃껋? ?ㅺ퀎??吏덉꽌? 臾대꼫吏?利앹뼵??理쒖쥌 異⑸룎肉먯씠??";
  }
  if (chapterId === "CH20") {
    return "?쒖슱 ?앹뿉???댁븘?⑥? ?щ엺? ?꾧뎄?몄?蹂대떎, ?대뼡 ?媛瑜??앸궡 ?ш린?섏? 紐삵뻽?붿?媛 留덉?留?湲곕줉?쇰줈 ?⑤뒗??";
  }
  if (nextChapterId) {
    return `${nextChapterId}濡??댁뼱吏??湲??꾩뿉?? 諛⑷툑???좏깮? ?꾩쭅 ?앸굹吏 ?딆? ?뺣컯?쇰줈 ?ㅼ떆 ?뚯븘?⑤떎.`;
  }
  return "?λ㈃? ?ロ삍吏留??좏깮???꾩쑀利앹? ?⑥븘 ?덈떎.";
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
  const fieldActionBudget = Number(chapter.field_action_budget ?? 0);

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
    story_log: [],
    visited_nodes: {},
    visited_events: {},
    loot_session: null,
    battle_state: createIdleBattleState(),
    chapter_outcome: null,
    unlocked_endings: preserved?.unlocked_endings ?? {},
    media_seen: preserved?.media_seen ?? {},
    part1_carry_flags: null,
    campaign_complete: false,
    run_seed: nowIso(),
    chapter_result_payload: null,
    ending_gallery: {},
    route_unlocks: {},
    node_unlocks: {},
    field_actions_remaining: { [chapterId]: fieldActionBudget },
    fail_state: null,
    chapter_widgets_state: {}
  };
}

function ensureRuntimeSnapshot(content: GameContentPack, runtime: RuntimeSnapshot): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  const extendedRuntime = asExtendedRuntime(nextRuntime);
  nextRuntime.quest_progress ??= {};
  nextRuntime.farming_progress ??= {};
  nextRuntime.story_log ??= [];
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
  const currentChapterBudget = Number(getChapter(content, nextRuntime.current_chapter_id).field_action_budget ?? 0);
  extendedRuntime.chapter_result_payload ??= null;
  extendedRuntime.ending_gallery ??= {};
  extendedRuntime.route_unlocks ??= {};
  extendedRuntime.node_unlocks ??= {};
  extendedRuntime.field_actions_remaining ??= { [nextRuntime.current_chapter_id]: currentChapterBudget };
  extendedRuntime.fail_state ??= null;
  extendedRuntime.chapter_widgets_state ??= {};
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

function applyTransitionByTrigger(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  trigger: string
): boolean {
  const chapterId = runtime.current_chapter_id;
  const uiFlow = content.ui_flows[chapterId];
  const transition = resolveTransitionTarget(uiFlow, runtime.current_screen_id, trigger, runtime, {
    currentEventId: runtime.current_event_id,
    currentNodeId: runtime.current_node_id
  });
  if (!transition) {
    return false;
  }

  const target = findScreenDefinition(content, chapterId, transition.to_screen_id);
  if (!target) {
    return false;
  }

  setScreen(runtime, content, target.screen_type, target.screen_id);
  return true;
}

function applyFirstWorldMapTransition(runtime: RuntimeSnapshot, content: GameContentPack): boolean {
  const chapterId = runtime.current_chapter_id;
  const uiFlow = content.ui_flows[chapterId];
  if (!uiFlow || !runtime.current_screen_id) {
    return false;
  }

  const triggers = uiFlow.transitions
    .filter((transition) => transition.from_screen_id === runtime.current_screen_id)
    .map((transition) => transition.trigger);

  for (const trigger of triggers) {
    const transition = resolveTransitionTarget(uiFlow, runtime.current_screen_id, trigger, runtime, {
      currentEventId: runtime.current_event_id,
      currentNodeId: runtime.current_node_id
    });
    if (!transition) {
      continue;
    }

    const target = findScreenDefinition(content, chapterId, transition.to_screen_id);
    if (!target || target.screen_type !== "world_map") {
      continue;
    }

    setScreen(runtime, content, "world_map", target.screen_id);
    return true;
  }

  return false;
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

function syncSelectedRoute(runtime: RuntimeSnapshot, chapterId: ChapterId): void {
  const selectedRoute = runtime.stats["route.current"];
  if (typeof selectedRoute !== "string" || selectedRoute.trim().length === 0) {
    return;
  }

  runtime.chapter_progress[chapterId] ??= {
    status: "in_progress",
    objective_completion: {}
  };
  runtime.chapter_progress[chapterId].selected_route = selectedRoute;
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

function deriveEventScreenTarget(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  eventId: string
): { screenType: UIScreenType; screenId?: string | null } {
  const uiFlow = content.ui_flows[runtime.current_chapter_id];
  const special = resolveSpecialScreenType(runtime.current_chapter_id, eventId, uiFlow);
  if (special === "safehouse" || special === "route_select") {
    return {
      screenType: special,
      screenId: resolveSpecialScreenId(eventId, uiFlow, special)
    };
  }

  const chapter = getChapter(content, runtime.current_chapter_id);
  if (chapter.boss_event_id === eventId) {
    return {
      screenType: "boss_intro"
    };
  }

  return {
    screenType: "event_dialogue",
    screenId: resolveSpecialScreenId(eventId, uiFlow, "event_dialogue")
  };
}

function openEvent(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  event: EventDefinition,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  const extendedRuntime = asExtendedRuntime(nextRuntime);
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
  extendedRuntime.fail_state = null;
  sanitizeRuntimeMetrics(nextRuntime);
  const targetScreen = deriveEventScreenTarget(content, nextRuntime, event.event_id);
  setScreen(nextRuntime, content, targetScreen.screenType, targetScreen.screenId);
  updateObjectives(nextRuntime, content, warnings);
  recordEventStory(nextRuntime, event, "entry");
  return nextRuntime;
}

const ROUTE_COPY_LABELS: Record<string, string> = {
  official_lane: "공식선 유지",
  broker_lane: "브로커 우회",
  witness_chain: "증언 연결",
  audit_lane: "감사 차선",
  evidence_lane: "증거 인계",
  reserve_lane: "예비 퇴로",
  order_score: "질서 선별",
  witness_score: "기록 재설계",
  solidarity_score: "게이트 연대"
};

const ROUTE_EPILOGUE_IDS: Partial<Record<ChapterId, Partial<Record<string, string[]>>>> = {
  CH05: {
    official_lane: ["p1_crate_city_manifest", "p1_kim_ara_confession"],
    broker_lane: ["p1_blackwater_child", "p1_kim_ara_confession"],
    witness_chain: ["p1_writer_log", "p1_kim_ara_confession"]
  },
  CH10: {
    official_lane: ["p2_queue_17", "p2_red_corridor_wall"],
    broker_lane: ["p2_dead_office_stamp", "p2_sunken_list"],
    witness_chain: ["p2_smoke_hold_child", "p2_sunken_list"]
  },
  CH15: {
    audit_lane: ["p3_fog_rail_band", "p3_switch_chair"],
    evidence_lane: ["p3_bias_station_missing", "p3_relay_last_lamp"],
    reserve_lane: ["p3_white_record_child", "p3_switch_chair"]
  },
  CH20: {
    order_score: ["p4_tool_bag", "p4_gate_outer_names"],
    witness_score: ["p4_hearing_back_row", "p4_last_recipient"],
    solidarity_score: ["p4_verdict_band", "p4_sealed_record"]
  }
};

const ENDING_EPILOGUE_IDS: Record<string, string[]> = {
  P2_END_CONTROLLED_CONVOY: ["p2_queue_17", "p2_red_corridor_wall"],
  P2_END_WITNESS_FERRY: ["p2_smoke_hold_child", "p2_sunken_list"],
  P2_END_RED_CORRIDOR: ["p2_dead_office_stamp", "p2_red_corridor_wall"],
  P2_END_HARBOR_SEIZURE: ["p2_dead_office_stamp", "p2_sunken_list"],
  P2_END_SUNKEN_LIST: ["p2_smoke_hold_child", "p2_sunken_list"],
  P3_END_CERTIFIED_PASSAGE: ["p3_fog_rail_band", "p3_switch_chair"],
  P3_END_PUBLIC_BREACH: ["p3_bias_station_missing", "p3_relay_last_lamp"],
  P3_END_COLD_MERCY: ["p3_white_record_child", "p3_switch_chair"],
  P3_END_SEALED_RELAY: ["p3_relay_last_lamp", "p3_switch_chair"],
  P3_END_SACRIFICE_CORRIDOR: ["p3_switch_chair", "p3_relay_last_lamp"],
  P4_END_ORDERED_SELECTION: ["p4_tool_bag", "p4_gate_outer_names"],
  P4_END_GATE_BROKEN: ["p4_verdict_band", "p4_gate_outer_names"],
  P4_END_WITNESSED_REDESIGN: ["p4_hearing_back_row", "p4_last_recipient", "p4_sealed_record"]
};

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0))];
}

function formatSelectedRoute(selectedRoute?: string): string {
  if (!selectedRoute) {
    return "미기록";
  }

  return ROUTE_COPY_LABELS[selectedRoute] ?? selectedRoute.replace(/[_-]/gu, " ");
}

function buildOutcomeNotes(
  runtime: RuntimeSnapshot,
  chapterId: ChapterId,
  selectedRoute?: string,
  endingId?: string,
  endingTitle?: string
): string[] {
  const routeLabel = formatSelectedRoute(selectedRoute);
  const notes: string[] = [];

  if (endingTitle && selectedRoute) {
    notes.push(`${routeLabel} 경로는 ${endingTitle} 결말로 수렴했고, 그 여파가 바로 다음 기록에 남는다.`);
  } else if (endingTitle) {
    notes.push(`${endingTitle} 결말의 비용과 잔향이 결과 카드 바깥까지 이어진다.`);
  } else if (selectedRoute) {
    notes.push(`${routeLabel} 경로에서 남긴 선택의 여파가 다음 장 판단문으로 넘어간다.`);
  }

  switch (chapterId) {
    case "CH01":
      notes.push("젖은 방송 로그와 편집실 잔류자 기록이 검은 수로 거래선의 첫 기준으로 넘어간다.");
      notes.push(`${routeLabel}의 기조가 아직 작지만 이후 검문과 명단의 판단문으로 쌓이기 시작한다.`);
      break;
    case "CH02":
      notes.push("검은 수로에서 본 위조 패스와 거래선의 얼굴이 유리정원 계층선별의 기억으로 남는다.");
      notes.push("누가 물 위에서 값을 치렀는지가 이후 상층 협상과 구조 우선권에 그림자를 남긴다.");
      break;
    case "CH03":
      notes.push("유리정원에서 고른 전력 분배와 구조 우선권이 상자들의 도시 물류 윤리로 이어진다.");
      notes.push("안보경과 류세온 사이에서 어느 쪽 말을 더 오래 붙잡았는지가 다음 장 판단에 스민다.");
      break;
    case "CH04":
      notes.push("의료 상자와 진입 분류에서 무엇을 먼저 살렸는지가 미러센터 데이터 공개 기준으로 이어진다.");
      notes.push("사람보다 상자를 먼저 살린 장면, 혹은 상자를 버리고 사람을 건진 장면이 그대로 남는다.");
      break;
    case "CH05":
      notes.push("김아라의 고백과 데이터 공개 범위가 Part 2 검문선에서 누구를 먼저 믿을지의 기준이 된다.");
      notes.push(`${routeLabel}로 굳은 1부의 판단이 이후 검문, 명단, 증언선의 말투를 바꾼다.`);
      break;
    case "CH10":
      notes.push("침하 항만에서 고른 우선순위가 다음 파트 선별 윤리의 첫 문장으로 넘어간다.");
      notes.push(`${routeLabel}의 결과가 북상 구간에서 누가 기록되고 누가 밀리는지의 기준이 된다.`);
      break;
    case "CH15":
      notes.push("스위치 앞에 남은 빈자리와 마지막 램프의 잔광이 4부 공개 심판의 질문문으로 넘어간다.");
      notes.push(`${routeLabel}로 남긴 중계선 결론이 이후 판결 씨앗과 잠금 문장에 그대로 스민다.`);
      break;
    case "CH18":
      notes.push(`판결 씨앗: ${routeLabel}의 문장이 소금 정거장에서 살아남아 외해 전초 초안으로 넘겨진다.`);
      notes.push("청문에서 이름이 불리지 않은 사람들과 끝까지 화면에 남은 얼굴이 다음 장 초안의 근거가 된다.");
      break;
    case "CH19":
      if (runtime.flags["p4.execution_lock_order"] === true) {
        notes.push("잠금: 질서의 선별 문장이 외해 전초에서 최종 초안으로 잠겼다.");
      }
      if (runtime.flags["p4.execution_lock_solidarity"] === true) {
        notes.push("잠금: 더 많은 사람을 안쪽으로 밀어 넣는 판결문이 외해 전초에서 잠겼다.");
      }
      if (runtime.flags["p4.execution_lock_witness"] === true) {
        notes.push("잠금: 배제까지 함께 기록하는 판결문이 외해 전초에서 잠겼다.");
      }
      notes.push("이제 독도의 문에서는 새 판단이 아니라 잠긴 초안을 어떤 상처와 함께 집행할지만 남는다.");
      break;
    case "CH20":
      if (endingId === "P4_END_ORDERED_SELECTION") {
        notes.push("집행: 처리량은 지켰지만 문턱 밖에 남겨진 이름도 최종 기록으로 굳었다.");
      }
      if (endingId === "P4_END_GATE_BROKEN") {
        notes.push("집행: 더 많은 사람을 안쪽으로 밀어 넣었지만 게이트 전체의 균열도 함께 결말이 되었다.");
      }
      if (endingId === "P4_END_WITNESSED_REDESIGN") {
        notes.push("집행: 기준은 새로 써졌지만 누구를 끝내 못 태웠는지도 모두가 보게 되었다.");
      }
      notes.push("결말은 승리문이 아니라 남겨진 사람, 지워진 흔적, 기록된 장면의 배열로 남는다.");
      break;
    default:
      break;
  }

  return uniqueStrings(notes).slice(0, 3);
}

function buildResultEpilogueCardIds(chapterId: ChapterId, selectedRoute?: string, endingId?: string): string[] {
  return uniqueStrings([
    ...(ROUTE_EPILOGUE_IDS[chapterId]?.[selectedRoute ?? ""] ?? []),
    ...(endingId ? ENDING_EPILOGUE_IDS[endingId] ?? [] : [])
  ]);
}

function enrichChapterResultPayload(
  payload: ChapterResultPayload,
  runtime: RuntimeSnapshot,
  chapterId: ChapterId,
  endingId?: string,
  endingTitle?: string,
  outcomeSource?: AuthoredOutcomeSource | null
): void {
  payload.title = outcomeSource?.title ?? endingTitle ?? payload.title;
  payload.summary = outcomeSource?.summary ?? payload.summary;
  payload.carry_line = outcomeSource?.carryLine ?? payload.carry_line;
  payload.notes = buildOutcomeNotes(runtime, chapterId, payload.selected_route, endingId, endingTitle);
  payload.epilogue_card_ids = buildResultEpilogueCardIds(chapterId, payload.selected_route, endingId);
}

function summarizeChapter(runtime: RuntimeSnapshot, chapterId: ChapterId): string {
  const route = formatSelectedRoute(typeof runtime.stats["route.current"] === "string" ? runtime.stats["route.current"] : undefined);
  const strain = Number(runtime.stats["route.strain"] ?? runtime.stats["sacrifice_load"] ?? 0);
  const queue = Number(runtime.stats["queue_pressure"] ?? runtime.stats["capacity_pressure"] ?? 0);
  return `${chapterId} 종료. ${route} 기준이 남았고, 누적 부담 ${strain}와 현장 압력 ${queue}가 다음 장 기억으로 넘어간다.`;
}

function buildWidgetStateSnapshot(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  chapterId: ChapterId
): Record<string, string | number | boolean> {
  const chapter = getChapter(content, chapterId);
  const resultScreen = findScreenByType(content.ui_flows[chapterId], "result_summary");
  const widgetState: Record<string, string | number | boolean> = {};
  const completionFlag = getChapterCompletionFlag(chapterId);

  for (const widgetId of resultScreen?.widgets ?? []) {
    switch (widgetId) {
      case "chapter_result":
        widgetState[widgetId] = summarizeChapter(runtime, chapterId);
        break;
      case "route_summary":
      case "route_hint":
      case "route_compare":
        widgetState[widgetId] = String(
          runtime.chapter_progress[chapterId]?.selected_route ?? runtime.stats["route.current"] ?? "unassigned"
        );
        break;
      case "party_summary":
        widgetState[widgetId] = `泥대젰 ${Number(runtime.stats["hp"] ?? 0)} / ${Number(runtime.stats["max_hp"] ?? 0)}`;
        break;
      case "trust_summary":
      case "reputation_change":
      case "faction_summary":
        widgetState[widgetId] = Object.entries(runtime.stats).filter(
          ([key, value]) => (key.startsWith("trust.") || key.startsWith("reputation.")) && Number(value ?? 0) !== 0
        ).length;
        break;
      case "loot_summary":
        widgetState[widgetId] = Object.values(runtime.inventory.quantities).reduce((sum, value) => sum + Number(value ?? 0), 0);
        break;
      case "ending_matrix":
        widgetState[widgetId] = chapter.ending_matrix.length;
        break;
      case "field_actions_remaining":
        widgetState[widgetId] =
          typeof runtime.field_actions_remaining === "number"
            ? runtime.field_actions_remaining
            : Number(runtime.field_actions_remaining?.[chapterId] ?? 0);
        break;
      default: {
        if (runtime.stats[widgetId] !== undefined) {
          widgetState[widgetId] = runtime.stats[widgetId];
          break;
        }
        if (runtime.flags[widgetId] !== undefined) {
          widgetState[widgetId] = typeof runtime.flags[widgetId] === "boolean" ? runtime.flags[widgetId] === true : String(runtime.flags[widgetId]);
          break;
        }
        widgetState[widgetId] = widgetId === completionFlag ? runtime.flags[completionFlag] === true : false;
        break;
      }
    }
  }

  return widgetState;
}

function buildChapterResultPayload(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  chapterId: ChapterId,
  endedBy: string
): ChapterResultPayload {
  const chapter = getChapter(content, chapterId);
  const chapterProgress = runtime.chapter_progress[chapterId];
  return {
    chapter_id: chapterId,
    ended_by: endedBy,
    selected_route:
      chapterProgress?.selected_route ?? (typeof runtime.stats["route.current"] === "string" ? runtime.stats["route.current"] : undefined),
    chapter_minutes: Number(runtime.run_metrics.chapter_minutes[chapterId] ?? 0),
    total_minutes: Number(runtime.run_metrics.total_minutes ?? 0),
    objective_summary: chapter.objectives.map((objective) => ({
      objective_id: objective.objective_id,
      text: objective.text,
      required: objective.required,
      completed: chapterProgress?.objective_completion[objective.objective_id] === true
    })),
    quest_summary: chapter.quest_tracks.map((track) => ({
      quest_track_id: track.quest_track_id,
      title: track.title,
      kind: track.kind,
      status: runtime.quest_progress[chapterId]?.[track.quest_track_id]?.status ?? "locked"
    })),
    widget_state: buildWidgetStateSnapshot(content, runtime, chapterId),
    active_flags: Object.keys(runtime.flags)
      .filter((key) => key.includes(chapterId.toLowerCase()) || key === getChapterCompletionFlag(chapterId))
      .slice(0, 12)
  };
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

  warnings.push({
    message: `No ending rule matched for ${chapter.chapter_id}; defaulting to P1_END_ASHEN_ESCAPE for carry flags.`,
    source: `ending:${chapter.chapter_id}`,
    severity: "warning"
  });
  return "P1_END_ASHEN_ESCAPE";
}

function resolveGenericEndingRule(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  warnings: RuntimeWarning[]
): ChapterDefinition["ending_matrix"][number] | null {
  const chapter = getChapter(content, runtime.current_chapter_id);
  if (chapter.ending_matrix.length === 0) {
    return null;
  }

  const orderedRules = [...chapter.ending_matrix].sort((left, right) => right.priority - left.priority);
  for (const rule of orderedRules) {
    const matched = rule.conditions.every((condition) =>
      evaluateCondition(condition, runtime, warnings, `ending:${rule.ending_id}`)
    );
    if (matched) {
      return rule;
    }
  }

  warnings.push({
    message: `No ending rule matched for ${chapter.chapter_id}; using authored result summary without gallery unlock.`,
    source: `ending:${chapter.chapter_id}`,
    severity: "warning"
  });
  return null;
}

function registerEndingGalleryEntry(
  runtime: RuntimeSnapshot,
  chapterId: ChapterId,
  endingId: string,
  title: string,
  summary: string,
  hint: string,
  unlockedAt: string,
  videoId?: string
): void {
  const extendedRuntime = asExtendedRuntime(runtime);
  extendedRuntime.ending_gallery ??= {};
  extendedRuntime.ending_gallery[endingId] = {
    ending_id: endingId,
    chapter_id: chapterId,
    title,
    summary,
    hint,
    art_key: buildGenericEndingArtKey(endingId),
    thumb_key: buildGenericEndingThumbKey(endingId),
    video_id: videoId,
    unlocked_at: unlockedAt
  };
}

function finalizeChapterOutcome(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  endToken: string,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  const extendedRuntime = asExtendedRuntime(nextRuntime);
  const chapterId = nextRuntime.current_chapter_id;
  const chapter = getChapter(content, chapterId);
  const chapterEntry = getChapterCatalogEntry(chapterId);
  const nextChapterId = chapterEntry?.next_chapter_id;
  const nextChapterInCurrentPart = Boolean(
    nextChapterId && getChapterCatalogEntry(nextChapterId)?.part_id === CURRENT_PART_ID
  );
  const progress = nextRuntime.chapter_progress[chapterId];
  if (progress) {
    progress.status = "completed";
    progress.completed_at = nowIso();
    progress.ended_by = endToken;
  }
  syncSelectedRoute(nextRuntime, chapterId);
  const authoredOutcome = resolveAuthoredOutcomeSource(chapter, nextRuntime, endToken);

  const chapterResultPayload = buildChapterResultPayload(content, nextRuntime, chapterId, endToken);
  extendedRuntime.chapter_result_payload = chapterResultPayload;
  extendedRuntime.fail_state = null;
  extendedRuntime.chapter_widgets_state = {
    ...(extendedRuntime.chapter_widgets_state ?? {}),
    [chapterId]: Object.fromEntries(
      Object.entries(chapterResultPayload.widget_state).map(([widgetId, value]) => [
        widgetId,
        {
          widget_id: widgetId,
          value
        }
      ])
    )
  };

  if (chapterId === "CH05") {
    const endingId = resolveEndingId(content, nextRuntime, warnings);
    const endingDef = getPart1EndingDefinition(endingId);
    const carryFlags = buildCarryFlags(nextRuntime, endingId);
    const unlockedAt = (nextRuntime.unlocked_endings as Record<string, string | undefined>)[endingId] ?? nowIso();

    (nextRuntime.unlocked_endings as Record<string, string | undefined>)[endingId] = unlockedAt;
    nextRuntime.part1_carry_flags = carryFlags;
    nextRuntime.flags["part1.ending_id"] = endingId;
    registerEndingGalleryEntry(
      nextRuntime,
      chapterId,
      endingId,
      endingDef.title,
      endingDef.summary,
      endingDef.hint,
      unlockedAt,
      endingId
    );
    nextRuntime.chapter_outcome = {
      chapter_id: chapterId,
      title: authoredOutcome?.title ?? chapter.title,
      summary: authoredOutcome?.summary ?? endingDef.summary,
      next_chapter_id: nextChapterId,
      campaign_complete: true,
      ending_id: endingDef.ending_id,
      ending_title: endingDef.title,
      carry_flags: carryFlags
    } as ExtendedChapterOutcome;
    (nextRuntime.chapter_outcome as ExtendedChapterOutcome).chapter_result_payload = chapterResultPayload;
    (nextRuntime.chapter_outcome as ExtendedChapterOutcome).gallery_chapter_id = chapterId;
    (nextRuntime.chapter_outcome as ExtendedChapterOutcome).result_variant = authoredOutcome?.resultVariant ?? "ending";
    nextRuntime.campaign_complete = true;
    markMediaSeen(nextRuntime, endingDef.art_key);
    markMediaSeen(nextRuntime, endingDef.thumb_key);
    enrichChapterResultPayload(chapterResultPayload, nextRuntime, chapterId, endingDef.ending_id, endingDef.title, authoredOutcome);
  } else {
    const resolvedEndingRule = resolveGenericEndingRule(content, nextRuntime, warnings);
    if (resolvedEndingRule) {
      const endingId = resolvedEndingRule.ending_id;
      const unlockedAt = (nextRuntime.unlocked_endings as Record<string, string | undefined>)[endingId] ?? nowIso();
      (nextRuntime.unlocked_endings as Record<string, string | undefined>)[endingId] = unlockedAt;
      registerEndingGalleryEntry(
        nextRuntime,
        chapterId,
        endingId,
        resolvedEndingRule.title,
        resolvedEndingRule.summary,
        resolvedEndingRule.hint,
        unlockedAt
      );
      nextRuntime.chapter_outcome = {
        chapter_id: chapterId,
        title: authoredOutcome?.title ?? chapter.title,
        summary: authoredOutcome?.summary ?? resolvedEndingRule.summary,
        next_chapter_id: nextChapterId,
        campaign_complete: !nextChapterInCurrentPart,
        ending_id: endingId as EndingId,
        ending_title: resolvedEndingRule.title
      } as ExtendedChapterOutcome;
      (nextRuntime.chapter_outcome as ExtendedChapterOutcome).chapter_result_payload = chapterResultPayload;
      (nextRuntime.chapter_outcome as ExtendedChapterOutcome).gallery_chapter_id = chapterId;
      (nextRuntime.chapter_outcome as ExtendedChapterOutcome).result_variant = authoredOutcome?.resultVariant ?? "ending";
      enrichChapterResultPayload(chapterResultPayload, nextRuntime, chapterId, resolvedEndingRule.ending_id, resolvedEndingRule.title, authoredOutcome);
    } else {
      nextRuntime.chapter_outcome = {
        chapter_id: chapterId,
        title: authoredOutcome?.title ?? chapter.title,
        summary: authoredOutcome?.summary ?? summarizeChapter(nextRuntime, chapterId),
        next_chapter_id: nextChapterId,
        campaign_complete: !nextChapterInCurrentPart
      } as ExtendedChapterOutcome;
      (nextRuntime.chapter_outcome as ExtendedChapterOutcome).chapter_result_payload = chapterResultPayload;
      (nextRuntime.chapter_outcome as ExtendedChapterOutcome).gallery_chapter_id = chapterId;
      (nextRuntime.chapter_outcome as ExtendedChapterOutcome).result_variant = authoredOutcome?.resultVariant ?? "chapter";
      enrichChapterResultPayload(chapterResultPayload, nextRuntime, chapterId, undefined, undefined, authoredOutcome);
    }
  }

  appendStoryLogEntry(nextRuntime, {
    entry_id: `${chapterId}:outcome:${nextRuntime.run_metrics.total_events}:${nextRuntime.story_log.length}`,
    chapter_id: chapterId,
    node_id: nextRuntime.current_node_id,
    event_id: nextRuntime.current_event_id,
    title: nextRuntime.chapter_outcome?.ending_title ?? nextRuntime.chapter_outcome?.title ?? chapter.title,
    summary: authoredOutcome?.summary ?? nextRuntime.chapter_outcome?.summary ?? summarizeChapter(nextRuntime, chapterId),
    carry_line: authoredOutcome?.carryLine ?? getChapterOutcomeCarryLine(chapterId, nextChapterId),
    speaker_labels:
      authoredOutcome?.speakerLabels.length
        ? authoredOutcome.speakerLabels
        : [nextRuntime.chapter_outcome?.ending_id ? "결말 기록" : "결과 기록"],
    created_at: nowIso(),
    screen_type: "result_summary"
  });

  nextRuntime.current_event_id = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = createIdleBattleState();
  setScreen(nextRuntime, content, "result_summary");
  updateObjectives(nextRuntime, content, warnings);
  return nextRuntime;
}

function routeToNodeTarget(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  nodeId: string,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const chapterId = runtime.current_chapter_id;
  const chapter = getChapter(content, chapterId);
  if (!chapter.nodes_by_id[nodeId]) {
    warnings.push({
      message: `Next node ${nodeId} is missing.`,
      source: "runtime",
      severity: "warning"
    });
    const nextRuntime = structuredClone(runtime);
    setScreen(nextRuntime, content, "world_map");
    return nextRuntime;
  }

  const nextRuntime = structuredClone(runtime);
  nextRuntime.current_event_id = null;
  nextRuntime.current_node_id = nodeId;
  nextRuntime.loot_session = null;
  recordNodeVisit(nextRuntime, chapterId, nodeId);
  const event = findFirstAvailableEvent(content, nextRuntime, chapterId, nodeId, warnings);
  if (!event) {
    setScreen(nextRuntime, content, "world_map");
    return nextRuntime;
  }

  return openEvent(content, nextRuntime, event, warnings);
}

function continueFromNextTarget(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  target: string | FlowTarget | null | undefined,
  warnings: RuntimeWarning[]
): RuntimeSnapshot {
  const flowTarget: FlowTarget =
    typeof target === "string" || target == null
      ? {
          nextEventId: target ?? null,
          mode: "default"
        }
      : target;
  const targetEventId =
    flowTarget.mode === "fail"
      ? flowTarget.failEventId ?? flowTarget.setbackEventId ?? flowTarget.nextEventId ?? null
      : flowTarget.mode === "setback"
        ? flowTarget.setbackEventId ?? flowTarget.failEventId ?? flowTarget.nextEventId ?? null
        : flowTarget.nextEventId ?? null;
  const targetNodeId = flowTarget.nextNodeId ?? null;

  if (targetEventId?.startsWith("END_")) {
    return finalizeChapterOutcome(content, runtime, targetEventId, warnings);
  }

  if ((!targetEventId || targetEventId === runtime.current_event_id) && isChapterMarkedComplete(runtime, runtime.current_chapter_id)) {
    return finalizeChapterOutcome(content, runtime, `END_${runtime.current_chapter_id}_AUTO`, warnings);
  }

  if (!targetEventId && targetNodeId) {
    return routeToNodeTarget(content, runtime, targetNodeId, warnings);
  }

  if (!targetEventId) {
    const nextRuntime = structuredClone(runtime);
    nextRuntime.current_event_id = null;
    nextRuntime.loot_session = null;
    setScreen(nextRuntime, content, "world_map");
    return nextRuntime;
  }

  const event = getChapter(content, runtime.current_chapter_id).events_by_id[targetEventId];
  if (!event) {
    warnings.push({
      message: `Next event ${targetEventId} is missing.`,
      source: "runtime",
      severity: "warning"
    });
    if (targetNodeId) {
      return routeToNodeTarget(content, runtime, targetNodeId, warnings);
    }
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
  syncSelectedRoute(nextRuntime, nextRuntime.current_chapter_id);

  const visitState = getOrCreateVisitState(nextRuntime, nextRuntime.current_chapter_id, event.event_id);
  visitState.completed_count += 1;
  visitState.last_choice_id = choice.choice_id;
  nextRuntime.run_metrics.total_choices += 1;
  addRunMinutes(nextRuntime, nextRuntime.current_chapter_id, BASE_CHOICE_MINUTES);
  applyRepeatFarmingPenalty(nextRuntime, nextRuntime.current_chapter_id, event, visitState.completed_count);
  asExtendedRuntime(nextRuntime).fail_state = null;
  recordEventStory(nextRuntime, event, "choice", {
    title: `${event.title} - ${choice.label}`,
    summary: summarizeNarrative(choice.preview ?? event.text.summary, event.text.summary),
    carry_line: event.text.carry_line ?? choice.preview,
    screen_type: nextRuntime.ui_screen
  });

  updateObjectives(nextRuntime, content, warnings);

  const flowTarget = buildChoiceFlowTarget(event, choice);
  if (effectResult.grantedLoot.length > 0) {
    nextRuntime.loot_session = {
      loot_table_id: `${event.event_id}:granted`,
      source_chapter_id: nextRuntime.current_chapter_id,
      source_node_id: event.node_id,
      source_event_id: event.event_id,
      drops: effectResult.grantedLoot.map((drop: LootDrop) => ({ ...drop })),
      pending_next_event_id: flowTarget.nextEventId ?? null,
      return_screen: "world_map"
    } as RuntimeSnapshot["loot_session"];
    (nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
      pending_next_node_id?: string | null;
      fail_event_id?: string | null;
      setback_event_id?: string | null;
    }).pending_next_node_id = flowTarget.nextNodeId ?? null;
    (nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
      pending_next_node_id?: string | null;
      fail_event_id?: string | null;
      setback_event_id?: string | null;
    }).fail_event_id = flowTarget.failEventId ?? null;
    (nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
      pending_next_node_id?: string | null;
      fail_event_id?: string | null;
      setback_event_id?: string | null;
    }).setback_event_id = flowTarget.setbackEventId ?? null;
    setScreen(nextRuntime, content, "loot_resolution");
    return nextRuntime;
  }

  return continueFromNextTarget(content, nextRuntime, flowTarget, warnings);
}

function createChapterStartRuntime(content: GameContentPack, runtime: RuntimeSnapshot, chapterId: ChapterId): RuntimeSnapshot {
  const nextRuntime = structuredClone(runtime);
  const extendedRuntime = asExtendedRuntime(nextRuntime);
  const chapter = getChapter(content, chapterId);
  const fieldActionBudget = Number(chapter.field_action_budget ?? 0);
  nextRuntime.current_chapter_id = chapterId;
  nextRuntime.current_node_id = chapter.entry_node_id;
  nextRuntime.current_event_id = null;
  nextRuntime.chapter_outcome = null;
  nextRuntime.loot_session = null;
  nextRuntime.battle_state = createIdleBattleState();
  nextRuntime.campaign_complete = false;
  nextRuntime.stats["chapter.current"] = chapterId;
  extendedRuntime.chapter_result_payload = null;
  extendedRuntime.fail_state = null;
  extendedRuntime.field_actions_remaining =
    typeof runtime.field_actions_remaining === "number"
      ? fieldActionBudget
      : {
          ...(runtime.field_actions_remaining ?? {}),
          [chapterId]: fieldActionBudget
        };
  extendedRuntime.chapter_widgets_state = {};

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
  appendStoryLogEntry(nextRuntime, {
    entry_id: `${chapterId}:start:${nextRuntime.story_log.length}`,
    chapter_id: chapterId,
    node_id: chapter.entry_node_id,
    event_id: null,
    title: chapter.title,
    summary: summarizeNarrative(chapter.role, `${chapterId} 현장을 다시 훑습니다.`),
    carry_line: `${chapter.title} 브리프의 첫 장면부터 플레이어의 선택을 다시 이어갑니다.`,
    speaker_labels: ["작전 브리프"],
    created_at: nowIso(),
    screen_type: "chapter_briefing"
  });
  updateObjectives(nextRuntime, content, []);
  return nextRuntime;
}

function createOutcomeNextRuntime(content: GameContentPack, runtime: RuntimeSnapshot): RuntimeSnapshot | null {
  const nextChapterId = runtime.chapter_outcome?.next_chapter_id;
  if (!nextChapterId || !content.chapters[nextChapterId]) {
    return null;
  }

  return createChapterStartRuntime(content, runtime, nextChapterId as ChapterId);
}

const initialState: Omit<
  GameState,
  | "bootstrapPack"
  | "startRun"
  | "startMission"
  | "proceedHub"
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
          const hasStartChapter = Boolean(content.chapters[CURRENT_PART_START_CHAPTER]);
          const hasStartUi = Boolean(content.ui_flows[CURRENT_PART_START_CHAPTER]);

          if (!hasStartChapter || !hasStartUi) {
            const diagnostics = content.warnings.map((warning) => warning.message).join(" | ");
            const reasons = [
              hasStartChapter ? null : `missing chapter ${CURRENT_PART_START_CHAPTER}`,
              hasStartUi ? null : `missing ui flow ${CURRENT_PART_START_CHAPTER}`
            ].filter(Boolean);

            set({
              bootState: "error",
              bootError: [...reasons, diagnostics].filter(Boolean).join(" | "),
              content,
              runtime: null,
              warnings: content.warnings
            });
            return;
          }

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
        const transitioned = applyTransitionByTrigger(nextRuntime, content, "start_mission");
        if (!transitioned) {
          setScreen(nextRuntime, content, "world_map");
        }
        updateObjectives(nextRuntime, content, []);
        set({ runtime: nextRuntime, warnings: [] });
      },

      proceedHub: () => {
        const { content, runtime } = get();
        if (!content || !runtime) {
          return;
        }

        const nextRuntime = structuredClone(runtime);
        const transitioned = applyFirstWorldMapTransition(nextRuntime, content);
        if (!transitioned) {
          setScreen(nextRuntime, content, "world_map");
        }

        set({
          runtime: nextRuntime,
          selectedChoiceId: null,
          warnings: []
        });
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
        const lootFlow = nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
          pending_next_node_id?: string | null;
          fail_event_id?: string | null;
          setback_event_id?: string | null;
        };
        nextRuntime.loot_session = null;
        const routedRuntime = continueFromNextTarget(
          content,
          nextRuntime,
          {
            nextEventId: lootFlow?.pending_next_event_id ?? null,
            nextNodeId: lootFlow?.pending_next_node_id ?? null,
            failEventId: lootFlow?.fail_event_id ?? null,
            setbackEventId: lootFlow?.setback_event_id ?? null
          },
          localWarnings
        );
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
            syncSelectedRoute(nextRuntime, nextRuntime.current_chapter_id);

            const visitState = getOrCreateVisitState(nextRuntime, nextRuntime.current_chapter_id, event.event_id);
            visitState.completed_count += 1;
            visitState.last_choice_id = choice?.choice_id;
            nextRuntime.run_metrics.total_choices += 1;
            addRunMinutes(nextRuntime, nextRuntime.current_chapter_id, BASE_CHOICE_MINUTES);
            applyRepeatFarmingPenalty(nextRuntime, nextRuntime.current_chapter_id, event, visitState.completed_count);
            nextRuntime.battle_state = createIdleBattleState();
            asExtendedRuntime(nextRuntime).fail_state = null;
            updateObjectives(nextRuntime, content, localWarnings);
            const flowTarget = buildChoiceFlowTarget(event, choice);

            if (effectResult.grantedLoot.length > 0) {
              nextRuntime.loot_session = {
                loot_table_id: `${event.event_id}:victory`,
                source_chapter_id: nextRuntime.current_chapter_id,
                source_node_id: event.node_id,
                source_event_id: event.event_id,
                drops: effectResult.grantedLoot.map((drop) => ({ ...drop })),
                pending_next_event_id: flowTarget.nextEventId ?? null,
                return_screen: "world_map"
              } as RuntimeSnapshot["loot_session"];
              (nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
                pending_next_node_id?: string | null;
                fail_event_id?: string | null;
                setback_event_id?: string | null;
              }).pending_next_node_id = flowTarget.nextNodeId ?? null;
              (nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
                pending_next_node_id?: string | null;
                fail_event_id?: string | null;
                setback_event_id?: string | null;
              }).fail_event_id = flowTarget.failEventId ?? null;
              (nextRuntime.loot_session as RuntimeSnapshot["loot_session"] & {
                pending_next_node_id?: string | null;
                fail_event_id?: string | null;
                setback_event_id?: string | null;
              }).setback_event_id = flowTarget.setbackEventId ?? null;
              setScreen(nextRuntime, content, "loot_resolution");
            } else {
              nextRuntime = continueFromNextTarget(content, nextRuntime, flowTarget, localWarnings);
            }
          }
        } else if (turnResult.outcome === "defeat") {
          const sourceEventId = nextRuntime.battle_state.source_event_id ?? nextRuntime.current_event_id;
          const sourceEvent = sourceEventId
            ? getChapter(content, nextRuntime.current_chapter_id).events_by_id[sourceEventId]
            : null;
          const effectResult = applyEffects(
            nextRuntime,
            content,
            nextRuntime.battle_state.defeat_effects,
            `battle:${sourceEventId ?? "unknown"}:defeat`
          );
          nextRuntime = effectResult.runtime;
          localWarnings.push(...effectResult.warnings);
          nextRuntime.battle_state = createIdleBattleState();
          asExtendedRuntime(nextRuntime).fail_state = {
            source_event_id: sourceEventId,
            reason: readFlowLink(sourceEvent, "setback_event_id") ? "setback" : "fail",
            failed_at: nowIso()
          };
          nextRuntime = continueFromNextTarget(
            content,
            nextRuntime,
            sourceEvent
              ? {
                  ...buildChoiceFlowTarget(sourceEvent, null, readFlowLink(sourceEvent, "setback_event_id") ? "setback" : "fail")
                }
              : { mode: "fail" },
            localWarnings
          );
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

        if (runtime.chapter_outcome.next_chapter_id && runtime.current_chapter_id !== "CH20") {
          const nextRuntime = createOutcomeNextRuntime(content, runtime);
          if (nextRuntime) {
            set({
              runtime: nextRuntime,
              selectedChoiceId: null,
              galleryReturnScreenId: null,
              warnings: []
            });
            return;
          }
        }

        const galleryChapterId = ((runtime.chapter_outcome as ExtendedChapterOutcome | null)?.gallery_chapter_id ??
          runtime.current_chapter_id) as ChapterId;
        const hasEndingGallery = Boolean(findScreenIdByType(content, galleryChapterId, "ending_gallery"));

        if (runtime.chapter_outcome.ending_id && hasEndingGallery) {
          get().openEndingGallery();
          return;
        }

        const nextRuntime = createOutcomeNextRuntime(content, runtime);
        if (nextRuntime) {
          set({
            runtime: nextRuntime,
            selectedChoiceId: null,
            galleryReturnScreenId: null,
            warnings: []
          });
          return;
        }

        if (runtime.chapter_outcome.campaign_complete) {
          get().startRun(CURRENT_PART_START_CHAPTER);
          return;
        }

        get().startRun(CURRENT_PART_START_CHAPTER);
      },

      openEndingGallery: () => {
        const { content, runtime } = get();
        if (!content || !runtime) {
          return;
        }

        const nextRuntime = structuredClone(runtime);
        const galleryChapterId = ((nextRuntime.chapter_outcome as ExtendedChapterOutcome | null)?.gallery_chapter_id ??
          nextRuntime.current_chapter_id) as ChapterId;
        const endingGalleryScreenId = findScreenIdByType(content, galleryChapterId, "ending_gallery");
        if (!endingGalleryScreenId) {
          return;
        }
        const fallbackScreenId =
          nextRuntime.current_screen_id ?? findScreenIdByType(content, galleryChapterId, "result_summary");
        nextRuntime.current_chapter_id = galleryChapterId;
        setScreen(nextRuntime, content, "ending_gallery", endingGalleryScreenId);
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

        const nextRuntime = createOutcomeNextRuntime(content, runtime);
        if (nextRuntime && runtime.chapter_outcome?.next_chapter_id) {
          set({
            runtime: nextRuntime,
            selectedChoiceId: null,
            galleryReturnScreenId: null,
            warnings: []
          });
          return;
        }

        const restoredRuntime = structuredClone(runtime);
        const outcome = restoredRuntime.chapter_outcome as ExtendedChapterOutcome | null;
        const galleryChapterId = (outcome?.gallery_chapter_id ?? restoredRuntime.current_chapter_id) as ChapterId;
        const hasEnding = Boolean(outcome?.ending_id);
        const returnScreenId = hasEnding
          ? findScreenIdByType(content, galleryChapterId, "result_summary")
          : galleryReturnScreenId ?? content.ui_flows[galleryChapterId]?.entry_screen_id ?? null;
        const returnChapterId = galleryChapterId;
        const returnScreen = findScreenDefinition(content, returnChapterId, returnScreenId);
        restoredRuntime.current_chapter_id = returnChapterId;
        restoredRuntime.current_screen_id = returnScreen?.screen_id ?? returnScreenId ?? null;
        restoredRuntime.ui_screen = (returnScreen?.screen_type ?? "chapter_briefing") as UIScreenType;
        markCurrentScreenMedia(restoredRuntime, content);

        set({
          runtime: restoredRuntime,
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



