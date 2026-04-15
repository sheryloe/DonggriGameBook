import fs from "node:fs/promises";
import path from "node:path";
import {
  PART_PRESENTATION_PACKAGES,
  PRESENTATION_PARTS,
  PRESENTATION_POSTER_DIR_BY_PART,
  PRESENTATION_PROMPT_VERSION
} from "./presentation-package-data.mjs";

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, "private", "prompts", "antigravity");
const GENERATED_IMAGE_ROOT = "public/generated/images";
const GENERATED_IMAGE_INBOX_ROOT = `${GENERATED_IMAGE_ROOT}/inbox`;
const PART1_VIDEO_PROMPT_DIR = "part1-video-prompts";
const PART1_VIDEO_PROMPT_COUNT = 11;
const NEGATIVE_PROMPT = [
  "no superhero pose",
  "no cyberpunk neon city",
  "no glossy sci-fi armor",
  "no recognizable brands",
  "no excessive gore",
  "no anime proportions"
].join(", ");

const PART_DROP_DIR_BY_PART = {
  P1: `${GENERATED_IMAGE_INBOX_ROOT}/P1`,
  P2: `${GENERATED_IMAGE_INBOX_ROOT}/P2`,
  P3: `${GENERATED_IMAGE_INBOX_ROOT}/P3`,
  P4: `${GENERATED_IMAGE_INBOX_ROOT}/P4`
};

const ASSET_LAYOUT = [
  { key: "bg_primary", asset_type: "background", folder: "background", file: "bg_primary.md", ratio: "16:10", sync_target_path: "private/generated/packaged/images/bg/" },
  { key: "bg_secondary", asset_type: "background", folder: "background", file: "bg_secondary.md", ratio: "16:10", sync_target_path: "private/generated/packaged/images/bg/" },
  { key: "portrait_anchor", asset_type: "portrait", folder: "portrait", file: "portrait_anchor.md", ratio: "4:5", sync_target_path: "private/generated/packaged/images/portrait/" },
  { key: "portrait_support", asset_type: "portrait", folder: "portrait", file: "portrait_support.md", ratio: "4:5", sync_target_path: "private/generated/packaged/images/portrait/" },
  { key: "threat_signature", asset_type: "threat", folder: "threat", file: "threat_signature.md", ratio: "4:5", sync_target_path: "private/generated/packaged/images/threat/" },
  { key: "poster_keyart", asset_type: "poster", folder: "poster", file: "poster_keyart.md", ratio: "4:5", sync_target_path: "private/generated/packaged/images/poster/" },
  { key: "teaser_frame_01", asset_type: "teaser", folder: "teaser", file: "teaser_frame_01.md", ratio: "16:9", sync_target_path: "private/generated/packaged/images/teaser/" },
  { key: "teaser_frame_02", asset_type: "teaser", folder: "teaser", file: "teaser_frame_02.md", ratio: "16:9", sync_target_path: "private/generated/packaged/images/teaser/" },
  { key: "teaser_frame_03", asset_type: "teaser", folder: "teaser", file: "teaser_frame_03.md", ratio: "16:9", sync_target_path: "private/generated/packaged/images/teaser/" }
];

const PART_CONFIG = {
  P1: {
    name: "Civic Archive Survival",
    tone: "broadcast ruin, archive anxiety, wet paper, civic survival bureaucracy",
    palette: "ash gray, damp fluorescent white, faded signal red, dirty teal",
    materials: "wet paper, old tapes, broken studio glass, rusted office steel",
    camera: "closer framing, practical handheld realism, anxious interiors",
    must_include: ["flooded archive", "broadcast station", "high-rise survival", "logbook texture"],
    avoid: ["clean luxury lighting", "heroic military framing"],
    composition: "one grounded focal point, dense practical clutter, documentary realism",
    negative_prompt: NEGATIVE_PROMPT
  },
  P2: {
    name: "Southern Checkpoint Descent",
    tone: "civil pressure thriller, checkpoint pursuit, diesel smoke, forged route cards, crowd compression, manifest barter",
    palette: "red warning lane, sodium orange, damp concrete gray, dirty white",
    materials: "barricade plastic, diesel grime, wet asphalt, queue cards, police tape",
    camera: "medium lens, forward pressure, linear escape framing, shoulder-height urgency",
    must_include: ["checkpoint corridor", "red warning lane", "diesel smoke", "crowd pressure", "manifest cards"],
    avoid: ["spacious heroic skyline", "fashion editorial posing", "clean sci-fi staging"],
    composition: "narrow route, converging lines, survival bottleneck, visible route control hardware",
    negative_prompt: NEGATIVE_PROMPT
  },
  P3: {
    name: "Cold Quarantine Line",
    tone: "civil pressure thriller, cold storage fog, exposed checkpoint logs, rescue versus concealment, delayed guilt",
    palette: "cold blue, frosted white, oxidized steel, low-saturation navy",
    materials: "frost, salt film, rail steel, paper records, emergency tarp",
    camera: "wider negative space, frozen pauses before impact, slow push-ins toward moral pressure",
    must_include: ["radio mast", "cold storage", "sea fog", "paper records", "triage residue"],
    avoid: ["warm blockbuster palette", "glossy futuristic tech", "stylized action posing"],
    composition: "isolated figures inside hard infrastructure, cold depth, pressure accumulating off-screen",
    negative_prompt: NEGATIVE_PROMPT
  },
  P4: {
    name: "Outer Sea Moral Gate",
    tone: "civil pressure thriller, boarding triage, broadcast equipment, public judgment, handwritten allocation lists, final gate pressure",
    palette: "salt gray, dawn blue, weathered cream paper, signal green LED",
    materials: "salt-stained concrete, rope fiber, queue boards, old speakers, stamped boarding slips",
    camera: "public-facing staging, heavier symmetry, ritualized decision weight, close reaction coverage",
    must_include: ["salt station", "public allocation hall", "broadcast equipment", "handwritten boarding lists", "moral pressure", "waiting queue"],
    avoid: ["victory poster energy", "flashy neon spectacle", "clean utopian architecture"],
    composition: "public judgement, one dominant silhouette, civic ritual tension, visible human surplus",
    negative_prompt: NEGATIVE_PROMPT
  }
};

