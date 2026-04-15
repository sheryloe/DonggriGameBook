import { getChapterRuntimeConfig, type LegacyFallbackSlot } from "@donggrol/world-registry";
import { resolveRuntimeAssetUrl } from "./runtimeAssetUrls";
import type {
  AssetGenerationJob,
  AssetModelRoute,
  AssetResolution,
  ChapterId,
  ContentAlias,
  RuntimeArtAliasEntry,
  RuntimeAssetManifest,
  RuntimeStitchRenderTask
} from "../types/game";

const GENERATED_EXTENSIONS = ["png", "webp", "jpg", "jpeg", "svg"] as const;
const GENERATED_IMAGE_ROOT = "/generated/images";
const GENERATED_ITEM_ICON_ROOT = "/generated/icons/items";

const STRICT_DROP_KEYS = new Set([
  "briefing_p1_ch01",
  "briefing_p1_ch02",
  "briefing_p1_ch03",
  "briefing_p1_ch04",
  "briefing_p1_ch05",
  "map_p1_ch01",
  "map_p1_ch02",
  "map_p1_ch03",
  "map_p1_ch04",
  "map_p1_ch05",
  "result_p1_ch01",
  "result_p1_ch02",
  "result_p1_ch03",
  "result_p1_ch04",
  "result_p1_ch05",
  "ending_p1_signal_keepers",
  "ending_p1_controlled_passage",
  "ending_p1_smuggler_tide",
  "ending_p1_ashen_escape",
  "ending_p1_mirror_witness",
  "ending_thumb_p1_signal_keepers",
  "ending_thumb_p1_controlled_passage",
  "ending_thumb_p1_smuggler_tide",
  "ending_thumb_p1_ashen_escape",
  "ending_thumb_p1_mirror_witness"
]);

const BASE_ROUTE_BY_KEY: Record<string, AssetModelRoute> = {
  npc_support_writer: "character-25",
  portrait_ahn_bogyeong: "character-25",
  portrait_han_somyeong: "character-25",
  portrait_jung_noah: "character-25",
  portrait_ryu_seon: "character-25",
  portrait_seo_jinseo: "character-25",
  portrait_yoon_haein: "npc-main-pro",
  portrait_kim_ara: "npc-main-pro",
  boss_cheongeum: "character-25",
  boss_editing_aberration: "character-25",
  boss_glassgarden: "character-25",
  boss_mirror_lines: "character-25",
  boss_picker_prime: "character-25",
  ending_placeholder: "asset-nano"
};

type StitchBackgroundRequirement = {
  partId?: string;
  chapterId?: ChapterId;
  promptFile: string;
  runtimeKey: string;
  targetKey: string;
  targetPath: string;
};

type RuntimeAssetState = {
  aliasByKey: Map<string, RuntimeArtAliasEntry>;
  stitchByRuntimeKey: Map<string, StitchBackgroundRequirement>;
  contentAliases: ContentAlias[];
  assetGenerationQueue: AssetGenerationJob[];
  knownArtKeys: string[];
};

const runtimeState: RuntimeAssetState = {
  aliasByKey: new Map(),
  stitchByRuntimeKey: new Map(),
  contentAliases: [],
  assetGenerationQueue: [],
  knownArtKeys: []
};

export let CONTENT_ALIASES: ContentAlias[] = [];
export let ASSET_GENERATION_QUEUE: AssetGenerationJob[] = [];
export let KNOWN_ART_KEYS: string[] = [];

function basenameWithoutExtension(value: string): string {
  return value.replace(/\\/g, "/").split("/").pop()?.replace(/\.[^.]+$/u, "") ?? value;
}

function normalizePublicRuntimeTarget(value: string): string {
  const normalized = value.replace(/\\/g, "/");
  if (normalized.startsWith("public/")) {
    return resolveRuntimeAssetUrl(`/${normalized.slice("public/".length)}`);
  }
  return resolveRuntimeAssetUrl(normalized.startsWith("/") ? normalized : `/${normalized}`);
}

