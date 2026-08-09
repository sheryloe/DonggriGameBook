# P1–P4 구조 점검과 재정립 계획

측정 도구: `scripts/audit-story-structure.mjs` · 원자료: `docs/ops/STORY_STRUCTURE_AUDIT.json`
대상: 20개 챕터 전체 (623 이벤트, 995 선택지, 232k자)

---

## 판정

**4파트 × 5챕터 골격은 유지한다.** 문제는 골격이 아니라 그 안을 채운 방식이다.

P1은 손으로 쓴 게임이고, P2–P4는 P1의 형태를 복제해 이름만 바꾼 껍데기다. 이 진단은 인상이 아니라 측정값이다.

---

## 1. 측정 결과

| 파트 | 이벤트 | 선택지 | 분량 | 퀘스트 | 주장 플레이타임 | 결정 밀도 |
|---|---:|---:|---:|---:|---:|---:|
| P1 | **355** | 473 | 102k자 | 27 | 100분 | 1.03/분 |
| P2 | 88 | 177 | 44k자 | 23 | 100분 | 0.50/분 |
| P3 | 88 | 161 | 42k자 | 25 | 100분 | 0.48/분 |
| P4 | 92 | 184 | 44k자 | 23 | 110분 | 0.48/분 |

P2–P4는 P1의 **4분의 1** 분량으로 **같은 100분**을 주장한다. 둘 중 하나는 거짓이다.

결정 밀도(선택지 2개 이상인 이벤트 / 분)는 CH01 1.72에서 CH04 0.57로 떨어진 뒤, CH06부터 CH19까지 **0.41~0.55 사이에 고정**된다. 게임이 평평해지고 그대로 끝난다.

---

## 2. 구조 결함 5가지

### 2-1. P2–P4는 템플릿 복제다

- **CH07·CH08·CH09의 골격이 완전히 동일하다.** CH12·CH13·CH14도 동일하다. 이벤트 ID에서 챕터 번호만 지우면 문자열이 일치한다.
- 이벤트 이름이 5챕터씩 반복된다.
  `ENTRY → ROUTE → ROUTE_OFFICIAL → ROUTE_BROKER` (CH06–10)
  `ENTRY → ROUTE → ROUTE_AUDIT → ROUTE_EVIDENCE` (CH11–15)
  `ENTRY → ROUTE → ROUTE_ORDER → ROUTE_WITNESS` (CH16–19)
- **노드 ID가 지명을 잃었다.** P1은 `YD`(여의도) `NR`(노량진) `JS`(잠실) `MJ`(문정) `PG`(판교)인데, P2–P4는 전부 `CHxx_N01`~`N05`다. 장소가 이름을 갖지 못하면 플레이어의 기억에 남지 않는다.
- 메인 퀘스트 제목이 11개 챕터에서 `…를 붙든다` 한 문형이다.

### 2-2. NPC 배치가 존재하지 않는다

**P2–P4는 NPC가 챕터의 모든 이벤트에 일괄로 붙어 있다.** CH06은 이벤트 20개에 3명이 각 20회, CH07은 17개에 2명이 각 17회. 아무도 등장하거나 퇴장하지 않는다.

P1은 다르다. CH01은 이벤트 99개 중 윤해인 7회, 정노아 2회 — 장면마다 누가 있는지가 정해져 있다.

부수 문제:
- **오태식·한예지는 레지스트리에 등록되어 있으나 20챕터 어디에도 등장하지 않는다.** (이미 초상 프롬프트 명세까지 작성된 상태다. 존재하지 않는 인물의 이미지를 만들 뻔했다.)
- 윤해인은 P1에 나오고 **10개 챕터를 비운 뒤** P4에 돌아온다.
- 남수련은 전체 최다 등장(92회)이지만 P3부터 존재한다. 가장 오래 함께하는 인물이 게임 절반 동안 없다.
- 도재윤·유민하·장태훈·심규석·배수현·이소란·남재욱·오경태·문라희는 각각 1개 챕터에만 나오고 사라진다.

### 2-3. 퀘스트가 이름만 다르다

- 같은 챕터 안에 **제목이 똑같은 사이드 퀘스트가 중복**된다: CH12 `호출부호 복원`×2, CH13 `보관 슬롯 재배치`×2, CH15 `잔류 인수`×2, CH17 `부식 기록 공개`×2, CH20 `최종 카메라 라인`×2.
- 목표 16개가 **어느 퀘스트에도 연결되지 않은 채** 떠 있다.
- 조사(을/를)가 틀렸다: `하강 관문를`, `적색 회랑를`, `침하 항만를`, `백색 기록를`, `봉인 중계선를`, `균열 항만를`, `파편 수문를`, `해무 변전소을`, `연기 저장고을`.
  P1용으로 만든 `scripts/lib/korean-josa.mjs`가 P2–P4에 적용된 적이 없다.

### 2-4. 파트 간 연속성이 끊겨 있다 ← 몰입도의 진짜 원인

각 파트가 **자기만의 축을 새로 발명하고, 다음 파트가 그걸 버린다.**

