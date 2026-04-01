import {
  describeRequirement,
  formatDelta,
  requirementsMet,
} from "../lib/storyEngine";
import { StoryChoice, StoryState } from "../types/story";

interface ChoiceCardProps {
  choice: StoryChoice;
  state: StoryState;
  onSelect: (choice: StoryChoice) => void;
}

export function ChoiceCard({ choice, state, onSelect }: ChoiceCardProps) {
  const enabled = requirementsMet(state, choice.requirements);

  return (
    <button
      type="button"
      className={`choice-card choice-card--${choice.tone ?? "official"} ${
        enabled ? "" : "choice-card--locked"
      }`.trim()}
      onClick={() => onSelect(choice)}
      disabled={!enabled}
    >
      <span className="choice-card__badge">{choice.badge ?? "CHOICE"}</span>
      <span className="choice-card__label">{choice.label}</span>
      {choice.hint ? <span className="choice-card__hint">{choice.hint}</span> : null}
      <span className="choice-card__delta">{formatDelta(choice.effects)}</span>
      {choice.requirements && choice.requirements.length > 0 ? (
        <span className="choice-card__requirement">
          필요 조건: {choice.requirements.map(describeRequirement).join(" / ")}
        </span>
      ) : null}
    </button>
  );
}
