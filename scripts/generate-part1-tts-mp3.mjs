import "dotenv/config";

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const chapterRoot = path.join(repoRoot, "private", "content", "data", "chapters");
const manifestPath = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-mp3", "manifest.json");
const chapterFiles = ["ch01.json", "ch02.json", "ch03.json", "ch04.json", "ch05.json"];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const model = "gpt-4o-mini-tts";
const responseFormat = "mp3";

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

const limit = Number(argValue("--limit", "0") ?? "0");

const voiceProfiles = {
  npc_yoon_haein: {
    voice: "shimmer",
    instructions: "Korean female emergency radio operator. Low, tense, controlled, close to a damaged radio channel.",
  },
  npc_han_somyeong: {
    voice: "onyx",
    instructions: "Korean field commander. Calm, practical, restrained, tired but reliable.",
  },
  npc_jung_noah: {
    voice: "echo",
    instructions: "Korean survivor broker. Dry, suspicious, quiet, streetwise.",
  },
  npc_ryu_seon: {
    voice: "verse",
    instructions: "Korean strategist. Sharp, composed, cold under pressure.",
  },
  npc_ahn_bogyeong: {
    voice: "ash",
    instructions: "Korean engineer. Exhausted, wounded, steady, practical.",
  },
  npc_kim_ara: {
    voice: "nova",
    instructions: "Young Korean analyst. Tense, fragile but firm.",
  },
  npc_seo_jinseo: {
    voice: "echo",
    instructions: "Korean field survivor. Cautious, quiet, alert.",
  },
  narrator: {
    voice: "alloy",
    instructions: "Natural Korean apocalypse web game narration. Tense, grounded, cinematic, no exaggeration.",
  },
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

function outputFor(chapterId, eventId) {
  return `public/generated/audio/tts/P1/${chapterId}/${eventId}.mp3`;
}

function absoluteOutput(publicOutput) {
  return path.join(repoRoot, publicOutput.replaceAll("/", path.sep));
}

function moodForEvent(event) {
  const type = String(event.event_type ?? "").toLowerCase();
  if (type.includes("boss") || type.includes("battle")) return "urgent";
  if (type.includes("result") || type.includes("extraction") || type.includes("ending")) return "exhausted";
  if (type.includes("briefing")) return "controlled";
  return "tense";
}

function speakerFromEvent(event, block) {
  return block?.speaker_id ?? event.npc_ids?.[0] ?? "narrator";
}

function firstSpeakable(chapter, event) {
  const blocks = event.text?.scene_blocks ?? [];
  const dialogue = blocks.find((block) => block.kind === "dialogue" && (block.lines ?? []).some((line) => normalizeText(line)));
  const system = blocks.find((block) => block.kind === "system" && (block.lines ?? []).some((line) => normalizeText(line)));
  const any = blocks.find((block) => (block.lines ?? []).some((line) => normalizeText(line)));
  const block = dialogue ?? system ?? any;
  const text = normalizeText((block?.lines ?? event.text?.body ?? [event.text?.summary ?? event.title ?? ""]).join(" "));
  return {
    chapter_id: chapter.chapter_id,
    chapter_title: chapter.title,
    event_id: event.event_id,
    event_title: event.title ?? "",
    speaker_id: speakerFromEvent(event, block),
    mood: moodForEvent(event),
    text,
    output: outputFor(chapter.chapter_id, event.event_id),
  };
}

function buildInstructions(item) {
  const profile = voiceProfiles[item.speaker_id] ?? voiceProfiles.narrator;
  return [
    profile.instructions,
    `Scene: Korean apocalypse web game, Part 1 ${item.chapter_id}, ${item.chapter_title}.`,
    `Mood: ${item.mood}.`,
    "Read the exact Korean input only.",
    "Do not add words, music, effects, laughter, English, or announcer-style framing.",
    "Keep pacing readable over low background music.",
  ].join(" ");
}

async function createSpeech(item, apiKey) {
  const profile = voiceProfiles[item.speaker_id] ?? voiceProfiles.narrator;
  const outputPath = absoluteOutput(item.output);
  await mkdir(path.dirname(outputPath), { recursive: true });

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice: profile.voice,
      input: item.text,
      instructions: buildInstructions(item),
      response_format: responseFormat,
      speed: 0.96,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    let message = errorBody;
    try {
      message = JSON.parse(errorBody)?.error?.message ?? errorBody;
    } catch {
      // Keep raw message.
    }
    throw new Error(`OpenAI API error (${response.status}) for ${item.event_id}: ${message}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
  return bytes.length;
}

async function collectItems() {
  const items = [];
  for (const chapterFile of chapterFiles) {
    const chapter = await readJson(path.join(chapterRoot, chapterFile));
    for (const event of chapter.events ?? []) {
      const item = firstSpeakable(chapter, event);
      if (item.text) items.push(item);
    }
  }
  return items;
}

async function main() {
  const items = await collectItems();
  const existing = [];
  const pending = [];

  for (const item of items) {
    if (!force && existsSync(absoluteOutput(item.output))) {
      existing.push({ ...item, status: "completed" });
    } else {
      pending.push({ ...item, status: "missing" });
    }
  }

  const targets = limit > 0 ? pending.slice(0, limit) : pending;
  const manifest = {
    version: 1,
    updated_at: new Date().toISOString(),
    model,
    response_format: responseFormat,
    total: items.length,
    completed: existing.length,
    pending: pending.length,
    generation_targets: targets.length,
    items: items.map((item) => ({
      ...item,
      status: existsSync(absoluteOutput(item.output)) ? "completed" : "missing",
      voice: (voiceProfiles[item.speaker_id] ?? voiceProfiles.narrator).voice,
    })),
  };

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({
    model,
    response_format: responseFormat,
    dry_run: dryRun,
    force,
    total: items.length,
    existing: existing.length,
    pending: pending.length,
    generation_targets: targets.length,
    manifest: path.relative(repoRoot, manifestPath),
  }, null, 2));

  for (const item of targets) {
    console.log(`${dryRun ? "[dry-run]" : "[generate]"} ${item.chapter_id}/${item.event_id} -> ${item.output}`);
    if (!dryRun) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is missing. Put it in .env first.");
      }
      const bytes = await createSpeech(item, apiKey);
      console.log(`[completed] ${item.event_id} (${bytes} bytes)`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
