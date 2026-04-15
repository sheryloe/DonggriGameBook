import { useEffect, useMemo, useState } from "react";
import { getChapterCatalogEntry, getChapterRuntimeConfig } from "@donggrol/world-registry";
import { ArtFrame, VideoCard } from "./assets/runtimeMedia";
import { CURRENT_PART_ID } from "./app/appContext";
import { getPart1ChapterMedia } from "./content/part1Media";
import { resolveItemIconCandidates } from "./loaders/assetResolver";
import { useGameStore } from "./store/gameStore";
import type { ChapterId, EventDefinition, EventSceneBlock, GameContentPack, RuntimeSnapshot, StoryLogEntry } from "./types/game";

type ChapterResultView = {
  objective_summary: Array<{ objective_id: string; text: string; completed: boolean }>;
  quest_summary: Array<{ quest_track_id: string; title: string; status: string }>;
};

type ExtendedRuntimeSnapshot = Omit<RuntimeSnapshot, "chapter_result_payload" | "ending_gallery" | "chapter_widgets_state"> & {
  chapter_result_payload?: ChapterResultView | null;
  ending_gallery?: Record<
    string,
    {
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
  >;
  chapter_widgets_state?: Record<string, unknown> | Record<string, Record<string, unknown>>;
};

type GenericEndingCard = {
  ending_id: string;
  chapter_id: ChapterId;
  title: string;
  summary: string;
  hint: string;
  art_key: string;
  thumb_key: string;
  video_id?: string;
  unlocked: boolean;
  unlocked_at?: string;
  priority: number;
  chapter_order: number;
};

function formatDateTime(input?: string): string {
  if (!input) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input));
}

function toExtendedRuntime(runtime: RuntimeSnapshot): ExtendedRuntimeSnapshot {
  return runtime as ExtendedRuntimeSnapshot;
}

function buildEndingAssetStem(endingId: string): string {
  return endingId.toLowerCase().replace(/_end_/u, "_");
}

function buildEndingArtKey(endingId: string): string {
  return `ending_${buildEndingAssetStem(endingId)}`;
}

function buildEndingThumbKey(endingId: string): string {
  return `ending_thumb_${buildEndingAssetStem(endingId)}`;
}

function buildEndingVideoId(endingId: string): string | undefined {
  return endingId.startsWith("P1_") ? endingId : undefined;
}

function getItemDisplayName(content: GameContentPack, itemId: string): string {
  const item = content.items[itemId];
  return item?.name_ko ?? item?.name_en ?? itemId;
}

