import { useEffect, useMemo, useState } from "react";
import { getChapterCatalogEntry, getChapterRuntimeConfig } from "@donggrol/world-registry";
import { ArtFrame, VideoCard } from "./assets/runtimeMedia";
import { CURRENT_PART_ID } from "./app/appContext";
import { getPart1ChapterMedia } from "./content/part1Media";
import { resolveItemIconCandidates } from "./loaders/assetResolver";
import { useGameStore } from "./store/gameStore";
import type { ChapterId, EventDefinition, EventSceneBlock, GameContentPack, RuntimeSnapshot, StoryLogEntry } from "./types/game";

type ChapterResultView = {
  objective_summary: Array<{ objective_id: string; text: string; completed: boolean }>;
  quest_summary: Array<{ quest_track_id: string; title: string; status: string }>;
  notes?: string[];
  epilogue_card_ids?: string[];
};

type ExtendedRuntimeSnapshot = Omit<RuntimeSnapshot, "chapter_result_payload" | "ending_gallery" | "chapter_widgets_state"> & {
  chapter_result_payload?: ChapterResultView | null;
  ending_gallery?: Record<
    string,
    {
      ending_id: string;
      chapter_id: ChapterId;
      title: string;
      summary: string;
      hint: string;
      art_key: string;
      thumb_key: string;
      video_id?: string;
      unlocked_at?: string;
    }
  >;
  chapter_widgets_state?: Record<string, unknown> | Record<string, Record<string, unknown>>;
};

type GenericEndingCard = {
  ending_id: string;
  chapter_id: ChapterId;
  title: string;
  summary: string;
  hint: string;
  art_key: string;
  thumb_key: string;
  video_id?: string;
  unlocked: boolean;
  unlocked_at?: string;
  priority: number;
  chapter_order: number;
};

type NarrativeStress = "calm" | "warning" | "critical" | "combat";
type NarrativeTone = "default" | "memory" | "terminal" | "cinematic" | "panic" | "aftershock";

type EpilogueCardDefinition = {
  eyebrow: string;
  title: string;
  body: string;
};

const EPILOGUE_CARD_LIBRARY: Record<string, EpilogueCardDefinition> = {
  p1_writer_log: {
    eyebrow: "기록 잔향",
    title: "젖은 원고의 이름",
    body: "편집실에서 건져 올린 한 장의 원고가 다음 장 검문선에서도 끝내 지워지지 않는 이름이 된다."
  },
  p1_blackwater_child: {
    eyebrow: "생존 비용",
    title: "수로 난간의 아이",
    body: "한 칸의 배와 한 줌의 식량 때문에 난간 바깥에 남겨진 아이의 얼굴이 이후 모든 거래를 더럽힌다."
  },
  p1_crate_city_manifest: {
    eyebrow: "분류 기억",
    title: "상자와 사람의 명단",
    body: "사람보다 상자를 먼저 살린 기록, 혹은 상자를 버리고 사람을 끌어낸 기록이 이후 데이터 공개의 기준선으로 남는다."
  },
  p1_kim_ara_confession: {
    eyebrow: "고백 잔향",
    title: "김아라의 문장",
    body: "희망과 위험을 동시에 여는 문장을 김아라가 끝내 입 밖으로 꺼낸 순간부터, 모든 검문은 그 말을 기준으로 흔들린다."
  },
  p2_queue_17: {
    eyebrow: "대기열 기억",
    title: "17번 손목띠",
    body: "승선권보다 먼저 손목띠 번호가 기억나는 순간, 질서는 더 이상 중립적인 절차가 아니게 된다."
  },
  p2_red_corridor_wall: {
    eyebrow: "회랑 잔상",
    title: "벽에 적힌 이름",
    body: "지나간 사람보다 벽에 남은 이름이 더 오래 눈에 밟히는 회랑에서는 탈출도 죄책감의 형식이 된다."
  },
  p2_dead_office_stamp: {
    eyebrow: "행정 공포",
    title: "죽은 인장기",
    body: "통과, 반송, 폐기를 찍던 죽은 인장기가 살아 있는 얼굴을 마지막까지 사물처럼 다룬다."
  },
  p2_smoke_hold_child: {
    eyebrow: "적재 대가",
    title: "연기 속 보호자",
    body: "좌석 하나와 배터리 한 칸 때문에 끝내 같이 타지 못한 보호자와 아이의 표정이 침하 항만의 진짜 결과가 된다."
  },
  p2_sunken_list: {
    eyebrow: "부두 후일담",
    title: "가라앉은 명단",
    body: "젖은 명단에 남은 잉크와 사라진 이름의 간격이 북상 작전 전체를 불신의 문장으로 바꾼다."
  },
  p3_fog_rail_band: {
    eyebrow: "격리 표식",
    title: "안개 속 밴드",
    body: "누가 어느 차선으로 먼저 밀려 들어갔는지보다, 어떤 밴드가 끝내 닫힌 문 앞에 남았는지가 기억된다."
  },
  p3_bias_station_missing: {
    eyebrow: "장부 훼손",
    title: "지워진 실종자",
    body: "편향 기지의 조작 장부는 숫자보다 먼저 특정 실종자 한 명의 부재를 드러내며 제도 전체를 무너뜨린다."
  },
  p3_white_record_child: {
    eyebrow: "냉동 기록",
    title: "백색 보관 슬롯",
    body: "약품보다 먼저 이름표가 보이던 냉동 선반에서는 누구를 살릴지보다 누구를 기록할지가 더 잔인한 질문이 된다."
  },
  p3_switch_chair: {
    eyebrow: "희생 최고점",
    title: "스위치 옆 빈 의자",
    body: "불이 꺼지지 않게 만들기 위해 끝내 비워진 그 자리 하나가 3부 전체의 감정 결산으로 남는다."
  },
  p3_relay_last_lamp: {
    eyebrow: "중계 잔광",
    title: "마지막 램프",
    body: "끝까지 깜빡이던 중계 램프 하나가 누가 버텼고 누가 뒤로 밀렸는지보다 더 오랫동안 눈에 남는다."
  },
  p4_tool_bag: {
    eyebrow: "상실 잔향",
    title: "안보경의 공구 가방",
    body: "주인을 잃은 공구 가방은 4부 내내 누가 역할을 대신 떠맡았는지 조용히 증명하는 유품이 된다."
  },
  p4_hearing_back_row: {
    eyebrow: "청문 잔상",
    title: "불리지 않은 뒤줄",
    body: "질문을 받지 못한 사람들의 뒤줄이 가장 또렷한 얼굴로 남을 때, 공개 심판은 제도보다 군중의 상처가 된다."
  },
  p4_verdict_band: {
    eyebrow: "판결 초안",
    title: "손목 밴드 묶음",
    body: "외해 전초에서 한데 묶인 손목 밴드들은 누가 남겨지고 무엇이 지워질지를 이미 문장처럼 잠가 버린다."
  },
  p4_last_recipient: {
    eyebrow: "마지막 수신자",
    title: "끝내 닿은 한 사람",
    body: "모든 사람을 태우진 못했어도, 마지막 메시지를 끝내 받아 든 한 사람의 표정이 판결의 인간적 잔여물이 된다."
  },
  p4_sealed_record: {
    eyebrow: "봉인 기록",
    title: "열리지 않은 보관실",
    body: "밖으로 꺼내지 못한 기록은 죄가 아니라 무게로 남고, 모두는 그 무게를 알고도 다음 공동체를 시작해야 한다."
  },
  p4_gate_outer_names: {
    eyebrow: "게이트 바깥",
    title: "문턱 밖 이름들",
    body: "최종 게이트는 버텼거나 무너졌어도, 끝내 번호를 받지 못한 이름들이야말로 결말의 진짜 얼굴로 남는다."
  }
};

function formatDateTime(input?: string): string {
  if (!input) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(input));
}

function toExtendedRuntime(runtime: RuntimeSnapshot): ExtendedRuntimeSnapshot {
  return runtime as ExtendedRuntimeSnapshot;
}

function buildEndingAssetStem(endingId: string): string {
  return endingId.toLowerCase().replace(/_end_/u, "_");
}

function buildEndingArtKey(endingId: string): string {
  return `ending_${buildEndingAssetStem(endingId)}`;
}

function buildEndingThumbKey(endingId: string): string {
  return `ending_thumb_${buildEndingAssetStem(endingId)}`;
}

function buildEndingVideoId(endingId: string): string | undefined {
  return endingId.startsWith("P1_") ? endingId : undefined;
}

function getItemDisplayName(content: GameContentPack, itemId: string): string {
  const item = content.items[itemId];
  return item?.name_ko ?? item?.name_en ?? itemId;
}

