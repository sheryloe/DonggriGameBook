import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroBackground from "../assets/hero-yeouido-background.svg";
import onboardingProcessing from "../assets/onboarding-processing.svg";
import rationLineCorridor from "../assets/ration-line-corridor.svg";
import { AdDock } from "../components/AdDock";
import {
  PLAYER_ROLES,
  PlayerRole,
  createPlayerProfile,
  readPlayerProfile,
  writePlayerProfile,
} from "../lib/playerProfile";
import { clearStoryRunMemory, readStoryRunMemory } from "../lib/storyStorage";
import { story1 } from "../data/story1";
import { story2 } from "../data/story2";
import { StoryDefinition } from "../types/story";

type LaunchMode = "idle" | "register" | "processing";
type StoryLaunchId = "story-01" | "story-02";

type LaunchStep = {
  code: string;
  label: string;
};

type StoryLaunchConfig = {
  id: StoryLaunchId;
  story: StoryDefinition;
  badge: string;
  title: string;
  summary: string;
  detail: string;
  heroTitle: string;
  heroCopy: string;
  heroVisual: string;
  heroAlt: string;
  meta: [string, string, string];
  metrics: Array<{ label: string; value: string; note: string }>;
  processingTitle: string;
  processingLead: (name: string) => string;
  processingSteps: LaunchStep[];
  launchLabel: string;
  resumeLabel: string;
  resetLabel: string;
  stripLabel: string;
};

const storyLaunches: StoryLaunchConfig[] = [
  {
    id: story1.id as StoryLaunchId,
    story: story1,
    badge: "STORY 01",
    title: "여의도 안전지대",
    summary: "임시 체류자 등록과 열감지 처리로 시작하는 첫 입성 루트.",
    detail: "문서와 규칙 방송, 손등 스탬프가 먼저 움직이는 본편의 정식 입구다.",
    heroTitle: "입성 기록",
    heroCopy: "이름 입력에서 시작해 임시 코드, 손등 스탬프, 열감지 절차를 거쳐 본편으로 들어간다.",
    heroVisual: onboardingProcessing,
    heroAlt: "입성 등록 및 열감지 처리 도식",
    meta: ["DAY 01", "W-03", "N-01"],
    metrics: [
      { label: "검문 승인율", value: "61%", note: "북문 N-01 기준 직전 24시간" },
      { label: "외곽 통행 제한", value: "T-AMBER", note: "한강 제방 경보등 가동 중" },
      { label: "현재 기준 인물", value: "미등록", note: "신규 입성자 등록 필요" },
    ],
    processingTitle: "입성 절차 진행 중",
    processingLead: (name) => `${name}의 기록을 여의도 규칙에 맞춰 정렬하고 있다.`,
    processingSteps: [
      { code: "01", label: "이름 대조" },
      { code: "02", label: "임시 코드 발급" },
      { code: "03", label: "손등 스탬프 등록" },
      { code: "04", label: "열감지 스캔" },
      { code: "05", label: "규칙 방송 수신" },
      { code: "06", label: "임시 체류자 등록" },
    ],
    launchLabel: "입성 절차 시작",
    resumeLabel: "이전 기록 이어하기",
    resetLabel: "선택 기록 초기화",
    stripLabel: "선택 스토리",
  },
  {
    id: story2.id as StoryLaunchId,
    story: story2,
    badge: "STORY 02",
    title: "여의도 외곽 보급 루트",
    summary: "배차, 제방, 검문선이 얽힌 더 빠른 외곽 진입 루트.",
    detail: "한 박자 앞서 나가는 보급선 중심의 시작점이다.",
    heroTitle: "보급 진입",
    heroCopy: "배차 확인, 상차 기록, 검문선 통과를 거쳐 외곽 루트로 곧바로 진입한다.",
    heroVisual: rationLineCorridor,
    heroAlt: "배급 줄과 협소한 내부 복도 도식",
    meta: ["DAY 02", "OUTER", "B-07"],
    metrics: [
      { label: "보급선 가동", value: "79%", note: "중계창고 2개소 회전 중" },
      { label: "검문 대기열", value: "18m", note: "야간 배차 직전 혼잡" },
      { label: "현재 기준 인물", value: "미등록", note: "외곽 루트 편입 대기" },
    ],
    processingTitle: "외곽 루트 배차 중",
    processingLead: (name) => `${name}의 기록을 외곽 루트 기준으로 재정렬하고 있다.`,
    processingSteps: [
      { code: "01", label: "루트 배정" },
      { code: "02", label: "배차 확인" },
      { code: "03", label: "보급 단위 등록" },
      { code: "04", label: "검문선 통과" },
      { code: "05", label: "외곽 진입" },
    ],
    launchLabel: "외곽 루트 시작",
    resumeLabel: "보급 이어하기",
    resetLabel: "선택 기록 초기화",
    stripLabel: "직접 시작",
  },
];