const SAFE_FALLBACK_NPCS = {
  P1: ["npc_yoon_haein", "npc_jung_noah"],
  P2: ["npc_jung_noah", "npc_seo_jinseo"],
  P3: ["npc_nam_suryeon", "npc_ryu_seon"],
  P4: ["npc_yoon_haein", "npc_kim_ara"]
};

const readJson = async (file) => JSON.parse((await fs.readFile(file, "utf8")).replace(/^\uFEFF/u, ""));
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const writeText = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${value.trim()}\n`, "utf8");
};
const unique = (items) => [...new Set(items.filter(Boolean))];
const slug = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
const chapterNumber = (chapterId) => String(chapterId).replace(/\D+/g, "").padStart(2, "0");
const chapterSlug = (chapter) => `${chapter.chapter_id}_${slug(chapter.ui_profile.theme)}`;
const partFromChapter = (chapterId) => {
  const no = Number(chapterNumber(chapterId));
  if (no <= 5) return "P1";
  if (no <= 10) return "P2";
  if (no <= 15) return "P3";
  return "P4";
};
const normalizeDataFile = (value) => {
  const normalized = String(value ?? "").replace(/\\/g, "/").replace(/^\.?\//u, "");
  if (!normalized) {
    return normalized;
  }
  if (normalized.startsWith("private/content/data/")) {
    return normalized.replace(/^private\/content\/data\//u, "");
  }
  if (normalized.startsWith("codex_webgame_pack/data/")) {
    return normalized.replace(/^codex_webgame_pack\/data\//u, "");
  }
  if (normalized.startsWith("data/")) {
    return normalized.replace(/^data\//u, "");
  }
  return normalized;
};

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const trimmed = token.slice(2);
    if (!trimmed) {
      continue;
    }
    if (trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      parsed[key] = rest.join("=");
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[trimmed] = "true";
      continue;
    }
    parsed[trimmed] = next;
    index += 1;
  }
  return parsed;
}

function resolveSelectedParts(partArg) {
  if (!partArg) {
    return null;
  }
  const partIds = String(partArg)
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);
  const invalid = partIds.filter((partId) => !(partId in PART_CONFIG));
  if (invalid.length > 0) {
    throw new Error(`unsupported --part value: ${invalid.join(", ")}`);
  }
  return new Set(partIds);
}

function shouldWritePart(selectedParts, partId) {
  return !selectedParts || selectedParts.has(partId);
}

function looksSuspiciousText(value) {
  return ["\uFFFD", "??", "諛곌꼍", "吏꾩엯", "紐낅떒", "怨듭떇", "媛덈벑", "遺됱?", "利앷굅"].some((pattern) =>
    String(value ?? "").includes(pattern)
  );
}

function safeText(value, fallback) {
  const text = String(value ?? "").trim();
  if (!text || looksSuspiciousText(text)) {
    return fallback;
  }
  return text;
}
const VIDEO_PROMPT_PARTS = ["P2", "P3", "P4"];
const VIDEO_PROMPT_DIR_BY_PART = {
  P2: "part2-video-prompts",
  P3: "part3-video-prompts",
  P4: "part4-video-prompts"
};
const POSTER_PROMPT_DIR_BY_PART = PRESENTATION_POSTER_DIR_BY_PART;

const partNo = (partId) => partId.replace("P", "");

function extractCinematicBeats(chapter) {
  const beats =
    chapter.chapter_cinematic?.beats ??
    chapter.chapter_cinematic?.scenes ??
    chapter.chapter_cinematic?.scene_beats ??
    [];
  if (!Array.isArray(beats) || beats.length === 0) {
    return [
      `${chapter.title} opening pressure`,
      `${chapter.title} middle reversal`,
      `${chapter.title} moral choice`,
      `${chapter.title} physical threat`,
      `${chapter.title} lingering cost`
    ];
  }
  return beats
    .map((beat, index) =>
      typeof beat === "string"
        ? beat
        : safeText(beat?.summary ?? beat?.label ?? beat?.description ?? beat?.beat, `Beat ${index + 1}`)
    )
    .filter(Boolean);
}

function createOpeningVideoPrompt(chapter, enemyMap) {
  const partId = partFromChapter(chapter.chapter_id);
  const firstEvent = chapter.events[0];
  const firstMusic = firstEvent?.presentation?.music_key ?? `${partId.toLowerCase()}_opening`;
  const sourceArtKey =
    chapter.chapter_cinematic?.still_art_key ??
    collectRuntimeArtKeys(chapter).find((key) => key.includes("_entry")) ??
    firstEvent?.presentation?.art_key ??
    `pending_${chapter.chapter_id.toLowerCase()}_opening`;
  const boss = pickBoss(chapter, enemyMap);
  const beats = extractCinematicBeats(chapter);
  const file = `P${partNo(partId)}_${chapter.chapter_id}_OPENING.json`;
  const videoId = `P${partNo(partId)}_${chapter.chapter_id}_OPENING`;
  const sceneId = `${chapter.chapter_id}_OPENING_${slug(chapter.ui_profile.theme).toUpperCase()}`;
  const targetVideoPath = `public/generated/videos/${videoId}.mp4`;
  const targetPosterPath = `public/generated/images/${sourceArtKey}.webp`;
  const promptEn = [
    `Cinematic Korean apocalypse opening for ${chapter.chapter_id} ${chapter.title}.`,
    `${PART_CONFIG[partId].tone}.`,
    `Location mood: ${chapter.nodes.map((node) => node.name).slice(0, 3).join(", ")}.`,
    `Beat ladder: ${beats.join("; ")}.`,
    `Show route pressure, practical survival gear, crowd exclusion, and incoming threat ${boss.bossName}.`,
    `Grounded realism, no fantasy.`
  ].join(" ");

  return {
    video_id: videoId,
    scene_id: sceneId,
    chapter_id: chapter.chapter_id,
    ending_id: null,
    part_id: partId,
    kind: "opening",
    duration: 15,
    aspect_ratio: "16:9",
    prompt_en: promptEn,
    prompt_ko_context: safeText(firstEvent?.text?.summary, `${chapter.chapter_id} opening pressure.`),
    camera_notes: `${PART_CONFIG[partId].camera}. Start wide, move into bodies and paperwork, end on route decision pressure.`,
    audio_notes: `Base cue ${firstMusic}. Layer alarms, crowd pressure, clipped radio, and metallic reverb.`,
    source_art_key: sourceArtKey,
    target_video_path: targetVideoPath,
    target_poster_path: targetPosterPath,
    stitch_prompt: `${promptEn} Match style pack ${partId}.${chapter.ui_profile.theme}.`,
    file
  };
}

function buildVideoManifest(partId, prompts) {
  return {
    version: PRESENTATION_PROMPT_VERSION,
    scope: `${VIDEO_PROMPT_DIR_BY_PART[partId]}`,
    part_id: partId,
    count: prompts.length,
    prompts: prompts.map((prompt) => ({
      video_id: prompt.video_id,
      scene_id: prompt.scene_id,
      chapter_id: prompt.chapter_id,
      ending_id: prompt.ending_id ?? null,
      kind: prompt.kind,
      file: prompt.file,
      source_art_key: prompt.source_art_key,
      target_video_path: prompt.target_video_path,
      target_poster_path: prompt.target_poster_path
    }))
  };
}

function createEndingVideoPrompt(partId, ending) {
  return {
    video_id: ending.ending_id,
    scene_id: ending.scene_id,
    chapter_id: ending.chapter_id,
    ending_id: ending.ending_id,
    part_id: partId,
    kind: "ending",
    duration: ending.duration,
    aspect_ratio: "16:9",
    prompt_en: `${ending.prompt_en} ${PART_CONFIG[partId].tone}. ${ending.visual_anchor}. Grounded Korean apocalypse cinematic realism.`,
    prompt_ko_context: safeText(ending.prompt_ko_context, ending.summary ?? ending.title),
    camera_notes: safeText(ending.camera_notes, `Keep the cost of ${ending.title} visible in every shot.`),
    audio_notes: safeText(ending.audio_notes, "Use restrained impact, civic ambience, and one unresolved cue."),
    source_art_key: ending.source_art_key,
    target_video_path: `public/generated/videos/${ending.ending_id}.mp4`,
    target_poster_path: `public/generated/images/${ending.source_art_key}.webp`,
    stitch_prompt: `${ending.prompt_en} Match style pack ${partId}.ending.${slug(ending.ending_id)}.`,
    file: `${ending.ending_id}.json`
  };
}

function createTrailerVideoPrompt(partId, trailer) {
  return {
    video_id: trailer.video_id,
    scene_id: trailer.scene_id,
    chapter_id: null,
    ending_id: null,
    part_id: partId,
    kind: "trailer",
    duration: trailer.duration,
    aspect_ratio: "16:9",
    prompt_en: trailer.prompt_en,
    prompt_ko_context: safeText(trailer.prompt_ko_context, `${partId} trailer context`),
    camera_notes: safeText(trailer.camera_notes, `Use escalating public pressure beats for ${partId}.`),
    audio_notes: safeText(trailer.audio_notes, "Build from civic ambience into restrained impact percussion."),
    source_art_key: trailer.source_art_key,
    target_video_path: `public/generated/videos/${trailer.video_id}.mp4`,
    target_poster_path: `public/generated/images/${trailer.source_art_key}.webp`,
    stitch_prompt: `${trailer.prompt_en} Match style pack ${partId}.trailer.main.`,
    file: `${trailer.video_id}.json`
  };
}

function buildPosterPromptMarkdown(partId, poster) {
  return `# ${poster.poster_id}