function buildItemIconFallbackLabel(name: string): string {
  const compact = name.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (!compact) {
    return "--";
  }

  const tokens = compact.split(/\s+/u).filter(Boolean);
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function ItemIcon({ content, itemId }: { content: GameContentPack; itemId: string }) {
  const itemName = useMemo(() => getItemDisplayName(content, itemId), [content, itemId]);
  const fallbackLabel = useMemo(() => buildItemIconFallbackLabel(itemName), [itemName]);
  const candidates = useMemo(() => resolveItemIconCandidates(itemId), [itemId]);
  const [failedCandidates, setFailedCandidates] = useState<string[]>([]);

  useEffect(() => {
    setFailedCandidates([]);
  }, [itemId]);

  const src = candidates.find((candidate) => !failedCandidates.includes(candidate));

  if (!src) {
    return (
      <span className="item-icon" aria-label={itemName}>
        {fallbackLabel}
      </span>
    );
  }

  return (
    <span className="item-icon">
      <img
        src={src}
        alt={`${itemName} icon`}
        loading="lazy"
        onError={() =>
          setFailedCandidates((current) => (current.includes(src) ? current : [...current, src]))
        }
      />
    </span>
  );
}

function buildFallbackEndingCard(
  endingId: string,
  chapterId: ChapterId,
  unlockedAt?: string,
  title?: string,
  summary?: string,
  hint?: string,
  artKey?: string,
  thumbKey?: string,
  videoId?: string,
  priority = 0,
  chapterOrder = Number.MAX_SAFE_INTEGER
): GenericEndingCard {
  const defaultTitle = "?뺣━ 以묒씤 寃곕쭚";

  return {
    ending_id: endingId,
    chapter_id: chapterId,
    title: title ?? defaultTitle,
    summary: summary ?? "?닿툑??寃곕쭚 湲곕줉???꾩쭅 ?뺣━ 以묒씠??",
    hint: hint ?? "??寃곕쭚 寃쎈줈???몃? 湲곕줉? ?꾩냽 ?뺣━ 以묒씠??",
    art_key: artKey ?? buildEndingArtKey(endingId),
    thumb_key: thumbKey ?? buildEndingThumbKey(endingId),
    video_id: videoId ?? buildEndingVideoId(endingId),
    unlocked: Boolean(unlockedAt),
    unlocked_at: unlockedAt,
    priority,
    chapter_order: chapterOrder
  };
}

function collectPartEndingCards(content: GameContentPack, partId: string, unlockedEndings: RuntimeSnapshot["unlocked_endings"], runtime?: RuntimeSnapshot): GenericEndingCard[] {
  const extendedRuntime = runtime ? toExtendedRuntime(runtime) : null;
  const endingGallery = extendedRuntime?.ending_gallery ?? {};
  const unlockedMap = unlockedEndings as Record<string, string | undefined>;
  const partChapterIds = content.chapter_order.filter((chapterId) => getChapterCatalogEntry(chapterId)?.part_id === partId);
  const chapterOrderMap = new Map(partChapterIds.map((chapterId, index) => [chapterId, index]));
  const cards = new Map<string, GenericEndingCard>();

  const upsert = (card: GenericEndingCard) => {
    const existing = cards.get(card.ending_id);
    if (!existing) {
      cards.set(card.ending_id, card);
      return;
    }

    cards.set(card.ending_id, {
      ...existing,
      ...card,
      unlocked: existing.unlocked || card.unlocked,
      unlocked_at: existing.unlocked_at ?? card.unlocked_at,
      video_id: existing.video_id ?? card.video_id,
      priority: Math.max(existing.priority, card.priority),
      chapter_order: Math.min(existing.chapter_order, card.chapter_order)
    });
  };

  for (const chapterId of partChapterIds) {
    const chapter = content.chapters[chapterId];
    for (const rule of chapter.ending_matrix) {
      const registryEntry = endingGallery[rule.ending_id];
      const unlockedAt = registryEntry?.unlocked_at ?? unlockedMap[rule.ending_id];
      upsert(
        buildFallbackEndingCard(
          rule.ending_id,
          chapterId,
          unlockedAt,
          registryEntry?.title ?? rule.title,
          registryEntry?.summary ?? rule.summary,
          registryEntry?.hint ?? rule.hint,
          registryEntry?.art_key,
          registryEntry?.thumb_key,
          registryEntry?.video_id,
          Number(rule.priority ?? 0),
          chapterOrderMap.get(chapterId) ?? Number.MAX_SAFE_INTEGER
        )
      );
    }
  }

  for (const [endingId, registryEntry] of Object.entries(endingGallery)) {
    if (getChapterCatalogEntry(registryEntry.chapter_id)?.part_id !== partId) {
      continue;
    }
    upsert(
      buildFallbackEndingCard(
        endingId,
        registryEntry.chapter_id,
        registryEntry.unlocked_at ?? unlockedMap[endingId],
        registryEntry.title,
        registryEntry.summary,
        registryEntry.hint,
        registryEntry.art_key,
        registryEntry.thumb_key,
        registryEntry.video_id,
        0,
        chapterOrderMap.get(registryEntry.chapter_id) ?? Number.MAX_SAFE_INTEGER
      )
    );
  }

  for (const [endingId, unlockedAt] of Object.entries(unlockedMap)) {
    if (!endingId.startsWith(`${partId}_`)) {
      continue;
    }

    upsert(
      buildFallbackEndingCard(
        endingId,
        (extendedRuntime?.chapter_result_payload && "chapter_id" in extendedRuntime.chapter_result_payload
          ? (extendedRuntime.chapter_result_payload as unknown as { chapter_id?: ChapterId }).chapter_id
          : runtime?.current_chapter_id) ?? (partChapterIds[partChapterIds.length - 1] ?? runtime?.current_chapter_id ?? "CH01"),
        unlockedAt
      )
    );
  }

  return [...cards.values()].sort((left, right) => {
    if (left.chapter_order !== right.chapter_order) {
      return left.chapter_order - right.chapter_order;
    }
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    return left.title.localeCompare(right.title, "ko-KR");
  });
}

function getEndingCardById(content: GameContentPack, endingId: string, unlockedAt?: string, fallbackChapterId?: ChapterId, runtime?: RuntimeSnapshot): GenericEndingCard {
  const partIdMatch = /^(P\d+)_/u.exec(endingId);
  const partId = partIdMatch?.[1] ?? CURRENT_PART_ID;
  const cards = collectPartEndingCards(content, partId, runtime?.unlocked_endings ?? {}, runtime);
  return (
    cards.find((card) => card.ending_id === endingId) ??
    buildFallbackEndingCard(endingId, fallbackChapterId ?? runtime?.current_chapter_id ?? "CH01", unlockedAt)
  );
}

function StatBar({ label, value, maxValue, tone }: { label: string; value: number; maxValue: number; tone?: "warning" | "danger" }) {
  const percentage = Math.max(0, Math.min(100, (value / Math.max(maxValue, 1)) * 100));
  return (
    <div className={`stat-bar ${tone ? `stat-bar-${tone}` : ""}`}>
      <div className="stat-bar-head">
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

const WIDGET_LABELS: Record<string, string> = {
  objective_panel: "Objective Progress",
  party_summary: "Party Status",
  noise_meter: "Noise",
  contamination_meter: "Contamination",
  water_depth: "Water Depth",
  water_level: "Water Level",
  route_compare: "Route Compare",
  route_summary: "Route Summary",
  route_hint: "Route Hint",
  reputation_change: "Reputation Change",
  trust_summary: "Trust Summary",
  loot_summary: "Loot Summary",
  faction_summary: "Faction Summary",
  ending_matrix: "Ending Matrix",
  field_actions_remaining: "Field Actions",
  warning_count: "Warnings",
  card_auth_state: "Card Auth",
  access_key_state: "Access Key",
  heat_meter: "Heat",
  queue_pressure: "Queue Pressure",
  pursuit_meter: "Pursuit",
  smoke_density: "Smoke Density",
  boarding_capacity: "Boarding Capacity",
  stamp_auth: "Stamp Auth",
  checkpoint_auth: "Checkpoint Auth",
  signal_decoder: "Signal Decoder",
  evidence_balance: "Evidence Balance",
  power_router: "Power Router",
  sacrifice_state: "Sacrifice State",
  core_state: "Core State",
  boss_hp: "Boss HP",
  chapter_result: "Chapter Result",
  public_queue: "Public Queue",
  broadcast_prep: "Broadcast Prep",
  platform_vote: "Platform Vote",
  next_part_hook: "Next Part Hook",
  closing_hook: "Closing Hook"
};

const PRESENTATION_ONLY_WIDGETS = new Set([
  "map_overlay",
  "event_card",
  "choice_list",
  "npc_portrait",
  "loot_grid",
  "boss_splash",
  "combat_hud",
  "ending_gallery",
  "ending_grid",
  "ending_thumb",
  "ending_summary",
  "ending_key_art",
  "boss_hint",
  "signal_noise_overlay",
  "rarity_badge"
]);

const NODE_TYPE_LABELS: Record<string, string> = {
  travel: "Travel",
  safehouse: "Safehouse",
  exploration: "Exploration",
  branch: "Branch",
  boss: "Boss",
  route_select: "Route Select"
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  briefing: "Briefing",
  choice: "Choice",
  combat: "Combat",
  result: "Result"
};

const SCREEN_TYPE_LABELS: Record<string, string> = {
  chapter_briefing: "Chapter Briefing",
  world_map: "World Map",
  event_dialogue: "Event Dialogue",
  loot_resolution: "Loot Resolution",
  boss_intro: "Boss Intro",
  combat_arena: "Combat Arena",
  result_summary: "Result Summary",
  route_select: "Route Select",
  safehouse: "Safehouse",
  ending_gallery: "Ending Gallery"
};

const VALUE_LABELS: Record<string, string> = {
  on: "On",
  off: "Off",
  unassigned: "Unassigned",
  silence: "Silence",
  witness: "Witness",
  witness_score: "Witness",
  public: "Public",
  pragmatic: "Pragmatic",
  rescue: "Rescue",
  lock: "Lock",
  release: "Release",
  clean: "Clean",
  broker: "Broker",
  log: "Log",
  order_score: "Order",
  solidarity_score: "Solidarity",
  locked: "Locked",
  active: "Active",
  completed: "Completed"
};

function formatWidgetLabel(widgetId: string): string {
  if (WIDGET_LABELS[widgetId]) {
    return WIDGET_LABELS[widgetId];
  }

  return widgetId
    .replace(/_/gu, " ")
    .replace(/\./gu, " ")
    .trim();
}

function stringifyWidgetValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "耳쒖쭚" : "爰쇱쭚";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  if (typeof value === "string") {
    return VALUE_LABELS[value] ?? value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "-";
}

function formatNodeTypeLabel(nodeType: string): string {
  return NODE_TYPE_LABELS[nodeType] ?? nodeType.replace(/[_-]/gu, " ");
}

function formatEyebrowLabel(eventType?: string, screenType?: string): string {
  if (eventType) {
    return EVENT_TYPE_LABELS[eventType] ?? eventType;
  }

  if (screenType) {
    return SCREEN_TYPE_LABELS[screenType] ?? screenType;
  }

  return "?꾩옣";
}

const UI_WIDGET_LABELS: Record<string, string> = {
  objective_panel: "Objective Progress",
  party_summary: "Party Status",
  noise_meter: "Noise",
  contamination_meter: "Contamination",
  water_depth: "Water Depth",
  water_level: "Water Level",
  route_compare: "Route Compare",
  route_summary: "Route Summary",
  route_hint: "Route Hint",
  reputation_change: "Reputation Change",
  trust_summary: "Trust Summary",
  loot_summary: "Loot Summary",
  faction_summary: "Faction Summary",
  ending_matrix: "Ending Matrix",
  field_actions_remaining: "Field Actions",
  warning_count: "Warnings",
  card_auth_state: "Card Auth",
  access_key_state: "Access Key",
  heat_meter: "Heat",
  queue_pressure: "Queue Pressure",
  pursuit_meter: "Pursuit",
  smoke_density: "Smoke Density",
  boarding_capacity: "Boarding Capacity",
  stamp_auth: "Stamp Auth",
  checkpoint_auth: "Checkpoint Auth",
  signal_decoder: "Signal Decoder",
  evidence_balance: "Evidence Balance",
  power_router: "Power Router",
  sacrifice_state: "Sacrifice State",
  core_state: "Core State",
  boss_hp: "Boss HP",
  chapter_result: "Chapter Result",
  public_queue: "Public Queue",
  broadcast_prep: "Broadcast Prep",
  platform_vote: "Platform Vote",
  next_part_hook: "Next Part Hook",
  closing_hook: "Closing Hook"
};

const UI_PRESENTATION_ONLY_WIDGETS = new Set([
  "arena_tags",
  "capacity_meter",
  "compare_popup",
  "dialogue_box",
  "faction_compare",
  "fall_warning",
  "filter_meter",
  "floor_navigator",
  "hazard_overlay",
  "line_status",
  "loot_preview",
  "node_map",
  "party_loadout",
  "recommended_gear",
  "trade_panel",
  "water_warning",
  "wet_item_badge"
]);

const UI_NODE_TYPE_LABELS: Record<string, string> = {
  travel: "Travel",
  safehouse: "Safehouse",
  exploration: "Exploration",
  branch: "Branch",
  boss: "Boss",
  route_select: "Route Select"
};

const UI_EVENT_TYPE_LABELS: Record<string, string> = {
  briefing: "Briefing",
  choice: "Choice",
  combat: "Combat",
  result: "Result",
  exploration: "Exploration",
  dialogue: "Dialogue",
  danger: "Danger",
  scene: "Scene",
  boss: "Boss",
  extraction: "Extraction"
};

const UI_SCREEN_TYPE_LABELS: Record<string, string> = {
  chapter_briefing: "Chapter Briefing",
  world_map: "World Map",
  event_dialogue: "Event Dialogue",
  loot_resolution: "Loot Resolution",
  boss_intro: "Boss Intro",
  combat_arena: "Combat Arena",
  result_summary: "Result Summary",
  route_select: "Route Select",
  safehouse: "Safehouse",
  ending_gallery: "Ending Gallery"
};

const UI_VALUE_LABELS: Record<string, string> = {
  on: "On",
  off: "Off",
  unassigned: "Unassigned",
  silence: "Silence",
  witness: "Witness",
  witness_score: "Witness",
  public: "Public",
  pragmatic: "Pragmatic",
  rescue: "Rescue",
  lock: "Lock",
  release: "Release",
  clean: "Clean",
  broker: "Broker",
  log: "Log",
  order_score: "Order",
  solidarity_score: "Solidarity",
  official: "Official",
  certified: "Certified",
  medical: "Medical",
  locked: "Locked",
  active: "Active",
  completed: "Completed"
};

function formatUiWidgetLabel(widgetId: string): string {
  if (UI_WIDGET_LABELS[widgetId]) {
    return UI_WIDGET_LABELS[widgetId];
  }

  return widgetId.replace(/_/gu, " ").replace(/\./gu, " ").trim();
}

function stringifyUiWidgetValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "On" : "Off";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  if (typeof value === "string") {
    return UI_VALUE_LABELS[value] ?? value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "-";
}

function formatUiNodeTypeLabel(nodeType: string): string {
  return UI_NODE_TYPE_LABELS[nodeType] ?? nodeType.replace(/[_-]/gu, " ");
}

function formatUiEyebrowLabel(eventType?: string, screenType?: string): string {
  if (eventType) {
    return UI_EVENT_TYPE_LABELS[eventType] ?? eventType;
  }
  if (screenType) {
    return UI_SCREEN_TYPE_LABELS[screenType] ?? screenType;
  }
  return "?꾩옣";
}

function formatUiRouteStateValue(value: string): string {
  return UI_VALUE_LABELS[value] ?? value.replace(/[_-]/gu, " ");
}

function buildUiRouteSummary(runtime: RuntimeSnapshot): string {
  return [
    `利앹뼵 ?몄꽑: ${formatUiRouteStateValue(String(runtime.stats["route.truth"] ?? "silence"))}`,
    `?먮떒 ?깊뼢: ${formatUiRouteStateValue(String(runtime.stats["route.compassion"] ?? "pragmatic"))}`,
    `?듭젣 ?곹깭: ${formatUiRouteStateValue(String(runtime.stats["route.control"] ?? "lock"))}`,
    `鍮꾧났??媛쒖엯: ${formatUiRouteStateValue(String(runtime.stats["route.underworld"] ?? "clean"))}`,
    `?꾩쟻 遺?? ${Number(runtime.stats["route.strain"] ?? 0)}`
  ].join(" | ");
}

function buildUiPartCloseCopy(chapterId: ChapterId, fallback: string): string {
  const closeCopy: Partial<Record<ChapterId, string>> = {
    CH05: "다음 국면: 침수된 교량 이후 생존 브리프로 이어집니다.",
    CH10: "다음 국면: 북상 기록 정리 이후 다음 브리프로 이어집니다.",
    CH15: "다음 국면: 항만 관문 돌파 이후 다음 브리프로 이어집니다.",
    CH20: "작전 종료: 최종 기록과 결말을 다시 확인합니다."
  };

  return closeCopy[chapterId] ?? fallback;
}

function buildUiNextStageCopy(currentChapterId: ChapterId, nextChapterId?: ChapterId, canAdvanceToNextChapter = false): string {
  if (canAdvanceToNextChapter && nextChapterId) {
    const nextChapter = getChapterCatalogEntry(nextChapterId);
    if (nextChapter?.title) {
      return `${nextChapter.title} 브리프로 이어집니다.`;
    }
  }

  return buildUiPartCloseCopy(currentChapterId, "다음 장면으로 이어집니다.");
}

function buildUiResultEyebrow(chapterId: ChapterId, partLabel: string, endingId?: string | null): string {
  if (!endingId) {
    return "챕터 결과";
  }

  return chapterId === "CH20" ? "최종 결말" : `${partLabel} 엔딩`;
}

function buildUiChapterAdvanceLabel(nextChapterId?: ChapterId): string {
  if (!nextChapterId) {
    return "다음 챕터";
  }

  const nextChapter = getChapterCatalogEntry(nextChapterId);
  if (nextChapter?.title) {
    return `${nextChapter.title} 브리프`;
  }

  return `${nextChapterId} 브리프`;
}

function buildUiResultPrimaryActionLabel(
  chapterId: ChapterId,
  outcome: NonNullable<RuntimeSnapshot["chapter_outcome"]>,
  canAdvanceToNextChapter = false
): string {
  if (outcome.ending_id) {
    if (canAdvanceToNextChapter && outcome.next_chapter_id && chapterId !== "CH20") {
      return buildUiChapterAdvanceLabel(outcome.next_chapter_id);
    }

    return chapterId === "CH20" ? "최종 결말 기록 보기" : "엔딩 기록 보기";
  }

  return outcome.campaign_complete ? "파트 처음부터 다시" : "다음 챕터";
}

function buildUiGalleryCloseActionLabel(chapterId: ChapterId, nextChapterId?: ChapterId, canAdvanceToNextChapter = false): string {
  if (canAdvanceToNextChapter && nextChapterId) {
    return buildUiChapterAdvanceLabel(nextChapterId);
  }

  return chapterId === "CH20" ? "최종 기록으로 돌아가기" : "결과로 돌아가기";
}

function buildUiEndingGalleryHeading(chapterId: ChapterId, screenTitle?: string): string {
  return chapterId === "CH20" ? "최종 결말 기록" : screenTitle ?? "엔딩 기록";
}

function buildUiEndingGallerySummary(chapterId: ChapterId, nextChapterId?: ChapterId, canAdvanceToNextChapter = false): string {
  if (chapterId === "CH20") {
    return "최종 결말과 해금된 기록을 다시 확인합니다.";
  }

  if (canAdvanceToNextChapter && nextChapterId) {
    return `${buildUiChapterAdvanceLabel(nextChapterId).replace(/ 브리프/u, "")}로 이어지기 전에 엔딩 기록을 다시 확인합니다.`;
  }

  return "해금된 엔딩과 파트 종료 기록을 다시 확인합니다.";
}

function readChapterWidgetValue(runtime: RuntimeSnapshot, chapterId: string, widgetId: string): unknown {
  const widgetState = toExtendedRuntime(runtime).chapter_widgets_state as Record<string, unknown> | undefined;
  const bucket = widgetState?.[chapterId];
  if (!bucket || typeof bucket !== "object") {
    const flatEntry = widgetState?.[widgetId];
    if (flatEntry && typeof flatEntry === "object" && "value" in (flatEntry as Record<string, unknown>)) {
      return (flatEntry as { value?: unknown }).value;
    }
    return flatEntry;
  }

  const entry = (bucket as Record<string, unknown>)[widgetId];
  if (entry && typeof entry === "object" && "value" in (entry as Record<string, unknown>)) {
    return (entry as { value?: unknown }).value;
  }

  return entry;
}

function resolveFieldActionsValue(runtime: RuntimeSnapshot, chapterId: string): number | undefined {
  const extendedRuntime = toExtendedRuntime(runtime) as ExtendedRuntimeSnapshot & {
    field_actions_remaining?: number | Record<string, unknown>;
  };

  if (typeof extendedRuntime.field_actions_remaining === "number") {
    return extendedRuntime.field_actions_remaining;
  }

  if (extendedRuntime.field_actions_remaining && typeof extendedRuntime.field_actions_remaining === "object") {
    const value = (extendedRuntime.field_actions_remaining as Record<string, unknown>)[chapterId];
    return typeof value === "number" ? value : undefined;
  }

  return undefined;
}

function resolveWidgetValue(
  widgetId: string,
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  chapterId: string,
  partEndingCount: number
): unknown {
  const extendedRuntime = toExtendedRuntime(runtime);
  const resultWidgetValue = (extendedRuntime.chapter_result_payload as unknown as { widget_state?: Record<string, unknown> } | null)?.widget_state?.[widgetId];
  if (resultWidgetValue !== undefined) {
    return resultWidgetValue;
  }

  const chapterWidgetValue = readChapterWidgetValue(runtime, chapterId, widgetId);
  if (chapterWidgetValue !== undefined) {
    return chapterWidgetValue;
  }

  switch (widgetId) {
    case "objective_panel": {
      const objectives = content.chapters[chapterId]?.objectives ?? [];
      const completed = objectives.filter(
        (objective) => runtime.chapter_progress[chapterId]?.objective_completion[objective.objective_id] === true
      ).length;
      return `${completed}/${objectives.length}`;
    }
    case "party_summary":
      return `체력 ${Number(runtime.stats.hp ?? 0)} / ${Number(runtime.stats.max_hp ?? 0)}`;
    case "route_compare":
    case "route_summary":
    case "route_hint":
      return String(runtime.chapter_progress[chapterId]?.selected_route ?? runtime.stats["route.current"] ?? "unassigned");
    case "trade_panel":
      return Object.keys(runtime.inventory.quantities ?? {}).length > 0 ? "거래 가능" : "교환 물자 부족";
    case "reputation_change": {
      const activeReputation = Object.entries(runtime.stats).filter(
        ([key, value]) =>
          (key.startsWith("trust.") || key.startsWith("reputation.")) &&
          typeof value === "number" &&
          Number(value) !== 0
      ).length;
      return activeReputation > 0 ? `${activeReputation}개 평판 변화` : "변화 없음";
    }
    case "core_state":
      return String(runtime.chapter_progress[chapterId]?.selected_route ?? runtime.stats["route.current"] ?? "unassigned");
    case "ending_matrix":
      return partEndingCount;
    case "field_actions_remaining":
      return resolveFieldActionsValue(runtime, chapterId) ?? 0;
    case "warning_count":
      return "湲곕줉 湲곗?";
    case "next_part_hook": {
      const nextPartHooks: Partial<Record<ChapterId, string>> = {
        CH05: "?⑤? 寃臾몄꽑 遺뺢눼",
        CH10: "遺곸긽?섎뒗 寃臾?湲곕줉",
        CH15: "?명빐 愿臾??좊퀎"
      };
      return nextPartHooks[chapterId] ?? undefined;
    }
    case "closing_hook":
      return chapterId === "CH20" ? "理쒖쥌 寃곕쭚 湲곕줉 蹂닿린" : undefined;
    default:
      break;
  }

  if (runtime.stats[widgetId] !== undefined) {
    return runtime.stats[widgetId];
  }
  if (runtime.flags[widgetId] !== undefined) {
    return runtime.flags[widgetId];
  }

  return undefined;
}

function compactStoryText(value: string | null | undefined): string {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

function getNarrativeBlocks(event: EventDefinition | null): EventSceneBlock[] {
  if (!event) {
    return [];
  }

  const blocks = (event.text.scene_blocks ?? []).filter((block) => block.lines.length > 0);
  if (blocks.length > 0) {
    return blocks;
  }

  return event.text.body
    .filter((paragraph) => compactStoryText(paragraph).length > 0)
    .map((paragraph, index) => ({
      block_id: `${event.event_id}_fallback_${index + 1}`,
      kind: "narration",
      lines: [paragraph]
    }));
}

function getStoryLogEntries(runtime: RuntimeSnapshot, limit = 4): StoryLogEntry[] {
  return [...(runtime.story_log ?? [])].slice(-limit).reverse();
}

function getPortraitRailItems(event: EventDefinition | null): Array<{ key: string; label: string; artKey?: string }> {
  if (!event) {
    return [];
  }

  const seen = new Set<string>();
  const items: Array<{ key: string; label: string; artKey?: string }> = [];

  for (const block of getNarrativeBlocks(event)) {
    const label = compactStoryText(block.speaker_label);
    if (!label) {
      continue;
    }

    const key = `${block.speaker_id ?? label}:${block.portrait_art_key ?? event.presentation.art_key ?? "portrait"}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push({
      key,
      label,
      artKey: block.portrait_art_key ?? event.presentation.art_key
    });
  }

  if (items.length === 0 && event.presentation.art_key) {
    items.push({
      key: `${event.event_id}:default`,
      label: event.title,
      artKey: event.presentation.art_key
    });
  }

  return items;
}

function buildOutcomeSceneBlocks(runtime: RuntimeSnapshot): EventSceneBlock[] {
  return getStoryLogEntries(runtime, 3).map((entry, index) => ({
    block_id: `${entry.entry_id}:${index}`,
    kind: index === 0 ? "dialogue" : "narration",
    speaker_label: entry.speaker_labels[0] ?? "湲곕줉",
    lines: [entry.summary].filter(Boolean)
  }));
}

function StorySceneStack({
  title,
  summary,
  blocks,
  carryLine
}: {
  title: string;
  summary?: string;
  blocks: EventSceneBlock[];
  carryLine?: string;
}) {
  const hasNarrativeContent = Boolean(summary) || blocks.length > 0;

  return (
    <div className="story-scene-stack" aria-label={title}>
      {summary ? <div className="storybook-summary">{summary}</div> : null}
      {blocks.map((block) => (
        <article key={block.block_id} className={`scene-block-card scene-block-${block.kind}`}>
          {block.speaker_label ? <p className="scene-speaker">{block.speaker_label}</p> : null}
          <div className="scene-lines">
            {block.lines.map((line, index) => (
              <p key={`${block.block_id}:${index}`} className="scene-line">
                {line}
              </p>
            ))}
          </div>
          {block.emphasis ? <p className="scene-emphasis">{block.emphasis}</p> : null}
        </article>
      ))}
      {carryLine ? <p className="carry-line">"{carryLine}"</p> : null}
      {!hasNarrativeContent ? <p className="muted-copy">?꾩쭅 ?댁뼱吏???λ㈃???녿떎. ?대쾲 ?좏깮遺??湲곕줉???댁뼱吏꾨떎.</p> : null}
    </div>
  );
}

function StoryLogPanel({ entries }: { entries: StoryLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="story-log-panel card">
        <p className="eyebrow">吏곸쟾 湲곕줉</p>
        <p className="muted-copy">?꾩쭅 ?볦씤 湲곕줉???녿떎. ?대쾲 ?좏깮??泥?湲곕줉?쇰줈 ?⑤뒗??</p>
      </div>
    );
  }

  return (
    <div className="story-log-panel card">
      <p className="eyebrow">吏곸쟾 湲곕줉</p>
      <div className="story-log-list">
        {entries.map((entry) => (
          <article key={entry.entry_id} className="story-log-card">
            <span>{entry.speaker_labels[0] ?? "湲곕줉"}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
            {entry.carry_line ? <span>{entry.carry_line}</span> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function StoryLogPanelClean({ entries }: { entries: StoryLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="story-log-panel card">
        <p className="eyebrow">吏곸쟾 湲곕줉</p>
        <p className="muted-copy">?꾩쭅 ?볦씤 湲곕줉???녿떎. ?대쾲 ?좏깮??泥?湲곕줉?쇰줈 ?⑤뒗??</p>
      </div>
    );
  }

  return (
    <div className="story-log-panel card">
      <p className="eyebrow">吏곸쟾 湲곕줉</p>
      <div className="story-log-list">
        {entries.map((entry) => (
          <article key={entry.entry_id} className="story-log-card">
            <span>{entry.speaker_labels[0] ?? "湲곕줉"}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
            {entry.carry_line ? <span>{entry.carry_line}</span> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function WidgetRail({
  widgetIds,
  content,
  runtime,
  chapterId,
  partEndingCount
}: {
  widgetIds: string[];
  content: GameContentPack;
  runtime: RuntimeSnapshot;
  chapterId: string;
  partEndingCount: number;
}) {
  if (widgetIds.length === 0) {
    return null;
  }

  const widgetItems = widgetIds
    .filter((widgetId) => !PRESENTATION_ONLY_WIDGETS.has(widgetId) && !UI_PRESENTATION_ONLY_WIDGETS.has(widgetId))
    .map((widgetId) => ({
      widgetId,
      value: resolveWidgetValue(widgetId, content, runtime, chapterId, partEndingCount)
    }))
    .filter((entry) => entry.value !== undefined);

  if (widgetItems.length === 0) {
    return null;
  }

  return (
    <div className="widget-rail">
      {widgetItems.map(({ widgetId, value }) => (
        <div key={widgetId} className="widget-card card">
          <span className="widget-label">{formatUiWidgetLabel(widgetId)}</span>
          <strong className="widget-value">{stringifyUiWidgetValue(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function formatRouteStateValue(value: string): string {
  return UI_VALUE_LABELS[value] ?? value.replace(/[_-]/gu, " ");
}

function buildRouteSummary(runtime: RuntimeSnapshot): string {
  const summary = [
    `利앹뼵 ?몄꽑: ${formatRouteStateValue(String(runtime.stats["route.truth"] ?? "silence"))}`,
    `?먮떒 ?깊뼢: ${formatRouteStateValue(String(runtime.stats["route.compassion"] ?? "pragmatic"))}`,
    `?듭젣 ?곹깭: ${formatRouteStateValue(String(runtime.stats["route.control"] ?? "lock"))}`,
    `鍮꾧났??媛쒖엯: ${formatRouteStateValue(String(runtime.stats["route.underworld"] ?? "clean"))}`,
    `?꾩쟻 遺?? ${Number(runtime.stats["route.strain"] ?? 0)}`
  ];

  return summary.join(" | ");
}

function buildPartCloseCopy(chapterId: ChapterId, fallback: string): string {
  const closeCopy: Partial<Record<ChapterId, string>> = {
    CH05: "다음 국면: 붕괴 구역 정리 이후 다음 브리프로 이어집니다.",
    CH10: "다음 국면: 북상 작전 기록 이후 다음 브리프로 이어집니다.",
    CH15: "다음 국면: 항만 관문 돌파 이후 다음 브리프로 이어집니다.",
    CH20: "작전 종료: 최종 게임 기록과 결말을 다시 확인합니다."
  };

  return closeCopy[chapterId] ?? fallback;
}

function buildNextStageCopy(currentChapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (nextChapterId) {
    const nextChapter = getChapterCatalogEntry(nextChapterId);
    if (nextChapter?.title) {
      return `${nextChapter.title}로 이어집니다.`;
    }
  }

  return buildPartCloseCopy(currentChapterId, "다음 장면으로 이어집니다.");
}

function buildResultEyebrow(chapterId: ChapterId, partLabel: string, endingId?: string | null): string {
  if (!endingId) {
    return "챕터 결과";
  }

  return chapterId === "CH20" ? "최종 결말" : `${partLabel} 엔딩`;
}

function buildChapterAdvanceLabel(nextChapterId?: ChapterId): string {
  if (!nextChapterId) {
    return "다음 챕터";
  }

  const nextChapter = getChapterCatalogEntry(nextChapterId);
  if (nextChapter?.title) {
    return `${nextChapter.title} 브리프`;
  }

  return `${nextChapterId} 브리프`;
}

function buildResultPrimaryActionLabel(chapterId: ChapterId, outcome: NonNullable<RuntimeSnapshot["chapter_outcome"]>): string {
  if (outcome.ending_id) {
    if (outcome.next_chapter_id && chapterId !== "CH20") {
      return buildChapterAdvanceLabel(outcome.next_chapter_id);
    }

    if (chapterId === "CH20") {
      return "최종 결말 기록 보기";
    }

    return "엔딩 기록 보기";
  }

  return outcome.campaign_complete ? "파트 다시 시작" : "다음 챕터";
}

function buildGalleryCloseActionLabel(chapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (nextChapterId) {
    return buildChapterAdvanceLabel(nextChapterId);
  }

  return chapterId === "CH20" ? "최종 기록으로 돌아가기" : "결과로 돌아가기";
}

function buildEndingGalleryHeading(chapterId: ChapterId, screenTitle?: string): string {
  if (chapterId === "CH20") {
    return "최종 결말 기록";
  }

  return screenTitle ?? "엔딩 기록";
}

function buildEndingGallerySummary(chapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (chapterId === "CH20") {
    return "해금된 엔딩과 최종 결말 기록을 다시 확인합니다.";
  }

  if (nextChapterId) {
    return `${buildChapterAdvanceLabel(nextChapterId).replace(/ 브리프/u, "")}로 이어지기 전에 기록을 다시 확인합니다.`;
  }

  return "해금된 엔딩과 다음 작전을 준비하기 전 기록을 다시 확인합니다.";
}

void formatWidgetLabel;
void stringifyWidgetValue;
void formatNodeTypeLabel;
void formatEyebrowLabel;
void StoryLogPanel;
void buildRouteSummary;
void buildNextStageCopy;
void buildResultEyebrow;
void buildResultPrimaryActionLabel;
void buildGalleryCloseActionLabel;
void buildEndingGalleryHeading;
void buildEndingGallerySummary;

function App() {
  const partLabel = `?뚰듃 ${CURRENT_PART_ID.replace("P", "")}`;
  const {
    bootState,
    bootError,
    content,
    runtime,
    warnings,
    selectedChoiceId,
    bootstrapPack,
    startMission,
    proceedHub,
    moveToNode,
    selectChoice,
    startBossCombat,
    toggleLootSelection,
    confirmLoot,
    resolveBattleAction,
    confirmResult,
    openEndingGallery,
    closeEndingGallery,
    resetRun
  } = useGameStore();
  const [selectedGalleryEndingId, setSelectedGalleryEndingId] = useState<string | null>(null);
  const currentEndingId = runtime?.chapter_outcome?.ending_id;
  const partEndingCards = useMemo(
    () => (content && runtime ? collectPartEndingCards(content, CURRENT_PART_ID, runtime.unlocked_endings, runtime) : []),
    [content, runtime]
  );
  const unlockedEndingIds = useMemo(
    () => partEndingCards.filter((ending) => ending.unlocked).map((ending) => ending.ending_id),
    [partEndingCards]
  );
  const unlockedEndingCount = unlockedEndingIds.length;

  useEffect(() => {
    void bootstrapPack();
  }, [bootstrapPack]);

  useEffect(() => {
    if (!runtime || runtime.ui_screen !== "ending_gallery") {
      return;
    }

    if (currentEndingId) {
      setSelectedGalleryEndingId(currentEndingId);
      return;
    }

    setSelectedGalleryEndingId((previous) => previous ?? unlockedEndingIds[0] ?? partEndingCards[0]?.ending_id ?? null);
  }, [currentEndingId, runtime, unlockedEndingIds, partEndingCards]);

  if (bootState === "idle" || bootState === "loading" || !content || !runtime) {
    return (
      <div className="boot-screen">
        <div className={`boot-card ${bootState === "error" ? "is-error" : ""}`}>
          <p className="eyebrow">DonggrolGameBook {partLabel}</p>
          <h1>콘텐츠 초기화 중</h1>
          <p className="muted-copy">{bootState === "error" ? bootError : `${partLabel} 콘텐츠와 생성 자산 계약을 불러오는 중입니다.`}</p>
        </div>
      </div>
    );
  }

  const chapter = content.chapters[runtime.current_chapter_id];
  const uiFlow = content.ui_flows[runtime.current_chapter_id];
  const screen = uiFlow?.screens.find((entry) => entry.screen_id === runtime.current_screen_id) ?? uiFlow?.screens[0];
  const currentNode = runtime.current_node_id ? chapter.nodes_by_id[runtime.current_node_id] : null;
  const currentEvent = runtime.current_event_id ? chapter.events_by_id[runtime.current_event_id] : null;
  const currentNarrativeBlocks = getNarrativeBlocks(currentEvent);
  const portraitRailItems = getPortraitRailItems(currentEvent);
  const recentStoryEntries = getStoryLogEntries(runtime, 4);
  const resultSceneBlocks = buildOutcomeSceneBlocks(runtime);
  const chapterMedia = getPart1ChapterMedia(runtime.current_chapter_id);
  const chapterRuntimeConfig = getChapterRuntimeConfig(runtime.current_chapter_id);
  const openingVideoId = chapterMedia?.opening_video_id ?? `${CURRENT_PART_ID}_${runtime.current_chapter_id}_OPENING`;
  const currentEndingCard = currentEndingId
    ? getEndingCardById(content, currentEndingId, (runtime.unlocked_endings as Record<string, string | undefined>)[currentEndingId], runtime.current_chapter_id, runtime)
    : null;
  const selectedEndingId = selectedGalleryEndingId ?? currentEndingId ?? unlockedEndingIds[0] ?? partEndingCards[0]?.ending_id ?? null;
  const selectedEndingCard =
    (selectedEndingId ? partEndingCards.find((ending) => ending.ending_id === selectedEndingId) : null) ??
    (selectedEndingId
      ? getEndingCardById(
          content,
          selectedEndingId,
          (runtime.unlocked_endings as Record<string, string | undefined>)[selectedEndingId],
          runtime.current_chapter_id,
          runtime
        )
      : null);
  const hp = Number(runtime.stats.hp ?? 0);
  const maxHp = Number(runtime.stats.max_hp ?? 100);
  const contamination = Number(runtime.stats.contamination ?? 0);
  const noise = Number(runtime.stats.noise ?? 0);
  const routeSummary = buildUiRouteSummary(runtime);
  const screenWidgetIds = [...new Set([...(screen?.widgets ?? []), ...(currentEvent?.presentation.widget_overrides ?? [])])];
  const resultPayload = (toExtendedRuntime(runtime).chapter_result_payload ??
    ((runtime.chapter_outcome as { chapter_result_payload?: ChapterResultView } | null)?.chapter_result_payload ?? null)) as ChapterResultView | null;
  const canOpenEndingGallery = Boolean(uiFlow?.screens.some((entry) => entry.screen_type === "ending_gallery"));
  const canAdvanceToNextChapter = Boolean(
    runtime.chapter_outcome?.next_chapter_id && content.chapters[runtime.chapter_outcome.next_chapter_id]
  );
  const resultPrimaryOpensGallery = Boolean(
    runtime.ui_screen === "result_summary" &&
    runtime.chapter_outcome?.ending_id &&
    (!canAdvanceToNextChapter || runtime.current_chapter_id === "CH20")
  );
  const resultSecondaryGalleryActionVisible = Boolean(
    runtime.ui_screen === "result_summary" &&
    runtime.chapter_outcome?.ending_id &&
    canOpenEndingGallery &&
    runtime.current_chapter_id !== "CH20" &&
    canAdvanceToNextChapter
  );
  const showHeaderGalleryShortcut =
    canOpenEndingGallery &&
    runtime.ui_screen !== "ending_gallery" &&
    !resultPrimaryOpensGallery &&
    !resultSecondaryGalleryActionVisible &&
    unlockedEndingCount > 0;
  const headerGalleryActionLabel = runtime.current_chapter_id === "CH20" ? "理쒖쥌 寃곕쭚 湲곕줉 蹂닿린" : "?붾뵫 湲곕줉 蹂닿린";
  const dashboardTitle =
    runtime.ui_screen === "ending_gallery"
      ? buildUiEndingGalleryHeading(runtime.current_chapter_id, screen?.title)
      : runtime.ui_screen === "result_summary"
        ? runtime.chapter_outcome?.ending_title ?? screen?.title ?? runtime.chapter_outcome?.title ?? chapter.title
        : currentEvent?.title ?? screen?.title ?? chapter.title;
  const dashboardPurpose =
    runtime.ui_screen === "ending_gallery"
      ? buildUiEndingGallerySummary(runtime.current_chapter_id, runtime.chapter_outcome?.next_chapter_id, canAdvanceToNextChapter)
      : runtime.ui_screen === "result_summary"
        ? runtime.chapter_outcome?.summary ?? screen?.purpose ?? chapter.role
        : currentEvent?.text.summary ?? screen?.purpose ?? chapter.role;

  const backdropKey =
    runtime.ui_screen === "chapter_briefing"
      ? chapterMedia?.briefing_art_key ?? chapter.chapter_cinematic?.still_art_key ?? chapterRuntimeConfig?.default_art_key
      : runtime.ui_screen === "world_map"
        ? chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key ?? chapterRuntimeConfig?.default_art_key
        : runtime.ui_screen === "boss_intro" || runtime.ui_screen === "combat_arena"
          ? currentEvent?.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key ?? chapterRuntimeConfig?.default_art_key
          : runtime.ui_screen === "result_summary"
            ? currentEndingCard?.art_key ??
              chapterMedia?.result_art_key ??
              chapter.chapter_cinematic?.result_card_art_key ??
              chapterRuntimeConfig?.default_art_key
            : runtime.ui_screen === "ending_gallery"
              ? selectedEndingCard?.art_key ?? "ending_placeholder"
              : currentEvent?.presentation.art_key ??
                chapterMedia?.map_art_key ??
                chapter.chapter_cinematic?.world_map_art_key ??
                chapterRuntimeConfig?.default_art_key;

  return (
    <div
      className="runtime-shell"
      data-part={CURRENT_PART_ID}
      data-screen={runtime.ui_screen}
      data-chapter={runtime.current_chapter_id}
    >
      <div className="runtime-backdrop">
        <ArtFrame
          artKey={backdropKey}
          chapterId={runtime.current_chapter_id}
          caption={screen?.title}
          screenLabel={screen?.title}
          placeholderMode="simple"
        />
      </div>

      <div className="runtime-overlay">
        <div className="dashboard-page">
          <div className="card dashboard-header">
            <p className="eyebrow">{runtime.current_chapter_id}</p>
            <h1>{dashboardTitle}</h1>
            <p className="dash-muted">{dashboardPurpose}</p>
            <p className="dash-muted">{routeSummary}</p>
            <div className="choice-actions">
              {showHeaderGalleryShortcut ? (
                <button className="ghost-button" onClick={openEndingGallery}>
                  {headerGalleryActionLabel}
                </button>
              ) : null}
              <button className="ghost-button" onClick={resetRun}>
                {partLabel} 다시 시작
              </button>
            </div>
          </div>

          <div className="runtime-overlay-row">
            <div className="runtime-drawer card">
              <StatBar label="체력" value={hp} maxValue={maxHp} tone={hp <= 35 ? "danger" : undefined} />
              <StatBar label="소음" value={noise} maxValue={20} tone={noise >= 12 ? "warning" : undefined} />
              <StatBar label="오염" value={contamination} maxValue={20} tone={contamination >= 10 ? "danger" : undefined} />
            </div>
          </div>

          <WidgetRail
            widgetIds={screenWidgetIds}
            content={content}
            runtime={runtime}
            chapterId={runtime.current_chapter_id}
            partEndingCount={partEndingCards.length}
          />

          {runtime.ui_screen === "chapter_briefing" ? (
            <div className="screen-card briefing-screen split-layout">
              <div>
                <div className="briefing-track-groups">
                  <div className="briefing-track-group">
                    <h3>紐⑺몴</h3>
                    <ul className="objective-list">
                      {chapter.objectives.map((objective) => (
                        <li
                          key={objective.objective_id}
                          className={runtime.chapter_progress[runtime.current_chapter_id]?.objective_completion[objective.objective_id] ? "is-complete" : ""}
                        >
                          <strong>{objective.text}</strong>
                          <span>{objective.required ? "二?紐⑺몴" : "蹂댁“ 紐⑺몴"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="choice-actions">
                  <button className="primary-button" onClick={startMission}>
                    ?묒쟾 ?쒖옉
                  </button>
                </div>
              </div>

              <div className="screen-side-stack briefing-visual-panel">
                <VideoCard videoId={openingVideoId} chapterId={runtime.current_chapter_id} />
                <div className="briefing-visual-grid">
                  <div className="briefing-visual-large">
                    <ArtFrame
                      artKey={
                        chapterMedia?.briefing_art_key ??
                        chapter.chapter_cinematic?.still_art_key ??
                        chapterRuntimeConfig?.default_art_key
                      }
                      chapterId={runtime.current_chapter_id}
                  caption="梨뺥꽣 釉뚮━???ㅽ떥"
                      screenLabel="chapter_briefing"
                    />
                  </div>
                  <ArtFrame
                    artKey={chapter.chapter_cinematic?.anchor_portrait_key}
                    chapterId={runtime.current_chapter_id}
                caption="?듭떖 ?몃Ъ"
                    screenLabel="anchor_portrait"
                  />
                  <ArtFrame
                    artKey={chapter.chapter_cinematic?.support_portrait_key}
                    chapterId={runtime.current_chapter_id}
                caption="吏???몃Ъ"
                    screenLabel="support_portrait"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "world_map" ? (
            <div className="screen-card split-layout map-screen-grid">
              <div className="node-map-shell">
                <div className="node-map-grid">
                  <svg className="node-map-lines" viewBox="0 0 1000 600" preserveAspectRatio="none">
                    {chapter.nodes.flatMap((node) =>
                      node.connections.map((connection) => {
                        const target = chapter.nodes_by_id[connection.to];
                        if (!target) {
                          return null;
                        }
                        return (
                          <line
                            key={`${node.node_id}-${connection.to}`}
                            x1={node.coordinates.x}
                            y1={node.coordinates.y}
                            x2={target.coordinates.x}
                            y2={target.coordinates.y}
                          />
                        );
                      })
                    )}
                  </svg>

                  {chapter.nodes.map((node) => (
                    <button
                      key={node.node_id}
                      className={`map-node ${runtime.current_node_id === node.node_id ? "is-current" : ""} ${
                        runtime.visited_nodes[runtime.current_chapter_id]?.[node.node_id] ? "is-visited" : ""
                      }`}
                      style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
                      onClick={() => moveToNode(node.node_id)}
                    >
                      <span className="map-node-id">{node.node_id}</span>
                      <strong>{node.name}</strong>
                  <div>{formatUiNodeTypeLabel(node.node_type)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="intel-panel">
                <div className="card intel-section">
                <h4>현재 노드</h4>
                  <p>{currentNode?.description ?? "다음 경로를 확인하기 위해 노드를 선택합니다."}</p>
                </div>

                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 3)} />

                <div className="card intel-section">
                  <h4>인벤토리</h4>
                  <ul className="intel-list">
                    {Object.entries(runtime.inventory.quantities).length === 0 ? (
                      <li>?꾩옱 ?ㅺ퀬 ?덈뒗 臾쇳뭹???녿떎.</li>
                    ) : (
                      Object.entries(runtime.inventory.quantities).map(([itemId, quantity]) => (
                        <li key={itemId} className="inventory-entry">
                          <ItemIcon content={content} itemId={itemId} />
                          <div className="inventory-entry-copy">
                            <strong>{getItemDisplayName(content, itemId)}</strong>
                            <span>x{quantity}</span>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="card intel-section">
                  <h4>?꾩옣 ?쒖빞</h4>
                  <ArtFrame
                    artKey={
                      chapterMedia?.map_art_key ??
                      chapter.chapter_cinematic?.world_map_art_key ??
                      chapterRuntimeConfig?.default_art_key
                    }
                    chapterId={runtime.current_chapter_id}
                    caption="?꾩옣 ?쒖빞"
                    screenLabel="world_map"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "event_dialogue" || runtime.ui_screen === "safehouse" || runtime.ui_screen === "route_select" ? (
            <div className="screen-card storybook-layout">
              <div className="story-main-panel">
                <p className="eyebrow">{formatUiEyebrowLabel(currentEvent?.event_type, runtime.ui_screen)}</p>
                <h2>{currentEvent?.title ?? screen?.title ?? chapter.title}</h2>
                {currentEvent ? (
                  <>
                    <StorySceneStack
                      title={currentEvent.title}
                      summary={currentEvent.text.summary}
                      blocks={currentNarrativeBlocks}
                      carryLine={currentEvent.text.carry_line}
                    />
                    <div className="choice-list">
                      {currentEvent.choices.map((choice) => (
                        <button key={choice.choice_id} className="choice-card" onClick={() => selectChoice(choice.choice_id)}>
                          <strong>{choice.label}</strong>
                          <span>{choice.preview ?? "???좏깮 吏곹썑 ?꾩옣 遺꾩쐞湲곗? ?뺣컯???щ씪吏꾨떎."}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
              <div className="event-summary">{screen?.purpose ?? "寃쎈줈 ?덈툕 媛쒖슂瑜??뺤씤?쒕떎."}</div>
                    <p>{chapter.role}</p>
                    <div className="choice-actions">
                      <button className="primary-button" onClick={proceedHub}>
                    吏?꾨줈 ?대룞
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="screen-side-stack story-side-panel">
                <ArtFrame
                  artKey={currentEvent?.presentation.art_key ?? chapterRuntimeConfig?.default_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={currentEvent?.title}
                  screenLabel={runtime.ui_screen}
                />
                {portraitRailItems.length > 0 ? (
                  <div className="portrait-rail card">
                    <p className="eyebrow">?깆옣 ?몃Ъ</p>
                    <div className="portrait-rail-list">
                      {portraitRailItems.map((item) => (
                        <div key={item.key} className="portrait-rail-item">
                          <ArtFrame
                            artKey={item.artKey}
                            chapterId={runtime.current_chapter_id}
                            caption={item.label}
                            screenLabel="portrait_rail"
                          />
                          <strong>{item.label}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 3)} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "loot_resolution" && runtime.loot_session ? (
            <div className="screen-card split-layout">
              <div>
                <h2>猷⑦똿 ?뺤궛</h2>
                <p>{runtime.loot_session.source_event_id}?먯꽌 ?뺣낫??臾쇳뭹???뺣━?쒕떎.</p>
                <div className="choice-list">
                  {runtime.loot_session.drops.map((drop) => (
                    <button
                      key={drop.item_id}
                      className={`loot-card ${drop.selected ? "is-selected" : ""}`}
                      onClick={() => toggleLootSelection(drop.item_id)}
                    >
                      <div className="loot-card-head">
                        <ItemIcon content={content} itemId={drop.item_id} />
                        <div className="loot-card-meta">
                          <strong>{getItemDisplayName(content, drop.item_id)}</strong>
                          <span>x{drop.quantity}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmLoot}>
                    猷⑦똿 ?뺤젙
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
              caption="寃곌낵 移대뱶"
                  screenLabel="loot_resolution"
                />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "boss_intro" && currentEvent ? (
            <div className="screen-card storybook-layout boss-screen">
              <div className="story-main-panel">
                <p className="eyebrow">寃곗쟾 吏곸쟾</p>
                <h2>{screen?.title ?? currentEvent.title}</h2>
                {screen?.purpose ? <p className="muted-copy">{screen.purpose}</p> : null}
                <StorySceneStack
                  title={currentEvent.title}
                  summary={currentEvent.text.summary}
                  blocks={currentNarrativeBlocks}
                  carryLine={currentEvent.text.carry_line}
                />
                <div className="choice-list">
                  {currentEvent.choices.map((choice) => (
                    <button
                      key={choice.choice_id}
                      className={`choice-card ${selectedChoiceId === choice.choice_id ? "is-selected" : ""}`}
                      onClick={() => selectChoice(choice.choice_id)}
                    >
                      <strong>{choice.label}</strong>
                      <span>{choice.preview}</span>
                    </button>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={startBossCombat} disabled={!selectedChoiceId}>
                    寃곗쟾 ?쒖옉
                  </button>
                </div>
              </div>

              <div className="screen-side-stack story-side-panel">
                <ArtFrame
                  artKey={currentEvent.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key}
                  chapterId={runtime.current_chapter_id}
                  caption={screen?.title ?? "蹂댁뒪 議곗슦"}
                  screenLabel="boss_intro"
                />
                {portraitRailItems.length > 0 ? (
                  <div className="portrait-rail card">
                    <p className="eyebrow">?깆옣 ?몃Ъ</p>
                    <div className="portrait-rail-list">
                      {portraitRailItems.map((item) => (
                        <div key={item.key} className="portrait-rail-item">
                          <ArtFrame
                            artKey={item.artKey}
                            chapterId={runtime.current_chapter_id}
                            caption={item.label}
                            screenLabel="boss_portrait_rail"
                          />
                          <strong>{item.label}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 3)} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "combat_arena" ? (
            <div className="screen-card split-layout">
              <div>
                <p className="eyebrow">?꾪닾</p>
                <h2>{currentEvent?.title ?? "전투 구역"}</h2>
                <div className="choice-list">
                  {runtime.battle_state.units.map((unit, index) => (
                    <div key={`${unit.enemy_id}-${index}`} className="choice-card">
                      <strong>{unit.name}</strong>
                      <span>
                        체력 {unit.current_hp} / {unit.max_hp}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={() => resolveBattleAction("attack")}>
                    怨듦꺽
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("skill")}>
                    ?ㅽ궗
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("item")}>
                    ?꾩씠??
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("move")}>
                    ?대룞
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={currentEvent?.presentation.art_key ?? chapter.chapter_cinematic?.boss_splash_key}
                  chapterId={runtime.current_chapter_id}
                  caption="?꾪닾 援ъ뿭"
                  screenLabel="combat_arena"
                />
                {portraitRailItems.length > 0 ? (
                  <div className="portrait-rail card">
                    <p className="eyebrow">?깆옣 ?몃Ъ</p>
                    <div className="portrait-rail-list">
                      {portraitRailItems.slice(0, 1).map((item) => (
                        <div key={item.key} className="portrait-rail-item">
                          <ArtFrame
                            artKey={item.artKey}
                            chapterId={runtime.current_chapter_id}
                            caption={item.label}
                            screenLabel="combat_portrait_rail"
                          />
                          <strong>{item.label}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 2)} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "result_summary" && runtime.chapter_outcome ? (
            <div className="screen-card storybook-layout result-screen">
              <div className="story-main-panel">
                <p className="eyebrow">
                  {buildUiResultEyebrow(runtime.current_chapter_id, partLabel, runtime.chapter_outcome.ending_id)}
                </p>
                <h2>{runtime.chapter_outcome.ending_title ?? screen?.title ?? runtime.chapter_outcome.title}</h2>
                {screen?.purpose ? <p className="muted-copy">{screen.purpose}</p> : null}
                <StorySceneStack
                  title={runtime.chapter_outcome.ending_title ?? runtime.chapter_outcome.title}
                  summary={runtime.chapter_outcome.summary}
                  blocks={resultSceneBlocks}
                  carryLine={recentStoryEntries[0]?.carry_line}
                />
                <p className="muted-copy">
                  {buildUiNextStageCopy(runtime.current_chapter_id, runtime.chapter_outcome.next_chapter_id, canAdvanceToNextChapter)}
                </p>
                {currentEndingCard ? (
                  <div className="result-hook-card">
                    <strong>{currentEndingCard.hint}</strong>
                  </div>
                ) : null}
                {resultPayload ? (
                  <div className="result-payload-grid">
                    <div className="card">
                      <p className="eyebrow">목표</p>
                      <ul className="intel-list">
                        {resultPayload.objective_summary.map((objective) => (
                          <li key={objective.objective_id}>
                            <strong>{objective.completed ? "완료" : "대기"}</strong>
                            <span>{objective.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card">
                  <p className="eyebrow">퀘스트 진행</p>
                      <ul className="intel-list">
                        {resultPayload.quest_summary.map((quest) => (
                          <li key={quest.quest_track_id}>
                    <strong>{UI_VALUE_LABELS[quest.status] ?? quest.status}</strong>
                            <span>{quest.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmResult}>
                    {buildUiResultPrimaryActionLabel(runtime.current_chapter_id, runtime.chapter_outcome, canAdvanceToNextChapter)}
                  </button>
                  {resultSecondaryGalleryActionVisible ? (
                    <button className="ghost-button" onClick={openEndingGallery}>
                      엔딩 기록 보기
                    </button>
                  ) : null}
                  {runtime.chapter_outcome.ending_id || runtime.chapter_outcome.campaign_complete ? (
                    <button className="ghost-button" onClick={resetRun}>
                      {partLabel} 처음부터 다시
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="screen-side-stack story-side-panel">
                <ArtFrame
                  artKey={currentEndingCard?.art_key ?? chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={runtime.chapter_outcome.ending_title ?? "결과"}
                  screenLabel="result_summary"
                />
                {currentEndingCard?.video_id ? (
                  <VideoCard videoId={currentEndingCard.video_id} chapterId={runtime.current_chapter_id} />
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "ending_gallery" ? (
            <div className="screen-card ending-gallery-screen">
              <div className="ending-gallery-head">
                <div>
                  <p className="eyebrow">{runtime.current_chapter_id === "CH20" ? "최종 결말" : `${partLabel} 엔딩 갤러리`}</p>
                  <h2>{buildUiEndingGalleryHeading(runtime.current_chapter_id, screen?.title)}</h2>
                  <p className="muted-copy">
                    {buildUiEndingGallerySummary(runtime.current_chapter_id, runtime.chapter_outcome?.next_chapter_id, canAdvanceToNextChapter)}
                  </p>
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={closeEndingGallery}>
                    {buildUiGalleryCloseActionLabel(
                      runtime.current_chapter_id,
                      runtime.chapter_outcome?.next_chapter_id,
                      canAdvanceToNextChapter
                    )}
                  </button>
                  <button className="ghost-button" onClick={resetRun}>
                    {partLabel} 처음부터 다시
                  </button>
                </div>
              </div>

              {partEndingCards.length === 0 ? (
                  <div className="card ending-gallery-detail-card">
                  <p className="eyebrow">기록 없음</p>
                  <h3>아직 해금된 엔딩이 없습니다.</h3>
                  <p>결과 화면에서 결말이 확정되면 이곳에 기록됩니다.</p>
                </div>
              ) : (
                <div className="ending-gallery-layout">
                  <div className="ending-gallery-grid">
                    {partEndingCards.map((ending) => {
                      const unlockedAt = (runtime.unlocked_endings as Record<string, string | undefined>)[ending.ending_id];
                      const isSelected = selectedEndingId === ending.ending_id;
                      return (
                        <button
                          key={ending.ending_id}
                          className={`ending-gallery-card ${unlockedAt ? "is-unlocked" : "is-locked"} ${isSelected ? "is-selected" : ""}`}
                          onClick={() => setSelectedGalleryEndingId(ending.ending_id)}
                        >
                          <ArtFrame
                            artKey={unlockedAt ? ending.thumb_key : "ending_placeholder"}
                            chapterId={(ending.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                        caption={unlockedAt ? ending.title : "미해금"}
                            screenLabel="ending_gallery_thumb"
                          />
                          <strong>{unlockedAt ? ending.title : "미해금 엔딩"}</strong>
                          <p>{unlockedAt ? ending.summary : ending.hint}</p>
                          {unlockedAt ? <span className="muted-copy">해금 시점: {formatDateTime(unlockedAt)}</span> : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="ending-gallery-detail">
                    {selectedEndingCard ? (
                      <div className="card ending-gallery-detail-card">
                        <p className="eyebrow">선택한 엔딩</p>
                        <h3>{selectedEndingCard.unlocked ? selectedEndingCard.title : "미해금 엔딩"}</h3>
                        <p>{selectedEndingCard.unlocked ? selectedEndingCard.summary : selectedEndingCard.hint}</p>
                        <ArtFrame
                          artKey={selectedEndingCard.unlocked ? selectedEndingCard.art_key : "ending_placeholder"}
                          chapterId={(selectedEndingCard.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                          caption={selectedEndingCard.unlocked ? selectedEndingCard.title : "미해금 엔딩"}
                          screenLabel="ending_gallery_detail"
                        />
                        {selectedEndingCard.unlocked && selectedEndingCard.video_id ? (
                          <VideoCard
                            videoId={selectedEndingCard.video_id}
                            chapterId={(selectedEndingCard.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="warnings-panel card">
              <p className="eyebrow">경고</p>
              <ul className="intel-list">
                {warnings.slice(-4).map((warning, index) => (
                  <li key={`${warning.source}-${index}`}>
                    <strong>{warning.source}</strong>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;

