import React, { useEffect, useState } from "react";
import { useGameStore } from "./store/gameStore";
import { contentLoader } from "./loaders/contentLoader";
import { eventRunner } from "./engine/eventRunner";
import { HUD } from "./components/HUD";
import { BriefingScreen } from "./screens/BriefingScreen";
import { ChapterMapScreen } from "./screens/ChapterMapScreen";
import { EventScreen } from "./screens/EventScreen";
import { BattleScreen } from "./screens/BattleScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { InventoryModal } from "./components/InventoryModal";
import { StatsModal } from "./components/StatsModal";
import { AmbientFX } from "./components/AmbientFX";
import "./index.css";

const App: React.FC = () => {
  const { currentScreenId, stats } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initGame = async () => {
      try {
        await contentLoader.loadAll();
        if (!useGameStore.getState().currentChapterId) {
          await eventRunner.enterChapter("CH01");
        }
        setLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError("SYSTEM_RESTORE_FAILURE");
        setLoading(false);
      }
    };
    initGame();
  }, []);

  if (loading) {
    return <div style={{ background: "#050708", color: "white", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>[SYSTEM] SYNCING_ARCHIVE...</div>;
  }

  if (error) {
    return <div style={{ background: "#050708", color: "red", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>{error}</div>;
  }

  const renderScreen = () => {
    switch (currentScreenId) {
      case "BRIEFING": return <BriefingScreen />;
      case "CHAPTER_MAP": return <ChapterMapScreen />;
      case "EVENT": return <EventScreen />;
      case "BATTLE": return <BattleScreen />;
      case "RESULT": return <ResultScreen />;
      default: return <ChapterMapScreen />;
    }
  };

  return (
    <div className="part1-app">
      <AmbientFX />
      <HUD />
      <div className="screen-wrapper">
        {renderScreen()}
      </div>
      <InventoryModal />
      <StatsModal />
    </div>
  );
};

export default App;
