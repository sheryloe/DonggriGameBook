interface StatusHudProps {
  supplies: number;
  noise: number;
}

export default function StatusHud({ supplies, noise }: StatusHudProps) {
  return (
    <aside className="status-hud">
      <div className="status-item">
        <span className="label">Supplies</span>
        <strong>{supplies}/9</strong>
      </div>
      <div className="status-item">
        <span className="label">Noise</span>
        <strong>{noise}/9</strong>
      </div>
    </aside>
  );
}
