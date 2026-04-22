import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { Typewriter } from "../components/Typewriter";

const CH_BG: Record<string, string> = {
  CH01: "/generated/images/bg_ch01_yeouido_ash_primary.webp",
  CH02: "/generated/images/bg_ch02_flooded_market_primary.webp",
  CH03: "/generated/images/bg_ch03_jamsil_vertical_primary.webp",
  CH04: "/generated/images/bg_ch04_munjeong_logistics_primary.webp",
  CH05: "/generated/images/bg_ch05_pangyo_server_primary.webp",
};

const NPC_PORTRAIT: Record<string, string> = {
  npc_yoon_haein: "/generated/images/portrait_npc_yoon_haein_ch01_anchor.webp",
  npc_yoon_haein_ch04: "/generated/images/portrait_npc_yoon_haein_ch04_support.webp",
  npc_yoon_haein_ch05: "/generated/images/portrait_npc_yoon_haein_ch05_support.webp",
  npc_jung_noah: "/generated/images/portrait_npc_jung_noah_ch02_anchor.webp",
  npc_jung_noah_ch01: "/generated/images/portrait_npc_jung_noah_ch01_support.webp",
  npc_seo_jinseo: "/generated/images/portrait_npc_seo_jinseo_ch02_support.webp",
  npc_ahn_bogyeong: "/generated/images/portrait_npc_ahn_bogyeong_ch03_anchor.webp",
  npc_ryu_seon: "/generated/images/portrait_npc_ryu_seon_ch03_support.webp",
  npc_han_somyeong: "/generated/images/portrait_npc_han_somyeong_ch04_anchor.webp",
  npc_kim_ara: "/generated/images/portrait_npc_kim_ara_ch05_anchor.webp",
};

