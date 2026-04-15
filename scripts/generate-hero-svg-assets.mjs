import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";

const REPO_ROOT = process.cwd();
const QUEUE_PATH = resolve(REPO_ROOT, "private/prompts/antigravity/master/STITCH_RENDER_QUEUE.json");
const OUTPUT_REPORT = resolve(REPO_ROOT, "output/hero-assets/hero-assets-report.json");
const GEMINI_BIN = process.platform === "win32" ? "gemini" : "gemini";
const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 900;

const PART_PALETTES = {
  P1: ["#14181c", "#2e3a44", "#5d6b72", "#b89d6a", "#efe4ca"],
  P2: ["#120f12", "#362026", "#7d2c1b", "#d86b2d", "#f1c777"],
  P3: ["#0c1319", "#173447", "#31586b", "#8cb8c4", "#dce8ec"],
  P4: ["#0c1012", "#2b3136", "#5b666d", "#9aa7ad", "#e1d7c8"]
};

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const trimmed = token.slice(2);
    if (trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      parsed[key] = rest.join("=");
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[trimmed] = "true";
      continue;
    }
    parsed[trimmed] = next;
    index += 1;
  }
  return parsed;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function stripCodeFence(input) {
  return input.replace(/^```(?:json)?/u, "").replace(/```$/u, "").trim();
}

function extractSection(markdown, sectionName) {
  const marker = `## ${sectionName}`;
  const sectionStart = markdown.indexOf(marker);
  if (sectionStart === -1) {
    return "";
  }

  const fenceStart = markdown.indexOf("```", sectionStart);
  if (fenceStart === -1) {
    return "";
  }

  const contentStart = markdown.indexOf("\n", fenceStart);
  if (contentStart === -1) {
    return "";
  }

  const fenceEnd = markdown.indexOf("```", contentStart + 1);
  if (fenceEnd === -1) {
    return "";
  }

  return markdown.slice(contentStart + 1, fenceEnd).trim();
}

function parseHeader(markdown) {
  const header = {};
  const block = markdown.split("## English Prompt")[0] ?? markdown;
  for (const line of block.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) {
      continue;
    }
    const separator = trimmed.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(2, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    header[key] = value;
  }
  return header;
}

function safeParsePrompt(filePath) {
  const absolutePath = resolve(REPO_ROOT, filePath);
  const markdown = readFileSync(absolutePath, "utf8");
  const header = parseHeader(markdown);
  const englishPrompt = extractSection(markdown, "English Prompt");
  const negativePrompt = extractSection(markdown, "Negative Prompt");
  const compositionNotes = markdown.match(/## Composition Notes\s+([\s\S]*?)(?:\n## |\s*$)/u)?.[1]?.trim() ?? "";
  return {
    absolutePath,
    header,
    englishPrompt,
    negativePrompt,
    compositionNotes
  };
}

function normalizePromptSubject(subject) {
  return String(subject ?? "")
    .replace(/\s+/gu, " ")
    .trim();
}

function fallbackSpec(header, englishPrompt) {
  const palette = PART_PALETTES[header.part_id] ?? PART_PALETTES.P2;
  const atmosphere = englishPrompt
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    title: header.chapter_id,
    subtitle: normalizePromptSubject(header.subject ?? header.asset_type ?? "background"),
    palette,
    atmosphere,
    skyline:
      header.part_id === "P1"
        ? "flooded civic skyline and relay interiors"
        : header.part_id === "P2"
          ? "checkpoint ruin and smoke corridor skyline"
          : header.part_id === "P3"
            ? "relay towers and archive infrastructure silhouette"
            : "harbor gate horizon and public-judgement decks",
    silhouette:
      header.part_id === "P1"
        ? "civilian records, wet paper stacks, relay equipment"
        : header.part_id === "P2"
          ? "convoys, barricades, smoke, and hard shadows"
          : header.part_id === "P3"
            ? "cold relay frames, triage desks, archive partitions"
            : "boarding gates, signal towers, and ceremonial chokepoints",
    accent:
      header.part_id === "P1"
        ? "archive relay glow"
        : header.part_id === "P2"
          ? "warning lane and red pressure"
          : header.part_id === "P3"
            ? "cold relay signal"
            : "public allocation beacon",
    overlay:
      header.part_id === "P1"
        ? "civic survival bureaucracy"
        : header.part_id === "P2"
          ? "route pressure and convoy panic"
          : header.part_id === "P3"
            ? "archival relay and quarantine math"
            : "boarding judgement and final gate tension",
    motion:
      header.part_id === "P1"
        ? "slow documentary drift"
        : header.part_id === "P2"
          ? "urgent lateral push"
          : header.part_id === "P3"
            ? "measured signal pulse"
            : "ritualized forward pressure"
  };
}

