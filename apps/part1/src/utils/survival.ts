import type { DeadlineConsequenceEvent, GameState, Item, MapNode, TimeBlock } from "../types/game";

export type DeadlineStatus = "active" | "expired" | "resolved";
export type RestKind = "short" | "medical" | "overnight";

export interface SurvivalDeadline {
  questId: string;
  label: string;
  chapterId: string;
  completionEventId: string;
  /**
   * Hours the player gets **after entering this deadline's chapter**.
   *
   * These were absolute clock hours (8/18/22/34/48/60 from the run start), but
   * every choice costs at least an hour and CH01 alone holds 134 choices, so a
   * CH02 side quest reliably expired while the player was still in CH01 — the
   * quest was failed before it could ever be attempted. The budgets below keep
   * the original spacing between deadlines and now start when the chapter does.
   */
  hoursAfterChapterEntry: number;
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
    hoursAfterChapterEntry: 8,
    failFlag: "deadline_ch01_writer_missed",
    failText: "편집자의 구조 신호가 끊겼다.",
    consequence: {
      questId: "qt_ch01_writer",
      chapterId: "CH01",
      title: "구조 신호 소실",
      body: "무전기 안쪽에서 짧은 숨소리가 한 번 끊겼다. 구조 요청은 되돌아오지 않고, 문틈 아래에는 불빛만 남았다.",
      radioLine: "여기 편집실... 대기해 줘... 아니, 늦었어. 발소리가 문 앞까지 왔어.",
      lostOpportunity: "추가 방송 기록과 구조 보정 기회가 사라졌다.",
    },
  },
  {
    questId: "qt_ch02_scan",
    label: "수몰시장 조류 기록",
    chapterId: "CH02",
    completionEventId: "EV_CH02_TIDE_SCAN",
    hoursAfterChapterEntry: 10,
    failFlag: "deadline_ch02_scan_missed",
    failText: "조류 기록이 검은 물에 잠겼다.",
    consequence: {
      questId: "qt_ch02_scan",
      chapterId: "CH02",
      title: "조류 기록 유실",
      body: "시장 바닥의 물이 한 칸 더 차올랐다. 종이에 남아 있던 안전 우회 표식은 물살에 지워졌다.",
      radioLine: "조류표가 없어졌어. 남은 건 발목 아래에서 바뀌는 물결뿐이야.",
      lostOpportunity: "CH02 우회 이동 보정과 일부 안전 선택지가 약해졌다.",
    },
  },
  {
    questId: "qt_ch02_sluice",
    label: "배수문 진단",
    chapterId: "CH02",
    completionEventId: "EV_CH02_SLUICE_DIAGNOSTIC",
    hoursAfterChapterEntry: 14,
    failFlag: "deadline_ch02_sluice_missed",
    failText: "배수문 제어실의 예비 전원이 꺼졌다.",
    consequence: {
      questId: "qt_ch02_sluice",
      chapterId: "CH02",
      title: "배수문 전원 차단",
      body: "제어실 천장에서 마지막 녹색 등이 꺼졌다. 아래쪽 수문은 반쯤 열린 채 멈추고 물결은 거칠게 되돌아왔다.",
      radioLine: "수문 반응이 죽었어. 이제 남은 길은 열린 길보다 닫힌 길이 더 많아.",
      lostOpportunity: "수몰 구역의 안전 배수 루트가 잠겼다.",
    },
  },
  {
    questId: "qt_ch03_rescue",
    label: "유리정원 구조 대기",
    chapterId: "CH03",
    completionEventId: "EV_CH03_RESCUE_DETOUR",
    hoursAfterChapterEntry: 12,
    failFlag: "deadline_ch03_rescue_missed",
    failText: "유리정원 구조 대상이 다른 층으로 끌려갔다.",
    consequence: {
      questId: "qt_ch03_rescue",
      chapterId: "CH03",
      title: "빈 의자",
      body: "상층 대기실에는 체온만 흐릿하게 남았다. 안전줄에 묶여 있던 천 조각이 바람에 흔들리고, 아래층에서는 이름 없는 비명이 짧게 사라졌다.",
      radioLine: "대기 위치가 비었어. 우리가 데려갈 게 아니라, 누군가가 데려간 거야.",
      lostOpportunity: "구조 대상 생존 보정과 일부 증언 루트가 약해졌다.",
    },
  },
  {
    questId: "qt_ch04_vendor",
    label: "분류센터 거래선",
    chapterId: "CH04",
    completionEventId: "EV_CH04_VENDOR_BARTER",
    hoursAfterChapterEntry: 14,
    failFlag: "deadline_ch04_vendor_missed",
    failText: "분류센터 거래자가 물자를 싣고 사라졌다.",
    consequence: {
      questId: "qt_ch04_vendor",
      chapterId: "CH04",
      title: "거래선 이탈",
      body: "컨베이어 옆에 남은 상자는 비어 있었다. 거래자의 표식은 칼로 긁힌 지퍼와 함께 다른 손에 넘어갔다.",
      radioLine: "거래선이 접혔어. 다음부터는 같은 물자를 몇 배로 치러야 할 거야.",
      lostOpportunity: "보호구와 보급 물자 획득 비용이 오른다.",
    },
  },
  {
    questId: "qt_ch05_relay",
    label: "ARC-P 중계 기록",
    chapterId: "CH05",
    completionEventId: "EV_CH05_ARC_RELAY",
    hoursAfterChapterEntry: 12,
    failFlag: "deadline_ch05_relay_missed",
    failText: "ARC-P 중계 기록이 봉인 절차에 들어갔다.",
    consequence: {
      questId: "qt_ch05_relay",
      chapterId: "CH05",
      title: "ARC-P 봉인 개시",
      body: "서버룸 안쪽에서 봉인 알림이 반복됐다. 기록은 아직 그곳에 있지만, 여는 권한은 더 이상 사람의 이름으로 열리지 않는다.",
      radioLine: "중계 기록이 닫히고 있어. 지금 놓치면 진실은 남아도 증언자는 사라져.",
      lostOpportunity: "CH05 진실 공개와 증거 기반 엔딩 판정이 약해진다.",
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

type DeadlineClockState = Pick<GameState, "elapsedHours" | "deadlineFlags" | "completedEvents"> & {
  chapterEnteredAt?: Record<string, number>;
};

/**
 * Absolute hour a deadline fires, measured from when its chapter was entered.
 * A chapter the player has not reached yet has no start time, so its deadlines
 * cannot expire — that is the whole point of the chapter-relative model.
 */
export function deadlineAbsoluteHour(deadline: SurvivalDeadline, state: DeadlineClockState): number | null {
  const enteredAt = state.chapterEnteredAt?.[deadline.chapterId];
  if (enteredAt === undefined) return null;
  return enteredAt + deadline.hoursAfterChapterEntry;
}

export function getDeadlineUrgency(state: DeadlineClockState): SurvivalDeadline | null {
  return PART1_DEADLINES.find((deadline) => {
    if (state.deadlineFlags[deadline.questId] === "expired" || state.deadlineFlags[deadline.questId] === "resolved") return false;
    if (state.completedEvents.includes(deadline.completionEventId)) return false;
    const firesAt = deadlineAbsoluteHour(deadline, state);
    if (firesAt === null) return false;
    const hoursLeft = firesAt - state.elapsedHours;
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
    const firesAt = deadlineAbsoluteHour(deadline, state);
    // A chapter that has not been entered has no clock, so its quests stay open.
    if (firesAt === null) continue;
    if (state.elapsedHours < firesAt || deadlineFlags[deadline.questId] === "expired") continue;

    deadlineFlags[deadline.questId] = "expired";
    flags[deadline.failFlag] = true;
    if (!failedQuestIds.includes(deadline.questId)) failedQuestIds.push(deadline.questId);
    survivalLog.push(`기한 실패: ${deadline.failText}`);
    if (!pendingDeadlineEvent) pendingDeadlineEvent = deadline.consequence;
  }

  return {
    deadlineFlags,
    failedQuestIds,
    flags,
    survivalLog: survivalLog.slice(-30),
    pendingDeadlineEvent,
  };
}

export function describeDeadline(deadline: SurvivalDeadline, elapsedHours: number, chapterEnteredAt?: Record<string, number>): string {
  const enteredAt = chapterEnteredAt?.[deadline.chapterId];
  const firesAt = enteredAt === undefined ? null : enteredAt + deadline.hoursAfterChapterEntry;
  if (firesAt === null) return `${deadline.label} · 챕터 진입 후 ${deadline.hoursAfterChapterEntry}시간`;
  const hoursLeft = Math.max(0, firesAt - elapsedHours);
  return `${deadline.label} · ${hoursLeft}시간 남음`;
}

export function getItemUseEffect(item: Item | undefined): ItemUseEffect | null {
  if (!item) return null;
  let injuryDelta = 0;
  let infectionDelta = 0;
  let contaminationDelta = 0;
  let staminaDelta = 0;
  let mentalDelta = 0;

  for (const effect of item.effects ?? []) {
    const value = Number(effect.value ?? 0);
    if (effect.effect_type === "heal" || effect.effect_type === "modify_stat:hp") injuryDelta -= Math.max(1, value);
    if (effect.effect_type === "reduce_contamination") {
      infectionDelta -= Math.max(1, value);
      contaminationDelta -= Math.max(1, value);
    }
    if (effect.effect_type === "modify_stat:contamination") {
      infectionDelta += value;
      contaminationDelta += value;
    }
    if (effect.effect_type === "restore_stamina") staminaDelta += Math.max(1, value);
    if (effect.effect_type === "restore_mental") mentalDelta += Math.max(1, value);
  }

  const key = `${item.item_id} ${item.name_ko ?? ""} ${item.description ?? ""}`.toLowerCase();
  const tags = item.tags ?? [];
  if (injuryDelta === 0 && (item.category === "consumable" || tags.includes("medical")) && /bandage|first|aid|medical|patch|gel|붕대|응급|처치|진통/u.test(key)) injuryDelta = -12;
  if (infectionDelta === 0 && /disinfect|filter|neutral|wipe|mask|소독|필터|오염/u.test(key)) {
    infectionDelta = -8;
    contaminationDelta = -8;
  }
  if (staminaDelta === 0 && /water|gel|salt|ration|수분|생존|영양/u.test(key)) staminaDelta = 10;

  if (injuryDelta === 0 && infectionDelta === 0 && contaminationDelta === 0 && staminaDelta === 0 && mentalDelta === 0) return null;

  const labels = [
    injuryDelta ? `부상 ${injuryDelta}` : null,
    infectionDelta ? `감염 ${infectionDelta}` : null,
    staminaDelta ? `기력 +${staminaDelta}` : null,
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
  const evidenceReady = Boolean(state.flags.part1_evidence_bundle_complete || state.flags.part1_hidden_evidence_ch05);
  const kimAraAlive = Boolean(state.flags.ch05_kim_ara_alive);
  const evidenceScore = Number(state.stats["p1.evidence"] ?? state.stats.evidence ?? 0) + (evidenceReady ? 2 : 0);
  const controlScore = Number(state.stats["p1.control"] ?? state.stats.control ?? 0);
  const smuggleScore = Number(state.stats["p1.smuggle"] ?? state.stats.underworld ?? 0);
  const signalScore = Number(state.stats["p1.signal"] ?? state.stats.signal ?? 0);
  const commonReasons = [
    `휴식 ${restCount}회, 기한 실패 ${failedCount}건이 최종 판정에 반영됐다.`,
    `최종 부상 ${injury}%, 감염 노출 ${infection}%가 생존 압박으로 계산됐다.`,
  ];

  if (failedCount >= 2 || injury >= 90 || infection >= 90) {
    return {
      endingId: "P1_END_ASHEN_ESCAPE",
      title: "그을린 탈출",
      summary: "사람들은 빠져나왔지만 증거와 이름 일부가 그을린 구역에 남았다.",
      reasons: [...commonReasons, "보급과 판단이 끊기며 여러 기한이 무너졌다.", "최종 기록은 공개보다 생존 우선으로 기울었다."],
    };
  }

  if (evidenceScore >= 2 && kimAraAlive && failedCount === 0) {
    return {
      endingId: "P1_END_MIRROR_WITNESS",
      title: "거울의 증언",
      summary: "미러센터 기록은 꺼지지 않았고, 사라진 이름들이 증언으로 이어졌다.",
      reasons: [...commonReasons, "증거 묶음과 김아라 생존이 진실 공개 조건을 채웠다.", "기한 실패 없이 핵심 기록을 보존했다."],
    };
  }

  if (signalScore >= 2 || restCount <= 2) {
    return {
      endingId: "P1_END_SIGNAL_KEEPERS",
      title: "신호의 수호자",
      summary: "모든 사람을 구하지는 못했지만, 끊긴 송출과 구조 신호가 다시 연결됐다.",
      reasons: [...commonReasons, "중계 신호와 구조 루트를 우선 보존했다.", "과도한 휴식 없이 구조 신호의 시간표를 지켰다."],
    };
  }

  if (smuggleScore >= 2 || restCount >= 3) {
    return {
      endingId: "P1_END_SMUGGLER_TIDE",
      title: "바깥 조류",
      summary: "공식 경로는 닫혔고, 남은 물자와 사람들은 비공식 약속을 따라 살아남았다.",
      reasons: [...commonReasons, "비공식 거래와 우회 경로가 생존을 떠받쳤다.", "여러 번 머문 탓에 다음 날의 지도와 사람 배치가 바뀌었다."],
    };
  }

  if (controlScore >= 2 || state.flags.route_control_locked) {
    return {
      endingId: "P1_END_CONTROLLED_PASSAGE",
      title: "통제된 통로",
      summary: "통로는 열렸지만 명단 밖의 이름들은 끝까지 문 앞에 남았다.",
      reasons: [...commonReasons, "질서와 통제 우선 판단이 최종 판정에 강하게 남았다.", "안정적인 생존 경로를 얻는 대신 공개 증언의 폭은 좁아졌다."],
    };
  }

  return {
    endingId: "P1_END_SIGNAL_KEEPERS",
    title: "신호의 수호자",
    summary: "흩어진 기록과 생존자가 같은 주파수 앞에 다시 모였다.",
    reasons: [...commonReasons, "치명적인 기한 실패 없이 Part 1을 통과했다.", "증거는 부족하지만 신호망은 살아남았다."],
  };
}
