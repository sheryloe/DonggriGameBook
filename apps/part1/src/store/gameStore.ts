import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { contentLoader } from "../loaders/contentLoader";
import { playInventoryGain, playInventoryRemove, playPanelToggle } from "../utils/audio";
import type { GameState, RestKind } from "../types/game";
import { expireDeadlinesForState, getItemUseEffect, survivalClockFromElapsedHours } from "../utils/survival";

interface GameStore extends GameState {
  setChapter: (chapterId: string) => void;
  setNode: (nodeId: string | null) => void;
  setEvent: (eventId: string | null) => void;
  setScreen: (screenId: string) => void;
  addInventoryItem: (itemId: string, quantity: number) => void;
  removeInventoryItem: (itemId: string, quantity: number) => void;
  setFlag: (key: string, value: boolean) => void;
  updateStat: (key: string, delta: number) => void;
  setValue: (key: string, value: unknown) => void;
  markNodeVisited: (nodeId: string) => void;
  completeEvent: (eventId: string) => void;
  resetChapterState: () => void;
  startBattle: (enemyGroupId: string) => void;
  endBattle: () => void;
  failRun: (failure: { kind: "turned" | "killed" | "collapsed"; title: string; body: string }) => void;
  addBattleLog: (message: string) => void;
  updateThreatPressure: (delta: number) => void;
  advanceTime: (hours: number, reason?: string) => void;
  restAtSafehouse: (kind: RestKind) => void;
  useInventoryItem: (itemId: string) => boolean;
  failQuest: (questId: string, reason?: string) => void;
  expireDeadlines: () => void;
  appendSurvivalLog: (message: string) => void;
  setDeadlineReturn: (screenId: string, eventId?: string | null) => void;
  clearDeadlineEvent: () => void;
  toggleInventory: () => void;
  toggleStats: () => void;
}

const initialState: GameState = {
  currentChapterId: null,
  currentNodeId: null,
  currentEventId: null,
  currentScreenId: "BRIEFING",
  stats: {
    injury: 0,
    maxInjury: 100,
    infection: 0,
    maxInfection: 100,
    stamina: 100,
    maxStamina: 100,
    mental: 100,
    maxMental: 100,
    level: 1,
    exp: 0,
    noise: 0,
    contamination: 0,
  },
  flags: {},
  inventory: [],
  day: 1,
  timeBlock: "새벽",
  elapsedHours: 0,
  deadlineFlags: {},
  failedQuestIds: [],
  restCount: 0,
  survivalLog: ["Day 1 새벽: 방송동 진입 준비"],
  pendingDeadlineEvent: null,
  deadlineReturnScreen: null,
  deadlineReturnEventId: null,
  visitedNodes: [],
  completedEvents: [],
  chapterProgress: 0,
  fieldActionBudget: 100,
  battleState: null,
  failureState: null,
  saveSlots: {},
  isInventoryOpen: false,
  isStatsOpen: false,
};

function normalizeKey(value: string): string {
  return value.replace(/^(flag|item|loot):/u, "");
}

function clampStat(key: string, value: number, state: GameState): number {
  if (key === "injury") return Math.max(0, Math.min(Number(state.stats.maxInjury ?? 100), value));
  if (key === "infection") return Math.max(0, Math.min(Number(state.stats.maxInfection ?? 100), value));
  if (key === "stamina") return Math.max(0, Math.min(Number(state.stats.maxStamina ?? 100), value));
  if (key === "mental") return Math.max(0, Math.min(Number(state.stats.maxMental ?? 100), value));
  if (key === "noise" || key === "contamination") return Math.max(0, value);
  return value;
}

function applyDeadlineState(state: GameState): Pick<GameState, "deadlineFlags" | "failedQuestIds" | "flags" | "survivalLog" | "pendingDeadlineEvent"> {
  const expired = expireDeadlinesForState(state);
  return {
    deadlineFlags: expired.deadlineFlags,
    failedQuestIds: expired.failedQuestIds,
    flags: expired.flags,
    survivalLog: expired.survivalLog,
    pendingDeadlineEvent: expired.pendingDeadlineEvent,
  };
}

