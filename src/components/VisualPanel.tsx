import { AssetSpec } from "../types/story";

interface VisualPanelProps {
  title: string;
  description: string;
  asset?: AssetSpec;
}

export default function VisualPanel({ title, description, asset }: VisualPanelProps) {
  return (
    <section className="visual-panel scene-enter">
      <p className="visual-tone">{asset?.tone ?? "neutral"}</p>
      <h2>{title}</h2>
      <p className="visual-description">{description}</p>
    </section>
  );
}
