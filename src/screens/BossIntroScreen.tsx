import { useGameStore } from "../store/gameStore";
import { selectCurrentEvent } from "../store/selectors";
import ArtFrame from "../components/ArtFrame";

export default function BossIntroScreen() {
  const runtime = useGameStore((state) => state.runtime);
  const event = useGameStore(selectCurrentEvent);
  const startBattle = useGameStore((state) => state.startBattle);

  if (!event) {
    return (
      <section className="screen-card">
        <p>보스 연출 데이터를 찾을 수 없다.</p>
      </section>
    );
  }

  return (
    <section className="screen-card boss-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">Boss Intro</span>
          <h2>{event.title}</h2>
        </div>
      </header>
      <div className="split-layout">
        <ArtFrame
          assetKey={event.presentation.art_key}
          chapterId={runtime.current_chapter_id}
          alt={event.title}
          caption={event.combat?.boss_id ?? "boss"}
        />
        <article className="narrative-card">
          <p className="event-summary">{event.text.summary}</p>
          {event.text.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="tag-row">
            {(event.combat?.arena_tags ?? []).map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
          <button className="primary-button" onClick={() => startBattle()}>
            보스전 진입
          </button>
        </article>
      </div>
    </section>
  );
}
