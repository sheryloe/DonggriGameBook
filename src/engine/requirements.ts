import type {
  ChapterId,
  EventDefinition,
  FlagValue,
  GameContentPack,
  RuntimeSnapshot,
  RuntimeWarning,
  UIFlow,
  UITransition
} from "../types/game";
import { getChapterRuntimeConfig } from "../../packages/world-registry/src";

function makeWarning(message: string, source: string): RuntimeWarning {
  return {
    message,
    source,
    severity: "warning"
  };
}

function splitDisjunction(input: string): string[] {
  return input
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseScalar(input: string): string | number | boolean {
  const normalized = input.trim();
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

function resolveRuntimeValue(reference: string, runtime: RuntimeSnapshot): string | number | boolean | undefined {
  const normalized = reference.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("flag:")) {
    return runtime.flags[normalizeFlagKey(normalized)] as FlagValue | undefined;
  }

  if (normalized.startsWith("item:")) {
    return runtime.inventory.quantities[normalizeItemKey(normalized)] ?? 0;
  }

  if (Object.prototype.hasOwnProperty.call(runtime.stats, normalized)) {
    return runtime.stats[normalized] as string | number | undefined;
  }

  if (Object.prototype.hasOwnProperty.call(runtime.flags, normalized)) {
    return runtime.flags[normalized] as FlagValue | undefined;
  }

  return undefined;
}

function compareValues(left: string | number | boolean | undefined, operator: string, right: string): boolean {
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

export function normalizeFlagKey(input: string): string {
  const normalized = input.trim();
  return normalized.startsWith("flag:") ? normalized.slice(5) : normalized;
}

export function normalizeItemKey(input: string): string {
  const normalized = input.trim();
  return normalized.startsWith("item:") ? normalized.slice(5) : normalized;
}

export function evaluateCondition(
  condition: string,
  runtime: RuntimeSnapshot,
  warnings: RuntimeWarning[],
  source: string
): boolean {
  if (!condition) {
    return true;
  }

  const normalized = condition.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.includes("|")) {
    return splitDisjunction(normalized).some((entry) => evaluateCondition(entry, runtime, warnings, source));
  }

  if (normalized.startsWith("!")) {
    return !evaluateCondition(normalized.slice(1), runtime, warnings, source);
  }

  if (normalized.startsWith("flag:")) {
    const [flagReference, explicitValue] = normalized.split("=");
    if (explicitValue !== undefined) {
      return compareValues(resolveRuntimeValue(flagReference, runtime), "=", explicitValue);
    }

    return runtime.flags[normalizeFlagKey(flagReference)] === true;
  }

  const comparisonMatch = /^([a-zA-Z0-9_.:-]+)\s*(>=|<=|=|>|<)\s*([a-zA-Z0-9_.:-]+)$/u.exec(normalized);
  if (comparisonMatch) {
    const [, left, operator, right] = comparisonMatch;
    return compareValues(resolveRuntimeValue(left, runtime), operator, right);
  }

  warnings.push(makeWarning(`Unsupported event condition: ${normalized}`, source));
  return false;
}

export function evaluateEffectGuard(
  condition: string,
  runtime: RuntimeSnapshot,
  warnings: RuntimeWarning[],
  source: string
): boolean {
  const normalized = condition.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.includes("|")) {
    return splitDisjunction(normalized).some((entry) => evaluateEffectGuard(entry, runtime, warnings, source));
  }

  if (normalized.startsWith("!")) {
    return !evaluateEffectGuard(normalized.slice(1), runtime, warnings, source);
  }

  if (evaluateCondition(normalized, runtime, warnings, source)) {
    return true;
  }

  warnings.push(makeWarning(`Unsupported effect guard: ${normalized}`, source));
  return false;
}

export function canTriggerEvent(
  event: EventDefinition,
  runtime: RuntimeSnapshot,
  warnings: RuntimeWarning[]
): boolean {
  const chapterVisits = runtime.visited_events[runtime.current_chapter_id] ?? {};
  const visitState = chapterVisits[event.event_id];

  if (event.once_per_run && visitState?.completed_count) {
    return false;
  }

  if (!event.repeatable && visitState?.completed_count) {
    return false;
  }

  return event.conditions.every((condition) =>
    evaluateCondition(condition, runtime, warnings, `event:${event.event_id}`)
  );
}

