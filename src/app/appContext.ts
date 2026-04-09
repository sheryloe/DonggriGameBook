import { createSaveNamespace } from "../../packages/world-registry/src";
import {
  getChapterCatalogEntry,
  getChapterRuntimeConfig,
  getPartManifest
} from "../../packages/world-registry/src";

export const CURRENT_PART_ID = "P1" as const;
export const CURRENT_APP_ID = "donggrolgamebook-p1" as const;
export const CURRENT_PART_MANIFEST = getPartManifest(CURRENT_PART_ID);
export const CURRENT_SAVE_NAMESPACE = createSaveNamespace(CURRENT_APP_ID, "main");

export const CURRENT_PART_START_CHAPTER = CURRENT_PART_MANIFEST.start_chapter_id;
export const CURRENT_PART_START_CHAPTER_ENTRY = getChapterCatalogEntry(CURRENT_PART_START_CHAPTER);
export const CURRENT_PART_START_RUNTIME = getChapterRuntimeConfig(CURRENT_PART_START_CHAPTER);
