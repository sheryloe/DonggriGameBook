import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const promptRoot = path.join(root, "private", "prompts", "openai-image-batch", "part1-40");
const backupRoot = path.join(root, "private", "generated", "backups", "openai-part1-40");

const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_QUALITY = "low";
const DEFAULT_WEBP_COMPRESSION = 72;
const DEFAULT_SIZE = "1024x1024";

const baseStyle = "Korean disaster survival game art, cinematic realistic, low detail, moody light, no readable text.";

const taskDefs = [
  ["P1-CH01-POSTER-KO", "CH01", "poster", "poster_ch01_yeouido_ash.webp", "ruined broadcast station poster key art, yellow monitor, dark Seoul rain"],
  ["P1-CH01-BG-PRIMARY", "CH01", "background", "bg_ch01_yeouido_ash_primary.webp", "abandoned broadcast lobby, wet floor, emergency tape, yellow terminal glow"],
  ["P1-CH01-BG-SECONDARY", "CH01", "background", "bg_ch01_yeouido_ash_secondary.webp", "rooftop transmitter, broken antenna, stormy Seoul skyline, cold wind"],
  ["P1-CH01-PORTRAIT-YOON", "CH01", "portrait", "portrait_npc_yoon_haein_ch01_anchor.webp", "Korean radio operator woman, headset, rain jacket, tired focused face"],
  ["P1-CH01-PORTRAIT-JUNG", "CH01", "portrait", "portrait_npc_jung_noah_ch01_support.webp", "Korean records clerk man, wet folder, anxious survivor, office cardigan"],
  ["P1-CH01-THREAT-BASIC", "CH01", "threat", "threat_p1_ch01_broadcast_hall_infected.png", "shadowy broadcast staff figure, dark corridor, microphone cable, static light"],
  ["P1-CH01-THREAT-BOSS", "CH01", "threat", "threat_editing_aberration.webp", "editing room hazard figure, tape reels, monitor static, cable shadows"],
  ["P1-CH01-TEASER", "CH01", "teaser", "teaser_ch01_entry.webp", "emergency broadcast desk, dead microphone, cracked monitor, dark hallway"],

  ["P1-CH02-POSTER-KO", "CH02", "poster", "poster_ch02_flooded_market.webp", "flooded market poster key art, black water, dim stalls, drain gate"],
  ["P1-CH02-BG-PRIMARY", "CH02", "background", "bg_ch02_flooded_market_primary.webp", "flooded market entrance, shuttered stalls, black water, yellow lamps"],
  ["P1-CH02-BG-SECONDARY", "CH02", "background", "bg_ch02_flooded_market_secondary.webp", "cold storage corridor, mist, freezer doors, water reflections"],
  ["P1-CH02-PORTRAIT-JUNG", "CH02", "portrait", "portrait_npc_jung_noah_ch02_anchor.webp", "Korean clerk survivor, soaked clothes, sealed ledger, cautious eyes"],
  ["P1-CH02-PORTRAIT-SEO", "CH02", "portrait", "portrait_npc_seo_jinseo_ch02_support.webp", "Korean boat mechanic, waterproof jacket, rope coil, calm suspicion"],
  ["P1-CH02-THREAT", "CH02", "threat", "threat_sluice_sac_cheongeum.webp", "sluice gate hazard silhouette, rushing water, chain mesh, warning lamps"],
  ["P1-CH02-TEASER", "CH02", "teaser", "teaser_ch02_entry.webp", "market aisle in black water, floating wristband, distant gate silhouette"],
  ["P1-CH02-MAP", "CH02", "map", "map_p1_ch02.webp", "wet survivor route map, flooded market, pier, sluice gate markers"],

  ["P1-CH03-POSTER-KO", "CH03", "poster", "poster_ch03_jamsil_vertical.webp", "glass garden tower poster key art, broken atrium, hanging plants"],
  ["P1-CH03-BG-PRIMARY", "CH03", "background", "bg_ch03_jamsil_vertical_primary.webp", "ruined vertical garden lobby, glass floors, vines, emergency light"],
  ["P1-CH03-BG-SECONDARY", "CH03", "background", "bg_ch03_jamsil_vertical_secondary.webp", "high skybridge, cracked glass, wind, wet plants, Seoul night"],
  ["P1-CH03-PORTRAIT-AHN", "CH03", "portrait", "portrait_npc_ahn_bogyeong_ch03_anchor.webp", "Korean security engineer woman, utility vest, breaker tag, severe calm"],
  ["P1-CH03-PORTRAIT-RYU", "CH03", "portrait", "portrait_npc_ryu_seon_ch03_support.webp", "young Korean courier survivor, rain poncho, messenger bag, nervous"],
  ["P1-CH03-THREAT", "CH03", "threat", "threat_vista_amalgam_glassgarden.webp", "uncanny figure hidden by vines and cracked glass, green emergency light"],
  ["P1-CH03-TEASER", "CH03", "teaser", "teaser_ch03_entry.webp", "stuck elevator doors, glass atrium, dripping plants, flickering power"],
  ["P1-CH03-MAP", "CH03", "map", "map_p1_ch03.webp", "vertical tower route board, floor marks, generator pins, skybridge line"],

  ["P1-CH04-POSTER-KO", "CH04", "poster", "poster_ch04_munjeong_logistics.webp", "logistics warehouse poster key art, conveyor belts, medical crates"],
  ["P1-CH04-BG-PRIMARY", "CH04", "background", "bg_ch04_munjeong_logistics_primary.webp", "automated sorting hall, silent conveyors, red scanners, crates"],
  ["P1-CH04-BG-SECONDARY", "CH04", "background", "bg_ch04_munjeong_logistics_secondary.webp", "cold warehouse rail area, shutters, forklift, emergency lights"],
  ["P1-CH04-PORTRAIT-HAN", "CH04", "portrait", "portrait_npc_han_somyeong_ch04_anchor.webp", "Korean field medic woman, medical pouch, exhausted precise eyes"],
  ["P1-CH04-PORTRAIT-YOON", "CH04", "portrait", "portrait_npc_yoon_haein_ch04_support.webp", "Korean radio operator woman, warehouse red scanner glow, cracked radio"],
  ["P1-CH04-THREAT", "CH04", "threat", "threat_picker_prime.webp", "logistics hazard figure, conveyor straps, scanner light, stacked crates"],
  ["P1-CH04-TEASER", "CH04", "teaser", "teaser_ch04_entry.webp", "medical crate on conveyor, red scanner light, abandoned glove"],
  ["P1-CH04-MAP", "CH04", "map", "map_p1_ch04.webp", "crate lid route map, sorting hall, cold warehouse, rail transfer"],

  ["P1-CH05-POSTER-KO", "CH05", "poster", "poster_ch05_pangyo_server.webp", "server room poster key art, black screens, cables, cold blue light"],
  ["P1-CH05-BG-PRIMARY", "CH05", "background", "bg_ch05_pangyo_server_primary.webp", "Pangyo backup server entrance, glass doors, dark servers, emergency lights"],
  ["P1-CH05-BG-SECONDARY", "CH05", "background", "bg_ch05_pangyo_server_secondary.webp", "server hall skywalk, blue cooling haze, mirror screens, cables"],
  ["P1-CH05-PORTRAIT-KIM", "CH05", "portrait", "portrait_npc_kim_ara_ch05_anchor.webp", "Korean server archivist woman, hoodie, access card, monitor glow"],
  ["P1-CH05-PORTRAIT-YOON", "CH05", "portrait", "portrait_npc_yoon_haein_ch05_support.webp", "Korean radio operator woman, server core, headset, tired controlled face"],
  ["P1-CH05-THREAT", "CH05", "threat", "threat_mirror_core_lines.webp", "digital hazard silhouette in server mirrors, cable shadows, cold monitor glow"],
  ["P1-CH05-TEASER", "CH05", "teaser", "teaser_ch05_entry.webp", "black server corridor, terminal glow, reflected person, tangled cables"],
  ["P1-CH05-MAP", "CH05", "map", "map_p1_ch05.webp", "transparent server route map, lobby, skywalk, cooling room markers"],
];

