import type { ChapterDefinition } from "../types/game";

interface NodeMapProps {
  chapter: ChapterDefinition;
  currentNodeId: string | null;
  visitedNodes: Record<string, true>;
  canTravel: (nodeId: string) => boolean;
  onSelect: (nodeId: string) => void;
}

function uniqueConnections(chapter: ChapterDefinition) {
  const seen = new Set<string>();

  return chapter.nodes.flatMap((node) =>
    node.connections
      .map((connection) => {
        const key = [node.node_id, connection.to].sort().join(":");
        if (seen.has(key)) {
          return null;
        }

        seen.add(key);
        return {
          from: node,
          to: chapter.nodes_by_id[connection.to]
        };
      })
      .filter((entry): entry is { from: ChapterDefinition["nodes"][number]; to: ChapterDefinition["nodes"][number] } => Boolean(entry?.to))
  );
}

export default function NodeMap({ chapter, currentNodeId, visitedNodes, canTravel, onSelect }: NodeMapProps) {
  const bounds = chapter.nodes.reduce(
    (accumulator, node) => ({
      minX: Math.min(accumulator.minX, node.coordinates.x),
      minY: Math.min(accumulator.minY, node.coordinates.y),
      maxX: Math.max(accumulator.maxX, node.coordinates.x),
      maxY: Math.max(accumulator.maxY, node.coordinates.y)
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity
    }
  );

  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);

  return (
    <section className="node-map-shell">
      <div className="node-map-grid">
        <svg className="node-map-lines" viewBox="0 0 1000 620" preserveAspectRatio="none">
          {uniqueConnections(chapter).map(({ from, to }) => {
            const x1 = ((from.coordinates.x - bounds.minX) / width) * 920 + 40;
            const y1 = ((from.coordinates.y - bounds.minY) / height) * 520 + 50;
            const x2 = ((to.coordinates.x - bounds.minX) / width) * 920 + 40;
            const y2 = ((to.coordinates.y - bounds.minY) / height) * 520 + 50;

            return <line key={`${from.node_id}-${to.node_id}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </svg>
        {chapter.nodes.map((node) => {
          const left = `${((node.coordinates.x - bounds.minX) / width) * 92 + 4}%`;
          const top = `${((node.coordinates.y - bounds.minY) / height) * 82 + 8}%`;
          const isCurrent = currentNodeId === node.node_id;
          const isVisited = Boolean(visitedNodes[node.node_id]);
          const isAvailable = canTravel(node.node_id) || isCurrent;

          return (
            <button
              key={node.node_id}
              className={`map-node ${isCurrent ? "is-current" : ""} ${isVisited ? "is-visited" : ""} ${
                isAvailable ? "is-available" : "is-locked"
              }`}
              style={{ left, top }}
              onClick={() => onSelect(node.node_id)}
              disabled={!isAvailable}
            >
              <span className="map-node-id">{node.node_id}</span>
              <strong>{node.name}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}
