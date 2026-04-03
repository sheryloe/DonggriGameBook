# Repository Optimization Guide

## 1) 폴더 정책

- `src/`: 런타임 코드, 상태관리, 라우팅, 엔진 실행부
- `schemas/`: JSON Schema 및 계약 정의
- `data/`: 게임 데이터(런타임에 읽는 기본 데이터)
- `docs/`: 기획/개념 문서, 작업 메모, 린트/운영 가이드
- `docs/repo/`: 저장소 운영 가이드(이 문서 포함)
- `ui/`: UI 메타(화면 전이/레이아웃 힌트)
- `img/`: 정적 이미지 원본
- `public/`: 번들링 가능한 공개 정적 에셋
- `dist/`: 빌드 산출물(커밋 금지, 재생성 대상)
- `output/`: 외부 생성물(이미지/임시 렌더링) 저장 전용
- `scripts/`: 정리, 정적 점검, 변환 스크립트
- `node_modules/`: 로컬 의존성(커밋 금지)
- `tmp/`: 임시 작업 폴더(빌드/테스트 중 임시)

## 2) 추적/비추적 원칙

1. 추적 보존 대상
   - 설계/규약/운영 절차 문서
   - 런타임 코드와 컴파일 설정
   - 정규 데이터 스키마와 샘플 데이터
   - 재현 가능한 패키지 스크립트 및 배포 설정

2. 비추적(커밋 제외) 대상
   - `node_modules/`
   - `dist/`
   - `output/` (임시 대량 생성물)
   - `tmp/`
   - 로그, PID 파일, 로컬 설정 캐시
   - 대용량 로컬 DB 덤프, 영상/음원 원본 임시본

3. 변경 원칙
   - 문서/코드 변경 시 `docs/repo/` 규칙 갱신을 즉시 반영
   - `data/`, `schemas/`, `src/` 변경은 호환성 고려 후 반영
   - 환경별 경로/엔드포인트는 오버라이드 사용, 하드코딩 금지

## 3) 대용량 바이너리 취급

- 10MB 이상 파일은 기본적으로 `git` 추적 대상에서 제외
- 바이너리는 `output/` 또는 외부 스토리지/클라우드에 보관 후 경로만 버전 관리
- 이미지/영상이 많아지면 `git lfs` 또는 에셋 전용 저장소 분리를 검토
- 신규 대용량 파일 추가 전 크기 점검을 강제한다.
- 에셋명은 `art_key` 기준으로 통일(`npc-main`, `background-01`, `item-12`)

```bash
# 파일 크기 점검 예시 (WSL)
max=$((10*1024*1024))
rg --files img scripts output src public data docs |
while read -r f; do
  sz=$(stat -c%s "$f")
  if [ "$sz" -gt "$max" ]; then
    echo "LARGE: $f"
  fi
done
```

## 4) 배포 산출물 정책

- 배포 산출물은 `dist/`에 한정한다.
- `dist/`는 커밋이 아닌 빌드 산출물로 관리한다.
- 재배포 전 `dist/` 삭제 후 재빌드를 기본 동작으로 한다.
- 런타임 경로(`manifest`, `data`, `docs`)는 코드에서 상대 경로로 명시한다.

```bash
# 배포 직전 클린 빌드
cd /mnt/d/Donggri_Platform/DonggrolGameBook
rm -rf dist
npm ci
npm run build
```

## 5) 실행/정리 명령 (WSL)

- 기본 실행

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
npm run dev
```

- 작업 후 정리

```bash
# 임시 정리
rm -rf dist output tmp .parcel-cache .vite node_modules/.vite
# 상태 점검
git status --short
```

- 최소 정리 체크

```bash
# 추적 폴더 외부 산출물 노출 방지
rg --files -g 'dist/**' -g 'output/**' -g 'tmp/**' | sed -n '1,200p'
```

## 운영 규칙(단일)

- 하나의 변경 단위가 끝나면 `docs/repo/repository-optimization-guide.md`의 기준을 기준으로 정리
- 의존성, 데이터, 산출물은 매번 같은 정책으로 처리
- 배포 전후로 `git status --short`로 누락 산출물이 섞였는지 점검

## CH01~CH05 경로 계약 (활성/레거시 분리)

### 활성 경로(우선 참조)

- `schemas/`
- `ui/`
- `codex_webgame_pack/data/`
- `docs/concept_arc_01_05_md/`
- `docs/world/`

### 레거시/호환 경로(로더 fallback 허용)

- `codex_webgame_pack/schemas/`
- `codex_webgame_pack/ui/`
- `apocalypse_arc_01_05/`

운영 원칙:
- 런타임 로더의 fallback 동작은 유지한다.
- 신규 문서와 운영 규약은 활성 경로 기준으로만 작성한다.
- 레거시 경로 데이터는 alias 또는 reference 용도로만 사용한다.

## 추적 경계 고정 (중간 강도)

- 비추적 유지:
  - `dist/`, `output/`, `tmp/`, `.cache/`, `.vite/`, `.next/`, `.turbo/`
  - 로그/PID 파일
  - 로컬 OAuth/개인 설정(`.gemini-oauth/`, `.env.local`)
- 추적 유지:
  - 운영 가이드(`docs/repo`, `docs/architecture`, `docs/ops`)
  - 검증/운영 스크립트(`scripts/`)
  - 런타임 코드/데이터/스키마

## 대용량 자산 감사 루틴

정기 점검 대상:
- `img/`
- `dist/`
- `output/`
- `music/`
- `public/audio/`

실행:

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
npm run repo:audit-assets
```

기본 정책:
- 10MB 초과 파일 및 중복 파일(SHA256) 발견 시 strict 모드에서 실패.
- 리포트 출력 위치: `output/repo-audit/asset-audit-report.txt`
