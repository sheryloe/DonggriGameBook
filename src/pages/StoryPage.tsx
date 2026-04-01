import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdDock } from "../components/AdDock";
import { ChoiceCard } from "../components/ChoiceCard";
import { EndingReport } from "../components/EndingReport";
import { InventoryPanel } from "../components/InventoryPanel";
import { ResidentFile } from "../components/ResidentFile";
import { RunLog } from "../components/RunLog";
import { SignalPanel } from "../components/SignalPanel";
import { StatusHud } from "../components/StatusHud";
import { VisualPanel } from "../components/VisualPanel";
import { getNextStory, getStoryByRouteId } from "../data/stories";
import { ensurePlayerProfile, renderProfileText } from "../lib/playerProfile";
import { useStoryRun } from "../lib/useStoryRun";
import {
  deriveAlertLevel,
  deriveInventory,
  deriveResidentTier,
  deriveSignals,
} from "../lib/storyUi";
import { EndingSummary, StoryChoice, StoryDefinition } from "../types/story";

type StoryTab = "journal" | "inventory" | "dossier" | "signals";

const tabs: Array<{ id: StoryTab; label: string }> = [
  { id: "journal", label: "Journal" },
  { id: "inventory", label: "Inventory" },
  { id: "dossier", label: "Dossier" },
  { id: "signals", label: "Signals" },
];

const endingStatus: Record<
  EndingSummary["code"],
  { label: string; verdict: string; cue: string }
> = {
  clear: {
    label: "승인 통과",
    verdict: "정식 임무 자격 확보",
    cue: "다음 회차는 더 넓은 출입구와 더 높은 책임을 다룬다.",
  },
  debt: {
    label: "공제 통과",
    verdict: "조건부 생존",
    cue: "배급과 우선순위가 깎인 상태로 다시 배치된다.",
  },
  quarantine: {
    label: "격리 보류",
    verdict: "접촉 차단",
    cue: "목격담과 흔적을 줄이지 않으면 문은 더 오래 닫힌다.",
  },
};

