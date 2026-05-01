import "dotenv/config";

import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const auditPath = path.join(repoRoot, "docs", "ops", "PART1_TTS_144_EVALUATION.json");
const chapterRoot = path.join(repoRoot, "private", "content", "data", "chapters");
const publicTtsRoot = path.join(repoRoot, "public", "generated", "audio", "tts", "P1");
const reportRoot = path.join(repoRoot, "private", "prompts", "media-production", "part1", "tts-regeneration");
const model = "gpt-4o-mini-tts";
const responseFormat = "mp3";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

function argValue(name, fallback = null) {
  const eq = args.find((arg) => arg.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const target = argValue("--target", "technical-review");
const limit = Number(argValue("--limit", "0") ?? "0");
const chapterFilter = String(argValue("--chapter", "") ?? "").toUpperCase();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

const voiceProfiles = {
  npc_yoon_haein: {
    voice: "shimmer",
    role: "윤해인",
    instructions:
      "Korean female emergency radio operator. Near whisper, close microphone, restrained panic under control. Use breath and pauses naturally, like a damaged radio transmission in an abandoned Seoul broadcast building.",
  },
  npc_han_somyeong: {
    voice: "onyx",
    role: "한소명",
    instructions:
      "Korean field commander. Low, calm, practical, exhausted but reliable. Speak like every word is a survival order, not a performance.",
  },
  npc_jung_noah: {
    voice: "echo",
    role: "정노아",
    instructions:
      "Korean survivor broker. Dry, suspicious, quiet, streetwise. Keep the tone guarded and close, as if bargaining while hiding.",
  },
  npc_ryu_seon: {
    voice: "verse",
    role: "류세온",
    instructions:
      "Korean strategist. Sharp, composed, cold under pressure. Controlled urgency, precise diction, no melodrama.",
  },
  npc_ahn_bogyeong: {
    voice: "ash",
    role: "안보경",
    instructions:
      "Korean engineer. Tired, wounded, steady. A practical voice with restrained anxiety and short breaths.",
  },
  npc_kim_ara: {
    voice: "nova",
    role: "김아라",
    instructions:
      "Young Korean analyst. Fragile but firm, tense and quiet. Speak like fear is being held back by concentration.",
  },
  npc_seo_jinseo: {
    voice: "echo",
    role: "서진서",
    instructions:
      "Korean survivor scout. Cautious, alert, low volume. Speak as if the corridor can hear you.",
  },
  narrator: {
    voice: "ash",
    role: "기록",
    instructions:
      "Korean apocalypse narrator. Low, cinematic, intimate, not announcer-like. Sound like a field log being recovered from a broken emergency terminal.",
  },
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\[[^\]]+\]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function sentenceTrim(text, maxChars = 260) {
  const clean = normalizeText(text);
  if (clean.length <= maxChars) return clean;
  const sentences = clean.match(/[^.!?。！？\n]+[.!?。！？]?/gu) ?? [clean];
  let out = "";
  for (const sentence of sentences) {
    const next = `${out}${out ? " " : ""}${sentence.trim()}`.trim();
    if (next.length > maxChars) break;
    out = next;
  }
  return out || clean.slice(0, maxChars).trim();
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/u, ""));
}

function eventOutputPath(chapterId, eventId) {
  return path.join(publicTtsRoot, chapterId, `${eventId}.mp3`);
}

function pickSpeakerId(event, block) {
  return block?.speaker_id ?? event.npc_ids?.[0] ?? "narrator";
}

function pickSpeakableLine(event) {
  const blocks = event.text?.scene_blocks ?? [];
  const dialogue = blocks.find((block) => block.kind === "dialogue" && (block.lines ?? []).some((line) => normalizeText(line)));
  const system = blocks.find((block) => block.kind === "system" && (block.lines ?? []).some((line) => normalizeText(line)));
  const memory = blocks.find((block) => block.kind === "memory" && (block.lines ?? []).some((line) => normalizeText(line)));
  const narration = blocks.find((block) => block.kind === "narration" && (block.lines ?? []).some((line) => normalizeText(line)));
  const block = dialogue ?? system ?? memory ?? narration;

  const blockText = (block?.lines ?? []).map(normalizeText).filter(Boolean).slice(0, 3).join(" ");
  const fallback = [
    event.text?.summary,
    event.text?.body,
    event.text?.carry_line,
    event.title,
  ].map(normalizeText).filter(Boolean).join(" ");

  return {
    speaker_id: pickSpeakerId(event, block),
    text: sentenceTrim(blockText || fallback, 300),
    block_kind: block?.kind ?? "fallback",
  };
}

function eventMood(event, auditItem) {
  const id = String(event.event_id ?? "").toUpperCase();
  const type = String(event.event_type ?? "").toLowerCase();
  const title = String(event.title ?? "");

  if (/BOSS|AMBUSH|SWARM|BREACH|LOCKDOWN/.test(id) || type.includes("battle")) {
    return "urgent, close, breath controlled, danger nearby";
  }
  if (/EXTRACTION|RESULT|ENDING|EXIT/.test(id)) {
    return "exhausted, restrained, after-action survival report";
  }
  if (/BRIEFING|ENTRY/.test(id)) {
    return "low, tense, controlled, first contact with the scene";
  }
  if (auditItem?.technical?.action === "split_or_tighten_line") {
    return "tight, concise, compressed field report with clear pauses";
  }
  if (title.includes("신호") || title.includes("주파수")) {
    return "quiet radio tension, damaged signal, controlled urgency";
  }
  return "tense Korean survival scene, intimate, grounded, no theatrical tone";
}

