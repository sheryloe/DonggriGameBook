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

export const PART1_ENDING_ORDER: EndingId[] = [
  "P1_END_SIGNAL_KEEPERS",
  "P1_END_CONTROLLED_PASSAGE",
  "P1_END_SMUGGLER_TIDE",
  "P1_END_ASHEN_ESCAPE",
  "P1_END_MIRROR_WITNESS"
];

export const PART1_ENDINGS: Record<EndingId, EndingDefinition> = {
  P1_END_SIGNAL_KEEPERS: {
    ending_id: "P1_END_SIGNAL_KEEPERS",
    title: "Signal Keepers",
    summary:
      "Kim Ara survives, the relay archive stays intact, and the team leaves with proof that will matter later.",
    hint: "Protect the record, rescue first, and keep the official lock route alive.",
    art_key: "ending_p1_signal_keepers",
    thumb_key: "ending_thumb_p1_signal_keepers",
    carry_flags: carry("P1_END_SIGNAL_KEEPERS", "truth", "rescue", "lock", "clean", 4, true, false)
  },
  P1_END_CONTROLLED_PASSAGE: {
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    title: "Controlled Passage",
    summary:
      "The route remains stable, but the full truth is delayed behind sealed access and controlled release.",
    hint: "Favor order, keep the lane under control, and avoid a full public truth route.",
    art_key: "ending_p1_controlled_passage",
    thumb_key: "ending_thumb_p1_controlled_passage",
    carry_flags: carry("P1_END_CONTROLLED_PASSAGE", "silence", "pragmatic", "lock", "clean", 5, true, false)
  },
  P1_END_SMUGGLER_TIDE: {
    ending_id: "P1_END_SMUGGLER_TIDE",
    title: "Smuggler Tide",
    summary:
      "The team escapes through forged channels and black-water routes, but trust and traceable evidence are lost.",
    hint: "Lean into forged access and bypass routes until the official lane no longer matters.",
    art_key: "ending_p1_smuggler_tide",
    thumb_key: "ending_thumb_p1_smuggler_tide",
    carry_flags: carry("P1_END_SMUGGLER_TIDE", "silence", "pragmatic", "bypass", "forge", 6, false, false)
  },
  P1_END_ASHEN_ESCAPE: {
    ending_id: "P1_END_ASHEN_ESCAPE",
    title: "Ashen Escape",
    summary:
      "The team survives the exit, but the rescue line, proof chain, or key ally collapses before anything lasting can be carried forward.",
    hint: "High strain, failed rescue, or missing evidence will push the run toward collapse.",
    art_key: "ending_p1_ashen_escape",
    thumb_key: "ending_thumb_p1_ashen_escape",
    carry_flags: carry("P1_END_ASHEN_ESCAPE", "silence", "pragmatic", "bypass", "forge", 8, false, false)
  },
  P1_END_MIRROR_WITNESS: {
    ending_id: "P1_END_MIRROR_WITNESS",
    title: "Mirror Witness",
    summary:
      "The full record bundle leaves the center with the team, but the cost is a harder chase and a heavier future burden.",
    hint: "Complete the evidence chain, rescue first, and still take the bypass route at the very end.",
    art_key: "ending_p1_mirror_witness",
    thumb_key: "ending_thumb_p1_mirror_witness",
    carry_flags: carry("P1_END_MIRROR_WITNESS", "truth", "rescue", "bypass", "clean", 7, true, true)
  }
};

export function getPart1EndingDefinition(endingId: EndingId): EndingDefinition {
  return PART1_ENDINGS[endingId];
}
