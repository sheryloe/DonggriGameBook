# 2-Player Agent Simulation Report

- generatedAt: 2026-04-10T14:59:11.918Z
- seed: 20260410
- chapters: CH01, CH02, CH03, CH04, CH05
- players: 2

## Overall Summary
- succeededPlayers: 0/2
- failedPlayers: 2
- warningCount: 2
- chapterClearCounts: {"CH01":2,"CH02":2,"CH03":2,"CH04":2,"CH05":0}

## player-01 (cautious)
- status: failed
- clearedChapters: CH01, CH02, CH03, CH04
- failedChapter: CH05
- totalSteps: 81
- totalChoices: 76
- finalStats: hp=100, maxHp=100, noise=0, contamination=32
- inventoryItemCount: 27

### Chapter Results
- CH01: SUCCESS | reason=END_CH01 | steps=21 | choices=20 | events=21 | endHp=100 | endNoise=1
- CH02: SUCCESS | reason=END_CH02 | steps=15 | choices=14 | events=15 | endHp=100 | endNoise=0
- CH03: SUCCESS | reason=END_CH03 | steps=28 | choices=27 | events=28 | endHp=100 | endNoise=0
- CH04: SUCCESS | reason=END_CH04 | steps=16 | choices=15 | events=16 | endHp=100 | endNoise=0
- CH05: FAILED | reason=no_available_choice | steps=1 | choices=0 | events=1 | endHp=100 | endNoise=0

### Warnings
- CH05: choice selection failed at "EV_CH05_ENTRY" (no_available_choice)

## player-02 (aggressive)
- status: failed
- clearedChapters: CH01, CH02, CH03, CH04
- failedChapter: CH05
- totalSteps: 82
- totalChoices: 77
- finalStats: hp=100, maxHp=100, noise=20, contamination=34
- inventoryItemCount: 33

### Chapter Results
- CH01: SUCCESS | reason=END_CH01 | steps=21 | choices=20 | events=21 | endHp=100 | endNoise=6
- CH02: SUCCESS | reason=END_CH02 | steps=16 | choices=15 | events=16 | endHp=100 | endNoise=9
- CH03: SUCCESS | reason=END_CH03 | steps=28 | choices=27 | events=28 | endHp=100 | endNoise=17
- CH04: SUCCESS | reason=END_CH04 | steps=16 | choices=15 | events=16 | endHp=100 | endNoise=20
- CH05: FAILED | reason=no_available_choice | steps=1 | choices=0 | events=1 | endHp=100 | endNoise=20

### Warnings
- CH05: choice selection failed at "EV_CH05_ENTRY" (no_available_choice)
