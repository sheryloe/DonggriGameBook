import { useEffect, useMemo, useState } from "react";
import { getPart1DefaultMediaMeta, getPart1VideoRegistryEntry } from "../content/part1Media";
import { resolveAssetKey, resolveResultFallback } from "./manifest";
import { resolveRuntimeMetaUrl, resolveRuntimeVideoUrl } from "./runtimeAssetUrls";
import type { ChapterId, MediaMetaDefinition, VideoRegistryEntry } from "../types/game";
import { CURRENT_PART_ID } from "../app/appContext";
import { getChapterCatalogEntry } from "@donggrol/world-registry";

type AssetStatus = "resolved" | "missing_x";

interface ResolvedArtState {
  status: AssetStatus;
  src?: string;
  expectedSrc?: string;
  meta?: MediaMetaDefinition;
  stitchRequired?: boolean;
  stitchTargetKey?: string;
  stitchTargetPath?: string;
  stitchPromptFile?: string;
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
  expectedSrc,
  stitchRequired,
  stitchTargetKey,
  stitchPromptFile
}: {
  artKey?: string | null;
  chapterId?: string;
  screenLabel?: string;
  expectedSrc?: string;
  stitchRequired?: boolean;
  stitchTargetKey?: string;
  stitchPromptFile?: string;
}) {
  const partId = resolvePartTheme(chapterId, artKey);
  const surface = inferSurfaceKind(artKey, screenLabel);
  const chapterLabel = chapterId ?? "미지정";
  const channelLabel =
    surface === "briefing"
      ? "브리핑 화면 아트"
      : surface === "map"
        ? "경로 보드 아트"
        : surface === "result"
          ? "결과 카드 준비 중"
          : surface === "ending"
            ? "엔딩 기록 준비 중"
            : surface === "video"
              ? "시네마틱 영상 준비 중"
              : "현장 화면 아트";

  return {
    partId,
    surface,
    chapterLabel,
    channelLabel: stitchRequired ? "Stitch 챕터 배경 아트" : channelLabel,
    assetLabel: artKey ?? "미지정 아트 키",
    expectedLabel: expectedSrc ?? "public/generated/images/<art_key>.webp",
    stitchTargetLabel: stitchTargetKey ?? "미지정 Stitch 키",
    stitchPromptLabel: stitchPromptFile ?? "private/prompts/antigravity/chapters/<chapter>/background/bg_primary.md",
    summaryLabel: stitchRequired
      ? "이 화면은 해당 챕터의 싱글 스토리 포커스용 Stitch 배경이 필요합니다."
      : "준비 중인 화면입니다. 연결이 완료되면 자동으로 반영됩니다."
  };
}

