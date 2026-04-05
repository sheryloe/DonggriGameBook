import fs from "fs";

const chapterFiles = {
  CH01: "codex_webgame_pack/data/chapters/ch01.json",
  CH02: "codex_webgame_pack/data/chapters/ch02.json",
  CH03: "codex_webgame_pack/data/chapters/ch03.json",
  CH04: "codex_webgame_pack/data/chapters/ch04.json",
  CH05: "codex_webgame_pack/data/chapters/ch05.json"
};

const unique = (items) => [...new Set(items.filter(Boolean))];

function loadChapter(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveChapter(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function addObjectives(chapter, objectives) {
  const existing = new Set(chapter.objectives.map((obj) => obj.objective_id));
  for (const obj of objectives) {
    if (!existing.has(obj.objective_id)) {
      chapter.objectives.push(obj);
      existing.add(obj.objective_id);
    }
  }
}

function addQuestTracks(chapter, tracks) {
  chapter.quest_tracks = ensureArray(chapter.quest_tracks);
  const existing = new Set(chapter.quest_tracks.map((track) => track.quest_track_id));
  for (const track of tracks) {
    if (!existing.has(track.quest_track_id)) {
      chapter.quest_tracks.push(track);
      existing.add(track.quest_track_id);
    }
  }
}

function addEvents(chapter, events) {
  const existing = new Set(chapter.events.map((event) => event.event_id));
  for (const event of events) {
    if (!existing.has(event.event_id)) {
      chapter.events.push(event);
      existing.add(event.event_id);
    }
  }
}

function prependNodeEvents(chapter, nodeId, eventIds) {
  const node = chapter.nodes.find((entry) => entry.node_id === nodeId);
  if (!node) {
    throw new Error(`Missing node ${nodeId} in ${chapter.chapter_id}`);
  }
  const current = ensureArray(node.event_ids);
  const next = unique([...eventIds, ...current]);
  node.event_ids = next;
}

function updateEvent(chapter, eventId, updater) {
  const event = chapter.events.find((entry) => entry.event_id === eventId);
  if (!event) {
    throw new Error(`Missing event ${eventId} in ${chapter.chapter_id}`);
  }
  updater(event);
}

function addChoiceEffect(choice, effect) {
  const key = JSON.stringify(effect);
  const existing = new Set((choice.effects ?? []).map((entry) => JSON.stringify(entry)));
  if (!existing.has(key)) {
    choice.effects.push(effect);
  }
}

function updateChoice(event, choiceId, updater) {
  const choice = event.choices.find((entry) => entry.choice_id === choiceId);
  if (!choice) {
    throw new Error(`Missing choice ${choiceId} in ${event.event_id}`);
  }
  updater(choice);
}

function applyCh01(chapter) {
  addObjectives(chapter, [
    {
      objective_id: "obj_ch01_04",
      text: "통제실 키카드를 확보한다.",
      required: false,
      complete_when: ["flag:ch01_keycard_obtained"]
    },
    {
      objective_id: "obj_ch01_05",
      text: "송신기를 안정화한다.",
      required: true,
      complete_when: ["flag:ch01_signal_stable"]
    },
    {
      objective_id: "obj_ch01_06",
      text: "보조 작가를 구조한다.",
      required: false,
      complete_when: ["flag:rescued_writer"]
    }
  ]);

  addQuestTracks(chapter, [
    {
      quest_track_id: "qt_ch01_main_relay",
      kind: "main",
      title: "방송동 증폭기 회수",
      summary: "단파 증폭기와 송출 로그를 확보하고 생존을 유지한다.",
      entry_event_id: "EV_CH01_BRIEFING",
      completion_event_id: "EV_CH01_EXTRACTION",
      objective_ids: ["obj_ch01_01", "obj_ch01_02", "obj_ch01_05"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch01_side_keycard",
      kind: "side",
      title: "통제실 백업 키",
      summary: "락다운 구역을 열 수 있는 키카드를 확보한다.",
      entry_event_id: "EV_CH01_LOBBY_LOCKDOWN",
      completion_event_id: "EV_CH01_ARCHIVE_DECISION",
      objective_ids: ["obj_ch01_04"],
      unlock_when: ["flag:ch01_lobby_lockdown"]
    },
    {
      quest_track_id: "qt_ch01_side_writer",
      kind: "side",
      title: "마지막 멘트",
      summary: "편집실 생존자를 구출해 마지막 멘트를 확보한다.",
      entry_event_id: "EV_CH01_WRITER_RESCUE",
      completion_event_id: "EV_CH01_ROOFTOP_SIGNAL",
      objective_ids: ["obj_ch01_06"],
      unlock_when: ["flag:ch01_corridor_cleared"]
    }
  ]);

  addEvents(chapter, [
    {
      event_id: "EV_CH01_LOBBY_LOCKDOWN",
      event_type: "exploration",
      node_id: "YD-03",
      title: "로비 락다운",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_yeouido_ashroad",
        music_key: "tension_low",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "방송동 로비의 차단 셔터가 내려와 출입구가 봉쇄되었다.",
        body: [
          "비상 전원에 연결된 제어 패널이 과열되어 있다.",
          "강행 돌파하면 소음이 커지고 상층 감염체가 몰릴 수 있다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch01_lobby_manual",
          label: "수동으로 해체한다",
          conditions: [],
          preview: "시간을 들여 안전하게 연다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_lobby_lockdown", value: true },
            { op: "set_flag", target: "flag:ch01_keycard_obtained", value: true },
            { op: "add_stat", target: "noise", value: 2 },
            { op: "add_stat", target: "contamination", value: 1 }
          ],
          next_event_id: "EV_CH01_LOBBY_SEARCH"
        },
        {
          choice_id: "ch01_lobby_force",
          label: "강행 돌파한다",
          conditions: [],
          preview: "빠르게 열지만 소음이 커진다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_lobby_lockdown", value: true },
            { op: "set_flag", target: "flag:ch01_keycard_obtained", value: true },
            { op: "add_stat", target: "noise", value: 6 },
            { op: "add_stat", target: "contamination", value: 2 }
          ],
          next_event_id: "EV_CH01_LOBBY_SEARCH"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_ARCHIVE_KEYPAD",
      event_type: "choice",
      node_id: "YD-05",
      title: "침수 자료실 키패드",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_archive_flooded",
        music_key: "water_dread",
        widget_overrides: ["contamination_meter", "loot_preview"]
      },
      text: {
        summary: "자료실 앞 키패드가 먹통이라 강제 조치가 필요하다.",
        body: [
          "비상 모드를 해제하면 내부 캐시와 테이프가 열린다.",
          "우회 콘솔을 쓰면 안전하지만 로그 일부가 손실된다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch01_archive_emergency",
          label: "긴급 모드 해제",
          conditions: [],
          preview: "오염은 오르지만 자료를 확보한다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_archive_key", value: true },
            { op: "grant_loot_table", target: "loot:lt_ch01_archive", value: 1 },
            { op: "add_stat", target: "contamination", value: 4 },
            { op: "add_stat", target: "noise", value: 2 }
          ],
          next_event_id: "EV_CH01_ARCHIVE_DECISION"
        },
        {
          choice_id: "ch01_archive_bypass",
          label: "우회 콘솔 사용",
          conditions: [],
          preview: "안전을 택하지만 손실이 생긴다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_archive_key", value: true },
            { op: "add_stat", target: "noise", value: 4 },
            { op: "add_stat", target: "contamination", value: 2 }
          ],
          next_event_id: "EV_CH01_ARCHIVE_DECISION"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_STAIRWELL_AMBUSH",
      event_type: "combat",
      node_id: "YD-04",
      title: "계단실 매복",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "combat",
        art_key: "bg_broadcast_corridor",
        music_key: "tension_mid",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "복도 끝에서 편집괴 잔존체가 매복한다.",
        body: ["좁은 계단실이라 회피가 어렵다.", "지금 정리하지 않으면 송신기 접근 중 다시 습격한다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch01_corridor_break",
          label: "매복을 돌파한다",
          conditions: [],
          preview: "정리 후 생존자 구역으로 진입한다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_corridor_cleared", value: true },
            { op: "add_stat", target: "noise", value: 3 }
          ],
          next_event_id: "EV_CH01_WRITER_RESCUE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch01_archive_medium",
        arena_tags: ["corridor", "ambush"],
        victory_effects: [],
        defeat_effects: []
      }
    },
    {
      event_id: "EV_CH01_ROOFTOP_CALIBRATION",
      event_type: "dialogue",
      node_id: "YD-07",
      title: "송신기 안정화",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_rooftop_signal",
        music_key: "signal_hiss",
        widget_overrides: ["signal_decoder"]
      },
      text: {
        summary: "예비 라인을 연결해 송신기 상태를 안정화한다.",
        body: [
          "임시 보강을 하면 신호가 선명해지지만 열과 소음이 누적된다.",
          "안정화가 끝나야 스튜디오에 내려갈 수 있다."
        ]
      },
      npc_ids: ["npc_yoon_haein"],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch01_signal_fast",
          label: "즉시 안정화한다",
          conditions: [],
          preview: "소음을 감수하고 빠르게 진행한다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_signal_stable", value: true },
            { op: "add_stat", target: "noise", value: 4 }
          ],
          next_event_id: "EV_CH01_ROOFTOP_SIGNAL"
        },
        {
          choice_id: "ch01_signal_spare",
          label: "예비 라인을 사용한다",
          conditions: [],
          preview: "안전하지만 오염이 오른다.",
          effects: [
            { op: "set_flag", target: "flag:ch01_signal_stable", value: true },
            { op: "add_stat", target: "contamination", value: 2 }
          ],
          next_event_id: "EV_CH01_ROOFTOP_SIGNAL"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ]);

  prependNodeEvents(chapter, "YD-03", ["EV_CH01_LOBBY_LOCKDOWN"]);
  prependNodeEvents(chapter, "YD-05", ["EV_CH01_ARCHIVE_KEYPAD"]);
  prependNodeEvents(chapter, "YD-04", ["EV_CH01_STAIRWELL_AMBUSH"]);
  prependNodeEvents(chapter, "YD-07", ["EV_CH01_ROOFTOP_CALIBRATION"]);

  updateEvent(chapter, "EV_CH01_BOSS_BROADCAST", (event) => {
    event.conditions = unique([
      ...(event.conditions ?? []),
      "flag:ch01_archive_key",
      "flag:ch01_signal_stable",
      "flag:ch01_corridor_cleared"
    ]);
  });

  updateEvent(chapter, "EV_CH01_ROOFTOP_CALIBRATION", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH01_SIGNAL_RELAY_DEFENSE";
    }
  });

  updateEvent(chapter, "EV_CH01_SIGNAL_RELAY_DEFENSE", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH01_ROOFTOP_SIGNAL";
    }
  });

  prependNodeEvents(chapter, "YD-07", ["EV_CH01_SIGNAL_RELAY_DEFENSE"]);
}