function buildItemIconFallbackLabel(name: string): string {
  const compact = name.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  if (!compact) {
    return "--";
  }

  const tokens = compact.split(/\s+/u).filter(Boolean);
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0] ?? ""}${tokens[1][0] ?? ""}`.toUpperCase();
}

function ItemIcon({ content, itemId }: { content: GameContentPack; itemId: string }) {
  const itemName = useMemo(() => getItemDisplayName(content, itemId), [content, itemId]);
  const fallbackLabel = useMemo(() => buildItemIconFallbackLabel(itemName), [itemName]);
  const candidates = useMemo(() => resolveItemIconCandidates(itemId), [itemId]);
  const [failedCandidates, setFailedCandidates] = useState<string[]>([]);

  useEffect(() => {
    setFailedCandidates([]);
  }, [itemId]);

  const src = candidates.find((candidate) => !failedCandidates.includes(candidate));

  if (!src) {
    return (
      <span className="item-icon" aria-label={itemName}>
        {fallbackLabel}
      </span>
    );
  }

  return (
    <span className="item-icon">
      <img
        src={src}
        alt={`${itemName} icon`}
        loading="lazy"
        onError={() =>
          setFailedCandidates((current) => (current.includes(src) ? current : [...current, src]))
        }
      />
    </span>
  );
}

function buildFallbackEndingCard(
  endingId: string,
  chapterId: ChapterId,
  unlockedAt?: string,
  title?: string,
  summary?: string,
  hint?: string,
  artKey?: string,
  thumbKey?: string,
  videoId?: string,
  priority = 0,
  chapterOrder = Number.MAX_SAFE_INTEGER
): GenericEndingCard {
  const defaultTitle = "정리 중인 결말";

  return {
    ending_id: endingId,
    chapter_id: chapterId,
    title: title ?? defaultTitle,
    summary: summary ?? "해금된 결말 기록을 아직 정리 중입니다.",
    hint: hint ?? "이 결말 경로는 추가 기록과 함께 순차적으로 정리됩니다.",
    art_key: artKey ?? buildEndingArtKey(endingId),
    thumb_key: thumbKey ?? buildEndingThumbKey(endingId),
    video_id: videoId ?? buildEndingVideoId(endingId),
    unlocked: Boolean(unlockedAt),
    unlocked_at: unlockedAt,
    priority,
    chapter_order: chapterOrder
  };
}

function collectPartEndingCards(content: GameContentPack, partId: string, unlockedEndings: RuntimeSnapshot["unlocked_endings"], runtime?: RuntimeSnapshot): GenericEndingCard[] {
  const extendedRuntime = runtime ? toExtendedRuntime(runtime) : null;
  const endingGallery = extendedRuntime?.ending_gallery ?? {};
  const unlockedMap = unlockedEndings as Record<string, string | undefined>;
  const partChapterIds = content.chapter_order.filter((chapterId) => getChapterCatalogEntry(chapterId)?.part_id === partId);
  const chapterOrderMap = new Map(partChapterIds.map((chapterId, index) => [chapterId, index]));
  const cards = new Map<string, GenericEndingCard>();

  const upsert = (card: GenericEndingCard) => {
    const existing = cards.get(card.ending_id);
    if (!existing) {
      cards.set(card.ending_id, card);
      return;
    }

    cards.set(card.ending_id, {
      ...existing,
      ...card,
      unlocked: existing.unlocked || card.unlocked,
      unlocked_at: existing.unlocked_at ?? card.unlocked_at,
      video_id: existing.video_id ?? card.video_id,
      priority: Math.max(existing.priority, card.priority),
      chapter_order: Math.min(existing.chapter_order, card.chapter_order)
    });
  };

  for (const chapterId of partChapterIds) {
    const chapter = content.chapters[chapterId];
    for (const rule of chapter.ending_matrix) {
      const registryEntry = endingGallery[rule.ending_id];
      const unlockedAt = registryEntry?.unlocked_at ?? unlockedMap[rule.ending_id];
      upsert(
        buildFallbackEndingCard(
          rule.ending_id,
          chapterId,
          unlockedAt,
          registryEntry?.title ?? rule.title,
          registryEntry?.summary ?? rule.summary,
          registryEntry?.hint ?? rule.hint,
          registryEntry?.art_key,
          registryEntry?.thumb_key,
          registryEntry?.video_id,
          Number(rule.priority ?? 0),
          chapterOrderMap.get(chapterId) ?? Number.MAX_SAFE_INTEGER
        )
      );
    }
  }

  for (const [endingId, registryEntry] of Object.entries(endingGallery)) {
    if (getChapterCatalogEntry(registryEntry.chapter_id)?.part_id !== partId) {
      continue;
    }
    upsert(
      buildFallbackEndingCard(
        endingId,
        registryEntry.chapter_id,
        registryEntry.unlocked_at ?? unlockedMap[endingId],
        registryEntry.title,
        registryEntry.summary,
        registryEntry.hint,
        registryEntry.art_key,
        registryEntry.thumb_key,
        registryEntry.video_id,
        0,
        chapterOrderMap.get(registryEntry.chapter_id) ?? Number.MAX_SAFE_INTEGER
      )
    );
  }

  for (const [endingId, unlockedAt] of Object.entries(unlockedMap)) {
    if (!endingId.startsWith(`${partId}_`)) {
      continue;
    }

    upsert(
      buildFallbackEndingCard(
        endingId,
        (extendedRuntime?.chapter_result_payload && "chapter_id" in extendedRuntime.chapter_result_payload
          ? (extendedRuntime.chapter_result_payload as unknown as { chapter_id?: ChapterId }).chapter_id
          : runtime?.current_chapter_id) ?? (partChapterIds[partChapterIds.length - 1] ?? runtime?.current_chapter_id ?? "CH01"),
        unlockedAt
      )
    );
  }

  return [...cards.values()].sort((left, right) => {
    if (left.chapter_order !== right.chapter_order) {
      return left.chapter_order - right.chapter_order;
    }
    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }
    return left.title.localeCompare(right.title, "ko-KR");
  });
}

function getEndingCardById(content: GameContentPack, endingId: string, unlockedAt?: string, fallbackChapterId?: ChapterId, runtime?: RuntimeSnapshot): GenericEndingCard {
  const partIdMatch = /^(P\d+)_/u.exec(endingId);
  const partId = partIdMatch?.[1] ?? CURRENT_PART_ID;
  const cards = collectPartEndingCards(content, partId, runtime?.unlocked_endings ?? {}, runtime);
  return (
    cards.find((card) => card.ending_id === endingId) ??
    buildFallbackEndingCard(endingId, fallbackChapterId ?? runtime?.current_chapter_id ?? "CH01", unlockedAt)
  );
}

function StatBar({ label, value, maxValue, tone }: { label: string; value: number; maxValue: number; tone?: "warning" | "danger" }) {
  const percentage = Math.max(0, Math.min(100, (value / Math.max(maxValue, 1)) * 100));
  return (
    <div className={`stat-bar ${tone ? `stat-bar-${tone}` : ""}`}>
      <div className="stat-bar-head">
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

const WIDGET_LABELS: Record<string, string> = {
  objective_panel: "목표 진행",
  party_summary: "파티 상태",
  noise_meter: "소음",
  contamination_meter: "오염도",
  water_depth: "수심",
  water_level: "수위",
  route_compare: "노선 비교",
  route_summary: "노선 요약",
  route_hint: "노선 힌트",
  reputation_change: "평판 변화",
  trust_summary: "신뢰 요약",
  loot_summary: "루팅 요약",
  faction_summary: "세력 요약",
  ending_matrix: "결말 매트릭스",
  field_actions_remaining: "현장 행동",
  warning_count: "경고",
  card_auth_state: "카드 인증",
  access_key_state: "접근 키",
  heat_meter: "열지수",
  queue_pressure: "대기열 압력",
  pursuit_meter: "추적 지수",
  smoke_density: "연기 농도",
  boarding_capacity: "승선 여력",
  stamp_auth: "도장 인증",
  checkpoint_auth: "검문 인증",
  signal_decoder: "신호 해독",
  evidence_balance: "증거 균형",
  power_router: "전력 라우터",
  sacrifice_state: "희생 상태",
  core_state: "핵심 상태",
  boss_hp: "보스 체력",
  chapter_result: "챕터 결과",
  public_queue: "공개 대기열",
  broadcast_prep: "방송 준비",
  platform_vote: "플랫폼 표결",
  next_part_hook: "다음 파트 연결",
  closing_hook: "마무리 연결"
};

const PRESENTATION_ONLY_WIDGETS = new Set([
  "map_overlay",
  "event_card",
  "choice_list",
  "npc_portrait",
  "loot_grid",
  "boss_splash",
  "combat_hud",
  "ending_gallery",
  "ending_grid",
  "ending_thumb",
  "ending_summary",
  "ending_key_art",
  "boss_hint",
  "signal_noise_overlay",
  "rarity_badge"
]);

const NODE_TYPE_LABELS: Record<string, string> = {
  travel: "이동",
  safehouse: "은신처",
  exploration: "탐색",
  branch: "분기",
  boss: "보스",
  route_select: "노선 선택"
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  briefing: "브리핑",
  choice: "선택",
  combat: "전투",
  result: "결과"
};

const SCREEN_TYPE_LABELS: Record<string, string> = {
  chapter_briefing: "챕터 브리핑",
  world_map: "월드 맵",
  event_dialogue: "이벤트 대화",
  loot_resolution: "루팅 정산",
  boss_intro: "보스 인트로",
  combat_arena: "전투 구역",
  result_summary: "결과 요약",
  route_select: "노선 선택",
  safehouse: "은신처",
  ending_gallery: "엔딩 갤러리"
};

const VALUE_LABELS: Record<string, string> = {
  on: "켜짐",
  off: "꺼짐",
  unassigned: "미지정",
  silence: "침묵",
  witness: "증언",
  witness_score: "증언",
  public: "공개",
  pragmatic: "실리",
  rescue: "구조",
  lock: "봉쇄",
  release: "개방",
  clean: "비개입",
  broker: "브로커",
  log: "기록",
  order_score: "질서",
  solidarity_score: "연대",
  locked: "잠김",
  active: "활성",
  completed: "완료"
};

function formatWidgetLabel(widgetId: string): string {
  if (WIDGET_LABELS[widgetId]) {
    return WIDGET_LABELS[widgetId];
  }

  return widgetId
    .replace(/_/gu, " ")
    .replace(/\./gu, " ")
    .trim();
}

function stringifyWidgetValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "켜짐" : "꺼짐";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  if (typeof value === "string") {
    return VALUE_LABELS[value] ?? value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "-";
}

function formatNodeTypeLabel(nodeType: string): string {
  return NODE_TYPE_LABELS[nodeType] ?? nodeType.replace(/[_-]/gu, " ");
}

function formatEyebrowLabel(eventType?: string, screenType?: string): string {
  if (eventType) {
    return EVENT_TYPE_LABELS[eventType] ?? eventType;
  }

  if (screenType) {
    return SCREEN_TYPE_LABELS[screenType] ?? screenType;
  }

  return "현장";
}

const UI_WIDGET_LABELS: Record<string, string> = {
  objective_panel: "목표 진행",
  party_summary: "파티 상태",
  noise_meter: "소음",
  contamination_meter: "오염도",
  water_depth: "수심",
  water_level: "수위",
  route_compare: "노선 비교",
  route_summary: "노선 요약",
  route_hint: "노선 힌트",
  reputation_change: "평판 변화",
  trust_summary: "신뢰 요약",
  loot_summary: "루팅 요약",
  faction_summary: "세력 요약",
  ending_matrix: "결말 매트릭스",
  field_actions_remaining: "현장 행동",
  warning_count: "경고",
  card_auth_state: "카드 인증",
  access_key_state: "접근 키",
  heat_meter: "열지수",
  queue_pressure: "대기열 압력",
  pursuit_meter: "추적 지수",
  smoke_density: "연기 농도",
  boarding_capacity: "승선 여력",
  stamp_auth: "도장 인증",
  checkpoint_auth: "검문 인증",
  signal_decoder: "신호 해독",
  evidence_balance: "증거 균형",
  power_router: "전력 라우터",
  sacrifice_state: "희생 상태",
  core_state: "핵심 상태",
  boss_hp: "보스 체력",
  chapter_result: "챕터 결과",
  public_queue: "공개 대기열",
  broadcast_prep: "방송 준비",
  platform_vote: "플랫폼 표결",
  next_part_hook: "다음 파트 연결",
  closing_hook: "마무리 연결"
};

const UI_PRESENTATION_ONLY_WIDGETS = new Set([
  "arena_tags",
  "capacity_meter",
  "compare_popup",
  "dialogue_box",
  "faction_compare",
  "fall_warning",
  "filter_meter",
  "floor_navigator",
  "hazard_overlay",
  "line_status",
  "loot_preview",
  "node_map",
  "party_loadout",
  "recommended_gear",
  "trade_panel",
  "water_warning",
  "wet_item_badge"
]);

const UI_NODE_TYPE_LABELS: Record<string, string> = {
  travel: "이동",
  safehouse: "은신처",
  exploration: "탐색",
  branch: "분기",
  boss: "보스",
  route_select: "노선 선택"
};

const UI_EVENT_TYPE_LABELS: Record<string, string> = {
  briefing: "브리핑",
  choice: "선택",
  combat: "전투",
  result: "결과",
  exploration: "탐색",
  dialogue: "대화",
  danger: "위험",
  scene: "장면",
  boss: "보스",
  extraction: "이탈"
};

const UI_SCREEN_TYPE_LABELS: Record<string, string> = {
  chapter_briefing: "챕터 브리핑",
  world_map: "월드 맵",
  event_dialogue: "이벤트 대화",
  loot_resolution: "루팅 정산",
  boss_intro: "보스 인트로",
  combat_arena: "전투 구역",
  result_summary: "결과 요약",
  route_select: "노선 선택",
  safehouse: "은신처",
  ending_gallery: "엔딩 갤러리"
};

const UI_VALUE_LABELS: Record<string, string> = {
  on: "켜짐",
  off: "꺼짐",
  unassigned: "미지정",
  silence: "침묵",
  witness: "증언",
  witness_score: "증언",
  public: "공개",
  pragmatic: "실리",
  rescue: "구조",
  lock: "봉쇄",
  release: "개방",
  clean: "비개입",
  broker: "브로커",
  log: "기록",
  order_score: "질서",
  solidarity_score: "연대",
  official: "공식",
  certified: "인증됨",
  medical: "의료",
  locked: "잠김",
  active: "활성",
  completed: "완료"
};

function formatUiWidgetLabel(widgetId: string): string {
  if (UI_WIDGET_LABELS[widgetId]) {
    return UI_WIDGET_LABELS[widgetId];
  }

  return widgetId.replace(/_/gu, " ").replace(/\./gu, " ").trim();
}

function stringifyUiWidgetValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "켜짐" : "꺼짐";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  if (typeof value === "string") {
    return UI_VALUE_LABELS[value] ?? value;
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  return "-";
}

function formatUiNodeTypeLabel(nodeType: string): string {
  return UI_NODE_TYPE_LABELS[nodeType] ?? nodeType.replace(/[_-]/gu, " ");
}

function formatUiEyebrowLabel(eventType?: string, screenType?: string): string {
  if (eventType) {
    return UI_EVENT_TYPE_LABELS[eventType] ?? eventType;
  }
  if (screenType) {
    return UI_SCREEN_TYPE_LABELS[screenType] ?? screenType;
  }
  return "현장";
}

function formatUiRouteStateValue(value: string): string {
  return UI_VALUE_LABELS[value] ?? value.replace(/[_-]/gu, " ");
}

function buildUiRouteSummary(runtime: RuntimeSnapshot): string {
  return [
    `증언 노선: ${formatUiRouteStateValue(String(runtime.stats["route.truth"] ?? "silence"))}`,
    `판단 성향: ${formatUiRouteStateValue(String(runtime.stats["route.compassion"] ?? "pragmatic"))}`,
    `통제 상태: ${formatUiRouteStateValue(String(runtime.stats["route.control"] ?? "lock"))}`,
    `비공식 개입: ${formatUiRouteStateValue(String(runtime.stats["route.underworld"] ?? "clean"))}`,
    `누적 부담: ${Number(runtime.stats["route.strain"] ?? 0)}`
  ].join(" | ");
}

function buildUiPartCloseCopy(chapterId: ChapterId, fallback: string): string {
  const closeCopy: Partial<Record<ChapterId, string>> = {
    CH05: "다음 국면: 침수된 교량 이후 생존 브리프로 이어집니다.",
    CH10: "다음 국면: 북상 기록 정리 이후 다음 브리프로 이어집니다.",
    CH15: "다음 국면: 항만 관문 돌파 이후 다음 브리프로 이어집니다.",
    CH20: "작전 종료: 최종 기록과 결말을 다시 확인합니다."
  };

  return closeCopy[chapterId] ?? fallback;
}

function buildUiNextStageCopy(currentChapterId: ChapterId, nextChapterId?: ChapterId, canAdvanceToNextChapter = false): string {
  if (canAdvanceToNextChapter && nextChapterId) {
    const nextChapter = getChapterCatalogEntry(nextChapterId);
    if (nextChapter?.title) {
      return `${nextChapter.title} 브리프로 이어집니다.`;
    }
  }

  return buildUiPartCloseCopy(currentChapterId, "다음 장면으로 이어집니다.");
}

function buildUiResultEyebrow(chapterId: ChapterId, partLabel: string, endingId?: string | null): string {
  if (!endingId) {
    return "챕터 결과";
  }

  return chapterId === "CH20" ? "최종 결말" : `${partLabel} 엔딩`;
}

function buildUiChapterAdvanceLabel(nextChapterId?: ChapterId): string {
  if (!nextChapterId) {
    return "다음 챕터";
  }

  const nextChapter = getChapterCatalogEntry(nextChapterId);
  if (nextChapter?.title) {
    return `${nextChapter.title} 브리프`;
  }

  return `${nextChapterId} 브리프`;
}

function buildUiResultPrimaryActionLabel(
  chapterId: ChapterId,
  outcome: NonNullable<RuntimeSnapshot["chapter_outcome"]>,
  canAdvanceToNextChapter = false
): string {
  if (outcome.ending_id) {
    if (canAdvanceToNextChapter && outcome.next_chapter_id && chapterId !== "CH20") {
      return buildUiChapterAdvanceLabel(outcome.next_chapter_id);
    }

    return chapterId === "CH20" ? "최종 결말 기록 보기" : "엔딩 기록 보기";
  }

  return outcome.campaign_complete ? "파트 처음부터 다시" : "다음 챕터";
}

function buildUiGalleryCloseActionLabel(chapterId: ChapterId, nextChapterId?: ChapterId, canAdvanceToNextChapter = false): string {
  if (canAdvanceToNextChapter && nextChapterId) {
    return buildUiChapterAdvanceLabel(nextChapterId);
  }

  return chapterId === "CH20" ? "최종 기록으로 돌아가기" : "결과로 돌아가기";
}

function buildUiEndingGalleryHeading(chapterId: ChapterId, screenTitle?: string): string {
  return chapterId === "CH20" ? "최종 결말 기록" : screenTitle ?? "엔딩 기록";
}

function buildUiEndingGallerySummary(chapterId: ChapterId, nextChapterId?: ChapterId, canAdvanceToNextChapter = false): string {
  if (chapterId === "CH20") {
    return "최종 결말과 해금된 기록을 다시 확인합니다.";
  }

  if (canAdvanceToNextChapter && nextChapterId) {
    return `${buildUiChapterAdvanceLabel(nextChapterId).replace(/ 브리프/u, "")}로 이어지기 전에 엔딩 기록을 다시 확인합니다.`;
  }

  return "해금된 엔딩과 파트 종료 기록을 다시 확인합니다.";
}

function readChapterWidgetValue(runtime: RuntimeSnapshot, chapterId: string, widgetId: string): unknown {
  const widgetState = toExtendedRuntime(runtime).chapter_widgets_state as Record<string, unknown> | undefined;
  const bucket = widgetState?.[chapterId];
  if (!bucket || typeof bucket !== "object") {
    const flatEntry = widgetState?.[widgetId];
    if (flatEntry && typeof flatEntry === "object" && "value" in (flatEntry as Record<string, unknown>)) {
      return (flatEntry as { value?: unknown }).value;
    }
    return flatEntry;
  }

  const entry = (bucket as Record<string, unknown>)[widgetId];
  if (entry && typeof entry === "object" && "value" in (entry as Record<string, unknown>)) {
    return (entry as { value?: unknown }).value;
  }

  return entry;
}

function resolveFieldActionsValue(runtime: RuntimeSnapshot, chapterId: string): number | undefined {
  const extendedRuntime = toExtendedRuntime(runtime) as ExtendedRuntimeSnapshot & {
    field_actions_remaining?: number | Record<string, unknown>;
  };

  if (typeof extendedRuntime.field_actions_remaining === "number") {
    return extendedRuntime.field_actions_remaining;
  }

  if (extendedRuntime.field_actions_remaining && typeof extendedRuntime.field_actions_remaining === "object") {
    const value = (extendedRuntime.field_actions_remaining as Record<string, unknown>)[chapterId];
    return typeof value === "number" ? value : undefined;
  }

  return undefined;
}

function resolveWidgetValue(
  widgetId: string,
  content: GameContentPack,
  runtime: RuntimeSnapshot,
  chapterId: string,
  partEndingCount: number
): unknown {
  const extendedRuntime = toExtendedRuntime(runtime);
  const resultWidgetValue = (extendedRuntime.chapter_result_payload as unknown as { widget_state?: Record<string, unknown> } | null)?.widget_state?.[widgetId];
  if (resultWidgetValue !== undefined) {
    return resultWidgetValue;
  }

  const chapterWidgetValue = readChapterWidgetValue(runtime, chapterId, widgetId);
  if (chapterWidgetValue !== undefined) {
    return chapterWidgetValue;
  }

  switch (widgetId) {
    case "objective_panel": {
      const objectives = content.chapters[chapterId]?.objectives ?? [];
      const completed = objectives.filter(
        (objective) => runtime.chapter_progress[chapterId]?.objective_completion[objective.objective_id] === true
      ).length;
      return `${completed}/${objectives.length}`;
    }
    case "party_summary":
      return `체력 ${Number(runtime.stats.hp ?? 0)} / ${Number(runtime.stats.max_hp ?? 0)}`;
    case "route_compare":
    case "route_summary":
    case "route_hint":
      return String(runtime.chapter_progress[chapterId]?.selected_route ?? runtime.stats["route.current"] ?? "unassigned");
    case "trade_panel":
      return Object.keys(runtime.inventory.quantities ?? {}).length > 0 ? "거래 가능" : "교환 물자 부족";
    case "reputation_change": {
      const activeReputation = Object.entries(runtime.stats).filter(
        ([key, value]) =>
          (key.startsWith("trust.") || key.startsWith("reputation.")) &&
          typeof value === "number" &&
          Number(value) !== 0
      ).length;
      return activeReputation > 0 ? `${activeReputation}개 평판 변화` : "변화 없음";
    }
    case "core_state":
      return String(runtime.chapter_progress[chapterId]?.selected_route ?? runtime.stats["route.current"] ?? "unassigned");
    case "ending_matrix":
      return partEndingCount;
    case "field_actions_remaining":
      return resolveFieldActionsValue(runtime, chapterId) ?? 0;
    case "warning_count":
      return "기록 기준";
    case "next_part_hook": {
      const nextPartHooks: Partial<Record<ChapterId, string>> = {
        CH05: "다음 검문선 붕괴",
        CH10: "북상 작전 검문 기록",
        CH15: "외해 관문 잔류계"
      };
      return nextPartHooks[chapterId] ?? undefined;
    }
    case "closing_hook":
      return chapterId === "CH20" ? "최종 결말 기록 보기" : undefined;
    default:
      break;
  }

  if (runtime.stats[widgetId] !== undefined) {
    return runtime.stats[widgetId];
  }
  if (runtime.flags[widgetId] !== undefined) {
    return runtime.flags[widgetId];
  }

  return undefined;
}

function compactStoryText(value: string | null | undefined): string {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

function getNarrativeBlocks(event: EventDefinition | null): EventSceneBlock[] {
  if (!event) {
    return [];
  }

  const blocks = (event.text.scene_blocks ?? []).filter((block) => block.lines.length > 0);
  if (blocks.length > 0) {
    return blocks;
  }

  return event.text.body
    .filter((paragraph) => compactStoryText(paragraph).length > 0)
    .map((paragraph, index) => ({
      block_id: `${event.event_id}_fallback_${index + 1}`,
      kind: "narration",
      lines: [paragraph]
    }));
}

function getStoryLogEntries(runtime: RuntimeSnapshot, limit = 4): StoryLogEntry[] {
  return [...(runtime.story_log ?? [])].slice(-limit).reverse();
}

function getPortraitRailItems(event: EventDefinition | null): Array<{ key: string; label: string; artKey?: string }> {
  if (!event) {
    return [];
  }

  const seen = new Set<string>();
  const items: Array<{ key: string; label: string; artKey?: string }> = [];

  for (const block of getNarrativeBlocks(event)) {
    const label = compactStoryText(block.speaker_label);
    if (!label) {
      continue;
    }

    const key = `${block.speaker_id ?? label}:${block.portrait_art_key ?? event.presentation.art_key ?? "portrait"}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push({
      key,
      label,
      artKey: block.portrait_art_key ?? event.presentation.art_key
    });
  }

  if (items.length === 0 && event.presentation.art_key) {
    items.push({
      key: `${event.event_id}:default`,
      label: event.title,
      artKey: event.presentation.art_key
    });
  }

  return items;
}

