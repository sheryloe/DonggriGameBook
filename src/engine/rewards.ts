import type {
  EffectDefinition,
  FlagValue,
  GameContentPack,
  InventoryItem,
  LootDrop,
  LootTable,
  RuntimeSnapshot,
  RuntimeWarning,
  WidgetStateValue
} from "../types/game";
import {
  evaluateEffectGuard,
  normalizeFlagKey,
  normalizeItemKey,
  normalizeNodeUnlockKey,
  normalizeRouteUnlockKey,
  normalizeTrustKey
} from "./requirements";

function makeWarning(message: string, source: string): RuntimeWarning {
  return {
    message,
    source,
    severity: "warning"
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneSnapshot(runtime: RuntimeSnapshot): RuntimeSnapshot {
  return {
    ...runtime,
    stats: { ...runtime.stats },
    flags: { ...runtime.flags },
    inventory: {
      ...runtime.inventory,
      quantities: { ...runtime.inventory.quantities },
      equipped: { ...runtime.inventory.equipped }
    },
    chapter_progress: Object.fromEntries(
      Object.entries(runtime.chapter_progress).map(([chapterId, progress]) => [
        chapterId,
        {
          ...progress,
          objective_completion: { ...progress.objective_completion }
        }
      ])
    ),
    quest_progress: Object.fromEntries(
      Object.entries(runtime.quest_progress).map(([chapterId, progress]) => [
        chapterId,
        Object.fromEntries(
          Object.entries(progress).map(([questId, questProgress]) => [
            questId,
            {
              ...questProgress
            }
          ])
        )
      ])
    ),
    farming_progress: Object.fromEntries(
      Object.entries(runtime.farming_progress).map(([chapterId, farming]) => [chapterId, { ...farming }])
    ),
    run_metrics: {
      ...runtime.run_metrics,
      chapter_minutes: { ...runtime.run_metrics.chapter_minutes }
    },
    visited_nodes: Object.fromEntries(
      Object.entries(runtime.visited_nodes).map(([chapterId, nodes]) => [chapterId, { ...nodes }])
    ),
    visited_events: Object.fromEntries(
      Object.entries(runtime.visited_events).map(([chapterId, events]) => [
        chapterId,
        Object.fromEntries(
          Object.entries(events).map(([eventId, visitState]) => [
            eventId,
            {
              ...visitState
            }
          ])
        )
      ])
    ),
    loot_session: runtime.loot_session
      ? {
          ...runtime.loot_session,
          drops: runtime.loot_session.drops.map((drop) => ({ ...drop }))
        }
      : null,
    battle_state: {
      ...runtime.battle_state,
      arena_tags: [...runtime.battle_state.arena_tags],
      units: runtime.battle_state.units.map((unit) => ({ ...unit })),
      pending_choice_effects: runtime.battle_state.pending_choice_effects.map((effect) => ({ ...effect })),
      victory_effects: runtime.battle_state.victory_effects.map((effect) => ({ ...effect })),
      defeat_effects: runtime.battle_state.defeat_effects.map((effect) => ({ ...effect }))
    },
    chapter_outcome: runtime.chapter_outcome
      ? {
          ...runtime.chapter_outcome,
          result_payload: runtime.chapter_outcome.result_payload
            ? {
                ...runtime.chapter_outcome.result_payload,
                metrics: runtime.chapter_outcome.result_payload.metrics
                  ? { ...runtime.chapter_outcome.result_payload.metrics }
                  : undefined,
                flags: runtime.chapter_outcome.result_payload.flags
                  ? { ...runtime.chapter_outcome.result_payload.flags }
                  : undefined,
                widgets: runtime.chapter_outcome.result_payload.widgets
                  ? { ...runtime.chapter_outcome.result_payload.widgets }
                  : undefined,
                notes: runtime.chapter_outcome.result_payload.notes
                  ? [...runtime.chapter_outcome.result_payload.notes]
                  : undefined,
                epilogue_card_ids: runtime.chapter_outcome.result_payload.epilogue_card_ids
                  ? [...runtime.chapter_outcome.result_payload.epilogue_card_ids]
                  : undefined
              }
            : undefined
        }
      : null,
    chapter_result_payload: runtime.chapter_result_payload
      ? {
          ...runtime.chapter_result_payload,
          metrics: runtime.chapter_result_payload.metrics ? { ...runtime.chapter_result_payload.metrics } : undefined,
          flags: runtime.chapter_result_payload.flags ? { ...runtime.chapter_result_payload.flags } : undefined,
          widgets: runtime.chapter_result_payload.widgets ? { ...runtime.chapter_result_payload.widgets } : undefined,
          notes: runtime.chapter_result_payload.notes ? [...runtime.chapter_result_payload.notes] : undefined,
          epilogue_card_ids: runtime.chapter_result_payload.epilogue_card_ids
            ? [...runtime.chapter_result_payload.epilogue_card_ids]
            : undefined
        }
      : runtime.chapter_result_payload ?? null,
    unlocked_endings: { ...runtime.unlocked_endings },
    ending_gallery: runtime.ending_gallery ? { ...runtime.ending_gallery } : undefined,
    route_unlocks: runtime.route_unlocks
      ? Object.fromEntries(Object.entries(runtime.route_unlocks).map(([key, value]) => [key, { ...value }]))
      : undefined,
    node_unlocks: runtime.node_unlocks
      ? Object.fromEntries(Object.entries(runtime.node_unlocks).map(([key, value]) => [key, { ...value }]))
      : undefined,
    field_actions_remaining:
      typeof runtime.field_actions_remaining === "number"
        ? runtime.field_actions_remaining
        : runtime.field_actions_remaining
          ? { ...runtime.field_actions_remaining }
          : runtime.field_actions_remaining,
    fail_state: runtime.fail_state ? { ...runtime.fail_state } : runtime.fail_state ?? null,
    chapter_widgets_state: runtime.chapter_widgets_state
      ? Object.fromEntries(
          Object.entries(runtime.chapter_widgets_state).map(([chapterId, widgets]) => [
            chapterId,
            Object.fromEntries(
              Object.entries(widgets).map(([widgetId, entry]) => [
                widgetId,
                {
                  ...entry,
                  value: entry.value
                }
              ])
            )
          ])
        )
      : undefined,
    media_seen: { ...runtime.media_seen },
    part1_carry_flags: runtime.part1_carry_flags ? { ...runtime.part1_carry_flags } : null
  };
}

interface ApplyEffectsOptions {
  rewardMultiplier?: number;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createPrng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967295;
  };
}

function pickWeightedEntry(table: LootTable, prng: () => number): LootTable["entries"][number] | null {
  const totalWeight = table.entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }

  let cursor = prng() * totalWeight;
  for (const entry of table.entries) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry;
    }
  }

  return table.entries[table.entries.length - 1] ?? null;
}

