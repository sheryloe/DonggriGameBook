import fs from "node:fs/promises";
import path from "node:path";

import {
  PART_PRESENTATION_PACKAGES,
  PRESENTATION_PARTS,
  PRESENTATION_PROMPT_VERSION
} from "./presentation-package-data.mjs";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "world", "presentation");

const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const writeText = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${value.trim()}\n`, "utf8");
};

function markdownTable(rows) {
  const [header, ...body] = rows;
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function buildPartPackageDoc(part) {
  const chapterRows = [["Chapter", "Target Minutes", "Beat"]];
  for (const chapter of part.chapter_targets) {
    chapterRows.push([chapter.chapter_id, String(chapter.minutes), chapter.beat]);
  }

  const endingRows = [["Ending ID", "Label", "Summary"]];
  for (const ending of part.endings) {
    endingRows.push([ending.ending_id, ending.title_ko, ending.summary]);
  }

  const posterRows = [["Poster ID", "Category", "Target Path"]];
  for (const poster of part.posters) {
    posterRows.push([poster.poster_id, poster.category, poster.target_path]);
  }

  return `# ${part.title_ko}

## Summary
- Part ID: ${part.part_id}
- English Title: ${part.title}
- Playtime Target: ${part.playtime_target_minutes} minutes
- Hook: ${part.hook}

## Chapter Targets
${markdownTable(chapterRows)}

## Ending Package
${markdownTable(endingRows)}

## Trailer
- Video ID: ${part.trailer.video_id}
- Duration: ${part.trailer.duration}s
- Source Art Key: ${part.trailer.source_art_key}

## Poster Package
${markdownTable(posterRows)}

## Demo Route
${part.demo_route.map((item) => `- ${item}`).join("\n")}
`;
}

function buildOverviewDoc(parts) {
  const rows = [["Part", "Playtime", "Openings", "Endings", "Trailer", "Posters"]];
  for (const part of parts) {
    rows.push([
      part.part_id,
      `${part.playtime_target_minutes}m`,
      String(part.chapter_targets.length),
      String(part.endings.length),
      "1",
      String(part.posters.length)
    ]);
  }

  return `# Part 2-4 Presentation Package

## Scope
- Repo-native presentation package for Part 2-4 only.
- Covers prompt pipeline expansion for openings, endings, trailers, and posters.
- Provides a slide-deck artifact in Markdown and self-contained HTML.

## Inventory
${markdownTable(rows)}

## Generation
\`\`\`powershell
Set-Location D:\\Donggri_Platform\\DonggrolGameBook
node scripts/generate-asset-prompt-pack.mjs
node scripts/generate-presentation-deck.mjs
\`\`\`

## Outputs
- docs/world/presentation/PRESENTATION_SUMMARY.md
- docs/world/presentation/KEYART_SELECTION.md
- docs/world/presentation/PROMPT_BUNDLE_INDEX.md
- docs/world/presentation/PLAYTIME_ENDINGS_BRANCHING_SLIDES.md
- docs/world/presentation/DEMO_CHECKLIST.md
- docs/world/presentation/PARTS_2_4_SHOWCASE_DECK.html
`;
}

function buildKeyartDoc(parts) {
  return `# Key Art Selection

${parts
  .map(
    (part) => `## ${part.part_id}

${part.posters
  .map((poster) => `- \`${poster.poster_id}\` / ${poster.category} / target: \`${poster.target_path}\``)
  .join("\n")}
`
  )
  .join("\n")}`;
}

