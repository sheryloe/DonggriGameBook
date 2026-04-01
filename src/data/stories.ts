import { story1 } from "./story1";
import { story2 } from "./story2";
import { StoryDefinition } from "../types/story";

export const stories: Record<string, StoryDefinition> = {
  "1": story1,
  "2": story2
};

export function getStoryDefinition(storyId?: string | null): StoryDefinition | null {
  if (!storyId) {
    return null;
  }
  return stories[storyId] ?? null;
}
