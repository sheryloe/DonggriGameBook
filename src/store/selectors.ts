import type { ChapterDefinition, EventDefinition, MapConnection, RuntimeSnapshot, StatValue } from "../types/game";
import type { GameStoreState } from "./gameStore";
import { canSelectChoice } from "../engine/requirements";

function normalizeFlagId(flagId: string): string {
  return flagId.startsWith("flag:") ? flagId.slice(5) : flagId;
}

export function selectCurrentChapter(state: GameStoreState): ChapterDefinition | null {
  return state.content?.chapters[state.runtime.current_chapter_id] ?? null;
}

export function selectCurrentUiFlow(state: GameStoreState) {
  return state.content?.ui_flows[state.runtime.current_chapter_id] ?? null;
}

export function selectCurrentNode(state: GameStoreState) {
  const chapter = selectCurrentChapter(state);
  return state.runtime.current_node_id ? chapter?.nodes_by_id[state.runtime.current_node_id] ?? null : null;
}

export function selectCurrentEvent(state: GameStoreState): EventDefinition | null {
  const chapter = selectCurrentChapter(state);
  return state.runtime.current_event_id ? chapter?.events_by_id[state.runtime.current_event_id] ?? null : null;
}

export function selectStat(state: GameStoreState, key: string): StatValue | undefined {
  return state.runtime.stats[key];
}

export function selectNumberStat(state: GameStoreState, key: string): number {
  return Number(selectStat(state, key) ?? 0);
}

export function selectStringStat(state: GameStoreState, key: string): string {
  return String(selectStat(state, key) ?? "");
}

export function selectFlag(state: GameStoreState, flagId: string): boolean {
  return state.runtime.flags[normalizeFlagId(flagId)] === true;
}

export function selectHasItem(state: GameStoreState, itemId: string, quantity = 1): boolean {
  return (state.runtime.inventory.quantities[itemId] ?? 0) >= quantity;
}

export function selectInventoryStacks(state: GameStoreState) {
  return Object.entries(state.runtime.inventory.quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => ({
      itemId,
      quantity,
      item: state.content?.items[itemId]
    }))
    .sort((left, right) => left.itemId.localeCompare(right.itemId));
}

export function selectInventoryWeight(state: GameStoreState): number {
  return Number(state.runtime.stats["carry_weight"] ?? 0);
}

export function selectCarryLimit(state: GameStoreState): number {
  return Number(state.runtime.stats["carry_limit"] ?? 0);
}

export function selectIsOverCapacity(state: GameStoreState): boolean {
  return selectInventoryWeight(state) > selectCarryLimit(state);
}

export function selectVisitedNode(state: GameStoreState, chapterId: string, nodeId: string): boolean {
  return Boolean(state.runtime.visited_nodes[chapterId]?.[nodeId]);
}

export function selectVisitedEvent(state: GameStoreState, chapterId: string, eventId: string) {
  return state.runtime.visited_events[chapterId]?.[eventId] ?? null;
}

export function selectObjectiveCompletion(state: GameStoreState, chapterId?: string) {
  const safeChapterId = chapterId ?? state.runtime.current_chapter_id;
  return state.runtime.chapter_progress[safeChapterId]?.objective_completion ?? {};
}

export function selectCurrentChapterProgress(state: GameStoreState) {
  return state.runtime.chapter_progress[state.runtime.current_chapter_id] ?? null;
}

export function selectChapterStatus(state: GameStoreState, chapterId: string) {
  return state.runtime.chapter_progress[chapterId]?.status ?? "locked";
}

export function selectCanTravelTo(state: GameStoreState, nodeId: string): boolean {
  const chapter = selectCurrentChapter(state);
  const currentNode = selectCurrentNode(state);
  if (!chapter) {
    return false;
  }

  if (!currentNode) {
    return chapter.entry_node_id === nodeId;
  }

  return currentNode.connections.some((connection) => connection.to === nodeId);
}

export function selectAvailableConnections(state: GameStoreState): MapConnection[] {
  return selectCurrentNode(state)?.connections ?? [];
}

export function selectCanTriggerEvent(state: GameStoreState, eventId: string): boolean {
  const chapter = selectCurrentChapter(state);
  const event = chapter?.events_by_id[eventId];
  return Boolean(event);
}

