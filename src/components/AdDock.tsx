import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdDockProps {
  context: "story" | "landing";
}

const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

function ensureAdSenseScript(client: string) {
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-adsense-loader="true"]',
  );

  if (existing) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `${ADSENSE_SRC}?client=${client}`;
  script.crossOrigin = "anonymous";
  script.dataset.adsenseLoader = "true";
  document.head.appendChild(script);
}

export function AdDock({ context }: AdDockProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const client = import.meta.env.VITE_ADSENSE_CLIENT;
  const slot = import.meta.env.VITE_ADSENSE_SLOT;
  const ready = Boolean(client && slot);

  useEffect(() => {
    if (!ready || !adRef.current) {
      return;
    }

    ensureAdSenseScript(client);
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  }, [client, ready, slot]);

  return (
    <aside
      className={`ad-dock ad-dock--${context}`}
      aria-label={ready ? "광고 슬롯" : "광고 슬롯 준비 영역"}
    >
      <div className="ad-dock__header">
        <span className="eyebrow">Partner Slot</span>
        <strong>{ready ? "Sponsored" : "AdSense Ready"}</strong>
      </div>
      {ready ? (
        <ins
          ref={adRef}
          className="adsbygoogle ad-dock__slot"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-dock__placeholder">
          <strong>광고 슬롯 준비됨</strong>
          <p>
            `.env.local`에 `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT`을 넣으면
            이 위치에서 실제 광고 슬롯을 렌더링한다.
          </p>
        </div>
      )}
    </aside>
  );
}