## Header
- poster_id: ${poster.poster_id}
- part_id: ${partId}
- category: ${poster.category}
- ratio: 4:5
- target_path: ${poster.target_path}
- source_art_key_hint: ${poster.source_art_key_hint}
- filename_target: ${path.basename(poster.target_path)}
- art_key_final: ${poster.source_art_key_hint}
- runtime_art_keys: ${JSON.stringify([poster.source_art_key_hint])}
- sync_target_path: ${path.dirname(poster.target_path).replace(/\\/g, "/")}/
- drop_inbox_path: ${PART_DROP_DIR_BY_PART[partId]}
- sync_mode: filename_target

## English Prompt
\`\`\`text
${poster.prompt_en}
\`\`\`

## Narrative Lens
${safeText(poster.prompt_ko_context, PART_CONFIG[partId].tone)}

## Negative Prompt
\`\`\`text
${PART_CONFIG[partId].negative_prompt}
\`\`\`

## Composition Notes
${safeText(poster.composition_notes, PART_CONFIG[partId].composition)}
`;
}

function buildPosterManifest(partId, posters) {
  return {
    version: PRESENTATION_PROMPT_VERSION,
    scope: POSTER_PROMPT_DIR_BY_PART[partId],
    part_id: partId,
    count: posters.length,
    posters: posters.map((poster) => ({
      poster_id: poster.poster_id,
      category: poster.category,
      file: poster.file,
      target_path: poster.target_path,
      source_art_key_hint: poster.source_art_key_hint
    }))
  };
}

function buildPresentationManifest(videoPromptsByPart, posterPromptsByPart) {
  const entries = [];
  for (const partId of PRESENTATION_PARTS) {
    for (const prompt of videoPromptsByPart[partId]) {
      entries.push({
        part_id: partId,
        type: prompt.kind,
        id: prompt.video_id,
        file: `private/prompts/antigravity/${VIDEO_PROMPT_DIR_BY_PART[partId]}/${prompt.file}`,
        target_path: prompt.target_video_path
      });
    }
    for (const poster of posterPromptsByPart[partId]) {
      entries.push({
        part_id: partId,
        type: "poster",
        id: poster.poster_id,
        file: `private/prompts/antigravity/${POSTER_PROMPT_DIR_BY_PART[partId]}/${poster.file}`,
        target_path: poster.target_path
      });
    }
  }
  return {
    version: PRESENTATION_PROMPT_VERSION,
    count: entries.length,
    entries
  };
}

function buildPresentationRenderQueue(videoPromptsByPart, posterPromptsByPart) {
  const tasks = [];
  for (const partId of PRESENTATION_PARTS) {
    for (const prompt of videoPromptsByPart[partId]) {
      tasks.push({
        task_id: `presentation-video:${prompt.video_id}`,
        kind: "video",
        part_id: partId,
        prompt_file: `private/prompts/antigravity/${VIDEO_PROMPT_DIR_BY_PART[partId]}/${prompt.file}`,
        target_path: prompt.target_video_path
      });
    }
    for (const poster of posterPromptsByPart[partId]) {
      tasks.push({
        task_id: `presentation-poster:${poster.poster_id}`,
        kind: "image",
        part_id: partId,
        prompt_file: `private/prompts/antigravity/${POSTER_PROMPT_DIR_BY_PART[partId]}/${poster.file}`,
        target_path: poster.target_path
      });
    }
  }
  return {
    version: PRESENTATION_PROMPT_VERSION,
    task_count: tasks.length,
    tasks
  };
}

