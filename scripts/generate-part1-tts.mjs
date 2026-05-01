import "dotenv/config";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const queuePath = path.join(repoRoot, "private/prompts/media-production/part1/PART1_AUDIO_PRODUCTION_QUEUE.json");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const model = "gpt-4o-mini-tts";
const responseFormat = "wav";

const voiceProfiles = {
  "윤해인": {
    voice: "shimmer",
    instructions:
      "Korean female emergency radio operator. Low, tense, controlled, close to a damaged radio channel. No acting exaggeration.",
  },
  "한소명": {
    voice: "onyx",
    instructions:
      "Korean field commander. Calm, practical, restrained, tired but reliable. Natural speech, no theatrical delivery.",
  },
  "정노아": {
    voice: "echo",
    instructions:
      "Korean survivor broker. Dry, suspicious, quiet, streetwise. Speak like every word is being weighed.",
  },
  "류세온": {
    voice: "verse",
    instructions:
      "Korean strategist. Sharp, composed, cold under pressure. Clean diction, controlled urgency.",
  },
  "안보경": {
    voice: "ash",
    instructions:
      "Korean engineer. Exhausted, wounded, steady, practical. Low volume with restrained anxiety.",
  },
  "김아라": {
    voice: "nova",
    instructions:
      "Young Korean analyst. Tense, fragile but firm. Quiet urgency, not cute, not overly emotional.",
  },
};

function toAbsoluteOutput(output) {
  return path.join(repoRoot, output.replaceAll("/", path.sep));
}

function publicPath(output) {
  return `/${output.replace(/^public[\\/]/u, "").replaceAll("\\", "/")}`;
}

function buildInstructions(item) {
  const profile = voiceProfiles[item.speaker] ?? {
    voice: "alloy",
    instructions: "Natural Korean web game narration. Tense, grounded, cinematic, no exaggeration.",
  };

  return {
    voice: profile.voice,
    instructions: [
      profile.instructions,
      `Character: ${item.speaker}.`,
      `Context hint: ${item.voice_hint ?? "Korean apocalypse web game dialogue"}.`,
      "Read the exact Korean input only.",
      "Do not add words, music, effects, laughter, English, or announcer-style framing.",
      "Keep the pacing intimate and readable over low background music.",
    ].join(" "),
  };
}

async function loadQueue() {
  const raw = await readFile(queuePath, "utf8");
  return JSON.parse(raw);
}

async function createSpeech(item, apiKey) {
  const { voice, instructions } = buildInstructions(item);
  const outputPath = toAbsoluteOutput(item.output);
  await mkdir(path.dirname(outputPath), { recursive: true });

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input: item.text,
      instructions,
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
      // Keep raw body when OpenAI returns non-JSON text.
    }
    throw new Error(`OpenAI API error (${response.status}) for ${item.id}: ${message}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, bytes);
  return { outputPath, bytes: bytes.length, publicUrl: publicPath(item.output) };
}

function printItem(prefix, item) {
  const { voice } = buildInstructions(item);
  console.log(`${prefix} ${item.id} | ${item.chapter_id} | ${item.event_id} | ${item.speaker} | voice=${voice}`);
  console.log(`    ${item.text}`);
  console.log(`    -> ${item.output}`);
}

async function main() {
  const queue = await loadQueue();
  const ttsItems = queue.items.filter((item) => item.type === "tts" && (force || item.status === "missing"));
  const existing = [];
  const pending = [];

  for (const item of ttsItems) {
    const outputPath = toAbsoluteOutput(item.output);
    if (!force && existsSync(outputPath)) {
      existing.push(item);
    } else {
      pending.push(item);
    }
  }

  console.log(
    JSON.stringify(
      {
        model,
        response_format: responseFormat,
        dry_run: dryRun,
        force,
        queue: path.relative(repoRoot, queuePath),
        total_missing_queue_items: ttsItems.length,
        skipped_existing_files: existing.length,
        generation_targets: pending.length,
      },
      null,
      2,
    ),
  );

  for (const item of existing) {
    printItem("[skip-existing]", item);
  }

  for (const item of pending) {
    printItem(dryRun ? "[dry-run]" : "[generate]", item);
  }

  if (dryRun) {
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Put it in .env or set it in the current PowerShell session.");
  }

  let completed = 0;
  for (const item of pending) {
    const result = await createSpeech(item, apiKey);
    completed += 1;
    console.log(`[completed] ${item.id} -> ${result.publicUrl} (${result.bytes} bytes)`);
  }

  console.log(
    JSON.stringify(
      {
        completed,
        skipped: existing.length,
        failed: 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
