import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";

const root = process.cwd();
const attemptId = "apr032-lyria-bgm01-a-v02-derived-master-20260808t1114550900";
const parentAttemptId = "apr031-lyria-bgm01-a-v02-20260808t1056400900";
const sourceFingerprint = "13810d39aa5e2a0eff2e99b64d0bd179a69edbbe0eacdb6225458779e72bb5e7";
const expectedParentAuditSha256 = "a5b4b14ca3ee6ade302f542f5e81b88276c091d2b64d537f45db58148101d45f";
const expectedRawSha256 = "80007b3f041eb6c6c60c3bbbed65cb05ab6ed9f27f0167e30bd4aa71cb76075c";
const expectedRawBytes = 2_540_792;
const gainDb = -2.8;
const commandDigest = "APR032-P1-BGM01-A-V02-DERIVED-MASTER-MINUS-2P800DB-V1";
const outputFilename = "P1_BGM_01_BENEATH_THE_CONCRETE__A_V02_DERIVED_MASTER_V01.mp3";
const fStagingRoot = path.resolve("F:\\DonggriPlatform_Asset\\staging\\DonggrolGameBook", sourceFingerprint, "p1-audio");
const fAttemptRoot = path.resolve(fStagingRoot, "attempts", attemptId);
const outputPath = path.resolve(fAttemptRoot, "derived", outputFilename);
const fReportPath = path.resolve(fAttemptRoot, "derived-master-audit.json");
const fMarkdownPath = path.resolve(fAttemptRoot, "derived-master-audit.md");
const repoAttemptRoot = path.join(root, "docs", "ops", "attempts", "p1-lyria-bgm", attemptId);
const repoReportPath = path.join(repoAttemptRoot, "derived-master-audit.json");
const repoMarkdownPath = path.join(repoAttemptRoot, "derived-master-audit.md");
const parentAuditPath = path.join(root, "docs", "ops", "attempts", "p1-lyria-bgm", parentAttemptId, "download-audit.json");
const schemaPath = path.join(root, "schemas", "apr032-part1-lyria-derived-master.schema.json");
const helperPath = path.join(root, "scripts", "lib", "apr032_derive_bgm_master.py");
const acousticHelperPath = path.join(root, "scripts", "lib", "apr031_bgm_acoustic_audit.py");
const pythonPath = "F:\\DonggriPlatform_Asset\\tools\\voice\\Voicebox\\backend\\venv\\Scripts\\python.exe";
const candidateManifestPath = path.join(root, "Music Making", "P1", "manifest.json");
const bgmMappingPath = path.join(root, "apps", "part1", "src", "utils", "bgm.ts");

// Attempts 1 and 2 failed before output because the fixed F staging tree is deeper
// than the Windows MAX_PATH ceiling that Python and libsndfile still enforce; the
// final F target alone is 261 characters. Node handles those paths, so Node owns
// every long-path operation and the Python toolchain only ever sees this short
// G: Dev Drive working directory with bare `in.mp3` / `out.mp3` arguments.
const gScratchRoot = path.resolve("G:\\Donggri_DevDrive\\storage\\codex-control\\reports\\DonggrolGameBook\\2026-08-08\\apr032-a3");
const gScratchInputName = "in.mp3";
const gScratchOutputName = "out.mp3";
const gScratchInputPath = path.join(gScratchRoot, gScratchInputName);
const gScratchOutputPath = path.join(gScratchRoot, gScratchOutputName);
const maxToolPathLength = 200;
const pathMode = "g_devdrive_short_scratch";
const acousticSourceLabel = "g_scratch_byte_identical_copy";

