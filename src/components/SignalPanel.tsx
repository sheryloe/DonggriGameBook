import { SignalEntry } from "../lib/storyUi";

interface SignalPanelProps {
  entries: SignalEntry[];
}

export function SignalPanel({ entries }: SignalPanelProps) {
  return (
    <section className="panel panel--signals" aria-labelledby="signal-panel-title">
      <div className="panel__header">
        <div>
          <span className="panel__eyebrow">Signals</span>
          <h2 id="signal-panel-title">현장 신호와 소문</h2>
        </div>
        <p>공식 방송보다 빨리 움직이는 비공식 정보.</p>
      </div>

      <ul className="signal-list">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`signal-item signal-item--${entry.tone}`.trim()}
          >
            <strong>{entry.label}</strong>
            <p>{entry.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
