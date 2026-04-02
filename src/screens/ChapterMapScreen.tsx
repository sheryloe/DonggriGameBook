import { useGameStore } from "../store/gameStore";
import { selectAvailableConnections, selectCurrentChapter } from "../store/selectors";
import NodeMap from "../components/NodeMap";

export default function ChapterMapScreen() {
  const chapter = useGameStore(selectCurrentChapter);
  const runtime = useGameStore((state) => state.runtime);
  const enterNode = useGameStore((state) => state.enterNode);
  const availableConnections = useGameStore(selectAvailableConnections);

  if (!chapter) {
    return (
      <section className="screen-card">
        <p>지도를 불러오는 중이다.</p>
      </section>
    );
  }

  return (
    <section className="screen-card map-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">World Map</span>
          <h2>{chapter.title}</h2>
        </div>
        <div className="muted-copy">
          현재 노드: <strong>{runtime.current_node_id ?? chapter.entry_node_id}</strong>
        </div>
      </header>

      <NodeMap
        chapter={chapter}
        currentNodeId={runtime.current_node_id}
        visitedNodes={runtime.visited_nodes[runtime.current_chapter_id] ?? {}}
        canTravel={(nodeId) =>
          nodeId === runtime.current_node_id ||
          availableConnections.some((connection) => connection.to === nodeId) ||
          nodeId === chapter.entry_node_id
        }
        onSelect={(nodeId) => {
          enterNode(nodeId);
        }}
      />
    </section>
  );
}
