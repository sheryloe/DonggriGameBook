# PRN: DonggrolGameBook Apps in Toss 전환

## 1. 목적

- 기준일: `2026-04-08`
- 현재 `DonggrolGameBook` 웹게임 프로토타입을 `Apps in Toss` 게임 미니앱으로 전환한다.
- 구현 방식은 `기존 Vite + React + TypeScript` 코드를 유지하고 `@apps-in-toss/web-framework`를 붙이는 방식으로 고정한다.
- 1차 목표는 `CH01 ~ CH05 플레이`, `세이브 복구`, `공유 진입`, `검수 통과`다.

## 2. 최신 공식 문서 기준 고정 결정

### 채택안

- `Apps in Toss WebView 게임 미니앱`으로 간다.
- 운영 프론트엔드는 자체 서버에서 직접 서빙하지 않는다.
- 운영 프론트엔드는 앱인토스 콘솔에 업로드한 뒤 `토스 CDN`에서 서빙된다.
- 자체 서버는 `세이브`, `운영 API`, `토스 로그인 토큰 교환`, `결제 검증`, `리소스 메타데이터` 전용으로 둔다.
- 유저 식별 1차는 `getUserKeyForGame()`으로 간다.
- 세이브는 `localStorage only`를 금지하고 `local cache + own server sync`로 간다.
- 결제는 1차 범위에서 제외하고, 2차에서 `인앱결제(IAP)`를 붙인다.

### 최신 공식 문서 반영 사항

- 기존 웹 프로젝트는 `@apps-in-toss/web-framework` 설치 후 `npx ait init`으로 환경을 붙인다.
- `appName`은 콘솔에 등록한 이름과 완전히 같아야 한다.
- 출시 전 테스트는 `intoss-private://{appName}` 스킴 기준이다.
- 출시 후 실제 진입은 `intoss://{appName}` 스킴 기준이다.
- 운영 Origin은 `https://<appName>.apps.tossmini.com`이다.
- QR 테스트 Origin은 `https://<appName>.private-apps.tossmini.com`이다.
- 앱 번들은 압축 해제 기준 `100MB 이하`만 업로드 가능하다.
- `iframe` 사용은 검수 반려 사유다.
- 게임 유저 식별용 `getUserKeyForGame()`은 공식 문서 기준 `토스앱 v5.232.0+`, `WebView SDK v1.4.0+`가 필요하다.
- 공식 문서 기준 `WebView SDK v1.13.0`부터 사용자가 미니앱 데이터 삭제를 할 수 있으므로 로컬 저장소 단독 설계는 금지한다.

## 3. 왜 이 구조가 맞는가

- 현재 저장소는 이미 `Vite + React 18 + TypeScript + Zustand` 기반이라 WebView 포팅 비용이 가장 낮다.
- 앱인토스 공식 문서는 기존 웹 프로젝트에 SDK를 붙여 배포할 수 있다고 안내한다.
- 운영 번들은 토스 CDN에서 서빙되므로 `Cloudflare Pages에 게임 프론트를 올리고 토스에서 iframe/webview로 감싼다` 같은 구조는 기준 아키텍처가 아니다.
- 게임 카테고리에서는 `getUserKeyForGame()`으로 서버 OAuth 없이 안정적인 게임 유저 키를 받을 수 있다.
- 현재 저장소는 `src/lib/storyStorage.ts`, `src/store/gameStore.ts` 모두 브라우저 저장소 의존이 크다.
- 공식 문서상 사용자가 미니앱 용량 삭제를 할 수 있으므로, 현재 구조 그대로는 세이브 유실을 막을 수 없다.
- 결제 상태 조회, 토스 로그인, 이후 확장 API는 서버가 필요하므로 자체 서버는 결국 필수다.

## 4. 현재 저장소 기준 진단

### 유지 가능한 것

- `Vite` 빌드 파이프라인
- `React 18`
- `TypeScript`
- `Zustand`
- 데이터 중심 콘텐츠 구조
- 정적 자산 로딩 구조

### 바로 수정해야 하는 것

- `src/App.tsx`
  - 현재는 토스 인앱 기준의 실제 라우팅 구조가 아니다.