function buildPresentationPosterObjects() {
  const result = {};
  for (const partId of PRESENTATION_PARTS) {
    result[partId] = PART_PRESENTATION_PACKAGES[partId].posters.map((poster) => ({
      ...poster,
      file: `${poster.poster_id}.md`
    }));
  }
  return result;
}

function buildStitchRenderQueue(masterAssets, videoPromptsByPart) {
  const imageTasks = masterAssets
    .map((asset) => ({
      task_id: `img:${asset.art_key_final}`,
      kind: "image",
      part_id: asset.part_id,
      chapter_id: asset.chapter_id,
      prompt_file: asset.prompt_file,
      target_path: `${asset.drop_inbox_path}/${asset.filename_target}`,
      publish_target_path: `${asset.sync_target_path}${asset.filename_target}`,
      public_runtime_target: `${GENERATED_IMAGE_ROOT}/${asset.art_key_final}.webp`,
      stitch_space: `donggrol_${asset.part_id.toLowerCase()}_images`
    }));
  const videoTasks = Object.entries(videoPromptsByPart).flatMap(([partId, prompts]) =>
    prompts.map((prompt) => ({
      task_id: `video:${prompt.video_id}`,
      kind: "video",
      part_id: partId,
      chapter_id: prompt.chapter_id,
      prompt_file: `private/prompts/antigravity/${VIDEO_PROMPT_DIR_BY_PART[partId]}/${prompt.file}`,
      target_path: prompt.target_video_path,
      stitch_space: `donggrol_${partId.toLowerCase()}_videos`
    }))
  );

  return {
    version: PRESENTATION_PROMPT_VERSION,
    image_task_count: imageTasks.length,
    video_task_count: videoTasks.length,
    tasks: [...imageTasks, ...videoTasks]
  };
}

function collectRuntimeArtKeys(chapter) {
  return unique([
    ...chapter.events.map((event) => event.presentation?.art_key),
    chapter.chapter_cinematic?.still_art_key,
    chapter.chapter_cinematic?.world_map_art_key,
    chapter.chapter_cinematic?.anchor_portrait_key,
    chapter.chapter_cinematic?.support_portrait_key,
    chapter.chapter_cinematic?.boss_splash_key,
    chapter.chapter_cinematic?.result_card_art_key
  ]);
}

function collectNpcIds(chapter, partId) {
  const npcIds = unique([
    ...chapter.nodes.flatMap((node) => node.npc_ids ?? []),
    ...chapter.events.flatMap((event) => event.npc_ids ?? [])
  ]);
  for (const fallback of SAFE_FALLBACK_NPCS[partId]) {
    if (!npcIds.includes(fallback)) {
      npcIds.push(fallback);
    }
  }
  return npcIds;
}

function pickPortraits(chapter, npcMap, partId) {
  const npcIds = collectNpcIds(chapter, partId);
  const anchor = npcIds[0];
  const support = npcIds.find((npcId) => npcId !== anchor) ?? anchor;
  return {
    anchorId: anchor,
    anchorName: npcMap[anchor]?.name_ko ?? anchor,
    anchorRole: npcMap[anchor]?.role ?? "survivor",
    supportId: support,
    supportName: npcMap[support]?.name_ko ?? support,
    supportRole: npcMap[support]?.role ?? "support survivor"
  };
}

function pickBoss(chapter, enemyMap) {
  const bossEvent = chapter.events.find((event) => event.combat?.boss_id) ?? chapter.events.find((event) => event.event_id === chapter.boss_event_id);
  const bossId = bossEvent?.combat?.boss_id ?? chapter.chapter_id.toLowerCase();
  return {
    bossId,
    bossName: enemyMap[bossId]?.name_ko ?? bossEvent?.title ?? bossId,
    bossBehavior: enemyMap[bossId]?.behavior ?? chapter.role
  };
}

function buildSourceRefs(chapter, partId) {
  return [
    `private/content/data/chapters/${slug(chapter.chapter_id)}.json`,
    `private/content/ui/${slug(chapter.chapter_id)}.ui_flow.json`,
    `private/story/world/story-bible/chapters/CHAPTER_BLUEPRINT_${chapter.chapter_id}.md`,
    `private/story/world/story-bible/PART_BIBLE_${partId}.md`
  ];
}

function buildAssetKeys(chapter, portraits, boss) {
  const no = chapterNumber(chapter.chapter_id);
  const themeSlug = slug(chapter.ui_profile.theme);
  return {
    bg_primary: `bg_ch${no}_${themeSlug}_primary`,
    bg_secondary: `bg_ch${no}_${themeSlug}_secondary`,
    portrait_anchor: `portrait_${portraits.anchorId}_ch${no}_anchor`,
    portrait_support: `portrait_${portraits.supportId}_ch${no}_support`,
    threat_signature: `threat_${boss.bossId}`,
    poster_keyart: `poster_ch${no}_${themeSlug}`,
    teaser_frame_01: `teaser_ch${no}_entry`,
    teaser_frame_02: `teaser_ch${no}_pressure`,
    teaser_frame_03: `teaser_ch${no}_preclimax`
  };
}

function buildRuntimeBinding(chapter, portraits) {
  const arts = unique(chapter.events.map((event) => event.presentation?.art_key));
  const backgrounds = arts.filter((key) => key.startsWith("bg_") || /_(entry|route|anchor|side_a|side_b)$/.test(key));
  const portraitsRuntime = arts.filter((key) => key.startsWith("portrait_") || key === portraits.anchorId || key === portraits.supportId);
  const threat = arts.find((key) => key.startsWith("boss_") || key.endsWith("_boss")) ?? arts.at(-1);
  return {
    bgPrimary: backgrounds[0] ?? arts[0] ?? `pending:${chapter.chapter_id}:bg_primary`,
    bgSecondary: backgrounds[1] ?? backgrounds[0] ?? arts[0] ?? `pending:${chapter.chapter_id}:bg_secondary`,
    portraitAnchor: portraitsRuntime[0] ?? `pending:${portraits.anchorId}`,
    portraitSupport: portraitsRuntime[1] ?? `pending:${portraits.supportId}`,
    threat: threat ?? `pending:${chapter.chapter_id}:threat`
  };
}

