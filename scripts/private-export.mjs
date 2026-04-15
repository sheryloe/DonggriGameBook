import fs from "node:fs/promises";
import path from "node:path";
import {
  PRIVATE_CONTENT_DATA_ROOT,
  PRIVATE_CONTENT_MANIFEST,
  PRIVATE_CONTENT_UI_ROOT,
  PRIVATE_PROMPTS_ANTIGRAVITY_ROOT,
  PRIVATE_STORY_CONCEPT_ROOT,
  PRIVATE_STORY_ROOT,
  PRIVATE_STORY_WORLD_ROOT,
  PUBLIC_RUNTIME_CONTENT_ROOT,
  REPO_ROOT,
  normalizeAssetDirectory,
  normalizeRepoPath,
  relFromRoot,
  resolveNormalizedRepoPath,
  toPosix
} from "./private-paths.mjs";
import { validatePrivateContent } from "./private-validation.mjs";

function createWarning(message, source, severity = "warning") {
  return { message, source, severity };
}

function createFallbackManifest() {
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

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonMaybe(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

async function readJsonWithWarning(filePath, label, warnings, fallbackValue) {
  try {
    return await readJsonMaybe(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(createWarning(`${label} is missing: ${message}`, relFromRoot(filePath), "warning"));
    return fallbackValue;
  }
}

async function listMarkdownDocs(dirPath, warnings) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const absolutePath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listMarkdownDocs(absolutePath, warnings)));
        continue;
      }
      if (/\.md$/iu.test(entry.name)) {
        files.push(absolutePath);
      }
    }
    return files;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(createWarning(`Story docs directory unavailable: ${message}`, relFromRoot(dirPath), "warning"));
    return [];
  }
}

function keyBy(list, keyField) {
  return Object.fromEntries(list.map((entry) => [entry[keyField], entry]));
}

function normalizeChapter(rawChapter) {
  const nodes = Array.isArray(rawChapter.nodes) ? rawChapter.nodes : [];
  const events = Array.isArray(rawChapter.events) ? rawChapter.events : [];
  return {
    ...rawChapter,
    objectives: Array.isArray(rawChapter.objectives) ? rawChapter.objectives : [],
    quest_tracks: Array.isArray(rawChapter.quest_tracks) ? rawChapter.quest_tracks : [],
    nodes,
    nodes_by_id: Object.fromEntries(nodes.map((node) => [node.node_id, node])),
    node_order: nodes.map((node) => node.node_id),
    events,
    events_by_id: Object.fromEntries(events.map((event) => [event.event_id, event])),
    event_order: Object.fromEntries(events.map((event, index) => [event.event_id, index])),
    ending_matrix: Array.isArray(rawChapter.ending_matrix) ? rawChapter.ending_matrix : []
  };
}

function normalizeUiFlows(flows) {
  return Object.fromEntries(
    flows
      .filter((flow) => flow && typeof flow.chapter_id === "string")
      .map((flow) => [flow.chapter_id, flow])
  );
}

function buildResolvedPaths(manifest, uiFlows) {
  return {
    manifest: "public/runtime-content/game-content-pack.json",
    docs_root: manifest.docs?.preferred_root ?? "private/story",
    docs_roots: manifest.docs?.roots ?? ["private/story/concept_arc_01_05", "private/story/world"],
    schemas: Object.fromEntries(
      Object.entries(manifest.schemas ?? {}).map(([key, value]) => [key, normalizeRepoPath(value)])
    ),
    data: Object.fromEntries(
      Object.entries(manifest.data ?? {}).map(([key, value]) => [key, normalizeRepoPath(value)])
    ),
    ui: Object.fromEntries(
      Object.keys(uiFlows).map((chapterId) => [chapterId, `private/content/ui/${chapterId.toLowerCase()}.ui_flow.json`])
    )
  };
}

function buildDocsPayload(files) {
  return Object.fromEntries(
    files.map((filePath) => {
      const normalized = relFromRoot(filePath);
      return [normalized, {
        id: normalized,
        title: path.basename(filePath),
        source_path: normalized,
        body: ""
      }];
    })
  );
}

