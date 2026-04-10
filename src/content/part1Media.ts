import type {
  ChapterId,
  EndingId,
  MediaMetaDefinition,
  VideoRegistryEntry
} from "../types/game";

export interface Part1ChapterMediaDefinition {
  chapter_id: ChapterId;
  briefing_art_key: string;
  map_art_key: string;
  result_art_key: string;
  opening_video_id: string;
  title_default: string;
  subtitle_default: string;
  caption_default: string;
}

export interface Part1EndingMediaDefinition {
  ending_id: EndingId;
  art_key: string;
  thumb_key: string;
  video_id: string;
  title_default: string;
  subtitle_default: string;
  caption_default: string;
}

export const PART1_CHAPTER_MEDIA: Record<ChapterId, Part1ChapterMediaDefinition> = {
  CH01: {
    chapter_id: "CH01",
    briefing_art_key: "briefing_p1_ch01",
    map_art_key: "map_p1_ch01",
    result_art_key: "result_p1_ch01",
    opening_video_id: "P1_CH01_OPENING",
    title_default: "Broken Broadcast",
    subtitle_default: "Yeouido signal sweep",
    caption_default: "The first relay call rises above the ash-filled broadcast district."
  },
  CH02: {
    chapter_id: "CH02",
    briefing_art_key: "briefing_p1_ch02",
    map_art_key: "map_p1_ch02",
    result_art_key: "result_p1_ch02",
    opening_video_id: "P1_CH02_OPENING",
    title_default: "Black Canal",
    subtitle_default: "Noryangjin pressure lane",
    caption_default: "The team enters a flooded trade corridor where forged routes already rule."
  },
  CH03: {
    chapter_id: "CH03",
    briefing_art_key: "briefing_p1_ch03",
    map_art_key: "map_p1_ch03",
    result_art_key: "result_p1_ch03",
    opening_video_id: "P1_CH03_OPENING",
    title_default: "Vertical Garden",
    subtitle_default: "Jamsil tower breach",
    caption_default: "Every floor looks safe until the glass and signal lines start breaking at once."
  },
  CH04: {
    chapter_id: "CH04",
    briefing_art_key: "briefing_p1_ch04",
    map_art_key: "map_p1_ch04",
    result_art_key: "result_p1_ch04",
    opening_video_id: "P1_CH04_OPENING",
    title_default: "Sorters' Line",
    subtitle_default: "Tancheon logistics belt",
    caption_default: "Medicine, badges, and forged access collide in a dead sorting corridor."
  },
  CH05: {
    chapter_id: "CH05",
    briefing_art_key: "briefing_p1_ch05",
    map_art_key: "map_p1_ch05",
    result_art_key: "result_p1_ch05",
    opening_video_id: "P1_CH05_OPENING",
    title_default: "Mirror Center",
    subtitle_default: "Pangyo sealed core",
    caption_default: "The relay archive opens just enough to show that rescue was always a filter."
  }
};

