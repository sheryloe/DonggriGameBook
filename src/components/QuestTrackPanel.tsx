import { useMemo, useState } from "react";
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
  const [expanded, setExpanded] = useState(false);

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

  const orderedTracks = useMemo(() => {
    return [...tracks].sort((left, right) => {
      if (left.kind === right.kind) {
        return left.title.localeCompare(right.title);
      }
      return left.kind === "main" ? -1 : 1;
    });
  }, [tracks]);

  const unlockedTracks = orderedTracks.filter((track) => track.status !== "locked");
  const primaryTracks = [
    ...unlockedTracks.filter((track) => track.kind === "main").slice(0, 1),
    ...unlockedTracks.filter((track) => track.kind !== "main").slice(0, 2)
  ];
  const visibleTracks = compact && !expanded ? primaryTracks : orderedTracks;
  const canToggle = compact && orderedTracks.length > visibleTracks.length;

  return (
    <section className={`quest-panel ${compact ? "quest-panel-compact" : ""}`.trim()}>
      <header className="section-head">
        <div>
          <span className="eyebrow">{title}</span>
          <h3>Quest Progress</h3>
        </div>
        <div className="quest-panel-actions">
          {canToggle ? (
            <button type="button" className="ghost-button quest-panel-toggle" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? "접기" : "전체 보기"}
            </button>
          ) : null}
          <span className="muted-copy">{chapterId}</span>
        </div>
      </header>

      <div className="quest-track-grid">
        {visibleTracks.map((track) => {
          const fallback = fallbackByChapter[chapterId] ?? FALLBACK_POSTER;
          const artKey = track.quest_item_id ? questArtPath(track.quest_item_id) : fallback;
          const fallbackKeys = track.quest_item_id ? [questIconPath(track.quest_item_id), fallback] : [fallback];

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
                    {track.status === "locked" ? "잠금" : track.status === "completed" ? "완료" : "진행"}
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
