import type {
  BattleAction,
  BattleState,
  EncounterTable,
  EnemyDefinition,
  GameContentPack,
  RuntimeSnapshot,
  RuntimeWarning
} from "../types/game";

function makeWarning(message: string, source: string): RuntimeWarning {
  return {
    message,
    source,
    severity: "warning"
  };
}

function cloneBattleState(battleState: BattleState): BattleState {
  return {
    ...battleState,
    arena_tags: [...battleState.arena_tags],
    units: battleState.units.map((unit) => ({ ...unit })),
    pending_choice_effects: battleState.pending_choice_effects.map((effect) => ({ ...effect })),
    victory_effects: battleState.victory_effects.map((effect) => ({ ...effect })),
    defeat_effects: battleState.defeat_effects.map((effect) => ({ ...effect }))
  };
}

function expandEncounter(
  encounter: EncounterTable,
  enemies: Record<string, EnemyDefinition>,
  warnings: RuntimeWarning[],
  source: string
) {
  const units: BattleState["units"] = [];

  for (const entry of encounter.units) {
    const enemy = enemies[entry.enemy_id];
    if (!enemy) {
      warnings.push(makeWarning(`Encounter refers to missing enemy ${entry.enemy_id}.`, source));
      continue;
    }

    for (let index = 0; index < entry.count; index += 1) {
      units.push({
        enemy_id: enemy.enemy_id,
        name: enemy.name_ko,
        max_hp: Number(enemy.base_stats.hp ?? 30),
        current_hp: Number(enemy.base_stats.hp ?? 30),
        alive: true
      });
    }
  }

  return units;
}

export function createBattleState(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  encounterTableId: string,
  options: Pick<
    BattleState,
    | "arena_tags"
    | "boss_id"
    | "pending_choice_effects"
    | "pending_choice_id"
    | "pending_next_event_id"
    | "source_event_id"
    | "victory_effects"
    | "defeat_effects"
  >
): { battleState: BattleState; warnings: RuntimeWarning[] } {
  const warnings: RuntimeWarning[] = [];
  const encounter = content.encounter_tables[encounterTableId];

  if (!encounter) {
    warnings.push(makeWarning(`Encounter ${encounterTableId} is missing.`, "battle"));
    return {
      battleState: runtime.battle_state,
      warnings
    };
  }

  return {
    battleState: {
      status: "active",
      source_chapter_id: runtime.current_chapter_id,
      source_node_id: runtime.current_node_id ?? undefined,
      source_event_id: options.source_event_id,
      encounter_table_id: encounterTableId,
      boss_id: options.boss_id,
      arena_tags: [...options.arena_tags],
      units: expandEncounter(encounter, content.enemies, warnings, encounterTableId),
      turn_count: 0,
      pending_choice_id: options.pending_choice_id,
      pending_next_event_id: options.pending_next_event_id,
      pending_choice_effects: options.pending_choice_effects.map((effect) => ({ ...effect })),
      victory_effects: options.victory_effects.map((effect) => ({ ...effect })),
      defeat_effects: options.defeat_effects.map((effect) => ({ ...effect }))
    },
    warnings
  };
}

function playerDamageFor(action: BattleAction, runtime: RuntimeSnapshot): number {
  const weaponBonus = runtime.inventory.equipped.main_hand ? 8 : 0;
  const base = Number(runtime.stats.hp ? 10 : 8) + weaponBonus;

  switch (action) {
    case "skill":
      return base + 6;
    case "item":
      return base + 2;
    case "move":
      return base + 1;
    case "attack":
      return base;
    case "withdraw":
      return 0;
    default:
      return base;
  }
}

function enemyCounterDamage(battleState: BattleState): number {
  return battleState.units.filter((unit) => unit.alive).length * 4;
}

export function resolveBattleTurn(
  runtime: RuntimeSnapshot,
  action: BattleAction
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[]; outcome?: "victory" | "defeat" } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime: RuntimeSnapshot = {
    ...runtime,
    stats: { ...runtime.stats },
    battle_state: cloneBattleState(runtime.battle_state)
  };

  if (nextRuntime.battle_state.status !== "active") {
    warnings.push(makeWarning("Battle action ignored because combat is not active.", "battle"));
    return {
      runtime: nextRuntime,
      warnings
    };
  }

  if (action === "withdraw") {
    nextRuntime.battle_state.status = "defeat";
    nextRuntime.battle_state.result = "defeat";
    return {
      runtime: nextRuntime,
      warnings,
      outcome: "defeat"
    };
  }

  const target = nextRuntime.battle_state.units.find((unit) => unit.alive);
  if (!target) {
    nextRuntime.battle_state.status = "victory";
    nextRuntime.battle_state.result = "victory";
    return {
      runtime: nextRuntime,
      warnings,
      outcome: "victory"
    };
  }

  target.current_hp = Math.max(0, target.current_hp - playerDamageFor(action, runtime));
  target.alive = target.current_hp > 0;
  nextRuntime.battle_state.turn_count += 1;
  nextRuntime.stats.noise = Number(nextRuntime.stats.noise ?? 0) + (action === "skill" ? 5 : 2);

  if (nextRuntime.battle_state.units.every((unit) => !unit.alive)) {
    nextRuntime.battle_state.status = "victory";
    nextRuntime.battle_state.result = "victory";
    return {
      runtime: nextRuntime,
      warnings,
      outcome: "victory"
    };
  }

  const hpAfterCounter = Number(nextRuntime.stats.hp ?? 100) - enemyCounterDamage(nextRuntime.battle_state);
  if (hpAfterCounter <= 0) {
    nextRuntime.stats.hp = 1;
    nextRuntime.battle_state.status = "defeat";
    nextRuntime.battle_state.result = "defeat";
    return {
      runtime: nextRuntime,
      warnings,
      outcome: "defeat"
    };
  }

  nextRuntime.stats.hp = hpAfterCounter;
  nextRuntime.stats.contamination = Number(nextRuntime.stats.contamination ?? 0) + 1;
  nextRuntime.battle_state.result = undefined;

  return {
    runtime: nextRuntime,
    warnings
  };
}
