import ArtFrame from "../components/ArtFrame";
import QuestTrackPanel from "../components/QuestTrackPanel";
import InventoryPanel from "../components/InventoryPanel";
import { useGameStore } from "../store/gameStore";
import { selectCurrentChapter } from "../store/selectors";

const MAP_PANEL_BY_CHAPTER: Record<string, string> = {
  CH01: "bg_broadcast_lobby",
  CH02: "ui_panel_flood_route",
  CH03: "ui_panel_mirror_console",
  CH04: "ui_panel_logistics_route",
  CH05: "ui_panel_highrise_power"
};

const BRIEF_EVENT_ART_BY_CHAPTER: Record<string, string> = {
  CH01: "npc_yoon_haein_fullbody",
  CH02: "evt_ch02_blackmarket",
  CH03: "evt_ch03_skybridge",
  CH04: "evt_ch04_badges",
  CH05: "evt_ch05_data_access"
};

const QUEST_ITEMS_BY_CHAPTER: Record<string, string[]> = {
  CH01: ["itm_shortwave_amplifier", "itm_broadcast_log", "itm_news_opening_tape"],
  CH02: ["itm_river_relay_battery", "itm_waterway_map", "itm_counterfeit_quarantine_pass"],
  CH03: ["itm_delivery_badge", "itm_data_key_fragment", "itm_relay_lens"],
  CH04: ["itm_security_badge", "itm_climbing_hook", "itm_boat_fuel_can"],
  CH05: ["itm_route_clearance_pangyo", "itm_dokdo_signal_auth", "itm_arkp_access_key"]
};

function questArtPath(itemId: string): string {
  return `/generated/items/quest/${itemId}_quest.png`;
}

function itemIconPath(itemId: string): string {
  return `/generated/items/icons/${itemId}_icon.png`;
}

export default function BriefingScreen() {
  const content = useGameStore((state) => state.content);
  const chapter = useGameStore(selectCurrentChapter);
  const chapterId = useGameStore((state) => state.runtime.current_chapter_id);
  const startMission = useGameStore((state) => state.startMission);
  const objectiveCompletion = useGameStore(
    (state) => state.runtime.chapter_progress[state.runtime.current_chapter_id]?.objective_completion ?? {}
  );

  const chapterKeyart = `chapter_keyart_${chapterId.toLowerCase()}`;
  const questItems = QUEST_ITEMS_BY_CHAPTER[chapterId] ?? [];

  const handleStartMission = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("donggri:ui-sfx", { detail: "transition" }));
    }
    startMission();
  };

  return (
    <section className="screen-card briefing-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">Mission Brief</span>
          <h2>{chapter?.title ?? "브리핑"}</h2>
        </div>
      </header>

      <div className="split-layout">
        <article className="narrative-card">
          <p>{chapter?.role ?? "작전 설명을 불러오는 중이다."}</p>

          <QuestTrackPanel chapterId={chapterId} title="Quest Tracks" />

          <ul className="objective-list">
            {chapter?.objectives.map((objective) => (
              <li key={objective.objective_id} className={objectiveCompletion[objective.objective_id] ? "is-complete" : ""}>
                <strong>{objective.text}</strong>
                <span>{objective.required ? "필수" : "선택"}</span>
              </li>
            ))}
          </ul>

          <button className="primary-button" onClick={handleStartMission}>작전 시작</button>
        </article>

        <aside className="screen-side-stack">
          <article className="screen-card briefing-visual-panel">
            <p className="eyebrow">Mission Visuals</p>
            <div className="briefing-visual-grid">
              <ArtFrame
                assetKey={chapterKeyart}
                fallbackAssetKeys={[
                  MAP_PANEL_BY_CHAPTER[chapterId],
                  "bg_yeouido_ashroad"
                ]}
                chapterId={chapterId}
                alt={`${chapterId} keyart`}
                className="briefing-visual-large"
              />
              <ArtFrame
                assetKey={MAP_PANEL_BY_CHAPTER[chapterId] ?? chapterKeyart}
                fallbackAssetKeys={[chapterKeyart, "bg_yeouido_ashroad"]}
                chapterId={chapterId}
                alt={`${chapterId} tactical map`}
              />
              <ArtFrame
                assetKey={BRIEF_EVENT_ART_BY_CHAPTER[chapterId] ?? chapterKeyart}
                fallbackAssetKeys={[chapterKeyart, "bg_yeouido_ashroad"]}
                chapterId={chapterId}
                alt={`${chapterId} briefing scene`}
              />
            </div>

            {questItems.length ? (
              <div className="briefing-quest-assets">
                {questItems.map((itemId) => (
                  <article key={itemId} className="briefing-quest-card">
                    <ArtFrame
                      assetKey={questArtPath(itemId)}
                      fallbackAssetKeys={[itemIconPath(itemId), chapterKeyart]}
                      chapterId={chapterId}
                      alt={itemId}
                      className="briefing-item-art"
                    />
                    <strong>{content?.items[itemId]?.name_ko ?? itemId}</strong>
                  </article>
                ))}
              </div>
            ) : null}
          </article>
          <InventoryPanel />
        </aside>
      </div>
    </section>
  );
}