- `src/lib/storyStorage.ts`
  - `window.localStorage` 단독 저장 구조다.
- `src/store/gameStore.ts`
  - `persist`가 로컬 저장소만 사용한다.
- `granite.config.ts`
  - 아직 없다.
- 유저 식별 계층
  - 아직 없다.
- 서버 동기화 API
  - 아직 없다.
- 딥링크 진입 규칙
  - 아직 없다.

## 5. 목표 아키텍처

```text
Toss App
  -> Toss CDN
    -> https://<appName>.apps.tossmini.com
      -> Apps in Toss WebView
        -> DonggrolGameBook Frontend
          -> Router
          -> Store
          -> Event Runner
          -> Toss Bridge Adapter
          -> Save Sync Client

Own Backend
  -> api.<domain>
    -> Save API
    -> Player API
    -> Toss Login Token Exchange
    -> IAP Validation / Grant API
    -> Asset Metadata API

Data Layer
  -> PostgreSQL
  -> Object Storage / CDN
```

## 6. 고정 원칙

- 게임 카테고리로 등록한다.
- `webViewProps.type`은 `game`으로 고정한다.
- 운영 프론트는 `토스 CDN`, 자체 서버는 `API 전용`으로 분리한다.
- `localStorage`는 캐시로만 쓰고, 정본은 자체 서버에 둔다.
- 자체 서버 CORS 허용 Origin에 아래 두 도메인을 반드시 포함한다.
  - `https://<appName>.apps.tossmini.com`
  - `https://<appName>.private-apps.tossmini.com`
- 테스트 진입은 출시 전 `intoss-private://`, 출시 후 `intoss://`로 나눈다.
- 챕터/노드 진입은 URL 기반으로 유지한다.
- 상단 `X` 버튼과 게임 UI가 겹치면 안 된다.
- `X` 버튼 클릭 시 종료 확인 모달을 반드시 띄운다.
- 대용량 이미지/사운드는 외부 CDN lazy loading으로 분리한다.

## 7. 목표 파일 구조

```text
DonggrolGameBook/
├─ granite.config.ts
├─ src/
│  ├─ app/
│  │  ├─ router.tsx
│  │  └─ providers.tsx
│  ├─ platform/
│  │  ├─ toss/
│  │  │  ├─ env.ts
│  │  │  ├─ identity.ts
│  │  │  ├─ share.ts
│  │  │  └─ navigation.ts
│  │  └─ storage/
│  │     ├─ local.ts
│  │     └─ sync.ts
│  ├─ services/
│  │  ├─ apiClient.ts
│  │  ├─ saveService.ts
│  │  ├─ playerService.ts
│  │  └─ paymentService.ts
│  ├─ screens/
│  │  ├─ TitleScreen.tsx
│  │  ├─ ChapterMapScreen.tsx
│  │  ├─ EventScreen.tsx
│  │  ├─ BattleScreen.tsx
│  │  ├─ ResultScreen.tsx
│  │  └─ SettingsScreen.tsx
│  ├─ store/
│  │  ├─ gameStore.ts
│  │  └─ saveStore.ts
│  └─ types/
│     ├─ platform.ts
│     └─ save.ts
└─ server/
   ├─ docker-compose.yml
   ├─ nginx/
   │  └─ default.conf
   ├─ certs/
   │  ├─ apps-in-toss-client.crt
   │  └─ apps-in-toss-client.key
   ├─ src/
   │  ├─ routes/
   │  │  ├─ players.ts
   │  │  ├─ saves.ts
   │  │  ├─ login.ts
   │  │  └─ payments.ts
   │  ├─ services/
   │  │  ├─ saveSyncService.ts
   │  │  ├─ playerIdentityService.ts
   │  │  ├─ tossMtlsClient.ts
   │  │  └─ paymentService.ts
   │  └─ index.ts
   ├─ .env.example
   └─ package.json
```

## 8. 단계별 구현 계획

### STEP 1. 앱인토스 환경 부트스트랩

목표:

- 현재 Vite 프로젝트를 Apps in Toss WebView 프로젝트로 인식시키기

작업:

