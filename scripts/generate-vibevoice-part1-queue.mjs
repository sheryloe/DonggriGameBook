import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const chapterRoot = path.join(repoRoot, "private", "content", "data", "chapters");
const profilePath = path.join(repoRoot, "tools", "vibevoice", "speaker-profiles.json");
const queueDir = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-vibevoice");
const queuePath = path.join(queueDir, "queue.json");
const chapterFiles = ["ch01.json", "ch02.json", "ch03.json", "ch04.json", "ch05.json"];
const providers = [
  {
    provider: "vibevoice-realtime-0.5b",
    model: "microsoft/VibeVoice-Realtime-0.5B",
  },
  {
    provider: "vibevoice-1.5b",
    model: "microsoft/VibeVoice-1.5B",
    unavailable_reason: "Official VibeVoice checkout does not provide a stable 1.5B file inference entrypoint.",
  },
];

const args = process.argv.slice(2);
const force = args.includes("--force");

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const profileVersion = Number(argValue("--profile-version", "1"));
if (!Number.isInteger(profileVersion) || profileVersion < 1) {
  throw new Error("--profile-version must be a positive integer.");
}

const sceneProfiles = {
  CH01: {
    scene_profile: "dead_broadcast_lobby",
    postprocess_profile: "ch01_broadcast_radio",
    description: "Dead broadcast station, handheld radio, ash-gray lobby.",
  },
  CH02: {
    scene_profile: "black_waterway_market",
    postprocess_profile: "ch02_wet_waterway",
    description: "Black waterway, wet market, sluice reflections.",
  },
  CH03: {
    scene_profile: "glass_highrise_garden",
    postprocess_profile: "ch03_glass_wind",
    description: "Glass garden, high-rise wind, unstable power.",
  },
  CH04: {
    scene_profile: "cold_logistics_center",
    postprocess_profile: "ch04_metal_cold",
    description: "Logistics center, boxes, cold rail and metal mids.",
  },
  CH05: {
    scene_profile: "isolated_server_mirror_center",
    postprocess_profile: "ch05_server_isolation",
    description: "Mirror center, server room cooling, isolated pressure.",
  },
};

const pressureByEventType = {
  briefing: "clarity",
  dialogue: "clarity",
  choice: "field",
  exploration: "field",
  scene: "field",
  danger: "frontline",
  combat: "frontline",
  boss: "frontline",
  extraction: "extraction",
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\[[^\]]+\]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 900);
}

