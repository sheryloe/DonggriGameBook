# Part 1 방향 재정립 (2026-08-08)

## 한 줄 요약

**Part 1의 코드·콘텐츠 작업은 끝났다. 남은 163점은 전부 사람이 직접 보고 듣고 만져야 얻는 점수다.**

---

## 1. 현재 위치

| 구분 | 값 | 의미 |
|---|---|---|
| 증명된 점수 | **787 / 800** | 자동 검증 가능한 16개 항목 |
| 미증명 보류 | **167 / 200** | 사람 증거 필요 4개 항목 |
| 합계(참고) | 954 / 1000 | 제품 가치 추적용, **출시 준비도 아님** |
| 출시 기준 점수 | **787 / 1000** | 950 미달 |
| 항목 바닥(48+) 통과 | 16 / 20 | |
| **자동화로 올릴 수 있는 미달 항목** | **0건** | 코드로 더 짜낼 게 없다 |
| 사람 증거만 남은 미달 항목 | 4건 | |
| public GO | 불가 | |

`conservative_total` 954는 950을 넘지만 **출시 판정에 쓸 수 없다**. 스코어카드가 직접
`conservative_total_usage: product_value_tracking_not_release_readiness`로 못박고 있다.
출시 판정은 `release_evidence_score` 787이며, 미증명 167점은 사람 증거가 들어와야 확정된다.

## 2. 미달 4개 항목

| ID | 항목 | 현재 | 부족 | 성격 |
|---|---|---|---|---|
| 950-05 | Fairness and trust parity | 40/50 | -8 | 다른 3개가 닫혀야 산출 |
| 950-14 | TTS human listening readiness | 40/50 | -8 | 20라인 사람 청취 |
| 950-17 | Toss/WebView back behavior | 47/50 | -1 | 실기기 360-430px 세션 |
| 950-20 | Release evidence / no-false-GO | 40/50 | -8 | 위 3개의 종합 판정 |

**950-17은 1점 차다.** 실기기 캡처 한 번이면 닫힌다.

## 3. 순서는 고정이다

레인 사이에 의존성이 있어 병렬 진행이 불가능하다.

```
STEP-01  BGM 청취          → APR-032 파생 마스터가 입력
STEP-02  TTS 20라인 청취    → BGM closeout이 valid해야 시작
STEP-03  모바일/Toss 실기기  → TTS closeout이 valid해야 시작
STEP-04  post-manual 98+    → 위 3개 export가 import/apply된 뒤
STEP-05  completion boundary → 전 레인 real-proof 후 최종 판정
```

### STEP-01 BGM (지금 바로 가능)

APR-032가 만든 파생 마스터가 준비돼 있다.

- 파일: `G:\Donggri_DevDrive\storage\codex-control\reports\DonggrolGameBook\2026-08-08\apr032-a3\out.mp3`
  (F 최종본과 바이트 동일, 경로가 짧아 재생이 쉽다)
- 기술 수치: 105.6131초 / -18.007 LUFS / -2.832 dBFS / 320 kbps / 44.1 kHz 스테레오
- 상태: 기술 PASS, **사람 전곡 청취 미완**

```bash
npm run ops:part1:bgm-operator-open-packet && npm run qa:part1:bgm-operator-open-packet
```

이후 `docs/ops/PART1_BGM_CHRONO_LISTENING_CONSOLE.html`에서 청취하고 export를 내려받은 뒤:

```bash
npm run ops:part1:bgm-evidence-closeout -- --confirm-real-listening
```

### STEP-02 TTS 20라인

**선행 조건: 음성 51개가 대본과 어긋나 있다.**

APR-033의 카피 수리로 일부 나레이션이 짧아졌다. 기존 음성 파일은 삭제된 문장을 그대로 읽는다.
정확한 범위를 측정했다:

```bash
npm run qa:part1:tts-script-drift
```

| 항목 | 값 |
|---|---|
| 존재하는 음성 파일 | 144개 |
| **재생성 필요** | **51개** |
| 그대로 사용 가능 | 93개 |
| 챕터별 재생성 | CH01 16 · CH02 11 · CH03 9 · CH05 9 · CH04 6 |
| 원인 | 중복 문장 제거, 나레이션/대사 분리, 내부 식별자(`route.truth`) 제거 |
| 글자수 변화 | 49개 짧아짐 / 2개 길어짐, 중앙값 -59자 |

