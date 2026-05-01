Original prompt: Part 1 최신 기준 고도화 계획을 구현하고, CH01~CH05 데이터 기반 플레이 루프 + CH05 5엔딩 + 엔딩 갤러리 + 이미지 런타임 반영 + 영상은 수동 생성 파이프라인까지 정리한다.

## 2026-04-09

- 현재 브랜치 `codex/current-version-content-pack` 기준으로 작업.
- `git fetch origin` 결과, 현재 브랜치와 원격 추적 브랜치 차이 없음.
- Part 1 런타임 전환 완료:
  - `src/store/gameStore.ts`를 data-driven runtime store로 교체.
  - `src/App.tsx`를 CH01~CH05 briefing/map/event/loot/boss/combat/result/gallery 셸로 교체.
  - `src/types/game.ts`, `schemas/chapter_event.schema.json`, `src/loaders/contentLoader.ts`에 ending/gallery/cinematic 메타 반영.
- Part 1 데이터 보강 완료:
  - `scripts/generate-part1-enhancements.mjs` 추가.
  - CH01~CH05에 `chapter_cinematic`, route 축 효과, CH05 `ending_matrix` 생성.
  - CH01/CH02의 구형 레거시 node/event 블록 자동 정리 규칙 추가.
  - CH05 UI flow에 `ending_gallery` 화면 추가.
- 자산/프롬프트 보강 완료:
  - `src/assets/manifest.ts`, `src/content/imageMatrix.ts`에 Part 1 briefing/map/result/ending/thumb 키 추가.
  - `docs/asset-prompt-pack/part1-video-prompts/` 아래 11개 영상 프롬프트 세트 생성.
- 검증:
  - `npm run part1:enhance` 통과
  - CH01~CH05 chapter/UI schema validation 통과
  - `npm run build` 통과
  - `Invoke-WebRequest http://127.0.0.1:4173` 응답 200 확인

## 남은 리스크 / TODO

- Playwright MCP 브라우저 검증은 권한 오류로 미실행:
  - `EPERM: operation not permitted, open 'C:\\WINDOWS\\system32\\.playwright-mcp\\page-....yml'`
  - 실제 UI 클릭 루프는 다음 작업자가 별도 Playwright 환경에서 확인 필요.
- 현재 `src/App.tsx`는 데이터 기반 루프는 연결됐지만, 화면 연출은 최소 구현 상태.
  - 전투/루팅/결과 화면의 시각 연출과 미세 인터랙션 고도화 필요.
- Part 1 이미지 실제 파일은 아직 없음.
  - `art_key`는 연결 완료, 실제 생성물은 Web GPT/Gemini Nano/Sora 수동 파이프라인으로 채워야 함.
- 빌드 경고:
  - 번들 JS가 500kB 초과. 나중에 `manualChunks` 또는 lazy import로 분리 검토.

## 2026-04-22

- Part 1 직접 앱의 플레이어 노출 문구를 한국어 기준으로 정리했다.
  - HUD: 생체 신호, 소음도, 오염도, 보관함, 내 정보, 제N장.
  - 브리핑/지도/이벤트/전투/결과/모달/오류 화면의 영문 작전 코드성 문구를 한국어로 교체.
  - Typewriter가 한글 음절을 누락시키던 상태 업데이트 버그를 수정.
  - 모바일 390px에서 HUD 버튼/챕터 라벨 줄바꿈을 줄이도록 압축 CSS 추가.
- Part 1 콘텐츠 노출어도 정리했다.
  - 튜토리얼 -> 초입 안내, 첫 보스 -> 첫 결전, 블랙마켓 -> 암시장, 파밍/캐시/락다운/스카이브릿지/스카이워크 계열 표현 정리.
  - CH01~CH05 선택지 preview를 자연스러운 한국어 문장으로 재생성.
  - CH01~CH05 원본 JSON의 schema 외 보조 인덱스 필드 제거 후 private export 통과.
- 검증 완료:
  - npm run private:check
  - npm run private:export
  - npx tsc -p apps\part1\tsconfig.json --noEmit
  - npm run build:part1
  - Playwright 모바일 캡처 및 콘솔 오류 0건 확인.
