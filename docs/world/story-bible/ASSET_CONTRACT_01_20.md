# ASSET_CONTRACT_01_20

## 목적

- 챕터당 최소 제작 자산 수, `art_key`, 파일명, 화면비를 고정한다.
- 장소 수를 줄이지 않고도 `asset_tier`만으로 제작 범위를 통제할 수 있게 한다.

## 챕터당 최소 산출물

| 타입 | 최소 수량 | 용도 |
|---|---|---|
| `background` | 1 | 챕터 대표 배경 또는 메인 노드 |
| `portrait` | 1 | 챕터 대표 NPC 또는 갈등 중심 인물 |
| `threat` | 1 | 시그니처 감염체 또는 보스 |
| `poster` | 1 | 챕터 홍보 포스터 |
| `teaser` | 1 | 챕터 티저 영상 키비주얼 |

## art_key 규칙

| 타입 | 규칙 | 예시 |
|---|---|---|
| 배경 | `bg_ch##_subject` | `bg_ch09_smoke_tankyard` |
| 인물 초상 | `portrait_npc_name` | `portrait_npc_do_jaeyoon` |
| 위협 | `threat_enemy_name` | `threat_gate_mauler` |
| 챕터 포스터 | `poster_ch##_subject` | `poster_ch07_red_corridor` |
| 티저 | `teaser_ch##_subject` | `teaser_ch20_dokdo_gate` |

## 파일명 규칙

- 배경: `bg_ch##_subject_v01.webp`
- 인물: `portrait_npc_name_v01.webp`
- 위협: `threat_enemy_name_v01.webp`
- 포스터: `poster_ch##_subject_v01.webp`
- 티저 키비주얼: `teaser_ch##_subject_v01.webp`
- 영상 출력: `teaser_ch##_subject_v01.mp4`

## 화면비

| 타입 | 기본 화면비 |
|---|---|
| `background` | `16:10` |
| `portrait` | `4:5` |
| `threat` | `4:5` 또는 `1:1` |
| `poster` | `4:5` |
| `teaser` | `16:9` |

## asset_tier 정의

| tier | 의미 | 권장 자산 밀도 |
|---|---|---|
| `hub` | 반복 방문, UI 재사용 핵심 장소 | 배경 2종 이상, 보조 오브젝트 추가 허용 |
| `major_setpiece` | 챕터 중심 전투/이벤트 장소 | 배경 1종 + 위협 1종 필수 |
| `micro_location` | 짧게 스치는 노드, 설명 중심 장소 | 대표 배경 1종 공유 허용 |

## 폴더 권장 구조

```text
codex_webgame_pack/
  img/
    bg/
    portrait/
    threat/
    poster/
    teaser/
```

## 제작 메모

- 챕터 문서의 `핵심 장소 3개` 중 최소 1개는 반드시 독립 `background`를 가진다.
- `asset_tier=micro_location`은 다른 노드와 배경 공유가 가능하다.
- 챕터 포스터는 장소보다 `갈등과 선택`을 먼저 보여 준다.
- 티저는 보스보다 `상황`, `인물 표정`, `위험 신호`를 우선한다.
