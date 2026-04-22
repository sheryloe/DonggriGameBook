import React from "react";
import { useGameStore } from "../store/gameStore";

export const StatsModal: React.FC = () => {
  const { stats, isStatsOpen, toggleStats } = useGameStore();

  if (!isStatsOpen) return null;

  const rows = [
    { label: "EXP_LEVEL", value: `LV.${stats.level ?? 1}`, color: "var(--accent-color)" },
    { label: "BIOMETRIC_STABILITY", value: `${stats.hp ?? 0} / ${stats.maxHp ?? 100}`, color: Number(stats.hp) < 30 ? "var(--primary-color)" : "var(--accent-color)" },
    { label: "METABOLIC_RESERVE", value: `${stats.stamina ?? 0} / ${stats.maxStamina ?? 100}`, color: "var(--gold-color)" },
    { label: "NEURAL_INTEGRITY", value: `${stats.mental ?? 0} / ${stats.maxMental ?? 100}`, color: "var(--accent-color)" },
    { label: "ACOUSTIC_SIGNATURE", value: String(stats.noise ?? 0), color: Number(stats.noise) > 50 ? "var(--primary-color)" : "var(--text-muted)" },
    { label: "BIOHAZARD_INDEX", value: String(stats.contamination ?? 0), color: Number(stats.contamination) > 50 ? "var(--primary-color)" : "var(--text-muted)" },
  ];

  return (
    <div className="modal-overlay" onClick={toggleStats} style={{ backdropFilter: "blur(8px)" }}>
      <section className="modal-content glass-panel tactical-frame" onClick={(event) => event.stopPropagation()} style={{ border: "none", background: "rgba(5, 7, 8, 0.95)", maxWidth: "500px" }}>
        <div className="scanline-overlay" />
        
        <header className="modal-header">
          <div>
            <p className="eyebrow glitch-text" data-text="SURVIVOR_TELEMETRY.LOG">SURVIVOR_TELEMETRY.LOG</p>
            <h2 style={{ fontFamily: "var(--heading-font)", textTransform: "uppercase" }}>Biometric_Status</h2>
          </div>
          <button className="close-btn tactical-frame" type="button" onClick={toggleStats} style={{ border: "none", background: "rgba(227, 75, 75, 0.1)", color: "#ffb0a8" }}>
            CLOSE_LINK
          </button>
        </header>

        <div className="stats-detail-grid" style={{ gap: "8px" }}>
          {rows.map(({ label, value, color }) => (
            <div key={label} className="stat-detail-item tactical-frame" style={{ background: "rgba(255,255,255,0.02)", padding: "16px", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label" style={{ fontFamily: "var(--mono-family)", fontSize: "0.75rem", opacity: 0.6 }}>{label}</span>
              <span className="stat-value" style={{ fontFamily: "var(--heading-font)", fontSize: "1.2rem", fontWeight: 900, color }}>{value}</span>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: "24px", padding: "12px", border: "1px dashed rgba(156,207,214,0.2)", fontSize: "0.7rem", fontFamily: "var(--mono-family)", opacity: 0.5, lineHeight: "1.4" }}>
          [SYSTEM] ALL BIOMETRIC DATA IS REAL-TIME. <br />
          [WARNING] NEURAL STABILITY BELOW 20% MAY RESULT IN DATA CORRUPTION.
        </div>
      </section>
    </div>
  );
};