function normalizeHydratedScreen(screenId: string | null | undefined): string {
  if (!screenId || screenId === "BATTLE") return "CHAPTER_MAP";
  return screenId;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,
      setChapter: (chapterId) => set({ currentChapterId: chapterId }),
      setNode: (nodeId) => set({ currentNodeId: nodeId }),
      setEvent: (eventId) => set({ currentEventId: eventId }),
      setScreen: (screenId) => set({ currentScreenId: screenId }),
      addInventoryItem: (itemId, quantity) => set((state) => {
        const normalizedItemId = normalizeKey(itemId);
        if (quantity > 0) playInventoryGain();
        const existing = state.inventory.find((item) => item.item_id === normalizedItemId);
        if (existing) return { inventory: state.inventory.map((item) => item.item_id === normalizedItemId ? { ...item, quantity: item.quantity + quantity } : item) };
        return { inventory: [...state.inventory, { item_id: normalizedItemId, quantity }] };
      }),
      removeInventoryItem: (itemId, quantity) => set((state) => {
        const normalizedItemId = normalizeKey(itemId);
        if (quantity > 0) playInventoryRemove();
        return { inventory: state.inventory.map((item) => item.item_id === normalizedItemId ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item).filter((item) => item.quantity > 0) };
      }),
      setFlag: (key, value) => set((state) => ({ flags: { ...state.flags, [normalizeKey(key)]: value } })),
      updateStat: (key, delta) => set((state) => {
        const current = Number(state.stats[key] ?? 0);
        return { stats: { ...state.stats, [key]: clampStat(key, current + delta, state) } };
      }),
      setValue: (key, value) => set((state) => ({ stats: { ...state.stats, [normalizeKey(key)]: value } })),
      markNodeVisited: (nodeId) => set((state) => ({ visitedNodes: state.visitedNodes.includes(nodeId) ? state.visitedNodes : [...state.visitedNodes, nodeId] })),
      completeEvent: (eventId) => set((state) => ({ completedEvents: state.completedEvents.includes(eventId) ? state.completedEvents : [...state.completedEvents, eventId], chapterProgress: state.completedEvents.includes(eventId) ? state.chapterProgress : state.chapterProgress + 1 })),
      resetChapterState: () => set({ visitedNodes: [], chapterProgress: 0, fieldActionBudget: 100, currentNodeId: null, currentEventId: null, battleState: null, failureState: null, pendingDeadlineEvent: null, deadlineReturnScreen: null, deadlineReturnEventId: null }),
      startBattle: (enemyGroupId) => {
        const { enemyId, enemy } = contentLoader.getPrimaryEnemy(enemyGroupId);
        const basePressure = Number(enemy?.base_stats?.noise_response ?? enemy?.speed ?? enemy?.level ?? 12);
        const initialPressure = Math.max(70, Math.min(120, 82 + basePressure));
        const archetype = String(enemy?.archetype ?? enemyId).toLowerCase();
        const encounterKind = archetype.includes("human") || archetype.includes("raider") || archetype.includes("survivor") ? "human" : "infected";
        set({ battleState: { active: true, enemyGroupId, primaryEnemyId: enemyId, turn: 1, log: ["[조우] 소리가 먼저 닿았다. 위협과의 거리를 다시 재야 한다."], threatPressure: initialPressure, maxThreatPressure: initialPressure, encounterKind } });
      },
      endBattle: () => set({ battleState: null }),
      failRun: (failure) => set((state) => ({ battleState: null, currentScreenId: "FAILURE", failureState: { ...failure, chapterId: state.currentChapterId, eventId: state.currentEventId, nodeId: state.currentNodeId } })),
      addBattleLog: (message) => set((state) => ({ battleState: state.battleState ? { ...state.battleState, log: [...state.battleState.log, message] } : null })),
      updateThreatPressure: (delta) => set((state) => {
        if (!state.battleState) return { battleState: null };
        return { battleState: { ...state.battleState, threatPressure: Math.max(0, Number(state.battleState.threatPressure ?? 0) + delta) } };
      }),
      advanceTime: (hours, reason) => set((state) => {
        const elapsedHours = Math.max(0, Number(state.elapsedHours ?? 0) + Math.max(0, hours));
        const { day, timeBlock } = survivalClockFromElapsedHours(elapsedHours);
        const survivalLog = reason ? [...state.survivalLog, `Day ${day} ${timeBlock}: ${reason} (+${hours}시간)`].slice(-30) : state.survivalLog;
        const nextState: GameState = { ...state, elapsedHours, day, timeBlock, survivalLog };
        return { elapsedHours, day, timeBlock, ...applyDeadlineState(nextState) };
      }),
      restAtSafehouse: (kind) => set((state) => {
        const hasMedical = state.inventory.some((entry) => Boolean(getItemUseEffect(contentLoader.getItem(entry.item_id))));
        const restSpec = {
          short: { hours: 2, injury: -12, infection: 0, stamina: 15, mental: 8, noise: -4, label: "짧은 휴식" },
          medical: { hours: 3, injury: hasMedical ? -25 : -10, infection: hasMedical ? -10 : 0, stamina: 8, mental: 6, noise: -2, label: hasMedical ? "응급 처치" : "응급 처치 물자 부족" },
          overnight: { hours: 10, injury: -35, infection: -8, stamina: 35, mental: 28, noise: -15, label: "하룻밤 쉼" },
        }[kind];
        const elapsedHours = Math.max(0, Number(state.elapsedHours ?? 0) + restSpec.hours);
        const { day, timeBlock } = survivalClockFromElapsedHours(elapsedHours);
        const stats = {
          ...state.stats,
          injury: clampStat("injury", Number(state.stats.injury ?? 0) + restSpec.injury, state),
          infection: clampStat("infection", Number(state.stats.infection ?? 0) + restSpec.infection, state),
          contamination: clampStat("contamination", Number(state.stats.contamination ?? 0) + restSpec.infection, state),
          stamina: clampStat("stamina", Number(state.stats.stamina ?? 0) + restSpec.stamina, state),
          mental: clampStat("mental", Number(state.stats.mental ?? 0) + restSpec.mental, state),
          noise: clampStat("noise", Number(state.stats.noise ?? 0) + restSpec.noise, state),
        };
        const restCount = state.restCount + (kind === "overnight" ? 1 : 0);
        const survivalLog = [...state.survivalLog, `Day ${day} ${timeBlock}: ${restSpec.label}으로 몸을 추슬렀다. (+${restSpec.hours}시간)`].slice(-30);
        const nextState: GameState = { ...state, elapsedHours, day, timeBlock, stats, restCount, survivalLog };
        return { elapsedHours, day, timeBlock, stats, restCount, ...applyDeadlineState(nextState) };
      }),
      useInventoryItem: (itemId) => {
        let used = false;
        set((state) => {
          const normalizedItemId = normalizeKey(itemId);
          const entry = state.inventory.find((item) => item.item_id === normalizedItemId);
          const itemData = contentLoader.getItem(normalizedItemId);
          const effect = getItemUseEffect(itemData);
          if (!entry || !effect) return {};
          used = true;
          const stats = { ...state.stats, injury: clampStat("injury", Number(state.stats.injury ?? 0) + effect.injuryDelta, state), infection: clampStat("infection", Number(state.stats.infection ?? 0) + effect.infectionDelta, state), contamination: clampStat("contamination", Number(state.stats.contamination ?? 0) + effect.contaminationDelta, state), stamina: clampStat("stamina", Number(state.stats.stamina ?? 0) + effect.staminaDelta, state), mental: clampStat("mental", Number(state.stats.mental ?? 0) + effect.mentalDelta, state) };
          const inventory = effect.consume ? state.inventory.map((item) => item.item_id === normalizedItemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item).filter((item) => item.quantity > 0) : state.inventory;
          const survivalLog = [...state.survivalLog, `물자 사용: ${itemData?.name_ko ?? normalizedItemId} (${effect.label})`].slice(-30);
          if (effect.consume) playInventoryRemove();
          return { stats, inventory, survivalLog };
        });
        return used;
      },
      failQuest: (questId, reason) => set((state) => ({ failedQuestIds: state.failedQuestIds.includes(questId) ? state.failedQuestIds : [...state.failedQuestIds, questId], deadlineFlags: { ...state.deadlineFlags, [questId]: "expired" }, survivalLog: [...state.survivalLog, `기한 실패: ${reason ?? questId}`].slice(-30) })),
      expireDeadlines: () => set((state) => applyDeadlineState(state)),
      appendSurvivalLog: (message) => set((state) => ({ survivalLog: [...state.survivalLog, message].slice(-30) })),
      setDeadlineReturn: (screenId, eventId = null) => set({ deadlineReturnScreen: screenId, deadlineReturnEventId: eventId }),
      clearDeadlineEvent: () => set({ pendingDeadlineEvent: null, deadlineReturnScreen: null, deadlineReturnEventId: null }),
      toggleInventory: () => set((state) => { const nextOpen = !state.isInventoryOpen; playPanelToggle(nextOpen); return { isInventoryOpen: nextOpen, isStatsOpen: false }; }),
      toggleStats: () => set((state) => { const nextOpen = !state.isStatsOpen; playPanelToggle(nextOpen); return { isStatsOpen: nextOpen, isInventoryOpen: false }; }),
    }),
    {
      name: "donggri-part1-survival-save-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentChapterId: state.currentChapterId, currentNodeId: state.currentNodeId, currentEventId: state.currentEventId, currentScreenId: normalizeHydratedScreen(state.currentScreenId), stats: state.stats, flags: state.flags, inventory: state.inventory, day: state.day, timeBlock: state.timeBlock, elapsedHours: state.elapsedHours, deadlineFlags: state.deadlineFlags, failedQuestIds: state.failedQuestIds, restCount: state.restCount, survivalLog: state.survivalLog, pendingDeadlineEvent: state.pendingDeadlineEvent, deadlineReturnScreen: state.deadlineReturnScreen, deadlineReturnEventId: state.deadlineReturnEventId, visitedNodes: state.visitedNodes, completedEvents: state.completedEvents, chapterProgress: state.chapterProgress, fieldActionBudget: state.fieldActionBudget, failureState: state.failureState, saveSlots: state.saveSlots, battleState: null, isInventoryOpen: false, isStatsOpen: false }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameState>;
        return { ...current, ...saved, currentScreenId: normalizeHydratedScreen(saved.currentScreenId ?? current.currentScreenId), battleState: null, isInventoryOpen: false, isStatsOpen: false };
      },
    },
  ),
);