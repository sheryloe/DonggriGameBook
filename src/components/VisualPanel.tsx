import { AssetSpec } from "../types/story";

interface VisualPanelProps {
  asset: AssetSpec;
}

function VisualStage({ asset }: { asset: AssetSpec }) {
  const circles = Array.from({ length: 6 }, (_, index) => (
    <span
      key={`${asset.id}-circle-${index}`}
      className={`visual-stage__circle visual-stage__circle--${asset.kind}`}
      style={{
        animationDelay: `${index * 0.2}s`,
      }}
    />
  ));

  const bars = Array.from({ length: 5 }, (_, index) => (
    <span
      key={`${asset.id}-bar-${index}`}
      className="visual-stage__bar"
      style={{
        height: `${42 + index * 8}%`,
      }}
    />
  ));

  return (
    <div
      className={`visual-stage visual-stage--${asset.kind}`}
      style={{ ["--asset-accent" as string]: asset.accent }}
      aria-hidden="true"
    >
      <div className="visual-stage__grid" />
      <div className="visual-stage__rings">{circles}</div>
      <div className="visual-stage__bars">{bars}</div>
      <div className="visual-stage__trace" />
      <div className="visual-stage__badge">{asset.mood}</div>
    </div>
  );
}

export function VisualPanel({ asset }: VisualPanelProps) {
  return (
    <figure className="visual-panel">
      <div className="visual-panel__header">
        <span className="eyebrow">Scene Visual</span>
        <strong>{asset.mood}</strong>
      </div>
      <div className="visual-panel__media">
        {asset.src ? (
          <img src={asset.src} alt={asset.alt} className="visual-panel__image" />
        ) : (
          <VisualStage asset={asset} />
        )}
        <div className="visual-panel__scrim" />
      </div>
      <figcaption className="visual-panel__caption">{asset.alt}</figcaption>
      {asset.metrics && asset.metrics.length > 0 ? (
        <div className="visual-panel__metrics">
          {asset.metrics.map((metric) => (
            <div key={`${asset.id}-${metric.label}`} className="metric-chip">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      {asset.callouts && asset.callouts.length > 0 ? (
        <ul className="visual-panel__callouts">
          {asset.callouts.map((callout) => (
            <li key={`${asset.id}-${callout}`}>{callout}</li>
          ))}
        </ul>
      ) : null}
    </figure>
  );
}
