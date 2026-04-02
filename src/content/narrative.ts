import type { ContentAlias, GameContentPack, NpcDefinition } from "../types/game";
import { findAliasByCanonicalId, findCanonicalAlias } from "./canonical";
import { getPlaceholder } from "./placeholders";

function aliasFor(pack: GameContentPack | null, kind: ContentAlias["kind"], canonicalId: string): ContentAlias | undefined {
  return (
    pack?.content_aliases.find((entry) => entry.kind === kind && entry.canonical_id === canonicalId) ??
    findCanonicalAlias(kind, canonicalId)
  );
}

export function resolveNpcDisplayName(pack: GameContentPack | null, npcId: string): string {
  const npc = pack?.npcs[npcId] as NpcDefinition | undefined;
  const alias = aliasFor(pack, "npc", npcId);
  const placeholder = getPlaceholder(npcId);
  return alias?.display_name ?? npc?.name_ko ?? placeholder?.display_name ?? npcId;
}

export function resolveAliasNote(pack: GameContentPack | null, canonicalId: string): string | null {
  const alias = pack?.content_aliases.find((entry) => entry.canonical_id === canonicalId) ?? findAliasByCanonicalId(canonicalId);
  if (alias?.note) {
    return alias.note;
  }

  return getPlaceholder(canonicalId)?.summary ?? null;
}
