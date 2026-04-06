import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GameState {
  stats: {
    hp: number;
    max_hp: number;
    contamination: number;
    noise: number;
    battery_charge: number;
    filter_integrity: number;
  };
  inventory: Record<string, number>;
  securePouch: Record<string, number>;
  flags: Record<string, boolean | number | string>;
  quests: Record<string, 'unassigned' | 'active' | 'completed' | 'failed'>;
  trust: Record<string, number>;
  reputation: Record<string, number>;

  currentChapterId: string;
  currentNodeId: string;
  currentEventId: string | null;

  // Actions
  modifyStat: (statKey: string, value: number) => void;
  grantItem: (itemId: string, amount: number) => void;
  removeItem: (itemId: string, amount: number) => void;
  setFlag: (flagKey: string, value: any) => void;
  setQuestStatus: (questId: string, status: 'unassigned' | 'active' | 'completed' | 'failed') => void;
  moveToNode: (nodeId: string) => void;
  triggerEvent: (eventId: string) => void;

  // Hardcore Mechanics
  extractToHub: () => void;
  dieAndLoseLoot: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      stats: {
        hp: 100,
        max_hp: 100,
        contamination: 0,
        noise: 0,
        battery_charge: 100,
        filter_integrity: 100,
      },
      inventory: {},
      securePouch: {},
      flags: {},
      quests: {
          "main_ch01": "active",
          "merchant_yoon_01": "unassigned"
      },
      trust: {},
      reputation: {},

      currentChapterId: 'CH01',
      currentNodeId: 'YD-01', // CH01 Hub
      currentEventId: null,

      modifyStat: (statKey, value) => set((state) => {
        const currentVal = (state.stats as any)[statKey] || 0;
        let newVal = currentVal + value;

        if (statKey === 'hp' && newVal > state.stats.max_hp) newVal = state.stats.max_hp;
        if (statKey === 'hp' && newVal < 0) newVal = 0;
        if (statKey === 'contamination' && newVal < 0) newVal = 0;
        if (statKey === 'noise' && newVal < 0) newVal = 0;

        let newMaxHp = state.stats.max_hp;
        if (statKey === 'contamination' && newVal > 50) {
            newMaxHp -= 10;
            if(newMaxHp < 10) newMaxHp = 10;
        }

        return {
          stats: {
            ...state.stats,
            [statKey]: newVal,
            max_hp: newMaxHp
          }
        };
      }),

      grantItem: (itemId, amount) => set((state) => {
        const inv = { ...state.inventory };
        inv[itemId] = (inv[itemId] || 0) + amount;
        return { inventory: inv };
      }),

      removeItem: (itemId, amount) => set((state) => {
        const inv = { ...state.inventory };
        if (inv[itemId]) {
          inv[itemId] -= amount;
          if (inv[itemId] <= 0) delete inv[itemId];
        }
        return { inventory: inv };
      }),

      setFlag: (flagKey, value) => set((state) => ({
        flags: { ...state.flags, [flagKey]: value }
      })),

      setQuestStatus: (questId, status) => set((state) => ({
          quests: { ...state.quests, [questId]: status }
      })),

      moveToNode: (nodeId) => set(() => ({
        currentNodeId: nodeId,
        currentEventId: null
      })),

      triggerEvent: (eventId) => set(() => ({
        currentEventId: eventId
      })),

      extractToHub: () => set((state) => {
          return {
             currentNodeId: state.currentChapterId === 'CH01' ? 'YD-01' :
                            state.currentChapterId === 'CH02' ? 'BW-01' :
                            state.currentChapterId === 'CH03' ? 'GG-01' :
                            state.currentChapterId === 'CH04' ? 'LC-01' : 'MC-01',
             currentEventId: null,
             stats: {
                 ...state.stats,
                 noise: 0,
                 hp: Math.min(state.stats.max_hp, state.stats.hp + 20)
             }
          };
      }),

      dieAndLoseLoot: () => set((state) => {
          return {
             inventory: {},
             currentNodeId: state.currentChapterId === 'CH01' ? 'YD-01' : 'BW-01',
             currentEventId: null,
             stats: {
                 ...state.stats,
                 hp: Math.min(state.stats.max_hp, 30),
                 noise: 0,
                 contamination: 0
             }
          };
      })
    }),
    {
      name: 'dokdo-arc-storage',
    }
  )
);
