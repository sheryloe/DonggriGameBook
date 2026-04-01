import { StoryRunMemory } from "./storyEngine";

export const storyRunStorageKey = (storyId: string) => `donggri:${storyId}:run`;

export function readStoryRunMemory(storyId: string): StoryRunMemory | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(storyRunStorageKey(storyId));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoryRunMemory;
  } catch {
    return null;
  }
}

export function writeStoryRunMemory(storyId: string, memory: StoryRunMemory) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(storyRunStorageKey(storyId), JSON.stringify(memory));
}

export function clearStoryRunMemory(storyId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(storyRunStorageKey(storyId));
}

export function getResumeNodeId(storyId: string, fallback: string) {
  return readStoryRunMemory(storyId)?.currentNodeId ?? fallback;
}
