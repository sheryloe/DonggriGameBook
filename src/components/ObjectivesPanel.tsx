import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { selectCurrentChapter, selectObjectiveCompletion } from "../store/selectors";

interface ObjectivesPanelProps {
  title?: string;
  compact?: boolean;
}

export default function ObjectivesPanel({ title = "Objectives", compact = false }: ObjectivesPanelProps) {
  const chapter = useGameStore(selectCurrentChapter);
  const completion = useGameStore((state) => selectObjectiveCompletion(state, state.runtime.current_chapter_id));

  const objectives = useMemo(() => {
    if (!chapter?.objectives?.length) {
      return [];
    }

    return [...chapter.objectives].sort((left, right) => Number(right.required) - Number(left.required));
  }, [chapter]);

  if (!objectives.length) {
    return null;
  }

  const visibleObjectives = compact ? objectives.slice(0, 4) : objectives;

  return (
    <section className={`objectives-panel ${compact ? "objectives-panel-compact" : ""}`.trim()}>
      <header className="section-head">
        <div>
          <span className="eyebrow">{title}</span>
          <h3>목표</h3>
        </div>
      </header>
      <ul className="objective-list">
        {visibleObjectives.map((objective) => (
          <li key={objective.objective_id} className={completion[objective.objective_id] ? "is-complete" : ""}>
            <strong>{objective.text}</strong>
            <span>{objective.required ? "필수" : "선택"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
