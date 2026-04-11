import { getChapterRuntimeConfig, type LegacyFallbackSlot } from "../../packages/world-registry/src";
import runtimeArtAliasManifest from "../../docs/asset-prompt-pack/master/RUNTIME_ART_KEY_ALIAS.json";
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
const PART1_GENERATED_IMAGE_ROOT = "/generated/images";

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

const PART1_BRIEFING_KEYS = [
  "briefing_p1_ch01",
  "briefing_p1_ch02",
  "briefing_p1_ch03",
  "briefing_p1_ch04",
  "briefing_p1_ch05"
] as const;

const PART1_MAP_KEYS = ["map_p1_ch01", "map_p1_ch02", "map_p1_ch03", "map_p1_ch04", "map_p1_ch05"] as const;

const PART1_RESULT_KEYS = [
  "result_p1_ch01",
  "result_p1_ch02",
  "result_p1_ch03",
  "result_p1_ch04",
  "result_p1_ch05"
] as const;

const PART1_ENDING_KEYS = [
  "ending_p1_signal_keepers",
  "ending_p1_controlled_passage",
  "ending_p1_smuggler_tide",
  "ending_p1_ashen_escape",
  "ending_p1_mirror_witness"
] as const;

const PART1_ENDING_THUMB_KEYS = [
  "ending_thumb_p1_signal_keepers",
  "ending_thumb_p1_controlled_passage",
  "ending_thumb_p1_smuggler_tide",
  "ending_thumb_p1_ashen_escape",
  "ending_thumb_p1_mirror_witness"
] as const;

const PART1_UTILITY_KEYS = ["ending_placeholder"] as const;
const STRICT_PART1_DROP_KEYS = [
  ...PART1_BRIEFING_KEYS,
  ...PART1_MAP_KEYS,
  ...PART1_RESULT_KEYS,
  ...PART1_ENDING_KEYS,
  ...PART1_ENDING_THUMB_KEYS
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

export const KNOWN_ART_KEYS = [
  ...BG_KEYS,
  ...PART1_BRIEFING_KEYS,
  ...PART1_MAP_KEYS,
  ...PART1_RESULT_KEYS,
  ...PART1_ENDING_KEYS,
  ...PART1_ENDING_THUMB_KEYS,
  ...PART1_UTILITY_KEYS,
  ...PORTRAIT_KEYS,
  ...BOSS_KEYS
] as const;

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

const LEGACY_SLOT_IMAGES: Record<LegacyFallbackSlot, string | undefined> = {
  start_background: startBackground,
  inspection_background: inspectionBackground,
  gate_background: gateBackground,
  transmitter_background: transmitterBackground,
  inventory_board: inventoryBoard
};

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
  boss_picker_prime: "character-25",
  briefing_p1_ch01: "nanobanana",
  briefing_p1_ch02: "nanobanana",
  briefing_p1_ch03: "nanobanana",
  briefing_p1_ch04: "nanobanana",
  briefing_p1_ch05: "nanobanana",
  map_p1_ch01: "nanobanana",
  map_p1_ch02: "nanobanana",
  map_p1_ch03: "nanobanana",
  map_p1_ch04: "nanobanana",
  map_p1_ch05: "nanobanana",
  result_p1_ch01: "nanobanana",
  result_p1_ch02: "nanobanana",
  result_p1_ch03: "nanobanana",
  result_p1_ch04: "nanobanana",
  result_p1_ch05: "nanobanana",
  ending_p1_signal_keepers: "nanobanana",
  ending_p1_controlled_passage: "nanobanana",
  ending_p1_smuggler_tide: "nanobanana",
  ending_p1_ashen_escape: "nanobanana",
  ending_p1_mirror_witness: "nanobanana",
  ending_thumb_p1_signal_keepers: "asset-nano",
  ending_thumb_p1_controlled_passage: "asset-nano",
  ending_thumb_p1_smuggler_tide: "asset-nano",
  ending_thumb_p1_ashen_escape: "asset-nano",
  ending_thumb_p1_mirror_witness: "asset-nano",
  ending_placeholder: "asset-nano"
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
  boss_mirror_lines: [transmitterBackground, gameOverScreen],
  briefing_p1_ch01: [inspectionBackground, startBackground],
  briefing_p1_ch02: [inspectionBackground, startBackground],
  briefing_p1_ch03: [inspectionBackground, startBackground],
  briefing_p1_ch04: [inspectionBackground, startBackground],
  briefing_p1_ch05: [inspectionBackground, startBackground],
  map_p1_ch01: [startBackground, inspectionBackground],
  map_p1_ch02: [startBackground, inspectionBackground],
  map_p1_ch03: [startBackground, inspectionBackground],
  map_p1_ch04: [startBackground, inspectionBackground],
  map_p1_ch05: [startBackground, inspectionBackground],
  result_p1_ch01: [clearScreen, startBackground],
  result_p1_ch02: [clearScreen, startBackground],
  result_p1_ch03: [clearScreen, startBackground],
  result_p1_ch04: [clearScreen, startBackground],
  result_p1_ch05: [clearScreen, startBackground],
  ending_p1_signal_keepers: [clearScreen, startBackground],
  ending_p1_controlled_passage: [clearScreen, inspectionBackground],
  ending_p1_smuggler_tide: [failScreen, gateBackground],
  ending_p1_ashen_escape: [failScreen, gameOverScreen],
  ending_p1_mirror_witness: [clearScreen, transmitterBackground],
  ending_thumb_p1_signal_keepers: [clearScreen, startBackground],
  ending_thumb_p1_controlled_passage: [clearScreen, inspectionBackground],
  ending_thumb_p1_smuggler_tide: [failScreen, gateBackground],
  ending_thumb_p1_ashen_escape: [failScreen, gameOverScreen],
  ending_thumb_p1_mirror_witness: [clearScreen, transmitterBackground],
  ending_placeholder: [clearScreen, failScreen, startBackground]
};

