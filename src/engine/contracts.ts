import type {
  BattleAction,
  ChapterId,
  EffectDefinition,
  GameContentPack,
  RuntimeSnapshot,
  RuntimeWarning,
  UIScreenType
} from "../types/game";

export interface EngineResult {
  runtime: RuntimeSnapshot;
  warnings: RuntimeWarning[];
}

export interface TransitionContext {
  runtime: RuntimeSnapshot;
  content: GameContentPack;
  currentChapterId: ChapterId;
  currentScreenType: UIScreenType;
  currentEventId?: string | null;
  currentNodeId?: string | null;
  grantsLoot?: boolean;
  eventComplete?: boolean;
}

export interface BattleTurnResolution extends EngineResult {
  action: BattleAction;
}

export interface RequirementEvaluation {
  allowed: boolean;
  warnings: RuntimeWarning[];
  reason?: string;
}

export interface EffectApplicationContext {
  source: string;
  runtime: RuntimeSnapshot;
  content: GameContentPack;
  effects: EffectDefinition[];
}

export type RequirementsEvaluator = (
  expression: string,
  runtime: RuntimeSnapshot,
  content: GameContentPack
) => RequirementEvaluation;

export type EffectsApplier = (context: EffectApplicationContext) => EngineResult;

export type ChapterProgressionResolver = (
  runtime: RuntimeSnapshot,
  content: GameContentPack,
  nextEventId?: string | null
) => EngineResult;
