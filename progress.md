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
