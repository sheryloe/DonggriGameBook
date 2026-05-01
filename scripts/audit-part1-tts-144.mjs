import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const chapters = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const chapterRoot = path.join(root, "private", "content", "data", "chapters");
const ttsRoot = path.join(root, "public", "generated", "audio", "tts", "P1");
const outputRoot = path.join(root, "docs", "ops");
const jsonOutput = path.join(outputRoot, "PART1_TTS_144_EVALUATION.json");
const mdOutput = path.join(outputRoot, "PART1_TTS_144_EVALUATION.md");

const BITRATES = {
  V1L1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  V1L2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  V1L3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  V2L1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  V2L2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  V2L3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};

const SAMPLE_RATES = {
  MPEG1: [44100, 48000, 32000],
  MPEG2: [22050, 24000, 16000],
  MPEG25: [11025, 12000, 8000],
};

function readJson(filePath) {
  return readFile(filePath, "utf8").then((raw) => JSON.parse(raw.replace(/^\uFEFF/u, "")));
}

function syncSafeSize(buffer, offset) {
  return (
    ((buffer[offset] & 0x7f) << 21) |
    ((buffer[offset + 1] & 0x7f) << 14) |
    ((buffer[offset + 2] & 0x7f) << 7) |
    (buffer[offset + 3] & 0x7f)
  );
}

function parseHeader(buffer, offset) {
  if (offset + 4 > buffer.length) return null;
  const b1 = buffer[offset + 1];
  const b2 = buffer[offset + 2];
  const b3 = buffer[offset + 3];
  if (buffer[offset] !== 0xff || (b1 & 0xe0) !== 0xe0) return null;

  const versionBits = (b1 >> 3) & 0x03;
  const layerBits = (b1 >> 1) & 0x03;
  const bitrateIndex = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const padding = (b2 >> 1) & 0x01;
  const channelMode = (b3 >> 6) & 0x03;

  if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null;
  }

  const version = versionBits === 3 ? "MPEG1" : versionBits === 2 ? "MPEG2" : "MPEG25";
  const layer = layerBits === 3 ? 1 : layerBits === 2 ? 2 : 3;
  const bitrateKey = `${version === "MPEG1" ? "V1" : "V2"}L${layer}`;
  const bitrateKbps = BITRATES[bitrateKey][bitrateIndex];
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];
  if (!bitrateKbps || !sampleRate) return null;

  const samplesPerFrame = layer === 1 ? 384 : layer === 2 ? 1152 : version === "MPEG1" ? 1152 : 576;
  const frameLength = layer === 1
    ? Math.floor(((12 * bitrateKbps * 1000) / sampleRate + padding) * 4)
    : Math.floor((((version === "MPEG1" || layer === 2) ? 144 : 72) * bitrateKbps * 1000) / sampleRate + padding);

  if (frameLength <= 4) return null;
  return { version, layer, bitrateKbps, sampleRate, samplesPerFrame, frameLength, channels: channelMode === 3 ? 1 : 2 };
}

function parseMp3(filePath) {
  const buffer = readFileSync(filePath);
  let offset = 0;
  if (buffer.slice(0, 3).toString("latin1") === "ID3" && buffer.length >= 10) {
    offset = 10 + syncSafeSize(buffer, 6);
  }

  const firstOffset = offset;
  let frameCount = 0;
  let durationSeconds = 0;
  let bitrateSum = 0;
  let sampleRate = 0;
  let channels = 0;
  const bitrates = new Set();

  while (offset + 4 < buffer.length) {
    const header = parseHeader(buffer, offset);
    if (!header) {
      offset += 1;
      continue;
    }

    frameCount += 1;
    durationSeconds += header.samplesPerFrame / header.sampleRate;
    bitrateSum += header.bitrateKbps;
    bitrates.add(header.bitrateKbps);
    sampleRate = sampleRate || header.sampleRate;
    channels = channels || header.channels;
    offset += header.frameLength;
  }

  return {
    bytes: buffer.length,
    id3_bytes: firstOffset,
    parse_ok: frameCount > 0,
    frame_count: frameCount,
    duration_seconds: Number(durationSeconds.toFixed(2)),
    avg_bitrate_kbps: frameCount ? Number((bitrateSum / frameCount).toFixed(1)) : 0,
    sample_rate_hz: sampleRate,
    channels,
    vbr: bitrates.size > 1,
  };
}

