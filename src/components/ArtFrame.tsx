import { useEffect, useState } from "react";
import { resolveAssetKey } from "../loaders/contentLoader";

interface ArtFrameProps {
  assetKey?: string | null;
  chapterId?: string;
  alt: string;
  className?: string;
  caption?: string;
}

export default function ArtFrame({ assetKey, chapterId, alt, className, caption }: ArtFrameProps) {
  const resolution = resolveAssetKey(assetKey, chapterId);
  const sources = [resolution.src, ...resolution.fallback_srcs].filter(
    (source): source is string => Boolean(source)
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [assetKey, chapterId]);

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
