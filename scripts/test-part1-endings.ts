/**
 * Part 1 ending reachability tests.
 *
 * The previous selector read `p1.evidence`, `p1.control`, `p1.smuggle` and
 * `p1.signal`. No chapter ever writes those keys — the chapters write
 * `route.truth_score` and friends — so all four inputs were permanently zero and
 * the ending came down to how often the player had rested. That also made
 * `P1_END_CONTROLLED_PASSAGE` unreachable, because the two branches above it
 * split on `restCount <= 2` and `restCount >= 3` and between them covered
 * everyone.
 *
 * These tests run the real selector rather than reading its source, so a rename
 * that silently disconnects a lane fails here instead of shipping.
 *
 * Run: npx tsx scripts/test-part1-endings.ts
 */

import { selectPart1Ending } from "../apps/part1/src/utils/survival";
import type { GameState } from "../apps/part1/src/types/game";

type Fixture = {
  stats?: Record<string, number>;
  flags?: Record<string, boolean>;
  failedQuestIds?: string[];
  restCount?: number;
};

function state(fixture: Fixture = {}): GameState {
  return {
    stats: { injury: 10, contamination: 10, ...(fixture.stats ?? {}) },
    flags: fixture.flags ?? {},
    failedQuestIds: fixture.failedQuestIds ?? [],
    restCount: fixture.restCount ?? 1,
  } as unknown as GameState;
}

let passed = 0;
const failures: string[] = [];
function check(label: string, condition: boolean, detail?: string): void {
  if (condition) { passed += 1; return; }
  failures.push(detail ? `${label} — ${detail}` : label);
}

// --- every ending must be reachable -----------------------------------------

const REACH: Array<[string, Fixture]> = [
  ["P1_END_MIRROR_WITNESS", {
    stats: { "route.truth_score": 6, "reputation.record_bureau": 4, "reputation.pangyo_survivors": 2 },
    flags: { part1_hidden_evidence_ch05: true, ch05_kim_ara_alive: true },
  }],
  ["P1_END_SIGNAL_KEEPERS", {
    stats: { "route.compassion_score": 5, "reputation.jamsil_lower": 8, "reputation.pangyo_survivors": 4 },
  }],
  ["P1_END_SMUGGLER_TIDE", {
    stats: { "route.underworld_score": 2, "reputation.under_market": 6 },
  }],
  ["P1_END_CONTROLLED_PASSAGE", {
    stats: { "route.control_score": 6, "reputation.jamsil_upper": 5, "reputation.munjeong_logistics": 5 },
  }],
  ["P1_END_ASHEN_ESCAPE", { failedQuestIds: ["q1", "q2"] }],
];

for (const [expected, fixture] of REACH) {
  const got = selectPart1Ending(state(fixture)).endingId;
  check(`${expected} 도달 가능`, got === expected, `실제로는 ${got}`);
}

// --- the route axes the chapters actually write must matter -------------------

const NEUTRAL: Fixture = { stats: { "reputation.record_bureau": 2, "reputation.under_market": 2 } };
const withTruth = selectPart1Ending(state({ stats: { ...NEUTRAL.stats, "route.truth_score": 7 }, flags: { part1_hidden_evidence_ch05: true, ch05_kim_ara_alive: true } })).endingId;
const withUnderworld = selectPart1Ending(state({ stats: { ...NEUTRAL.stats, "route.underworld_score": 2, "reputation.under_market": 6 } })).endingId;
check("route 점수가 엔딩을 바꾼다", withTruth !== withUnderworld, `둘 다 ${withTruth}`);

// --- reputation must be load-bearing, not decorative -------------------------

const routeOnly = selectPart1Ending(state({ stats: { "route.control_score": 6 } })).endingId;
const routeAndBacking = selectPart1Ending(state({
  stats: { "route.control_score": 6, "reputation.jamsil_upper": 5, "reputation.munjeong_logistics": 5 },
})).endingId;
check(
  "지지 세력이 없으면 노선만으로는 그 엔딩에 닿지 못한다",
  routeOnly !== routeAndBacking,
  `지지 없이도 ${routeOnly}`,
);
check("지지가 붙으면 통제 엔딩에 닿는다", routeAndBacking === "P1_END_CONTROLLED_PASSAGE", `실제로는 ${routeAndBacking}`);