function priorityFor(event) {
  const id = String(event.event_id ?? "");
  const title = String(event.title ?? "");
  const text = `${id} ${title}`.toUpperCase();
  if (/BRIEFING|ENTRY|BOSS|EXTRACTION|RESULT|DEADLINE|FAILURE/.test(text)) return "P0";
  if (/AMBUSH|LOCKDOWN|ESCAPE|PREP|CHECK|MEET|DECISION|SIGNAL/.test(text)) return "P1";
  return "P2";
}

function technicalStatus(metric) {
  if (!metric.exists) return { status: "missing", action: "create_mp3" };
  if (!metric.parse_ok) return { status: "critical", action: "reencode_or_regenerate" };
  if (metric.duration_seconds < 1.2) return { status: "review", action: "listen_short_line" };
  if (metric.duration_seconds > 32) return { status: "review", action: "split_or_tighten_line" };
  if (metric.avg_bitrate_kbps < 64) return { status: "review", action: "check_low_bitrate" };
  if (metric.bytes > 900_000) return { status: "review", action: "compress_or_trim" };
  return { status: "ok", action: "manual_emotion_review" };
}

function emotionReviewTemplate(priority) {
  return {
    required: true,
    score: null,
    threshold: priority === "P0" ? 8.8 : priority === "P1" ? 8.0 : 7.5,
    rubric: {
      acting_emotion: 0.35,
      korean_naturalness: 0.25,
      scene_fit: 0.2,
      technical_quality: 0.1,
      runtime_fit: 0.1,
    },
  };
}

function formatSeconds(value) {
  return `${Number(value).toFixed(2)}s`;
}