export function canSelectChoice(
  eventId: string,
  choiceId: string,
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  warnings: RuntimeWarning[]
): boolean {
  const chapter = content.chapters[runtime.current_chapter_id];
  const event = chapter?.events_by_id[eventId];
  const choice = event?.choices.find((entry) => entry.choice_id === choiceId);

  if (!event || !choice) {
    warnings.push(makeWarning(`Choice ${choiceId} is missing from ${eventId}.`, "choice"));
    return false;
  }

  return choice.conditions.every((condition) =>
    evaluateCondition(condition, runtime, warnings, `choice:${choice.choice_id}`)
  );
}

function evaluateUiCondition(
  condition: string,
  runtime: RuntimeSnapshot,
  context: {
    currentEventId?: string | null;
    currentNodeId?: string | null;
    grantsLoot?: boolean;
    eventComplete?: boolean;
  }
): boolean {
  if (!condition) {
    return true;
  }

  const normalized = condition.trim();
  if (!normalized) {
    return true;
  }

  if (normalized.includes("|")) {
    return splitDisjunction(normalized).some((entry) => evaluateUiCondition(entry, runtime, context));
  }

  if (normalized.startsWith("flag:")) {
    return runtime.flags[normalizeFlagKey(normalized)] === true;
  }

  if (normalized === "node.has_event=true") {
    return Boolean(context.currentEventId);
  }

  if (normalized === "event.complete=true") {
    return Boolean(context.eventComplete);
  }

  if (normalized === "event.grants_loot=true") {
    return Boolean(context.grantsLoot);
  }

  if (normalized === "event.grants_loot=false") {
    return !context.grantsLoot;
  }

  if (normalized.startsWith("node_id=")) {
    return context.currentNodeId === normalized.slice("node_id=".length);
  }

  if (normalized.startsWith("node_id!=")) {
    return context.currentNodeId !== normalized.slice("node_id!=".length);
  }

  return false;
}

function matchesTrigger(trigger: string, eventId: string | null | undefined): boolean {
  if (!eventId) {
    return false;
  }

  if (trigger.startsWith("event_id=")) {
    return eventId === trigger.slice("event_id=".length);
  }

  const listMatch = /^event_id in \[(.+)\]$/u.exec(trigger);
  if (listMatch) {
    return listMatch[1]
      .split(",")
      .map((entry) => entry.trim())
      .includes(eventId);
  }

  return false;
}

export function findScreenByType(
  uiFlow: UIFlow | undefined,
  screenType: string
): UIFlow["screens"][number] | undefined {
  return uiFlow?.screens.find((screen) => screen.screen_type === screenType);
}

export function resolveSpecialScreenType(
  chapterId: ChapterId,
  eventId: string | null,
  uiFlow: UIFlow | undefined
): string | null {
  if (!uiFlow || !eventId) {
    return null;
  }

  const matchingTransition = uiFlow.transitions.find((transition) => matchesTrigger(transition.trigger, eventId));
  const targetScreen = matchingTransition
    ? uiFlow.screens.find((screen) => screen.screen_id === matchingTransition.to_screen_id)
    : undefined;

  if (targetScreen?.screen_type === "safehouse" || targetScreen?.screen_type === "route_select") {
    return targetScreen.screen_type;
  }

  const override = eventId ? getChapterRuntimeConfig(chapterId)?.special_screen_overrides?.[eventId] : null;
  if (override) {
    return override;
  }

  return null;
}

export function resolveTransitionTarget(
  uiFlow: UIFlow | undefined,
  currentScreenId: string | null,
  trigger: string,
  runtime: RuntimeSnapshot,
  context: {
    currentEventId?: string | null;
    currentNodeId?: string | null;
    grantsLoot?: boolean;
    eventComplete?: boolean;
  }
): UITransition | null {
  if (!uiFlow || !currentScreenId) {
    return null;
  }

  return (
    uiFlow.transitions.find((transition) => {
      if (transition.from_screen_id !== currentScreenId) {
        return false;
      }

      if (transition.trigger !== trigger) {
        return false;
      }

      return transition.conditions.every((condition) => evaluateUiCondition(condition, runtime, context));
    }) ?? null
  );
}