function deriveAssetGenerationQueue(masterAssets) {
  const routeByType = {
    background: "nanobanana",
    portrait: "character-25",
    threat: "character-25",
    poster: "asset-nano",
    teaser: "asset-nano"
  };

  const groupByType = {
    background: "background",
    portrait: "portrait",
    threat: "boss",
    poster: "document",
    teaser: "document"
  };

  return (masterAssets.assets ?? []).map((asset) => ({
    key: asset.art_key_final,
    group: groupByType[asset.asset_type] ?? "document",
    route: routeByType[asset.asset_type] ?? "asset-nano",
    prompt_hint: normalizeRepoPath(asset.prompt_file ?? asset.asset_id)
  }));
}

async function exportRuntimeContent() {
  const warnings = [];
  const manifest = (await pathExists(PRIVATE_CONTENT_MANIFEST))
    ? {
        ...(await readJsonMaybe(PRIVATE_CONTENT_MANIFEST)),
        docs: {
          preferred_root: "private/story",
          roots: ["private/story/concept_arc_01_05", "private/story/world"]
        },
        assets: {
          generated_root: "public/generated"
        }
      }
    : createFallbackManifest();

  if (!(await pathExists(PRIVATE_CONTENT_MANIFEST))) {
    warnings.push(createWarning("Private package manifest is missing.", "private/content/package_manifest.json", "warning"));
  }

  const statsRegistryRaw = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "stats.registry.json"), "stats registry", warnings, { stats: [] });
  const npcRegistryRaw = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "npc.registry.json"), "npc registry", warnings, { npcs: [] });
  const enemyRegistryRaw = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "enemy.registry.json"), "enemy registry", warnings, { enemies: [] });
  const itemRegistryRaw = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "inventory.items.json"), "item registry", warnings, { items: [] });
  const lootTablesRaw = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "loot_tables.json"), "loot tables", warnings, { loot_tables: [] });
  const encounterTablesRaw = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "encounter_tables.json"), "encounter tables", warnings, { encounter_tables: [] });
  const chaptersIndex = await readJsonWithWarning(path.join(PRIVATE_CONTENT_DATA_ROOT, "chapters.index.json"), "chapters index", warnings, { chapters: [] });

  const chapters = {};
  const chapterOrder = [];
  const uiFlowsRaw = [];

  for (const entry of chaptersIndex.chapters ?? []) {
    const chapterPath = resolveNormalizedRepoPath(entry.file ?? `private/content/data/chapters/${String(entry.chapter_id ?? "").toLowerCase()}.json`);
    const chapter = await readJsonWithWarning(chapterPath, `chapter ${entry.chapter_id}`, warnings, null);
    if (chapter) {
      chapters[entry.chapter_id] = normalizeChapter(chapter);
      chapterOrder.push(entry.chapter_id);
    }

    const uiPath = path.join(PRIVATE_CONTENT_UI_ROOT, `${String(entry.chapter_id).toLowerCase()}.ui_flow.json`);
    const uiFlow = await readJsonWithWarning(uiPath, `ui flow ${entry.chapter_id}`, warnings, null);
    if (uiFlow) {
      uiFlowsRaw.push(uiFlow);
    }
  }

  const docs = buildDocsPayload([
    ...(await listMarkdownDocs(PRIVATE_STORY_CONCEPT_ROOT, warnings)),
    ...(await listMarkdownDocs(PRIVATE_STORY_WORLD_ROOT, warnings))
  ]);

  const uiFlows = normalizeUiFlows(uiFlowsRaw);

  const pack = {
    manifest_path: "public/runtime-content/game-content-pack.json",
    manifest,
    resolved_paths: buildResolvedPaths(manifest, uiFlows),
    chapter_order: chapterOrder,
    chapters,
    ui_flows: uiFlows,
    stats_registry: keyBy(statsRegistryRaw.stats ?? [], "key"),
    npcs: keyBy(npcRegistryRaw.npcs ?? [], "npc_id"),
    enemies: keyBy(enemyRegistryRaw.enemies ?? [], "enemy_id"),
    items: keyBy(itemRegistryRaw.items ?? [], "item_id"),
    loot_tables: keyBy(lootTablesRaw.loot_tables ?? [], "loot_table_id"),
    encounter_tables: keyBy(encounterTablesRaw.encounter_tables ?? [], "encounter_table_id"),
    docs,
    content_aliases: [],
    asset_generation_queue: [],
    warnings
  };

  return { pack, warnings };
}

