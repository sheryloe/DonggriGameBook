import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { describeDeadline, getDeadlineUrgency, getItemUseEffect } from "../utils/survival";
import { chapterLabel } from "../utils/koreanLabels";
import { playChoiceSelect } from "../utils/audio";

export const SafehouseScreen: React.FC = () => {
  const { currentChapterId, currentNodeId, stats, inventory, day, timeBlock, elapsedHours, survivalLog, restAtSafehouse, setScreen } = useGameStore();
  const chapter = contentLoader.getChapter(currentChapterId ?? "");
  const node = chapter?.nodes.find((entry) => entry.node_id === currentNodeId);
  const nodeEvents = (node?.event_ids ?? []).map((eventId) => chapter?.events.find((event) => event.event_id === eventId)).filter(Boolean);
  const deadline = getDeadlineUrgency(useGameStore.getState());
  const hasMedical = inventory.some((entry) => Boolean(getItemUseEffect(contentLoader.getItem(entry.item_id))));
  const injury = Number(stats.injury ?? 0);
  const infection = Number(stats.infection ?? stats.contamination ?? 0);
  const stamina = Number(stats.stamina ?? 0);
  const mental = Number(stats.mental ?? 0);

  const showPendingDeadlineIfNeeded = () => {
    const latest = useGameStore.getState();
    if (!latest.pendingDeadlineEvent) return false;
    latest.setDeadlineReturn("SAFEHOUSE", null);
    latest.setScreen("DEADLINE_CONSEQUENCE");
    return true;
  };

  const runRest = (kind: "short" | "medical" | "overnight") => {
    playChoiceSelect();
    restAtSafehouse(kind);
    showPendingDeadlineIfNeeded();
  };

  const enterFirstEvent = () => {
    const eventId = nodeEvents[0]?.event_id;
    if (!eventId) return;
    playChoiceSelect();
    eventRunner.triggerEvent(eventId);
  };

  return (
    <main className="screen-container safehouse-screen">
      <div className="scanline-overlay" />
      <section className="safehouse-layout glass-panel tactical-frame" style={{ border: "none", background: "rgba(5, 7, 8, 0.86)", padding: "40px", maxWidth: "1120px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: "20px", alignItems: "start", flexWrap: "wrap" }}>
          <div>
            <p className="eyebrow" data-text="거점">거점 / {chapterLabel(currentChapterId)}</p>
            <h1 style={{ fontFamily: "var(--heading-font)", textTransform: "none", margin: "8px 0" }}>{node?.name ?? "임시 거점"}</h1>
            <p style={{ maxWidth: "720px", color: "var(--text-muted)", lineHeight: 1.7 }}>{node?.description ?? "문을 잠그고 숨을 고를 수 있는 곳입니다. 쉬는 동안에도 바깥의 시간은 계속 흐릅니다."}</p>
          </div>
          <div className="status-chip tactical-frame" style={{ background: "rgba(156, 207, 214, 0.12)", border: "none" }}>Day {day} · {timeBlock} · 누적 {elapsedHours}시간</div>
        </header>

        <div className="result-stats" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginTop: "28px" }}>
          <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}><span className="eyebrow">부상 누적</span><strong>{injury}%</strong></div>
          <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}><span className="eyebrow">감염 위험</span><strong>{infection}%</strong></div>
          <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}><span className="eyebrow">체력 여분</span><strong>{stamina}%</strong></div>
          <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}><span className="eyebrow">정신 안정도</span><strong>{mental}%</strong></div>
        </div>

        {deadline ? <div className="tactical-frame flicker-anim" style={{ marginTop: "20px", border: "none", background: "rgba(227, 75, 75, 0.13)", padding: "14px 16px", color: "#ffb0a8" }}>기한 임박: {describeDeadline(deadline, elapsedHours)}</div> : null}

        <div className="choice-list" style={{ marginTop: "28px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <button className="choice-card tactical-frame is-available" type="button" onClick={() => runRest("short")}><span>짧은 휴식</span><small>2시간 소모. 부상과 피로를 조금 낮춘다.</small></button>
          <button className="choice-card tactical-frame is-available" type="button" onClick={() => runRest("medical")}><span>응급 처치</span><small>{hasMedical ? "3시간 소모. 의료 물자로 부상과 오염을 낮춘다." : "의료 물자가 부족해 회복량이 줄어든다."}</small></button>
          <button className="choice-card tactical-frame is-available" type="button" onClick={() => runRest("overnight")}><span>하룻밤 쉼</span><small>10시간 소모. 크게 회복하지만 일부 기한은 실패할 수 있다.</small></button>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
          <button className="secondary-action tactical-frame" type="button" onClick={() => setScreen("CHAPTER_MAP")}>주변 확인</button>
          {nodeEvents.length > 0 ? <button className="primary-action tactical-frame" type="button" onClick={enterFirstEvent}>거점 사건 확인</button> : null}
        </div>

        <section className="objective-panel tactical-frame" style={{ marginTop: "24px", border: "none", background: "rgba(0,0,0,0.28)" }}>
          <p className="panel-label">최근 생존 기록</p>
          <ul style={{ margin: "10px 0 0", paddingLeft: "18px", color: "var(--text-muted)", lineHeight: 1.7 }}>{survivalLog.slice(-5).map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>)}</ul>
        </section>
      </section>
    </main>
  );
};