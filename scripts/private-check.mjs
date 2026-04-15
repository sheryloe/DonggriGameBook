import { promises as fs } from "node:fs";
import {
  PRIVATE_CONTENT_DATA_ROOT,
  PRIVATE_CONTENT_MANIFEST,
  PRIVATE_CONTENT_UI_ROOT,
  PRIVATE_PROMPTS_ANTIGRAVITY_ROOT,
  PRIVATE_PROMPTS_GEMINI_ROOT,
  PRIVATE_STORY_CONCEPT_ROOT,
  PRIVATE_STORY_WORLD_ROOT,
  relFromRoot
} from "./private-paths.mjs";

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function countFiles(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let count = 0;
    for (const entry of entries) {
      const absolute = `${dirPath}/${entry.name}`;
      if (entry.isDirectory()) {
        count += await countFiles(absolute);
      } else {
        count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

async function inspect(label, filePath, options = {}) {
  const exists = await pathExists(filePath);
  return {
    label,
    path: relFromRoot(filePath),
    exists,
    count: exists && options.countFiles ? await countFiles(filePath) : undefined,
    required: options.required !== false
  };
}

async function main() {
  const checks = await Promise.all([
    inspect("private manifest", PRIVATE_CONTENT_MANIFEST),
    inspect("private data root", PRIVATE_CONTENT_DATA_ROOT, { countFiles: true }),
    inspect("private ui root", PRIVATE_CONTENT_UI_ROOT, { countFiles: true }),
    inspect("story concept root", PRIVATE_STORY_CONCEPT_ROOT, { countFiles: true }),
    inspect("story world root", PRIVATE_STORY_WORLD_ROOT, { countFiles: true }),
    inspect("antigravity prompt root", PRIVATE_PROMPTS_ANTIGRAVITY_ROOT, { countFiles: true }),
    inspect("gemini prompt root", PRIVATE_PROMPTS_GEMINI_ROOT, { countFiles: true, required: false })
  ]);

  const missingRequired = checks.filter((check) => check.required && !check.exists);
  console.log(JSON.stringify({ ok: missingRequired.length === 0, checks }, null, 2));
  if (missingRequired.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
