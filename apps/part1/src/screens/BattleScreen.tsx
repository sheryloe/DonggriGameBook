import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";
import { chapterLabel } from "../utils/koreanLabels";
import { playBattleAction, playFrameCue } from "../utils/audio";
import { applyFrameTone, frameToneLabel, part1FrameTone, runFrameCue } from "../utils/frameFx";
import type { EncounterPattern } from "../utils/encounterPatterns";
import { chancePercent, chapterEncounterHint, fatalOutcomeChance, pickEncounterPatterns, randomInt, resolvePatternChance, survivalLoadoutBonus } from "../utils/encounterResolver";

const ENEMY_IMAGE_MAP: Record<string, string> = {
  erosion_basic: "/generated/images/threat_p1_ch01_broadcast_hall_infected.png",
  editing_aberration: "/generated/images/boss_p1_ch01_editing_room_infected.png",
  mirror_core_lines: "/generated/images/threat_mirror_core_lines.webp",
  picker_prime: "/generated/images/threat_picker_prime.webp",
  sluice_sac_cheongeum: "/generated/images/threat_sluice_sac_cheongeum.webp",
  vista_amalgam_glassgarden: "/generated/images/threat_vista_amalgam_glassgarden.webp",
  gate_mauler: "/generated/images/threat_gate_mauler_v01.webp",
};

type SignalPopupType = "distance" | "risk" | "noise";

interface SignalPopup {
  id: number;
  label: string;
  type: SignalPopupType;
  x: number;
  y: number;
}

function safeEnemyName(name: string | undefined, enemyGroupId: string): string {
  if (name && !/[�]|\?\?/u.test(name)) return name;
  if (enemyGroupId.includes("boss") || enemyGroupId.includes("aberration")) return "변이 감염체";
  if (enemyGroupId.includes("human") || enemyGroupId.includes("raider")) return "무장 생존자";
  return "감염체 접근";
}

