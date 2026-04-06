// Standalone vanilla JS simulation without zustand for CI checks
function createStore() {
    let state = {
        stats: { hp: 100, max_hp: 100, contamination: 0, noise: 0 },
        inventory: { "itm_flashlight": 1 },
        currentNodeId: 'YD-01',
        chapterId: 'CH01'
    };

    return {
        getState: () => state,
        modifyStat: (statKey, value) => {
            let newVal = (state.stats[statKey] || 0) + value;
            if(statKey === 'hp' && newVal > state.stats.max_hp) newVal = state.stats.max_hp;
            if(statKey === 'hp' && newVal < 0) newVal = 0;
            state.stats[statKey] = newVal;
        },
        extract: () => {
            state.currentNodeId = 'YD-01';
            state.stats.noise = 0;
            state.stats.hp = Math.min(state.stats.max_hp, state.stats.hp + 20);
        },
        die: () => {
            state.currentNodeId = 'YD-01';
            state.inventory = {};
            state.stats.hp = 30;
            state.stats.noise = 0;
            state.stats.contamination = 0;
        }
    };
}

function simulate() {
    let deaths = 0;
    let extractions = 0;
    let maxNoiseReaches = 0;
    const store = createStore();

    console.log("Starting Hardcore Simulation (30 Loops)...");

    for(let i=1; i<=30; i++) {
        console.log(`\n--- Loop ${i} Start ---`);
        let state = store.getState();
        state.currentNodeId = 'YD-02';

        console.log("Event: Scavenge (Noise +5, HP -10)");
        store.modifyStat('noise', 5);
        store.modifyStat('hp', -10);

        let combatDmg = Math.floor(Math.random() * 50);
        console.log(`Event: Combat (HP -${combatDmg})`);
        store.modifyStat('hp', -combatDmg);

        state = store.getState();

        // 3번째마다 강제로 노이즈를 올려 함정 발동 (다양한 시나리오 검증)
        if (i % 3 === 0) {
             console.log("Event: Reckless run (Noise +6)");
             store.modifyStat('noise', 6);
        }

        state = store.getState();
        if (state.stats.noise >= 10) {
            console.log("CRITICAL: Noise Maxed. Elite Spawned. Guaranteed Death.");
            maxNoiseReaches++;
            store.modifyStat('hp', -100);
            state = store.getState();
        }

        if (state.stats.hp <= 0) {
            deaths++;
            console.log(`RESULT: KIA. All loot lost.`);
            store.die();
        } else {
            extractions++;
            console.log(`RESULT: Survived. Extracting to Basecamp. HP: ${state.stats.hp}`);
            store.extract();
        }
    }

    console.log(`\n============================`);
    console.log(`Simulation Complete (30 Runs)`);
    console.log(`Total Extractions: ${extractions}`);
    console.log(`Total Deaths (KIA): ${deaths}`);
    console.log(`Elite Ambushes (Noise Max): ${maxNoiseReaches}`);
    console.log(`============================`);
}

simulate();