function buildOutcomeSceneBlocks(runtime: RuntimeSnapshot): EventSceneBlock[] {
  return getStoryLogEntries(runtime, 3).map((entry, index) => ({
    block_id: `${entry.entry_id}:${index}`,
    kind: index === 0 ? "dialogue" : "narration",
    speaker_label: entry.speaker_labels[0] ?? "기록",
    lines: [entry.summary].filter(Boolean)
  }));
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  return prefersReducedMotion;
}

function deriveNarrativeStress(runtime: RuntimeSnapshot): NarrativeStress {
  if (runtime.battle_state.status === "active") {
    return "combat";
  }

  if (runtime.fail_state) {
    return "critical";
  }

  const noise = Number(runtime.stats.noise ?? 0);
  const contamination = Number(runtime.stats.contamination ?? 0);

  if (noise >= 12 || contamination >= 10) {
    return "critical";
  }

  if (noise >= 8 || contamination >= 6) {
    return "warning";
  }

  return "calm";
}

function deriveNarrativeTone(event: EventDefinition | null, screen: RuntimeSnapshot["ui_screen"]): NarrativeTone {
  if (screen === "boss_intro") {
    return "cinematic";
  }

  if (screen === "result_summary") {
    return "aftershock";
  }

  if (!event) {
    return "default";
  }

  if ((event.text.scene_blocks ?? []).some((block) => block.kind === "system")) {
    return "terminal";
  }

  if ((event.text.scene_blocks ?? []).some((block) => block.kind === "memory")) {
    return "memory";
  }

  if (event.event_type === "boss" || event.event_type === "combat") {
    return "panic";
  }

  if (event.presentation.layout?.includes("cinematic")) {
    return "cinematic";
  }

  return "default";
}

