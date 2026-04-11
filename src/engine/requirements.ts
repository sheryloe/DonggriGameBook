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

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (normalized === "false" || normalized === "0" || normalized === "none" || normalized === "locked") {
      return false;
    }

    return true;
  }

  return Boolean(value);
}

export function normalizeFlagKey(input: string): string {
  const normalized = input.trim();
  return normalized.startsWith("flag:") ? normalized.slice(5) : normalized;
}

export function normalizeItemKey(input: string): string {
  const normalized = input.trim();
  return normalized.startsWith("item:") ? normalized.slice(5) : normalized;
}

export function normalizeTrustKey(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    return normalized;
  }

  if (normalized.startsWith("trust.")) {
    return normalized;
  }

  if (normalized.startsWith("npc_")) {
    return `trust.${normalized}`;
  }

  return normalized;
}

export function normalizeRouteUnlockKey(input: string): string {
  return input.trim().replace(/^route:(?=.+)/u, "");
}

export function normalizeNodeUnlockKey(input: string): string {
  return input.trim().replace(/^node:(?=.+)/u, "");
}

function resolveWidgetValue(reference: string, runtime: RuntimeSnapshot): string | number | boolean | undefined {
  const [chapterHint, widgetKeyRaw] = reference.split(":", 2);
  const widgetKey = widgetKeyRaw ? widgetKeyRaw.trim() : chapterHint.trim();
  const chapterId = widgetKeyRaw ? chapterHint.trim() : runtime.current_chapter_id;
  const chapterWidgets = runtime.chapter_widgets_state?.[chapterId];
  const entry = chapterWidgets?.[widgetKey];
  const value = entry?.value;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function resolveRuntimeValue(reference: string, runtime: RuntimeSnapshot): string | number | boolean | undefined {
  const normalized = reference.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("trust.")) {
    return runtime.stats[normalizeTrustKey(normalized)] as string | number | undefined;
  }

  if (normalized.startsWith("npc_")) {
    return runtime.stats[normalizeTrustKey(normalized)] as string | number | undefined;
  }

  if (normalized.startsWith("flag:")) {
    return runtime.flags[normalizeFlagKey(normalized)] as FlagValue | undefined;
  }

  if (normalized.startsWith("item:")) {
    return runtime.inventory.quantities[normalizeItemKey(normalized)] ?? 0;
  }

  if (normalized.startsWith("route:")) {
    return runtime.stats["route.current"] === normalized.slice(6);
  }

  if (normalized.startsWith("route_unlocked:") || normalized.startsWith("unlock_route:")) {
    const rawKey = normalized.slice(normalized.indexOf(":") + 1);
    const key = normalizeRouteUnlockKey(rawKey);
    return (
      runtime.route_unlocks?.[key]?.unlocked ??
      (runtime.flags[`route.unlock.${key}`] as boolean | undefined) ??
      (runtime.flags[key] as boolean | undefined)
    );
  }

  if (normalized.startsWith("node_unlocked:") || normalized.startsWith("unlock_node:")) {
    const rawKey = normalized.slice(normalized.indexOf(":") + 1);
    const key = normalizeNodeUnlockKey(rawKey);
    return (
      runtime.node_unlocks?.[key]?.unlocked ??
      (runtime.flags[`node.unlock.${key}`] as boolean | undefined) ??
      (runtime.flags[key] as boolean | undefined)
    );
  }

  if (normalized.startsWith("auth.")) {
    return (
      runtime.stats[normalized] as string | number | undefined
    ) ?? (runtime.flags[normalized] as FlagValue | undefined);
  }

  if (normalized === "field_actions_remaining" || normalized === "field_actions.remaining") {
    if (typeof runtime.field_actions_remaining === "number") {
      return runtime.field_actions_remaining;
    }

    const chapterValue =
      runtime.field_actions_remaining && typeof runtime.field_actions_remaining === "object"
        ? runtime.field_actions_remaining[runtime.current_chapter_id]
        : undefined;
    return typeof chapterValue === "number" ? chapterValue : 0;
  }

  if (normalized.startsWith("widget.")) {
    return resolveWidgetValue(normalized.slice("widget.".length), runtime);
  }

  if (normalized === "fail_state.active") {
    return Boolean(runtime.fail_state);
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

  if (normalized.startsWith("item:")) {
    return Number(resolveRuntimeValue(normalized, runtime) ?? 0) > 0;
  }

  const comparisonMatch = /^([a-zA-Z0-9_.:-]+)\s*(>=|<=|=|>|<)\s*([a-zA-Z0-9_.:-]+)$/u.exec(normalized);
  if (comparisonMatch) {
    const [, left, operator, right] = comparisonMatch;
    return compareValues(resolveRuntimeValue(left, runtime), operator, right);
  }

  if (
    normalized.startsWith("route:") ||
    normalized.startsWith("route_unlocked:") ||
    normalized.startsWith("unlock_route:") ||
    normalized.startsWith("node_unlocked:") ||
    normalized.startsWith("unlock_node:") ||
    normalized.startsWith("auth.") ||
    normalized === "field_actions_remaining" ||
    normalized === "field_actions.remaining" ||
    normalized.startsWith("trust.") ||
    normalized.startsWith("npc_") ||
    normalized.startsWith("widget.") ||
    normalized === "fail_state.active"
  ) {
    return asBoolean(resolveRuntimeValue(normalized, runtime));
  }

  const fallbackValue = resolveRuntimeValue(normalized, runtime);
  if (fallbackValue !== undefined) {
    return asBoolean(fallbackValue);
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
  if (!condition.trim()) {
    return true;
  }

  const guardWarnings: RuntimeWarning[] = [];
  const allowed = evaluateCondition(condition, runtime, guardWarnings, source);
  warnings.push(...guardWarnings);
  return allowed;
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

  if (normalized.startsWith("!")) {
    return !evaluateUiCondition(normalized.slice(1), runtime, context);
  }

  if (normalized.startsWith("flag:")) {
    return runtime.flags[normalizeFlagKey(normalized)] === true;
  }

  if (normalized.startsWith("auth.")) {
    return asBoolean(resolveRuntimeValue(normalized, runtime));
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

      return transition.conditions.every((entry) => evaluateUiCondition(entry, runtime, context));
    }) ?? null
  );
}
