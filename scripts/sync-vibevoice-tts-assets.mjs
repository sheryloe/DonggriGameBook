import { existsSync, statSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const repoRoot = process.cwd();
const queuePath = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-vibevoice", "queue.json");
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
const provider = argValue("--provider", "vibevoice-realtime-0.5b");
const chapter = String(argValue("--chapter", "all")).toUpperCase();
const confirm = argValue("--confirm");
const limit = Number(argValue("--limit", "0") ?? "0");
const fullConfirmToken = "part1-full-vibevoice";
const expectedPart1RuntimeCount = 144;

const validChapters = new Set(["ALL", "CH01", "CH02", "CH03", "CH04", "CH05"]);
if (!validChapters.has(chapter)) {
  throw new Error("--chapter must be one of CH01, CH02, CH03, CH04, CH05, all.");
}

async function readQueue() {
  const raw = await readFile(queuePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

function absolute(output) {
  return path.join(repoRoot, output.replaceAll("/", path.sep));
}

function playFile(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn("cmd", ["/c", "start", "", filePath], { stdio: "ignore", windowsHide: true });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Failed to open audio player. Exit code: ${code}`))));
  });
}

function matchesId(item) {
  if (!id) return true;
  return item.id === id || item.event_id === id;
}

function matchesChapter(item) {
  return chapter === "ALL" || item.chapter_id === chapter;
}

function summary(queue) {
  const providerItems = queue.items.filter((item) => item.provider === provider);
  const byChapter = {};
  for (const item of providerItems) {
    byChapter[item.chapter_id] ??= {
      total: 0,
      completed_audition: 0,
      approved_runtime: 0,
      unavailable: 0,
      failed: 0,
      missing: 0,
      profile_version_2: 0,
    };
    const bucket = byChapter[item.chapter_id];
    bucket.total += 1;
    if (bucket[item.status] !== undefined) bucket[item.status] += 1;
    if (Number(item.profile_version) === 2) bucket.profile_version_2 += 1;
  }

  return {
    provider,
    total: providerItems.length,
    completed_audition: providerItems.filter((item) => item.status === "completed_audition").length,
    approved_runtime: providerItems.filter((item) => item.status === "approved_runtime").length,
    unavailable: providerItems.filter((item) => item.status === "unavailable").length,
    failed: providerItems.filter((item) => item.status === "failed").length,
    missing: providerItems.filter((item) => item.status === "missing").length,
    by_chapter: byChapter,
  };
}

function fullApprovalTargets(queue) {
  const targets = queue.items.filter((entry) => entry.provider === provider && matchesChapter(entry));
  if (provider !== "vibevoice-realtime-0.5b") {
    throw new Error("Full runtime approval is only allowed for provider=vibevoice-realtime-0.5b.");
  }
  if (chapter !== "ALL") {
    throw new Error("Full runtime approval requires --chapter=all.");
  }
  if (confirm !== fullConfirmToken) {
    throw new Error(`Full runtime approval requires --confirm=${fullConfirmToken}.`);
  }
  if (targets.length !== expectedPart1RuntimeCount) {
    throw new Error(`Expected ${expectedPart1RuntimeCount} realtime items for full approval, found ${targets.length}.`);
  }

  const invalid = targets.filter((item) => {
    const auditionPath = absolute(item.audition_mp3_output);
    return (
      !["completed_audition", "approved_runtime"].includes(item.status) ||
      Number(item.profile_version) !== 2 ||
      !existsSync(auditionPath) ||
      statSync(auditionPath).size <= 0
    );
  });
  if (invalid.length > 0) {
    throw new Error(
      `Full approval blocked by ${invalid.length} invalid item(s): ${invalid
        .slice(0, 8)
        .map((item) => `${item.event_id}:${item.status}:v${item.profile_version}`)
        .join(", ")}`,
    );
  }
  return targets;
}

async function approveTargets(queue, targets) {
  for (const item of targets) {
    const auditionPath = absolute(item.audition_mp3_output);
    const runtimePath = absolute(item.runtime_mp3_output);
    console.log(`[approve${dryRun ? ":dry-run" : ""}] ${item.id} ${provider} -> ${item.runtime_mp3_output}`);
    if (!dryRun) {
      await mkdir(path.dirname(runtimePath), { recursive: true });
      await copyFile(auditionPath, runtimePath);
      item.status = "approved_runtime";
      item.approved_at = new Date().toISOString();
      item.approved_provider = provider;
      item.runtime_mp3_bytes = statSync(runtimePath).size;
    }
  }

  if (!dryRun) {
    queue.updated_at = new Date().toISOString();
    await writeFile(queuePath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
  }
}

async function main() {
  const queue = await readQueue();

  if (!id) {
    if (approve) {
      const targets =
        chapter === "ALL" && confirm === fullConfirmToken
          ? fullApprovalTargets(queue)
          : queue.items
              .filter((entry) => entry.provider === provider && matchesChapter(entry) && entry.status === "completed_audition")
              .filter((entry) => existsSync(absolute(entry.audition_mp3_output)))
              .slice(0, limit > 0 ? limit : 0);

      if (chapter === "ALL" && confirm !== fullConfirmToken) {
        throw new Error(`Full Part 1 approval requires --confirm=${fullConfirmToken}.`);
      }
      if (targets.length === 0) {
        throw new Error("No approval targets selected. Use --id for one file, --limit for a small batch, or full approval confirm for all Part 1 files.");
      }
      if (confirm !== fullConfirmToken && (!Number.isFinite(limit) || limit <= 0)) {
        throw new Error("--limit is required for non-full batch approval. This prevents accidental runtime overwrite.");
      }

      console.log(
        JSON.stringify(
          {
            action: confirm === fullConfirmToken ? "full_part1_approve_to_runtime" : "batch_approve_to_runtime",
            dry_run: dryRun,
            provider,
            chapter,
            requested_limit: limit,
            targets: targets.length,
          },
          null,
          2,
        ),
      );

      await approveTargets(queue, targets);
      console.log(JSON.stringify(summary(queue), null, 2));
      return;
    }
    console.log(JSON.stringify(summary(queue), null, 2));
    return;
  }

  const item = queue.items.find((entry) => entry.provider === provider && matchesId(entry) && matchesChapter(entry));
  if (!item) {
    throw new Error(`Queue item not found: id=${id}, provider=${provider}, chapter=${chapter}`);
  }

  const auditionPath = absolute(item.audition_mp3_output);
  const runtimePath = absolute(item.runtime_mp3_output);

  if (!existsSync(auditionPath)) {
    throw new Error(`Audition MP3 missing: ${auditionPath}`);
  }

  console.log(
    JSON.stringify(
      {
        action: approve ? "approve_to_runtime" : "inspect",
        dry_run: dryRun,
        id: item.id,
        provider: item.provider,
        src: auditionPath,
        dst: runtimePath,
        audition_bytes: statSync(auditionPath).size,
        profile_version: item.profile_version,
        scene_profile: item.scene_profile,
        pressure_profile: item.pressure_profile,
        postprocess_profile: item.postprocess_profile,
      },
      null,
      2,
    ),
  );

  if (approve && !dryRun) {
    await approveTargets(queue, [item]);
  }

  if (play) {
    await playFile(approve ? runtimePath : auditionPath);
  }

  console.log(JSON.stringify(summary(queue), null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