const storyLaunchById = Object.fromEntries(
  storyLaunches.map((launch) => [launch.id, launch]),
) as Record<StoryLaunchId, StoryLaunchConfig>;

export function LandingPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => readPlayerProfile());
  const [runMemoryByStory, setRunMemoryByStory] = useState<Record<StoryLaunchId, ReturnType<typeof readStoryRunMemory>>>(
    () =>
      ({
      [story1.id as StoryLaunchId]: readStoryRunMemory(story1.id),
      [story2.id as StoryLaunchId]: readStoryRunMemory(story2.id),
      } as Record<StoryLaunchId, ReturnType<typeof readStoryRunMemory>>),
  );
  const [launchMode, setLaunchMode] = useState<LaunchMode>("idle");
  const [name, setName] = useState(profile?.name ?? "");
  const [role, setRole] = useState<PlayerRole>(profile?.role ?? PLAYER_ROLES[0]);
  const [processingStep, setProcessingStep] = useState(0);
  const [processingStoryId, setProcessingStoryId] = useState<StoryLaunchId | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<StoryLaunchId>(() =>
    runMemoryByStory[story1.id as StoryLaunchId]
      ? (story1.id as StoryLaunchId)
      : runMemoryByStory[story2.id as StoryLaunchId]
        ? (story2.id as StoryLaunchId)
        : (story1.id as StoryLaunchId),
  );

  const selectedStory = storyLaunchById[selectedStoryId];
  const selectedMemory = runMemoryByStory[selectedStoryId];
  const selectedResumeNodeId =
    selectedMemory?.currentNodeId && selectedStory.story.nodes[selectedMemory.currentNodeId]
      ? selectedMemory.currentNodeId
      : selectedStory.story.startNodeId;
  const selectedProcessingStory = storyLaunchById[processingStoryId ?? selectedStoryId];
  const selectedProcessingSteps = selectedProcessingStory.processingSteps;
  const selectedProcessingLabel = selectedProcessingStory.processingTitle;
  const selectedProcessingLead = selectedProcessingStory.processingLead(profile?.name || name || "신규 입성자");
  const selectedProcessingName = profile?.name || name || "신규 입성자";
  const selectedHasResume = Boolean(selectedMemory);

  useEffect(() => {
    if (launchMode !== "processing") {
      return;
    }

    if (processingStep >= selectedProcessingSteps.length) {
      const targetStory = selectedProcessingStory.story;
      setLaunchMode("idle");
      setProcessingStoryId(null);
      setProcessingStep(0);
      navigate(`${targetStory.routeBase}/${targetStory.startNodeId}`);
      return;
    }

    const timer = window.setTimeout(() => {
      setProcessingStep((current) => current + 1);
    }, 540);

    return () => {
      window.clearTimeout(timer);
    };
  }, [launchMode, navigate, processingStep, selectedProcessingStory, selectedProcessingSteps.length]);

  const beginProcessing = () => {
    const nextProfile = createPlayerProfile(name, role);
    writePlayerProfile(nextProfile);
    clearStoryRunMemory(selectedStory.story.id);
    setProfile(nextProfile);
    setRunMemoryByStory((current) => ({
      ...current,
      [selectedStory.story.id as StoryLaunchId]: null,
    }));
    setProcessingStep(0);
    setProcessingStoryId(selectedStory.id);
    setLaunchMode("processing");
  };

  const handleContinue = () => {
    navigate(`${selectedStory.story.routeBase}/${selectedResumeNodeId}`);
  };

  const handleReset = () => {
    clearStoryRunMemory(selectedStory.story.id);
    setRunMemoryByStory((current) => ({
      ...current,
      [selectedStory.story.id as StoryLaunchId]: null,
    }));
    setLaunchMode("register");
    setProcessingStoryId(null);
    setProcessingStep(0);
  };

  const startStory = (storyId: StoryLaunchId) => {
    setSelectedStoryId(storyId);
    setLaunchMode("register");
  };

  return (
    <main className="landing-screen">
      <div className="landing-screen__backdrop" aria-hidden="true">
        <img src={heroBackground} alt="" />
      </div>

      <header className="topbar">
        <div className="topbar__brand">DONGGRI WORLD</div>
        <nav className="topbar__nav" aria-label="랜딩 내비게이션">
          <button type="button" onClick={() => setLaunchMode("register")}>
            ENTRY
          </button>
          <button type="button" onClick={handleContinue} disabled={!selectedHasResume}>
            RESUME
          </button>
          <button type="button" onClick={handleReset}>
            RESET
          </button>
          <a
            href="https://nakwon.nexon.com/en/teaser"
            target="_blank"
            rel="noreferrer"
          >
            LORE
          </a>
        </nav>
        <div className="topbar__meta">
          {selectedStory.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <span className="landing-hero__eyebrow">YEOUIDO RESIDENT DOSSIER</span>
          <h1>
            여의도
            <br />
            생존 기록
          </h1>
          <p className="landing-hero__tagline">
            이름이 등록된 첫 밤, 네 생존은 용기보다 문서와 소문과 복귀 판정에
            더 크게 좌우된다.
          </p>
          <div className="story-switcher" role="tablist" aria-label="스토리 선택">
            {storyLaunches.map((launch) => {
              const memory = runMemoryByStory[launch.id];
              const isActive = selectedStoryId === launch.id;

              return (
                <button
                  key={launch.id}
                  type="button"
                  className={`story-switcher__item ${isActive ? "story-switcher__item--active" : ""}`.trim()}
                  onClick={() => setSelectedStoryId(launch.id)}
                  aria-pressed={isActive}
                >
                  <span className="story-switcher__badge">{launch.badge}</span>
                  <strong>{launch.title}</strong>
                  <p>{launch.summary}</p>
                  <small>{memory ? "이어하기 가능" : "신규 진입 가능"}</small>
                </button>
              );
            })}
          </div>
          <div className="landing-hero__actions">
            <button type="button" className="cta cta--primary" onClick={() => setLaunchMode("register")}>
              {selectedStory.launchLabel}
            </button>
            {selectedHasResume ? (
              <button type="button" className="cta cta--secondary" onClick={handleContinue}>
                {selectedStory.resumeLabel}
              </button>
            ) : null}
            <button type="button" className="cta cta--secondary" onClick={handleReset}>
              {selectedStory.resetLabel}
            </button>
          </div>
        </div>

        <div className="landing-hero__panel">
          <article className="landing-status-card landing-status-card--selected">
            <span className="panel__eyebrow">{selectedStory.badge}</span>
            <h2>{selectedStory.heroTitle}</h2>
            <p>{selectedStory.heroCopy}</p>
            <div className="landing-status-card__footer">
              <strong>{selectedStory.detail}</strong>
              <span>{selectedHasResume ? "복귀 메모리 보관 중" : "신규 기록 대기 중"}</span>
            </div>
          </article>
          <div className="landing-data-row">
            {selectedStory.metrics.map((metric, index) => (
              <article key={`${selectedStory.id}-${metric.label}`} className="landing-metric-card">
                <span>{metric.label}</span>
                <strong>{index === 2 && profile ? profile.name : metric.value}</strong>
                <p>{index === 2 && profile ? profile.role : metric.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-strip">
        <article className={`landing-strip__card ${selectedStoryId === story1.id ? "landing-strip__card--active" : ""}`.trim()}>
          <div className="landing-strip__visual">
            <img src={storyLaunchById[story1.id as StoryLaunchId].heroVisual} alt={storyLaunchById[story1.id as StoryLaunchId].heroAlt} />
          </div>
          <span className="panel__eyebrow">{storyLaunchById[story1.id as StoryLaunchId].badge}</span>
          <h2>{storyLaunchById[story1.id as StoryLaunchId].title}</h2>
          <p>{storyLaunchById[story1.id as StoryLaunchId].summary}</p>
          <div className="landing-strip__actions">
            <button type="button" className="cta cta--secondary" onClick={() => startStory(story1.id as StoryLaunchId)}>
              {storyLaunchById[story1.id as StoryLaunchId].stripLabel}
            </button>
            <button type="button" className="cta cta--secondary" onClick={() => navigate(`${story1.routeBase}/${story1.startNodeId}`)}>
              직접 진입
            </button>
          </div>
        </article>
        <article className={`landing-strip__card ${selectedStoryId === story2.id ? "landing-strip__card--active" : ""}`.trim()}>
          <div className="landing-strip__visual">
            <img src={storyLaunchById[story2.id as StoryLaunchId].heroVisual} alt={storyLaunchById[story2.id as StoryLaunchId].heroAlt} />
          </div>
          <span className="panel__eyebrow">{storyLaunchById[story2.id as StoryLaunchId].badge}</span>
          <h2>{storyLaunchById[story2.id as StoryLaunchId].title}</h2>
          <p>{storyLaunchById[story2.id as StoryLaunchId].summary}</p>
          <div className="landing-strip__actions">
            <button type="button" className="cta cta--secondary" onClick={() => startStory(story2.id as StoryLaunchId)}>
              {storyLaunchById[story2.id as StoryLaunchId].stripLabel}
            </button>
            <button type="button" className="cta cta--secondary" onClick={() => navigate(`${story2.routeBase}/${story2.startNodeId}`)}>
              직접 진입
            </button>
          </div>
        </article>
        <article className="landing-strip__card">
          <span className="panel__eyebrow">Tone</span>
          <h2>{selectedStory.title}</h2>
          <p>
            {selectedStory.detail}
          </p>
        </article>
        <article className="landing-strip__card">
          <span className="panel__eyebrow">World Status</span>
          <h2>한국형 생존 관료주의</h2>
          <p>
            병목 공간, 관리실 문법, 배급 공제, 재입장 금지자 거래 같은 생활
            공간의 폭력으로 긴장을 만든다.
          </p>
          <Link className="cta cta--secondary" to={`${story1.routeBase}/${story1.startNodeId}`}>
            Story 1 직접 시작
          </Link>
        </article>
      </section>

      <AdDock context="landing" />

      {launchMode === "register" ? (
        <div className="launch-modal" role="dialog" aria-modal="true" aria-labelledby="launch-title">
          <div className="launch-modal__panel">
            <div className="launch-modal__header">
              <span className="panel__eyebrow">{selectedProcessingStory.badge}</span>
              <h2 id="launch-title">{selectedProcessingLabel}</h2>
              <p>{selectedProcessingLead}</p>
            </div>

            <div className="launch-modal__visual">
              <img src={selectedProcessingStory.heroVisual} alt={selectedProcessingStory.heroAlt} />
            </div>

            <label className="launch-field">
              <span>등록 이름</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 김동현"
                maxLength={12}
              />
            </label>

            <div className="launch-field">
              <span>이전 직무</span>
              <div className="role-grid">
                {PLAYER_ROLES.map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    className={`role-chip ${candidate === role ? "role-chip--active" : ""}`.trim()}
                    onClick={() => setRole(candidate)}
                  >
                    {candidate}
                  </button>
                ))}
              </div>
            </div>

            <div className="launch-modal__steps">
              {selectedProcessingSteps.map((step) => (
                <div key={step.code} className="launch-step">
                  <strong>{step.code}</strong>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>

            <div className="launch-modal__actions">
              <button type="button" className="cta cta--primary" onClick={beginProcessing}>
                {selectedProcessingStory.launchLabel}
              </button>
              <button type="button" className="cta cta--secondary" onClick={() => setLaunchMode("idle")}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {launchMode === "processing" ? (
        <div className="processing-screen" role="status" aria-live="polite">
          <div className="processing-screen__panel">
            <span className="panel__eyebrow">{selectedProcessingStory.badge}</span>
            <h2>{selectedProcessingLabel}</h2>
            <p>{selectedProcessingLead}</p>
            <div className="processing-screen__visual">
              <img src={selectedProcessingStory.heroVisual} alt={selectedProcessingStory.heroAlt} />
            </div>
            <div className="processing-screen__status">
              <strong>{selectedProcessingName}</strong>
              <span>{profile?.dossierId ?? "신규 등록 대기"}</span>
            </div>
            {profile ? (
              <div className="processing-screen__codes">
                <span>{profile.dossierId}</span>
                <span>{profile.wristband}</span>
                <span>{profile.callSign}</span>
              </div>
            ) : null}
            <div className="processing-bar" aria-hidden="true">
              <div
                className="processing-bar__fill"
                style={{
                  width: `${(processingStep / selectedProcessingSteps.length) * 100}%`,
                }}
              />
            </div>
            <ol className="processing-list">
              {selectedProcessingSteps.map((step, index) => (
                <li
                  key={step.code}
                  className={`processing-list__item ${
                    index < processingStep
                      ? "is-complete"
                      : index === processingStep
                        ? "is-current"
                        : ""
                  }`.trim()}
                >
                  <span>{step.code}</span>
                  <strong>{step.label}</strong>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </main>
  );
}
