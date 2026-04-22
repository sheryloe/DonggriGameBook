import React, { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import { contentLoader } from './loaders/contentLoader';
import { eventRunner } from './engine/eventRunner';
import { HUD } from './components/HUD';
import { BriefingScreen } from './screens/BriefingScreen';
import { ChapterMapScreen } from './screens/ChapterMapScreen';
import { EventScreen } from './screens/EventScreen';
import { BattleScreen } from './screens/BattleScreen';
import { ResultScreen } from './screens/ResultScreen';
import { InventoryModal } from './components/InventoryModal';
import { StatsModal } from './components/StatsModal';

import './index.css';

const App: React.FC = () => {
  const { currentScreenId } = useGameStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initGame = async () => {
      try {
        await contentLoader.loadAll();
        // Start with CH01
        await eventRunner.enterChapter("CH01");
        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize game", err);
      }
    };

    initGame();
  }, []);

  if (loading) {
    return (
      <div style={{ background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ marginBottom: '20px', letterSpacing: '4px' }}>ANTIGRAVITY</h1>
          <p style={{ color: 'var(--primary-color)' }}>데이터 복구 중...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreenId) {
      case 'BRIEFING': return <BriefingScreen />;
      case 'CHAPTER_MAP': return <ChapterMapScreen />;
      case 'EVENT': return <EventScreen />;
      case 'BATTLE': return <BattleScreen />;
      case 'RESULT': return <ResultScreen />;
      default: return <ChapterMapScreen />;
    }
  };

  return (
    <div style={{ height: '100%' }}>
      <HUD />
      {renderScreen()}
      <InventoryModal />
      <StatsModal />
    </div>
  );
};

export default App;
