import { formatDelta } from "../lib/storyEngine";
import { StoryLogEntry } from "../types/story";

interface RunLogProps {
  entries: StoryLogEntry[];
}

export function RunLog({ entries }: RunLogProps) {
  const recentEntries = entries.slice(-8).reverse();

  return (
    <section className="run-log" aria-labelledby="run-log-title">
      <div className="run-log__header">
        <span className="eyebrow">Raid Log</span>
        <h2 id="run-log-title">이동 기록</h2>
      </div>
      <ol className="run-log__list">
        {recentEntries.map((entry, index) => (
          <li key={`${entry.nodeId}-${index}`} className="run-log__item">
            <div className="run-log__title-row">
              <strong>{entry.title}</strong>
              <span>{formatDelta(entry.delta)}</span>
            </div>
            <p>{entry.note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