function between(min: number, max: number, prng: () => number): number {
  if (min >= max) {
    return min;
  }

  return min + Math.floor(prng() * (max - min + 1));
}

function toFlagValue(value: unknown, fallback = true): FlagValue {
  if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }

  return fallback;
}

function setAuthValue(runtime: RuntimeSnapshot, target: string, value: unknown): void {
  runtime.stats[target] = value as string | number;
  runtime.flags[target] = toFlagValue(value);
}

function clearAuthValue(runtime: RuntimeSnapshot, target: string): void {
  delete runtime.stats[target];
  delete runtime.flags[target];
}

function ensureChapterWidgetBucket(runtime: RuntimeSnapshot): Record<string, { widget_id: string; value: WidgetStateValue; source?: string; updated_at?: string }> {
  runtime.chapter_widgets_state ??= {};
  runtime.chapter_widgets_state[runtime.current_chapter_id] ??= {};
  return runtime.chapter_widgets_state[runtime.current_chapter_id];
}

function setWidgetValue(runtime: RuntimeSnapshot, target: string, value: WidgetStateValue, source: string): void {
  const widgetKey = target.replace(/^widget(?:_state)?\./u, "").trim();
  if (!widgetKey) {
    return;
  }

  const widgets = ensureChapterWidgetBucket(runtime);
  widgets[widgetKey] = {
    widget_id: widgetKey,
    value,
    source,
    updated_at: nowIso()
  };
}

