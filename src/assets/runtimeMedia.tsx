import { useEffect, useMemo, useState } from "react";
import { getPart1DefaultMediaMeta, getPart1VideoRegistryEntry } from "../content/part1Media";
import { resolveAssetKey, resolveResultFallback } from "./manifest";
import type { ChapterId, MediaMetaDefinition, VideoRegistryEntry } from "../types/game";
import { CURRENT_PART_ID } from "../app/appContext";
import { getChapterCatalogEntry } from "../../packages/world-registry/src";

type AssetStatus = "resolved" | "missing_x";

interface ResolvedArtState {
  status: AssetStatus;
  src?: string;
  expectedSrc?: string;
  meta?: MediaMetaDefinition;
}

interface ResolvedVideoState {
  available: boolean;
  src?: string;
  expectedSrc?: string;
  meta?: MediaMetaDefinition;
  registry?: VideoRegistryEntry;
}

type PartThemeId = "P1" | "P2" | "P3" | "P4";

const fileProbeCache = new Map<string, boolean>();
const metaCache = new Map<string, MediaMetaDefinition | null>();

function resolvePartTheme(chapterId?: string, key?: string | null): PartThemeId {
  const partFromChapter = chapterId ? getChapterCatalogEntry(chapterId)?.part_id : undefined;
  if (partFromChapter) {
    return partFromChapter;
  }

  const partFromKey = key
    ? (/^P([1-4])_/u.exec(key)?.[0]?.slice(0, 2) ??
        /(?:^|_)p([1-4])_/iu.exec(key)?.[0]?.match(/p[1-4]/iu)?.[0]?.toUpperCase())
    : undefined;
  if (partFromKey === "P1" || partFromKey === "P2" || partFromKey === "P3" || partFromKey === "P4") {
    return partFromKey;
  }

  return CURRENT_PART_ID;
}

function applyGlobalPartTheme(partId: PartThemeId): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.part = partId;
  document.body.dataset.part = partId;
}

applyGlobalPartTheme(CURRENT_PART_ID);

function inferSurfaceKind(key?: string | null, screenLabel?: string): string {
  const safeKey = key?.toLowerCase() ?? "";
  const safeLabel = screenLabel?.toLowerCase() ?? "";

  if (safeKey.startsWith("briefing_") || safeLabel.includes("briefing")) {
    return "briefing";
  }
  if (safeKey.startsWith("map_") || safeLabel.includes("map")) {
    return "map";
  }
  if (safeKey.startsWith("result_") || safeLabel.includes("result")) {
    return "result";
  }
  if (safeKey.startsWith("ending_") || safeLabel.includes("ending")) {
    return "ending";
  }
  if (safeLabel.includes("video") || safeLabel.includes("opening")) {
    return "video";
  }

  return "scene";
}

function buildMissingMediaCopy({
  artKey,
  chapterId,
  screenLabel,
  expectedSrc
}: {
  artKey?: string | null;
  chapterId?: string;
  screenLabel?: string;
  expectedSrc?: string;
}) {
  const partId = resolvePartTheme(chapterId, artKey);
  const surface = inferSurfaceKind(artKey, screenLabel);
  const chapterLabel = chapterId ?? "UNASSIGNED";
  const channelLabel =
    surface === "briefing"
      ? "briefing feed offline"
      : surface === "map"
        ? "route board feed offline"
        : surface === "result"
          ? "after-action record delayed"
          : surface === "ending"
            ? "epilogue archive pending"
            : surface === "video"
              ? "cinematic reel pending"
              : "field camera unavailable";

  return {
    partId,
    surface,
    chapterLabel,
    channelLabel,
    assetLabel: artKey ?? "missing_art_key",
    expectedLabel: expectedSrc ?? "public/generated/images/<art_key>.webp"
  };
}

async function probeStaticFile(path: string): Promise<boolean> {
  if (fileProbeCache.has(path)) {
    return fileProbeCache.get(path) ?? false;
  }

  try {
    const headResponse = await fetch(path, {
      method: "HEAD",
      cache: "no-store"
    });

    if (headResponse.ok) {
      fileProbeCache.set(path, true);
      return true;
    }

    if (headResponse.status !== 405 && headResponse.status !== 501) {
      fileProbeCache.set(path, false);
      return false;
    }
  } catch {
    // Fall through to GET probe.
  }

  try {
    const getResponse = await fetch(path, {
      method: "GET",
      cache: "no-store"
    });
    const exists = getResponse.ok;
    fileProbeCache.set(path, exists);
    return exists;
  } catch {
    fileProbeCache.set(path, false);
    return false;
  }
}