async function exportRuntimeAssetManifest() {
  const warnings = [];
  const aliasPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "RUNTIME_ART_KEY_ALIAS.json");
  const stitchPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "STITCH_RENDER_QUEUE.json");
  const masterAssetPath = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "MASTER_ASSET_MANIFEST.json");

  const aliasManifest = await readJsonWithWarning(aliasPath, "runtime art alias manifest", warnings, { mappings: [] });
  const stitchManifest = await readJsonWithWarning(stitchPath, "stitch render queue", warnings, { tasks: [] });
  const masterAssetManifest = await readJsonWithWarning(masterAssetPath, "master asset manifest", warnings, { assets: [] });

  const mappings = (aliasManifest.mappings ?? []).map((entry) => ({
    ...entry,
    filename_target: entry.filename_target
  }));

  const knownArtKeys = [...new Set([
    ...mappings.flatMap((entry) => [entry.runtime_art_key, entry.art_key_final]),
    ...(masterAssetManifest.assets ?? []).flatMap((asset) => [asset.art_key_final, ...(asset.runtime_art_keys ?? [])])
  ].filter(Boolean))];

  const assetGenerationQueue = deriveAssetGenerationQueue(masterAssetManifest);

  const tasks = (stitchManifest.tasks ?? []).map((task) => ({
    task_id: task.task_id,
    kind: task.kind,
    part_id: task.part_id ?? null,
    chapter_id: task.chapter_id ?? null,
    prompt_file: task.prompt_file ? normalizeRepoPath(task.prompt_file) : null,
    public_runtime_target: task.public_runtime_target ? normalizeRepoPath(task.public_runtime_target) : null,
    target_path: task.target_path ? normalizeRepoPath(task.target_path) : null
  }));

  return {
    manifest: {
      version: String(aliasManifest.version ?? stitchManifest.version ?? "1.0.0"),
      generated_at: new Date().toISOString(),
      known_art_keys: knownArtKeys,
      mappings,
      tasks,
      content_aliases: [],
      asset_generation_queue: assetGenerationQueue
    },
    warnings
  };
}

async function main() {
  await ensureDir(PUBLIC_RUNTIME_CONTENT_ROOT);

  const [{ pack, warnings: contentWarnings }, { manifest: runtimeAssetManifest, warnings: assetWarnings }] = await Promise.all([
    exportRuntimeContent(),
    exportRuntimeAssetManifest()
  ]);

  pack.asset_generation_queue = runtimeAssetManifest.asset_generation_queue ?? [];
  pack.content_aliases = runtimeAssetManifest.content_aliases ?? [];
  pack.warnings = [...pack.warnings, ...assetWarnings];

  await fs.writeFile(
    path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "game-content-pack.json"),
    `${JSON.stringify(pack, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "runtime-asset-manifest.json"),
    `${JSON.stringify(runtimeAssetManifest, null, 2)}\n`,
    "utf8"
  );

  const validation = await validatePrivateContent();
  await fs.writeFile(
    path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "content-diagnostics.json"),
    `${JSON.stringify(validation.diagnostics, null, 2)}\n`,
    "utf8"
  );

  const result = {
    output: {
      pack: relFromRoot(path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "game-content-pack.json")),
      runtime_asset_manifest: relFromRoot(path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "runtime-asset-manifest.json")),
      diagnostics: relFromRoot(path.join(PUBLIC_RUNTIME_CONTENT_ROOT, "content-diagnostics.json"))
    },
    chapter_count: pack.chapter_order.length,
    ui_flow_count: Object.keys(pack.ui_flows).length,
    warnings: [...contentWarnings, ...assetWarnings].length,
    validation_ok: validation.ok
  };

  console.log(JSON.stringify(result, null, 2));
  if (!validation.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
