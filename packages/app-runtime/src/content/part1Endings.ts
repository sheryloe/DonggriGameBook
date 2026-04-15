import type { EndingDefinition, EndingId, PartCarryFlags } from "../types/game";

function carry(
  ending_id: EndingId,
  truth_route: string,
  compassion_route: string,
  control_route: string,
  underworld_route: string,
  strain: number,
  kim_ara_alive: boolean,
  evidence_bundle_complete: boolean
): PartCarryFlags {
  return {
    ending_id,
    truth_route,
    compassion_route,
    control_route,
    underworld_route,
    strain,
    kim_ara_alive,
    evidence_bundle_complete
  };
}

export const PART1_ENDING_ORDER = [
  "P1_END_SIGNAL_KEEPERS",
  "P1_END_CONTROLLED_PASSAGE",
  "P1_END_SMUGGLER_TIDE",
  "P1_END_ASHEN_ESCAPE",
  "P1_END_MIRROR_WITNESS"
] as const satisfies EndingId[];

type Part1EndingId = (typeof PART1_ENDING_ORDER)[number];

export const PART1_ENDINGS: Record<Part1EndingId, EndingDefinition> = {
  P1_END_SIGNAL_KEEPERS: {
    ending_id: "P1_END_SIGNAL_KEEPERS",
    title: "신호 수호자",
    summary:
      "김아라가 살아남고 중계 기록도 보존된다. 팀은 다음 파트까지 흔들 수 있는 증거를 품고 빠져나온다.",
    hint: "기록을 지키고 구조를 우선한 뒤, 공식 잠금 경로를 끝까지 유지해야 한다.",
    art_key: "ending_p1_signal_keepers",
    thumb_key: "ending_thumb_p1_signal_keepers",
    carry_flags: carry("P1_END_SIGNAL_KEEPERS", "truth", "rescue", "lock", "clean", 4, true, false)
  },
  P1_END_CONTROLLED_PASSAGE: {
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    title: "통제된 통로",
    summary:
      "통로는 유지됐지만 전체 진실은 봉인된 접근권 뒤로 밀려난다. 질서를 지킨 대가가 다음 장면의 침묵으로 남는다.",
    hint: "질서를 우선하고 통로를 통제한 채, 전면 공개 루트는 피해야 한다.",
    art_key: "ending_p1_controlled_passage",
    thumb_key: "ending_thumb_p1_controlled_passage",
    carry_flags: carry("P1_END_CONTROLLED_PASSAGE", "silence", "pragmatic", "lock", "clean", 5, true, false)
  },
  P1_END_SMUGGLER_TIDE: {
    ending_id: "P1_END_SMUGGLER_TIDE",
    title: "밀수 조류",
    summary:
      "위조된 통로와 우회 수로로는 살아남지만, 신뢰와 추적 가능한 증거는 대부분 잃는다.",
    hint: "위조 접근과 우회 경로를 끝까지 밀어붙여 공식 라인의 의미를 지워야 한다.",
    art_key: "ending_p1_smuggler_tide",
    thumb_key: "ending_thumb_p1_smuggler_tide",
    carry_flags: carry("P1_END_SMUGGLER_TIDE", "silence", "pragmatic", "bypass", "forge", 6, false, false)
  },
  P1_END_ASHEN_ESCAPE: {
    ending_id: "P1_END_ASHEN_ESCAPE",
    title: "잿빛 탈출",
    summary:
      "간신히 탈출에는 성공하지만 구조선, 증거 사슬, 핵심 동료 중 하나가 무너져 다음 파트로 가져갈 것이 거의 남지 않는다.",
    hint: "부담 수치가 높거나 구조와 증거 확보에 실패하면 이 붕괴 결말로 기울어진다.",
    art_key: "ending_p1_ashen_escape",
    thumb_key: "ending_thumb_p1_ashen_escape",
    carry_flags: carry("P1_END_ASHEN_ESCAPE", "silence", "pragmatic", "bypass", "forge", 8, false, false)
  },
  P1_END_MIRROR_WITNESS: {
    ending_id: "P1_END_MIRROR_WITNESS",
    title: "거울의 증언",
    summary:
      "기록 묶음을 끝까지 들고 나오지만 그 대가로 추적은 더 거세지고, 다음 파트가 감당해야 할 무게도 커진다.",
    hint: "증거 사슬을 완성하고 구조를 우선한 뒤, 마지막에는 우회 회선을 감수해야 한다.",
    art_key: "ending_p1_mirror_witness",
    thumb_key: "ending_thumb_p1_mirror_witness",
    carry_flags: carry("P1_END_MIRROR_WITNESS", "truth", "rescue", "bypass", "clean", 7, true, true)
  }
};

export function getPart1EndingDefinition(endingId: EndingId): EndingDefinition {
  return PART1_ENDINGS[endingId as Part1EndingId];
}
