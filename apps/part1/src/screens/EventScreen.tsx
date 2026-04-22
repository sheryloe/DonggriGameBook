import React from 'react';
import { useGameStore } from '../store/gameStore';
import { eventRunner } from '../engine/eventRunner';
import { contentLoader } from '../loaders/contentLoader';

export const EventScreen: React.FC = () => {
  const { currentChapterId, currentEventId } = useGameStore();
  
  const chapter = contentLoader.getChapter(currentChapterId || '');
  const event = chapter?.events.find(e => e.event_id === currentEventId);

  if (!event) return <div className="screen-container">이벤트를 찾을 수 없습니다.</div>;

  return (
    <div className="screen-container" style={{ 
      backgroundColor: '#111',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(/img/bg/${event.presentation.art_key}.webp)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="content-area">
        <div className="glass-panel" style={{ maxWidth: '800px', width: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '10px' }}>
            {event.title}
          </h2>
          
          <div style={{ flex: 1, marginBottom: '30px', lineHeight: '1.6', fontSize: '18px' }}>
            {event.text.body.map((line, i) => (
              <p key={i} style={{ marginBottom: '15px' }}>{line}</p>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {event.choices.map((choice) => (
              <button 
                key={choice.choice_id}
                className="btn-primary"
                onClick={() => eventRunner.selectChoice(choice)}
                style={{ textAlign: 'left', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--surface-border)' }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
