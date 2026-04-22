import { useGameStore } from "../store/gameStore";
import { GameEvent, Choice, Effect } from "../types/game";
import { contentLoader } from "../loaders/contentLoader";

class EventRunner {
  
  // Enter a chapter
  async enterChapter(chapterId: string) {
    const chapter = contentLoader.getChapter(chapterId);
    if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

    const store = useGameStore.getState();
    store.resetChapterState();
    store.setChapter(chapterId);
    store.setScreen("BRIEFING");
    
    console.log(`Entering chapter: ${chapter.title}`);
  }

  // Move to a node
  enterNode(nodeId: string) {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId!);
    if (!chapter) return;

    const node = chapter.nodes.find(n => n.node_id === nodeId);
    if (!node) return;

    store.setNode(nodeId);
    store.markNodeVisited(nodeId);
    
    // Check if there are events to trigger
    const availableEvents = chapter.events.filter(e => 
      e.node_id === nodeId && this.checkConditions(e.conditions)
    );

    if (availableEvents.length > 0) {
      // Pick the highest priority event
      const event = availableEvents.sort((a, b) => b.priority - a.priority)[0];
      this.triggerEvent(event.event_id);
    } else {
      store.setScreen("CHAPTER_MAP");
    }
  }

  // Trigger an event
  triggerEvent(eventId: string) {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId!);
    if (!chapter) return;

    const event = chapter.events.find(e => e.event_id === eventId);
    if (!event) return;

    store.setEvent(eventId);
    
    // Check if it's a battle event
    if (event.event_type === "BATTLE" || event.combat) {
      this.startBattle(event.combat?.encounter_table_id || "default_enemy");
    } else {
      store.setScreen("EVENT");
    }

    // Apply on_enter effects
    event.on_enter_effects.forEach(effect => this.applyEffect(effect));
  }

  // Start Battle
  startBattle(enemyGroupId: string) {
    const store = useGameStore.getState();
    store.startBattle(enemyGroupId);
    store.setScreen("BATTLE");
  }

  // Finish Battle
  finishBattle(victory: boolean) {
    const store = useGameStore.getState();
    const event = this.getCurrentEvent();
    
    if (victory) {
      if (event?.combat?.victory_effects) {
        event.combat.victory_effects.forEach(e => this.applyEffect(e));
      }
      // Continue to next event or map
      if (event?.next_event_id) {
        this.triggerEvent(event.next_event_id);
      } else {
        store.setScreen("CHAPTER_MAP");
      }
    } else {
      if (event?.combat?.defeat_effects) {
        event.combat.defeat_effects.forEach(e => this.applyEffect(e));
      }
      // Game over or setback
      if (event?.combat?.fail_event_id) {
        this.triggerEvent(event.combat.fail_event_id);
      } else {
        // Fallback to briefing or specific death screen
        console.log("Game Over");
      }
    }
    store.endBattle();
  }

  // Complete Chapter
  completeChapter() {
    const store = useGameStore.getState();
    store.setScreen("RESULT");
  }

  // Next Chapter
  nextChapter() {
    const store = useGameStore.getState();
    const nextId = this.getNextChapterId(store.currentChapterId!);
    if (nextId) {
      this.enterChapter(nextId);
    }
  }

  private getNextChapterId(currentId: string): string | null {
    const ids = ["CH01", "CH02", "CH03", "CH04", "CH05"];
    const idx = ids.indexOf(currentId);
    return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
  }

  private getCurrentEvent(): GameEvent | null {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId || '');
    return chapter?.events.find(e => e.event_id === store.currentEventId) || null;
  }

  // Process choice
  selectChoice(choice: Choice) {
    const store = useGameStore.getState();
    
    // Apply effects
    choice.effects.forEach(effect => this.applyEffect(effect));

    if (choice.next_event_id) {
      this.triggerEvent(choice.next_event_id);
    } else {
      // Event sequence complete
      store.setEvent(null);
      store.setScreen("CHAPTER_MAP");
    }
  }

  // Simple condition checker (can be expanded)
  private checkConditions(conditions: string[]): boolean {
    const store = useGameStore.getState();
    return conditions.every(cond => {
      // Example: "flag:reached_basement"
      if (cond.startsWith("flag:")) {
        const flag = cond.split(":")[1];
        return !!store.flags[flag];
      }
      // Example: "stat:hp>20"
      if (cond.startsWith("stat:")) {
        const parts = cond.split(":")[1].match(/(\w+)([><=]+)(\d+)/);
        if (parts) {
          const [_, stat, op, val] = parts;
          const current = store.stats[stat] || 0;
          const target = parseInt(val);
          if (op === ">") return current > target;
          if (op === "<") return current < target;
          if (op === "==") return current === target;
        }
      }
      return true; // Default true for unknown conditions in prototype
    });
  }

  // Apply effects to store
  private applyEffect(effect: Effect) {
    const store = useGameStore.getState();
    switch (effect.op) {
      case "set_flag":
        store.setFlag(effect.target, true);
        break;
      case "clear_flag":
        store.setFlag(effect.target, false);
        break;
      case "add_stat":
        store.updateStat(effect.target, effect.value);
        break;
      case "sub_stat":
        store.updateStat(effect.target, -effect.value);
        break;
      case "grant_item":
        store.addInventoryItem(effect.target, effect.value || 1);
        break;
      case "remove_item":
        store.removeInventoryItem(effect.target, effect.value || 1);
        break;
      // Add more as needed
    }
  }
}

export const eventRunner = new EventRunner();
