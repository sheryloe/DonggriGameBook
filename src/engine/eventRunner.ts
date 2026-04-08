import { useGameStore } from '../store/gameStore';
import { isOverencumbered } from './inventoryHelper';

export const runEffect = (effect: { op: string; target: string; value: any }) => {
    const { op, target, value } = effect;
    const store = useGameStore.getState();

    switch(op) {
        case 'modify_stat':
            // 과적 상태일 때, 이동/행동 시 소음이 발생하면 추가 소음 페널티 적용
            let finalValue = value;
            if (target === 'noise' && value > 0 && isOverencumbered()) {
                finalValue += 3; // 무거워서 달그락거리는 소리 추가
                console.warn("[SYSTEM] 과적 상태로 인해 추가 소음이 발생했습니다.");
            }

            store.modifyStat(target, finalValue);

            if (target === 'hp' && store.stats.hp <= 0) {
                 store.dieAndLoseLoot();
            }
            break;
        case 'grant_item':
            const itemId = target.replace('item:', '');
            store.grantItem(itemId, value);
            break;
        case 'remove_item':
            const rmItemId = target.replace('item:', '');
            store.removeItem(rmItemId, value);
            break;
        case 'set_flag':
            store.setFlag(target.replace('flag:', ''), value);
            break;
        case 'set_quest':
            store.setQuestStatus(target.replace('quest:', ''), value);
            break;
        default:
            console.warn(`Unknown effect op: ${op}`);
    }
};

export const checkRequirement = (reqString: string): boolean => {
    const store = useGameStore.getState();

    if (reqString.startsWith('item:')) {
        const parts = reqString.replace('item:', '').split('>=');
        const itemId = parts[0];
        const amountStr = parts[1] || '1';
        const requiredAmount = parseInt(amountStr, 10);

        const currentAmount = store.inventory[itemId] || 0;
        return currentAmount >= requiredAmount;
    }

    if (reqString.startsWith('flag:')) {
        const flagId = reqString.replace('flag:', '');
        return !!store.flags[flagId];
    }

    if (reqString.startsWith('quest:')) {
        const parts = reqString.replace('quest:', '').split('==');
        const questId = parts[0];
        const status = parts[1];
        return store.quests[questId] === status;
    }

    if (reqString.startsWith('stat:')) {
        const clean = reqString.replace('stat:', '');
        if (clean.includes('<=')) {
            const [stat, val] = clean.split('<=');
            return ((store.stats as any)[stat] || 0) <= parseInt(val, 10);
        }
    }

    return true;
};

export const handleChoice = (choice: any) => {
    if (choice.requires && choice.requires.length > 0) {
        for (const req of choice.requires) {
            if (!checkRequirement(req)) {
                return false;
            }
        }
    }

    if (choice.effects) {
        choice.effects.forEach(runEffect);
    }

    const store = useGameStore.getState();
    if (choice.next_event_id) {
        store.triggerEvent(choice.next_event_id);
    } else {
        store.triggerEvent('');
    }

    return true;
};