function buildInstructions(item, chapter, event, picked) {
  const profile = voiceProfiles[picked.speaker_id] ?? voiceProfiles.narrator;
  return [
    profile.instructions,
    `Character: ${profile.role}.`,
    `Scene: Korean zombie apocalypse web game, Part 1 ${chapter.chapter_id}, ${chapter.title}.`,
    `Event: ${event.title ?? event.event_id}.`,
    `Mood: ${eventMood(event, item)}.`,
    "Deliver the line in Korean only.",
    "Do not read brackets, stage directions, file names, IDs, English words, or extra narration.",
    "Do not add music or sound effects.",
    "Use natural pauses and breath, but keep the line tight enough for an interactive game.",
  ].join(" ");
}

function shouldTarget(item) {
  if (chapterFilter && item.chapter_id !== chapterFilter) return false;
  if (target === "all") return true;
  if (target === "p0") return item.priority === "P0";
  if (target === "p0-review") return item.priority === "P0" && item.technical?.status !== "ok";
  if (target === "technical-review") return item.technical?.status !== "ok";
  if (target === "under-80") {
    const score = item.technical_score ?? (item.technical?.status === "ok" ? 100 : 78);
    return score < 80;
  }
  throw new Error(`Unknown --target value: ${target}`);
}

async function createSpeech({ item, chapter, event, picked, outputPath, apiKey }) {
  const profile = voiceProfiles[picked.speaker_id] ?? voiceProfiles.narrator;
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice: profile.voice,
      input: picked.text,
      instructions: buildInstructions(item, chapter, event, picked),
      response_format: responseFormat,
      speed: 0.94,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    let message = errorBody;
    try {
      message = JSON.parse(errorBody)?.error?.message ?? errorBody;
    } catch {
      // keep raw response
    }
    throw new Error(`OpenAI API error (${response.status}) for ${item.chapter_id}/${item.event_id}: ${message}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, bytes);
  return bytes.length;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) {
    throw new Error("OPENAI_API_KEY is missing in .env.");
  }

  const audit = await readJson(auditPath);
  const chapterMap = new Map();
  for (const fileName of ["ch01.json", "ch02.json", "ch03.json", "ch04.json", "ch05.json"]) {
    const chapter = await readJson(path.join(chapterRoot, fileName));
    chapterMap.set(chapter.chapter_id, chapter);
  }

  const selected = audit.items.filter(shouldTarget).slice(0, limit > 0 ? limit : undefined);
  const backupRoot = path.join(repoRoot, "private", "generated", "audio", "tts-backup", `openai-emotion-${timestamp}`);
  const report = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    force,
    target,
    chapter_filter: chapterFilter || null,
    model,
    response_format: responseFormat,
    speed: 0.94,
    selected_count: selected.length,
    backup_root: path.relative(repoRoot, backupRoot),
    items: [],
  };

  console.log(JSON.stringify({
    model,
    response_format: responseFormat,
    target,
    chapter_filter: chapterFilter || null,
    dry_run: dryRun,
    force,
    selected_count: selected.length,
  }, null, 2));

  for (const item of selected) {
    const chapter = chapterMap.get(item.chapter_id);
    const event = chapter?.events?.find((candidate) => candidate.event_id === item.event_id);
    if (!chapter || !event) {
      report.items.push({ ...item, status: "missing_source_event" });
      console.log(`[missing-source] ${item.chapter_id}/${item.event_id}`);
      continue;
    }

    const picked = pickSpeakableLine(event);
    const outputPath = eventOutputPath(item.chapter_id, item.event_id);
    const backupPath = path.join(backupRoot, item.chapter_id, `${item.event_id}.mp3`);
    const profile = voiceProfiles[picked.speaker_id] ?? voiceProfiles.narrator;
    const entry = {
      chapter_id: item.chapter_id,
      event_id: item.event_id,
      priority: item.priority,
      previous_action: item.technical?.action,
      voice: profile.voice,
      speaker_id: picked.speaker_id,
      speaker_role: profile.role,
      block_kind: picked.block_kind,
      text_chars: picked.text.length,
      output: path.relative(repoRoot, outputPath).replaceAll("\\", "/"),
      backup: path.relative(repoRoot, backupPath).replaceAll("\\", "/"),
      text: picked.text,
    };

    console.log(`${dryRun ? "[dry-run]" : "[regenerate]"} ${item.chapter_id}/${item.event_id} ${item.priority} voice=${profile.voice} chars=${picked.text.length}`);

    if (dryRun) {
      report.items.push({ ...entry, status: "dry_run" });
      continue;
    }

    if (existsSync(outputPath)) {
      await mkdir(path.dirname(backupPath), { recursive: true });
      await copyFile(outputPath, backupPath);
    } else if (!force) {
      report.items.push({ ...entry, status: "missing_existing_output" });
      continue;
    }

    const bytes = await createSpeech({ item, chapter, event, picked, outputPath, apiKey });
    report.items.push({ ...entry, status: "completed", bytes });
    console.log(`[completed] ${item.chapter_id}/${item.event_id} ${bytes} bytes`);
  }

  await mkdir(reportRoot, { recursive: true });
  const reportPath = path.join(reportRoot, `openai-emotion-${timestamp}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`report: ${path.relative(repoRoot, reportPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