| 파트 | 누적 축 |
|---|---|
| P1 | `route.truth` `route.compassion` `route.control` `route.underworld` `route.strain` |
| P2 | `official_lane` `broker_lane` `witness_chain` `capacity_ethics` … (9개) |
| P3 | `p3.route_access` `p3.public_evidence` `p3.medical_reserve` … (5개) |
| P4 | `order_score` `witness_score` `solidarity_score` … (6개) |

이름이 겹치는 축이 **하나도 없다.** 플레이어가 CH01–CH05에서 쌓은 모든 선택은 CH06에서 사망한다. 그리고 **CH20은 `carryover_keys`가 아예 비어 있다** — 마지막 챕터가 앞선 19챕터에서 무엇을 물려받는지 선언하지 않는다.

이것이 "몰입도"의 핵심이다. 선택이 기억되지 않는 게임에서 플레이어는 선택을 진지하게 하지 않는다.

### 2-5. 엔딩이 조합이 아니라 스위치다

CH05·CH10·CH15·CH20에만 엔딩이 5개씩 있다. 그런데 판정 방식이 정반대다.

**P1 (제대로 됨)** — 축 3개와 부담 수치가 실제로 조합된다.
```
P1_END_SIGNAL_KEEPERS:
  route.truth=truth, route.compassion=rescue, route.control=lock,
  flag:ch05_kim_ara_alive, route.strain<=6
```

**P4 (스위치)** — `flag:ch20_ending_a`가 이미 답을 정한다. 나머지 점수 조건은 장식이다.
```
P4_END_ORDERED_SELECTION:
  flag:p4.execution_lock_order, order_score>=3,
  capacity_pressure>=2, flag:ch20_ending_a   ← 이 한 줄이 단독 결정
```

---

## 3. 엔딩 재설계 — 5개 엔딩, 27개 조합

요구사항은 **엔딩 5개 / 조합 20개 이상**이다. 엔딩 제목은 이미 있는 CH20의 5개를 그대로 쓴다. 바꾸는 건 도달 방식이다.

### 영속 축 3개 + 부담 1개

CH01부터 CH20까지 **한 번도 교체되지 않고 누적되는** 축으로 통일한다. 파트별 축은 이 3개로 사상(mapping)한다.

| 축 | 뜻 | 오르는 선택 | P1 대응 | P2 대응 | P3 대응 | P4 대응 |
|---|---|---|---|---|---|---|
| `axis.record` | 기록·공개 | 증거를 남기고 공표한다 | `route.truth` | `witness_chain` | `p3.public_evidence` | `witness_score` |
| `axis.rescue` | 사람·연대 | 명단보다 사람을 먼저 뺀다 | `route.compassion` | `capacity_ethics` | `p3.medical_reserve` | `solidarity_score` |
| `axis.order` | 질서·제도 | 정격과 순번을 지킨다 | `route.control` | `official_lane` | `p3.route_access` | `order_score` |
| `axis.strain` | 누적 대가 | (모든 무리한 선택이 올린다) | `route.strain` | `pursuit_meter` | `p3.sacrifice_load` | `capacity_pressure` |

기존 파트별 키는 **삭제하지 않고 별칭으로 남긴다.** 챕터 데이터를 다시 쓰지 않아도 되고, 기존 게이트 조건이 그대로 동작한다.

### 조합 수

세 축을 각각 3구간(약함 0 / 보통 1 / 강함 2)으로 끊으면 **3³ = 27가지 상태**다. 요구 조건 20개를 넘는다.

### 엔딩 판정

```
우세축 = record / rescue / order 중 최대값

  record 단독 우세          → 목격된 재설계
  rescue 단독 우세          → 무너진 게이트
  order  단독 우세          → 질서의 선별
  셋 다 강함(2,2,2)         → 마지막 수신자      ← 가장 어려운 엔딩
  우세축 없음 또는 strain 최대 → 부재자 보관실
```

27개 상태가 5개 엔딩으로 수렴하되, **에필로그는 나머지 두 축과 strain 구간, 생존 NPC로 갈린다.** 같은 엔딩이라도 도달 경로에 따라 마지막 문장이 달라진다.

### 파트 종료를 관문으로

CH05·CH10·CH15의 엔딩은 지금처럼 파트를 끝내되, **다음 파트의 축 시작값을 정하는 씨앗**이 된다. P1에서 기록을 택한 플레이어는 CH06을 `axis.record`가 이미 올라간 상태로 시작한다. 이것이 2-4의 단절을 메우는 최소 변경이다.

---

## 4. 이미지 계획

### 4-1. 지금 실사로 나오는 이유

사고가 아니다. **명세대로 나온 결과다.** `private/story/world/story-bible/PROMPT_PACK_IMAGE_VIDEO.md`가 그렇게 쓰여 있다.

```
- 미감은 `한국 도시 재난물 리얼리즘 + 시네마틱 압축`이다.
- 공통 키워드: documentary disaster realism
- 캐릭터 템플릿: realistic proportions, documentary lighting
```

