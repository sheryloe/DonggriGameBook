import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { chapterLabel } from "../utils/koreanLabels";
import { describeDeadline, getDeadlineUrgency, getItemUseEffect, isRestEligibleNode } from "../utils/survival";

function clampPercent(value: number, max: number): number {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export const HUD: React.FC = () => {
  const store = useGameStore();
  const { stats, currentChapterId, currentNodeId, currentScreenId, day, timeBlock, elapsedHours, inventory, toggleInventory, toggleStats } = store;

  if (currentScreenId === "BATTLE" || currentScreenId === "RESULT" || currentScreenId === "BRIEFING" || currentScreenId === "FAILURE") return null;

  const chapter = contentLoader.getChapter(currentChapterId ?? "");
  const node = chapter?.nodes.find((entry) => entry.node_id === currentNodeId);
  const deadline = getDeadlineUrgency(store);
  const injury = Number(stats.injury ?? 0);
  const maxInjury = Number(stats.maxInjury ?? 100);
  const infection = Number(stats.infection ?? stats.contamination ?? 0);
  const maxInfection = Number(stats.maxInfection ?? 100);
  const noise = Number(stats.noise ?? 0);
  const isHighInjury = injury > 70;
  const isHighNoise = noise > 70;
  const isHighInfection = infection > 70;
  const canRest = isRestEligibleNode(currentChapterId, node);
  const canHeal = inventory.some((item) => Boolean(getItemUseEffect(contentLoader.getItem(item.item_id))));
  const showNoise = noise > 0 || isHighNoise;
  const showInfection = infection > 0 || isHighInfection;

  return (
    <header className={`hud-container ${isHighInjury || isHighInfection ? "warning-pulse" : ""}`} style={{ zIndex: 1000 }}>
      <div className="hud-status-group" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button className="hud-stat-card tactical-frame" type="button" onClick={toggleStats} style={{ border: "none", background: "rgba(255,255,255,0.02)", width: "170px", padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span className="hud-stat-label" style={{ fontSize: "0.65rem", fontFamily: "var(--mono-family)", fontWeight: "bold" }}>부상 누적</span>
            <span style={{ fontSize: "0.7rem", fontWeight: 900, color: isHighInjury ? "var(--primary-color)" : "inherit" }}>{injury}%</span>
          </div>
          <span className="stat-bar-container" style={{ height: "4px", background: "rgba(255,255,255,0.05)" }}>
            <span className="stat-bar-fill" style={{ width: `${clampPercent(injury, maxInjury)}%`, background: isHighInjury ? "var(--primary-color)" : "var(--gold-color)", boxShadow: isHighInjury ? "0 0 10px var(--primary-color)" : "none" }} />
          </span>
        </button>

        <div className="hud-mini-stats" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {showNoise ? (
            <div className={`tactical-frame ${isHighNoise ? "flicker-anim" : ""}`} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "none", minWidth: "76px", textAlign: "center", color: isHighNoise ? "var(--primary-color)" : "inherit" }}>
              <div style={{ fontSize: "0.6rem", opacity: 0.6, fontFamily: "var(--mono-family)", marginBottom: "4px" }}>소음도</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 900 }}>{noise}</div>
            </div>
          ) : null}
          {showInfection ? (
            <div className={`tactical-frame ${isHighInfection ? "flicker-anim" : ""}`} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "none", minWidth: "76px", textAlign: "center", color: isHighInfection ? "var(--primary-color)" : "inherit" }}>
              <div style={{ fontSize: "0.6rem", opacity: 0.6, fontFamily: "var(--mono-family)", marginBottom: "4px" }}>감염 위험</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 900 }}>{Math.round(clampPercent(infection, maxInfection))}</div>
            </div>
          ) : null}
          <div className="tactical-frame" style={{ padding: "10px 14px", background: "rgba(156,207,214,0.06)", border: "none", minWidth: "112px", textAlign: "center" }}>
            <div style={{ fontSize: "0.6rem", opacity: 0.6, fontFamily: "var(--mono-family)", marginBottom: "4px" }}>시간</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 900 }}>Day {day} · {timeBlock}</div>
          </div>
        </div>
      </div>

      <div className="hud-actions" style={{ display: "flex", gap: "10px", marginLeft: "auto", marginRight: "16px", flexWrap: "wrap", alignItems: "center" }}>
        {deadline ? <span className="status-chip tactical-frame flicker-anim" style={{ background: "rgba(227,75,75,0.14)", color: "#ffb0a8", border: "none" }}>{describeDeadline(deadline, elapsedHours)}</span> : null}
        {canRest ? <span className="status-chip tactical-frame" style={{ background: "rgba(156,207,214,0.12)", border: "none" }}>휴식 가능</span> : null}
        {canHeal ? <span className="status-chip tactical-frame" style={{ background: "rgba(232,198,107,0.12)", border: "none" }}>치료 가능</span> : null}
        <button className="hud-btn tactical-frame" type="button" onClick={toggleInventory} style={{ border: "none", background: "rgba(156, 207, 214, 0.1)", fontFamily: "var(--heading-font)", fontSize: "0.85rem", padding: "10px 18px" }}>보관함</button>
        <button className="hud-btn tactical-frame" type="button" onClick={toggleStats} style={{ border: "none", background: "rgba(255, 255, 255, 0.05)", fontFamily: "var(--heading-font)", fontSize: "0.85rem", padding: "10px 18px" }}>내 정보</button>
      </div>

      <div className="hud-chapter tactical-frame" data-text={chapterLabel(currentChapterId)} style={{ border: "none", background: "rgba(156, 207, 214, 0.15)", color: "var(--accent-color)", fontFamily: "var(--heading-font)", padding: "10px 18px", fontSize: "0.9rem" }}>
        {chapterLabel(currentChapterId)}
      </div>
    </header>
  );
};
