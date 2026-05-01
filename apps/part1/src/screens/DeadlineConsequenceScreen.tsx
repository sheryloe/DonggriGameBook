import React, { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { eventRunner } from "../engine/eventRunner";
import { chapterLabel } from "../utils/koreanLabels";
import { playChoiceSelect, playFrameCue } from "../utils/audio";
import { applyFrameTone, runFrameCue } from "../utils/frameFx";

export const DeadlineConsequenceScreen: React.FC = () => {
  const { pendingDeadlineEvent, currentChapterId, deadlineReturnScreen, deadlineReturnEventId, clearDeadlineEvent, setScreen } = useGameStore();
  const event = pendingDeadlineEvent ?? {
    questId: "unknown",
    chapterId: currentChapterId ?? "CH01",
    title: "기한이 지나갔다",
    body: "잃어버린 시간만큼 관계와 선택지가 사라졌다. 기록은 계속되지만 같은 길은 다시 열리지 않는다.",
    radioLine: "응답 없음. 해당 신호는 더 이상 반복되지 않습니다.",
    lostOpportunity: "일부 루트와 보상이 약해졌다.",
  };

  useEffect(() => {
    applyFrameTone(event.chapterId, "encounter");
    runFrameCue("critical-glitch", event.chapterId, "encounter");
    playFrameCue("encounter-impact");
  }, [event.chapterId]);

  const continueAfterConsequence = () => {
    playChoiceSelect();
    const nextEventId = deadlineReturnEventId;
    const nextScreen = deadlineReturnScreen ?? "CHAPTER_MAP";
    clearDeadlineEvent();
    if (nextEventId) {
      if (nextEventId.startsWith("END_")) {
        eventRunner.completeChapter();
        return;
      }
      eventRunner.triggerEvent(nextEventId);
      return;
    }
    setScreen(nextScreen);
  };

  return (
    <main className="screen-container deadline-consequence-screen" data-frame-tone="encounter">
      <div className="scanline-overlay" />
      <section className="deadline-consequence-card tactical-frame">
        <p className="eyebrow glitch-text" data-text="기한 실패 수신">기한 실패 수신 / {chapterLabel(event.chapterId)} / {event.questId}</p>
        <h1 className="glitch-text" data-text={event.title}>{event.title}</h1>
        <p className="deadline-radio">“{event.radioLine}”</p>
        <p className="deadline-body">{event.body}</p>
        <div className="deadline-loss tactical-frame"><span>잃어버린 기회</span><strong>{event.lostOpportunity}</strong></div>
        <button className="primary-action tactical-frame" type="button" onClick={continueAfterConsequence}>기록을 묶고 계속 이동</button>
      </section>
    </main>
  );
};