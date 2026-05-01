import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const chapterDir = path.join(root, "private", "content", "data", "chapters");
const ttsPromptDir = path.join(root, "private", "prompts", "media-production", "part1", "tts");
const publicTtsRoot = path.join(root, "public", "generated", "audio", "tts", "P1");
const sourceTtsRoot = path.join(root, "private", "generated", "audio", "tts-source", "P1");
const chapters = ["ch01", "ch02", "ch03", "ch04", "ch05"];

function readJson(file) {
  return readFile(file, "utf8").then((raw) => JSON.parse(raw.replace(/^\uFEFF/u, "")));
}

function exists(filePath) {
  return existsSync(filePath);
}

function fileSize(filePath) {
  return exists(filePath) ? statSync(filePath).size : 0;
}

async function listFilesRecursive(dirPath, ext) {
  if (!exists(dirPath)) return [];
  const files = [];
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFilesRecursive(entryPath, ext));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(ext)) {
      files.push(entryPath);
    }
  }
  return files;
}

function relativeOutput(chapterId, eventId, ext = "mp3") {
  return `public/generated/audio/tts/P1/${chapterId}/${eventId}.${ext}`;
}

function publicPath(chapterId, eventId, ext = "mp3") {
  return path.join(publicTtsRoot, chapterId, `${eventId}.${ext}`);
}

function sourceWavPath(chapterId, eventId) {
  return path.join(sourceTtsRoot, chapterId, `${eventId}.wav`);
}

function byChapterSummary(items) {
  return Object.fromEntries(
    chapters.map((chapterFile) => {
      const chapterId = chapterFile.toUpperCase();
      const chapterItems = items.filter((item) => item.chapter_id === chapterId);
      return [
        chapterId,
        {
          total: chapterItems.length,
          completed: chapterItems.filter((item) => item.status === "completed").length,
          missing: chapterItems.filter((item) => item.status !== "completed").length,
          mp3_mb: Number((chapterItems.reduce((sum, item) => sum + item.mp3_bytes, 0) / 1024 / 1024).toFixed(2)),
        },
      ];
    }),
  );
}

async function collectItems() {
  const items = [];
  for (const chapterFile of chapters) {
    const chapter = await readJson(path.join(chapterDir, `${chapterFile}.json`));
    for (const event of chapter.events ?? []) {
      const chapterId = chapter.chapter_id;
      const eventId = event.event_id;
      const mp3Path = publicPath(chapterId, eventId, "mp3");
      const publicWavPath = publicPath(chapterId, eventId, "wav");
      const backupWavPath = sourceWavPath(chapterId, eventId);
      const mp3Exists = exists(mp3Path);
      const publicWavExists = exists(publicWavPath);
      const backupWavExists = exists(backupWavPath);

      items.push({
        id: `P1-${chapterId}-${eventId}`,
        type: "tts",
        runtime_format: "mp3",
        status: mp3Exists ? "completed" : "missing",
        chapter_id: chapterId,
        chapter_title: chapter.title ?? chapterId,
        event_id: eventId,
        event_title: event.title ?? "",
        output: relativeOutput(chapterId, eventId, "mp3"),
        source_backup: `private/generated/audio/tts-source/P1/${chapterId}/${eventId}.wav`,
        mp3_exists: mp3Exists,
        public_wav_exists: publicWavExists,
        source_wav_exists: backupWavExists,
        mp3_bytes: fileSize(mp3Path),
        public_wav_bytes: fileSize(publicWavPath),
        source_wav_bytes: fileSize(backupWavPath),
      });
    }
  }
  return items;
}

function markdownSummary(manifest) {
  return [
    "# Part 1 TTS Runtime Status",
    "",
    "Runtime format: MP3",
    "",
    "## Summary",
    `- Total events: ${manifest.summary.total_part1_events}`,
    `- Completed MP3 TTS: ${manifest.summary.completed_tts}`,
    `- Missing MP3 TTS: ${manifest.summary.missing_tts}`,
    `- Public MP3 size: ${manifest.summary.public_mp3_mb}MB`,
    `- Public WAV files: ${manifest.summary.public_wav_count}`,
    `- Source/backfill WAV files: ${manifest.summary.source_wav_count}`,
    "",
    "## Commands",
    "```powershell",
    "Set-Location D:\\Donggri_Platform\\DonggrolGameBook",
    "npm run tts:part1:mp3 -- --dry-run",
    "npm run tts:part1:sync",
    "npm run build:part1",
    "npm run qa:part1 -- http://127.0.0.1:4171/",
    "```",
    "",
    "## Policy",
    "- Runtime uses `public/generated/audio/tts/P1/<CHAPTER>/<EVENT_ID>.mp3`.",
    "- WAV files are source/backfill only and should stay under `private/generated/audio/tts-source/P1`.",
    "- If one voice line sounds wrong, regenerate only that event MP3.",
    "",
  ].join("\n");
}

async function main() {
  const items = await collectItems();
  const completed = items.filter((item) => item.status === "completed");
  const missing = items.filter((item) => item.status !== "completed");
  const publicWav = await listFilesRecursive(publicTtsRoot, ".wav");
  const sourceWav = await listFilesRecursive(sourceTtsRoot, ".wav");

  const manifest = {
    version: 2,
    updated_at: new Date().toISOString(),
    policy: {
      runtime_format: "mp3",
      source_format: "wav",
      video: false,
      runtime_path_pattern: "public/generated/audio/tts/P1/<CHAPTER>/<EVENT_ID>.mp3",
      source_backup_pattern: "private/generated/audio/tts-source/P1/<CHAPTER>/<EVENT_ID>.wav",
    },
    summary: {
      total_part1_events: items.length,
      completed_tts: completed.length,
      missing_tts: missing.length,
      public_mp3_count: completed.length,
      public_mp3_mb: Number((completed.reduce((sum, item) => sum + item.mp3_bytes, 0) / 1024 / 1024).toFixed(2)),
      public_wav_count: publicWav.length,
      public_wav_mb: Number((publicWav.reduce((sum, filePath) => sum + fileSize(filePath), 0) / 1024 / 1024).toFixed(2)),
      source_wav_count: sourceWav.length,
      source_wav_mb: Number((sourceWav.reduce((sum, filePath) => sum + fileSize(filePath), 0) / 1024 / 1024).toFixed(2)),
      by_chapter: byChapterSummary(items),
    },
    items,
  };

  const completedMd = [
    "# Completed Part 1 MP3 TTS",
    "",
    ...completed.map((item) => `- [x] ${item.chapter_id} / ${item.event_id} / \`${item.output}\``),
    "",
  ].join("\n");

  const promptsMd = [
    "# Missing Part 1 MP3 TTS",
    "",
    ...missing.map((item) => `- [ ] ${item.chapter_id} / ${item.event_id} / \`${item.output}\``),
    missing.length === 0 ? "All Part 1 MP3 TTS files are complete." : "",
    "",
  ].join("\n");

  await mkdir(ttsPromptDir, { recursive: true });
  await writeFile(path.join(ttsPromptDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(ttsPromptDir, "README.md"), markdownSummary(manifest), "utf8");
  await writeFile(path.join(ttsPromptDir, "completed.md"), completedMd, "utf8");
  await writeFile(path.join(ttsPromptDir, "prompts-to-make.md"), promptsMd, "utf8");

  console.log(JSON.stringify(manifest.summary, null, 2));
  console.log(`output: ${path.relative(root, ttsPromptDir)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