async function readJson(file) {
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

function firstSpeakable(event) {
  const blocks = event.text?.scene_blocks ?? [];
  const dialogue = blocks.find((block) => block.kind === "dialogue" && (block.lines ?? []).some((line) => normalizeText(line)));
  const system = blocks.find((block) => block.kind === "system" && (block.lines ?? []).some((line) => normalizeText(line)));
  const any = blocks.find((block) => (block.lines ?? []).some((line) => normalizeText(line)));
  const block = dialogue ?? system ?? any;
  const text = normalizeText((block?.lines ?? event.text?.body ?? [event.text?.summary ?? event.title ?? ""]).join(" "));
  return {
    speaker_id: block?.speaker_id ?? event.npc_ids?.[0] ?? "narrator",
    text,
  };
}

function outputPaths(provider, chapterId, eventId) {
  return {
    input_txt: `private/generated/audio/tts-source/P1/${chapterId}/${provider}/${eventId}.txt`,
    wav_output: `private/generated/audio/tts-source/P1/${chapterId}/${provider}/${eventId}.wav`,
    audition_mp3_output: `public/generated/audio/tts-audition/P1/${chapterId}/${provider}/${eventId}.mp3`,
    runtime_mp3_output: `public/generated/audio/tts/P1/${chapterId}/${eventId}.mp3`,
  };
}

function pressureProfile(eventType) {
  return pressureByEventType[eventType] ?? "field";
}

function byChapter(items) {
  return Object.fromEntries(
    chapterFiles.map((file) => {
      const chapterId = file.replace(".json", "").toUpperCase();
      const chapterItems = items.filter((item) => item.chapter_id === chapterId && item.provider === "vibevoice-realtime-0.5b");
      return [
        chapterId,
        {
          events: new Set(chapterItems.map((item) => item.event_id)).size,
          realtime_queue_items: chapterItems.length,
          profile_version: profileVersion,
          scene_profile: sceneProfiles[chapterId].scene_profile,
          postprocess_profile: sceneProfiles[chapterId].postprocess_profile,
        },
      ];
    }),
  );
}

function markdown(manifest) {
  return [
    "# VibeVoice Part 1 Queue",
    "",
    "- Runtime files are not overwritten by generation.",
    "- Full runtime approval requires `--chapter=all --approve --confirm=part1-full-vibevoice`.",
    "- Realtime 0.5B is the production provider for Part 1.",
    "- VibeVoice input text is kept as `Speaker 1: <dialogue>` only; scene tone is applied by post-processing.",
    "- `vibevoice-1.5b` remains unavailable until the official checkout exposes a stable file inference path.",
    "",
    "```powershell",
    "Set-Location D:\\Donggri_Platform\\DonggrolGameBook",
    "npm run vibevoice:generate:part1 -- --provider=vibevoice-realtime-0.5b --chapter=CH01 --force --batch-size=38",
    "npm run vibevoice:audit:part1",
    "```",
    "",
    `Profile version: ${manifest.profile_version}`,
    `Total events: ${manifest.summary.total_events}`,
    `Total queue items: ${manifest.summary.total_queue_items}`,
    "",
  ].join("\n");
}

async function main() {
  if (existsSync(queuePath) && !force) {
    throw new Error(`Queue already exists. Re-run with --force to replace it: ${path.relative(repoRoot, queuePath)}`);
  }

  const profiles = await readJson(profilePath);
  const items = [];

  for (const chapterFile of chapterFiles) {
    const chapter = await readJson(path.join(chapterRoot, chapterFile));
    const scene = sceneProfiles[chapter.chapter_id];
    if (!scene) throw new Error(`No scene profile configured for ${chapter.chapter_id}`);

    for (const event of chapter.events ?? []) {
      const speakable = firstSpeakable(event);
      if (!speakable.text) continue;

      const profile = profiles.speakers?.[speakable.speaker_id] ?? profiles.default;
      for (const provider of providers) {
        const unavailable = provider.provider === "vibevoice-1.5b";
        items.push({
          id: `VV-P1-${chapter.chapter_id}-${event.event_id}`,
          part_id: "P1",
          chapter_id: chapter.chapter_id,
          chapter_title: chapter.title ?? chapter.chapter_id,
          event_id: event.event_id,
          event_title: event.title ?? "",
          event_type: event.event_type ?? "scene",
          speaker_id: speakable.speaker_id,
          speaker_name: profile.speaker_name,
          gender: profile.gender,
          style: profile.style,
          realtime_voice_preset: profile.realtime_voice_preset,
          text: speakable.text,
          provider: provider.provider,
          model: provider.model,
          status: unavailable ? "unavailable" : "missing",
          profile_version: profileVersion,
          scene_profile: scene.scene_profile,
          scene_profile_description: scene.description,
          pressure_profile: pressureProfile(event.event_type),
          postprocess_profile: scene.postprocess_profile,
          last_error: unavailable ? provider.unavailable_reason : null,
          checked_at: unavailable ? new Date().toISOString() : undefined,
          ...outputPaths(provider.provider, chapter.chapter_id, event.event_id),
        });
      }
    }
  }

  const manifest = {
    version: 2,
    profile_version: profileVersion,
    updated_at: new Date().toISOString(),
    policy: {
      runtime_overwrite_requires_approve: true,
      full_runtime_approve_confirm: "part1-full-vibevoice",
      runtime_path_pattern: "public/generated/audio/tts/P1/<CHAPTER>/<EVENT_ID>.mp3",
      audition_path_pattern: "public/generated/audio/tts-audition/P1/<CHAPTER>/<PROVIDER>/<EVENT_ID>.mp3",
      source_path_pattern: "private/generated/audio/tts-source/P1/<CHAPTER>/<PROVIDER>/<EVENT_ID>.wav",
      prompt_policy: "Only actual speakable text is written to VibeVoice input files.",
    },
    providers,
    scene_profiles: sceneProfiles,
    pressure_profiles: {
      clarity: "Briefing/dialogue: light compression, intelligibility first.",
      field: "Choice/exploration/scene: chapter field tone.",
      frontline: "Danger/combat/boss: stronger compression, more forward placement.",
      extraction: "Extraction: slightly softened highs and stable loudness.",
    },
    summary: {
      source_chapters: chapterFiles.length,
      total_events: items.filter((item) => item.provider === "vibevoice-realtime-0.5b").length,
      total_queue_items: items.length,
      by_chapter: byChapter(items),
    },
    items,
  };

  await mkdir(queueDir, { recursive: true });
  await writeFile(queuePath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(queueDir, "README.md"), markdown(manifest), "utf8");
  console.log(JSON.stringify({ queue: path.relative(repoRoot, queuePath), summary: manifest.summary }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