function runGeminiSpec(header, englishPrompt, negativePrompt, compositionNotes) {
  const prompt = [
    "Return JSON only. No markdown.",
    "You are creating a compact scene spec for a stylized 2D SVG key art renderer for a Korean apocalypse web game.",
    "Use this schema exactly:",
    '{"title":"string","subtitle":"string","palette":["#hex","#hex","#hex","#hex","#hex"],"atmosphere":["string","string","string","string"],"skyline":"string","silhouette":"string","accent":"string","overlay":"string","motion":"string"}',
    `part_id: ${header.part_id}`,
    `chapter_id: ${header.chapter_id}`,
    `asset_type: ${header.asset_type}`,
    `subject: ${header.subject ?? ""}`,
    `english_prompt: ${englishPrompt}`,
    `negative_prompt: ${negativePrompt}`,
    `composition_notes: ${compositionNotes}`,
    "Keep the mood grounded, civic, and Korean-apocalypse specific.",
    "Avoid superhero, neon cyberpunk, glossy sci-fi, anime, or fantasy spectacle."
  ].join("\n");

  let raw = "";

  if (process.platform === "win32") {
    const promptPath = resolve(REPO_ROOT, "output", "hero-assets", `${header.art_key_final}.prompt.txt`);
    mkdirSync(dirname(promptPath), { recursive: true });
    writeFileSync(promptPath, prompt, "utf8");
    raw = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$prompt = Get-Content -Raw '${promptPath.replace(/'/gu, "''")}'; ${GEMINI_BIN} --model gemini-2.5-flash --prompt $prompt --output-format text`
      ],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 60000,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
  } else {
    raw = execFileSync(
      GEMINI_BIN,
      ["--model", "gemini-2.5-flash", "--prompt", prompt, "--output-format", "text"],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 60000,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
  }

  const parsed = JSON.parse(stripCodeFence(raw.trim()));
  if (!Array.isArray(parsed.palette) || parsed.palette.length < 5) {
    throw new Error("Gemini palette response is incomplete.");
  }
  return parsed;
}

function escapeXml(input) {
  return String(input)
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&apos;");
}