- 앱인토스 콘솔에 게임 앱 등록
- SDK 설치
- `npx ait init` 실행
- `appName`, `dev`, `build`, `port`를 현재 프로젝트에 맞춰 입력
- 생성된 `granite.config.ts` 확인

WSL 실행:

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
npm install @apps-in-toss/web-framework
npx ait init
```

권장 `granite.config.ts`:

```ts
// granite.config.ts
import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "donggrolgamebook",
  brand: {
    displayName: "DonggrolGameBook",
    primaryColor: "#8B0000",
    icon: "https://static.toss.im/appsintoss/0000/granite.png"
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite --host 0.0.0.0",
      build: "tsc -b && vite build"
    }
  },
  permissions: [],
  outdir: "dist",
  webViewProps: {
    type: "game",
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsInlineMediaPlayback: true
  }
});
```

완료 기준:

- 샌드박스 앱에서 로컬 실행 가능
- `dist` 빌드 가능
- `appName`, `brand`, `outdir` 정합성 확인

### STEP 2. 자체 서버 골격 먼저 고정

목표:

- 프론트보다 먼저 API 경계와 저장 구조를 고정

작업:

- `Node.js + Fastify + PostgreSQL + Nginx` 기반 자체 서버 생성
- 세이브/플레이어/로그인/결제 라우트 생성
- CORS allowlist 반영
- mTLS 인증서 보관 위치 분리

WSL 실행:

```bash
mkdir -p /mnt/d/Donggri_Platform/DonggrolGameBook/server
cd /mnt/d/Donggri_Platform/DonggrolGameBook/server
npm init -y
npm install fastify @fastify/cors pg dotenv undici
npm install -D typescript tsx @types/node
```

`server/docker-compose.yml`:

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    container_name: donggrol-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: donggrol
      POSTGRES_USER: donggrol
      POSTGRES_PASSWORD: donggrol
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:1.27-alpine
    container_name: donggrol-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro

volumes:
  postgres_data:
```

`server/src/index.ts`:

```ts
import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: [
    "https://donggrolgamebook.apps.tossmini.com",
    "https://donggrolgamebook.private-apps.tossmini.com",
    "http://localhost:5173"
  ],
  credentials: true
});

app.get("/health", async () => ({ ok: true }));

await app.listen({
  host: "0.0.0.0",
  port: 4000
});
```

완료 기준:

- `GET /health` 정상 응답
- 로컬 Vite 서버와 API 서버 동시 구동 가능
- 운영 Origin 규칙 반영 완료

### STEP 3. 게임 라우팅 구조 교체

목표:

- 현재 `src/App.tsx` 데모 구조를 실제 게임 라우팅 구조로 교체

작업:

- `title -> chapter -> event -> result -> settings` 라우팅 구성
- 챕터/노드 단위 URL 설계
- 스킴 path/query를 라우터 진입점으로 연결

권장 라우트:

```text
/
/title
/chapter/:chapterId
/chapter/:chapterId/node/:nodeId
/chapter/:chapterId/result/:endingId
/settings
```

`src/app/router.tsx`:

```tsx
import { createBrowserRouter } from "react-router-dom";
import { TitleScreen } from "../screens/TitleScreen";
import { ChapterMapScreen } from "../screens/ChapterMapScreen";
import { EventScreen } from "../screens/EventScreen";
import { ResultScreen } from "../screens/ResultScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

export const router = createBrowserRouter([
  { path: "/", element: <TitleScreen /> },
  { path: "/title", element: <TitleScreen /> },
  { path: "/chapter/:chapterId", element: <ChapterMapScreen /> },
  { path: "/chapter/:chapterId/node/:nodeId", element: <EventScreen /> },
  { path: "/chapter/:chapterId/result/:endingId", element: <ResultScreen /> },
  { path: "/settings", element: <SettingsScreen /> }
]);
```

테스트 스킴 예시:

```text
intoss-private://donggrolgamebook/chapter/CH01/node/YD-01?_deploymentId=<deploymentId>
intoss://donggrolgamebook/chapter/CH01/node/YD-01
```

완료 기준:

- CH01 시작부터 결과 화면까지 URL 기반 이동 가능
- 새로고침 후 현재 노드 복원 가능
- 스킴 진입 시 지정 노드로 바로 시작 가능

