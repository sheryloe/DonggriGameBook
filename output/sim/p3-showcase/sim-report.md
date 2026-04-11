# 2-Player Agent Simulation Report

- generatedAt: 2026-04-11T06:18:39.879Z
- seed: 20260410
- chapters: CH11, CH12, CH13, CH14, CH15
- players: 2

## Overall Summary
- succeededPlayers: 2/2
- failedPlayers: 0
- warningCount: 0
- chapterClearCounts: {"CH11":2,"CH12":2,"CH13":2,"CH14":2,"CH15":2}
- chapterReachedCounts: {"CH11":2,"CH12":2,"CH13":2,"CH14":2,"CH15":2}
- chapterEstimatedMinutes: {"CH11":10.4,"CH12":12.600000000000001,"CH13":14.600000000000001,"CH14":10.600000000000001,"CH15":14.600000000000001}
- averageEstimatedMinutesByChapter: {"CH11":5.2,"CH12":6.3,"CH13":7.3,"CH14":5.3,"CH15":7.3}

## player-01 (cautious)
- status: success
- clearedChapters: CH11, CH12, CH13, CH14, CH15
- failedChapter: -
- totalSteps: 54
- totalChoices: 54
- totalEstimatedMinutes: 31.4
- finalStats: hp=63, maxHp=100, noise=36, contamination=29
- playMinutes: 216
- inventoryItemCount: 8

### Chapter Results
- CH11: SUCCESS | reason=END_CH11_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=5.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=72 | endNoise=16
- CH12: SUCCESS | reason=END_CH12_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=6.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=56 | endNoise=25
- CH13: SUCCESS | reason=END_CH13_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=7.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=49 | endNoise=32
- CH14: SUCCESS | reason=END_CH14_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=5.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=47 | endNoise=37
- CH15: SUCCESS | reason=END_CH15_RESOLVED | ending=P3_END_COLD_MERCY | steps=12 | choices=12 | events=12 | estimatedMinutes=7.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=29 | endNoise=46

### Chapter Reviews
- CH11: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +16 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch11_entry_slow(1), ch11_route_certified(1). Playtime target (5m) met. Finished with END_CH11_RESOLVED. No major warnings.
- CH12: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +19 and contamination by +11. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch12_entry_slow(1), ch12_route_medical(1). Playtime target (6m) met. Finished with END_CH12_RESOLVED. No major warnings.
- CH13: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +17 and contamination by +10. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch13_entry_slow(1), ch13_route_certified(1). Playtime target (7m) met. Finished with END_CH13_RESOLVED. No major warnings.
- CH14: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +15 and contamination by +9. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch14_entry_slow(1), ch14_route_public(1). Playtime target (5m) met. Finished with END_CH14_RESOLVED. No major warnings.
- CH15: Chapter pacing stayed readable, but branch identity can still sharpen. Cautious routing changed noise by +19 and contamination by +9. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch15_entry_slow(1), ch15_route_public(1). Playtime target (7m) met. Finished with END_CH15_RESOLVED. No major warnings.

### Warnings
- none

## player-02 (aggressive)
- status: success
- clearedChapters: CH11, CH12, CH13, CH14, CH15
- failedChapter: -
- totalSteps: 54
- totalChoices: 54
- totalEstimatedMinutes: 31.4
- finalStats: hp=63, maxHp=100, noise=45, contamination=28
- playMinutes: 216
- inventoryItemCount: 8

### Chapter Results
- CH11: SUCCESS | reason=END_CH11_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=5.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=72 | endNoise=18
- CH12: SUCCESS | reason=END_CH12_RESOLVED | ending=- | steps=10 | choices=10 | events=10 | estimatedMinutes=6.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=60 | endNoise=27
- CH13: SUCCESS | reason=END_CH13_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=7.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=53 | endNoise=37
- CH14: SUCCESS | reason=END_CH14_RESOLVED | ending=- | steps=12 | choices=12 | events=12 | estimatedMinutes=5.4 (raw=48) | preItems={delivery:0,security:0,route:0} | endHp=51 | endNoise=45
- CH15: SUCCESS | reason=END_CH15_RESOLVED | ending=P3_END_CERTIFIED_PASSAGE | steps=10 | choices=10 | events=10 | estimatedMinutes=7.2 (raw=40) | preItems={delivery:0,security:0,route:0} | endHp=33 | endNoise=55

### Chapter Reviews
- CH11: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +18 and hp by -28. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch11_entry_slow(1), ch11_route_public(1). Playtime target (5m) met. Finished with END_CH11_RESOLVED. No major warnings.
- CH12: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +19 and hp by -30. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch12_entry_slow(1), ch12_route_public(1). Playtime target (6m) met. Finished with END_CH12_RESOLVED. No major warnings.
- CH13: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +20 and hp by -25. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch13_entry_slow(1), ch13_route_medical(1). Playtime target (7m) met. Finished with END_CH13_RESOLVED. No major warnings.
- CH14: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +18 and hp by -20. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch14_entry_slow(1), ch14_route_public(1). Playtime target (5m) met. Finished with END_CH14_RESOLVED. No major warnings.
- CH15: Chapter pacing stayed readable, but branch identity can still sharpen. Aggressive routing changed noise by +20 and hp by -36. The route stayed close to linear progression without farm loops. set_route was applied 1 time(s). Major choices: ch15_entry_slow(1), ch15_route_medical(1). Playtime target (7m) met. Finished with END_CH15_RESOLVED. No major warnings.

### Warnings
- none
