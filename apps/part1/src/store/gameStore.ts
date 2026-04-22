import { create } from "zustand";
import { GameState } from "../types/game";

interface GameStore extends GameState {
  // Actions
  setChapter: (chapterId: string) => void;
  setNode: (nodeId: string) => void;
  setEvent: (eventId: string | null) => void;
  setScreen: (screenId: string) => void;
  
  addInventoryItem: (itemId: string, quantity: number) => void;
  removeInventoryItem: (itemId: string, quantity: number) => void;
  
  setFlag: (key: string, value: boolean) => void;
  updateStat: (key: string, delta: number) => void;
  
  markNodeVisited: (nodeId: string) => void;
  completeEvent: (eventId: string) => void;
  
  resetChapterState: () => void;
  
  // Battle Actions
  startBattle: (enemyGroupId: string) => void;
  endBattle: () => void;
  addBattleLog: (message: string) => void;
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
    contamination: 0
  },
  flags: {},
  inventory: [],
  
  visitedNodes: [],
  completedEvents: [],
  chapterProgress: 0,
  fieldActionBudget: 100,
  
  battleState: null,
  saveSlots: {}
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setChapter: (chapterId) => set({ currentChapterId: chapterId }),
  setNode: (nodeId) => set({ currentNodeId: nodeId }),
  setEvent: (eventId) => set({ currentEventId: eventId }),
  setScreen: (screenId) => set({ currentScreenId: screenId }),

  addInventoryItem: (itemId, quantity) => set((state) => {
    const existing = state.inventory.find(i => i.item_id === itemId);
    if (existing) {
      return {
        inventory: state.inventory.map(i => 
          i.item_id === itemId ? { ...i, quantity: i.quantity + quantity } : i
        )
      };
    }
    return { inventory: [...state.inventory, { item_id: itemId, quantity }] };
  }),

  removeInventoryItem: (itemId, quantity) => set((state) => ({
    inventory: state.inventory
      .map(i => i.item_id === itemId ? { ...i, quantity: Math.max(0, i.quantity - quantity) } : i)
      .filter(i => i.quantity > 0)
  })),

  setFlag: (key, value) => set((state) => ({
    flags: { ...state.flags, [key]: value }
  })),

  updateStat: (key, delta) => set((state) => ({
    stats: { ...state.stats, [key]: (state.stats[key] || 0) + delta }
  })),

  markNodeVisited: (nodeId) => set((state) => ({
    visitedNodes: state.visitedNodes.includes(nodeId) 
      ? state.visitedNodes 
      : [...state.visitedNodes, nodeId]
  })),

  completeEvent: (eventId) => set((state) => ({
    completedEvents: state.completedEvents.includes(eventId)
      ? state.completedEvents
      : [...state.completedEvents, eventId]
  })),

  resetChapterState: () => set({
    visitedNodes: [],
    completedEvents: [],
    chapterProgress: 0,
    fieldActionBudget: 100,
    currentNodeId: null,
    currentEventId: null
  }),

  startBattle: (enemyGroupId) => set({
    battleState: {
      active: true,
      enemyGroupId,
      turn: 1,
      log: ["Battle started!"]
    }
  }),

  endBattle: () => set({ battleState: null }),

  addBattleLog: (message) => set((state) => ({
    battleState: state.battleState 
      ? { ...state.battleState, log: [...state.battleState.log, message] }
      : null
  }))
}));
