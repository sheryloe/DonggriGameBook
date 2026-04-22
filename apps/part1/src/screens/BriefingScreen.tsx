import React from 'react';
import { useGameStore } from '../store/gameStore';
import { contentLoader } from '../loaders/contentLoader';
import { eventRunner } from '../engine/eventRunner';

export const BriefingScreen: React.FC = () => {
  const { currentChapterId } = useGameStore();
  const chapter = contentLoader.getChapter(currentChapterId || '');

  if (!chapter) return <div className="screen-container">챕터 정보를 불러올 수 없습니다.</div>;

  const handleStart = () => {
    eventRunner.enterNode(chapter.entry_node_id);
  };

  return (
    <div className="screen-container" style={{ 
      backgroundColor: '#000',
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(/img/bg/briefing.webp)',
      backgroundSize: 'cover'
    }}>
      <div className="content-area">
        <div className="glass-panel" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--accent-color)', marginBottom: '10px' }}>CHAPTER {chapter.chapter_id}</h3>
          <h1 style={{ marginBottom: '20px', fontSize: '32px' }}>{chapter.title}</h1>
          
          <div style={{ marginBottom: '30px', color: 'var(--text-muted)' }}>
            <p>{chapter.role}</p>
            <p style={{ marginTop: '10px' }}>권장 레벨: {chapter.recommended_level}</p>
          </div>

          <div style={{ marginBottom: '40px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: 'var(--primary-color)' }}>작전 목표</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {chapter.objectives.map(obj => (
                <li key={obj.objective_id} style={{ marginBottom: '5px', fontSize: '14px' }}>
                  • {obj.text} {obj.required && <span style={{ color: 'var(--primary-color)', fontSize: '10px' }}>[필수]</span>}
                </li>
              ))}
            </ul>
          </div>

          <button className="btn-primary" onClick={handleStart} style={{ padding: '15px 60px' }}>
            작전 개시
          </button>
        </div>
      </div>
    </div>
  );
};
