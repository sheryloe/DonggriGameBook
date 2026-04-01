# PRN · DonggrolGameBook Rebuild

## 1. 목적

- `D:\Donggri_Platform\DonggrolGameBook`를 기준으로 프로젝트를 다시 생성한다.
- 프로젝트명, 패키지명, 브랜딩 명칭은 모두 `DonggrolGameBook`으로 통일한다.
- 이번 재생성은 `웹 게임북` 구조를 더 깔끔하게 다시 세우는 것이 목적이다.
- 기존 방향은 유지하되, Windows 경로 문제와 구조 혼선을 제거한다.

## 2. 고정 결정

- 앱 성격: `React 기반 웹 게임북`
- 기술 스택: `Vite + React + TypeScript + React Router + CSS`
- 개발 기준: `WSL 우선`
- 프로젝트 루트: `D:\Donggri_Platform\DonggrolGameBook`
- WSL 작업 경로: `/mnt/d/Donggri_Platform/DonggrolGameBook`
- 패키지명: `donggrolgamebook`
- 브라우저 타이틀: `DonggrolGameBook`
- 배포 타깃: `Cloudflare Pages`
- 오디오 정책: `Story 1`에만 우선 BGM 적용
- 배경음 원본 위치: `music/story1.mp3`
- 서비스 경로: `public/audio/story1.mp3`
- 문서 경로 정책: `docs/prn` 사용 금지, 대신 `docs/project-prn` 사용

## 3. 이번 재생성 범위

### 포함

- 랜딩 페이지
- Story 1 / Story 2 라우팅 구조
- Story runtime 엔진
- Story 1 배경음 재생
- Story 1 화면 전환 애니메이션
- Story 2 확장 가능한 데이터 구조
- 문서 구조 재정리

### 제외

- `C++/WASM`
- 서버 저장
- 로그인
- 멀티플레이
- 복잡한 인벤토리 시스템
- 오디오 믹서/다중 트랙 시스템

## 4. 재생성 후 목표 구조

```text
DonggrolGameBook/
├─ docs/
│  ├─ architecture/
│  ├─ assets/
│  ├─ project-prn/
│  │  └─ donggrolgamebook-rebuild-prn.md
│  └─ world/
├─ music/
│  └─ story1.mp3
├─ public/
│  ├─ _redirects
│  └─ audio/
│     └─ story1.mp3
├─ src/
│  ├─ assets/
│  ├─ components/
│  ├─ data/
│  ├─ lib/
│  ├─ pages/
│  ├─ styles/
│  ├─ types/
│  ├─ App.tsx
│  └─ main.tsx
├─ .env.example
├─ Dockerfile
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

## 5. 라우팅 기준

- `/`
- `/story/1`
- `/story/2`
- `/story/:storyId/:nodeId`

### 라우팅 요구사항

- Story 1 직접 진입 가능
- Story 2 직접 진입 가능
- 새로고침 시 라우트 유지
- Cloudflare Pages SPA fallback 유지

## 6. 런타임 기준

### Story Engine 계약

- `StoryDefinition`
- `StoryNode`
- `StoryChoice`
- `StoryState`
- `AssetSpec`
- `EndingSummary`

### 상태 정책

- 핵심 상태는 `supplies`, `noise`만 유지
- 값 범위는 `0 ~ 9`
- Story 1과 Story 2 모두 동일한 상태 모델 공유

## 7. UI/연출 기준

### 화면 원칙

- 연출은 모두 프레젠테이션 레이어에서 처리한다.
- 엔진 로직과 애니메이션 로직은 분리한다.
- Story 1은 `행정적 냉기 + 야간 탐사 압박` 톤으로 유지한다.

### Story 1 연출 요소

- `VisualPanel` 장면 애니메이션
- `StoryPage` 장면 진입 전환
- 탭 패널 전환
- 선택지 카드 순차 등장
- 우하단 BGM 컨트롤

### 오디오 요구사항

- Story 1 경로 진입 시 `story1.mp3` 자동 재생 시도
- 자동재생 차단 시 사용자 클릭으로 재생 가능해야 함
- BGM ON/OFF 버튼 제공
- 볼륨 조절 제공
- Story 1 밖으로 나가면 음악 정지 및 초기화

## 8. 문서 정책

- 기존 `docs/prn`는 새 프로젝트에서 사용하지 않는다.
- 모든 신규 PRN 문서는 `docs/project-prn`에 둔다.
- 구조 문서는 `docs/architecture`
- 세계관 문서는 `docs/world`
- 이미지/자산 프롬프트는 `docs/assets`

## 9. 구현 순서

### STEP 1. 프로젝트 재생성

```bash
cd /mnt/d/Donggri_Platform
rm -rf DonggrolGameBook
npm create vite@latest DonggrolGameBook -- --template react-ts
cd DonggrolGameBook
npm install
npm install react-router-dom
```

### STEP 2. 기본 구조 생성

- `src/components`
- `src/data`
- `src/lib`
- `src/pages`
- `src/styles`
- `src/types`
- `docs/architecture`
- `docs/assets`
- `docs/project-prn`
- `docs/world`
- `public/audio`

### STEP 3. 라우팅/엔진 생성

- `LandingPage`
- `StoryPage`
- `storyEngine`
- `storyStorage`
- `useStoryRun`
- `stories.ts`
- `story1.ts`
- `story2.ts`

### STEP 4. Story 1 연출 및 음악 반영

```bash
mkdir -p public/audio
cp music/story1.mp3 public/audio/story1.mp3
```

- `StoryAudioController` 추가
- `App.tsx`에서 전역 마운트
- Story 1 라우트에서만 재생

### STEP 5. 검증

```bash
npm run build
npm run dev
```

추가 검증 항목:

- `/`
- `/story/1/intake`
- `/story/1/night-gate`
- `/story/1/ending-clear`
- `/story/2/dispatch`
- `/audio/story1.mp3`

## 10. 완료 기준

- 프로젝트명이 `DonggrolGameBook`으로 통일됨
- `package.json` 이름이 `donggrolgamebook`
- Story 1/Story 2 라우팅 정상 동작
- Story 1 BGM 정상 재생
- Story 1 애니메이션 정상 동작
- Windows-safe 문서 구조 사용
- `docs/project-prn` 기준으로 문서 관리 시작

## 11. 주의사항

- Windows에서는 `prn` 예약어 충돌 가능성이 있으므로 새 프로젝트에서 `docs/prn`를 다시 만들지 않는다.
- 실제 작업은 WSL 기준으로 진행한다.
- 오디오 파일 원본은 `music/story1.mp3`에 두고, 빌드/서빙용 파일은 `public/audio/story1.mp3`로 복사한다.
- Story 2 작업은 Story 1 재생성 완료 후 같은 엔진 구조를 재사용해 확장한다.

## 12. 다음 작업

- 먼저 이 PRN 기준으로 프로젝트를 새로 생성한다.
- 그 다음 `Story 1`을 우선 복원한다.
- 마지막으로 `Story 2`를 같은 구조 위에 추가한다.
