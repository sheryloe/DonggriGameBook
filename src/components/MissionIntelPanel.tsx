import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { selectCurrentChapter, selectCurrentEvent, selectCurrentNode, selectCurrentRoute } from "../store/selectors";

interface MissionIntelPanelProps {
  title?: string;
  mode?: "map" | "event";
  compact?: boolean;
}

export default function MissionIntelPanel({ title = "Mission Intel", mode = "event", compact = false }: MissionIntelPanelProps) {
  const chapter = useGameStore(selectCurrentChapter);
  const node = useGameStore(selectCurrentNode);
  const event = useGameStore(selectCurrentEvent);
  const route = useGameStore(selectCurrentRoute);
  const runtime = useGameStore((state) => state.runtime);
  const noise = Number(runtime.stats["noise"] ?? 0);
  const contamination = Number(runtime.stats["contamination"] ?? 0);

  const totalObjectives = chapter?.objectives?.length ?? 0;
  const completedObjectives = chapter?.objectives?.filter((obj) => runtime.chapter_progress[runtime.current_chapter_id]?.objective_completion[obj.objective_id])
    .length ?? 0;

  const intelLines = useMemo(() => {
    const lines = [
      { label: "챕터", value: chapter?.title ?? runtime.current_chapter_id },
      { label: "루트", value: route }
    ];

    if (mode === "event") {
      lines.push({ label: "이벤트", value: event?.title ?? "진행 중" });
    }

    lines.push({ label: "현재 노드", value: node?.name ?? "미확정" });
    lines.push({ label: "목표 진행", value: totalObjectives ? `${completedObjectives}/${totalObjectives}` : "미설정" });

    lines.push({ label: "소음", value: `${noise}/100` });
    lines.push({ label: "오염", value: `${contamination}/100` });

    return lines;
  }, [chapter?.title, completedObjectives, contamination, event?.title, mode, node?.name, noise, route, runtime.current_chapter_id, totalObjectives]);

  return (
    <section className={`intel-panel ${compact ? "intel-panel-compact" : ""}`.trim()}>
      <header className="section-head">
        <div>
          <span className="eyebrow">{title}</span>
          <h3>정보</h3>
        </div>
      </header>
      <ul className="intel-list">
        {intelLines.map((line) => (
          <li key={`${line.label}-${line.value}`}>
            <strong>{line.label}</strong>
            <span className="muted-copy">{line.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
