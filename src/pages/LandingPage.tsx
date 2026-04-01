import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="page page-landing">
      <section className="landing-card scene-enter">
        <p className="eyebrow">DonggrolGameBook</p>
        <h1>폐쇄 구역 조사 기록</h1>
        <p>
          Story 1과 Story 2는 같은 런타임 엔진을 공유합니다. 원하는 경로로 직접 진입해
          상태 변화를 확인하세요.
        </p>
        <div className="landing-actions">
          <Link className="action-link" to="/story/1/intake">
            Story 1 시작
          </Link>
          <Link className="action-link ghost" to="/story/2/dispatch">
            Story 2 시작
          </Link>
        </div>
      </section>
    </main>
  );
}
