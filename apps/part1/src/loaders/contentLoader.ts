import { Chapter, Encounter, Item, LootTable, UIFlow, Enemy } from "../types/game";

type RuntimeAssetMapping = {
  chapter_id?: string;
  runtime_art_key?: string;
  art_key_final?: string;
  filename_target?: string;
};

type RuntimeAssetManifest = {
  mappings?: RuntimeAssetMapping[];
  known_art_keys?: string[];
};

export interface GameContentBundle {
  chapters: Record<string, Chapter>;
  items: Record<string, Item>;
  uiFlows: Record<string, UIFlow>;
  registry: {
    npcs: Record<string, unknown>;
    enemies: Record<string, Enemy>;
    stats: Record<string, unknown>;
    encounter_tables: Record<string, Encounter>;
    loot_tables: Record<string, LootTable>;
  };
}

function toRecord<T>(value: unknown, idKey: string): Record<string, T> {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, T>>((acc, entry) => {
      if (entry && typeof entry === "object") {
        const id = String((entry as Record<string, unknown>)[idKey] ?? "");
        if (id) {
          acc[id] = entry as T;
        }
      }
      return acc;
    }, {});
  }

  if (value && typeof value === "object") {
    return value as Record<string, T>;
  }

  return {};
}

function normalizeKey(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/^(flag|item|loot):/u, "");
}

class ContentLoader {
  private bundle: GameContentBundle | null = null;
  private artAliasByChapter = new Map<string, string>();
  private artAliasGlobal = new Map<string, string>();
  private knownArtKeys = new Set<string>();
  private preloadedChapters = new Set<string>();

  async loadAll(): Promise<GameContentBundle> {
    if (this.bundle) return this.bundle;

    const [contentResponse, assetResponse] = await Promise.all([
      fetch("/runtime-content/game-content-pack.json"),
      fetch("/runtime-content/runtime-asset-manifest.json"),
    ]);

    if (!contentResponse.ok) {
      throw new Error("게임 콘텐츠를 불러오지 못했습니다.");
    }

    const rawData = await contentResponse.json();
    const assetManifest: RuntimeAssetManifest = assetResponse.ok ? await assetResponse.json() : {};
    this.indexAssetManifest(assetManifest);

    this.bundle = {
      chapters: toRecord<Chapter>(rawData.chapters, "chapter_id"),
      items: toRecord<Item>(rawData.items, "item_id"),
      uiFlows: toRecord<UIFlow>(rawData.ui_flows, "chapter_id"),
      registry: {
        npcs: toRecord<Record<string, unknown>>(rawData.npcs, "npc_id"),
        enemies: toRecord<Enemy>(rawData.enemies, "enemy_id"),
        stats: toRecord<Record<string, unknown>>(rawData.stats_registry ?? rawData.stats, "stat_id"),
        encounter_tables: toRecord<Encounter>(rawData.encounter_tables, "encounter_table_id"),
        loot_tables: toRecord<LootTable>(rawData.loot_tables, "loot_table_id"),
      },
    };

    return this.bundle;
  }

  private indexAssetManifest(manifest: RuntimeAssetManifest): void {
    this.artAliasByChapter.clear();
    this.artAliasGlobal.clear();
    this.knownArtKeys = new Set(manifest.known_art_keys ?? []);

    for (const mapping of manifest.mappings ?? []) {
      if (!mapping.runtime_art_key || !mapping.art_key_final) {
        continue;
      }

      this.knownArtKeys.add(mapping.runtime_art_key);
      this.knownArtKeys.add(mapping.art_key_final);
      this.artAliasGlobal.set(mapping.runtime_art_key, mapping.art_key_final);

      if (mapping.chapter_id) {
        this.artAliasByChapter.set(`${mapping.chapter_id}:${mapping.runtime_art_key}`, mapping.art_key_final);
      }
    }
  }

