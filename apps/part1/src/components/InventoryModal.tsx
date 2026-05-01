import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";
import { categoryLabel, categoryShortLabel, rarityLabel } from "../utils/koreanLabels";
import { getItemUseEffect } from "../utils/survival";

const CATEGORIES = ["all", "weapon", "consumable", "gear", "quest", "crafting", "utility"];

function categoryIcon(category: string | null | undefined): string {
  switch (category) {
    case "weapon": return "전";
    case "consumable": return "약";
    case "gear": return "방";
    case "quest": return "문";
    case "crafting": return "재";
    case "utility": return "도";
    default: return "물";
  }
}

export const InventoryModal: React.FC = () => {
  const { inventory, isInventoryOpen, toggleInventory, useInventoryItem } = useGameStore();
  const [filter, setFilter] = React.useState("all");
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isInventoryOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => previousFocusRef.current?.focus();
  }, [isInventoryOpen]);

  if (!isInventoryOpen) return null;

  const filteredItems = filter === "all" ? inventory : inventory.filter((item) => contentLoader.getItem(item.item_id)?.category === filter);
  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      toggleInventory();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-overlay" onClick={toggleInventory} style={{ backdropFilter: "blur(12px)" }}>
      <section ref={dialogRef} className="modal-content glass-panel tactical-frame scrollbar-hide" role="dialog" aria-modal="true" aria-labelledby="inventory-title" tabIndex={-1} onKeyDown={handleDialogKeyDown} onClick={(event) => event.stopPropagation()} style={{ border: "none", background: "rgba(5, 7, 8, 0.98)", maxWidth: "800px", animation: "fadeIn 0.3s both" }}>
        <div className="scanline-overlay" />
        <header className="modal-header">
          <div>
            <p className="eyebrow" data-text="보관함">보관함</p>
            <h2 id="inventory-title" style={{ fontFamily: "var(--heading-font)", textTransform: "none" }}>회수 물자</h2>
          </div>
          <button className="close-btn tactical-frame" type="button" onClick={toggleInventory} style={{ border: "none", background: "rgba(227, 75, 75, 0.15)", color: "#ffb0a8" }}>닫기</button>
        </header>

        <div className="inventory-tabs scrollbar-hide" style={{ marginBottom: "24px", borderBottom: "1px solid rgba(156, 207, 214, 0.1)", paddingBottom: "12px" }}>
          {CATEGORIES.map((category) => (
            <button key={category} type="button" className={`tab-btn tactical-frame ${filter === category ? "active" : ""}`} onClick={() => setFilter(category)} style={{ fontSize: "0.7rem", fontFamily: "var(--mono-family)", border: "none", background: filter === category ? "var(--accent-color)" : "rgba(255,255,255,0.03)" }}>
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        <div className="inventory-grid scrollbar-hide" style={{ maxHeight: "60vh", overflowY: "auto", padding: "10px" }}>
          {filteredItems.length === 0 ? (
            <div className="empty-msg glitch-text" data-text="보관 중인 물자가 없습니다." style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>
              보관 중인 물자가 없습니다.
            </div>
          ) : (
            filteredItems.map((item) => {
              const itemData = contentLoader.getItem(item.item_id);
              const rarity = itemData?.rarity ?? "common";
              const rarityColor = rarity === "epic" ? "#e8c66b" : rarity === "rare" ? "#9ccfd6" : "#a9b0ad";
              const glowClass = rarity === "epic" ? "rarity-glow-epic" : rarity === "rare" ? "rarity-glow-rare" : "";
              const useEffect = getItemUseEffect(itemData);
              return (
                <article key={item.item_id} className={`inventory-item-card tactical-frame ${glowClass}`} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${rarityColor}22`, marginBottom: "12px", transition: "transform 0.2s" }}>
                  <div className="item-icon" style={{ background: "rgba(0,0,0,0.5)", color: rarityColor, border: `1px solid ${rarityColor}44`, fontSize: "1rem" }}>{categoryIcon(itemData?.category)}</div>
                  <div className="item-info">
                    <div className="item-header">
                      <span className="item-name" style={{ color: rarityColor, fontWeight: 900, fontSize: "1.1rem" }}>{itemData?.name_ko ?? item.item_id}</span>
                      <span className="item-qty" style={{ fontFamily: "var(--mono-family)", color: "var(--accent-color)" }}>x{item.quantity}</span>
                    </div>
                    <p className="item-desc" style={{ fontSize: "0.9rem", marginTop: "4px", color: "var(--text-muted)" }}>{itemData?.description ?? "물자 설명이 아직 기록되지 않았습니다."}</p>
                    <div className="item-meta" style={{ marginTop: "10px", display: "flex", gap: "12px", fontSize: "0.7rem", fontFamily: "var(--mono-family)", opacity: 0.65 }}>
                      <span style={{ color: rarityColor }}>[{rarityLabel(rarity)}]</span>
                      {itemData?.weight ? <span>무게: {itemData.weight}kg</span> : null}
                      {itemData?.category ? <span>분류: {categoryShortLabel(itemData.category)}</span> : null}
                    </div>
                    {useEffect ? (
                      <button
                        className="secondary-action tactical-frame"
                        type="button"
                        onClick={() => useInventoryItem(item.item_id)}
                        style={{ marginTop: "12px", padding: "8px 12px", fontSize: "0.78rem" }}
                      >
                        사용 · {useEffect.label}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
