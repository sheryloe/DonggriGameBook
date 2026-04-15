import { useGameStore } from "../store/gameStore";

export const itemRegistry = new Map<string, { weight?: number }>();

function getContentItems() {
  return useGameStore.getState().content?.items ?? {};
}

function getItemDefinition(itemId: string) {
  if (itemRegistry.has(itemId)) {
    return itemRegistry.get(itemId);
  }

  const item = getContentItems()[itemId];
  if (item) {
    itemRegistry.set(itemId, item);
    return item;
  }

  return undefined;
}

export const calculateTotalWeight = (): number => {
  const store = useGameStore.getState();
  const quantities = store.runtime?.inventory?.quantities ?? {};
  let totalWeight = 0;

  for (const [itemId, amount] of Object.entries(quantities)) {
    const itemDef = getItemDefinition(itemId);
    if (itemDef?.weight) {
      totalWeight += Number(itemDef.weight) * Number(amount ?? 0);
    }
  }

  return Number(totalWeight.toFixed(2));
};

export const MAX_CARRY_WEIGHT = 30.0;

export const isOverencumbered = (): boolean => {
  return calculateTotalWeight() > MAX_CARRY_WEIGHT;
};
