import type {
  AssetGenerationJob,
  AssetModelRoute,
  AssetResolution,
  ChapterId,
  ContentAlias
} from "../types/game";

const bundledImageModules = {
  ...import.meta.glob("../../img/*", { eager: true, import: "default" }),
  ...import.meta.glob("../../codex_webgame_pack/img/**/*", { eager: true, import: "default" })
} as Record<string, string>;

const GENERATED_EXTENSIONS = ["png", "webp", "jpg", "jpeg"] as const;

const BG_KEYS = [
  "bg_archive_flooded",
  "bg_arkp_exit",
  "bg_arkp_serverhall",
  "bg_broadcast_lobby",
  "bg_cold_storage",
  "bg_cold_warehouse",
  "bg_cooling_room",
  "bg_delivery_tunnel",
  "bg_dongjak_culvert",
  "bg_emergency_stairs",
  "bg_jamsil_lobby",
  "bg_jamsil_showroom",
  "bg_noryangjin_market",
  "bg_pangyo_interchange",
  "bg_pangyo_lobby",
  "bg_pangyo_skywalk",
  "bg_power_room",
  "bg_rail_transfer",
  "bg_rooftop_escape",
  "bg_rooftop_signal",
  "bg_saetgang_entry",
  "bg_security_office",
  "bg_service_stair",
  "bg_skybridge",
  "bg_sorting_hall",
  "bg_tancheon_embankment",
  "bg_yeouido_ashroad"
] as const;

const PORTRAIT_KEYS = [
  "npc_support_writer",
  "portrait_ahn_bogyeong",
  "portrait_han_somyeong",
  "portrait_jung_noah",
  "portrait_kim_ara",
  "portrait_ryu_seon",
  "portrait_seo_jinseo",
  "portrait_yoon_haein"
] as const;

const BOSS_KEYS = [
  "boss_cheongeum",
  "boss_editing_aberration",
  "boss_glassgarden",
  "boss_mirror_lines",
  "boss_picker_prime"
] as const;

const DOCUMENT_KEYS = [
  "doc_baek_dohyeong_trade_sheet",
  "doc_cha_munsik_log",
  "doc_internal_admin_id",
  "doc_military_quarantine_sticker"
] as const;

export const KNOWN_ART_KEYS = [...BG_KEYS, ...PORTRAIT_KEYS, ...BOSS_KEYS] as const;

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function basenameWithoutExtension(path: string): string {
  const normalized = normalizePath(path);
  const filename = normalized.split("/").pop() ?? normalized;
  return filename.replace(/\.[^.]+$/u, "");
}

const bundledImages = Object.values(bundledImageModules);
const bundledImagesByBasename = new Map<string, string>();

for (const imagePath of bundledImages) {
  bundledImagesByBasename.set(basenameWithoutExtension(imagePath), imagePath);
}

function imageByBasename(name: string): string | undefined {
  return bundledImagesByBasename.get(name);
}

const startBackground = imageByBasename("시작 배경");
const inspectionBackground = imageByBasename("입성 심사구역");
const gateBackground = imageByBasename("야간 게이트");
const transmitterBackground = imageByBasename("중계지점 전파 송출장치");
const inventoryBoard = imageByBasename("인벤토리상태 화면용 아이템 보드");
const clearScreen = imageByBasename("클리어 화면");
const failScreen = imageByBasename("실패 화면");
const gameOverScreen = imageByBasename("게임 오버 연출");

const GENERATION_ROUTE_BY_KEY: Record<string, AssetModelRoute> = {
  portrait_yoon_haein: "npc-main-pro",
  portrait_kim_ara: "npc-main-pro",
  npc_support_writer: "character-25",
  portrait_ahn_bogyeong: "character-25",
  portrait_han_somyeong: "character-25",
  portrait_jung_noah: "character-25",
  portrait_ryu_seon: "character-25",
  portrait_seo_jinseo: "character-25",
  boss_cheongeum: "character-25",
  boss_editing_aberration: "character-25",
  boss_glassgarden: "character-25",
  boss_mirror_lines: "character-25",
  boss_picker_prime: "character-25"
};

const CHAPTER_DEFAULT_ART_KEY: Record<ChapterId, string> = {
  CH01: "bg_yeouido_ashroad",
  CH02: "bg_noryangjin_market",
  CH03: "bg_jamsil_lobby",
  CH04: "bg_sorting_hall",
  CH05: "bg_pangyo_lobby"
};

