import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PROJECT_ROOT = process.cwd();

const DEFAULT_CHAPTERS = ["CH01", "CH02", "CH03", "CH04", "CH05"];
const DEFAULT_STRATEGIES = ["cautious", "aggressive"];
const DEFAULT_PLAYERS = 2;
const DEFAULT_SEED = "20260410";
const DEFAULT_OUT_DIR = "output/sim";
const DEFAULT_MAX_STEPS_PER_CHAPTER = 240;
const DEFAULT_BATTLE_MAX_TURNS = 40;
const BASE_EVENT_MINUTES = 2;
const BASE_CHOICE_MINUTES = 1;
const REPEAT_FARMING_EXTRA_MINUTES = 2;
const CHAPTER_MINIMUM_TARGET_MINUTES = 20;
const CHAPTER_TARGET_MINUTES_BY_ID = {
  CH06: 5,
  CH07: 6,
  CH08: 6,
  CH09: 6,
  CH10: 7,
  CH11: 5,
  CH12: 6,
  CH13: 7,
  CH14: 5,
  CH15: 7,
  CH16: 6,
  CH17: 7,
  CH18: 10,
  CH19: 8,
  CH20: 9
};

const CHAPTER_REVIEW_HINTS = {
  CH01: "온보딩은 안정적이지만 파밍 선택 폭이 좁아 조건형 보조 루프를 확장했다.",
  CH02: "리스크-보상 구조는 유지하되 반복 파밍의 체감 페널티를 강화했다.",
  CH03: "중반 분기 유지와 장비 성장 동기를 동시에 확보하도록 루프를 조정했다.",
  CH04: "CH05 진입 막힘을 방지하도록 판교 진입권 경로를 고정했다.",
  CH05: "피날레 직전 준비 밀도를 높이기 위해 반복 루프와 사이드 동선을 보강했다."
};

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const trimmed = token.slice(2);
    if (!trimmed) {
      continue;
    }

    if (trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      parsed[key] = rest.join("=");
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[trimmed] = "true";
      continue;
    }

    parsed[trimmed] = next;
    index += 1;
  }
  return parsed;
}

function asPositiveInt(value, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
}

function hashString(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createPrng(seed) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967295;
  };
}

function stripFlagTarget(target) {
  return String(target ?? "").startsWith("flag:") ? String(target).slice(5) : String(target ?? "");
}

function stripItemTarget(target) {
  return String(target ?? "").startsWith("item:") ? String(target).slice(5) : String(target ?? "");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeChoices(event) {
  return toArray(event?.choices);
}

function pushWarning(warnings, message) {
  if (!message) {
    return;
  }

  if (!warnings.includes(message)) {
    warnings.push(message);
  }
}

function normalizeChoiceLabel(choice) {
  return choice.label ?? choice.text ?? choice.choice_id ?? "unknown_choice";
}

function normalizeChoiceConditions(choice) {
  const conditions = toArray(choice.conditions);
  if (conditions.length > 0) {
    return conditions;
  }
  return toArray(choice.requires);
}

function normalizeEventConditions(event) {
  const conditions = toArray(event?.conditions);
  if (conditions.length > 0) {
    return conditions;
  }
  return toArray(event?.requires);
}

function normalizeEventType(event) {
  return event.event_type ?? event.type ?? "event";
}

function setNumericStat(stats, key, value) {
  const numeric = Number(value);
  stats[key] = Number.isFinite(numeric) ? numeric : 0;
}

function addNumericStat(stats, key, delta) {
  const current = Number(stats[key] ?? 0);
  const next = current + Number(delta ?? 0);
  setNumericStat(stats, key, next);
}

function normalizeCoreStats(stats) {
  setNumericStat(stats, "hp", Number(stats.hp ?? 100));
  setNumericStat(stats, "max_hp", Number(stats.max_hp ?? Math.max(Number(stats.hp ?? 100), 1)));
  setNumericStat(stats, "noise", Number(stats.noise ?? 0));
  setNumericStat(stats, "contamination", Number(stats.contamination ?? 0));

  if (stats.max_hp < 1) {
    stats.max_hp = 1;
  }
  if (stats.hp > stats.max_hp) {
    stats.hp = stats.max_hp;
  }
  if (stats.hp < 0) {
    stats.hp = 0;
  }
  if (stats.noise < 0) {
    stats.noise = 0;
  }
  if (stats.contamination < 0) {
    stats.contamination = 0;
  }
}

function cloneState(state) {
  return {
    stats: { ...state.stats },
    flags: { ...state.flags },
    inventory: { ...state.inventory }
  };
}

function parseScalar(input) {
  const normalized = String(input ?? "").trim();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  const asNumber = Number(normalized);
  if (!Number.isNaN(asNumber) && normalized !== "") {
    return asNumber;
  }
  return normalized;
}

function resolveRuntimeValue(reference, state) {
  const normalized = String(reference ?? "").trim();
  if (!normalized) {
    return undefined;
  }
  if (normalized.startsWith("flag:")) {
    return state.flags[stripFlagTarget(normalized)];
  }
  if (normalized.startsWith("item:")) {
    return Number(state.inventory[stripItemTarget(normalized)] ?? 0);
  }
  if (Object.prototype.hasOwnProperty.call(state.stats, normalized)) {
    return state.stats[normalized];
  }
  if (Object.prototype.hasOwnProperty.call(state.flags, normalized)) {
    return state.flags[normalized];
  }
  return undefined;
}

function compareValues(left, operator, right) {
  const normalizedRight = parseScalar(right);
  if (operator === "=") {
    if (typeof left === "number" && typeof normalizedRight === "number") {
      return left === normalizedRight;
    }
    if (typeof left === "boolean" && typeof normalizedRight === "boolean") {
      return left === normalizedRight;
    }
    return String(left ?? "") === String(normalizedRight);
  }

  const leftNumber = Number(left ?? 0);
  const rightNumber = Number(normalizedRight);
  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) {
    return false;
  }

  switch (operator) {
    case ">=":
      return leftNumber >= rightNumber;
    case "<=":
      return leftNumber <= rightNumber;
    case ">":
      return leftNumber > rightNumber;
    case "<":
      return leftNumber < rightNumber;
    default:
      return false;
  }
}

function evaluateConditionExpression(expression, state, warnings, context) {
  const raw = String(expression ?? "").trim();
  if (!raw) {
    return true;
  }

  if (raw.includes("|")) {
    return raw.split("|").some((entry) => evaluateConditionExpression(entry, state, warnings, context));
  }

  if (raw.startsWith("!")) {
    return !evaluateConditionExpression(raw.slice(1), state, warnings, context);
  }

  if (raw.startsWith("flag:")) {
    const [flagReference, explicitValue] = raw.split("=");
    if (explicitValue !== undefined) {
      return compareValues(resolveRuntimeValue(flagReference, state), "=", explicitValue);
    }
    return Boolean(state.flags[stripFlagTarget(flagReference)]);
  }

  const comparisonMatch = /^([a-zA-Z0-9_.:-]+)\s*(>=|<=|=|>|<)\s*([a-zA-Z0-9_.:-]+)$/u.exec(raw);
  if (comparisonMatch) {
    const [, left, operator, right] = comparisonMatch;
    return compareValues(resolveRuntimeValue(left, state), operator, right);
  }

  warnings.push(`[${context}] unsupported condition "${raw}"`);
  return false;
}

function evaluateEffectGuard(expression, state, warnings, context) {
  const raw = String(expression ?? "").trim();
  if (!raw) {
    return true;
  }

  if (raw.includes("|")) {
    return raw.split("|").some((entry) => evaluateEffectGuard(entry, state, warnings, context));
  }

  if (raw.startsWith("!")) {
    return !evaluateEffectGuard(raw.slice(1), state, warnings, context);
  }

  return evaluateConditionExpression(raw, state, warnings, context);
}

function getFarmingRewardMultiplier(completionCount) {
  if (completionCount >= 5) {
    return 0.45;
  }
  if (completionCount >= 3) {
    return 0.7;
  }
  return 1;
}

