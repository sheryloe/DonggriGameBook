import React, { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { eventRunner } from "../engine/eventRunner";
import { chapterLabel } from "../utils/koreanLabels";
import { playChoiceSelect, playFrameCue } from "../utils/audio";
import { applyFrameTone, runFrameCue } from "../utils/frameFx";

const FAILURE_IMAGE: Record<string, string> = {
  turned: "/generated/images/p1_survival_failure_infected.png",
  killed: "/generated/images/p1_survival_failure_human.png",
  collapsed: "/generated/images/p1_survival_failure_infected.png",
};

export const FailureScreen: React.FC = () => {
  const { failureState, stats, currentChapterId } = useGameStore();
  const failure = failureState ?? {
    kind: "collapsed" as const,
    title: "기록 중단",
    body: "신호가 끊겼다. 남은 것은 반복되는 빗소리와 멀어진 발소리뿐이다.",
    chapterId: currentChapterId,
    eventId: null,
    nodeId: null,
  };

  useEffect(() => {
    applyFrameTone(failure.chapterId ?? currentChapterId, "encounter");
    runFrameCue("critical-glitch", failure.chapterId ?? currentChapterId, "encounter");
    playFrameCue("encounter-impact");
  }, [currentChapterId, failure.chapterId]);

  const bgImage = FAILURE_IMAGE[failure.kind];
  const infection = Number(stats.infection ?? stats.contamination ?? 0);
  const injury = Number(stats.injury ?? 0);

  return (
    <main
      className="screen-container failure-screen"
      data-failure-kind={failure.kind}
      style={{ backgroundImage: `linear-gradient(rgba(5,7,8,0.5), rgba(5,7,8,0.92)), url('${bgImage}')` }}
    >
      <div className="scanline-overlay" />
      <section className="failure-card tactical-frame">
        <p className="eyebrow glitch-text" data-text="생존 기록 손실">
          생존 기록 손실 / {chapterLabel(failure.chapterId ?? currentChapterId)}
        </p>
        <h1 className="glitch-text" data-text={failure.title}>{failure.title}</h1>
        <p className="failure-body">{failure.body}</p>

        <div className="failure-readouts">
          <div className="tactical-frame">
            <span>부상 누적</span>
            <strong>{Math.ceil(injury)}%</strong>
          </div>
          <div className="tactical-frame">
            <span>감염 위험</span>
            <strong>{Math.ceil(infection)}%</strong>
          </div>
        </div>

        <div className="failure-log">
          <p>마지막 노드: {failure.nodeId ?? "미확인"}</p>
          <p>마지막 이벤트: {failure.eventId ?? "미확인"}</p>
        </div>

        <button
          className="primary-action tactical-frame"
          type="button"
          onClick={() => {
            playChoiceSelect();
            void eventRunner.enterChapter("CH01");
          }}
        >
          CH01부터 다시 시작
        </button>
      </section>
    </main>
  );
};