function promptText(kind, ctx) {
  const chapter = ctx.chapter;
  const part = ctx.part;
  const [loc1, loc2, loc3, loc4 = loc3] = chapter.nodes.map((node) => node.name);
  const role = chapter.role;
  const storyHook = chapter.events[0]?.text?.summary ?? role;
  const boss = ctx.boss;
  const theme = chapter.ui_profile.theme;

  if (kind === "bg_primary") {
    return `primary background for ${chapter.title}, ${loc1}, ${part.tone}, ${part.must_include.join(", ")}, Korean urban apocalypse, documentary disaster realism, practical environmental storytelling, ${theme}, cinematic still, grounded materials`;
  }
  if (kind === "bg_secondary") {
    return `secondary background for ${chapter.title}, ${loc3} and ${loc4}, ${role}, ${part.tone}, realistic infrastructure decay, Korean civic survival mood, layered signage, cinematic environment concept art, grounded realism`;
  }
  if (kind === "portrait_anchor") {
    return `${ctx.portraits.anchorName}, Korean apocalypse survivor, ${ctx.portraits.anchorRole}, practical layered clothing, ${part.tone}, tired eyes, civic survival bureaucracy mood, realistic proportions, cinematic portrait, documentary lighting`;
  }
  if (kind === "portrait_support") {
    return `${ctx.portraits.supportName}, Korean apocalypse survivor, ${ctx.portraits.supportRole}, worn field gear, ${part.tone}, realistic portrait, expressive fatigue, grounded texture, cinematic close portrait`;
  }
  if (kind === "threat_signature") {
    return `${boss.bossName}, Korean disaster setting infected, fused with ${loc4}, ${boss.bossBehavior}, ${part.tone}, industrial body horror, realistic anatomy distortion, cinematic threat portrait, grounded horror`;
  }
  if (kind === "poster_keyart") {
    return `poster for ${chapter.title}, Korean urban apocalypse, ${loc2}, ${storyHook}, one dominant silhouette, dramatic negative space, ${part.composition}, realistic cinematic color grading, distressed typography space`;
  }
  if (kind === "teaser_frame_01") {
    return `cinematic teaser frame for ${chapter.title}, entry beat, ${loc1}, ${storyHook}, ${part.tone}, atmospheric realism, grounded disaster mood, strong opening image`;
  }
  if (kind === "teaser_frame_02") {
    return `cinematic teaser frame for ${chapter.title}, pressure beat, ${loc3}, escalating conflict, ${part.tone}, crowd pressure, layered survival detail, realistic cinematic tension`;
  }
  return `cinematic teaser frame for ${chapter.title}, pre-climax beat, ${loc4}, ${boss.bossName} about to emerge, ${part.tone}, unresolved hope and dread, realistic cinematic still`;
}

function koreanContext(kind, ctx) {
  const chapter = ctx.chapter;
  const [loc1, , loc3, loc4 = loc3] = chapter.nodes.map((node) => node.name);
  if (kind === "bg_primary") return `${chapter.chapter_id}의 첫 인상을 잡는 메인 배경이다. ${loc1}을 중심으로 챕터의 위기와 파트 분위기가 한 장면에 보여야 한다.`;
  if (kind === "bg_secondary") return `${chapter.chapter_id}의 진행 압박이 깊어지는 배경이다. ${loc3} 또는 ${loc4}를 중심으로 메인 갈등이 실제 공간처럼 느껴져야 한다.`;
  if (kind === "portrait_anchor") return `${chapter.chapter_id}의 감정 중심 인물이다. 얼굴보다 역할과 피로, 생존 방식이 먼저 읽혀야 한다.`;
  if (kind === "portrait_support") return `${chapter.chapter_id}에서 서브 갈등을 받치는 인물 초상이다. 주연보다 덜 화려하지만 존재감은 분명해야 한다.`;
  if (kind === "threat_signature") return `${chapter.chapter_id}의 시그니처 위협이다. 장소 적응형 감염체라는 점과 공략 포인트가 동시에 느껴져야 한다.`;
  if (kind === "poster_keyart") return `${chapter.chapter_id}의 핵심 갈등과 장소, 주 실루엣을 한 장으로 보여주는 포스터다.`;
  if (kind === "teaser_frame_01") return `${chapter.chapter_id} 티저의 진입 장면이다. 플레이어가 바로 상황을 이해할 수 있어야 한다.`;
  if (kind === "teaser_frame_02") return `${chapter.chapter_id} 티저의 압박 장면이다. 추격, 검문, 기록 해독, 배급 압박처럼 중반 긴장이 보여야 한다.`;
  return `${chapter.chapter_id} 티저의 클라이맥스 직전 장면이다. 보스를 전부 보여주지 말고 직전의 긴장으로 끌어야 한다.`;
}

function compositionNotes(kind, ctx) {
  const part = ctx.part;
  if (kind.startsWith("bg_")) return `${part.camera}. ${part.composition}. 실내/실외 깊이감을 분명히 유지한다.`;
  if (kind.startsWith("portrait")) return `상반신 중심, 실용 장비가 함께 보여야 한다. 과장된 영웅 포즈 없이 눈빛과 마모된 재질로 캐릭터를 설명한다.`;
  if (kind === "threat_signature") return `정면 박제보다 3/4 각도 우선. 환경과 융합된 형태가 한눈에 읽혀야 한다.`;
  if (kind === "poster_keyart") return `갈등 + 장소 + 주 실루엣을 한 프레임에 넣고, 제목이 들어갈 여백을 남긴다.`;
  return `한 장면에 하나의 감정만 강조한다. 티저 프레임은 흐름상 entry -> pressure -> preclimax 순서를 유지한다.`;
}

function continuityNotes(kind, ctx) {
  const chapter = ctx.chapter;
  const part = ctx.partId;
  const theme = chapter.ui_profile.theme;
  if (kind.startsWith("teaser")) return `${part} / ${theme} 스타일팩 유지. 이 장면은 다른 프레임과 이어서 보일 때 색과 재질이 튀면 안 된다.`;
  return `${part} / ${theme} 스타일팩 유지. 후속 동기화 시 filename과 art_key_final을 그대로 사용한다.`;
}

