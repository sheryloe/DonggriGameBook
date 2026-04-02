import { useGameStore } from "../store/gameStore";
import { selectCurrentChapter } from "../store/selectors";
import InventoryPanel from "../components/InventoryPanel";

export default function BriefingScreen() {
  const chapter = useGameStore(selectCurrentChapter);
  const startMission = useGameStore((state) => state.startMission);
  const objectiveCompletion = useGameStore((state) => state.runtime.chapter_progress[state.runtime.current_chapter_id]?.objective_completion ?? {});

  return (
    <section className="screen-card briefing-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">Mission Brief</span>
          <h2>{chapter?.title ?? "브리핑"}</h2>
        </div>
      </header>

      <div className="split-layout">
        <article className="narrative-card">
          <p>{chapter?.role ?? "작전 설명을 불러오는 중이다."}</p>
          <ul className="objective-list">
            {chapter?.objectives.map((objective) => (
              <li key={objective.objective_id} className={objectiveCompletion[objective.objective_id] ? "is-complete" : ""}>
                <strong>{objective.text}</strong>
                <span>{objective.required ? "필수" : "선택"}</span>
              </li>
            ))}
          </ul>
          <button className="primary-button" onClick={() => startMission()}>
            작전 시작
          </button>
        </article>
        <InventoryPanel />
      </div>
    </section>
  );
}
