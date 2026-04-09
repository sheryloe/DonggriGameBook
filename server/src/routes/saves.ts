import type { FastifyInstance } from "fastify";
import type { AppId } from "../../../packages/world-registry/src";
import { APP_ORIGINS } from "../../../packages/world-registry/src";
import { putSave, getSave } from "../store/inMemorySaveStore";

function isKnownAppId(appId: string): appId is AppId {
  return Object.prototype.hasOwnProperty.call(APP_ORIGINS, appId);
}

export async function registerSaveRoutes(app: FastifyInstance) {
  app.get("/api/saves/:appId/:playerId/:slotId", async (request, reply) => {
    const { appId, playerId, slotId } = request.params as {
      appId: string;
      playerId: string;
      slotId: string;
    };

    if (!isKnownAppId(appId)) {
      reply.status(400);
      return { error: "unknown_app_id" };
    }

    const save = getSave(appId, playerId, slotId);
    if (!save) {
      reply.status(404);
      return { error: "save_not_found" };
    }

    return save;
  });

  app.put("/api/saves/:appId/:playerId/:slotId", async (request, reply) => {
    const { appId, playerId, slotId } = request.params as {
      appId: string;
      playerId: string;
      slotId: string;
    };

    if (!isKnownAppId(appId)) {
      reply.status(400);
      return { error: "unknown_app_id" };
    }

    const body = request.body as {
      snapshot?: Record<string, unknown>;
      updated_at?: string;
    };

    if (!body?.snapshot) {
      reply.status(400);
      return { error: "missing_snapshot" };
    }

    const saved = putSave({
      app_id: appId,
      player_id: playerId,
      slot_id: slotId,
      snapshot: body.snapshot,
      updated_at: body.updated_at ?? new Date().toISOString()
    });

    reply.status(200);
    return saved;
  });
}
