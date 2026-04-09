import { createSaveRecordKey, type NamespacedSaveRecord } from "../../../packages/game-engine/src";
import type { AppId } from "../../../packages/world-registry/src";

export interface SavePayload {
  app_id: AppId;
  player_id: string;
  slot_id: string;
  snapshot: Record<string, unknown>;
  updated_at: string;
}

const records = new Map<string, SavePayload>();

export function getSave(appId: AppId, playerId: string, slotId: string): SavePayload | null {
  return records.get(createSaveRecordKey(appId, playerId, slotId)) ?? null;
}

export function putSave(record: NamespacedSaveRecord<Record<string, unknown>>): SavePayload {
  const nextRecord: SavePayload = {
    app_id: record.app_id,
    player_id: record.player_id,
    slot_id: record.slot_id,
    snapshot: record.snapshot,
    updated_at: record.updated_at
  };

  records.set(createSaveRecordKey(record.app_id, record.player_id, record.slot_id), nextRecord);
  return nextRecord;
}