**디버그 코드와 조사 오류는 음성에 들어간 적이 없다.** 그 손상은 outcome 이벤트에만 있었고,
outcome 이벤트에는 음성이 하나도 없다(144개 중 0개). 재생성 사유는 순수하게 위 세 가지다.

대상 목록: `docs/ops/PART1_TTS_SCRIPT_DRIFT.json`의 `regenerate` 배열.
93개는 **재생성하지 않는다** — 멀쩡한 음성을 다시 만들 이유가 없다.

### STEP-03 모바일/Toss

1점만 모자란 항목이다. 실기기 또는 Toss 유사 환경에서 360-430px 세션 1회, 첫 3분 90+,
audio unlock 통과, 스크린샷/영상 SHA-256 기록.

### STEP-04~05

앞 세 레인이 닫히면 기계적으로 진행된다.

## 4. 이번에 세운 재오염 방지선

Part 1 콘텐츠를 다시 망가뜨릴 수 있는 스크립트가 **26개** 남아 있다(그중 17개는 npm alias 연결).
개별 스크립트를 막는 대신 **출하 경계 한 곳**에 게이트를 세웠다.

```
private/content/data/chapters/*.json
        ↓  (26개 스크립트가 여기에 쓸 수 있다)
npm run private:export   ← ★ Part 1 한국어 린트 게이트
        ↓
public/runtime-content/game-content-pack.json
        ↓
게임
```

`private:export`는 런타임에 도달하는 **유일한 경로**다. 여기서 린트가 실패하면 exit 1과 함께
복구 명령을 출력한다. 음성 테스트로 검증했다: 손상된 문장을 주입하자 `debug-code` 1건 +
`josa` 2건을 잡고 실패했다.

비-Part1 작업에서만 우회할 수 있다:

```bash
npm run private:export -- --skip-part1-korean-lint
```

### 상시 게이트

```bash
npm run qa:part1:content-guard
```

josa 엔진 테스트 → 한국어 린트 → flow 감사 → 전체 루트 완주를 한 번에 돌린다.

## 5. 하지 말아야 할 것

- **레거시 polish/upgrade 스크립트를 다시 돌리지 않는다.** 재오염의 원인이었고, 근본 수정은
  `upgrade-part1-director-98.mjs` 하나에만 적용됐다.
- **`conservative_total` 954를 출시 근거로 쓰지 않는다.** 스코어카드가 명시적으로 금지한다.
- **사람 증거를 추정으로 채우지 않는다.** 4개 레인 전부 `proof_class: manual_required`다.
- **점수·seal·bundle·AIT·release GO를 코드로 올리지 않는다.**

## 6. 다음 한 걸음

**STEP-01 BGM 청취.** 파일도 준비됐고 도구도 준비됐다. 이것 하나가 나머지 4단계의 잠금을 푼다.

병행 가능한 사전 작업이 하나 있다: **TTS 51개 재생성**. BGM 청취와 의존성이 없으므로
STEP-01을 진행하는 동안 미리 처리해 두면 STEP-02가 곧바로 열린다.

## 7. 요약 표

| 레인 | 상태 | 막고 있는 것 | 다음 명령 |
|---|---|---|---|
| 콘텐츠·코드 | **완료** | 없음 | `npm run qa:part1:content-guard` |
| BGM 청취 | 대기 | 사람 | `npm run ops:part1:bgm-operator-open-packet` |
| TTS 재생성 | 대기 | 51개 음성 | `npm run qa:part1:tts-script-drift` |
| TTS 청취 | 차단 | BGM closeout | — |
| 모바일/Toss | 차단 | TTS closeout | — |
| 최종 판정 | 차단 | 위 전부 | — |

---

## 참조

- 스코어카드: `docs/ops/PART1_950_SCORECARD_AUDIT.json` / `.md`
- 한국어 수리 대장: `G:\Donggri_DevDrive\storage\codex-control\reports\DonggrolGameBook\2026-08-08\part1-korean-repair\part1-korean-repair-ledger.json`
- APR-032 파생 마스터 감사: `docs/ops/attempts/p1-lyria-bgm/apr032-lyria-bgm01-a-v02-derived-master-20260808t1114550900/derived-master-audit.json`
- 활성 spec: `G:\Donggri_DevDrive\storage\codex-control\specs\20260714-donggrolgamebook-part1-4-950-quality-spine-v1`