function shouldAnimateNarrative(runtime: RuntimeSnapshot, event: EventDefinition | null, prefersReducedMotion: boolean): boolean {
  if (prefersReducedMotion || !event) {
    return false;
  }

  const visitState = runtime.visited_events[runtime.current_chapter_id]?.[event.event_id];
  return !visitState || visitState.seen_count <= 1;
}

function StorySceneStack({
  title,
  summary,
  blocks,
  carryLine,
  animate = false,
  revealKey = title,
  onRevealStateChange
}: {
  title: string;
  summary?: string;
  blocks: EventSceneBlock[];
  carryLine?: string;
  animate?: boolean;
  revealKey?: string;
  onRevealStateChange?: (complete: boolean) => void;
}) {
  const hasNarrativeContent = Boolean(summary) || blocks.length > 0;
  const totalLineCount = blocks.reduce((sum, block) => sum + block.lines.length, 0);
  const [visibleLineCount, setVisibleLineCount] = useState(animate ? 0 : totalLineCount);
  const [carryVisible, setCarryVisible] = useState(!animate || !carryLine);

  useEffect(() => {
    setVisibleLineCount(animate ? 0 : totalLineCount);
    setCarryVisible(!animate || !carryLine);
    onRevealStateChange?.(!animate);
  }, [animate, carryLine, onRevealStateChange, revealKey, totalLineCount]);

  useEffect(() => {
    if (!animate) {
      onRevealStateChange?.(true);
      return undefined;
    }

    if (visibleLineCount < totalLineCount) {
      onRevealStateChange?.(false);
      const timer = window.setTimeout(() => {
        setVisibleLineCount((current) => Math.min(totalLineCount, current + 1));
      }, 130);
      return () => window.clearTimeout(timer);
    }

    if (carryLine && !carryVisible) {
      onRevealStateChange?.(false);
      const timer = window.setTimeout(() => {
        setCarryVisible(true);
      }, 340);
      return () => window.clearTimeout(timer);
    }

    onRevealStateChange?.(true);
    return undefined;
  }, [animate, carryLine, carryVisible, onRevealStateChange, totalLineCount, visibleLineCount]);

  let revealedLineBudget = visibleLineCount;

  return (
    <div className={`story-scene-stack ${animate && (visibleLineCount < totalLineCount || (carryLine && !carryVisible)) ? "is-animating" : ""}`} aria-label={title}>
      {summary ? <div className="storybook-summary">{summary}</div> : null}
      {blocks.map((block) => {
        const visibleLines = animate ? block.lines.slice(0, Math.max(0, revealedLineBudget)) : block.lines;
        revealedLineBudget = animate ? Math.max(0, revealedLineBudget - block.lines.length) : revealedLineBudget;

        if (animate && visibleLines.length === 0) {
          return null;
        }

        const blockComplete = visibleLines.length === block.lines.length;

        return (
          <article key={block.block_id} className={`scene-block-card scene-block-${block.kind}`} data-kind={block.kind}>
            {block.speaker_label ? <p className="scene-speaker">{block.speaker_label}</p> : null}
            <div className="scene-lines">
              {visibleLines.map((line, index) => (
                <p key={`${block.block_id}:${index}`} className="scene-line">
                  {line}
                </p>
              ))}
            </div>
            {block.emphasis && blockComplete ? <p className="scene-emphasis">{block.emphasis}</p> : null}
          </article>
        );
      })}
      {carryLine && carryVisible ? <p className={`carry-line ${animate ? "is-reveal" : ""}`}>"{carryLine}"</p> : null}
      {!hasNarrativeContent ? <p className="muted-copy">아직 이어지는 장면이 없습니다. 이번 선택부터 기록이 이어집니다.</p> : null}
    </div>
  );
}

