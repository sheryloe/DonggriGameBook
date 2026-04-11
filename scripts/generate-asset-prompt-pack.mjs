import fs from "node:fs/promises";
import path from "node:path";
import {
  PART_PRESENTATION_PACKAGES,
  PRESENTATION_PARTS,
  PRESENTATION_POSTER_DIR_BY_PART,
  PRESENTATION_PROMPT_VERSION
} from "./presentation-package-data.mjs";

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, "docs", "asset-prompt-pack");
const NEGATIVE_PROMPT = [
  "no superhero pose",
  "no cyberpunk neon city",
  "no glossy sci-fi armor",
  "no recognizable brands",
  "no excessive gore",
  "no anime proportions"
].join(", ");

const ASSET_LAYOUT = [
  { key: "bg_primary", asset_type: "background", folder: "background", file: "bg_primary.md", ratio: "16:10", sync_target_path: "codex_webgame_pack/img/bg/" },
  { key: "bg_secondary", asset_type: "background", folder: "background", file: "bg_secondary.md", ratio: "16:10", sync_target_path: "codex_webgame_pack/img/bg/" },
  { key: "portrait_anchor", asset_type: "portrait", folder: "portrait", file: "portrait_anchor.md", ratio: "4:5", sync_target_path: "codex_webgame_pack/img/portrait/" },
  { key: "portrait_support", asset_type: "portrait", folder: "portrait", file: "portrait_support.md", ratio: "4:5", sync_target_path: "codex_webgame_pack/img/portrait/" },
  { key: "threat_signature", asset_type: "threat", folder: "threat", file: "threat_signature.md", ratio: "4:5", sync_target_path: "codex_webgame_pack/img/threat/" },
  { key: "poster_keyart", asset_type: "poster", folder: "poster", file: "poster_keyart.md", ratio: "4:5", sync_target_path: "codex_webgame_pack/img/poster/" },
  { key: "teaser_frame_01", asset_type: "teaser", folder: "teaser", file: "teaser_frame_01.md", ratio: "16:9", sync_target_path: "codex_webgame_pack/img/teaser/" },
  { key: "teaser_frame_02", asset_type: "teaser", folder: "teaser", file: "teaser_frame_02.md", ratio: "16:9", sync_target_path: "codex_webgame_pack/img/teaser/" },
  { key: "teaser_frame_03", asset_type: "teaser", folder: "teaser", file: "teaser_frame_03.md", ratio: "16:9", sync_target_path: "codex_webgame_pack/img/teaser/" }
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
    tone: "checkpoint pursuit, diesel smoke, official line versus detour line, compressing corridors",
    palette: "red warning lane, sodium orange, damp concrete gray, dirty white",
    materials: "barricade plastic, diesel grime, wet asphalt, queue cards",
    camera: "medium lens, forward pressure, linear escape framing",
    must_include: ["checkpoint corridor", "red warning lane", "diesel smoke", "crowd pressure"],
    avoid: ["spacious heroic skyline", "fashion editorial posing"],
    composition: "narrow route, converging lines, survival bottleneck",
    negative_prompt: NEGATIVE_PROMPT
  },
  P3: {
    name: "Cold Quarantine Line",
    tone: "radio mast, cold storage, sea fog, archival realism, delayed guilt",
    palette: "cold blue, frosted white, oxidized steel, low-saturation navy",
    materials: "frost, salt film, rail steel, paper records, emergency tarp",
    camera: "wider negative space, slower pans, distance before impact",
    must_include: ["radio mast", "cold storage", "sea fog", "archival realism", "wider negative space"],
    avoid: ["warm blockbuster palette", "glossy futuristic tech"],
    composition: "breathing room, isolated figures, frozen infrastructure",
    negative_prompt: NEGATIVE_PROMPT
  },
  P4: {
    name: "Outer Sea Moral Gate",
    tone: "salt station, public allocation hall, broadcast equipment, handwritten boarding lists, moral pressure",
    palette: "salt gray, dawn blue, weathered cream paper, signal green LED",
    materials: "salt-stained concrete, rope fiber, queue boards, old speakers",
    camera: "public-facing staging, heavier symmetry, final-decision weight",
    must_include: ["salt station", "public allocation hall", "broadcast equipment", "handwritten boarding lists", "moral pressure"],
    avoid: ["victory poster energy", "flashy neon spectacle"],
    composition: "public judgement, one dominant silhouette, civic ritual tension",
    negative_prompt: NEGATIVE_PROMPT
  }
};