function buildPromptMarkdown(asset, ctx) {
  return `# ${asset.asset_id}

## Header
- asset_id: ${asset.asset_id}
- chapter_id: ${asset.chapter_id}
- part_id: ${asset.part_id}
- asset_type: ${asset.asset_type}
- subject: ${asset.subject}
- ratio: ${asset.ratio}
- art_key_runtime: ${asset.art_key_runtime}
- art_key_final: ${asset.art_key_final}
- runtime_art_keys: ${JSON.stringify(ctx.runtimeKeysByAsset?.get(asset.asset_id) ?? [asset.art_key_runtime])}
- filename_target: ${asset.filename_target}
- sync_target_path: ${asset.sync_target_path}
- drop_inbox_path: ${asset.drop_inbox_path}
- sync_mode: ${asset.sync_mode}

## English Prompt
\`\`\`text
${promptText(asset.kind, ctx)}
\`\`\`

## Korean Context
${koreanContext(asset.kind, ctx)}

## Negative Prompt
\`\`\`text
${ctx.part.negative_prompt}
\`\`\`

## Composition Notes
${compositionNotes(asset.kind, ctx)}

## Continuity Notes
${continuityNotes(asset.kind, ctx)}

## Source Refs
${asset.source_refs.map((ref) => `- ${ref}`).join("\n")}
`;
}

function buildAssets(chapter, npcMap, enemyMap) {
  const partId = partFromChapter(chapter.chapter_id);
  const part = PART_CONFIG[partId];
  const portraits = pickPortraits(chapter, npcMap, partId);
  const boss = pickBoss(chapter, enemyMap);
  const runtime = buildRuntimeBinding(chapter, portraits);
  const artKeys = buildAssetKeys(chapter, portraits, boss);
  const refs = buildSourceRefs(chapter, partId);
  const dir = chapterSlug(chapter);
  const cinematic = chapter.chapter_cinematic ?? {};
  const subjectMap = {
    bg_primary: chapter.nodes[0]?.name ?? chapter.title,
    bg_secondary: chapter.nodes[2]?.name ?? chapter.nodes[1]?.name ?? chapter.title,
    portrait_anchor: portraits.anchorName,
    portrait_support: portraits.supportName,
    threat_signature: boss.bossName,
    poster_keyart: `${chapter.title} key art`,
    teaser_frame_01: `${chapter.title} entry beat`,
    teaser_frame_02: `${chapter.title} pressure beat`,
    teaser_frame_03: `${chapter.title} preclimax beat`
  };
  const runtimeMap = {
    bg_primary: cinematic.still_art_key ?? runtime.bgPrimary,
    bg_secondary: cinematic.world_map_art_key ?? runtime.bgSecondary,
    portrait_anchor: cinematic.anchor_portrait_key ?? runtime.portraitAnchor,
    portrait_support: cinematic.support_portrait_key ?? runtime.portraitSupport,
    threat_signature: cinematic.boss_splash_key ?? runtime.threat,
    poster_keyart: cinematic.result_card_art_key ?? `pending:${artKeys.poster_keyart}`,
    teaser_frame_01: `pending:${artKeys.teaser_frame_01}`,
    teaser_frame_02: `pending:${artKeys.teaser_frame_02}`,
    teaser_frame_03: `pending:${artKeys.teaser_frame_03}`
  };
  return ASSET_LAYOUT.map((layout) => {
    const filename = `${artKeys[layout.key]}_v01.webp`;
    return {
      kind: layout.key,
      asset_id: `${slug(chapter.chapter_id)}_${layout.key}`,
      chapter_id: chapter.chapter_id,
      part_id: partId,
      asset_type: layout.asset_type,
      subject: subjectMap[layout.key],
      art_key_runtime: runtimeMap[layout.key],
      art_key_final: artKeys[layout.key],
      filename_target: filename,
      ratio: layout.ratio,
      prompt_path: `private/prompts/antigravity/chapters/${dir}/${layout.folder}/${layout.file}`,
      prompt_file: `private/prompts/antigravity/chapters/${dir}/${layout.folder}/${layout.file}`,
      sync_target_path: layout.sync_target_path,
      drop_inbox_path: PART_DROP_DIR_BY_PART[partId],
      sync_mode: "filename_target",
      status: "prompt_ready",
      source_refs: refs,
      style_pack: `${partId}.${chapter.ui_profile.theme}`
    };
  });
}

