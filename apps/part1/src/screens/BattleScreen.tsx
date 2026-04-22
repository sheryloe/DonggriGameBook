import React, { useMemo, useRef, useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { eventRunner } from "../engine/eventRunner";

const ENEMY_IMAGE_MAP: Record<string, string> = {
  erosion_basic: "/generated/images/threat_erosion_basic.png",
  editing_aberration: "/generated/images/threat_editing_aberration.webp",
  mirror_core_lines: "/generated/images/threat_mirror_core_lines.webp",
  picker_prime: "/generated/images/threat_picker_prime.webp",
  sluice_sac_cheongeum: "/generated/images/threat_sluice_sac_cheongeum.webp",
  vista_amalgam_glassgarden: "/generated/images/threat_vista_amalgam_glassgarden.webp",
  gate_mauler: "/generated/images/threat_gate_mauler_v01.webp",
};

interface DamagePopup {
  id: number;
  value: number;
  type: "player" | "enemy";
  x: number;
  y: number;
}

export const BattleScreen: React.FC = () => {
  const { battleState, stats, currentChapterId, updateStat, addBattleLog, updateEnemyHp } = useGameStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDefending, setIsDefending] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [shake, setShake] = useState(false);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleState?.log]);

  const enemyInfo = useMemo(() => {
    if (!battleState) return null;
    const { enemyId, enemy, encounter } = contentLoader.getPrimaryEnemy(battleState.enemyGroupId);
    const artKey = enemy?.art_key ?? (encounter?.threat_level === "boss" ? `boss_${enemyId}` : null);
    const imagePath = contentLoader.resolveImageUrl(
      currentChapterId,
      artKey,
      ENEMY_IMAGE_MAP[enemyId] ?? `/generated/images/threat_${enemyId}.webp`,
    );
    const bgImage = contentLoader.resolveImageUrl(currentChapterId, currentChapterId ? `briefing_p1_${currentChapterId.toLowerCase()}` : null);
    return { enemyId, enemy, encounter, imagePath, bgImage };
  }, [battleState, currentChapterId]);

  if (!battleState) return null;

  const enemyHpPercent = Math.max(0, Math.min(100, (battleState.enemyHp / battleState.maxEnemyHp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (Number(stats.hp ?? 0) / Number(stats.maxHp ?? 100)) * 100));
  const enemyAttack = Number(enemyInfo?.enemy?.attack ?? enemyInfo?.enemy?.base_stats?.attack ?? 10);

  const addPopup = (value: number, type: "player" | "enemy") => {
    const id = Date.now();
    const x = 40 + Math.random() * 20;
    const y = 30 + Math.random() * 20;
    setPopups((prev) => [...prev, { id, value, type, x, y }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 800);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const enemyTurn = (defending: boolean) => {
    const rawDamage = Math.max(3, enemyAttack + Math.floor(Math.random() * 8) - 3);
    const damage = defending ? Math.max(1, Math.floor(rawDamage * 0.4)) : rawDamage;
    
    setTimeout(() => {
      triggerShake();
      addPopup(damage, "player");
      updateStat("hp", -damage);
      addBattleLog(defending ? `[SIGNAL] DEFENSE SUCCESS. DMG REDUCED TO ${damage}.` : `[WARNING] ENEMY COUNTERSTRIKE. INTEGRITY -${damage}%.`);
      setIsDefending(false);

      if (Number(stats.hp ?? 0) - damage <= 0) {
        addBattleLog("[CRITICAL] LETHAL DAMAGE DETECTED. EMERGENCY RETREAT PROTOCOL ACTIVATED.");
        window.setTimeout(() => {
          eventRunner.finishBattle(false);
          setIsProcessing(false);
        }, 1200);
        return;
      }

      setIsProcessing(false);
    }, 400);
  };

  const handleAttack = () => {
    if (isProcessing || battleState.enemyHp <= 0) return;
    setIsProcessing(true);
    setIsDefending(false);

    const damage = 18 + Math.floor(Math.random() * 15);
    addPopup(damage, "enemy");
    updateEnemyHp(-damage);
    addBattleLog(`[PROTOCOL] EXECUTING STRIKE. TARGET COHESION -${damage}%.`);

    if (battleState.enemyHp - damage <= 0) {
      addBattleLog("[SUCCESS] TARGET NEUTRALIZED. SECTOR SECURED.");
      window.setTimeout(() => {
        eventRunner.finishBattle(true);
        setIsProcessing(false);
      }, 1000);
      return;
    }

    window.setTimeout(() => enemyTurn(false), 800);
  };

  const handleDefend = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsDefending(true);
    addBattleLog("[PROTOCOL] ACTIVATING KINETIC SHIELDing. BRACING FOR IMPACT.");
    window.setTimeout(() => enemyTurn(true), 600);
  };

  const handleScan = () => {
    if (isProcessing || isScanned) return;
    setIsProcessing(true);
    addBattleLog("[SYSTEM] INITIATING TACTICAL SCAN... ANALYZING THREAT SIGNATURE.");
    setTimeout(() => {
      setIsScanned(true);
      addBattleLog(`[SCAN_COMPLETE] TARGET: ${enemyInfo?.enemy?.name_ko}. WEAKNESS_DETECTED: STRUCTURAL_FRACTURE.`);
      setIsProcessing(false);
    }, 1000);
  };

  const handleRetreat = () => {
    if (isProcessing) return;
    addBattleLog("[NOTICE] EXECUTING TACTICAL DISENGAGEMENT.");
    window.setTimeout(() => eventRunner.finishBattle(false), 500);
  };

  return (
    <main
      className={`battle-screen ${shake ? "flicker-anim" : ""} ${playerHpPercent < 25 ? "warning-pulse" : ""}`}
      style={{ 
        backgroundImage: enemyInfo?.bgImage ? `linear-gradient(rgba(5,7,8,0.85), rgba(5,7,8,0.96)), url('${enemyInfo.bgImage}')` : undefined,
        overflow: "hidden"
      }}
    >
      <div className="scanline-overlay" />
      
      {popups.map((p) => (
        <div key={p.id} className={`damage-number ${p.type}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          -{p.value}
        </div>
      ))}

      <header className="battle-header" style={{ position: "relative", zIndex: 10 }}>
        <div>
          <p className="eyebrow glitch-text" data-text={`ENGAGEMENT_ID: ${battleState.enemyGroupId}`}>TACTICAL_COMBAT / {currentChapterId}</p>
          <h1 style={{ fontFamily: "var(--heading-font)", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
            {enemyInfo?.enemy?.name_ko ?? "Unknown Threat"}
          </h1>
        </div>
        <div className="status-chip tactical-frame" style={{ background: "rgba(227, 75, 75, 0.1)", borderColor: "rgba(227, 75, 75, 0.4)", color: "#ffb0a8" }}>
          {enemyInfo?.encounter?.threat_level === "boss" ? "CLASS: S" : "CLASS: A"}
        </div>
      </header>

      <div className="battle-layout" style={{ position: "relative", zIndex: 10 }}>
        <aside className="battle-log glass-panel tactical-frame scrollbar-hide">
          <p className="panel-label">MISSION_LOG.EXE</p>
          <div className="battle-log-list scrollbar-hide" style={{ fontSize: "0.85rem", fontFamily: "var(--mono-family)" }}>
            {battleState.log.map((log, index) => {
              const isWarning = log.includes("WARNING") || log.includes("CRITICAL");
              const isSuccess = log.includes("SUCCESS") || log.includes("SIGNAL");
              return (
                <p key={`${log}-${index}`} style={{ 
                  color: isWarning ? "#e34b4b" : isSuccess ? "#9ccfd6" : "inherit",
                  borderLeft: `2px solid ${isWarning ? "#e34b4b" : isSuccess ? "#9ccfd6" : "rgba(255,255,255,0.1)"}`,
                  background: isWarning ? "rgba(227, 75, 75, 0.05)" : "rgba(255,255,255,0.02)"
                }}>
                  {log}
                </p>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </aside>

        <section className="battle-stage tactical-frame" style={{ border: "none", background: "none" }}>
          <div className="visual-scanner" style={{ position: "absolute", inset: 0, border: "1px solid rgba(156, 207, 214, 0.1)", pointerEvents: "none" }}>
             <div style={{ position: "absolute", top: "10%", left: "10%", width: "80%", height: "80%", border: "1px dashed rgba(156, 207, 214, 0.2)" }} />
             {isScanned && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "1px", background: "var(--accent-color)", animation: "flicker 2s infinite" }} />}
          </div>

          {enemyInfo?.imagePath ? (
            <img
              src={enemyInfo.imagePath}
              className={`enemy-sprite ${shake ? "flicker-anim" : ""}`}
              alt={enemyInfo.enemy?.name_ko ?? enemyInfo.enemyId}
              style={{ 
                filter: `drop-shadow(0 0 30px rgba(156, 207, 214, ${shake ? 0.4 : 0.1}))`,
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: shake ? "scale(1.05) translate(4px, -4px)" : "scale(1)",
                animation: "fadeIn 1s both"
              }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="battle-placeholder glitch-text" data-text="VISUAL_LINK_FAILURE">VISUAL_LINK_FAILURE</div>
          )}

          <div className="enemy-meter glass-panel tactical-frame" style={{ border: "none", background: "rgba(5, 7, 8, 0.9)" }}>
            <div style={{ fontFamily: "var(--heading-font)" }}>
              <span className="eyebrow" style={{ opacity: 0.6 }}>TARGET_INTEGRITY</span>
              <strong style={{ fontSize: "1.4rem" }}>
                {battleState.enemyHp}<span style={{ opacity: 0.3, fontSize: "0.8rem" }}>/{battleState.maxEnemyHp}</span>
              </strong>
            </div>
            <span className="meter" style={{ height: "4px", background: "rgba(255,255,255,0.05)" }}>
              <span style={{ width: `${enemyHpPercent}%`, background: enemyHpPercent < 30 ? "#e34b4b" : "#9ccfd6", boxShadow: `0 0 10px ${enemyHpPercent < 30 ? "#e34b4b" : "#9ccfd6"}66` }} />
            </span>
            {isScanned && <div style={{ fontSize: "0.6rem", color: "var(--accent-color)", marginTop: "4px", fontFamily: "var(--mono-family)" }}>THREAT_LEVEL: {enemyInfo?.enemy?.base_stats?.level ?? "??"} | ATK: {enemyAttack}</div>}
          </div>
        </section>

        <aside className="battle-actions glass-panel tactical-frame" style={{ border: "none" }}>
          <div className="survivor-panel">
            <p className="panel-label">SURVIVOR_STATUS</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <strong style={{ fontSize: "2.4rem", fontFamily: "var(--heading-font)", color: playerHpPercent < 30 ? "#e34b4b" : "inherit" }}>
                {Number(stats.hp ?? 0)}
              </strong>
              <span style={{ opacity: 0.3, fontFamily: "var(--mono-family)" }}>/ {Number(stats.maxHp ?? 100)}</span>
            </div>
            <span className="meter" style={{ height: "4px", background: "rgba(255,255,255,0.05)" }}>
              <span style={{ width: `${playerHpPercent}%`, background: playerHpPercent < 30 ? "#e34b4b" : "#e8c66b", boxShadow: `0 0 10px ${playerHpPercent < 30 ? "#e34b4b" : "#e8c66b"}66` }} />
            </span>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              {isDefending ? <span className="status-chip" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>SHIELD_ACTIVE</span> : null}
              {isScanned ? <span className="status-chip" style={{ fontSize: "0.65rem", padding: "2px 6px", borderColor: "var(--accent-color)" }}>SCAN_ACTIVE</span> : null}
            </div>
          </div>

          <div className="battle-buttons" style={{ gap: "12px" }}>
            <button type="button" className="tactical-frame" onClick={handleAttack} disabled={isProcessing}>
              [01] EXECUTE_STRIKE
            </button>
            <button type="button" className="tactical-frame" onClick={handleDefend} disabled={isProcessing} style={{ background: "rgba(156, 207, 214, 0.1)", color: "#9ccfd6" }}>
              [02] BRACE_IMPACT
            </button>
            <button type="button" className="tactical-frame" onClick={handleScan} disabled={isProcessing || isScanned} style={{ background: "rgba(232, 198, 107, 0.1)", color: "var(--gold-color)", borderColor: "rgba(232, 198, 107, 0.3)" }}>
              [03] TACTICAL_SCAN
            </button>
            <button type="button" className="tactical-frame" onClick={handleRetreat} disabled={isProcessing} style={{ background: "rgba(255, 255, 255, 0.05)", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", minHeight: "42px" }}>
              [04] RETREAT
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};
