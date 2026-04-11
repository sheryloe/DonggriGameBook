# 2-Player Agent Simulation Report

- generatedAt: 2026-04-11T06:18:39.928Z
- seed: 20260410
- chapters: CH16, CH17, CH18, CH19, CH20
- players: 2

## Overall Summary
- succeededPlayers: 2/2
- failedPlayers: 0
- warningCount: 0
- chapterClearCounts: {"CH16":2,"CH17":2,"CH18":2,"CH19":2,"CH20":2}
- chapterReachedCounts: {"CH16":2,"CH17":2,"CH18":2,"CH19":2,"CH20":2}
- chapterEstimatedMinutes: {"CH16":12.4,"CH17":14.600000000000001,"CH18":21,"CH19":16.6,"CH20":18.4}
- averageEstimatedMinutesByChapter: {"CH16":6.2,"CH17":7.3,"CH18":10.5,"CH19":8.3,"CH20":9.2}

## player-01 (cautious)
- status: success
- clearedChapters: CH16, CH17, CH18, CH19, CH20
- failedChapter: -
- totalSteps: 54
- totalChoices: 54
- totalEstimatedMinutes: 41.4
- finalStats: hp=63, maxHp=100, noise=49, contamination=33
- playMinutes: 216
- inventoryItemCount: 7

### Chapter Results
- CH16: SUCCESS | reason=END_CH16_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=6.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=64 | endNoise=18
- CH17: SUCCESS | reason=END_CH17_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=7.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=40 | endNoise=29
- CH18: SUCCESS | reason=END_CH18_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=10.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=33 | endNoise=39
- CH19: SUCCESS | reason=END_CH19_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=8.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=19 | endNoise=49
- CH20: SUCCESS | reason=END_CH20_RESOLVED | ending=P4_END_GATE_BROKEN | steps=10 | choices=10 | events=10 | estimatedMinutes=9.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=28 | endNoise=59

### Chapter Reviews
- CH16: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +18 and contamination by +11. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch16_entry_slow(1), ch16_route_order(1). Playtime target (6m) met. Finished with END_CH16_RESOLVED. No major warnings.
- CH17: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +21 and contamination by +12. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch17_entry_slow(1), ch17_route_solidarity(1). Playtime target (7m) met. Finished with END_CH17_RESOLVED. No major warnings.
- CH18: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +20 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch18_entry_slow(1), ch18_route_order(1). Playtime target (10m) met. Finished with END_CH18_RESOLVED. No major warnings.
- CH19: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +20 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch19_entry_slow(1), ch19_route_solidarity(1). Playtime target (8m) met. Finished with END_CH19_RESOLVED. No major warnings.
- CH20: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +20 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch20_entry_slow(1), ch20_route_order(1). Playtime target (9m) met. Finished with END_CH20_RESOLVED. No major warnings.

### Warnings
- none

## player-02 (aggressive)
- status: success
- clearedChapters: CH16, CH17, CH18, CH19, CH20
- failedChapter: -
- totalSteps: 56
- totalChoices: 56
- totalEstimatedMinutes: 41.6
- finalStats: hp=63, maxHp=100, noise=60, contamination=35
- playMinutes: 224
- inventoryItemCount: 7

### Chapter Results
- CH16: SUCCESS | reason=END_CH16_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=6.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=64 | endNoise=20
- CH17: SUCCESS | reason=END_CH17_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=7.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=40 | endNoise=32
- CH18: SUCCESS | reason=END_CH18_RESOLVED | ending=- | steps=14 | choices=14 | events=14 | estimatedMinutes=10.6 (raw=56) | preItems={delivery:0,security:0,route:0} | endHp=33 | endNoise=45
- CH19: SUCCESS | reason=END_CH19_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=8.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=19 | endNoise=58
- CH20: SUCCESS | reason=END_CH20_RESOLVED | ending=P4_END_ORDERED_SELECTION | steps=10 | choices=10 | events=10 | estimatedMinutes=9.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=28 | endNoise=70

### Chapter Reviews
- CH16: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +20 and hp by -36. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch16_entry_slow(1), ch16_route_witness(1). Playtime target (6m) met. Finished with END_CH16_RESOLVED. No major warnings.
- CH17: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +22 and hp by -42. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch17_entry_slow(1), ch17_route_witness(1). Playtime target (7m) met. Finished with END_CH17_RESOLVED. No major warnings.
- CH18: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +23 and hp by -30. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch18_entry_slow(1), ch18_route_solidarity(1). Playtime target (10m) met. Finished with END_CH18_RESOLVED. No major warnings.
- CH19: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +23 and hp by -44. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch19_entry_slow(1), ch19_route_solidarity(1). Playtime target (8m) met. Finished with END_CH19_RESOLVED. No major warnings.
- CH20: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +22 and hp by -35. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch20_entry_slow(1), ch20_route_witness(1). Playtime target (9m) met. Finished with END_CH20_RESOLVED. No major warnings.

### Warnings
- none
