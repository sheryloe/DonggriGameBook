import React from 'react';
import { useGameStore } from '../store/gameStore';
import { contentLoader } from '../loaders/contentLoader';
import { eventRunner } from '../engine/eventRunner';

export const ChapterMapScreen: React.FC = () => {
  const { currentChapterId, currentNodeId, visitedNodes } = useGameStore();
  const chapter = contentLoader.getChapter(currentChapterId || '');

  if (!chapter) return <div className="screen-container">맵 데이터를 찾을 수 없습니다.</div>;

  const currentNode = chapter.nodes.find(n => n.node_id === currentNodeId);

  return (
    <div className="screen-container" style={{ background: '#111 url(/img/ui/map_bg.webp)' }}>
      <div className="content-area" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
        <div className="glass-panel" style={{ width: '300px', marginBottom: '20px' }}>
          <h4 style={{ color: 'var(--primary-color)', marginBottom: '5px' }}>현재 위치</h4>
          <h2 style={{ fontSize: '20px' }}>{currentNode?.name || '알 수 없음'}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px' }}>{currentNode?.description}</p>
        </div>

        <div className="glass-panel" style={{ flex: 1, width: '100%', position: 'relative', overflow: 'auto' }}>
          <div style={{ position: 'relative', width: '1000px', height: '600px' }}>
            {chapter.nodes.map(node => {
              const isCurrent = node.node_id === currentNodeId;
              const isVisited = visitedNodes.includes(node.node_id);
              
              return (
                <div 
                  key={node.node_id}
                  onClick={() => isVisited || isCurrent ? null : eventRunner.enterNode(node.node_id)}
                  style={{
                    position: 'absolute',
                    left: `${node.coordinates.x}px`,
                    top: `${node.coordinates.y}px`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--primary-color)' : (isVisited ? 'var(--secondary-color)' : '#333'),
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 0 20px var(--primary-glow)' : 'none',
                    transition: 'all 0.3s ease',
                    zIndex: 2
                  }}
                  title={node.name}
                >
                  <span style={{ fontSize: '10px', textAlign: 'center' }}>{node.name}</span>
                </div>
              );
            })}

            {/* Simple lines for connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              {chapter.nodes.map(node => node.connections.map(conn => {
                const target = chapter.nodes.find(n => n.node_id === conn.to);
                if (!target) return null;
                return (
                  <line 
                    key={`${node.node_id}-${conn.to}`}
                    x1={node.coordinates.x + 30}
                    y1={node.coordinates.y + 30}
                    x2={target.coordinates.x + 30}
                    y2={target.coordinates.y + 30}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                  />
                );
              }))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
