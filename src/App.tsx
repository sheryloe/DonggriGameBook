import { useEffect, useMemo, useState } from "react";
import { getChapterCatalogEntry } from "../packages/world-registry/src";
import { ArtFrame, VideoCard } from "./assets/runtimeMedia";
import { CURRENT_PART_ID } from "./app/appContext";
import { getPart1ChapterMedia } from "./content/part1Media";
import { useGameStore } from "./store/gameStore";
import type { ChapterId, GameContentPack, RuntimeSnapshot } from "./types/game";

type ChapterResultView = {
  objective_summary: Array<{ objective_id: string; text: string; completed: boolean }>;
  quest_summary: Array<{ quest_track_id: string; title: string; status: string }>;
};

type ExtendedRuntimeSnapshot = RuntimeSnapshot & {
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
  const defaultTitle = endingId
    .replace(/^P\d+_END_/u, "")
    .split(/[_:. -]+/u)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");

  return {
    ending_id: endingId,
    chapter_id: chapterId,
    title: title ?? defaultTitle,
    summary: summary ?? "Unlocked ending record.",
    hint: hint ?? "This ending path has not been fully documented yet.",
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

function formatWidgetLabel(widgetId: string): string {
  return widgetId
    .replace(/_/gu, " ")
    .replace(/\./gu, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function stringifyWidgetValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "ON" : "OFF";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "-";
}

function readChapterWidgetValue(runtime: RuntimeSnapshot, chapterId: string, widgetId: string): unknown {
  const bucket = (toExtendedRuntime(runtime).chapter_widgets_state as Record<string, unknown> | undefined)?.[chapterId];
  if (!bucket || typeof bucket !== "object") {
    return undefined;
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
      return `HP ${Number(runtime.stats.hp ?? 0)} / ${Number(runtime.stats.max_hp ?? 0)}`;
    case "route_compare":
    case "route_summary":
    case "route_hint":
      return String(runtime.chapter_progress[chapterId]?.selected_route ?? runtime.stats["route.current"] ?? "unassigned");
    case "ending_matrix":
      return partEndingCount;
    case "field_actions_remaining":
      return resolveFieldActionsValue(runtime, chapterId) ?? 0;
    case "warning_count":
      return "log";
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

  return (
    <div className="widget-rail">
      {widgetIds.map((widgetId) => {
        const value = resolveWidgetValue(widgetId, content, runtime, chapterId, partEndingCount);
        return (
          <div key={widgetId} className="widget-card card">
            <span className="widget-label">{formatWidgetLabel(widgetId)}</span>
            <strong className="widget-value">{stringifyWidgetValue(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const partLabel = `Part ${CURRENT_PART_ID.replace("P", "")}`;
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
          <h1>Runtime Boot</h1>
          <p className="muted-copy">{bootState === "error" ? bootError : `Loading ${partLabel} runtime and generated asset contract.`}</p>
        </div>
      </div>
    );
  }

  const chapter = content.chapters[runtime.current_chapter_id];
  const uiFlow = content.ui_flows[runtime.current_chapter_id];
  const screen = uiFlow?.screens.find((entry) => entry.screen_id === runtime.current_screen_id) ?? uiFlow?.screens[0];
  const currentNode = runtime.current_node_id ? chapter.nodes_by_id[runtime.current_node_id] : null;
  const currentEvent = runtime.current_event_id ? chapter.events_by_id[runtime.current_event_id] : null;
  const chapterMedia = getPart1ChapterMedia(runtime.current_chapter_id);
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
  const routeSummary = [
    `truth=${String(runtime.stats["route.truth"] ?? "silence")}`,
    `compassion=${String(runtime.stats["route.compassion"] ?? "pragmatic")}`,
    `control=${String(runtime.stats["route.control"] ?? "lock")}`,
    `underworld=${String(runtime.stats["route.underworld"] ?? "clean")}`,
    `strain=${Number(runtime.stats["route.strain"] ?? 0)}`
  ].join(" | ");
  const screenWidgetIds = [...new Set([...(screen?.widgets ?? []), ...(currentEvent?.presentation.widget_overrides ?? [])])];
  const resultPayload = (toExtendedRuntime(runtime).chapter_result_payload ??
    ((runtime.chapter_outcome as { chapter_result_payload?: ChapterResultView } | null)?.chapter_result_payload ?? null)) as ChapterResultView | null;

  const backdropKey =
    runtime.ui_screen === "chapter_briefing"
      ? chapterMedia?.briefing_art_key ?? chapter.chapter_cinematic?.still_art_key
      : runtime.ui_screen === "world_map"
        ? chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key
        : runtime.ui_screen === "boss_intro" || runtime.ui_screen === "combat_arena"
          ? currentEvent?.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key
          : runtime.ui_screen === "result_summary"
            ? currentEndingCard?.art_key ?? chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key
            : runtime.ui_screen === "ending_gallery"
              ? selectedEndingCard?.art_key ?? "ending_placeholder"
              : currentEvent?.presentation.art_key ?? chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key;

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
            <h1>{screen?.title ?? chapter.title}</h1>
            <p className="dash-muted">{screen?.purpose}</p>
            <p className="dash-muted">{routeSummary}</p>
            <div className="choice-actions">
              {partEndingCards.length > 0 ? (
                <button className="ghost-button" onClick={openEndingGallery}>
                  Ending Gallery
                </button>
              ) : null}
              <button className="ghost-button" onClick={resetRun}>
                Restart Run
              </button>
            </div>
          </div>

          <div className="runtime-overlay-row">
            <div className="runtime-drawer card">
              <StatBar label="HP" value={hp} maxValue={maxHp} tone={hp <= 35 ? "danger" : undefined} />
              <StatBar label="Noise" value={noise} maxValue={20} tone={noise >= 12 ? "warning" : undefined} />
              <StatBar label="Contamination" value={contamination} maxValue={20} tone={contamination >= 10 ? "danger" : undefined} />
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
                    <h3>Objectives</h3>
                    <ul className="objective-list">
                      {chapter.objectives.map((objective) => (
                        <li
                          key={objective.objective_id}
                          className={runtime.chapter_progress[runtime.current_chapter_id]?.objective_completion[objective.objective_id] ? "is-complete" : ""}
                        >
                          <strong>{objective.text}</strong>
                          <span>{objective.required ? "Main" : "Side"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="choice-actions">
                  <button className="primary-button" onClick={startMission}>
                    Start Mission
                  </button>
                </div>
              </div>

              <div className="screen-side-stack briefing-visual-panel">
                <VideoCard videoId={openingVideoId} chapterId={runtime.current_chapter_id} />
                <div className="briefing-visual-grid">
                  <div className="briefing-visual-large">
                    <ArtFrame
                      artKey={chapterMedia?.briefing_art_key ?? chapter.chapter_cinematic?.still_art_key}
                      chapterId={runtime.current_chapter_id}
                      caption="Chapter Briefing Still"
                      screenLabel="chapter_briefing"
                    />
                  </div>
                  <ArtFrame
                    artKey={chapter.chapter_cinematic?.anchor_portrait_key}
                    chapterId={runtime.current_chapter_id}
                    caption="Anchor"
                    screenLabel="anchor_portrait"
                  />
                  <ArtFrame
                    artKey={chapter.chapter_cinematic?.support_portrait_key}
                    chapterId={runtime.current_chapter_id}
                    caption="Support"
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
                      style={{ left: `${node.coordinates.x / 10}%`, top: `${node.coordinates.y / 6}%` }}
                      onClick={() => moveToNode(node.node_id)}
                    >
                      <span className="map-node-id">{node.node_id}</span>
                      <strong>{node.name}</strong>
                      <div>{node.node_type}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="intel-panel">
                <div className="card intel-section">
                  <h4>Current Node</h4>
                  <p>{currentNode?.description ?? "Select a node to continue the route."}</p>
                </div>

                <div className="card intel-section">
                  <h4>Inventory</h4>
                  <ul className="intel-list">
                    {Object.entries(runtime.inventory.quantities).length === 0 ? (
                      <li>No carried items yet.</li>
                    ) : (
                      Object.entries(runtime.inventory.quantities).map(([itemId, quantity]) => (
                        <li key={itemId}>
                          <strong>{itemId}</strong>
                          <span>x{quantity}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="card intel-section">
                  <h4>World Map Hero</h4>
                  <ArtFrame
                    artKey={chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key}
                    chapterId={runtime.current_chapter_id}
                    caption="World Map Hero"
                    screenLabel="world_map"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "event_dialogue" || runtime.ui_screen === "safehouse" || runtime.ui_screen === "route_select" ? (
            <div className="screen-card split-layout">
              <div>
                <p className="eyebrow">{currentEvent?.event_type ?? runtime.ui_screen}</p>
                <h2>{currentEvent?.title ?? screen?.title ?? chapter.title}</h2>
                {currentEvent ? (
                  <>
                    <div className="event-summary">{currentEvent.text.summary}</div>
                    {currentEvent.text.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    <div className="choice-list">
                      {currentEvent.choices.map((choice) => (
                        <button key={choice.choice_id} className="choice-card" onClick={() => selectChoice(choice.choice_id)}>
                          <strong>{choice.label}</strong>
                          <span>{choice.preview ?? "The next node will react to this choice."}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="event-summary">{screen?.purpose ?? "Route hub overview."}</div>
                    <p>{chapter.role}</p>
                    <div className="choice-actions">
                      <button className="primary-button" onClick={proceedHub}>
                        Continue To Map
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="screen-side-stack portrait-panel">
                <ArtFrame
                  artKey={currentEvent?.presentation.art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={currentEvent?.title}
                  screenLabel={runtime.ui_screen}
                />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "loot_resolution" && runtime.loot_session ? (
            <div className="screen-card split-layout">
              <div>
                <h2>Loot Resolution</h2>
                <p>{runtime.loot_session.source_event_id} produced a new drop session.</p>
                <div className="choice-list">
                  {runtime.loot_session.drops.map((drop) => (
                    <button
                      key={drop.item_id}
                      className={`loot-card ${drop.selected ? "is-selected" : ""}`}
                      onClick={() => toggleLootSelection(drop.item_id)}
                    >
                      <strong>{drop.item_id}</strong>
                      <span>x{drop.quantity}</span>
                    </button>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmLoot}>
                    Confirm Loot
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption="Result Card"
                  screenLabel="loot_resolution"
                />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "boss_intro" && currentEvent ? (
            <div className="screen-card split-layout boss-screen">
              <div>
                <p className="eyebrow">Boss Intro</p>
                <h2>{currentEvent.title}</h2>
                <div className="event-summary">{currentEvent.text.summary}</div>
                {currentEvent.text.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
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
                    Enter Boss Fight
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={currentEvent.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key}
                  chapterId={runtime.current_chapter_id}
                  caption="Boss Splash"
                  screenLabel="boss_intro"
                />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "combat_arena" ? (
            <div className="screen-card split-layout">
              <div>
                <p className="eyebrow">Combat</p>
                <h2>{currentEvent?.title ?? "Combat Arena"}</h2>
                <div className="choice-list">
                  {runtime.battle_state.units.map((unit, index) => (
                    <div key={`${unit.enemy_id}-${index}`} className="choice-card">
                      <strong>{unit.name}</strong>
                      <span>
                        {unit.current_hp} / {unit.max_hp} HP
                      </span>
                    </div>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={() => resolveBattleAction("attack")}>
                    Attack
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("skill")}>
                    Skill
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("item")}>
                    Item
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("move")}>
                    Move
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={currentEvent?.presentation.art_key ?? chapter.chapter_cinematic?.boss_splash_key}
                  chapterId={runtime.current_chapter_id}
                  caption="Combat Zone"
                  screenLabel="combat_arena"
                />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "result_summary" && runtime.chapter_outcome ? (
            <div className="screen-card split-layout result-screen">
              <div>
                <p className="eyebrow">{runtime.chapter_outcome.ending_id ? `${partLabel} Ending` : "Chapter Result"}</p>
                <h2>{runtime.chapter_outcome.ending_title ?? runtime.chapter_outcome.title}</h2>
                <p>{runtime.chapter_outcome.summary}</p>
                <p className="muted-copy">
                  Next chapter: {runtime.chapter_outcome.next_chapter_id ?? `${partLabel} complete`}
                </p>
                {currentEndingCard ? (
                  <div className="result-hook-card">
                    <strong>{currentEndingCard.hint}</strong>
                  </div>
                ) : null}
                {resultPayload ? (
                  <div className="result-payload-grid">
                    <div className="card">
                      <p className="eyebrow">Objectives</p>
                      <ul className="intel-list">
                        {resultPayload.objective_summary.map((objective) => (
                          <li key={objective.objective_id}>
                            <strong>{objective.completed ? "DONE" : "PENDING"}</strong>
                            <span>{objective.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card">
                      <p className="eyebrow">Quest Tracks</p>
                      <ul className="intel-list">
                        {resultPayload.quest_summary.map((quest) => (
                          <li key={quest.quest_track_id}>
                            <strong>{quest.status}</strong>
                            <span>{quest.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmResult}>
                    {runtime.chapter_outcome.ending_id
                      ? "Open Ending Gallery"
                      : runtime.chapter_outcome.campaign_complete
                        ? "Restart Part"
                        : "Next Chapter"}
                  </button>
                  {runtime.chapter_outcome.ending_id || runtime.chapter_outcome.campaign_complete ? (
                    <button className="ghost-button" onClick={resetRun}>
                      Restart Run
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={currentEndingCard?.art_key ?? chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={runtime.chapter_outcome.ending_title ?? "Result"}
                  screenLabel="result_summary"
                />
                {currentEndingCard?.video_id ? (
                  <VideoCard videoId={currentEndingCard.video_id} chapterId={runtime.current_chapter_id} />
                ) : null}
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "ending_gallery" ? (
            <div className="screen-card ending-gallery-screen">
              <div className="ending-gallery-head">
                <div>
                  <p className="eyebrow">{partLabel} Gallery</p>
                  <h2>{partEndingCards.length} Endings</h2>
                  <p className="muted-copy">Unlocked endings keep their art, timestamp, and optional ending video card across reruns.</p>
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={closeEndingGallery}>
                    Close
                  </button>
                  <button className="ghost-button" onClick={resetRun}>
                    Restart Run
                  </button>
                </div>
              </div>

              {partEndingCards.length === 0 ? (
                <div className="card ending-gallery-detail-card">
                  <p className="eyebrow">No Ending Records</p>
                  <h3>Ending Gallery Unavailable</h3>
                  <p>This part has no unlocked endings or chapter ending matrix entries yet.</p>
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
                            caption={unlockedAt ? ending.title : "Locked"}
                            screenLabel="ending_gallery_thumb"
                          />
                          <strong>{unlockedAt ? ending.title : "LOCKED ENDING"}</strong>
                          <p>{unlockedAt ? ending.summary : ending.hint}</p>
                          <span className="muted-copy">Unlocked at: {formatDateTime(unlockedAt)}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="ending-gallery-detail">
                    {selectedEndingCard ? (
                      <div className="card ending-gallery-detail-card">
                        <p className="eyebrow">Selected Ending</p>
                        <h3>{selectedEndingCard.title}</h3>
                        <p>{selectedEndingCard.unlocked ? selectedEndingCard.summary : selectedEndingCard.hint}</p>
                        <ArtFrame
                          artKey={selectedEndingCard.unlocked ? selectedEndingCard.art_key : "ending_placeholder"}
                          chapterId={(selectedEndingCard.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                          caption={selectedEndingCard.title}
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
              <p className="eyebrow">Warnings</p>
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