export const PART1_ENDING_MEDIA: Record<EndingId, Part1EndingMediaDefinition> = {
  P1_END_SIGNAL_KEEPERS: {
    ending_id: "P1_END_SIGNAL_KEEPERS",
    art_key: "ending_p1_signal_keepers",
    thumb_key: "ending_thumb_p1_signal_keepers",
    video_id: "P1_END_SIGNAL_KEEPERS",
    title_default: "Signal Keepers",
    subtitle_default: "Archive preserved, road opened",
    caption_default: "They leave with the signal records intact and carry the burden south."
  },
  P1_END_CONTROLLED_PASSAGE: {
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    art_key: "ending_p1_controlled_passage",
    thumb_key: "ending_thumb_p1_controlled_passage",
    video_id: "P1_END_CONTROLLED_PASSAGE",
    title_default: "Controlled Passage",
    subtitle_default: "Order first, truth delayed",
    caption_default: "A stable corridor survives, but the full archive stays behind sealed doors."
  },
  P1_END_SMUGGLER_TIDE: {
    ending_id: "P1_END_SMUGGLER_TIDE",
    art_key: "ending_p1_smuggler_tide",
    thumb_key: "ending_thumb_p1_smuggler_tide",
    video_id: "P1_END_SMUGGLER_TIDE",
    title_default: "Smuggler Tide",
    subtitle_default: "Escape by forged waterline",
    caption_default: "The team survives by breaking the official route and sinking its own trust."
  },
  P1_END_ASHEN_ESCAPE: {
    ending_id: "P1_END_ASHEN_ESCAPE",
    art_key: "ending_p1_ashen_escape",
    thumb_key: "ending_thumb_p1_ashen_escape",
    video_id: "P1_END_ASHEN_ESCAPE",
    title_default: "Ashen Escape",
    subtitle_default: "Survival without proof",
    caption_default: "The road holds, but the evidence and rescue line collapse into ash."
  },
  P1_END_MIRROR_WITNESS: {
    ending_id: "P1_END_MIRROR_WITNESS",
    art_key: "ending_p1_mirror_witness",
    thumb_key: "ending_thumb_p1_mirror_witness",
    video_id: "P1_END_MIRROR_WITNESS",
    title_default: "Mirror Witness",
    subtitle_default: "Full truth, heavier pursuit",
    caption_default: "They leave with the hidden record bundle and guarantee that someone will come after it."
  }
};

export const PART1_VIDEO_REGISTRY: Record<string, VideoRegistryEntry> = {
  P1_CH01_OPENING: {
    video_id: "P1_CH01_OPENING",
    chapter_id: "CH01",
    poster_art_key: PART1_CHAPTER_MEDIA.CH01.briefing_art_key,
    title_default: PART1_CHAPTER_MEDIA.CH01.title_default,
    subtitle_default: PART1_CHAPTER_MEDIA.CH01.subtitle_default,
    caption_default: PART1_CHAPTER_MEDIA.CH01.caption_default,
    auto_surface: "opening"
  },
  P1_CH02_OPENING: {
    video_id: "P1_CH02_OPENING",
    chapter_id: "CH02",
    poster_art_key: PART1_CHAPTER_MEDIA.CH02.briefing_art_key,
    title_default: PART1_CHAPTER_MEDIA.CH02.title_default,
    subtitle_default: PART1_CHAPTER_MEDIA.CH02.subtitle_default,
    caption_default: PART1_CHAPTER_MEDIA.CH02.caption_default,
    auto_surface: "opening"
  },
  P1_CH03_OPENING: {
    video_id: "P1_CH03_OPENING",
    chapter_id: "CH03",
    poster_art_key: PART1_CHAPTER_MEDIA.CH03.briefing_art_key,
    title_default: PART1_CHAPTER_MEDIA.CH03.title_default,
    subtitle_default: PART1_CHAPTER_MEDIA.CH03.subtitle_default,
    caption_default: PART1_CHAPTER_MEDIA.CH03.caption_default,
    auto_surface: "opening"
  },
  P1_CH04_OPENING: {
    video_id: "P1_CH04_OPENING",
    chapter_id: "CH04",
    poster_art_key: PART1_CHAPTER_MEDIA.CH04.briefing_art_key,
    title_default: PART1_CHAPTER_MEDIA.CH04.title_default,
    subtitle_default: PART1_CHAPTER_MEDIA.CH04.subtitle_default,
    caption_default: PART1_CHAPTER_MEDIA.CH04.caption_default,
    auto_surface: "opening"
  },
  P1_CH05_OPENING: {
    video_id: "P1_CH05_OPENING",
    chapter_id: "CH05",
    poster_art_key: PART1_CHAPTER_MEDIA.CH05.briefing_art_key,
    title_default: PART1_CHAPTER_MEDIA.CH05.title_default,
    subtitle_default: PART1_CHAPTER_MEDIA.CH05.subtitle_default,
    caption_default: PART1_CHAPTER_MEDIA.CH05.caption_default,
    auto_surface: "opening"
  },
  P1_END_SIGNAL_KEEPERS: {
    video_id: "P1_END_SIGNAL_KEEPERS",
    chapter_id: "CH05",
    ending_id: "P1_END_SIGNAL_KEEPERS",
    poster_art_key: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.art_key,
    title_default: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.title_default,
    subtitle_default: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.subtitle_default,
    caption_default: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.caption_default,
    auto_surface: "ending"
  },
  P1_END_CONTROLLED_PASSAGE: {
    video_id: "P1_END_CONTROLLED_PASSAGE",
    chapter_id: "CH05",
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    poster_art_key: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.art_key,
    title_default: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.title_default,
    subtitle_default: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.subtitle_default,
    caption_default: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.caption_default,
    auto_surface: "ending"
  },
  P1_END_SMUGGLER_TIDE: {
    video_id: "P1_END_SMUGGLER_TIDE",
    chapter_id: "CH05",
    ending_id: "P1_END_SMUGGLER_TIDE",
    poster_art_key: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.art_key,
    title_default: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.title_default,
    subtitle_default: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.subtitle_default,
    caption_default: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.caption_default,
    auto_surface: "ending"
  },
  P1_END_ASHEN_ESCAPE: {
    video_id: "P1_END_ASHEN_ESCAPE",
    chapter_id: "CH05",
    ending_id: "P1_END_ASHEN_ESCAPE",
    poster_art_key: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.art_key,
    title_default: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.title_default,
    subtitle_default: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.subtitle_default,
    caption_default: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.caption_default,
    auto_surface: "ending"
  },
  P1_END_MIRROR_WITNESS: {
    video_id: "P1_END_MIRROR_WITNESS",
    chapter_id: "CH05",
    ending_id: "P1_END_MIRROR_WITNESS",
    poster_art_key: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.art_key,
    title_default: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.title_default,
    subtitle_default: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.subtitle_default,
    caption_default: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.caption_default,
    auto_surface: "ending"
  },
  P1_TRAILER_MAIN: {
    video_id: "P1_TRAILER_MAIN",
    poster_art_key: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.art_key,
    title_default: "Part 1 Trailer",
    subtitle_default: "Archive run southbound",
    caption_default: "Stored for external promotion. This trailer is not auto-surfaced in the app.",
    auto_surface: "trailer"
  }
};