const CHAPTER_FALLBACK_IMAGES: Record<ChapterId, Array<string | undefined>> = {
  CH01: [startBackground, inspectionBackground, transmitterBackground],
  CH02: [gateBackground, inspectionBackground, startBackground],
  CH03: [inspectionBackground, gateBackground, transmitterBackground],
  CH04: [inventoryBoard, inspectionBackground, gateBackground],
  CH05: [transmitterBackground, gateBackground, inspectionBackground]
};

const KEYED_FALLBACK_IMAGES: Record<string, Array<string | undefined>> = {
  bg_broadcast_lobby: [inspectionBackground, startBackground],
  bg_rooftop_signal: [transmitterBackground, gateBackground],
  bg_arkp_serverhall: [transmitterBackground, inspectionBackground],
  bg_arkp_exit: [gateBackground, clearScreen],
  bg_security_office: [inspectionBackground, inventoryBoard],
  boss_editing_aberration: [gameOverScreen, gateBackground],
  boss_cheongeum: [failScreen, gateBackground],
  boss_glassgarden: [gateBackground, failScreen],
  boss_picker_prime: [inventoryBoard, gameOverScreen],
  boss_mirror_lines: [transmitterBackground, gameOverScreen]
};

const KEYED_FALLBACK_ART_KEYS: Record<string, string[]> = {
  boss_editing_aberration: ["bg_broadcast_lobby"],
  boss_cheongeum: ["bg_dongjak_culvert"],
  boss_glassgarden: ["bg_jamsil_showroom"],
  boss_picker_prime: ["bg_sorting_hall"],
  boss_mirror_lines: ["bg_arkp_serverhall"]
};

const GENERIC_FALLBACK_IMAGES = [
  startBackground,
  inspectionBackground,
  gateBackground,
  transmitterBackground
];

export const CONTENT_ALIASES: ContentAlias[] = [
  {
    kind: "npc",
    source_name: "한예지",
    canonical_id: "npc_support_writer",
    display_name: "한예지",
    note: "문서 전용 이름을 런타임용 지원 작가 NPC로 연결한다."
  },
  {
    kind: "npc",
    source_name: "백도형",
    canonical_id: "npc_baek_dohyeong",
    display_name: "백도형",
    note: "레지스트리에는 있지만 초상 art_key가 없어 텍스트 중심으로 처리한다."
  },
  {
    kind: "npc",
    source_name: "최무결",
    canonical_id: "text_only_choi_mugyeol",
    display_name: "최무결",
    note: "이번 범위에는 런타임 엔티티가 없어 텍스트 placeholder만 유지한다."
  },
  {
    kind: "npc",
    source_name: "오태식",
    canonical_id: "text_only_oh_taesik",
    display_name: "오태식",
    note: "이번 범위에는 런타임 엔티티가 없어 텍스트 placeholder만 유지한다."
  },
  {
    kind: "enemy",
    source_name: "매복체",
    canonical_id: "text_only_ambusher",
    display_name: "매복체",
    note: "전투 로스터에는 없으므로 문서/이벤트 텍스트 placeholder로만 사용한다."
  },
  {
    kind: "item",
    source_name: "방송국 비상 로그",
    canonical_id: "itm_broadcast_log",
    display_name: "방송국 비상 송출 로그",
    note: "문서 표현과 아이템 DB 명칭 차이를 흡수한다."
  },
  {
    kind: "item",
    source_name: "판교 출입 프로토콜",
    canonical_id: "itm_route_clearance_pangyo",
    display_name: "판교 진입권",
    note: "문서 표현을 실제 아이템 ID로 정규화한다."
  },
  {
    kind: "item",
    source_name: "독도 인증 프로토콜",
    canonical_id: "itm_dokdo_signal_auth",
    display_name: "독도 신호 인증키",
    note: "문서 표현을 실제 아이템 ID로 정규화한다."
  },
  {
    kind: "doc",
    source_name: "차문식 로그",
    canonical_id: "text_only_cha_munsik_log",
    display_name: "차문식 로그",
    note: "문서 카드 이미지가 아직 없어 텍스트 placeholder와 큐만 유지한다."
  }
];

function makeJob(
  key: string,
  group: AssetGenerationJob["group"],
  route: AssetModelRoute,
  promptHint: string
): AssetGenerationJob {
  return {
    key,
    group,
    route,
    prompt_hint: promptHint
  };
}

