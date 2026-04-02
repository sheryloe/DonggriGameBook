# CODEX_TASK.md

## 목표
`codex_webgame_pack`와 `apocalypse_arc_01_05`에 들어 있는 문서를 기준으로, CH01~CH05까지 플레이 가능한 **React + TypeScript 웹게임 프로토타입**을 구현한다.

## 반드시 구현할 범위
1. `schemas/`를 기준으로 타입/검증 구조 연결
2. `data/`를 기준으로 챕터/아이템/적/루팅 데이터를 로드
3. `ui/`를 기준으로 챕터별 화면 흐름 연결
4. `img/` 폴더 자산을 UI에서 참조 가능하게 연결
5. 최소 1개 세이브 슬롯 구조 구현
6. 이벤트 러너로 다음 흐름을 작동시킬 것
   - 브리핑
   - 맵 노드 이동
   - 이벤트 발생
   - 선택지 처리
   - 전투/보스 진입
   - 보상/루팅
   - 챕터 결과 정산
7. CH01~CH05를 순차 플레이 가능하게 만들 것

## 입력 문서 우선순위
1. `CODEX_IMPLEMENTATION_SPEC.md`
2. `MASTER_PACK_01_05.md`
3. `apocalypse_arc_01_05/CHAPTER_01~05_*.md`
4. `codex_webgame_pack/package_manifest.json`
5. `codex_webgame_pack/schemas/*.json`
6. `codex_webgame_pack/data/*.json`
7. `codex_webgame_pack/ui/*.json`
8. `codex_webgame_pack/img/*`

## 권장 구현 구조
- `src/types/`
- `src/store/`
- `src/engine/`
- `src/loaders/`
- `src/components/`
- `src/screens/`
- `src/assets/`

## 최소 산출물
- `src/types/game.ts`
- `src/store/gameStore.ts`
- `src/engine/eventRunner.ts`
- `src/loaders/contentLoader.ts`
- `src/screens/ChapterMapScreen.tsx`
- `src/screens/EventScreen.tsx`
- `src/screens/BattleScreen.tsx`
- `src/screens/ResultScreen.tsx`
- `src/App.tsx`

## 구현 규칙
- 데이터 구조를 하드코딩하지 말고 가능하면 `codex_webgame_pack/data`에서 로드
- 스키마와 불일치하는 필드는 런타임 경고를 남길 것
- `img/`는 데이터의 `image`, `thumbnail`, `bg` 필드와 매핑될 수 있게 할 것
- 파일명/ID는 기존 JSON과 동일하게 유지할 것
- 최소 구현에서는 실제 전투 AI보다 **상태 전이와 선택 결과 반영**이 우선이다

## 완료 기준
- `npm run dev`에서 실행 가능
- CH01 시작 → CH05 종료까지 끊김 없이 플레이 가능
- 선택지에 따라 state가 변하고 다음 이벤트/노드에 반영됨
- 인벤토리 아이템 획득/소모가 UI에 반영됨
