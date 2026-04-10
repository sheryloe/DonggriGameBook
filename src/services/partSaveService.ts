import type { AppId, SaveNamespace } from "../../packages/world-registry/src";
import type { NamespacedSaveRecord } from "../../packages/game-engine/src";
import { CURRENT_APP_ID, CURRENT_SAVE_NAMESPACE } from "../app/appContext";

export interface RemoteSaveSnapshot {
  currentChapterId: string;
  currentNodeId: string;
  stats: Record<string, unknown>;
  flags: Record<string, unknown>;
  inventory: Record<string, unknown>;
}

export interface SaveLookupInput {
  appId?: AppId;
  playerId: string;
  slotId?: string;
}

export function resolveDefaultNamespace(namespace?: SaveNamespace): SaveNamespace {
  return namespace ?? CURRENT_SAVE_NAMESPACE;
}

export async function fetchPartSave({
  appId = CURRENT_APP_ID,
  playerId,
  slotId = CURRENT_SAVE_NAMESPACE.slot_key
}: SaveLookupInput): Promise<NamespacedSaveRecord<RemoteSaveSnapshot> | null> {
  const response = await fetch(`/api/saves/${appId}/${playerId}/${slotId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`failed_to_fetch_save:${response.status}`);
  }

  const payload = (await response.json()) as {
    app_id: AppId;
    player_id: string;
    slot_id: string;
    snapshot: RemoteSaveSnapshot;
    updated_at: string;
  };

  return {
    app_id: payload.app_id,
    player_id: payload.player_id,
    slot_id: payload.slot_id,
    snapshot: payload.snapshot,
    updated_at: payload.updated_at
  };
}

export async function persistPartSave(
  record: NamespacedSaveRecord<RemoteSaveSnapshot>
): Promise<NamespacedSaveRecord<RemoteSaveSnapshot>> {
  const response = await fetch(`/api/saves/${record.app_id}/${record.player_id}/${record.slot_id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      snapshot: record.snapshot,
      updated_at: record.updated_at
    })
  });

  if (!response.ok) {
    throw new Error(`failed_to_persist_save:${response.status}`);
  }

  return (await response.json()) as NamespacedSaveRecord<RemoteSaveSnapshot>;
}
