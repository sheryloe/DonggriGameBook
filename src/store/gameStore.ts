import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createNamespacedStorageKey } from "../../packages/game-engine/src";
import type { AppId, PartId, SaveNamespace } from "../../packages/world-registry/src";
import { getChapterRuntimeConfig } from "../../packages/world-registry/src";
import {
  CURRENT_APP_ID,
  CURRENT_PART_ID,
  CURRENT_PART_MANIFEST,
  CURRENT_SAVE_NAMESPACE,
  CURRENT_PART_START_CHAPTER,
  CURRENT_PART_START_RUNTIME
} from "../app/appContext";

export interface GameState {
  appId: AppId;
  partId: PartId;
  saveNamespace: SaveNamespace;
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
  quests: Record<string, "unassigned" | "active" | "completed" | "failed">;
  trust: Record<string, number>;
  reputation: Record<string, number>;

  currentChapterId: string;
  currentNodeId: string;
  currentEventId: string | null;

  modifyStat: (statKey: string, value: number) => void;
  grantItem: (itemId: string, amount: number) => void;
  removeItem: (itemId: string, amount: number) => void;
  setFlag: (flagKey: string, value: unknown) => void;
  setQuestStatus: (questId: string, status: "unassigned" | "active" | "completed" | "failed") => void;
  setCurrentChapter: (chapterId: string) => void;
  moveToNode: (nodeId: string) => void;
  triggerEvent: (eventId: string) => void;
  extractToHub: () => void;
  dieAndLoseLoot: () => void;
}

const DEFAULT_START_RUNTIME = CURRENT_PART_START_RUNTIME ?? {
  chapter_id: CURRENT_PART_START_CHAPTER,
  entry_node_id: "YD-01",
  hub_node_id: "YD-01",
  deploy_node_id: "YD-02",
  respawn_node_id: "YD-01",
  default_art_key: "bg_yeouido_ashroad",
  legacy_fallback_slots: ["start_background", "inspection_background", "transmitter_background"] as const
};

function resolveChapterRuntime(chapterId: string) {
  return getChapterRuntimeConfig(chapterId) ?? DEFAULT_START_RUNTIME;
}

function resolveHubNodeId(chapterId: string): string {
  return resolveChapterRuntime(chapterId).hub_node_id;
}

function resolveRespawnNodeId(chapterId: string): string {
  return resolveChapterRuntime(chapterId).respawn_node_id;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      appId: CURRENT_APP_ID,
      partId: CURRENT_PART_ID,
      saveNamespace: CURRENT_SAVE_NAMESPACE,
      stats: {
        hp: 100,
        max_hp: 100,
        contamination: 0,
        noise: 0,
        battery_charge: 100,
        filter_integrity: 100
      },
      inventory: {},
      securePouch: {},
      flags: {
        "campaign.part_id": CURRENT_PART_ID,
        "campaign.app_id": CURRENT_APP_ID
      },
      quests: {
        main_ch01: CURRENT_PART_MANIFEST.start_chapter_id === "CH01" ? "active" : "unassigned",
        merchant_yoon_01: "unassigned"
      },
      trust: {},
      reputation: {},
      currentChapterId: CURRENT_PART_START_CHAPTER,
      currentNodeId: DEFAULT_START_RUNTIME.hub_node_id,
      currentEventId: null,

      modifyStat: (statKey, value) =>
        set((state) => {
          const currentVal = Number(state.stats[statKey as keyof GameState["stats"]] || 0);
          let newVal = currentVal + value;

          if (statKey === "hp" && newVal > state.stats.max_hp) {
            newVal = state.stats.max_hp;
          }
          if (statKey === "hp" && newVal < 0) {
            newVal = 0;
          }
          if (statKey === "contamination" && newVal < 0) {
            newVal = 0;
          }
          if (statKey === "noise" && newVal < 0) {
            newVal = 0;
          }

          let nextMaxHp = state.stats.max_hp;
          if (statKey === "contamination" && newVal > 50) {
            nextMaxHp = Math.max(10, state.stats.max_hp - 10);
          }

          return {
            stats: {
              ...state.stats,
              [statKey]: newVal,
              max_hp: nextMaxHp
            }
          };
        }),

      grantItem: (itemId, amount) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: (state.inventory[itemId] || 0) + amount
          }
        })),

      removeItem: (itemId, amount) =>
        set((state) => {
          const nextInventory = { ...state.inventory };
          if (nextInventory[itemId]) {
            nextInventory[itemId] -= amount;
            if (nextInventory[itemId] <= 0) {
              delete nextInventory[itemId];
            }
          }

          return {
            inventory: nextInventory
          };
        }),

      setFlag: (flagKey, value) =>
        set((state) => ({
          flags: { ...state.flags, [flagKey]: value as boolean | number | string }
        })),

      setQuestStatus: (questId, status) =>
        set((state) => ({
          quests: { ...state.quests, [questId]: status }
        })),

      setCurrentChapter: (chapterId) =>
        set(() => ({
          currentChapterId: chapterId,
          currentNodeId: resolveHubNodeId(chapterId),
          currentEventId: null
        })),

      moveToNode: (nodeId) =>
        set(() => ({
          currentNodeId: nodeId,
          currentEventId: null
        })),

      triggerEvent: (eventId) =>
        set(() => ({
          currentEventId: eventId
        })),

      extractToHub: () =>
        set((state) => ({
          currentNodeId: resolveHubNodeId(state.currentChapterId),
          currentEventId: null,
          stats: {
            ...state.stats,
            noise: 0,
            hp: Math.min(state.stats.max_hp, state.stats.hp + 20)
          }
        })),

      dieAndLoseLoot: () =>
        set((state) => ({
          inventory: {},
          currentNodeId: resolveRespawnNodeId(state.currentChapterId),
          currentEventId: null,
          stats: {
            ...state.stats,
            hp: Math.min(state.stats.max_hp, 30),
            noise: 0,
            contamination: 0
          }
        }))
    }),
    {
      name: createNamespacedStorageKey(CURRENT_SAVE_NAMESPACE)
    }
  )
);
