import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const queuePath = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-vibevoice", "queue.json");
const realtimeScript = path.join(repoRoot, "tools", "vibevoice", "run-vibevoice-realtime.py");
const probe15bScript = path.join(repoRoot, "tools", "vibevoice", "run-vibevoice-15b-probe.py");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const provider = argValue("--provider", "vibevoice-realtime-0.5b");
const id = argValue("--id");
const chapter = String(argValue("--chapter", "all")).toUpperCase();
const limit = Number(argValue("--limit", "0") ?? "0");
const batchSize = Number(argValue("--batch-size", "0") ?? "0");
const profileVersion = argValue("--profile-version");
const device = argValue("--device", "auto");
const vibeHomeWin = process.env.VIBEVOICE_HOME || "E:\\VibeVoiceLocal";

const validChapters = new Set(["ALL", "CH01", "CH02", "CH03", "CH04", "CH05"]);
if (!validChapters.has(chapter)) {
  throw new Error("--chapter must be one of CH01, CH02, CH03, CH04, CH05, all.");
}

if (!Number.isFinite(limit) || limit < 0) {
  throw new Error("--limit must be a non-negative number.");
}

if (!Number.isFinite(batchSize) || batchSize < 0) {
  throw new Error("--batch-size must be a non-negative number.");
}

const sceneFilters = {
  ch01_broadcast_radio: [
    "highpass=f=120",
    "lowpass=f=3600",
    "afftdn=nf=-28",
    "acompressor=threshold=-22dB:ratio=2.2:attack=12:release=180",
  ],
  ch02_wet_waterway: [
    "highpass=f=75",
    "lowpass=f=7800",
    "equalizer=f=260:t=q:w=1.2:g=-1.4",
    "aecho=0.62:0.20:70:0.07",
  ],
  ch03_glass_wind: [
    "highpass=f=95",
    "lowpass=f=9000",
    "equalizer=f=3600:t=q:w=1.0:g=1.8",
    "aecho=0.55:0.16:42:0.05",
  ],
  ch04_metal_cold: [
    "highpass=f=105",
    "lowpass=f=7600",
    "equalizer=f=1700:t=q:w=1.0:g=2.0",
    "equalizer=f=360:t=q:w=1.1:g=-1.3",
  ],
  ch05_server_isolation: [
    "highpass=f=115",
    "lowpass=f=5600",
    "afftdn=nf=-32",
    "equalizer=f=2400:t=q:w=1.2:g=1.1",
  ],
};

const pressureFilters = {
  clarity: ["acompressor=threshold=-18dB:ratio=1.5:attack=10:release=160", "volume=1.00"],
  field: ["acompressor=threshold=-20dB:ratio=2.0:attack=8:release=150", "volume=1.02"],
  frontline: ["acompressor=threshold=-24dB:ratio=3.2:attack=5:release=120", "volume=1.06"],
  extraction: ["lowpass=f=6200", "acompressor=threshold=-22dB:ratio=2.4:attack=12:release=190", "volume=0.97"],
};

function winToWsl(filePath) {
  const absolutePath = path.resolve(filePath);
  const drive = absolutePath.slice(0, 1).toLowerCase();
  const rest = absolutePath.slice(2).replaceAll("\\", "/");
  return `/mnt/${drive}${rest}`;
}

function absolute(output) {
  return path.join(repoRoot, output.replaceAll("/", path.sep));
}

