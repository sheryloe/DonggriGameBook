import React from 'react';
import { useGameStore } from '../store/gameStore';

export const HUD: React.FC = () => {
  const { stats, currentChapterId } = useGameStore();

  const renderStat = (label: string, value: number, max: number, type: string) => (
    <div className="stat-item glass-panel">
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
        {renderStat('체력 (HP)', stats.hp, stats.maxHp, 'hp')}
        {renderStat('스태미나', stats.stamina, stats.maxStamina, 'stamina')}
        {renderStat('정신력', stats.mental, stats.maxMental, 'mental')}
      </div>
      <div className="glass-panel" style={{ fontSize: '14px', fontWeight: 'bold' }}>
        {currentChapterId || '시스템 로드 중...'}
      </div>
    </div>
  );
};
