import {
  StoryChoice,
  StoryDefinition,
  StoryEffect,
  StoryRequirement,
  StorySnapshot,
  StoryState,
} from "../types/story";

export interface StoryRunMemory {
  version: string;
  currentNodeId: string;
  snapshots: Record<string, StorySnapshot>;
}

const MIN_STATE = 0;
const MAX_STATE = 9;

export function clampState(value: number) {
  return Math.max(MIN_STATE, Math.min(MAX_STATE, value));
}

export function applyEffects(
  state: StoryState,
  effects?: StoryEffect,
): StoryState {
  return {
    supplies: clampState(state.supplies + (effects?.supplies ?? 0)),
    noise: clampState(state.noise + (effects?.noise ?? 0)),
  };
}

export function requirementsMet(
  state: StoryState,
  requirements?: StoryRequirement[],
) {
  return (requirements ?? []).every((requirement) => {
    const currentValue = state[requirement.stat];

    if (requirement.op === "gte") {
      return currentValue >= requirement.value;
    }

    return currentValue <= requirement.value;
  });
}

export function describeRequirement(requirement: StoryRequirement) {
  const label = requirement.stat === "supplies" ? "보급" : "소음";
  const operator = requirement.op === "gte" ? "이상" : "이하";
  return `${label} ${requirement.value} ${operator}`;
}

export function formatDelta(delta?: StoryEffect) {
  if (!delta) {
    return "변동 없음";
  }

  const parts = Object.entries(delta)
    .filter((entry): entry is [keyof StoryState, number] => entry[1] !== undefined)
    .map(([key, value]) => {
      const label = key === "supplies" ? "보급" : "소음";
      const prefix = value > 0 ? "+" : "";
      return `${label} ${prefix}${value}`;
    });

  return parts.length > 0 ? parts.join(" · ") : "변동 없음";
}

export function getBootstrapSnapshot(
  story: StoryDefinition,
  nodeId: string,
): StorySnapshot {
  const bootstrap = story.bootstrap[nodeId] ?? story.bootstrap[story.startNodeId];

  return {
    nodeId,
    state: { ...bootstrap.state },
    timeline: bootstrap.timeline.map((entry) => ({
      ...entry,
      delta: entry.delta ? { ...entry.delta } : undefined,
    })),
    status: bootstrap.status ?? "in_progress",
  };
}

export function resolveSnapshot(
  story: StoryDefinition,
  nodeId: string,
  memory?: StoryRunMemory | null,
): StorySnapshot {
  if (!memory || memory.version !== story.version) {
    return getBootstrapSnapshot(story, nodeId);
  }

  const existing = memory?.snapshots[nodeId];

  if (existing) {
    return {
      ...existing,
      state: { ...existing.state },
      timeline: existing.timeline.map((entry) => ({
        ...entry,
        delta: entry.delta ? { ...entry.delta } : undefined,
      })),
    };
  }

  return getBootstrapSnapshot(story, nodeId);
}

export function createInitialMemory(story: StoryDefinition): StoryRunMemory {
  const initial = getBootstrapSnapshot(story, story.startNodeId);

  return {
    version: story.version,
    currentNodeId: story.startNodeId,
    snapshots: {
      [story.startNodeId]: initial,
    },
  };
}

export function validateStoryDefinition(story: StoryDefinition) {
  if (story.routeBase !== `/story/${story.routeId}`) {
    throw new Error(`Route base "${story.routeBase}" does not match routeId "${story.routeId}" in ${story.id}`);
  }

  Object.values(story.nodes).forEach((node) => {
    if (!story.assets[node.visual]) {
      throw new Error(`Missing asset "${node.visual}" for node "${node.id}" in ${story.id}`);
    }

    if (!story.bootstrap[node.id]) {
      throw new Error(`Missing bootstrap snapshot for node "${node.id}" in ${story.id}`);
    }

    node.choices.forEach((choice) => {
      if (!story.nodes[choice.to]) {
        throw new Error(`Missing target node "${choice.to}" from "${node.id}" in ${story.id}`);
      }
    });
  });

  story.nodeOrder.forEach((nodeId) => {
    if (!story.nodes[nodeId]) {
      throw new Error(`Missing nodeOrder entry "${nodeId}" in ${story.id}`);
    }
  });
}

export function advanceStory(
  story: StoryDefinition,
  currentSnapshot: StorySnapshot,
  currentNodeId: string,
  choice: StoryChoice,
): StorySnapshot {
  const targetNode = story.nodes[choice.to];

  if (!targetNode) {
    throw new Error(`Unknown target node: ${choice.to}`);
  }

  const afterChoice = applyEffects(currentSnapshot.state, choice.effects);
  const finalState = applyEffects(afterChoice, targetNode.effects);

  return {
    nodeId: targetNode.id,
    state: finalState,
    status: targetNode.ending ? "ended" : "in_progress",
    timeline: [
      ...currentSnapshot.timeline,
      {
        nodeId: currentNodeId,
        title: story.nodes[currentNodeId].title,
        note: choice.label,
        delta: choice.effects,
      },
      {
        nodeId: targetNode.id,
        title: targetNode.title,
        note: targetNode.ending
          ? targetNode.ending.headline
          : `${targetNode.title} 장면으로 이동했다.`,
        delta: targetNode.effects,
      },
    ],
  };
}