const tasks = taskDefs.map(([id, chapter, kind, target, subject]) => task(id, chapter, kind, target, DEFAULT_SIZE, subject));

function task(id, chapter, kind, target, size, subject) {
  const targetPath = path.join("public", "generated", "images", target);
  const stem = target.replace(/\.[^.]+$/, "");
  const ext = path.extname(target).slice(1).toLowerCase();
  return {
    id,
    chapter,
    kind,
    target,
    size,
    output_format: ext === "jpg" ? "jpeg" : ext,
    prompt: `${baseStyle} ${subject}.`.trim(),
    targets: [
      targetPath,
      ...(ext === "webp" ? [path.join("public", "generated", "images", `${stem}_v01.webp`)] : []),
    ],
  };
}

function parseArgs(argv) {
  const args = {
    model: DEFAULT_MODEL,
    quality: DEFAULT_QUALITY,
    compression: DEFAULT_WEBP_COMPRESSION,
    dryRun: false,
    list: false,
    id: "",
    from: 1,
    limit: 0,
    count: 0,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--model") args.model = argv[++i] ?? args.model;
    else if (arg === "--quality") args.quality = argv[++i] ?? args.quality;
    else if (arg === "--compression") args.compression = Number(argv[++i] ?? args.compression);
    else if (arg === "--id") args.id = argv[++i] ?? "";
    else if (arg === "--from") args.from = Number(argv[++i] ?? 1);
    else if (arg === "--limit") args.limit = Number(argv[++i] ?? 0);
    else if (arg === "--count") args.count = Number(argv[++i] ?? 0);
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--list") args.list = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function selectTasks(args) {
  if (args.id) {
    const ids = new Set(args.id.split(",").map((id) => id.trim()).filter(Boolean));
    return tasks.filter((item) => ids.has(item.id));
  }
  const fromIndex = Math.max(0, args.from - 1);
  return args.limit > 0 ? tasks.slice(fromIndex, fromIndex + args.limit) : tasks.slice(fromIndex);
}

async function writeManifest(selected, args) {
  await fs.mkdir(promptRoot, { recursive: true });
  await fs.writeFile(
    path.join(promptRoot, "manifest.generated.json"),
    JSON.stringify({
      generated_at: new Date().toISOString(),
      default_model: args.model,
      default_quality: args.quality,
      default_size: DEFAULT_SIZE,
      prompt_policy: "short, direct, no readable text; poster Korean text is added by generate-part1-korean-posters.mjs",
      count: selected.length,
      tasks: selected,
    }, null, 2),
    "utf8",
  );
}

async function backupIfExists(targetRelPath, stamp) {
  const src = path.join(root, targetRelPath);
  try {
    await fs.access(src);
  } catch {
    return;
  }
  const dest = path.join(backupRoot, stamp, targetRelPath);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function saveToTargets(imageBytes, item, stamp) {
  for (const targetRelPath of item.targets) {
    await backupIfExists(targetRelPath, stamp);
    const targetAbs = path.join(root, targetRelPath);
    await fs.mkdir(path.dirname(targetAbs), { recursive: true });
    await fs.writeFile(targetAbs, imageBytes);
  }
}

function cleanPayload(payload) {
  return JSON.parse(JSON.stringify(payload, (_, value) => value === undefined ? undefined : value));
}

async function generateImage(item, args) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing. Set it in the current PowerShell session, not in a file.");
  }

  const body = cleanPayload({
    model: args.model,
    prompt: item.prompt,
    n: 1,
    size: item.size,
    quality: args.quality,
    output_format: item.output_format,
    output_compression: item.output_format === "webp" || item.output_format === "jpeg" ? args.compression : undefined,
  });

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`OpenAI API returned non-JSON response (${response.status}): ${text.slice(0, 400)}`);
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? JSON.stringify(payload).slice(0, 800);
    throw new Error(`OpenAI API error (${response.status}) for ${item.id}: ${message}`);
  }

  const first = payload?.data?.[0];
  if (first?.b64_json) return Buffer.from(first.b64_json, "base64");
  if (first?.url) {
    const asset = await fetch(first.url);
    if (!asset.ok) throw new Error(`Failed to download generated image for ${item.id}: ${asset.status}`);
    return Buffer.from(await asset.arrayBuffer());
  }
  throw new Error(`No image payload returned for ${item.id}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selected = selectTasks(args);

  if (tasks.length !== 40) throw new Error(`Internal task count must be exactly 40, got ${tasks.length}`);
  if (!selected.length) throw new Error("No tasks selected.");
  if (!args.id && args.limit === 0 && args.from === 1 && selected.length !== 40) {
    throw new Error(`Default run must generate exactly 40 images, got ${selected.length}`);
  }
  if (args.count > 0 && selected.length !== args.count) {
    throw new Error(`--count expected ${args.count}, selected ${selected.length}`);
  }

  await writeManifest(selected, args);

  if (args.list || args.dryRun) {
    for (const [index, item] of selected.entries()) {
      console.log(`${String(index + 1).padStart(2, "0")}. ${item.id} -> ${item.target}`);
      console.log(item.prompt);
      console.log("");
    }
    if (args.dryRun) return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  console.log(`Generating ${selected.length} images with model=${args.model}, quality=${args.quality}, size=${DEFAULT_SIZE}`);
  for (const [index, item] of selected.entries()) {
    console.log(`[${index + 1}/${selected.length}] ${item.id} -> ${item.target}`);
    const bytes = await generateImage(item, args);
    await saveToTargets(bytes, item, stamp);
  }
  console.log(`done: ${selected.length}/${selected.length}`);
  console.log(`manifest: ${path.join(promptRoot, "manifest.generated.json")}`);
  console.log(`backups: ${path.join(backupRoot, stamp)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
