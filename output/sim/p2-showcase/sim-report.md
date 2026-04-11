# 2-Player Agent Simulation Report

- generatedAt: 2026-04-11T06:18:39.847Z
- seed: 20260410
- chapters: CH06, CH07, CH08, CH09, CH10
- players: 2

## Overall Summary
- succeededPlayers: 2/2
- failedPlayers: 0
- warningCount: 0
- chapterClearCounts: {"CH06":2,"CH07":2,"CH08":2,"CH09":2,"CH10":2}
- chapterReachedCounts: {"CH06":2,"CH07":2,"CH08":2,"CH09":2,"CH10":2}
- chapterEstimatedMinutes: {"CH06":10.4,"CH07":12.600000000000001,"CH08":12.600000000000001,"CH09":12.600000000000001,"CH10":14.600000000000001}
- averageEstimatedMinutesByChapter: {"CH06":5.2,"CH07":6.3,"CH08":6.3,"CH09":6.3,"CH10":7.3}

## player-01 (cautious)
- status: success
- clearedChapters: CH06, CH07, CH08, CH09, CH10
- failedChapter: -
- totalSteps: 54
- totalChoices: 54
- totalEstimatedMinutes: 31.4
- finalStats: hp=63, maxHp=100, noise=40, contamination=31
- playMinutes: 216
- inventoryItemCount: 8

### Chapter Results
- CH06: SUCCESS | reason=END_CH06_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=5.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=68 | endNoise=17
- CH07: SUCCESS | reason=END_CH07_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=6.4 (raw=48) | preItems={delivery:1,security:0,route:0} | endHp=58 | endNoise=24
- CH08: SUCCESS | reason=END_CH08_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=6.2 (raw=40) | preItems={delivery:1,security:1,route:0} | endHp=42 | endNoise=32
- CH09: SUCCESS | reason=END_CH09_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=6.2 (raw=40) | preItems={delivery:1,security:2,route:0} | endHp=35 | endNoise=40
- CH10: SUCCESS | reason=END_CH10_RESOLVED | ending=P2_END_RED_CORRIDOR | steps=12 | choices=12 | events=12 | estimatedMinutes=7.4 (raw=48) | preItems={delivery:1,security:3,route:0} | endHp=25 | endNoise=50

### Chapter Reviews
- CH06: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +17 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch06_entry_slow(1), ch06_route_official(1). Playtime target (5m) met. Finished with END_CH06_RESOLVED. No major warnings.
- CH07: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +17 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch07_entry_slow(1), ch07_route_witness(1). Playtime target (6m) met. Finished with END_CH07_RESOLVED. No major warnings.
- CH08: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +18 and contamination by +11. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch08_entry_slow(1), ch08_route_official(1). Playtime target (6m) met. Finished with END_CH08_RESOLVED. No major warnings.
- CH09: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +18 and contamination by +11. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch09_entry_slow(1), ch09_route_broker(1). Playtime target (6m) met. Finished with END_CH09_RESOLVED. No major warnings.
- CH10: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +20 and contamination by +9. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch10_entry_slow(1), ch10_route_broker(1). Playtime target (7m) met. Finished with END_CH10_RESOLVED. No major warnings.

### Warnings
- none

## player-02 (aggressive)
- status: success
- clearedChapters: CH06, CH07, CH08, CH09, CH10
- failedChapter: -
- totalSteps: 54
- totalChoices: 54
- totalEstimatedMinutes: 31.4
- finalStats: hp=63, maxHp=100, noise=50, contamination=31
- playMinutes: 216
- inventoryItemCount: 9

### Chapter Results
- CH06: SUCCESS | reason=END_CH06_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=5.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=68 | endNoise=19
- CH07: SUCCESS | reason=END_CH07_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=6.2 (raw=40) | preItems={delivery:1,security:0,route:0} | endHp=58 | endNoise=27
- CH08: SUCCESS | reason=END_CH08_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=6.4 (raw=48) | preItems={delivery:1,security:0,route:0} | endHp=42 | endNoise=38
- CH09: SUCCESS | reason=END_CH09_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=6.4 (raw=48) | preItems={delivery:1,security:1,route:0} | endHp=35 | endNoise=49
- CH10: SUCCESS | reason=END_CH10_RESOLVED | ending=P2_END_CONTROLLED_CONVOY | steps=10 | choices=10 | events=10 | estimatedMinutes=7.2 (raw=40) | preItems={delivery:1,security:3,route:0} | endHp=25 | endNoise=60

### Chapter Reviews
- CH06: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +19 and hp by -32. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch06_entry_slow(1), ch06_route_broker(1). Playtime target (5m) met. Finished with END_CH06_RESOLVED. No major warnings.
- CH07: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +18 and hp by -28. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch07_entry_slow(1), ch07_route_broker(1). Playtime target (6m) met. Finished with END_CH07_RESOLVED. No major warnings.
- CH08: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +21 and hp by -34. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch08_entry_slow(1), ch08_route_witness(1). Playtime target (6m) met. Finished with END_CH08_RESOLVED. No major warnings.
- CH09: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +21 and hp by -28. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch09_entry_slow(1), ch09_route_broker(1). Playtime target (6m) met. Finished with END_CH09_RESOLVED. No major warnings.
- CH10: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +21 and hp by -38. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch10_entry_slow(1), ch10_route_witness(1). Playtime target (7m) met. Finished with END_CH10_RESOLVED. No major warnings.

### Warnings
- none