function createBackgroundSvg(header, spec) {
  const [c1, c2, c3, c4, c5] = spec.palette;
  const chapter = header.chapter_id;
  const part = header.part_id;
  const title = escapeXml(spec.title);
  const subtitle = escapeXml(spec.subtitle);
  const accent = escapeXml(spec.accent);
  const overlay = escapeXml(spec.overlay);
  const atmosphere = (spec.atmosphere ?? []).map((token) => escapeXml(token)).slice(0, 4);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DEFAULT_WIDTH} ${DEFAULT_HEIGHT}" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="36%" stop-color="${c2}"/>
      <stop offset="74%" stop-color="${c3}"/>
      <stop offset="100%" stop-color="${c4}"/>
    </linearGradient>
    <linearGradient id="lane" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${c5}" stop-opacity="0.94"/>
      <stop offset="100%" stop-color="${c3}" stop-opacity="0.15"/>
    </linearGradient>
    <radialGradient id="halo" cx="68%" cy="32%" r="46%">
      <stop offset="0%" stop-color="${c5}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${c5}" stop-opacity="0"/>
    </radialGradient>
    <filter id="fog">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="17"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.05 0.1 0.15"/>
      </feComponentTransfer>
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>

  <rect width="${DEFAULT_WIDTH}" height="${DEFAULT_HEIGHT}" fill="url(#bg)"/>
  <rect width="${DEFAULT_WIDTH}" height="${DEFAULT_HEIGHT}" fill="#050607" opacity="0.24"/>
  <rect width="${DEFAULT_WIDTH}" height="${DEFAULT_HEIGHT}" fill="url(#halo)"/>

  <g opacity="0.34">
    <path d="M0 650 L250 580 L540 620 L820 540 L1110 592 L1600 470 L1600 900 L0 900 Z" fill="${c2}"/>
    <path d="M0 720 L240 680 L490 704 L780 650 L1060 700 L1330 640 L1600 670 L1600 900 L0 900 Z" fill="${c3}" opacity="0.86"/>
  </g>

  <g opacity="0.82">
    <polygon points="300,900 530,520 710,520 660,900" fill="${c2}" opacity="0.72"/>
    <polygon points="540,900 760,450 940,450 1140,900" fill="#0a0c0f"/>
    <polygon points="660,900 820,520 930,520 1000,900" fill="${c1}" opacity="0.84"/>
    <polygon points="1020,900 1180,580 1290,580 1360,900" fill="${c3}" opacity="0.44"/>
  </g>

  <g opacity="0.9">
    <rect x="664" y="150" width="18" height="338" fill="${c5}"/>
    <rect x="690" y="205" width="14" height="284" fill="${c4}"/>
    <rect x="1080" y="200" width="220" height="20" rx="10" fill="${c5}" opacity="0.9"/>
    <rect x="1045" y="234" width="292" height="10" rx="5" fill="${c5}" opacity="0.74"/>
    <rect x="220" y="615" width="1148" height="10" fill="${c5}" opacity="0.58"/>
    <polygon points="774,900 834,500 866,500 914,900" fill="url(#lane)" opacity="0.88"/>
  </g>

  <g fill="#030405" opacity="0.84">
    <rect x="208" y="592" width="56" height="152" rx="8"/>
    <rect x="284" y="606" width="48" height="138" rx="8"/>
    <rect x="954" y="566" width="136" height="84" rx="8"/>
    <rect x="988" y="515" width="16" height="84" rx="8"/>
    <rect x="1252" y="598" width="58" height="146" rx="8"/>
    <rect x="1336" y="620" width="44" height="124" rx="8"/>
  </g>

  <g filter="url(#fog)">
    <rect width="${DEFAULT_WIDTH}" height="${DEFAULT_HEIGHT}" fill="#ffffff" opacity="0.28"/>
  </g>

  <g>
    <rect x="72" y="68" width="250" height="34" rx="17" fill="${c5}" opacity="0.18"/>
    <text x="92" y="91" fill="${c5}" font-family="Segoe UI, Arial, sans-serif" font-size="18" letter-spacing="2">${escapeXml(`${part} // ${chapter}`)}</text>
    <text x="88" y="152" fill="#f5f1e7" font-family="Segoe UI, Arial, sans-serif" font-size="54" font-weight="700">${title}</text>
    <text x="90" y="194" fill="${c5}" font-family="Segoe UI, Arial, sans-serif" font-size="22">${subtitle}</text>
    <text x="88" y="762" fill="#f5f1e7" font-family="Consolas, monospace" font-size="22">${accent}</text>
    <text x="88" y="794" fill="#dbd2c3" font-family="Consolas, monospace" font-size="18">${overlay}</text>
    ${atmosphere
      .map(
        (token, index) =>
          `<text x="${1210 - index * 8}" y="${120 + index * 28}" fill="${c5}" fill-opacity="${0.28 + index * 0.08}" text-anchor="end" font-family="Segoe UI, Arial, sans-serif" font-size="17">${token}</text>`
      )
      .join("\n    ")}
  </g>