function publicGeneratedCandidates(key: string): string[] {
  return GENERATED_EXTENSIONS.map((extension) =>
    resolveRuntimeAssetUrl(`${GENERATED_IMAGE_ROOT}/${key}.${extension}`)
  );
}

function itemGeneratedCandidates(key: string): string[] {
  return GENERATED_EXTENSIONS.map((extension) =>
    resolveRuntimeAssetUrl(`${GENERATED_ITEM_ICON_ROOT}/${key}.${extension}`)
  );
}

function dedupe(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function defaultRouteForKey(key: string): AssetModelRoute {
  if (BASE_ROUTE_BY_KEY[key]) {
    return BASE_ROUTE_BY_KEY[key];
  }
  if (key.startsWith("bg_") || key.startsWith("briefing_") || key.startsWith("map_") || key.startsWith("result_")) {
    return "nanobanana";
  }
  if (key.startsWith("portrait_") || key.startsWith("boss_") || key.startsWith("npc_")) {
    return "character-25";
  }
  return "asset-nano";
}

function chapterFallbackCandidates(chapterId?: ChapterId): string[] {
  if (!chapterId) {
    return [];
  }
  const chapterRuntime = getChapterRuntimeConfig(chapterId);
  if (!chapterRuntime) {
    return [];
  }
  return publicGeneratedCandidates(chapterRuntime.default_art_key);
}

function routeForLegacyFallback(slot: LegacyFallbackSlot): string[] {
  switch (slot) {
    case "start_background":
      return publicGeneratedCandidates("ending_placeholder");
    case "inspection_background":
      return publicGeneratedCandidates("ending_placeholder");
    case "gate_background":
      return publicGeneratedCandidates("ending_placeholder");
    case "transmitter_background":
      return publicGeneratedCandidates("ending_placeholder");
    case "inventory_board":
      return publicGeneratedCandidates("ending_placeholder");
    default:
      return [];
  }
}

function aliasCandidates(key: string): { direct: string[]; generated: string[] } {
  const alias = runtimeState.aliasByKey.get(key);
  if (!alias) {
    return { direct: [], generated: [] };
  }

  const filenameStem = basenameWithoutExtension(alias.filename_target);
  return {
    direct: [],
    generated: dedupe([
      ...publicGeneratedCandidates(alias.art_key_final),
      ...publicGeneratedCandidates(filenameStem)
    ])
  };
}

export function hydrateRuntimeAssetManifest(manifest: RuntimeAssetManifest | null | undefined): void {
  runtimeState.aliasByKey = new Map();
  runtimeState.stitchByRuntimeKey = new Map();
  runtimeState.contentAliases = [...(manifest?.content_aliases ?? [])];
  runtimeState.assetGenerationQueue = [...(manifest?.asset_generation_queue ?? [])];
  runtimeState.knownArtKeys = [...(manifest?.known_art_keys ?? [])];

  for (const entry of manifest?.mappings ?? []) {
    runtimeState.aliasByKey.set(entry.runtime_art_key, entry);
    runtimeState.aliasByKey.set(entry.art_key_final, entry);
  }

  for (const task of (manifest?.tasks ?? []).filter((entry) => {
    if (entry.kind !== "image" || !entry.public_runtime_target || !entry.prompt_file) {
      return false;
    }
    return /\/background\//u.test(String(entry.prompt_file));
  })) {
    const targetPath = normalizePublicRuntimeTarget(task.public_runtime_target ?? "");
    const targetKey = basenameWithoutExtension(task.public_runtime_target ?? "");
    const requirement: StitchBackgroundRequirement = {
      partId: task.part_id ?? undefined,
      chapterId: (task.chapter_id as ChapterId | null | undefined) ?? undefined,
      promptFile: String(task.prompt_file),
      runtimeKey: targetKey,
      targetKey,
      targetPath
    };
    runtimeState.stitchByRuntimeKey.set(targetKey, requirement);
  }

  for (const entry of manifest?.mappings ?? []) {
    const requirement = runtimeState.stitchByRuntimeKey.get(entry.art_key_final);
    if (!requirement) {
      continue;
    }
    runtimeState.stitchByRuntimeKey.set(entry.runtime_art_key, {
      ...requirement,
      runtimeKey: entry.runtime_art_key
    });
  }

  CONTENT_ALIASES = [...runtimeState.contentAliases];
  ASSET_GENERATION_QUEUE = [...runtimeState.assetGenerationQueue];
  KNOWN_ART_KEYS = [...runtimeState.knownArtKeys];
}

export function getStitchBackgroundRequirement(key?: string | null): StitchBackgroundRequirement | null {
  const safeKey = key?.trim();
  if (!safeKey) {
    return null;
  }
  return runtimeState.stitchByRuntimeKey.get(safeKey) ?? null;
}

export function isStitchRequiredBackgroundKey(key?: string | null): boolean {
  return Boolean(getStitchBackgroundRequirement(key));
}

export function isKnownArtKey(key: string): boolean {
  return KNOWN_ART_KEYS.includes(key);
}

export function resolveAssetKey(key?: string | null, chapterId?: ChapterId): AssetResolution {
  const defaultArtKey = chapterId ? getChapterRuntimeConfig(chapterId)?.default_art_key : null;
  const safeKey = key?.trim() || defaultArtKey || `chapter_${chapterId ?? "unknown"}_placeholder`;
  const stitchRequirement = getStitchBackgroundRequirement(safeKey);
  const strictDrop = STRICT_DROP_KEYS.has(safeKey);
  const alias = aliasCandidates(safeKey);

  const generatedCandidates = stitchRequirement
    ? [stitchRequirement.targetPath]
    : dedupe([
        ...publicGeneratedCandidates(safeKey),
        ...alias.generated
      ]);

  const chapterRuntime = chapterId ? getChapterRuntimeConfig(chapterId) : null;
  const fallbackCandidates = stitchRequirement
    ? []
    : dedupe([
        ...(strictDrop ? [] : chapterFallbackCandidates(chapterId)),
        ...(strictDrop
          ? []
          : (chapterRuntime?.legacy_fallback_slots ?? []).flatMap((slot) => routeForLegacyFallback(slot))),
        ...(strictDrop ? [] : publicGeneratedCandidates("ending_placeholder"))
      ]);

  const candidates = dedupe([...alias.direct, ...generatedCandidates, ...fallbackCandidates]);
  const primarySrc = stitchRequirement?.targetPath ?? generatedCandidates[0] ?? fallbackCandidates[0];
  const expectedSrc = stitchRequirement?.targetPath ?? generatedCandidates[0];
  const matchedFrom = stitchRequirement
    ? "generated"
    : alias.direct.length
      ? "direct"
      : generatedCandidates.length
        ? "generated"
        : "fallback";

  return {
    key: safeKey,
    src: primarySrc,
    fallback_srcs: strictDrop || stitchRequirement ? [] : candidates.slice(1),
    candidates,
    route: defaultRouteForKey(safeKey),
    matched_from: matchedFrom,
    status: primarySrc ? "resolved" : "missing_x",
    expected_src: expectedSrc,
    strict_drop: strictDrop || Boolean(stitchRequirement),
    stitch_required: Boolean(stitchRequirement),
    stitch_target_key: stitchRequirement?.targetKey,
    stitch_target_path: stitchRequirement?.targetPath,
    stitch_prompt_file: stitchRequirement?.promptFile
  };
}

export function resolveResultFallback(_outcome: "clear" | "fail" | "gameover"): string {
  return "";
}

export function resolveInventoryFallback(): string {
  return "";
}

export function resolveItemIconCandidates(itemId: string): string[] {
  const safeItemId = String(itemId ?? "").trim().toLowerCase();
  if (!safeItemId) {
    return [];
  }
  return itemGeneratedCandidates(safeItemId);
}
