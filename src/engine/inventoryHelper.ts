import { useGameStore } from '../store/gameStore';
import itemData from '../../codex_webgame_pack/data/inventory.items.json';

// 아이템 레지스트리를 맵으로 변환 (빠른 조회용)
export const itemRegistry = new Map<string, any>();
itemData.items.forEach((item: any) => {
    itemRegistry.set(item.item_id, item);
});

// 현재 인벤토리의 총 무게 계산
export const calculateTotalWeight = (): number => {
    const store = useGameStore.getState();
    let totalWeight = 0;

    Object.entries(store.inventory).forEach(([itemId, amount]) => {
        const itemDef = itemRegistry.get(itemId);
        if (itemDef && itemDef.weight) {
            totalWeight += itemDef.weight * amount;
        }
    });

    return Number(totalWeight.toFixed(2));
};

// 최대 무게 한도
export const MAX_CARRY_WEIGHT = 30.0; // 기본 30kg 한도 (하드코어)

// 과적 상태 여부 반환 (과적 시 페널티 부여 위함)
export const isOverencumbered = (): boolean => {
    return calculateTotalWeight() > MAX_CARRY_WEIGHT;
};
