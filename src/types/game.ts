export type ChapterId = string;
export type NodeId = string;
export type EventId = string;
export type ItemId = string;
export type EnemyId = string;
export type LootTableId = string;
export type EncounterTableId = string;
export type NpcId = string;
export type SaveSlotId = string;
export type StatValue = number | string;
export type RequirementExpression = string;
export type JsonPath = string;
export type MarkdownPath = string;

export type AssetModelRoute = "npc-main-pro" | "character-25" | "nanobanana" | "asset-nano";
export type AssetGenerationGroup = "background" | "portrait" | "boss" | "document";

export type EffectOperation =
  | "set_flag"
  | "clear_flag"
  | "add_stat"
  | "sub_stat"
  | "grant_item"
  | "remove_item"
  | "unlock_node"
  | "unlock_route"
  | "set_route"
  | "add_trust"
  | "add_reputation"
  | "grant_loot_table"
  | "set_value";

export type UIScreenType =
  | "chapter_briefing"
  | "world_map"
  | "event_dialogue"
  | "loot_resolution"
  | "boss_intro"
  | "combat_arena"
  | "result_summary"
  | "route_select"
  | "safehouse";

export type OverlayKey = "inventory" | "status" | "objectives" | "warnings";
export type ChapterStatus = "locked" | "available" | "in_progress" | "completed";
export type BattleAction = "attack" | "skill" | "item" | "move" | "withdraw";
export type RuntimeWarningSeverity = "info" | "warning" | "error";

export interface RuntimeWarning {
  message: string;
  source: string;
  severity: RuntimeWarningSeverity;
}

export interface PackageManifest {
  version: string;
  game_id: string;
  title: string;
  schemas: {
    chapter: JsonPath;
    item: JsonPath;
    ui_flow: JsonPath;
  };
  data: {
    stats: JsonPath;
    npcs: JsonPath;
    enemies: JsonPath;
    items: JsonPath;
    loot_tables: JsonPath;
    encounter_tables: JsonPath;
    chapters_index: JsonPath;
  };
  ui: {
    overview?: string;
    chapters: JsonPath[];
  };
  docs?: {
    preferred_root?: string;
  };
  assets?: {
    generated_root?: string;
  };
}

export interface ChaptersIndexEntry {
  chapter_id: ChapterId;
  title: string;
  file: JsonPath;
}

export interface ChaptersIndex {
  version: string;
  game_id: string;
  chapters: ChaptersIndexEntry[];
}

export interface StatRegistryEntry {
  key: string;
  type: "number" | "string";
  default: StatValue;
}

export interface RawStatsRegistry {
  version: string;
  game_id: string;
  stats: StatRegistryEntry[];
}

export interface NpcDefinition {
  npc_id: NpcId;
  name_ko: string;
  first_chapter: ChapterId;
  role: string;
  faction: string;
  tone_keywords: string[];
  sample_lines: string[];
}

export interface RawNpcRegistry {
  version: string;
  game_id: string;
  npcs: NpcDefinition[];
}

export interface EnemyDefinition {
  enemy_id: EnemyId;
  name_ko: string;
  archetype: string;
  introduced_in: ChapterId;
  tags: string[];
  base_stats: Record<string, number>;
  behavior: string;
  weak_points: string[];
  drops: ItemId[];
}

export interface RawEnemyRegistry {
  version: string;
  game_id: string;
  enemies: EnemyDefinition[];
}

export interface InventoryItemEffect {
  effect_type: string;
  value: unknown;
}

export interface InventoryItemRecipeInput {
  item_id: ItemId;
  qty: number;
}

export interface InventoryItem {
  item_id: ItemId;
  name_ko: string;
  name_en?: string;
  category: string;
  subcategory?: string;
  rarity: string;
  stackable: boolean;
  max_stack: number;
  weight: number;
  size?: number;
  value: number;
  introduced_in: ChapterId;
  equip_slot?: string;
  durability?: {
    max?: number;
    current?: number;
  };
  stats?: Record<string, unknown>;
  effects?: InventoryItemEffect[];
  recipe?: {
    station?: string;
    inputs?: InventoryItemRecipeInput[];
  };
  tags?: string[];
  description: string;
}

export interface RawItemDatabase {
  version: string;
  game_id: string;
  categories: string[];
  items: InventoryItem[];
}

export interface LootEntry {
  item_id: ItemId;
  weight: number;
  qty_min: number;
  qty_max: number;
}

export interface LootTable {
  loot_table_id: LootTableId;
  rolls: number;
  entries: LootEntry[];
}

export interface RawLootTables {
  version: string;
  game_id: string;
  loot_tables: LootTable[];
}

