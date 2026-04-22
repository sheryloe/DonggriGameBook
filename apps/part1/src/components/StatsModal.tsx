import React from 'react';
import { useGameStore } from '../store/gameStore';

export const StatsModal: React.FC = () => {
  const { stats, isStatsOpen, toggleStats } = useGameStore();

  if (!isStatsOpen) return null;

  return (
    <div className="modal-overlay" onClick={toggleStats}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 생존자 상태</h2>
          <button className="close-btn" onClick={toggleStats}>×</button>
        </div>
        
        <div className="stats-detail-grid">
          <div className="stat-detail-item">
            <span className="stat-label">레벨</span>
            <span className="stat-value">{stats.level}</span>
          </div>
          <div className="stat-detail-item">
            <span className="stat-label">경험치</span>
            <span className="stat-value">{stats.exp}</span>
          </div>
          <hr />
          <div className="stat-detail-item">
            <span className="stat-label">체력</span>
            <span className="stat-value">{stats.hp} / {stats.maxHp}</span>
          </div>
          <div className="stat-detail-item">
            <span className="stat-label">스태미나</span>
            <span className="stat-value">{stats.stamina} / {stats.maxStamina}</span>
          </div>
          <div className="stat-detail-item">
            <span className="stat-label">정신력</span>
            <span className="stat-value">{stats.mental} / {stats.maxMental}</span>
          </div>
          <hr />
          <div className="stat-detail-item">
            <span className="stat-label">소음도</span>
            <span className="stat-value" style={{ color: stats.noise > 50 ? '#ff4d4d' : '#fff' }}>
              {stats.noise}
            </span>
          </div>
          <div className="stat-detail-item">
            <span className="stat-label">오염도</span>
            <span className="stat-value" style={{ color: stats.contamination > 50 ? '#4dff4d' : '#fff' }}>
              {stats.contamination}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
