interface StatBarProps {
  label: string;
  value: number;
  max: number;
  tone?: "danger" | "warning" | "stable";
}

export default function StatBar({ label, value, max, tone = "stable" }: StatBarProps) {
  const ratio = max <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className={`stat-bar stat-bar-${tone}`}>
      <div className="stat-bar-head">
        <span>{label}</span>
        <strong>
          {Math.round(value)} / {Math.round(max)}
        </strong>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}
