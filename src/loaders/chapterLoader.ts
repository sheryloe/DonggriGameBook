import ch01Data from '../../codex_webgame_pack/data/chapters/ch01.json';

export const getChapterData = (chapterId: string) => {
    // For now, only load CH01. Later this can load others dynamically.
    if (chapterId === 'CH01') return ch01Data;
    return null;
};

export const getNodeData = (chapterData: any, nodeId: string) => {
    return chapterData.nodes.find((n: any) => n.node_id === nodeId);
};

export const getEventData = (chapterData: any, eventId: string) => {
    return chapterData.events.find((e: any) => e.event_id === eventId);
};
