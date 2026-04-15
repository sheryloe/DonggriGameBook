import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  PRIVATE_PROMPTS_ANTIGRAVITY_ROOT,
  PUBLIC_GENERATED_ROOT,
  REPO_ROOT,
  relFromRoot,
  resolveNormalizedRepoPath,
} from "./private-paths.mjs";

const ROOT = REPO_ROOT;
const MANIFEST_FILE = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "MASTER_ASSET_MANIFEST.json");
const ALIAS_FILE = path.join(PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, "master", "RUNTIME_ART_KEY_ALIAS.json");
const GENERATED_ROOT = path.join(PUBLIC_GENERATED_ROOT, "images");
const INBOX_ROOT = path.join(GENERATED_ROOT, "inbox");
const REPORT_DIR = path.join(ROOT, "output", "asset-sync");
const ALLOWED_EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg", ".svg"];
const RASTER_EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg"];

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

async function readJson(filePath) {
  return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/u, ""));
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function normalizePartFilter(partArg) {
  if (!partArg) {
    return null;
  }
  return new Set(
    String(partArg)
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean),
  );
}

async function listFilesRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(absolutePath)));
      continue;
    }
    files.push(absolutePath);
  }
  return files;
}

function extensionOf(filePath) {
  return path.extname(filePath).toLowerCase();
}

