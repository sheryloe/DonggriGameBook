# DonggrolGameBook Story Bible Pack

## 목적

- `CH01~CH20` 전체를 하나의 연속 서사로 묶는 `작가용 바이블 + 제작 명세` 세트다.
- 이 문서는 `원고 작성`, `chapter JSON`, `ui_flow`, `registry`, `art_key` 설계를 바로 내릴 수 있도록 만든다.
- 플레이어용 본문은 `3개 엔딩 선택지`를 모두 열어 두고, 정사는 별도 문서에서만 다룬다.

## 사용 순서

1. `ARC_MASTER_01_20.md`로 전체 미스터리, 상태 모델, 엔딩 구조를 먼저 고정한다.
2. `PART_BIBLE_P1.md`~`PART_BIBLE_P4.md`로 파트별 허브, 세력, 챕터 역할, 밀어내기 장면을 확인한다.
3. `CHARACTER_NETWORK_01_20.md`, `HUB_AND_SETTLEMENT_BIBLE.md`, `INFECTED_BIBLE_01_20.md`로 인물/거점/감염체 재등장 규칙을 맞춘다.
4. `CHAPTER_IMPLEMENTATION_CONTRACT.md`, `REGISTRY_APPENDIX_01_20.md`, `ASSET_CONTRACT_01_20.md`로 런타임 변환 규칙을 잠근다.
5. `chapters/CHAPTER_BLUEPRINT_CH01.md`~`chapters/CHAPTER_BLUEPRINT_CH20.md`를 채워 `chapter_event`, `ui_flow`, `chapters.index.json`, `npc/enemy registry`, `art_queue`로 변환한다.
6. 정사 연속성이 필요할 때만 `CANON_APPENDIX_01_20.md`를 참고한다.

## 파일 목록

- `ARC_MASTER_01_20.md`
- `PART_BIBLE_P1.md`
- `PART_BIBLE_P2.md`
- `PART_BIBLE_P3.md`
- `PART_BIBLE_P4.md`
- `CHARACTER_NETWORK_01_20.md`
- `HUB_AND_SETTLEMENT_BIBLE.md`
- `INFECTED_BIBLE_01_20.md`
- `PROMPT_PACK_IMAGE_VIDEO.md`
- `CHAPTER_IMPLEMENTATION_CONTRACT.md`
- `REGISTRY_APPENDIX_01_20.md`
- `ASSET_CONTRACT_01_20.md`
- `CANON_APPENDIX_01_20.md`
- `chapters/CHAPTER_BLUEPRINT_CH01.md` ~ `chapters/CHAPTER_BLUEPRINT_CH20.md`

## 변환 원칙

- 챕터 문서의 `메인 진행 5비트`는 `main event 5개 이상`으로 분할한다.
- 챕터 문서의 `사이드퀘스트 2개`는 `quest_track 2개`로 고정 변환한다.
- `플레이어 목표`는 `objective 5~8개`의 상위 목적이며, 세부 규칙은 `CHAPTER_IMPLEMENTATION_CONTRACT.md`를 따른다.
- `등장 NPC / 적대 세력`은 `REGISTRY_APPENDIX_01_20.md`의 `npc_id`, `enemy_id`로 내려간다.
- `이미지 프롬프트 3개`, `영상 프롬프트 1개`는 `ASSET_CONTRACT_01_20.md`의 `art_key` 및 파일명 규칙을 따른다.
- 엔딩은 본문에서 `선별 유지`, `선별 파괴`, `기록 공개 후 제한적 재설계` 3개를 모두 살아 있게 두고, 공식 정사는 `CANON_APPENDIX_01_20.md`에서만 선언한다.

## 문서 작성 규칙

- 모든 `PART_BIBLE`은 같은 목차를 사용한다.
  - `파트 개요`
  - `허브`
  - `핵심 세력`
  - `허브 대표 NPC`
  - `챕터 흐름`
  - `관계 변화`
  - `클라이맥스`
  - `후속 파트로의 밀어내기`
- 모든 `CHAPTER_BLUEPRINT`는 같은 헤더와 같은 12개 필드를 사용한다.
- 모든 허브/거점 표는 `asset_tier`를 포함해 제작 범위를 바로 통제할 수 있어야 한다.

## 빠른 체크리스트

- 본문만 읽어도 `entry_node_id`, `exit_node_ids`, `quest_tracks`, `art_key`, `ui scene`을 결정할 수 있는가
- `CH07~CH09`가 문서/연료가 아니라 `사람 또는 명단 구출` 중심으로 움직이는가
- `CH16` 첫 비트가 안보경의 빈자리와 역할 승계를 다루는가
- `CH18`과 `CH19`가 서로 다른 체험 약속을 주는가
- `남수련`, `류세온`, `백도형`, `도재윤`, `유민하`, `심규석`의 마지막 기능 장면과 최종 상태가 명시돼 있는가
