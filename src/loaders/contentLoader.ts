import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import {
  ASSET_GENERATION_QUEUE,
  CONTENT_ALIASES,
  resolveAssetKey
} from "./assetResolver";
import type {
  ChapterDefinition,
  ChaptersIndex,
  EncounterTable,
  EnemyDefinition,
  GameContentPack,
  InventoryItem,
  JsonPath,
  LootTable,
  NarrativeDoc,
  NpcDefinition,
  PackageManifest,
  RawChapterPackage,
  RawEncounterTables,
  RawEnemyRegistry,
  RawItemDatabase,
  RawLootTables,
  RawNpcRegistry,
  RawStatsRegistry,
  ResolvedProjectPaths,
  RuntimeWarning,
  StatRegistryEntry,
  UIFlow
} from "../types/game";

const jsonModules = {
  ...import.meta.glob("../../package_manifest.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../codex_webgame_pack/package_manifest.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../schemas/*.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../ui/*.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../data/**/*.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../codex_webgame_pack/schemas/*.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../codex_webgame_pack/ui/*.json", { eager: true, import: "default" }),
  ...import.meta.glob("../../codex_webgame_pack/data/**/*.json", { eager: true, import: "default" })
} as Record<string, unknown>;

const markdownModules = {
  ...import.meta.glob("../../apocalypse_arc_01_05/*.md", {
    eager: true,
    query: "?raw",
    import: "default"
  }),
  ...import.meta.glob("../../docs/concept_arc_01_05_md/*.md", {
    eager: true,
    query: "?raw",
    import: "default"
  })
} as Record<string, string>;

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

const validatorCache = new Map<string, ValidateFunction>();

function normalizeModulePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^(\.\.\/)+/u, "");
}

const indexedJsonModules = Object.fromEntries(
  Object.entries(jsonModules).map(([path, value]) => [normalizeModulePath(path), value])
) as Record<string, unknown>;

const indexedMarkdownModules = Object.fromEntries(
  Object.entries(markdownModules).map(([path, value]) => [normalizeModulePath(path), value])
) as Record<string, string>;

function makeWarning(
  message: string,
  source: string,
  severity: RuntimeWarning["severity"] = "warning"
): RuntimeWarning {
  return {
    message,
    source,
    severity
  };
}

function hasJsonModule(path: string): boolean {
  return Object.prototype.hasOwnProperty.call(indexedJsonModules, path);
}

function hasMarkdownRoot(root: string): boolean {
  return Object.keys(indexedMarkdownModules).some((path) => path.startsWith(`${root}/`));
}

function readJson<T>(path: string): T {
  if (!hasJsonModule(path)) {
    throw new Error(`Bundled JSON module is missing: ${path}`);
  }

  return indexedJsonModules[path] as T;
}

function mapById<T extends object, K extends keyof T>(items: readonly T[], key: K): Record<string, T> {
  return Object.fromEntries(items.map((item) => [String(item[key]), item])) as Record<string, T>;
}

function pathCandidates(path: string, manifestPath: string): string[] {
  const manifestParts = manifestPath.split("/");
  manifestParts.pop();
  const manifestDir = manifestParts.join("/");
  const manifestScoped = manifestDir ? `${manifestDir}/${path}` : path;
  const candidates = [manifestScoped, path];

  if (
    path.startsWith("data/") ||
    path.startsWith("schemas/") ||
    path.startsWith("ui/") ||
    path.startsWith("img/")
  ) {
    candidates.push(`codex_webgame_pack/${path}`);
  }

  return [...new Set(candidates.map(normalizeModulePath))];
}

function resolveJsonPath(path: string, manifestPath: string): string | null {
  return pathCandidates(path, manifestPath).find((candidate) => hasJsonModule(candidate)) ?? null;
}

function resolveDocsRoot(manifest: PackageManifest): string {
  const preferred = manifest.docs?.preferred_root;
  if (preferred && hasMarkdownRoot(preferred)) {
    return preferred;
  }

  if (hasMarkdownRoot("apocalypse_arc_01_05")) {
    return "apocalypse_arc_01_05";
  }

  if (hasMarkdownRoot("docs/concept_arc_01_05_md")) {
    return "docs/concept_arc_01_05_md";
  }

  return "docs/concept_arc_01_05_md";
}

function extractTitle(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#\s+(.+)$/mu);
  return heading?.[1]?.trim() || fallback;
}

function getValidator(schemaPath: string, warnings: RuntimeWarning[]): ValidateFunction | null {
  const cached = validatorCache.get(schemaPath);
  if (cached) {
    return cached;
  }

  try {
    const schema = readJson<object>(schemaPath);
    const validator = ajv.compile(schema);
    validatorCache.set(schemaPath, validator);
    return validator;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(makeWarning(`Schema compile failed: ${message}`, schemaPath));
    return null;
  }
}