async function readQueue() {
  const raw = await readFile(queuePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

async function saveQueue(queue) {
  queue.updated_at = new Date().toISOString();
  await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
}

function runWsl(commandArgs, options = {}) {
  return spawnSync("wsl", ["-e", ...commandArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 200,
    ...options,
  });
}

function runPython(scriptPath, scriptArgs) {
  const vibeHomeWsl = winToWsl(vibeHomeWin);
  const repoWsl = `${vibeHomeWsl}/VibeVoice`;
  const pythonWsl = `${vibeHomeWsl}/venv/bin/python`;
  return runWsl([
    "env",
    `VIBEVOICE_REPO=${repoWsl}`,
    `VIBEVOICE_HOME=${vibeHomeWsl}`,
    `HF_HOME=${vibeHomeWsl}/hf-cache`,
    `TORCH_HOME=${vibeHomeWsl}/torch-cache`,
    `PYTHONPATH=${repoWsl}`,
    pythonWsl,
    winToWsl(scriptPath),
    ...scriptArgs,
  ]);
}

function audioFilter(item) {
  const scene = sceneFilters[item.postprocess_profile] ?? sceneFilters.ch01_broadcast_radio;
  const pressure = pressureFilters[item.pressure_profile] ?? pressureFilters.field;
  return [...scene, ...pressure, "loudnorm=I=-18:LRA=9:TP=-1.5"].join(",");
}

function ffmpegToMp3(item, wavPath, mp3Path) {
  return runWsl([
    "ffmpeg",
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    winToWsl(wavPath),
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "4",
    "-af",
    audioFilter(item),
    winToWsl(mp3Path),
  ]);
}

function ffprobeDuration(filePath) {
  const result = runWsl([
    "ffprobe",
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    winToWsl(filePath),
  ]);
  if (result.status !== 0) return null;
  const value = Number(String(result.stdout).trim());
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}

function parseLastJson(output) {
  const lines = String(output ?? "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // VibeVoice emits progress logs; only JSON lines are relevant here.
    }
  }
  return null;
}

function processErrorMessage(result, fallback) {
  const payload = parseLastJson(result.stderr) ?? parseLastJson(result.stdout);
  const stderr = String(result.stderr ?? "").trim();
  const stdout = String(result.stdout ?? "").trim();
  const processError = result.error instanceof Error ? result.error.message : "";
  return (
    [payload?.error, payload?.reason, processError, stderr, stdout.split(/\r?\n/u).slice(-12).join("\n")]
      .map((value) => String(value ?? "").trim())
      .find(Boolean) ?? `${fallback}: status=${result.status ?? "null"} signal=${result.signal ?? "null"}`
  );
}

async function writeInput(item) {
  const inputPath = absolute(item.input_txt);
  await mkdir(path.dirname(inputPath), { recursive: true });
  await writeFile(inputPath, `Speaker 1: ${item.text}\n`, "utf8");
  return inputPath;
}

function itemSummary(item) {
  return `${item.provider} ${item.chapter_id}/${item.event_id} ${item.event_type} ${item.pressure_profile} -> ${item.audition_mp3_output}`;
}

function generationResult(item, wavPath, mp3Path) {
  return {
    status: "completed_audition",
    generated_at: new Date().toISOString(),
    wav_bytes: statSync(wavPath).size,
    audition_mp3_bytes: statSync(mp3Path).size,
    duration_seconds: ffprobeDuration(mp3Path),
    approved_at: null,
    approved_provider: null,
    runtime_mp3_bytes: null,
    last_error: null,
  };
}

async function convertGeneratedWav(item) {
  const wavPath = absolute(item.wav_output);
  if (!existsSync(wavPath) || statSync(wavPath).size === 0) {
    throw new Error(`WAV output was not created: ${wavPath}`);
  }

  const mp3Path = absolute(item.audition_mp3_output);
  await mkdir(path.dirname(mp3Path), { recursive: true });
  const convert = ffmpegToMp3(item, wavPath, mp3Path);
  if (convert.status !== 0) {
    throw new Error(convert.stderr.trim() || `ffmpeg exited with ${convert.status}`);
  }

  if (!existsSync(mp3Path) || statSync(mp3Path).size === 0) {
    throw new Error(`MP3 output was not created: ${mp3Path}`);
  }

  return generationResult(item, wavPath, mp3Path);
}

async function generateRealtime(item) {
  const inputPath = await writeInput(item);
  const wavPath = absolute(item.wav_output);
  await mkdir(path.dirname(wavPath), { recursive: true });

  const result = runPython(realtimeScript, [
    "--model-path",
    item.model,
    "--txt-path",
    winToWsl(inputPath),
    "--speaker-name",
    item.realtime_voice_preset,
    "--output-wav",
    winToWsl(wavPath),
    "--device",
    device,
    "--dtype",
    "auto",
    "--attn",
    "sdpa",
  ]);

  if (result.status !== 0) {
    throw new Error(processErrorMessage(result, "VibeVoice exited"));
  }

  return convertGeneratedWav(item);
}

async function generateRealtimeBatch(items) {
  const batchItems = [];
  for (const item of items) {
    const inputPath = await writeInput(item);
    const wavPath = absolute(item.wav_output);
    await mkdir(path.dirname(wavPath), { recursive: true });
    batchItems.push({
      id: `${item.id}:${item.provider}`,
      txt_path: winToWsl(inputPath),
      speaker_name: item.realtime_voice_preset,
      output_wav: winToWsl(wavPath),
    });
  }

  const batchPath = path.join(repoRoot, ".cache", "vibevoice", "batches", `part1-${provider}-${Date.now()}.json`);
  await mkdir(path.dirname(batchPath), { recursive: true });
  await writeFile(batchPath, `${JSON.stringify({ items: batchItems }, null, 2)}\n`, "utf8");

  const result = runPython(realtimeScript, [
    "--model-path",
    "microsoft/VibeVoice-Realtime-0.5B",
    "--batch-json",
    winToWsl(batchPath),
    "--device",
    device,
    "--dtype",
    "auto",
    "--attn",
    "sdpa",
  ]);

  if (result.status !== 0) {
    throw new Error(processErrorMessage(result, "VibeVoice batch exited"));
  }

  const results = new Map();
  for (const item of items) {
    results.set(item.id, await convertGeneratedWav(item));
  }
  return results;
}

async function probe15b(item) {
  const inputPath = await writeInput(item);
  const wavPath = absolute(item.wav_output);
  await mkdir(path.dirname(wavPath), { recursive: true });
  const result = runPython(probe15bScript, [
    "--model-path",
    item.model,
    "--txt-path",
    winToWsl(inputPath),
    "--speaker-name",
    item.speaker_name,
    "--output-wav",
    winToWsl(wavPath),
  ]);

  const payload = parseLastJson(result.stdout) ?? parseLastJson(result.stderr);
  if (result.status !== 0) {
    throw new Error(payload?.reason ?? payload?.error ?? result.stderr.trim() ?? `1.5B probe exited with ${result.status}`);
  }

  if (existsSync(wavPath) && statSync(wavPath).size > 0) {
    return convertGeneratedWav(item);
  }

  return {
    status: "unavailable",
    checked_at: new Date().toISOString(),
    last_error: payload?.reason ?? "VibeVoice-1.5B did not produce a WAV file.",
  };
}

function matchesId(item) {
  if (!id) return true;
  return item.id === id || item.event_id === id;
}

function matchesChapter(item) {
  return chapter === "ALL" || item.chapter_id === chapter;
}

function matchesProfileVersion(item) {
  if (!profileVersion) return true;
  return String(item.profile_version) === String(profileVersion);
}

function shouldGenerate(item) {
  if (item.status === "unavailable" && provider === "vibevoice-1.5b") return force;
  if (force) return true;
  if (existsSync(absolute(item.audition_mp3_output)) && ["completed_audition", "approved_runtime"].includes(item.status)) return false;
  return !["completed_audition", "approved_runtime", "unavailable"].includes(item.status);
}

function chunks(items, size) {
  if (!size || size >= items.length) return [items];
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function main() {
  const queue = await readQueue();
  const candidates = queue.items.filter(
    (item) => item.provider === provider && matchesId(item) && matchesChapter(item) && matchesProfileVersion(item),
  );
  const pending = candidates.filter(shouldGenerate);
  const targets = limit > 0 ? pending.slice(0, limit) : pending;

  console.log(
    JSON.stringify(
      {
        dry_run: dryRun,
        force,
        provider,
        id,
        chapter,
        profile_version: profileVersion ?? null,
        batch_size: batchSize || targets.length,
        candidates: candidates.length,
        generation_targets: targets.length,
        vibevoice_home: vibeHomeWin,
      },
      null,
      2,
    ),
  );

  for (const item of targets) {
    console.log(`${dryRun ? "[dry-run]" : "[generate]"} ${itemSummary(item)}`);
  }

  if (dryRun) return;

  if (provider === "vibevoice-realtime-0.5b" && targets.length > 0) {
    for (const [chunkIndex, chunk] of chunks(targets, batchSize).entries()) {
      console.log(`[batch] ${chunkIndex + 1}/${chunks(targets, batchSize).length} size=${chunk.length}`);
      try {
        const batchResults = chunk.length === 1 ? new Map([[chunk[0].id, await generateRealtime(chunk[0])]]) : await generateRealtimeBatch(chunk);
        for (const item of chunk) {
          Object.assign(item, batchResults.get(item.id));
          console.log(`[${item.status}] ${itemSummary(item)}`);
        }
      } catch (error) {
        for (const item of chunk) {
          item.status = "failed";
          item.failed_at = new Date().toISOString();
          item.last_error = error instanceof Error ? error.message : String(error);
          console.error(`[failed] ${itemSummary(item)} :: ${item.last_error}`);
        }
      }
      await saveQueue(queue);
    }
    return;
  }

  for (const item of targets) {
    try {
      const result = item.provider === "vibevoice-realtime-0.5b" ? await generateRealtime(item) : await probe15b(item);
      Object.assign(item, result);
      console.log(`[${item.status}] ${itemSummary(item)}`);
    } catch (error) {
      item.status = "failed";
      item.failed_at = new Date().toISOString();
      item.last_error = error instanceof Error ? error.message : String(error);
      console.error(`[failed] ${itemSummary(item)} :: ${item.last_error}`);
    }
    await saveQueue(queue);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