const KEYED_FALLBACK_ART_KEYS: Record<string, string[]> = {
  boss_editing_aberration: ["bg_broadcast_lobby"],
  boss_cheongeum: ["bg_dongjak_culvert"],
  boss_glassgarden: ["bg_jamsil_showroom"],
  boss_picker_prime: ["bg_sorting_hall"],
  boss_mirror_lines: ["bg_arkp_serverhall"],
  briefing_p1_ch01: ["bg_broadcast_lobby"],
  briefing_p1_ch02: ["bg_noryangjin_market"],
  briefing_p1_ch03: ["bg_jamsil_lobby"],
  briefing_p1_ch04: ["bg_sorting_hall"],
  briefing_p1_ch05: ["bg_pangyo_lobby"],
  map_p1_ch01: ["bg_yeouido_ashroad"],
  map_p1_ch02: ["bg_noryangjin_market"],
  map_p1_ch03: ["bg_jamsil_showroom"],
  map_p1_ch04: ["bg_tancheon_embankment"],
  map_p1_ch05: ["bg_pangyo_interchange"],
  result_p1_ch01: ["bg_rooftop_signal"],
  result_p1_ch02: ["bg_dongjak_culvert"],
  result_p1_ch03: ["bg_rooftop_escape"],
  result_p1_ch04: ["bg_delivery_tunnel"],
  result_p1_ch05: ["bg_arkp_exit"],
  ending_p1_signal_keepers: ["result_p1_ch05", "bg_arkp_exit"],
  ending_p1_controlled_passage: ["result_p1_ch05", "bg_pangyo_lobby"],
  ending_p1_smuggler_tide: ["bg_dongjak_culvert", "bg_noryangjin_market"],
  ending_p1_ashen_escape: ["bg_arkp_exit", "bg_pangyo_interchange"],
  ending_p1_mirror_witness: ["bg_arkp_serverhall", "result_p1_ch05"],
  ending_thumb_p1_signal_keepers: ["ending_p1_signal_keepers"],
  ending_thumb_p1_controlled_passage: ["ending_p1_controlled_passage"],
  ending_thumb_p1_smuggler_tide: ["ending_p1_smuggler_tide"],
  ending_thumb_p1_ashen_escape: ["ending_p1_ashen_escape"],
  ending_thumb_p1_mirror_witness: ["ending_p1_mirror_witness"],
  ending_placeholder: ["result_p1_ch05"]
};

const GENERIC_FALLBACK_IMAGES = [startBackground, inspectionBackground, gateBackground, transmitterBackground];

interface RuntimeArtAliasEntry {
  runtime_art_key: string;
  art_key_final: string;
  filename_target: string;
}

