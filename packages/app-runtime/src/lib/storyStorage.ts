import { createNamespacedStorageKey } from "@donggrol/game-engine";
import { CURRENT_SAVE_NAMESPACE } from "../app/appContext";
import type { StoryProgress, StoryState } from "../types/story";

const KEY_PREFIX = `${createNamespacedStorageKey(CURRENT_SAVE_NAMESPACE)}:story`;

function makeKey(storyId: string): string {
  return `${KEY_PREFIX}:${storyId}`;
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoryProgress(storyId: string): StoryProgress | null {
  if (!hasStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(makeKey(storyId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoryProgress;
    if (!parsed?.nodeId || !parsed?.state) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveStoryProgress(storyId: string, nodeId: string, state: StoryState): void {
  if (!hasStorage()) {
    return;
  }

  const payload: StoryProgress = {
    storyId,
    nodeId,
    state,
    updatedAt: new Date().toISOString()
  };

  window.localStorage.setItem(makeKey(storyId), JSON.stringify(payload));
}

export function clearStoryProgress(storyId: string): void {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(makeKey(storyId));
}


