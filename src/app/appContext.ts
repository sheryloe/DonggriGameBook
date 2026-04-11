import {
  createSaveNamespace,
  getChapterCatalogEntry,
  getChapterRuntimeConfig,
  getPartManifest,
  PART_MANIFESTS,
  type AppId,
  type PartId
} from "../../packages/world-registry/src";

const DEFAULT_PART_ID: PartId = "P1";
const VALID_PART_IDS = Object.keys(PART_MANIFESTS) as PartId[];
const VALID_APP_IDS = Object.values(PART_MANIFESTS).map((entry) => entry.app_id);

function resolvePartId(rawPartId: string | undefined): PartId {
  if (rawPartId && VALID_PART_IDS.includes(rawPartId as PartId)) {
    return rawPartId as PartId;
  }

  return DEFAULT_PART_ID;
}

function resolveAppId(partId: PartId, rawAppId: string | undefined): AppId {
  const partDefaultAppId = getPartManifest(partId).app_id;
  if (rawAppId && VALID_APP_IDS.includes(rawAppId as AppId) && rawAppId === partDefaultAppId) {
    return rawAppId as AppId;
  }

  return partDefaultAppId;
}

const envPartId = resolvePartId(import.meta.env.VITE_PART_ID);
const envAppId = resolveAppId(envPartId, import.meta.env.VITE_APP_ID);
const envSlot = import.meta.env.VITE_SAVE_SLOT || "main";

export const CURRENT_PART_ID: PartId = envPartId;
export const CURRENT_APP_ID: AppId = envAppId;
export const CURRENT_PART_MANIFEST = getPartManifest(CURRENT_PART_ID);
export const CURRENT_SAVE_NAMESPACE = createSaveNamespace(CURRENT_APP_ID, envSlot);

export const CURRENT_PART_START_CHAPTER = CURRENT_PART_MANIFEST.start_chapter_id;
export const CURRENT_PART_START_CHAPTER_ENTRY = getChapterCatalogEntry(CURRENT_PART_START_CHAPTER);
export const CURRENT_PART_START_RUNTIME = getChapterRuntimeConfig(CURRENT_PART_START_CHAPTER);
