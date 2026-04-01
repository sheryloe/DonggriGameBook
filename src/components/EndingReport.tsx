import { EndingSummary, StoryState } from "../types/story";

interface EndingReportProps {
  ending: EndingSummary;
  state: StoryState;
  onRestart?: () => void;
}

function getReplaySteps(code: EndingSummary["code"]) {
  switch (code) {
    case "clear":
      return [
        "소음을 3 이하로 유지하면 승인 기록이 가장 깨끗하다.",
        "contact 단계에서 정보 교환보다 정숙 이동을 택해 보라.",
        "다음 회차에서는 더 높은 배급을 노릴 수 있다.",
      ];
    case "debt":
      return [
        "보급을 5 이상 확보하면 공제 태그를 벗기기 쉽다.",
        "bridge-lock와 north-queue에서 우회 대신 정렬을 택해 보라.",
        "거래보다 귀환 기록을 깨끗하게 만드는 편이 유리하다.",
      ];
    case "quarantine":
      return [
        "북문 직전의 소음을 먼저 낮춰야 한다.",
        "재입장 금지 출입증보다 목격담 누적을 줄이는 편이 중요하다.",
        "직선 루트보다 공지와 순번을 따라가는 편이 낫다.",
      ];
  }

  return [];
}

function getOutcomeCopy(code: EndingSummary["code"]) {
  switch (code) {
    case "clear":
      return {
        badge: "정식 승인",
        title: "통과 기록",
        summary: "정식 임무 자격을 확보했다. 기록은 깨끗하지만, 다음 배치는 더 빠르고 더 위험하다.",
        note: "승인 인장은 살아남았다는 뜻이 아니라, 다음 의무를 받아들일 수 있다는 뜻이다.",
      };
    case "debt":
      return {
        badge: "조건부 승인",
        title: "공제 기록",
        summary: "살아 돌아왔지만 배급과 우선순위 일부를 공제당했다. 통과는 했으나 대가는 남았다.",
        note: "공제 태그는 다음 회차의 선택지와 대기열을 조용히 바꿔 놓는다.",
      };
    case "quarantine":
      return {
        badge: "격리 보류",
        title: "차단 기록",
        summary: "접촉 흔적이 남아 문이 닫혔다. 살아 있어도 당장은 질서 바깥에 묶인다.",
        note: "격리 판정은 실패가 아니라 분리다. 다음 회차는 흔적부터 지워야 한다.",
      };
  }
}

export function EndingReport({ ending, state, onRestart }: EndingReportProps) {
  const replaySteps = getReplaySteps(ending.code);
  const outcome = getOutcomeCopy(ending.code);

  return (
    <section className={`ending-report ending-report--${ending.code}`.trim()} aria-labelledby="ending-report-title">
      <div className="ending-report__header">
        <span className="eyebrow">Final Judgment</span>
        <h2 id="ending-report-title">{ending.headline}</h2>
      </div>
      <div className="ending-report__verdict">
        <span className="ending-report__verdict-label">판정</span>
        <strong>{outcome.badge}</strong>
        <p>{outcome.summary}</p>
      </div>
      <div className="ending-report__seal">
        <strong>{ending.code.toUpperCase()}</strong>
        <span>{outcome.title}</span>
      </div>
      <p>{ending.debrief}</p>
      <p className="ending-report__note">{outcome.note}</p>
      <dl className="ending-report__stats">
        <div>
          <dt>최종 보급</dt>
          <dd>{state.supplies}</dd>
        </div>
        <div>
          <dt>최종 소음</dt>
          <dd>{state.noise}</dd>
        </div>
      </dl>
      <ul className="ending-report__tags">
        {ending.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <div className="ending-report__replay">
        <strong>재플레이 지시</strong>
        <ul>
          {replaySteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
      <p className="ending-report__recommendation">{ending.recommendation}</p>
      {onRestart ? (
        <button type="button" className="ending-report__restart" onClick={onRestart}>
          다른 판정으로 다시 기록
        </button>
      ) : null}
    </section>
  );
}
