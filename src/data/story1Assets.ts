import { AssetSpec } from "../types/story";

const checkpointPolaroid = new URL(
  "../assets/checkpoint-polaroid.svg",
  import.meta.url,
).href;
const dossierPortrait = new URL(
  "../assets/dossier-portrait.svg",
  import.meta.url,
).href;
const heroBackground = new URL(
  "../assets/hero-yeouido-background.svg",
  import.meta.url,
).href;
const rationLineCorridor = new URL(
  "../assets/ration-line-corridor.svg",
  import.meta.url,
).href;
const approvalDebtStampSheet = new URL(
  "../assets/approval-debt-stamp-sheet.svg",
  import.meta.url,
).href;

export const story1Assets: Record<string, AssetSpec> = {
  intake: {
    id: "intake",
    kind: "intake-grid",
    src: dossierPortrait,
    alt: "여의도 안전지대 임시 심사장의 서류 더미와 열감지 격자, 입성 대기선",
    accent: "#f5743a",
    mood: "기록국 질문서와 손등 스탬프가 사람보다 먼저 움직이는 입성 심사 구역",
    metrics: [
      { label: "RB 대기선", value: "43명" },
      { label: "열감지", value: "정상" },
      { label: "등급", value: "TEMP" },
    ],
    callouts: ["RB-ENTRY", "손등 형광 잉크", "상처 은폐 경고", "규칙 방송 반복"],
    prompt:
      "Korean civic-dystopia checkpoint intake board, dossier portrait, thermal scan strips, reused acrylic plate, bureaucratic survival tone.",
    credit: "Original SVG collage",
  },
  "scan-corridor": {
    id: "scan-corridor",
    kind: "intake-grid",
    src: dossierPortrait,
    alt: "열감지 소독 통로와 임시 체류자 동선이 겹쳐진 입장 직후 병목 구간",
    accent: "#f5743a",
    mood: "입성 직후 가장 먼저 사람을 조용하게 만드는 소독 병목 구간",
    metrics: [
      { label: "소독선", value: "QUEUE" },
      { label: "열감지", value: "재확인" },
      { label: "동선", value: "1열" },
    ],
    callouts: ["열감지 프레임", "손목 재확인", "대기열 압박", "임시 스탬프"],
    prompt:
      "Korean checkpoint scan corridor collage, thermal frame, queue numbers, intake bottleneck, bureaucratic survival tone.",
    credit: "Original SVG collage",
  },
  barracks: {
    id: "barracks",
    kind: "sleep-grid",
    src: rationLineCorridor,
    alt: "과밀 숙영동 침상표와 배급 줄, 공지문이 덧붙은 내부 장면",
    accent: "#6fe1bb",
    mood: "침상 번호표와 배급 공제가 사람 관계를 갈라놓는 임시 숙영 구역",
    metrics: [
      { label: "숙영 코드", value: "B-17B" },
      { label: "수용률", value: "132%" },
      { label: "배급등급", value: "R-LOW" },
    ],
    callouts: ["침상번호 봉인", "배급표 펀치", "상처 신고 의무", "온수권 1회"],
    prompt:
      "Overcrowded Korean shelter dormitory dossier, bunk layout, ration queue, taped notices, worn paper records.",
    credit: "Original SVG collage",
  },
  "courtyard-call": {
    id: "courtyard-call",
    kind: "sleep-grid",
    src: rationLineCorridor,
    alt: "숙영동 중정 공지판과 세탁 순번, 배급 대기선이 한데 겹친 생활 압박 화면",
    accent: "#6fe1bb",
    mood: "숙영동 중정에서 공지와 줄이 동시에 사람을 재배치하는 장면",
    metrics: [
      { label: "공지판", value: "ON" },
      { label: "세탁 순번", value: "DUE" },
      { label: "재배정", value: "대기" },
    ],
    callouts: ["중정 호출", "공지문 테이프", "공제표", "세탁 순번"],
    prompt:
      "Korean shelter courtyard notice scene, ration queue, laundry schedule, management bulletin board, civic survival collage.",
    credit: "Original SVG collage",
  },
  "notice-board": {
    id: "notice-board",
    kind: "briefing-tape",
    src: dossierPortrait,
    alt: "배급 공지판과 상처 은폐 의심 문구가 덧붙은 공개 경고 보드",
    accent: "#f2c94c",
    mood: "배급 줄과 공지판이 충돌하며 공개 낙인이 만들어지는 순간",
    metrics: [
      { label: "공지", value: "게시" },
      { label: "낙인", value: "임박" },
      { label: "시선", value: "집중" },
    ],
    callouts: ["상처 은폐 의심", "공제표", "민원 기록", "관리실 덧붙임"],
    prompt:
      "Public ration notice board collage, warning tape, handwritten correction marks, Korean civic survival social pressure.",
    credit: "Original SVG collage",
  },
  briefing: {
    id: "briefing",
    kind: "briefing-tape",
    src: dossierPortrait,
    alt: "지휘표와 위반자 명단, 회수 구역 도식이 겹쳐진 브리핑 벽",
    accent: "#f2c94c",
    mood: "유용한 인력만 바깥으로 내보내는 회수반 브리핑 벽면",
    metrics: [
      { label: "FR 오더", value: "약국 / 전지" },
      { label: "복귀 시각", value: "02:20" },
      { label: "출동조", value: "LN-04" },
    ],
    callouts: ["노동 공헌도", "우회로 지도", "귀환 지연 벌점", "현장 접촉 금지"],
    prompt:
      "Taped command wall for Korean survival sortie, route diagram, debt tags, civic paperwork, yellow warning accents.",
    credit: "Original SVG collage",
  },
  "bridge-lock": {
    id: "bridge-lock",
    kind: "route-schematic",
    src: heroBackground,
    alt: "한강 제방 차단문과 순번표가 겹쳐진 검문 병목 도식",
    accent: "#8ec5ff",
    mood: "제방 차단문에서 순번과 통행증이 다시 사람을 서열화하는 장면",
    metrics: [
      { label: "차단문", value: "LOCK" },
      { label: "순번표", value: "READ" },
      { label: "대기열", value: "LONG" },
    ],
    callouts: ["제방 차단문", "정비용 사다리", "검문 메모", "우회 동선"],
    prompt:
      "Floodwall checkpoint bottleneck collage, Korean route schematic, queue numbers, barrier gate, civic survival pressure.",
    credit: "Original SVG collage",
  },
  shutter: {
    id: "shutter",
    kind: "route-schematic",
    src: rationLineCorridor,
    alt: "반쯤 열린 방화셔터와 소독 통로, 사람들의 병목이 겹친 좁은 경로",
    accent: "#8ec5ff",
    mood: "방송 한 줄과 사람들의 눈빛이 동시에 막아서는 병목 구간",
    metrics: [
      { label: "셔터", value: "S-12" },
      { label: "통과폭", value: "0.7m" },
      { label: "지연", value: "18s" },
    ],
    callouts: ["소독 통로", "정비조 우선", "민원 소리 차단", "대기열 붕괴 위험"],
    prompt:
      "Half-open fire shutter bottleneck in a Korean disaster shelter, disinfectant tunnel, checkpoint lights, tense crowd pressure.",
    credit: "Original SVG collage",
  },
  "rooftop-check": {
    id: "rooftop-check",
    kind: "salvage-rack",
    src: checkpointPolaroid,
    alt: "옥상 점검 중 내려다본 상가 동선과 임시 무전기, 아래층 압박이 동시에 보이는 장면",
    accent: "#ff8fa3",
    mood: "옥상에서 아래층 동선을 다시 훑는 재점검 장면",
    metrics: [
      { label: "옥상", value: "OPEN" },
      { label: "무전", value: "LOCKED" },
      { label: "동선", value: "RECHECK" },
    ],
    callouts: ["난간 점검", "무전기", "아래층 소문", "재분기"],
    prompt:
      "Rooftop route check collage for Korean survival arcade, lookout over interior routes, handheld radio, pressure from below.",
    credit: "Original SVG collage",
  },
  "night-gate": {
    id: "night-gate",
    kind: "route-schematic",
    src: heroBackground,
    alt: "서쪽 게이트 너머로 보이는 여의도 외곽과 한강 제방 경보등",
    accent: "#8ec5ff",
    mood: "규율 안에서만 안전했던 도시가 바깥의 어둠으로 뒤집히는 순간",
    metrics: [
      { label: "차단문", value: "W-03" },
      { label: "시야", value: "24m" },
      { label: "귀환선", value: "N-01" },
    ],
    callouts: ["서쪽 서비스 통로", "교회 봉고차 잔해", "제방 경보등", "무전 공백 14초"],
    prompt:
      "Yeouido west gate at night, Korean checkpoint lights, floodwall access gate, city silhouette, bureaucratic zombie survival mood.",
    credit: "Original SVG collage",
  },
  arcade: {
    id: "arcade",
    kind: "salvage-rack",
    src: checkpointPolaroid,
    alt: "약국 셔터와 편의점 창고, 수기 회수표가 남은 폐상가 내부",
    accent: "#ff8fa3",
    mood: "서울의 생활공간이 아직도 누군가의 회수 경제로 작동하는 상가 구역",
    metrics: [
      { label: "약국 셔터", value: "절반 개방" },
      { label: "전지 박스", value: "4개" },
      { label: "출구 거리", value: "38m" },
    ],
    callouts: ["약국 손글씨 재고표", "편의점 창고", "회수반 낙서", "퇴로 확보 필요"],
    prompt:
      "Abandoned Korean shopping arcade salvage collage, pharmacy shutter, convenience store stockroom, ration economics, documentary texture.",
    credit: "Original SVG collage",
  },
  collapse: {
    id: "collapse",
    kind: "swarm-wave",
    src: checkpointPolaroid,
    alt: "유리 파편과 복도 군집 반응, 셔터 아래 낮은 통로가 교차하는 위기 장면",
    accent: "#ff6d6d",
    mood: "좁은 복도에서 작은 실수가 집단 공포로 번지는 군집 반응 구간",
    metrics: [
      { label: "반응속도", value: "6초" },
      { label: "시야사각", value: "2개" },
      { label: "소리잔향", value: "HIGH" },
    ],
    callouts: ["유리 파편", "셔터 밑 통로", "소방문 우회", "군집 방향 전환"],
    prompt:
      "Narrow corridor swarm alert in Korean zombie survival setting, broken glass, half shutter, red waveform overlay, pressure and panic.",
    credit: "Original SVG collage",
  },
  contact: {
    id: "contact",
    kind: "deal-board",
    src: checkpointPolaroid,
    alt: "재입장 금지 생존자와의 거래 흔적, 손전등 신호와 쪽지가 겹친 접촉 장면",
    accent: "#d7c287",
    mood: "거래와 소문과 재입장 욕망이 뒤엉킨 서비스 복도 접촉 지점",
    metrics: [
      { label: "상대 분류", value: "전 거주민" },
      { label: "교환단위", value: "배터리" },
      { label: "검문 소문", value: "있음" },
    ],
    callouts: ["손전등 2-1 신호", "재입장 금지자", "위조 출입증", "북문 근무조 소문"],
    prompt:
      "Service corridor survivor negotiation in Seoul ruins, forbidden re-entry, flashlight signal, barter note, Korean civic dystopia.",
    credit: "Original SVG collage",
  },
  return: {
    id: "return",
    kind: "checkpoint-scan",
    src: dossierPortrait,
    alt: "북문 검문대의 탐조등과 보고서 스캔, 소문과 증언이 적히는 복귀 판정 장면",
    accent: "#93ff8f",
    mood: "살아 돌아온 것과 통과가 완전히 다른 문제임을 보여주는 복귀 심사",
    metrics: [
      { label: "검문대", value: "N-01" },
      { label: "보고서", value: "목격담 포함" },
      { label: "태그", value: "가변" },
    ],
    callouts: ["N-CLEAR", "A-DEBT", "Q-HOLD", "배급 공제 가능"],
    prompt:
      "Korean checkpoint scanner dossier, witness statements, return judgment, ration debt stamp, green scan light.",
    credit: "Original SVG collage",
  },
  "recheck": {
    id: "recheck",
    kind: "checkpoint-scan",
    src: dossierPortrait,
    alt: "북문 재확인 구역에서 증언 정합성을 다시 확인하는 서류형 검사 패널",
    accent: "#93ff8f",
    mood: "검문보다 느린 재확인 절차가 사람을 다시 줄 세우는 장면",
    metrics: [
      { label: "재확인", value: "WAIT" },
      { label: "목격담", value: "CHECK" },
      { label: "보류", value: "POSSIBLE" },
    ],
    callouts: ["재검토", "증언 정합성", "관리 대상", "공문 보류"],
    prompt:
      "Korean recheck corridor dossier, witness statement verification, green scan, administrative hold, civic survival tone.",
    credit: "Original SVG collage",
  },
  "north-queue": {
    id: "north-queue",
    kind: "checkpoint-scan",
    src: dossierPortrait,
    alt: "북문 대기선에서 순번과 증언이 뒤섞인 귀환 전 대기 구역",
    accent: "#93ff8f",
    mood: "북문 앞 대기선이 복귀 판단을 늦추는 마지막 병목",
    metrics: [
      { label: "대기표", value: "N-01" },
      { label: "증언", value: "STACKED" },
      { label: "순번", value: "DELAY" },
    ],
    callouts: ["대기표", "목격담", "재확인 구역", "조용한 순번"],
    prompt:
      "North gate queue infographic, returning survivor line, Korean checkpoint paperwork, civic survival administrative pressure.",
    credit: "Original SVG collage",
  },
  "ending-clear": {
    id: "ending-clear",
    kind: "ending-seal",
    src: approvalDebtStampSheet,
    alt: "정식 임무 자격 승인 인장과 다음 배치 호출이 적힌 결과 기록",
    accent: "#7df7c5",
    mood: "승인이 곧 더 많은 의무를 뜻하는 초록색 결과 문서",
    metrics: [
      { label: "결과", value: "N-CLEAR" },
      { label: "분류", value: "FR 후보" },
      { label: "잔여 보급", value: "유지" },
    ],
    callouts: ["정식 야간회수 후보", "호출표 갱신", "배치 가능", "승인 인장"],
    prompt:
      "Approved return dossier, green seal, Yeouido skyline, civic survival success screen, duty not celebration.",
    credit: "Original SVG collage",
  },
  "ending-debt": {
    id: "ending-debt",
    kind: "ending-seal",
    src: approvalDebtStampSheet,
    alt: "회수물 공제와 감시 태그, 조건부 통과가 적힌 호박색 결과 문서",
    accent: "#ffcf6e",
    mood: "살아남았지만 우선권과 감시에서 빚을 진 조건부 귀환 기록",
    metrics: [
      { label: "결과", value: "A-DEBT" },
      { label: "공제량", value: "2단위" },
      { label: "후속위험", value: "추적" },
    ],
    callouts: ["조건부 통과", "배급 공제", "호출 우선순위 하락", "감시 태그"],
    prompt:
      "Amber debt-tag result screen, Korean survival bureaucracy, partial approval with penalties, worn dossier paper.",
    credit: "Original SVG collage",
  },
  "ending-quarantine": {
    id: "ending-quarantine",
    kind: "ending-seal",
    src: approvalDebtStampSheet,
    alt: "격리 셔터와 검역 경고가 겹친 실패 결과 화면",
    accent: "#ff7a7a",
    mood: "죽지 않았더라도 질서 밖으로 밀려나는 격리 결과 문서",
    metrics: [
      { label: "결과", value: "Q-HOLD" },
      { label: "관찰시간", value: "48h" },
      { label: "체류상태", value: "보류" },
    ],
    callouts: ["격리동 이송", "접촉 제한", "실패 기록", "승인 보류"],
    prompt:
      "Failure screen with quarantine shutter, scanline noise, Korean dystopian civic paperwork, red alert dossier.",
    credit: "Original SVG collage",
  },
};
