import React from "react";
import { useGameStore } from "../store/gameStore";
import { contentLoader } from "../loaders/contentLoader";

const CATEGORIES = ["all", "weapon", "consumable", "gear", "quest", "crafting", "utility"];
const CATEGORY_LABELS: Record<string, string> = {
  all: "ALL_DEPT",
  weapon: "ARMORY",
  consumable: "MED_BAY",
  gear: "EQUIPMENT",
  quest: "MISSION_DATA",
  crafting: "MATERIALS",
  utility: "UTILITIES",
};

export const InventoryModal: React.FC = () => {
  const { inventory, isInventoryOpen, toggleInventory } = useGameStore();
  const [filter, setFilter] = React.useState("all");

  if (!isInventoryOpen) return null;

  const filteredItems =
    filter === "all" ? inventory : inventory.filter((item) => contentLoader.getItem(item.item_id)?.category === filter);

  return (
    <div className="modal-overlay" onClick={toggleInventory} style={{ backdropFilter: "blur(12px)" }}>
      <section className="modal-content glass-panel tactical-frame scrollbar-hide" onClick={(event) => event.stopPropagation()} style={{ border: "none", background: "rgba(5, 7, 8, 0.98)", maxWidth: "800px", animation: "fadeIn 0.3s both" }}>
        <div className="scanline-overlay" />
        
        <header className="modal-header">
          <div>
            <p className="eyebrow glitch-text" data-text="INVENTORY_MANAGEMENT.V1">INVENTORY_MANAGEMENT.V1</p>
            <h2 style={{ fontFamily: "var(--heading-font)", textTransform: "uppercase" }}>Archive_Contents</h2>
          </div>
          <button className="close-btn tactical-frame" type="button" onClick={toggleInventory} style={{ border: "none", background: "rgba(227, 75, 75, 0.15)", color: "#ffb0a8" }}>
            TERMINATE_LINK
          </button>
        </header>

        <div className="inventory-tabs scrollbar-hide" style={{ marginBottom: "24px", borderBottom: "1px solid rgba(156, 207, 214, 0.1)", paddingBottom: "12px" }}>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`tab-btn tactical-frame ${filter === category ? "active" : ""}`}
              onClick={() => setFilter(category)}
              style={{ fontSize: "0.7rem", fontFamily: "var(--mono-family)", border: "none", background: filter === category ? "var(--accent-color)" : "rgba(255,255,255,0.03)" }}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <div className="inventory-grid scrollbar-hide" style={{ maxHeight: "60vh", overflowY: "auto", padding: "10px" }}>
          {filteredItems.length === 0 ? (
            <div className="empty-msg glitch-text" data-text="EMPTY_SLOTS_DETECTED" style={{ textAlign: "center", padding: "40px", opacity: 0.5 }}>EMPTY_SLOTS_DETECTED</div>
          ) : (
            filteredItems.map((item) => {
              const itemData = contentLoader.getItem(item.item_id);
              const rarity = itemData?.rarity ?? "common";
              const rarityColor = rarity === "epic" ? "#e8c66b" : rarity === "rare" ? "#9ccfd6" : "#a9b0ad";
              const glowClass = rarity === "epic" ? "rarity-glow-epic" : rarity === "rare" ? "rarity-glow-rare" : "";
              
              return (
                <article key={item.item_id} className={`inventory-item-card tactical-frame ${glowClass}`} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${rarityColor}22`, marginBottom: "12px", transition: "transform 0.2s" }}>
                  <div className="item-icon" style={{ background: "rgba(0,0,0,0.5)", color: rarityColor, border: `1px solid ${rarityColor}44`, fontSize: "1.2rem" }}>
                    {itemData?.category === "weapon" ? "⚔" : itemData?.category === "consumable" ? "💊" : "📦"}
                  </div>
                  <div className="item-info">
                    <div className="item-header">
                      <span className="item-name" style={{ color: rarityColor, fontWeight: 900, fontSize: "1.1rem" }}>{itemData?.name_ko ?? item.item_id}</span>
                      <span className="item-qty" style={{ fontFamily: "var(--mono-family)", color: "var(--accent-color)" }}>x{item.quantity}</span>
                    </div>
                    <p className="item-desc" style={{ fontSize: "0.9rem", marginTop: "4px", color: "var(--text-muted)" }}>{itemData?.description ?? "Telemetric data corrupted or missing."}</p>
                    <div className="item-meta" style={{ marginTop: "10px", display: "flex", gap: "12px", fontSize: "0.7rem", fontFamily: "var(--mono-family)", opacity: 0.5 }}>
                      <span style={{ color: rarityColor }}>[{rarity.toUpperCase()}]</span>
                      {itemData?.weight ? <span>MASS: {itemData.weight}KG</span> : null}
                      {itemData?.category && <span>DEPT: {itemData.category.toUpperCase()}</span>}
                    </div>
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
