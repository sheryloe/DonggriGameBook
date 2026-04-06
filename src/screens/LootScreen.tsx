import { useState } from "react";
import { useGameStore } from "../store/gameStore";

export default function LootScreen() {
  const lootSession = useGameStore((state) => state.runtime.loot_session);
  const commitLootSelection = useGameStore((state) => state.commitLootSelection);
  const closeLootSession = useGameStore((state) => state.closeLootSession);
  const [selected, setSelected] = useState<string[]>([]);

  if (!lootSession) {
    return (
      <section className="screen-card">
        <p>루팅 가능한 아이템이 없다.</p>
      </section>
    );
  }

  const activeSelection = selected.length ? selected : lootSession.drops.map((drop) => drop.item_id);

  return (
    <section className="screen-card loot-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">Loot Resolution</span>
          <h2>획득 자산</h2>
        </div>
      </header>
      <div className="inventory-grid">
        {lootSession.drops.map((drop) => (
          <button
            key={drop.item_id}
            className={`loot-card ${activeSelection.includes(drop.item_id) ? "is-selected" : ""}`}
            onClick={() =>
              setSelected((current) =>
                current.includes(drop.item_id)
                  ? current.filter((itemId) => itemId !== drop.item_id)
                  : [...current, drop.item_id]
              )
            }
          >
            <strong>{drop.item_id}</strong>
            <span>x{drop.quantity}</span>
          </button>
        ))}
      </div>
      <div className="action-row">
        <button className="primary-button" onClick={() => commitLootSelection(activeSelection)}>
          선택 아이템 확정
        </button>
        <button className="ghost-button" onClick={() => commitLootSelection()}>
          전체 확정
        </button>
        <button className="ghost-button" onClick={() => closeLootSession()}>
          가져가지 않음
        </button>
      </div>
    </section>
  );
}
