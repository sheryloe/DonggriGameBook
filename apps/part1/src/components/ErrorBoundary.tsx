import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="screen-container screen-center" style={{ background: "#050708", color: "#e34b4b" }}>
          <div className="scanline-overlay" />
          <section className="tactical-frame" style={{ padding: "40px", border: "none", background: "rgba(227, 75, 75, 0.05)" }}>
            <h1 className="glitch-text" data-text="작전 오류" style={{ fontFamily: "var(--heading-font)" }}>작전 오류</h1>
            <p style={{ marginTop: "20px", fontFamily: "var(--mono-family)", fontSize: "0.9rem", lineHeight: 1.7 }}>
              현장 기록을 표시하는 중 문제가 발생했습니다. 화면을 새로고침한 뒤 다시 진입하세요.
            </p>
            <div style={{ marginTop: "12px", padding: "10px", background: "rgba(0,0,0,0.3)", fontSize: "0.75rem", fontFamily: "var(--mono-family)", opacity: 0.7 }}>
              {this.state.error?.message}
            </div>
            <button
              className="primary-action tactical-frame"
              onClick={() => window.location.reload()}
              style={{ marginTop: "40px", width: "100%" }}
            >
              다시 불러오기
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
