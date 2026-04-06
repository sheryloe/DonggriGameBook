import { useEffect, useMemo, useState } from "react";
import type { EventChoice } from "../types/game";

interface ChoiceListProps {
  choices: Array<{
    choice: EventChoice;
    enabled: boolean;
    reason?: string;
  }>;
  onChoose: (choiceId: string) => void;
  allowMultiSelect?: boolean;
  onChooseMultiple?: (choiceIds: string[]) => void;
}

export default function ChoiceList({ choices, onChoose, allowMultiSelect = false, onChooseMultiple }: ChoiceListProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const enabledIds = useMemo(
    () => new Set(choices.filter((entry) => entry.enabled).map((entry) => entry.choice.choice_id)),
    [choices]
  );

  useEffect(() => {
    setSelected([]);
  }, [choices]);

  const toggleChoice = (choiceId: string, enabled: boolean) => {
    if (!enabled) {
      return;
    }

    if (!allowMultiSelect) {
      onChoose(choiceId);
      return;
    }

    setSelected((current) =>
      current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId]
    );
  };

  const handleConfirm = () => {
    if (!selected.length || !onChooseMultiple) {
      return;
    }

    const deduped = [...new Set(selected.filter((id) => enabledIds.has(id)))];
    if (!deduped.length) {
      return;
    }

    onChooseMultiple(deduped);
    setSelected([]);
  };

  return (
    <div className="choice-list">
      {choices.map(({ choice, enabled, reason }, index) => (
        <button
          key={choice.choice_id}
          className={`choice-card ${selected.includes(choice.choice_id) ? "is-selected" : ""}`.trim()}
          disabled={!enabled}
          onClick={() => toggleChoice(choice.choice_id, enabled)}
          style={{ ["--choice-index" as string]: index }}
        >
          <strong>{choice.label}</strong>
          {reason ? <span>{reason}</span> : null}
        </button>
      ))}
      {allowMultiSelect ? (
        <div className="choice-actions">
          <button className="primary-button" disabled={!selected.length} onClick={handleConfirm}>
            선택 확정
          </button>
          <button className="ghost-button" disabled={!selected.length} onClick={() => setSelected([])}>
            선택 해제
          </button>
        </div>
      ) : null}
    </div>
  );
}