export function StoryPage() {
  const { storyId, nodeId } = useParams();
  const story = getStoryByRouteId(storyId);

  if (!story) {
    return (
      <main className="story-screen">
        <section className="story-fallback">
          <span className="panel__eyebrow">Route Error</span>
          <h1>존재하지 않는 스토리입니다.</h1>
          <p>잘못된 URL이거나 아직 배치되지 않은 스토리 경로입니다.</p>
          <Link className="cta cta--primary" to="/">
            홈으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const resolvedNodeId = nodeId ?? story.startNodeId;

  if (!story.nodes[resolvedNodeId]) {
    return (
      <main className="story-screen">
        <section className="story-fallback">
          <span className="panel__eyebrow">Route Error</span>
          <h1>존재하지 않는 장면입니다.</h1>
          <p>잘못된 URL이거나 유효하지 않은 직접 진입 경로입니다.</p>
          <Link className="cta cta--primary" to="/">
            홈으로 이동
          </Link>
        </section>
      </main>
    );
  }

  return <StoryRunScreen story={story} nodeId={resolvedNodeId} />;
}

function StoryRunScreen({ story, nodeId }: { story: StoryDefinition; nodeId: string }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StoryTab>("journal");
  const node = story.nodes[nodeId];
  const { snapshot, selectChoice, restart } = useStoryRun(story, nodeId);
  const profile = useMemo(() => ensurePlayerProfile(), []);

  const asset =
    story.assets[node.visual] ??
    ({
      id: "fallback",
      kind: "route-schematic",
      alt: "자산 매핑이 누락된 임시 시각 패널",
      accent: "#8ec5ff",
      mood: "기본 시각 패널",
      callouts: [],
    } as const);
  const progressNodes = story.nodeOrder.filter((orderedNodeId) => !story.nodes[orderedNodeId]?.ending);
  const progressIndex = node.ending
    ? progressNodes.length
    : Math.max(progressNodes.indexOf(node.id), 0);
  const progress = `${Math.min(progressIndex + 1, progressNodes.length)} / ${progressNodes.length}`;
  const tier = deriveResidentTier(snapshot);
  const alertLevel = deriveAlertLevel(snapshot.state);
  const inventory = deriveInventory(snapshot, profile);
  const signals = deriveSignals(asset, snapshot, profile);
  const renderedBody = node.body.map((paragraph) => renderProfileText(paragraph, profile));
  const endingMeta = node.ending ? endingStatus[node.ending.code] : null;
  const ending = node.ending ?? null;
  const nextStory = getNextStory(story.routeId);
  const isEnding = Boolean(ending);

  const onSelect = (choice: StoryChoice) => {
    if (choice.to === story.startNodeId && node.ending) {
      navigate(`${story.routeBase}/${restart()}`);
      return;
    }

    const nextNodeId = selectChoice(choice);

    if (nextNodeId) {
      setActiveTab("journal");
      navigate(`${story.routeBase}/${nextNodeId}`);
    }
  };

  const handleRestart = () => {
    navigate(`${story.routeBase}/${restart()}`);
  };

  return (
    <main
      className={`story-screen ${
        node.ending ? `story-screen--ending story-screen--ending-${node.ending.code}` : ""
      }`.trim()}
    >
      <header className="topbar topbar--story">
        <div className="topbar__brand">{story.title}</div>
        <nav className="topbar__nav" aria-label="스토리 내비게이션">
          <Link to="/">HOME</Link>
          <button type="button" onClick={handleRestart}>
            RESET
          </button>
          <button type="button" onClick={() => setActiveTab("signals")}>
            INTEL
          </button>
        </nav>
        <div className="topbar__meta">
          <span>{profile.callSign}</span>
          <span>{tier}</span>
          <span>{progress}</span>
        </div>
      </header>

      <div className={`story-shell ${isEnding ? "story-shell--ending" : ""}`.trim()}>
        {!isEnding ? (
          <aside className="story-nav">
          <div className="story-nav__header">
            <span className="panel__eyebrow">Raid Log</span>
            <strong>{story.id === "story-02" ? "DAY 02 · OUTER ROUTE" : "DAY 01 · YEOUIDO"}</strong>
            <p>{node.title}</p>
          </div>

          <ResidentFile
            profile={profile}
            tier={tier}
            state={snapshot.state}
            progress={progress}
            alertLevel={alertLevel}
            compact
          />

          <nav className="story-nav__tabs" aria-label="스토리 탭">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`story-tab ${activeTab === tab.id ? "story-tab--active" : ""}`.trim()}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="story-nav__footer">
            <button type="button" className="cta cta--olive" onClick={handleRestart}>
              새 기록 시작
            </button>
          </div>
          </aside>
        ) : null}

        <section className="story-main">
          {!isEnding ? <StatusHud state={snapshot.state} tier={tier} alertLevel={alertLevel} /> : null}

          {activeTab === "journal" ? (
            isEnding ? (
              <section className={`ending-stage ending-stage--${ending?.code ?? "clear"}`.trim()}>
                <div className="ending-stage__hero">
                  <div className="ending-stage__visual">
                    {asset.src ? <img src={asset.src} alt={asset.alt} /> : null}
                    <div className="ending-stage__visual-label">
                      <span>{node.id.toUpperCase()}</span>
                      <strong>{ending?.code.toUpperCase()}</strong>
                    </div>
                  </div>
                  <div className="ending-stage__narrative">
                    <span className="panel__eyebrow">Final Judgment</span>
                    {endingMeta ? (
                      <div className="ending-stage__status">
                        <strong>{endingMeta.label}</strong>
                        <span>{endingMeta.verdict}</span>
                      </div>
                    ) : null}
                    <h1>{ending?.headline}</h1>
                    {renderedBody.map((paragraph, index) => (
                      <p key={`${node.id}-${index}`}>{paragraph}</p>
                    ))}
                    <div className="ending-stage__note">
                      <span>재도전 기준</span>
                      <strong>
                        {ending?.code === "clear"
                          ? "소음 3 이하, 보급 5 이상"
                          : ending?.code === "debt"
                            ? "보급 5 이상, 공제 루트 회피"
                          : "목격담 축적과 접촉 흔적 최소화"}
                      </strong>
                    </div>
                    {endingMeta ? (
                      <div className="ending-stage__archive">
                        <span>다음 회차 방향</span>
                        <p>{endingMeta.cue}</p>
                      </div>
                    ) : null}
                    <div className="ending-stage__actions">
                      {nextStory ? (
                        <Link
                          className="cta cta--primary"
                          to={`${nextStory.routeBase}/${nextStory.startNodeId}`}
                        >
                          스토리 2 시작
                        </Link>
                      ) : null}
                      <button type="button" className="cta cta--secondary" onClick={handleRestart}>
                        다시 기록
                      </button>
                      <Link className="cta cta--secondary" to="/">
                        홈으로
                      </Link>
                    </div>
                  </div>
                </div>
                {ending ? (
                  <EndingReport ending={ending} state={snapshot.state} onRestart={handleRestart} />
                ) : null}
              </section>
            ) : (
              <article className="journal-panel">
                <div className="journal-panel__header">
                  <div>
                    <span className="panel__eyebrow">Situation Report</span>
                    <h1>{node.title}</h1>
                    <p>{asset.mood}</p>
                  </div>
                  {asset.src ? (
                    <div className="journal-panel__photo">
                      <img src={asset.src} alt={asset.alt} />
                      <span>{node.id.toUpperCase()}</span>
                    </div>
                  ) : null}
                </div>

                <div className="journal-sheet">
                  <div className="journal-sheet__meta">
                    <span>{profile.dossierId}</span>
                    <span>{tier}</span>
                    <span>{alertLevel}</span>
                  </div>
                  <div className="journal-sheet__body">
                    {renderedBody.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div className="choice-grid">
                  {node.choices.map((choice) => (
                    <ChoiceCard
                      key={`${node.id}-${choice.label}`}
                      choice={{
                        ...choice,
                        label: renderProfileText(choice.label, profile),
                        hint: choice.hint
                          ? renderProfileText(choice.hint, profile)
                          : choice.hint,
                      }}
                      state={snapshot.state}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </article>
            )
          ) : null}

          {activeTab === "inventory" && !isEnding ? (
            <InventoryPanel items={inventory} state={snapshot.state} alertLevel={alertLevel} />
          ) : null}

          {activeTab === "dossier" && !isEnding ? (
            <section className="panel panel--dossier">
              <div className="panel__header">
                <div>
                  <span className="panel__eyebrow">Resident File</span>
                  <h2>거주 파일과 배치 조건</h2>
                </div>
                <p>사람을 설명하는 대신 배치 가능한지부터 판단하는 문서.</p>
              </div>

              <ResidentFile
                profile={profile}
                tier={tier}
                state={snapshot.state}
                progress={progress}
                alertLevel={alertLevel}
              />

              <div className="dossier-grid">
                <article className="dossier-note">
                  <strong>현재 장면</strong>
                  <p>{node.title}</p>
                </article>
                <article className="dossier-note">
                  <strong>행정 상태</strong>
                  <p>{tier}</p>
                </article>
                <article className="dossier-note">
                  <strong>복귀 리스크</strong>
                  <p>{alertLevel}</p>
                </article>
                <article className="dossier-note">
                  <strong>세계관 규칙</strong>
                  <p>질서는 보호보다 배제를 더 효율적으로 수행한다.</p>
                </article>
              </div>
            </section>
          ) : null}

          {activeTab === "signals" && !isEnding ? <SignalPanel entries={signals} /> : null}
        </section>

        {!isEnding ? (
          <aside className="story-rail">
          <VisualPanel asset={asset} />
          <RunLog entries={snapshot.timeline} />
          <AdDock context="story" />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
