# DonggrolGameBook

## 목적
- 이 저장소는 소스 전용 레포입니다.
- 코드, 스키마, 런타임 계약, 스크립트, 운영 문서만 Git에 남깁니다.
- 스토리, 챕터 JSON, UI 흐름, 프롬프트, 이미지, 음악, 영상은 모두 `private/` 아래 로컬 전용으로 관리합니다.

## 최종 구조
```text
D:\Donggri_Platform\DonggrolGameBook
├─ apps/                     # part1~part4 엔트리
├─ packages/                 # 실제 런타임 코드
│  ├─ app-runtime/           # 기존 root src 이동 대상
│  ├─ game-content-core/
│  ├─ game-engine/
│  ├─ ui-kit/
│  └─ world-registry/
├─ server/                   # Fastify API
├─ schemas/                  # 공개 가능한 JSON 계약
├─ scripts/                  # export, sync, dashboard, ops 스크립트
├─ docs/ops/                 # 운영 문서
├─ private/                  # 개인 소유 콘텐츠, Git 제외
│  ├─ story/
│  ├─ content/
│  ├─ prompts/
│  └─ generated/
└─ public/
   ├─ runtime-content/       # export 산출물, Git 제외
   └─ generated/             # 미디어 산출물, Git 제외
```

## Git 추적 대상
- `apps/`
- `packages/`
- `server/`
- `scripts/`
- `schemas/`
- `docs/ops/`
- 루트 설정 파일

## Git 제외 대상
- `private/`
- `public/generated/`
- `public/runtime-content/`
- `dist/`
- `output/`

## 콘텐츠 흐름
1. `private/`에 개인 소유 원본을 둡니다.
2. `npm run private:export`로 런타임 산출물을 만듭니다.
3. 앱은 `public/runtime-content/`와 `public/generated/`만 읽습니다.

## 필수 명령
### 설치
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm install
```

### private 콘텐츠 점검
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run private:check
```

### 런타임 export
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run private:export
```

### 앱 빌드
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run build:apps
```

### 미디어 동기화 상태 대시보드
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run dashboard:media-sync
ii .\media-sync-dashboard.html
```

### 이미지 동기화(dry-run/apply)
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run assets:sync -- --part P1 --dry-run
npm run assets:sync -- --part P1
```

### 파트별 프롬프트 생성
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run asset-prompts:generate:part1
npm run asset-prompts:generate:part2
npm run asset-prompts:generate:part3
npm run asset-prompts:generate:part4
```

### 아이콘/보스음악 프롬프트
```powershell
Set-Location D:\Donggri_Platform\DonggrolGameBook
npm run asset-prompts:item-icons
npm run assets:item-icons:crop
npm run audio-prompts:boss
```

### Antigravity 작업 가이드
```powershell
ii D:\Donggri_Platform\DonggrolGameBook\docs\ops\ANTIGRAVITY_README.md
```

## 주요 문서
- 운영 가이드: `docs/ops/`
- Antigravity 작업 가이드: `docs/ops/ANTIGRAVITY_README.md`
- 공개 계약 카탈로그: `packages/world-registry/`

## 원칙
- 앱은 `private/`를 직접 import하지 않습니다.
- 루트 `src/`는 사용하지 않습니다.
- `apps/*`는 엔트리만 두고 실제 코드는 `packages/app-runtime`에 둡니다.
- 생성 결과물은 Git에 올리지 않습니다.