function buildAliasMappings(chapter, assets) {
  const assetByKind = Object.fromEntries(assets.map((asset) => [asset.kind, asset]));
  const mappings = collectRuntimeArtKeys(chapter).map((runtimeArtKey) => {
    let target = assetByKind.bg_primary;
    if (runtimeArtKey.startsWith("portrait_") || runtimeArtKey.startsWith("npc_")) {
      const cinematic = chapter.chapter_cinematic ?? {};
      target =
        runtimeArtKey === cinematic.anchor_portrait_key || runtimeArtKey === assetByKind.portrait_anchor.art_key_runtime
          ? assetByKind.portrait_anchor
          : assetByKind.portrait_support;
    } else if (runtimeArtKey.startsWith("boss_") || runtimeArtKey.endsWith("_boss")) {
      target = assetByKind.threat_signature;
    } else if (runtimeArtKey === chapter.chapter_cinematic?.world_map_art_key) {
      target = assetByKind.bg_secondary;
    } else if (runtimeArtKey === chapter.chapter_cinematic?.result_card_art_key) {
      target = assetByKind.poster_keyart;
    } else if (/route|side_a|side_b|security|sorting|server|market|pier|sluice|cooling|sky|rooftop|secondary/.test(runtimeArtKey)) {
      target = assetByKind.bg_secondary;
    }
    return {
      chapter_id: chapter.chapter_id,
      runtime_art_key: runtimeArtKey,
      asset_id: target.asset_id,
      art_key_final: target.art_key_final,
      filename_target: target.filename_target
    };
  });
  const seen = new Set();
  return mappings.filter((entry) => {
    const key = `${entry.chapter_id}|${entry.runtime_art_key}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildRuntimeKeysByAsset(aliasMappings) {
  const map = new Map();
  for (const mapping of aliasMappings) {
    if (!map.has(mapping.asset_id)) {
      map.set(mapping.asset_id, []);
    }
    map.get(mapping.asset_id).push(mapping.runtime_art_key);
  }
  for (const [assetId, values] of map.entries()) {
    map.set(assetId, unique(values));
  }
  return map;
}

function buildChapterManifest(chapter, assets, runtimeKeysByAsset) {
  return {
    chapter_id: chapter.chapter_id,
    title: chapter.title,
    part_id: partFromChapter(chapter.chapter_id),
    theme: chapter.ui_profile.theme,
    story_hook: chapter.events[0]?.text?.summary ?? chapter.role,
    assets: assets.map((asset) => ({
      asset_id: asset.asset_id,
      asset_type: asset.asset_type,
      subject: asset.subject,
      art_key_runtime: asset.art_key_runtime,
      art_key_final: asset.art_key_final,
      runtime_art_keys: runtimeKeysByAsset.get(asset.asset_id) ?? [asset.art_key_runtime],
      filename_target: asset.filename_target,
      ratio: asset.ratio,
      prompt_path: asset.prompt_path,
      source_doc_refs: asset.source_refs,
      sync_target_path: asset.sync_target_path,
      drop_inbox_path: asset.drop_inbox_path,
      sync_mode: asset.sync_mode
    }))
  };
}

function buildReadme() {
  return `# Asset Prompt Pack

## Purpose
- Provide render-ready prompts for CH01~CH20 image, poster, teaser, and presentation video assets.
- Use filename-driven sync so web-generated files can be dropped into the inbox and published with one command.

## Workflow
1. Run the prompt generator.
2. Open the relevant chapter prompt markdown and generate the image on the web.
3. Save the file with the exact \`filename_target\`.
4. Drop the file into the documented \`drop_inbox_path\`.
5. Run \`npm run assets:sync -- --dry-run\`.
6. If the report is clean, run \`npm run assets:sync\`.
`;
}

function buildPartGuide(partId) {
  const part = PART_CONFIG[partId];
  return `# ${partId}

## Summary
- Name: ${part.name}
- Tone: ${part.tone}
- Palette: ${part.palette}
- Materials: ${part.materials}
- Camera: ${part.camera}
- Drop Inbox: ${PART_DROP_DIR_BY_PART[partId]}

## Must Include
${part.must_include.map((item) => `- ${item}`).join("\n")}

## Avoid
${part.avoid.map((item) => `- ${item}`).join("\n")}

## Composition
- ${part.composition}
- Make route control or allocation pressure legible in the frame.
- Keep background behavior active enough to show who is excluded.
- Preserve one grounded visual language across briefing, map, result, teaser, and poster surfaces.

## Common Negative Prompt
\`\`\`text
${part.negative_prompt}
\`\`\`
`;
}

function buildAutoSyncGuide() {
  return `# Auto Sync Guide

## Inbox Folders
- P1: ${PART_DROP_DIR_BY_PART.P1}
- P2: ${PART_DROP_DIR_BY_PART.P2}
- P3: ${PART_DROP_DIR_BY_PART.P3}
- P4: ${PART_DROP_DIR_BY_PART.P4}

## Allowed Extensions
- .webp
- .png
- .jpg
- .jpeg
- .svg

## PowerShell Commands
\`\`\`powershell
npm run asset-prompts:generate:part2
npm run assets:sync -- --dry-run
npm run assets:sync
\`\`\`
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selectedParts = resolveSelectedParts(args.part);
  const isFullRun = !selectedParts;
  const index = await readJson(path.join(ROOT, "private", "content", "data", "chapters.index.json"));
  const npcRegistry = await readJson(path.join(ROOT, "private", "content", "data", "npc.registry.json"));
  const enemyRegistry = await readJson(path.join(ROOT, "private", "content", "data", "enemy.registry.json"));
  const npcMap = Object.fromEntries(npcRegistry.npcs.map((npc) => [npc.npc_id, npc]));
  const enemyMap = Object.fromEntries(enemyRegistry.enemies.map((enemy) => [enemy.enemy_id, enemy]));
  const chapters = [];
  for (const entry of index.chapters) {
    const chapter = await readJson(path.join(ROOT, "private", "content", "data", normalizeDataFile(entry.file)));
    chapters.push(chapter);
  }

  await fs.mkdir(OUT_ROOT, { recursive: true });

  const masterAssets = [];
  const aliasMappings = [];
  const videoPromptsByPart = { P2: [], P3: [], P4: [] };
  const posterPromptsByPart = buildPresentationPosterObjects();
  const writtenPromptFiles = [];
  const writtenChapterManifestFiles = [];
  for (const chapter of chapters) {
    const assets = buildAssets(chapter, npcMap, enemyMap);
    const chapterAliases = buildAliasMappings(chapter, assets);
    const runtimeKeysByAsset = buildRuntimeKeysByAsset(chapterAliases);
    const chapterPart = partFromChapter(chapter.chapter_id);
    const ctx = {
      chapter,
      partId: chapterPart,
      part: PART_CONFIG[chapterPart],
      portraits: pickPortraits(chapter, npcMap, chapterPart),
      boss: pickBoss(chapter, enemyMap),
      runtimeKeysByAsset
    };
    const dir = path.join(OUT_ROOT, "chapters", chapterSlug(chapter));
    if (shouldWritePart(selectedParts, chapterPart)) {
      const chapterManifestPath = path.join(dir, "chapter_manifest.json");
      await writeJson(chapterManifestPath, buildChapterManifest(chapter, assets, runtimeKeysByAsset));
      writtenChapterManifestFiles.push(chapterManifestPath);
    }
    for (const asset of assets) {
      masterAssets.push({
        asset_id: asset.asset_id,
        chapter_id: asset.chapter_id,
        part_id: asset.part_id,
        asset_type: asset.asset_type,
        art_key_runtime: asset.art_key_runtime,
        art_key_final: asset.art_key_final,
        runtime_art_keys: runtimeKeysByAsset.get(asset.asset_id) ?? [asset.art_key_runtime],
        filename_target: asset.filename_target,
        ratio: asset.ratio,
        prompt_file: asset.prompt_file,
        sync_target_path: asset.sync_target_path,
        drop_inbox_path: asset.drop_inbox_path,
        sync_mode: asset.sync_mode,
        status: asset.status,
        source_refs: asset.source_refs,
        style_pack: asset.style_pack
      });
      if (shouldWritePart(selectedParts, chapterPart)) {
        const promptPath = path.join(ROOT, asset.prompt_path);
        await writeText(promptPath, buildPromptMarkdown(asset, ctx));
        writtenPromptFiles.push(promptPath);
      }
    }
    aliasMappings.push(...chapterAliases);

    if (VIDEO_PROMPT_PARTS.includes(chapterPart)) {
      videoPromptsByPart[chapterPart].push(createOpeningVideoPrompt(chapter, enemyMap));
    }
  }

  for (const partId of PRESENTATION_PARTS) {
    const pkg = PART_PRESENTATION_PACKAGES[partId];
    videoPromptsByPart[partId].push(...pkg.endings.map((ending) => createEndingVideoPrompt(partId, ending)));
    videoPromptsByPart[partId].push(createTrailerVideoPrompt(partId, pkg.trailer));
  }

  if (isFullRun) {
    await writeText(path.join(OUT_ROOT, "README.md"), buildReadme());
  }
  await writeText(path.join(OUT_ROOT, "master", "AUTO_SYNC_GUIDE.md"), buildAutoSyncGuide());
  await fs.rm(path.join(OUT_ROOT, "master", "SYNC_CHECKLIST.md"), { force: true });
  const partGuideParts = isFullRun ? Object.keys(PART_CONFIG) : [...selectedParts];
  await Promise.all(partGuideParts.map((partId) => writeText(path.join(OUT_ROOT, "part-guides", `${partId}.md`), buildPartGuide(partId))));
  await writeJson(path.join(OUT_ROOT, "master", "MASTER_ASSET_MANIFEST.json"), { version: PRESENTATION_PROMPT_VERSION, asset_count: masterAssets.length, assets: masterAssets });
  await writeJson(path.join(OUT_ROOT, "master", "RUNTIME_ART_KEY_ALIAS.json"), { version: PRESENTATION_PROMPT_VERSION, mapping_count: aliasMappings.length, mappings: aliasMappings });
  await writeJson(path.join(OUT_ROOT, "master", "STITCH_RENDER_QUEUE.json"), buildStitchRenderQueue(masterAssets, videoPromptsByPart));

  for (const partId of VIDEO_PROMPT_PARTS) {
    if (!shouldWritePart(selectedParts, partId)) {
      continue;
    }
    const dir = path.join(OUT_ROOT, VIDEO_PROMPT_DIR_BY_PART[partId]);
    const prompts = videoPromptsByPart[partId];
    await writeJson(path.join(dir, "manifest.json"), buildVideoManifest(partId, prompts));
    for (const prompt of prompts) {
      await writeJson(path.join(dir, prompt.file), prompt);
    }
  }

  for (const partId of PRESENTATION_PARTS) {
    if (!shouldWritePart(selectedParts, partId)) {
      continue;
    }
    const dir = path.join(OUT_ROOT, POSTER_PROMPT_DIR_BY_PART[partId]);
    const posters = posterPromptsByPart[partId];
    await writeJson(path.join(dir, "manifest.json"), buildPosterManifest(partId, posters));
    for (const poster of posters) {
      await writeText(path.join(dir, poster.file), buildPosterPromptMarkdown(partId, poster));
    }
  }

  if (isFullRun) {
    await writeJson(
      path.join(OUT_ROOT, "master", "PRESENTATION_PROMPT_MANIFEST.json"),
      buildPresentationManifest(videoPromptsByPart, posterPromptsByPart)
    );
    await writeJson(
      path.join(OUT_ROOT, "master", "PRESENTATION_RENDER_QUEUE.json"),
      buildPresentationRenderQueue(videoPromptsByPart, posterPromptsByPart)
    );
  }

  const artKeySet = new Set(masterAssets.map((asset) => asset.art_key_final));
  const fileSet = new Set(masterAssets.map((asset) => asset.filename_target));
  if (masterAssets.length !== 180) throw new Error(`expected 180 assets, got ${masterAssets.length}`);
  if (artKeySet.size !== masterAssets.length) throw new Error("art_key_final contains duplicates");
  if (fileSet.size !== masterAssets.length) throw new Error("filename_target contains duplicates");

  const expectedChapterCount = isFullRun
    ? chapters.length
    : chapters.filter((chapter) => shouldWritePart(selectedParts, partFromChapter(chapter.chapter_id))).length;
  for (const promptFile of writtenPromptFiles) {
    await fs.access(promptFile);
  }
  if (writtenPromptFiles.length !== expectedChapterCount * ASSET_LAYOUT.length) {
    throw new Error(`expected ${expectedChapterCount * ASSET_LAYOUT.length} prompt files, got ${writtenPromptFiles.length}`);
  }
  if (writtenChapterManifestFiles.length !== expectedChapterCount) {
    throw new Error(`chapter manifest count mismatch: ${writtenChapterManifestFiles.length}`);
  }
  if (isFullRun) {
    const videoPromptFiles = Object.values(videoPromptsByPart).reduce((count, entries) => count + entries.length, 0);
    if (videoPromptFiles !== 31) throw new Error(`expected 31 video prompts for P2~P4, got ${videoPromptFiles}`);
    const posterPromptFiles = Object.values(posterPromptsByPart).reduce((count, entries) => count + entries.length, 0);
    if (posterPromptFiles !== 9) throw new Error(`expected 9 poster prompts for P2~P4, got ${posterPromptFiles}`);
  }

  const runtimeCh0620 = chapters
    .filter((chapter) => Number(chapterNumber(chapter.chapter_id)) >= 6)
    .flatMap((chapter) => collectRuntimeArtKeys(chapter));
  const aliasSet = new Set(aliasMappings.map((mapping) => mapping.runtime_art_key));
  for (const runtimeArtKey of runtimeCh0620) {
    if (!aliasSet.has(runtimeArtKey)) throw new Error(`missing runtime alias for ${runtimeArtKey}`);
  }

  console.log(
    `generated asset prompt pack: scope=${isFullRun ? "ALL" : [...selectedParts].join(",")} assets=${masterAssets.length} prompts_written=${writtenPromptFiles.length}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