function setFailStateValue(runtime: RuntimeSnapshot, target: string, value: unknown, source: string): void {
  const key = target.replace(/^fail_state\./u, "").trim();
  runtime.fail_state ??= { source };

  if (!key) {
    runtime.fail_state.reason = typeof value === "string" ? value : runtime.fail_state.reason;
    runtime.fail_state.source = source;
    return;
  }

  if (key === "active") {
    if (!value) {
      runtime.fail_state = null;
    }
    return;
  }

  if (key === "can_retry") {
    runtime.fail_state.can_retry = Boolean(value);
    return;
  }

  if (key === "event_id" || key === "setback_event_id" || key === "reason" || key === "source") {
    (runtime.fail_state as Record<string, unknown>)[key] = value;
  }
}

function setRouteUnlock(runtime: RuntimeSnapshot, target: string, value: unknown, source: string): void {
  const key = normalizeRouteUnlockKey(target);
  const flagValue = toFlagValue(value);

  runtime.route_unlocks ??= {};
  runtime.route_unlocks[key] = {
    unlocked: Boolean(flagValue),
    value: flagValue,
    unlocked_at: nowIso(),
    source
  };
  runtime.flags[`route.unlock.${key}`] = flagValue;
  runtime.flags[key] = flagValue;
}

function setNodeUnlock(runtime: RuntimeSnapshot, target: string, value: unknown, source: string): void {
  const key = normalizeNodeUnlockKey(target);
  const flagValue = toFlagValue(value);

  runtime.node_unlocks ??= {};
  runtime.node_unlocks[key] = {
    unlocked: Boolean(flagValue),
    value: flagValue,
    unlocked_at: nowIso(),
    source
  };
  runtime.flags[`node.unlock.${key}`] = flagValue;
  runtime.flags[key] = flagValue;
}

function readFieldActionBudget(runtime: RuntimeSnapshot): number {
  if (typeof runtime.field_actions_remaining === "number") {
    return runtime.field_actions_remaining;
  }

  if (runtime.field_actions_remaining && typeof runtime.field_actions_remaining === "object") {
    const chapterValue = runtime.field_actions_remaining[runtime.current_chapter_id];
    return typeof chapterValue === "number" ? chapterValue : 0;
  }

  return 0;
}

function writeFieldActionBudget(runtime: RuntimeSnapshot, nextValue: number): void {
  const safeValue = Math.max(0, nextValue);
  if (typeof runtime.field_actions_remaining === "number") {
    runtime.field_actions_remaining = safeValue;
    return;
  }

  runtime.field_actions_remaining ??= {};
  runtime.field_actions_remaining[runtime.current_chapter_id] = safeValue;
}

export function resolveLootTableDeterministically(
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  lootTableId: string,
  repeatCount: number,
  source: string,
  warnings: RuntimeWarning[]
): LootDrop[] {
  const table = content.loot_tables[lootTableId];
  if (!table) {
    warnings.push(makeWarning(`Loot table ${lootTableId} is missing.`, source));
    return [];
  }

  const seed = hashSeed(
    [
      runtime.current_chapter_id,
      runtime.current_node_id ?? "none",
      runtime.current_event_id ?? "none",
      runtime.run_seed,
      lootTableId
    ].join("|")
  );
  const prng = createPrng(seed);
  const aggregated = new Map<string, number>();

  for (let repeat = 0; repeat < repeatCount; repeat += 1) {
    for (let roll = 0; roll < table.rolls; roll += 1) {
      const entry = pickWeightedEntry(table, prng);
      if (!entry) {
        continue;
      }

      const quantity = between(entry.qty_min, entry.qty_max, prng);
      aggregated.set(entry.item_id, (aggregated.get(entry.item_id) ?? 0) + quantity);
    }
  }

  return [...aggregated.entries()].map(([itemId, quantity]) => ({
    item_id: itemId,
    quantity,
    selected: true
  }));
}

