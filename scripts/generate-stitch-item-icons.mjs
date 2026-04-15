import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ITEM_DB_PATH = path.join(ROOT, "private", "content", "data", "inventory.items.json");
const PROMPT_ROOT = path.join(ROOT, "private", "prompts", "antigravity", "item-icons");
const MASTER_ROOT = path.join(ROOT, "private", "prompts", "antigravity", "master");
const QUEUE_PATH = path.join(MASTER_ROOT, "STITCH_ITEM_ICON_QUEUE.json");
const REPORT_PATH = path.join(MASTER_ROOT, "STITCH_ITEM_ICON_QUEUE.md");
const STITCH_SPACE = "donggrol_item_icons";
const SOURCE_ROOT = "public/generated/icons/inbox";
const RUNTIME_ROOT = "public/generated/icons/items";
const PACKAGED_ROOT = "private/generated/packaged/images/items";
const OUTPUT_SIZE = 256;

const CATEGORY_STYLE = {
  weapon: "close-up salvage weapon evidence tray, impact wear, metal scratches, infected residue warning tape",
  ammo: "sealed ammo pack on a dark contamination tray, practical military inventory framing",
  gear: "survival gear inspection tray, nylon, rubber, matte practical lighting",
  consumable: "medical or field consumable on a quarantine tray, clean silhouette, practical packaging",
  crafting: "scrap component evidence layout, utility-focused salvage framing",
  utility: "field utility tool on an infected checkpoint tray, readable silhouette, emergency-use vibe",
  quest: "critical mission artifact on a guarded quarantine tray, story-significant evidence tone",
  barter: "trade-good evidence tray, rationed civilian salvage tone"
};

const RARITY_STYLE = {
  common: "low prestige, worn, frequently handled, still usable",
  uncommon: "scarcer, better maintained, stronger silhouette contrast",
  rare: "high-value field find, cleaner focal lighting, stronger detail separation",
  epic: "exceptional survivor-grade find, deliberate premium finish without fantasy styling"
};

function normalizeText(value) {
  return String(value ?? "").replace(/^\uFEFF/u, "").trim();
}

async function readJson(filePath) {
  return JSON.parse(normalizeText(await fs.readFile(filePath, "utf8")));
}

async function writeText(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${value.trim()}\n`, "utf8");
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function toRelative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function safeLabel(item) {
  return normalizeText(item.name_en || item.name_ko || item.item_id);
}

function buildPrompt(item) {
  const label = safeLabel(item);
  const categoryStyle = CATEGORY_STYLE[item.category] ?? "practical apocalypse inventory tray, grounded realism";
  const rarityStyle = RARITY_STYLE[item.rarity] ?? "grounded salvage realism";
  const chapter = normalizeText(item.introduced_in || "CH01");
  const tags = unique(item.tags ?? []).join(", ") || "survival loot";
  const subcategory = normalizeText(item.subcategory || item.category || "gear");
  const description = normalizeText(item.description || label);

  return `
# Stitch Item Icon Prompt

- Item ID: ${item.item_id}
- Label: ${label}
- Introduced In: ${chapter}
- Category: ${item.category}
- Subcategory: ${subcategory}
- Runtime Output: public/generated/icons/items/${item.item_id}.png
- Crop Rule: center-square to ${OUTPUT_SIZE}x${OUTPUT_SIZE}

## Prompt

Create a single-source square image for a Korean apocalypse webgame inventory icon.

Subject: ${label}

Style direction:
- infected containment UI evidence tray
- Seoul and capital-area civilian apocalypse realism
- grounded salvage object photography, not fantasy loot art
- dark matte background with subtle quarantine stripe, grime, dried residue, and emergency tray lighting
- object centered and fully visible inside the middle 75 percent of the frame
- silhouette must remain readable after a center-square crop to ${OUTPUT_SIZE}x${OUTPUT_SIZE}
- no human hands, no character face, no full zombie body, no readable text, no watermark, no logo

Object cues:
- ${categoryStyle}
- ${rarityStyle}
- tags: ${tags}
- description cue: ${description}

Render one item only. Keep the composition tight, clean, and inventory-ready.
`;
}

async function main() {
  const itemDb = await readJson(ITEM_DB_PATH);
  const tasks = [];

  for (const item of itemDb.items ?? []) {
    const promptPath = path.join(PROMPT_ROOT, item.item_id, "item_icon.md");
    await writeText(promptPath, buildPrompt(item));

    tasks.push({
      task_id: `item-icon:${item.item_id}`,
      kind: "image",
      item_id: item.item_id,
      part_id: String(item.introduced_in ?? "CH01").replace(/^CH(\d+).*$/u, (_, digits) => {
        const chapterNo = Number(digits);
        if (chapterNo <= 5) return "P1";
        if (chapterNo <= 10) return "P2";
        if (chapterNo <= 15) return "P3";
        return "P4";
      }),
      chapter_id: item.introduced_in ?? "CH01",
      prompt_file: toRelative(promptPath),
      target_path: `${SOURCE_ROOT}/${item.item_id}_source_v01.png`,
      crop_target_path: `${RUNTIME_ROOT}/${item.item_id}.png`,
      public_runtime_target: `${RUNTIME_ROOT}/${item.item_id}.png`,
      publish_target_path: `${PACKAGED_ROOT}/${item.item_id}.png`,
      stitch_space: STITCH_SPACE,
      crop_mode: "center-square",
      output_size: OUTPUT_SIZE
    });
  }

  const queue = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    item_task_count: tasks.length,
    stitch_space: STITCH_SPACE,
    tasks
  };

  const reportLines = [
    "# Stitch Item Icon Queue",
    "",
    `- generated_at: ${queue.generated_at}`,
    `- task_count: ${tasks.length}`,
    `- stitch_space: ${STITCH_SPACE}`,
    `- source_root: ${SOURCE_ROOT}`,
    `- runtime_root: ${RUNTIME_ROOT}`,
    `- packaged_root: ${PACKAGED_ROOT}`,
    "",
    "## Run Order",
    "",
    "1. `npm run asset-prompts:item-icons`",
    "2. Render each prompt through Stitch into `public/generated/icons/inbox/<item_id>_source_v01.png`",
    "3. `npm run assets:item-icons:crop`",
    "",
    "## Tasks",
    ...tasks.map(
      (task) => `- ${task.item_id} | ${task.prompt_file} | ${task.target_path} -> ${task.crop_target_path}`
    )
  ];

  await writeJson(QUEUE_PATH, queue);
  await writeText(REPORT_PATH, reportLines.join("\n"));
  console.log(
    JSON.stringify(
      {
        queue: toRelative(QUEUE_PATH),
        report: toRelative(REPORT_PATH),
        task_count: tasks.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

