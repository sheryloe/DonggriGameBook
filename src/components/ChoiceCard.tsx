interface ChoiceCardProps {
  label: string;
  index: number;
  disabled?: boolean;
  onSelect: () => void;
}

export default function ChoiceCard({ label, index, disabled = false, onSelect }: ChoiceCardProps) {
  return (
    <button
      className="choice-card"
      style={{ ["--choice-index" as string]: index }}
      type="button"
      onClick={onSelect}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
