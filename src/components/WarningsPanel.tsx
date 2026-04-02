import type { RuntimeWarning } from "../types/game";

interface WarningsPanelProps {
  warnings: RuntimeWarning[];
  onClose?: () => void;
}

export default function WarningsPanel({ warnings, onClose }: WarningsPanelProps) {
  return (
    <aside className="warnings-panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Runtime</p>
          <h3>Warnings</h3>
        </div>
        {onClose ? (
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
      <div className="warning-list">
        {warnings.length ? (
          warnings.map((warning, index) => (
            <article key={`${warning.source}-${index}`} className={`warning-card warning-${warning.severity}`}>
              <strong>{warning.source}</strong>
              <p>{warning.message}</p>
            </article>
          ))
        ) : (
          <p className="muted-copy">No runtime warnings.</p>
        )}
      </div>
    </aside>
  );
}
