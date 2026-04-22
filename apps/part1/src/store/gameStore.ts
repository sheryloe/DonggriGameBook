import { create } from "zustand";
import { contentLoader } from "../loaders/contentLoader";
import { GameState, BattleState } from "../types/game";

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
  addBattleLog: (message: string) => void;
  updateEnemyHp: (delta: number) => void;
  toggleInventory: () => void;
  toggleStats: () => void;
}

const initialState: GameState = {
  currentChapterId: null,
  currentNodeId: null,
  currentEventId: null,
  currentScreenId: "BRIEFING",
  stats: {
    hp: 100,
    maxHp: 100,
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
  visitedNodes: [],
  completedEvents: [],
  chapterProgress: 0,
  fieldActionBudget: 100,
  battleState: null,
  saveSlots: {},
  isInventoryOpen: false,
  isStatsOpen: false,
};

function normalizeKey(value: string): string {
  return value.replace(/^(flag|item|loot):/u, "");
}

function clampStat(key: string, value: number, state: GameState): number {
  if (key === "hp") return Math.max(0, Math.min(Number(state.stats.maxHp ?? 100), value));
  if (key === "stamina") return Math.max(0, Math.min(Number(state.stats.maxStamina ?? 100), value));
  if (key === "mental") return Math.max(0, Math.min(Number(state.stats.maxMental ?? 100), value));
  if (key === "noise" || key === "contamination") return Math.max(0, value);
  return value;
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setChapter: (chapterId) => set({ currentChapterId: chapterId }),
  setNode: (nodeId) => set({ currentNodeId: nodeId }),
  setEvent: (eventId) => set({ currentEventId: eventId }),
  setScreen: (screenId) => set({ currentScreenId: screenId }),

  addInventoryItem: (itemId, quantity) =>
    set((state) => {
      const normalizedItemId = normalizeKey(itemId);
      const existing = state.inventory.find((item) => item.item_id === normalizedItemId);
      if (existing) {
        return {
          inventory: state.inventory.map((item) =>
            item.item_id === normalizedItemId ? { ...item, quantity: item.quantity + quantity } : item,
          ),
        };
      }
      return { inventory: [...state.inventory, { item_id: normalizedItemId, quantity }] };
    }),

  removeInventoryItem: (itemId, quantity) =>
    set((state) => {
      const normalizedItemId = normalizeKey(itemId);
      return {
        inventory: state.inventory
          .map((item) =>
            item.item_id === normalizedItemId ? { ...item, quantity: Math.max(0, item.quantity - quantity) } : item,
          )
          .filter((item) => item.quantity > 0),
      };
    }),

  setFlag: (key, value) =>
    set((state) => ({
      flags: { ...state.flags, [normalizeKey(key)]: value },
    })),

  updateStat: (key, delta) =>
    set((state) => {
      const current = Number(state.stats[key] ?? 0);
      return { stats: { ...state.stats, [key]: clampStat(key, current + delta, state) } };
    }),

  setValue: (key, value) =>
    set((state) => ({
      stats: { ...state.stats, [normalizeKey(key)]: value },
    })),

  markNodeVisited: (nodeId) =>
    set((state) => ({
      visitedNodes: state.visitedNodes.includes(nodeId) ? state.visitedNodes : [...state.visitedNodes, nodeId],
    })),

  completeEvent: (eventId) =>
    set((state) => ({
      completedEvents: state.completedEvents.includes(eventId)
        ? state.completedEvents
        : [...state.completedEvents, eventId],
      chapterProgress: state.completedEvents.includes(eventId) ? state.chapterProgress : state.chapterProgress + 1,
    })),

  resetChapterState: () =>
    set({
      visitedNodes: [],
      completedEvents: [],
      chapterProgress: 0,
      fieldActionBudget: 100,
      currentNodeId: null,
      currentEventId: null,
      battleState: null,
    }),

  startBattle: (enemyGroupId) => {
    const { enemyId, enemy } = contentLoader.getPrimaryEnemy(enemyGroupId);
    const initialHp = Number(enemy?.hp ?? enemy?.max_hp ?? enemy?.base_stats?.hp ?? 100);
    set({
      battleState: {
        active: true,
        enemyGroupId,
        primaryEnemyId: enemyId,
        turn: 1,
        log: ["[시스템] 교전 개시. 위협 개체 반응을 확인합니다."],
        enemyHp: initialHp,
        maxEnemyHp: initialHp,
      },
    });
  },

  endBattle: () => set({ battleState: null }),

  addBattleLog: (message) =>
    set((state) => ({
      battleState: state.battleState ? { ...state.battleState, log: [...state.battleState.log, message] } : null,
    })),

  updateEnemyHp: (delta) =>
    set((state) => ({
      battleState: state.battleState
        ? { ...state.battleState, enemyHp: Math.max(0, state.battleState.enemyHp + delta) }
        : null,
    })),

  toggleInventory: () => set((state) => ({ isInventoryOpen: !state.isInventoryOpen, isStatsOpen: false })),
  toggleStats: () => set((state) => ({ isStatsOpen: !state.isStatsOpen, isInventoryOpen: false })),
}));
