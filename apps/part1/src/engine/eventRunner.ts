import { useGameStore } from "../store/gameStore";
import { Choice, Effect, GameEvent, LootTable } from "../types/game";
import { contentLoader } from "../loaders/contentLoader";
import { isRestEligibleNode } from "../utils/survival";

class EventRunner {
  async enterChapter(chapterId: string) {
    const chapter = contentLoader.getChapter(chapterId);
    if (!chapter) throw new Error(`Chapter ${chapterId} not found`);
    const store = useGameStore.getState();
    store.resetChapterState();
    store.setChapter(chapterId);
    store.setScreen("BRIEFING");
    void contentLoader.preloadChapterAssets(chapterId);
  }

  enterNode(nodeId: string) {
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId ?? "");
    if (!chapter) return;
    const node = chapter.nodes.find((entry) => entry.node_id === nodeId);
    if (!node) return;
    const isFirstVisit = !store.visitedNodes.includes(nodeId);
    const previousNode = chapter.nodes.find((entry) => entry.node_id === store.currentNodeId);
    const travelCost = previousNode?.connections.find((connection) => connection.to === nodeId)?.cost;

    store.setNode(nodeId);
    store.markNodeVisited(nodeId);

    if (travelCost) {
      if (Number(travelCost.time ?? 0) > 0) store.advanceTime(Number(travelCost.time), `이동: ${node.name}`);
      if (Number(travelCost.noise ?? 0) !== 0) store.updateStat("noise", Number(travelCost.noise));
      if (Number(travelCost.contamination ?? 0) !== 0) {
        store.updateStat("contamination", Number(travelCost.contamination));
        store.updateStat("infection", Math.ceil(Number(travelCost.contamination) * 0.25));
      }
      if (this.presentDeadlineConsequence("CHAPTER_MAP")) return;
    }

    if (previousNode && isRestEligibleNode(chapter.chapter_id, node)) {
      if (isFirstVisit) {
        store.updateStat("injury", -8);
        store.updateStat("infection", -15);
        store.updateStat("contamination", -15);
        store.updateStat("noise", -15);
        store.appendSurvivalLog(`거점 안정화: ${node.name}에서 숨을 고르고 상처를 정리했다.`);
      }
      store.setScreen("SAFEHOUSE");
      return;
    }

    const availableEvents = chapter.events.filter((event) => event.node_id === nodeId).filter((event) => this.canTriggerEvent(event)).sort((left, right) => right.priority - left.priority);
    if (availableEvents.length > 0) {
      this.triggerEvent(availableEvents[0].event_id);
      return;
    }
    if (chapter.exit_node_ids?.includes(nodeId)) {
      this.completeChapter();
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
    if (event.node_id && event.node_id !== store.currentNodeId) {
      store.setNode(event.node_id);
      store.markNodeVisited(event.node_id);
    }
    if (this.isCompletedLockedEvent(event)) {
      const nextEventId = this.resolveNextUncompletedEventId(eventId);
      if (nextEventId && nextEventId !== eventId) {
        this.routeToNext(nextEventId);
        return;
      }
      store.setEvent(null);
      store.setScreen("CHAPTER_MAP");
      return;
    }
    if (!this.hasSelectableSurface(event)) {
      store.completeEvent(event.event_id);
      store.setEvent(null);
      store.setScreen("CHAPTER_MAP");
      return;
    }
    store.setEvent(eventId);
    for (const effect of event.on_enter_effects ?? []) this.applyEffect(effect);
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
    store.advanceTime(1, victory ? "조우 생존" : "조우 실패");
    if (victory) {
      for (const effect of event.combat?.victory_effects ?? []) this.applyEffect(effect);
      store.completeEvent(event.event_id);
      store.endBattle();
      const nextEventId = event.next_event_id ?? event.choices?.[0]?.next_event_id;
      if (this.presentDeadlineConsequence(nextEventId ? "EVENT" : "CHAPTER_MAP", nextEventId)) return;
      if (nextEventId) this.routeToNext(nextEventId); else store.setScreen("CHAPTER_MAP");
      return;
    }
    for (const effect of event.combat?.defeat_effects ?? []) this.applyEffect(effect);
    store.completeEvent(event.event_id);
    store.endBattle();
    const latestStore = useGameStore.getState();
    if (Number(latestStore.stats.infection ?? latestStore.stats.contamination ?? 0) >= 100) {
      latestStore.failRun({ kind: "turned", title: "감염 전환", body: "상처 안쪽으로 오염이 닫혔다. 무전은 아직 켜져 있지만, 대답하는 목소리는 더 이상 사람의 것이 아니다." });
      return;
    }
    if (Number(latestStore.stats.injury ?? 0) >= 100) {
      latestStore.failRun({ kind: "killed", title: "사망 기록", body: "몸이 먼저 멈췄다. 기록 장치에는 마지막 발소리만 같은 구간을 반복 재생한다." });
      return;
    }
    const failEventId = event.combat?.fail_event_id ?? event.combat?.setback_event_id ?? event.fail_event_id;
    if (this.presentDeadlineConsequence(failEventId ? "EVENT" : "CHAPTER_MAP", failEventId)) return;
    if (failEventId) this.triggerEvent(failEventId); else store.setScreen("CHAPTER_MAP");
  }

