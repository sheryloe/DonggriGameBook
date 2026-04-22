import React from 'react';
import { useGameStore } from '../store/gameStore';
import { contentLoader } from '../loaders/contentLoader';
import { eventRunner } from '../engine/eventRunner';

export const ResultScreen: React.FC = () => {
  const { currentChapterId, stats } = useGameStore();
  const chapter = contentLoader.getChapter(currentChapterId || '');

  if (!chapter) return null;

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(/img/bg/result_bg.webp)' }}>
      <div className="content-area">
        <div className="glass-panel" style={{ maxWidth: '600px', textAlign: 'center', padding: '40px' }}>
          <h1 style={{ color: '#ffd700', fontSize: '48px', marginBottom: '10px', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>MISSION CLEAR</h1>
          <h2 style={{ marginBottom: '30px' }}>{chapter.title} 완료</h2>
          
          <div style={{ textAlign: 'left', marginBottom: '40px', borderTop: '1px solid var(--surface-border)', paddingTop: '20px' }}>
            <h4 style={{ color: 'var(--accent-color)', marginBottom: '15px' }}>보상 획득</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>기본 경험치</span>
              <span style={{ color: '#ffd700' }}>+500 EXP</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>물자 회수 보너스</span>
              <span style={{ color: '#ffd700' }}>+200 CR</span>
            </div>
            
            <h4 style={{ color: 'var(--accent-color)', marginTop: '20px', marginBottom: '15px' }}>최종 상태</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>현재 레벨</span>
              <span>LV. {stats.level}</span>
            </div>
          </div>

          <button className="btn-primary" onClick={() => eventRunner.nextChapter()} style={{ padding: '15px 60px' }}>
            다음 챕터로
          </button>
        </div>
      </div>
    </div>
  );
};
