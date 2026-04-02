import type { RuntimeWarning } from "../types/game";

interface WarningStackProps {
  warnings: RuntimeWarning[];
}

export default function WarningStack({ warnings }: WarningStackProps) {
  if (!warnings.length) {
    return null;
  }

  return (
    <section className="warning-stack">
      {warnings.slice(-4).map((warning, index) => (
        <article key={`${warning.source}-${warning.message}-${index}`} className={`warning-chip warning-${warning.severity}`}>
          <span className="warning-source">{warning.source}</span>
          <p>{warning.message}</p>
        </article>
      ))}
    </section>
  );
}
