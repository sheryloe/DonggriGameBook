import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CHAPTER_DIR = path.join(ROOT, "codex_webgame_pack", "data", "chapters");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function ensureObjective(chapter, objective) {
  chapter.objectives ??= [];
  const existing = chapter.objectives.find((obj) => obj.objective_id === objective.objective_id);
  if (existing) {
    Object.assign(existing, objective);
    return;
  }
  chapter.objectives.push(objective);
}

function ensureQuestTrack(chapter, track) {
  chapter.quest_tracks ??= [];
  const existing = chapter.quest_tracks.find((entry) => entry.quest_track_id === track.quest_track_id);
  if (existing) {
    Object.assign(existing, track);
    return;
  }
  chapter.quest_tracks.push(track);
}

function findEvent(chapter, eventId) {
  const event = chapter.events.find((entry) => entry.event_id === eventId);
  if (!event) {
    throw new Error(`Missing event ${eventId}`);
  }
  return event;
}

function upsertEvent(chapter, event) {
  const index = chapter.events.findIndex((entry) => entry.event_id === event.event_id);
  if (index >= 0) {
    chapter.events[index] = event;
  } else {
    chapter.events.push(event);
  }
}

function ensureCondition(event, condition) {
  event.conditions ??= [];
  if (!event.conditions.includes(condition)) {
    event.conditions.push(condition);
  }
}

function ensureChoiceEffect(choice, effect) {
  choice.effects ??= [];
  if (choice.effects.some((entry) => entry.op === effect.op && entry.target === effect.target)) {
    return;
  }
  choice.effects.push(effect);
}

function updateChoice(event, choiceId, updater) {
  const choice = event.choices.find((entry) => entry.choice_id === choiceId);
  if (!choice) {
    throw new Error(`Missing choice ${choiceId} in ${event.event_id}`);
  }
  updater(choice);
}

