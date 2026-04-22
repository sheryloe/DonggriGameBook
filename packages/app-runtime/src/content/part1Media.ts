import type {
  ChapterId,
  EndingId,
  MediaMetaDefinition,
  VideoRegistryEntry
} from "../types/game";
import { getChapterCatalogEntry, getChapterRuntimeConfig } from "@donggrol/world-registry";

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

type Part1EndingId = Extract<EndingId, `P1_${string}`>;

export const PART1_CHAPTER_MEDIA: Record<ChapterId, Part1ChapterMediaDefinition> = {
  CH01: {
    chapter_id: "CH01",
    briefing_art_key: "briefing_p1_ch01",
    map_art_key: "map_p1_ch01",
    result_art_key: "result_p1_ch01",
    opening_video_id: "P1_CH01_OPENING",
    title_default: "잿빛 개장",
    subtitle_default: "여의도 신호 회수",
    caption_default: "잿빛 방송지구 위로 첫 릴레이 호출이 다시 올라온다."
  },
  CH02: {
    chapter_id: "CH02",
    briefing_art_key: "briefing_p1_ch02",
    map_art_key: "map_p1_ch02",
    result_art_key: "result_p1_ch02",
    opening_video_id: "P1_CH02_OPENING",
    title_default: "검은 수로",
    subtitle_default: "노량진 압력 구간",
    caption_default: "위조 경로가 먼저 지배한 침수 교역 회랑으로 팀이 진입한다."
  },
  CH03: {
    chapter_id: "CH03",
    briefing_art_key: "briefing_p1_ch03",
    map_art_key: "map_p1_ch03",
    result_art_key: "result_p1_ch03",
    opening_video_id: "P1_CH03_OPENING",
    title_default: "유리정원",
    subtitle_default: "잠실 수직 타워 돌파",
    caption_default: "유리와 신호선이 동시에 끊기기 전까지 모든 층은 안전해 보인다."
  },
  CH04: {
    chapter_id: "CH04",
    briefing_art_key: "briefing_p1_ch04",
    map_art_key: "map_p1_ch04",
    result_art_key: "result_p1_ch04",
    opening_video_id: "P1_CH04_OPENING",
    title_default: "상자들의 도시",
    subtitle_default: "탄천 물류 벨트",
    caption_default: "약품, 인증 배지, 위조 접근권이 죽은 분류 회랑에서 충돌한다."
  },
  CH05: {
    chapter_id: "CH05",
    briefing_art_key: "briefing_p1_ch05",
    map_art_key: "map_p1_ch05",
    result_art_key: "result_p1_ch05",
    opening_video_id: "P1_CH05_OPENING",
    title_default: "미러센터",
    subtitle_default: "판교 봉인 코어",
    caption_default: "중계 기록고가 열리며 구조가 언제나 선별이었음을 드러낸다."
  }
};

