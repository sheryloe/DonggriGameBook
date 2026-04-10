import type { AppId, SaveNamespace } from "../../world-registry/src";

export interface NamespacedSaveRecord<TSnapshot = unknown> {
  app_id: AppId;
  player_id: string;
  slot_id: string;
  snapshot: TSnapshot;
  updated_at: string;
}

export function createNamespacedStorageKey(namespace: SaveNamespace): string {
  return `donggrolgamebook:${namespace.app_id}:${namespace.slot_key}`;
}

export function createSaveRecordKey(appId: AppId, playerId: string, slotId: string): string {
  return `${appId}:${playerId}:${slotId}`;
}