</svg>`;
}

function parseRatio(_ratioText) {
  return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
}

function filenameStem(filename) {
  return String(filename).replace(/\.[^.]+$/u, "");
}

function resolveOutputPaths(header) {
  const syncTargetPath = String(header.sync_target_path ?? "private/generated/packaged/images/bg/");
  const dropInboxPath = String(header.drop_inbox_path ?? `public/generated/images/inbox/${header.part_id}`);
  const filenameTarget = String(header.filename_target ?? `${header.art_key_final}_v01.webp`);
  const publicImageDir = resolve(REPO_ROOT, "public/generated/images");

  const svgTargets = [
    resolve(publicImageDir, `${header.art_key_final}.svg`),
    resolve(publicImageDir, `${filenameStem(filenameTarget)}.svg`)
  ];

  const webpTargets = [
    resolve(publicImageDir, `${header.art_key_final}.webp`),
    resolve(publicImageDir, filenameTarget),
    resolve(REPO_ROOT, dropInboxPath, filenameTarget),
    resolve(REPO_ROOT, syncTargetPath, filenameTarget)
  ];

  for (const outputPath of [...svgTargets, ...webpTargets]) {
    mkdirSync(dirname(outputPath), { recursive: true });
  }

  return {
    svgTargets: [...new Set(svgTargets)],
    webpTargets: [...new Set(webpTargets)]
  };
}

async function renderSvgToWebp(browser, svg, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  try {
    await page.setContent("<!doctype html><html><body style='margin:0;background:#000'><canvas id='c'></canvas></body></html>");
    const dataUrl = await page.evaluate(
      async ({ svgMarkup, targetWidth, targetHeight }) => {
        const canvas = document.getElementById("c");
        if (!(canvas instanceof HTMLCanvasElement)) {
          throw new Error("canvas missing");
        }
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("canvas context missing");
        }

        const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
        const objectUrl = URL.createObjectURL(blob);
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("svg image failed to load"));
            img.src = objectUrl;
          });
          ctx.clearRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          return canvas.toDataURL("image/webp", 0.92);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      },
      { svgMarkup: svg, targetWidth: width, targetHeight: height }
    );

    return Buffer.from(dataUrl.replace(/^data:image\/webp;base64,/u, ""), "base64");
  } finally {
    await page.close();
  }
}

function collectBackgroundTasks() {
  const queue = readJson(QUEUE_PATH);
  return (queue.tasks ?? []).filter((task) => task.kind === "image" && /\/background\//u.test(String(task.prompt_file ?? "")));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const withGemini = args["with-gemini"] === "true";
  const tasks = collectBackgroundTasks();
  const report = [];
  const browser = await chromium.launch({ headless: true });

  try {
    for (const task of tasks) {
      const { header, englishPrompt, negativePrompt, compositionNotes } = safeParsePrompt(task.prompt_file);
      const resolvedHeader = {
        ...header,
        part_id: header.part_id ?? task.part_id,
        chapter_id: header.chapter_id ?? task.chapter_id,
        drop_inbox_path: header.drop_inbox_path ?? task.target_path?.replace(/\/[^/]+$/u, ""),
        sync_target_path: header.sync_target_path ?? "private/generated/packaged/images/bg/",
        filename_target: header.filename_target ?? `${header.art_key_final}_v01.webp`,
        art_key_final: header.art_key_final,
        art_key_runtime: header.art_key_runtime ?? header.art_key_final
      };

      let spec;
      let generationMode = withGemini ? "gemini" : "fallback";
      if (withGemini) {
        try {
          spec = runGeminiSpec(resolvedHeader, englishPrompt, negativePrompt, compositionNotes);
        } catch {
          generationMode = "fallback";
          spec = fallbackSpec(resolvedHeader, englishPrompt);
        }
      } else {
        spec = fallbackSpec(resolvedHeader, englishPrompt);
      }

      const svg = createBackgroundSvg(resolvedHeader, spec);
      const { width, height } = parseRatio(resolvedHeader.ratio);
      const webpBuffer = await renderSvgToWebp(browser, svg, width, height);
      const { svgTargets, webpTargets } = resolveOutputPaths(resolvedHeader);

      for (const outputPath of svgTargets) {
        writeFileSync(outputPath, svg, "utf8");
      }
      for (const outputPath of webpTargets) {
        writeFileSync(outputPath, webpBuffer);
      }

      report.push({
        chapter_id: resolvedHeader.chapter_id,
        part_id: resolvedHeader.part_id,
        prompt_file: task.prompt_file,
        art_key_final: resolvedHeader.art_key_final,
        public_runtime_target: task.public_runtime_target,
        generation_mode: generationMode,
        webp_targets: webpTargets,
        svg_targets: svgTargets
      });
    }
  } finally {
    await browser.close();
  }

  mkdirSync(dirname(OUTPUT_REPORT), { recursive: true });
  writeFileSync(OUTPUT_REPORT, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ generated: report.length, report_path: OUTPUT_REPORT }, null, 2));
}

await main();


