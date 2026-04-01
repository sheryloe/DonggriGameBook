import { useEffect, useState } from "react";
import { InventoryItem } from "../lib/storyUi";
import { StoryState } from "../types/story";

interface InventoryPanelProps {
  items: InventoryItem[];
  state: StoryState;
  alertLevel: string;
}

export function InventoryPanel({
  items,
  state,
  alertLevel,
}: InventoryPanelProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0]?.id ?? "");
    }
  }, [items, selectedId]);

  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];

  return (
    <section className="panel panel--inventory" aria-labelledby="inventory-title">
      <div className="panel__header">
        <div>
          <span className="panel__eyebrow">Inventory</span>
          <h2 id="inventory-title">회수 기록과 체류 물자</h2>
        </div>
        <p>기록 가능한 것만 남는다. 물자는 곧 체류 자격이다.</p>
      </div>

      <div className="inventory-grid">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`inventory-slot inventory-slot--${item.accent} ${
              item.id === selectedId ? "inventory-slot--active" : ""
            }`.trim()}
            onClick={() => setSelectedId(item.id)}
          >
            <span className="inventory-slot__category">{item.category}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>

      {selectedItem ? (
        <div className="inventory-detail">
          <article className="inventory-detail__card">
            <span className="panel__eyebrow">Selected Item</span>
            <h3>{selectedItem.label}</h3>
            <p>{selectedItem.description}</p>
            <p className="inventory-detail__meta">{selectedItem.detail}</p>
          </article>

          <aside className="inventory-detail__actions">
            <div className="inventory-stat">
              <span>보급</span>
              <strong>{state.supplies} / 9</strong>
            </div>
            <div className="inventory-stat">
              <span>소음</span>
              <strong>{state.noise} / 9</strong>
            </div>
            <div className="inventory-stat">
              <span>상태 판정</span>
              <strong>{alertLevel}</strong>
            </div>
            <div className="inventory-actions">
              <button type="button" className="inventory-action inventory-action--muted">
                보관
              </button>
              <button type="button" className="inventory-action inventory-action--olive">
                보고서 반영
              </button>
              <button type="button" className="inventory-action inventory-action--danger">
                폐기
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