### STEP 4. 유저 식별과 세이브 동기화

목표:

- 토스 인앱 안에서 유저별 세이브를 안정적으로 복원

선택:

- 1차는 `appLogin()`이 아니라 `getUserKeyForGame()`을 사용
- 이유는 게임 전용이며 인증 화면 없이 안정적인 유저 식별이 가능하기 때문
- 단, `인앱결제 상태 조회`, `토스페이`, `프로모션`, `정식 계정 연결`이 들어가는 순간 `appLogin()`과 mTLS 서버 연동을 추가

`src/platform/toss/identity.ts`:

```ts
import { getUserKeyForGame } from "@apps-in-toss/web-framework";

export async function getStablePlayerId(): Promise<string | null> {
  const result = await getUserKeyForGame();

  if (!result || result === "INVALID_CATEGORY" || result === "ERROR") {
    return null;
  }

  if (result.type === "HASH") {
    return result.hash;
  }

  return null;
}
```

`src/services/saveService.ts`:

```ts
export interface SaveSnapshot {
  playerId: string;
  chapterId: string;
  nodeId: string;
  state: Record<string, unknown>;
  updatedAt: string;
}

export async function pullLatestSave(playerId: string): Promise<SaveSnapshot | null> {
  const response = await fetch(`/api/players/${playerId}/save`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("failed_to_pull_save");
  }

  return response.json();
}

export async function pushLatestSave(payload: SaveSnapshot): Promise<void> {
  const response = await fetch(`/api/players/${payload.playerId}/save`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("failed_to_push_save");
  }
}
```

`server/src/routes/saves.ts`:

```ts
import { FastifyInstance } from "fastify";

const saves = new Map<string, unknown>();

export async function registerSaveRoutes(app: FastifyInstance) {
  app.get("/players/:playerId/save", async (request, reply) => {
    const { playerId } = request.params as { playerId: string };
    const payload = saves.get(playerId);

    if (!payload) {
      reply.status(404);
      return null;
    }

    return payload;
  });

  app.put("/players/:playerId/save", async (request, reply) => {
    const { playerId } = request.params as { playerId: string };
    saves.set(playerId, request.body);
    reply.status(204).send();
  });
}
```

완료 기준:

- 앱 재설치/캐시 삭제 후에도 세이브 복원 가능
- 동일 유저가 다른 기기에서 이어하기 가능

### STEP 5. 토스 인앱 전용 UX

목표:

- 검수 기준에 맞는 종료/공유/안전 영역 UX 적용

작업:

- safe area 반영
- 상단 `X` 버튼과 겹치지 않게 UI 상단 여백 확보
- 종료 확인 모달 추가
- 공유 딥링크 추가

필수 규칙:

- 종료 모달 문구는 `$서비스명$을 종료할까요?`
- 버튼 문구는 `닫기`, `종료하기`

`src/platform/toss/share.ts`:

```ts
import { getTossShareLink, share } from "@apps-in-toss/web-framework";

export async function shareCurrentRun(path: string): Promise<void> {
  const link = await getTossShareLink(`intoss://donggrolgamebook${path}`);

  await share({
    url: link
  });
}
```

완료 기준:

- 상단 버튼과 콘텐츠가 겹치지 않음
- 특정 챕터/노드를 공유하면 토스 앱에서 바로 재진입 가능

### STEP 6. 결제 확장

목표:

- BM이 필요할 때만 결제를 붙인다.

원칙:

- 디지털 재화는 `인앱결제(IAP)` 우선
- 실물/외부 서비스가 아니므로 1차 기준 `TossPay`는 우선순위 아님
- 공식 문서 기준:
  - `SDK 1.1.3+`: 지급 완료 과정 포함
  - `SDK 1.2.2+`: 주문 복원 기능 포함
- 주문 복원은 `getPendingOrders -> 상품 지급 -> completeProductGrant` 순서 강제
- 인앱결제 상태 조회 API를 쓰려면 `토스 로그인`이 선행되어야 함

`server/src/routes/payments.ts`:

```ts
import { FastifyInstance } from "fastify";

