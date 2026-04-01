import { PlayerProfile } from "./playerProfile";
import { AssetSpec, StorySnapshot, StoryState } from "../types/story";

export interface InventoryItem {
  id: string;
  label: string;
  category: string;
  description: string;
  accent: "red" | "olive" | "paper";
  detail: string;
}

export interface SignalEntry {
  id: string;
  label: string;
  note: string;
  tone: "alert" | "safe" | "neutral";
}

function timelineIncludes(snapshot: StorySnapshot, phrase: string) {
  return snapshot.timeline.some((entry) => entry.note.includes(phrase));
}

export function deriveResidentTier(snapshot: StorySnapshot) {
  const nodeId = snapshot.nodeId;
  const startNodeId = snapshot.timeline[0]?.nodeId;

  if (nodeId === "ending-clear") {
    return "정식 야간회수 후보";
  }

  if (nodeId === "ending-debt") {
    return "조건부 체류자";
  }

  if (nodeId === "ending-quarantine") {
    return "격리 관찰대상";
  }

  // Story 2 route: keep this robust even if mid-route node IDs evolve.
  if (startNodeId === "dispatch") {
    if (nodeId === "dispatch") {
      return "배차 대기";
    }

    if (["floodwall", "tollgate", "sluice"].includes(nodeId)) {
      return "외곽 진행";
    }

    if (["market", "relay", "depot"].includes(nodeId)) {
      return "보급 회수";
    }

    if (nodeId === "return") {
      return "복귀 심사중";
    }

    return "외곽 보급 배속";
  }

  if (["intake", "scan-corridor", "barracks", "courtyard-call", "notice-board"].includes(nodeId)) {
    return "임시입주";
  }

  if (["briefing", "shutter", "night-gate", "bridge-lock"].includes(nodeId)) {
    return "출동 대기";
  }

  if (["arcade", "rooftop-check", "collapse", "contact", "north-queue", "recheck"].includes(nodeId)) {
    return "현장회수 임시배속";
  }

  if (nodeId === "return") {
    return "복귀 심사중";
  }

  return "복귀 심사중";
}

export function deriveAlertLevel(state: StoryState) {
  if (state.noise >= 5) {
    return "경계 급상승";
  }

  if (state.supplies <= 2) {
    return "배급 결핍";
  }

  if (state.supplies >= 6 && state.noise <= 2) {
    return "복귀 우세";
  }

  return "상태 유지";
}

export function deriveInventory(
  snapshot: StorySnapshot,
  profile: PlayerProfile,
): InventoryItem[] {
  const items: InventoryItem[] = [
    {
      id: "wristband",
      label: profile.wristband,
      category: "신분",
      description: "손등 형광 잉크와 함께 지급된 임시 입주 손목띠.",
      accent: "paper",
      detail: "검문대에서 가장 먼저 확인하는 표식이다.",
    },
    {
      id: "dossier",
      label: profile.dossierId,
      category: "기록",
      description: "기록국이 발급한 일회용 질의서와 거주 분류 코드.",
      accent: "paper",
      detail: `${profile.role} 이력과 입성 대기열 기록이 묶여 있다.`,
    },
    {
      id: "ration-pack",
      label: "정량 배급팩",
      category: "배급",
      description: "RD 배급대에서 지급한 건빵, 정수정, 온수권.",
      accent: "olive",
      detail: "다음 호출 전까지 체류 자격을 유지하는 최소 단위.",
    },
  ];

  if (snapshot.nodeId !== "intake") {
    items.push({
      id: "gate-map",
      label: "W-03 게이트 맵",
      category: "경로",
      description: "브리핑 벽면에서 뜯어 온 야간 출동 도식.",
      accent: "paper",
      detail: "서쪽 서비스 통로, 방화셔터, 북문 귀환선이 표시돼 있다.",
    });
  }

  if (timelineIncludes(snapshot, "침상 아래")) {
    items.push({
      id: "canned-ration",
      label: "숨겨둔 통조림",
      category: "식량",
      description: "다른 체류자가 남겨 둔 통조림 몇 개를 챙겼다.",
      accent: "olive",
      detail: "배급 줄의 시선이 함께 따라붙는다.",
    });
  }

  if (timelineIncludes(snapshot, "약국") || snapshot.state.supplies >= 5) {
    items.push({
      id: "med-box",
      label: "회수 의약품 상자",
      category: "의약품",
      description: "붕대, 해열제, 주사제 몇 개가 한 묶음으로 봉인돼 있다.",
      accent: "red",
      detail: "복귀 판정에서 가장 높은 값을 받는 회수품이다.",
    });
  }

  if (timelineIncludes(snapshot, "배터리")) {
    items.push({
      id: "battery",
      label: "고용량 배터리",
      category: "전지",
      description: "바깥 생존자와 접촉한 흔적이 남는 귀한 전지 팩.",
      accent: "olive",
      detail: "검문대 질문이 길어질 가능성이 높다.",
    });
  }

  if (timelineIncludes(snapshot, "신분증")) {
    items.push({
      id: "forged-id",
      label: "훔친 출입증",
      category: "위조",
      description: "재입장 불가 태그가 찍힌 외부인의 낡은 신분증.",
      accent: "red",
      detail: "들키면 Q-HOLD 사유로 바로 연결된다.",
    });
  }

  if (timelineIncludes(snapshot, "통로 정보")) {
    items.push({
      id: "memo-route",
      label: "숨은 통로 메모",
      category: "정보",
      description: "한강 제방 서비스 복도와 약국 셔터 우회로가 적힌 쪽지.",
      accent: "paper",
      detail: "공식 지도에는 없는 외부 생존자 경로다.",
    });
  }

  return items;
}

export function deriveSignals(
  asset: AssetSpec,
  snapshot: StorySnapshot,
  profile: PlayerProfile,
): SignalEntry[] {
  const entries: SignalEntry[] = (asset.callouts ?? []).map((callout, index) => ({
    id: `${asset.id}-${index}`,
    label: callout,
    note:
      index === 0
        ? `${profile.callSign} 기준 현재 장면의 주요 표식.`
        : "현장 보고서와 주민 소문이 겹쳐진 비공식 메모.",
    tone: index === 0 ? "safe" : "neutral",
  }));

  if (snapshot.state.noise >= 5) {
    entries.unshift({
      id: "noise-warning",
      label: "증언 누적",
      note: "복귀선에서 네 동선을 기억한 사람이 많아졌다.",
      tone: "alert",
    });
  }

  if (snapshot.state.supplies <= 2) {
    entries.unshift({
      id: "ration-warning",
      label: "배급 공제 우려",
      note: "정량 이하로 돌아오면 숙영 우선권이 밀릴 수 있다.",
      tone: "alert",
    });
  }

  entries.push({
    id: "resident-tier",
    label: deriveResidentTier(snapshot),
    note: "여의도의 질서는 이름보다 등급을 먼저 부른다.",
    tone: "neutral",
  });

  return entries.slice(0, 6);
}
