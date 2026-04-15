import {
  ASSET_GENERATION_QUEUE,
  CONTENT_ALIASES,
  hydrateRuntimeAssetManifest
} from "./assetResolver";
import type {
  GameContentPack,
  PackageManifest,
  ResolvedProjectPaths,
  RuntimeAssetManifest,
  RuntimeWarning
} from "../types/game";

const RUNTIME_PACK_URL = "/runtime-content/game-content-pack.json";
const RUNTIME_ASSET_MANIFEST_URL = "/runtime-content/runtime-asset-manifest.json";

function makeWarning(
  message: string,
  source: string,
  severity: RuntimeWarning["severity"] = "warning"
): RuntimeWarning {
  return { message, source, severity };
}

function createFallbackManifest(): PackageManifest {
  return {
    version: "0.0.0",
    game_id: "donggrolgamebook-runtime",
    title: "Donggrol Runtime Content",
    schemas: {
      chapter: "schemas/chapter_event.schema.json",
      item: "schemas/inventory_item.schema.json",
      ui_flow: "schemas/ui_flow.schema.json"
    },
    data: {
      stats: "private/content/data/stats.registry.json",
      npcs: "private/content/data/npc.registry.json",
      enemies: "private/content/data/enemy.registry.json",
      items: "private/content/data/inventory.items.json",
      loot_tables: "private/content/data/loot_tables.json",
      encounter_tables: "private/content/data/encounter_tables.json",
      chapters_index: "private/content/data/chapters.index.json"
    },
    ui: {
      chapters: []
    },
    docs: {
      preferred_root: "private/story",
      roots: ["private/story/concept_arc_01_05", "private/story/world"]
    },
    assets: {
      generated_root: "public/generated"
    }
  };
}

function createFallbackPaths(): ResolvedProjectPaths {
  return {
    manifest: "public/runtime-content/game-content-pack.json",
    docs_root: "private/story",
    docs_roots: ["private/story/concept_arc_01_05", "private/story/world"],
    schemas: {},
    data: {},
    ui: {}
  };
}

function createEmptyPack(message: string, extraWarnings: RuntimeWarning[] = []): GameContentPack {
  return {
    manifest_path: "public/runtime-content/game-content-pack.json",
    manifest: createFallbackManifest(),
    resolved_paths: createFallbackPaths(),
    chapter_order: [],
    chapters: {},
    ui_flows: {},
    stats_registry: {},
    npcs: {},
    enemies: {},
    items: {},
    loot_tables: {},
    encounter_tables: {},
    docs: {},
    content_aliases: CONTENT_ALIASES,
    asset_generation_queue: ASSET_GENERATION_QUEUE,
    warnings: [makeWarning(message, "runtime-content", "error"), ...extraWarnings]
  };
}

async function readRuntimeJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

async function loadRuntimeAssetManifest(): Promise<{
  manifest: RuntimeAssetManifest | null;
  warnings: RuntimeWarning[];
}> {
  try {
    const manifest = await readRuntimeJson<RuntimeAssetManifest>(RUNTIME_ASSET_MANIFEST_URL);
    hydrateRuntimeAssetManifest(manifest);
    return { manifest, warnings: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    hydrateRuntimeAssetManifest(null);
    return {
      manifest: null,
      warnings: [makeWarning(`Runtime asset manifest is missing: ${message}`, RUNTIME_ASSET_MANIFEST_URL, "warning")]
    };
  }
}

export function resolveManifestPath(): string {
  return "public/runtime-content/game-content-pack.json";
}

export async function loadPack(): Promise<GameContentPack> {
  const assetManifestResult = await loadRuntimeAssetManifest();

  try {
    const pack = await readRuntimeJson<GameContentPack>(RUNTIME_PACK_URL);
    return {
      ...pack,
      content_aliases:
        assetManifestResult.manifest?.content_aliases ??
        pack.content_aliases ??
        CONTENT_ALIASES,
      asset_generation_queue:
        assetManifestResult.manifest?.asset_generation_queue ??
        pack.asset_generation_queue ??
        ASSET_GENERATION_QUEUE,
      warnings: [...(pack.warnings ?? []), ...assetManifestResult.warnings]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createEmptyPack(`Runtime content pack is missing: ${message}`, assetManifestResult.warnings);
  }
}