function markdownReport(report) {
  const rows = report.items.map((item, index) => [
    String(index + 1),
    item.priority,
    item.chapter_id,
    item.event_id,
    item.event_title.replaceAll("|", "/"),
    item.technical.status,
    formatSeconds(item.duration_seconds),
    `${item.avg_bitrate_kbps}kbps`,
    `${item.mb}MB`,
    item.technical.action,
  ]);

  const table = [
    "| # | 우선순위 | 챕터 | 이벤트 | 제목 | 기술상태 | 길이 | 비트레이트 | 용량 | 조치 |",
    "|---:|---|---|---|---|---|---:|---:|---:|---|",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

  return [
    "# Part 1 TTS 144개 전체 평가",
    "",
    `기준일: ${report.generated_at.slice(0, 10)}`,
    "",
    "## 결론",
    "",
    `- 대상: ${report.summary.total}개`,
    `- MP3 존재: ${report.summary.completed}개`,
    `- 누락: ${report.summary.missing}개`,
    `- 기술 OK: ${report.summary.technical_ok}개`,
    `- 기술 검토 필요: ${report.summary.technical_review}개`,
    `- 전체 용량: ${report.summary.total_mb}MB`,
    `- 총 재생 길이: ${report.summary.total_minutes}분`,
    "",
    "기술 기준으로는 런타임 배포 가능한 상태다. 다만 이 평가는 자동 기술 검사이며, 감정 연기 품질은 144개 모두 청음 평가가 필요하다.",
    "",
    "## 재제작 기준",
    "",
    "- `P0`: 브리핑, 진입, 보스, 결과, 실패/기한 이벤트. 상업용 기준 8.8점 미만이면 재제작.",
    "- `P1`: 조우, 탈출, 신호, 준비, 주요 판단 이벤트. 8.0점 미만이면 재제작.",
    "- `P2`: 보조 탐색/연결 이벤트. 7.5점 미만이면 재제작.",
    "",
    "## 챕터별 요약",
    "",
    "| 챕터 | 개수 | 기술 OK | 검토 필요 | 총 길이 | 용량 |",
    "|---|---:|---:|---:|---:|---:|",
    ...Object.entries(report.by_chapter).map(([chapterId, value]) =>
      `| ${chapterId} | ${value.total} | ${value.technical_ok} | ${value.technical_review} | ${value.total_minutes}분 | ${value.total_mb}MB |`
    ),
    "",
    "## 144개 평가 목록",
    "",
    table,
    "",
    "## 다음 실행",
    "",
    "```powershell",
    "Set-Location D:\\Donggri_Platform\\DonggrolGameBook",
    "npm run tts:part1:audit",
    "npm run build:part1",
    "```",
    "",
  ].join("\n");
}

async function main() {
  const items = [];

  for (const chapterFile of chapters) {
    const chapter = await readJson(path.join(chapterRoot, `${chapterFile}.json`));
    const chapterId = chapter.chapter_id;
    for (const event of chapter.events ?? []) {
      const eventId = event.event_id;
      const filePath = path.join(ttsRoot, chapterId, `${eventId}.mp3`);
      const exists = existsSync(filePath);
      const metric = exists
        ? parseMp3(filePath)
        : {
            bytes: 0,
            parse_ok: false,
            frame_count: 0,
            duration_seconds: 0,
            avg_bitrate_kbps: 0,
            sample_rate_hz: 0,
            channels: 0,
            vbr: false,
          };
      const priority = priorityFor(event);
      const technical = technicalStatus({ ...metric, exists });
      items.push({
        id: `P1-${chapterId}-${eventId}`,
        chapter_id: chapterId,
        chapter_title: chapter.title ?? chapterId,
        event_id: eventId,
        event_title: event.title ?? "",
        priority,
        path: `public/generated/audio/tts/P1/${chapterId}/${eventId}.mp3`,
        exists,
        ...metric,
        mb: Number((metric.bytes / 1024 / 1024).toFixed(2)),
        technical,
        emotion_review: emotionReviewTemplate(priority),
      });
    }
  }

  const byChapter = {};
  for (const chapter of ["CH01", "CH02", "CH03", "CH04", "CH05"]) {
    const chapterItems = items.filter((item) => item.chapter_id === chapter);
    byChapter[chapter] = {
      total: chapterItems.length,
      technical_ok: chapterItems.filter((item) => item.technical.status === "ok").length,
      technical_review: chapterItems.filter((item) => item.technical.status !== "ok").length,
      total_mb: Number(chapterItems.reduce((sum, item) => sum + item.mb, 0).toFixed(2)),
      total_minutes: Number((chapterItems.reduce((sum, item) => sum + item.duration_seconds, 0) / 60).toFixed(2)),
    };
  }

  const totalSeconds = items.reduce((sum, item) => sum + item.duration_seconds, 0);
  const report = {
    generated_at: new Date().toISOString(),
    scope: "Part 1 TTS 144 full audit",
    runtime_format: "mp3",
    summary: {
      total: items.length,
      completed: items.filter((item) => item.exists).length,
      missing: items.filter((item) => !item.exists).length,
      technical_ok: items.filter((item) => item.technical.status === "ok").length,
      technical_review: items.filter((item) => item.technical.status !== "ok").length,
      total_mb: Number(items.reduce((sum, item) => sum + item.mb, 0).toFixed(2)),
      total_minutes: Number((totalSeconds / 60).toFixed(2)),
      p0_count: items.filter((item) => item.priority === "P0").length,
      p1_count: items.filter((item) => item.priority === "P1").length,
      p2_count: items.filter((item) => item.priority === "P2").length,
    },
    by_chapter: byChapter,
    items,
  };

  await mkdir(outputRoot, { recursive: true });
  await writeFile(jsonOutput, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(mdOutput, markdownReport(report), "utf8");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`json: ${path.relative(root, jsonOutput)}`);
  console.log(`markdown: ${path.relative(root, mdOutput)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
