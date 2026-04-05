import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CHAPTER_DIR = path.join(ROOT, "codex_webgame_pack", "data", "chapters");

function readChapter(file) {
  const fullPath = path.join(CHAPTER_DIR, file);
  return { fullPath, data: JSON.parse(fs.readFileSync(fullPath, "utf8")) };
}

function writeChapter(fullPath, data) {
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function findEvent(chapter, eventId) {
  const event = chapter.events.find((entry) => entry.event_id === eventId);
  if (!event) {
    throw new Error(`Missing event ${eventId}`);
  }
  return event;
}

function setChoicesNext(chapter, eventId, nextEventId) {
  const event = findEvent(chapter, eventId);
  if (!Array.isArray(event.choices)) {
    return;
  }
  for (const choice of event.choices) {
    choice.next_event_id = nextEventId;
  }
}

function setChoiceNext(chapter, eventId, choiceId, nextEventId) {
  const event = findEvent(chapter, eventId);
  const choice = (event.choices ?? []).find((entry) => entry.choice_id === choiceId);
  if (!choice) {
    throw new Error(`Missing choice ${choiceId} in ${eventId}`);
  }
  choice.next_event_id = nextEventId;
}

function updateEventText(chapter, eventId, { title, summary, body }) {
  const event = findEvent(chapter, eventId);
  event.title = title;
  event.text = {
    summary,
    body
  };
}

function updateChoiceText(chapter, eventId, choiceId, { label, preview }) {
  const event = findEvent(chapter, eventId);
  const choice = (event.choices ?? []).find((entry) => entry.choice_id === choiceId);
  if (!choice) {
    throw new Error(`Missing choice ${choiceId} in ${eventId}`);
  }
  if (label) {
    choice.label = label;
  }
  if (preview) {
    choice.preview = preview;
  }
}

function upsertEvent(chapter, event) {
  const index = chapter.events.findIndex((entry) => entry.event_id === event.event_id);
  if (index >= 0) {
    chapter.events[index] = event;
  } else {
    chapter.events.push(event);
  }
}

function applyCh01(chapter) {
  setChoicesNext(chapter, "EV_CH01_CONCOURSE_SKIRMISH", "EV_CH01_SERVICE_TUNNEL");
  setChoicesNext(chapter, "EV_CH01_SERVICE_TUNNEL", "EV_CH01_PATROL_AMBUSH");
  setChoicesNext(chapter, "EV_CH01_PATROL_AMBUSH", "EV_CH01_LOBBY_SEARCH");
  setChoicesNext(chapter, "EV_CH01_SECURITY_OFFICE", "EV_CH01_LOCKDOWN");
  setChoicesNext(chapter, "EV_CH01_SIGNAL_RELAY_DEFENSE", "EV_CH01_STUDIO_APPROACH");
  setChoicesNext(chapter, "EV_CH01_BOSS_BROADCAST", "EV_CH01_ESCAPE_RUN");
  setChoicesNext(chapter, "EV_CH01_ESCAPE_RUN", "EV_CH01_EXTRACTION_PREP");
  setChoicesNext(chapter, "EV_CH01_POWER_RESET", "EV_CH01_CONTROL_RESTORE");
  setChoicesNext(chapter, "EV_CH01_EXTRACTION_PREP", "EV_CH01_EXIT_CHECK");

  updateEventText(chapter, "EV_CH01_LOCKDOWN", {
    title: "비상 봉쇄",
    summary: "방송동 내부의 자동 봉쇄가 내려오며 통로가 둘로 갈라진다.",
    body: [
      "보안실에서 확보한 카드로 보관함 구역을 열 수 있다.",
      "복도로 돌면 함정이 있지만 빠르게 이동할 수 있다.",
      "결정에 따라 다음 루트가 달라진다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_LOCKDOWN", "ch01_lockdown_archive", {
    label: "보관함 구역 진입",
    preview: "매복을 감수하고 기록을 확보한다."
  });
  updateChoiceText(chapter, "EV_CH01_LOCKDOWN", "ch01_lockdown_corridor", {
    label: "복도 우회",
    preview: "함정을 감수하고 빠르게 이동한다."
  });

  updateEventText(chapter, "EV_CH01_ARCHIVE_AMBUSH", {
    title: "기록 보관함 매복",
    summary: "보관함 사이에서 매복한 감염체가 튀어나온다.",
    body: [
      "좁은 공간에서의 교전은 소음이 크게 남는다.",
      "정리하면 보관함 기록을 찾을 수 있다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_ARCHIVE_AMBUSH", "ch01_archive_fight", {
    label: "매복 돌파",
    preview: "정리하고 기록실로 이동한다."
  });

  updateEventText(chapter, "EV_CH01_CORRIDOR_TRAP", {
    title: "복도 함정",
    summary: "무너진 복도에 매설된 케이블이 발을 잡아끈다.",
    body: [
      "조심스럽게 끊어내면 소음은 줄지만 시간이 걸린다.",
      "돌파하면 빠르지만 부상이 늘어난다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_CORRIDOR_TRAP", "ch01_corridor_cut", {
    label: "케이블 제거",
    preview: "느리지만 안전하게 통과한다."
  });
  updateChoiceText(chapter, "EV_CH01_CORRIDOR_TRAP", "ch01_corridor_dash", {
    label: "강행 돌파",
    preview: "빠르게 지나가되 체력이 소모된다."
  });

  updateEventText(chapter, "EV_CH01_CONTROL_RESTORE", {
    title: "제어실 복구",
    summary: "지하 제어실의 전원이 불안정하다.",
    body: [
      "복구하면 옥상 송신기 접근이 쉬워진다.",
      "우회하면 소음은 줄지만 기록 일부를 잃는다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_CONTROL_RESTORE", "ch01_control_repair", {
    label: "전원 복구",
    preview: "시간을 들여 안정화한다."
  });
  updateChoiceText(chapter, "EV_CH01_CONTROL_RESTORE", "ch01_control_bypass", {
    label: "우회",
    preview: "빠르게 이동한다."
  });

  updateEventText(chapter, "EV_CH01_SERVICE_TUNNEL", {
    title: "서비스 터널",
    summary: "로비로 향하는 서비스 터널이 어둡게 이어진다.",
    body: [
      "좁은 통로는 소음을 억제하지만 시야가 제한된다.",
      "신속히 통과하면 로비 진입 시간을 줄일 수 있다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_SERVICE_TUNNEL", "ch01_tunnel_silent", {
    label: "조용히 이동",
    preview: "소음을 줄이고 로비로 접근한다."
  });
  updateChoiceText(chapter, "EV_CH01_SERVICE_TUNNEL", "ch01_tunnel_rush", {
    label: "빠르게 돌파",
    preview: "속도를 우선해 로비로 진입한다."
  });

  updateEventText(chapter, "EV_CH01_STUDIO_APPROACH", {
    title: "스튜디오 접근",
    summary: "스튜디오 입구에 잔존 감염체의 흔적이 남아 있다.",
    body: [
      "정면 돌파는 빠르지만 소음이 커질 수 있다.",
      "우회로는 안전하지만 소모가 늘어난다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_STUDIO_APPROACH", "ch01_studio_wait", {
    label: "상황 관찰",
    preview: "안전을 우선하며 진입한다."
  });
  updateChoiceText(chapter, "EV_CH01_STUDIO_APPROACH", "ch01_studio_push", {
    label: "즉시 진입",
    preview: "빠르게 진입해 보스를 맞이한다."
  });

  updateEventText(chapter, "EV_CH01_ESCAPE_RUN", {
    title: "탈출 돌파",
    summary: "전투 후, 계단과 복도가 불안정하게 흔들린다.",
    body: [
      "안전 루트를 찾으면 시간이 늘어나고, 강행하면 체력이 소모된다.",
      "탈출 준비 전에 상황을 정리해야 한다."
    ]
  });
  updateChoiceText(chapter, "EV_CH01_ESCAPE_RUN", "ch01_escape_fast", {
    label: "강행 돌파",
    preview: "빠르게 이탈하지만 체력이 소모된다."
  });
  updateChoiceText(chapter, "EV_CH01_ESCAPE_RUN", "ch01_escape_safe", {
    label: "안전 확보",
    preview: "시간을 들여 안전하게 이동한다."
  });

  upsertEvent(chapter, {
    event_id: "EV_CH01_EXIT_CHECK",
    event_type: "scene",
    node_id: "YD-08",
    title: "철수 점검",
    repeatable: false,
    once_per_run: true,
    priority: 55,
    conditions: [],
    presentation: {
      layout: "dialogue",
      art_key: "bg_emergency_stairs",
      music_key: "safe_bunker",
      widget_overrides: ["objective_panel"]
    },
    text: {
      summary: "철수 직전 장비 상태를 다시 확인한다.",
      body: [
        "정비하면 안전하지만 시간이 늦어진다.",
        "즉시 이동하면 속도는 빠르지만 불안이 남는다."
      ]
    },
    npc_ids: [],
    loot_table_ids: [],
    choices: [
      {
        choice_id: "ch01_exit_check",
        label: "장비 정비",
        conditions: [],
        preview: "정비 후 탈출한다.",
        effects: [
          { op: "add_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH01_EXTRACTION"
      },
      {
        choice_id: "ch01_exit_skip",
        label: "즉시 탈출",
        conditions: [],
        preview: "곧바로 탈출한다.",
        effects: [
          { op: "sub_stat", target: "noise", value: 1 }
        ],
        next_event_id: "EV_CH01_EXTRACTION"
      }
    ],
    on_enter_effects: [],
    on_complete_effects: []
  });

  setChoicesNext(chapter, "EV_CH01_EXIT_CHECK", "EV_CH01_EXTRACTION");
}

function applyCh02(chapter) {
  setChoicesNext(chapter, "EV_CH02_WATERWAY_CHECK", "EV_CH02_WATERLOCK");
  setChoicesNext(chapter, "EV_CH02_WATERLOCK", "EV_CH02_COLD_STORAGE");
  setChoicesNext(chapter, "EV_CH02_COLD_STORAGE", "EV_CH02_SUBMERGED_AMBUSH");
  setChoicesNext(chapter, "EV_CH02_SUBMERGED_AMBUSH", "EV_CH02_BLACKMARKET");
  setChoicesNext(chapter, "EV_CH02_BLACKMARKET", "EV_CH02_WATERLOGGED_AMBUSH");
  setChoicesNext(chapter, "EV_CH02_WATERLOGGED_AMBUSH", "EV_CH02_CHANNEL_CLEAR");
  setChoicesNext(chapter, "EV_CH02_CHANNEL_CLEAR", "EV_CH02_PIER_BARGAIN");
  setChoicesNext(chapter, "EV_CH02_PIER_BARGAIN", "EV_CH02_SLUICE_DIAGNOSTIC");
  setChoicesNext(chapter, "EV_CH02_SLUICE_DIAGNOSTIC", "EV_CH02_GATE_ASSAULT");
  setChoicesNext(chapter, "EV_CH02_GATE_ASSAULT", "EV_CH02_PIER_SIGNAL");
  setChoicesNext(chapter, "EV_CH02_PIER_SIGNAL", "EV_CH02_SLUICE_BOSS");
  setChoicesNext(chapter, "EV_CH02_SLUICE_BOSS", "EV_CH02_SLICE_ESCAPE");
  setChoicesNext(chapter, "EV_CH02_SLICE_ESCAPE", "EV_CH02_EXTRACTION");

  updateEventText(chapter, "EV_CH02_WATERLOCK", {
    title: "수문 잠금",
    summary: "수문 구역이 잠겨 이동 경로가 끊긴다.",
    body: [
      "강제로 열면 소음이 늘고, 우회하면 시간이 늘어난다."
    ]
  });
  updateChoiceText(chapter, "EV_CH02_WATERLOCK", "ch02_waterlock_storage", {
    label: "수문 개방",
    preview: "소음을 감수하고 길을 연다."
  });
  updateChoiceText(chapter, "EV_CH02_WATERLOCK", "ch02_waterlock_tents", {
    label: "우회로 확보",
    preview: "안전을 택하지만 시간이 늘어난다."
  });

  updateEventText(chapter, "EV_CH02_CHANNEL_CLEAR", {
    title: "수로 정리",
    summary: "부유물이 수로를 막아 이동이 어렵다.",
    body: [
      "정리하면 소음이 늘지만 이동이 쉬워진다.",
      "우회하면 안전하지만 물자 소모가 늘어난다."
    ]
  });
  updateChoiceText(chapter, "EV_CH02_CHANNEL_CLEAR", "ch02_channel_clear", {
    label: "수로 정리",
    preview: "소음을 감수하고 길을 연다."
  });
  updateChoiceText(chapter, "EV_CH02_CHANNEL_CLEAR", "ch02_channel_bypass", {
    label: "우회",
    preview: "안전을 택해 우회로로 이동한다."
  });

  updateEventText(chapter, "EV_CH02_SUBMERGED_AMBUSH", {
    title: "수중 매복",
    summary: "침수 구역에서 감염체가 갑자기 솟아오른다.",
    body: [
      "물속 전투는 회피 타이밍을 어렵게 만든다."
    ]
  });
  updateChoiceText(chapter, "EV_CH02_SUBMERGED_AMBUSH", "ch02_ambush_fight", {
    label: "매복 돌파",
    preview: "감염체를 정리하고 전진한다."
  });

  updateEventText(chapter, "EV_CH02_PIER_SIGNAL", {
    title: "부두 신호 재정비",
    summary: "부두 신호기가 흔들려 수문 반응이 늦어진다.",
    body: [
      "정비하면 개폐 루트가 안정되지만 시간이 늘어난다."
    ]
  });
  updateChoiceText(chapter, "EV_CH02_PIER_SIGNAL", "ch02_pier_signal_fix", {
    label: "신호기 정비",
    preview: "안정화를 택한다."
  });
  updateChoiceText(chapter, "EV_CH02_PIER_SIGNAL", "ch02_pier_signal_skip", {
    label: "정비 생략",
    preview: "시간을 아끼고 바로 진입한다."
  });

  updateEventText(chapter, "EV_CH02_SLICE_ESCAPE", {
    title: "수문 탈출",
    summary: "수문이 열리며 탈출 경로가 갈린다.",
    body: [
      "선택에 따라 탈출 속도와 위험이 달라진다."
    ]
  });
  updateChoiceText(chapter, "EV_CH02_SLICE_ESCAPE", "ch02_escape_boat", {
    label: "보트로 탈출",
    preview: "빠르지만 소음이 크다."
  });
  updateChoiceText(chapter, "EV_CH02_SLICE_ESCAPE", "ch02_escape_land", {
    label: "육상 탈출",
    preview: "안전하지만 시간이 늘어난다."
  });
}

function applyCh03(chapter) {
  setChoicesNext(chapter, "EV_CH03_BASEMENT_MEET", "EV_CH03_BASEMENT_CACHE");
  setChoicesNext(chapter, "EV_CH03_BASEMENT_CACHE", "EV_CH03_SERVICE_AMBUSH");
  setChoicesNext(chapter, "EV_CH03_SERVICE_AMBUSH", "EV_CH03_VERTICAL_ROUTE");
  setChoicesNext(chapter, "EV_CH03_SHOWROOM_AMBUSH", "EV_CH03_SHOWROOM_CACHE");
  setChoicesNext(chapter, "EV_CH03_SHOWROOM_CACHE", "EV_CH03_POWER_ROUTING");
  setChoiceNext(chapter, "EV_CH03_SKYBRIDGE", "ch03_bridge_signal", "EV_CH03_RESCUE_DETOUR");
  setChoiceNext(chapter, "EV_CH03_SKYBRIDGE", "ch03_bridge_silent", "EV_CH03_PREP_GLASS");
  setChoicesNext(chapter, "EV_CH03_RESCUE_DETOUR", "EV_CH03_PREP_GLASS");
  setChoicesNext(chapter, "EV_CH03_BOSS_GARDEN", "EV_CH03_EXTRACTION_PRESSURE");
  setChoicesNext(chapter, "EV_CH03_EXTRACTION_PRESSURE", "EV_CH03_EXTRACTION");

  updateEventText(chapter, "EV_CH03_PREP_GLASS", {
    title: "유리정원 준비",
    summary: "보스 구역 진입 전 마지막 정비가 필요하다.",
    body: [
      "장비를 정리하면 전투가 길어질 수 있지만 생존 확률이 오른다.",
      "서둘러 진입하면 소음은 줄지만 위험이 커진다."
    ]
  });
  updateChoiceText(chapter, "EV_CH03_PREP_GLASS", "ch03_prep_ready", {
    label: "정비 후 진입",
    preview: "안정을 택하고 보스로 향한다."
  });
  updateChoiceText(chapter, "EV_CH03_PREP_GLASS", "ch03_prep_rush", {
    label: "즉시 진입",
    preview: "속도를 우선해 보스로 향한다."
  });
}

function applyCh05(chapter) {
  setChoicesNext(chapter, "EV_CH05_LOBBY_MAPPING", "EV_CH05_LOBBY_SCAN");
  setChoicesNext(chapter, "EV_CH05_LOBBY_SCAN", "EV_CH05_LOBBY_CHECKPOINT");
  setChoicesNext(chapter, "EV_CH05_LOBBY_CHECKPOINT", "EV_CH05_SKYWALK");
  setChoicesNext(chapter, "EV_CH05_COOLING_ROUTE", "EV_CH05_COOLING_AMBUSH");
  setChoicesNext(chapter, "EV_CH05_COOLING_AMBUSH", "EV_CH05_COOLING_BREACH");
  setChoicesNext(chapter, "EV_CH05_COOLING_BREACH", "EV_CH05_KIM_ARA");
  setChoicesNext(chapter, "EV_CH05_DATA_ACCESS", "EV_CH05_DATA_SANITIZE");
  setChoicesNext(chapter, "EV_CH05_DATA_SANITIZE", "EV_CH05_CONTAINMENT_BREACH");
  setChoicesNext(chapter, "EV_CH05_BOSS_LINES", "EV_CH05_EXIT_PRESSURE");
  setChoicesNext(chapter, "EV_CH05_EXIT_PRESSURE", "EV_CH05_EXTRACTION");
}

const chapters = [
  { file: "ch01.json", apply: applyCh01 },
  { file: "ch02.json", apply: applyCh02 },
  { file: "ch03.json", apply: applyCh03 },
  { file: "ch04.json", apply: (chapter) => {
    setChoicesNext(chapter, "EV_CH04_COLD_ALLOC", "EV_CH04_COLD_AUDIT");
    setChoicesNext(chapter, "EV_CH04_COLD_AUDIT", "EV_CH04_LOBBY_MEET");
    setChoicesNext(chapter, "EV_CH04_LOBBY_MEET", "EV_CH04_VENDOR_BARTER");
    setChoicesNext(chapter, "EV_CH04_VENDOR_BARTER", "EV_CH04_LOADING_AMBUSH");
    setChoicesNext(chapter, "EV_CH04_PRE_BOSS_CHECK", "EV_CH04_LINE_PREP");
    setChoicesNext(chapter, "EV_CH04_LINE_PREP", "EV_CH04_BOSS_PICKER");
    setChoicesNext(chapter, "EV_CH04_EXTRACTION_PREP", "EV_CH04_EXIT_CHECK");
    upsertEvent(chapter, {
      event_id: "EV_CH04_EXIT_CHECK",
      event_type: "scene",
      node_id: "MJ-07",
      title: "철수 점검",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_delivery_tunnel",
        music_key: "safe_bunker",
        widget_overrides: ["objective_panel"]
      },
      text: {
        summary: "철수 직전 장비 상태를 다시 점검한다.",
        body: [
          "정비하면 안전하지만 시간이 늘어난다.",
          "즉시 이동하면 빠르지만 리스크가 커진다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch04_exit_check",
          label: "장비 정비",
          conditions: [],
          preview: "정비 후 탈출한다.",
          effects: [
            { op: "add_stat", target: "noise", value: 1 }
          ],
          next_event_id: "EV_CH04_EXTRACTION"
        },
        {
          choice_id: "ch04_exit_skip",
          label: "즉시 탈출",
          conditions: [],
          preview: "곧바로 탈출한다.",
          effects: [
            { op: "sub_stat", target: "noise", value: 1 }
          ],
          next_event_id: "EV_CH04_EXTRACTION"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    });

    setChoicesNext(chapter, "EV_CH04_EXIT_CHECK", "EV_CH04_EXTRACTION");
  }},
  { file: "ch05.json", apply: applyCh05 }
];

for (const entry of chapters) {
  const { fullPath, data } = readChapter(entry.file);
  entry.apply(data);
  writeChapter(fullPath, data);
}

console.log("Applied pacing patch adjustments.");
