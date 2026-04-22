import React, { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";

const CH_BG: Record<string, string> = {
  CH01: "/generated/images/bg_ch01_yeouido_ash_secondary.webp",
  CH02: "/generated/images/bg_ch02_flooded_market_secondary.webp",
  CH03: "/generated/images/bg_ch03_jamsil_vertical_secondary.webp",
  CH04: "/generated/images/bg_ch04_munjeong_logistics_secondary.webp",
  CH05: "/generated/images/bg_ch05_pangyo_server_secondary.webp",
};

export const ChapterMapScreen: React.FC = () => {
  const { currentChapterId, currentNodeId, visitedNodes } = useGameStore();
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const chapter = contentLoader.getChapter(currentChapterId ?? "");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!chapter) {
    return (
      <main className="screen-container screen-center">
        <p className="muted-copy glitch-text" data-text="NAVI_DATA_CORRUPTED">NAVI_DATA_CORRUPTED</p>
      </main>
    );
  }

  const currentNode = chapter.nodes.find((node) => node.node_id === currentNodeId);
  const reachableIds = new Set<string>(currentNode?.connections.map((connection) => connection.to) ?? []);
  if (!currentNodeId) reachableIds.add(chapter.entry_node_id);
  const bgImage = CH_BG[chapter.chapter_id];

  const getNodeType = (nodeId: string) => {
    const events = chapter.events.filter(e => e.node_id === nodeId);
    if (events.some(e => e.event_type === "BATTLE" || e.event_type === "boss")) return "combat";
    if (events.some(e => e.event_type === "LOOT" || e.event_type === "SEARCH")) return "search";
    return "story";
  };

  return (
    <main
      className="screen-container map-screen"
      style={{ backgroundImage: bgImage ? `linear-gradient(rgba(5,7,8,0.85), rgba(5,7,8,0.95)), url('${bgImage}')` : undefined }}
    >
      <div className="scanline-overlay" />
      
      <section className="map-layout" style={{ position: "relative", zIndex: 10 }}>
        <aside className="map-info glass-panel tactical-frame" style={{ border: "none", background: "rgba(5, 7, 8, 0.75)" }}>
          <header>
            <p className="eyebrow glitch-text" data-text="TACTICAL_MAP.OS">TACTICAL_MAP.OS</p>
            <h1 style={{ fontFamily: "var(--heading-font)", textTransform: "uppercase" }}>{currentNode?.name ?? "Sector Entry"}</h1>
          </header>
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(156,207,214,0.1)", paddingTop: "16px" }}>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--text-main)" }}>
              {currentNode?.description ?? "Select an available sector to proceed with mission objectives."}
            </p>
          </div>
          
          <div className="map-meta" style={{ marginTop: "24px", display: "grid", gap: "8px" }}>
            <div className="status-chip tactical-frame" style={{ width: "100%", background: "rgba(156, 207, 214, 0.05)", justifyContent: "start" }}>
              <span style={{ opacity: 0.5 }}>COORDS:</span> {currentNode ? `X:${currentNode.coordinates.x} Y:${currentNode.coordinates.y}` : "NULL"}
            </div>
            <div className="status-chip tactical-frame" style={{ width: "100%", background: "rgba(156, 207, 214, 0.05)", justifyContent: "start" }}>
              <span style={{ opacity: 0.5 }}>TIME:</span> {currentTime}
            </div>
            {chapter.exit_node_ids?.includes(currentNodeId ?? "") && (
               <div className="status-chip tactical-frame flicker-anim" style={{ width: "100%", background: "var(--gold-color)", color: "#000", fontWeight: 900 }}>
                  EXIT_PROTOCOL_READY
               </div>
            )}
          </div>
          
          <div style={{ marginTop: "auto", paddingTop: "24px", fontSize: "0.7rem", fontFamily: "var(--mono-family)", opacity: 0.4 }}>
            <div>SCAN_DENSITY: 0.84</div>
            <div>SIGNAL_STRENGTH: 92%</div>
          </div>
        </aside>

        <div className="map-board glass-panel tactical-frame" style={{ border: "none", background: "rgba(0, 0, 0, 0.3)" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(156, 207, 214, 0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
          
          <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style={{ opacity: 0.6 }}>
            {chapter.nodes.flatMap((node) =>
              node.connections.map((connection) => {
                const target = chapter.nodes.find((entry) => entry.node_id === connection.to);
                if (!target) return null;
                const active = node.node_id === currentNodeId || target.node_id === currentNodeId;
                const visited = visitedNodes.includes(node.node_id) && visitedNodes.includes(target.node_id);
                return (
                  <line
                    key={`${node.node_id}-${connection.to}`}
                    x1={node.coordinates.x}
                    y1={node.coordinates.y}
                    x2={target.coordinates.x}
                    y2={target.coordinates.y}
                    style={{ 
                      stroke: active ? "var(--accent-color)" : visited ? "rgba(156, 207, 214, 0.4)" : "rgba(255,255,255,0.08)",
                      strokeWidth: active ? 0.8 : 0.4,
                      strokeDasharray: active ? "none" : "1, 2"
                    }}
                  />
                );
              }),
            )}
          </svg>

          {chapter.nodes.map((node) => {
            const isCurrent = node.node_id === currentNodeId;
            const isVisited = visitedNodes.includes(node.node_id);
            const isReachable = reachableIds.has(node.node_id);
            const isEntry = !currentNodeId && node.node_id === chapter.entry_node_id;
            const isEnabled = isCurrent || isReachable || isEntry;
            const nodeType = getNodeType(node.node_id);
            
            return (
              <button
                key={node.node_id}
                type="button"
                className={`map-node tactical-frame ${isCurrent ? "current" : ""} ${isVisited ? "visited" : ""} ${isEnabled ? "reachable" : ""} ${nodeType}`}
                style={{ 
                  left: `${node.coordinates.x}%`, 
                  top: `${node.coordinates.y}%`,
                  background: isCurrent ? "var(--accent-color)" : isEnabled ? "rgba(156, 207, 214, 0.2)" : "rgba(5, 7, 8, 0.85)",
                  borderColor: isCurrent ? "var(--accent-color)" : isEnabled ? "rgba(156, 207, 214, 0.5)" : "rgba(255, 255, 255, 0.15)",
                  color: isCurrent ? "#08262a" : "inherit",
                  boxShadow: isCurrent ? "0 0 20px var(--accent-glow)" : isEnabled ? "0 0 10px rgba(156, 207, 214, 0.1)" : "none",
                  width: "110px"
                }}
                onClick={() => {
                  if (isEnabled) eventRunner.enterNode(node.node_id);
                }}
                disabled={!isEnabled}
              >
                <div className="map-node-icon" />
                <span style={{ 
                  fontFamily: "var(--mono-family)", 
                  fontSize: "0.65rem", 
                  fontWeight: 900, 
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {node.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
};
