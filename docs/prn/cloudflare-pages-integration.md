# PRN · Cloudflare Pages Integration

## 1. 목표

- 현재 DonggriWorld 게임북을 Cloudflare Pages에 정식 배포 가능한 상태로 유지한다.
- 정적 SPA 라우팅, Story 1/2 직접 URL 진입, 모바일 접근성, 광고 슬롯 준비 상태를 함께 검증한다.
- 배포 설정은 간단하게 유지하고, 빌드 산출물과 문서 구조를 기준으로만 통합한다.

## 2. 배포 기준

- 프레임워크: `Vite + React + TypeScript`
- 배포 대상: `Cloudflare Pages`
- 빌드 명령: `npm run build`
- 출력 디렉터리: `dist`
- 라우팅 방식: SPA fallback 기반 직접 URL 지원

## 3. 통합 범위

### 포함

- Story 1과 Story 2의 정적 라우트
- 랜딩, 온보딩, 본편, 엔딩 화면
- 모바일/데스크톱 공통 레이아웃
- 광고 슬롯 준비 영역
- 로컬 SVG 및 인포그래픽 자산

### 제외

- 서버 저장
- 로그인
- 실시간 동기화
- 외부 백엔드 의존 기능

## 4. Cloudflare Pages 설정

1. Git 연결 또는 수동 배포를 선택한다.
2. Build command를 `npm run build`로 둔다.
3. Output directory를 `dist`로 둔다.
4. SPA 직접 진입이 필요하므로 route fallback을 유지한다.
5. 환경변수는 광고 연동이 필요할 때만 추가한다.

### 권장 환경변수

- `VITE_ADSENSE_CLIENT`
- `VITE_ADSENSE_SLOT`

## 5. 검증 항목

- `/` 랜딩 진입 성공
- `/story/1/intake` 직접 진입 성공
- `/story/1/ending-clear` 직접 진입 성공
- `/story/2/dispatch` 직접 진입 성공
- 모바일 폭에서 본문 우선 표시
- 엔딩 화면에서 재시작 동작 확인
- Cloudflare Pages 빌드 후 새로고침 시 라우팅 유지

## 6. 운영 메모

- 배포 전에는 `npm run build`와 로컬 직접 URL 확인을 먼저 수행한다.
- 도커 테스트와 Cloudflare Pages 배포는 같은 `dist` 결과물을 기준으로 본다.
- Story 1은 에피소드 단위 완결, Story 2는 외곽 보급 루트 확장용으로 운영한다.
- 자산 추가 시에는 SVG/문서형 인포그래픽을 우선하고, 바이너리는 최후 수단으로만 사용한다.