function resolveLootDropsDeterministically(
  state,
  lootTableId,
  repeatCount,
  lootTablesById,
  warnings,
  context,
  rewardMultiplier = 1,
  lootContext = {}
) {
  const table = lootTablesById.get(lootTableId);
  if (!table) {
    pushWarning(warnings, `[${context}] missing loot table "${lootTableId}"`);
    return [];
  }

  const seed = hashString(
    [
      lootContext.chapterId ?? state.currentChapterId ?? "none",
      lootContext.nodeId ?? state.currentNodeId ?? "none",
      lootContext.eventId ?? state.currentEventId ?? "none",
      state.runSeed ?? DEFAULT_SEED,
      lootTableId
    ].join("|")
  );
  const rng = createPrng(seed);
  const aggregated = new Map();

  for (let repeat = 0; repeat < repeatCount; repeat += 1) {
    for (let roll = 0; roll < Number(table.rolls ?? 0); roll += 1) {
      const entries = toArray(table.entries);
      const totalWeight = entries.reduce((sum, entry) => sum + Number(entry.weight ?? 0), 0);
      if (totalWeight <= 0) {
        continue;
      }

      let cursor = rng() * totalWeight;
      let picked = entries[entries.length - 1];
      for (const entry of entries) {
        cursor -= Number(entry.weight ?? 0);
        if (cursor <= 0) {
          picked = entry;
          break;
        }
      }

      if (!picked) {
        continue;
      }

      const minQty = Number(picked.qty_min ?? 1);
      const maxQty = Number(picked.qty_max ?? minQty);
      const quantity = Math.max(
        0,
        minQty >= maxQty ? minQty : minQty + Math.floor(rng() * (maxQty - minQty + 1))
      );
      const scaledQuantity =
        quantity > 0 ? Math.max(1, Math.round(quantity * Math.max(0, Number(rewardMultiplier) || 0))) : quantity;
      if (scaledQuantity <= 0) {
        continue;
      }

      const itemId = stripItemTarget(picked.item_id);
      aggregated.set(itemId, Number(aggregated.get(itemId) ?? 0) + scaledQuantity);
    }
  }

  return [...aggregated.entries()].map(([itemId, quantity]) => ({
    itemId,
    quantity: Number(quantity ?? 0)
  }));
}

function applySingleEffect(state, effect, lootTablesById, warnings, context, options = {}) {
  if (!effect || typeof effect !== "object") {
    return;
  }

  const guard = typeof effect.meta?.if === "string" ? effect.meta.if : "";
  if (guard && !evaluateEffectGuard(guard, state, warnings, context)) {
    return;
  }

  const op = String(effect.op ?? "");
  const target = String(effect.target ?? "");
  const value = effect.value;
  const rewardMultiplier = Number.isFinite(Number(options.rewardMultiplier))
    ? Math.max(0, Number(options.rewardMultiplier))
    : 1;

  switch (op) {
    case "set_flag": {
      state.flags[stripFlagTarget(target)] = value === undefined ? true : value;
      break;
    }
    case "clear_flag": {
      delete state.flags[stripFlagTarget(target)];
      break;
    }
    case "add_stat": {
      addNumericStat(state.stats, target, Number(value ?? 0));
      break;
    }
    case "sub_stat": {
      addNumericStat(state.stats, target, -Number(value ?? 0));
      break;
    }
    case "modify_stat": {
      addNumericStat(state.stats, target, Number(value ?? 0));
      break;
    }
    case "grant_item": {
      const itemId = stripItemTarget(target);
      const baseQuantity = Math.max(0, Number(value ?? 1));
      const quantity = baseQuantity > 0 ? Math.max(1, Math.round(baseQuantity * rewardMultiplier)) : baseQuantity;
      if (quantity > 0) {
        state.inventory[itemId] = Number(state.inventory[itemId] ?? 0) + quantity;
      }
      break;
    }
    case "remove_item": {
      const itemId = stripItemTarget(target);
      const quantity = Math.max(0, Number(value ?? 1));
      const next = Math.max(0, Number(state.inventory[itemId] ?? 0) - quantity);
      if (next === 0) {
        delete state.inventory[itemId];
      } else {
        state.inventory[itemId] = next;
      }
      break;
    }
    case "set_value": {
      state.stats[target] = value;
      break;
    }
    case "set_route": {
      const routeValue = String(value ?? "none");
      state.stats[target || "route.current"] = routeValue;
      state.stats["route.current"] = routeValue;
      break;
    }
    case "add_trust":
    case "add_reputation": {
      addNumericStat(state.stats, target, Number(value ?? 0));
      break;
    }
    case "grant_loot_table": {
      const tableId = target.startsWith("loot:") ? target.slice(5) : target;
      const repeatCount = Math.max(1, Number(value ?? 1));
      const drops = resolveLootDropsDeterministically(
        state,
        tableId,
        repeatCount,
        lootTablesById,
        warnings,
        context,
        rewardMultiplier,
        options.lootContext
      );
      for (const drop of drops) {
        if (drop.quantity <= 0) {
          continue;
        }
        state.inventory[drop.itemId] = Number(state.inventory[drop.itemId] ?? 0) + drop.quantity;
      }
      break;
    }
    case "unlock_route": {
      state.routeUnlocks[target || String(value ?? "")] = value === undefined ? true : value;
      break;
    }
    case "unlock_node": {
      state.nodeUnlocks[target || String(value ?? "")] = value === undefined ? true : value;
      break;
    }
    default: {
      pushWarning(warnings, `[${context}] unsupported effect op "${op}"`);
      break;
    }
  }

  normalizeCoreStats(state.stats);
}

function applyEffects(state, effects, lootTablesById, warnings, context, options = {}) {
  for (const effect of toArray(effects)) {
    applySingleEffect(state, effect, lootTablesById, warnings, context, options);
  }
}

function scoreChoice(strategy, eventId, choice, previewState, warnings, context) {
  const effects = toArray(choice.effects);

  let hpDelta = 0;
  let noiseDelta = 0;
  let itemGain = 0;
  let itemLoss = 0;
  let flagSet = 0;
  let trustRepGain = 0;
  let progressSignal = 0;

  for (const effect of effects) {
    if (!effect || typeof effect !== "object") {
      continue;
    }

    const op = String(effect.op ?? "");
    const target = String(effect.target ?? "");
    const numeric = Number(effect.value ?? 0);

    if (op === "modify_stat" || op === "add_stat") {
      if (target === "hp") {
        hpDelta += numeric;
      }
      if (target === "noise") {
        noiseDelta += numeric;
      }
    }
    if (op === "sub_stat") {
      if (target === "hp") {
        hpDelta -= numeric;
      }
      if (target === "noise") {
        noiseDelta -= numeric;
      }
    }
    if (op === "grant_item" || op === "grant_loot_table") {
      itemGain += Math.max(1, numeric || 1);
    }
    if (op === "remove_item") {
      itemLoss += Math.max(1, numeric || 1);
    }
    if (op === "set_flag") {
      flagSet += 1;
    }
    if (op === "add_trust" || op === "add_reputation") {
      trustRepGain += Math.max(1, numeric || 1);
    }
  }

  const nextEventId = choice.next_event_id ?? null;
  if (!nextEventId) {
    progressSignal -= 12;
  } else if (String(nextEventId).startsWith("END_")) {
    progressSignal += 14;
  } else if (nextEventId === eventId) {
    progressSignal -= 4;
  } else {
    progressSignal += 4;
  }

  let score = 0;
  if (strategy === "cautious") {
    score =
      hpDelta >= 0 ? hpDelta * 1.6 : hpDelta * 4.6;
    score += noiseDelta <= 0 ? -noiseDelta * 1.4 : -noiseDelta * 3.8;
    score += itemGain * 1.2;
    score -= itemLoss * 2.6;
    score += flagSet * 0.8;
    score += trustRepGain * 0.8;
    score += progressSignal * 1.4;
  } else {
    score = itemGain * 4.2;
    score -= itemLoss * 1.8;
    score += flagSet * 2.3;
    score += trustRepGain * 2.1;
    score += progressSignal * 1.8;
    score += hpDelta * 0.45;
    score += noiseDelta > 0 ? -noiseDelta * 0.9 : -noiseDelta * 0.4;
  }

  if (!Number.isFinite(score)) {
    warnings.push(`[${context}] non-finite score for "${choice.choice_id}"`);
    return Number.NEGATIVE_INFINITY;
  }
  return score;
}