export function selectVisibleChoices(state: GameStoreState) {
  const event = selectCurrentEvent(state);
  if (!event || !state.content) {
    return [];
  }

  return event.choices.map((choice) => ({
    choice,
    enabled: canSelectChoice(event.event_id, choice.choice_id, state.runtime, state.content!, []),
    reason: choice.preview
  }));
}

export function selectCurrentRoute(state: GameStoreState): string {
  return String(state.runtime.stats["route.current"] ?? "none");
}

export function selectActiveSaveSlot(state: GameStoreState) {
  return state.save_slots[state.active_save_slot_id] ?? null;
}

export function selectSaveSlots(state: GameStoreState) {
  return Object.values(state.save_slots).sort((left, right) => {
    return (right.updated_at ?? "").localeCompare(left.updated_at ?? "");
  });
}

export function selectLootSession(state: GameStoreState) {
  return state.runtime.loot_session;
}

export function selectBattleState(state: GameStoreState) {
  return state.runtime.battle_state;
}

export function selectUIScreen(state: GameStoreState): Pick<RuntimeSnapshot, "current_screen_id" | "ui_screen"> {
  return {
    current_screen_id: state.runtime.current_screen_id,
    ui_screen: state.runtime.ui_screen
  };
}

export function selectQuestTracksWithStatus(state: GameStoreState, chapterId: string) {
  const chapter = state.content?.chapters[chapterId];
  if (!chapter || !chapter.quest_tracks?.length) {
    return [] as Array<{
      quest_track_id: string;
      title: string;
      summary: string;
      kind: string;
      kindLabel: string;
      status: "locked" | "in_progress" | "completed";
      progressText: string;
      quest_item_id?: string;
    }>;
  }

  const completion = state.runtime.chapter_progress[chapterId]?.objective_completion ?? {};

  const evaluateCondition = (condition: string): boolean => {
    const normalized = condition.trim();
    if (!normalized) {
      return true;
    }
    if (normalized.startsWith("flag:")) {
      const flagId = normalizeFlagId(normalized);
      return state.runtime.flags[flagId] === true;
    }
    const itemMatch = /^item:([^>]+)>=(\d+)$/u.exec(normalized);
    if (itemMatch) {
      const [, itemId, rawQty] = itemMatch;
      return (state.runtime.inventory.quantities[itemId] ?? 0) >= Number(rawQty);
    }
    return false;
  };

  return chapter.quest_tracks.map((track) => {
    const total = track.objective_ids?.length ?? 0;
    const completedCount = track.objective_ids?.filter((id: string) => completion[id]).length ?? 0;
    const unlocked = track.unlock_when?.length ? track.unlock_when.every(evaluateCondition) : true;
    const status: "locked" | "in_progress" | "completed" = !unlocked
      ? "locked"
      : total > 0 && completedCount >= total
      ? "completed"
      : "in_progress";
    const kindLabel = track.kind === "main" ? "메인" : "사이드";
    const progressText =
      status === "locked"
        ? "잠금"
        : total
        ? `${completedCount}/${total}`
        : status === "completed"
        ? "완료"
        : "진행";
    const lockedTitle = track.kind === "main" ? "잠긴 메인 퀘스트" : "잠긴 사이드 퀘스트";

    const quest_item_id = track.objective_ids
      ? (track.objective_ids
          .map((objId: string) => chapter.objectives.find((obj) => obj.objective_id === objId))
          .flatMap((obj) => (obj?.complete_when ?? []) as string[])
          .map((cond: string) => /^item:([^>]+)>=(\d+)$/u.exec(cond))
          .filter((match): match is RegExpExecArray => Boolean(match))
          .map((match) => match[1])
          .find(Boolean) ?? undefined)
      : undefined;

    return {
      quest_track_id: track.quest_track_id,
      title: unlocked ? track.title : lockedTitle,
      summary: unlocked
        ? track.summary
        : "메인 진행으로 관련 단서가 열리면 상세 내용이 표시된다.",
      kind: track.kind,
      kindLabel,
      status,
      progressText,
      quest_item_id
    };
  });
}