export async function registerPaymentRoutes(app: FastifyInstance) {
  app.post("/payment/execute", async (request, reply) => {
    const { payToken, orderId } = request.body as {
      payToken?: string;
      orderId?: string;
    };

    if (!payToken || !orderId) {
      reply.status(400);
      return { error: "invalid_payload" };
    }

    return {
      ok: true,
      orderId
    };
  });
}
```

완료 기준:

- 주문번호 기준 멱등 처리 가능
- 지급 실패 후 복원 경로 존재
- 중복 지급 방지

### STEP 7. QA 및 출시

목표:

- 토스 앱 실기기에서 CH01~CH05 완주와 복원/공유를 검증

체크리스트:

- 토스 앱 최소 지원 버전에서 정상 진입
- 앱 진입 후 5초 이내 플레이 가능
- CH01~CH05 최소 1회 완주
- 세이브 후 강제 종료 -> 복원
- 네트워크 끊김 후 재시도
- 상단 종료 버튼 동작
- 공유 링크 재진입
- 이미지 fallback 동작
- 실제 환경 Origin에서 API 통신 성공
- `intoss-private://` QR 테스트 1회 이상 완료
- 콘솔 업로드 또는 `ait deploy` 기준 배포 경로 검증

## 9. 자체 서버 권장 스택

### 최종 권장안

- `Ubuntu 24.04 LTS + Nginx + Node.js 22 + Fastify + PostgreSQL 16`

### 이유

- 자체 서버 요구를 만족한다.
- 현재 저장소와 같은 TypeScript/Node 계열로 맞출 수 있다.
- mTLS 인증서 관리가 단순하다.
- 세이브/로그인/결제/운영 API를 한 서버 그룹으로 묶기 쉽다.
- 관리자 도구와 배치 작업 확장이 쉽다.

### 저장 테이블 예시

```sql
create table if not exists player_saves (
  player_id text primary key,
  chapter_id text not null,
  node_id text not null,
  state_json text not null,
  updated_at text not null
);
```

## 10. WSL 기준 실행 절차

프론트:

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook
npm install
npm install @apps-in-toss/web-framework
npx ait init
npm run build
npm run dev
```

API 서버:

```bash
cd /mnt/d/Donggri_Platform/DonggrolGameBook/server
npm install
npx tsx src/index.ts
```

Android 실기기 테스트:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173
adb reverse tcp:4000 tcp:4000
adb reverse --list
```

iOS 실기기 테스트:

```text
1. 아이폰과 개발 PC를 같은 Wi-Fi에 연결
2. 샌드박스 앱의 로컬 네트워크 권한 허용
3. 샌드박스 앱에 개발 PC의 로컬 IP 입력
4. intoss://<appName> 스킴으로 실행
```

## 11. 일정안

### Week 1

- 콘솔 앱 등록
- `@apps-in-toss/web-framework` 설치
- `npx ait init` 완료
- `granite.config.ts` 정리
- 자체 서버 골격 생성

### Week 2

- 라우팅 재구성
- CH01~CH05 흐름 연결
- 세이브 구조 정리
- API 스키마 확정

### Week 3

- `getUserKeyForGame()` 연동
- 서버 세이브 동기화
- 공유 진입 추가
- CORS/운영 Origin 검증

### Week 4

- 실기기 QA
- 검수 수정
- 테스트 번들 업로드
- 출시 준비

## 12. 바로 시작할 작업 3개

1. `npx ait init`으로 `granite.config.ts` 생성
2. `server/` API 골격과 CORS allowlist 먼저 만들기
3. `src/App.tsx`를 라우터 엔트리로 교체하고 `server sync + local cache` 구조로 저장 방식을 바꾸기

## 13. 보류할 것

- 시작부터 `appLogin()` 기반 계정 연동
- 시작부터 인앱결제 붙이기
- 시작부터 랭킹/광고/프로모션까지 확장
- React Native 재작성

## 14. 완료 정의

- 토스 앱 안에서 `DonggrolGameBook`이 게임 미니앱으로 실행된다.
- CH01~CH05가 플레이 가능하다.
- 유저 식별자 기준 세이브 복원이 가능하다.
- 공유 링크 재진입이 가능하다.
- 로컬 저장소가 지워져도 진행 데이터가 복구된다.