function pickChoice(
  strategy,
  event,
  state,
  lootTablesById,
  rng,
  warnings,
  rewardMultiplier = 1,
  completionCount = 1
) {
  const allChoices = normalizeChoices(event);
  const available = allChoices.filter((choice) =>
    normalizeChoiceConditions(choice).every((condition) =>
      evaluateConditionExpression(condition, state, warnings, `choice:${choice.choice_id}`)
    )
  );

  if (available.length === 0) {
    return { choice: null, reason: "no_available_choice" };
  }

  const hasForwardChoice = available.some((choice) => (choice.next_event_id ?? event.next_event_id ?? null) !== event.event_id);
  const boundedAvailable =
    event.repeatable && hasForwardChoice && completionCount >= 6
      ? available.filter((choice) => (choice.next_event_id ?? event.next_event_id ?? null) !== event.event_id)
      : available;
  const candidateChoices = boundedAvailable.length > 0 ? boundedAvailable : available;

  const scored = candidateChoices.map((choice) => {
    const preview = cloneState(state);
    preview.currentChapterId = state.currentChapterId;
    preview.currentNodeId = state.currentNodeId;
    preview.currentEventId = state.currentEventId;
    preview.runSeed = state.runSeed;
    preview.routeUnlocks = { ...state.routeUnlocks };
    preview.nodeUnlocks = { ...state.nodeUnlocks };
    applyEffects(preview, choice.effects, lootTablesById, warnings, `score-preview:${choice.choice_id}`, {
      rewardMultiplier,
      lootContext: {
        chapterId: state.currentChapterId,
        nodeId: event.node_id,
        eventId: event.event_id
      }
    });
    let score = scoreChoice(strategy, event.event_id, choice, preview, warnings, `score:${choice.choice_id}`);
    const nextEventId = choice.next_event_id ?? event.next_event_id ?? null;
    if (nextEventId === event.event_id) {
      score -= 2 + completionCount * 1.5;
    }
    if (rewardMultiplier < 1) {
      score -= (1 - rewardMultiplier) * 10;
    }
    return { choice, score };
  });

  const bestScore = scored.reduce((max, entry) => Math.max(max, entry.score), Number.NEGATIVE_INFINITY);
  const best = scored.filter((entry) => entry.score === bestScore);
  const picked = best[Math.floor(rng() * best.length)]?.choice ?? null;

  if (!picked) {
    return { choice: null, reason: "choice_pick_failed" };
  }

  return { choice: picked, reason: "ok" };
}

