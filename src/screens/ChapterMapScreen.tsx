import ArtFrame from "../components/ArtFrame";
import MissionIntelPanel from "../components/MissionIntelPanel";
import NodeMap from "../components/NodeMap";
import QuestTrackPanel from "../components/QuestTrackPanel";
import ObjectivesPanel from "../components/ObjectivesPanel";
import { useGameStore } from "../store/gameStore";
import { selectAvailableConnections, selectCurrentChapter } from "../store/selectors";

export default function ChapterMapScreen() {
  const chapter = useGameStore(selectCurrentChapter);
  const runtime = useGameStore((state) => state.runtime);
  const connections = useGameStore(selectAvailableConnections);
  const enterNode = useGameStore((state) => state.enterNode);

  if (!chapter) {
    return null;
  }

  const mapArtKey = chapter.ui_profile.theme === "yeouido_ash" ? "bg_yeouido_ashroad" : `bg_${chapter.ui_profile.theme}`;

  return (
    <section className="screen-grid map-screen">
      <article className="screen-card map-panel">
        <p className="eyebrow">Route Map</p>
        <ArtFrame assetKey={mapArtKey} fallbackAssetKeys={["bg_yeouido_ashroad"]} chapterId={chapter.chapter_id} alt="chapter map" />
        <NodeMap
          chapter={chapter}
          currentNodeId={runtime.current_node_id}
          visitedNodes={runtime.visited_nodes[chapter.chapter_id] ?? {}}
          canTravel={(nodeId) => connections.some((entry) => entry.to === nodeId) || chapter.entry_node_id === nodeId}
          onSelect={(nodeId) => enterNode(nodeId)}
        />
      </article>

      <aside className="screen-side-stack">
        <article className="screen-card">
          <ObjectivesPanel compact title="Objectives" />
        </article>
        <article className="screen-card">
          <MissionIntelPanel mode="map" title="Mission Intel" />
        </article>
        <QuestTrackPanel chapterId={chapter.chapter_id} title="Quest Tracks" compact />
      </aside>
    </section>
  );
}
