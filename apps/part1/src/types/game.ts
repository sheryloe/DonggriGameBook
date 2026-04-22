/**
 * Antigravity Game Engine Types
 * Based on schemas/chapter_event.schema.json, inventory_item.schema.json, ui_flow.schema.json
 */

// --- Common Types ---

export interface Coordinates {
  x: number;
  y: number;
}

export interface ConnectionCost {
  time: number;
  noise: number;
  contamination: number;
}

export interface Connection {
  to: string;
  travel_type: string;
  requires: string[];
  cost: ConnectionCost;
}

// --- Chapter & Node Types ---

export interface MapNode {
  node_id: string;
  name: string;
  node_type: string;
  description: string;
  coordinates: Coordinates;
  encounter_table_id?: string;
  loot_table_ids?: string[];
  npc_ids?: string[];
  connections: Connection[];
  event_ids: string[];
  revisit_rule: string;
  tags?: string[];
}

export interface Objective {
  objective_id: string;
  text: string;
  required: boolean;
  complete_when: string[];
}

export interface QuestTrack {
  quest_track_id: string;
  kind: "main" | "side";
  title: string;
  summary: string;
  entry_event_id?: string;
  completion_event_id?: string;
  objective_ids?: string[];
  unlock_when?: string[];
  reveal_cap?: string;
}

// --- Event Types ---

export type EffectOp = 
  | "set_flag" | "clear_flag" 
  | "add_stat" | "sub_stat" 
  | "grant_item" | "remove_item" 
  | "unlock_node" | "unlock_route" | "set_route" 
  | "add_trust" | "add_reputation" 
  | "grant_loot_table" | "set_value";

export interface Effect {
  op: EffectOp;
  target: string;
  value?: any;
  meta?: Record<string, any>;
}

export interface Choice {
  choice_id: string;
  label: string;
  conditions: string[];
  preview?: string;
  effects: Effect[];
  next_event_id: string | null;
}

export interface SceneBlock {
  block_id: string;
  kind: string;
  speaker_id?: string;
  speaker_label?: string;
  lines: string[];
  emphasis?: string;
}

export interface TextBlock {
  summary: string;
  body: string[];
  carry_line?: string;
  scene_blocks?: SceneBlock[];
}

export interface Presentation {
  layout: string;
  art_key: string;
  music_key: string;
  widget_overrides: string[];
  allow_multi_choice?: boolean;
  cinematic_still_key?: string;
  result_variant?: string;
}

export interface CombatDef {
  encounter_table_id: string;
  boss_id?: string;
  arena_tags?: string[];
  victory_effects: Effect[];
  defeat_effects: Effect[];
  fail_event_id?: string;
  setback_event_id?: string;
}

export interface GameEvent {
  event_id: string;
  event_type: string;
  node_id: string;
  title: string;
  repeatable: boolean;
  once_per_run: boolean;
  priority: number;
  conditions: string[];
  presentation: Presentation;
  text: TextBlock;
  npc_ids?: string[];
  loot_table_ids?: string[];
  combat?: CombatDef;
  choices: Choice[];
  on_enter_effects: Effect[];
  on_complete_effects: Effect[];
  next_event_id?: string;
  fail_event_id?: string;
}

export interface Chapter {
  version: string;
  game_id: string;
  chapter_id: string;
  title: string;
  role: string;
  entry_node_id: string;
  exit_node_ids: string[];
  recommended_level: number;
  estimated_first_run_minutes: number;
  field_action_budget: number;
  carryover_keys: string[];
  repeatable_scavenging_events: string[];
  demo_route: string;
  ui_profile: {
    theme: string;
    special_widgets: string[];
  };
  objectives: Objective[];
  quest_tracks?: QuestTrack[];
  nodes: MapNode[];
  events: GameEvent[];
  boss_event_id?: string;
  chapter_cinematic?: any; // chapterCinematic in schema
  ending_matrix?: any[]; // endingRule in schema
}

// --- Inventory & Item Types ---

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ItemCategory = "weapon" | "ammo" | "gear" | "consumable" | "crafting" | "utility" | "quest" | "barter";

export interface Item {
  item_id: string;
  name_ko: string;
  name_en?: string;
  category: ItemCategory;
  subcategory?: string;
  rarity: ItemRarity;
  stackable: boolean;
  max_stack: number;
  weight: number;
  size?: number;
  value: number;
  introduced_in: string;
  equip_slot?: string;
  durability?: {
    max: number;
    current: number;
  };
  stats?: Record<string, any>;
  effects?: Array<{ effect_type: string; value: any }>;
  recipe?: {
    station: string;
    inputs: Array<{ item_id: string; qty: number }>;
  };
  tags?: string[];
  description: string;
}

// --- UI Flow Types ---

export interface Screen {
  screen_id: string;
  screen_type: string;
  title: string;
  purpose: string;
  widgets: string[];
  data_sources: string[];
  primary_actions: string[];
  notes?: string[];
}

export interface Transition {
  from_screen_id: string;
  to_screen_id: string;
  trigger: string;
  conditions: string[];
  notes?: string;
}

export interface UIFlow {
  version: string;
  game_id: string;
  chapter_id: string;
  title: string;
  entry_screen_id: string;
  screens: Screen[];
  transitions: Transition[];
  notes?: string[];
}

// --- Game State Types (for Store) ---

export interface InventoryItem {
  item_id: string;
  quantity: number;
  meta?: Record<string, any>;
}

export interface GameState {
  // Metadata
  currentChapterId: string | null;
  currentNodeId: string | null;
  currentEventId: string | null;
  currentScreenId: string | null;

  // Stats & Progress
  stats: Record<string, number>;
  flags: Record<string, boolean>;
  inventory: InventoryItem[];
  
  // Chapter Specific
  visitedNodes: string[];
  completedEvents: string[];
  chapterProgress: number;
  fieldActionBudget: number;

  // Battle State
  battleState: {
    active: boolean;
    enemyGroupId?: string;
    turn: number;
    log: string[];
  } | null;

  // Save Slots
  saveSlots: Record<number, any>;
}
