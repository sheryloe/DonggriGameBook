import React from "react";
import { useGameStore } from "../store/gameStore";

function clampPercent(value: number, max: number): number {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export const HUD: React.FC = () => {
  const { stats, currentChapterId, currentScreenId, toggleInventory, toggleStats } = useGameStore();

  if (currentScreenId === "BATTLE") return null;

  const isLowHp = Number(stats.hp) < 30;
  const isHighNoise = Number(stats.noise) > 70;
  const isHighContamination = Number(stats.contamination) > 70;

  return (
    <header className={`hud-top ${isLowHp ? "warning-pulse" : ""}`} style={{ zIndex: 1000, background: "rgba(5, 7, 8, 0.9)" }}>
      <div className="hud-status-group" style={{ display: "flex", gap: "12px" }}>
        <button className="hud-stat-card tactical-frame" type="button" onClick={toggleStats} style={{ border: "none", background: "rgba(255,255,255,0.02)", width: "160px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span className="hud-stat-label" style={{ fontSize: "0.6rem", fontFamily: "var(--mono-family)" }}>BIOMETRIC_INT</span>
            <span style={{ fontSize: "0.65rem", fontWeight: 900, color: isLowHp ? "var(--primary-color)" : "inherit" }}>{Number(stats.hp)}%</span>
          </div>
          <span className="stat-bar-container" style={{ height: "3px", background: "rgba(255,255,255,0.05)" }}>
            <span
              className="stat-bar-fill"
              style={{ 
                width: `${clampPercent(Number(stats.hp), Number(stats.maxHp ?? 100))}%`,
                background: isLowHp ? "var(--primary-color)" : "var(--accent-color)",
                boxShadow: isLowHp ? "0 0 10px var(--primary-color)" : "none"
              }}
            />
          </span>
        </button>

        <div className="hud-mini-stats" style={{ display: "flex", gap: "8px" }}>
           <div className={`tactical-frame ${isHighNoise ? "flicker-anim" : ""}`} style={{ padding: "8px", background: "rgba(255,255,255,0.02)", border: "none", minWidth: "60px", textAlign: "center", color: isHighNoise ? "var(--primary-color)" : "inherit" }}>
              <div style={{ fontSize: "0.55rem", opacity: 0.4, fontFamily: "var(--mono-family)" }}>NOISE</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 900 }}>{stats.noise ?? 0}</div>
           </div>
           <div className={`tactical-frame ${isHighContamination ? "flicker-anim" : ""}`} style={{ padding: "8px", background: "rgba(255,255,255,0.02)", border: "none", minWidth: "60px", textAlign: "center", color: isHighContamination ? "var(--primary-color)" : "inherit" }}>
              <div style={{ fontSize: "0.55rem", opacity: 0.4, fontFamily: "var(--mono-family)" }}>BIO_H</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 900 }}>{stats.contamination ?? 0}</div>
           </div>
        </div>
      </div>

      <div className="hud-actions" style={{ gap: "12px" }}>
        <button className="hud-btn tactical-frame" type="button" onClick={toggleInventory} style={{ border: "none", background: "rgba(156, 207, 214, 0.1)", fontFamily: "var(--heading-font)", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
          ARCHIVE
        </button>
        <button className="hud-btn tactical-frame" type="button" onClick={toggleStats} style={{ border: "none", background: "rgba(255, 255, 255, 0.05)", fontFamily: "var(--heading-font)", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
          STATUS
        </button>
      </div>

      <div className="hud-chapter tactical-frame glitch-text" data-text={currentChapterId ?? "---"} style={{ border: "none", background: "rgba(156, 207, 214, 0.15)", color: "var(--accent-color)", fontFamily: "var(--heading-font)", letterSpacing: "0.1em" }}>
        {currentChapterId ?? "---"}
      </div>
    </header>
  );
};
