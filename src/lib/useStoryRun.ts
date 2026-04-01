import { useEffect, useState } from "react";
import {
  advanceStory,
  createInitialMemory,
  requirementsMet,
  resolveSnapshot,
  StoryRunMemory,
} from "./storyEngine";
import {
  readStoryRunMemory,
  writeStoryRunMemory,
} from "./storyStorage";
import { StoryChoice, StoryDefinition, StorySnapshot } from "../types/story";

export function useStoryRun(story: StoryDefinition, nodeId: string) {
  const [snapshot, setSnapshot] = useState<StorySnapshot>(() =>
    resolveSnapshot(story, nodeId, readStoryRunMemory(story.id)),
  );

  useEffect(() => {
    const existing = readStoryRunMemory(story.id) ?? createInitialMemory(story);
    const resolved = resolveSnapshot(story, nodeId, existing);
    const nextMemory = {
      ...existing,
      version: story.version,
      currentNodeId: nodeId,
      snapshots: {
        ...existing.snapshots,
        [nodeId]: resolved,
      },
    };

    writeStoryRunMemory(story.id, nextMemory);
    setSnapshot(resolved);
  }, [nodeId, story]);

  const selectChoice = (choice: StoryChoice) => {
    if (!requirementsMet(snapshot.state, choice.requirements)) {
      return null;
    }

    const nextSnapshot = advanceStory(story, snapshot, nodeId, choice);
    const existing = readStoryRunMemory(story.id) ?? createInitialMemory(story);
    const nextMemory: StoryRunMemory = {
      version: story.version,
      currentNodeId: nextSnapshot.nodeId,
      snapshots: {
        ...existing.snapshots,
        [nodeId]: snapshot,
        [nextSnapshot.nodeId]: nextSnapshot,
      },
    };

    writeStoryRunMemory(story.id, nextMemory);
    setSnapshot(nextSnapshot);
    return nextSnapshot.nodeId;
  };

  const restart = () => {
    const initial = createInitialMemory(story);
    writeStoryRunMemory(story.id, initial);
    setSnapshot(initial.snapshots[story.startNodeId]);
    return story.startNodeId;
  };

  return {
    snapshot,
    selectChoice,
    restart,
  };
}
