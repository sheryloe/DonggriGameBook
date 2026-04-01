import { validateStoryDefinition } from "../lib/storyEngine";
import { StoryDefinition } from "../types/story";
import { story1 } from "./story1";
import { story2 } from "./story2";

export const stories: StoryDefinition[] = [story1, story2];

stories.forEach(validateStoryDefinition);

export const storiesByRouteId: Record<string, StoryDefinition> = Object.fromEntries(
  stories.map((story) => [story.routeId, story]),
);

export function getStoryByRouteId(routeId?: string) {
  return routeId ? storiesByRouteId[routeId] : undefined;
}

export function getNextStory(routeId?: string) {
  if (!routeId) {
    return undefined;
  }

  const currentIndex = stories.findIndex((story) => story.routeId === routeId);

  if (currentIndex < 0) {
    return undefined;
  }

  return stories[currentIndex + 1];
}
