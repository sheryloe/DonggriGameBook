import { useGameStore } from "../store/gameStore";

const ACTIONS = [
  { id: "attack", label: "기본 공격" },
  { id: "skill", label: "스킬 사용" },
  { id: "item", label: "아이템 사용" },
  { id: "move", label: "측면 이동" },
  { id: "withdraw", label: "철수" }
] as const;

export default function BattleScreen() {
  const battleState = useGameStore((state) => state.runtime.battle_state);
  const performBattleAction = useGameStore((state) => state.performBattleAction);

  return (
    <section className="screen-card battle-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">Combat Arena</span>
          <h2>{battleState.boss_id ?? battleState.encounter_table_id ?? "Encounter"}</h2>
        </div>
        <strong>Turn {battleState.turn_count}</strong>
      </header>
      <div className="battle-grid">
        {battleState.units.map((unit, index) => (
          <article key={`${unit.enemy_id}-${index}`} className={`battle-unit ${unit.alive ? "" : "is-down"}`}>
            <strong>{unit.name}</strong>
            <span>
              {unit.current_hp} / {unit.max_hp}
            </span>
          </article>
        ))}
      </div>
      <div className="action-row">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            className={action.id === "withdraw" ? "ghost-button" : "primary-button secondary"}
            onClick={() => performBattleAction(action.id)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
