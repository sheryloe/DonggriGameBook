import { useGameStore } from "../store/gameStore";
import { Choice, Effect, GameEvent, LootTable } from "../types/game";
import { contentLoader } from "../loaders/contentLoader";

class EventRunner {
  async enterChapter(chapterId: string) {
    const chapter = contentLoader.getChapter(chapterId);
    if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

    const store = useGameStore.getState();
    store.resetChapterState();
    store.setChapter(chapterId);
    store.setScreen("BRIEFING");

    // Fire and forget preloading for Edge performance
    void contentLoader.preloadChapterAssets(chapterId);
  }

  enterNode(nodeId: string) {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId ?? "");
    if (!chapter) return;

    const node = chapter.nodes.find((entry) => entry.node_id === nodeId);
    if (!node) return;

    store.setNode(nodeId);
    store.markNodeVisited(nodeId);

    const availableEvents = chapter.events
      .filter((event) => event.node_id === nodeId)
      .filter((event) => this.canTriggerEvent(event))
      .sort((left, right) => right.priority - left.priority);

    if (availableEvents.length > 0) {
      this.triggerEvent(availableEvents[0].event_id);
      return;
    }

    store.setScreen("CHAPTER_MAP");
  }

  triggerEvent(eventId: string) {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId ?? "");
    if (!chapter) return;

    const event = chapter.events.find((entry) => entry.event_id === eventId);
    if (!event) return;

    store.setEvent(eventId);
    for (const effect of event.on_enter_effects ?? []) {
      this.applyEffect(effect);
    }

    if (this.isCombatEvent(event)) {
      this.startBattle(event.combat?.encounter_table_id ?? "default_enemy");
      return;
    }

    store.setScreen("EVENT");
  }

  startBattle(enemyGroupId: string) {
    const store = useGameStore.getState();
    store.startBattle(enemyGroupId);
    store.setScreen("BATTLE");
  }

  finishBattle(victory: boolean) {
    const store = useGameStore.getState();
    const event = this.getCurrentEvent();

    if (!event) {
      store.endBattle();
      store.setScreen("CHAPTER_MAP");
      return;
    }

    if (victory) {
      for (const effect of event.combat?.victory_effects ?? []) this.applyEffect(effect);
      store.completeEvent(event.event_id);
      store.endBattle();
      const nextEventId = event.next_event_id ?? event.choices?.[0]?.next_event_id;
      if (nextEventId) {
        this.routeToNext(nextEventId);
      } else {
        store.setScreen("CHAPTER_MAP");
      }
      return;
    }

    for (const effect of event.combat?.defeat_effects ?? []) this.applyEffect(effect);
    store.completeEvent(event.event_id);
    store.endBattle();
    const failEventId = event.combat?.fail_event_id ?? event.combat?.setback_event_id ?? event.fail_event_id;
    if (failEventId) {
      this.triggerEvent(failEventId);
    } else {
      store.setScreen("CHAPTER_MAP");
    }
  }

  completeChapter() {
    const store = useGameStore.getState();
    const event = this.getCurrentEvent();
    if (event) {
      store.completeEvent(event.event_id);
    }
    store.setScreen("RESULT");
  }

  nextChapter() {
    const store = useGameStore.getState();
    const nextId = this.getNextChapterId(store.currentChapterId ?? "");
    if (nextId) {
      void this.enterChapter(nextId);
      return;
    }
    store.setScreen("RESULT");
  }

  selectChoice(choice: Choice) {
    if (!this.checkConditions(choice.conditions ?? [])) {
      return;
    }

    const event = this.getCurrentEvent();
    const store = useGameStore.getState();
    for (const effect of choice.effects ?? []) {
      this.applyEffect(effect);
    }

    if (event) {
      for (const effect of event.on_complete_effects ?? []) {
        this.applyEffect(effect);
      }
      store.completeEvent(event.event_id);
    }

    if (choice.next_event_id) {
      this.routeToNext(choice.next_event_id);
      return;
    }

    store.setEvent(null);
    store.setScreen("CHAPTER_MAP");
  }

  canSelectChoice(choice: Choice): boolean {
    return this.checkConditions(choice.conditions ?? []);
  }

  private routeToNext(nextEventId: string) {
    const store = useGameStore.getState();
    if (nextEventId.startsWith("END_")) {
      this.completeChapter();
      return;
    }
    store.setEvent(null);
    this.triggerEvent(nextEventId);
  }

  private canTriggerEvent(event: GameEvent): boolean {
    const store = useGameStore.getState();
    if (event.once_per_run && store.completedEvents.includes(event.event_id)) {
      return false;
    }
    if (!event.repeatable && store.completedEvents.includes(event.event_id)) {
      return false;
    }
    return this.checkConditions(event.conditions ?? []);
  }

  private getNextChapterId(currentId: string): string | null {
    const ids = ["CH01", "CH02", "CH03", "CH04", "CH05"];
    const index = ids.indexOf(currentId);
    return index >= 0 && index < ids.length - 1 ? ids[index + 1] : null;
  }

  private getCurrentEvent(): GameEvent | null {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId ?? "");
    return chapter?.events.find((event) => event.event_id === store.currentEventId) ?? null;
  }

  private isCombatEvent(event: GameEvent): boolean {
    return Boolean(event.combat) || event.event_type === "BATTLE" || event.event_type === "boss";
  }

  private checkConditions(conditions: string[]): boolean {
    return conditions.every((condition) => {
      const orParts = String(condition)
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
      return orParts.length === 0 || orParts.some((part) => this.checkCondition(part));
    });
  }

  private checkCondition(condition: string): boolean {
    const store = useGameStore.getState();
    const normalized = condition.trim();
    if (!normalized) return true;

    const comparison = normalized.match(/^([A-Za-z0-9_.:-]+)\s*(<=|>=|==|=|<|>)\s*(-?\d+(?:\.\d+)?)$/u);
    if (comparison) {
      const [, rawKey, op, rawValue] = comparison;
      const key = this.stripPrefix(rawKey);
      const target = Number(rawValue);
      const current = rawKey.startsWith("item:")
        ? this.inventoryQuantity(key)
        : Number(store.stats[key] ?? 0);
      if (op === "<=") return current <= target;
      if (op === ">=") return current >= target;
      if (op === "<") return current < target;
      if (op === ">") return current > target;
      return current === target;
    }

    if (normalized.startsWith("item:")) {
      return this.inventoryQuantity(this.stripPrefix(normalized)) > 0;
    }

    if (normalized.startsWith("flag:")) {
      return Boolean(store.flags[this.stripPrefix(normalized)]);
    }

    return Boolean(store.flags[this.stripPrefix(normalized)] ?? store.stats[this.stripPrefix(normalized)] ?? true);
  }

  private inventoryQuantity(itemId: string): number {
    return useGameStore.getState().inventory.find((item) => item.item_id === itemId)?.quantity ?? 0;
  }

  private stripPrefix(value: string): string {
    return value.replace(/^(flag|item|loot|stat):/u, "");
  }

  private applyEffect(effect: Effect) {
    const store = useGameStore.getState();
    const target = this.stripPrefix(effect.target);
    const amount = Number(effect.value ?? 1);

    switch (effect.op) {
      case "set_flag":
        store.setFlag(target, effect.value === undefined ? true : Boolean(effect.value));
        break;
      case "clear_flag":
        store.setFlag(target, false);
        break;
      case "add_stat":
      case "add_trust":
      case "add_reputation":
        store.updateStat(target, amount);
        break;
      case "sub_stat":
        store.updateStat(target, -amount);
        break;
      case "grant_item":
        store.addInventoryItem(target, amount);
        break;
      case "remove_item":
        store.removeInventoryItem(target, amount);
        break;
      case "grant_loot_table":
        this.grantLoot(target);
        break;
      case "set_value":
      case "set_route":
        store.setValue(target, effect.value);
        break;
      case "unlock_node":
      case "unlock_route":
        store.setFlag(target, true);
        break;
    }
  }

  private grantLoot(lootTableId: string) {
    const table = contentLoader.getLootTable(lootTableId);
    if (!table) return;
    const selected = this.pickLoot(table);
    const store = useGameStore.getState();
    for (const entry of selected) {
      store.addInventoryItem(entry.item_id, entry.qty);
    }
  }

  private pickLoot(table: LootTable): Array<{ item_id: string; qty: number }> {
    return [...table.entries]
      .sort((left, right) => right.weight - left.weight)
      .slice(0, Math.max(1, table.rolls))
      .map((entry) => ({ item_id: entry.item_id, qty: entry.qty_min ?? 1 }));
  }
}

export const eventRunner = new EventRunner();
