import { useEffect, useState } from "react";
import { getChapterCatalogEntry, getChapterRuntimeConfig } from "../packages/world-registry/src";
import { useGameStore } from "./store/gameStore";

function useTypewriter(text: string, speed = 30) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let index = 0;
    if (!text) {
      return;
    }

    const timer = window.setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index += 1;

      if (index >= text.length) {
        window.clearInterval(timer);
      }
    }, speed);

    return () => window.clearInterval(timer);
  }, [text, speed]);

  return displayedText;
}

function App() {
  const store = useGameStore();
  const chapterEntry = getChapterCatalogEntry(store.currentChapterId);
  const chapterRuntime = getChapterRuntimeConfig(store.currentChapterId);
  const chapterTitle = chapterEntry?.title ?? store.currentChapterId;
  const hubNodeId = chapterRuntime?.hub_node_id ?? store.currentNodeId;
  const deployNodeId = chapterRuntime?.deploy_node_id ?? store.currentNodeId;

  const currentEventDesc =
    "[SYSTEM LOG] 신호 해석과 회수 루프는 파트/챕터 catalog 기준으로 재구성되었다. 이제 허브 판정, 출격 노드, 복귀 지점은 개별 챕터 런타임 설정에서 읽는다.";
  const typedText = useTypewriter(currentEventDesc, 24);

  const isHub = store.currentNodeId === hubNodeId;

  if (store.stats.hp <= 0) {
    return (
      <div
        style={{
          backgroundColor: "#131313",
          color: "#8B0000",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace"
        }}
      >
        <h1 style={{ fontSize: "5rem", margin: 0, textShadow: "2px 2px #ffb4a8" }}>K.I.A</h1>
        <p style={{ color: "#e3beb8", fontSize: "1.2rem" }}>YOU LOST ALL UNSECURED ITEMS.</p>
        <button
          onClick={() => store.dieAndLoseLoot()}
          style={{
            marginTop: "2rem",
            padding: "1rem 2rem",
            backgroundColor: "#353534",
            border: "1px solid #5a403c",
            color: "#e5e2e1",
            cursor: "pointer",
            fontFamily: "monospace"
          }}
        >
          WAKE UP AT HUB
        </button>
      </div>
    );
  }

  if (isHub) {
    return (
      <div
        style={{
          backgroundColor: "#131313",
          color: "#e5e2e1",
          minHeight: "100vh",
          padding: "2rem",
          fontFamily: "monospace"
        }}
      >
        <div style={{ borderBottom: "2px solid #353534", paddingBottom: "1rem", marginBottom: "2rem" }}>
          <h1 style={{ color: "#ffb4a8", margin: 0 }}>BASECAMP HUB</h1>
          <p style={{ color: "#e3beb8", margin: "0.5rem 0 0" }}>PART: {store.partId}</p>
          <p style={{ color: "#e3beb8", margin: 0 }}>CHAPTER: {chapterTitle}</p>
          <p style={{ color: "#e3beb8", margin: 0 }}>LOCATION: {store.currentNodeId}</p>
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "stretch" }}>
          <div style={{ flex: 1, backgroundColor: "#0e0e0e", padding: "1.5rem", border: "1px solid #5a403c" }}>
            <h3 style={{ marginTop: 0, color: "#8adb4d" }}>OPERATOR VITALS</h3>
            <p>APP: {store.appId}</p>
            <p>HP: {store.stats.hp} / {store.stats.max_hp}</p>
            <p>NOISE: {store.stats.noise}</p>
            <p>CONTAMINATION: {store.stats.contamination}</p>

            <hr style={{ borderColor: "#353534" }} />
            <h3 style={{ color: "#ffb4a8" }}>ACTIVE QUESTS</h3>
            {Object.entries(store.quests)
              .filter(([, status]) => status === "active")
              .map(([questId]) => (
                <div key={questId} style={{ color: "#e3beb8", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  &gt; {questId.replace(/_/g, " ").toUpperCase()}
                </div>
              ))}

            <hr style={{ borderColor: "#353534" }} />
            <h3 style={{ color: "#8adb4d" }}>INVENTORY</h3>
            <pre style={{ color: "#e3beb8", fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(store.inventory, null, 2)}
            </pre>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button
              style={{
                padding: "1.5rem",
                backgroundColor: "#201f1f",
                color: "#e5e2e1",
                border: "none",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              [1] ORGANIZE STASH
            </button>
            <button
              style={{
                padding: "1.5rem",
                backgroundColor: "#201f1f",
                color: "#e5e2e1",
                border: "none",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              [2] BLACK MARKET
            </button>
            <div style={{ flexGrow: 1 }} />
            <button
              onClick={() => store.moveToNode(deployNodeId)}
              style={{
                padding: "2rem",
                backgroundColor: "#8B0000",
                color: "#131313",
                border: "none",
                fontSize: "1.5rem",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              \ DEPLOY TO RAID /
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#131313",
        color: "#e5e2e1",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "monospace"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #353534",
          paddingBottom: "1rem",
          marginBottom: "2rem"
        }}
      >
        <div>
          <h2 style={{ color: "#ffb4a8", margin: 0 }}>RAID: {chapterTitle}</h2>
          <p style={{ margin: 0, color: "#e3beb8" }}>NODE: {store.currentNodeId}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, color: "#8adb4d" }}>
            HP: {store.stats.hp} | NOISE: {store.stats.noise} | RAD: {store.stats.contamination}
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: "#0e0e0e", padding: "2rem", border: "1px solid #5a403c", minHeight: 200 }}>
        <p style={{ fontSize: "1.2rem", lineHeight: "1.6", color: "#ffb4a8" }}>
          {typedText}
          <span style={{ animation: "blink 1s step-end infinite" }}>_</span>
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes blink {
              50% { opacity: 0; }
            }
          `
        }}
      />

      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
        <button
          onClick={() => store.modifyStat("noise", 5)}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: "#201f1f",
            color: "#e5e2e1",
            border: "1px solid #5a403c",
            cursor: "pointer"
          }}
        >
          SCAVENGE (HIGH NOISE)
        </button>
        <button
          onClick={() => store.modifyStat("hp", -20)}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: "#313030",
            color: "#ffb4a8",
            border: "1px solid #8b0000",
            cursor: "pointer"
          }}
        >
          FIGHT BUTCHER (HP COST)
        </button>
        <button
          onClick={() => store.extractToHub()}
          style={{
            flex: 1,
            padding: "1rem",
            backgroundColor: "#201f1f",
            color: "#8adb4d",
            border: "1px solid #56a315",
            cursor: "pointer"
          }}
        >
          EXTRACT (RETURN TO HUB)
        </button>
      </div>
    </div>
  );
}

export default App;