export const EventScreen: React.FC = () => {
  const { currentChapterId, currentEventId, stats } = useGameStore();
  const chapter = contentLoader.getChapter(currentChapterId ?? "");
  const event = chapter?.events.find((entry) => entry.event_id === currentEventId);

  if (!event) {
    return (
      <main className="screen-container screen-center">
        <p className="muted-copy glitch-text" data-text="DATA_FRAGMENT_MISSING">DATA_FRAGMENT_MISSING</p>
      </main>
    );
  }

  const fallbackBg = currentChapterId ? CH_BG[currentChapterId] : null;
  const bgImage = contentLoader.resolveImageUrl(currentChapterId, event.presentation?.art_key, fallbackBg);
  const firstNpcId = event.npc_ids?.[0] ?? null;
  const portraitKey = firstNpcId && currentChapterId ? `${firstNpcId}_${currentChapterId.toLowerCase()}` : firstNpcId;
  const portrait = firstNpcId 
    ? (NPC_PORTRAIT[portraitKey ?? ""] ?? NPC_PORTRAIT[firstNpcId] ?? contentLoader.resolveImageUrl(currentChapterId, `portrait_${firstNpcId.replace(/^npc_/u, "")}`))
    : null;

  const sceneBlocks = event.text?.scene_blocks ?? [];
  const bodyLines = event.text?.body ?? [];
  const trustValue = Number(stats[`trust_${firstNpcId}`] ?? 50);

  return (
    <main
      className="screen-container event-screen"
      style={{ backgroundImage: bgImage ? `linear-gradient(rgba(5,7,8,0.7), rgba(5,7,8,0.95)), url('${bgImage}')` : undefined }}
    >
      <div className="scanline-overlay" />
      
      <section className="event-layout" style={{ position: "relative", zIndex: 10 }}>
        <article className="event-copy glass-panel tactical-frame" style={{ padding: "40px", border: "none", background: "rgba(5, 7, 8, 0.75)" }}>
          <header style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <p className="eyebrow glitch-text" data-text={`${event.event_type} // ${currentEventId}`}>
                {event.event_type} // {currentChapterId}
              </p>
              {firstNpcId && (
                <div className="trust-indicator" title="신뢰도">
                  <span className="eyebrow" style={{ fontSize: "0.6rem" }}>AFFINITY_INDEX</span>
                  <div style={{ width: "100px", height: "4px", background: "rgba(255,255,255,0.1)", marginTop: "4px" }}>
                    <div style={{ width: `${trustValue}%`, height: "100%", background: "var(--accent-color)", boxShadow: "0 0 10px var(--accent-glow)" }} />
                  </div>
                </div>
              )}
            </div>
            <h1 style={{ fontFamily: "var(--heading-font)", fontSize: "2.8rem", textTransform: "uppercase" }}>
              <Typewriter text={event.title} speed={50} />
            </h1>
          </header>

          <div className="scene-stack scrollbar-hide" style={{ maxHeight: "50vh", overflowY: "auto", paddingRight: "10px" }}>
            {sceneBlocks.length > 0
              ? sceneBlocks.map((block, bIdx) => (
                  <section key={block.block_id} className={`scene-block ${block.kind}`} style={{ background: "rgba(255,255,255,0.03)", borderLeftColor: block.kind === "dialogue" ? "var(--accent-color)" : "rgba(255,255,255,0.1)" }}>
                    {block.speaker_label ? (
                      <p className="scene-speaker" style={{ fontFamily: "var(--heading-font)", letterSpacing: "0.05em", fontSize: "0.9rem" }}>
                        [{block.speaker_label}]
                      </p>
                    ) : null}
                    {block.lines.map((line, lIdx) => (
                      <p key={`${block.block_id}-${lIdx}`} style={{ fontSize: "1.1rem", opacity: 0.9 }}>
                        <Typewriter text={line} speed={25} delay={bIdx * 500 + lIdx * 200} />
                      </p>
                    ))}
                    {block.emphasis ? <strong style={{ color: "var(--gold-color)", marginTop: "12px", display: "block" }}>{block.emphasis}</strong> : null}
                  </section>
                ))
              : bodyLines.map((line, index) => (
                  <section key={`${event.event_id}-body-${index}`} className="scene-block narration" style={{ background: "none", border: "none", padding: "0" }}>
                    <p style={{ fontSize: "1.15rem", lineHeight: "1.8", color: "var(--text-main)" }}>
                      <Typewriter text={line} speed={20} delay={index * 300} />
                    </p>
                  </section>
                ))}
          </div>
        </article>

        <aside className="event-side">
          {portrait ? (
            <figure className="npc-portrait-container tactical-frame flicker-anim" style={{ overflow: "hidden", background: "var(--surface-strong)", animationDuration: "2s" }}>
              <img className="npc-portrait" src={portrait} alt={firstNpcId ?? "등장 인물"} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px", background: "rgba(5,7,8,0.85)", fontSize: "0.7rem", fontFamily: "var(--mono-family)", textAlign: "center", borderTop: "1px solid var(--surface-border)" }}>
                ID_VERIFIED: {firstNpcId?.toUpperCase()}
              </div>
            </figure>
          ) : null}
          
          <nav className="choice-list">
            {event.choices?.map((choice, idx) => {
              const enabled = eventRunner.canSelectChoice(choice);
              return (
                <button
                  key={choice.choice_id}
                  type="button"
                  className="choice-card tactical-frame"
                  onClick={() => eventRunner.selectChoice(choice)}
                  disabled={!enabled}
                  style={{ 
                    animationDelay: `${idx * 0.1}s`,
                    background: enabled ? "rgba(156, 207, 214, 0.12)" : "rgba(255,255,255,0.03)",
                    border: "none",
                    transform: "skewX(-5deg)"
                  }}
                >
                  <span style={{ fontSize: "1.05rem", transform: "skewX(5deg)", display: "block" }}>{choice.label}</span>
                  {choice.preview ? <small style={{ opacity: 0.5, marginTop: "4px", transform: "skewX(5deg)", display: "block" }}>{choice.preview}</small> : null}
                </button>
              );
            })}
          </nav>
        </aside>
      </section>
    </main>
  );
};