function applyCh02(chapter) {
  addObjectives(chapter, [
    {
      objective_id: "obj_ch02_04",
      text: "배수문 제어키를 확보한다.",
      required: true,
      complete_when: ["flag:ch02_gate_key"]
    },
    {
      objective_id: "obj_ch02_05",
      text: "수몰시장 정찰을 마친다.",
      required: false,
      complete_when: ["flag:ch02_market_clear"]
    }
  ]);

  addQuestTracks(chapter, [
    {
      quest_track_id: "qt_ch02_main_sluice",
      kind: "main",
      title: "검은 수로 통제",
      summary: "배터리와 수로 지도를 확보해 배수문을 통제한다.",
      entry_event_id: "EV_CH02_ENTRY",
      completion_event_id: "EV_CH02_EXTRACTION",
      objective_ids: ["obj_ch02_01", "obj_ch02_02", "obj_ch02_04"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch02_side_market",
      kind: "side",
      title: "수몰시장 정찰",
      summary: "잔해 구역을 정리하고 루팅 경로를 확보한다.",
      entry_event_id: "EV_CH02_MARKET_LOCKDOWN",
      completion_event_id: "EV_CH02_MARKET_SWEEP",
      objective_ids: ["obj_ch02_05"],
      unlock_when: ["flag:ch02_market_lockdown"]
    },
    {
      quest_track_id: "qt_ch02_side_gate",
      kind: "side",
      title: "배수문 제어키",
      summary: "통제실 키를 확보해 배수문 작동을 보장한다.",
      entry_event_id: "EV_CH02_SLUICE_OVERRIDE",
      completion_event_id: "EV_CH02_SLUICE_BOSS",
      objective_ids: ["obj_ch02_04"],
      unlock_when: ["flag:ch02_battery_secured"]
    }
  ]);

  addEvents(chapter, [
    {
      event_id: "EV_CH02_MARKET_LOCKDOWN",
      event_type: "exploration",
      node_id: "NR-02",
      title: "수몰시장 잔해",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_flooded_market",
        music_key: "water_dread",
        widget_overrides: ["contamination_meter", "noise_meter"]
      },
      text: {
        summary: "수몰시장 입구가 잔해로 막혀 있다.",
        body: [
          "잔해를 치우는 동안 물살이 더 거세져 오염도가 상승한다.",
          "우회로는 안전하지만 소음이 커진다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch02_market_clear",
          label: "잔해를 치운다",
          conditions: [],
          preview: "경로는 열리지만 오염이 오른다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_market_lockdown", value: true },
            { op: "set_flag", target: "flag:ch02_market_clear", value: true },
            { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 },
            { op: "add_stat", target: "contamination", value: 4 }
          ],
          next_event_id: "EV_CH02_MARKET_SWEEP"
        },
        {
          choice_id: "ch02_market_bypass",
          label: "우회로를 연다",
          conditions: [],
          preview: "소음을 감수하고 빠르게 통과한다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_market_lockdown", value: true },
            { op: "set_flag", target: "flag:ch02_market_clear", value: true },
            { op: "add_stat", target: "noise", value: 5 }
          ],
          next_event_id: "EV_CH02_MARKET_SWEEP"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_COLD_SEAL",
      event_type: "choice",
      node_id: "NR-03",
      title: "냉동창고 봉인",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_cold_storage",
        music_key: "tension_low",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "냉동창고 보안 셔터가 얼어붙어 있다.",
        body: [
          "급속 해빙을 쓰면 소음이 커지고, 수동 해체는 시간이 든다.",
          "배터리를 꺼내기 전에 내부 안전을 확보해야 한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch02_cold_thaw",
          label: "급속 해빙을 사용",
          conditions: [],
          preview: "소음을 감수하고 빠르게 연다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_battery_secured", value: true },
            { op: "add_stat", target: "noise", value: 6 }
          ],
          next_event_id: "EV_CH02_COLD_STORAGE"
        },
        {
          choice_id: "ch02_cold_manual",
          label: "수동 해체한다",
          conditions: [],
          preview: "안전하지만 오염이 오른다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_battery_secured", value: true },
            { op: "add_stat", target: "contamination", value: 3 }
          ],
          next_event_id: "EV_CH02_COLD_STORAGE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_PIER_AMBUSH",
      event_type: "combat",
      node_id: "NR-05",
      title: "폐선착장 매복",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "combat",
        art_key: "bg_flooded_pier",
        music_key: "tension_mid",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "폐선착장에서 수로 감염체가 떼로 몰려든다.",
        body: ["수면 위가 미끄러워 행동이 둔해진다.", "여기서 정리해야 통제실로 안전하게 접근할 수 있다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch02_pier_break",
          label: "매복을 돌파한다",
          conditions: [],
          preview: "통제실로 이동한다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_pier_cleared", value: true },
            { op: "add_stat", target: "noise", value: 3 }
          ],
          next_event_id: "EV_CH02_PIER_BARGAIN"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch02_water_market",
        arena_tags: ["pier", "water"],
        victory_effects: [],
        defeat_effects: []
      }
    },
    {
      event_id: "EV_CH02_SLUICE_OVERRIDE",
      event_type: "dialogue",
      node_id: "NR-06",
      title: "배수문 키 재설정",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_sluice_control",
        music_key: "tension_low",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "통제실 인증 키를 재설정해야 배수문이 열린다.",
        body: ["수동 재설정은 기록이 남고, 우회하면 안전장치가 불안정해진다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch02_sluice_reset",
          label: "수동으로 재설정한다",
          conditions: [],
          preview: "안정성이 확보된다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_gate_key", value: true },
            { op: "add_stat", target: "noise", value: 2 }
          ],
          next_event_id: "EV_CH02_SLUICE_BOSS"
        },
        {
          choice_id: "ch02_sluice_bypass",
          label: "우회 절차로 연다",
          conditions: [],
          preview: "빠르게 열지만 위험이 남는다.",
          effects: [
            { op: "set_flag", target: "flag:ch02_gate_key", value: true },
            { op: "add_stat", target: "contamination", value: 2 }
          ],
          next_event_id: "EV_CH02_SLUICE_BOSS"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ]);

  prependNodeEvents(chapter, "NR-02", ["EV_CH02_MARKET_LOCKDOWN"]);
  prependNodeEvents(chapter, "NR-03", ["EV_CH02_COLD_SEAL"]);
  prependNodeEvents(chapter, "NR-05", ["EV_CH02_PIER_AMBUSH"]);
  prependNodeEvents(chapter, "NR-06", ["EV_CH02_SLUICE_OVERRIDE"]);

  updateEvent(chapter, "EV_CH02_SLUICE_BOSS", (event) => {
    event.conditions = unique([
      ...(event.conditions ?? []),
      "flag:ch02_battery_secured",
      "flag:ch02_gate_key"
    ]);
  });

  updateEvent(chapter, "EV_CH02_SLUICE_OVERRIDE", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH02_GATE_ASSAULT";
    }
  });

  updateEvent(chapter, "EV_CH02_GATE_ASSAULT", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH02_SLUICE_BOSS";
    }
  });

  prependNodeEvents(chapter, "NR-06", ["EV_CH02_GATE_ASSAULT"]);
}

