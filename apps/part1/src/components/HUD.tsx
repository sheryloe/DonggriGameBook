import React from 'react';
import { useGameStore } from '../store/gameStore';

export const HUD: React.FC = () => {
  const { stats, currentChapterId, toggleInventory, toggleStats } = useGameStore();

  const renderStat = (label: string, value: number, max: number, type: string) => (
    <div className="stat-item glass-panel" onClick={toggleStats} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="stat-bar-container">
        <div 
          className={`stat-bar-fill ${type}-fill`} 
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="hud-top">
      <div className="stats-panel">
        {renderStat('HP', stats.hp, stats.maxHp, 'hp')}
        <button className="hud-btn glass-panel" onClick={toggleInventory}>🎒 인벤토리</button>
        <button className="hud-btn glass-panel" onClick={toggleStats}>📊 상태창</button>
      </div>
      <div className="glass-panel" style={{ fontSize: '14px', fontWeight: 'bold', padding: '10px 20px' }}>
        {currentChapterId || '시스템 로드 중...'}
      </div>
    </div>
  );
};
