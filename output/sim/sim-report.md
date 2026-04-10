# 2-Player Agent Simulation Report

- generatedAt: 2026-04-10T15:59:13.840Z
- seed: 20260410
- chapters: CH01, CH02, CH03, CH04, CH05
- players: 2

## Overall Summary
- succeededPlayers: 2/2
- failedPlayers: 0
- warningCount: 14
- chapterClearCounts: {"CH01":2,"CH02":2,"CH03":2,"CH04":2,"CH05":2}
- chapterEstimatedMinutes: {"CH01":161,"CH02":115,"CH03":191,"CH04":126,"CH05":112}
- averageEstimatedMinutesByChapter: {"CH01":80.5,"CH02":57.5,"CH03":95.5,"CH04":63,"CH05":56}

## player-01 (cautious)
- status: success
- clearedChapters: CH01, CH02, CH03, CH04, CH05
- failedChapter: -
- totalSteps: 96
- totalChoices: 91
- totalEstimatedMinutes: 354
- finalStats: hp=100, maxHp=100, noise=7, contamination=38
- playMinutes: 354
- inventoryItemCount: 35

### Chapter Results
- CH01: SUCCESS | reason=END_CH01 | steps=22 | choices=21 | events=22 | estimatedMinutes=82 (raw=82) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=2
- CH02: SUCCESS | reason=END_CH02 | steps=15 | choices=14 | events=15 | estimatedMinutes=56 (raw=56) | preItems={delivery:0,security:0,route:0} | endHp=98 | endNoise=3
- CH03: SUCCESS | reason=END_CH03 | steps=28 | choices=27 | events=28 | estimatedMinutes=97 (raw=97) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=8
- CH04: SUCCESS | reason=END_CH04 | steps=16 | choices=15 | events=16 | estimatedMinutes=63 (raw=63) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=8
- CH05: SUCCESS | reason=END_CH05 | steps=15 | choices=14 | events=15 | estimatedMinutes=56 (raw=56) | preItems={delivery:4,security:2,route:1} | endHp=100 | endNoise=7

### Chapter Reviews
- CH01: 온보딩은 안정적이지만 파밍 선택 폭이 좁아 조건형 보조 루프를 확장했다. 신중 성향으로 진행해 소음 변화는 +2, 오염 변화는 +6. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 1회 반영됐다. 주요 선택: ch01_brief_go(1회), ch01_approach_careful(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH01. 주요 경고: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: 리스크-보상 구조는 유지하되 반복 파밍의 체감 페널티를 강화했다. 신중 성향으로 진행해 소음 변화는 +1, 오염 변화는 +18. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 1회 반영됐다. 주요 선택: ch02_entry_go(1회), ch02_market_storage(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH02. 주요 경고: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain
- CH03: 중반 분기 유지와 장비 성장 동기를 동시에 확보하도록 루프를 조정했다. 신중 성향으로 진행해 소음 변화는 +5, 오염 변화는 +6. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 4회 반영됐다. 주요 선택: ch03_start(1회), ch03_basement_support(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH03. 주요 경고: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: CH05 진입 막힘을 방지하도록 판교 진입권 경로를 고정했다. 신중 성향으로 진행해 소음 변화는 +0, 오염 변화는 +3. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 2회 반영됐다. 주요 선택: ch04_start(1회), ch04_cold_record(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH04. 주요 경고: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1 | event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: 피날레 직전 준비 밀도를 높이기 위해 반복 루프와 사이드 동선을 보강했다. 신중 성향으로 진행해 소음 변화는 -1, 오염 변화는 +5. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 1회 반영됐다. 주요 선택: ch05_start(1회), ch05_lobby_map(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH05. 주요 경고: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1 | event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain

### Warnings
- CH01: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain
- CH03: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1
- CH04: event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1
- CH05: event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain

## player-02 (aggressive)
- status: success
- clearedChapters: CH01, CH02, CH03, CH04, CH05
- failedChapter: -
- totalSteps: 95
- totalChoices: 90
- totalEstimatedMinutes: 351
- finalStats: hp=100, maxHp=100, noise=34, contamination=36
- playMinutes: 351
- inventoryItemCount: 42

### Chapter Results
- CH01: SUCCESS | reason=END_CH01 | steps=21 | choices=20 | events=21 | estimatedMinutes=79 (raw=79) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=8
- CH02: SUCCESS | reason=END_CH02 | steps=16 | choices=15 | events=16 | estimatedMinutes=59 (raw=59) | preItems={delivery:0,security:0,route:0} | endHp=98 | endNoise=13
- CH03: SUCCESS | reason=END_CH03 | steps=27 | choices=26 | events=27 | estimatedMinutes=94 (raw=94) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=25
- CH04: SUCCESS | reason=END_CH04 | steps=16 | choices=15 | events=16 | estimatedMinutes=63 (raw=63) | preItems={delivery:0,security:0,route:0} | endHp=100 | endNoise=29
- CH05: SUCCESS | reason=END_CH05 | steps=15 | choices=14 | events=15 | estimatedMinutes=56 (raw=56) | preItems={delivery:1,security:1,route:1} | endHp=100 | endNoise=34

### Chapter Reviews
- CH01: 온보딩은 안정적이지만 파밍 선택 폭이 좁아 조건형 보조 루프를 확장했다. 공격적 성향으로 진행해 소음 변화는 +8, 체력 변화는 0. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 2회 반영됐다. 주요 선택: ch01_brief_go(1회), ch01_approach_careful(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH01. 주요 경고: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: 리스크-보상 구조는 유지하되 반복 파밍의 체감 페널티를 강화했다. 공격적 성향으로 진행해 소음 변화는 +5, 체력 변화는 -2. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 1회 반영됐다. 주요 선택: ch02_entry_go(1회), ch02_market_storage(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH02. 주요 경고: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain
- CH03: 중반 분기 유지와 장비 성장 동기를 동시에 확보하도록 루프를 조정했다. 공격적 성향으로 진행해 소음 변화는 +12, 체력 변화는 2. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 4회 반영됐다. 주요 선택: ch03_start(1회), ch03_basement_support(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH03. 주요 경고: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: CH05 진입 막힘을 방지하도록 판교 진입권 경로를 고정했다. 공격적 성향으로 진행해 소음 변화는 +4, 체력 변화는 0. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 2회 반영됐다. 주요 선택: ch04_start(1회), ch04_cold_record(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH04. 주요 경고: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1 | event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: 피날레 직전 준비 밀도를 높이기 위해 반복 루프와 사이드 동선을 보강했다. 공격적 성향으로 진행해 소음 변화는 +5, 체력 변화는 0. 반복 루프 없이 선형에 가깝게 진행됐다. 경로 지정(set_route) 선택은 1회 반영됐다. 주요 선택: ch05_start(1회), ch05_lobby_logs(1회). 플레이타임 목표(20분)를 충족했다. 완료 결과: END_CH05. 주요 경고: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1 | event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain

### Warnings
- CH01: event "EV_CH01_BOSS_BROADCAST" conditions not met; continued via direct chain
- CH02: event "EV_CH02_SLUICE_BOSS" conditions not met; continued via direct chain
- CH03: event "EV_CH03_BOSS_GARDEN" conditions not met; continued via direct chain
- CH04: [travel:CH04] no direct connection for MJ-04 -> MJ-06, default time=1
- CH04: event "EV_CH04_BOSS_PICKER" conditions not met; continued via direct chain
- CH05: [travel:CH05] no direct connection for PG-03 -> PG-04, default time=1
- CH05: event "EV_CH05_BOSS_LINES" conditions not met; continued via direct chain