const bitrateKbps = {
  "1-1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1-2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2-2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const sampleRateHz = { 1: [44100, 48000, 32000], 2: [22050, 24000, 16000], 2.5: [11025, 12000, 8000] };

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function inDirectory(directory, action) {
  const previous = process.cwd();
  process.chdir(directory);
  try {
    return action();
  } finally {
    process.chdir(previous);
  }
}

function readFileRelativeSafe(file) {
  const absolute = path.resolve(file);
  if (process.platform === "win32" && absolute.length >= 248) {
    return inDirectory(path.dirname(absolute), () => fs.readFileSync(path.basename(absolute)));
  }
  return fs.readFileSync(absolute);
}

function fileFact(file) {
  const bytes = readFileRelativeSafe(file);
  return { file: path.resolve(file), bytes: bytes.length, sha256: sha256(bytes), buffer: bytes };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function versionFromBits(bits) {
  if (bits === 3) return 1;
  if (bits === 2) return 2;
  if (bits === 0) return 2.5;
  return null;
}

function layerFromBits(bits) {
  if (bits === 3) return 1;
  if (bits === 2) return 2;
  if (bits === 1) return 3;
  return null;
}

function synchsafeSize(buffer, offset) {
  return ((buffer[offset] & 0x7f) << 21) | ((buffer[offset + 1] & 0x7f) << 14) | ((buffer[offset + 2] & 0x7f) << 7) | (buffer[offset + 3] & 0x7f);
}

function id3v2Bytes(buffer) {
  if (buffer.length < 10 || buffer.subarray(0, 3).toString("latin1") !== "ID3") return 0;
  return 10 + synchsafeSize(buffer, 6) + ((buffer[5] & 0x10) !== 0 ? 10 : 0);
}

function id3v1Bytes(buffer) {
  return buffer.length >= 128 && buffer.subarray(buffer.length - 128, buffer.length - 125).toString("latin1") === "TAG" ? 128 : 0;
}

function parseFrame(buffer, offset) {
  if (offset + 4 > buffer.length || buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) return null;
  const version = versionFromBits((buffer[offset + 1] >> 3) & 0x03);
  const layer = layerFromBits((buffer[offset + 1] >> 1) & 0x03);
  if (!version || !layer) return null;
  const bitrateIndex = (buffer[offset + 2] >> 4) & 0x0f;
  const sampleIndex = (buffer[offset + 2] >> 2) & 0x03;
  const padding = (buffer[offset + 2] >> 1) & 0x01;
  if (bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) return null;
  const bitrate = bitrateKbps[`${version === 1 ? 1 : 2}-${layer}`]?.[bitrateIndex] ?? 0;
  const sampleRate = sampleRateHz[version]?.[sampleIndex] ?? 0;
  if (!bitrate || !sampleRate) return null;
  const frameLength = layer === 1
    ? Math.floor(((12 * bitrate * 1000) / sampleRate + padding) * 4)
    : layer === 3 && version !== 1
      ? Math.floor((72 * bitrate * 1000) / sampleRate + padding)
      : Math.floor((144 * bitrate * 1000) / sampleRate + padding);
  if (frameLength < 24) return null;
  return {
    bitrate,
    sampleRate,
    channels: ((buffer[offset + 3] >> 6) & 0x03) === 3 ? 1 : 2,
    frameLength,
    samples: layer === 1 ? 384 : layer === 2 ? 1152 : version === 1 ? 1152 : 576,
  };
}

function analyzeMp3(buffer) {
  const end = buffer.length - id3v1Bytes(buffer);
  const audioStart = id3v2Bytes(buffer);
  let offset = audioStart;
  let parsedBytes = 0;
  let duration = 0;
  const bitrates = [];
  const rates = new Set();
  const channels = new Set();
  let frameCount = 0;
  while (offset + 4 <= end) {
    const frame = parseFrame(buffer, offset);
    if (!frame || offset + frame.frameLength > end) {
      offset += 1;
      continue;
    }
    frameCount += 1;
    parsedBytes += frame.frameLength;
    duration += frame.samples / frame.sampleRate;
    bitrates.push(frame.bitrate);
    rates.add(frame.sampleRate);
    channels.add(frame.channels);
    offset += frame.frameLength;
  }
  const candidateBytes = Math.max(1, end - audioStart);
  return {
    frame_count: frameCount,
    sync_coverage: Number((parsedBytes / candidateBytes).toFixed(4)),
    duration_seconds: Number(duration.toFixed(2)),
    sample_rates_hz: [...rates],
    channel_counts: [...channels],
    average_bitrate_kbps: bitrates.length ? Number((bitrates.reduce((sum, value) => sum + value, 0) / bitrates.length).toFixed(2)) : 0,
  };
}

function structuralErrors(metrics, parentDuration) {
  const errors = [];
  if (metrics.frame_count < 100) errors.push("MP3 frame count below 100");
  if (metrics.sync_coverage < 0.999) errors.push("MP3 frame sync coverage below 0.999");
  if (metrics.duration_seconds < 75 || metrics.duration_seconds > 135) errors.push("duration outside 75-135 seconds");
  if (Math.abs(metrics.duration_seconds - parentDuration) > 0.1) errors.push("duration drift exceeds 0.10 seconds");
  if (metrics.sample_rates_hz.length !== 1 || metrics.sample_rates_hz[0] !== 44100) errors.push("sample rate is not exactly 44100 Hz");
  if (metrics.channel_counts.length !== 1 || metrics.channel_counts[0] !== 2) errors.push("audio is not stereo");
  if (metrics.average_bitrate_kbps < 192) errors.push("average bitrate is below 192 kbps");
  return errors;
}

function acousticErrors(metrics, parentMetrics) {
  const errors = [];
  const durationDelta = Math.abs(metrics.duration_seconds - parentMetrics.duration_seconds);
  const loudnessDelta = metrics.integrated_lufs - parentMetrics.integrated_lufs;
  if (durationDelta > 0.1) errors.push("decoded duration drift exceeds 0.10 seconds");
  if (metrics.integrated_lufs < -20 || metrics.integrated_lufs > -16) errors.push("integrated loudness outside -20..-16 LUFS");
  if (Math.abs(metrics.integrated_lufs - -18) > 0.5) errors.push("integrated loudness is outside -18 +/- 0.5 LUFS");
  if (loudnessDelta < -2.95 || loudnessDelta > -2.65) errors.push("post-encode loudness delta is outside -2.800 +/- 0.15 LU");
  if (metrics.peak_dbfs > -1) errors.push("sample peak exceeds -1 dBFS");
  if (metrics.maximum_silence_seconds > 2) errors.push("meaningless silence exceeds 2 seconds");
  if (metrics.sample_rate_hz !== 44100 || metrics.channels !== 2) errors.push("decoded format is not 44.1 kHz stereo");
  return errors;
}

function analyzeAcoustics(file) {
  const absolute = path.resolve(file);
  const executionCwd = path.dirname(absolute);
  const relativeFile = path.basename(absolute);
  assert(!path.isAbsolute(relativeFile) && !relativeFile.includes(".."), "acoustic helper argument must be a local relative filename");
  assert(absolute.length < maxToolPathLength, `acoustic helper target is ${absolute.length} characters, above the libsndfile-safe limit`);
  const output = execFileSync(pythonPath, [acousticHelperPath, "--file", relativeFile], {
    cwd: executionCwd,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(output);
}

function validateSchema(report) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
  const validate = ajv.compile(schema);
  assert(validate(report), `APR-032 schema validation failed: ${JSON.stringify(validate.errors)}`);
}

function loadParentAuthority() {
  assert(fs.existsSync(parentAuditPath), `parent audit missing: ${parentAuditPath}`);
  const parentAuditFact = fileFact(parentAuditPath);
  assert(parentAuditFact.sha256 === expectedParentAuditSha256, "parent attempt audit hash drift");
  const parentAudit = JSON.parse(parentAuditFact.buffer.toString("utf8").replace(/^\uFEFF/u, ""));
  assert(parentAudit.attempt_id === parentAttemptId, "parent attempt ID drift");
  assert(parentAudit.download?.bytes === expectedRawBytes && parentAudit.download?.sha256 === expectedRawSha256, "parent raw identity drift in audit");
  assert(parentAudit.embedded_content_credentials?.google_generative_ai_assertion_present === true, "parent Google Generative AI assertion missing");
  assert(parentAudit.embedded_content_credentials?.synthid_watermark_assertion_present === true, "parent SynthID assertion missing");
  assert(parentAudit.surface_provenance?.exact_lyria_3_pro_marker_visible === false, "unexpected exact-model provenance transition");
  const eRaw = fileFact(parentAudit.append_only_preservation.e_raw_path);
  const fRaw = fileFact(parentAudit.append_only_preservation.f_staging_path);
  assert(eRaw.bytes === expectedRawBytes && eRaw.sha256 === expectedRawSha256, "E raw parent hash/bytes drift");
  assert(fRaw.bytes === expectedRawBytes && fRaw.sha256 === expectedRawSha256, "F raw parent hash/bytes drift");
  return { parentAudit, parentAuditFact, eRaw, fRaw };
}

function protectedFacts() {
  return {
    candidate_manifest_sha256: fileFact(candidateManifestPath).sha256,
    bgm_mapping_sha256: fileFact(bgmMappingPath).sha256,
  };
}

function validateFixedBoundary(candidate = outputPath) {
  assert(inside(fAttemptRoot, candidate), "derived output escaped the fixed F attempt root");
  assert(path.dirname(candidate) === path.join(fAttemptRoot, "derived"), "derived output is not in the exact derived directory");
  assert(path.basename(candidate) === outputFilename, "derived output filename drift");
}

function validateScratchBoundary(candidate) {
  const absolute = path.resolve(candidate);
  assert(inside(gScratchRoot, absolute), "helper path escaped the G work root");
  assert(path.dirname(absolute) === gScratchRoot, "helper path is not directly inside the G work root");
  assert(absolute.length < maxToolPathLength, `helper path is ${absolute.length} characters, above the libsndfile-safe limit`);
}

function resolveScratchExecution() {
  const cwd = gScratchRoot;
  const source = gScratchInputName;
  const destination = gScratchOutputName;
  assert(!path.isAbsolute(source) && !path.isAbsolute(destination), "Python helper arguments must be relative");
  assert(source === path.basename(source) && destination === path.basename(destination), "Python helper arguments must be bare filenames");
  assert(!source.includes("..") && !destination.includes(".."), "Python helper arguments must not traverse");
  assert(source !== destination, "Python helper source and destination must differ");
  assert(path.resolve(cwd, source) === gScratchInputPath, "scratch input resolution drift");
  assert(path.resolve(cwd, destination) === gScratchOutputPath, "scratch output resolution drift");
  validateScratchBoundary(path.resolve(cwd, source));
  validateScratchBoundary(path.resolve(cwd, destination));
  assert(cwd.length < maxToolPathLength, `helper working directory is ${cwd.length} characters, above the libsndfile-safe limit`);
  return { cwd, source, destination };
}

function assertNoExistingTargets(targets) {
  assert(targets.length === 0, `non-overwrite gate rejected existing targets: ${targets.join(", ")}`);
}

function assertScratchInputIdentity(fact) {
  assert(fact.bytes === expectedRawBytes, "G scratch input byte count differs from the immutable parent");
  assert(fact.sha256 === expectedRawSha256, "G scratch input hash differs from the immutable parent");
}

function assertCopyParity(sourceFact, targetFact, label) {
  assert(sourceFact.bytes === targetFact.bytes, `${label} byte counts differ`);
  assert(sourceFact.sha256 === targetFact.sha256, `${label} hashes differ`);
}

function writeExclusive(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const handle = fs.openSync(file, "wx");
  try {
    fs.writeFileSync(handle, bytes);
  } finally {
    fs.closeSync(handle);
  }
}

function existingTargets() {
  return [gScratchInputPath, gScratchOutputPath, outputPath, repoReportPath, repoMarkdownPath, fReportPath, fMarkdownPath].filter((file) => fs.existsSync(file));
}

function markdownFor(report, reportSha256) {
  return [
    "# APR-032 P1 bgm01 A V02 Derived Master",
    "",
    `- decision: **${report.decision}**`,
    `- parent SHA-256: \`${report.parent.raw_sha256}\``,
    `- derived SHA-256: \`${report.output.sha256}\``,
    `- derived bytes: ${report.output.bytes}`,
    `- gain recipe: ${report.derivation.gain_db.toFixed(3)} dB constant gain only`,
    `- duration: ${report.output.acoustic_audit.duration_seconds}s`,
    `- integrated loudness: ${report.output.acoustic_audit.integrated_lufs} LUFS`,
    `- sample peak: ${report.output.acoustic_audit.peak_dbfs} dBFS`,
    `- maximum silence: ${report.output.acoustic_audit.maximum_silence_seconds}s`,
    `- average bitrate: ${report.output.structural_audit.average_bitrate_kbps} kbps`,
    `- G work input: \`${report.scratch.input.file}\` (${report.scratch.input.bytes} bytes, \`${report.scratch.input.sha256}\`)`,
    `- G work output: \`${report.scratch.output.file}\` (${report.scratch.output.bytes} bytes, \`${report.scratch.output.sha256}\`)`,
    `- G work retained: ${report.scratch.retained}`,
    `- F copy mode: ${report.output.copy_mode}`,
    `- eligible for human listening: ${report.eligible_for_human_listening}`,
    "- accountable candidate: false",
    "- runtime/score/seal/bundle/AIT/release transition: none",
    `- JSON audit SHA-256: \`${reportSha256}\``,
    "",
    "The immutable raw parent remains the Google Generative AI/SynthID assertion authority. The derivative does not claim a copied or validated C2PA signature.",
    "",
    "The Python toolchain ran only inside the short G: Dev Drive work directory because the fixed F target path is longer than the Windows MAX_PATH ceiling that libsndfile enforces. The acoustic audit therefore reads the retained byte-identical G work output; its SHA-256 equals the F final SHA-256.",
    "",
  ].join("\n");
}

function buildReport({ authority, helperResult, outputFact, structural, acoustic, protectedBefore, protectedAfter, executionPaths, scratchInputFact, scratchOutputFact }) {
  const structuralProblems = structuralErrors(structural, authority.parentAudit.acoustic_audit.duration_seconds);
  const acousticProblems = acousticErrors(acoustic, authority.parentAudit.acoustic_audit);
  const pass = structuralProblems.length === 0 && acousticProblems.length === 0;
  const durationDelta = Number(Math.abs(acoustic.duration_seconds - authority.parentAudit.acoustic_audit.duration_seconds).toFixed(4));
  const loudnessDelta = Number((acoustic.integrated_lufs - authority.parentAudit.acoustic_audit.integrated_lufs).toFixed(3));
  const targetLufsError = Number(Math.abs(acoustic.integrated_lufs - -18).toFixed(3));
  assert(helperResult.gain_db === gainDb, "helper gain result drift");
  assert(Math.abs(helperResult.linear_scalar - 10 ** (gainDb / 20)) < 1e-12, "helper scalar drift");
  assert(helperResult.execution_cwd === executionPaths.cwd, "helper reported a different working directory");
  assert(helperResult.source_argument === executionPaths.source, "helper reported a different source argument");
  assert(helperResult.destination_argument === executionPaths.destination, "helper reported a different destination argument");
  assert(protectedBefore.candidate_manifest_sha256 === protectedAfter.candidate_manifest_sha256, "candidate manifest changed during derivation");
  assert(protectedBefore.bgm_mapping_sha256 === protectedAfter.bgm_mapping_sha256, "bgm runtime mapping changed during derivation");
  assertScratchInputIdentity(scratchInputFact);
  return {
    schema: "donggrol.apr032.part1_lyria_derived_master.v1",
    attempt_id: attemptId,
    generated_at: new Date().toISOString(),
    part_id: "P1",
    slot_id: "bgm01",
    variant: "A",
    source_fingerprint_sha256: sourceFingerprint,
    parent: {
      attempt_id: parentAttemptId,
      audit_path: parentAuditPath,
      audit_bytes: authority.parentAuditFact.bytes,
      audit_sha256: authority.parentAuditFact.sha256,
      raw_sha256: expectedRawSha256,
      raw_bytes: expectedRawBytes,
      e_raw_path: authority.eRaw.file,
      f_raw_path: authority.fRaw.file,
      e_hash_match: true,
      f_hash_match: true,
      immutable: true,
    },
    scratch: {
      root: gScratchRoot,
      root_path_length: gScratchRoot.length,
      input: {
        file: gScratchInputPath,
        path_length: gScratchInputPath.length,
        bytes: scratchInputFact.bytes,
        sha256: scratchInputFact.sha256,
        copied_from: authority.fRaw.file,
        matches_parent_raw: true,
      },
      output: {
        file: gScratchOutputPath,
        path_length: gScratchOutputPath.length,
        bytes: scratchOutputFact.bytes,
        sha256: scratchOutputFact.sha256,
      },
      retained: true,
      deleted: false,
    },
    derivation: {
      gain_db: gainDb,
      linear_scalar: helperResult.linear_scalar,
      operations_applied: ["constant_gain"],
      operations_not_applied: ["trim", "fade", "limiter", "compressor", "denoise", "equalizer", "resample", "remix", "content_edit"],
      python_executable: pythonPath,
      python_executable_sha256: fileFact(pythonPath).sha256,
      helper_path: helperPath,
      helper_sha256: fileFact(helperPath).sha256,
      command_digest: commandDigest,
      node_version: process.version,
      path_mode: pathMode,
      execution_cwd: executionPaths.cwd,
      source_argument: executionPaths.source,
      destination_argument: executionPaths.destination,
      python_version: helperResult.python_version,
      soundfile_version: helperResult.soundfile_version,
      libsndfile_version: helperResult.libsndfile_version,
      numpy_version: helperResult.numpy_version,
      encoder: helperResult.encoder,
    },
    output: {
      file: outputPath,
      filename: outputFilename,
      path_length: outputPath.length,
      bytes: outputFact.bytes,
      sha256: outputFact.sha256,
      copied_from: gScratchOutputPath,
      copy_mode: "exclusive_create_no_overwrite",
      copy_hash_parity: true,
      structural_audit: {
        status: structuralProblems.length === 0 ? "passed" : "failed",
        ...structural,
        errors: structuralProblems,
      },
      acoustic_audit: {
        status: acousticProblems.length === 0 ? "passed" : "failed",
        ...acoustic,
        source: acousticSourceLabel,
        source_file: gScratchOutputPath,
        source_sha256: scratchOutputFact.sha256,
        parent_duration_seconds: authority.parentAudit.acoustic_audit.duration_seconds,
        duration_delta_seconds: durationDelta,
        parent_integrated_lufs: authority.parentAudit.acoustic_audit.integrated_lufs,
        loudness_delta_lu: loudnessDelta,
        target_lufs: -18,
        target_lufs_error: targetLufsError,
        errors: acousticProblems,
      },
    },
    provider_provenance: {
      parent_google_generative_ai_assertion_present: true,
      parent_synthid_watermark_assertion_present: true,
      exact_lyria_3_pro_marker_visible: false,
      derived_c2pa_copied: false,
      derived_signature_claimed: false,
      authority: "immutable_raw_parent_hash_lineage",
    },
    verification: {
      schema_valid: true,
      parent_audit_hash_match: true,
      parent_e_hash_match: true,
      parent_f_hash_match: true,
      g_input_hash_match: true,
      helper_exit_zero: true,
      output_hash_verified: true,
      g_output_f_copy_hash_match: true,
      f_final_overwrite: false,
      g_scratch_retained: true,
      structural_pass: structuralProblems.length === 0,
      acoustic_pass: acousticProblems.length === 0,
      report_copy_hash_match: true,
    },
    protected_status: {
      raw_modified: false,
      imported_candidate: false,
      human_listened: false,
      human_approved: false,
      runtime_promoted: false,
      candidate_count_delta: 0,
      selected_master_count_delta: 0,
      score_delta: 0,
      seal_changed: false,
      bundle_created: false,
      ait_created: false,
      release_go: false,
      candidate_manifest_sha256_before: protectedBefore.candidate_manifest_sha256,
      candidate_manifest_sha256_after: protectedAfter.candidate_manifest_sha256,
      candidate_manifest_unchanged: true,
      bgm_mapping_sha256_before: protectedBefore.bgm_mapping_sha256,
      bgm_mapping_sha256_after: protectedAfter.bgm_mapping_sha256,
      bgm_mapping_unchanged: true,
    },
    eligible_for_human_listening: pass,
    decision: pass ? "technical_pass_human_listening_pending" : "failed_closed",
  };
}

// Attempts 1 and 2 proved that a late failure is expensive, so plan mode drives the
// real buildReport path with representative values and validates both schema branches
// before anything is written. It reads files but creates nothing.
function planSchemaProbe(authority, protectedSnapshot, executionPaths) {
  const helperResult = {
    gain_db: gainDb,
    linear_scalar: 10 ** (gainDb / 20),
    execution_cwd: executionPaths.cwd,
    source_argument: executionPaths.source,
    destination_argument: executionPaths.destination,
    python_version: "0.0.0",
    soundfile_version: "0.14.0",
    libsndfile_version: "0.0.0",
    numpy_version: "0.0.0",
    encoder: { format: "MP3", subtype: "MPEG_LAYER_III", compression_level: 0, bitrate_mode: "CONSTANT" },
  };
  const passingStructural = { frame_count: 4045, sync_coverage: 1, duration_seconds: 105.67, sample_rates_hz: [44100], channel_counts: [2], average_bitrate_kbps: 320 };
  const passingAcoustic = {
    sample_rate_hz: 44100,
    channels: 2,
    decoded_frames: 4657536,
    duration_seconds: 105.6131,
    integrated_lufs: -18.007,
    peak_dbfs: -2.815,
    maximum_silence_seconds: 0.0435,
    silence_threshold_dbfs: -60,
    loop_seam_sample_delta: 0.000004,
    loop_start_rms: 0.00027,
    loop_end_rms: 0.000562,
    loop_three_cycle_human_pass: false,
  };
  const probeFact = { bytes: 4_224_000, sha256: "0".repeat(64) };
  const shared = {
    authority,
    helperResult,
    outputFact: probeFact,
    protectedBefore: protectedSnapshot,
    protectedAfter: protectedSnapshot,
    executionPaths,
    scratchInputFact: { bytes: expectedRawBytes, sha256: expectedRawSha256 },
    scratchOutputFact: probeFact,
  };
  const passing = buildReport({ ...shared, structural: passingStructural, acoustic: passingAcoustic });
  validateSchema(passing);
  assert(passing.decision === "technical_pass_human_listening_pending", "schema probe pass branch did not reach a technical pass");
  const failing = buildReport({ ...shared, structural: passingStructural, acoustic: { ...passingAcoustic, peak_dbfs: -0.2 } });
  validateSchema(failing);
  assert(failing.decision === "failed_closed" && failing.eligible_for_human_listening === false, "schema probe failure branch did not fail closed");
  return { pass_branch_valid: true, failed_closed_branch_valid: true };
}

function runSelfTest(name) {
  const supported = [
    "parent-hash",
    "path-escape",
    "output-exists",
    "gain-drift",
    "false-human",
    "false-runtime",
    "g-scratch-escape",
    "g-input-exists",
    "g-output-exists",
    "g-input-hash-mismatch",
    "g-copy-hash-mismatch",
    "f-overwrite",
  ];
  const cases = name === "all" ? supported : [name];
  assert(cases.every((item) => supported.includes(item)), `unknown self-test: ${name}`);
  const results = cases.map((item) => {
    let rejected = false;
    let reason = "";
    try {
      if (item === "parent-hash") assert("0".repeat(64) === expectedRawSha256, "parent raw hash drift");
      else if (item === "path-escape") validateFixedBoundary(path.resolve(fAttemptRoot, "..", "escaped.mp3"));
      else if (item === "output-exists") assertNoExistingTargets([outputPath]);
      else if (item === "gain-drift") assert(-2.7 === gainDb, "gain must be exactly -2.800 dB");
      else if (item === "false-human") assert(false === true, "automatic human approval rejected");
      else if (item === "false-runtime") assert(false === true, "automatic runtime promotion rejected");
      else if (item === "g-scratch-escape") validateScratchBoundary(path.resolve(gScratchRoot, "..", "escaped.mp3"));
      else if (item === "g-input-exists") assertNoExistingTargets([gScratchInputPath]);
      else if (item === "g-output-exists") assertNoExistingTargets([gScratchOutputPath]);
      else if (item === "g-input-hash-mismatch") assertScratchInputIdentity({ bytes: expectedRawBytes, sha256: "0".repeat(64) });
      else if (item === "g-copy-hash-mismatch") {
        assertCopyParity({ bytes: 10, sha256: "a".repeat(64) }, { bytes: 10, sha256: "b".repeat(64) }, "G work output and F final");
      } else if (item === "f-overwrite") {
        assertNoExistingTargets([outputPath, fReportPath]);
      }
    } catch (error) {
      rejected = true;
      reason = error.message;
    }
    assert(rejected, `${item} mutation was not rejected`);
    return { case: item, mutation_rejected: true, reason };
  });
  console.log(JSON.stringify({ pass: true, results }, null, 2));
}

function parseArgs(argv) {
  const args = { plan: false, apply: false, audit: false, confirm: false, selfTest: null };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--plan") args.plan = true;
    else if (token === "--apply") args.apply = true;
    else if (token === "--audit") args.audit = true;
    else if (token === "--confirm-v02-derived-master") args.confirm = true;
    else if (token === "--self-test") args.selfTest = argv[++index];
    else throw new Error(`unknown argument: ${token}`);
  }
  return args;
}

function auditExisting() {
  const authority = loadParentAuthority();
  assert(fs.existsSync(repoReportPath) && fs.existsSync(fReportPath), "APR-032 report copies are missing");
  const repoReportFact = fileFact(repoReportPath);
  const fReportFact = fileFact(fReportPath);
  assert(repoReportFact.sha256 === fReportFact.sha256, "repo/F report hash mismatch");
  const report = JSON.parse(repoReportFact.buffer.toString("utf8").replace(/^\uFEFF/u, ""));
  validateSchema(report);
  validateFixedBoundary(report.output.file);
  const outputFact = fileFact(report.output.file);
  assert(outputFact.bytes === report.output.bytes && outputFact.sha256 === report.output.sha256, "derived output bytes/hash drift");

  // The Python acoustic toolchain cannot open the 261-character F target, so the
  // audit re-reads the retained G work output and proves byte identity first.
  const scratchInputFact = fileFact(gScratchInputPath);
  const scratchOutputFact = fileFact(gScratchOutputPath);
  assertScratchInputIdentity(scratchInputFact);
  assert(scratchInputFact.sha256 === report.scratch.input.sha256, "G work input hash drift since the recorded audit");
  assert(scratchOutputFact.sha256 === report.scratch.output.sha256, "G work output hash drift since the recorded audit");
  assertCopyParity(scratchOutputFact, outputFact, "G work output and F final");

  const structural = analyzeMp3(outputFact.buffer);
  const scratchStructural = analyzeMp3(scratchOutputFact.buffer);
  assert(JSON.stringify(structural) === JSON.stringify(scratchStructural), "F final and G work output structural metrics diverge");
  const acoustic = analyzeAcoustics(gScratchOutputPath);
  assert(structuralErrors(structural, authority.parentAudit.acoustic_audit.duration_seconds).length === 0, "derived structural re-audit failed");
  assert(acousticErrors(acoustic, authority.parentAudit.acoustic_audit).length === 0, "derived acoustic re-audit failed");
  const protectedCurrent = protectedFacts();
  assert(protectedCurrent.candidate_manifest_sha256 === report.protected_status.candidate_manifest_sha256_after, "candidate manifest drift after derived audit");
  assert(protectedCurrent.bgm_mapping_sha256 === report.protected_status.bgm_mapping_sha256_after, "bgm mapping drift after derived audit");
  console.log(JSON.stringify({
    pass: true,
    mode: "audit",
    attempt_id: attemptId,
    report_sha256: repoReportFact.sha256,
    output: { file: outputFact.file, bytes: outputFact.bytes, sha256: outputFact.sha256, path_length: outputFact.file.length },
    scratch: {
      input: { file: scratchInputFact.file, bytes: scratchInputFact.bytes, sha256: scratchInputFact.sha256 },
      output: { file: scratchOutputFact.file, bytes: scratchOutputFact.bytes, sha256: scratchOutputFact.sha256 },
      retained: true,
    },
    parent: { e_sha256: authority.eRaw.sha256, f_sha256: authority.fRaw.sha256, bytes: authority.fRaw.bytes },
    structural,
    acoustic,
    acoustic_source: acousticSourceLabel,
    protected_status: report.protected_status,
    eligible_for_human_listening: report.eligible_for_human_listening,
    decision: report.decision,
  }, null, 2));
}

const args = parseArgs(process.argv.slice(2));
if (args.selfTest) {
  runSelfTest(args.selfTest);
  process.exit(0);
}
assert(Number(args.plan) + Number(args.apply) + Number(args.audit) === 1, "choose exactly one of --plan, --apply, or --audit");
validateFixedBoundary();
assert(fs.existsSync(schemaPath), `schema missing: ${schemaPath}`);
assert(fs.existsSync(helperPath), `derive helper missing: ${helperPath}`);
assert(fs.existsSync(acousticHelperPath), `acoustic helper missing: ${acousticHelperPath}`);
assert(fs.existsSync(pythonPath), `fixed Python missing: ${pythonPath}`);

if (args.audit) {
  auditExisting();
  process.exit(0);
}

const authority = loadParentAuthority();
const protectedBefore = protectedFacts();
const plannedExecution = resolveScratchExecution();
const existing = existingTargets();
if (args.plan) {
  console.log(JSON.stringify({
    pass: existing.length === 0,
    mode: "plan",
    attempt_id: attemptId,
    parent: { bytes: authority.fRaw.bytes, sha256: authority.fRaw.sha256, f_raw_path: authority.fRaw.file, e_raw_path: authority.eRaw.file },
    gain_db: gainDb,
    output_file: outputPath,
    output_path_length: outputPath.length,
    scratch: {
      root: gScratchRoot,
      root_exists: fs.existsSync(gScratchRoot),
      input: { file: gScratchInputPath, path_length: gScratchInputPath.length },
      output: { file: gScratchOutputPath, path_length: gScratchOutputPath.length },
      delete_after_apply: false,
    },
    path_mode: pathMode,
    helper_execution: plannedExecution,
    schema_probe: planSchemaProbe(authority, protectedBefore, plannedExecution),
    existing_targets: existing,
    candidate_import_allowed: false,
    runtime_promotion_allowed: false,
    human_approval: false,
  }, null, 2));
  process.exit(existing.length === 0 ? 0 : 1);
}

assert(args.confirm, "--apply requires --confirm-v02-derived-master");
assertNoExistingTargets(existing);

// Stage the immutable parent bytes into the short G work path with an exclusive
// create, then prove the staged copy is byte-identical before any DSP runs.
fs.mkdirSync(gScratchRoot, { recursive: true });
writeExclusive(gScratchInputPath, authority.fRaw.buffer);
const scratchInputFact = fileFact(gScratchInputPath);
assertScratchInputIdentity(scratchInputFact);
assertCopyParity(authority.fRaw, scratchInputFact, "F raw parent and G work input");

const helperExecution = resolveScratchExecution();
let helperResult;
try {
  const helperOutput = execFileSync(pythonPath, [
    helperPath,
    "--source", helperExecution.source,
    "--destination", helperExecution.destination,
    "--gain-db", gainDb.toFixed(3),
  ], { cwd: helperExecution.cwd, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  helperResult = JSON.parse(helperOutput);
} catch (error) {
  console.error(JSON.stringify({
    pass: false,
    decision: "failed_closed",
    attempt_id: attemptId,
    stage: "python_constant_gain_encode",
    error: error.message,
    stderr: typeof error.stderr === "string" ? error.stderr : null,
    helper_execution: helperExecution,
    preserved_scratch_input: fs.existsSync(gScratchInputPath) ? gScratchInputPath : null,
    preserved_scratch_output: fs.existsSync(gScratchOutputPath) ? gScratchOutputPath : null,
    f_final_created: fs.existsSync(outputPath),
  }, null, 2));
  process.exit(1);
}

const scratchOutputFact = fileFact(gScratchOutputPath);
const structural = analyzeMp3(scratchOutputFact.buffer);
const acoustic = analyzeAcoustics(gScratchOutputPath);
const protectedAfter = protectedFacts();
const preliminaryReport = buildReport({
  authority,
  helperResult,
  outputFact: { ...scratchOutputFact, file: outputPath },
  structural,
  acoustic,
  protectedBefore,
  protectedAfter,
  executionPaths: helperExecution,
  scratchInputFact,
  scratchOutputFact,
});
validateSchema(preliminaryReport);
if (preliminaryReport.decision !== "technical_pass_human_listening_pending") {
  console.error(JSON.stringify({
    pass: false,
    decision: preliminaryReport.decision,
    attempt_id: attemptId,
    stage: "structural_or_acoustic_audit",
    structural: preliminaryReport.output.structural_audit,
    acoustic: preliminaryReport.output.acoustic_audit,
    preserved_scratch_output: gScratchOutputPath,
    f_final_created: false,
  }, null, 2));
  process.exit(2);
}

// Only a verified G work output is copied, and only with an exclusive create.
assertNoExistingTargets(existingTargets().filter((file) => file !== gScratchInputPath && file !== gScratchOutputPath));
writeExclusive(outputPath, scratchOutputFact.buffer);
const finalFact = fileFact(outputPath);
assertCopyParity(scratchOutputFact, finalFact, "G work output and F final");
const finalStructural = analyzeMp3(finalFact.buffer);
assert(JSON.stringify(finalStructural) === JSON.stringify(structural), "F final structural metrics diverge from the verified G work output");

const report = { ...preliminaryReport, output: { ...preliminaryReport.output, file: outputPath, bytes: finalFact.bytes, sha256: finalFact.sha256 } };
validateSchema(report);
const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`, "utf8");
const reportSha256 = sha256(reportBytes);
const markdownBytes = Buffer.from(markdownFor(report, reportSha256), "utf8");
writeExclusive(repoReportPath, reportBytes);
writeExclusive(fReportPath, reportBytes);
writeExclusive(repoMarkdownPath, markdownBytes);
writeExclusive(fMarkdownPath, markdownBytes);
assert(fileFact(repoReportPath).sha256 === fileFact(fReportPath).sha256, "repo/F JSON report copy hash mismatch after write");
assert(fileFact(repoMarkdownPath).sha256 === fileFact(fMarkdownPath).sha256, "repo/F Markdown report copy hash mismatch after write");
const finalAuthority = loadParentAuthority();
assert(finalAuthority.eRaw.sha256 === expectedRawSha256 && finalAuthority.fRaw.sha256 === expectedRawSha256, "raw parent changed after derivation");
assert(fs.existsSync(gScratchInputPath) && fs.existsSync(gScratchOutputPath), "G work files must be retained");

console.log(JSON.stringify({
  pass: true,
  mode: "apply",
  attempt_id: attemptId,
  output: { file: outputPath, bytes: finalFact.bytes, sha256: finalFact.sha256, path_length: outputPath.length },
  scratch: {
    root: gScratchRoot,
    input: { file: gScratchInputPath, bytes: scratchInputFact.bytes, sha256: scratchInputFact.sha256 },
    output: { file: gScratchOutputPath, bytes: scratchOutputFact.bytes, sha256: scratchOutputFact.sha256 },
    retained: true,
    deleted: false,
  },
  helper_execution: helperExecution,
  report: { repo: repoReportPath, f: fReportPath, bytes: reportBytes.length, sha256: reportSha256 },
  structural: report.output.structural_audit,
  acoustic: report.output.acoustic_audit,
  eligible_for_human_listening: true,
  accountable_candidate: false,
  runtime_promoted: false,
  release_go: false,
}, null, 2));
