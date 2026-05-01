import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { Typewriter } from "../components/Typewriter";
import { chapterLabel } from "../utils/koreanLabels";
import { playFrameCue } from "../utils/audio";
import { applyFrameTone, part1FrameTone, runFrameCue, SIGNAL_CUT_MS } from "../utils/frameFx";
import { cancelNarration, eventNarrationText, playAuthoredOrBrowserTts } from "../utils/narration";
import type { Choice } from "../types/game";

declare global {
  interface Window {
    __part1VoiceLineDebug?: {
      chapterId: string | null;
      eventId: string | null;
      voiceLine: string | null;
      narrationTextLength: number;
    };
  }
}

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

function eventVoiceLine(chapterId: string | null | undefined, eventId: string | null | undefined): string | null {
  if (!chapterId || !eventId) return null;
  return `/generated/audio/tts/P1/${chapterId}/${eventId}.mp3`;
}

export const EventScreen: React.FC = () => {
  const { currentChapterId, currentEventId, stats } = useGameStore();
  const [pendingChoiceId, setPendingChoiceId] = React.useState<string | null>(null);
  const [revealCompleted, setRevealCompleted] = React.useState(0);
  const chapter = contentLoader.getChapter(currentChapterId ?? "");
  const event = chapter?.events.find((entry) => entry.event_id === currentEventId);
  const voiceLine = eventVoiceLine(currentChapterId, event?.event_id);
  const narration = React.useMemo(() => eventNarrationText(event), [event]);
  const frameTone = part1FrameTone(currentChapterId);
  const sceneBlocks = event?.text?.scene_blocks ?? [];
  const bodyLines = event?.text?.body ?? [];
  const revealUnitCount = React.useMemo(() => {
    const textLineCount = sceneBlocks.length > 0
      ? sceneBlocks.reduce((count, block) => count + block.lines.length, 0)
      : bodyLines.length;
    return Math.max(1, 1 + textLineCount);
  }, [bodyLines.length, sceneBlocks]);
  const revealDone = revealCompleted >= revealUnitCount;

  const markRevealComplete = React.useCallback(() => {
    setRevealCompleted((value) => Math.min(value + 1, revealUnitCount));
  }, [revealUnitCount]);

  React.useEffect(() => {
    setPendingChoiceId(null);
    setRevealCompleted(0);
  }, [event?.event_id]);

  React.useEffect(() => {
    const fallbackDelay = Math.min(4200, 900 + revealUnitCount * 360);
    const timer = window.setTimeout(() => {
      setRevealCompleted(revealUnitCount);
    }, fallbackDelay);
    return () => window.clearTimeout(timer);
  }, [event?.event_id, revealUnitCount]);

  React.useEffect(() => {
    applyFrameTone(currentChapterId);
    runFrameCue("scene-enter", currentChapterId);
    playFrameCue("scene-enter");
    if (typeof window !== "undefined") {
      window.__part1VoiceLineDebug = {
        chapterId: currentChapterId ?? null,
        eventId: event?.event_id ?? null,
        voiceLine,
        narrationTextLength: narration.text.length,
      };
    }
    playAuthoredOrBrowserTts(voiceLine, narration.text, {
      mood: narration.mood,
      delay: 900,
      volume: voiceLine ? 0.86 : 0.58,
    });
    return () => cancelNarration();
  }, [currentChapterId, event?.event_id, voiceLine, narration.text, narration.mood]);

  if (!event) {
    return (
      <main className="screen-container screen-center">
        <p className="muted-copy glitch-text" data-text="기록 조각을 찾을 수 없습니다.">기록 조각을 찾을 수 없습니다.</p>
      </main>
    );
  }

  const fallbackBg = currentChapterId ? CH_BG[currentChapterId] : null;
  const bgImage = contentLoader.resolveImageUrl(currentChapterId, event.presentation?.art_key, fallbackBg);
  const firstNpcId = event.npc_ids?.[0] ?? null;
  const portraitKey = firstNpcId && currentChapterId ? `${firstNpcId}_${currentChapterId.toLowerCase()}` : firstNpcId;
  const portrait = firstNpcId ? NPC_PORTRAIT[portraitKey ?? ""] ?? NPC_PORTRAIT[firstNpcId] ?? contentLoader.resolveImageUrl(currentChapterId, `portrait_${firstNpcId.replace(/^npc_/u, "")}`) : null;
  const trustValue = Number(stats[`trust.${firstNpcId}`] ?? stats[`trust_${firstNpcId}`] ?? 50);
  const npcName = firstNpcId ? String(contentLoader.getNpc(firstNpcId)?.name_ko ?? contentLoader.getNpc(firstNpcId)?.name ?? firstNpcId.replace(/^npc_/u, "").replace(/_/gu, " ")) : null;

  const selectChoice = (choice: Choice) => {
    if (pendingChoiceId || !revealDone) return;
    setPendingChoiceId(choice.choice_id);
    cancelNarration();
    playFrameCue("choice");
    runFrameCue("choice", currentChapterId);
    document.body.classList.add("signal-transition");
    window.setTimeout(() => {
      document.body.classList.remove("signal-transition");
      eventRunner.selectChoice(choice);
      setPendingChoiceId(null);
    }, SIGNAL_CUT_MS);
  };

  return (
    <main
      className="screen-container event-screen"
      data-frame-tone={frameTone}
      data-frame-kind={event.event_type}
      style={{ backgroundImage: bgImage ? `linear-gradient(rgba(5,7,8,0.7), rgba(5,7,8,0.95)), url('${bgImage}')` : undefined }}
    >
      <div className="scanline-overlay" />
      <section className="event-layout" style={{ position: "relative", zIndex: 10 }}>
        <article className={`event-copy glass-panel tactical-frame event-pressure-${event.event_type}`} aria-busy={!revealDone} style={{ padding: "40px", border: "none", background: "rgba(5, 7, 8, 0.75)" }}>
          <header style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px" }}>
              <div className="status-tag tactical-frame" style={{ border: "none", background: "var(--accent-color)", color: "black", padding: "4px 12px", fontSize: "0.7rem", fontWeight: "bold" }}>현장 기록 // {chapterLabel(currentChapterId)}</div>
              {firstNpcId ? (
                <div className="trust-indicator" title="상호 신뢰 지표">
                  <span className="eyebrow" style={{ fontSize: "0.6rem" }}>상호 신뢰</span>
                  <div style={{ width: "100px", height: "4px", background: "rgba(255,255,255,0.1)", marginTop: "4px" }}>
                    <div style={{ width: `${trustValue}%`, height: "100%", background: "var(--accent-color)", boxShadow: "0 0 10px var(--accent-glow)" }} />
                  </div>
                </div>
              ) : null}
            </div>
            <h1 className="event-title" style={{ fontFamily: "var(--heading-font)", lineHeight: "1.2", marginTop: "20px" }}>
              <Typewriter key={`${event.event_id}-title`} text={event.title} speed={50} onComplete={markRevealComplete} />
            </h1>
          </header>

          <div className="scene-stack scrollbar-hide" style={{ maxHeight: "50vh", overflowY: "auto", paddingRight: "10px" }}>
            {sceneBlocks.length > 0
              ? sceneBlocks.map((block, bIdx) => (
                  <section key={block.block_id} className={`scene-block fx-scene-block ${block.kind}`} style={{ background: "rgba(255,255,255,0.03)", borderLeftColor: block.kind === "dialogue" ? "var(--accent-color)" : "rgba(255,255,255,0.1)", animationDelay: `${bIdx * 120}ms` }}>
                    {block.speaker_label ? <p className="scene-speaker" style={{ fontFamily: "var(--heading-font)", letterSpacing: "0.05em", fontSize: "0.9rem" }}>[{block.speaker_label}]</p> : null}
                    {block.lines.map((line, lIdx) => (
                      <p key={`${block.block_id}-${lIdx}`} style={{ fontSize: "1.1rem", opacity: 0.9 }}>
                        <Typewriter text={line} speed={25} delay={bIdx * 420 + lIdx * 160} onComplete={markRevealComplete} />
                      </p>
                    ))}
                    {block.emphasis ? <strong style={{ color: "var(--gold-color)", marginTop: "12px", display: "block" }}>{block.emphasis}</strong> : null}
                  </section>
                ))
              : bodyLines.map((line, index) => (
                  <section key={`${event.event_id}-body-${index}`} className="scene-block fx-scene-block narration" style={{ background: "none", border: "none", padding: "0", animationDelay: `${index * 120}ms` }}>
                    <p style={{ fontSize: "1.15rem", lineHeight: "1.8", color: "var(--text-main)" }}>
                      <Typewriter text={line} speed={20} delay={index * 240} onComplete={markRevealComplete} />
                    </p>
                  </section>
                ))}
          </div>
        </article>

        <aside className="event-side">
          {portrait ? (
            <figure className="npc-portrait-container tactical-frame glass-split" style={{ overflow: "hidden", background: "var(--surface-strong)", position: "relative" }}>
              <img className="npc-portrait" src={portrait} alt="등장 인물" />
              <figcaption style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px", background: "rgba(5,7,8,0.85)", fontSize: "0.7rem", fontFamily: "var(--mono-family)", textAlign: "center", borderTop: "1px solid var(--surface-border)" }}>대원 확인: {npcName}</figcaption>
            </figure>
          ) : null}

          <nav className={`choice-list choice-list-${event.event_type}`} aria-label="작전 선택">
            {event.choices?.map((choice, idx) => {
              const enabled = eventRunner.canSelectChoice(choice);
              const isPending = pendingChoiceId === choice.choice_id;
              const disabled = !enabled || pendingChoiceId !== null || !revealDone;
              return (
                <button
                  key={choice.choice_id}
                  type="button"
                  className={`choice-card tactical-frame fx-choice-enter ${!revealDone ? "is-locked" : ""} ${isPending ? "is-pending" : ""} ${enabled ? "is-available" : "is-unavailable"}`}
                  onClick={() => selectChoice(choice)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  style={{
                    animationDelay: `${idx * 90}ms`,
                    background: enabled ? "rgba(156, 207, 214, 0.12)" : "rgba(255,255,255,0.03)",
                    border: "none",
                    transform: "skewX(-2deg)",
                  }}
                >
                  <span style={{ fontSize: "1.05rem", transform: "skewX(2deg)", display: "block" }}>{choice.label}</span>
                  {choice.preview ? <small style={{ opacity: 0.65, marginTop: "4px", transform: "skewX(2deg)", display: "block" }}>{choice.preview}</small> : null}
                </button>
              );
            })}
          </nav>
        </aside>
      </section>
    </main>
  );
};