async function probeStaticFile(path: string): Promise<boolean> {
  if (fileProbeCache.has(path)) {
    return fileProbeCache.get(path) ?? false;
  }

  const isRenderableAssetResponse = (contentType: string | null): boolean => {
    if (!contentType) {
      return true;
    }

    return !contentType.toLowerCase().includes("text/html");
  };

  try {
    const headResponse = await fetch(path, {
      method: "HEAD",
      cache: "no-store"
    });

    if (headResponse.ok && isRenderableAssetResponse(headResponse.headers.get("content-type"))) {
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
    const exists = getResponse.ok && isRenderableAssetResponse(getResponse.headers.get("content-type"));
    fileProbeCache.set(path, exists);
    return exists;
  } catch {
    fileProbeCache.set(path, false);
    return false;
  }
}

async function resolveFirstAvailableSource(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (await probeStaticFile(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

async function loadMetaFile(id: string): Promise<MediaMetaDefinition | null> {
  if (metaCache.has(id)) {
    return metaCache.get(id) ?? null;
  }

  try {
    const response = await fetch(resolveRuntimeMetaUrl(id), {
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
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(resolution.src);
  const meta = useMediaMeta(resolution.key, fallbackMeta ?? getPart1DefaultMediaMeta(resolution.key));

  useEffect(() => {
    let cancelled = false;

    if (!resolution.src) {
      setResolvedSrc(undefined);
      setStatus("missing_x");
      return () => {
        cancelled = true;
      };
    }

    if (resolution.matched_from === "direct" && !resolution.strict_drop) {
      setResolvedSrc(resolution.src);
      setStatus("resolved");
      return () => {
        cancelled = true;
      };
    }

    void resolveFirstAvailableSource(resolution.candidates.length > 0 ? resolution.candidates : [resolution.src]).then(
      (availableSrc) => {
        if (!cancelled) {
          setResolvedSrc(availableSrc);
          setStatus(availableSrc ? "resolved" : "missing_x");
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [resolution.candidates, resolution.matched_from, resolution.src, resolution.strict_drop]);

  return {
    status,
    src: status === "resolved" ? resolvedSrc : undefined,
    expectedSrc: resolution.expected_src ?? resolution.src,
    meta,
    stitchRequired: resolution.stitch_required,
    stitchTargetKey: resolution.stitch_target_key,
    stitchTargetPath: resolution.stitch_target_path,
    stitchPromptFile: resolution.stitch_prompt_file
  };
}

export function useResolvedVideo(videoId?: string, fallbackMeta?: MediaMetaDefinition): ResolvedVideoState {
  const registry = useMemo(() => getPart1VideoRegistryEntry(videoId), [videoId]);
  const expectedSrc = registry ? resolveRuntimeVideoUrl(registry.video_id) : undefined;
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
  const { status, src, expectedSrc, meta, stitchRequired, stitchTargetKey, stitchTargetPath, stitchPromptFile } =
    useResolvedArt(artKey, chapterId, fallbackMeta);
  const [imgFailed, setImgFailed] = useState(false);
  const partId = resolvePartTheme(chapterId, artKey);
  const surfaceKind = inferSurfaceKind(artKey, screenLabel);
  const missingCopy = buildMissingMediaCopy({
    artKey,
    chapterId,
    screenLabel,
    expectedSrc,
    stitchRequired,
    stitchTargetKey,
    stitchPromptFile
  });
  const frameClassName = ["art-frame", className].filter(Boolean).join(" ");
  const displayCaption = meta?.caption ?? caption;
  const displayTitle = meta?.title ?? caption ?? missingCopy.channelLabel;
  const stitchResolved = Boolean(stitchRequired && status === "resolved" && src && !imgFailed && src === stitchTargetPath);

  useEffect(() => {
    applyGlobalPartTheme(partId);
  }, [partId]);

  useEffect(() => {
    setImgFailed(false);
  }, [artKey, chapterId, src]);

  if (!artKey) {
    const fallbackSrc = resolveResultFallback(fallback);
    return (
      <div
        className={frameClassName}
        data-part={partId}
        data-surface={surfaceKind}
        data-media-status={fallbackSrc ? "fallback-image" : "missing"}
        data-art-key={artKey ?? ""}
        data-expected-src={expectedSrc ?? ""}
        data-stitch-required={stitchRequired ? "true" : "false"}
        data-stitch-target-key={stitchTargetKey ?? ""}
        data-stitch-target-path={stitchTargetPath ?? ""}
        data-stitch-prompt-file={stitchPromptFile ?? ""}
        data-stitch-resolved="false"
      >
        {fallbackSrc ? (
          <img className="art-frame-image" src={fallbackSrc} alt={displayTitle} />
        ) : (
          <div className="art-frame-placeholder is-detailed">
            <div className="asset-missing-card">
              <span className="asset-missing-kicker">{missingCopy.channelLabel}</span>
              <strong>{displayTitle}</strong>
              <p className="asset-missing-summary">{missingCopy.summaryLabel}</p>
              <dl className="asset-missing-grid">
                <div>
                  <dt>파트</dt>
                  <dd>{missingCopy.partId}</dd>
                </div>
                <div>
                  <dt>챕터</dt>
                  <dd>{missingCopy.chapterLabel}</dd>
                </div>
                <div>
                  <dt>화면</dt>
                  <dd>{missingCopy.surface}</dd>
                </div>
                <div>
                  <dt>예상 출력 경로</dt>
                  <dd>{missingCopy.expectedLabel}</dd>
                </div>
                {stitchRequired ? (
                  <>
                    <div>
                      <dt>Stitch 키</dt>
                      <dd>{missingCopy.stitchTargetLabel}</dd>
                    </div>
                    <div>
                      <dt>Stitch 프롬프트</dt>
                      <dd>{missingCopy.stitchPromptLabel}</dd>
                    </div>
                  </>
                ) : null}
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
      data-media-status={status === "resolved" && src && !imgFailed ? "resolved" : "missing"}
      data-art-key={artKey ?? ""}
      data-expected-src={expectedSrc ?? ""}
      data-stitch-required={stitchRequired ? "true" : "false"}
      data-stitch-target-key={stitchTargetKey ?? ""}
      data-stitch-target-path={stitchTargetPath ?? ""}
      data-stitch-prompt-file={stitchPromptFile ?? ""}
      data-stitch-resolved={stitchResolved ? "true" : "false"}
    >
      {status === "resolved" && src && !imgFailed ? (
        <img className="art-frame-image" src={src} alt={displayTitle} onError={() => setImgFailed(true)} />
      ) : (
        <div className={`art-frame-placeholder ${placeholderMode === "detailed" ? "is-detailed" : "is-simple"}`}>
          <div className="asset-missing-card">
            <span className="asset-missing-kicker">{missingCopy.channelLabel}</span>
            <strong>{displayTitle}</strong>
            <p className="asset-missing-summary">{missingCopy.summaryLabel}</p>
            {placeholderMode === "detailed" ? (
              <dl className="asset-missing-grid">
                <div>
                  <dt>파트</dt>
                  <dd>{missingCopy.partId}</dd>
                </div>
                <div>
                  <dt>챕터</dt>
                  <dd>{missingCopy.chapterLabel}</dd>
                </div>
                <div>
                  <dt>화면</dt>
                  <dd>{missingCopy.surface}</dd>
                </div>
                <div>
                  <dt>예상 출력 경로</dt>
                  <dd>{expectedSrc ?? "public/generated/images/<art_key>.webp"}</dd>
                </div>
                {stitchRequired ? (
                  <>
                    <div>
                      <dt>Stitch 키</dt>
                      <dd>{missingCopy.stitchTargetLabel}</dd>
                    </div>
                    <div>
                      <dt>Stitch 프롬프트</dt>
                      <dd>{missingCopy.stitchPromptLabel}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
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
          {isPlaying ? "영상 닫기" : "영상 재생"}
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

      {meta?.credit ? <div className="media-video-credit">크레딧 {meta.credit}</div> : null}
    </div>
  );
}



