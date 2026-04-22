import { Chapter, UIFlow, Item } from "../types/game";

export interface GameContentBundle {
  chapters: Record<string, Chapter>;
  items: Item[];
  uiFlows: Record<string, UIFlow>;
  registry: {
    npcs: any[];
    enemies: any[];
    stats: any[];
  };
}

class ContentLoader {
  private bundle: GameContentBundle | null = null;

  async loadAll(): Promise<GameContentBundle> {
    if (this.bundle) return this.bundle;

    try {
      // PROTOTYPE: Fetch from the bundled JSON in public/
      const response = await fetch("/runtime-content/game-content-pack.json");
      if (!response.ok) throw new Error("Failed to load game content pack");
      
      const rawData = await response.json();
      
      // In a real scenario, we might need to transform or validate this
      this.bundle = {
        chapters: rawData.chapters || {},
        items: rawData.items || [],
        uiFlows: rawData.ui_flows || {},
        registry: {
          npcs: rawData.npcs || [],
          enemies: rawData.enemies || [],
          stats: rawData.stats || [],
        }
      };

      console.log("Game content loaded successfully", this.bundle);
      return this.bundle;
    } catch (error) {
      console.error("Error loading game content:", error);
      throw error;
    }
  }

  getChapter(id: string): Chapter | undefined {
    return this.bundle?.chapters[id];
  }

  getUIFlow(chapterId: string): UIFlow | undefined {
    return this.bundle?.uiFlows[chapterId];
  }

  getItem(id: string): Item | undefined {
    return this.bundle?.items.find(i => i.item_id === id);
  }
}

export const contentLoader = new ContentLoader();
