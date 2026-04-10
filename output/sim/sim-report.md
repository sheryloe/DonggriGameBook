# 2-Player Agent Simulation Report

- generatedAt: 2026-04-10T15:38:20.864Z
- seed: 20260410
- chapters: CH01, CH02, CH03, CH04, CH05
- players: 2

## Overall Summary
- succeededPlayers: 2/2
- failedPlayers: 0
- warningCount: 18
- chapterClearCounts: {"CH01":2,"CH02":2,"CH03":2,"CH04":2,"CH05":2}
- chapterEstimatedMinutes: {"CH01":158,"CH02":115,"CH03":194,"CH04":126,"CH05":112}
- averageEstimatedMinutesByChapter: {"CH01":79,"CH02":57.5,"CH03":97,"CH04":63,"CH05":56}

## player-01 (cautious)
- status: success
- clearedChapters: CH01, CH02, CH03, CH04, CH05
- failedChapter: -
- totalSteps: 95
- totalChoices: 90
- totalEstimatedMinutes: 351
- finalStats: hp=100, maxHp=100, noise=0, contamination=37
- playMinutes: 351
- inventoryItemCount: 33

### Chapter Results
- CH01: SUCCESS | reason=END_CH01 | steps=21 | choices=20 | events=21 | estimatedMinutes=79 (raw=79) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=1
- CH02: SUCCESS | reason=END_CH02 | steps=15 | choices=14 | events=15 | estimatedMinutes=56 (raw=56) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=0
- CH03: SUCCESS | reason=END_CH03 | steps=28 | choices=27 | events=28 | estimatedMinutes=97 (raw=97) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=0
- CH04: SUCCESS | reason=END_CH04 | steps=16 | choices=15 | events=16 | estimatedMinutes=63 (raw=63) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=0
- CH05: SUCCESS | reason=END_CH05 | steps=15 | choices=14 | events=15 | estimatedMinutes=56 (raw=56) | preItems={delivery:2,security:2,route:1} | endHp=100 | endNoise=0

### Chapter Reviews
- CH01: Onboarding is stable, but farming options were narrow, so conditional farming branches were expanded. Playtime target (20m) was met. Completed with: END_CH01. Key warnings: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: Risk-reward pacing was good, but repeat farming impact was weak, so softcap pressure was increased. Playtime target (20m) was met. Completed with: END_CH02. Key warnings: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain | [score-preview:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1" | [choice:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1"
- CH03: Mid-game branching remained strong, and side-path farming kept equipment progression meaningful. Playtime target (20m) was met. Completed with: END_CH03. Key warnings: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: The CH05 entry gate was stabilized by forcing a guaranteed Pangyo clearance route. Playtime target (20m) was met. Completed with: END_CH04. Key warnings: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1 | event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: Pre-finale density was reinforced with repeatable farming and side loops. Playtime target (20m) was met. Completed with: END_CH05. Key warnings: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1 | event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain

### Warnings
- CH01: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain
- CH02: [score-preview:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1"
- CH02: [choice:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1"
- CH03: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1
- CH04: event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1
- CH05: event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain

## player-02 (aggressive)
- status: success
- clearedChapters: CH01, CH02, CH03, CH04, CH05
- failedChapter: -
- totalSteps: 96
- totalChoices: 91
- totalEstimatedMinutes: 354
- finalStats: hp=100, maxHp=100, noise=24, contamination=35
- playMinutes: 354
- inventoryItemCount: 41

### Chapter Results
- CH01: SUCCESS | reason=END_CH01 | steps=21 | choices=20 | events=21 | estimatedMinutes=79 (raw=79) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=6
- CH02: SUCCESS | reason=END_CH02 | steps=16 | choices=15 | events=16 | estimatedMinutes=59 (raw=59) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=9
- CH03: SUCCESS | reason=END_CH03 | steps=28 | choices=27 | events=28 | estimatedMinutes=97 (raw=97) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=17
- CH04: SUCCESS | reason=END_CH04 | steps=16 | choices=15 | events=16 | estimatedMinutes=63 (raw=63) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=20
- CH05: SUCCESS | reason=END_CH05 | steps=15 | choices=14 | events=15 | estimatedMinutes=56 (raw=56) | preItems={delivery:1,security:1,route:1} | endHp=100 | endNoise=24

### Chapter Reviews
- CH01: Onboarding is stable, but farming options were narrow, so conditional farming branches were expanded. Playtime target (20m) was met. Completed with: END_CH01. Key warnings: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: Risk-reward pacing was good, but repeat farming impact was weak, so softcap pressure was increased. Playtime target (20m) was met. Completed with: END_CH02. Key warnings: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain | [score-preview:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1" | [choice:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1"
- CH03: Mid-game branching remained strong, and side-path farming kept equipment progression meaningful. Playtime target (20m) was met. Completed with: END_CH03. Key warnings: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: The CH05 entry gate was stabilized by forcing a guaranteed Pangyo clearance route. Playtime target (20m) was met. Completed with: END_CH04. Key warnings: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1 | event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: Pre-finale density was reinforced with repeatable farming and side loops. Playtime target (20m) was met. Completed with: END_CH05. Key warnings: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1 | event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain

### Warnings
- CH01: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain
- CH02: [score-preview:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1"
- CH02: [choice:ch02_finish] unsupported effect guard "trust.npc_jung_noah>=1"
- CH03: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1
- CH04: event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1
- CH05: event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain
