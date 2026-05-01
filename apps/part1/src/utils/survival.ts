import type { DeadlineConsequenceEvent, GameState, Item, MapNode, TimeBlock } from "../types/game";

export type DeadlineStatus = "active" | "expired" | "resolved";
export type RestKind = "short" | "medical" | "overnight";

export interface SurvivalDeadline {
  questId: string;
  label: string;
  chapterId: string;
  completionEventId: string;
  deadlineHour: number;
  failFlag: string;
  failText: string;
  consequence: DeadlineConsequenceEvent;
}

export interface DeadlineUpdateResult {
  deadlineFlags: Record<string, DeadlineStatus>;
  failedQuestIds: string[];
  flags: Record<string, boolean>;
  survivalLog: string[];
  pendingDeadlineEvent: DeadlineConsequenceEvent | null;
}

export interface ItemUseEffect {
  injuryDelta: number;
  infectionDelta: number;
  contaminationDelta: number;
  staminaDelta: number;
  mentalDelta: number;
  consume: boolean;
  label: string;
}

export interface EndingVerdict {
  endingId: string;
  title: string;
  summary: string;
  reasons: string[];
}

export const TIME_BLOCKS: TimeBlock[] = ["새벽", "오전", "오후", "밤"];

export const PART1_DEADLINES: SurvivalDeadline[] = [
  {
    questId: "qt_ch01_writer",
    label: "편집자 구조 신호",
    chapterId: "CH01",
    completionEventId: "EV_CH01_WRITER_RESCUE",
    deadlineHour: 8,
    failFlag: "deadline_ch01_writer_missed",
    failText: "편집실의 구조 신호가 더 이상 반복되지 않는다.",
    consequence: {
      questId: "qt_ch01_writer",
      chapterId: "CH01",
      title: "편집실 신호 소실",
      body: "무전기 안쪽에서 짧은 숨소리가 한 번 끊겼다. 구조 요청은 더 이상 반복되지 않는다. 문틈 아래로 흘러나오던 불빛도 천천히 죽었다.",
      radioLine: "...여기 편집실... 대기해 줘... 아니, 늦었어. 발소리가 문 앞까지 왔어.",
      lostOpportunity: "편집자 생존 구조와 추가 방송 기록 확보 기회가 사라졌다.",
    },
  },
  {
    questId: "qt_ch02_scan",
    label: "수몰시장 조류 기록",
    chapterId: "CH02",
    completionEventId: "EV_CH02_TIDE_SCAN",
    deadlineHour: 18,
    failFlag: "deadline_ch02_scan_missed",
    failText: "수몰시장 조류 기록이 물에 잠겨 판독 불가 상태가 됐다.",
    consequence: {
      questId: "qt_ch02_scan",
      chapterId: "CH02",
      title: "조류 기록 유실",
      body: "시장 바닥의 물이 낮은 상자를 삼켰다. 젖은 종이 위에 남아 있던 시간표와 잔류 경로는 푸른 잉크가 풀린 물결뿐이다.",
      radioLine: "조류표가 없어졌어. 지금 남은 건 발목을 잡는 물살뿐이야.",
      lostOpportunity: "CH02 우회 이동 안정 보정과 일부 우회 선택지가 약해졌다.",
    },
  },
  {
    questId: "qt_ch02_sluice",
    label: "배수문 진단",
    chapterId: "CH02",
    completionEventId: "EV_CH02_SLUICE_DIAGNOSTIC",
    deadlineHour: 22,
    failFlag: "deadline_ch02_sluice_missed",
    failText: "배수문 제어실의 예비 전원이 끊겼다.",
    consequence: {
      questId: "qt_ch02_sluice",
      chapterId: "CH02",
      title: "배수문 예비 전원 차단",
      body: "제어실 천장에서 마지막 녹색 등이 꺼졌다. 아래쪽 수문은 반쯤 열린 채 멈추고, 물살은 거칠게 되돌아친다.",
      radioLine: "수문 반응이 죽었어. 지금 남은 길은 열리는 길보다 닫힌 길이 더 많아.",
      lostOpportunity: "수몰 구역 안전 배수 루트가 자동으로 폐쇄됐다.",
    },
  },
  {
    questId: "qt_ch03_rescue",
    label: "스카이브리지 구조 대상",
    chapterId: "CH03",
    completionEventId: "EV_CH03_RESCUE_DETOUR",
    deadlineHour: 34,
    failFlag: "deadline_ch03_rescue_missed",
    failText: "스카이브리지 구조 대상이 다른 층으로 끌려갔다.",
    consequence: {
      questId: "qt_ch03_rescue",
      chapterId: "CH03",
      title: "스카이브리지 빈 의자",
      body: "유리 난간 옆 의자에는 체온만 남았다. 안전끈에 묶여 있던 천 조각이 바람에 흔들리고, 아래층에서는 이름 없는 비명이 짧게 사라진다.",
      radioLine: "대상 위치가 비었어. 괴물이 데려간 게 아니야. 우리가 늦은 거야.",
      lostOpportunity: "구조 대상 생존 보정과 일부 증언 루트가 약해졌다.",
    },
  },
  {
    questId: "qt_ch04_vendor",
    label: "분류센터 거래자",
    chapterId: "CH04",
    completionEventId: "EV_CH04_VENDOR_BARTER",
    deadlineHour: 48,
    failFlag: "deadline_ch04_vendor_missed",
    failText: "분류센터 거래자가 물자를 싣고 사라졌다.",
    consequence: {
      questId: "qt_ch04_vendor",
      chapterId: "CH04",
      title: "분류센터 거래자 이탈",
      body: "컨베이어 옆에 남은 상자는 비어 있다. 거래자의 표식은 칼로 긁혀 지워졌고, 남은 물자는 이미 다른 손에 넘어갔다.",
      radioLine: "거래선이 접혔어. 다음부터는 같은 물자를 두 배로 치러야 할 거야.",
      lostOpportunity: "보호구와 회복 물자 확보 비용이 상승했다.",
    },
  },
  {
    questId: "qt_ch05_relay",
    label: "ARC-P 중계 기록",
    chapterId: "CH05",
    completionEventId: "EV_CH05_ARC_RELAY",
    deadlineHour: 60,
    failFlag: "deadline_ch05_relay_missed",
    failText: "ARC-P 중계 기록이 봉인 절차에 들어갔다.",
    consequence: {
      questId: "qt_ch05_relay",
      chapterId: "CH05",
      title: "ARC-P 봉인 절차 개시",
      body: "서버실 안쪽에서 봉인 알림이 반복된다. 기록은 아직 그곳에 있지만, 더 이상 누구의 이름으로도 열리지 않는다.",
      radioLine: "중계 기록이 닫히고 있어. 지금 놓치면 진실은 남아도 증언자는 사라져.",
      lostOpportunity: "CH05 진실 공개와 증거 기반 엔딩 판정이 약해졌다.",
    },
  },
];

