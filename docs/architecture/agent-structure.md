# DonggriWorld Agent Structure

## 목적

- 향후 Story 3+, 이미지 자산 확장, 배포 자동화, 광고 준비까지 이어질 수 있도록 프로젝트 내부 에이전트 역할을 고정한다.
- 역할 중복을 줄이고, 스토리/시스템/배포/비주얼 작업을 병렬로 진행하기 쉽게 만든다.

## 기본 에이전트

- `frontend-developer`
- `ui-designer`
- `documentation-engineer`
- `prompt-engineer`
- `qa-expert`
- `reviewer`

## 확장 에이전트

- `world-builder`
  - 여의도 질서, 세력, 구역, 행정 용어, 루머 생태계 설계
- `narrative-designer`
  - Story 노드, 선택지, 엔딩 연결, 다음 회차 브리지 설계
- `systems-designer`
  - `supplies`, `noise` 밸런스, 회차 길이, 분기 난이도 조정
- `deployment-engineer`
  - Cloudflare Pages, Docker, 정적 라우팅, smoke test 체크
- `growth-adsense`
  - 광고 슬롯 위치, 도달 흐름, UX 손상 방지 설계
- `asset-collage-designer`
  - SVG 인포그래픽, 장면 콜라주, 무료 소스 조합 설계

## 권장 병렬 패턴

1. 세계관/서사
   - `world-builder`
   - `narrative-designer`
   - `documentation-engineer`
2. 구현/비주얼
   - `frontend-developer`
   - `ui-designer`
   - `asset-collage-designer`
3. 검증/출시
   - `qa-expert`
   - `reviewer`
   - `deployment-engineer`

## 저장소 반영 규칙

- 에이전트 정의는 `.codex/agents/*.toml`에 둔다.
- 실제 결정사항은 `docs/world`, `docs/prn`, `docs/architecture`, `src/data` 중 하나에 반드시 반영한다.
- 배포 변경은 Cloudflare PRN과 아키텍처 문서를 같이 갱신한다.

## 반입 출처 메모

- 출발점은 `awesome-codex-subagents` 계열 구성이었다.
- 이 저장소에는 전체 미러링 대신, 실제 반복 사용이 예상되는 역할만 로컬 정의로 유지한다.
- 따라서 상위 저장소 버전 핀보다 현재 프로젝트에서의 역할 명확성과 유지보수를 우선한다.