function buildPromptIndexDoc(parts) {
  return `# Prompt Bundle Index

${parts
  .map(
    (part) => `## ${part.part_id}
- Openings: ${part.chapter_targets.length}
- Endings: ${part.endings.length}
- Trailer: 1
- Posters: ${part.posters.length}
- Video prompt folder: \`docs/asset-prompt-pack/part${part.part_id.slice(1)}-video-prompts/\`
- Poster prompt folder: \`docs/asset-prompt-pack/part${part.part_id.slice(1)}-poster-prompts/\`
`
  )
  .join("\n")}`;
}

function buildSlidesSourceDoc(parts) {
  const sections = [
    "# Playtime / Endings / Branching Slides",
    "",
    "## Slide 01 - Title",
    "- Donggri Part 2-4 Showcase",
    "- Prompt pipeline + presentation package"
  ];

  for (const part of parts) {
    sections.push(
      "",
      `## ${part.part_id} - Overview`,
      `- Target playtime: ${part.playtime_target_minutes} minutes`,
      ...part.chapter_targets.map((chapter) => `- ${chapter.chapter_id}: ${chapter.minutes}m / ${chapter.beat}`),
      "",
      `## ${part.part_id} - Endings`,
      ...part.endings.map((ending) => `- ${ending.title_ko} (\`${ending.ending_id}\`): ${ending.summary}`)
    );
  }

  sections.push(
    "",
    "## Final Slide - Delivery",
    "- Cinematic manifests generated",
    "- Poster manifests generated",
    "- Presentation docs generated",
    "- HTML deck generated"
  );

  return sections.join("\n");
}

function buildDemoChecklist(parts) {
  return `# Demo Checklist

- [ ] 발표 요약 문서 검토
- [ ] 키아트 셀렉션 타이틀 확인
- [ ] 프롬프트 번들 인덱스 확인
- [ ] 슬라이드 소스와 HTML 덱 동기화 확인
- [ ] P2/P3/P4 트레일러 ID 확인
- [ ] 각 파트 엔딩 수 확인

${parts
  .map(
    (part) => `## ${part.part_id}
${part.demo_route.map((item) => `- [ ] ${item}`).join("\n")}
`
  )
  .join("\n")}`;
}

