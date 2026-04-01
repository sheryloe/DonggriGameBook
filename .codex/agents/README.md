# DonggriWorld Agents

이 폴더는 `awesome-codex-subagents`를 그대로 미러링하지 않고, DonggriWorld 작업 흐름에 맞게 선별/재구성한 프로젝트 전용 에이전트 정의를 담는다.

## 반입 기준

- 기초 6개 역할은 `awesome-codex-subagents` 계열 구성을 참고해 프로젝트 로컬 정의로 선별 반입했다.
- 그 위에 DonggriWorld 특화 역할인 `world-builder`, `narrative-designer`, `systems-designer`, `deployment-engineer`, `growth-adsense`, `asset-collage-designer`를 추가했다.
- 목표는 범용 에이전트 모음 보관이 아니라, 이 저장소에서 실제로 반복 사용할 역할 세트를 유지하는 것이다.

## 현재 포함된 에이전트

- `frontend-developer`
  - React, 라우팅, 앱 셸, Story 런타임 UI 담당
- `ui-designer`
  - 한국형 재난-관료주의 톤의 레이아웃과 인포그래픽 연출 담당
- `documentation-engineer`
  - PRN, 배포 메모, 구조 문서 담당
- `prompt-engineer`
  - 이미지 생성 프롬프트, 무료 소스 대체안, 장면 프롬프트 담당
- `qa-expert`
  - 직접 URL 진입, 분기, 모바일, 접근성 검증 담당
- `reviewer`
  - 회귀, 막힌 루트, 검증 누락, 배포 리스크 리뷰 담당
- `world-builder`
  - 여의도 질서 체계, 거주 등급, 배급/공제 규칙, 세력 관계 확장 담당
- `narrative-designer`
  - 스토리 노드, 선택지 감정선, 엔딩 연결, 회차 구조 담당
- `systems-designer`
  - 상태값, 분기 밸런스, 플레이타임, 재시도 구조 담당
- `deployment-engineer`
  - Cloudflare Pages, Docker, 정적 라우팅, 환경변수/배포 점검 담당
- `growth-adsense`
  - 광고 슬롯 배치, 레이아웃 충돌 방지, 수익화 준비 메모 담당
- `asset-collage-designer`
  - SVG 콜라주, 도식형 장면 자산, 무료 소스 조합 방향 담당

## 운영 원칙

- 에이전트 출력은 코드/문서에 반영된 내용만 최종 사실로 본다.
- Story 노드 ID, 라우트 계약, 상태값 규칙은 코드와 PRN을 동시에 맞춘다.
- 배포 관련 결정은 `docs/prn/cloudflare-pages-integration.md`와 `docs/architecture/donggriworld-current-architecture.md`에 같이 남긴다.
- 신규 에이전트를 추가할 때는 역할이 기존 정의와 겹치지 않도록 범위를 명확히 적는다.

## 권장 협업 순서

1. `world-builder` 또는 `narrative-designer`가 회차 목표와 장면 구조를 잡는다.
2. `documentation-engineer`가 PRN과 배포/검증 문서를 맞춘다.
3. `frontend-developer`, `ui-designer`, `asset-collage-designer`가 구현과 자산을 반영한다.
4. `systems-designer`가 플레이타임과 상태값 밸런스를 다듬는다.
5. `qa-expert`, `reviewer`, `deployment-engineer`가 검증과 출시 리스크를 정리한다.