  getChapter(id: string): Chapter | undefined {
    return this.bundle?.chapters[id];
  }

  getUIFlow(chapterId: string): UIFlow | undefined {
    return this.bundle?.uiFlows[chapterId];
  }

  getItem(id: string): Item | undefined {
    const itemId = normalizeKey(id);
    return itemId ? this.bundle?.items[itemId] : undefined;
  }

  getEnemy(id: string): Enemy | undefined {
    return this.bundle?.registry.enemies[id];
  }

  getEncounter(id: string): Encounter | undefined {
    return this.bundle?.registry.encounter_tables[id];
  }

  getLootTable(id: string): LootTable | undefined {
    const lootId = normalizeKey(id);
    return lootId ? this.bundle?.registry.loot_tables[lootId] : undefined;
  }

  getPrimaryEnemy(enemyGroupId: string): { enemyId: string; enemy?: Enemy; encounter?: Encounter } {
    const encounter = this.getEncounter(enemyGroupId);
    const enemyId = encounter?.units?.[0]?.enemy_id ?? encounter?.enemies?.[0]?.enemy_id ?? enemyGroupId;
    return { enemyId, enemy: this.getEnemy(enemyId), encounter };
  }

  resolveImageUrl(chapterId: string | null | undefined, artKey: string | null | undefined, fallback?: string | null): string | null {
    const key = normalizeKey(artKey);
    if (!key) {
      return fallback ?? null;
    }

    if (key.startsWith("/") || key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }

    // Try chapter-specific alias, then global alias, then direct key
    const finalKey =
      (chapterId ? this.artAliasByChapter.get(`${chapterId}:${key}`) : undefined) ??
      this.artAliasGlobal.get(key) ??
      (this.knownArtKeys.has(key) ? key : null);

    if (finalKey) {
      return `/generated/images/${finalKey}.webp`;
    }

    // Special handling for NPC portraits: if "portrait_npc_name" is missing for this chapter,
    // try to find any "portrait_npc_name_chXX" in the known keys.
    if (key.startsWith("portrait_npc_")) {
      const baseNpcName = key.replace(/_ch\d+/u, "");
      const altKey = [...this.knownArtKeys].find((k) => k.startsWith(baseNpcName));
      if (altKey) {
        return `/generated/images/${altKey}.webp`;
      }
    }

    // Special handling for threats
    if (key.startsWith("threat_")) {
      const altKey = [...this.knownArtKeys].find((k) => k.startsWith(key));
      if (altKey) return `/generated/images/${altKey}.webp`;
    }

    return fallback ?? null;
  }

  /**
   * Preloads critical assets for a chapter to reduce Edge latency
   */
  async preloadChapterAssets(chapterId: string): Promise<void> {
    if (this.preloadedChapters.has(chapterId)) return;
    
    const chapter = this.getChapter(chapterId);
    if (!chapter) return;

    const urlsToPreload = new Set<string>();
    
    // Chapter BG
    const bgUrl = this.resolveImageUrl(chapterId, `briefing_p1_${chapterId.toLowerCase()}`);
    if (bgUrl) urlsToPreload.add(bgUrl);

    // Event BGs and NPCs
    chapter.events.forEach(event => {
      const eBg = this.resolveImageUrl(chapterId, event.presentation?.art_key);
      if (eBg) urlsToPreload.add(eBg);
      
      event.npc_ids?.forEach(npcId => {
        const pKey = `portrait_${npcId.replace(/^npc_/u, "")}`;
        const pUrl = this.resolveImageUrl(chapterId, pKey);
        if (pUrl) urlsToPreload.add(pUrl);
      });
    });

    // Fire and forget preloading
    urlsToPreload.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    this.preloadedChapters.add(chapterId);
    console.log(`[CONTENT_LOADER] Preloaded ${urlsToPreload.size} assets for ${chapterId}`);
  }
}

export const contentLoader = new ContentLoader();