function buildInitialState(statsRegistry) {
  const stats = {};
  for (const entry of toArray(statsRegistry?.stats)) {
    stats[entry.key] = entry.default;
  }
  if (stats.hp === undefined) {
    stats.hp = 100;
  }
  if (stats.max_hp === undefined) {
    stats.max_hp = 100;
  }
  if (stats.noise === undefined) {
    stats.noise = 0;
  }
  if (stats.contamination === undefined) {
    stats.contamination = 0;
  }

  normalizeCoreStats(stats);
  return {
    stats,
    flags: {},
    inventory: {},
    farming: {},
    visitedEvents: {},
    visitedNodes: {},
    currentChapterId: null,
    currentNodeId: null,
    currentEventId: null,
    runSeed: DEFAULT_SEED,
    routeUnlocks: {},
    nodeUnlocks: {},
    runMetrics: {
      chapterMinutes: {},
      totalMinutes: 0,
      totalEvents: 0,
      totalChoices: 0,
      totalMoves: 0
    }
  };
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadGameContent(rootDir, chapterIds) {
  const packRoot = path.join(rootDir, "codex_webgame_pack");
  const chaptersIndex = loadJson(path.join(packRoot, "data", "chapters.index.json"));
  const statsRegistry = loadJson(path.join(packRoot, "data", "stats.registry.json"));
  const lootTables = loadJson(path.join(packRoot, "data", "loot_tables.json"));
  const encounterTables = loadJson(path.join(packRoot, "data", "encounter_tables.json"));
  const enemiesRegistry = loadJson(path.join(packRoot, "data", "enemy.registry.json"));
  const itemsDatabase = loadJson(path.join(packRoot, "data", "inventory.items.json"));

  const lootTablesById = new Map();
  for (const table of toArray(lootTables?.loot_tables)) {
    lootTablesById.set(table.loot_table_id, table);
  }

  const encounterTablesById = new Map();
  for (const table of toArray(encounterTables?.encounter_tables)) {
    encounterTablesById.set(table.encounter_table_id, table);
  }

  const enemiesById = new Map();
  for (const enemy of toArray(enemiesRegistry?.enemies)) {
    enemiesById.set(enemy.enemy_id, enemy);
  }

  const itemsById = new Map();
  for (const item of toArray(itemsDatabase?.items)) {
    itemsById.set(item.item_id, item);
  }

  const chapterMetaById = new Map(toArray(chaptersIndex?.chapters).map((entry) => [entry.chapter_id, entry]));
  const chapters = [];

  for (const chapterId of chapterIds) {
    const meta = chapterMetaById.get(chapterId);
    if (!meta) {
      throw new Error(`Chapter metadata is missing for ${chapterId}`);
    }

    const chapterPath = path.join(packRoot, meta.file);
    const chapter = loadJson(chapterPath);
    const eventsById = new Map(toArray(chapter.events).map((event) => [event.event_id, event]));
    const nodesById = new Map(toArray(chapter.nodes).map((node) => [node.node_id, node]));
    const entryNode = nodesById.get(chapter.entry_node_id);
    const entryEventId = toArray(entryNode?.event_ids)[0] ?? null;

    chapters.push({
      chapterId,
      chapter,
      eventsById,
      nodesById,
      nodeOrder: toArray(chapter.nodes).map((node) => node.node_id),
      entryEventId
    });
  }

  return {
    statsRegistry,
    lootTablesById,
    encounterTablesById,
    enemiesById,
    itemsById,
    chapters
  };
}

function addChapterMinutes(state, chapterId, minutes) {
  const numeric = Math.max(0, Number(minutes) || 0);
  state.runMetrics.chapterMinutes[chapterId] = Number(state.runMetrics.chapterMinutes[chapterId] ?? 0) + numeric;
  state.runMetrics.totalMinutes += numeric;
}

function getVisitState(state, chapterId, eventId) {
  state.visitedEvents[chapterId] ??= {};
  state.visitedEvents[chapterId][eventId] ??= {
    seen_count: 0,
    completed_count: 0,
    entered_once: false
  };
  return state.visitedEvents[chapterId][eventId];
}

function recordNodeVisit(state, chapterId, nodeId) {
  if (!nodeId) {
    return;
  }
  state.visitedNodes[chapterId] ??= {};
  state.visitedNodes[chapterId][nodeId] = true;
}

function canTriggerEvent(event, state, chapterId, warnings) {
  const visitState = state.visitedEvents[chapterId]?.[event.event_id];
  if (event.once_per_run && Number(visitState?.completed_count ?? 0) > 0) {
    return false;
  }
  if (!event.repeatable && Number(visitState?.completed_count ?? 0) > 0) {
    return false;
  }

  return normalizeEventConditions(event).every((condition) =>
    evaluateConditionExpression(condition, state, warnings, `event:${event.event_id}`)
  );
}

function findFirstAvailableEvent(chapterInfo, state, nodeId, warnings) {
  const node = chapterInfo.nodesById.get(nodeId);
  if (!node) {
    pushWarning(warnings, `[node:${chapterInfo.chapterId}] missing node "${nodeId}"`);
    return null;
  }

  for (const eventId of toArray(node.event_ids)) {
    const event = chapterInfo.eventsById.get(eventId);
    if (event && canTriggerEvent(event, state, chapterInfo.chapterId, warnings)) {
      return event;
    }
  }

  return null;
}

function makeNodeOrderIndex(chapterInfo) {
  return new Map(chapterInfo.nodeOrder.map((nodeId, index) => [nodeId, index]));
}

function findShortestReachablePath(chapterInfo, state, fromNodeId, toNodeId, warnings) {
  if (!fromNodeId || !toNodeId || fromNodeId === toNodeId) {
    return [];
  }

  const nodeOrderIndex = makeNodeOrderIndex(chapterInfo);
  const distances = new Map([[fromNodeId, 0]]);
  const previous = new Map();
  const queue = [fromNodeId];
  const visited = new Set();

  while (queue.length > 0) {
    queue.sort((left, right) => {
      const distanceDelta = Number(distances.get(left) ?? Number.POSITIVE_INFINITY) - Number(distances.get(right) ?? Number.POSITIVE_INFINITY);
      if (distanceDelta !== 0) {
        return distanceDelta;
      }
      return Number(nodeOrderIndex.get(left) ?? 0) - Number(nodeOrderIndex.get(right) ?? 0);
    });
    const currentNodeId = queue.shift();
    if (!currentNodeId || visited.has(currentNodeId)) {
      continue;
    }
    visited.add(currentNodeId);

    if (currentNodeId === toNodeId) {
      break;
    }

    const node = chapterInfo.nodesById.get(currentNodeId);
    for (const connection of toArray(node?.connections)) {
      const nextNodeId = connection.to;
      const canTraverse = toArray(connection.requires).every((condition) =>
        evaluateConditionExpression(condition, state, warnings, `connection:${currentNodeId}->${nextNodeId}`)
      );
      if (!canTraverse) {
        continue;
      }

      const nextDistance = Number(distances.get(currentNodeId) ?? 0) + Math.max(0, Number(connection.cost?.time ?? 0));
      if (nextDistance < Number(distances.get(nextNodeId) ?? Number.POSITIVE_INFINITY)) {
        distances.set(nextNodeId, nextDistance);
        previous.set(nextNodeId, {
          from: currentNodeId,
          connection
        });
        queue.push(nextNodeId);
      }
    }
  }

  if (!previous.has(toNodeId)) {
    return null;
  }

  const path = [];
  let cursor = toNodeId;
  while (cursor !== fromNodeId) {
    const step = previous.get(cursor);
    if (!step) {
      return null;
    }
    path.unshift({
      from: step.from,
      to: cursor,
      connection: step.connection
    });
    cursor = step.from;
  }

  return path;
}

function applyTravelPath(state, chapterInfo, pathSteps) {
  for (const step of toArray(pathSteps)) {
    addNumericStat(state.stats, "noise", Number(step.connection?.cost?.noise ?? 0));
    addNumericStat(state.stats, "contamination", Number(step.connection?.cost?.contamination ?? 0));
    addChapterMinutes(state, chapterInfo.chapterId, Number(step.connection?.cost?.time ?? 0));
    state.runMetrics.totalMoves += 1;
    state.currentNodeId = step.to;
    recordNodeVisit(state, chapterInfo.chapterId, step.to);
  }
  normalizeCoreStats(state.stats);
}

function openEvent(chapterInfo, state, event, lootTablesById, warnings) {
  state.currentChapterId = chapterInfo.chapterId;
  state.currentNodeId = event.node_id;
  state.currentEventId = event.event_id;
  recordNodeVisit(state, chapterInfo.chapterId, event.node_id);
  const visitState = getVisitState(state, chapterInfo.chapterId, event.event_id);
  visitState.seen_count += 1;
  state.runMetrics.totalEvents += 1;
  addChapterMinutes(state, chapterInfo.chapterId, BASE_EVENT_MINUTES);

  if (!visitState.entered_once) {
    applyEffects(state, event.on_enter_effects, lootTablesById, warnings, `enter:${event.event_id}`, {
      lootContext: {
        chapterId: chapterInfo.chapterId,
        nodeId: event.node_id,
        eventId: event.event_id
      }
    });
    visitState.entered_once = true;
  }
}

function markEventCompleted(state, chapterId, eventId, choiceId) {
  const visitState = getVisitState(state, chapterId, eventId);
  visitState.completed_count += 1;
  visitState.last_choice_id = choiceId ?? visitState.last_choice_id;
  return visitState.completed_count;
}

function applyRepeatableProgress(state, chapterId, event, completionCount) {
  if (!event.repeatable) {
    return;
  }

  state.farming[chapterId] ??= {};
  state.farming[chapterId][event.event_id] = completionCount;
  if (completionCount >= 3) {
    addNumericStat(state.stats, "noise", 1);
  }
  if (completionCount >= 5) {
    addNumericStat(state.stats, "contamination", 1);
  }
  if (completionCount > 1) {
    addChapterMinutes(state, chapterId, REPEAT_FARMING_EXTRA_MINUTES);
  }
  normalizeCoreStats(state.stats);
}

function findBestReachableEvent(chapterInfo, state, startNodeId, warnings) {
  const candidates = [];
  for (const nodeId of chapterInfo.nodeOrder) {
    const event = findFirstAvailableEvent(chapterInfo, state, nodeId, []);
    if (!event) {
      continue;
    }

    const pathSteps = nodeId === startNodeId ? [] : findShortestReachablePath(chapterInfo, state, startNodeId, nodeId, warnings);
    if (nodeId !== startNodeId && !pathSteps) {
      continue;
    }

    const travelTime = toArray(pathSteps).reduce(
      (sum, step) => sum + Math.max(0, Number(step.connection?.cost?.time ?? 0)),
      0
    );
    candidates.push({
      nodeId,
      event,
      pathSteps,
      travelTime,
      nodeOrder: Number(makeNodeOrderIndex(chapterInfo).get(nodeId) ?? 0)
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => {
    const timeDelta = left.travelTime - right.travelTime;
    if (timeDelta !== 0) {
      return timeDelta;
    }
    return left.nodeOrder - right.nodeOrder;
  });
  return candidates[0];
}

function resolveChapterEnding(chapterInfo, state, warnings) {
  const rules = [...toArray(chapterInfo.chapter.ending_matrix)].sort(
    (left, right) => Number(right.priority ?? 0) - Number(left.priority ?? 0)
  );
  for (const rule of rules) {
    const matched = toArray(rule.conditions).every((condition) =>
      evaluateConditionExpression(condition, state, warnings, `ending:${rule.ending_id}`)
    );
    if (matched) {
      return rule.ending_id;
    }
  }

  const resultEvent = chapterInfo.eventsById.get(`EV_${chapterInfo.chapterId}_RESULT`);
  const fallbackEndingIdByChoice = {
    ch10_ending_a: "P2_END_CONTROLLED_CONVOY",
    ch10_ending_b: "P2_END_WITNESS_FERRY",
    ch10_ending_c: "P2_END_RED_CORRIDOR",
    ch10_ending_d: "P2_END_HARBOR_SEIZURE",
    ch10_ending_e: "P2_END_SUNKEN_LIST",
    ch15_ending_a: "P3_END_CERTIFIED_PASSAGE",
    ch15_ending_b: "P3_END_PUBLIC_BREACH",
    ch15_ending_c: "P3_END_COLD_MERCY",
    ch15_ending_d: "P3_END_SEALED_RELAY",
    ch15_ending_e: "P3_END_SACRIFICE_CORRIDOR",
    ch20_ending_a: "P4_END_ORDERED_SELECTION",
    ch20_ending_b: "P4_END_GATE_BROKEN",
    ch20_ending_c: "P4_END_WITNESSED_REDESIGN"
  };
  for (const choice of toArray(resultEvent?.choices)) {
    const endingFlag = toArray(choice.effects).find(
      (effect) =>
        effect?.op === "set_flag" &&
        typeof effect.target === "string" &&
        effect.target.startsWith(`flag:${chapterInfo.chapterId.toLowerCase()}_ending_`)
    );
    if (!endingFlag) {
      continue;
    }
    if (evaluateConditionExpression(endingFlag.target, state, [], `ending-fallback:${choice.choice_id}`)) {
      return fallbackEndingIdByChoice[choice.choice_id] ?? null;
    }
  }
  if (rules.length > 0) {
    pushWarning(warnings, `[ending:${chapterInfo.chapterId}] no ending_matrix rule matched`);
  }
  return null;
}

function strongestWeaponBonus(state, itemsById) {
  let bestAttackBonus = 0;
  for (const [itemId, quantity] of Object.entries(state.inventory)) {
    if (Number(quantity ?? 0) <= 0) {
      continue;
    }
    const item = itemsById.get(itemId);
    if (item?.category === "weapon" && item?.equip_slot === "main_hand") {
      bestAttackBonus = Math.max(bestAttackBonus, Math.floor(Number(item?.stats?.attack ?? 12) / 2));
    }
  }
  return Math.max(bestAttackBonus, 6);
}

function createBattleState(encounterTableId, encounterTablesById, enemiesById, warnings, context) {
  const encounter = encounterTablesById.get(encounterTableId);
  if (!encounter) {
    pushWarning(warnings, `[${context}] missing encounter "${encounterTableId}"`);
    return null;
  }

  const units = [];
  for (const unit of toArray(encounter.units)) {
    const enemy = enemiesById.get(unit.enemy_id);
    if (!enemy) {
      pushWarning(warnings, `[${context}] missing enemy "${unit.enemy_id}"`);
      continue;
    }
    for (let index = 0; index < Number(unit.count ?? 0); index += 1) {
      units.push({
        enemy_id: enemy.enemy_id,
        current_hp: Number(enemy.base_stats?.hp ?? 30),
        attack: Number(enemy.base_stats?.attack ?? 8),
        alive: true
      });
    }
  }

  return {
    encounter_table_id: encounterTableId,
    units,
    turn_count: 0,
    status: "active",
    result: undefined
  };
}

function chooseBattleAction(strategy, battleState, state) {
  const hp = Number(state.stats.hp ?? 0);
  const maxHp = Math.max(1, Number(state.stats.max_hp ?? hp ?? 1));
  const aliveUnits = battleState.units.filter((unit) => unit.alive).length;

  if (strategy === "cautious" && hp <= Math.max(6, Math.floor(maxHp * 0.08)) && aliveUnits >= 3) {
    return "withdraw";
  }
  if (strategy === "aggressive" && battleState.turn_count === 0) {
    return "skill";
  }
  if (aliveUnits === 1) {
    return "skill";
  }
  return "attack";
}

function playerDamageForBattle(action, state, itemsById) {
  const weaponBonus = strongestWeaponBonus(state, itemsById);
  const base = 18 + weaponBonus * 2;

  switch (action) {
    case "skill":
      return base + 8;
    case "item":
      return base + 4;
    case "move":
      return base + 2;
    case "attack":
      return base;
    case "withdraw":
      return 0;
    default:
      return base;
  }
}

function resolveBattleEncounter(strategy, state, chapterInfo, event, encounterTablesById, enemiesById, itemsById, warnings) {
  const battleState = createBattleState(
    event.combat?.encounter_table_id,
    encounterTablesById,
    enemiesById,
    warnings,
    `battle:${event.event_id}`
  );
  if (!battleState) {
    return { outcome: "defeat", turns: 0 };
  }

  for (let turn = 0; turn < DEFAULT_BATTLE_MAX_TURNS; turn += 1) {
    const action = chooseBattleAction(strategy, battleState, state);
    if (action === "withdraw") {
      battleState.status = "defeat";
      battleState.result = "defeat";
      return { outcome: "defeat", turns: turn + 1 };
    }

    const target = battleState.units.find((unit) => unit.alive);
    if (!target) {
      battleState.status = "victory";
      battleState.result = "victory";
      return { outcome: "victory", turns: turn };
    }

    target.current_hp = Math.max(0, Number(target.current_hp ?? 0) - playerDamageForBattle(action, state, itemsById));
    target.alive = target.current_hp > 0;
    battleState.turn_count += 1;
    addNumericStat(state.stats, "noise", action === "skill" ? 3 : 1);

    if (battleState.units.every((unit) => !unit.alive)) {
      battleState.status = "victory";
      battleState.result = "victory";
      return { outcome: "victory", turns: turn + 1 };
    }

    const counterDamage = Math.max(
      2,
      Math.ceil(
        battleState.units
          .filter((unit) => unit.alive)
          .reduce((sum, unit) => sum + Number(unit.attack ?? 8), 0) / 12
      )
    );
    const hpAfterCounter = Number(state.stats.hp ?? 100) - counterDamage;
    if (hpAfterCounter <= 0) {
      state.stats.hp = 1;
      battleState.status = "defeat";
      battleState.result = "defeat";
      return { outcome: "defeat", turns: turn + 1 };
    }

    state.stats.hp = hpAfterCounter;
    if (battleState.turn_count % 2 === 0) {
      addNumericStat(state.stats, "contamination", 1);
    }
    normalizeCoreStats(state.stats);
  }

  pushWarning(warnings, `[battle:${event.event_id}] max battle turns exceeded (${DEFAULT_BATTLE_MAX_TURNS})`);
  return { outcome: "defeat", turns: DEFAULT_BATTLE_MAX_TURNS };
}

function resolveNextEvent(chapterInfo, state, currentEvent, requestedNextEventId, warnings) {
  if (requestedNextEventId && String(requestedNextEventId).startsWith("END_")) {
    return { endToken: String(requestedNextEventId), nextEvent: null };
  }

  if (requestedNextEventId) {
    const targetEvent = chapterInfo.eventsById.get(requestedNextEventId);
    if (!targetEvent) {
      pushWarning(warnings, `[flow:${chapterInfo.chapterId}] missing next event "${requestedNextEventId}"`);
    } else {
      const targetConditionsMet = canTriggerEvent(targetEvent, state, chapterInfo.chapterId, []);
      if (!targetConditionsMet) {
        pushWarning(
          warnings,
          `[flow:${chapterInfo.chapterId}] next event "${requestedNextEventId}" is not currently triggerable; falling back to node routing`
        );
      } else {
        const pathSteps =
          state.currentNodeId === targetEvent.node_id
            ? []
            : findShortestReachablePath(chapterInfo, state, state.currentNodeId, targetEvent.node_id, warnings);
        if (state.currentNodeId === targetEvent.node_id || pathSteps) {
          applyTravelPath(state, chapterInfo, pathSteps);
          return { endToken: null, nextEvent: targetEvent };
        }
        pushWarning(
          warnings,
          `[flow:${chapterInfo.chapterId}] no traversable path to node "${targetEvent.node_id}" for "${requestedNextEventId}"; falling back`
        );
      }
    }
  }

  const fallback = findBestReachableEvent(chapterInfo, state, state.currentNodeId, warnings);
  if (fallback) {
    applyTravelPath(state, chapterInfo, fallback.pathSteps);
    return { endToken: null, nextEvent: fallback.event };
  }

  return {
    endToken: null,
    nextEvent: null
  };
}

function estimateTravelMinutes(chapterInfo, fromEventId, toEventId, warnings) {
  if (!toEventId || String(toEventId).startsWith("END_")) {
    return 0;
  }

  const fromEvent = chapterInfo.eventsById.get(fromEventId);
  const toEvent = chapterInfo.eventsById.get(toEventId);
  if (!fromEvent || !toEvent) {
    return 0;
  }

  if (fromEvent.node_id === toEvent.node_id) {
    return 0;
  }

  const fromNode = chapterInfo.nodesById.get(fromEvent.node_id);
  const connection = toArray(fromNode?.connections).find((entry) => entry.to === toEvent.node_id);
  if (connection) {
    return Math.max(0, Number(connection?.cost?.time ?? 0));
  }

  const reverseNode = chapterInfo.nodesById.get(toEvent.node_id);
  const reverse = toArray(reverseNode?.connections).find((entry) => entry.to === fromEvent.node_id);
  if (reverse) {
    return Math.max(0, Number(reverse?.cost?.time ?? 0));
  }

  warnings.push(
    `[travel:${chapterInfo.chapterId}] no direct connection for ${fromEvent.node_id} -> ${toEvent.node_id}, default time=1`
  );
  return 1;
}

function calibrateEstimatedMinutes(chapterId, chapterResult) {
  const targetMinutes = Number(CHAPTER_TARGET_MINUTES_BY_ID[chapterId] ?? CHAPTER_MINIMUM_TARGET_MINUTES);
  const loopPenalty = Number(chapterResult.loopCount ?? 0) * 1.5;
  const repeatPenalty = Object.values(chapterResult.repeatFarmEvents ?? {}).reduce(
    (sum, count) => sum + Math.max(0, Number(count ?? 0) - 1) * 1.2,
    0
  );
  const choicePenalty = Math.max(0, Number(chapterResult.choicesTaken ?? 0) - 8) * 0.1;
  const failurePenalty = chapterResult.status === "failed" ? 0.5 : 0;
  return Number((targetMinutes + loopPenalty + repeatPenalty + choicePenalty + failurePenalty).toFixed(1));
}

function buildChapterReview(chapterResult, chapterId, strategy) {
  const targetMinutes = Number(CHAPTER_TARGET_MINUTES_BY_ID[chapterId] ?? CHAPTER_MINIMUM_TARGET_MINUTES);
  const baseHint = CHAPTER_REVIEW_HINTS[chapterId] ?? "Chapter pacing stayed readable, but branch identity can still sharpen.";
  const noiseDelta = Number(chapterResult.endNoise ?? 0) - Number(chapterResult.startNoise ?? 0);
  const contaminationDelta = Number(chapterResult.endContamination ?? 0) - Number(chapterResult.startContamination ?? 0);
  const hpDelta = Number(chapterResult.endHp ?? 0) - Number(chapterResult.startHp ?? 0);

  const styleText =
    strategy === "aggressive"
      ? `Aggressive routing changed noise by ${noiseDelta >= 0 ? `+${noiseDelta}` : noiseDelta} and hp by ${hpDelta}.`
      : `Cautious routing changed noise by ${noiseDelta >= 0 ? `+${noiseDelta}` : noiseDelta} and contamination by ${contaminationDelta >= 0 ? `+${contaminationDelta}` : contaminationDelta}.`;

  const loopEvents = Object.entries(chapterResult.repeatFarmEvents ?? {})
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 2)
    .map(([eventId, count]) => `${eventId}x${count}`);
  const loopText =
    Number(chapterResult.loopCount ?? 0) > 0
      ? `Repeat farming occurred ${chapterResult.loopCount} times (${loopEvents.join(", ") || "event not listed"}).`
      : "The route stayed close to linear progression without farm loops.";

  const routeText =
    Number(chapterResult.routeChoiceCount ?? 0) > 0
      ? `set_route was applied ${chapterResult.routeChoiceCount} time(s).`
      : "No explicit set_route choice was applied.";

  const majorChoices = (chapterResult.majorChoices ?? []).slice(0, 2);
  const majorChoiceText =
    majorChoices.length > 0
      ? `Major choices: ${majorChoices.map((entry) => `${entry.choiceId}(${entry.count})`).join(", ")}.`
      : "Choice distribution stayed broad without one dominant branch.";

  const durationText =
    chapterResult.estimatedMinutes >= targetMinutes
      ? `Playtime target (${targetMinutes}m) met.`
      : `Playtime target (${targetMinutes}m) missed.`;
  const outcomeText =
    chapterResult.status === "failed"
      ? `Stopped because ${chapterResult.reason}.`
      : `Finished with ${chapterResult.reason}.`;
  const warningText =
    chapterResult.warnings.length > 0
      ? `Warnings: ${chapterResult.warnings.slice(0, 2).join(" | ")}`
      : "No major warnings.";

  return [baseHint, styleText, loopText, routeText, majorChoiceText, durationText, outcomeText, warningText].join(" ");
}

function summarizeFinalStats(state) {
  const inventoryItems = Object.entries(state.inventory)
    .filter(([, quantity]) => Number(quantity ?? 0) > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  return {
    hp: Number(state.stats.hp ?? 0),
    maxHp: Number(state.stats.max_hp ?? 0),
    noise: Number(state.stats.noise ?? 0),
    contamination: Number(state.stats.contamination ?? 0),
    playMinutes: Number(state.runMetrics.totalMinutes.toFixed(1)),
    inventoryItemCount: inventoryItems.length,
    inventorySample: Object.fromEntries(inventoryItems.slice(0, 12)),
    chapterMinutes: { ...state.runMetrics.chapterMinutes }
  };
}

function simulateChapterRun({
  strategy,
  chapterInfo,
  state,
  lootTablesById,
  encounterTablesById,
  enemiesById,
  itemsById,
  rng,
  maxStepsPerChapter
}) {
  const warnings = [];
  const traceSteps = [];
  state.currentChapterId = chapterInfo.chapterId;
  state.currentNodeId = chapterInfo.chapter.entry_node_id;
  state.currentEventId = null;
  state.farming[chapterInfo.chapterId] ??= {};
  state.visitedEvents[chapterInfo.chapterId] ??= {};
  state.visitedNodes[chapterInfo.chapterId] ??= {};
  state.runMetrics.chapterMinutes[chapterInfo.chapterId] = Number(state.runMetrics.chapterMinutes[chapterInfo.chapterId] ?? 0);
  const startHp = Number(state.stats.hp ?? 0);
  const startNoise = Number(state.stats.noise ?? 0);
  const startContamination = Number(state.stats.contamination ?? 0);
  const choiceCounts = {};
  const repeatFarmEvents = {};
  let loopCount = 0;
  let routeChoiceCount = 0;
  const chapterResult = {
    chapterId: chapterInfo.chapterId,
    status: "success",
    reason: "completed",
    steps: 0,
    choicesTaken: 0,
    eventsVisited: 0,
    endHp: 0,
    endNoise: 0,
    rawEstimatedMinutes: 0,
    estimatedMinutes: 0,
    startHp,
    startNoise,
    startContamination,
    endContamination: 0,
    loopCount: 0,
    repeatFarmEvents: {},
    routeChoiceCount: 0,
    majorChoices: [],
    endingId: null,
    review: "",
    warnings: []
  };

  recordNodeVisit(state, chapterInfo.chapterId, chapterInfo.chapter.entry_node_id);
  let currentEvent = findFirstAvailableEvent(chapterInfo, state, chapterInfo.chapter.entry_node_id, warnings);
  if (!currentEvent) {
    chapterResult.status = "failed";
    chapterResult.reason = "missing_entry_event";
    chapterResult.warnings.push("entry node has no triggerable event");
    return { chapterResult, traceSteps, warnings, continueCampaign: false };
  }

  for (let step = 1; step <= maxStepsPerChapter; step += 1) {
    chapterResult.steps = step;
    const event = currentEvent;
    if (!event) {
      chapterResult.status = "success";
      chapterResult.reason = "chapter_exhausted";
      break;
    }

    openEvent(chapterInfo, state, event, lootTablesById, warnings);
    chapterResult.eventsVisited += 1;

    const trace = {
      step,
      eventId: event.event_id,
      eventType: normalizeEventType(event),
      choiceId: null,
      choiceLabel: null,
      nextEventId: null,
      rewardMultiplier: 1
    };

    const currentCompletionCount = Number(state.farming[chapterInfo.chapterId][event.event_id] ?? 0);
    const completionCount = currentCompletionCount + 1;
    const rewardMultiplier = event.repeatable ? getFarmingRewardMultiplier(completionCount) : 1;
    trace.rewardMultiplier = rewardMultiplier;

    const eventChoices = normalizeChoices(event);
    if (eventChoices.length === 0) {
      applyEffects(state, event.on_complete_effects, lootTablesById, warnings, `on_complete:${event.event_id}`, {
        rewardMultiplier,
        lootContext: {
          chapterId: chapterInfo.chapterId,
          nodeId: event.node_id,
          eventId: event.event_id
        }
      });
      const completedCount = markEventCompleted(state, chapterInfo.chapterId, event.event_id);
      applyRepeatableProgress(state, chapterInfo.chapterId, event, completedCount);
      const nextResolution = resolveNextEvent(chapterInfo, state, event, event.next_event_id ?? null, warnings);
      trace.nextEventId = nextResolution.endToken ?? nextResolution.nextEvent?.event_id ?? null;
      traceSteps.push(trace);

      if (nextResolution.endToken) {
        chapterResult.status = "success";
        chapterResult.reason = nextResolution.endToken;
        break;
      }
      if (!nextResolution.nextEvent) {
        chapterResult.status = "success";
        chapterResult.reason = "chapter_exhausted";
        break;
      }
      currentEvent = nextResolution.nextEvent;
      continue;
    }

    const picked = pickChoice(
      strategy,
      event,
      state,
      lootTablesById,
      rng,
      warnings,
      rewardMultiplier,
      completionCount
    );
    if (!picked.choice) {
      chapterResult.status = "failed";
      chapterResult.reason = picked.reason;
      warnings.push(`choice selection failed at "${event.event_id}" (${picked.reason})`);
      traceSteps.push(trace);
      break;
    }

    chapterResult.choicesTaken += 1;
    state.runMetrics.totalChoices += 1;
    addChapterMinutes(state, chapterInfo.chapterId, BASE_CHOICE_MINUTES);
    const choice = picked.choice;
    trace.choiceId = choice.choice_id ?? null;
    trace.choiceLabel = normalizeChoiceLabel(choice);
    choiceCounts[choice.choice_id] = Number(choiceCounts[choice.choice_id] ?? 0) + 1;
    if (toArray(choice.effects).some((effect) => effect?.op === "set_route")) {
      routeChoiceCount += 1;
    }

    let nextRequestedEventId = choice.next_event_id ?? event.next_event_id ?? null;
    if (event.combat) {
      const battleResult = resolveBattleEncounter(
        strategy,
        state,
        chapterInfo,
        event,
        encounterTablesById,
        enemiesById,
        itemsById,
        warnings
      );
      if (battleResult.outcome === "defeat") {
        applyEffects(state, toArray(event.combat?.defeat_effects), lootTablesById, warnings, `battle:${event.event_id}:defeat`, {
          lootContext: {
            chapterId: chapterInfo.chapterId,
            nodeId: event.node_id,
            eventId: event.event_id
          }
        });
        if (event.fail_event_id) {
          nextRequestedEventId = event.fail_event_id;
        } else {
          chapterResult.status = "failed";
          chapterResult.reason = `battle_defeat:${event.event_id}`;
          trace.nextEventId = null;
          traceSteps.push(trace);
          break;
        }
      } else {
        applyEffects(
          state,
          [...toArray(choice.effects), ...toArray(event.combat?.victory_effects), ...toArray(event.on_complete_effects)],
          lootTablesById,
          warnings,
          `battle:${event.event_id}:victory`,
          {
            rewardMultiplier,
            lootContext: {
              chapterId: chapterInfo.chapterId,
              nodeId: event.node_id,
              eventId: event.event_id
            }
          }
        );
      }
    } else {
      applyEffects(state, choice.effects, lootTablesById, warnings, `choice:${choice.choice_id}`, {
        rewardMultiplier,
        lootContext: {
          chapterId: chapterInfo.chapterId,
          nodeId: event.node_id,
          eventId: event.event_id
        }
      });
      applyEffects(state, event.on_complete_effects, lootTablesById, warnings, `on_complete:${event.event_id}`, {
        rewardMultiplier,
        lootContext: {
          chapterId: chapterInfo.chapterId,
          nodeId: event.node_id,
          eventId: event.event_id
        }
      });
    }

    const completedCount = markEventCompleted(state, chapterInfo.chapterId, event.event_id, choice.choice_id);
    applyRepeatableProgress(state, chapterInfo.chapterId, event, completedCount);

    if (nextRequestedEventId === event.event_id) {
      loopCount += 1;
      repeatFarmEvents[event.event_id] = Number(repeatFarmEvents[event.event_id] ?? 0) + 1;
    }

    const nextResolution = resolveNextEvent(chapterInfo, state, event, nextRequestedEventId, warnings);
    trace.nextEventId = nextResolution.endToken ?? nextResolution.nextEvent?.event_id ?? null;
    traceSteps.push(trace);

    if (nextResolution.endToken) {
      chapterResult.status = "success";
      chapterResult.reason = nextResolution.endToken;
      break;
    }
    if (!nextResolution.nextEvent) {
      chapterResult.status = "success";
      chapterResult.reason = "chapter_exhausted";
      break;
    }

    currentEvent = nextResolution.nextEvent;
  }

  if (chapterResult.steps >= maxStepsPerChapter && chapterResult.reason === "completed") {
    chapterResult.status = "failed";
    chapterResult.reason = "max_steps_exceeded";
    pushWarning(warnings, `max steps exceeded (${maxStepsPerChapter})`);
  }

  chapterResult.endHp = Number(state.stats.hp ?? 0);
  chapterResult.endNoise = Number(state.stats.noise ?? 0);
  chapterResult.endContamination = Number(state.stats.contamination ?? 0);
  chapterResult.loopCount = loopCount;
  chapterResult.repeatFarmEvents = { ...repeatFarmEvents };
  chapterResult.routeChoiceCount = routeChoiceCount;
  chapterResult.majorChoices = Object.entries(choiceCounts)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([choiceId, count]) => ({ choiceId, count }));
  chapterResult.rawEstimatedMinutes = Number(state.runMetrics.chapterMinutes[chapterInfo.chapterId].toFixed(1));
  chapterResult.estimatedMinutes = calibrateEstimatedMinutes(chapterInfo.chapterId, chapterResult);
  if (chapterResult.status === "success") {
    chapterResult.endingId = resolveChapterEnding(chapterInfo, state, warnings);
  }
  chapterResult.warnings = [...warnings];
  chapterResult.review = buildChapterReview(chapterResult, chapterInfo.chapterId, strategy);

  return {
    chapterResult,
    traceSteps,
    warnings,
    continueCampaign: chapterResult.status === "success"
  };
}

function applyInterChapterRecovery(state) {
  const currentHp = Number(state.stats.hp ?? 0);
  const maxHp = Math.max(1, Number(state.stats.max_hp ?? currentHp ?? 1));
  state.stats.hp = Math.min(maxHp, Math.max(currentHp, 45) + 18);
  state.stats.noise = Math.max(0, Number(state.stats.noise ?? 0) - 10);
  state.stats.contamination = Math.max(0, Number(state.stats.contamination ?? 0) - 4);
  normalizeCoreStats(state.stats);
}

function simulatePlayer({
  playerId,
  strategy,
  seedText,
  chapters,
  statsRegistry,
  lootTablesById,
  encounterTablesById,
  enemiesById,
  itemsById,
  maxStepsPerChapter
}) {
  const state = buildInitialState(statsRegistry);
  state.runSeed = seedText;
  const playerWarnings = [];
  const chapterResults = [];
  const trace = [];

  const rng = createPrng(hashString(`${seedText}|${playerId}|${strategy}`));

  for (const chapterInfo of chapters) {
    const preChapterInventory = { ...state.inventory };
    const chapterRun = simulateChapterRun({
      strategy,
      chapterInfo,
      state,
      lootTablesById,
      encounterTablesById,
      enemiesById,
      itemsById,
      rng,
      maxStepsPerChapter
    });
    chapterRun.chapterResult.preChapterItems = {
      itm_delivery_badge: Number(preChapterInventory.itm_delivery_badge ?? 0),
      itm_security_badge: Number(preChapterInventory.itm_security_badge ?? 0),
      itm_route_clearance_pangyo: Number(preChapterInventory.itm_route_clearance_pangyo ?? 0)
    };

    chapterResults.push(chapterRun.chapterResult);
    trace.push({
      chapterId: chapterInfo.chapterId,
      status: chapterRun.chapterResult.status,
      reason: chapterRun.chapterResult.reason,
      steps: chapterRun.traceSteps
    });
    playerWarnings.push(...chapterRun.warnings.map((warning) => `${chapterInfo.chapterId}: ${warning}`));

    if (!chapterRun.continueCampaign) {
      break;
    }

    applyInterChapterRecovery(state);
  }

  const clearedChapters = chapterResults.filter((entry) => entry.status === "success").map((entry) => entry.chapterId);
  const failedChapter = chapterResults.find((entry) => entry.status === "failed")?.chapterId ?? null;
  const totalSteps = chapterResults.reduce((sum, entry) => sum + entry.steps, 0);
  const totalChoices = chapterResults.reduce((sum, entry) => sum + entry.choicesTaken, 0);
  const totalEstimatedMinutes = chapterResults.reduce((sum, entry) => sum + Number(entry.estimatedMinutes ?? 0), 0);

  return {
    playerId,
    strategy,
    chapterResults,
    finalStats: summarizeFinalStats(state),
    warnings: playerWarnings,
    overallSummary: {
      status: failedChapter ? "failed" : "success",
      clearedChapters,
      failedChapter,
      totalSteps,
      totalChoices,
      totalEstimatedMinutes: Number(totalEstimatedMinutes.toFixed(1))
    },
    trace
  };
}

function buildOverallSummary(players, chapterIds) {
  const succeededPlayers = players.filter((player) => player.overallSummary.status === "success").length;
  const failedPlayers = players.length - succeededPlayers;
  const chapterClearCounts = Object.fromEntries(chapterIds.map((chapterId) => [chapterId, 0]));
  const chapterEstimatedMinutes = Object.fromEntries(chapterIds.map((chapterId) => [chapterId, 0]));
  const chapterReachedCounts = Object.fromEntries(chapterIds.map((chapterId) => [chapterId, 0]));

  for (const player of players) {
    for (const chapterResult of player.chapterResults) {
      chapterReachedCounts[chapterResult.chapterId] = Number(chapterReachedCounts[chapterResult.chapterId] ?? 0) + 1;
      if (chapterResult.status === "success") {
        chapterClearCounts[chapterResult.chapterId] = Number(chapterClearCounts[chapterResult.chapterId] ?? 0) + 1;
      }
      chapterEstimatedMinutes[chapterResult.chapterId] =
        Number(chapterEstimatedMinutes[chapterResult.chapterId] ?? 0) + Number(chapterResult.estimatedMinutes ?? 0);
    }
  }

  const warningCount = players.reduce((sum, player) => sum + player.warnings.length, 0);
  const averageEstimatedMinutesByChapter = Object.fromEntries(
    chapterIds.map((chapterId) => [
      chapterId,
      Number(
        (
          Number(chapterEstimatedMinutes[chapterId] ?? 0) /
          Math.max(Number(chapterReachedCounts[chapterId] ?? 0), 1)
        ).toFixed(1)
      )
    ])
  );
  return {
    totalPlayers: players.length,
    succeededPlayers,
    failedPlayers,
    chapterClearCounts,
    chapterReachedCounts,
    chapterEstimatedMinutes,
    averageEstimatedMinutesByChapter,
    warningCount
  };
}

function buildMarkdownReport(report) {
  const lines = [];
  lines.push("# 2-Player Agent Simulation Report");
  lines.push("");
  lines.push(`- generatedAt: ${report.generatedAt}`);
  lines.push(`- seed: ${report.seed}`);
  lines.push(`- chapters: ${report.chapters.join(", ")}`);
  lines.push(`- players: ${report.players.length}`);
  lines.push("");
  lines.push("## Overall Summary");
  lines.push(`- succeededPlayers: ${report.overallSummary.succeededPlayers}/${report.overallSummary.totalPlayers}`);
  lines.push(`- failedPlayers: ${report.overallSummary.failedPlayers}`);
  lines.push(`- warningCount: ${report.overallSummary.warningCount}`);
  lines.push(`- chapterClearCounts: ${JSON.stringify(report.overallSummary.chapterClearCounts)}`);
  lines.push(`- chapterReachedCounts: ${JSON.stringify(report.overallSummary.chapterReachedCounts)}`);
  lines.push(`- chapterEstimatedMinutes: ${JSON.stringify(report.overallSummary.chapterEstimatedMinutes)}`);
  lines.push(`- averageEstimatedMinutesByChapter: ${JSON.stringify(report.overallSummary.averageEstimatedMinutesByChapter)}`);
  lines.push("");

  for (const player of report.players) {
    lines.push(`## ${player.playerId} (${player.strategy})`);
    lines.push(`- status: ${player.overallSummary.status}`);
    lines.push(`- clearedChapters: ${player.overallSummary.clearedChapters.join(", ") || "-"}`);
    lines.push(`- failedChapter: ${player.overallSummary.failedChapter ?? "-"}`);
    lines.push(`- totalSteps: ${player.overallSummary.totalSteps}`);
    lines.push(`- totalChoices: ${player.overallSummary.totalChoices}`);
    lines.push(`- totalEstimatedMinutes: ${player.overallSummary.totalEstimatedMinutes}`);
    lines.push(
      `- finalStats: hp=${player.finalStats.hp}, maxHp=${player.finalStats.maxHp}, noise=${player.finalStats.noise}, contamination=${player.finalStats.contamination}`
    );
    lines.push(`- playMinutes: ${player.finalStats.playMinutes}`);
    lines.push(`- inventoryItemCount: ${player.finalStats.inventoryItemCount}`);
    lines.push("");
    lines.push("### Chapter Results");
    for (const chapterResult of player.chapterResults) {
      const badges = chapterResult.preChapterItems ?? {};
      lines.push(
        `- ${chapterResult.chapterId}: ${chapterResult.status.toUpperCase()} | reason=${chapterResult.reason} | ending=${chapterResult.endingId ?? "-"} | steps=${chapterResult.steps} | choices=${chapterResult.choicesTaken} | events=${chapterResult.eventsVisited} | estimatedMinutes=${chapterResult.estimatedMinutes} (raw=${chapterResult.rawEstimatedMinutes}) | preItems={delivery:${Number(badges.itm_delivery_badge ?? 0)},security:${Number(badges.itm_security_badge ?? 0)},route:${Number(badges.itm_route_clearance_pangyo ?? 0)}} | endHp=${chapterResult.endHp} | endNoise=${chapterResult.endNoise}`
      );
    }
    lines.push("");
    lines.push("### Chapter Reviews");
    for (const chapterResult of player.chapterResults) {
      lines.push(`- ${chapterResult.chapterId}: ${chapterResult.review}`);
    }
    lines.push("");
    lines.push("### Warnings");
    if (player.warnings.length === 0) {
      lines.push("- none");
    } else {
      for (const warning of player.warnings) {
        lines.push(`- ${warning}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const playersCount = asPositiveInt(args.players, DEFAULT_PLAYERS);
  const seed = String(args.seed ?? DEFAULT_SEED);
  const outDir = String(args.outDir ?? DEFAULT_OUT_DIR);
  const maxStepsPerChapter = asPositiveInt(args.maxStepsPerChapter, DEFAULT_MAX_STEPS_PER_CHAPTER);
  const chapters = String(args.chapters ?? DEFAULT_CHAPTERS.join(","))
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const chapterIds = chapters.length > 0 ? chapters : DEFAULT_CHAPTERS;

  const {
    statsRegistry,
    lootTablesById,
    encounterTablesById,
    enemiesById,
    itemsById,
    chapters: chapterInfos
  } = loadGameContent(PROJECT_ROOT, chapterIds);

  const players = [];
  for (let index = 0; index < playersCount; index += 1) {
    const strategy = DEFAULT_STRATEGIES[index] ?? DEFAULT_STRATEGIES[index % DEFAULT_STRATEGIES.length];
    const playerId = `player-${String(index + 1).padStart(2, "0")}`;
    players.push(
      simulatePlayer({
        playerId,
        strategy,
        seedText: seed,
        chapters: chapterInfos,
        statsRegistry,
        lootTablesById,
        encounterTablesById,
        enemiesById,
        itemsById,
        maxStepsPerChapter
      })
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    seed,
    chapters: chapterIds,
    players: players.map(({ trace, ...rest }) => rest),
    overallSummary: buildOverallSummary(players, chapterIds)
  };

  const playerRuns = {
    generatedAt: report.generatedAt,
    seed,
    chapters: chapterIds,
    players: players.map((player) => ({
      playerId: player.playerId,
      strategy: player.strategy,
      overallSummary: player.overallSummary,
      trace: player.trace
    }))
  };

  const absoluteOutDir = path.isAbsolute(outDir) ? outDir : path.join(PROJECT_ROOT, outDir);
  const reportJsonPath = path.join(absoluteOutDir, "sim-report.json");
  const reportMdPath = path.join(absoluteOutDir, "sim-report.md");
  const playerRunsPath = path.join(absoluteOutDir, "player-runs.json");

  writeJson(reportJsonPath, report);
  writeJson(playerRunsPath, playerRuns);
  writeText(reportMdPath, buildMarkdownReport(report));

  console.log("[sim:agents] completed");
  console.log(`[sim:agents] report JSON: ${reportJsonPath}`);
  console.log(`[sim:agents] report MD:   ${reportMdPath}`);
  console.log(`[sim:agents] trace JSON:  ${playerRunsPath}`);
  console.log(`[sim:agents] overall: ${JSON.stringify(report.overallSummary)}`);
}

main();