export function survivalClockFromElapsedHours(elapsedHours: number): { day: number; timeBlock: TimeBlock } {
  const normalized = Math.max(0, Math.floor(elapsedHours));
  const day = Math.floor(normalized / 24) + 1;
  const hourOfDay = normalized % 24;
  if (hourOfDay < 6) return { day, timeBlock: "새벽" };
  if (hourOfDay < 12) return { day, timeBlock: "오전" };
  if (hourOfDay < 18) return { day, timeBlock: "오후" };
  return { day, timeBlock: "밤" };
}

export function isRestEligibleNode(chapterId: string | null | undefined, node: MapNode | null | undefined): boolean {
  if (!node) return false;
  const tags = node.tags ?? [];
  if (node.node_type === "safehouse") return true;
  if (tags.includes("safe") || tags.includes("hub")) return true;
  return chapterId === "CH01" && node.node_id === "YD-01";
}

export function getDeadlineUrgency(state: Pick<GameState, "elapsedHours" | "deadlineFlags" | "completedEvents">): SurvivalDeadline | null {
  return PART1_DEADLINES.find((deadline) => {
    if (state.deadlineFlags[deadline.questId] === "expired" || state.deadlineFlags[deadline.questId] === "resolved") return false;
    if (state.completedEvents.includes(deadline.completionEventId)) return false;
    const hoursLeft = deadline.deadlineHour - state.elapsedHours;
    return hoursLeft >= 0 && hoursLeft <= 6;
  }) ?? null;
}

