export interface StoryState {
  supplies: number;
  noise: number;
}

export type StoryEffect = Partial<StoryState>;
export type StoryStatKey = keyof StoryState;
export type StoryOperator = "gte" | "lte";
export type StoryChoiceTone = "official" | "quiet" | "risky" | "community";

export interface StoryRequirement {
  stat: StoryStatKey;
  op: StoryOperator;
  value: number;
}

export interface StoryChoice {
  label: string;
  to: string;
  effects: StoryEffect;
  requirements?: StoryRequirement[];
  hint?: string;
  badge?: string;
  tone?: StoryChoiceTone;
}

export interface EndingSummary {
  code: "clear" | "debt" | "quarantine";
  headline: string;
  debrief: string;
  tags: string[];
  recommendation: string;
}

export type AssetKind =
  | "intake-grid"
  | "sleep-grid"
  | "briefing-tape"
  | "route-schematic"
  | "salvage-rack"
  | "swarm-wave"
  | "deal-board"
  | "checkpoint-scan"
  | "ending-seal";

export interface AssetMetric {
  label: string;
  value: string;
}

export interface AssetSpec {
  id: string;
  kind: AssetKind;
  src?: string;
  alt: string;
  prompt?: string;
  credit?: string;
  accent: string;
  mood: string;
  metrics?: AssetMetric[];
  callouts?: string[];
}

export interface StoryNode {
  id: string;
  title: string;
  body: string[];
  visual: string;
  choices: StoryChoice[];
  effects?: StoryEffect;
  requirements?: StoryRequirement[];
  ending?: EndingSummary;
}

export interface StoryLogEntry {
  nodeId: string;
  title: string;
  note: string;
  delta?: StoryEffect;
}

export interface StorySnapshot {
  nodeId: string;
  state: StoryState;
  timeline: StoryLogEntry[];
  status: "in_progress" | "ended";
}

export interface StoryBootstrap {
  state: StoryState;
  timeline: StoryLogEntry[];
  status?: "in_progress" | "ended";
}

export interface StoryDefinition {
  id: string;
  routeId: string;
  version: string;
  title: string;
  tagline: string;
  routeBase: string;
  startNodeId: string;
  nodeOrder: string[];
  initialState: StoryState;
  nodes: Record<string, StoryNode>;
  assets: Record<string, AssetSpec>;
  bootstrap: Record<string, StoryBootstrap>;
}