async function loadMetaFile(id: string): Promise<MediaMetaDefinition | null> {
  if (metaCache.has(id)) {
    return metaCache.get(id) ?? null;
  }

  try {
    const response = await fetch(`/generated/meta/${id}.json`, {
      cache: "no-store"
    });

    if (!response.ok) {
      metaCache.set(id, null);
      return null;
    }

    const payload = (await response.json()) as MediaMetaDefinition;
    metaCache.set(id, payload);
    return payload;
  } catch {
    metaCache.set(id, null);
    return null;
  }
}

export function useMediaMeta(id?: string, fallback?: MediaMetaDefinition): MediaMetaDefinition | undefined {
  const [meta, setMeta] = useState<MediaMetaDefinition | undefined>(fallback);

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      setMeta(fallback);
      return () => {
        cancelled = true;
      };
    }

    void loadMetaFile(id).then((loaded) => {
      if (cancelled) {
        return;
      }

      setMeta(loaded ? { ...fallback, ...loaded } : fallback);
    });

    return () => {
      cancelled = true;
    };
  }, [fallback, id]);

  return meta;
}

export function useResolvedArt(
  artKey?: string | null,
  chapterId?: ChapterId,
  fallbackMeta?: MediaMetaDefinition
): ResolvedArtState {
  const resolution = useMemo(() => resolveAssetKey(artKey, chapterId), [artKey, chapterId]);
  const [status, setStatus] = useState<AssetStatus>(resolution.status);
  const meta = useMediaMeta(resolution.key, fallbackMeta ?? getPart1DefaultMediaMeta(resolution.key));

  useEffect(() => {
    let cancelled = false;

    if (!resolution.src) {
      setStatus("missing_x");
      return () => {
        cancelled = true;
      };
    }

    if (!resolution.strict_drop) {
      setStatus("resolved");
      return () => {
        cancelled = true;
      };
    }

    void probeStaticFile(resolution.expected_src ?? resolution.src).then((exists) => {
      if (!cancelled) {
        setStatus(exists ? "resolved" : "missing_x");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [resolution.expected_src, resolution.src, resolution.strict_drop]);

  return {
    status,
    src: status === "resolved" ? resolution.src : undefined,
    expectedSrc: resolution.expected_src ?? resolution.src,
    meta
  };
}

export function useResolvedVideo(videoId?: string, fallbackMeta?: MediaMetaDefinition): ResolvedVideoState {
  const registry = useMemo(() => getPart1VideoRegistryEntry(videoId), [videoId]);
  const expectedSrc = registry ? `/generated/videos/${registry.video_id}.mp4` : undefined;
  const [available, setAvailable] = useState(false);
  const meta = useMediaMeta(
    videoId,
    registry
      ? {
          title: registry.title_default,
          subtitle: registry.subtitle_default,
          caption: registry.caption_default,
          chapter_id: registry.chapter_id,
          ending_id: registry.ending_id
        }
      : fallbackMeta
  );

  useEffect(() => {
    let cancelled = false;

    if (!expectedSrc) {
      setAvailable(false);
      return () => {
        cancelled = true;
      };
    }

    void probeStaticFile(expectedSrc).then((exists) => {
      if (!cancelled) {
        setAvailable(exists);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [expectedSrc]);

  return {
    available,
    src: available ? expectedSrc : undefined,
    expectedSrc,
    meta,
    registry
  };
}

export function ArtFrame({
  artKey,
  chapterId,
  caption,
  screenLabel,
  className,
  placeholderMode = "detailed",
  fallback = "clear"
}: {
  artKey?: string | null;
  chapterId?: string;
  caption?: string;
  screenLabel?: string;
  className?: string;
  placeholderMode?: "simple" | "detailed";
  fallback?: "clear" | "fail" | "gameover";
}) {
  const fallbackMeta = getPart1DefaultMediaMeta(artKey);
  const { status, src, expectedSrc, meta } = useResolvedArt(artKey, chapterId, fallbackMeta);
  const partId = resolvePartTheme(chapterId, artKey);
  const surfaceKind = inferSurfaceKind(artKey, screenLabel);
  const missingCopy = buildMissingMediaCopy({ artKey, chapterId, screenLabel, expectedSrc });
  const frameClassName = ["art-frame", className].filter(Boolean).join(" ");
  const displayCaption = meta?.caption ?? caption;
  const displayTitle = meta?.title ?? caption ?? artKey ?? "Missing media";

  useEffect(() => {
    applyGlobalPartTheme(partId);
  }, [partId]);

  if (!artKey) {
    const fallbackSrc = resolveResultFallback(fallback);
    return (
      <div
        className={frameClassName}
        data-part={partId}
        data-surface={surfaceKind}
        data-media-status={fallbackSrc ? "fallback-image" : "missing"}
      >
        {fallbackSrc ? (
          <img className="art-frame-image" src={fallbackSrc} alt={displayTitle} />
        ) : (
          <div className="art-frame-placeholder is-detailed">
            <div className="asset-missing-card">
              <span className="asset-missing-kicker">{missingCopy.channelLabel}</span>
              <strong>{missingCopy.assetLabel}</strong>
              <p className="asset-missing-summary">{screenLabel ?? "Generated artwork not assigned."}</p>
              <dl className="asset-missing-grid">
                <div>
                  <dt>Part</dt>
                  <dd>{missingCopy.partId}</dd>
                </div>
                <div>
                  <dt>Chapter</dt>
                  <dd>{missingCopy.chapterLabel}</dd>
                </div>
                <div>
                  <dt>Surface</dt>
                  <dd>{missingCopy.surface}</dd>
                </div>
                <div>
                  <dt>Expected drop</dt>
                  <dd>{missingCopy.expectedLabel}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
        {displayCaption ? <div className="art-frame-caption">{displayCaption}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={frameClassName}
      data-part={partId}
      data-surface={surfaceKind}
      data-media-status={status === "resolved" && src ? "resolved" : "missing"}
    >
      {status === "resolved" && src ? (
        <img className="art-frame-image" src={src} alt={displayTitle} />
      ) : (
        <div className={`art-frame-placeholder ${placeholderMode === "detailed" ? "is-detailed" : "is-simple"}`}>
          <div className="asset-missing-card">
            <span className="asset-missing-kicker">{missingCopy.channelLabel}</span>
            <strong>{artKey}</strong>
            <p className="asset-missing-summary">
              {screenLabel ?? "Generated artwork is not present in the runtime drop."}
            </p>
            {placeholderMode === "detailed" ? (
              <>
                <dl className="asset-missing-grid">
                  <div>
                    <dt>Part</dt>
                    <dd>{missingCopy.partId}</dd>
                  </div>
                  <div>
                    <dt>Chapter</dt>
                    <dd>{missingCopy.chapterLabel}</dd>
                  </div>
                  <div>
                    <dt>Surface</dt>
                    <dd>{missingCopy.surface}</dd>
                  </div>
                  <div>
                    <dt>Expected drop</dt>
                    <dd>{expectedSrc ?? "public/generated/images/<art_key>.webp"}</dd>
                  </div>
                </dl>
              </>
            ) : null}
          </div>
        </div>
      )}
      {displayCaption ? <div className="art-frame-caption">{displayCaption}</div> : null}
    </div>
  );
}

export function VideoCard({
  videoId,
  chapterId
}: {
  videoId?: string | null;
  chapterId?: ChapterId;
}) {
  const fallbackMeta = getPart1DefaultMediaMeta(videoId);
  const { available, src, meta, registry } = useResolvedVideo(videoId ?? undefined, fallbackMeta);
  const [isPlaying, setIsPlaying] = useState(false);
  const partId = resolvePartTheme(chapterId ?? registry?.chapter_id, videoId ?? undefined);

  useEffect(() => {
    setIsPlaying(false);
  }, [available, videoId]);

  useEffect(() => {
    applyGlobalPartTheme(partId);
  }, [partId]);

  if (!available || !src || !registry) {
    return null;
  }

  return (
    <div className="media-video-card" data-part={partId} data-surface="video" data-media-status="resolved">
      <div className="media-video-card-head">
        <div>
          <strong>{meta?.title ?? registry.title_default}</strong>
          {meta?.subtitle ? <div className="media-video-subtitle">{meta.subtitle}</div> : null}
        </div>
        <button
          className={`ghost-button media-video-toggle ${isPlaying ? "is-active" : ""}`}
          onClick={() => setIsPlaying((current) => !current)}
        >
          {isPlaying ? "Hide Video" : "Play Video"}
        </button>
      </div>

      {isPlaying ? (
        <div className="media-video-player-wrap">
          <video className="media-video-player" src={src} controls preload="metadata" />
          {meta?.caption ? <div className="media-video-caption">{meta.caption}</div> : null}
        </div>
      ) : (
        <ArtFrame
          artKey={registry.poster_art_key}
          chapterId={chapterId ?? registry.chapter_id}
          caption={meta?.caption ?? registry.caption_default}
          screenLabel={registry.video_id}
        />
      )}

      {meta?.credit ? <div className="media-video-credit">Credit: {meta.credit}</div> : null}
    </div>
  );
}
