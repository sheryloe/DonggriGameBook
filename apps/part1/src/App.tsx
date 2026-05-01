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
import { FailureScreen } from "./screens/FailureScreen";
import { SafehouseScreen } from "./screens/SafehouseScreen";
import { DeadlineConsequenceScreen } from "./screens/DeadlineConsequenceScreen";
import { InventoryModal } from "./components/InventoryModal";
import { StatsModal } from "./components/StatsModal";
import { AmbientFX } from "./components/AmbientFX";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

const App: React.FC = () => {
  const { currentScreenId, currentChapterId, currentEventId, currentNodeId, stats } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initGame = async () => {
      try {
        await contentLoader.loadAll();
        if (!cancelled && !useGameStore.getState().currentChapterId) {
          await eventRunner.enterChapter("CH01");
        }
        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        if (!cancelled) {
          setError("작전 기록을 복구하지 못했습니다.");
          setLoading(false);
        }
      }
    };
    initGame();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    const timer = window.setTimeout(() => window.scrollTo(0, 0), 80);
    return () => window.clearTimeout(timer);
  }, [currentScreenId, currentChapterId, currentEventId, currentNodeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as any).__part1Store = useGameStore;
    (window as any).__part1EventRunner = eventRunner;
  }, []);

  if (loading) {
    return <div style={{ background: "#050708", color: "white", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>[시스템] 작전 기록 동기화 중...</div>;
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
      case "SAFEHOUSE": return <SafehouseScreen />;
      case "DEADLINE_CONSEQUENCE": return <DeadlineConsequenceScreen />;
      case "RESULT": return <ResultScreen />;
      case "FAILURE": return <FailureScreen />;
      default: return <ChapterMapScreen />;
    }
  };

  const dangerLevel = Math.max(Number(stats.injury ?? 0), Number(stats.infection ?? stats.contamination ?? 0));
  const dangerClass = dangerLevel >= 90 ? "survival-critical" : dangerLevel >= 75 ? "survival-warning" : "";

  return (
    <div className={`part1-app ${dangerClass}`} data-danger-level={Math.round(dangerLevel)}>
      <AmbientFX />
      <HUD />
      <ErrorBoundary>
        <div className="screen-wrapper">{renderScreen()}</div>
      </ErrorBoundary>
      <InventoryModal />
      <StatsModal />
    </div>
  );
};

export default App;