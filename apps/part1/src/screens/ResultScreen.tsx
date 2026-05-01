import React, { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { chapterLabel } from "../utils/koreanLabels";
import { playChoiceSelect, playResultReveal } from "../utils/audio";
import { applyFrameTone, runFrameCue } from "../utils/frameFx";
import { selectPart1Ending } from "../utils/survival";

const CH_PRECLIMAX: Record<string, string> = {
  CH01: "/generated/images/teaser_ch01_preclimax.webp",
  CH02: "/generated/images/teaser_ch02_preclimax.webp",
  CH03: "/generated/images/teaser_ch03_preclimax.webp",
  CH04: "/generated/images/teaser_ch04_preclimax.webp",
  CH05: "/generated/images/teaser_ch05_preclimax.webp",
};

function isObjectiveComplete(completeWhen: string[], completedEvents: string[]): boolean {
  if (completeWhen.length === 0) return false;
  return completeWhen.some((condition) => completedEvents.includes(condition.replace(/^event:/u, "")));
}

export const ResultScreen: React.FC = () => {
  const store = useGameStore();
  const { currentChapterId, stats, inventory, completedEvents, failedQuestIds, day, timeBlock } = store;
  const [phase, setPhase] = useState(0);
  const chapter = contentLoader.getChapter(currentChapterId ?? "");

  useEffect(() => {
    applyFrameTone(currentChapterId);
    runFrameCue("result-reveal", currentChapterId);
    playResultReveal();

    const timers = [
      window.setTimeout(() => setPhase(1), 280),
      window.setTimeout(() => {
        setPhase(2);
        playResultReveal();
      }, 760),
      window.setTimeout(() => setPhase(3), 1180),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [currentChapterId]);

  if (!chapter) return null;

  const isLastChapter = currentChapterId === "CH05";
  const ending = isLastChapter ? selectPart1Ending(store) : null;
  const bgImage = currentChapterId ? CH_PRECLIMAX[currentChapterId] : null;
  const requiredObjectives = chapter.objectives.filter((objective) => objective.required);
  const injury = Number(stats.injury ?? 0);
  const infection = Number(stats.infection ?? stats.contamination ?? 0);
  const mental = Number(stats.mental ?? 0);
  const stamina = Number(stats.stamina ?? 0);
  const title = ending?.title ?? "작전 정산";

  return (
    <main
      className="screen-container result-screen"
      style={{
        backgroundImage: bgImage
          ? `linear-gradient(rgba(5,7,8,0.8), rgba(5,7,8,0.95)), url('${bgImage}')`
          : undefined,
      }}
    >
      <div className="scanline-overlay" />
      <section
        className={`result-layout glass-panel tactical-frame result-phase result-phase-${phase}`}
        style={{ border: "none", background: "rgba(5, 7, 8, 0.85)", padding: "48px" }}
      >
        <header className="result-intro" style={{ textAlign: "center", marginBottom: "32px" }}>
          <p className="eyebrow glitch-text" data-text="작전 정산">
            작전 정산 / {chapterLabel(chapter.chapter_id)}
          </p>
          <h1
            className={isLastChapter ? "server-reveal" : ""}
            data-text={title}
            style={{
              fontFamily: "var(--heading-font)",
              fontSize: "clamp(2.4rem, 7vw, 4rem)",
              color: isLastChapter ? "var(--gold-color)" : "var(--accent-color)",
            }}
          >
            {title}
          </h1>
          <h2 style={{ opacity: 0.8, marginTop: "8px" }}>{ending?.summary ?? chapter.title}</h2>
        </header>

        {phase >= 1 ? (
          <div className="result-stats fx-result-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
            <div className="tactical-frame shimmer-sweep" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
              <span className="eyebrow">부상 누적</span>
              <strong style={{ fontSize: "1.8rem", color: injury > 70 ? "#e34b4b" : "inherit" }}>{injury}%</strong>
            </div>
            <div className="tactical-frame shimmer-sweep" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
              <span className="eyebrow">감염 위험</span>
              <strong style={{ fontSize: "1.8rem", color: infection > 70 ? "#e34b4b" : "inherit" }}>{infection}%</strong>
            </div>
            <div className="tactical-frame shimmer-sweep" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
              <span className="eyebrow">정신 안정도</span>
              <strong style={{ fontSize: "1.8rem" }}>{mental}%</strong>
            </div>
            <div className="tactical-frame shimmer-sweep" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
              <span className="eyebrow">체력 여분</span>
              <strong style={{ fontSize: "1.8rem" }}>{stamina}%</strong>
            </div>
            <div className="tactical-frame shimmer-sweep" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
              <span className="eyebrow">기한 실패</span>
              <strong style={{ fontSize: "1.8rem", color: failedQuestIds.length ? "#e34b4b" : "inherit" }}>{failedQuestIds.length}건</strong>
            </div>
            <div className="tactical-frame shimmer-sweep" style={{ background: "rgba(255,255,255,0.03)", border: "none" }}>
              <span className="eyebrow">최종 시간</span>
              <strong style={{ fontSize: "1.3rem" }}>Day {day} · {timeBlock}</strong>
            </div>
          </div>
        ) : null}

        {phase >= 2 ? (
          <div className="objective-panel tactical-frame fx-result-loot" style={{ background: "rgba(0,0,0,0.4)", border: "none", marginTop: "16px" }}>
            <p className="panel-label">회수 물자 기록</p>
            <div className="loot-list" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {inventory.slice(-5).map((item, idx) => {
                const itemData = contentLoader.getItem(item.item_id);
                return (
                  <div key={`${item.item_id}-${idx}`} className="status-chip tactical-frame shimmer-sweep" style={{ background: "rgba(156,207,214,0.1)", animationDelay: `${idx * 90}ms` }}>
                    {itemData?.name_ko ?? item.item_id} x{item.quantity}
                  </div>
                );
              })}
              {inventory.length === 0 ? <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>회수한 물자가 없습니다.</span> : null}
            </div>
          </div>
        ) : null}

        {ending ? (
          <div className="objective-panel tactical-frame" style={{ background: "rgba(0,0,0,0.32)", border: "none", marginTop: "16px" }}>
            <p className="panel-label">결말 판정 사유</p>
            <ul style={{ margin: "10px 0 0", paddingLeft: "18px", lineHeight: 1.7, color: "var(--text-muted)" }}>
              {ending.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        ) : null}

        <div className="objective-panel tactical-frame" style={{ background: "rgba(0,0,0,0.2)", border: "none", marginTop: "16px" }}>
          <p className="panel-label">목표 확인</p>
          <ul className="objective-list result">
            {requiredObjectives.map((objective) => {
              const completed = isObjectiveComplete(objective.complete_when ?? [], completedEvents);
              return (
                <li key={objective.objective_id} className={completed ? "done" : "pending"} style={{ alignItems: "center" }}>
                  <span
                    className="status-chip"
                    style={{
                      background: completed ? "rgba(156, 207, 214, 0.1)" : "rgba(227, 75, 75, 0.1)",
                      color: completed ? "var(--accent-color)" : "#ffb0a8",
                      borderColor: completed ? "rgba(156, 207, 214, 0.4)" : "rgba(227, 75, 75, 0.4)",
                      fontSize: "0.6rem",
                    }}
                  >
                    {completed ? "완료" : "미완료"}
                  </span>
                  <span style={{ fontSize: "1rem", color: completed ? "var(--text-main)" : "var(--text-dim)" }}>{objective.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {phase >= 3 ? (
          <button
            className="primary-action tactical-frame fx-result-cta"
            type="button"
            onClick={() => {
              playChoiceSelect();
              eventRunner.nextChapter();
            }}
            style={{ marginTop: "12px", width: "100%" }}
          >
            {isLastChapter ? "최종 기록 보기" : "다음 구역으로 이동"}
          </button>
        ) : null}
      </section>
    </main>
  );
};
