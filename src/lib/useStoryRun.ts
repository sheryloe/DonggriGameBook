import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoryDefinition } from "../data/stories";
import { StoryChoice, StoryDefinition, StoryNode, StoryState } from "../types/story";
import { applyChoice, listAvailableChoices, resolveNode, sanitizeState } from "./storyEngine";
import { clearStoryProgress, loadStoryProgress, saveStoryProgress } from "./storyStorage";

interface UseStoryRunResult {
  definition: StoryDefinition | null;
  currentNode: StoryNode | null;
  state: StoryState;
  choices: StoryChoice[];
  choose: (choiceId: string) => string | null;
  reset: () => void;
  ready: boolean;
}

export function useStoryRun(storyId?: string, routeNodeId?: string): UseStoryRunResult {
  const definition = useMemo(() => getStoryDefinition(storyId), [storyId]);
  const [state, setState] = useState<StoryState>(sanitizeState());
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!definition) {
      setReady(true);
      setCurrentNodeId(null);
      setState(sanitizeState());
      return;
    }

    const persisted = loadStoryProgress(definition.id);
    const hasRouteNode = Boolean(routeNodeId && definition.nodes[routeNodeId]);
    const persistedNodeId = persisted?.nodeId ?? definition.startNodeId;
    const candidateNodeId = hasRouteNode ? routeNodeId! : persistedNodeId;
    const safeNodeId = definition.nodes[candidateNodeId] ? candidateNodeId : definition.startNodeId;
    const nextState = hasRouteNode
      ? sanitizeState(definition.initialState)
      : sanitizeState(persisted?.state ?? definition.initialState);

    setCurrentNodeId(safeNodeId);
    setState(nextState);
    saveStoryProgress(definition.id, safeNodeId, nextState);
    setReady(true);
  }, [definition, routeNodeId]);

  const currentNode = useMemo(() => {
    if (!definition || !currentNodeId) {
      return null;
    }
    return resolveNode(definition, currentNodeId);
  }, [definition, currentNodeId]);

  const choices = useMemo(() => {
    if (!currentNode) {
      return [];
    }
    return listAvailableChoices(currentNode, state);
  }, [currentNode, state]);

  const choose = useCallback(
    (choiceId: string) => {
      if (!definition || !currentNodeId) {
        return null;
      }

      const result = applyChoice(definition, currentNodeId, state, choiceId);
      setCurrentNodeId(result.nextNode.id);
      setState(result.nextState);
      saveStoryProgress(definition.id, result.nextNode.id, result.nextState);
      return result.nextNode.id;
    },
    [definition, currentNodeId, state]
  );

  const reset = useCallback(() => {
    if (!definition) {
      return;
    }

    const fallbackNodeId = definition.startNodeId;
    const fallbackState = sanitizeState(definition.initialState);
    setCurrentNodeId(fallbackNodeId);
    setState(fallbackState);
    clearStoryProgress(definition.id);
    saveStoryProgress(definition.id, fallbackNodeId, fallbackState);
  }, [definition]);

  return {
    definition,
    currentNode,
    state,
    choices,
    choose,
    reset,
    ready
  };
}
