import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { Typewriter } from "../components/Typewriter";
import { RouteSummaryReceipt } from "../components/RouteSummaryReceipt";
import { chapterLabel } from "../utils/koreanLabels";
import { playFrameCue } from "../utils/audio";
import { startPart1Bgm } from "../utils/bgm";
import { applyFrameTone, part1FrameTone, runFrameCue, SIGNAL_CUT_MS } from "../utils/frameFx";
import { cancelNarration, eventNarrationText, playAuthoredOrBrowserTts } from "../utils/narration";
import { markInteraction } from "../utils/telemetry";
import { describeCondition, evaluateCondition, stripConditionPrefix } from "../engine/conditions";
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

/**
 * Transparent bust cutouts, preferred over the scene portraits above.
 *
 * A scene portrait is a whole photograph, so the same picture repeated on every
 * line that speaker has — 윤해인 alone appears in fifteen CH01 events. A cutout
 * sits on the event's own background instead, so the same character reads
 * differently in every location. Entries are added as artwork lands; anyone
 * missing here simply falls back to their scene portrait.
 */
const NPC_BUST: Record<string, string> = {
  npc_yoon_haein: "/generated/images/bust_npc_yoon_haein.png",
};

const RENEWED_PART1_VOICE_READY = false;
const PLAYER_ROLE_LABEL = "기록국 현장 회수자";
const PLAYER_CALLSIGN = "서지훈";

// Each cue must name what the player actually does in that event. "북문 표식" was
// a leftover from the injected slot vocabulary and meant nothing at the briefing,
// where the real first action is opening the line and entering the broadcast wing.
const CH01_FIRST_THREE_CUE: Record<string, { step: number; focus: string }> = {
  EV_CH01_BRIEFING: { step: 1, focus: "회선을 열고 방송동 진입" },
  EV_CH01_APPROACH: { step: 2, focus: "우회로 또는 구조 신호 선택" },
  EV_CH01_LOBBY_SEARCH: { step: 3, focus: "기록 회수 후 퇴로 판단" },
};

const NPC_ROLE_LABEL: Record<string, string> = {
  npc_yoon_haein: "교신 오퍼레이터",
  npc_jung_noah: "수로 정보상",
  npc_seo_jinseo: "현장 생존자",
  npc_ahn_bogyeong: "시설 엔지니어",
  npc_ryu_seon: "상층 협상가",
  npc_han_somyeong: "물류 책임자",
  npc_kim_ara: "서버 분석가",
};

function eventVoiceLine(chapterId: string | null | undefined, eventId: string | null | undefined): string | null {
  // Runtime MP3s stay disabled until the renewed Part 1 script is regenerated, audited, and approved.
  if (!RENEWED_PART1_VOICE_READY) return null;
  if (!chapterId || !eventId) return null;
  return `/generated/audio/tts/P1/${chapterId}/${eventId}.mp3`;
}

function chipList(choice: Choice): Array<{ label: string; value: string; tone: string }> {
  return [
    choice.gain_label ? { label: "얻는 것", value: choice.gain_label, tone: "gain" } : null,
    choice.cost_label ? { label: "대가", value: choice.cost_label, tone: "cost" } : null,
    choice.risk_label ? { label: "위험", value: choice.risk_label, tone: "risk" } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; tone: string }>;
}

function compactText(value: string | null | undefined, maxLength: number): string {
  const text = String(value ?? "").replace(/\s+/gu, " ").trim();
  if (text.length <= maxLength) return text;
  const punctuationIndex = text.slice(0, maxLength + 1).search(/[.!?。！？]/u);
  if (punctuationIndex >= 18) return text.slice(0, punctuationIndex + 1);
  const candidate = text.slice(0, maxLength + 1);
  const breakAt = candidate.lastIndexOf(" ");
  const cutAt = breakAt >= Math.floor(maxLength * 0.58) ? breakAt : maxLength;
  return `${candidate.slice(0, cutAt).trim()}...`;
}

function compactChoicePreview(choice: Choice): string {
  const gain = compactText(choice.gain_label, 15);
  const risk = compactText(choice.risk_label, 15);
  const cost = compactText(choice.cost_label, 15);
  if (gain && risk) return `얻음 ${gain} / 위험 ${risk}`;
  if (gain && cost) return `얻음 ${gain} / 대가 ${cost}`;
  return compactText(choice.preview, 56);
}

