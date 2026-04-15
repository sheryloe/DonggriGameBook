import { StoryChoice, StoryDefinition, StoryNode, StoryState } from "../types/story";

export const DEFAULT_STATE: StoryState = {
  supplies: 5,
  noise: 2
};

export function clampStat(value: number): number {
  return Math.max(0, Math.min(9, Math.round(value)));
}

export function sanitizeState(partial?: Partial<StoryState>): StoryState {
  return {
    supplies: clampStat(partial?.supplies ?? DEFAULT_STATE.supplies),
    noise: clampStat(partial?.noise ?? DEFAULT_STATE.noise)
  };
}

export function resolveNode(definition: StoryDefinition, nodeId?: string): StoryNode {
  const fallback = definition.nodes[definition.startNodeId];
  if (!nodeId) {
    return fallback;
  }
  return definition.nodes[nodeId] ?? fallback;
}

export function choiceAvailable(choice: StoryChoice, state: StoryState): boolean {
  if (!choice.requirements) {
    return true;
  }

  return Object.entries(choice.requirements).every(([stat, requiredValue]) => {
    const typedStat = stat as keyof StoryState;
    const threshold = requiredValue ?? 0;
    // supplies: minimum required, noise: maximum allowed
    if (typedStat === "noise") {
      return state.noise <= threshold;
    }
    return state[typedStat] >= threshold;
  });
}

export function listAvailableChoices(node: StoryNode, state: StoryState): StoryChoice[] {
  return node.choices.filter((choice) => choiceAvailable(choice, state));
}

export function applyChoice(
  definition: StoryDefinition,
  nodeId: string,
  state: StoryState,
  choiceId: string
): { nextNode: StoryNode; nextState: StoryState } {
  const currentNode = resolveNode(definition, nodeId);
  const choice = currentNode.choices.find((item) => item.id === choiceId);

  if (!choice) {
    throw new Error(`Unknown choice: ${choiceId}`);
  }

  if (!choiceAvailable(choice, state)) {
    throw new Error(`Choice is not available: ${choiceId}`);
  }

  const nextState = sanitizeState({
    supplies: state.supplies + (choice.effects?.supplies ?? 0),
    noise: state.noise + (choice.effects?.noise ?? 0)
  });

  const nextNode = resolveNode(definition, choice.nextNodeId);
  return { nextNode, nextState };
}