  completeChapter() {
    const store = useGameStore.getState();
    const event = this.getCurrentEvent();
    if (event) store.completeEvent(event.event_id);
    store.advanceTime(1, "챕터 정산");
    if (this.presentDeadlineConsequence("RESULT")) return;
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
    if (!this.checkConditions(choice.conditions ?? [])) return;
    const event = this.getCurrentEvent();
    const store = useGameStore.getState();
    for (const effect of choice.effects ?? []) this.applyEffect(effect);
    if (event) {
      for (const effect of event.on_complete_effects ?? []) this.applyEffect(effect);
      store.completeEvent(event.event_id);
      store.advanceTime(this.choiceTimeCost(event, choice), `선택: ${choice.label}`);
    }
    if (this.presentDeadlineConsequence(choice.next_event_id ? "EVENT" : "CHAPTER_MAP", choice.next_event_id)) return;
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

  private presentDeadlineConsequence(returnScreen: string, returnEventId?: string | null): boolean {
    const store = useGameStore.getState();
    if (!store.pendingDeadlineEvent) return false;
    store.setDeadlineReturn(returnScreen, returnEventId ?? null);
    store.setScreen("DEADLINE_CONSEQUENCE");
    return true;
  }

  private routeToNext(nextEventId: string) {
    const store = useGameStore.getState();
    if (nextEventId.startsWith("END_")) {
      this.completeChapter();
      return;
    }
    const resolvedEventId = this.resolveNextUncompletedEventId(nextEventId);
    if (!resolvedEventId) {
      store.setEvent(null);
      store.setScreen("CHAPTER_MAP");
      return;
    }
    if (resolvedEventId.startsWith("END_")) {
      this.completeChapter();
      return;
    }
    store.setEvent(null);
    this.triggerEvent(resolvedEventId);
  }

  private canTriggerEvent(event: GameEvent): boolean {
    const store = useGameStore.getState();
    if (event.once_per_run && store.completedEvents.includes(event.event_id)) return false;
    if (!event.repeatable && store.completedEvents.includes(event.event_id)) return false;
    return this.checkConditions(event.conditions ?? []) && this.hasSelectableSurface(event);
  }

  private hasSelectableSurface(event: GameEvent): boolean {
    if (this.isCombatEvent(event)) return true;
    if (!event.choices || event.choices.length === 0) return true;
    return event.choices.some((choice) => this.checkConditions(choice.conditions ?? []));
  }

  private isCompletedLockedEvent(event: GameEvent): boolean {
    return useGameStore.getState().completedEvents.includes(event.event_id) && !event.repeatable;
  }

  private resolveNextUncompletedEventId(eventId: string, seen = new Set<string>()): string | null {
    if (eventId.startsWith("END_")) return eventId;
    if (seen.has(eventId)) return null;
    seen.add(eventId);
    const store = useGameStore.getState();
    const chapter = contentLoader.getChapter(store.currentChapterId ?? "");
    const event = chapter?.events.find((entry) => entry.event_id === eventId);
    if (!event) return eventId;
    if (!this.isCompletedLockedEvent(event)) return event.event_id;
    const candidates = [event.next_event_id, ...(event.choices ?? []).filter((choice) => this.checkConditions(choice.conditions ?? [])).map((choice) => choice.next_event_id)].filter(Boolean) as string[];
    for (const candidate of candidates) {
      const resolved = this.resolveNextUncompletedEventId(candidate, seen);
      if (resolved) return resolved;
    }
    return null;
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

  private choiceTimeCost(event: GameEvent, choice: Choice): number {
    const label = `${choice.label} ${choice.preview ?? ""}`.toLowerCase();
    const eventType = String(event.event_type ?? "").toLowerCase();
    const grantsLoot = [...(choice.effects ?? []), ...(event.on_complete_effects ?? [])].some((effect) => effect.op === "grant_loot_table");
    if (grantsLoot || eventType.includes("loot") || eventType.includes("search") || eventType.includes("scavenge")) return 2;
    if (eventType.includes("boss") || eventType.includes("battle") || event.combat) return 1;
    if (/철수|빠져|후퇴|그만/u.test(label)) return 1;
    return 1;
  }

  private checkConditions(conditions: string[]): boolean {
    return conditions.every((condition) => {
      const orParts = String(condition).split("|").map((part) => part.trim()).filter(Boolean);
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
      const current = rawKey.startsWith("item:") ? this.inventoryQuantity(key) : Number(store.stats[key] ?? 0);
      if (op === "<=") return current <= target;
      if (op === ">=") return current >= target;
      if (op === "<") return current < target;
      if (op === ">") return current > target;
      return current === target;
    }
    if (normalized.startsWith("item:")) return this.inventoryQuantity(this.stripPrefix(normalized)) > 0;
    if (normalized.startsWith("flag:")) return Boolean(store.flags[this.stripPrefix(normalized)]);
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
      case "set_flag": store.setFlag(target, effect.value === undefined ? true : Boolean(effect.value)); break;
      case "clear_flag": store.setFlag(target, false); break;
      case "add_stat":
      case "add_trust":
      case "add_reputation":
        if (target === "hp") { store.updateStat("injury", -amount); break; }
        if (target === "contamination") { store.updateStat("contamination", amount); store.updateStat("infection", Math.ceil(amount * 0.25)); break; }
        store.updateStat(target, amount); break;
      case "sub_stat":
        if (target === "hp") { store.updateStat("injury", Math.ceil(amount * 0.65)); break; }
        if (target === "contamination") { store.updateStat("contamination", -amount); store.updateStat("infection", -Math.ceil(amount * 0.25)); break; }
        store.updateStat(target, -amount); break;
      case "grant_item": store.addInventoryItem(target, amount); break;
      case "remove_item": store.removeInventoryItem(target, amount); break;
      case "grant_loot_table": this.grantLoot(target); break;
      case "set_value":
      case "set_route": store.setValue(target, effect.value); break;
      case "unlock_node":
      case "unlock_route": store.setFlag(target, true); break;
    }
  }

  private grantLoot(lootTableId: string) {
    const table = contentLoader.getLootTable(lootTableId);
    if (!table) return;
    const selected = this.pickLoot(table);
    const store = useGameStore.getState();
    for (const entry of selected) store.addInventoryItem(entry.item_id, entry.qty);
  }

  private pickLoot(table: LootTable): Array<{ item_id: string; qty: number }> {
    return [...table.entries].sort((left, right) => right.weight - left.weight).slice(0, Math.max(1, table.rolls)).map((entry) => ({ item_id: entry.item_id, qty: entry.qty_min ?? 1 }));
  }
}

export const eventRunner = new EventRunner();