function validatePayload(
  schemaPath: string | null,
  payload: unknown,
  source: string,
  warnings: RuntimeWarning[]
): void {
  if (!schemaPath) {
    warnings.push(makeWarning("Schema path could not be resolved for validation.", source, "info"));
    return;
  }

  const validator = getValidator(schemaPath, warnings);
  if (!validator) {
    return;
  }

  const valid = validator(payload);
  if (valid) {
    return;
  }

  const message =
    validator.errors
      ?.map((error) => `${error.instancePath || "/"} ${error.message}`)
      .join("; ") || "Schema validation failed.";
  warnings.push(makeWarning(message, source));
}

function normalizeChapter(raw: RawChapterPackage): ChapterDefinition {
  return {
    chapter_id: raw.chapter_id,
    title: raw.title,
    role: raw.role,
    entry_node_id: raw.entry_node_id,
    exit_node_ids: raw.exit_node_ids,
    recommended_level: raw.recommended_level,
    ui_profile: raw.ui_profile,
    objectives: raw.objectives,
    quest_tracks: raw.quest_tracks ?? [],
    nodes: raw.nodes,
    nodes_by_id: mapById(raw.nodes, "node_id"),
    node_order: raw.nodes.map((node) => node.node_id),
    events: raw.events,
    events_by_id: mapById(raw.events, "event_id"),
    event_order: Object.fromEntries(raw.events.map((event, index) => [event.event_id, index])),
    boss_event_id: raw.boss_event_id
  };
}

function collectDocs(root: string): Record<string, NarrativeDoc> {
  return Object.fromEntries(
    Object.entries(indexedMarkdownModules)
      .filter(([path]) => path.startsWith(`${root}/`))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([path, body]) => {
        const fallbackTitle = path.split("/").pop()?.replace(/\.md$/u, "") ?? path;
        const id = path.replace(`${root}/`, "").replace(/\.md$/u, "");
        const doc: NarrativeDoc = {
          id,
          title: extractTitle(body, fallbackTitle),
          source_path: path,
          body
        };

        return [id, doc];
      })
  );
}

function resolveManifestPathInternal(): JsonPath {
  const candidates = ["codex_webgame_pack/package_manifest.json", "package_manifest.json"];
  const resolved = candidates.find((candidate) => hasJsonModule(candidate));

  if (!resolved) {
    throw new Error("No package manifest found in bundled project files.");
  }

  return resolved;
}

function pushMissingPathWarning(
  warnings: RuntimeWarning[],
  kind: string,
  logicalPath: string,
  manifestPath: string
): void {
  warnings.push(
    makeWarning(
      `${kind} could not be resolved from manifest path "${logicalPath}" via ${manifestPath}.`,
      kind,
      "error"
    )
  );
}

export function resolveManifestPath(): string {
  return resolveManifestPathInternal();
}

