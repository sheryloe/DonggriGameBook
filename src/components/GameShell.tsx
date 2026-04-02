import type { ReactNode } from "react";
import { useGameStore } from "../store/gameStore";
import {
  selectCarryLimit,
  selectCurrentChapter,
  selectCurrentEvent,
  selectInventoryWeight
} from "../store/selectors";
import ArtFrame from "./ArtFrame";
import InventoryPanel from "./InventoryPanel";
import WarningStack from "./WarningStack";
import WarningsPanel from "./WarningsPanel";
import StatBar from "./StatBar";

interface GameShellProps {
  children: ReactNode;
}

const CHAPTER_DEFAULT_ART: Record<string, string> = {
  CH01: "bg_yeouido_ashroad",
  CH02: "bg_noryangjin_market",
  CH03: "bg_jamsil_station",
  CH04: "bg_sorting_hall",
  CH05: "bg_pangyo_lobby"
};

export default function GameShell({ children }: GameShellProps) {
  const runtime = useGameStore((state) => state.runtime);
  const warnings = useGameStore((state) => state.warnings);
  const chapter = useGameStore(selectCurrentChapter);
  const event = useGameStore(selectCurrentEvent);
  const carryWeight = useGameStore(selectInventoryWeight);
  const carryLimit = useGameStore(selectCarryLimit);
  const toggleOverlay = useGameStore((state) => state.toggleOverlay);

  const artKey = event?.presentation.art_key ?? CHAPTER_DEFAULT_ART[runtime.current_chapter_id];
  const hp = Number(runtime.stats.hp ?? 100);
  const maxHp = Number(runtime.stats.max_hp ?? 100);
  const contamination = Number(runtime.stats.contamination ?? 0);
  const noise = Number(runtime.stats.noise ?? 0);

  return (
    <div className="runtime-shell">
      <div className="runtime-backdrop">
        <ArtFrame
          assetKey={artKey}
          chapterId={runtime.current_chapter_id}
          alt={chapter?.title ?? "Chapter backdrop"}
          className="runtime-backdrop-frame"
        />
      </div>
      <div className="runtime-overlay" />

      <div className="runtime-content">
        <header className="runtime-header">
          <div>
            <p className="eyebrow">Chapter {runtime.current_chapter_id}</p>
            <h1>{chapter?.title ?? "Loading chapter"}</h1>
            <p className="runtime-subtitle">{chapter?.role ?? "Mission data is loading."}</p>
          </div>
          <div className="runtime-header-actions">
            <button type="button" className="ghost-button" onClick={() => toggleOverlay("warnings")}>
              Warnings
            </button>
            <button type="button" className="primary-button secondary" onClick={() => toggleOverlay("inventory")}>
              Inventory
            </button>
          </div>
        </header>

        <section className="runtime-stats">
          <StatBar label="HP" value={hp} max={maxHp} tone={hp < maxHp * 0.35 ? "danger" : "stable"} />
          <StatBar label="Noise" value={noise} max={100} tone={noise > 75 ? "warning" : "stable"} />
          <StatBar
            label="Contamination"
            value={contamination}
            max={100}
            tone={contamination > 70 ? "danger" : contamination > 35 ? "warning" : "stable"}
          />
          <StatBar
            label="Carry"
            value={carryWeight}
            max={carryLimit || 1}
            tone={carryWeight > carryLimit ? "danger" : carryWeight > carryLimit * 0.8 ? "warning" : "stable"}
          />
        </section>

        <WarningStack warnings={warnings} />

        <main className="runtime-main">{children}</main>

        {runtime.overlays.inventory ? (
          <aside className="runtime-drawer">
            <InventoryPanel />
          </aside>
        ) : null}

        {runtime.overlays.warnings ? (
          <aside className="runtime-drawer">
            <WarningsPanel warnings={warnings} onClose={() => toggleOverlay("warnings", false)} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