function firstThreeCue(chapterId: string | null | undefined, eventId: string | null | undefined) {
  if (chapterId !== "CH01" || !eventId) return null;
  const cue = CH01_FIRST_THREE_CUE[eventId];
  if (!cue) return null;
  return {
    ...cue,
    targets: ["회선 확보", "생존 신호 선택", "퇴로 판단"],
  };
}

function conditionHint(condition: string): string {
  return describeCondition(condition, (itemId) => contentLoader.getItem(stripConditionPrefix(itemId))?.name_ko ?? stripConditionPrefix(itemId));
}

function choiceLockReason(choice: Choice, stats: Record<string, unknown>, flags: Record<string, boolean>, inventory: Array<{ item_id: string; quantity: number }>): string | null {
  for (const rawCondition of choice.conditions ?? []) {
    const alternatives = String(rawCondition).split("|").map((part) => part.trim()).filter(Boolean);
    if (alternatives.length === 0) continue;
    if (alternatives.some((condition) => evaluateCondition(condition, { stats, flags, inventory }))) continue;
    return alternatives.map(conditionHint).slice(0, 2).join(" 또는 ");
  }
  return null;
}

function choiceConditionNote(choice: Choice, stats: Record<string, unknown>, flags: Record<string, boolean>, inventory: Array<{ item_id: string; quantity: number }>): string | null {
  if (!choice.conditions?.length) return null;
  const lockReason = choiceLockReason(choice, stats, flags, inventory);
  const state = lockReason ? `잠김: ${lockReason}` : "조건 충족";
  const label = choice.condition_label ?? "선택 조건";
  const hint = choice.condition_hint ? ` · ${choice.condition_hint}` : "";
  const current = choice.current_label ? ` · ${choice.current_label}` : "";
  return `${label} · ${state}${hint}${current}`;
}