function basenameWithoutExtension(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function sameFileContent(leftPath, rightPath) {
  if (!(await fileExists(leftPath)) || !(await fileExists(rightPath))) {
    return false;
  }

  const [left, right] = await Promise.all([fs.readFile(leftPath), fs.readFile(rightPath)]);
  return left.equals(right);
}

async function copyIfChanged(sourcePath, targetPath, dryRun) {
  await ensureDir(path.dirname(targetPath));
  if (await sameFileContent(sourcePath, targetPath)) {
    return { changed: false, targetPath };
  }

  if (!dryRun) {
    await fs.copyFile(sourcePath, targetPath);
  }
  return { changed: true, targetPath };
}

function buildAssetLookup(assets) {
  const byFilename = new Map();
  const byBasename = new Map();

  for (const asset of assets) {
    byFilename.set(String(asset.filename_target).toLowerCase(), asset);
    byBasename.set(basenameWithoutExtension(asset.filename_target).toLowerCase(), asset);
  }

  return { byFilename, byBasename };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = args["dry-run"] === "true";
  const selectedParts = normalizePartFilter(args.part);

  const manifest = await readJson(MANIFEST_FILE);
  const aliasManifest = await readJson(ALIAS_FILE);
  const selectedAssets = (manifest.assets ?? []).filter((asset) => !selectedParts || selectedParts.has(asset.part_id));

  await Promise.all([
    ensureDir(INBOX_ROOT),
    ensureDir(path.join(INBOX_ROOT, "P1")),
    ensureDir(path.join(INBOX_ROOT, "P2")),
    ensureDir(path.join(INBOX_ROOT, "P3")),
    ensureDir(path.join(INBOX_ROOT, "P4")),
    ensureDir(REPORT_DIR),
  ]);

  const { byFilename, byBasename } = buildAssetLookup(selectedAssets);
  const inboxFiles = (await listFilesRecursive(INBOX_ROOT)).filter((filePath) =>
    ALLOWED_EXTENSIONS.includes(extensionOf(filePath)),
  );

  const duplicateNames = [];
  const unknownFiles = [];
  const formatMismatches = [];
  const matchedAssets = [];
  const fileNameOwners = new Map();

  for (const filePath of inboxFiles) {
    const filename = path.basename(filePath).toLowerCase();
    const basename = basenameWithoutExtension(filePath).toLowerCase();
    const matchedAsset = byFilename.get(filename) ?? byBasename.get(basename);

    if (!matchedAsset) {
      unknownFiles.push(relFromRoot(filePath));
      continue;
    }

    if (fileNameOwners.has(matchedAsset.asset_id)) {
      duplicateNames.push({
        asset_id: matchedAsset.asset_id,
        existing: fileNameOwners.get(matchedAsset.asset_id),
        duplicate: relFromRoot(filePath),
      });
      continue;
    }

    const sourceExtension = extensionOf(filePath);
    const targetExtension = extensionOf(matchedAsset.filename_target);
    if (sourceExtension === ".svg" && RASTER_EXTENSIONS.includes(targetExtension)) {
      formatMismatches.push({
        asset_id: matchedAsset.asset_id,
        source_path: relFromRoot(filePath),
        source_extension: sourceExtension,
        target_extension: targetExtension,
        filename_target: matchedAsset.filename_target,
      });
      continue;
    }

    fileNameOwners.set(matchedAsset.asset_id, relFromRoot(filePath));
    matchedAssets.push({ asset: matchedAsset, sourcePath: filePath });
  }

  const operations = [];
  for (const { asset, sourcePath } of matchedAssets) {
    const ext = extensionOf(sourcePath);
    const publicByFilename = path.join(GENERATED_ROOT, asset.filename_target);
    const publicByArtKey = path.join(GENERATED_ROOT, `${asset.art_key_final}${ext}`);
    const packagedTarget = path.join(resolveNormalizedRepoPath(asset.sync_target_path), `${asset.art_key_final}${ext}`);

    operations.push({
      asset_id: asset.asset_id,
      source_path: relFromRoot(sourcePath),
      public_filename_path: relFromRoot(publicByFilename),
      public_art_key_path: relFromRoot(publicByArtKey),
      packaged_target_path: relFromRoot(packagedTarget),
      runtime_art_keys: asset.runtime_art_keys ?? [],
      sync_mode: asset.sync_mode ?? "filename_target",
    });

    await copyIfChanged(sourcePath, publicByFilename, dryRun);
    await copyIfChanged(sourcePath, publicByArtKey, dryRun);
    await copyIfChanged(sourcePath, packagedTarget, dryRun);
  }

  const matchedAssetIds = new Set(matchedAssets.map((entry) => entry.asset.asset_id));
  const missingAssets = selectedAssets
    .filter((asset) => !matchedAssetIds.has(asset.asset_id))
    .map((asset) => ({
      asset_id: asset.asset_id,
      part_id: asset.part_id,
      filename_target: asset.filename_target,
      drop_inbox_path: asset.drop_inbox_path,
    }));

  const aliasMismatches = [];
  const assetById = new Map(selectedAssets.map((asset) => [asset.asset_id, asset]));
  for (const mapping of aliasManifest.mappings ?? []) {
    const owner = assetById.get(mapping.asset_id);
    if (!owner) {
      continue;
    }
    const expectedRuntimeKeys = new Set(owner.runtime_art_keys ?? []);
    if (expectedRuntimeKeys.size > 0 && !expectedRuntimeKeys.has(mapping.runtime_art_key)) {
      aliasMismatches.push({
        asset_id: owner.asset_id,
        runtime_art_key: mapping.runtime_art_key,
        reason: "runtime key not declared on asset",
      });
    }
  }

  const report = {
    dry_run: dryRun,
    selected_parts: selectedParts ? [...selectedParts] : ["ALL"],
    inbox_root: relFromRoot(INBOX_ROOT),
    matched_count: matchedAssets.length,
    missing_count: missingAssets.length,
    duplicate_count: duplicateNames.length,
    unknown_count: unknownFiles.length,
    format_mismatch_count: formatMismatches.length,
    alias_mismatch_count: aliasMismatches.length,
    operations,
    duplicates: duplicateNames,
    unknown_files: unknownFiles,
    format_mismatches: formatMismatches,
    missing_assets: missingAssets,
    alias_mismatches: aliasMismatches,
  };

  const suffix = dryRun ? "dry-run" : "apply";
  const jsonReportPath = path.join(REPORT_DIR, `asset-sync-${suffix}.json`);
  await fs.writeFile(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(
    path.join(REPORT_DIR, `asset-sync-${suffix}.md`),
    [
      "# Asset Sync Report",
      "",
      `- dry_run: ${dryRun}`,
      `- selected_parts: ${(selectedParts ? [...selectedParts] : ["ALL"]).join(", ")}`,
      `- matched: ${matchedAssets.length}`,
      `- missing: ${missingAssets.length}`,
      `- duplicates: ${duplicateNames.length}`,
      `- unknown_files: ${unknownFiles.length}`,
      `- format_mismatches: ${formatMismatches.length}`,
      `- alias_mismatches: ${aliasMismatches.length}`,
      "",
      "## Missing Assets",
      ...missingAssets.map((asset) => `- ${asset.asset_id} | ${asset.filename_target} | ${asset.drop_inbox_path}`),
      "",
      "## Unknown Files",
      ...unknownFiles.map((entry) => `- ${entry}`),
      "",
      "## Format Mismatches",
      ...formatMismatches.map(
        (entry) => `- ${entry.asset_id} | ${entry.source_path} | ${entry.source_extension} -> ${entry.target_extension}`,
      ),
      "",
    ].join("\n"),
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        dry_run: dryRun,
        matched: matchedAssets.length,
        missing: missingAssets.length,
        duplicates: duplicateNames.length,
        unknown: unknownFiles.length,
        format_mismatches: formatMismatches.length,
        report: relFromRoot(jsonReportPath),
      },
      null,
      2,
    ),
  );

  if (duplicateNames.length > 0 || formatMismatches.length > 0 || aliasMismatches.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
