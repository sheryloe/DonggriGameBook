import { useGameStore } from "../store/gameStore";
import ArtFrame from "../components/ArtFrame";

export default function ResultScreen() {
  const outcome = useGameStore((state) => state.runtime.chapter_outcome);
  const advanceToNextChapter = useGameStore((state) => state.advanceToNextChapter);

  if (!outcome) {
    return (
      <section className="screen-card">
        <p>결과 데이터가 준비되지 않았다.</p>
      </section>
    );
  }

  return (
    <section className="screen-card result-screen">
      <header className="section-head">
        <div>
          <span className="eyebrow">Result Summary</span>
          <h2>{outcome.title}</h2>
        </div>
      </header>
      <div className="split-layout">
        <ArtFrame
          assetKey={outcome.campaign_complete ? "campaign_complete" : `${outcome.chapter_id}_result`}
          chapterId={outcome.chapter_id}
          alt={outcome.title}
          caption={outcome.campaign_complete ? "Campaign Complete" : "Chapter Cleared"}
        />
        <article className="narrative-card">
          <p>{outcome.summary}</p>
          <p>{outcome.campaign_complete ? "CH05까지 완료했다. 다음 데이터가 없으므로 캠페인을 종료한다." : "다음 챕터 브리핑으로 이어진다."}</p>
          {!outcome.campaign_complete ? (
            <button className="primary-button" onClick={() => advanceToNextChapter()}>
              다음 챕터 진입
            </button>
          ) : null}
        </article>
      </div>
    </section>
  );
}