function defaultRouteForKey(key: string): AssetModelRoute {
  if (GENERATION_ROUTE_BY_KEY[key]) {
    return GENERATION_ROUTE_BY_KEY[key];
  }

  if (key.startsWith("bg_")) {
    return "nanobanana";
  }

  if (key.startsWith("portrait_") || key.startsWith("boss_") || key.startsWith("npc_")) {
    return "character-25";
  }

  return "asset-nano";
}

export const ASSET_GENERATION_QUEUE: AssetGenerationJob[] = [
  ...BG_KEYS.map((key) =>
    makeJob(key, "background", "nanobanana", "Cinematic Korean apocalypse environment background")
  ),
  ...PORTRAIT_KEYS.map((key) =>
    makeJob(
      key,
      "portrait",
      defaultRouteForKey(key),
      key === "npc_support_writer" ? "Support writer survivor portrait" : "Half-body character portrait"
    )
  ),
  ...BOSS_KEYS.map((key) =>
    makeJob(key, "boss", "character-25", "Mutated boss key art with dramatic combat framing")
  ),
  ...DOCUMENT_KEYS.map((key) =>
    makeJob(key, "document", "asset-nano", "Flat UI card or dossier prop for apocalypse webgame")
  )
];

function dedupe(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function publicGeneratedCandidates(key: string): string[] {
  return GENERATED_EXTENSIONS.flatMap((extension) => [
    `/generated/${key}.${extension}`,
    `/generated/${key}/index.${extension}`
  ]);
}

function directCandidatesForKey(key: string): string[] {
  if (/^(https?:)?\/\//u.test(key) || key.startsWith("/")) {
    return [key];
  }

  const exactBundled = bundledImagesByBasename.get(key);
  return exactBundled ? [exactBundled] : [];
}

function chapterFallbackCandidates(chapterId?: ChapterId): string[] {
  if (!chapterId) {
    return [];
  }

  const chapterKey = CHAPTER_DEFAULT_ART_KEY[chapterId];
  return dedupe([
    ...directCandidatesForKey(chapterKey),
    ...publicGeneratedCandidates(chapterKey),
    ...CHAPTER_FALLBACK_IMAGES[chapterId]
  ]);
}

function keyedFallbackCandidates(key: string): string[] {
  const artKeyFallbacks = KEYED_FALLBACK_ART_KEYS[key] ?? [];
  const imageFallbacks = KEYED_FALLBACK_IMAGES[key] ?? [];
  return dedupe([
    ...artKeyFallbacks.flatMap((fallbackKey) => [
      ...directCandidatesForKey(fallbackKey),
      ...publicGeneratedCandidates(fallbackKey)
    ]),
    ...imageFallbacks
  ]);
}

export function isKnownArtKey(key: string): key is (typeof KNOWN_ART_KEYS)[number] {
  return (KNOWN_ART_KEYS as readonly string[]).includes(key);
}

export function resolveAssetKey(key?: string | null, chapterId?: ChapterId): AssetResolution {
  const safeKey = key?.trim() || CHAPTER_DEFAULT_ART_KEY[chapterId ?? ""] || `chapter_${chapterId ?? "unknown"}_placeholder`;
  const directCandidates = directCandidatesForKey(safeKey);
  const generatedCandidates = safeKey.startsWith("/") ? [] : publicGeneratedCandidates(safeKey);
  const fallbackCandidates = dedupe([
    ...keyedFallbackCandidates(safeKey),
    ...chapterFallbackCandidates(chapterId),
    ...GENERIC_FALLBACK_IMAGES
  ]);
  const candidates = dedupe([...directCandidates, ...generatedCandidates, ...fallbackCandidates]);

  return {
    key: safeKey,
    src: candidates[0],
    fallback_srcs: candidates.slice(1),
    candidates,
    route: defaultRouteForKey(safeKey),
    matched_from: directCandidates.length ? "direct" : generatedCandidates.length ? "generated" : "fallback"
  };
}

export function resolveResultFallback(outcome: "clear" | "fail" | "gameover"): string {
  if (outcome === "clear") {
    return clearScreen ?? startBackground ?? "";
  }

  if (outcome === "gameover") {
    return gameOverScreen ?? failScreen ?? gateBackground ?? "";
  }

  return failScreen ?? gateBackground ?? "";
}

export function resolveInventoryFallback(): string {
  return inventoryBoard ?? inspectionBackground ?? startBackground ?? "";
}