export interface EncounterUnit {
  enemy_id: EnemyId;
  count: number;
}

export interface EncounterTable {
  encounter_table_id: EncounterTableId;
  threat_level: string;
  units: EncounterUnit[];
}

export interface RawEncounterTables {
  version: string;
  game_id: string;
  encounter_tables: EncounterTable[];
}

export interface ObjectiveDefinition {
  objective_id: string;
  text: string;
  required: boolean;
  complete_when: RequirementExpression[];
}

export interface QuestTrackDefinition {
  quest_track_id: string;
  kind: "main" | "side";
  title: string;
  summary: string;
  entry_event_id?: EventId;
  completion_event_id?: EventId;
  objective_ids?: string[];
  unlock_when?: RequirementExpression[];
  reveal_cap?: string;
}

export interface ConnectionCost {
  time: number;
  noise: number;
  contamination: number;
}

export interface MapConnection {
  to: NodeId;
  travel_type: string;
  requires: RequirementExpression[];
  cost: ConnectionCost;
}

export interface MapNode {
  node_id: NodeId;
  name: string;
  node_type: string;
  description: string;
  coordinates: {
    x: number;
    y: number;
  };
  encounter_table_id?: EncounterTableId;
  loot_table_ids?: LootTableId[];
  npc_ids?: NpcId[];
  connections: MapConnection[];
  event_ids: EventId[];
  revisit_rule: string;
  tags?: string[];
}

export interface EffectDefinition {
  op: EffectOperation | string;
  target: string;
  value?: unknown;
  meta?: Record<string, unknown>;
}

export interface EventChoice {
  choice_id: string;
  label: string;
  conditions: RequirementExpression[];
  preview?: string;
  effects: EffectDefinition[];
  next_event_id: string;
}

export interface EventPresentation {
  layout: string;
  art_key: string;
  music_key: string;
  widget_overrides: string[];
  allow_multi_choice?: boolean;
}

export interface EventTextBlock {
  summary: string;
  body: string[];
}

export interface CombatDefinition {
  encounter_table_id: EncounterTableId;
  boss_id?: EnemyId;
  arena_tags?: string[];
  victory_effects: EffectDefinition[];
  defeat_effects: EffectDefinition[];
}

export interface EventDefinition {
  event_id: EventId;
  event_type: string;
  node_id: NodeId;
  title: string;
  repeatable: boolean;
  once_per_run: boolean;
  priority: number;
  conditions: RequirementExpression[];
  presentation: EventPresentation;
  text: EventTextBlock;
  npc_ids?: NpcId[];
  loot_table_ids?: LootTableId[];
  combat?: CombatDefinition;
  choices: EventChoice[];
  on_enter_effects: EffectDefinition[];
  on_complete_effects: EffectDefinition[];
  next_event_id?: EventId;
  fail_event_id?: EventId;
}

export interface RawChapterPackage {
  version: string;
  game_id: string;
  chapter_id: ChapterId;
  title: string;
  role: string;
  entry_node_id: NodeId;
  exit_node_ids: NodeId[];
  recommended_level: number;
  ui_profile: {
    theme: string;
    special_widgets: string[];
  };
  objectives: ObjectiveDefinition[];
  quest_tracks?: QuestTrackDefinition[];
  nodes: MapNode[];
  events: EventDefinition[];
  boss_event_id?: EventId;
}

export interface ChapterDefinition {
  chapter_id: ChapterId;
  title: string;
  role: string;
  entry_node_id: NodeId;
  exit_node_ids: NodeId[];
  recommended_level: number;
  ui_profile: {
    theme: string;
    special_widgets: string[];
  };
  objectives: ObjectiveDefinition[];
  quest_tracks: QuestTrackDefinition[];
  nodes: MapNode[];
  nodes_by_id: Record<NodeId, MapNode>;
  node_order: NodeId[];
  events: EventDefinition[];
  events_by_id: Record<EventId, EventDefinition>;
  event_order: Record<EventId, number>;
  boss_event_id?: EventId;
}

export interface UIScreenDefinition {
  screen_id: string;
  screen_type: UIScreenType;
  title: string;
  purpose: string;
  widgets: string[];
  data_sources: string[];
  primary_actions: string[];
  notes?: string[];
}

export interface UITransition {
  from_screen_id: string;
  to_screen_id: string;
  trigger: string;
  conditions: RequirementExpression[];
  notes?: string;
}

export interface UIFlow {
  version: string;
  game_id: string;
  chapter_id: ChapterId;
  title: string;
  entry_screen_id: string;
  screens: UIScreenDefinition[];
  transitions: UITransition[];
  notes?: string[];
}

