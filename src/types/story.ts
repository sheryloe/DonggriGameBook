export type StoryStat = "supplies" | "noise";

export interface StoryState {
  supplies: number;
  noise: number;
}

export interface AssetSpec {
  kind: "image" | "ambient" | "none";
  src?: string;
  tone?: string;
}

export interface EndingSummary {
  title: string;
  outcome: "clear" | "fail" | "neutral";
  body: string;
}

export interface StoryChoice {
  id: string;
  label: string;
  nextNodeId: string;
  effects?: Partial<Record<StoryStat, number>>;
  requirements?: Partial<Record<StoryStat, number>>;
}

export interface StoryNode {
  id: string;
  title: string;
  description: string;
  asset?: AssetSpec;
  choices: StoryChoice[];
  ending?: EndingSummary;
}

export interface StoryDefinition {
  id: string;
  title: string;
  startNodeId: string;
  initialState: StoryState;
  nodes: Record<string, StoryNode>;
}

export interface StoryProgress {
  storyId: string;
  nodeId: string;
  state: StoryState;
  updatedAt: string;
}
