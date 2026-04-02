import type { EventChoice } from "../types/game";

interface ChoiceListProps {
  choices: Array<{
    choice: EventChoice;
    enabled: boolean;
    reason?: string;
  }>;
  onChoose: (choiceId: string) => void;
}

export default function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <div className="choice-list">
      {choices.map(({ choice, enabled, reason }, index) => (
        <button
          key={choice.choice_id}
          className="choice-card"
          disabled={!enabled}
          onClick={() => onChoose(choice.choice_id)}
          style={{ ["--choice-index" as string]: index }}
        >
          <strong>{choice.label}</strong>
          {reason ? <span>{reason}</span> : null}
        </button>
      ))}
    </div>
  );
}