export const PART1_ENDING_MEDIA: Record<Part1EndingId, Part1EndingMediaDefinition> = {
  P1_END_SIGNAL_KEEPERS: {
    ending_id: "P1_END_SIGNAL_KEEPERS",
    art_key: "ending_p1_signal_keepers",
    thumb_key: "ending_thumb_p1_signal_keepers",
    video_id: "P1_END_SIGNAL_KEEPERS",
    title_default: "신호 보관자",
    subtitle_default: "기록 보존, 남하 개시",
    caption_default: "신호 기록을 지켜낸 채 남하를 시작하지만, 선택의 무게는 그대로 남는다."
  },
  P1_END_CONTROLLED_PASSAGE: {
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    art_key: "ending_p1_controlled_passage",
    thumb_key: "ending_thumb_p1_controlled_passage",
    video_id: "P1_END_CONTROLLED_PASSAGE",
    title_default: "통제된 통로",
    subtitle_default: "질서 우선, 진실 유예",
    caption_default: "통로는 안정됐지만 전체 기록은 봉인된 문 뒤에 남겨진다."
  },
  P1_END_SMUGGLER_TIDE: {
    ending_id: "P1_END_SMUGGLER_TIDE",
    art_key: "ending_p1_smuggler_tide",
    thumb_key: "ending_thumb_p1_smuggler_tide",
    video_id: "P1_END_SMUGGLER_TIDE",
    title_default: "밀항의 파도",
    subtitle_default: "위조 수로 탈출",
    caption_default: "공식 경로를 부수고 살아남았지만 팀의 신뢰도 함께 침하한다."
  },
  P1_END_ASHEN_ESCAPE: {
    ending_id: "P1_END_ASHEN_ESCAPE",
    art_key: "ending_p1_ashen_escape",
    thumb_key: "ending_thumb_p1_ashen_escape",
    video_id: "P1_END_ASHEN_ESCAPE",
    title_default: "잿빛 탈출",
    subtitle_default: "증거 없는 생존",
    caption_default: "길은 남았지만 증거와 구조선은 재가 되어 무너진다."
  },
  P1_END_MIRROR_WITNESS: {
    ending_id: "P1_END_MIRROR_WITNESS",
    art_key: "ending_p1_mirror_witness",
    thumb_key: "ending_thumb_p1_mirror_witness",
    video_id: "P1_END_MIRROR_WITNESS",
    title_default: "거울의 증인",
    subtitle_default: "완전한 진실, 더 무거운 추격",
    caption_default: "숨겨진 기록 묶음을 들고 나간 대가로 더 큰 추격을 감수한다."
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
    title_default: "파트 1 트레일러",
    subtitle_default: "기록고 남하 작전",
    caption_default: "외부 홍보용 트레일러입니다. 앱에서는 자동 노출되지 않습니다.",
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
    title: "CH01 경로 지도",
    subtitle: "방송지구 이동선",
    caption: "신호탑 접근, 로비 돌파, 옥상 우회 경로를 보여준다.",
    chapter_id: "CH01"
  },
  map_p1_ch02: {
    title: "CH02 경로 지도",
    subtitle: "침수 시장 이동선",
    caption: "배수 지름길, 교역 부두, 위조 검문 접근 경로를 보여준다.",
    chapter_id: "CH02"
  },
  map_p1_ch03: {
    title: "CH03 경로 지도",
    subtitle: "수직 탈출 격자",
    caption: "타워 층별 동선, 스카이브리지 공백, 옥상 탈출선을 보여준다.",
    chapter_id: "CH03"
  },
  map_p1_ch04: {
    title: "CH04 경로 지도",
    subtitle: "분류 벨트 이동선",
    caption: "배송 터널 접근과 폐쇄 분류 회랑 경로를 보여준다.",
    chapter_id: "CH04"
  },
  map_p1_ch05: {
    title: "CH05 경로 지도",
    subtitle: "미러센터 접근선",
    caption: "봉인 게이트, 기록고 중계, 남하 탈출선 위치를 보여준다.",
    chapter_id: "CH05"
  },
  result_p1_ch01: {
    title: "CH01 결과",
    subtitle: "신호 회수",
    caption: "옥상 붕괴 이후에도 첫 릴레이는 살아남았다.",
    chapter_id: "CH01"
  },
  result_p1_ch02: {
    title: "CH02 결과",
    subtitle: "교역 동선 확보",
    caption: "위조 회랑은 열렸지만 그 대가는 끝까지 남는다.",
    chapter_id: "CH02"
  },
  result_p1_ch03: {
    title: "CH03 결과",
    subtitle: "타워 이탈 성공",
    caption: "신호를 지킨 채 고층 붕괴 구간을 넘어섰다.",
    chapter_id: "CH03"
  },
  result_p1_ch04: {
    title: "CH04 결과",
    subtitle: "물류 벨트 돌파",
    caption: "약품과 경로 주도권을 묶어 남하로 넘긴다.",
    chapter_id: "CH04"
  },
  result_p1_ch05: {
    title: "CH05 결과",
    subtitle: "미러 중계 돌파",
    caption: "기록고가 열리며 파트1 최종 결말이 고정된다.",
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
    subtitle: "갤러리 썸네일",
    caption: "신호 보관자 결말 미리보기 카드.",
    chapter_id: "CH05",
    ending_id: "P1_END_SIGNAL_KEEPERS"
  },
  ending_thumb_p1_controlled_passage: {
    title: PART1_ENDING_MEDIA.P1_END_CONTROLLED_PASSAGE.title_default,
    subtitle: "갤러리 썸네일",
    caption: "통제된 통로 결말 미리보기 카드.",
    chapter_id: "CH05",
    ending_id: "P1_END_CONTROLLED_PASSAGE"
  },
  ending_thumb_p1_smuggler_tide: {
    title: PART1_ENDING_MEDIA.P1_END_SMUGGLER_TIDE.title_default,
    subtitle: "갤러리 썸네일",
    caption: "밀항의 파도 결말 미리보기 카드.",
    chapter_id: "CH05",
    ending_id: "P1_END_SMUGGLER_TIDE"
  },
  ending_thumb_p1_ashen_escape: {
    title: PART1_ENDING_MEDIA.P1_END_ASHEN_ESCAPE.title_default,
    subtitle: "갤러리 썸네일",
    caption: "잿빛 탈출 결말 미리보기 카드.",
    chapter_id: "CH05",
    ending_id: "P1_END_ASHEN_ESCAPE"
  },
  ending_thumb_p1_mirror_witness: {
    title: PART1_ENDING_MEDIA.P1_END_MIRROR_WITNESS.title_default,
    subtitle: "갤러리 썸네일",
    caption: "거울의 증인 결말 미리보기 카드.",
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

const PART_ENDING_CHAPTER: Record<string, ChapterId> = {
  P1: "CH05",
  P2: "CH10",
  P3: "CH15",
  P4: "CH20"
};

const SURFACE_LABELS: Record<string, string> = {
  briefing: "브리핑",
  map: "경로 보드",
  result: "결과",
  ending: "엔딩",
  ending_thumb: "엔딩 카드"
};

function titleCaseToken(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function formatEndingSlug(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map(titleCaseToken)
    .join(" ");
}

function inferChapterSurfaceMeta(id: string): MediaMetaDefinition | undefined {
  const match = /^(briefing|map|result)_p([1-4])_(ch\d{2})$/iu.exec(id);
  if (!match) {
    return undefined;
  }

  const [, surfaceKey, partNo, rawChapterId] = match;
  const chapterId = rawChapterId.toUpperCase() as ChapterId;
  const chapterTitle = getChapterCatalogEntry(chapterId)?.title ?? chapterId;
  const surfaceLabel = SURFACE_LABELS[surfaceKey] ?? titleCaseToken(surfaceKey);

  return {
    title: `${chapterId} ${surfaceLabel}`,
    subtitle: `파트 ${partNo} · ${chapterTitle}`,
    caption: `${chapterId} ${surfaceLabel} 화면 비주얼입니다.`,
    chapter_id: chapterId
  };
}

function inferEndingSurfaceMeta(id: string): MediaMetaDefinition | undefined {
  const match = /^(ending|ending_thumb)_p([1-4])_(.+)$/iu.exec(id);
  if (!match) {
    return undefined;
  }

  const [, surfaceKey, partNo, endingSlug] = match;
  const partId = `P${partNo}`;
  const chapterId = PART_ENDING_CHAPTER[partId];
  const surfaceLabel = SURFACE_LABELS[surfaceKey] ?? "엔딩";
  const endingTitle = formatEndingSlug(endingSlug);

  return {
    title: endingTitle,
    subtitle: `파트 ${partNo} · ${surfaceLabel}`,
    caption: `${endingTitle} 결말 비주얼입니다.`,
    chapter_id: chapterId,
    ending_id: `${partId}_END_${endingSlug.toUpperCase()}` as EndingId
  };
}

function inferVideoMeta(id: string): MediaMetaDefinition | undefined {
  const openingMatch = /^P([1-4])_(CH\d{2})_OPENING$/u.exec(id);
  if (openingMatch) {
    const [, partNo, rawChapterId] = openingMatch;
    const chapterId = rawChapterId as ChapterId;
    const chapterTitle = getChapterCatalogEntry(chapterId)?.title ?? chapterId;
    return {
      title: `${chapterId} 오프닝`,
      subtitle: `파트 ${partNo} · ${chapterTitle}`,
      caption: `${chapterId} 오프닝 시네마틱 화면입니다.`,
      chapter_id: chapterId
    };
  }

  const endingMatch = /^P([2-4])_END_(.+)$/u.exec(id);
  if (!endingMatch) {
    return undefined;
  }

  const [, partNo, endingSlug] = endingMatch;
  const partId = `P${partNo}`;
  return {
    title: formatEndingSlug(endingSlug),
    subtitle: `파트 ${partNo} · 엔딩 영상`,
    caption: `${formatEndingSlug(endingSlug)} 엔딩 시네마틱 화면입니다.`,
    chapter_id: PART_ENDING_CHAPTER[partId],
    ending_id: `${partId}_END_${endingSlug.toUpperCase()}` as EndingId
  };
}

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

  return PART1_ENDING_MEDIA[endingId as Part1EndingId];
}

export function getPart1VideoRegistryEntry(videoId?: string | null): VideoRegistryEntry | undefined {
  if (!videoId) {
    return undefined;
  }

  const direct = PART1_VIDEO_REGISTRY[videoId];
  if (direct) {
    return direct;
  }

  const openingMatch = /^P([2-4])_(CH\d{2})_OPENING$/u.exec(videoId);
  if (openingMatch) {
    const [, partNo, chapterId] = openingMatch;
    const posterArtKey = getChapterRuntimeConfig(chapterId)?.default_art_key ?? `opening_${chapterId.toLowerCase()}_poster`;
    return {
      video_id: videoId,
      chapter_id: chapterId as ChapterId,
      poster_art_key: posterArtKey,
      title_default: `${chapterId} 오프닝`,
      subtitle_default: `파트 ${partNo} 시네마틱`,
      caption_default: `${chapterId} 오프닝 시네마틱(프롬프트 큐 생성본)`,
      auto_surface: "opening"
    };
  }

  const endingMatch = /^P([2-4])_END_(.+)$/u.exec(videoId);
  if (!endingMatch) {
    return undefined;
  }

  const [, partNo, endingSlug] = endingMatch;
  const partId = `P${partNo}`;
  const endingTitle = formatEndingSlug(endingSlug);
  return {
    video_id: videoId,
    chapter_id: PART_ENDING_CHAPTER[partId],
    ending_id: `${partId}_END_${endingSlug.toUpperCase()}` as EndingId,
    poster_art_key: `ending_${partId.toLowerCase()}_${endingSlug.toLowerCase()}`,
    title_default: endingTitle,
    subtitle_default: `파트 ${partNo} 엔딩 시네마틱`,
    caption_default: `${endingTitle} 엔딩 시네마틱(프롬프트 큐 생성본)`,
    auto_surface: "ending"
  };
}

export function getDefaultMediaMeta(id?: string | null): MediaMetaDefinition | undefined {
  if (!id) {
    return undefined;
  }

  return PART1_DEFAULT_MEDIA_META[id] ?? inferChapterSurfaceMeta(id) ?? inferEndingSurfaceMeta(id) ?? inferVideoMeta(id);
}

export const getPart1DefaultMediaMeta = getDefaultMediaMeta;


