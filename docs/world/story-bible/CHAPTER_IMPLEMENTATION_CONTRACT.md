# CHAPTER_IMPLEMENTATION_CONTRACT

## 목적

- 챕터 문서를 `node`, `event`, `objective`, `quest_track`, `ui_flow`로 바로 분해하기 위한 고정 계약이다.
- 이 문서에 없는 어휘나 ID 패턴은 새로 만들지 않는다.

## 최소 분해 규칙

- `core node`: 3개 고정
- `optional side node`: 0~2개
- `exit node`: 1개 이상
- `main event`: 5개 이상
- `side quest_track`: 2개 고정
- `objective`: 5~8개

## 챕터 문서에서 런타임으로 내리는 순서

1. `플레이어 목표`를 `main objective`로 잡는다.
2. `메인 진행 5비트`를 `main event 5개 이상`으로 분할한다.
3. `핵심 장소 3개`를 기준으로 `core node 3개`를 만든다.
4. `사이드퀘스트 2개`를 `quest_track 2개`로 만든다.
5. `챕터 말미 반전`을 `exit node`의 상태 변경과 후속 챕터 플래그로 연결한다.
6. `이미지 프롬프트 3개 / 영상 프롬프트 1개`를 `art_key`와 `asset_queue`로 내린다.

## 블루프린트 필드 매핑

| 블루프린트 필드 | 런타임 산출물 |
|---|---|
| 제목 | `chapter.title`, `ui.header_title` |
| 챕터 한 줄 로그라인 | `chapter.logline`, `chapters.index.summary` |
| 플레이어 목표 | `objective_group.main` |
| 오프닝 훅 | `event.intro`, `ui_scene=briefing` |
| 핵심 장소 3개 | `node.catalog` |
| 등장 NPC / 적대 세력 | `npc_refs`, `enemy_refs`, `dialogue_speakers` |
| 메인 진행 5비트 | `event.main[]`, `objective[]` |
| 사이드퀘스트 2개 | `quest_track.side_a`, `quest_track.side_b` |
| 감염체 위협 / 보스 개체 | `enemy.encounter`, `combat.trigger` |
| 챕터 말미 반전 | `flags`, `route unlock`, `chapter.result` |
| 다음 챕터 연결 문장 | `next_chapter_hint`, `briefing_seed` |
| 이미지 / 영상 프롬프트 | `art_key[]`, `asset_queue[]` |

## UI scene 계약

| scene | 용도 | 필수 값 |
|---|---|---|
| `briefing` | 허브 브리핑, 챕터 시작 | `title`, `summary`, `speaker`, `art_key` |
| `map` | 노드 이동 | `entry_node_id`, `node_ids`, `route_state` |
| `exploration` | 텍스트 탐색, 선택지 | `node_id`, `event_id`, `choices[]` |
| `combat` | 전투/추격/생존 압박 | `enemy_id`, `arena_art_key`, `stakes` |
| `result` | 챕터 종료, 획득/손실 | `flags`, `trust_delta`, `next_hint` |

## ID 네임스페이스

| 종류 | 규칙 | 예시 |
|---|---|---|
| `chapter_id` | `CH##` | `CH07` |
| `node_id` | `CH##-N##` | `CH07-N01` |
| `event_id` | `EV_CH##_NAME` | `EV_CH07_RED_CORRIDOR_ENTRY` |
| `objective_id` | `obj_ch##_type_##` | `obj_ch07_main_01` |
| `quest_track_id` | `qt_ch##_name` | `qt_ch07_side_signalflare` |
| `flag` | `flag:scope_name` | `flag:ch08_betrayer_revealed` |
| `route` | `route:scope_name` | `route:ch10_east_sea_access` |
| `art_key` | `type_subject_variant` | `bg_ch09_smoke_tankyard` |

## requirements 어휘집

- `flag:...`
- `item:...`
- `route:...`
- `trust.npc_<id> >= N`
- `auth.identity_auth`
- `auth.health_clear`
- `auth.route_code`
- `auth.capacity_slot`

## effects 어휘집

- `set_flag`
- `clear_flag`
- `grant_item`
- `remove_item`
- `add_trust`
- `sub_trust`
- `unlock_route`
- `set_auth_state`
- `set_ending_state`
- `grant_reward_pack`

## 인증 / 선별 상태 모델

| 상태값 | 의미 | 우회 가능 여부 |
|---|---|---|
| `identity_auth` | 신원 확인 상태 | 위조 패스로 우회 가능 |
| `health_clear` | 검역/건강 통과 상태 | 위조 불가 |
| `route_code` | 이동권, 항로, 통행 코드 | 위조 불가 |
| `capacity_slot` | 현재 수용량과 승선 가능 슬롯 | 위조 불가 |

- 위조 패스는 `identity_auth`만 속인다.
- `health_clear`, `route_code`, `capacity_slot`은 각각 별도 시스템으로 판정한다.
- `CH20`의 핵심 개조 대상은 `capacity_slot`의 사전 선별 로직이다.

## 루프 밀도 규칙

- 각 챕터는 `허브 진입 -> 현장 압박 -> 회수 또는 판단 -> 보스 또는 대형 위협 -> 반전` 흐름을 유지한다.
- `메인 진행 5비트` 중 최소 2개는 `인간 갈등`이어야 한다.
- `사이드퀘스트 2개` 중 1개는 `인물형`, 1개는 `세계관형`으로 고정한다.
- `exit node`에는 반드시 다음 중 2개 이상이 있어야 한다.
  - `flag 변화`
  - `trust 변화`
  - `route 변화`
  - `auth 상태 변화`
  - `next chapter hint`
