import { useMemo } from "react";
import ArtFrame from "./ArtFrame";
import { useGameStore } from "../store/gameStore";
import { selectQuestTracksWithStatus } from "../store/selectors";

interface QuestTrackPanelProps {
  chapterId: string;
  title?: string;
  compact?: boolean;
}

const FALLBACK_POSTER = "bg_yeouido_ashroad";

function questArtPath(itemId: string): string {
  return `/generated/items/quest/${itemId}_quest.png`;
}

function questIconPath(itemId: string): string {
  return `/generated/items/icons/${itemId}_icon.png`;
}

export default function QuestTrackPanel({ chapterId, title = "Quest Tracks", compact = false }: QuestTrackPanelProps) {
  const tracks = useGameStore((state) => selectQuestTracksWithStatus(state, chapterId));

  const fallbackByChapter = useMemo(
    () => ({
      CH01: "chapter_keyart_ch01",
      CH02: "chapter_keyart_ch02",
      CH03: "chapter_keyart_ch03",
      CH04: "chapter_keyart_ch04",
      CH05: "chapter_keyart_ch05"
    }) as Record<string, string>,
    []
  );

  if (!tracks.length) {
    return null;
  }

  const visibleTracks = compact ? tracks.slice(0, 4) : tracks;

  return (
    <section className={`quest-panel ${compact ? "quest-panel-compact" : ""}`.trim()}>
      <header className="section-head">
        <div>
          <span className="eyebrow">{title}</span>
          <h3>Quest Progress</h3>
        </div>
        <span className="muted-copy">{chapterId}</span>
      </header>

      <div className="quest-track-grid">
        {visibleTracks.map((track) => {
          const fallback = fallbackByChapter[chapterId] ?? FALLBACK_POSTER;
          const artKey = track.quest_item_id ? questArtPath(track.quest_item_id) : fallback;
          const fallbackKeys = track.quest_item_id
            ? [questIconPath(track.quest_item_id), fallback]
            : [fallback];

          return (
            <article key={track.quest_track_id} className={`quest-track-card ${track.status}`.trim()}>
              <ArtFrame
                assetKey={artKey}
                fallbackAssetKeys={fallbackKeys}
                chapterId={chapterId}
                alt={track.title}
                className="quest-track-art"
              />
              <div className="quest-track-body">
                <div className="quest-track-head">
                  <strong>{track.title}</strong>
                  <span className={`quest-chip ${track.status}`.trim()}>
                    {track.status === "locked" ? "?좉툑" : track.status === "completed" ? "?꾨즺" : "吏꾪뻾"}
                  </span>
                </div>
                <p className="muted-copy">{track.summary}</p>
                <div className="quest-track-meta">
                  <span>{track.kindLabel}</span>
                  <span>{track.progressText}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}