function StoryLogPanel({ entries }: { entries: StoryLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="story-log-panel card">
        <p className="eyebrow">직전 기록</p>
        <p className="muted-copy">아직 열린 기록이 없습니다. 이번 선택이 첫 기록으로 남습니다.</p>
      </div>
    );
  }

  return (
    <div className="story-log-panel card">
      <p className="eyebrow">직전 기록</p>
      <div className="story-log-list">
        {entries.map((entry) => (
          <article key={entry.entry_id} className="story-log-card">
            <span>{entry.speaker_labels[0] ?? "기록"}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
            {entry.carry_line ? <span>{entry.carry_line}</span> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function StoryLogPanelClean({ entries }: { entries: StoryLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="story-log-panel card">
        <p className="eyebrow">직전 기록</p>
        <p className="muted-copy">아직 열린 기록이 없습니다. 이번 선택이 첫 기록으로 남습니다.</p>
      </div>
    );
  }

  return (
    <div className="story-log-panel card">
      <p className="eyebrow">직전 기록</p>
      <div className="story-log-list">
        {entries.map((entry) => (
          <article key={entry.entry_id} className="story-log-card">
            <span>{entry.speaker_labels[0] ?? "기록"}</span>
            <strong>{entry.title}</strong>
            <p>{entry.summary}</p>
            {entry.carry_line ? <span>{entry.carry_line}</span> : null}
          </article>
        ))}
      </div>
    </div>
  );
}

function resolveEpilogueCards(cardIds?: string[]): Array<EpilogueCardDefinition & { cardId: string }> {
  return (cardIds ?? [])
    .map((cardId) => {
      const card = EPILOGUE_CARD_LIBRARY[cardId];
      return card ? { cardId, ...card } : null;
    })
    .filter((card): card is EpilogueCardDefinition & { cardId: string } => Boolean(card));
}

function WidgetRail({
  widgetIds,
  content,
  runtime,
  chapterId,
  partEndingCount
}: {
  widgetIds: string[];
  content: GameContentPack;
  runtime: RuntimeSnapshot;
  chapterId: string;
  partEndingCount: number;
}) {
  if (widgetIds.length === 0) {
    return null;
  }

  const widgetItems = widgetIds
    .filter((widgetId) => !PRESENTATION_ONLY_WIDGETS.has(widgetId) && !UI_PRESENTATION_ONLY_WIDGETS.has(widgetId))
    .map((widgetId) => ({
      widgetId,
      value: resolveWidgetValue(widgetId, content, runtime, chapterId, partEndingCount)
    }))
    .filter((entry) => entry.value !== undefined);

  if (widgetItems.length === 0) {
    return null;
  }

  return (
    <div className="widget-rail">
      {widgetItems.map(({ widgetId, value }) => (
        <div key={widgetId} className="widget-card card">
          <span className="widget-label">{formatUiWidgetLabel(widgetId)}</span>
          <strong className="widget-value">{stringifyUiWidgetValue(value)}</strong>
        </div>
      ))}
    </div>
  );
}

function formatRouteStateValue(value: string): string {
  return UI_VALUE_LABELS[value] ?? value.replace(/[_-]/gu, " ");
}

function buildRouteSummary(runtime: RuntimeSnapshot): string {
  const summary = [
    `증언 노선: ${formatRouteStateValue(String(runtime.stats["route.truth"] ?? "silence"))}`,
    `판단 성향: ${formatRouteStateValue(String(runtime.stats["route.compassion"] ?? "pragmatic"))}`,
    `통제 상태: ${formatRouteStateValue(String(runtime.stats["route.control"] ?? "lock"))}`,
    `비공식 개입: ${formatRouteStateValue(String(runtime.stats["route.underworld"] ?? "clean"))}`,
    `누적 부담: ${Number(runtime.stats["route.strain"] ?? 0)}`
  ];

  return summary.join(" | ");
}

function buildPartCloseCopy(chapterId: ChapterId, fallback: string): string {
  const closeCopy: Partial<Record<ChapterId, string>> = {
    CH05: "다음 국면: 붕괴 구역 정리 이후 다음 브리프로 이어집니다.",
    CH10: "다음 국면: 북상 작전 기록 이후 다음 브리프로 이어집니다.",
    CH15: "다음 국면: 항만 관문 돌파 이후 다음 브리프로 이어집니다.",
    CH20: "작전 종료: 최종 게임 기록과 결말을 다시 확인합니다."
  };

  return closeCopy[chapterId] ?? fallback;
}

function buildNextStageCopy(currentChapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (nextChapterId) {
    const nextChapter = getChapterCatalogEntry(nextChapterId);
    if (nextChapter?.title) {
      return `${nextChapter.title}로 이어집니다.`;
    }
  }

  return buildPartCloseCopy(currentChapterId, "다음 장면으로 이어집니다.");
}

function buildResultEyebrow(chapterId: ChapterId, partLabel: string, endingId?: string | null): string {
  if (!endingId) {
    return "챕터 결과";
  }

  return chapterId === "CH20" ? "최종 결말" : `${partLabel} 엔딩`;
}

function buildChapterAdvanceLabel(nextChapterId?: ChapterId): string {
  if (!nextChapterId) {
    return "다음 챕터";
  }

  const nextChapter = getChapterCatalogEntry(nextChapterId);
  if (nextChapter?.title) {
    return `${nextChapter.title} 브리프`;
  }

  return `${nextChapterId} 브리프`;
}

function buildResultPrimaryActionLabel(chapterId: ChapterId, outcome: NonNullable<RuntimeSnapshot["chapter_outcome"]>): string {
  if (outcome.ending_id) {
    if (outcome.next_chapter_id && chapterId !== "CH20") {
      return buildChapterAdvanceLabel(outcome.next_chapter_id);
    }

    if (chapterId === "CH20") {
      return "최종 결말 기록 보기";
    }

    return "엔딩 기록 보기";
  }

  return outcome.campaign_complete ? "파트 다시 시작" : "다음 챕터";
}

function buildGalleryCloseActionLabel(chapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (nextChapterId) {
    return buildChapterAdvanceLabel(nextChapterId);
  }

  return chapterId === "CH20" ? "최종 기록으로 돌아가기" : "결과로 돌아가기";
}

function buildEndingGalleryHeading(chapterId: ChapterId, screenTitle?: string): string {
  if (chapterId === "CH20") {
    return "최종 결말 기록";
  }

  return screenTitle ?? "엔딩 기록";
}

function buildEndingGallerySummary(chapterId: ChapterId, nextChapterId?: ChapterId): string {
  if (chapterId === "CH20") {
    return "해금된 엔딩과 최종 결말 기록을 다시 확인합니다.";
  }

  if (nextChapterId) {
    return `${buildChapterAdvanceLabel(nextChapterId).replace(/ 브리프/u, "")}로 이어지기 전에 기록을 다시 확인합니다.`;
  }

  return "해금된 엔딩과 다음 작전을 준비하기 전 기록을 다시 확인합니다.";
}

void formatWidgetLabel;
void stringifyWidgetValue;
void formatNodeTypeLabel;
void formatEyebrowLabel;
void StoryLogPanel;
void buildRouteSummary;
void buildNextStageCopy;
void buildResultEyebrow;
void buildResultPrimaryActionLabel;
void buildGalleryCloseActionLabel;
void buildEndingGalleryHeading;
void buildEndingGallerySummary;

function App() {
  const partLabel = `파트 ${CURRENT_PART_ID.replace("P", "")}`;
  const {
    bootState,
    bootError,
    content,
    runtime,
    warnings,
    selectedChoiceId,
    bootstrapPack,
    startMission,
    proceedHub,
    moveToNode,
    selectChoice,
    startBossCombat,
    toggleLootSelection,
    confirmLoot,
    resolveBattleAction,
    confirmResult,
    openEndingGallery,
    closeEndingGallery,
    resetRun
  } = useGameStore();
  const [selectedGalleryEndingId, setSelectedGalleryEndingId] = useState<string | null>(null);
  const [narrativeRevealComplete, setNarrativeRevealComplete] = useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const currentEndingId = runtime?.chapter_outcome?.ending_id;
  const partEndingCards = useMemo(
    () => (content && runtime ? collectPartEndingCards(content, CURRENT_PART_ID, runtime.unlocked_endings, runtime) : []),
    [content, runtime]
  );
  const unlockedEndingIds = useMemo(
    () => partEndingCards.filter((ending) => ending.unlocked).map((ending) => ending.ending_id),
    [partEndingCards]
  );
  const unlockedEndingCount = unlockedEndingIds.length;

  useEffect(() => {
    void bootstrapPack();
  }, [bootstrapPack]);

  useEffect(() => {
    if (!runtime || runtime.ui_screen !== "ending_gallery") {
      return;
    }

    if (currentEndingId) {
      setSelectedGalleryEndingId(currentEndingId);
      return;
    }

    setSelectedGalleryEndingId((previous) => previous ?? unlockedEndingIds[0] ?? partEndingCards[0]?.ending_id ?? null);
  }, [currentEndingId, runtime, unlockedEndingIds, partEndingCards]);

  const chapterForReveal = content && runtime ? content.chapters[runtime.current_chapter_id] : null;
  const currentEventForReveal =
    chapterForReveal && runtime?.current_event_id ? chapterForReveal.events_by_id[runtime.current_event_id] : null;
  const shouldAnimateSceneReset = runtime
    ? runtime.ui_screen === "result_summary"
      ? !prefersReducedMotion
      : shouldAnimateNarrative(runtime, currentEventForReveal, prefersReducedMotion)
    : false;
  const narrativeRevealResetKey = runtime
    ? runtime.ui_screen === "result_summary"
      ? `result:${runtime.current_chapter_id}:${runtime.chapter_outcome?.ending_id ?? "none"}`
      : `${runtime.ui_screen}:${runtime.current_event_id ?? runtime.current_screen_id ?? "none"}`
    : "boot";

  useEffect(() => {
    setNarrativeRevealComplete(!shouldAnimateSceneReset);
  }, [narrativeRevealResetKey, shouldAnimateSceneReset]);

  if (bootState === "idle" || bootState === "loading" || !content || !runtime) {
    return (
      <div className="boot-screen">
        <div className={`boot-card ${bootState === "error" ? "is-error" : ""}`}>
          <p className="eyebrow">DonggrolGameBook {partLabel}</p>
          <h1>콘텐츠 초기화 중</h1>
          <p className="muted-copy">{bootState === "error" ? bootError : `${partLabel} 콘텐츠와 생성 자산 계약을 불러오는 중입니다.`}</p>
        </div>
      </div>
    );
  }

  const chapter = content.chapters[runtime.current_chapter_id];
  const uiFlow = content.ui_flows[runtime.current_chapter_id];
  const screen = uiFlow?.screens.find((entry) => entry.screen_id === runtime.current_screen_id) ?? uiFlow?.screens[0];
  const currentNode = runtime.current_node_id ? chapter.nodes_by_id[runtime.current_node_id] : null;
  const currentEvent = runtime.current_event_id ? chapter.events_by_id[runtime.current_event_id] : null;
  const currentNarrativeBlocks = getNarrativeBlocks(currentEvent);
  const portraitRailItems = getPortraitRailItems(currentEvent);
  const recentStoryEntries = getStoryLogEntries(runtime, 4);
  const resultSceneBlocks = buildOutcomeSceneBlocks(runtime);
  const chapterMedia = getPart1ChapterMedia(runtime.current_chapter_id);
  const chapterRuntimeConfig = getChapterRuntimeConfig(runtime.current_chapter_id);
  const openingVideoId = chapterMedia?.opening_video_id ?? `${CURRENT_PART_ID}_${runtime.current_chapter_id}_OPENING`;
  const currentEndingCard = currentEndingId
    ? getEndingCardById(content, currentEndingId, (runtime.unlocked_endings as Record<string, string | undefined>)[currentEndingId], runtime.current_chapter_id, runtime)
    : null;
  const selectedEndingId = selectedGalleryEndingId ?? currentEndingId ?? unlockedEndingIds[0] ?? partEndingCards[0]?.ending_id ?? null;
  const selectedEndingCard =
    (selectedEndingId ? partEndingCards.find((ending) => ending.ending_id === selectedEndingId) : null) ??
    (selectedEndingId
      ? getEndingCardById(
          content,
          selectedEndingId,
          (runtime.unlocked_endings as Record<string, string | undefined>)[selectedEndingId],
          runtime.current_chapter_id,
          runtime
        )
      : null);
  const hp = Number(runtime.stats.hp ?? 0);
  const maxHp = Number(runtime.stats.max_hp ?? 100);
  const contamination = Number(runtime.stats.contamination ?? 0);
  const noise = Number(runtime.stats.noise ?? 0);
  const narrativeStress = deriveNarrativeStress(runtime);
  const narrativeTone = deriveNarrativeTone(currentEvent, runtime.ui_screen);
  const shouldAnimateScene =
    runtime.ui_screen === "result_summary"
      ? !prefersReducedMotion
      : shouldAnimateNarrative(runtime, currentEvent, prefersReducedMotion);
  const narrativeRevealKey =
    runtime.ui_screen === "result_summary"
      ? `result:${runtime.current_chapter_id}:${runtime.chapter_outcome?.ending_id ?? "none"}`
      : `${runtime.ui_screen}:${runtime.current_event_id ?? runtime.current_screen_id ?? "none"}`;
  const routeSummary = buildUiRouteSummary(runtime);
  const screenWidgetIds = [...new Set([...(screen?.widgets ?? []), ...(currentEvent?.presentation.widget_overrides ?? [])])];
  const resultPayload = (toExtendedRuntime(runtime).chapter_result_payload ??
    ((runtime.chapter_outcome as { chapter_result_payload?: ChapterResultView } | null)?.chapter_result_payload ?? null)) as ChapterResultView | null;
  const epilogueCards = resolveEpilogueCards(resultPayload?.epilogue_card_ids);
  const canOpenEndingGallery = Boolean(uiFlow?.screens.some((entry) => entry.screen_type === "ending_gallery"));
  const canAdvanceToNextChapter = Boolean(
    runtime.chapter_outcome?.next_chapter_id && content.chapters[runtime.chapter_outcome.next_chapter_id]
  );
  const resultPrimaryOpensGallery = Boolean(
    runtime.ui_screen === "result_summary" &&
    runtime.chapter_outcome?.ending_id &&
    (!canAdvanceToNextChapter || runtime.current_chapter_id === "CH20")
  );
  const resultSecondaryGalleryActionVisible = Boolean(
    runtime.ui_screen === "result_summary" &&
    runtime.chapter_outcome?.ending_id &&
    canOpenEndingGallery &&
    runtime.current_chapter_id !== "CH20" &&
    canAdvanceToNextChapter
  );
  const showHeaderGalleryShortcut =
    canOpenEndingGallery &&
    runtime.ui_screen !== "ending_gallery" &&
    !resultPrimaryOpensGallery &&
    !resultSecondaryGalleryActionVisible &&
    unlockedEndingCount > 0;
  const headerGalleryActionLabel = runtime.current_chapter_id === "CH20" ? "최종 결말 기록 보기" : "엔딩 기록 보기";
  const narrativeChoiceLocked =
    shouldAnimateScene &&
    !narrativeRevealComplete &&
    (runtime.ui_screen === "event_dialogue" || runtime.ui_screen === "safehouse" || runtime.ui_screen === "route_select" || runtime.ui_screen === "boss_intro");

  const dashboardTitle =
    runtime.ui_screen === "ending_gallery"
      ? buildUiEndingGalleryHeading(runtime.current_chapter_id, screen?.title)
      : runtime.ui_screen === "result_summary"
        ? runtime.chapter_outcome?.ending_title ?? screen?.title ?? runtime.chapter_outcome?.title ?? chapter.title
        : currentEvent?.title ?? screen?.title ?? chapter.title;
  const dashboardPurpose =
    runtime.ui_screen === "ending_gallery"
      ? buildUiEndingGallerySummary(runtime.current_chapter_id, runtime.chapter_outcome?.next_chapter_id, canAdvanceToNextChapter)
      : runtime.ui_screen === "result_summary"
        ? runtime.chapter_outcome?.summary ?? screen?.purpose ?? chapter.role
        : currentEvent?.text.summary ?? screen?.purpose ?? chapter.role;

  const backdropKey =
    runtime.ui_screen === "chapter_briefing"
      ? chapterMedia?.result_art_key ??
        chapter.chapter_cinematic?.result_card_art_key ??
        chapterMedia?.briefing_art_key ??
        chapter.chapter_cinematic?.still_art_key ??
        chapterRuntimeConfig?.default_art_key
      : runtime.ui_screen === "world_map"
        ? chapterMedia?.map_art_key ?? chapter.chapter_cinematic?.world_map_art_key ?? chapterRuntimeConfig?.default_art_key
        : runtime.ui_screen === "boss_intro" || runtime.ui_screen === "combat_arena"
          ? currentEvent?.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key ?? chapterRuntimeConfig?.default_art_key
          : runtime.ui_screen === "result_summary"
            ? currentEndingCard?.art_key ??
              chapterMedia?.result_art_key ??
              chapter.chapter_cinematic?.result_card_art_key ??
              chapterRuntimeConfig?.default_art_key
            : runtime.ui_screen === "ending_gallery"
              ? selectedEndingCard?.art_key ?? "ending_placeholder"
              : currentEvent?.presentation.art_key ??
                chapterMedia?.map_art_key ??
                chapter.chapter_cinematic?.world_map_art_key ??
                chapterRuntimeConfig?.default_art_key;

  return (
    <div
      className="runtime-shell"
      data-part={CURRENT_PART_ID}
      data-screen={runtime.ui_screen}
      data-chapter={runtime.current_chapter_id}
      data-stress={narrativeStress}
      data-tone={narrativeTone}
      data-layout={currentEvent?.presentation.layout ?? runtime.ui_screen}
      data-event-type={currentEvent?.event_type ?? runtime.ui_screen}
    >
      <div className="runtime-backdrop">
        <ArtFrame
          artKey={backdropKey}
          chapterId={runtime.current_chapter_id}
          caption={screen?.title}
          screenLabel={screen?.title}
          placeholderMode="simple"
        />
      </div>

      <div className="runtime-overlay">
        <div className="dashboard-page">
          <div className="card dashboard-header">
            <p className="eyebrow">{runtime.current_chapter_id}</p>
            <h1>{dashboardTitle}</h1>
            <p className="dash-muted">{dashboardPurpose}</p>
            <p className="dash-muted">{routeSummary}</p>
            <div className="choice-actions">
              {showHeaderGalleryShortcut ? (
                <button className="ghost-button" onClick={openEndingGallery}>
                  {headerGalleryActionLabel}
                </button>
              ) : null}
              <button className="ghost-button" onClick={resetRun}>
                {partLabel} 다시 시작
              </button>
            </div>
          </div>

          <div className="runtime-overlay-row">
            <div className="runtime-drawer card">
              <StatBar label="체력" value={hp} maxValue={maxHp} tone={hp <= 35 ? "danger" : undefined} />
              <StatBar label="소음" value={noise} maxValue={20} tone={noise >= 12 ? "warning" : undefined} />
              <StatBar label="오염" value={contamination} maxValue={20} tone={contamination >= 10 ? "danger" : undefined} />
            </div>
          </div>

          <WidgetRail
            widgetIds={screenWidgetIds}
            content={content}
            runtime={runtime}
            chapterId={runtime.current_chapter_id}
            partEndingCount={partEndingCards.length}
          />

          {runtime.ui_screen === "chapter_briefing" ? (
            <div className="screen-card briefing-screen split-layout">
              <div>
                <div className="briefing-track-groups">
                  <div className="briefing-track-group">
                    <h3>목표</h3>
                    <ul className="objective-list">
                      {chapter.objectives.map((objective) => (
                        <li
                          key={objective.objective_id}
                          className={runtime.chapter_progress[runtime.current_chapter_id]?.objective_completion[objective.objective_id] ? "is-complete" : ""}
                        >
                          <strong>{objective.text}</strong>
                          <span>{objective.required ? "주 목표" : "보조 목표"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="choice-actions">
                  <button className="primary-button" onClick={startMission}>
                    작전 시작
                  </button>
                </div>
              </div>

              <div className="screen-side-stack briefing-visual-panel">
                <VideoCard videoId={openingVideoId} chapterId={runtime.current_chapter_id} />
                <div className="briefing-visual-grid">
                  <div className="briefing-visual-large">
                    <ArtFrame
                      artKey={
                        chapterMedia?.result_art_key ??
                        chapter.chapter_cinematic?.result_card_art_key ??
                        chapterMedia?.briefing_art_key ??
                        chapter.chapter_cinematic?.still_art_key ??
                        chapterRuntimeConfig?.default_art_key
                      }
                      chapterId={runtime.current_chapter_id}
                      caption="챕터 포스터"
                      screenLabel="chapter_briefing"
                    />
                  </div>
                  <ArtFrame
                    artKey={chapter.chapter_cinematic?.anchor_portrait_key}
                    chapterId={runtime.current_chapter_id}
                    caption="주역 초상"
                    screenLabel="anchor_portrait"
                  />
                  <ArtFrame
                    artKey={chapter.chapter_cinematic?.support_portrait_key}
                    chapterId={runtime.current_chapter_id}
                    caption="지원 초상"
                    screenLabel="support_portrait"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "world_map" ? (
            <div className="screen-card split-layout map-screen-grid">
              <div className="node-map-shell">
                <div className="node-map-grid">
                  <svg className="node-map-lines" viewBox="0 0 1000 600" preserveAspectRatio="none">
                    {chapter.nodes.flatMap((node) =>
                      node.connections.map((connection) => {
                        const target = chapter.nodes_by_id[connection.to];
                        if (!target) {
                          return null;
                        }
                        return (
                          <line
                            key={`${node.node_id}-${connection.to}`}
                            x1={node.coordinates.x}
                            y1={node.coordinates.y}
                            x2={target.coordinates.x}
                            y2={target.coordinates.y}
                          />
                        );
                      })
                    )}
                  </svg>

                  {chapter.nodes.map((node) => (
                    <button
                      key={node.node_id}
                      className={`map-node ${runtime.current_node_id === node.node_id ? "is-current" : ""} ${
                        runtime.visited_nodes[runtime.current_chapter_id]?.[node.node_id] ? "is-visited" : ""
                      }`}
                      style={{ left: `${node.coordinates.x}%`, top: `${node.coordinates.y}%` }}
                      onClick={() => moveToNode(node.node_id)}
                    >
                      <span className="map-node-id">{node.node_id}</span>
                      <strong>{node.name}</strong>
                  <div>{formatUiNodeTypeLabel(node.node_type)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="intel-panel">
                <div className="card intel-section">
                <h4>현재 노드</h4>
                  <p>{currentNode?.description ?? "다음 경로를 확인하기 위해 노드를 선택합니다."}</p>
                </div>

                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 3)} />

                <div className="card intel-section">
                  <h4>인벤토리</h4>
                  <ul className="intel-list">
                    {Object.entries(runtime.inventory.quantities).length === 0 ? (
                      <li>현재 들고 있는 물품이 없습니다.</li>
                    ) : (
                      Object.entries(runtime.inventory.quantities).map(([itemId, quantity]) => (
                        <li key={itemId} className="inventory-entry">
                          <ItemIcon content={content} itemId={itemId} />
                          <div className="inventory-entry-copy">
                            <strong>{getItemDisplayName(content, itemId)}</strong>
                            <span>x{quantity}</span>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="card intel-section">
                  <h4>현장 시야</h4>
                  <ArtFrame
                    artKey={
                      chapterMedia?.map_art_key ??
                      chapter.chapter_cinematic?.world_map_art_key ??
                      chapterRuntimeConfig?.default_art_key
                    }
                    chapterId={runtime.current_chapter_id}
                    caption="현장 시야"
                    screenLabel="world_map"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "event_dialogue" || runtime.ui_screen === "safehouse" || runtime.ui_screen === "route_select" ? (
            <div className="screen-card storybook-layout">
              <div className="story-main-panel">
                <p className="eyebrow">{formatUiEyebrowLabel(currentEvent?.event_type, runtime.ui_screen)}</p>
                <h2>{currentEvent?.title ?? screen?.title ?? chapter.title}</h2>
                {currentEvent ? (
                  <>
                    <StorySceneStack
                      key={narrativeRevealKey}
                      title={currentEvent.title}
                      summary={currentEvent.text.summary}
                      blocks={currentNarrativeBlocks}
                      carryLine={currentEvent.text.carry_line}
                      animate={shouldAnimateScene}
                      revealKey={narrativeRevealKey}
                      onRevealStateChange={setNarrativeRevealComplete}
                    />
                    {narrativeChoiceLocked ? <p className="muted-copy narrative-lock-copy">장면을 읽는 동안 선택이 잠깐 잠깁니다.</p> : null}
                    <div className={`choice-list ${narrativeChoiceLocked ? "is-locked" : ""}`}>
                      {currentEvent.choices.map((choice) => (
                        <button
                          key={choice.choice_id}
                          className={`choice-card ${narrativeChoiceLocked ? "is-locked" : ""}`}
                          onClick={() => selectChoice(choice.choice_id)}
                          disabled={narrativeChoiceLocked}
                        >
                          <strong>{choice.label}</strong>
                          <span>{choice.preview ?? "선택 직후 현장 분위기와 대응 방식이 달라집니다."}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="event-summary">{screen?.purpose ?? "경로 허브 개요를 확인합니다."}</div>
                    <p>{chapter.role}</p>
                    <div className="choice-actions">
                      <button className="primary-button" onClick={proceedHub}>
                        지도로 이동
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="screen-side-stack story-side-panel">
                <ArtFrame
                  artKey={currentEvent?.presentation.art_key ?? chapterRuntimeConfig?.default_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={currentEvent?.title}
                  screenLabel={runtime.ui_screen}
                />
                {portraitRailItems.length > 0 ? (
                  <div className="portrait-rail card">
                    <p className="eyebrow">등장 인물</p>
                    <div className="portrait-rail-list">
                      {portraitRailItems.map((item) => (
                        <div key={item.key} className="portrait-rail-item">
                          <ArtFrame
                            artKey={item.artKey}
                            chapterId={runtime.current_chapter_id}
                            caption={item.label}
                            screenLabel="portrait_rail"
                          />
                          <strong>{item.label}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 3)} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "loot_resolution" && runtime.loot_session ? (
            <div className="screen-card split-layout">
              <div>
                <h2>루팅 정산</h2>
                <p>{runtime.loot_session.source_event_id}에서 확보한 물품을 정리합니다.</p>
                <div className="choice-list">
                  {runtime.loot_session.drops.map((drop) => (
                    <button
                      key={drop.item_id}
                      className={`loot-card ${drop.selected ? "is-selected" : ""}`}
                      onClick={() => toggleLootSelection(drop.item_id)}
                    >
                      <div className="loot-card-head">
                        <ItemIcon content={content} itemId={drop.item_id} />
                        <div className="loot-card-meta">
                          <strong>{getItemDisplayName(content, drop.item_id)}</strong>
                          <span>x{drop.quantity}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmLoot}>
                    루팅 확정
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption="결과 카드"
                  screenLabel="loot_resolution"
                />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "boss_intro" && currentEvent ? (
            <div className="screen-card storybook-layout boss-screen">
              <div className="story-main-panel">
                <p className="eyebrow">결전 직전</p>
                <h2>{screen?.title ?? currentEvent.title}</h2>
                {screen?.purpose ? <p className="muted-copy">{screen.purpose}</p> : null}
                <StorySceneStack
                  key={narrativeRevealKey}
                  title={currentEvent.title}
                  summary={currentEvent.text.summary}
                  blocks={currentNarrativeBlocks}
                  carryLine={currentEvent.text.carry_line}
                  animate={shouldAnimateScene}
                  revealKey={narrativeRevealKey}
                  onRevealStateChange={setNarrativeRevealComplete}
                />
                {narrativeChoiceLocked ? <p className="muted-copy narrative-lock-copy">장면을 읽는 동안 선택이 잠깐 잠깁니다.</p> : null}
                <div className={`choice-list ${narrativeChoiceLocked ? "is-locked" : ""}`}>
                  {currentEvent.choices.map((choice) => (
                    <button
                      key={choice.choice_id}
                      className={`choice-card ${selectedChoiceId === choice.choice_id ? "is-selected" : ""} ${narrativeChoiceLocked ? "is-locked" : ""}`}
                      onClick={() => selectChoice(choice.choice_id)}
                      disabled={narrativeChoiceLocked}
                    >
                      <strong>{choice.label}</strong>
                      <span>{choice.preview}</span>
                    </button>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={startBossCombat} disabled={!selectedChoiceId || narrativeChoiceLocked}>
                    {narrativeChoiceLocked ? "장면 재생 중" : "결전 시작"}
                  </button>
                </div>
              </div>

              <div className="screen-side-stack story-side-panel">
                <ArtFrame
                  artKey={currentEvent.presentation.cinematic_still_key ?? chapter.chapter_cinematic?.boss_splash_key}
                  chapterId={runtime.current_chapter_id}
                  caption={screen?.title ?? "보스 조우"}
                  screenLabel="boss_intro"
                />
                {portraitRailItems.length > 0 ? (
                  <div className="portrait-rail card">
                    <p className="eyebrow">등장 인물</p>
                    <div className="portrait-rail-list">
                      {portraitRailItems.map((item) => (
                        <div key={item.key} className="portrait-rail-item">
                          <ArtFrame
                            artKey={item.artKey}
                            chapterId={runtime.current_chapter_id}
                            caption={item.label}
                            screenLabel="boss_portrait_rail"
                          />
                          <strong>{item.label}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 3)} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "combat_arena" ? (
            <div className="screen-card split-layout">
              <div>
                <p className="eyebrow">전투</p>
                <h2>{currentEvent?.title ?? "전투 구역"}</h2>
                <div className="choice-list">
                  {runtime.battle_state.units.map((unit, index) => (
                    <div key={`${unit.enemy_id}-${index}`} className="choice-card">
                      <strong>{unit.name}</strong>
                      <span>
                        체력 {unit.current_hp} / {unit.max_hp}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={() => resolveBattleAction("attack")}>
                    공격
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("skill")}>
                    스킬
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("item")}>
                    아이템
                  </button>
                  <button className="ghost-button" onClick={() => resolveBattleAction("move")}>
                    이동
                  </button>
                </div>
              </div>

              <div className="screen-side-stack">
                <ArtFrame
                  artKey={currentEvent?.presentation.art_key ?? chapter.chapter_cinematic?.boss_splash_key}
                  chapterId={runtime.current_chapter_id}
                  caption="전투 구역"
                  screenLabel="combat_arena"
                />
                {portraitRailItems.length > 0 ? (
                  <div className="portrait-rail card">
                    <p className="eyebrow">등장 인물</p>
                    <div className="portrait-rail-list">
                      {portraitRailItems.slice(0, 1).map((item) => (
                        <div key={item.key} className="portrait-rail-item">
                          <ArtFrame
                            artKey={item.artKey}
                            chapterId={runtime.current_chapter_id}
                            caption={item.label}
                            screenLabel="combat_portrait_rail"
                          />
                          <strong>{item.label}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries.slice(0, 2)} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "result_summary" && runtime.chapter_outcome ? (
            <div className="screen-card storybook-layout result-screen">
              <div className="story-main-panel">
                <p className="eyebrow">
                  {buildUiResultEyebrow(runtime.current_chapter_id, partLabel, runtime.chapter_outcome.ending_id)}
                </p>
                <h2>{runtime.chapter_outcome.ending_title ?? screen?.title ?? runtime.chapter_outcome.title}</h2>
                {screen?.purpose ? <p className="muted-copy">{screen.purpose}</p> : null}
                <StorySceneStack
                  key={narrativeRevealKey}
                  title={runtime.chapter_outcome.ending_title ?? runtime.chapter_outcome.title}
                  summary={runtime.chapter_outcome.summary}
                  blocks={resultSceneBlocks}
                  carryLine={recentStoryEntries[0]?.carry_line}
                  animate={shouldAnimateScene}
                  revealKey={narrativeRevealKey}
                  onRevealStateChange={setNarrativeRevealComplete}
                />
                <p className="muted-copy">
                  {buildUiNextStageCopy(runtime.current_chapter_id, runtime.chapter_outcome.next_chapter_id, canAdvanceToNextChapter)}
                </p>
                {currentEndingCard ? (
                  <div className="result-hook-card">
                    <strong>{currentEndingCard.hint}</strong>
                  </div>
                ) : null}
                {resultPayload ? (
                  <div className="result-payload-grid">
                    <div className="card">
                      <p className="eyebrow">목표</p>
                      <ul className="intel-list">
                        {resultPayload.objective_summary.map((objective) => (
                          <li key={objective.objective_id}>
                            <strong>{objective.completed ? "완료" : "대기"}</strong>
                            <span>{objective.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card">
                  <p className="eyebrow">퀘스트 진행</p>
                      <ul className="intel-list">
                        {resultPayload.quest_summary.map((quest) => (
                          <li key={quest.quest_track_id}>
                    <strong>{UI_VALUE_LABELS[quest.status] ?? quest.status}</strong>
                            <span>{quest.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
                {resultPayload?.notes?.length ? (
                  <div className="card result-notes-card">
                    <p className="eyebrow">이어지는 기억</p>
                    <ul className="intel-list">
                      {resultPayload.notes.map((note, index) => (
                        <li key={`result-note:${index}`}>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {epilogueCards.length ? (
                  <div className="epilogue-grid">
                    {epilogueCards.map((card) => (
                      <article key={card.cardId} className="card epilogue-card">
                        <p className="eyebrow">{card.eyebrow}</p>
                        <strong>{card.title}</strong>
                        <p>{card.body}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
                <div className="choice-actions">
                  <button className="primary-button" onClick={confirmResult}>
                    {buildUiResultPrimaryActionLabel(runtime.current_chapter_id, runtime.chapter_outcome, canAdvanceToNextChapter)}
                  </button>
                  {resultSecondaryGalleryActionVisible ? (
                    <button className="ghost-button" onClick={openEndingGallery}>
                      엔딩 기록 보기
                    </button>
                  ) : null}
                  {runtime.chapter_outcome.ending_id || runtime.chapter_outcome.campaign_complete ? (
                    <button className="ghost-button" onClick={resetRun}>
                      {partLabel} 처음부터 다시
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="screen-side-stack story-side-panel">
                <ArtFrame
                  artKey={currentEndingCard?.art_key ?? chapterMedia?.result_art_key ?? chapter.chapter_cinematic?.result_card_art_key}
                  chapterId={runtime.current_chapter_id}
                  caption={runtime.chapter_outcome.ending_title ?? "결과"}
                  screenLabel="result_summary"
                />
                {currentEndingCard?.video_id ? (
                  <VideoCard videoId={currentEndingCard.video_id} chapterId={runtime.current_chapter_id} />
                ) : null}
                <StoryLogPanelClean entries={recentStoryEntries} />
              </div>
            </div>
          ) : null}

          {runtime.ui_screen === "ending_gallery" ? (
            <div className="screen-card ending-gallery-screen">
              <div className="ending-gallery-head">
                <div>
                  <p className="eyebrow">{runtime.current_chapter_id === "CH20" ? "최종 결말" : `${partLabel} 엔딩 갤러리`}</p>
                  <h2>{buildUiEndingGalleryHeading(runtime.current_chapter_id, screen?.title)}</h2>
                  <p className="muted-copy">
                    {buildUiEndingGallerySummary(runtime.current_chapter_id, runtime.chapter_outcome?.next_chapter_id, canAdvanceToNextChapter)}
                  </p>
                </div>
                <div className="choice-actions">
                  <button className="primary-button" onClick={closeEndingGallery}>
                    {buildUiGalleryCloseActionLabel(
                      runtime.current_chapter_id,
                      runtime.chapter_outcome?.next_chapter_id,
                      canAdvanceToNextChapter
                    )}
                  </button>
                  <button className="ghost-button" onClick={resetRun}>
                    {partLabel} 처음부터 다시
                  </button>
                </div>
              </div>

              {partEndingCards.length === 0 ? (
                  <div className="card ending-gallery-detail-card">
                  <p className="eyebrow">기록 없음</p>
                  <h3>아직 해금된 엔딩이 없습니다.</h3>
                  <p>결과 화면에서 결말이 확정되면 이곳에 기록됩니다.</p>
                </div>
              ) : (
                <div className="ending-gallery-layout">
                  <div className="ending-gallery-grid">
                    {partEndingCards.map((ending) => {
                      const unlockedAt = (runtime.unlocked_endings as Record<string, string | undefined>)[ending.ending_id];
                      const isSelected = selectedEndingId === ending.ending_id;
                      return (
                        <button
                          key={ending.ending_id}
                          className={`ending-gallery-card ${unlockedAt ? "is-unlocked" : "is-locked"} ${isSelected ? "is-selected" : ""}`}
                          onClick={() => setSelectedGalleryEndingId(ending.ending_id)}
                        >
                          <ArtFrame
                            artKey={unlockedAt ? ending.thumb_key : "ending_placeholder"}
                            chapterId={(ending.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                        caption={unlockedAt ? ending.title : "미해금"}
                            screenLabel="ending_gallery_thumb"
                          />
                          <strong>{unlockedAt ? ending.title : "미해금 엔딩"}</strong>
                          <p>{unlockedAt ? ending.summary : ending.hint}</p>
                          {unlockedAt ? <span className="muted-copy">해금 시점: {formatDateTime(unlockedAt)}</span> : null}
                        </button>
                      );
                    })}
                  </div>

                  <div className="ending-gallery-detail">
                    {selectedEndingCard ? (
                      <div className="card ending-gallery-detail-card">
                        <p className="eyebrow">선택한 엔딩</p>
                        <h3>{selectedEndingCard.unlocked ? selectedEndingCard.title : "미해금 엔딩"}</h3>
                        <p>{selectedEndingCard.unlocked ? selectedEndingCard.summary : selectedEndingCard.hint}</p>
                        <ArtFrame
                          artKey={selectedEndingCard.unlocked ? selectedEndingCard.art_key : "ending_placeholder"}
                          chapterId={(selectedEndingCard.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                          caption={selectedEndingCard.unlocked ? selectedEndingCard.title : "미해금 엔딩"}
                          screenLabel="ending_gallery_detail"
                        />
                        {selectedEndingCard.unlocked && selectedEndingCard.video_id ? (
                          <VideoCard
                            videoId={selectedEndingCard.video_id}
                            chapterId={(selectedEndingCard.chapter_id ?? runtime.current_chapter_id) as ChapterId}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="warnings-panel card">
              <p className="eyebrow">경고</p>
              <ul className="intel-list">
                {warnings.slice(-4).map((warning, index) => (
                  <li key={`${warning.source}-${index}`}>
                    <strong>{warning.source}</strong>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;

