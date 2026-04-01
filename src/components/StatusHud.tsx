import { StoryState } from "../types/story";

interface StatusHudProps {
  state: StoryState;
  tier: string;
  alertLevel: string;
}

function StatusMeter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "supply" | "noise";
}) {
  return (
    <div className={`status-meter status-meter--${tone}`}>
      <div className="status-meter__header">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="status-meter__track" aria-hidden="true">
        <div
          className="status-meter__fill"
          style={{ width: `${(value / 9) * 100}%` }}
        />
      </div>
    </div>
  );
}

export function StatusHud({ state, tier, alertLevel }: StatusHudProps) {
  return (
    <section className="status-hud" aria-label="현재 생존 상태">
      <div className="status-hud__intro">
        <span className="eyebrow">Status</span>
        <h2>{tier}</h2>
        <p>{alertLevel}</p>
      </div>
      <div className="status-hud__meters">
        <StatusMeter label="보급" value={state.supplies} tone="supply" />
        <StatusMeter label="소음" value={state.noise} tone="noise" />
      </div>
    </section>
  );
}
