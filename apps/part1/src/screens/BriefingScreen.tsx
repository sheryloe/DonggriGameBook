import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";

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

export const BriefingScreen: React.FC = () => {
  const { currentChapterId } = useGameStore();
  const chapter = contentLoader.getChapter(currentChapterId ?? "");

  if (!chapter) {
    return (
      <main className="screen-container screen-center">
        <p className="muted-copy glitch-text" data-text="LOADING_MISSION_PROFILE...">LOADING_MISSION_PROFILE...</p>
      </main>
    );
  }

  const requiredObjectives = chapter.objectives.filter((objective) => objective.required);
  const optionalObjectives = chapter.objectives.filter((objective) => !objective.required).slice(0, 5);
  const poster = CH_POSTER[chapter.chapter_id];
  const teaser = CH_TEASER[chapter.chapter_id];

  return (
    <main
      className="screen-container briefing-screen"
      style={{ backgroundImage: teaser ? `linear-gradient(90deg, rgba(5,7,8,0.98) 35%, rgba(5,7,8,0.7) 100%), url('${teaser}')` : undefined }}
    >
      <div className="scanline-overlay" />
      
      <section className="briefing-layout" style={{ position: "relative", zIndex: 10 }}>
        <div className="briefing-copy">
          <header>
            <p className="eyebrow glitch-text" data-text={`MISSION_ARCHIVE: ${chapter.chapter_id}`}>
              ARC_01 // {chapter.chapter_id}
            </p>
            <h1 style={{ fontFamily: "var(--heading-font)", fontSize: "3.5rem", letterSpacing: "-0.02em" }}>{chapter.title}</h1>
            <p className="chapter-role" style={{ fontSize: "1.1rem", borderLeft: "2px solid var(--accent-color)", paddingLeft: "16px", marginTop: "12px" }}>
              {chapter.role}
            </p>
          </header>

          <div className="objective-panel tactical-frame" style={{ border: "none", background: "rgba(156, 207, 214, 0.05)" }}>
            <p className="panel-label">PRIMARY_OBJECTIVES</p>
            <ul className="objective-list required" style={{ fontSize: "1.05rem" }}>
              {requiredObjectives.map((objective) => (
                <li key={objective.objective_id}>{objective.text}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button className="primary-action tactical-frame" type="button" onClick={() => eventRunner.enterNode(chapter.entry_node_id)} style={{ padding: "16px 48px" }}>
              DEPLOY_NOW
            </button>
            <div style={{ fontFamily: "var(--mono-family)", fontSize: "0.7rem", opacity: 0.4 }}>
              AUTH_STATUS: GRANTED<br />
              SEC_LEVEL: ALPHA
            </div>
          </div>

          <dl className="chapter-meta" style={{ marginTop: "24px" }}>
            <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}>
              <dt className="eyebrow">REC_LVL</dt>
              <dd style={{ fontFamily: "var(--heading-font)", fontWeight: 900 }}>{chapter.recommended_level}</dd>
            </div>
            <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}>
              <dt className="eyebrow">EST_TIME</dt>
              <dd style={{ fontFamily: "var(--heading-font)", fontWeight: 900 }}>{chapter.estimated_first_run_minutes}m</dd>
            </div>
            <div className="tactical-frame" style={{ border: "none", background: "rgba(255,255,255,0.03)" }}>
              <dt className="eyebrow">ENERGY</dt>
              <dd style={{ fontFamily: "var(--heading-font)", fontWeight: 900 }}>{chapter.field_action_budget}</dd>
            </div>
          </dl>
        </div>

        {poster ? (
          <figure className="chapter-poster tactical-frame" style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
            <img src={poster} alt={`${chapter.title} 포스터`} />
            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(156, 207, 214, 0.2)", pointerEvents: "none" }} />
          </figure>
        ) : null}
      </section>
    </main>
  );
};
