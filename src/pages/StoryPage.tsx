import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ChoiceCard from "../components/ChoiceCard";
import StatusHud from "../components/StatusHud";
import VisualPanel from "../components/VisualPanel";
import { useStoryRun } from "../lib/useStoryRun";

export default function StoryPage() {
  const { storyId, nodeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const run = useStoryRun(storyId, nodeId);

  useEffect(() => {
    if (!storyId || !run.currentNode) {
      return;
    }

    const expectedPath = `/story/${storyId}/${run.currentNode.id}`;
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [location.pathname, navigate, run.currentNode, storyId]);

  if (!run.ready) {
    return (
      <main className="page page-story">
        <section className="story-shell scene-enter">
          <p>스토리 로딩 중...</p>
        </section>
      </main>
    );
  }

  if (!run.definition || !run.currentNode) {
    return (
      <main className="page page-story">
        <section className="story-shell scene-enter">
          <h1>스토리를 찾을 수 없습니다</h1>
          <p>요청한 storyId가 존재하지 않습니다.</p>
          <Link className="action-link" to="/">
            랜딩으로 돌아가기
          </Link>
        </section>
      </main>
    );
  }

  const handleChoice = (choiceId: string) => {
    const nextNodeId = run.choose(choiceId);
    if (nextNodeId && storyId) {
      navigate(`/story/${storyId}/${nextNodeId}`);
    }
  };

  return (
    <main className="page page-story">
      <section className="story-shell">
        <header className="story-header">
          <p className="eyebrow">{run.definition.title}</p>
          <Link className="action-link ghost" to="/">
            랜딩 이동
          </Link>
        </header>

        <StatusHud supplies={run.state.supplies} noise={run.state.noise} />

        <VisualPanel
          key={run.currentNode.id}
          title={run.currentNode.title}
          description={run.currentNode.description}
          asset={run.currentNode.asset}
        />

        {run.currentNode.ending ? (
          <article className={`ending-box ending-${run.currentNode.ending.outcome}`}>
            <h3>{run.currentNode.ending.title}</h3>
            <p>{run.currentNode.ending.body}</p>
          </article>
        ) : null}

        <section className="choice-list" aria-label="available choices">
          {run.choices.map((choice, index) => (
            <ChoiceCard
              key={choice.id}
              index={index}
              label={choice.label}
              onSelect={() => handleChoice(choice.id)}
            />
          ))}
        </section>

        <button type="button" className="action-link reset" onClick={run.reset}>
          현재 스토리 초기화
        </button>
      </section>
    </main>
  );
}