## 2026-04-22 CH01 media runtime loop

- CH01 media production queue added under private/prompts/media-production/part1/ch01.
  - queue.json tracks 12 items: image scene, TTS, BGM, SFX, zombie images, location images, video, CSS.
  - First prompt file fixed: P1-CH01-IMG-SCN-001.md.
- Runtime audio hooks added for Part1.
  - BGM starts from public/audio/story1.mp3 after user gesture.
  - Emergency hum loop starts from public/generated/audio/sfx/P1/CH01/P1_CH01_LOW_EMERGENCY_HUM_LOOP.wav.
  - Choice click calls public/generated/audio/sfx/P1/CH01/P1_CH01_CHOICE_SIGNAL_CUT.wav and delays route transition briefly.
  - Typewriter calls low-volume text ticks with throttling.
- Temporary local CH01 SFX wav files generated in public/generated/audio/sfx/P1/CH01 for immediate testing.
- Validation completed.
  - npx tsc -p apps\part1\tsconfig.json --noEmit: pass
  - npm run build:part1: pass
  - Browser check: start click increments bgmStarts/humStarts/signalBursts; choice click increments choiceSelects; console/page errors 0.
- TODO next: when user uploads generated assets by ID, sync file to target_dir, update queue status, then provide next ID prompt.

## 2026-04-23 CH01 image visual approval

- User provided generated image for P1-CH01-IMG-SCN-001.
- Visual review passed: yellow warning monitor, REC light, Korean emergency broadcast text, Yeouido broadcast building context, analog disaster tone.
- queue.json updated to visual_approved_waiting_file_path. Actual file sync is pending until local source path is provided.
- Next production item: P1-CH01-TTS-001, Yoon Haein first radio line.

## 2026-04-23 CH01 image synced and TTS format updated

- P1-CH01-IMG-SCN-001 synced from Downloads into:
  - public/generated/images/inbox/P1/p1_ch01_yellow_radio_record_warning.png
  - public/generated/images/p1_ch01_yellow_radio_record_warning.png
