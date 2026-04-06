import { useEffect, useState } from "react";
import { resolveAssetKey } from "../loaders/contentLoader";

interface ArtFrameProps {
  assetKey?: string | null;
  fallbackAssetKeys?: Array<string | null | undefined>;
  chapterId?: string;
  alt: string;
  className?: string;
  caption?: string;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

export default function ArtFrame({ assetKey, fallbackAssetKeys, chapterId, alt, className, caption }: ArtFrameProps) {
  const resolution = resolveAssetKey(assetKey, chapterId);
  const fallbackSources = (fallbackAssetKeys ?? [])
    .filter((fallbackKey): fallbackKey is string => Boolean(fallbackKey))
    .flatMap((fallbackKey) => {
      const fallbackResolution = resolveAssetKey(fallbackKey, chapterId);
      return [fallbackResolution.src, ...fallbackResolution.fallback_srcs];
    })
    .filter((source): source is string => Boolean(source));

  const sources = dedupe(
    [resolution.src, ...resolution.fallback_srcs, ...fallbackSources].filter(
      (value): value is string => Boolean(value)
    )
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [assetKey, chapterId, fallbackAssetKeys]);

  const source = sources[sourceIndex];

  return (
    <figure className={`art-frame ${className ?? ""}`.trim()}>
      {source ? (
        <img
          className="art-frame-image"
          src={source}
          alt={alt}
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setSourceIndex(sourceIndex + 1);
            } else {
              setSourceIndex(sources.length);
            }
          }}
        />
      ) : null}
      {!source || sourceIndex >= sources.length ? (
        <div className="art-frame-placeholder">
          <span>{caption ?? alt}</span>
        </div>
      ) : null}
      {caption ? <figcaption className="art-frame-caption">{caption}</figcaption> : null}
    </figure>
  );
}