export const PART1_DEFAULT_MEDIA_META: Record<string, MediaMetaDefinition> = {
  briefing_p1_ch01: {
    title: PART1_CHAPTER_MEDIA.CH01.title_default,
    subtitle: PART1_CHAPTER_MEDIA.CH01.subtitle_default,
    caption: PART1_CHAPTER_MEDIA.CH01.caption_default,
    chapter_id: "CH01"
  },
  briefing_p1_ch02: {
    title: PART1_CHAPTER_MEDIA.CH02.title_default,
    subtitle: PART1_CHAPTER_MEDIA.CH02.subtitle_default,
    caption: PART1_CHAPTER_MEDIA.CH02.caption_default,
    chapter_id: "CH02"
  },
  briefing_p1_ch03: {
    title: PART1_CHAPTER_MEDIA.CH03.title_default,
    subtitle: PART1_CHAPTER_MEDIA.CH03.subtitle_default,
    caption: PART1_CHAPTER_MEDIA.CH03.caption_default,
    chapter_id: "CH03"
  },
  briefing_p1_ch04: {
    title: PART1_CHAPTER_MEDIA.CH04.title_default,
    subtitle: PART1_CHAPTER_MEDIA.CH04.subtitle_default,
    caption: PART1_CHAPTER_MEDIA.CH04.caption_default,
    chapter_id: "CH04"
  },
  briefing_p1_ch05: {
    title: PART1_CHAPTER_MEDIA.CH05.title_default,
    subtitle: PART1_CHAPTER_MEDIA.CH05.subtitle_default,
    caption: PART1_CHAPTER_MEDIA.CH05.caption_default,
    chapter_id: "CH05"
  },
  map_p1_ch01: {
    title: "CH01 Route Map",
    subtitle: "Broadcast district lanes",
    caption: "Signal tower route, lobby breach, and rooftop fallback.",
    chapter_id: "CH01"
  },
  map_p1_ch02: {
    title: "CH02 Route Map",
    subtitle: "Flooded market lanes",
    caption: "Drainage shortcuts, trade docks, and forged checkpoint access.",
    chapter_id: "CH02"
  },
  map_p1_ch03: {
    title: "CH03 Route Map",
    subtitle: "Vertical escape grid",
    caption: "Tower floors, skybridge void, and rooftop exits.",
    chapter_id: "CH03"
  },
  map_p1_ch04: {
    title: "CH04 Route Map",
    subtitle: "Sorting belt lanes",
    caption: "Delivery tunnel access and dead sorter corridors.",
    chapter_id: "CH04"
  },
  map_p1_ch05: {
    title: "CH05 Route Map",
    subtitle: "Mirror Center approach",
    caption: "Sealed gates, archive relay, and the southbound exit lane.",
    chapter_id: "CH05"
  },
  result_p1_ch01: {
    title: "CH01 Result",
    subtitle: "Signal recovered",
    caption: "The first relay survives the rooftop fallout.",
    chapter_id: "CH01"
  },
  result_p1_ch02: {
    title: "CH02 Result",
    subtitle: "Trade lane cleared",
    caption: "The forged corridor stays open, but the debt remains.",
    chapter_id: "CH02"
  },
  result_p1_ch03: {
    title: "CH03 Result",
    subtitle: "Tower exit secured",
    caption: "The team crosses the high-rise break with the signal still intact.",
    chapter_id: "CH03"
  },
  result_p1_ch04: {
    title: "CH04 Result",
    subtitle: "Logistics belt crossed",
    caption: "Medicine and route authority move south together.",
    chapter_id: "CH04"
  },
  result_p1_ch05: {
    title: "CH05 Result",
    subtitle: "Mirror relay breached",
    caption: "The archive opens and forces the team into a final Part 1 outcome.",
    chapter_id: "CH05"
  },
  ending_p1_signal_keepers: {
    title: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.title_default,
    subtitle: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.subtitle_default,
    caption: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_SIGNAL_KEEPERS"
  },
  ending_p1_controlled_passage: {
    title: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.title_default,
    subtitle: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.subtitle_default,
    caption: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_CONTROLLED_PASSAGE"
  },
  ending_p1_smuggler_tide: {
    title: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.title_default,
    subtitle: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.subtitle_default,
    caption: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_SMUGGLER_TIDE"
  },
  ending_p1_ashen_escape: {
    title: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.title_default,
    subtitle: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.subtitle_default,
    caption: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_ASHEN_ESCAPE"
  },
  ending_p1_mirror_witness: {
    title: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.title_default,
    subtitle: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.subtitle_default,
    caption: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_MIRROR_WITNESS"
  },
  ending_thumb_p1_signal_keepers: {
    title: PART1_ENDING_MEDIA.P1_END_SIGNAL_KEEPERS.title_default,
    subtitle: "Gallery thumb",
    caption: "Preview card for Signal Keepers.",
    chapter_id: "CH05",
    ending_id: "P1_END_SIGNAL_KEEPERS"
  },
  ending_thumb_p1_controlled_passage: {
    title: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.title_default,
    subtitle: "Gallery thumb",
    caption: "Preview card for Controlled Passage.",
    chapter_id: "CH05",
    ending_id: "P1_END_CONTROLLED_PASSAGE"
  },
  ending_thumb_p1_smuggler_tide: {
    title: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.title_default,
    subtitle: "Gallery thumb",
    caption: "Preview card for Smuggler Tide.",
    chapter_id: "CH05",
    ending_id: "P1_END_SMUGGLER_TIDE"
  },
  ending_thumb_p1_ashen_escape: {
    title: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.title_default,
    subtitle: "Gallery thumb",
    caption: "Preview card for Ashen Escape.",
    chapter_id: "CH05",
    ending_id: "P1_END_ASHEN_ESCAPE"
  },
  ending_thumb_p1_mirror_witness: {
    title: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.title_default,
    subtitle: "Gallery thumb",
    caption: "Preview card for Mirror Witness.",
    chapter_id: "CH05",
    ending_id: "P1_END_MIRROR_WITNESS"
  },
  P1_CH01_OPENING: {
    title: PART1_VIDEO_REGISTRY.P1_CH01_OPENING.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_CH01_OPENING.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_CH01_OPENING.caption_default,
    chapter_id: "CH01"
  },
  P1_CH02_OPENING: {
    title: PART1_VIDEO_REGISTRY.P1_CH02_OPENING.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_CH02_OPENING.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_CH02_OPENING.caption_default,
    chapter_id: "CH02"
  },
  P1_CH03_OPENING: {
    title: PART1_VIDEO_REGISTRY.P1_CH03_OPENING.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_CH03_OPENING.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_CH03_OPENING.caption_default,
    chapter_id: "CH03"
  },
  P1_CH04_OPENING: {
    title: PART1_VIDEO_REGISTRY.P1_CH04_OPENING.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_CH04_OPENING.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_CH04_OPENING.caption_default,
    chapter_id: "CH04"
  },
  P1_CH05_OPENING: {
    title: PART1_VIDEO_REGISTRY.P1_CH05_OPENING.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_CH05_OPENING.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_CH05_OPENING.caption_default,
    chapter_id: "CH05"
  },
  P1_END_SIGNAL_KEEPERS: {
    title: PART1_VIDEO_REGISTRY.P1_END_SIGNAL_KEEPERS.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_END_SIGNAL_KEEPERS.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_END_SIGNAL_KEEPERS.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_SIGNAL_KEEPERS"
  },
  P1_END_CONTROLLED_PASSAGE: {
    title: PART1_VIDEO_REGISTRY.P1_END_CONTROLLED_PASSAGE.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_END_CONTROLLED_PASSAGE.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_END_CONTROLLED_PASSAGE.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_CONTROLLED_PASSAGE"
  },
  P1_END_SMUGGLER_TIDE: {
    title: PART1_VIDEO_REGISTRY.P1_END_SMUGGLER_TIDE.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_END_SMUGGLER_TIDE.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_END_SMUGGLER_TIDE.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_SMUGGLER_TIDE"
  },
  P1_END_ASHEN_ESCAPE: {
    title: PART1_VIDEO_REGISTRY.P1_END_ASHEN_ESCAPE.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_END_ASHEN_ESCAPE.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_END_ASHEN_ESCAPE.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_ASHEN_ESCAPE"
  },
  P1_END_MIRROR_WITNESS: {
    title: PART1_VIDEO_REGISTRY.P1_END_MIRROR_WITNESS.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_END_MIRROR_WITNESS.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_END_MIRROR_WITNESS.caption_default,
    chapter_id: "CH05",
    ending_id: "P1_END_MIRROR_WITNESS"
  },
  P1_TRAILER_MAIN: {
    title: PART1_VIDEO_REGISTRY.P1_TRAILER_MAIN.title_default,
    subtitle: PART1_VIDEO_REGISTRY.P1_TRAILER_MAIN.subtitle_default,
    caption: PART1_VIDEO_REGISTRY.P1_TRAILER_MAIN.caption_default
  }
};

export function getPart1ChapterMedia(chapterId?: ChapterId): Part1ChapterMediaDefinition | undefined {
  if (!chapterId) {
    return undefined;
  }

  return PART1_CHAPTER_MEDIA[chapterId];
}

export function getPart1EndingMedia(endingId?: EndingId): Part1EndingMediaDefinition | undefined {
  if (!endingId) {
    return undefined;
  }

  return PART1_ENDING_MEDIA[endingId];
}

export function getPart1VideoRegistryEntry(videoId?: string | null): VideoRegistryEntry | undefined {
  if (!videoId) {
    return undefined;
  }

  return PART1_VIDEO_REGISTRY[videoId];
}

export function getDefaultMediaMeta(id?: string | null): MediaMetaDefinition | undefined {
  if (!id) {
    return undefined;
  }

  return PART1_DEFAULT_MEDIA_META[id];
}

export const getPart1DefaultMediaMeta = getDefaultMediaMeta;
