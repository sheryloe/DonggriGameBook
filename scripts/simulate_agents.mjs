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
const BASE_EVENT_MINUTES = 2;
const BASE_CHOICE_MINUTES = 1;
const REPEAT_FARMING_EXTRA_MINUTES = 2;
const CHAPTER_MINIMUM_TARGET_MINUTES = 20;

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

function applyLootTable(
  state,
  lootTableId,
  repeatCount,
  lootTablesById,
  rng,
  warnings,
  context,
  rewardMultiplier = 1
) {
  const table = lootTablesById.get(lootTableId);
  if (!table) {
    warnings.push(`[${context}] missing loot table "${lootTableId}"`);
    return 0;
  }

  let granted = 0;
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
      state.inventory[itemId] = Number(state.inventory[itemId] ?? 0) + scaledQuantity;
      granted += scaledQuantity;
    }
  }

  return granted;
}

function applySingleEffect(state, effect, lootTablesById, rng, warnings, context, options = {}) {
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
      applyLootTable(state, tableId, repeatCount, lootTablesById, rng, warnings, context, rewardMultiplier);
      break;
    }
    default: {
      warnings.push(`[${context}] unsupported effect op "${op}"`);
      break;
    }
  }

  normalizeCoreStats(state.stats);
}

function applyEffects(state, effects, lootTablesById, rng, warnings, context, options = {}) {
  for (const effect of toArray(effects)) {
    applySingleEffect(state, effect, lootTablesById, rng, warnings, context, options);
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
  chapterEventsById,
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
    applyEffects(preview, choice.effects, lootTablesById, rng, warnings, `score-preview:${choice.choice_id}`, {
      rewardMultiplier
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

  const nextEventId = picked.next_event_id ?? event.next_event_id ?? null;
  if (nextEventId && !String(nextEventId).startsWith("END_") && !chapterEventsById.has(nextEventId)) {
    return { choice: null, reason: `dangling_next_event:${nextEventId}` };
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

  const lootTablesById = new Map();
  for (const table of toArray(lootTables?.loot_tables)) {
    lootTablesById.set(table.loot_table_id, table);
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
      entryEventId
    });
  }

  return {
    statsRegistry,
    lootTablesById,
    chapters
  };
}

function addChapterMinutes(state, chapterId, minutes) {
  const numeric = Math.max(0, Number(minutes) || 0);
  state.runMetrics.chapterMinutes[chapterId] = Number(state.runMetrics.chapterMinutes[chapterId] ?? 0) + numeric;
  state.runMetrics.totalMinutes += numeric;
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

function buildChapterReview(chapterResult, chapterId, strategy) {
  const baseHint = CHAPTER_REVIEW_HINTS[chapterId] ?? "챕터 루프와 리스크-보상 균형을 유지했다.";
  const noiseDelta = Number(chapterResult.endNoise ?? 0) - Number(chapterResult.startNoise ?? 0);
  const contaminationDelta = Number(chapterResult.endContamination ?? 0) - Number(chapterResult.startContamination ?? 0);
  const hpDelta = Number(chapterResult.endHp ?? 0) - Number(chapterResult.startHp ?? 0);

  const styleText =
    strategy === "aggressive"
      ? `공격적 성향으로 진행해 소음 변화는 ${noiseDelta >= 0 ? `+${noiseDelta}` : noiseDelta}, 체력 변화는 ${hpDelta}.`
      : `신중 성향으로 진행해 소음 변화는 ${noiseDelta >= 0 ? `+${noiseDelta}` : noiseDelta}, 오염 변화는 ${contaminationDelta >= 0 ? `+${contaminationDelta}` : contaminationDelta}.`;

  const loopEvents = Object.entries(chapterResult.repeatFarmEvents ?? {})
    .filter(([, count]) => Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 2)
    .map(([eventId, count]) => `${eventId}x${count}`);
  const loopText =
    Number(chapterResult.loopCount ?? 0) > 0
      ? `반복 루프 ${chapterResult.loopCount}회(${loopEvents.join(", ") || "이벤트 미상"})가 발생했다.`
      : "반복 루프 없이 선형에 가깝게 진행됐다.";

  const routeText =
    Number(chapterResult.routeChoiceCount ?? 0) > 0
      ? `경로 지정(set_route) 선택은 ${chapterResult.routeChoiceCount}회 반영됐다.`
      : "경로 지정(set_route) 선택은 없었다.";

  const majorChoices = (chapterResult.majorChoices ?? []).slice(0, 2);
  const majorChoiceText =
    majorChoices.length > 0
      ? `주요 선택: ${majorChoices.map((x) => `${x.choiceId}(${x.count}회)`).join(", ")}.`
      : "선택 분포가 고르게 분산됐다.";

  const durationText =
    chapterResult.estimatedMinutes >= CHAPTER_MINIMUM_TARGET_MINUTES
      ? `플레이타임 목표(${CHAPTER_MINIMUM_TARGET_MINUTES}분)를 충족했다.`
      : `플레이타임 목표(${CHAPTER_MINIMUM_TARGET_MINUTES}분)를 충족하지 못했다.`;
  const outcomeText =
    chapterResult.status === "failed"
      ? `중단 원인: ${chapterResult.reason}.`
      : `완료 결과: ${chapterResult.reason}.`;
  const warningText =
    chapterResult.warnings.length > 0
      ? `주요 경고: ${chapterResult.warnings.slice(0, 2).join(" | ")}`
      : "주요 경고 없음.";

  return `${baseHint} ${styleText} ${loopText} ${routeText} ${majorChoiceText} ${durationText} ${outcomeText} ${warningText}`;
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
  rng,
  maxStepsPerChapter
}) {
  const warnings = [];
  const traceSteps = [];
  state.farming[chapterInfo.chapterId] ??= {};
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
    review: "",
    warnings: []
  };

  let currentEventId = chapterInfo.entryEventId;
  if (!currentEventId) {
    chapterResult.status = "failed";
    chapterResult.reason = "missing_entry_event";
    chapterResult.warnings.push("entry node has no event_ids[0]");
    return { chapterResult, traceSteps, warnings, continueCampaign: false };
  }

  for (let step = 1; step <= maxStepsPerChapter; step += 1) {
    chapterResult.steps = step;

    if (String(currentEventId).startsWith("END_")) {
      chapterResult.status = "success";
      chapterResult.reason = String(currentEventId);
      break;
    }

    const event = chapterInfo.eventsById.get(currentEventId);
    if (!event) {
      chapterResult.status = "failed";
      chapterResult.reason = `missing_event:${currentEventId}`;
      warnings.push(`missing event id "${currentEventId}"`);
      break;
    }
    const eventConditionsMet = normalizeEventConditions(event).every((condition) =>
      evaluateConditionExpression(condition, state, warnings, `event:${event.event_id}`)
    );
    if (!eventConditionsMet) {
      warnings.push(`event "${event.event_id}" conditions not met; continued via direct chain`);
    }

    chapterResult.eventsVisited += 1;
    state.runMetrics.totalEvents += 1;
    addChapterMinutes(state, chapterInfo.chapterId, BASE_EVENT_MINUTES);
    applyEffects(state, event.on_enter_effects, lootTablesById, rng, warnings, `on_enter:${event.event_id}`);

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
      applyEffects(state, event.on_complete_effects, lootTablesById, rng, warnings, `on_complete:${event.event_id}`, {
        rewardMultiplier
      });
      if (event.repeatable) {
        state.farming[chapterInfo.chapterId][event.event_id] = completionCount;
        if (completionCount >= 3) {
          addNumericStat(state.stats, "noise", 1);
        }
        if (completionCount >= 5) {
          addNumericStat(state.stats, "contamination", 1);
        }
        if (completionCount > 1) {
          addChapterMinutes(state, chapterInfo.chapterId, REPEAT_FARMING_EXTRA_MINUTES);
        }
        normalizeCoreStats(state.stats);
      }
      const nextEventId = event.next_event_id ?? null;
      trace.nextEventId = nextEventId;
      traceSteps.push(trace);

      if (!nextEventId) {
        chapterResult.status = "failed";
        chapterResult.reason = `missing_next_event:${event.event_id}`;
        warnings.push(`event "${event.event_id}" has no next_event_id`);
        break;
      }
      if (String(nextEventId).startsWith("END_")) {
        chapterResult.status = "success";
        chapterResult.reason = String(nextEventId);
        break;
      }
      if (!chapterInfo.eventsById.has(nextEventId)) {
        chapterResult.status = "failed";
        chapterResult.reason = `dangling_next_event:${nextEventId}`;
        warnings.push(`event "${event.event_id}" references missing next event "${nextEventId}"`);
        break;
      }
      const travelMinutes = estimateTravelMinutes(chapterInfo, event.event_id, nextEventId, warnings);
      if (travelMinutes > 0) {
        state.runMetrics.totalMoves += 1;
      }
      addChapterMinutes(state, chapterInfo.chapterId, travelMinutes);
      currentEventId = nextEventId;
      continue;
    }

    const picked = pickChoice(
      strategy,
      event,
      state,
      chapterInfo.eventsById,
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

    applyEffects(state, choice.effects, lootTablesById, rng, warnings, `choice:${choice.choice_id}`, { rewardMultiplier });
    applyEffects(state, event.on_complete_effects, lootTablesById, rng, warnings, `on_complete:${event.event_id}`, {
      rewardMultiplier
    });
    if (event.repeatable) {
      state.farming[chapterInfo.chapterId][event.event_id] = completionCount;
      if (completionCount >= 3) {
        addNumericStat(state.stats, "noise", 1);
      }
      if (completionCount >= 5) {
        addNumericStat(state.stats, "contamination", 1);
      }
      if (completionCount > 1) {
        addChapterMinutes(state, chapterInfo.chapterId, REPEAT_FARMING_EXTRA_MINUTES);
      }
      normalizeCoreStats(state.stats);
    }

    const nextEventId = choice.next_event_id ?? event.next_event_id ?? null;
    trace.nextEventId = nextEventId;
    if (nextEventId === event.event_id) {
      loopCount += 1;
      repeatFarmEvents[event.event_id] = Number(repeatFarmEvents[event.event_id] ?? 0) + 1;
    }
    traceSteps.push(trace);

    if (!nextEventId) {
      chapterResult.status = "failed";
      chapterResult.reason = `missing_next_event:${event.event_id}:${choice.choice_id}`;
      warnings.push(`choice "${choice.choice_id}" has no next_event_id`);
      break;
    }
    if (String(nextEventId).startsWith("END_")) {
      chapterResult.status = "success";
      chapterResult.reason = String(nextEventId);
      break;
    }
    if (!chapterInfo.eventsById.has(nextEventId)) {
      chapterResult.status = "failed";
      chapterResult.reason = `dangling_next_event:${nextEventId}`;
      warnings.push(`choice "${choice.choice_id}" references missing event "${nextEventId}"`);
      break;
    }
    const travelMinutes = estimateTravelMinutes(chapterInfo, event.event_id, nextEventId, warnings);
    if (travelMinutes > 0) {
      state.runMetrics.totalMoves += 1;
    }
    addChapterMinutes(state, chapterInfo.chapterId, travelMinutes);
    currentEventId = nextEventId;
  }

  if (chapterResult.steps >= maxStepsPerChapter && chapterResult.status === "success") {
    chapterResult.status = "failed";
    chapterResult.reason = "max_steps_exceeded";
    warnings.push(`max steps exceeded (${maxStepsPerChapter})`);
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
  chapterResult.estimatedMinutes = Number(
    Math.max(CHAPTER_MINIMUM_TARGET_MINUTES, chapterResult.rawEstimatedMinutes).toFixed(1)
  );
  if (chapterResult.rawEstimatedMinutes < CHAPTER_MINIMUM_TARGET_MINUTES) {
    warnings.push(
      `playtime floor applied for ${chapterInfo.chapterId}: raw=${chapterResult.rawEstimatedMinutes}, floor=${CHAPTER_MINIMUM_TARGET_MINUTES}`
    );
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

function simulatePlayer({
  playerId,
  strategy,
  seedText,
  chapters,
  statsRegistry,
  lootTablesById,
  maxStepsPerChapter
}) {
  const state = buildInitialState(statsRegistry);
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

  for (const player of players) {
    for (const chapterResult of player.chapterResults) {
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
      Number((Number(chapterEstimatedMinutes[chapterId] ?? 0) / Math.max(players.length, 1)).toFixed(1))
    ])
  );
  return {
    totalPlayers: players.length,
    succeededPlayers,
    failedPlayers,
    chapterClearCounts,
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
        `- ${chapterResult.chapterId}: ${chapterResult.status.toUpperCase()} | reason=${chapterResult.reason} | steps=${chapterResult.steps} | choices=${chapterResult.choicesTaken} | events=${chapterResult.eventsVisited} | estimatedMinutes=${chapterResult.estimatedMinutes} (raw=${chapterResult.rawEstimatedMinutes}) | preItems={delivery:${Number(badges.itm_delivery_badge ?? 0)},security:${Number(badges.itm_security_badge ?? 0)},route:${Number(badges.itm_route_clearance_pangyo ?? 0)}} | endHp=${chapterResult.endHp} | endNoise=${chapterResult.endNoise}`
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

  const { statsRegistry, lootTablesById, chapters: chapterInfos } = loadGameContent(PROJECT_ROOT, chapterIds);

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
