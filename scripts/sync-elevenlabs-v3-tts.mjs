import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const queuePath = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-elevenlabs-v3", "queue.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const approve = args.includes("--approve");
const play = args.includes("--play");

function argValue(name, fallback = null) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const id = argValue("--id");
const src = argValue("--src");

function usage() {
  return [
    "Usage:",
    "  npm run tts:part1:elevenlabs:sync -- --id ELV3-P1-002 --src \"C:\\Users\\wlflq\\Downloads\\file.mp3\"",
    "  npm run tts:part1:elevenlabs:sync -- --id ELV3-P1-002 --approve",
    "  npm run tts:part1:elevenlabs:sync -- --dry-run",
  ].join("\n");
}

async function readQueue() {
  const raw = await readFile(queuePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

function absolute(output) {
  return path.join(repoRoot, output.replaceAll("/", path.sep));
}

function runtimeOutput(item) {
  return path.join(repoRoot, "public", "generated", "audio", "tts", "P1", item.chapter_id, `${item.event_id}.mp3`);
}

function playFile(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn("cmd", ["/c", "start", "", filePath], { stdio: "ignore", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Failed to open audio player. Exit code: ${code}`))));
  });
}

function summary(queue) {
  const total = queue.items.length;
  const auditionCompleted = queue.items.filter((item) => existsSync(absolute(item.output))).length;
  const runtimeExistingAnyProvider = queue.items.filter((item) => existsSync(runtimeOutput(item))).length;
  const next = queue.items.find((item) => !existsSync(absolute(item.output)));
  return {
    total,
    audition_completed: auditionCompleted,
    audition_missing: total - auditionCompleted,
    runtime_existing_any_provider: runtimeExistingAnyProvider,
    next: next
      ? {
          id: next.id,
          chapter_id: next.chapter_id,
          event_id: next.event_id,
          speaker: next.speaker,
          output: next.output,
          prompt: next.prompt,
        }
      : null,
  };
}

async function main() {
  const queue = await readQueue();

  if (!id && !src && !approve) {
    console.log(JSON.stringify(summary(queue), null, 2));
    return;
  }

  if (!id) {
    throw new Error(`--id is required.\n${usage()}`);
  }

  const item = queue.items.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Unknown id: ${id}\n${usage()}`);
  }

  const auditionPath = absolute(item.output);
  const runtimePath = runtimeOutput(item);

  if (src) {
    const srcPath = path.resolve(src);
    if (!existsSync(srcPath)) {
      throw new Error(`Source file not found: ${srcPath}`);
    }

    console.log(JSON.stringify({
      action: "copy_to_audition",
      dry_run: dryRun,
      id: item.id,
      src: srcPath,
      dst: auditionPath,
    }, null, 2));

    if (!dryRun) {
      await mkdir(path.dirname(auditionPath), { recursive: true });
      await copyFile(srcPath, auditionPath);
      item.status = "completed_audition";
      item.completed_at = new Date().toISOString();
      await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
    }
  }

  if (approve) {
    if (!existsSync(auditionPath)) {
      throw new Error(`Audition file missing: ${auditionPath}`);
    }

    console.log(JSON.stringify({
      action: "approve_to_runtime",
      dry_run: dryRun,
      id: item.id,
      src: auditionPath,
      dst: runtimePath,
    }, null, 2));

    if (!dryRun) {
      await mkdir(path.dirname(runtimePath), { recursive: true });
      await copyFile(auditionPath, runtimePath);
      item.status = "approved_runtime";
      item.approved_at = new Date().toISOString();
      await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
    }
  }

  if (play) {
    const target = approve ? runtimePath : auditionPath;
    if (existsSync(target)) {
      await playFile(target);
    }
  }

  console.log(JSON.stringify(summary(queue), null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