export const BattleScreen: React.FC = () => {
  const { battleState, stats, inventory, currentChapterId, currentNodeId, currentEventId, updateStat, addBattleLog, updateThreatPressure } = useGameStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isObserved, setIsObserved] = useState(false);
  const [patternRoll, setPatternRoll] = useState(0);
  const [lastOdds, setLastOdds] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [popups, setPopups] = useState<SignalPopup[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pressureResolveTimerRef = useRef<number | null>(null);
  const frameTone = part1FrameTone(currentChapterId);

  useEffect(() => {
    setIsObserved(false);
    setPatternRoll((value) => value + 1);
    applyFrameTone(currentChapterId, "encounter");
    runFrameCue("encounter-start", currentChapterId, "encounter");
    playFrameCue("encounter-start");
  }, [currentChapterId, battleState?.enemyGroupId]);

  useEffect(() => {
    if (!battleState || Number(battleState.threatPressure ?? 0) > 0) return undefined;
    if (pressureResolveTimerRef.current !== null) return undefined;

    pressureResolveTimerRef.current = window.setTimeout(() => {
      pressureResolveTimerRef.current = null;
      const currentBattle = useGameStore.getState().battleState;
      if (currentBattle && Number(currentBattle.threatPressure ?? 0) <= 0) {
        eventRunner.finishBattle(true);
        setIsProcessing(false);
      }
    }, 520);

    return () => {
      if (pressureResolveTimerRef.current !== null) {
        window.clearTimeout(pressureResolveTimerRef.current);
        pressureResolveTimerRef.current = null;
      }
    };
  }, [battleState?.enemyGroupId, battleState?.threatPressure]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleState?.log]);

  const enemyInfo = useMemo(() => {
    if (!battleState) return null;
    const { enemyId, enemy, encounter } = contentLoader.getPrimaryEnemy(battleState.enemyGroupId);
    const artKey = enemy?.art_key ?? (encounter?.threat_level === "boss" ? `boss_${enemyId}` : null);
    const imagePath = ENEMY_IMAGE_MAP[enemyId] ?? contentLoader.resolveImageUrl(currentChapterId, artKey, `/generated/images/threat_${enemyId}.webp`);
    const bgImage = contentLoader.resolveImageUrl(currentChapterId, currentChapterId ? `briefing_p1_${currentChapterId.toLowerCase()}` : null);
    return { enemyId, enemy, encounter, imagePath, bgImage };
  }, [battleState, currentChapterId]);

  const threatPressure = Number(battleState?.threatPressure ?? 0);
  const maxThreatPressure = Number(battleState?.maxThreatPressure ?? 100);
  const pressurePercent = Math.max(0, Math.min(100, (threatPressure / maxThreatPressure) * 100));
  const injury = Number(stats.injury ?? 0);
  const infection = Number(stats.infection ?? stats.contamination ?? 0);
  const noise = Number(stats.noise ?? 0);
  const injuryPercent = Math.max(0, Math.min(100, injury));
  const infectionPercent = Math.max(0, Math.min(100, infection));
  const enemyName = safeEnemyName(enemyInfo?.enemy?.name_ko, battleState?.enemyGroupId ?? "");
  const recentLogs = battleState?.log.slice(-5) ?? [];
  const isBoss = enemyInfo?.encounter?.threat_level === "boss";
  const isHumanThreat = battleState?.encounterKind === "human";
  const observedBonus = isObserved ? 0.12 : 0;
  const loadout = useMemo(() => survivalLoadoutBonus(inventory), [inventory]);
  const contextKey = `${currentChapterId ?? ""} ${currentNodeId ?? ""} ${currentEventId ?? ""} ${battleState?.enemyGroupId ?? ""}`.toLowerCase();
  const offeredPatterns = useMemo(() => pickEncounterPatterns(currentChapterId, frameTone, isObserved, loadout, contextKey, injury, infection), [contextKey, currentChapterId, frameTone, infection, injury, isObserved, loadout, patternRoll]);

  const patternChance = (pattern: EncounterPattern): number => resolvePatternChance(pattern, {
    observedBonus,
    noise,
    pressurePercent,
    loadout,
    chapterId: currentChapterId,
  });

  useEffect(() => {
    if (!battleState || typeof window === "undefined") return;
    window.__part1EncounterDebug = {
      chapterId: currentChapterId,
      nodeId: currentNodeId,
      eventId: currentEventId,
      enemyGroupId: battleState.enemyGroupId,
      pressure: Math.ceil(pressurePercent),
      injury: Math.ceil(injuryPercent),
      infection: Math.ceil(infectionPercent),
      noise,
      offeredPatterns: offeredPatterns.map((pattern) => ({
        id: pattern.id,
        label: pattern.label,
        chance: chancePercent(patternChance(pattern)),
        tags: pattern.tags,
      })),
    };
  }, [battleState, currentChapterId, currentEventId, currentNodeId, infectionPercent, injuryPercent, noise, offeredPatterns, pressurePercent]);

  if (!battleState) return null;

  const addPopup = (label: string, type: SignalPopupType) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const x = 36 + Math.random() * 28;
    const y = 28 + Math.random() * 22;
    setPopups((prev) => [...prev, { id, label, type, x, y }]);
    window.setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 900);
  };

  const triggerShake = () => {
    setShake(true);
    runFrameCue("encounter-impact", currentChapterId, "encounter");
    playFrameCue("encounter-impact");
    window.setTimeout(() => setShake(false), 320);
  };

  const finishEncounter = (success: boolean, delay = 900) => {
    runFrameCue("encounter-resolve", currentChapterId, "encounter");
    playFrameCue("encounter-resolve");
    window.setTimeout(() => {
      eventRunner.finishBattle(success);
      setIsProcessing(false);
    }, delay);
  };

  const rollFatalOutcome = (nextInjury: number, nextInfection: number, severity: number): boolean => {
    if (nextInjury >= 100 || nextInfection >= 100) return true;
    const chance = fatalOutcomeChance({ nextInjury, nextInfection, severity, isHumanThreat });
    if (chance <= 0) return false;
    setLastOdds(`${isHumanThreat ? "치명상" : "감염 전환"} ${chancePercent(chance)}%`);
    return Math.random() < chance;
  };

  const applyExposure = (pattern: EncounterPattern): boolean => {
    const exposure = pattern.failExposure;
    const injuryDelta = Math.max(0, Math.round(exposure.injury * 0.55 - loadout.armorReduction));
    const infectionDelta = isHumanThreat ? 0 : Math.max(0, Math.round(exposure.infection * 0.32));
    const nextInjury = injury + injuryDelta;
    const nextInfection = infection + infectionDelta;

    if (injuryDelta > 0) {
      updateStat("injury", injuryDelta);
      addPopup(`부상 +${injuryDelta}`, "risk");
    }
    if (infectionDelta > 0) {
      updateStat("infection", infectionDelta);
      updateStat("contamination", infectionDelta);
      addPopup(`감염 +${infectionDelta}`, "risk");
    }
    if (exposure.noise) {
      updateStat("noise", exposure.noise);
      addPopup(`소음 +${exposure.noise}`, "noise");
    }
    if (exposure.mental) updateStat("mental", exposure.mental);
    if (exposure.stamina) updateStat("stamina", exposure.stamina);

    if (rollFatalOutcome(nextInjury, nextInfection, exposure.fatalSeverity)) {
      addBattleLog(isHumanThreat ? "[치명상] 상처가 깊었다. 사람에게 빼앗긴 시간은 돌아오지 않는다." : "[전환] 상처와 오염이 동시에 올라왔다. 몸이 더 이상 명령을 듣지 않는다.");
      finishEncounter(false, 1100);
      return true;
    }

    addBattleLog(isHumanThreat ? "[부상] 치명적이진 않지만 움직임이 무거워졌다." : "[감염 위험] 물린 건 아니어도 오염과 상처가 함께 번졌다.");
    return false;
  };

  const reducePressure = (amount: number, label = `압박 -${amount}`): boolean => {
    updateThreatPressure(-amount);
    addPopup(label, "distance");
    if (threatPressure - amount <= 0) {
      addBattleLog("[생존] 위협이 다른 소리를 쫓아 멀어졌다. 지금 지나갈 수 있다.");
      finishEncounter(true);
      return true;
    }
    return false;
  };

  const rerollPatterns = () => {
    window.setTimeout(() => setPatternRoll((value) => value + 1), 120);
  };

  const handlePattern = (pattern: EncounterPattern) => {
    if (isProcessing || threatPressure <= 0) return;
    setIsProcessing(true);
    playBattleAction(pattern.audio);
    if (pattern.tags.includes("observe")) playFrameCue("encounter-watch");

    const chance = patternChance(pattern);
    const roll = Math.random();
    const fullSuccess = roll < chance;
    const partialSuccess = !fullSuccess && roll < chance + 0.18;
    setLastOdds(`${pattern.label} ${chancePercent(chance)}%`);
    updateStat("stamina", -pattern.staminaCost);

    if (fullSuccess) {
      addBattleLog(`${pattern.successLog} 성공 확률 ${chancePercent(chance)}%.`);
      if (pattern.observedAfterUse) setIsObserved(true);
      const relief = randomInt(pattern.relief);
      if (reducePressure(relief)) return;
      setIsProcessing(false);
      rerollPatterns();
      return;
    }

    if (partialSuccess) {
      const relief = Math.max(6, Math.floor(randomInt(pattern.relief) * 0.48));
      addBattleLog(`${pattern.partialLog} 성공 확률 ${chancePercent(chance)}%.`);
      if (pattern.observedAfterUse) setIsObserved(true);
      reducePressure(relief, `부분 확보 -${relief}`);
      const partialPattern: EncounterPattern = {
        ...pattern,
        failExposure: {
          ...pattern.failExposure,
          injury: Math.ceil(pattern.failExposure.injury * 0.45),
          infection: Math.ceil(pattern.failExposure.infection * 0.45),
          noise: Math.ceil(pattern.failExposure.noise * 0.55),
          fatalSeverity: Math.ceil(pattern.failExposure.fatalSeverity * 0.5),
        },
      };
      if (!applyExposure(partialPattern)) {
        triggerShake();
        setIsProcessing(false);
        rerollPatterns();
      }
      return;
    }

    addBattleLog(`${pattern.failLog} 성공 확률 ${chancePercent(chance)}%.`);
    if (!applyExposure(pattern)) {
      triggerShake();
      setIsProcessing(false);
      rerollPatterns();
    }
  };

  return (
    <main
      className={`battle-screen encounter-screen ${injuryPercent > 74 || infectionPercent > 74 ? "encounter-critical" : ""}`}
      data-frame-tone={frameTone}
      data-encounter-kind={isBoss ? "boss" : "threat"}
      style={{ backgroundImage: enemyInfo?.bgImage ? `linear-gradient(rgba(5,7,8,0.8), rgba(5,7,8,0.96)), url('${enemyInfo.bgImage}')` : undefined, overflow: "hidden" }}
    >
      <div className="scanline-overlay" />
      {popups.map((p) => <div key={p.id} className={`damage-number ${p.type}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>{p.label}</div>)}

      <header className="battle-header encounter-header" style={{ position: "relative", zIndex: 10 }}>
        <div>
          <p className="eyebrow" data-text={`감염체 조우: ${battleState.enemyGroupId}`}>조우 기록 / {chapterLabel(currentChapterId)} / {frameToneLabel(frameTone)}</p>
          <h1 style={{ fontFamily: "var(--heading-font)", textTransform: "none", letterSpacing: "-0.02em" }}>{enemyName}</h1>
          <p className="encounter-hint">{chapterEncounterHint(currentChapterId)}</p>
        </div>
        <div className="status-chip tactical-frame encounter-alert">{isHumanThreat ? "인간 위협" : isBoss ? "중대 감염체" : "감염체 접근"}</div>
      </header>

      <div className="battle-layout encounter-layout" style={{ position: "relative", zIndex: 10 }}>
        <section className={`battle-stage encounter-stage tactical-frame ${shake ? "encounter-impact-active" : ""}`}>
          <div className="visual-scanner encounter-scanner" aria-hidden="true">
            <div />
            {isObserved ? <span /> : null}
          </div>

          {enemyInfo?.imagePath ? (
            <img src={enemyInfo.imagePath} className={`enemy-sprite encounter-threat ${shake ? "impact-active" : ""}`} alt={enemyName} onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="battle-placeholder glitch-text" data-text="시각 자료 연결 실패">시각 자료 연결 실패</div>
          )}

          <div className="enemy-meter encounter-pressure glass-panel tactical-frame">
            <div>
              <span className="eyebrow">접근 압박</span>
              <strong>{Math.ceil(pressurePercent)}<span>%</span></strong>
            </div>
            <span className="meter">
              <span style={{ width: `${pressurePercent}%` }} />
            </span>
            <div className="encounter-readout">{lastOdds ?? "조우 선택지는 상황마다 4개씩 다시 추첨됩니다."}</div>
          </div>
        </section>

        <aside className="battle-actions encounter-actions glass-panel tactical-frame">
          <div className="survivor-panel">
            <p className="panel-label">생존 위험</p>
            <div className="survivor-vitals danger-vitals">
              <strong>{Math.ceil(injuryPercent)}</strong>
              <span>부상 누적</span>
            </div>
            <span className="meter survivor-meter injury-meter">
              <span style={{ width: `${injuryPercent}%` }} />
            </span>
            <div className="survivor-vitals danger-vitals compact">
              <strong>{Math.ceil(infectionPercent)}</strong>
              <span>{isHumanThreat ? "치명상 위험" : "감염 위험"}</span>
            </div>
            <span className="meter survivor-meter infection-meter">
              <span style={{ width: `${infectionPercent}%` }} />
            </span>
            <div className="encounter-tags">
              {isObserved ? <span className="status-chip">동선 확인</span> : null}
              <span className="status-chip">소음 {noise}</span>
              {loadout.labels.length > 0 ? loadout.labels.map((label) => <span key={label} className="status-chip">{label}</span>) : <span className="status-chip">맨몸 대응</span>}
            </div>
          </div>

          <div className="battle-buttons encounter-buttons">
            {offeredPatterns.map((pattern, index) => (
              <button key={`${pattern.id}-${patternRoll}`} type="button" className="tactical-frame" onClick={() => handlePattern(pattern)} disabled={isProcessing}>
                <span>[{String(index + 1).padStart(2, "0")}] {pattern.label}</span>
                <small>{pattern.preview} / 성공 {chancePercent(patternChance(pattern))}%</small>
              </button>
            ))}
          </div>

          <div className="battle-log encounter-log">
            <p className="panel-label">최근 흔적</p>
            <div className="battle-log-list scrollbar-hide">
              {recentLogs.map((log, index) => {
                const isWarning = log.includes("위험") || log.includes("실패") || log.includes("노출") || log.includes("부상") || log.includes("감염") || log.includes("치명") || log.includes("전환");
                const isSuccess = log.includes("생존") || log.includes("통과") || log.includes("완료") || log.includes("우회") || log.includes("제압") || log.includes("차단");
                return <p key={`${log}-${index}`} className={isWarning ? "log-warning" : isSuccess ? "log-success" : undefined}>{log}</p>;
              })}
              <div ref={logEndRef} />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};