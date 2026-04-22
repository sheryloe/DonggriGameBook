import React from 'react';
import { useGameStore } from '../store/gameStore';
import { contentLoader } from '../loaders/contentLoader';

export const InventoryModal: React.FC = () => {
  const { inventory, isInventoryOpen, toggleInventory } = useGameStore();
  const [filter, setFilter] = React.useState<string>('all');

  if (!isInventoryOpen) return null;

  const filteredItems = filter === 'all' 
    ? inventory 
    : inventory.filter(i => contentLoader.getItem(i.item_id)?.category === filter);

  const categories = ['all', 'weapon', 'consumable', 'gear', 'quest', 'crafting'];

  return (
    <div className="modal-overlay" onClick={toggleInventory}>
      <div className="modal-content glass-panel inventory-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎒 인벤토리</h2>
          <button className="close-btn" onClick={toggleInventory}>×</button>
        </div>

        <div className="inventory-tabs">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`tab-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="inventory-grid">
          {filteredItems.length === 0 ? (
            <div className="empty-msg">해당 카테고리에 아이템이 없습니다.</div>
          ) : (
            filteredItems.map((item) => {
              const itemData = contentLoader.getItem(item.item_id);
              return (
                <div key={item.item_id} className="inventory-item-card glass-panel">
                  <div className={`item-icon rarity-${itemData?.rarity || 'common'}`}>
                    {itemData?.category === 'weapon' ? '🔫' : 
                     itemData?.category === 'consumable' ? '💊' : 
                     itemData?.category === 'gear' ? '🛡️' : '📦'}
                  </div>
                  <div className="item-info">
                    <div className="item-header">
                      <span className="item-name">{itemData?.name_ko || item.item_id}</span>
                      <span className="item-qty">x{item.quantity}</span>
                    </div>
                    <div className="item-desc">{itemData?.description}</div>
                    <div className="item-meta">
                      <span className="item-rarity">{itemData?.rarity}</span>
                      {itemData?.weight && <span>{itemData.weight}kg</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
