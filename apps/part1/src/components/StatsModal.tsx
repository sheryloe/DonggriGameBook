import React from "react";
import { useGameStore } from "../store/gameStore";

export const StatsModal: React.FC = () => {
  const { stats, day, timeBlock, elapsedHours, failedQuestIds, restCount, survivalLog, isStatsOpen, toggleStats } = useGameStore();
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isStatsOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => previousFocusRef.current?.focus();
  }, [isStatsOpen]);

  if (!isStatsOpen) return null;

  const injury = Number(stats.injury ?? 0);
  const infection = Number(stats.infection ?? stats.contamination ?? 0);
  const rows = [
    { label: "생존 등급", value: `LV.${stats.level ?? 1}`, color: "var(--accent-color)" },
    { label: "부상 누적", value: `${injury} / ${stats.maxInjury ?? 100}`, color: injury > 70 ? "var(--primary-color)" : "var(--gold-color)" },
    { label: "감염 위험", value: `${infection} / ${stats.maxInfection ?? 100}`, color: infection > 70 ? "var(--primary-color)" : "var(--accent-color)" },
    { label: "체력 여분", value: `${stats.stamina ?? 0} / ${stats.maxStamina ?? 100}`, color: "var(--gold-color)" },
    { label: "정신 안정도", value: `${stats.mental ?? 0} / ${stats.maxMental ?? 100}`, color: "var(--accent-color)" },
    { label: "소음도", value: String(stats.noise ?? 0), color: Number(stats.noise) > 50 ? "var(--primary-color)" : "var(--text-muted)" },
    { label: "현재 시간", value: `Day ${day} · ${timeBlock}`, color: "var(--accent-color)" },
    { label: "누적 경과", value: `${elapsedHours}시간`, color: "var(--text-main)" },
    { label: "하룻밤 쉼", value: `${restCount}회`, color: restCount > 2 ? "var(--primary-color)" : "var(--text-main)" },
    { label: "기한 실패", value: `${failedQuestIds.length}건`, color: failedQuestIds.length > 0 ? "var(--primary-color)" : "var(--accent-color)" },
  ];

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      toggleStats();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-overlay" onClick={toggleStats} style={{ backdropFilter: "blur(8px)" }}>
      <section ref={dialogRef} className="modal-content glass-panel tactical-frame" role="dialog" aria-modal="true" aria-labelledby="stats-title" tabIndex={-1} onKeyDown={handleDialogKeyDown} onClick={(event) => event.stopPropagation()} style={{ border: "none", background: "rgba(5, 7, 8, 0.95)", maxWidth: "560px" }}>
        <div className="scanline-overlay" />
        <header className="modal-header">
          <div>
            <p className="eyebrow" data-text="생존 상태 기록">생존 상태 기록</p>
            <h2 id="stats-title" style={{ fontFamily: "var(--heading-font)", textTransform: "none" }}>내 정보</h2>
          </div>
          <button className="close-btn tactical-frame" type="button" onClick={toggleStats} style={{ border: "none", background: "rgba(227, 75, 75, 0.1)", color: "#ffb0a8" }}>닫기</button>
        </header>

        <div className="stats-detail-grid" style={{ gap: "8px" }}>
          {rows.map(({ label, value, color }) => (
            <div key={label} className="stat-detail-item tactical-frame" style={{ background: "rgba(255,255,255,0.02)", padding: "14px", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="stat-label" style={{ fontFamily: "var(--mono-family)", fontSize: "0.75rem", opacity: 0.7 }}>{label}</span>
              <span className="stat-value" style={{ fontFamily: "var(--heading-font)", fontSize: "1.1rem", fontWeight: 900, color }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", padding: "12px", border: "1px dashed rgba(156,207,214,0.2)", fontSize: "0.78rem", fontFamily: "var(--mono-family)", opacity: 0.72, lineHeight: "1.5" }}>
          [주의] 부상 또는 감염 위험이 100에 도달하면 기록이 실패 처리됩니다.
          <br />
          휴식은 회복을 주지만 기한 실패와 NPC 이동을 앞당길 수 있습니다.
        </div>

        <div style={{ marginTop: "14px", fontSize: "0.78rem", lineHeight: 1.6, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-main)" }}>최근 기록</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
            {survivalLog.slice(-4).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
};