export function expireDeadlinesForState(state: GameState): DeadlineUpdateResult {
  const deadlineFlags = { ...state.deadlineFlags };
  const flags = { ...state.flags };
  const failedQuestIds = [...state.failedQuestIds];
  const survivalLog = [...state.survivalLog];
  let pendingDeadlineEvent = state.pendingDeadlineEvent ?? null;

  for (const deadline of PART1_DEADLINES) {
    if (state.completedEvents.includes(deadline.completionEventId)) {
      deadlineFlags[deadline.questId] = "resolved";
      continue;
    }

    if (state.elapsedHours < deadline.deadlineHour || deadlineFlags[deadline.questId] === "expired") {
      continue;
    }

    deadlineFlags[deadline.questId] = "expired";
    flags[deadline.failFlag] = true;
    if (!failedQuestIds.includes(deadline.questId)) {
      failedQuestIds.push(deadline.questId);
    }
    survivalLog.push(`기한 실패: ${deadline.failText}`);
    if (!pendingDeadlineEvent) {
      pendingDeadlineEvent = deadline.consequence;
    }
  }

  return {
    deadlineFlags,
    failedQuestIds,
    flags,
    survivalLog: survivalLog.slice(-30),
    pendingDeadlineEvent,
  };
}

export function describeDeadline(deadline: SurvivalDeadline, elapsedHours: number): string {
  const hoursLeft = Math.max(0, deadline.deadlineHour - elapsedHours);
  return `${deadline.label} · ${hoursLeft}시간 남음`;
}

export function getItemUseEffect(item: Item | undefined): ItemUseEffect | null {
  if (!item) return null;
  const effects = item.effects ?? [];
  let injuryDelta = 0;
  let infectionDelta = 0;
  let contaminationDelta = 0;
  let staminaDelta = 0;
  let mentalDelta = 0;

  for (const effect of effects) {
    const value = Number(effect.value ?? 0);
    switch (effect.effect_type) {
      case "heal":
        injuryDelta -= Math.max(1, value);
        break;
      case "reduce_contamination":
        infectionDelta -= Math.max(1, value);
        contaminationDelta -= Math.max(1, value);
        break;
      case "restore_stamina":
        staminaDelta += Math.max(1, value);
        break;
      case "restore_mental":
        mentalDelta += Math.max(1, value);
        break;
      default:
        if (effect.effect_type === "modify_stat:hp") injuryDelta -= Math.max(1, value);
        if (effect.effect_type === "modify_stat:contamination") {
          infectionDelta += value;
          contaminationDelta += value;
        }
        break;
    }
  }

  const tags = item.tags ?? [];
  const lowerKey = `${item.item_id} ${item.name_ko ?? ""} ${item.description ?? ""}`.toLowerCase();
  if (injuryDelta === 0 && (item.category === "consumable" || tags.includes("medical")) && /bandage|first|aid|medical|patch|gel|붕대|응급|처치|진통/u.test(lowerKey)) injuryDelta = -12;
  if (infectionDelta === 0 && /disinfect|filter|neutral|wipe|mask|소독|필터|오염/u.test(lowerKey)) {
    infectionDelta = -8;
    contaminationDelta = -8;
  }
  if (staminaDelta === 0 && /water|gel|salt|ration|수분|생존|영양/u.test(lowerKey)) staminaDelta = 10;

  if (injuryDelta === 0 && infectionDelta === 0 && contaminationDelta === 0 && staminaDelta === 0 && mentalDelta === 0) return null;

  const labels = [
    injuryDelta ? `부상 ${injuryDelta}` : null,
    infectionDelta ? `감염 ${infectionDelta}` : null,
    staminaDelta ? `체력 +${staminaDelta}` : null,
    mentalDelta ? `정신 +${mentalDelta}` : null,
  ].filter(Boolean);

  return {
    injuryDelta,
    infectionDelta,
    contaminationDelta,
    staminaDelta,
    mentalDelta,
    consume: item.category === "consumable",
    label: labels.join(" / "),
  };
}

