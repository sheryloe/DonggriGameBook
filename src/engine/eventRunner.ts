import { useGameStore } from '../store/gameStore';

export const runEffect = (effect: { op: string; target: string; value: any }) => {
    const { op, target, value } = effect;
    const store = useGameStore.getState();

    switch(op) {
        case 'modify_stat':
            store.modifyStat(target, value);
            // Check death condition
            if (target === 'hp' && store.stats.hp <= 0) {
                 store.dieAndLoseLoot();
                 alert("체력이 0이 되어 사망했습니다! 인벤토리의 아이템을 모두 잃고 베이스캠프로 이송됩니다.");
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
        default:
            console.warn(`Unknown effect op: ${op}`);
    }
};

export const checkRequirement = (reqString: string): boolean => {
    const store = useGameStore.getState();

    // Example format: "item:itm_flashlight>=1" or "flag:server_hacked"
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

    if (reqString.startsWith('stat:')) {
        // e.g. "stat:noise<=5"
        const clean = reqString.replace('stat:', '');
        if (clean.includes('<=')) {
            const [stat, val] = clean.split('<=');
            return ((store.stats as any)[stat] || 0) <= parseInt(val, 10);
        }
    }

    return true; // Unknown requirement passes by default
};

export const handleChoice = (choice: any) => {
    // 1. Check req
    if (choice.requires && choice.requires.length > 0) {
        for (const req of choice.requires) {
            if (!checkRequirement(req)) {
                return false; // Cannot execute
            }
        }
    }

    // 2. Apply effects
    if (choice.effects) {
        choice.effects.forEach(runEffect);
    }

    // 3. Move to next event or end
    const store = useGameStore.getState();
    if (choice.next_event_id) {
        store.triggerEvent(choice.next_event_id);
    } else {
        store.triggerEvent(''); // Close event view
    }

    return true;
};
