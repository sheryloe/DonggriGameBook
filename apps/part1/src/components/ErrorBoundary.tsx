import React, { Component, ErrorInfo, ReactNode } from "react";

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
    error: null
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
            <h1 className="glitch-text" data-text="SYSTEM_CORRUPTION" style={{ fontFamily: "var(--heading-font)" }}>SYSTEM_CORRUPTION</h1>
            <p style={{ marginTop: "20px", fontFamily: "var(--mono-family)", fontSize: "0.8rem" }}>
              AN UNEXPECTED LOGIC ERROR HAS HALTED THE INTERFACE.
            </p>
            <div style={{ marginTop: "12px", padding: "10px", background: "rgba(0,0,0,0.3)", fontSize: "0.7rem", fontFamily: "var(--mono-family)", opacity: 0.7 }}>
              {this.state.error?.message}
            </div>
            <button 
              className="primary-action tactical-frame" 
              onClick={() => window.location.reload()} 
              style={{ marginTop: "40px", width: "100%" }}
            >
              RELOAD_ARCHIVE
            </button>
          </section>
        </main>
      );
    }

    return this.children;
  }
}
