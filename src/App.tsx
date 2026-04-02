import { startTransition, useEffect, useState } from "react";
import GameShell from "./components/GameShell";
import { loadPack } from "./loaders/contentLoader";
import BossIntroScreen from "./screens/BossIntroScreen";
import BattleScreen from "./screens/BattleScreen";
import BriefingScreen from "./screens/BriefingScreen";
import ChapterMapScreen from "./screens/ChapterMapScreen";
import EventScreen from "./screens/EventScreen";
import LootScreen from "./screens/LootScreen";
import ResultScreen from "./screens/ResultScreen";
import RouteSelectScreen from "./screens/RouteSelectScreen";
import SafehouseScreen from "./screens/SafehouseScreen";
import { useGameStore } from "./store/gameStore";

function LoadingView() {
  return (
    <main className="boot-screen">
      <section className="boot-card">
        <p className="eyebrow">Runtime Boot</p>
        <h1>CH01-CH05 Pack Loading</h1>
        <p>Loading manifest, schemas, data, UI flow, docs, and fallback assets.</p>
      </section>
    </main>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <main className="boot-screen">
      <section className="boot-card is-error">
        <p className="eyebrow">Runtime Failure</p>
        <h1>Failed to load content pack</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}

function ActiveScreen() {
  const screenType = useGameStore((state) => state.runtime.ui_screen);

  switch (screenType) {
    case "chapter_briefing":
      return <BriefingScreen />;
    case "world_map":
      return <ChapterMapScreen />;
    case "loot_resolution":
      return <LootScreen />;
    case "boss_intro":
      return <BossIntroScreen />;
    case "combat_arena":
      return <BattleScreen />;
    case "result_summary":
      return <ResultScreen />;
    case "route_select":
      return <RouteSelectScreen />;
    case "safehouse":
      return <SafehouseScreen />;
    case "event_dialogue":
    default:
      return <EventScreen />;
  }
}

export default function App() {
  const content = useGameStore((state) => state.content);
  const hydrateContent = useGameStore((state) => state.hydrateContent);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    loadPack()
      .then((pack) => {
        if (!active) {
          return;
        }

        startTransition(() => {
          hydrateContent(pack);
          setStatus("ready");
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Unknown runtime load error");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [hydrateContent]);

  if (status === "error") {
    return <ErrorView message={errorMessage} />;
  }

  if (status === "loading" || !content) {
    return <LoadingView />;
  }

  return (
    <GameShell>
      <ActiveScreen />
    </GameShell>
  );
}
