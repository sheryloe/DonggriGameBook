import React from "react";
import { PART_CONTENT_BUNDLES } from "../../game-content-core/src";
import { listChaptersForPart, type PartId } from "../../world-registry/src";

interface PartSkeletonAppProps {
  partId: PartId;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  padding: "48px 24px",
  background:
    "radial-gradient(circle at top, rgba(139,0,0,0.22), transparent 38%), linear-gradient(180deg, #111 0%, #050505 100%)",
  color: "#f2eee7",
  fontFamily: "'Segoe UI', sans-serif"
};

const panelStyle: React.CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: 28,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(14, 14, 14, 0.88)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.34)"
};

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  marginRight: 8,
  marginBottom: 8,
  padding: "6px 10px",
  border: "1px solid rgba(255,255,255,0.18)",
  backgroundColor: "rgba(255,255,255,0.06)",
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase"
};

export function PartSkeletonApp({ partId }: PartSkeletonAppProps) {
  const bundle = PART_CONTENT_BUNDLES[partId];
  const chapters = listChaptersForPart(partId);

  return (
    <main style={pageStyle}>
      <section style={panelStyle}>
        <div style={{ marginBottom: 20 }}>
          <span style={chipStyle}>{bundle.app_id}</span>
          <span style={chipStyle}>{bundle.status}</span>
        </div>
        <h1 style={{ marginTop: 0, fontSize: 42 }}>{partId} Skeleton</h1>
        <p style={{ maxWidth: 760, lineHeight: 1.7, color: "#ddd2c3" }}>{bundle.note}</p>

        <h2 style={{ marginTop: 36 }}>Target Chapters</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {chapters.map((chapter) => (
            <article
              key={chapter.chapter_id}
              style={{
                padding: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.03)"
              }}
            >
              <strong>
                {chapter.chapter_id} / {chapter.title}
              </strong>
              <div style={{ marginTop: 8, color: "#cbbca7" }}>{chapter.synopsis_doc_path}</div>
            </article>
          ))}
        </div>

        <h2 style={{ marginTop: 36 }}>Required Docs</h2>
        <ul style={{ lineHeight: 1.8, color: "#ddd2c3" }}>
          {bundle.docs.map((docPath) => (
            <li key={docPath}>{docPath}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
