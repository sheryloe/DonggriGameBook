import { promises as fs } from "node:fs";
import path from "node:path";
import {
  PRIVATE_PROMPTS_ANTIGRAVITY_ROOT,
  PRIVATE_PROMPTS_GEMINI_ROOT,
  REPO_ROOT,
  relFromRoot,
} from "./private-paths.mjs";

const chaptersRoot = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "chapters");
const outputRoot = path.join(PRIVATE_PROMPTS_GEMINI_ROOT, "boss-intro");

const partConfigs = {
  P1: {
    name: "Civic Archive Survival",
    summary: "broadcast ruin, archive anxiety, wet paper, civic survival bureaucracy, ash fallout",
    bpm: "88-96",
    instrumentation: [
      "sub drones",
      "shortwave hiss",
      "bowed metal",
      "low tom pulse",
      "broken tape flutter",
      "distant alarm tones",
    ],
    motion: [
      "start with environmental dread",
      "tighten into a low pulse",
      "mark the boss reveal with one distorted signal impact",
      "end unresolved for immediate combat handoff",
    ],
    avoid: [
      "heroic brass fanfare",
      "EDM drop",
      "clean cyberpunk synthwave",
      "uplifting major-key ending",
      "anime battle anthem",
      "vocals or chant lead",
    ],
  },
  P2: {
    name: "Southern Checkpoint Descent",
    summary: "civil pressure thriller, checkpoint pursuit, diesel smoke, forged route cards, crowd compression",
    bpm: "98-108",
    instrumentation: [
      "industrial kick pulse",
      "engine-like bass rhythm",
      "detuned synth brass",
      "metal barricade hits",
      "siren swells",
      "compressed air noise",
    ],
    motion: [
      "start with compressed route pressure",
      "build a forward chase rhythm",
      "drop one hard impact for the boss reveal",
      "lock into immediate pursuit energy without resolution",
    ],
    avoid: [
      "festival EDM",
      "clean orchestral fantasy",
      "trailer braam overload",
      "dance groove",
      "bright pop hook",
      "vocals or chant lead",
    ],
  },
  P3: {
    name: "Cold Quarantine Line",
    summary: "cold storage fog, exposed checkpoint logs, rescue versus concealment, delayed guilt, frozen quarantine dread",
    bpm: "72-84",
    instrumentation: [
      "frozen string pads",
      "low piano clusters",
      "glassy percussion",
      "distant sonar pulse",
      "wind-like filtered noise",
      "slow heavy drums",
    ],
    motion: [
      "open sparse and cold",
      "increase pressure through negative space",
      "reveal the boss with a frozen impact accent",
      "end with slow-burning threat still active",
    ],
    avoid: [
      "warm heroic lift",
      "dense action-rock guitars",
      "club beat",
      "uplifting choir",
      "clean futuristic polish",
      "vocals or chant lead",
    ],
  },
  P4: {
    name: "Outer Sea Moral Gate",
    summary: "public judgment pressure, salt wind, broadcast equipment, boarding triage ritual, final gate dread",
    bpm: "80-92",
    instrumentation: [
      "ritual low drums",
      "ship-horn bass swells",
      "rusted chain percussion",
      "radio static bed",
      "cold synth drones",
      "crowd-distance texture with no clear words",
    ],
    motion: [
      "start with ritualized moral pressure",
      "build a heavy symmetrical pulse",
      "reveal the boss with one severe low-end hit",
      "leave a hard unresolved ending for battle entry",
    ],
    avoid: [
      "victory march",
      "clean utopian sci-fi tone",
      "festival percussion",
      "melodic pop chorus",
      "fantasy choir heroism",
      "vocals or chant lead",
    ],
  },
};

