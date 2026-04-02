# CODEX_SUBAGENTS_EXEC_SPEC.md

## 1. 목적
`codex_webgame_pack`와 `apocalypse_arc_01_05` 및 기존 `MASTER_PACK_01_05.md`, `CODEX_IMPLEMENTATION_SPEC.md`를 모두 참고해, CH01~CH05용 웹게임 프로토타입을 구현한다.

---

## 2. 입력 자산 연결 방식

### A. 문서 계층
- `MASTER_PACK_01_05.md`: 전체 구조와 챕터 아크 요약
- `CHAPTER_01~05_*.md`: 각 챕터의 세부 노드/연출/서사 참고
- `NPC_BIBLE_01_05.md`: 인물 설명
- `INFECTED_BIBLE_01_05.md`: 적 컨셉 및 분류
- `README_ARC_01_05.md`: 전체 설정 요약

### B. 런타임 데이터 계층
- `schemas/*.json`: 구조 검증 기준
- `data/*.json`: 실제 로딩 데이터
- `ui/*.json`: 화면 흐름
- `img/*`: 배경/노드/NPC/적 이미지 자산
- `package_manifest.json`: 전체 묶음 진입점

### C. 추천 로딩 순서
1. `package_manifest.json`
2. `schemas/*`
3. `data/chapters.index.json`
4. 각 chapter json
5. `inventory.items.json`
6. `enemy.registry.json`
7. `loot_tables.json`
8. `ui/*.ui_flow.json`
9. `img/*`

---

## 3. 최소 폴더 구조

```text
src/
  types/
    game.ts
  loaders/
    contentLoader.ts
    assetResolver.ts
  store/
    gameStore.ts
  engine/
    eventRunner.ts
    requirements.ts
    battleResolver.ts
    rewardResolver.ts
  components/
    InventoryPanel.tsx
    ChoiceList.tsx
    StatBar.tsx
    NodeMap.tsx
  screens/
    BriefingScreen.tsx
    ChapterMapScreen.tsx
    EventScreen.tsx
    BattleScreen.tsx
    ResultScreen.tsx
  assets/
    manifest.ts
  data/
    runtime/ (선택)
```

---

## 4. 최소 구현 명세

### TypeScript 타입
필수 타입:
- Chapter
- MapNode
n- EventDefinition
- EventChoice
- InventoryItem
- EnemyDefinition
- UIFlow
- GameState

### 상태 구조
필수 상태:
- currentChapterId
- currentNodeId
- currentEventId
- inventory
- stats
- flags
- chapterProgress
- battleState
- uiScreen
- visitedNodes
- saveSlots

상태 관리:
- Zustand 우선
- Redux는 필요 시 대체 가능

### 이벤트 러너
필수 함수:
- `loadChapter(chapterId)`
- `enterNode(nodeId)`
- `triggerEvent(eventId)`
- `canSelectChoice(choice)`
- `applyChoice(choice)`
- `grantLoot(lootTableId)`
- `startBattle(enemyGroupId)`
- `finishBattle(result)`
- `completeChapter()`

### UI
최소 화면:
- 브리핑
- 맵
- 이벤트
- 전투
- 결과
- 인벤토리 오버레이

### 이미지 연결
- `img/` 아래 파일을 직접 import 하거나 manifest로 매핑
- 데이터에 image key가 있으면 우선 사용
- 없으면 chapter default image 사용
- 없으면 fallback placeholder 사용

---

## 5. Codex Subagents 실행 지시

### Subagent 호출 전략
1. `architect`가 전체 구조 생성
2. `state-engineer`가 store 작성
3. `event-runner`가 엔진 작성
4. `ui-integrator`가 화면 연결
5. `content-integrator`가 데이터/문서 정합성 점검
6. 마지막으로 메인 agent가 전체 통합 및 실행 검증

### Codex에게 줄 지시문
```text
프로젝트 루트의 CODEX_IMPLEMENTATION_SPEC.md, CODEX_TASK.md, AGENTS.md, CODEX_SUBAGENTS_EXEC_SPEC.md를 먼저 읽어.
그 다음 codex_webgame_pack/package_manifest.json을 시작점으로 schemas, data, ui, img를 연결해.
apocalypse_arc_01_05와 MASTER_PACK_01_05.md를 참고해서 CH01~CH05 React + TypeScript 프로토타입을 구현해.

반드시 subagents를 사용해 역할을 분담해:
- architect: 타입, 폴더 구조, 로더
- state-engineer: Zustand store
- event-runner: 이벤트 실행기
- ui-integrator: 화면 구성
- content-integrator: md와 json 정합성 검토

완료 후에는 npm run dev 기준으로 실행 가능한 상태까지 맞추고,
누락 이미지와 누락 데이터는 fallback 처리해.
```

---

## 6. Codex CLI 실행 예시

### 기본
```bash
codex -m gpt-5.4
```

### 빠른 반복
```bash
codex -m gpt-5.4-mini
```

### 시작 프롬프트
```text
AGENTS.md와 CODEX_TASK.md를 읽고 작업을 시작해. CODEX_SUBAGENTS_EXEC_SPEC.md의 subagents 계획을 따르고, CH01~CH05 프로토타입 구현에 필요한 파일을 생성/수정해.
```

### AGENTS 초안 자동 생성이 필요하면
```text
/init
```
그 뒤 현재 문서 내용으로 덮어쓴다.

---

## 7. 작업 순서
1. 문서 읽기
2. manifest 확인
3. 타입 생성
4. 로더 생성
5. store 생성
6. event runner 생성
7. ui flow 연결
8. img fallback 연결
9. CH01~CH05 스모크 테스트
10. 누락 데이터 보정

---

## 8. 최소 성공 조건
- 앱이 뜬다
- CH01 시작 가능
- 노드 이동 가능
- 이벤트 선택 가능
- 인벤토리 반영됨
- 전투 진입/종료 가능
- CH05 종료까지 진행 가능