export function selectPart1Ending(state: GameState): EndingVerdict {
  const failedCount = state.failedQuestIds.length;
  const injury = Number(state.stats.injury ?? 0);
  const infection = Number(state.stats.infection ?? state.stats.contamination ?? 0);
  const restCount = Number(state.restCount ?? 0);
  const routeTruth = String(state.stats["route.truth"] ?? "");
  const routeCompassion = String(state.stats["route.compassion"] ?? "");
  const routeControl = String(state.stats["route.control"] ?? "");
  const routeUnderworld = String(state.stats["route.underworld"] ?? "");
  const routeStrain = Number(state.stats["route.strain"] ?? 0);
  const evidenceReady = Boolean(state.flags.part1_evidence_bundle_complete || state.flags.part1_hidden_evidence_ch05);
  const kimAraAlive = Boolean(state.flags.ch05_kim_ara_alive);
  const evidenceScore = Number(state.stats["p1.evidence"] ?? state.stats.evidence ?? 0) + (evidenceReady ? 2 : 0);
  const controlScore = Number(state.stats["p1.control"] ?? state.stats.control ?? 0) + (routeControl === "lock" ? 2 : 0);
  const smuggleScore = Number(state.stats["p1.smuggle"] ?? state.stats.underworld ?? 0) + (routeUnderworld === "forge" ? 2 : 0);
  const signalScore = Number(state.stats["p1.signal"] ?? state.stats.signal ?? 0);

  const commonReasons = [
    `휴식 ${restCount}회, 기한 실패 ${failedCount}건이 최종 판정에 반영됐습니다.`,
    `최종 부상 ${injury}%, 감염 위험 ${infection}%가 결말 조건에 반영됐습니다.`,
  ];

  if (failedCount >= 2 || injury >= 90 || infection >= 90) {
    return {
      endingId: "P1_END_ASHEN_ESCAPE",
      title: "잿빛 탈출",
      summary: "여의도에서는 빠져나왔지만, 증거와 사람 일부는 잿빛 구역에 남았습니다.",
      reasons: [...commonReasons, "회복과 판단이 늦어지면서 여러 기한이 무너졌습니다.", "최종 기록은 공개보다 탈출 우선으로 기울었습니다."],
    };
  }

  if (routeTruth === "truth" && routeCompassion === "rescue" && routeControl === "bypass" && evidenceScore >= 2 && kimAraAlive && failedCount === 0) {
    return {
      endingId: "P1_END_MIRROR_WITNESS",
      title: "거울의 증언",
      summary: "미러센터 기록은 꺼지지 않았고, 여의도에 남은 이름들은 증언으로 이어졌습니다.",
      reasons: [...commonReasons, "증거 수집과 김아라 신뢰가 기준치를 넘었습니다.", "기한 실패 없이 핵심 기록을 보존했습니다."],
    };
  }

  if ((routeTruth === "truth" && routeCompassion === "rescue" && routeControl === "lock" && kimAraAlive && routeStrain <= 6) || (signalScore >= 2 && restCount <= 2 && failedCount <= 1)) {
    return {
      endingId: "P1_END_SIGNAL_KEEPERS",
      title: "신호 수호자",
      summary: "모든 사람을 구하진 못했지만, 끊긴 송출과 구조 신호는 다시 연결됐습니다.",
      reasons: [...commonReasons, "신호와 중계 장비를 우선 보존했습니다.", "휴식을 과하게 쓰지 않아 구조 신호의 시간대를 지켰습니다."],
    };
  }

  if ((routeUnderworld === "forge" && routeControl === "bypass") || smuggleScore >= 2 || restCount >= 3) {
    return {
      endingId: "P1_END_SMUGGLER_TIDE",
      title: "밀수 조류",
      summary: "공식 경로는 닫혔고, 남은 물결과 사람들의 비공식 약속이 생존로가 됐습니다.",
      reasons: [...commonReasons, "비공식 거래와 우회 경로의 영향이 커졌습니다.", "여러 번 쉬면서 다음날의 지형과 사람 배치가 바뀌었습니다."],
    };
  }

  if ((routeControl === "lock" && state.flags.ch05_data_first && routeTruth === "silence") || controlScore >= 2 || state.flags.route_control_locked) {
    return {
      endingId: "P1_END_CONTROLLED_PASSAGE",
      title: "통제된 통로",
      summary: "통로는 열렸지만, 명단 밖의 이름들은 끝까지 문 앞에 남았습니다.",
      reasons: [...commonReasons, "통제와 질서 우선 선택이 최종 판정에서 우세했습니다.", "생존 경로는 안정적이지만 공개 증언의 힘은 약해졌습니다."],
    };
  }

  return {
    endingId: "P1_END_SIGNAL_KEEPERS",
    title: "신호 수호자",
    summary: "끊어진 기록과 생존자가 같은 주파수 앞에 다시 모였습니다.",
    reasons: [...commonReasons, "치명적인 기한 실패 없이 Part 1을 통과했습니다.", "결정적인 증거는 부족했지만 신호망은 살아남았습니다."],
  };
}