export async function loadPack(): Promise<GameContentPack> {
  const warnings: RuntimeWarning[] = [];
  const manifestPath = resolveManifestPathInternal();
  const manifest = readJson<PackageManifest>(manifestPath);

  const resolvedPaths: ResolvedProjectPaths = {
    manifest: manifestPath,
    docs_root: resolveDocsRoot(manifest),
    schemas: {},
    data: {},
    ui: {}
  };

  const chapterSchemaPath = resolveJsonPath(manifest.schemas.chapter, manifestPath);
  const itemSchemaPath = resolveJsonPath(manifest.schemas.item, manifestPath);
  const uiSchemaPath = resolveJsonPath(manifest.schemas.ui_flow, manifestPath);
  resolvedPaths.schemas.chapter = chapterSchemaPath ?? undefined;
  resolvedPaths.schemas.item = itemSchemaPath ?? undefined;
  resolvedPaths.schemas.ui_flow = uiSchemaPath ?? undefined;

  const chaptersIndexPath = resolveJsonPath(manifest.data.chapters_index, manifestPath);
  if (!chaptersIndexPath) {
    throw new Error("Chapters index could not be resolved.");
  }
  resolvedPaths.data.chapters_index = chaptersIndexPath;

  const statsPath = resolveJsonPath(manifest.data.stats, manifestPath);
  const npcsPath = resolveJsonPath(manifest.data.npcs, manifestPath);
  const enemiesPath = resolveJsonPath(manifest.data.enemies, manifestPath);
  const itemsPath = resolveJsonPath(manifest.data.items, manifestPath);
  const lootTablesPath = resolveJsonPath(manifest.data.loot_tables, manifestPath);
  const encounterTablesPath = resolveJsonPath(manifest.data.encounter_tables, manifestPath);

  const requiredDataPaths = {
    stats: statsPath,
    npcs: npcsPath,
    enemies: enemiesPath,
    items: itemsPath,
    loot_tables: lootTablesPath,
    encounter_tables: encounterTablesPath
  } as const;

  for (const [key, resolved] of Object.entries(requiredDataPaths)) {
    const logicalPath = manifest.data[key as keyof PackageManifest["data"]];
    if (!resolved) {
      pushMissingPathWarning(warnings, key, logicalPath, manifestPath);
      throw new Error(`Required data registry could not be resolved: ${logicalPath}`);
    }

    resolvedPaths.data[key] = resolved;
  }

  const chaptersIndex = readJson<ChaptersIndex>(chaptersIndexPath);
  const rawStats = readJson<RawStatsRegistry>(statsPath!);
  const rawNpcs = readJson<RawNpcRegistry>(npcsPath!);
  const rawEnemies = readJson<RawEnemyRegistry>(enemiesPath!);
  const rawItems = readJson<RawItemDatabase>(itemsPath!);
  const rawLootTables = readJson<RawLootTables>(lootTablesPath!);
  const rawEncounterTables = readJson<RawEncounterTables>(encounterTablesPath!);

  validatePayload(itemSchemaPath, rawItems, itemsPath!, warnings);

  const chapters: Record<string, ChapterDefinition> = {};
  for (const chapterMeta of chaptersIndex.chapters) {
    const chapterPath = resolveJsonPath(chapterMeta.file, manifestPath);
    if (!chapterPath) {
      warnings.push(
        makeWarning(`Chapter file ${chapterMeta.file} could not be resolved.`, chapterMeta.chapter_id, "error")
      );
      continue;
    }

    resolvedPaths.data[`chapter:${chapterMeta.chapter_id}`] = chapterPath;
    const rawChapter = readJson<RawChapterPackage>(chapterPath);
    validatePayload(chapterSchemaPath, rawChapter, chapterPath, warnings);

    if (chapters[rawChapter.chapter_id]) {
      warnings.push(makeWarning(`Duplicate chapter ID detected: ${rawChapter.chapter_id}`, chapterPath));
    }

    chapters[rawChapter.chapter_id] = normalizeChapter(rawChapter);
  }

  const uiFlows: Record<string, UIFlow> = {};
  for (const uiPath of manifest.ui.chapters) {
    const resolvedUiPath = resolveJsonPath(uiPath, manifestPath);
    if (!resolvedUiPath) {
      warnings.push(makeWarning(`UI flow ${uiPath} could not be resolved.`, uiPath, "error"));
      continue;
    }

    const uiFlow = readJson<UIFlow>(resolvedUiPath);
    validatePayload(uiSchemaPath, uiFlow, resolvedUiPath, warnings);

    if (!chapters[uiFlow.chapter_id]) {
      warnings.push(makeWarning(`UI flow references missing chapter ${uiFlow.chapter_id}.`, resolvedUiPath));
    }

    uiFlows[uiFlow.chapter_id] = uiFlow;
    resolvedPaths.ui[uiFlow.chapter_id] = resolvedUiPath;
  }

  for (const chapterId of chaptersIndex.chapters.map((entry) => entry.chapter_id)) {
    if (!chapters[chapterId]) {
      warnings.push(makeWarning(`Chapter ${chapterId} is missing from the loaded pack.`, "chapters", "error"));
    }

    if (!uiFlows[chapterId]) {
      warnings.push(makeWarning(`UI flow for chapter ${chapterId} is missing.`, "ui", "warning"));
    }
  }

  const docs = collectDocs(resolvedPaths.docs_root);

  return {
    manifest_path: manifestPath,
    manifest,
    resolved_paths: resolvedPaths,
    chapter_order: chaptersIndex.chapters.map((chapter) => chapter.chapter_id),
    chapters,
    ui_flows: uiFlows,
    stats_registry: Object.fromEntries(rawStats.stats.map((entry: StatRegistryEntry) => [entry.key, entry])),
    npcs: mapById(rawNpcs.npcs as NpcDefinition[], "npc_id"),
    enemies: mapById(rawEnemies.enemies as EnemyDefinition[], "enemy_id"),
    items: mapById(rawItems.items as InventoryItem[], "item_id"),
    loot_tables: mapById(rawLootTables.loot_tables as LootTable[], "loot_table_id"),
    encounter_tables: mapById(rawEncounterTables.encounter_tables as EncounterTable[], "encounter_table_id"),
    docs,
    content_aliases: CONTENT_ALIASES,
    asset_generation_queue: ASSET_GENERATION_QUEUE,
    warnings
  };
}

export { resolveAssetKey };
