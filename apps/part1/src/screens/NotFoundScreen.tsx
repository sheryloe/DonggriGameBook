import React from "react";

export const NotFoundScreen: React.FC = () => {
  return (
    <main className="screen-container screen-center" style={{ background: "#050708" }}>
      <div className="scanline-overlay" style={{ background: "rgba(227, 75, 75, 0.05)" }} />
      <section className="tactical-frame warning-pulse" style={{ padding: "60px", border: "none", textAlign: "center", background: "rgba(5, 7, 8, 0.9)" }}>
        <header>
          <p className="eyebrow glitch-text" data-text="ERROR_CODE: 404">ERROR_CODE: 404</p>
          <h1 className="glitch-text" data-text="SECTOR_NOT_FOUND" style={{ fontFamily: "var(--heading-font)", fontSize: "3rem", color: "var(--primary-color)" }}>SECTOR_NOT_FOUND</h1>
        </header>
        <div style={{ marginTop: "24px", color: "var(--text-muted)", fontFamily: "var(--mono-family)", fontSize: "0.9rem", maxWidth: "400px" }}>
          THE REQUESTED COORDINATES DO NOT EXIST IN THE CURRENT ARCHIVE. SIGNAL LOST.
        </div>
        <button 
          className="primary-action tactical-frame" 
          onClick={() => window.location.href = "/"} 
          style={{ marginTop: "40px", width: "100%" }}
        >
          RETURN_TO_BASE
        </button>
      </section>
    </main>
  );
};