const SAFE_FALLBACK_NPCS = {
  P1: ["npc_yoon_haein", "npc_jung_noah"],
  P2: ["npc_jung_noah", "npc_seo_jinseo"],
  P3: ["npc_nam_suryeon", "npc_ryu_seon"],
  P4: ["npc_yoon_haein", "npc_kim_ara"]
};

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
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
const VIDEO_PROMPT_PARTS = ["P2", "P3", "P4"];
const VIDEO_PROMPT_DIR_BY_PART = {
  P2: "part2-video-prompts",
  P3: "part3-video-prompts",
  P4: "part4-video-prompts"
};
const POSTER_PROMPT_DIR_BY_PART = PRESENTATION_POSTER_DIR_BY_PART;

const partNo = (partId) => partId.replace("P", "");

function createOpeningVideoPrompt(chapter, enemyMap) {
  const partId = partFromChapter(chapter.chapter_id);
  const chapterNo = chapterNumber(chapter.chapter_id);
  const firstEvent = chapter.events[0];
  const firstMusic = firstEvent?.presentation?.music_key ?? `${partId.toLowerCase()}_opening`;
  const sourceArtKey =
    collectRuntimeArtKeys(chapter).find((key) => key.includes("_entry")) ??
    firstEvent?.presentation?.art_key ??
    `pending_${chapter.chapter_id.toLowerCase()}_opening`;
  const boss = pickBoss(chapter, enemyMap);
  const file = `P${partNo(partId)}_${chapter.chapter_id}_OPENING.json`;
  const videoId = `P${partNo(partId)}_${chapter.chapter_id}_OPENING`;
  const sceneId = `${chapter.chapter_id}_OPENING_${slug(chapter.ui_profile.theme).toUpperCase()}`;
  const targetVideoPath = `public/generated/videos/${videoId}.mp4`;
  const targetPosterPath = `public/generated/images/${sourceArtKey}.webp`;
  const promptEn = [
    `Cinematic Korean apocalypse opening for ${chapter.chapter_id} ${chapter.title}.`,
    `${PART_CONFIG[partId].tone}.`,
    `Location mood: ${chapter.nodes.map((node) => node.name).slice(0, 3).join(", ")}.`,
    `Show route pressure, practical survival gear, and incoming threat ${boss.bossName}.`,
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
    prompt_ko_context:
      firstEvent?.text?.summary ?? `${chapter.chapter_id} 오프닝. ${chapter.role}.`,
    camera_notes: `${PART_CONFIG[partId].camera}. Start wide, move into corridor pressure, end on route decision beat.`,
    audio_notes: `Base cue ${firstMusic}. Layer alarm pulses, crowd pressure ambience, and metallic reverb.`,
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
    prompt_ko_context: ending.prompt_ko_context,
    camera_notes: ending.camera_notes,
    audio_notes: ending.audio_notes,
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
    prompt_ko_context: trailer.prompt_ko_context,
    camera_notes: trailer.camera_notes,
    audio_notes: trailer.audio_notes,
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

## English Prompt
\`\`\`text
${poster.prompt_en}
\`\`\`

## Korean Context
${poster.prompt_ko_context}

## Negative Prompt
\`\`\`text
${PART_CONFIG[partId].negative_prompt}
\`\`\`

## Composition Notes
${poster.composition_notes}
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
        file: `docs/asset-prompt-pack/${VIDEO_PROMPT_DIR_BY_PART[partId]}/${prompt.file}`,
        target_path: prompt.target_video_path
      });
    }
    for (const poster of posterPromptsByPart[partId]) {
      entries.push({
        part_id: partId,
        type: "poster",
        id: poster.poster_id,
        file: `docs/asset-prompt-pack/${POSTER_PROMPT_DIR_BY_PART[partId]}/${poster.file}`,
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
        prompt_file: `docs/asset-prompt-pack/${VIDEO_PROMPT_DIR_BY_PART[partId]}/${prompt.file}`,
        target_path: prompt.target_video_path
      });
    }
    for (const poster of posterPromptsByPart[partId]) {
      tasks.push({
        task_id: `presentation-poster:${poster.poster_id}`,
        kind: "image",
        part_id: partId,
        prompt_file: `docs/asset-prompt-pack/${POSTER_PROMPT_DIR_BY_PART[partId]}/${poster.file}`,
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
    .filter((asset) => VIDEO_PROMPT_PARTS.includes(asset.part_id))
    .map((asset) => ({
      task_id: `img:${asset.art_key_final}`,
      kind: "image",
      part_id: asset.part_id,
      chapter_id: asset.chapter_id,
      prompt_file: asset.prompt_file,
      target_path: `${asset.sync_target_path}${asset.filename_target}`,
      stitch_space: `donggrol_${asset.part_id.toLowerCase()}_images`
    }));
  const videoTasks = Object.entries(videoPromptsByPart).flatMap(([partId, prompts]) =>
    prompts.map((prompt) => ({
      task_id: `video:${prompt.video_id}`,
      kind: "video",
      part_id: partId,
      chapter_id: prompt.chapter_id,
      prompt_file: `docs/asset-prompt-pack/${VIDEO_PROMPT_DIR_BY_PART[partId]}/${prompt.file}`,
      target_path: prompt.target_video_path,
      stitch_space: `donggrol_${partId.toLowerCase()}_videos`
    }))
  );

  return {
    version: "1.0.0",
    image_task_count: imageTasks.length,
    video_task_count: videoTasks.length,
    tasks: [...imageTasks, ...videoTasks]
  };
}

function collectRuntimeArtKeys(chapter) {
  return unique(chapter.events.map((event) => event.presentation?.art_key));
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
    `codex_webgame_pack/data/chapters/${slug(chapter.chapter_id)}.json`,
    `ui/${slug(chapter.chapter_id)}.ui_flow.json`,
    `docs/world/story-bible/chapters/CHAPTER_BLUEPRINT_${chapter.chapter_id}.md`,
    `docs/world/story-bible/PART_BIBLE_${partId}.md`
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
  const arts = collectRuntimeArtKeys(chapter);
  const backgrounds = arts.filter((key) => key.startsWith("bg_") || /_(entry|route|anchor|side_a|side_b)$/.test(key));
  const portraitsRuntime = arts.filter((key) => key.startsWith("portrait_") || key === portraits.anchorId || key === portraits.supportId);
  const threat = arts.find((key) => key.startsWith("boss_") || key.endsWith("_boss")) ?? arts.at(-1);
  return {
    all: arts,
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
- filename_target: ${asset.filename_target}
- sync_target_path: ${asset.sync_target_path}

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
    bg_primary: runtime.bgPrimary,
    bg_secondary: runtime.bgSecondary,
    portrait_anchor: runtime.portraitAnchor,
    portrait_support: runtime.portraitSupport,
    threat_signature: runtime.threat,
    poster_keyart: `pending:${artKeys.poster_keyart}`,
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
      prompt_path: `docs/asset-prompt-pack/chapters/${dir}/${layout.folder}/${layout.file}`,
      prompt_file: `docs/asset-prompt-pack/chapters/${dir}/${layout.folder}/${layout.file}`,
      sync_target_path: layout.sync_target_path,
      status: "prompt_ready",
      source_refs: refs,
      style_pack: `${partId}.${chapter.ui_profile.theme}`
    };
  });
}

function buildAliasMappings(chapter, assets) {
  const assetByKind = Object.fromEntries(assets.map((asset) => [asset.kind, asset]));
  return collectRuntimeArtKeys(chapter).map((runtimeArtKey) => {
    let target = assetByKind.bg_primary;
    if (runtimeArtKey.startsWith("portrait_") || runtimeArtKey.startsWith("npc_")) {
      target = runtimeArtKey === assetByKind.portrait_anchor.art_key_runtime ? assetByKind.portrait_anchor : assetByKind.portrait_support;
    } else if (runtimeArtKey.startsWith("boss_") || runtimeArtKey.endsWith("_boss")) {
      target = assetByKind.threat_signature;
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
}

function buildChapterManifest(chapter, assets) {
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
      filename_target: asset.filename_target,
      ratio: asset.ratio,
      prompt_path: asset.prompt_path,
      source_doc_refs: asset.source_refs,
      sync_target_path: asset.sync_target_path
    }))
  };
}

function buildReadme() {
  return `# Asset Prompt Pack

## 목적
- ` + "`CH01~CH20`" + ` 전체 이미지를 웹 GPT에서 바로 생성할 수 있게 프롬프트를 챕터 단위로 정리한다.
- 실제 산출물은 나중에 ` + "`codex_webgame_pack/img/*`" + `로 동기화하고, 이 폴더는 프롬프트와 매니페스트만 관리한다.

## 구조
\`\`\`text
docs/asset-prompt-pack/
  README.md
  master/
    MASTER_ASSET_MANIFEST.json
    RUNTIME_ART_KEY_ALIAS.json
    STITCH_RENDER_QUEUE.json
    SYNC_CHECKLIST.md
  part-guides/
    P1.md
    P2.md
    P3.md
    P4.md
  chapters/
    CH01_*/
      chapter_manifest.json
      background/
      portrait/
      threat/
      poster/
      teaser/
  part2-video-prompts/
    manifest.json
    P2_CH06_OPENING.json ... P2_CH10_OPENING.json
  part3-video-prompts/
    manifest.json
    P3_CH11_OPENING.json ... P3_CH15_OPENING.json
  part4-video-prompts/
    manifest.json
    P4_CH16_OPENING.json ... P4_CH20_OPENING.json
\`\`\`

## 생성 순서
1. part guide를 읽고 파트 분위기를 잠근다.
2. chapter manifest를 보고 챕터별 9개 자산을 확인한다.
3. 각 프롬프트 파일의 English Prompt를 웹 GPT에 넣어 이미지를 생성한다.
4. 결과 파일명을 ` + "`filename_target`" + `에 맞춰 저장한다.
5. 검수 후 ` + "`codex_webgame_pack/img/*`" + `로 동기화한다.

## 동기화 규칙
- 배경: ` + "`codex_webgame_pack/img/bg/`" + `
- 인물: ` + "`codex_webgame_pack/img/portrait/`" + `
- 위협: ` + "`codex_webgame_pack/img/threat/`" + `
- 포스터: ` + "`codex_webgame_pack/img/poster/`" + `
- 티저 프레임: ` + "`codex_webgame_pack/img/teaser/`" + `
- ` + "`art_key_final`" + `과 ` + "`filename_target`" + `을 임의로 바꾸지 않는다.

## 비율 규칙
- background: ` + "`16:10`" + `
- portrait: ` + "`4:5`" + `
- threat: ` + "`4:5`" + `
- poster: ` + "`4:5`" + `
- teaser: ` + "`16:9`" + `
- opening video: ` + "`16:9`" + `
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

## Must Include
${part.must_include.map((item) => `- ${item}`).join("\n")}

## Avoid
${part.avoid.map((item) => `- ${item}`).join("\n")}

## Composition
- ${part.composition}
- 배경은 인프라와 생존 행정 흔적을 같이 보여준다.
- 인물은 옷과 표정으로 역할이 먼저 읽혀야 한다.
- 위협은 장소 적응형 감염체라는 사실이 보여야 한다.
- 포스터는 갈등 + 장소 + 주 실루엣을 한 프레임에 넣는다.
- 티저 프레임은 진입 -> 압박 -> 클라이맥스 직전 순서로 간다.

## Common Negative Prompt
\`\`\`text
${part.negative_prompt}
\`\`\`
`;
}

function buildSyncChecklist() {
  return `# Sync Checklist

- [ ] 프롬프트 파일 180개 생성 완료
- [ ] 웹 GPT 생성 완료
- [ ] 1차 검수 완료
- [ ] 비율/크롭 보정 완료
- [ ] 파일명 ` + "`filename_target`" + ` 기준으로 확정
- [ ] ` + "`codex_webgame_pack/img/bg`" + ` 복사 완료
- [ ] ` + "`codex_webgame_pack/img/portrait`" + ` 복사 완료
- [ ] ` + "`codex_webgame_pack/img/threat`" + ` 복사 완료
- [ ] ` + "`codex_webgame_pack/img/poster`" + ` 복사 완료
- [ ] ` + "`codex_webgame_pack/img/teaser`" + ` 복사 완료
- [ ] 런타임 매핑 반영 전 ` + "`RUNTIME_ART_KEY_ALIAS.json`" + ` 재검토 완료
`;
}

async function main() {
  const index = await readJson(path.join(ROOT, "codex_webgame_pack", "data", "chapters.index.json"));
  const npcRegistry = await readJson(path.join(ROOT, "codex_webgame_pack", "data", "npc.registry.json"));
  const enemyRegistry = await readJson(path.join(ROOT, "codex_webgame_pack", "data", "enemy.registry.json"));
  const npcMap = Object.fromEntries(npcRegistry.npcs.map((npc) => [npc.npc_id, npc]));
  const enemyMap = Object.fromEntries(enemyRegistry.enemies.map((enemy) => [enemy.enemy_id, enemy]));
  const chapters = [];
  for (const entry of index.chapters) {
    const chapter = await readJson(path.join(ROOT, "codex_webgame_pack", entry.file));
    chapters.push(chapter);
  }

  await fs.mkdir(OUT_ROOT, { recursive: true });

  const masterAssets = [];
  const aliasMappings = [];
  const videoPromptsByPart = { P2: [], P3: [], P4: [] };
  const posterPromptsByPart = buildPresentationPosterObjects();
  for (const chapter of chapters) {
    const assets = buildAssets(chapter, npcMap, enemyMap);
    const ctx = {
      chapter,
      partId: partFromChapter(chapter.chapter_id),
      part: PART_CONFIG[partFromChapter(chapter.chapter_id)],
      portraits: pickPortraits(chapter, npcMap, partFromChapter(chapter.chapter_id)),
      boss: pickBoss(chapter, enemyMap)
    };
    const dir = path.join(OUT_ROOT, "chapters", chapterSlug(chapter));
    await writeJson(path.join(dir, "chapter_manifest.json"), buildChapterManifest(chapter, assets));
    for (const asset of assets) {
      masterAssets.push({
        asset_id: asset.asset_id,
        chapter_id: asset.chapter_id,
        part_id: asset.part_id,
        asset_type: asset.asset_type,
        art_key_runtime: asset.art_key_runtime,
        art_key_final: asset.art_key_final,
        filename_target: asset.filename_target,
        ratio: asset.ratio,
        prompt_file: asset.prompt_file,
        sync_target_path: asset.sync_target_path,
        status: asset.status,
        source_refs: asset.source_refs,
        style_pack: asset.style_pack
      });
      await writeText(path.join(ROOT, asset.prompt_path), buildPromptMarkdown(asset, ctx));
    }
    aliasMappings.push(...buildAliasMappings(chapter, assets));

    const chapterPart = partFromChapter(chapter.chapter_id);
    if (VIDEO_PROMPT_PARTS.includes(chapterPart)) {
      videoPromptsByPart[chapterPart].push(createOpeningVideoPrompt(chapter, enemyMap));
    }
  }

  for (const partId of PRESENTATION_PARTS) {
    const pkg = PART_PRESENTATION_PACKAGES[partId];
    videoPromptsByPart[partId].push(...pkg.endings.map((ending) => createEndingVideoPrompt(partId, ending)));
    videoPromptsByPart[partId].push(createTrailerVideoPrompt(partId, pkg.trailer));
  }

  await writeText(path.join(OUT_ROOT, "README.md"), buildReadme());
  await writeText(path.join(OUT_ROOT, "master", "SYNC_CHECKLIST.md"), buildSyncChecklist());
  await Promise.all(Object.keys(PART_CONFIG).map((partId) => writeText(path.join(OUT_ROOT, "part-guides", `${partId}.md`), buildPartGuide(partId))));
  await writeJson(path.join(OUT_ROOT, "master", "MASTER_ASSET_MANIFEST.json"), { version: PRESENTATION_PROMPT_VERSION, asset_count: masterAssets.length, assets: masterAssets });
  await writeJson(path.join(OUT_ROOT, "master", "RUNTIME_ART_KEY_ALIAS.json"), { version: PRESENTATION_PROMPT_VERSION, mapping_count: aliasMappings.length, mappings: aliasMappings });
  await writeJson(path.join(OUT_ROOT, "master", "STITCH_RENDER_QUEUE.json"), buildStitchRenderQueue(masterAssets, videoPromptsByPart));

  for (const partId of VIDEO_PROMPT_PARTS) {
    const dir = path.join(OUT_ROOT, VIDEO_PROMPT_DIR_BY_PART[partId]);
    const prompts = videoPromptsByPart[partId];
    await writeJson(path.join(dir, "manifest.json"), buildVideoManifest(partId, prompts));
    for (const prompt of prompts) {
      await writeJson(path.join(dir, prompt.file), prompt);
    }
  }

  for (const partId of PRESENTATION_PARTS) {
    const dir = path.join(OUT_ROOT, POSTER_PROMPT_DIR_BY_PART[partId]);
    const posters = posterPromptsByPart[partId];
    await writeJson(path.join(dir, "manifest.json"), buildPosterManifest(partId, posters));
    for (const poster of posters) {
      await writeText(path.join(dir, poster.file), buildPosterPromptMarkdown(partId, poster));
    }
  }

  await writeJson(
    path.join(OUT_ROOT, "master", "PRESENTATION_PROMPT_MANIFEST.json"),
    buildPresentationManifest(videoPromptsByPart, posterPromptsByPart)
  );
  await writeJson(
    path.join(OUT_ROOT, "master", "PRESENTATION_RENDER_QUEUE.json"),
    buildPresentationRenderQueue(videoPromptsByPart, posterPromptsByPart)
  );

  const artKeySet = new Set(masterAssets.map((asset) => asset.art_key_final));
  const fileSet = new Set(masterAssets.map((asset) => asset.filename_target));
  if (masterAssets.length !== 180) throw new Error(`expected 180 assets, got ${masterAssets.length}`);
  if (artKeySet.size !== masterAssets.length) throw new Error("art_key_final contains duplicates");
  if (fileSet.size !== masterAssets.length) throw new Error("filename_target contains duplicates");

  const promptFiles = [];
  for (const chapter of chapters) {
    const folder = path.join(OUT_ROOT, "chapters", chapterSlug(chapter));
    for (const asset of ASSET_LAYOUT) {
      const file = path.join(folder, asset.folder, asset.file);
      await fs.access(file);
      promptFiles.push(file);
    }
  }
  if (promptFiles.length !== 180) throw new Error(`expected 180 prompt files, got ${promptFiles.length}`);
  const videoPromptFiles = Object.values(videoPromptsByPart).reduce((count, entries) => count + entries.length, 0);
  if (videoPromptFiles !== 31) throw new Error(`expected 31 video prompts for P2~P4, got ${videoPromptFiles}`);
  const posterPromptFiles = Object.values(posterPromptsByPart).reduce((count, entries) => count + entries.length, 0);
  if (posterPromptFiles !== 9) throw new Error(`expected 9 poster prompts for P2~P4, got ${posterPromptFiles}`);

  const runtimeCh0620 = chapters
    .filter((chapter) => Number(chapterNumber(chapter.chapter_id)) >= 6)
    .flatMap((chapter) => collectRuntimeArtKeys(chapter));
  const aliasSet = new Set(aliasMappings.map((mapping) => mapping.runtime_art_key));
  for (const runtimeArtKey of runtimeCh0620) {
    if (!aliasSet.has(runtimeArtKey)) throw new Error(`missing runtime alias for ${runtimeArtKey}`);
  }

  console.log(
    `generated asset prompt pack: ${masterAssets.length} assets, ${promptFiles.length} image prompts, ${videoPromptFiles} video prompts, ${posterPromptFiles} poster prompts`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
