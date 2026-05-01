import "dotenv/config";

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const queuePath = path.join(
  repoRoot,
  "private",
  "prompts",
  "media-production",
  "part1",
  "tts-audition",
  "hume",
  "ch01-samples.json",
);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");
const play = args.includes("--play");

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const onlyId = argValue("--id");
const limit = Number(argValue("--limit", "0") ?? "0");
const format = String(argValue("--format", "mp3") ?? "mp3").toLowerCase();
const voiceId = argValue("--voice-id");
const voiceName = argValue("--voice-name");
const voiceProvider = argValue("--voice-provider", "HUME_AI");
const version = argValue("--version");
let activeQueue = null;

function normalizeEnvKey(name) {
  return process.env[name] || process.env[`﻿${name}`] || "";
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

function toAbsolute(output) {
  return path.join(repoRoot, output.replaceAll("/", path.sep));
}

function buildPayload(sample) {
  const utterance = {
    text: sample.text,
    description: sample.description,
    speed: sample.speed ?? 0.9,
    trailing_silence: sample.trailing_silence ?? 0.35,
  };

  if (voiceId) {
    utterance.voice = { id: voiceId };
  } else if (voiceName) {
    utterance.voice = { name: voiceName, provider: voiceProvider };
  }

  const payload = {
    utterances: [
      utterance,
    ],
    context: {
      utterances: [
        {
          text: activeQueue?.scene_context ?? "서울 여의도 방송동. 무전 잡음, 젖은 대본, 끊기는 구조 신호. 윤해인은 낮게 말하고 급해도 소리를 지르지 않는다.",
          description: activeQueue?.profile_description ?? "Korean apocalypse radio context; restrained, close microphone, no narration",
        },
      ],
    },
    format: {
      type: format,
    },
    num_generations: 1,
    split_utterances: false,
    strip_headers: false,
  };

  if (version) {
    payload.version = String(version);
  } else if (voiceId || voiceName) {
    payload.version = "2";
  }

  return payload;
}

async function synthesize(sample, apiKey) {
  const response = await fetch("https://api.hume.ai/v0/tts/file", {
    method: "POST",
    headers: {
      "X-Hume-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPayload(sample)),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const bytes = Buffer.from(await response.arrayBuffer());

  if (!response.ok) {
    let body = bytes.toString("utf8");
    try {
      const parsed = JSON.parse(body);
      body = parsed?.message ?? parsed?.error ?? body;
    } catch {
      // Keep raw response body.
    }
    throw new Error(`Hume API error (${response.status}) for ${sample.sample_id}: ${body}`);
  }

  if (contentType.includes("application/json")) {
    throw new Error(`Hume returned JSON instead of audio for ${sample.sample_id}: ${bytes.toString("utf8")}`);
  }

  const outputPath = toAbsolute(sample.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  return { outputPath, bytes: bytes.length, contentType };
}

function playFile(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "cmd",
      ["/c", "start", "", filePath],
      { stdio: "ignore", windowsHide: true },
    );
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to open audio player. Exit code: ${code}`));
    });
  });
}

async function main() {
  const queue = await readJson(queuePath);
  activeQueue = queue;
  let samples = queue.samples ?? [];
  if (onlyId) samples = samples.filter((sample) => sample.sample_id === onlyId);
  if (limit > 0) samples = samples.slice(0, limit);

  if (onlyId && samples.length === 0) {
    throw new Error(`Unknown sample id: ${onlyId}`);
  }

  const results = [];
  const targets = [];
  for (const sample of samples) {
    const outputPath = toAbsolute(sample.output);
    const exists = existsSync(outputPath);
    const status = exists && !force ? "existing" : "target";
    const item = {
      sample_id: sample.sample_id,
      event_id: sample.event_id,
      speaker_label: sample.speaker_label,
      text: sample.text,
      output: sample.output,
      exists,
      status,
    };
    results.push(item);
    if (status === "target") targets.push(sample);
  }

  console.log(JSON.stringify({
    provider: "hume",
    endpoint: "https://api.hume.ai/v0/tts/file",
    format,
    version: version || (voiceId || voiceName ? "2" : "auto"),
    voice: voiceId ? { id: voiceId } : voiceName ? { name: voiceName, provider: voiceProvider } : "dynamic",
    dry_run: dryRun,
    force,
    play,
    total: samples.length,
    existing: results.filter((item) => item.exists).length,
    targets: targets.length,
    queue: path.relative(repoRoot, queuePath),
    items: results,
  }, null, 2));

  if (dryRun || targets.length === 0) {
    if (play && results.length === 1 && results[0].exists) {
      await playFile(toAbsolute(results[0].output));
    }
    return;
  }

  const apiKey = normalizeEnvKey("HUME_API_KEY");
  if (!apiKey) {
    throw new Error("HUME_API_KEY is missing. Put it in .env first. See private/prompts/media-production/part1/tts-audition/hume/README.md");
  }

  let lastOutput = null;
  for (const sample of targets) {
    console.log(`[hume] ${sample.sample_id} -> ${sample.output}`);
    const generated = await synthesize(sample, apiKey);
    lastOutput = generated.outputPath;
    console.log(`[completed] ${sample.sample_id} (${generated.bytes} bytes, ${generated.contentType || "unknown content-type"})`);
  }

  if (play && lastOutput) {
    await playFile(lastOutput);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