// --- rest count must not decide the ending on its own ------------------------

const rested = selectPart1Ending(state({ restCount: 9, stats: { "route.control_score": 6, "reputation.jamsil_upper": 5, "reputation.munjeong_logistics": 5 } })).endingId;
check("휴식 횟수가 노선 판정을 뒤집지 않는다", rested === "P1_END_CONTROLLED_PASSAGE", `실제로는 ${rested}`);

// --- collapse always wins ----------------------------------------------------

const strong = { "route.truth_score": 7, "reputation.record_bureau": 5, "reputation.pangyo_survivors": 4 };
for (const [label, fixture] of [
  ["기한 2건 실패", { stats: strong, failedQuestIds: ["a", "b"] }],
  ["부상 90", { stats: { ...strong, injury: 90 } }],
  ["감염 90", { stats: { ...strong, contamination: 90 } }],
  ["누적 부담 18", { stats: { ...strong, "route.strain": 18 } }],
] as Array<[string, Fixture]>) {
  const got = selectPart1Ending(state(fixture)).endingId;
  check(`${label} 시 그을린 탈출로 떨어진다`, got === "P1_END_ASHEN_ESCAPE", `실제로는 ${got}`);
}

// --- the selector must be total ----------------------------------------------

const VALID = new Set(REACH.map(([id]) => id));
check("아무 상태도 판정 없이 빠져나가지 않는다", (() => {
  for (let i = 0; i < 400; i += 1) {
    const verdict = selectPart1Ending(state({
      stats: {
        "route.truth_score": (i % 13) - 5,
        "route.compassion_score": (i % 9) - 3,
        "route.control_score": (i % 14) - 7,
        "route.underworld_score": (i % 6) - 3,
        "route.strain": i % 23,
        "reputation.record_bureau": i % 6,
        "reputation.under_market": (i * 3) % 7,
        "reputation.jamsil_lower": (i * 5) % 9,
        "reputation.jamsil_upper": (i * 7) % 6,
        "reputation.munjeong_logistics": (i * 11) % 6,
        "reputation.pangyo_survivors": (i * 13) % 5,
      },
      flags: i % 3 === 0 ? { ch05_kim_ara_alive: true } : {},
      restCount: i % 5,
    }));
    if (!verdict.endingId || !VALID.has(verdict.endingId)) return false;
    if (!verdict.title || !verdict.summary || verdict.reasons.length < 3) return false;
  }
  return true;
})());

// --- and every ending must actually occur across that sweep ------------------

const seen = new Set<string>();
for (let i = 0; i < 400; i += 1) {
  seen.add(selectPart1Ending(state({
    stats: {
      "route.truth_score": (i % 13) - 5,
      "route.compassion_score": (i % 9) - 3,
      "route.control_score": (i % 14) - 7,
      "route.underworld_score": (i % 6) - 3,
      "route.strain": i % 23,
      "reputation.record_bureau": i % 6,
      "reputation.under_market": (i * 3) % 7,
      "reputation.jamsil_lower": (i * 5) % 9,
      "reputation.jamsil_upper": (i * 7) % 6,
      "reputation.munjeong_logistics": (i * 11) % 6,
      "reputation.pangyo_survivors": (i * 13) % 5,
    },
    flags: i % 3 === 0 ? { ch05_kim_ara_alive: true, part1_hidden_evidence_ch05: true } : {},
    restCount: i % 5,
  })).endingId);
}
check(`무작위 상태 400개에서 엔딩 5종이 모두 나온다 (${seen.size}종)`, seen.size === 5, [...seen].join(", "));

console.log(`Part 1 엔딩 테스트: ${passed}건 통과, ${failures.length}건 실패`);
for (const f of failures) console.log(`  실패 — ${f}`);
if (failures.length) process.exitCode = 1;
