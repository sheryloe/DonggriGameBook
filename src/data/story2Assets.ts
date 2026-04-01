import { AssetSpec } from "../types/story";

const onboardingProcessing = new URL(
  "../assets/onboarding-processing.svg",
  import.meta.url,
).href;
const rationLineCorridor = new URL(
  "../assets/ration-line-corridor.svg",
  import.meta.url,
).href;
const checkpointPolaroid = new URL(
  "../assets/checkpoint-polaroid.svg",
  import.meta.url,
).href;
const approvalDebtStampSheet = new URL(
  "../assets/approval-debt-stamp-sheet.svg",
  import.meta.url,
).href;
const heroBackground = new URL(
  "../assets/hero-yeouido-background.svg",
  import.meta.url,
).href;
const failureTexture = new URL(
  "../assets/failure-scanline-texture.svg",
  import.meta.url,
).href;

export const story2Assets: Record<string, AssetSpec> = {
  dispatch: {
    id: "dispatch",
    kind: "intake-grid",
    src: onboardingProcessing,
    alt: "외곽 보급 루트 배차와 인원 확인을 보여주는 처리 패널",
    accent: "#f5743a",
    mood: "보급표와 배차표가 겹쳐 놓인 외곽 출발 준비 화면",
    metrics: [
      { label: "배차", value: "L-02" },
      { label: "적재", value: "70%" },
      { label: "동행", value: "2명" },
    ],
    callouts: ["공식 배차표", "임시 호송 카드", "교환용 배터리", "기상 경보 주의"],
    prompt:
      "Korean survival dispatch board for Yeouido outer supply route, name card, route manifest, thermal scan bands, bureaucratic logistics collage.",
    credit: "Original SVG collage",
  },
  floodwall: {
    id: "floodwall",
    kind: "route-schematic",
    src: heroBackground,
    alt: "한강 제방 도로와 수문 경계선을 따라 이동하는 외곽 보급 경로",
    accent: "#8ec5ff",
    mood: "제방 상부와 점검로가 번갈아 나타나는 외곽 진입 구간",
    metrics: [
      { label: "제방 고도", value: "3.2m" },
      { label: "차량 정체", value: "LOW" },
      { label: "우천", value: "Y" },
    ],
    callouts: ["한강 제방", "수문 차단", "서비스 램프", "야간 경광등"],
    prompt:
      "Yeouido floodwall supply route at night, Korean river embankment, service road, emergency signage, damp concrete logistics mood.",
    credit: "Original SVG collage",
  },
  tollgate: {
    id: "tollgate",
    kind: "checkpoint-scan",
    src: checkpointPolaroid,
    alt: "외곽 톨게이트와 검문 데스크, 화물 목록과 출입증이 동시에 확인되는 장면",
    accent: "#93ff8f",
    mood: "검문과 호송이 겹치는 병목 톨게이트 구간",
    metrics: [
      { label: "차단선", value: "T-04" },
      { label: "검문대", value: "2열" },
      { label: "대기", value: "16m" },
    ],
    callouts: ["화물 목록", "출입증 확인", "통과 수기 기록", "차량 바퀴 소리"],
    prompt:
      "Checkpoint tollgate infographic for Korean outer supply route, manifest scan, barrier arms, route clearance paperwork, no characters.",
    credit: "Original SVG collage",
  },
  market: {
    id: "market",
    kind: "salvage-rack",
    src: rationLineCorridor,
    alt: "교량 아래 시장형 교환소와 수자원, 배터리, 통행권이 나뉘어 놓인 공간",
    accent: "#d7c287",
    mood: "교환과 배급이 뒤섞인 외곽 중계 장터",
    metrics: [
      { label: "교환단위", value: "배터리" },
      { label: "잔여물", value: "12" },
      { label: "소문", value: "증가" },
    ],
    callouts: ["교량 아래 장터", "물통 교환", "배터리 박스", "비공식 통행권"],
    prompt:
      "Under-bridge barter market infographic, Korean post-collapse logistics, battery trade, ration crates, damp signage, civic survival texture.",
    credit: "Original SVG collage",
  },
  relay: {
    id: "relay",
    kind: "deal-board",
    src: checkpointPolaroid,
    alt: "외곽 중계창고에서 화물 재분배와 주민 구호 요청이 같이 적힌 보드",
    accent: "#ff8fa3",
    mood: "정식 접수와 비공식 재분배가 충돌하는 중계창고",
    metrics: [
      { label: "중계창고", value: "R-07" },
      { label: "상자", value: "4개" },
      { label: "대기열", value: "3명" },
    ],
    callouts: ["재분배 요청", "구호 명단", "남는 화물", "경비 교대"],
    prompt:
      "Supply relay board in the outskirts of Yeouido, redistribution ledger, survivor requests, Korean bureaucratic salvage atmosphere.",
    credit: "Original SVG collage",
  },
  sluice: {
    id: "sluice",
    kind: "route-schematic",
    src: heroBackground,
    alt: "수문 경보등과 젖은 서비스 통로, 통과 대기 흐름이 겹친 외곽 수문 구간",
    accent: "#8ec5ff",
    mood: "수문 주기와 경보등이 사람의 속도를 결정하는 외곽 병목 구간",
    metrics: [
      { label: "수문", value: "S-03" },
      { label: "수위", value: "상승" },
      { label: "대기", value: "11m" },
    ],
    callouts: ["수문 경보", "서비스 통로", "젖은 바닥", "점검 주기"],
    prompt:
      "Floodgate checkpoint infographic for Korean survival logistics, wet concrete service corridor, warning beacons, route delay pressure.",
    credit: "Original SVG collage",
  },
  depot: {
    id: "depot",
    kind: "deal-board",
    src: checkpointPolaroid,
    alt: "임시 적치장 팔레트와 봉인 상태표, 누락 화물 메모가 섞인 외곽 집산 도식",
    accent: "#ff8fa3",
    mood: "봉인과 누락이 동시에 계산되는 임시 적치장",
    metrics: [
      { label: "팔레트", value: "6열" },
      { label: "봉인", value: "확인" },
      { label: "잔여", value: "1상자" },
    ],
    callouts: ["적치장 봉인", "팔레트 번호", "누락 메모", "추가 적재 유혹"],
    prompt:
      "Temporary cargo depot collage for Korean post-collapse supply route, pallet seals, inventory notes, administrative logistics tension.",
    credit: "Original SVG collage",
  },
  return: {
    id: "return",
    kind: "checkpoint-scan",
    src: approvalDebtStampSheet,
    alt: "북문 복귀 판정과 공제, 승인, 보류 인장이 적힌 최종 심사 도식",
    accent: "#7df7c5",
    mood: "외곽 보급을 마치고 북문으로 돌아오는 최종 판정 구간",
    metrics: [
      { label: "판정", value: "N-CLEAR" },
      { label: "공제", value: "가능" },
      { label: "보고", value: "필수" },
    ],
    callouts: ["복귀선", "공제 인장", "목격담", "배급 재조정"],
    prompt:
      "Korean checkpoint return sheet for a Yeouido supply route, approval and debt stamps, green scanline, administrative survival finale.",
    credit: "Original SVG collage",
  },
  "ending-clear": {
    id: "ending-clear",
    kind: "ending-seal",
    src: approvalDebtStampSheet,
    alt: "외곽 보급 루트를 성공적으로 완주한 초록 승인 문서",
    accent: "#7df7c5",
    mood: "보급망을 회복시킨 정식 승인 결과",
    metrics: [
      { label: "결과", value: "N-CLEAR" },
      { label: "보급망", value: "복구" },
      { label: "호명", value: "호송 후보" },
    ],
    callouts: ["정식 배차 가능", "복귀 승인", "보급망 복구", "다음 루트 개시"],
    prompt:
      "Approved supply-route ending card, green bureaucratic stamp, Yeouido outer logistics success screen, no celebration, only duty.",
    credit: "Original SVG collage",
  },
  "ending-debt": {
    id: "ending-debt",
    kind: "ending-seal",
    src: approvalDebtStampSheet,
    alt: "공제와 감시가 함께 찍힌 호박색 귀환 결과",
    accent: "#ffcf6e",
    mood: "물자는 살렸지만 공제와 감시가 남은 결과",
    metrics: [
      { label: "결과", value: "A-DEBT" },
      { label: "공제", value: "발생" },
      { label: "후속", value: "재배차" },
    ],
    callouts: ["물자 공제", "감시 태그", "재배차 대기", "조건부 통과"],
    prompt:
      "Amber debt ending card for Korean supply route, conditional approval, cargo deduction, worn official sheet, civic dystopia.",
    credit: "Original SVG collage",
  },
  "ending-quarantine": {
    id: "ending-quarantine",
    kind: "ending-seal",
    src: failureTexture,
    alt: "루트 오염과 격리 보류를 알리는 붉은 실패 결과 카드",
    accent: "#ff7a7a",
    mood: "감염 의심 또는 통행 기록 오류로 격리된 결과",
    metrics: [
      { label: "결과", value: "Q-HOLD" },
      { label: "관찰", value: "48h" },
      { label: "접촉", value: "보류" },
    ],
    callouts: ["격리 대기", "공문 보류", "접촉 추적", "다음 임무 취소"],
    prompt:
      "Quarantine failure ending card, red scanline texture, route contamination warning, Korean administrative survival report.",
    credit: "Original SVG collage",
  },
};