`documentary`(다큐멘터리)는 "실제 사건을 기록한 것처럼"이라는 뜻이다. 모든 캐릭터 프롬프트에 이 단어가 들어 있으니 게임이 아니라 재난 보도 사진이 나온다.

### 4-2. 새 아트 디렉션

목표는 **게임 키아트**다. 사실적이되 실사가 아니라, 손이 닿은 그림으로 읽혀야 한다.

| | 지금 | 바꿀 방향 |
|---|---|---|
| 매체 | `documentary photography` | `painted key art`, `digital painting` |
| 질감 | 모공·피부 결까지 | 붓 자국이 남는 면 처리 |
| 조명 | `soft even frontal, neutral` | 강한 방향광 + 림라이트, 실루엣이 서는 조명 |
| 색 | `muted desaturated` | 제한 팔레트 + 한 가지 강조색 |
| 대비 | 평평함 | 어두운 면을 뭉개고 밝은 면을 살림 |
| 인물 | 사진 같은 비례 | 사실 비례 유지하되 특징 과장 (실루엣 식별) |

교체할 키워드:

```
빼기:  documentary disaster realism, documentary lighting,
       realistic proportions, photorealistic, candid, editorial

넣기:  painted character key art, digital painting, visible brushwork,
       stylised realism, strong directional key light, rim light,
       limited palette with one accent, high contrast, readable silhouette,
       game splash art
```

`no anime proportions`, `no recognizable brands`, `no tactical cosplay`는 유지한다.

**작은 화면에서 읽혀야 한다.** Toss 미니앱이므로 인물은 실루엣만으로 구분되어야 하고, 얼굴 디테일보다 **의상·장비의 형태**가 인물을 설명해야 한다.

### 4-3. 생성 순서 — 스토리 확정 후

**지금 이미지를 만들면 버리게 된다.** 근거:

- 오태식·한예지는 등장 0회다. 초상을 만들어도 쓸 곳이 없다.
- 1개 챕터용 NPC 9명은 통합·삭제 대상이다. 누가 남는지 정해지기 전에는 대상이 확정되지 않는다.
- P2–P4의 노드는 `CHxx_N01`이라 **장소에 이름이 없다.** 배경 이미지를 무엇으로 그릴지 정의되지 않은 상태다.

따라서 순서는 이렇다.

1. NPC 명단 확정 (통합·삭제·재배치)
2. P2–P4 노드에 지명 부여
3. 확정된 인물·장소로 프롬프트 팩 재작성
4. 생성

### 4-4. 생성 파이프라인 (검증 완료)

이번에 검증했다. Gemini 수작업보다 낫다.

```
codex exec -m gpt-5.6-terra (effort high)
  → #00ff00 크로마키 배경으로 생성
  → scripts/make-bust-cutout.ps1 (누끼 + 디스필 + 다운스케일)
  → 게임 배경 위 합성
```

- 워터마크가 없다 (Gemini는 있어서 제거 로직이 필요했다)
- 크로마키가 완전히 평탄하다 (`R1 G250 B5`로 샘플됨)
- 명세를 정확히 따른다
- 사람 손을 거치지 않는다

검증본: 안보경 흉상 — 1024×1536 생성 → 720×1080 누끼, 배경 48.1% 제거, 녹색 번짐 4,359px 보정, 네 모서리 알파 0.

**남은 톤 문제:** 배경은 게임이 `rgba(5,7,8,0.7→0.95)`로 눌러 놓는데 인물만 그대로라 혼자 쨍하다. CSS `filter: brightness(0.74) saturate(0.82)` + 하단 페이드로 맞춘다. 4-2의 스타일 전환이 적용되면 이 격차는 상당 부분 자연스럽게 줄어든다.

---

## 5. 작업 순서

| # | 작업 | 근거 |
|---|---|---|
| 1 | 영속 축 4개 도입, 파트별 키를 별칭으로 연결 | 2-4 |
| 2 | CH20 `carryover_keys` 채우기, 엔딩 판정을 조합식으로 교체 | 2-5, 3장 |
| 3 | NPC 명단 확정 — 오태식·한예지 배치 또는 삭제, 1챕터 NPC 통합 | 2-2 |
| 4 | P2–P4 NPC를 장면 단위로 재배치 (일괄 태그 해제) | 2-2 |
| 5 | 중복 사이드 퀘스트 제거, 미연결 목표 16개 정리, 조사 수리 | 2-3 |
| 6 | P2–P4 노드에 지명 부여, 복제 챕터(CH07–09, CH12–14) 차별화 | 2-1 |
| 7 | 프롬프트 팩 재작성 | 4-2 |
| 8 | 이미지 생성 | 4-3 |

1–2는 서로 붙어 있고 나머지 전부의 전제다. 8은 3·6이 끝나야 시작할 수 있다.

---

## 부록: 재현

```bash
node scripts/audit-story-structure.mjs
```

`docs/ops/STORY_STRUCTURE_AUDIT.json`에 파트별·챕터별 수치, NPC 도달 범위, 구조 결함 목록이 기록된다.