function applyCh01(chapter) {
  ensureObjective(chapter, {
    objective_id: "obj_ch01_side_writer",
    text: "편집실 잔류자의 결정을 확인한다.",
    required: false,
    complete_when: ["flag:rescued_writer|flag:left_writer"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch01_side_security",
    text: "편집실 복도의 매복을 정리한다.",
    required: false,
    complete_when: ["flag:ch01_security_cleared"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch01_side_cache",
    text: "침수 캐시를 조사해 장비를 확보한다.",
    required: false,
    complete_when: ["flag:ch01_cache_cleared|flag:ch01_cache_skipped"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch01_side_relay",
    text: "옥상 송신기 릴레이를 복구한다.",
    required: false,
    complete_when: ["flag:ch01_relay_repaired|flag:ch01_relay_bypass"]
  });

  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch01_main",
    kind: "main",
    title: "방송동 증폭기 회수",
    summary: "침수된 방송동에서 장비를 확보하고 귀환한다.",
    entry_event_id: "EV_CH01_BRIEFING",
    completion_event_id: "EV_CH01_EXTRACTION",
    objective_ids: ["obj_ch01_01", "obj_ch01_02", "obj_ch01_03"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch01_writer",
    kind: "side",
    title: "편집실 잔류자",
    summary: "편집실 복도에서 발견된 잔류자의 선택을 정리한다.",
    entry_event_id: "EV_CH01_LOBBY_SEARCH",
    completion_event_id: "EV_CH01_WRITER_RESCUE",
    objective_ids: ["obj_ch01_side_writer"],
    unlock_when: ["flag:ch01_briefing_done"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch01_cache",
    kind: "side",
    title: "침수 캐시",
    summary: "기록국이 요구한 장비 캐시를 찾아낸다.",
    entry_event_id: "EV_CH01_ARCHIVE_DECISION",
    completion_event_id: "EV_CH01_CACHE_SEARCH",
    objective_ids: ["obj_ch01_side_cache"],
    unlock_when: ["flag:ch01_archive_opened|flag:ch01_archive_skipped"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch01_relay",
    kind: "side",
    title: "옥상 릴레이 복구",
    summary: "송신기 릴레이를 복구해 안정적인 송출을 보장한다.",
    entry_event_id: "EV_CH01_POWER_RELAY",
    completion_event_id: "EV_CH01_ROOFTOP_SIGNAL",
    objective_ids: ["obj_ch01_side_relay"],
    unlock_when: ["flag:ch01_security_cleared"]
  });

  const lobby = findEvent(chapter, "EV_CH01_LOBBY_SEARCH");
  updateChoice(lobby, "ch01_lobby_archive", (choice) => {
    ensureChoiceEffect(choice, { op: "set_flag", target: "flag:ch01_route_archive", value: true });
    choice.next_event_id = "EV_CH01_SECURITY_CLEAR";
  });
  updateChoice(lobby, "ch01_lobby_corridor", (choice) => {
    ensureChoiceEffect(choice, { op: "set_flag", target: "flag:ch01_route_writer", value: true });
    choice.next_event_id = "EV_CH01_SECURITY_CLEAR";
  });

  const archive = findEvent(chapter, "EV_CH01_ARCHIVE_DECISION");
  archive.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH01_CACHE_SEARCH";
  });

  const writer = findEvent(chapter, "EV_CH01_WRITER_RESCUE");
  writer.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH01_CACHE_SEARCH";
  });

  const rooftop = findEvent(chapter, "EV_CH01_ROOFTOP_SIGNAL");
  ensureCondition(rooftop, "flag:ch01_relay_repaired|flag:ch01_relay_bypass");

  upsertEvent(chapter, {
    event_id: "EV_CH01_SECURITY_CLEAR",
    event_type: "combat",
    node_id: "YD-04",
    title: "편집실 복도 매복",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_broadcast_lobby",
      music_key: "tension_mid"
    },
    text: {
      summary: "편집실 복도에서 잔당이 길을 막아선다.",
      body: [
        "젖은 전선이 스파크를 튀기고, 복도 끝에서 금속 긁는 소리가 가까워진다.",
        "지금 정리하지 않으면 자료실과 옥상 모두 접근이 막힐 것이다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    combat: {
      encounter_table_id: "enc_ch01_archive_medium",
      arena_tags: ["corridor", "lowlight"],
      victory_effects: [{ op: "set_flag", target: "flag:ch01_security_cleared", value: true }],
      defeat_effects: [
        { op: "add_stat", target: "contamination", value: 10 },
        { op: "sub_stat", target: "hp", value: 20 }
      ]
    },
    choices: [
      {
        choice_id: "ch01_security_to_archive",
        label: "자료실로 밀어붙인다",
        conditions: ["flag:ch01_route_archive"],
        preview: "침수 자료실을 먼저 확보한다.",
        effects: [],
        next_event_id: "EV_CH01_ARCHIVE_DECISION"
      },
      {
        choice_id: "ch01_security_to_writer",
        label: "편집실로 우회한다",
        conditions: ["flag:ch01_route_writer"],
        preview: "잔류자를 먼저 확인한다.",
        effects: [],
        next_event_id: "EV_CH01_WRITER_RESCUE"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH01_CACHE_SEARCH",
    event_type: "exploration",
    node_id: "YD-05",
    title: "침수 캐시 조사",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_archive_flooded",
      music_key: "water_dread"
    },
    text: {
      summary: "물에 잠긴 캐비닛에서 남은 장비를 찾는다.",
      body: [
        "방수 포장된 상자들이 물때 속에서 반짝인다.",
        "지금 챙기면 도움이 되지만, 시간과 소음이 늘어난다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch01_archive"],
    choices: [
      {
        choice_id: "ch01_cache_open",
        label: "캐비닛을 연다",
        conditions: [],
        preview: "장비를 확보하지만 위험이 늘어난다.",
        effects: [
          { op: "set_flag", target: "flag:ch01_cache_cleared", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch01_archive", value: 1 },
          { op: "add_stat", target: "contamination", value: 2 }
        ],
        next_event_id: "EV_CH01_POWER_RELAY"
      },
      {
        choice_id: "ch01_cache_skip",
        label: "시간을 아낀다",
        conditions: [],
        preview: "바로 옥상으로 향한다.",
        effects: [{ op: "set_flag", target: "flag:ch01_cache_skipped", value: true }],
        next_event_id: "EV_CH01_POWER_RELAY"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH01_POWER_RELAY",
    event_type: "choice",
    node_id: "YD-07",
    title: "송신기 릴레이 복구",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_rooftop_signal",
      music_key: "signal_hiss"
    },
    text: {
      summary: "송신기 릴레이가 녹과 습기에 잠겨 있다.",
      body: [
        "정상 수리를 하면 안정적이지만 시간이 더 든다.",
        "바이패스는 빠르지만 소음과 위험이 따른다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch01_relay_repair",
        label: "정상 수리",
        conditions: [],
        preview: "시간은 들지만 안정적이다.",
        effects: [
          { op: "set_flag", target: "flag:ch01_relay_repaired", value: true },
          { op: "add_stat", target: "noise", value: 1 },
          { op: "add_stat", target: "contamination", value: 1 }
        ],
        next_event_id: "EV_CH01_ROOFTOP_SIGNAL"
      },
      {
        choice_id: "ch01_relay_bypass",
        label: "임시 바이패스",
        conditions: [],
        preview: "빠르지만 소음이 커진다.",
        effects: [
          { op: "set_flag", target: "flag:ch01_relay_bypass", value: true },
          { op: "add_stat", target: "noise", value: 3 }
        ],
        next_event_id: "EV_CH01_ROOFTOP_SIGNAL"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  return chapter;
}

function applyCh02(chapter) {
  ensureObjective(chapter, {
    objective_id: "obj_ch02_side_scan",
    text: "수위 스캔으로 안전한 진입로를 확보한다.",
    required: false,
    complete_when: ["flag:ch02_tide_scan_done"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch02_side_ambush",
    text: "침수 구역 매복을 정리한다.",
    required: false,
    complete_when: ["flag:ch02_ambush_cleared"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch02_side_sluice",
    text: "배수문 제어실 진입을 확보한다.",
    required: false,
    complete_when: ["flag:ch02_sluice_access|flag:ch02_sluice_override"]
  });

  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch02_main",
    kind: "main",
    title: "강변 중계배터리 확보",
    summary: "수몰시장과 배수문을 돌파해 배터리와 지도를 확보한다.",
    entry_event_id: "EV_CH02_ENTRY",
    completion_event_id: "EV_CH02_EXTRACTION",
    objective_ids: ["obj_ch02_01", "obj_ch02_02", "obj_ch02_03"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch02_scan",
    kind: "side",
    title: "수위 스캔",
    summary: "침수 구간의 흐름을 파악해 위험을 줄인다.",
    entry_event_id: "EV_CH02_MARKET_SWEEP",
    completion_event_id: "EV_CH02_TIDE_SCAN",
    objective_ids: ["obj_ch02_side_scan"],
    unlock_when: ["flag:ch02_started"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch02_sluice",
    kind: "side",
    title: "배수문 진입",
    summary: "배수문 제어실을 열어 보스전에 대비한다.",
    entry_event_id: "EV_CH02_PIER_BARGAIN",
    completion_event_id: "EV_CH02_SLUICE_DIAGNOSTIC",
    objective_ids: ["obj_ch02_side_sluice"],
    unlock_when: ["flag:ch02_boat_route|flag:ch02_land_route"]
  });

  const market = findEvent(chapter, "EV_CH02_MARKET_SWEEP");
  updateChoice(market, "ch02_market_storage", (choice) => {
    ensureChoiceEffect(choice, { op: "set_flag", target: "flag:ch02_route_cold", value: true });
    choice.next_event_id = "EV_CH02_TIDE_SCAN";
  });
  updateChoice(market, "ch02_market_tents", (choice) => {
    ensureChoiceEffect(choice, { op: "set_flag", target: "flag:ch02_route_blackmarket", value: true });
    choice.next_event_id = "EV_CH02_TIDE_SCAN";
  });

  const cold = findEvent(chapter, "EV_CH02_COLD_STORAGE");
  cold.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH02_DROWNED_AMBUSH";
  });

  const blackmarket = findEvent(chapter, "EV_CH02_BLACKMARKET");
  blackmarket.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH02_DROWNED_AMBUSH";
  });

  const pier = findEvent(chapter, "EV_CH02_PIER_BARGAIN");
  pier.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH02_SLUICE_DIAGNOSTIC";
  });

  upsertEvent(chapter, {
    event_id: "EV_CH02_TIDE_SCAN",
    event_type: "exploration",
    node_id: "NR-02",
    title: "수위 스캔",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_noryangjin_market",
      music_key: "market_dread"
    },
    text: {
      summary: "침수 구간의 흐름을 스캔해 진입로를 선택한다.",
      body: [
        "수면 아래로 떠다니는 잔해가 경로를 바꾸고 있다.",
        "지금 스캔하면 위험을 줄일 수 있지만 시간이 필요하다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch02_market_water"],
    choices: [
      {
        choice_id: "ch02_scan_cold",
        label: "냉동창고 쪽 수면을 훑는다",
        conditions: ["flag:ch02_route_cold"],
        preview: "차가운 흐름을 읽어 통로를 만든다.",
        effects: [
          { op: "set_flag", target: "flag:ch02_tide_scan_done", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 },
          { op: "add_stat", target: "contamination", value: 2 }
        ],
        next_event_id: "EV_CH02_COLD_STORAGE"
      },
      {
        choice_id: "ch02_scan_blackmarket",
        label: "암시장 천막 주변을 스캔한다",
        conditions: ["flag:ch02_route_blackmarket"],
        preview: "얕은 통로를 찾는다.",
        effects: [
          { op: "set_flag", target: "flag:ch02_tide_scan_done", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 },
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH02_BLACKMARKET"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH02_DROWNED_AMBUSH",
    event_type: "combat",
    node_id: "NR-05",
    title: "침수 매복",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_cold_storage",
      music_key: "under_market"
    },
    text: {
      summary: "수면 아래에서 매복한 무리가 돌진한다.",
      body: [
        "물살이 갑자기 멈추고, 썩은 금속 냄새가 치밀어 오른다.",
        "이 구간을 통과하려면 먼저 길을 확보해야 한다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch02_market_water"],
    combat: {
      encounter_table_id: "enc_ch02_water_market",
      arena_tags: ["flooded", "pier"],
      victory_effects: [
        { op: "set_flag", target: "flag:ch02_ambush_cleared", value: true },
        { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 }
      ],
      defeat_effects: [
        { op: "add_stat", target: "contamination", value: 12 },
        { op: "sub_stat", target: "hp", value: 25 }
      ]
    },
    choices: [
      {
        choice_id: "ch02_ambush_push",
        label: "잔해를 치우고 전진한다",
        conditions: [],
        preview: "배수문 쪽으로 이동한다.",
        effects: [],
        next_event_id: "EV_CH02_PIER_BARGAIN"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH02_SLUICE_DIAGNOSTIC",
    event_type: "choice",
    node_id: "NR-06",
    title: "배수문 점검",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_dongjak_culvert",
      music_key: "tension_mid"
    },
    text: {
      summary: "제어실 전원을 정리해 배수문을 열 준비를 한다.",
      body: [
        "패널이 녹슬어 있고, 안전핀이 대부분 부러져 있다.",
        "지금 선택에 따라 보스전 리스크가 달라진다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch02_sluice_reset",
        label: "동력 리셋",
        conditions: [],
        preview: "안정성을 확보하지만 시간이 든다.",
        effects: [
          { op: "set_flag", target: "flag:ch02_sluice_access", value: true },
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH02_SLUICE_BOSS"
      },
      {
        choice_id: "ch02_sluice_bypass",
        label: "우회 회로 열기",
        conditions: [],
        preview: "빠르지만 위험이 늘어난다.",
        effects: [
          { op: "set_flag", target: "flag:ch02_sluice_override", value: true },
          { op: "add_stat", target: "contamination", value: 2 }
        ],
        next_event_id: "EV_CH02_SLUICE_BOSS"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  return chapter;
}

function applyCh03(chapter) {
  ensureObjective(chapter, {
    objective_id: "obj_ch03_side_ambush",
    text: "계단실 매복을 정리한다.",
    required: false,
    complete_when: ["flag:ch03_stair_cleared"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch03_side_blackout",
    text: "정전 구간을 복구하거나 우회한다.",
    required: false,
    complete_when: ["flag:ch03_blackout_fixed|flag:ch03_blackout_bypass|flag:ch03_blackout_skipped"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch03_side_rescue",
    text: "스카이브리지 구조 요청을 처리한다.",
    required: false,
    complete_when: ["flag:ch03_rescue_complete|flag:ch03_rescue_marked"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch03_side_prep",
    text: "보스전에 앞서 장비를 정비한다.",
    required: false,
    complete_when: ["flag:ch03_prep_done|flag:ch03_prep_rushed"]
  });

  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch03_main",
    kind: "main",
    title: "유리정원 돌파",
    summary: "상층 갈등을 정리하고 릴레이 렌즈를 확보한다.",
    entry_event_id: "EV_CH03_ENTRY",
    completion_event_id: "EV_CH03_EXTRACTION",
    objective_ids: ["obj_ch03_01", "obj_ch03_02", "obj_ch03_03"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch03_power",
    kind: "side",
    title: "전력 안정화",
    summary: "정전 구간을 정리해 협상 조건을 만든다.",
    entry_event_id: "EV_CH03_POWER_ROUTING",
    completion_event_id: "EV_CH03_BLACKOUT_REPAIR",
    objective_ids: ["obj_ch03_side_blackout"],
    unlock_when: ["flag:ch03_elevator_powered|flag:ch03_water_to_lower|flag:ch03_power_to_upper"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch03_rescue",
    kind: "side",
    title: "구조 신호",
    summary: "스카이브리지의 구조 요청을 처리한다.",
    entry_event_id: "EV_CH03_SKYBRIDGE",
    completion_event_id: "EV_CH03_RESCUE_DETOUR",
    objective_ids: ["obj_ch03_side_rescue"],
    unlock_when: ["flag:ch03_rescue_signal"]
  });

  const vertical = findEvent(chapter, "EV_CH03_VERTICAL_ROUTE");
  vertical.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH03_STAIR_AMBUSH";
  });

  const power = findEvent(chapter, "EV_CH03_POWER_ROUTING");
  power.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH03_BLACKOUT_REPAIR";
  });

  const sky = findEvent(chapter, "EV_CH03_SKYBRIDGE");
  updateChoice(sky, "ch03_bridge_signal", (choice) => {
    choice.next_event_id = "EV_CH03_RESCUE_DETOUR";
  });
  updateChoice(sky, "ch03_bridge_silent", (choice) => {
    choice.next_event_id = "EV_CH03_GLASS_PREP";
  });

  upsertEvent(chapter, {
    event_id: "EV_CH03_STAIR_AMBUSH",
    event_type: "combat",
    node_id: "JS-03",
    title: "계단실 매복",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_service_stair",
      music_key: "tension_mid"
    },
    text: {
      summary: "유리 파편이 쏟아지며 매복이 시작된다.",
      body: [
        "계단실 벽면이 금 간 채 흔들리고, 균열 사이로 적들이 밀려든다.",
        "이 구간을 정리해야 쇼룸으로 올라갈 수 있다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    combat: {
      encounter_table_id: "enc_ch03_tower_mid",
      arena_tags: ["stairwell", "glass"],
      victory_effects: [{ op: "set_flag", target: "flag:ch03_stair_cleared", value: true }],
      defeat_effects: [
        { op: "add_stat", target: "contamination", value: 8 },
        { op: "sub_stat", target: "hp", value: 18 }
      ]
    },
    choices: [
      {
        choice_id: "ch03_stair_continue",
        label: "상층으로 이동한다",
        conditions: [],
        preview: "쇼룸으로 진입한다.",
        effects: [],
        next_event_id: "EV_CH03_SHOWROOM_SWEEP"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH03_BLACKOUT_REPAIR",
    event_type: "choice",
    node_id: "JS-05",
    title: "정전 복구",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_power_room",
      music_key: "tension_mid"
    },
    text: {
      summary: "전력 분기에서 순간 정전이 발생한다.",
      body: [
        "스위치가 튀며 통로가 암전된다.",
        "이대로 두면 협상 구역에서 더 큰 난리가 난다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch03_blackout_fix",
        label: "차단기 재정렬",
        conditions: [],
        preview: "안정적으로 전력을 복구한다.",
        effects: [
          { op: "set_flag", target: "flag:ch03_blackout_fixed", value: true },
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH03_UPPER_NEGOTIATION"
      },
      {
        choice_id: "ch03_blackout_bypass",
        label: "우회 전원",
        conditions: [],
        preview: "빠르지만 위험하다.",
        effects: [
          { op: "set_flag", target: "flag:ch03_blackout_bypass", value: true },
          { op: "add_stat", target: "contamination", value: 2 }
        ],
        next_event_id: "EV_CH03_UPPER_NEGOTIATION"
      },
      {
        choice_id: "ch03_blackout_skip",
        label: "강행한다",
        conditions: [],
        preview: "협상 리스크를 감수한다.",
        effects: [
          { op: "set_flag", target: "flag:ch03_blackout_skipped", value: true },
          { op: "add_stat", target: "noise", value: 2 }
        ],
        next_event_id: "EV_CH03_UPPER_NEGOTIATION"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH03_RESCUE_DETOUR",
    event_type: "exploration",
    node_id: "JS-07",
    title: "구조 신호 응답",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_skybridge",
      music_key: "tension_low"
    },
    text: {
      summary: "스카이브리지 끝에서 구조 요청이 다시 들린다.",
      body: [
        "유리 난간 너머에서 사람 그림자가 흔들린다.",
        "지금 구조하면 보상은 얻지만 보스 진입이 늦어진다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch03_upper_luxury"],
    choices: [
      {
        choice_id: "ch03_rescue_help",
        label: "구조한다",
        conditions: [],
        preview: "추가 보급을 얻는다.",
        effects: [
          { op: "set_flag", target: "flag:ch03_rescue_complete", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch03_upper_luxury", value: 1 }
        ],
        next_event_id: "EV_CH03_GLASS_PREP"
      },
      {
        choice_id: "ch03_rescue_mark",
        label: "신호만 남긴다",
        conditions: [],
        preview: "시간을 아끼지만 마음이 무겁다.",
        effects: [{ op: "set_flag", target: "flag:ch03_rescue_marked", value: true }],
        next_event_id: "EV_CH03_GLASS_PREP"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH03_GLASS_PREP",
    event_type: "dialogue",
    node_id: "JS-08",
    title: "보스전 준비",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_rooftop_escape",
      music_key: "tension_mid"
    },
    text: {
      summary: "유리정원 진입 전 마지막 점검을 한다.",
      body: [
        "바람이 거세고, 유리 파편이 발밑을 긁는다.",
        "준비를 끝내면 곧바로 보스 구역으로 들어가야 한다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch03_prep_done",
        label: "장비 재정비",
        conditions: [],
        preview: "체력을 회복한다.",
        effects: [
          { op: "set_flag", target: "flag:ch03_prep_done", value: true },
          { op: "add_stat", target: "hp", value: 5 }
        ],
        next_event_id: "EV_CH03_BOSS_GARDEN"
      },
      {
        choice_id: "ch03_prep_rush",
        label: "곧장 진입",
        conditions: [],
        preview: "속도를 택한다.",
        effects: [
          { op: "set_flag", target: "flag:ch03_prep_rushed", value: true },
          { op: "add_stat", target: "noise", value: 2 }
        ],
        next_event_id: "EV_CH03_BOSS_GARDEN"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  return chapter;
}

function applyCh04(chapter) {
  ensureObjective(chapter, {
    objective_id: "obj_ch04_side_vendor",
    text: "현장 상인의 거래를 정리한다.",
    required: false,
    complete_when: ["flag:ch04_vendor_trade|flag:ch04_vendor_skip"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch04_side_jam",
    text: "철도 인계장의 장애를 제거한다.",
    required: false,
    complete_when: ["flag:ch04_rail_jam_cleared"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch04_side_repair",
    text: "라인 전원을 안정화한다.",
    required: false,
    complete_when: ["flag:ch04_line_repair_on|flag:ch04_line_repair_bypass"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch04_side_cache",
    text: "배송 터널 캐시를 확인한다.",
    required: false,
    complete_when: ["flag:ch04_tunnel_cache|flag:ch04_tunnel_skip"]
  });

  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch04_main",
    kind: "main",
    title: "상자들의 도시 돌파",
    summary: "보안 배지와 진입권을 확보해 판교로 향한다.",
    entry_event_id: "EV_CH04_ENTRY",
    completion_event_id: "EV_CH04_EXTRACTION",
    objective_ids: ["obj_ch04_01", "obj_ch04_02", "obj_ch04_03"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch04_vendor",
    kind: "side",
    title: "현장 거래",
    summary: "물자와 정보를 교환해 위험을 낮춘다.",
    entry_event_id: "EV_CH04_LOBBY_MEET",
    completion_event_id: "EV_CH04_VENDOR_BARTER",
    objective_ids: ["obj_ch04_side_vendor"],
    unlock_when: ["flag:ch04_started"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch04_cache",
    kind: "side",
    title: "터널 캐시",
    summary: "배송 터널의 보급 캐시를 확보한다.",
    entry_event_id: "EV_CH04_LINE_DECISION",
    completion_event_id: "EV_CH04_TUNNEL_CACHE",
    objective_ids: ["obj_ch04_side_cache"],
    unlock_when: ["flag:ch04_line_on|flag:ch04_line_off"]
  });

  const lobby = findEvent(chapter, "EV_CH04_LOBBY_MEET");
  lobby.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH04_VENDOR_BARTER";
  });

  const route = findEvent(chapter, "EV_CH04_ROUTE_SELECTION");
  route.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH04_RAIL_JAM";
  });

  const badges = findEvent(chapter, "EV_CH04_SECURITY_BADGES");
  badges.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH04_LINE_REPAIR";
  });

  const line = findEvent(chapter, "EV_CH04_LINE_DECISION");
  line.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH04_TUNNEL_CACHE";
  });

  upsertEvent(chapter, {
    event_id: "EV_CH04_VENDOR_BARTER",
    event_type: "dialogue",
    node_id: "MJ-03",
    title: "현장 거래",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "portrait_han_somyeong",
      music_key: "warehouse_safe"
    },
    text: {
      summary: "현장 상인이 장비 교환을 제안한다.",
      body: [
        "남은 물자를 교환하면 정보와 보급을 얻을 수 있다.",
        "거절하면 시간을 아끼지만 준비가 부족해진다."
      ]
    },
    npc_ids: ["npc_han_somyeong"],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch04_vendor_trade",
        label: "거래한다",
        conditions: [],
        preview: "보급을 얻고 정보를 확보한다.",
        effects: [
          { op: "set_flag", target: "flag:ch04_vendor_trade", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch04_logistics", value: 1 }
        ],
        next_event_id: "EV_CH04_ROUTE_SELECTION"
      },
      {
        choice_id: "ch04_vendor_skip",
        label: "거절한다",
        conditions: [],
        preview: "시간을 아끼고 바로 이동한다.",
        effects: [{ op: "set_flag", target: "flag:ch04_vendor_skip", value: true }],
        next_event_id: "EV_CH04_ROUTE_SELECTION"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH04_RAIL_JAM",
    event_type: "combat",
    node_id: "MJ-04",
    title: "레일 장애 제거",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_rail_transfer",
      music_key: "industrial_tension"
    },
    text: {
      summary: "레일 인계장에 잔해와 적이 얽혀 있다.",
      body: [
        "레일을 복구하려면 먼저 이 구간을 정리해야 한다.",
        "전투 소음이 전체 라인으로 번질 수 있다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch04_logistics"],
    combat: {
      encounter_table_id: "enc_ch04_logistics_floor",
      arena_tags: ["rails", "cargo"],
      victory_effects: [
        { op: "set_flag", target: "flag:ch04_rail_jam_cleared", value: true },
        { op: "grant_loot_table", target: "loot:lt_ch04_logistics", value: 1 }
      ],
      defeat_effects: [
        { op: "add_stat", target: "contamination", value: 10 },
        { op: "sub_stat", target: "hp", value: 22 }
      ]
    },
    choices: [
      {
        choice_id: "ch04_rail_continue",
        label: "보안 사무실로 이동",
        conditions: [],
        preview: "배지를 확보한다.",
        effects: [],
        next_event_id: "EV_CH04_SECURITY_BADGES"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH04_LINE_REPAIR",
    event_type: "choice",
    node_id: "MJ-05",
    title: "라인 전원 복구",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_sorting_hall",
      music_key: "printer_static"
    },
    text: {
      summary: "분류 라인을 재가동해 이동로를 확보한다.",
      body: ["제어 패널이 불안정해 복구 방식에 따라 리스크가 달라진다."]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch04_line_repair_on",
        label: "전원을 안정화한다",
        conditions: [],
        preview: "안정적이지만 시간이 든다.",
        effects: [
          { op: "set_flag", target: "flag:ch04_line_repair_on", value: true },
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH04_LINE_DECISION"
      },
      {
        choice_id: "ch04_line_repair_bypass",
        label: "부분 우회한다",
        conditions: [],
        preview: "빠르지만 흔적이 남는다.",
        effects: [
          { op: "set_flag", target: "flag:ch04_line_repair_bypass", value: true },
          { op: "add_stat", target: "contamination", value: 2 }
        ],
        next_event_id: "EV_CH04_LINE_DECISION"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH04_TUNNEL_CACHE",
    event_type: "exploration",
    node_id: "MJ-07",
    title: "배송 터널 캐시",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_delivery_tunnel",
      music_key: "industrial_low"
    },
    text: {
      summary: "터널 끝에서 비상 보급 캐시를 발견한다.",
      body: ["지금 챙기면 보스전에 도움이 되지만 시간은 늘어난다."]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch04_logistics"],
    choices: [
      {
        choice_id: "ch04_cache_open",
        label: "캐시를 연다",
        conditions: [],
        preview: "보급을 확보한다.",
        effects: [
          { op: "set_flag", target: "flag:ch04_tunnel_cache", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch04_logistics", value: 1 }
        ],
        next_event_id: "EV_CH04_BOSS_PICKER"
      },
      {
        choice_id: "ch04_cache_skip",
        label: "바로 이동",
        conditions: [],
        preview: "전투를 우선한다.",
        effects: [{ op: "set_flag", target: "flag:ch04_tunnel_skip", value: true }],
        next_event_id: "EV_CH04_BOSS_PICKER"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  return chapter;
}

function applyCh05(chapter) {
  ensureObjective(chapter, {
    objective_id: "obj_ch05_side_scan",
    text: "로비 감시망을 스캔한다.",
    required: false,
    complete_when: ["flag:ch05_hub_scan_done|flag:ch05_hub_scan_skipped"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch05_side_cooling",
    text: "냉각 구간의 폭주를 정리한다.",
    required: false,
    complete_when: ["flag:ch05_cooling_break_cleared"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch05_side_relay",
    text: "ARK-P 릴레이를 정리한다.",
    required: false,
    complete_when: ["flag:ch05_relay_locked|flag:ch05_relay_bypass"]
  });
  ensureObjective(chapter, {
    objective_id: "obj_ch05_side_prep",
    text: "보스전에 앞서 코어 방호를 준비한다.",
    required: false,
    complete_when: ["flag:ch05_core_prep_done|flag:ch05_core_prep_rushed"]
  });

  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch05_main",
    kind: "main",
    title: "미러센터 돌파",
    summary: "ARK-P 내부를 돌파해 인증값을 확보한다.",
    entry_event_id: "EV_CH05_ENTRY",
    completion_event_id: "EV_CH05_EXTRACTION",
    objective_ids: ["obj_ch05_01", "obj_ch05_02", "obj_ch05_03"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch05_scan",
    kind: "side",
    title: "로비 스캔",
    summary: "감시망을 스캔해 위협을 줄인다.",
    entry_event_id: "EV_CH05_LOBBY_MAPPING",
    completion_event_id: "EV_CH05_LOBBY_SCAN",
    objective_ids: ["obj_ch05_side_scan"],
    unlock_when: ["flag:ch05_started"]
  });
  ensureQuestTrack(chapter, {
    quest_track_id: "qt_ch05_relay",
    kind: "side",
    title: "릴레이 확보",
    summary: "서버홀의 릴레이를 정리해 보스전에 대비한다.",
    entry_event_id: "EV_CH05_KIM_ARA",
    completion_event_id: "EV_CH05_ARC_RELAY",
    objective_ids: ["obj_ch05_side_relay"],
    unlock_when: ["flag:ch05_ara_rescued_first|flag:ch05_ara_delayed"]
  });

  const lobby = findEvent(chapter, "EV_CH05_LOBBY_MAPPING");
  lobby.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH05_LOBBY_SCAN";
  });

  const cooling = findEvent(chapter, "EV_CH05_COOLING_ROUTE");
  cooling.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH05_COOLING_BREAK";
  });

  const ara = findEvent(chapter, "EV_CH05_KIM_ARA");
  ara.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH05_ARC_RELAY";
  });

  const dataAccess = findEvent(chapter, "EV_CH05_DATA_ACCESS");
  dataAccess.choices.forEach((choice) => {
    choice.next_event_id = "EV_CH05_CORE_PREP";
  });

  upsertEvent(chapter, {
    event_id: "EV_CH05_LOBBY_SCAN",
    event_type: "exploration",
    node_id: "PG-02",
    title: "로비 스캔",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_pangyo_lobby",
      music_key: "terminal_hum"
    },
    text: {
      summary: "로비 감시망을 스캔해 위협 위치를 파악한다.",
      body: [
        "센서가 깜빡이며 경고음을 내고 있다.",
        "지금 스캔하면 이후 이동이 안전해진다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch05_server"],
    choices: [
      {
        choice_id: "ch05_scan_extend",
        label: "스캔을 확장한다",
        conditions: [],
        preview: "보급과 정보를 얻는다.",
        effects: [
          { op: "set_flag", target: "flag:ch05_hub_scan_done", value: true },
          { op: "grant_loot_table", target: "loot:lt_ch05_server", value: 1 },
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH05_SKYWALK"
      },
      {
        choice_id: "ch05_scan_skip",
        label: "바로 이동",
        conditions: [],
        preview: "시간을 절약한다.",
        effects: [{ op: "set_flag", target: "flag:ch05_hub_scan_skipped", value: true }],
        next_event_id: "EV_CH05_SKYWALK"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH05_COOLING_BREAK",
    event_type: "combat",
    node_id: "PG-04",
    title: "냉각 구간 폭주",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_cooling_room",
      music_key: "cooling_hum"
    },
    text: {
      summary: "냉각 설비가 폭주하며 적이 몰려온다.",
      body: [
        "증기와 경보음이 섞여 시야가 흐려진다.",
        "지금 정리하지 않으면 서버홀 접근이 지연된다."
      ]
    },
    npc_ids: [],
    loot_table_ids: ["lt_ch05_server"],
    combat: {
      encounter_table_id: "enc_ch05_cooling",
      arena_tags: ["cooling", "steam"],
      victory_effects: [
        { op: "set_flag", target: "flag:ch05_cooling_break_cleared", value: true },
        { op: "grant_loot_table", target: "loot:lt_ch05_server", value: 1 }
      ],
      defeat_effects: [
        { op: "add_stat", target: "contamination", value: 12 },
        { op: "sub_stat", target: "hp", value: 26 }
      ]
    },
    choices: [
      {
        choice_id: "ch05_cooling_continue",
        label: "연구 격리실로 이동",
        conditions: [],
        preview: "김아라를 찾는다.",
        effects: [],
        next_event_id: "EV_CH05_KIM_ARA"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH05_ARC_RELAY",
    event_type: "choice",
    node_id: "PG-05",
    title: "릴레이 정리",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_arkp_serverhall",
      music_key: "server_chorus"
    },
    text: {
      summary: "ARK-P 릴레이를 잠그거나 우회해야 한다.",
      body: ["릴레이 상태에 따라 이후 전투 난이도가 달라진다."]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch05_relay_lock",
        label: "릴레이 봉인",
        conditions: [],
        preview: "안정성을 확보한다.",
        effects: [
          { op: "set_flag", target: "flag:ch05_relay_locked", value: true },
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH05_DATA_ACCESS"
      },
      {
        choice_id: "ch05_relay_bypass",
        label: "릴레이 우회",
        conditions: [],
        preview: "속도를 택한다.",
        effects: [
          { op: "set_flag", target: "flag:ch05_relay_bypass", value: true },
          { op: "add_stat", target: "contamination", value: 2 }
        ],
        next_event_id: "EV_CH05_DATA_ACCESS"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  upsertEvent(chapter, {
    event_id: "EV_CH05_CORE_PREP",
    event_type: "dialogue",
    node_id: "PG-07",
    title: "코어 방호 준비",
    repeatable: false,
    once_per_run: true,
    priority: 60,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_arkp_exit",
      music_key: "lab_tension"
    },
    text: {
      summary: "미러 라인스 진입 전 코어를 보호할 준비를 한다.",
      body: [
        "잔해가 흔들리고, 전자음이 귓속을 파고든다.",
        "지금 준비가 보스전의 생존률을 좌우한다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch05_core_prep",
        label: "방호 준비",
        conditions: [],
        preview: "체력을 확보한다.",
        effects: [
          { op: "set_flag", target: "flag:ch05_core_prep_done", value: true },
          { op: "add_stat", target: "hp", value: 5 }
        ],
        next_event_id: "EV_CH05_BOSS_LINES"
      },
      {
        choice_id: "ch05_core_rush",
        label: "바로 진입",
        conditions: [],
        preview: "속도를 우선한다.",
        effects: [
          { op: "set_flag", target: "flag:ch05_core_prep_rushed", value: true },
          { op: "add_stat", target: "noise", value: 2 }
        ],
        next_event_id: "EV_CH05_BOSS_LINES"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  return chapter;
}

function applyChapters() {
  const map = {
    ch01: applyCh01,
    ch02: applyCh02,
    ch03: applyCh03,
    ch04: applyCh04,
    ch05: applyCh05
  };

  for (const [chapterId, apply] of Object.entries(map)) {
    const filePath = path.join(CHAPTER_DIR, `${chapterId}.json`);
    const chapter = readJson(filePath);
    apply(chapter);
    writeJson(filePath, chapter);
  }
}

applyChapters();
console.log("Chapter pacing extensions applied.");
