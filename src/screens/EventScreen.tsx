import { useMemo } from "react";
import ArtFrame from "../components/ArtFrame";
import ChoiceList from "../components/ChoiceList";
import MissionIntelPanel from "../components/MissionIntelPanel";
import ObjectivesPanel from "../components/ObjectivesPanel";
import QuestTrackPanel from "../components/QuestTrackPanel";
import { resolveNpcDisplayName } from "../content/narrative";
import { canSelectChoice as canSelectChoiceWithContent } from "../engine/requirements";
import { useGameStore } from "../store/gameStore";
import { selectCurrentEvent, selectCurrentRoute } from "../store/selectors";

const EVENT_ART_OVERRIDES: Record<string, string> = {
  EV_CH01_BRIEFING: "evt_ch01_briefing_alt",
  EV_CH01_ROOFTOP_SIGNAL: "evt_ch01_rooftop_signal_alt"
};

export default function EventScreen() {
  const content = useGameStore((state) => state.content);
  const runtime = useGameStore((state) => state.runtime);
  const event = useGameStore(selectCurrentEvent);
  const route = useGameStore(selectCurrentRoute);
  const applyChoice = useGameStore((state) => state.applyChoice);
  const applyChoices = useGameStore((state) => state.applyChoices);
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
  const glamourArtKey = npcId ? `${npcId}_fullbody` : null;
  const fallbackPortraitKey = npcId ? `portrait_${npcId.replace(/^npc_/u, "")}` : null;
  const eventArtKey = EVENT_ART_OVERRIDES[event.event_id] ?? `evt_${event.event_id.replace(/^EV_/u, "").toLowerCase()}`;
  const primaryArtKey = event.presentation.art_key ?? fallbackPortraitKey ?? null;
  const allowMultiSelect = (event.presentation.allow_multi_choice ?? true) && choices.length > 1;

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
        <ChoiceList
          choices={choices}
          allowMultiSelect={allowMultiSelect}
          onChoose={(choiceId) => applyChoice(choiceId)}
          onChooseMultiple={(choiceIds) => applyChoices(choiceIds)}
        />
      </article>

      <aside className="screen-side-stack">
        <article className="screen-card portrait-panel">
          <p className="eyebrow">Presence</p>
          <ArtFrame
            assetKey={glamourArtKey ?? primaryArtKey}
            fallbackAssetKeys={[eventArtKey, primaryArtKey, fallbackPortraitKey]}
            chapterId={runtime.current_chapter_id}
            alt={npcName}
            caption={npcName}
          />
        </article>
        <article className="screen-card">
          <ObjectivesPanel compact title="Objectives" />
        </article>
        <article className="screen-card">
          <MissionIntelPanel mode="event" title="Event Intel" />
        </article>
        <article className="screen-card">
          <QuestTrackPanel chapterId={runtime.current_chapter_id} title="Quest Tracks" compact />
        </article>
      </aside>
    </section>
  );
}