export function computeInventoryWeight(
  quantities: Record<string, number>,
  items: Record<string, InventoryItem>,
  modifier = 0
): number {
  const total = Object.entries(quantities).reduce((sum, [itemId, quantity]) => {
    return sum + (items[itemId]?.weight ?? 0) * quantity;
  }, 0);

  return Number((total + modifier).toFixed(2));
}

export function computeCarryLimit(runtime: RuntimeSnapshot, items: Record<string, InventoryItem>): number {
  const base = Number(runtime.stats["carry_limit"] ?? 12);
  const equippedBonus = Object.values(runtime.inventory.equipped).reduce((sum, itemId) => {
    if (!itemId) {
      return sum;
    }

    return sum + Number(items[itemId]?.stats?.carry_limit_bonus ?? 0);
  }, 0);

  return base + equippedBonus;
}

export function applyEffects(
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  effects: EffectDefinition[],
  source: string,
  options: ApplyEffectsOptions = {}
): { runtime: RuntimeSnapshot; warnings: RuntimeWarning[]; grantedLoot: LootDrop[] } {
  const warnings: RuntimeWarning[] = [];
  const nextRuntime = cloneSnapshot(runtime);
  const grantedLoot: LootDrop[] = [];
  const rewardMultiplier = Number.isFinite(Number(options.rewardMultiplier))
    ? Math.max(0, Number(options.rewardMultiplier))
    : 1;

  for (const effect of effects) {
    const guard = typeof effect.meta?.if === "string" ? effect.meta.if : null;
    if (guard && !evaluateEffectGuard(guard, nextRuntime, warnings, source)) {
      continue;
    }

    switch (effect.op) {
      case "set_flag": {
        const flagKey = normalizeFlagKey(effect.target);
        const nextValue = effect.value === undefined ? true : (effect.value as boolean | number | string);
        nextRuntime.flags[flagKey] = nextValue;
        if (flagKey.startsWith("auth.")) {
          setAuthValue(nextRuntime, flagKey, nextValue);
        }
        break;
      }
      case "clear_flag": {
        const flagKey = normalizeFlagKey(effect.target);
        delete nextRuntime.flags[flagKey];
        if (flagKey.startsWith("auth.")) {
          clearAuthValue(nextRuntime, flagKey);
        }
        break;
      }
      case "add_stat": {
        const current = Number(nextRuntime.stats[effect.target] ?? content.stats_registry[effect.target]?.default ?? 0);
        nextRuntime.stats[effect.target] = current + Number(effect.value ?? 0);
        break;
      }
      case "sub_stat": {
        const current = Number(nextRuntime.stats[effect.target] ?? content.stats_registry[effect.target]?.default ?? 0);
        nextRuntime.stats[effect.target] = current - Number(effect.value ?? 0);
        break;
      }
      case "consume_slot": {
        writeFieldActionBudget(nextRuntime, readFieldActionBudget(nextRuntime) - Math.max(1, Number(effect.value ?? 1)));
        break;
      }
      case "consume_fuel": {
        const fuelKey = effect.target || "fuel";
        const current = Number(nextRuntime.stats[fuelKey] ?? content.stats_registry[fuelKey]?.default ?? 0);
        nextRuntime.stats[fuelKey] = Math.max(0, current - Math.max(1, Number(effect.value ?? 1)));
        break;
      }
      case "grant_item": {
        const itemId = normalizeItemKey(effect.target);
        const baseQuantity = Number(effect.value ?? 1);
        const quantity =
          baseQuantity > 0 ? Math.max(1, Math.round(baseQuantity * rewardMultiplier)) : baseQuantity;
        if (!content.items[itemId]) {
          warnings.push(makeWarning(`Cannot grant missing item ${itemId}.`, source));
          break;
        }

        if (quantity <= 0) {
          warnings.push(makeWarning(`Cannot grant a non-positive quantity for ${itemId}.`, source));
          break;
        }

        nextRuntime.inventory.quantities[itemId] = (nextRuntime.inventory.quantities[itemId] ?? 0) + quantity;
        break;
      }
      case "remove_item": {
        const itemId = normalizeItemKey(effect.target);
        const current = nextRuntime.inventory.quantities[itemId] ?? 0;
        const quantity = Number(effect.value ?? 1);
        nextRuntime.inventory.quantities[itemId] = Math.max(0, current - Math.max(0, quantity));
        break;
      }
      case "unlock_route": {
        setRouteUnlock(nextRuntime, effect.target, effect.value, source);
        break;
      }
      case "unlock_node": {
        setNodeUnlock(nextRuntime, effect.target, effect.value, source);
        break;
      }
      case "set_route": {
        const routeKey = effect.target || "route.current";
        const routeValue = String(effect.value ?? "none");
        nextRuntime.stats[routeKey] = routeValue;
        nextRuntime.stats["route.current"] = routeValue;
        nextRuntime.chapter_progress[nextRuntime.current_chapter_id] = {
          ...nextRuntime.chapter_progress[nextRuntime.current_chapter_id],
          selected_route: routeValue
        };
        break;
      }
      case "add_trust": {
        const trustKey = normalizeTrustKey(effect.target);
        const current = Number(nextRuntime.stats[trustKey] ?? content.stats_registry[trustKey]?.default ?? 0);
        nextRuntime.stats[trustKey] = current + Number(effect.value ?? 0);
        break;
      }
      case "add_reputation": {
        const current = Number(nextRuntime.stats[effect.target] ?? content.stats_registry[effect.target]?.default ?? 0);
        nextRuntime.stats[effect.target] = current + Number(effect.value ?? 0);
        break;
      }
      case "grant_loot_table": {
        const lootTableId = effect.target.startsWith("loot:") ? effect.target.slice(5) : effect.target;
        const drops = resolveLootTableDeterministically(
          content,
          nextRuntime,
          lootTableId,
          Number(effect.value ?? 1),
          source,
          warnings
        ).map((drop) => ({
          ...drop,
          quantity: drop.quantity > 0 ? Math.max(1, Math.round(drop.quantity * rewardMultiplier)) : drop.quantity
        }));
        grantedLoot.push(...drops);
        break;
      }
      case "set_value": {
        if (effect.target.startsWith("auth.")) {
          setAuthValue(nextRuntime, effect.target, effect.value);
          break;
        }

        if (/^widget(?:_state)?\./u.test(effect.target)) {
          setWidgetValue(nextRuntime, effect.target, (effect.value ?? null) as WidgetStateValue, source);
          break;
        }

        if (effect.target.startsWith("fail_state.")) {
          setFailStateValue(nextRuntime, effect.target, effect.value, source);
          break;
        }

        nextRuntime.stats[effect.target] = effect.value as string | number;
        break;
      }
      default: {
        warnings.push(makeWarning(`Unsupported effect operation ${effect.op}.`, source));
        break;
      }
    }
  }

  nextRuntime.stats["carry_weight"] = computeInventoryWeight(
    nextRuntime.inventory.quantities,
    content.items,
    nextRuntime.inventory.carry_weight_modifier
  );

  nextRuntime.stats["carry_limit"] = computeCarryLimit(nextRuntime, content.items);

  return {
    runtime: nextRuntime,
    warnings,
    grantedLoot
  };
}
