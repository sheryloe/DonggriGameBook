import { useGameStore } from '../store/gameStore';

export const runEffect = (effect: { op: string; target: string; value: any }) => {
    const { op, target, value } = effect;
    const store = useGameStore.getState();

    switch(op) {
        case 'modify_stat':
            store.modifyStat(target, value);
            if (target === 'hp' && store.stats.hp <= 0) {
                 store.dieAndLoseLoot();
                 // Custom event handling can go here (e.g. playing death sound)
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