- CH01 first event art_key set to p1_ch01_yellow_radio_record_warning.
- apps/part1 contentLoader resolves p1_ch01_* production keys to public/generated/images/*.png.
- Queue status changed to completed. Progress is now 1/12.
- P1-CH01-TTS-001 prompt rewritten for Google TTS Scene / Sample Context / Text format with single Speaker 1.
- Validation completed:
  - npm run private:check: pass
  - npm run private:export: pass
  - npx tsc -p apps\part1\tsconfig.json --noEmit: pass
  - npm run build:part1: pass
  - Browser request confirmed: /generated/images/p1_ch01_yellow_radio_record_warning.png loaded with console/page errors 0.

## 2026-04-23 CH01 TTS synced

- User provided Google TTS output path: C:/Users/wlflq/Downloads/Generated Audio April 23, 2026 - 7_33AM.wav.
- Synced to public/generated/audio/tts/P1/CH01/P1_CH01_YOON_HAEIN_FIRST_LINE.wav.
- EventScreen now maps EV_CH01_BRIEFING to the voice line and plays it after first event entry.
- Audio debug confirmed voiceLines=1 and request finished for /generated/audio/tts/P1/CH01/P1_CH01_YOON_HAEIN_FIRST_LINE.wav.
- Queue progress is now 2/12.
- Validation completed: tsc pass, build:part1 pass, browser console/page errors 0.
- Next production item: P1-CH01-BGM-001.

## 2026-04-23 CH01 BGM synced

- User provided BGM path: C:/Users/wlflq/Downloads/???_??.mp3.
- Synced to public/generated/audio/bgm/P1/CH01/P1_CH01_ABANDONED_BROADCAST_BGM.mp3.
- BriefingScreen CH_BGM.CH01 now starts the dedicated BGM instead of public/audio/story1.mp3.
- Queue progress is now 3/12.
- Validation completed: tsc pass, build:part1 pass.
- Browser request confirmed: /generated/audio/bgm/P1/CH01/P1_CH01_ABANDONED_BROADCAST_BGM.mp3 loaded; debug bgmStarts=1, errors 0.
- Next production item: P1-CH01-SFX-001 for final generated text/radio static pack.

## 2026-04-23 CH01 SFX-001 synced

- User provided zip: C:/Users/wlflq/Downloads/P1_CH01_TEXT_RADIO_STATIC_SFX (1).zip.
- Extracted into public/generated/audio/sfx/P1/CH01.
- Files synced: P1_CH01_TEXT_TICK.wav, P1_CH01_RADIO_STATIC_CHIRP.wav, P1_CH01_CORRUPTED_SIGNAL_BURST.wav, P1_CH01_ARCHIVE_CONFIRM_BEEP.wav, P1_CH01_LOW_EMERGENCY_HUM_LOOP.wav.
- audio.ts now uses uploaded P1_CH01_TEXT_TICK.wav via a small one-shot audio pool for typewriter ticks. Signal burst and hum loop already load uploaded wavs.
- Queue progress is now 4/12.
- Validation completed: tsc pass, build:part1 pass. Browser request confirmed for TEXT_TICK, CORRUPTED_SIGNAL_BURST, LOW_EMERGENCY_HUM_LOOP; errors 0.
- Next production item: P1-CH01-SFX-002 choice/signal-cut transition SFX.

## 2026-04-23 CH01 SFX-002 synced

- User provided choice transition SFX path: C:/Users/wlflq/Downloads/P1_CH01_CHOICE_SIGNAL_CUT.wav.
- Synced to public/generated/audio/sfx/P1/CH01/P1_CH01_CHOICE_SIGNAL_CUT.wav.
- Queue progress is now 5/12.
- Validation completed: tsc pass, build:part1 pass.
- Browser check confirmed choice click request for /generated/audio/sfx/P1/CH01/P1_CH01_CHOICE_SIGNAL_CUT.wav, choiceSelects=1, console/page errors 0.
- Next production item: P1-CH01-IMG-ZMB-001 default infected image.

## 2026-04-24 CH01 IMG-ZMB-001 visual approval

- User pasted the CH01 base infected image in chat. Visual review passed for P1-CH01-IMG-ZMB-001.
- The provided Downloads path did not exist locally, and a filename search under C:/Users/wlflq found no matching file.
- Queue status set to visual_approved_waiting_file_path. Progress remains 5/12 completed, 1 visual-approved pending binary sync.
- Next production item can proceed as P1-CH01-IMG-ZMB-002 while waiting for the actual file path.

## 2026-04-24 CH01 IMG-ZMB-001 synced

- User provided source path: C:/Users/wlflq/Downloads/ChatGPT Image 2026? 4? 24? ?? 10_26_31.png.
- Synced to:
  - public/generated/images/inbox/P1/threat_p1_ch01_broadcast_hall_infected.png
  - public/generated/images/threat_p1_ch01_broadcast_hall_infected.png
- BattleScreen ENEMY_IMAGE_MAP.erosion_basic now uses threat_p1_ch01_broadcast_hall_infected.png.
- Queue progress is now 6/12.
- Validation completed: tsc pass, build:part1 pass.
- Browser battle check forced CH01 BATTLE state and confirmed request for /generated/images/threat_p1_ch01_broadcast_hall_infected.png with console/page errors 0.
- Next production item: P1-CH01-IMG-ZMB-002 boss infected.

## 2026-04-24 CH01 IMG-ZMB-002 synced

- User provided source path: C:/Users/wlflq/Downloads/ChatGPT Image 2026? 4? 24? ?? 04_19_44.png.
- Synced to:
  - public/generated/images/inbox/P1/boss_p1_ch01_editing_room_infected.png
  - public/generated/images/boss_p1_ch01_editing_room_infected.png
- BattleScreen ENEMY_IMAGE_MAP.editing_aberration now uses boss_p1_ch01_editing_room_infected.png.
- Queue progress is now 7/12.
- Validation completed: tsc pass, build:part1 pass.
- Browser battle check confirmed request for /generated/images/boss_p1_ch01_editing_room_infected.png with console/page errors 0.
- Next production item: P1-CH01-IMG-LOC-001 abandoned broadcast lobby.

## 2026-04-24 CH01 IMG-LOC-001 synced

- User provided source path: C:/Users/wlflq/Downloads/ChatGPT Image 2026? 4? 24? ?? 04_32_52.png.
- Synced to:
  - public/generated/images/inbox/P1/p1_ch01_abandoned_broadcast_lobby.png
  - public/generated/images/p1_ch01_abandoned_broadcast_lobby.png
- CH01 lobby scenes using bg_broadcast_lobby were rewired to p1_ch01_abandoned_broadcast_lobby in private/content/data/chapters/ch01.json.
- Queue progress is now 8/12.
- Validation target: private:check, private:export, build:part1.
- Next production item: P1-CH01-IMG-LOC-002 flooded archive room.

## 2026-04-24 CH01 IMG-LOC-002 synced

- User provided source path: C:/Users/wlflq/Downloads/ChatGPT Image 2026? 4? 24? ?? 05_06_57.png.
- Synced to:
  - public/generated/images/inbox/P1/p1_ch01_flooded_archive_room.png
  - public/generated/images/p1_ch01_flooded_archive_room.png
- CH01 archive scenes using bg_archive_flooded were rewired to p1_ch01_flooded_archive_room in private/content/data/chapters/ch01.json.
- Queue progress is now 9/12.
- Validation target: private:check, private:export, build:part1.
- Next production item: P1-CH01-IMG-LOC-003 rooftop transmitter.

## 2026-04-24 CH01 IMG-LOC-003 synced

- User provided source path: C:/Users/wlflq/Downloads/ChatGPT Image 2026? 4? 24? ?? 05_22_09.png.
- Synced to:
  - public/generated/images/inbox/P1/p1_ch01_rooftop_transmitter.png
  - public/generated/images/p1_ch01_rooftop_transmitter.png
- CH01 rooftop signal scenes using bg_rooftop_signal were rewired to p1_ch01_rooftop_transmitter in private/content/data/chapters/ch01.json.
- Queue progress is now 10/12.
- Validation target: private:check, private:export, build:part1.
- Next production item: P1-CH01-VID-001 opening video review and sync.

## 2026-04-24 CH01 VID-001 synced

- User provided source path: C:/Users/wlflq/Downloads/v2_watermarked-e8164db8-c8b7-4b56-8850-3e9cd27822b5.mp4.
- Synced to:
  - public/generated/videos/P1_CH01_OPENING.mp4
- BriefingScreen now renders CH01 opening video as a muted background layer behind the poster.
- CH01 opening video playbackRate is fixed to 0.8 for slower playback.
- Queue progress is now 11/12.
- Validation target: build:part1 and browser playback check.
- Next production item: P1-CH01-CSS-001 final FX pass.

## 2026-04-30 Part 1 survival-loop refactor

- Part 1 runtime loop refactored away from RPG HP combat toward survival state pressure.
  - Added survival clock: day, timeBlock, elapsedHours.
  - Added deadlineFlags, failedQuestIds, restCount, survivalLog.
  - Added store actions: advanceTime, restAtSafehouse, useInventoryItem, failQuest, expireDeadlines, appendSurvivalLog.
- Added apps/part1/src/utils/survival.ts.
  - Centralizes deadline rules, rest eligibility, item-use effects, and CH05 ending verdict selection.
  - Existing 5 Part1 endings retained: 거울의 증언, 신호 수호자, 밀수 조류, 통제된 통로, 잿빛 탈출.
- Added SafehouseScreen.
  - Safehouse/rest loop now supports 짧은 휴식, 응급 처치, 하룻밤 쉼.
  - Entering a safehouse for the first time now applies a small one-time stabilization, while larger recovery still requires rest choices.
- Event runner now applies time/cost pressure.
  - Map travel applies connection time/noise/contamination.
  - Choices and encounter resolution advance time.
  - Deadlines expire as time advances.
  - Exit nodes with no available events now complete the chapter instead of leaving the player stuck on the map.
- Inventory can use recovery/contamination items directly.
- HUD/Stats/Map/Result visible strings restored to Korean and now expose survival clock, deadline pressure, rest/heal availability, and ending reasons.
- Balance pass:
  - Environmental contamination and battle exposure now contribute to infection more slowly than raw contamination.
  - Battle injury exposure reduced so encounters remain lethal but not immediate RPG-style attrition.
- Validation:
  - npm run private:check: pass
  - npm run private:export: pass
  - npx tsc -p apps\part1\tsconfig.json --noEmit: pass
  - npm run build:part1: pass
  - npm run qa:part1 -- http://127.0.0.1:5171/: pass, console/page/request errors 0, videoRequests 0
  - 3-route simulation now reaches CH03/CH04 without technical errors, but max-step auto routes still do not finish CH05; the script is too shallow for the longer 30-minute survival target.
- TODO:
  - Add a longer route simulator that understands rest/use-item decisions instead of only first/second/last button heuristics.
  - Add authored failed/variant quest events for expired deadlines instead of only state/log flags.
  - Tune real player route after manual playtest: target at least one human-readable safe route to CH05 in 28-33 minutes.

## 2026-05-01 Part 1 stability and feedback hardening

- Added local save persistence for Part 1 survival state.
  - Persist key: `donggri-part1-survival-save-v1`.
  - Saves chapter/node/event/screen, stats, flags, inventory, survival clock, deadlines, failed quests, rest count, survival log, visited nodes, completed events, progress, field budget, failure state, and save slots.
  - Hydration normalizes `BATTLE` back to `CHAPTER_MAP` and clears transient battle/modal state so refresh does not restore a broken encounter.
- Added visceral survival feedback.
  - Root app now marks `survival-warning` at danger 75+ and `survival-critical` at danger 90+ using injury/infection.
  - CSS red vignette and critical pulse make infection/injury spikes visible before forced failure.
  - HUD now hides zero-value noise/infection readouts until relevant, reducing early cognitive load.
- Reworked Typewriter timing from `setTimeout` to `requestAnimationFrame`.
  - Text reveal now uses elapsed time rather than timer count.
  - If the tab is hidden, the line completes immediately to avoid TTS/text desync after mobile browser throttling.
  - `prefers-reduced-motion` still renders text immediately.
- Validation:
  - `npx tsc -p apps\part1\tsconfig.json --noEmit`: pass
  - `npm run build:part1`: pass
  - `npm run qa:part1 -- http://127.0.0.1:5171/`: pass, console/page/request errors 0, videoRequests 0
  - Custom persistence smoke: refresh from `BATTLE` restores `CHAPTER_MAP`, keeps CH02 state/inventory/stats, clears battleState, and applies `survival-critical`.

## 2026-05-01 Part 1 encounter/deadline/long-route QA closure

- Refactored encounter selection into engine utilities:
  - `apps/part1/src/utils/encounterPatterns.ts`
  - `apps/part1/src/utils/encounterResolver.ts`
- Battle UI now renders survival-tactic choices instead of RPG HP command wording.
  - Each encounter exposes 4 randomized choices.
  - Choices respond to chapter, context, injury, infection, noise, equipment, and consumables.
  - Outcomes use success / partial success / failure / fatal failure with injury, infection, noise, and pressure changes.
- Added deadline consequence presentation.
  - `pendingDeadlineEvent` state added to Part 1 store.
  - `DEADLINE_CONSEQUENCE` screen shows title, radio line, body, and lost opportunity once per expired deadline.
  - CH01~CH05 deadline texts are authored in Korean in `survival.ts`.
- Repaired visible Korean strings in encounter, safehouse, deadline, frame tone, and app boot surfaces.
- Added long-route QA command:
  - `npm run qa:part1:long -- http://127.0.0.1:5171/`
  - Outputs per-route JSON and screenshots under `output/part1-long-route`.
- Validation:
  - `npm run private:check`: pass
  - `npm run private:export`: pass
  - `npx tsc -p apps\part1\tsconfig.json --noEmit`: pass
  - `npm run build:part1`: pass
  - `npm run qa:part1 -- http://127.0.0.1:5171/`: pass, console/page/request errors 0, videoRequests 0
  - `npm run qa:part1:representative -- http://127.0.0.1:5171/`: pass, brokenTextCases 0, missingChoiceCases 0
  - `npm run qa:part1:long -- http://127.0.0.1:5171/`: pass, safe/balanced/risky all reach CH05 result, softLocks 0, console/page/request errors 0