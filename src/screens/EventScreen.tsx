import { useMemo } from "react";
import ArtFrame from "../components/ArtFrame";
import ChoiceList from "../components/ChoiceList";
import { resolveNpcDisplayName } from "../content/narrative";
import { canSelectChoice as canSelectChoiceWithContent } from "../engine/requirements";
import { useGameStore } from "../store/gameStore";
import { selectCurrentEvent, selectCurrentRoute } from "../store/selectors";

export default function EventScreen() {
  const content = useGameStore((state) => state.content);
  const runtime = useGameStore((state) => state.runtime);
  const event = useGameStore(selectCurrentEvent);
  const route = useGameStore(selectCurrentRoute);
  const applyChoice = useGameStore((state) => state.applyChoice);
  const choices = useMemo(() => {
    if (!content || !event) {
      return [];
    }

    return event.choices.map((choice) => ({
      choice,
      enabled: canSelectChoiceWithContent(event.event_id, choice.choice_id, runtime, content, []),
      reason: choice.preview
    }));
  }, [content, event, runtime]);

  if (!content || !event) {
    return (
      <section className="screen-card">
        <p className="muted-copy">No active event is available.</p>
      </section>
    );
  }

  const npcId = event.npc_ids?.[0] ?? null;
  const npcName = npcId ? resolveNpcDisplayName(content, npcId) : "Field feed";

  return (
    <section className="screen-grid event-screen">
      <article className="screen-card narrative-panel">
        <p className="eyebrow">Event Dialogue</p>
        <h2>{event.title}</h2>
        <p className="lead-copy">{event.text.summary}</p>
        <div className="story-copy">
          {event.text.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="detail-stack">
          <div className="detail-row">
            <strong>Route</strong>
            <span>{route}</span>
          </div>
          <div className="detail-row">
            <strong>Layout</strong>
            <span>{event.presentation.layout}</span>
          </div>
          <div className="detail-row">
            <strong>Widgets</strong>
            <span>{event.presentation.widget_overrides.length ? event.presentation.widget_overrides.join(", ") : "default"}</span>
          </div>
        </div>
        <ChoiceList choices={choices} onChoose={(choiceId) => applyChoice(choiceId)} />
      </article>

      <article className="screen-card portrait-panel">
        <p className="eyebrow">Presence</p>
        <ArtFrame
          assetKey={event.presentation.art_key ?? (npcId ? `portrait_${npcId.replace(/^npc_/u, "")}` : null)}
          chapterId={runtime.current_chapter_id}
          alt={npcName}
          caption={npcName}
        />
      </article>
    </section>
  );
}