function titleCase(value) {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function chapterSceneWords(chapterDir) {
  return chapterDir.replace(/^CH\d+_/, "").split("_").join(" ");
}

function bossDisplayWords(bossCode) {
  return titleCase(bossCode.replace(/^threat_/, "").replace(/^boss_/, "").replaceAll("_", " "));
}

function buildPromptText({ partId, chapterId, chapterDir, theme, bossCode }) {
  const cfg = partConfigs[partId];
  const scene = titleCase(chapterSceneWords(chapterDir));
  const bossName = bossDisplayWords(bossCode);

  return `Create a tense Korean apocalypse boss-intro music cue for Gemini Lyria 3.
Instrumental only. No lyrics. No spoken voice.
Target length: 35 to 45 seconds.
Purpose: the moment a boss appears on screen, right before combat starts.

Part theme: ${cfg.name}
Part mood: ${cfg.summary}
Chapter: ${chapterId} ${scene}
Boss: ${bossName}
Theme tag: ${theme}

Musical identity:
- dark, grounded, urban survival pressure
- immediate recognition of danger
- unresolved ending that hands off into combat
- texture, pulse, and dread over melody

Instrumentation:
- ${cfg.instrumentation.join("\n- ")}

Structure:
- ${cfg.motion.join("\n- ")}

Tempo:
- ${cfg.bpm} BPM range

Mix and feel:
- heavy low end
- suspended dark harmony
- physical impact on the boss reveal
- enough empty space for combat SFX transition

Avoid:
- ${cfg.avoid.join("\n- ")}

Do not make it heroic, triumphant, pretty, or melodically resolved.
The final hit should feel like recognition of the boss, not victory.`;
}

function buildPromptFile({ partId, chapterId, chapterDir, theme, bossCode }) {
  const scene = titleCase(chapterSceneWords(chapterDir));
  const bossName = bossDisplayWords(bossCode);
  const prompt = buildPromptText({ partId, chapterId, chapterDir, theme, bossCode });

  return `# ${chapterDir} Boss Intro

- Model: Gemini Lyria 3
- Part: ${partId}
- Chapter: ${chapterId}
- Scene: ${scene}
- Boss: ${bossName}

## Prompt
\`\`\`text
${prompt}
\`\`\`
`;
}

function buildPartGuide(partId) {
  const cfg = partConfigs[partId];
  return `# ${partId} Guide

- Theme: ${cfg.name}
- Mood: ${cfg.summary}
- Tempo range: ${cfg.bpm} BPM

## Instrumentation
- ${cfg.instrumentation.join("\n- ")}

## Motion
- ${cfg.motion.join("\n- ")}

## Avoid
- ${cfg.avoid.join("\n- ")}
`;
}

function buildPartReadme(partId, tracks) {
  return `# ${partId}

## Chapters
${tracks.map((track) => `- ${track.chapter_dir}/boss_intro.md`).join("\n")}
`;
}

function buildRootReadme(tracksByPart) {
  return `# Gemini Lyria 3 Boss Prompts

## Purpose
- Prompt-only pack for boss entrance music.
- Use each chapter prompt directly in Gemini Lyria 3 web.
- Canonical root: \`private/prompts/gemini-lyria3/boss-intro\`

## Structure
\`\`\`text
private/prompts/gemini-lyria3/boss-intro/
|-- README.md
|-- manifest.json
|-- P1/
|   |-- GUIDE.md
|   |-- README.md
|   \-- CHxx_*/boss_intro.md
|-- P2/
|-- P3/
\-- P4/
\`\`\`

## Regenerate
\`\`\`powershell
Set-Location ${REPO_ROOT}
npm run audio-prompts:boss
\`\`\`

## Open One Part
\`\`\`powershell
ii .\\private\\prompts\\gemini-lyria3\\boss-intro\\P4
\`\`\`

## Copy One Prompt
\`\`\`powershell
Get-Content .\\private\\prompts\\gemini-lyria3\\boss-intro\\P4\\CH16_fracture_harbor\\boss_intro.md -Raw | Set-Clipboard
\`\`\`

## Parts
${Object.entries(tracksByPart)
  .map(([partId, tracks]) => `- ${partId}: ${tracks.length} chapters`)
  .join("\n")}
`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeUtf8(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

async function removeIfExists(targetPath) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

async function main() {
  await removeIfExists(outputRoot);

  const chapterDirs = (await fs.readdir(chaptersRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const tracks = [];

  for (const chapterDir of chapterDirs) {
    const manifestPath = path.join(chaptersRoot, chapterDir, "chapter_manifest.json");
    const manifest = JSON.parse((await fs.readFile(manifestPath, "utf8")).replace(/^\uFEFF/u, ""));
    const threatAsset = (manifest.assets ?? []).find((asset) => asset.asset_type === "threat");

    const partId = manifest.part_id;
    const chapterId = manifest.chapter_id;
    const theme = manifest.theme ?? chapterDir.replace(/^CH\d+_/, "");
    const bossCode = threatAsset?.art_key_final ?? `boss_${theme}`;
    const promptFile = path.join("private", "prompts", "gemini-lyria3", "boss-intro", partId, chapterDir, "boss_intro.md");

    await writeUtf8(
      path.join(REPO_ROOT, promptFile),
      buildPromptFile({ partId, chapterId, chapterDir, theme, bossCode }),
    );

    tracks.push({
      track_id: `boss:${chapterDir}`,
      part_id: partId,
      chapter_id: chapterId,
      chapter_dir: chapterDir,
      boss_code: bossCode,
      theme,
      model: "Gemini Lyria 3",
      prompt_file: promptFile.replace(/\\/g, "/"),
      use_case: "boss_intro",
    });
  }

  const tracksByPart = tracks.reduce((acc, track) => {
    const list = acc[track.part_id] ?? [];
    list.push(track);
    acc[track.part_id] = list;
    return acc;
  }, {});

  for (const partId of Object.keys(partConfigs)) {
    const partDir = path.join(outputRoot, partId);
    const partTracks = (tracksByPart[partId] ?? []).sort((a, b) => a.chapter_dir.localeCompare(b.chapter_dir));

    await writeUtf8(path.join(partDir, "GUIDE.md"), buildPartGuide(partId));
    await writeUtf8(path.join(partDir, "README.md"), buildPartReadme(partId, partTracks));
  }

  const manifest = {
    version: "3.0.0",
    generated_at: new Date().toISOString(),
    model: "Gemini Lyria 3",
    structure: "private/part/chapter/prompt-only",
    track_count: tracks.length,
    tracks: tracks.sort((a, b) => a.prompt_file.localeCompare(b.prompt_file)),
  };

  await writeUtf8(path.join(outputRoot, "README.md"), buildRootReadme(tracksByPart));
  await writeUtf8(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeUtf8(
    path.join(PRIVATE_PROMPTS_GEMINI_ROOT, "README.md"),
    `# Gemini Prompt Pack\n\n- Boss intro prompts: \`${relFromRoot(path.join(outputRoot, "README.md"))}\`\n`,
  );

  console.log(JSON.stringify({
    generated: tracks.length,
    output_root: relFromRoot(outputRoot),
    manifest: relFromRoot(path.join(outputRoot, "manifest.json")),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