function applyCh03(chapter) {
  addObjectives(chapter, [
    {
      objective_id: "obj_ch03_04",
      text: "계단실 매복을 정리한다.",
      required: true,
      complete_when: ["flag:ch03_stair_cleared"]
    },
    {
      objective_id: "obj_ch03_05",
      text: "전력 안정화를 완료한다.",
      required: true,
      complete_when: ["flag:ch03_power_stable"]
    },
    {
      objective_id: "obj_ch03_06",
      text: "구조 신호에 응답한다.",
      required: false,
      complete_when: ["flag:ch03_rescue_complete"]
    }
  ]);

  addQuestTracks(chapter, [
    {
      quest_track_id: "qt_ch03_main_glass",
      kind: "main",
      title: "유리정원 접근",
      summary: "축전지와 릴레이 렌즈를 확보하고 전력을 안정화한다.",
      entry_event_id: "EV_CH03_ENTRY",
      completion_event_id: "EV_CH03_EXTRACTION",
      objective_ids: ["obj_ch03_01", "obj_ch03_02", "obj_ch03_05"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch03_side_stairs",
      kind: "side",
      title: "계단실 매복 정리",
      summary: "상층으로 오르기 전 계단실 위협을 제거한다.",
      entry_event_id: "EV_CH03_STAIR_AMBUSH",
      completion_event_id: "EV_CH03_VERTICAL_ROUTE",
      objective_ids: ["obj_ch03_04"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch03_side_rescue",
      kind: "side",
      title: "구조 신호",
      summary: "스카이브리지에서 돌아온 구조 신호를 확인한다.",
      entry_event_id: "EV_CH03_RESCUE_DETOUR",
      completion_event_id: "EV_CH03_BOSS_GARDEN",
      objective_ids: ["obj_ch03_06"],
      unlock_when: ["flag:ch03_rescue_signal"]
    }
  ]);

  addEvents(chapter, [
    {
      event_id: "EV_CH03_BASEMENT_CACHE",
      event_type: "exploration",
      node_id: "JS-02",
      title: "지하 캐시",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_basement_cache",
        music_key: "tension_low",
        widget_overrides: ["noise_meter", "loot_preview"]
      },
      text: {
        summary: "난민 구역 뒤편에 임시 캐시가 숨겨져 있다.",
        body: ["잠긴 보관함에는 축전지 보호 케이스가 있다.", "열어보면 소음이 커져 상층 감시가 깨어난다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_cache_open",
          label: "보관함을 연다",
          conditions: [],
          preview: "루팅을 확보하지만 소음이 오른다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_basement_cache", value: true },
            { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
            { op: "add_stat", target: "noise", value: 4 }
          ],
          next_event_id: "EV_CH03_BASEMENT_MEET"
        },
        {
          choice_id: "ch03_cache_skip",
          label: "무시하고 지나친다",
          conditions: [],
          preview: "소음을 줄이고 이동한다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_basement_cache", value: true },
            { op: "add_stat", target: "contamination", value: 1 }
          ],
          next_event_id: "EV_CH03_BASEMENT_MEET"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_STAIR_AMBUSH",
      event_type: "combat",
      node_id: "JS-03",
      title: "계단실 매복",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "combat",
        art_key: "bg_service_stairs",
        music_key: "tension_mid",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "서비스 계단에서 중간형 감염체가 매복한다.",
        body: ["좁은 계단실이라 사각이 많다.", "정리하지 않으면 상층 라운지로 가는 길이 막힌다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_stair_break",
          label: "매복을 돌파한다",
          conditions: [],
          preview: "상층으로 진입한다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_stair_cleared", value: true },
            { op: "add_stat", target: "noise", value: 3 }
          ],
          next_event_id: "EV_CH03_VERTICAL_ROUTE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch03_tower_mid",
        arena_tags: ["stairs", "ambush"],
        victory_effects: [],
        defeat_effects: []
      }
    },
    {
      event_id: "EV_CH03_BLACKOUT_REPAIR",
      event_type: "dialogue",
      node_id: "JS-05",
      title: "전력 안정화",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_power_room",
        music_key: "tension_low",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "전력 흐름이 불안정해 상층 조명이 끊기기 시작한다.",
        body: ["임시 보강으로 안정화할 수 있지만 소음과 열이 오른다.", "안정화하지 않으면 상층 교섭이 위험해진다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_power_fix",
          label: "안정화를 완료한다",
          conditions: [],
          preview: "상층 이동을 보장한다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_power_stable", value: true },
            { op: "add_stat", target: "noise", value: 4 }
          ],
          next_event_id: "EV_CH03_UPPER_NEGOTIATION"
        },
        {
          choice_id: "ch03_power_rush",
          label: "빠르게 이동한다",
          conditions: [],
          preview: "시간을 아끼지만 위험이 남는다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_power_stable", value: true },
            { op: "add_stat", target: "contamination", value: 2 }
          ],
          next_event_id: "EV_CH03_UPPER_NEGOTIATION"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_RESCUE_DETOUR",
      event_type: "dialogue",
      node_id: "JS-07",
      title: "구조 신호 회수",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: ["flag:ch03_rescue_signal"],
      presentation: {
        layout: "dialogue",
        art_key: "bg_skybridge_relay",
        music_key: "tension_low",
        widget_overrides: ["noise_meter", "trust_summary"]
      },
      text: {
        summary: "스카이브리지에서 구조 신호에 응답이 돌아온다.",
        body: ["응답 지점에는 부상자와 교섭용 데이터가 남아 있다.", "구조를 택하면 시간을 잃지만 신뢰도를 얻는다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_rescue_help",
          label: "부상자를 이송한다",
          conditions: [],
          preview: "신뢰도를 확보한다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_rescue_complete", value: true },
            { op: "add_trust", target: "trust.npc_ryu_seon", value: 1 }
          ],
          next_event_id: "EV_CH03_BOSS_GARDEN"
        },
        {
          choice_id: "ch03_rescue_leave",
          label: "정보만 챙긴다",
          conditions: [],
          preview: "시간을 절약한다.",
          effects: [
            { op: "set_flag", target: "flag:ch03_rescue_complete", value: true },
            { op: "add_stat", target: "noise", value: 2 }
          ],
          next_event_id: "EV_CH03_BOSS_GARDEN"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ]);

  prependNodeEvents(chapter, "JS-02", ["EV_CH03_BASEMENT_CACHE"]);
  prependNodeEvents(chapter, "JS-03", ["EV_CH03_STAIR_AMBUSH"]);
  prependNodeEvents(chapter, "JS-05", ["EV_CH03_BLACKOUT_REPAIR"]);
  prependNodeEvents(chapter, "JS-07", ["EV_CH03_RESCUE_DETOUR"]);

  updateEvent(chapter, "EV_CH03_BOSS_GARDEN", (event) => {
    event.conditions = unique([
      ...(event.conditions ?? []),
      "flag:ch03_stair_cleared",
      "flag:ch03_power_stable"
    ]);
  });

  updateEvent(chapter, "EV_CH03_POWER_ROUTING", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH03_BLACKOUT_REPAIR";
    }
  });

  updateEvent(chapter, "EV_CH03_SKYBRIDGE", (event) => {
    updateChoice(event, "ch03_bridge_signal", (choice) => {
      choice.next_event_id = "EV_CH03_RESCUE_DETOUR";
    });
  });

  updateEvent(chapter, "EV_CH03_BLACKOUT_REPAIR", (event) => {
    for (const choice of event.choices) {
      addChoiceEffect(choice, { op: "set_flag", target: "flag:ch03_power_stable", value: true });
    }
  });

  updateEvent(chapter, "EV_CH03_STAIR_AMBUSH", (event) => {
    if (!event.combat) {
      event.combat = {
        encounter_table_id: "enc_ch03_tower_mid",
        arena_tags: ["stairs", "ambush"],
        victory_effects: [],
        defeat_effects: []
      };
    }
    event.combat.victory_effects = event.combat.victory_effects ?? [];
    const hasFlag = event.combat.victory_effects.some(
      (entry) => entry.op === "set_flag" && entry.target === "flag:ch03_stair_cleared"
    );
    if (!hasFlag) {
      event.combat.victory_effects.push({
        op: "set_flag",
        target: "flag:ch03_stair_cleared",
        value: true
      });
    }
  });
}

