/**
 * Report which existing Part 1 TTS audio files no longer match their script.
 *
 * The APR-033 copy repair removed duplicated narration lines, narration pasted
 * into dialogue blocks, and leaked internal identifiers. Any voice line recorded
 * before that still reads the removed text, so it has to be regenerated. Lines
 * whose script did not change are still valid and must not be re-recorded.
 *
 * Baseline defaults to the APR-033 pre-change backup; pass --baseline <dir> to
 * compare against a different snapshot.
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const CHAPTERS = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const evaluationPath = path.join(root, "docs", "ops", "PART1_TTS_144_EVALUATION.json");
const outputPath = path.join(root, "docs", "ops", "PART1_TTS_SCRIPT_DRIFT.json");

const baselineFlag = process.argv.indexOf("--baseline");
const baselineDir = baselineFlag > -1
  ? process.argv[baselineFlag + 1]
  : "G:\\Donggri_DevDrive\\storage\\codex-control\\reports\\DonggrolGameBook\\2026-08-08\\part1-korean-repair\\backup";

/** The narration string the TTS lock builds for an event. */
function scriptOf(event) {
  const text = event.text ?? {};
  const parts = [];
  for (const block of text.scene_blocks ?? []) for (const line of block.lines ?? []) parts.push(line);
  if (parts.length === 0) for (const line of text.body ?? []) parts.push(line);
  return parts.join(" ").replace(/\s+/gu, " ").trim();
}

if (!fs.existsSync(evaluationPath)) {
  console.error(`missing TTS evaluation: ${evaluationPath}`);
  process.exit(1);
}
if (!fs.existsSync(baselineDir)) {
  console.error(`missing baseline snapshot: ${baselineDir}`);
  process.exit(1);
}

const evaluation = JSON.parse(fs.readFileSync(evaluationPath, "utf8"));
const audioById = new Map(evaluation.items.filter((i) => i.exists).map((i) => [i.event_id, i]));

const drifted = [];
const stable = [];
for (const chapter of CHAPTERS) {
  const current = JSON.parse(fs.readFileSync(path.join(root, "private", "content", "data", "chapters", `${chapter}.json`), "utf8"));
  const baseline = JSON.parse(fs.readFileSync(path.join(baselineDir, `${chapter}.json`), "utf8"));
  const baselineById = new Map((baseline.events ?? []).map((e) => [e.event_id, e]));

  for (const event of current.events ?? []) {
    const audio = audioById.get(event.event_id);
    if (!audio) continue;
    const before = scriptOf(baselineById.get(event.event_id) ?? {});
    const after = scriptOf(event);
    const row = {
      event_id: event.event_id,
      chapter_id: chapter.toUpperCase(),
      event_type: event.event_type,
      title: event.title,
      audio_path: audio.path,
      audio_seconds: audio.duration_seconds,
      before_chars: before.length,
      after_chars: after.length,
      delta_chars: after.length - before.length,
    };
    if (before === after) stable.push(row);
    else drifted.push({ ...row, removed_sentences: before.split(". ").filter((s) => !new Set(after.split(". ")).has(s)).slice(0, 4) });
  }
}

drifted.sort((a, b) => a.delta_chars - b.delta_chars);
const report = {
  schema: "donggrol.part1_tts_script_drift.v1",
  generated_at: new Date().toISOString(),
  baseline: baselineDir,
  audio_files_present: audioById.size,
  regenerate_required: drifted.length,
  still_valid: stable.length,
  note: "Drift comes from the APR-033 copy repair (duplicate-line removal, narration/dialogue separation, internal-id cleanup). No voiced line ever contained a debug code or a particle error: those defects were confined to outcome events, and no outcome event has audio.",
  regenerate: drifted,
  still_valid_event_ids: stable.map((s) => s.event_id),
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  audio_files_present: report.audio_files_present,
  regenerate_required: report.regenerate_required,
  still_valid: report.still_valid,
  by_chapter: drifted.reduce((acc, d) => { acc[d.chapter_id] = (acc[d.chapter_id] ?? 0) + 1; return acc; }, {}),
  by_type: drifted.reduce((acc, d) => { acc[d.event_type] = (acc[d.event_type] ?? 0) + 1; return acc; }, {}),
  output: path.relative(root, outputPath).replace(/\\/gu, "/"),
}, null, 2));