export interface NarrativeDoc {
  id: string;
  title: string;
  source_path: MarkdownPath;
  body: string;
}

export interface ContentAlias {
  kind: "npc" | "enemy" | "item" | "doc";
  source_name: string;
  canonical_id: string;
  display_name: string;
  note: string;
}

export interface AssetGenerationJob {
  key: string;
  group: AssetGenerationGroup;
  route: AssetModelRoute;
  prompt_hint: string;
}

export interface AssetResolution {
  key: string;
  src?: string;
  fallback_srcs: string[];
  candidates: string[];
  route: AssetModelRoute;
  matched_from: "direct" | "generated" | "fallback";
}

export interface ResolvedProjectPaths {
  manifest: JsonPath;
  docs_root: string;
  schemas: Partial<Record<"chapter" | "item" | "ui_flow", JsonPath>>;
  data: Partial<Record<string, JsonPath>>;
  ui: Partial<Record<ChapterId, JsonPath>>;
}

export interface GameContentPack {
  manifest_path: JsonPath;
  manifest: PackageManifest;
  resolved_paths: ResolvedProjectPaths;
  chapter_order: ChapterId[];
  chapters: Record<ChapterId, ChapterDefinition>;
  ui_flows: Record<ChapterId, UIFlow>;
  stats_registry: Record<string, StatRegistryEntry>;
  npcs: Record<NpcId, NpcDefinition>;
  enemies: Record<EnemyId, EnemyDefinition>;
  items: Record<ItemId, InventoryItem>;
  loot_tables: Record<LootTableId, LootTable>;
  encounter_tables: Record<EncounterTableId, EncounterTable>;
  docs: Record<string, NarrativeDoc>;
  content_aliases: ContentAlias[];
  asset_generation_queue: AssetGenerationJob[];
  warnings: RuntimeWarning[];
}

export interface InventoryState {
  quantities: Record<ItemId, number>;
  equipped: Partial<Record<string, ItemId>>;
  carry_weight_modifier: number;
}

export interface EventVisitState {
  seen_count: number;
  completed_count: number;
  entered_once: boolean;
  last_choice_id?: string;
}

export interface ChapterProgressState {
  status: ChapterStatus;
  started_at?: string;
  completed_at?: string;
  objective_completion: Record<string, boolean>;
  selected_route?: string;
  last_visited_node_id?: NodeId;
  ended_by?: string;
}

export interface LootDrop {
  item_id: ItemId;
  quantity: number;
  selected: boolean;
}

export interface LootSessionState {
  loot_table_id: LootTableId;
  source_chapter_id: ChapterId;
  source_node_id: NodeId;
  source_event_id: EventId;
  drops: LootDrop[];
  pending_next_event_id: string | null;
  return_screen: UIScreenType;
}

export interface BattleUnitState {
  enemy_id: EnemyId;
  name: string;
  max_hp: number;
  current_hp: number;
  alive: boolean;
}

export interface BattleState {
  status: "idle" | "active" | "victory" | "defeat";
  source_chapter_id?: ChapterId;
  source_node_id?: NodeId;
  source_event_id?: EventId;
  encounter_table_id?: EncounterTableId;
  boss_id?: EnemyId;
  arena_tags: string[];
  units: BattleUnitState[];
  turn_count: number;
  pending_choice_id?: string;
  pending_next_event_id?: string | null;
  pending_choice_effects: EffectDefinition[];
  victory_effects: EffectDefinition[];
  defeat_effects: EffectDefinition[];
  result?: "victory" | "defeat";
}

export interface ChapterOutcome {
  chapter_id: ChapterId;
  title: string;
  summary: string;
  next_chapter_id?: ChapterId;
  campaign_complete: boolean;
}

export interface RuntimeSnapshot {
  current_chapter_id: ChapterId;
  current_node_id: NodeId | null;
  current_event_id: EventId | null;
  current_screen_id: string | null;
  ui_screen: UIScreenType;
  overlays: Record<OverlayKey, boolean>;
  stats: Record<string, StatValue>;
  flags: Record<string, boolean>;
  inventory: InventoryState;
  chapter_progress: Record<ChapterId, ChapterProgressState>;
  visited_nodes: Record<ChapterId, Record<NodeId, true>>;
  visited_events: Record<ChapterId, Record<EventId, EventVisitState>>;
  loot_session: LootSessionState | null;
  battle_state: BattleState;
  chapter_outcome: ChapterOutcome | null;
  campaign_complete: boolean;
  run_seed: string;
}

export interface SaveSlotState {
  id: SaveSlotId;
  label: string;
  updated_at?: string;
  snapshot: RuntimeSnapshot;
}