export const EventScreen: React.FC = () => {
  const { currentChapterId, currentEventId, stats, flags, inventory } = useGameStore();
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
    void startPart1Bgm({
      chapterId: currentChapterId,
      musicKey: event?.presentation?.music_key,
      eventType: event?.event_type,
      screen: "event",
    });
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
  }, [currentChapterId, event?.event_id, event?.event_type, event?.presentation?.music_key, voiceLine, narration.text, narration.mood]);

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
  const bust = firstNpcId ? NPC_BUST[firstNpcId] ?? null : null;
  const scenePortrait = firstNpcId ? NPC_PORTRAIT[portraitKey ?? ""] ?? NPC_PORTRAIT[firstNpcId] ?? contentLoader.resolveImageUrl(currentChapterId, `portrait_${firstNpcId.replace(/^npc_/u, "")}`) : null;
  const portrait = bust ?? scenePortrait;
  const trustValue = Number(stats[`trust.${firstNpcId}`] ?? stats[`trust_${firstNpcId}`] ?? 50);
  const npcName = firstNpcId ? String(contentLoader.getNpc(firstNpcId)?.name_ko ?? contentLoader.getNpc(firstNpcId)?.name ?? firstNpcId.replace(/^npc_/u, "").replace(/_/gu, " ")) : null;
  const npcRole = firstNpcId ? NPC_ROLE_LABEL[firstNpcId] ?? "현장 동행자" : null;
  const ch01Cue = firstThreeCue(currentChapterId, event.event_id);

  const selectChoice = (choice: Choice) => {
    if (pendingChoiceId || !revealDone) return;
    const startedAt = performance.now();
    setPendingChoiceId(choice.choice_id);
    cancelNarration();
    playFrameCue("choice");
    runFrameCue("choice", currentChapterId);
    document.body.classList.add("signal-transition");
    window.setTimeout(() => {
      document.body.classList.remove("signal-transition");
      eventRunner.selectChoice(choice);
      markInteraction("event_choice_select", startedAt, {
        chapterId: currentChapterId,
        eventId: event.event_id,
        choiceId: choice.choice_id,
        transitionMs: SIGNAL_CUT_MS,
      });
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
      <section className="event-layout novel-event-layout">
        <article className={`event-copy glass-panel tactical-frame event-pressure-${event.event_type}`} aria-busy={!revealDone}>
          <header className="novel-event-header">
            <div className="novel-event-meta">
              <div className="status-tag tactical-frame">현장 기록 // {chapterLabel(currentChapterId)}</div>
              <div className="status-tag tactical-frame">시점 // {PLAYER_ROLE_LABEL} {PLAYER_CALLSIGN}</div>
              {firstNpcId ? (
                <div className="trust-indicator" title="상호 신뢰">
                  <span className="eyebrow">상호 신뢰</span>
                  <div className="trust-meter">
                    <div style={{ width: `${trustValue}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
            <h1 className="event-title">
              <Typewriter key={`${event.event_id}-title`} text={event.title} speed={50} onComplete={markRevealComplete} />
            </h1>
          </header>

          <div className="scene-stack scrollbar-hide novel-scene-stack">
            {sceneBlocks.length > 0
              ? sceneBlocks.map((block, bIdx) => (
                  <section key={block.block_id} className={`scene-block fx-scene-block ${block.kind}`} style={{ animationDelay: `${bIdx * 120}ms` }}>
                    {block.speaker_label ? <p className="scene-speaker">[{block.speaker_label}]</p> : null}
                    {block.lines.map((line, lIdx) => (
                      <p key={`${block.block_id}-${lIdx}`}>
                        <Typewriter text={line} speed={25} delay={bIdx * 420 + lIdx * 160} onComplete={markRevealComplete} />
                      </p>
                    ))}
                    {block.emphasis ? <strong>{block.emphasis}</strong> : null}
                  </section>
                ))
              : bodyLines.map((line, index) => (
                  <section key={`${event.event_id}-body-${index}`} className="scene-block fx-scene-block narration">
                    <p>
                      <Typewriter text={line} speed={20} delay={index * 240} onComplete={markRevealComplete} />
                    </p>
                  </section>
                ))}
          </div>
        </article>

        <aside className="event-side novel-choice-rail">
          <RouteSummaryReceipt event={event} stats={stats} />

          {ch01Cue ? (
            <section className="first-run-cue tactical-frame" aria-label="CH01 첫 3분 목표">
              <header>
                <div>
                  <p className="panel-label">첫 3분 생존 루프</p>
                  <strong>{ch01Cue.focus}</strong>
                </div>
                <span className="first-run-progress">{ch01Cue.step}/3</span>
              </header>
              <ol>
                {ch01Cue.targets.map((target, index) => (
                  <li key={target} className={index + 1 === ch01Cue.step ? "current" : index + 1 < ch01Cue.step ? "done" : undefined}>
                    <span>{index + 1}</span>
                    {target}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {portrait ? (
            <figure className={`npc-portrait-container tactical-frame glass-split${bust ? " is-cutout" : ""}`}>
              <img className="npc-portrait" src={portrait} alt={`${npcName ?? "동행자"} 초상`} />
              <figcaption>{npcRole}: {npcName}</figcaption>
            </figure>
          ) : null}

          <nav className={`choice-list choice-list-${event.event_type}`} aria-label="현장 선택">
            {event.choices?.map((choice, idx) => {
              const enabled = eventRunner.canSelectChoice(choice);
              const lockReason = enabled ? null : choiceLockReason(choice, stats, flags, inventory);
              const conditionNote = choiceConditionNote(choice, stats, flags, inventory);
              const isPending = pendingChoiceId === choice.choice_id;
              const disabled = !enabled || pendingChoiceId !== null || !revealDone;
              return (
                <button
                  key={choice.choice_id}
                  type="button"
                  className={`choice-card novel-choice-card fx-choice-enter ${!revealDone ? "is-locked" : ""} ${isPending ? "is-pending" : ""} ${enabled ? "is-available" : "is-unavailable"}`}
                  onClick={() => selectChoice(choice)}
                  disabled={disabled}
                  aria-disabled={disabled}
                  style={{ animationDelay: `${idx * 90}ms` }}
                >
                  <span className="choice-intent">{choice.intent_tags?.join(" / ") ?? "현장 판단"}</span>
                  <strong>{choice.label}</strong>
                  {choice.preview ? (
                    <>
                      <small className="choice-preview-full">{choice.preview}</small>
                      <small className="choice-preview-compact">{compactChoicePreview(choice)}</small>
                    </>
                  ) : null}
                  {lockReason ? <span className="choice-lock-note">잠김: {lockReason}</span> : null}
                  {conditionNote ? <span className="choice-condition-note">{conditionNote}</span> : null}
                  <span className="choice-chip-row">
                    {chipList(choice).map((chip) => (
                      <span key={`${choice.choice_id}-${chip.label}`} className={`choice-chip choice-chip-${chip.tone}`}>
                        <em>{chip.label}</em>{chip.value}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
      </section>
    </main>
  );
};