function applyCh04(chapter) {
  addObjectives(chapter, [
    {
      objective_id: "obj_ch04_04",
      text: "철도 인계장 장애를 해소한다.",
      required: true,
      complete_when: ["flag:ch04_rail_clear"]
    },
    {
      objective_id: "obj_ch04_05",
      text: "라인 재가동 준비를 완료한다.",
      required: true,
      complete_when: ["flag:ch04_line_ready"]
    },
    {
      objective_id: "obj_ch04_06",
      text: "보안 사무실을 정리한다.",
      required: false,
      complete_when: ["flag:ch04_security_cleared"]
    }
  ]);

  addQuestTracks(chapter, [
    {
      quest_track_id: "qt_ch04_main_line",
      kind: "main",
      title: "상자들의 도시",
      summary: "물류 라인을 재가동해 통로를 확보한다.",
      entry_event_id: "EV_CH04_ENTRY",
      completion_event_id: "EV_CH04_EXTRACTION",
      objective_ids: ["obj_ch04_01", "obj_ch04_02", "obj_ch04_05"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch04_side_rail",
      kind: "side",
      title: "철도 인계장 정리",
      summary: "노선 장애를 제거해 운송로를 확보한다.",
      entry_event_id: "EV_CH04_RAIL_JAM",
      completion_event_id: "EV_CH04_ROUTE_SELECTION",
      objective_ids: ["obj_ch04_04"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch04_side_security",
      kind: "side",
      title: "보안 사무실",
      summary: "보안 구역을 정리해 접근 권한을 확보한다.",
      entry_event_id: "EV_CH04_SECURITY_SWEEP",
      completion_event_id: "EV_CH04_SECURITY_BADGES",
      objective_ids: ["obj_ch04_06"],
      unlock_when: ["flag:ch04_rail_clear"]
    }
  ]);

  addEvents(chapter, [
    {
      event_id: "EV_CH04_COLD_AUDIT",
      event_type: "exploration",
      node_id: "MJ-02",
      title: "냉장창고 점검",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_cold_storage",
        music_key: "tension_low",
        widget_overrides: ["noise_meter", "loot_preview"]
      },
      text: {
        summary: "냉장창고 내부 점검 기록이 누락되어 있다.",
        body: ["재고를 확인하면 루팅 효율이 오르지만 소음이 커진다.", "빠르게 지나치면 보안 경보가 약해진다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch04_cold_audit",
          label: "점검을 진행한다",
          conditions: [],
          preview: "루팅 효율을 높인다.",
          effects: [
            { op: "set_flag", target: "flag:ch04_cold_audit", value: true },
            { op: "grant_loot_table", target: "loot:lt_ch04_logistics", value: 1 },
            { op: "add_stat", target: "noise", value: 4 }
          ],
          next_event_id: "EV_CH04_COLD_ALLOC"
        },
        {
          choice_id: "ch04_cold_skip",
          label: "빠르게 통과한다",
          conditions: [],
          preview: "소음을 줄이고 이동한다.",
          effects: [
            { op: "set_flag", target: "flag:ch04_cold_audit", value: true },
            { op: "add_stat", target: "contamination", value: 1 }
          ],
          next_event_id: "EV_CH04_COLD_ALLOC"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH04_RAIL_JAM",
      event_type: "choice",
      node_id: "MJ-04",
      title: "철도 인계장 장애",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_rail_junction",
        music_key: "tension_low",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "철도 인계장에 컨테이너가 걸려 노선이 막혀 있다.",
        body: ["직접 치우면 시간과 소음이 들고, 우회하면 물자 손실이 생긴다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch04_rail_clear",
          label: "직접 치운다",
          conditions: [],
          preview: "노선을 확보한다.",
          effects: [
            { op: "set_flag", target: "flag:ch04_rail_clear", value: true },
            { op: "add_stat", target: "noise", value: 5 }
          ],
          next_event_id: "EV_CH04_ROUTE_SELECTION"
        },
        {
          choice_id: "ch04_rail_bypass",
          label: "우회로를 연다",
          conditions: [],
          preview: "물자 손실을 감수한다.",
          effects: [
            { op: "set_flag", target: "flag:ch04_rail_clear", value: true },
            { op: "add_stat", target: "contamination", value: 2 }
          ],
          next_event_id: "EV_CH04_ROUTE_SELECTION"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH04_SECURITY_SWEEP",
      event_type: "combat",
      node_id: "MJ-06",
      title: "보안 사무실 정리",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "combat",
        art_key: "bg_security_office",
        music_key: "tension_mid",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "보안 사무실 앞에 무장 감염체가 출현한다.",
        body: ["여기서 정리하면 출입 권한을 확보할 수 있다.", "회피하면 보스전 난이도가 상승한다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch04_security_break",
          label: "정면 돌파한다",
          conditions: [],
          preview: "보안 구역으로 진입한다.",
          effects: [
            { op: "set_flag", target: "flag:ch04_security_cleared", value: true },
            { op: "add_stat", target: "noise", value: 3 }
          ],
          next_event_id: "EV_CH04_SECURITY_BADGES"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch04_logistics_floor",
        arena_tags: ["security", "office"],
        victory_effects: [],
        defeat_effects: []
      }
    },
    {
      event_id: "EV_CH04_LINE_PREP",
      event_type: "dialogue",
      node_id: "MJ-05",
      title: "라인 준비",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_logistics_main",
        music_key: "tension_low",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "라인 재가동 전에 마지막 안전 점검을 수행한다.",
        body: ["전원 분배와 안전장치를 잡아야 한다.", "준비가 끝나야 픽커가 반응한다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch04_line_ready",
          label: "안전 점검을 완료한다",
          conditions: [],
          preview: "보스를 유도할 준비를 마친다.",
          effects: [
            { op: "set_flag", target: "flag:ch04_line_ready", value: true },
            { op: "add_stat", target: "noise", value: 2 }
          ],
          next_event_id: "EV_CH04_BOSS_PICKER"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ]);

  prependNodeEvents(chapter, "MJ-02", ["EV_CH04_COLD_AUDIT"]);
  prependNodeEvents(chapter, "MJ-04", ["EV_CH04_RAIL_JAM"]);
  prependNodeEvents(chapter, "MJ-06", ["EV_CH04_SECURITY_SWEEP"]);
  prependNodeEvents(chapter, "MJ-05", ["EV_CH04_LINE_PREP"]);

  updateEvent(chapter, "EV_CH04_BOSS_PICKER", (event) => {
    event.conditions = unique([
      ...(event.conditions ?? []),
      "flag:ch04_rail_clear",
      "flag:ch04_line_ready"
    ]);
  });

  updateEvent(chapter, "EV_CH04_LINE_DECISION", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH04_LINE_PREP";
    }
  });

  updateEvent(chapter, "EV_CH04_RAIL_JAM", (event) => {
    for (const choice of event.choices) {
      addChoiceEffect(choice, { op: "set_flag", target: "flag:ch04_rail_clear", value: true });
      choice.next_event_id = "EV_CH04_ROUTE_SELECTION";
    }
  });
}

function applyCh05(chapter) {
  addObjectives(chapter, [
    {
      objective_id: "obj_ch05_04",
      text: "로비 검문을 돌파한다.",
      required: true,
      complete_when: ["flag:ch05_lobby_access"]
    },
    {
      objective_id: "obj_ch05_05",
      text: "데이터 정리를 완료한다.",
      required: true,
      complete_when: ["flag:ch05_data_sanitized"]
    },
    {
      objective_id: "obj_ch05_06",
      text: "중계 노드를 활성화한다.",
      required: false,
      complete_when: ["flag:ch05_signal_relay"]
    }
  ]);

  addQuestTracks(chapter, [
    {
      quest_track_id: "qt_ch05_main_mirror",
      kind: "main",
      title: "미러센터 접근",
      summary: "냉각 안정화와 데이터 정리를 마친다.",
      entry_event_id: "EV_CH05_ENTRY",
      completion_event_id: "EV_CH05_EXTRACTION",
      objective_ids: ["obj_ch05_01", "obj_ch05_03", "obj_ch05_05"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch05_side_lobby",
      kind: "side",
      title: "로비 검문 돌파",
      summary: "로비 구역을 통과해 내부 접근을 확보한다.",
      entry_event_id: "EV_CH05_LOBBY_CHECKPOINT",
      completion_event_id: "EV_CH05_LOBBY_MAPPING",
      objective_ids: ["obj_ch05_04"],
      unlock_when: []
    },
    {
      quest_track_id: "qt_ch05_side_relay",
      kind: "side",
      title: "중계 노드",
      summary: "스카이워크 중계 노드를 재기동한다.",
      entry_event_id: "EV_CH05_SIGNAL_RELAY",
      completion_event_id: "EV_CH05_KIM_ARA",
      objective_ids: ["obj_ch05_06"],
      unlock_when: []
    }
  ]);

  addEvents(chapter, [
    {
      event_id: "EV_CH05_LOBBY_CHECKPOINT",
      event_type: "exploration",
      node_id: "PG-02",
      title: "로비 검문",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_pangyo_lobby",
        music_key: "tension_low",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "캠퍼스 로비에 임시 검문이 걸려 있다.",
        body: ["출입 기록을 위조하거나 경로를 우회해야 한다.", "늦어질수록 냉각 라인의 압력이 오른다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch05_lobby_forge",
          label: "기록을 위조한다",
          conditions: [],
          preview: "조용히 통과한다.",
          effects: [
            { op: "set_flag", target: "flag:ch05_lobby_access", value: true },
            { op: "add_stat", target: "noise", value: 2 }
          ],
          next_event_id: "EV_CH05_LOBBY_MAPPING"
        },
        {
          choice_id: "ch05_lobby_bypass",
          label: "우회로를 찾는다",
          conditions: [],
          preview: "소음을 감수하고 통과한다.",
          effects: [
            { op: "set_flag", target: "flag:ch05_lobby_access", value: true },
            { op: "add_stat", target: "noise", value: 5 }
          ],
          next_event_id: "EV_CH05_LOBBY_MAPPING"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH05_SIGNAL_RELAY",
      event_type: "dialogue",
      node_id: "PG-03",
      title: "중계 노드 재기동",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_skybridge_relay",
        music_key: "tension_low",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "스카이워크 중계 노드를 재기동한다.",
        body: ["중계가 살아야 김아라의 좌표가 고정된다.", "루프를 안정화하면 하부 진입이 수월해진다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch05_relay_upper",
          label: "상부로 복귀한다",
          conditions: ["flag:ch05_route_upper"],
          preview: "김아라 위치로 이동한다.",
          effects: [
            { op: "set_flag", target: "flag:ch05_signal_relay", value: true },
            { op: "add_stat", target: "noise", value: 2 }
          ],
          next_event_id: "EV_CH05_KIM_ARA"
        },
        {
          choice_id: "ch05_relay_lower",
          label: "하부로 이동한다",
          conditions: ["flag:ch05_route_lower"],
          preview: "냉각 라인으로 이동한다.",
          effects: [
            { op: "set_flag", target: "flag:ch05_signal_relay", value: true },
            { op: "add_stat", target: "contamination", value: 1 }
          ],
          next_event_id: "EV_CH05_COOLING_ROUTE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH05_COOLING_BREACH",
      event_type: "combat",
      node_id: "PG-04",
      title: "냉각설비 과열",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "combat",
        art_key: "bg_cooling_room",
        music_key: "tension_mid",
        widget_overrides: ["noise_meter", "contamination_meter"]
      },
      text: {
        summary: "냉각설비실에서 과열 감염체가 폭주한다.",
        body: ["열기가 심해 방어구 내구도가 빨리 닳는다.", "여기서 정리하지 않으면 서버홀이 과열된다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch05_cooling_break",
          label: "과열체를 제거한다",
          conditions: [],
          preview: "냉각 루트로 진입한다.",
          effects: [
            { op: "set_flag", target: "flag:ch05_cooling_breach", value: true },
            { op: "add_stat", target: "noise", value: 3 }
          ],
          next_event_id: "EV_CH05_COOLING_ROUTE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch05_cooling",
        arena_tags: ["cooling", "heat"],
        victory_effects: [],
        defeat_effects: []
      }
    },
    {
      event_id: "EV_CH05_DATA_SANITIZE",
      event_type: "dialogue",
      node_id: "PG-05",
      title: "데이터 정리",
      repeatable: false,
      once_per_run: true,
      priority: 60,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_server_hall",
        music_key: "tension_low",
        widget_overrides: ["noise_meter"]
      },
      text: {
        summary: "서버홀 데이터 패킷을 정리해 안전한 보관 상태로 만든다.",
        body: ["정리 시간이 길어지지만 신뢰도가 오른다.", "정리하지 않으면 다음 장에서 오류가 누적된다."]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch05_data_sanitize",
          label: "정리를 완료한다",
          conditions: [],
          preview: "안전한 보관 상태로 만든다.",
          effects: [
            { op: "set_flag", target: "flag:ch05_data_sanitized", value: true },
            { op: "grant_loot_table", target: "loot:lt_ch05_server", value: 1 },
            { op: "add_stat", target: "noise", value: 3 }
          ],
          next_event_id: "EV_CH05_BOSS_LINES"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ]);

  prependNodeEvents(chapter, "PG-02", ["EV_CH05_LOBBY_CHECKPOINT"]);
  prependNodeEvents(chapter, "PG-03", ["EV_CH05_SIGNAL_RELAY"]);
  prependNodeEvents(chapter, "PG-04", ["EV_CH05_COOLING_BREACH"]);
  prependNodeEvents(chapter, "PG-05", ["EV_CH05_DATA_SANITIZE"]);

  updateEvent(chapter, "EV_CH05_BOSS_LINES", (event) => {
    event.conditions = unique([
      ...(event.conditions ?? []),
      "flag:ch05_cooling_stable",
      "flag:ch05_data_sanitized"
    ]);
  });

  updateEvent(chapter, "EV_CH05_SKYWALK", (event) => {
    updateChoice(event, "ch05_skywalk_fast", (choice) => {
      addChoiceEffect(choice, { op: "set_flag", target: "flag:ch05_route_upper", value: true });
      choice.next_event_id = "EV_CH05_SIGNAL_RELAY";
    });
    updateChoice(event, "ch05_skywalk_down", (choice) => {
      addChoiceEffect(choice, { op: "set_flag", target: "flag:ch05_route_lower", value: true });
      choice.next_event_id = "EV_CH05_SIGNAL_RELAY";
    });
  });

  updateEvent(chapter, "EV_CH05_DATA_ACCESS", (event) => {
    for (const choice of event.choices) {
      choice.next_event_id = "EV_CH05_DATA_SANITIZE";
    }
  });
}

const chapterPatches = {
  CH01: applyCh01,
  CH02: applyCh02,
  CH03: applyCh03,
  CH04: applyCh04,
  CH05: applyCh05
};

for (const [chapterId, file] of Object.entries(chapterFiles)) {
  const chapter = loadChapter(file);
  const patch = chapterPatches[chapterId];
  if (patch) {
    patch(chapter);
    saveChapter(file, chapter);
  }
}

console.log("Chapter pacing patches applied.");
