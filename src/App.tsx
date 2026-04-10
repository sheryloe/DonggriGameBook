import { useEffect, useMemo, useState } from "react";
import { ArtFrame, VideoCard } from "./assets/runtimeMedia";
import { PART1_ENDINGS, PART1_ENDING_ORDER } from "./content/part1Endings";
import { getPart1ChapterMedia, getPart1EndingMedia } from "./content/part1Media";
import { useGameStore } from "./store/gameStore";
import type { EndingId } from "./types/game";

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

function App() {
  const {
    bootState,
    bootError,
    content,
    runtime,
    warnings,
    selectedChoiceId,
    bootstrapPack,
    startMission,
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
  const [selectedGalleryEndingId, setSelectedGalleryEndingId] = useState<EndingId | null>(null);
  const currentEndingId = runtime?.chapter_outcome?.ending_id;
  const unlockedEndingIds = useMemo(
    () => (runtime ? PART1_ENDING_ORDER.filter((endingId) => Boolean(runtime.unlocked_endings[endingId])) : []),
    [runtime]
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

    setSelectedGalleryEndingId((previous) => previous ?? unlockedEndingIds[0] ?? PART1_ENDING_ORDER[0]);
  }, [currentEndingId, runtime, unlockedEndingIds]);

  if (bootState === "idle" || bootState === "loading" || !content || !runtime) {
    return (
      <div className="boot-screen">
        <div className={`boot-card ${bootState === "error" ? "is-error" : ""}`}>
          <p className="eyebrow">DonggrolGameBook Part 1</p>
          <h1>Runtime Boot</h1>
          <p className="muted-copy">{bootState === "error" ? bootError : "Loading CH01~CH05 runtime and generated asset contract."}</p>
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
  const currentEndingMedia = currentEndingId ? getPart1EndingMedia(currentEndingId) : null;
  const selectedEndingId = selectedGalleryEndingId ?? currentEndingId ?? unlockedEndingIds[0] ?? PART1_ENDING_ORDER[0];
  const selectedEnding = PART1_ENDINGS[selectedEndingId];
  const selectedEndingMedia = getPart1EndingMedia(selectedEndingId);
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

  const backdropKey =
    runtime.ui_screen === "chapter_briefing"
      ? chapterMedia?.briefing_art_key ?? chapter.chapter_cinematic?.still_art_key
      : runtime.ui_screen === "world_map"
        ? chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key
        : runtime.ui_screen === "boss_intro" || runtime.ui_screen === "combat_arena"
          ? currentEvent?.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key
      : runtime.ui_screen === "result_summary"
            ? currentEndingMedia?.art_key ?? chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key
            : runtime.ui_screen === "ending_gallery"
              ? selectedEndingMedia?.art_key ?? "ending_placeholder"
              : currentEvent?.presentation.art_key ?? chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key;

  return (
    <div className="runtime-shell">
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
              <button className="ghost-button" onClick={openEndingGallery}>
                Ending Gallery
              </button>
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
                <VideoCard videoId={chapterMedia?.opening_video_id} chapterId={runtime.current_chapter_id} />
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
                <h2>{currentEvent?.title}</h2>
                <div className="event-summary">{currentEvent?.text.summary}</div>
                {currentEvent?.text.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                <div className="choice-list">
                  {currentEvent?.choices.map((choice) => (
                    <button key={choice.choice_id} className="choice-card" onClick={() => selectChoice(choice.choice_id)}>
                      <strong>{choice.label}</strong>
                      <span>{choice.preview ?? "The next node will react to this choice."}</span>
                    </button>
                  ))}
                </div>
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
                <p className="eyebrow">{runtime.chapter_outcome.ending_id ? "Part 1 Ending" : "Chapter Result"}</p>
                <h2>{runtime.chapter_outcome.ending_title ?? runtime.chapter_outcome.title}</h2>
                <p>{runtime.chapter_outcome.summary}</p>
                <p className="muted-copy">Next chapter: {runtime.chapter_outcome.next_chapter_id ?? "Part 1 complete"}</p>
                {runtime.chapter_outcome.ending_id ? (
                  <div className="result-hook-card">
                    <strong>{PART1_ENDINGS[runtime.chapter_outcome.ending_id].hint}</strong>
                  </div>
                ) : null}
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmResult}>
                    {runtime.chapter_outcome.ending_id ? "Open Ending Gallery" : "Next Chapter"}
                  </button>
                  {runtime.chapter_outcome.ending_id ? (
                    <button className="ghost-button" onClick={resetRun}>
                      Restart Run
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={currentEndingMedia?.art_key ?? chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={runtime.chapter_outcome.ending_title ?? "Result"}
                  screenLabel="result_summary"
                />
                {currentEndingMedia ? <VideoCard videoId={currentEndingMedia.video_id} chapterId={runtime.current_chapter_id} /> : null}
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "ending_gallery" ? (
            <div className="screen-card ending-gallery-screen">
              <div className="ending-gallery-head">
                <div>
                  <p className="eyebrow">Part 1 Gallery</p>
                  <h2>Five Endings</h2>
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

              <div className="ending-gallery-layout">
                <div className="ending-gallery-grid">
                  {PART1_ENDING_ORDER.map((endingId) => {
                    const ending = PART1_ENDINGS[endingId];
                    const unlockedAt = runtime.unlocked_endings[endingId];
                    const isSelected = selectedEndingId === endingId;
                    return (
                      <button
                        key={endingId}
                        className={`ending-gallery-card ${unlockedAt ? "is-unlocked" : "is-locked"} ${isSelected ? "is-selected" : ""}`}
                        onClick={() => setSelectedGalleryEndingId(endingId)}
                      >
                        <ArtFrame
                          artKey={unlockedAt ? ending.thumb_key : "ending_placeholder"}
                          chapterId="CH05"
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
                  <div className="card ending-gallery-detail-card">
                    <p className="eyebrow">Selected Ending</p>
                    <h3>{selectedEnding.title}</h3>
                    <p>{runtime.unlocked_endings[selectedEndingId] ? selectedEnding.summary : selectedEnding.hint}</p>
                    <ArtFrame
                      artKey={runtime.unlocked_endings[selectedEndingId] ? selectedEndingMedia?.art_key : "ending_placeholder"}
                      chapterId="CH05"
                      caption={selectedEnding.title}
                      screenLabel="ending_gallery_detail"
                    />
                    {runtime.unlocked_endings[selectedEndingId] && selectedEndingMedia ? (
                      <VideoCard videoId={selectedEndingMedia.video_id} chapterId="CH05" />
                    ) : null}
                  </div>
                </div>
              </div>
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