const RUNTIME_ALIAS_BY_KEY = new Map<string, RuntimeArtAliasEntry>(
  ((runtimeArtAliasManifest as { mappings?: RuntimeArtAliasEntry[] }).mappings ?? []).map((entry) => [
    entry.runtime_art_key,
    entry
  ])
);

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
  ...PART1_BRIEFING_KEYS.map((key) =>
    makeJob(key, "background", "nanobanana", "Part 1 chapter briefing still with grounded Korean disaster realism")
  ),
  ...PART1_MAP_KEYS.map((key) =>
    makeJob(key, "background", "nanobanana", "Part 1 world map hero background with route emphasis")
  ),
  ...PART1_RESULT_KEYS.map((key) =>
    makeJob(key, "background", "nanobanana", "Part 1 result card art for chapter summary")
  ),
  ...PART1_ENDING_KEYS.map((key) =>
    makeJob(key, "background", "nanobanana", "Part 1 ending key art with strong silhouette and aftermath mood")
  ),
  ...PART1_ENDING_THUMB_KEYS.map((key) =>
    makeJob(key, "document", "asset-nano", "Part 1 ending gallery thumbnail card")
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
  return GENERATED_EXTENSIONS.map((extension) => `${PART1_GENERATED_IMAGE_ROOT}/${key}.${extension}`);
}

function legacyGeneratedCandidates(key: string): string[] {
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

  const chapterRuntime = getChapterRuntimeConfig(chapterId);
  if (!chapterRuntime) {
    return [];
  }

  const legacyFallbacks = chapterRuntime.legacy_fallback_slots.map((slot) => LEGACY_SLOT_IMAGES[slot]);

  return dedupe([
    ...directCandidatesForKey(chapterRuntime.default_art_key),
    ...publicGeneratedCandidates(chapterRuntime.default_art_key),
    ...legacyFallbacks
  ]);
}

function runtimeAliasCandidates(key: string): {
  direct: string[];
  generated: string[];
} {
  const alias = RUNTIME_ALIAS_BY_KEY.get(key);
  if (!alias) {
    return { direct: [], generated: [] };
  }

  const filenameStem = basenameWithoutExtension(alias.filename_target);
  return {
    direct: dedupe([
      ...directCandidatesForKey(filenameStem),
      ...directCandidatesForKey(alias.art_key_final)
    ]),
    generated: dedupe([
      ...publicGeneratedCandidates(alias.art_key_final),
      ...publicGeneratedCandidates(filenameStem)
    ])
  };
}

function keyedFallbackCandidates(key: string): string[] {
  if ((STRICT_PART1_DROP_KEYS as readonly string[]).includes(key)) {
    return [];
  }

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
  const defaultArtKey = chapterId ? getChapterRuntimeConfig(chapterId)?.default_art_key : null;
  const safeKey = key?.trim() || defaultArtKey || `chapter_${chapterId ?? "unknown"}_placeholder`;
  const strictDrop = (STRICT_PART1_DROP_KEYS as readonly string[]).includes(safeKey);
  const aliasCandidates = runtimeAliasCandidates(safeKey);
  const directCandidates = dedupe([...directCandidatesForKey(safeKey), ...aliasCandidates.direct]);
  const generatedCandidates = safeKey.startsWith("/")
    ? []
    : strictDrop
      ? publicGeneratedCandidates(safeKey)
      : dedupe([
          ...publicGeneratedCandidates(safeKey),
          ...aliasCandidates.generated,
          ...legacyGeneratedCandidates(safeKey)
        ]);
  const fallbackCandidates = dedupe([
    ...keyedFallbackCandidates(safeKey),
    ...(strictDrop ? [] : chapterFallbackCandidates(chapterId)),
    ...(strictDrop ? [] : GENERIC_FALLBACK_IMAGES)
  ]);
  const candidates = dedupe([...directCandidates, ...generatedCandidates, ...fallbackCandidates]);
  const primarySrc = directCandidates[0] ?? generatedCandidates[0] ?? fallbackCandidates[0];
  const expectedSrc = directCandidates[0] ? undefined : generatedCandidates[0];
  const matchedFrom = directCandidates.length
    ? "direct"
    : generatedCandidates.length
      ? "generated"
      : "fallback";
  const status = directCandidates.length || fallbackCandidates.length ? "resolved" : "missing_x";

  return {
    key: safeKey,
    src: primarySrc,
    fallback_srcs: strictDrop ? [] : candidates.slice(1),
    candidates,
    route: defaultRouteForKey(safeKey),
    matched_from: matchedFrom,
    status,
    expected_src: expectedSrc,
    strict_drop: strictDrop
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
