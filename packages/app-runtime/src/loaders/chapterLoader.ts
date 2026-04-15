import { useGameStore } from "../store/gameStore";

export const getChapterData = (chapterId: string) => {
  return useGameStore.getState().content?.chapters?.[chapterId] ?? null;
};

export const getNodeData = (chapterData: { nodes?: Array<{ node_id: string }> } | null, nodeId: string) => {
  return chapterData?.nodes?.find((node) => node.node_id === nodeId) ?? null;
};

export const getEventData = (chapterData: { events?: Array<{ event_id: string }> } | null, eventId: string) => {
  return chapterData?.events?.find((event) => event.event_id === eventId) ?? null;
};
