# AGENTS.md

## 프로젝트 개요
이 저장소는 한국형 아포칼립스 웹게임 프로토타입이다.
구현 대상은 CH01~CH05이며, 데이터 중심 설계가 핵심이다.

## 작업 우선순위
1. 데이터를 읽을 수 있게 연결
2. 타입 생성 및 store 구성
3. 이벤트 러너 구현
4. UI 플로우 연결
5. 이미지 자산 연결
6. 최소 플레이 루프 검증

## 폴더 의미
- `codex_webgame_pack/schemas`: JSON 구조 정의
- `codex_webgame_pack/data`: 챕터, 아이템, 적, 루팅 데이터
- `codex_webgame_pack/ui`: 화면 흐름 정의
- `codex_webgame_pack/img`: UI/배경/노드/적/NPC 이미지 자산
- `apocalypse_arc_01_05`: 시놉시스, NPC 바이블, 감염체 바이블, 챕터 해설

## Subagents 분담
### 1. architect
역할:
- 폴더 구조 설계
- 타입 구조 정의
- 데이터 로더/상태 흐름 결정

산출물:
- `src/types/*`
- `src/loaders/*`
- `src/engine/contracts.ts`

### 2. state-engineer
역할:
- Zustand 또는 Redux 상태 구조 설계
- 세이브 슬롯, chapter progress, flags, inventory, stats 관리

산출물:
- `src/store/gameStore.ts`
- `src/store/selectors.ts`

### 3. event-runner
역할:
- 이벤트 실행기 구현
- 조건 검사, 선택지 처리, 배틀 트리거, 보상 처리

산출물:
- `src/engine/eventRunner.ts`
- `src/engine/requirements.ts`
- `src/engine/rewards.ts`

### 4. ui-integrator
역할:
- `ui/*.json`에 맞는 라우팅/스크린 구성
- 브리핑/맵/이벤트/전투/결과 화면 연결

산출물:
- `src/screens/*`
- `src/components/*`

### 5. content-integrator
역할:
- `apocalypse_arc_01_05/*.md`를 참고해 누락된 설명/텍스트를 게임 데이터와 정합성 맞춤
- JSON과 md 간 명칭 충돌 정리

산출물:
- 데이터 보정 메모
- placeholder 텍스트 매핑

## 구현 원칙
- 하드코딩 최소화
- 데이터 → 상태 → UI 순서로 연결
- CH01~CH05 우선
- 더미 이미지도 허용하되, 경로 구조는 유지
- 실제 전투보다 이벤트/루팅/분기 우선

## 금지 사항
- 기존 JSON ID 임의 변경 금지
- 기존 chapter 순서 변경 금지
- 외부 API 의존 금지
- 시작부터 서버/DB 붙이지 말 것

## 검증
- 앱 실행
- CH01부터 CH05까지 최소 1회 완주
- 인벤토리/flags/stats 변화 확인
- 이미지 누락 시 fallback 처리 확인
