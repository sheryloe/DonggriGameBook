# Dokdo Arc Webgame Pack for Codex

이 패키지는 **Chapter 1~5 웹게임 구현용**으로 정리한 데이터 팩이다.  
목표는 Codex에서 바로 읽을 수 있게 **스키마 / JSON 데이터 / UI 플로우**를 분리하는 것이다.

## 포함 파일

### 1) JSON Schema
- `schemas/chapter_event.schema.json`
- `schemas/inventory_item.schema.json`
- `schemas/ui_flow.schema.json`

### 2) 데이터
- `data/stats.registry.json`
- `data/npc.registry.json`
- `data/enemy.registry.json`
- `data/inventory.items.json`
- `data/loot_tables.json`
- `data/encounter_tables.json`
- `data/chapters/ch01.json` ~ `ch05.json`

### 3) UI
- `ui/ch01.ui_flow.json` ~ `ch05.ui_flow.json`
- `ui/UI_FLOW_OVERVIEW.md`

## 데이터 설계 원칙

### 이벤트 구조
이벤트는 **노드 기반**이다.
- `nodes[]`는 맵의 공간 단위
- `events[]`는 노드에 들어갔을 때 발생하는 서사/선택/전투 단위
- `choices[]`는 다음 이벤트 또는 종료 상태를 결정
- `effects[]`는 상태 변화 명령

### 조건 DSL 예시
- `flag:ch02_gate_opened`
- `item:itm_boat_fuel_can>=1`
- `trust.npc_jung_noah>=2`
- `route.current=dongjak_fast`

### effect target 규칙
- 아이템: `item:itm_shortwave_amplifier`
- 플래그: `flag:chapter_01_completed`
- 스탯: `hp`, `noise`, `contamination`
- 신뢰/평판: `trust.npc_kim_ara`, `reputation.record_bureau`

## Codex에서 추천하는 사용 순서
1. `schemas/`를 기준으로 타입 또는 validator 생성
2. `data/inventory.items.json`을 로드해 아이템 레지스트리 구성
3. `data/loot_tables.json`, `data/enemy.registry.json`, `data/encounter_tables.json` 연결
4. `data/chapters/ch01.json`부터 챕터 런타임 로딩
5. `ui/*.ui_flow.json`을 참고해 프론트 라우팅과 화면 조합 구현

## 프론트엔드 추천 런타임 모델
- `GameState`
  - stats
  - inventory
  - flags
  - trust
  - reputation
  - currentChapterId
  - currentNodeId
  - currentEventId
- `ContentRegistry`
  - items
  - enemies
  - encounters
  - lootTables
  - chapters
  - uiFlows

## 설계 의도
- CH01은 **튜토리얼 + 첫 보스**
- CH02는 **수몰 지형과 블랙마켓**
- CH03은 **수직 탐색과 계층 갈등**
- CH04는 **물류 시스템과 반복 파밍 허브**
- CH05는 **초반 아크 클라이맥스와 독도 신호 인증**

## 추가로 바로 확장 가능한 것
- 저장/불러오기용 `savegame.schema.json`
- 장비 강화 / 제작식 DB
- 퀘스트 로그 스키마
- 전투 스킬 DB
- 로컬라이제이션 키 테이블

## CH01~CH05 운영 고도화 기준 (2026-04-04)

### 실행 순서 (고정)
1. 리포 정리
2. 정본 모델 정착
3. 배포 판정
4. 운영 자동화

### 정본/실행 분리
- 정본(canon DB): Airtable
- 실행/이슈: Linear
- 게임 런타임: Airtable/Linear 직접 의존 금지

### Canonical ID Spine
- Arc: `ARC-01-05`
- Chapter: `ARC01-CH01` ~ `ARC01-CH05`
- Node: `ARC01-CHxx-ND-*`
- NPC: `NPC-*`
- Foreshadow: `FS-*`

세부 계약은 `docs/ops/canonical-id-spine.md`를 따른다.

### 배포 판정 게이트
- Blogger PoC 4개 기준(딥링크, Git 자동배포, 도메인/SSL, 동적 확장성) 중 1개라도 미달 시 Cloudflare Pages로 확정.
- 기본 운영안: 게임은 Cloudflare Pages, 블로그 필요 시 `blog.<domain>` 분리.

세부 체크리스트는 `docs/ops/deployment-gate-blogger-vs-cloudflare.md`를 따른다.

### CSV Gate Sync (Airtable -> Linear)
- 필수 컬럼: `canonical_id`, `title`, `status`, `owner`, `chapter_ref`, `links_echo`, `source_doc`
- 상태 매핑: `Approved -> Todo`, `In Production -> In Progress`, `Locked -> Done`
- 실패 레코드 존재 시 동기화 차단

실행:

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
npm run ops:csv-gate-sync -- --input scripts/examples/airtable-view-sample.csv
```

### 리포 위생 점검

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
npm run repo:audit-assets
```

운영 상세 문서:
- `docs/ops/canon-airtable-linear-operating-model.md`
- `docs/ops/csv-gate-sync-contract.md`
