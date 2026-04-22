import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";

const CH_PRECLIMAX: Record<string, string> = {
  CH01: "/generated/images/teaser_ch01_preclimax.webp",
  CH02: "/generated/images/teaser_ch02_preclimax.webp",
  CH03: "/generated/images/teaser_ch03_preclimax.webp",
  CH04: "/generated/images/teaser_ch04_preclimax.webp",
  CH05: "/generated/images/teaser_ch05_preclimax.webp",
};

function isObjectiveComplete(completeWhen: string[], completedEvents: string[]): boolean {
  if (completeWhen.length === 0) return false;
  return completeWhen.some((condition) => {
    const eventId = condition.replace(/^event:/u, "");
    return completedEvents.includes(eventId);
  });
}

export const ResultScreen: React.FC = () => {
  const { currentChapterId, stats, inventory, completedEvents } = useGameStore();
  const [showLoot, setShowLoot] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  
  const chapter = contentLoader.getChapter(currentChapterId ?? "");

  useEffect(() => {
    setTimeout(() => setShowLoot(true), 800);
    // Simple level up animation trigger for effect
    setTimeout(() => setLevelUp(true), 1500);
  }, []);

  if (!chapter) return null;

  const isLastChapter = currentChapterId === "CH05";
  const bgImage = currentChapterId ? CH_PRECLIMAX[currentChapterId] : null;
  const requiredObjectives = chapter.objectives.filter((objective) => objective.required);

  return (
    <main
      className={`screen-container result-screen ${levelUp ? "flicker-anim" : ""}`}
      style={{ backgroundImage: bgImage ? `linear-gradient(rgba(5,7,8,0.8), rgba(5,7,8,0.95)), url('${bgImage}')` : undefined }}
    >
      <div className="scanline-overlay" />
      
      <section className="result-layout glass-panel tactical-frame" style={{ border: "none", background: "rgba(5, 7, 8, 0.85)", padding: "48px", animation: "fadeIn 0.8s both" }}>
        <header style={{ textAlign: "center", marginBottom: "32px" }}>
          <p className="eyebrow glitch-text" data-text="MISSION_DEBRIEF">MISSION_DEBRIEF / {chapter.chapter_id}</p>
          <h1 className={`${levelUp ? "glitch-text" : ""}`} data-text={isLastChapter ? "ARC COMPLETE" : "MISSION_SUCCESS"} style={{ fontFamily: "var(--heading-font)", fontSize: "4rem", color: isLastChapter ? "var(--gold-color)" : "var(--accent-color)" }}>
            {isLastChapter ? "ARC COMPLETE" : "MISSION_SUCCESS"}
          </h1>
          <h2 style={{ opacity: 0.8, marginTop: "8px" }}>{chapter.title}</h2>
        </header>

        <div className="result-stats" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          <div className="tactical-frame" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
            <span className="eyebrow">INTEGRITY</span>
            <strong style={{ fontSize: "1.8rem", color: Number(stats.hp ?? 0) < 30 ? "#e34b4b" : "inherit" }}>{Number(stats.hp ?? 0)}%</strong>
          </div>
          <div className="tactical-frame" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
            <span className="eyebrow">MENTAL_STABILITY</span>
            <strong style={{ fontSize: "1.8rem" }}>{Number(stats.mental ?? 0)}%</strong>
          </div>
          <div className={`tactical-frame ${levelUp ? "rarity-glow-rare" : ""}`} style={{ background: "rgba(255,255,255,0.03)", border: "none", transition: "all 0.5s" }}>
            <span className="eyebrow">EXPERIENCE_LEVEL</span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <strong style={{ fontSize: "1.8rem" }}>LV.{Number(stats.level ?? 1)}</strong>
              {levelUp && <span className="status-chip" style={{ fontSize: "0.6rem", background: "var(--accent-color)", color: "#000" }}>UPGRADED</span>}
            </div>
          </div>
          <div className="tactical-frame" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
            <span className="eyebrow">ASSETS_COLLECTED</span>
            <strong style={{ fontSize: "1.8rem" }}>{inventory.length} ITEMS</strong>
          </div>
        </div>

        {showLoot && (
          <div className="objective-panel tactical-frame" style={{ background: "rgba(0,0,0,0.4)", border: "none", marginTop: "16px", animation: "fadeIn 1s both" }}>
            <p className="panel-label">LOOT_RECOVERY_LOG</p>
            <div className="loot-list" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {inventory.slice(-5).map((item, idx) => {
                const itemData = contentLoader.getItem(item.item_id);
                return (
                  <div key={`${item.item_id}-${idx}`} className="status-chip tactical-frame" style={{ background: "rgba(156,207,214,0.1)", animation: `fadeIn 0.3s ${idx * 0.1}s both` }}>
                    {itemData?.name_ko ?? item.item_id} x{item.quantity}
                  </div>
                );
              })}
              {inventory.length === 0 && <span style={{ opacity: 0.3, fontSize: "0.8rem" }}>NO_ASSETS_RECOVERED</span>}
            </div>
          </div>
        )}

        <div className="objective-panel tactical-frame" style={{ background: "rgba(0,0,0,0.2)", border: "none", marginTop: "16px" }}>
          <p className="panel-label">OBJECTIVE_RECONCILIATION</p>
          <ul className="objective-list result">
            {requiredObjectives.map((objective) => {
              const completed = isObjectiveComplete(objective.complete_when ?? [], completedEvents);
              return (
                <li key={objective.objective_id} className={completed ? "done" : "pending"} style={{ alignItems: "center" }}>
                  <span className="status-chip" style={{ 
                    background: completed ? "rgba(156, 207, 214, 0.1)" : "rgba(227, 75, 75, 0.1)",
                    color: completed ? "var(--accent-color)" : "#ffb0a8",
                    borderColor: completed ? "rgba(156, 207, 214, 0.4)" : "rgba(227, 75, 75, 0.4)",
                    fontSize: "0.6rem"
                  }}>
                    {completed ? "VERIFIED" : "FAILURE"}
                  </span>
                  <span style={{ fontSize: "1rem", color: completed ? "var(--text-main)" : "var(--text-dim)" }}>{objective.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <button className="primary-action tactical-frame" type="button" onClick={() => eventRunner.nextChapter()} style={{ marginTop: "12px", width: "100%" }}>
          {isLastChapter ? "FINALIZE ARCHIVE RECORD" : "PROCEED TO NEXT SECTOR"}
        </button>
      </section>
    </main>
  );
};
