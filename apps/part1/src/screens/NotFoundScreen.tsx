import React from "react";

export const NotFoundScreen: React.FC = () => {
  return (
    <main className="screen-container screen-center" style={{ background: "#050708" }}>
      <div className="scanline-overlay" style={{ background: "rgba(227, 75, 75, 0.05)" }} />
      <section className="tactical-frame warning-pulse" style={{ padding: "60px", border: "none", textAlign: "center", background: "rgba(5, 7, 8, 0.9)" }}>
        <header>
          <p className="eyebrow glitch-text" data-text="오류 코드: 404">오류 코드: 404</p>
          <h1 className="glitch-text" data-text="구역을 찾을 수 없습니다" style={{ fontFamily: "var(--heading-font)", fontSize: "3rem", color: "var(--primary-color)" }}>구역을 찾을 수 없습니다</h1>
        </header>
        <div style={{ marginTop: "24px", color: "var(--text-muted)", fontFamily: "var(--mono-family)", fontSize: "0.9rem", maxWidth: "400px" }}>
          요청한 좌표가 현재 작전 기록에 없습니다. 신호가 끊겼습니다.
        </div>
        <button
          className="primary-action tactical-frame"
          onClick={() => window.location.href = "/"}
          style={{ marginTop: "40px", width: "100%" }}
        >
          시작 지점으로 돌아가기
        </button>
      </section>
    </main>
  );
};
