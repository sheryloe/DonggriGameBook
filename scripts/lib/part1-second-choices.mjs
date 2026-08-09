/**
 * The other way through.
 *
 * Twenty-five events in P1 offered exactly one option while still charging the
 * player injury, contamination or noise for it — including all three boss
 * fights, where the entire encounter was a single button whose only effect was
 * setting the escape flag. A danger with one path is not a danger; it is a
 * cutscene that bills you.
 *
 * Each entry adds a second option that spends a different resource and commits
 * to a different route, so the fork feeds the ending system rather than just
 * padding the screen count. The shape is always the same trade: pay more of
 * something to move the ending where you want it. Both options converge on the
 * original `next_event_id`, so no downstream content had to be written.
 *
 * Values in CH04 and CH05 carry the late-chapter weighting (x2 and x3) that
 * keeps the ending in play to the end; see repair-part1-late-weight.mjs.
 */

/** @type {Array<{event: string, choice: object}>} */
export const SECOND_CHOICES = [
  // --- CH01 -----------------------------------------------------------------
  {
    event: "EV_CH01_BOSS_BROADCAST",
    choice: {
      choice_id: "ch01_boss_broadcast_live",
      label: "방송을 켠 채로 편집괴를 계단으로 몬다",
      intent_tags: ["강행", "교신", "노출"],
      effects: [
        { op: "set_flag", target: "flag:chapter_01_escape_ready", value: true },
        { op: "add_stat", target: "noise", value: 3 },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "add_reputation", target: "reputation.record_bureau", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH01_SIGNAL_RELAY_DEFENSE",
    choice: {
      choice_id: "ch01_signal_relay_cut",
      label: "송신기를 끄고 흔적만 지운다",
      intent_tags: ["숨기", "절단", "포기"],
      effects: [
        { op: "sub_stat", target: "noise", value: 2 },
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH01_ARCHIVE_AMBUSH",
    choice: {
      choice_id: "ch01_archive_wade",
      label: "허리까지 잠긴 채 서류함만 끌어낸다",
      intent_tags: ["수색", "단서", "거리 확보"],
      effects: [
        { op: "add_stat", target: "contamination", value: 3 },
        { op: "grant_loot_table", target: "loot:lt_ch01_archive", value: 1 },
        { op: "add_reputation", target: "reputation.under_market", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH01_STAIRWELL_AMBUSH",
    choice: {
      choice_id: "ch01_stairwell_dark",
      label: "불을 끄고 계단참에서 하나씩 처리한다",
      intent_tags: ["숨기", "교전", "봉쇄"],
      effects: [
        { op: "set_flag", target: "flag:ch01_corridor_cleared", value: true },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "sub_stat", target: "noise", value: 1 },
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 1 },
      ],
    },
  },

  // --- CH02 -----------------------------------------------------------------
  {
    event: "EV_CH02_WATERLOGGED_AMBUSH",
    choice: {
      choice_id: "ch02_waterlogged_detour",
      label: "천막을 돌아 물길로 크게 우회한다",
      intent_tags: ["우회", "구조", "거리 확보"],
      effects: [
        { op: "add_stat", target: "contamination", value: 2 },
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH02_SUBMERGED_AMBUSH",
    choice: {
      choice_id: "ch02_submerged_force",
      label: "문을 부수고 소리로 밀어낸다",
      intent_tags: ["강행", "노출", "교전"],
      effects: [
        { op: "add_stat", target: "noise", value: 4 },
        { op: "set_value", target: "route.control", value: "assault" },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH02_GATE_ASSAULT",
    choice: {
      choice_id: "ch02_gate_negotiate",
      label: "통제실 인원과 수문 순번을 협상한다",
      intent_tags: ["협상", "신뢰", "판단"],
      effects: [
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_reputation", target: "reputation.under_market", value: 1 },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH02_PIER_AMBUSH",
    choice: {
      choice_id: "ch02_pier_lit",
      label: "조명을 살려 두고 선착장을 빠르게 훑는다",
      intent_tags: ["수색", "강행", "노출"],
      effects: [
        { op: "set_flag", target: "flag:ch02_pier_cleared", value: true },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 },
        { op: "add_reputation", target: "reputation.under_market", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH02_DROWNED_AMBUSH",
    choice: {
      choice_id: "ch02_drowned_wait",
      label: "물러서서 조수가 빠지기를 기다린다",
      intent_tags: ["관찰", "포기", "구조"],
      effects: [
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "sub_stat", target: "noise", value: 1 },
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 1 },
      ],
    },
  },

  // --- CH03 -----------------------------------------------------------------
  {
    event: "EV_CH03_BOSS_GARDEN",
    choice: {
      choice_id: "ch03_boss_garden_people",
      label: "렌즈를 포기하고 사람부터 끌어낸다",
      intent_tags: ["구조", "포기", "판단"],
      effects: [
        { op: "set_flag", target: "flag:chapter_03_escape_ready", value: true },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_stat", target: "route.compassion_score", value: 1 },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH03_STAIR_AMBUSH",
    choice: {
      choice_id: "ch03_stair_pipe",
      label: "계단을 봉쇄하고 배관로로 돈다",
      intent_tags: ["봉쇄", "우회", "숨기"],
      effects: [
        { op: "add_stat", target: "contamination", value: 2 },
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_reputation", target: "reputation.under_market", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH03_SHOWROOM_AMBUSH",
    choice: {
      choice_id: "ch03_showroom_glass",
      label: "쇼룸 유리를 깨고 단숨에 지난다",
      intent_tags: ["강행", "노출", "교전"],
      effects: [
        { op: "add_stat", target: "noise", value: 4 },
        { op: "set_value", target: "route.control", value: "breach" },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH03_BASEMENT_SURVEY",
    choice: {
      choice_id: "ch03_basement_announce",
      label: "내려가기 전에 위층 사람들에게 알린다",
      intent_tags: ["교신", "신뢰", "관찰"],
      effects: [
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 1 },
      ],
    },
  },
  {
    event: "EV_CH03_SERVICE_SPIRAL",
    choice: {
      choice_id: "ch03_service_request",
      label: "상층 배급 담당에게 정식으로 요청한다",
      intent_tags: ["협상", "판단", "신뢰"],
      effects: [
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH03_UPPER_SECURITY_SWEEP",
    choice: {
      choice_id: "ch03_upper_divert",
      label: "경비를 피해 아래층으로 물자를 돌린다",
      intent_tags: ["숨기", "구조", "우회"],
      effects: [
        { op: "add_stat", target: "injury", value: 2 },
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH03_GARDEN_APPROACH",
    choice: {
      choice_id: "ch03_garden_record",
      label: "기록을 남기고 정원을 열어 둔다",
      intent_tags: ["교신", "단서", "관찰"],
      effects: [
        { op: "add_stat", target: "contamination", value: 2 },
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "add_reputation", target: "reputation.record_bureau", value: 1 },
      ],
    },
  },

  // --- CH04 (late weight x2) ------------------------------------------------
  {
    event: "EV_CH04_BOSS_PICKER",
    choice: {
      choice_id: "ch04_boss_picker_keep_line",
      label: "분류 라인을 살려 두고 물자를 먼저 뺀다",
      intent_tags: ["강행", "판단", "노출"],
      effects: [
        { op: "set_flag", target: "flag:chapter_04_escape_ready", value: true },
        { op: "add_stat", target: "noise", value: 3 },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "set_value", target: "route.control", value: "logistics" },
        { op: "add_stat", target: "route.control_score", value: 2 },
        { op: "add_reputation", target: "reputation.munjeong_logistics", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH04_RAIL_JAM",
    choice: {
      choice_id: "ch04_rail_walk",
      label: "선로를 끊고 걸어서 넘어간다",
      intent_tags: ["절단", "구조", "포기"],
      effects: [
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH04_SECURITY_SWEEP",
    choice: {
      choice_id: "ch04_security_copy",
      label: "보안 기록을 통째로 복사한다",
      intent_tags: ["단서", "교신", "수색"],
      effects: [
        { op: "add_stat", target: "contamination", value: 1 },
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 2 },
        { op: "add_reputation", target: "reputation.record_bureau", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH04_LOADING_AMBUSH",
    choice: {
      choice_id: "ch04_loading_block",
      label: "지게차를 밀어 길을 막고 돌아간다",
      intent_tags: ["봉쇄", "우회", "노출"],
      effects: [
        { op: "add_stat", target: "noise", value: 4 },
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_reputation", target: "reputation.under_market", value: 2 },
      ],
    },
  },
  {
    event: "EV_CH04_LINE_PREP",
    choice: {
      choice_id: "ch04_line_people_first",
      label: "선로보다 사람 배치를 먼저 정한다",
      intent_tags: ["구조", "판단", "신뢰"],
      effects: [
        { op: "set_flag", target: "flag:ch04_line_ready", value: true },
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
      ],
    },
  },

  // --- CH05 (late weight x3) ------------------------------------------------
  {
    event: "EV_CH05_CONTAINMENT_BREACH",
    choice: {
      choice_id: "ch05_breach_bypass",
      label: "격벽을 닫고 우회로를 뚫는다",
      intent_tags: ["봉쇄", "우회", "강행"],
      effects: [
        { op: "add_stat", target: "contamination", value: 3 },
        { op: "add_stat", target: "noise", value: 2 },
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_reputation", target: "reputation.under_market", value: 3 },
      ],
    },
  },
  {
    event: "EV_CH05_COOLING_AMBUSH",
    choice: {
      choice_id: "ch05_cooling_cut_water",
      label: "냉각수를 끊고 열이 오르기 전에 지난다",
      intent_tags: ["절단", "강행", "봉쇄"],
      effects: [
        { op: "add_stat", target: "noise", value: 3 },
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_reputation", target: "reputation.jamsil_upper", value: 3 },
      ],
    },
  },
  {
    event: "EV_CH05_COOLING_BREACH",
    choice: {
      choice_id: "ch05_cooling_topple",
      label: "랙을 넘어뜨려 길을 만든다",
      intent_tags: ["강행", "교전", "노출"],
      effects: [
        { op: "set_flag", target: "flag:ch05_cooling_breach", value: true },
        { op: "add_stat", target: "injury", value: 3 },
        { op: "set_value", target: "route.control", value: "logistics" },
        { op: "add_reputation", target: "reputation.munjeong_logistics", value: 3 },
      ],
    },
  },
  {
    event: "EV_CH05_DATA_SANITIZE",
    choice: {
      choice_id: "ch05_data_photograph",
      label: "드라이브를 두고 목록만 촬영한다",
      intent_tags: ["단서", "교신", "포기"],
      effects: [
        { op: "set_flag", target: "flag:ch05_data_sanitized", value: true },
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 3 },
        { op: "add_reputation", target: "reputation.record_bureau", value: 3 },
      ],
    },
  },
  {
    event: "EV_CH05_COOLING_BREAK",
    choice: {
      choice_id: "ch05_cooling_mark",
      label: "설비실에 표식을 남기고 정면으로 나간다",
      intent_tags: ["교신", "단서", "강행"],
      effects: [
        { op: "set_flag", target: "flag:ch05_cooling_continue", value: true },
        { op: "add_stat", target: "injury", value: 2 },
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_value", target: "route.truth", value: "witness" },
        { op: "add_reputation", target: "reputation.record_bureau", value: 3 },
      ],
    },
  },
];
