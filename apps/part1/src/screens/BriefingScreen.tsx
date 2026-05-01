import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { chapterLabel } from "../utils/koreanLabels";
import { playSignalBurst, startEmergencyHum, startStoryBgm, unlockAudio } from "../utils/audio";
import { runFrameCue, SIGNAL_CUT_MS } from "../utils/frameFx";

const CH_POSTER: Record<string, string> = {
  CH01: "/generated/images/poster_ch01_yeouido_ash.webp",
  CH02: "/generated/images/poster_ch02_flooded_market.webp",
  CH03: "/generated/images/poster_ch03_jamsil_vertical.webp",
  CH04: "/generated/images/poster_ch04_munjeong_logistics.webp",
  CH05: "/generated/images/poster_ch05_pangyo_server.webp",
};

const CH_TEASER: Record<string, string> = {
  CH01: "/generated/images/teaser_ch01_entry.webp",
  CH02: "/generated/images/teaser_ch02_entry.webp",
  CH03: "/generated/images/teaser_ch03_entry.webp",
  CH04: "/generated/images/teaser_ch04_entry.webp",
  CH05: "/generated/images/teaser_ch05_entry.webp",
};

const CH_BGM: Record<string, string> = {
  CH01: "/generated/audio/bgm/P1/CH01/P1_CH01_ABANDONED_BROADCAST_BGM.mp3",
};

export const BriefingScreen: React.FC = () => {
  const { currentChapterId } = useGameStore();
  const [isEntering, setIsEntering] = React.useState(false);
  const chapter = contentLoader.getChapter(currentChapterId ?? "");

  if (!chapter) {
    return (
      <main className="screen-container screen-center">
        <p className="muted-copy glitch-text" data-text="작전 기록을 불러오는 중입니다.">작전 기록을 불러오는 중입니다.</p>
      </main>
    );
  }

  const requiredObjectives = chapter.objectives.filter((objective) => objective.required);
  const poster = contentLoader.resolveImageUrl(chapter.chapter_id, `poster_${chapter.chapter_id.toLowerCase()}`, CH_POSTER[chapter.chapter_id]);
  const teaser = contentLoader.resolveImageUrl(chapter.chapter_id, `teaser_${chapter.chapter_id.toLowerCase()}_entry`, CH_TEASER[chapter.chapter_id]);

  const enterChapter = () => {
    if (isEntering) return;
    setIsEntering(true);
    void unlockAudio();
    void startStoryBgm(CH_BGM[chapter.chapter_id] ?? "/audio/story1.mp3");
    void startEmergencyHum();
    playSignalBurst();
    runFrameCue("briefing-boot", chapter.chapter_id);
    document.body.classList.add("signal-transition");
    window.setTimeout(() => {
      document.body.classList.remove("signal-transition");
      eventRunner.enterNode(chapter.entry_node_id);
    }, SIGNAL_CUT_MS);
  };

  return (
    <main className="screen-container briefing-screen" style={{ backgroundImage: teaser ? `linear-gradient(90deg, rgba(5,7,8,0.98) 35%, rgba(5,7,8,0.7) 100%), url('${teaser}')` : undefined }}>
      <div className="scanline-overlay" />

      <section className="briefing-layout" style={{ position: "relative", zIndex: 10 }}>
        <div className="briefing-copy">
          <header>
            <p className="eyebrow" data-text={`작전 기록: ${chapter.chapter_id}`}>{chapterLabel(chapter.chapter_id)} // {chapter.title}</p>
            <h1 style={{ fontFamily: "var(--heading-font)", fontSize: "3.5rem", letterSpacing: "-0.02em" }}>{chapter.title}</h1>
            <p className="chapter-role" style={{ fontSize: "1.1rem", borderLeft: "2px solid var(--accent-color)", paddingLeft: "16px", marginTop: "12px" }}>{chapter.role}</p>
          </header>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <button className="primary-action tactical-frame" type="button" onClick={enterChapter} disabled={isEntering} style={{ padding: "18px 54px", fontSize: "1.2rem", fontWeight: "bold" }}>작전 지역 진입</button>
            <div style={{ fontFamily: "var(--mono-family)", fontSize: "0.75rem", opacity: 0.72, lineHeight: "1.5" }}>
              승인 상태: 진입 허가
              <br />
              보안 등급: 현장 지휘
            </div>
          </div>

          <div className="objective-panel tactical-frame" style={{ border: "none", background: "rgba(156, 207, 214, 0.05)" }}>
            <p className="panel-label">주요 작전 목표</p>
            <ul className="objective-list required" style={{ fontSize: "1.05rem" }}>
              {requiredObjectives.map((objective) => (
                <li key={objective.objective_id}>{objective.text}</li>
              ))}
            </ul>
          </div>

          <dl className="chapter-meta" style={{ marginTop: "24px" }}>
            <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}>
              <dt className="eyebrow">권장 등급</dt>
              <dd style={{ fontFamily: "var(--heading-font)", fontWeight: 900 }}>{chapter.recommended_level}</dd>
            </div>
            <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}>
              <dt className="eyebrow">예상 시간</dt>
              <dd style={{ fontFamily: "var(--heading-font)", fontWeight: 900 }}>{chapter.estimated_first_run_minutes}분</dd>
            </div>
            <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}>
              <dt className="eyebrow">행동 가능치</dt>
              <dd style={{ fontFamily: "var(--heading-font)", fontWeight: 900 }}>{chapter.field_action_budget}</dd>
            </div>
          </dl>
        </div>

        {poster ? (
          <figure className="chapter-poster tactical-frame" style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
            <img src={poster} alt={`${chapter.title} 포스터`} />
            <figcaption className="eyebrow" style={{ position: "absolute", left: 16, bottom: 14, color: "var(--text-main)" }}>챕터 포스터</figcaption>
            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(156, 207, 214, 0.2)", pointerEvents: "none" }} />
          </figure>
        ) : null}
      </section>
    </main>
  );
};