function buildDeckHtml(parts) {
  const overviewCards = parts
    .map(
      (part) => `
        <article class="panel">
          <div class="eyebrow">${part.part_id}</div>
          <h2>${part.title_ko}</h2>
          <p>${part.hook}</p>
          <ul>
            ${part.chapter_targets.map((chapter) => `<li><strong>${chapter.chapter_id}</strong> ${chapter.minutes}m - ${chapter.beat}</li>`).join("")}
          </ul>
        </article>
      `
    )
    .join("");

  const endingSlides = parts
    .map(
      (part) => `
        <section class="slide">
          <div class="eyebrow">${part.part_id} Endings</div>
          <h1>${part.title_ko}</h1>
          <div class="grid two">
            ${part.endings
              .map(
                (ending) => `
                  <article class="panel">
                    <h2>${ending.title_ko}</h2>
                    <p class="muted">${ending.ending_id}</p>
                    <p>${ending.summary}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Donggri Part 2-4 Showcase Deck</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0f1418;
      --panel: rgba(22, 29, 35, 0.96);
      --line: rgba(255,255,255,0.12);
      --text: #f3ede3;
      --muted: #b4bdc6;
      --accent: #d59c62;
      --accent2: #9fc0de;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Malgun Gothic", sans-serif;
      background:
        radial-gradient(circle at top, rgba(213,156,98,0.18), transparent 24%),
        linear-gradient(180deg, #0b1014 0%, #151d24 52%, #091015 100%);
      color: var(--text);
    }
    main {
      width: min(1280px, 100%);
      margin: 0 auto;
      padding: 28px 20px 56px;
      display: grid;
      gap: 24px;
    }
    .slide {
      min-height: 720px;
      padding: 40px;
      border-radius: 28px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(22,29,35,0.96), rgba(12,17,22,0.98));
      box-shadow: 0 18px 56px rgba(0,0,0,0.28);
      page-break-after: always;
    }
    .eyebrow {
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 13px;
      margin-bottom: 12px;
    }
    h1, h2, p, ul { margin: 0; }
    h1 { font-size: 48px; margin-bottom: 16px; }
    h2 { font-size: 28px; margin-bottom: 12px; }
    p { font-size: 18px; line-height: 1.5; }
    p.muted { color: var(--muted); margin-bottom: 8px; }
    ul {
      margin-top: 16px;
      padding-left: 20px;
      display: grid;
      gap: 8px;
    }
    .grid {
      display: grid;
      gap: 16px;
      margin-top: 20px;
    }
    .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .panel {
      border-radius: 20px;
      border: 1px solid var(--line);
      padding: 18px;
      background: rgba(255,255,255,0.03);
    }
    strong { color: var(--accent2); }
    @media (max-width: 900px) {
      .slide { min-height: unset; padding: 28px 20px; }
      .grid.two, .grid.three { grid-template-columns: 1fr; }
      h1 { font-size: 36px; }
      h2 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <main>
    <section class="slide">
      <div class="eyebrow">Donggri Platform</div>
      <h1>Part 2-4 Showcase Deck</h1>
      <p>Prompt pipeline expansion for openings, endings, trailers, and posters. Repo-native presentation package only.</p>
      <div class="grid three">
        ${overviewCards}
      </div>
    </section>
    ${endingSlides}
    <section class="slide">
      <div class="eyebrow">Delivery</div>
      <h1>Presentation Package Outputs</h1>
      <div class="grid two">
        <article class="panel">
          <h2>Docs</h2>
          <ul>
            <li>PRESENTATION_SUMMARY.md</li>
            <li>KEYART_SELECTION.md</li>
            <li>PROMPT_BUNDLE_INDEX.md</li>
            <li>PLAYTIME_ENDINGS_BRANCHING_SLIDES.md</li>
            <li>DEMO_CHECKLIST.md</li>
          </ul>
        </article>
        <article class="panel">
          <h2>Prompt Packs</h2>
          <ul>
            <li>P2 video/prompt manifests</li>
            <li>P3 video/prompt manifests</li>
            <li>P4 video/prompt manifests</li>
            <li>P2-P4 poster prompt manifests</li>
          </ul>
        </article>
      </div>
    </section>
  </main>
</body>
</html>`;
}

async function main() {
  const parts = PRESENTATION_PARTS.map((partId) => PART_PRESENTATION_PACKAGES[partId]);

  await writeText(path.join(OUT_DIR, "PRESENTATION_SUMMARY.md"), buildOverviewDoc(parts));
  await writeText(path.join(OUT_DIR, "KEYART_SELECTION.md"), buildKeyartDoc(parts));
  await writeText(path.join(OUT_DIR, "PROMPT_BUNDLE_INDEX.md"), buildPromptIndexDoc(parts));
  await writeText(path.join(OUT_DIR, "PLAYTIME_ENDINGS_BRANCHING_SLIDES.md"), buildSlidesSourceDoc(parts));
  await writeText(path.join(OUT_DIR, "DEMO_CHECKLIST.md"), buildDemoChecklist(parts));
  await writeText(path.join(OUT_DIR, "PARTS_2_4_SHOWCASE_DECK.html"), buildDeckHtml(parts));
  await writeJson(path.join(OUT_DIR, "PARTS_2_4_PRESENTATION_MANIFEST.json"), {
    version: PRESENTATION_PROMPT_VERSION,
    part_count: parts.length,
    documents: [
      "docs/world/presentation/PRESENTATION_SUMMARY.md",
      "docs/world/presentation/KEYART_SELECTION.md",
      "docs/world/presentation/PROMPT_BUNDLE_INDEX.md",
      "docs/world/presentation/PLAYTIME_ENDINGS_BRANCHING_SLIDES.md",
      "docs/world/presentation/DEMO_CHECKLIST.md",
      "docs/world/presentation/PARTS_2_4_SHOWCASE_DECK.html"
    ],
    parts: parts.map((part) => ({
      part_id: part.part_id,
      playtime_target_minutes: part.playtime_target_minutes,
      endings: part.endings.map((ending) => ending.ending_id),
      trailer: part.trailer.video_id,
      posters: part.posters.map((poster) => poster.poster_id)
    }))
  });

  console.log(`generated presentation package for ${parts.length} parts`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
