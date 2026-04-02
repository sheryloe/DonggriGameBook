import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { selectCarryLimit, selectInventoryWeight, selectIsOverCapacity } from "../store/selectors";

interface InventoryPanelProps {
  compact?: boolean;
}

export default function InventoryPanel({ compact = false }: InventoryPanelProps) {
  const content = useGameStore((state) => state.content);
  const quantities = useGameStore((state) => state.runtime.inventory.quantities);
  const weight = useGameStore(selectInventoryWeight);
  const carryLimit = useGameStore(selectCarryLimit);
  const isOverCapacity = useGameStore(selectIsOverCapacity);
  const stacks = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({
          itemId,
          quantity,
          item: content?.items[itemId]
        }))
        .sort((left, right) => left.itemId.localeCompare(right.itemId)),
    [content, quantities]
  );

  return (
    <section className={`inventory-panel ${compact ? "inventory-panel-compact" : ""}`}>
      <header className="section-head">
        <div>
          <span className="eyebrow">Inventory</span>
          <h3>회수 장비</h3>
        </div>
        <strong className={isOverCapacity ? "tone-danger" : "tone-stable"}>
          {weight.toFixed(1)} / {carryLimit.toFixed(1)}
        </strong>
      </header>
      <div className="inventory-grid">
        {stacks.map(({ itemId, quantity, item }) => (
          <article key={itemId} className="inventory-card">
            <strong>{item?.name_ko ?? itemId}</strong>
            <span>x{quantity}</span>
            {!compact ? <p>{item?.description ?? "설명 없음"}</p> : null}
          </article>
        ))}
        {!stacks.length ? <p className="muted-copy">인벤토리가 비어 있다.</p> : null}
      </div>
    </section>
  );
}
