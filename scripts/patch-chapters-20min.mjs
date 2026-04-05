
import fs from "fs";

const patches = {
  CH01: {
    file: "codex_webgame_pack/data/chapters/ch01.json",
    objectives: [
      {
        objective_id: "obj_ch01_04",
        text: "전력 패널을 재가동한다.",
        required: false,
        complete_when: ["flag:ch01_power_restored"]
      },
      {
        objective_id: "obj_ch01_05",
        text: "송신기 보정을 완료한다.",
        required: false,
        complete_when: ["flag:ch01_signal_calibrated"]
      },
      {
        objective_id: "obj_ch01_06",
        text: "순찰 편집체를 정리한다.",
        required: false,
        complete_when: ["flag:ch01_patrol_cleared"]
      }
    ],
    quest_tracks: [
      {
        quest_track_id: "qt_ch01_main",
        kind: "main",
        title: "방송동 증폭기 회수",
        summary: "폐방송동에서 단파 증폭기와 송출 로그를 확보해 귀환한다.",
        entry_event_id: "EV_CH01_BRIEFING",
        completion_event_id: "EV_CH01_EXTRACTION",
        objective_ids: ["obj_ch01_01", "obj_ch01_02", "obj_ch01_03"],
        unlock_when: [],
        reveal_cap: "confirmation"
      },
      {
        quest_track_id: "qt_ch01_signal",
        kind: "side",
        title: "송신기 복구",
        summary: "옥상 송신기를 보정해 임시 방송을 안정화한다.",
        entry_event_id: "EV_CH01_POWER_RESET",
        completion_event_id: "EV_CH01_SIGNAL_CALIBRATION",
        objective_ids: ["obj_ch01_04", "obj_ch01_05"],
        unlock_when: ["flag:ch01_briefing_done"],
        reveal_cap: "evidence"
      },
      {
        quest_track_id: "qt_ch01_patrol",
        kind: "side",
        title: "순찰 차단",
        summary: "접근로를 지키는 편집체를 제거해 후퇴로를 확보한다.",
        entry_event_id: "EV_CH01_PATROL_AMBUSH",
        completion_event_id: "EV_CH01_PATROL_AMBUSH",
        objective_ids: ["obj_ch01_06"],
        unlock_when: ["flag:ch01_briefing_done"],
        reveal_cap: "ambient"
      }
    ],
    events: [
      {
        event_id: "EV_CH01_SERVICE_TUNNEL",
        event_type: "scene",
        node_id: "YD-02",
        title: "서비스 터널",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_yeouido_ashroad",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "방송동으로 이어지는 서비스 터널이 좁고 어둡다.",
          body: [
            "환기팬이 멈춘 공간에서 습기와 먼지가 눌어붙는다.",
            "낡은 안내등이 끊어지며 벽면의 그래피티가 일그러진다.",
            "소음을 줄일수록 시간이 늘어나고, 급하게 움직이면 흔적이 남는다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch01_tunnel_silent",
            label: "무전등을 끄고 통과",
            conditions: [],
            preview: "소음을 줄이지만 시간이 늘어난다.",
            effects: [
              { op: "add_stat", target: "noise", value: 1 },
              { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
              { op: "set_flag", target: "flag:ch01_tunnel_passed", value: true }
            ],
            next_event_id: "EV_CH01_LOBBY_SEARCH"
          },
          {
            choice_id: "ch01_tunnel_rush",
            label: "빠르게 돌파",
            conditions: [],
            preview: "시간을 벌지만 소음이 커진다.",
            effects: [
              { op: "add_stat", target: "noise", value: 2 },
              { op: "set_flag", target: "flag:ch01_tunnel_passed", value: true }
            ],
            next_event_id: "EV_CH01_LOBBY_SEARCH"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH01_PATROL_AMBUSH",
        event_type: "combat",
        node_id: "YD-02",
        title: "순찰 감염체",
        repeatable: false,
        once_per_run: true,
        priority: 60,
        conditions: [],
        presentation: {
          layout: "dialogue",
          art_key: "bg_yeouido_ashroad",
          music_key: "tension_mid",
          widget_overrides: []
        },
        text: {
          summary: "잔해 사이에서 순찰 편집체가 튀어나와 통로를 틀어막는다.",
          body: [
            "철제 레일과 카메라 붐이 휘둘리며 접근을 봉쇄한다.",
            "탄약을 아끼려면 빠르게 제압해야 한다.",
            "주변이 좁아 소음이 쉽게 퍼진다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [],
        on_enter_effects: [{ op: "add_stat", target: "noise", value: 1 }],
        on_complete_effects: [],
        next_event_id: "EV_CH01_LOBBY_SEARCH",
        combat: {
          encounter_table_id: "enc_ch01_street_low",
          arena_tags: ["street", "ambush"],
          victory_effects: [
            { op: "set_flag", target: "flag:ch01_patrol_cleared", value: true },
            { op: "add_stat", target: "noise", value: 1 }
          ],
          defeat_effects: [
            { op: "add_stat", target: "contamination", value: 6 },
            { op: "sub_stat", target: "hp", value: 10 }
          ]
        }
      },
      {
        event_id: "EV_CH01_POWER_RESET",
        event_type: "scene",
        node_id: "YD-05",
        title: "전력 리셋",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_archive_flooded",
          music_key: "signal_hiss",
          widget_overrides: []
        },
        text: {
          summary: "옥상 송신기를 살리려면 지하 전력 패널을 다시 켜야 한다.",
          body: [
            "차단기가 내려가 있고, 케이블은 습기로 눅눅하게 늘어져 있다.",
            "주 전원을 올리면 소음이 커지고, 예비 회로는 오염을 부른다.",
            "결정이 늦어지면 송신기 보정 시간이 줄어든다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch01_power_main",
            label: "주 전원을 리셋한다",
            conditions: [],
            preview: "소음을 감수하고 안정적으로 복구한다.",
            effects: [
              { op: "add_stat", target: "noise", value: 3 },
              { op: "set_flag", target: "flag:ch01_power_restored", value: true }
            ],
            next_event_id: "EV_CH01_ROOFTOP_SIGNAL"
          },
          {
            choice_id: "ch01_power_bypass",
            label: "예비 회로로 우회",
            conditions: [],
            preview: "빠르지만 오염 위험이 커진다.",
            effects: [
              { op: "add_stat", target: "contamination", value: 3 },
              { op: "set_flag", target: "flag:ch01_power_restored", value: true }
            ],
            next_event_id: "EV_CH01_ROOFTOP_SIGNAL"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH01_SIGNAL_CALIBRATION",
        event_type: "scene",
        node_id: "YD-07",
        title: "주파수 보정",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_rooftop_signal",
          music_key: "signal_hiss",
          widget_overrides: []
        },
        text: {
          summary: "주파수 보정이 끝나야 송출 로그를 안전하게 확보할 수 있다.",
          body: [
            "바람이 강하고, 폐쇄된 안테나가 기이하게 떨린다.",
            "정밀 보정은 시간을 요구하지만 신호 안정성이 높다.",
            "강제 출력은 빠르지만 후유증이 남는다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch01_signal_precise",
            label: "정밀 보정",
            conditions: [],
            preview: "시간을 들여 안정성을 높인다.",
            effects: [
              { op: "add_stat", target: "noise", value: 1 },
              { op: "set_flag", target: "flag:ch01_signal_calibrated", value: true }
            ],
            next_event_id: "EV_CH01_BOSS_BROADCAST"
          },
          {
            choice_id: "ch01_signal_force",
            label: "강제 출력",
            conditions: [],
            preview: "빠르게 넘어가지만 위험이 늘어난다.",
            effects: [
              { op: "add_stat", target: "contamination", value: 2 },
              { op: "set_flag", target: "flag:ch01_signal_calibrated", value: true }
            ],
            next_event_id: "EV_CH01_BOSS_BROADCAST"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH01_EXTRACTION_PREP",
        event_type: "scene",
        node_id: "YD-08",
        title: "철수 준비",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_emergency_stairs",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "탈출 전에 남은 장비를 정리하고 루트를 확인한다.",
          body: [
            "비상계단 아래로 화염 냄새가 번진다.",
            "지금 챙길 것과 버릴 것을 분리해야 한다.",
            "정리 시간을 늘리면 추격 위험이 커진다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch01_extract_salvage",
            label: "잔해를 정리한다",
            conditions: [],
            preview: "추가 보급품을 확보한다.",
            effects: [{ op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 }],
            next_event_id: "EV_CH01_EXTRACTION"
          },
          {
            choice_id: "ch01_extract_immediate",
            label: "즉시 철수",
            conditions: [],
            preview: "추격 전에 빠져나간다.",
            effects: [{ op: "add_stat", target: "noise", value: 1 }],
            next_event_id: "EV_CH01_EXTRACTION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      }
    ],
    choiceUpdates: [
      { event_id: "EV_CH01_APPROACH", choice_id: "ch01_approach_careful", next_event_id: "EV_CH01_SERVICE_TUNNEL" },
      { event_id: "EV_CH01_APPROACH", choice_id: "ch01_approach_force", next_event_id: "EV_CH01_PATROL_AMBUSH" }
    ],
    allChoiceUpdates: [
      { event_id: "EV_CH01_ARCHIVE_DECISION", next_event_id: "EV_CH01_POWER_RESET" },
      { event_id: "EV_CH01_WRITER_RESCUE", next_event_id: "EV_CH01_POWER_RESET" },
      { event_id: "EV_CH01_ROOFTOP_SIGNAL", next_event_id: "EV_CH01_SIGNAL_CALIBRATION" },
      { event_id: "EV_CH01_BOSS_BROADCAST", next_event_id: "EV_CH01_EXTRACTION_PREP" }
    ]
  },
  CH02: {
    file: "codex_webgame_pack/data/chapters/ch02.json",
    objectives: [
      {
        objective_id: "obj_ch02_04",
        text: "침수 순찰대를 정리한다.",
        required: false,
        complete_when: ["flag:ch02_flood_patrol_clear"]
      },
      {
        objective_id: "obj_ch02_05",
        text: "배수 제어를 안정화한다.",
        required: false,
        complete_when: ["flag:ch02_drainage_stable"]
      },
      {
        objective_id: "obj_ch02_06",
        text: "바지선 수리를 완료한다.",
        required: false,
        complete_when: ["flag:ch02_barge_repair"]
      }
    ],
    quest_tracks: [
      {
        quest_track_id: "qt_ch02_main",
        kind: "main",
        title: "검은 수로 확보",
        summary: "수로 배터리와 지도를 확보해 출구를 연다.",
        entry_event_id: "EV_CH02_ENTRY",
        completion_event_id: "EV_CH02_EXTRACTION",
        objective_ids: ["obj_ch02_01", "obj_ch02_02", "obj_ch02_03"],
        unlock_when: [],
        reveal_cap: "confirmation"
      },
      {
        quest_track_id: "qt_ch02_drainage",
        kind: "side",
        title: "배수 제어",
        summary: "수문을 조정해 시장 수위를 낮춘다.",
        entry_event_id: "EV_CH02_DRAINAGE_CTRL",
        completion_event_id: "EV_CH02_DRAINAGE_CTRL",
        objective_ids: ["obj_ch02_05"],
        unlock_when: ["flag:ch02_started"],
        reveal_cap: "evidence"
      },
      {
        quest_track_id: "qt_ch02_barge",
        kind: "side",
        title: "수송로 복구",
        summary: "바지선을 보강해 이동 속도를 확보한다.",
        entry_event_id: "EV_CH02_BARGE_REPAIR",
        completion_event_id: "EV_CH02_BARGE_REPAIR",
        objective_ids: ["obj_ch02_06"],
        unlock_when: ["flag:ch02_started"],
        reveal_cap: "ambient"
      }
    ],
    events: [
      {
        event_id: "EV_CH02_FLOOD_AMBUSH",
        event_type: "combat",
        node_id: "NR-01",
        title: "침수 순찰",
        repeatable: false,
        once_per_run: true,
        priority: 60,
        conditions: [],
        presentation: {
          layout: "dialogue",
          art_key: "bg_saetgang_entry",
          music_key: "water_dread",
          widget_overrides: []
        },
        text: {
          summary: "흙탕물 속에서 수면 감염체가 몰려와 길을 막는다.",
          body: [
            "가판대 잔해가 떠다니며 발을 잡아끈다.",
            "총성을 내면 더 많은 개체가 몰려들 수 있다.",
            "짧게 끊고 지나가야 한다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [],
        on_enter_effects: [{ op: "add_stat", target: "contamination", value: 2 }],
        on_complete_effects: [],
        next_event_id: "EV_CH02_MARKET_SWEEP",
        combat: {
          encounter_table_id: "enc_ch02_water_market",
          arena_tags: ["flood", "market"],
          victory_effects: [{ op: "set_flag", target: "flag:ch02_flood_patrol_clear", value: true }],
          defeat_effects: [
            { op: "add_stat", target: "contamination", value: 6 },
            { op: "sub_stat", target: "hp", value: 8 }
          ]
        }
      },
      {
        event_id: "EV_CH02_DRAINAGE_CTRL",
        event_type: "scene",
        node_id: "NR-04",
        title: "배수 제어",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_noryangjin_market",
          music_key: "water_dread",
          widget_overrides: []
        },
        text: {
          summary: "배수 제어판을 조작해야 수로가 안정된다.",
          body: [
            "패널은 물에 잠겨 있고, 스위치가 미끄럽다.",
            "개방은 이동을 빠르게 만들지만 침전물이 떠오른다.",
            "봉쇄는 안전하지만 우회 시간이 늘어난다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch02_drainage_open",
            label: "수문 개방",
            conditions: [],
            preview: "속도를 확보하지만 오염이 늘어난다.",
            effects: [
              { op: "add_stat", target: "contamination", value: 2 },
              { op: "set_flag", target: "flag:ch02_drainage_stable", value: true }
            ],
            next_event_id: "EV_CH02_PIER_BARGAIN"
          },
          {
            choice_id: "ch02_drainage_lock",
            label: "수문 봉쇄",
            conditions: [],
            preview: "안전을 택하지만 소음이 늘어난다.",
            effects: [
              { op: "add_stat", target: "noise", value: 2 },
              { op: "set_flag", target: "flag:ch02_drainage_stable", value: true }
            ],
            next_event_id: "EV_CH02_PIER_BARGAIN"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH02_BARGE_REPAIR",
        event_type: "scene",
        node_id: "NR-05",
        title: "바지선 응급수리",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_dongjak_culvert",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "바지선 엔진을 임시 수리해 통로를 확보한다.",
          body: [
            "냉각수 라인이 끊어져 있고, 예비 부품이 부족하다.",
            "간단히 묶어 두면 위험하지만 당장은 움직일 수 있다.",
            "시간을 들여 보강하면 이동이 안정된다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch02_barge_patch",
            label: "임시 보강",
            conditions: [],
            preview: "빠르게 움직이지만 소음이 늘어난다.",
            effects: [
              { op: "add_stat", target: "noise", value: 2 },
              { op: "set_flag", target: "flag:ch02_barge_repair", value: true },
              { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 }
            ],
            next_event_id: "EV_CH02_SLUICE_BOSS"
          },
          {
            choice_id: "ch02_barge_rebuild",
            label: "정밀 수리",
            conditions: [],
            preview: "시간을 쓰지만 안정성이 높다.",
            effects: [
              { op: "set_flag", target: "flag:ch02_barge_repair", value: true },
              { op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 }
            ],
            next_event_id: "EV_CH02_SLUICE_BOSS"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH02_EXTRACTION_PREP",
        event_type: "scene",
        node_id: "NR-07",
        title: "수로 정리",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_dongjak_culvert",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "탈출 전에 장비와 동선을 마지막으로 정리한다.",
          body: [
            "수면 위에 불꽃이 번지기 시작한다.",
            "지금 챙기는 물건이 후속 장면을 좌우한다.",
            "서둘러야 하지만 버릴 것은 버려야 한다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch02_extract_sort",
            label: "정리 후 이동",
            conditions: [],
            preview: "보급품을 챙기지만 시간이 든다.",
            effects: [{ op: "grant_loot_table", target: "loot:lt_ch02_market_water", value: 1 }],
            next_event_id: "EV_CH02_EXTRACTION"
          },
          {
            choice_id: "ch02_extract_run",
            label: "즉시 이탈",
            conditions: [],
            preview: "속도를 우선한다.",
            effects: [{ op: "add_stat", target: "noise", value: 1 }],
            next_event_id: "EV_CH02_EXTRACTION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      }
    ],
    choiceUpdates: [],
    allChoiceUpdates: [
      { event_id: "EV_CH02_ENTRY", next_event_id: "EV_CH02_FLOOD_AMBUSH" },
      { event_id: "EV_CH02_COLD_STORAGE", next_event_id: "EV_CH02_DRAINAGE_CTRL" },
      { event_id: "EV_CH02_BLACKMARKET", next_event_id: "EV_CH02_DRAINAGE_CTRL" },
      { event_id: "EV_CH02_PIER_BARGAIN", next_event_id: "EV_CH02_BARGE_REPAIR" },
      { event_id: "EV_CH02_SLUICE_BOSS", next_event_id: "EV_CH02_EXTRACTION_PREP" }
    ]
  },
  CH03: {
    file: "codex_webgame_pack/data/chapters/ch03.json",
    objectives: [
      {
        objective_id: "obj_ch03_04",
        text: "서비스 계단 매복을 정리한다.",
        required: false,
        complete_when: ["flag:ch03_service_clear"]
      },
      {
        objective_id: "obj_ch03_05",
        text: "정전 복구를 완료한다.",
        required: false,
        complete_when: ["flag:ch03_blackout_repair"]
      },
      {
        objective_id: "obj_ch03_06",
        text: "구조 신호를 확인한다.",
        required: false,
        complete_when: ["flag:ch03_rescue_detour_done"]
      }
    ],
    quest_tracks: [
      {
        quest_track_id: "qt_ch03_main",
        kind: "main",
        title: "유리정원 돌파",
        summary: "축전지와 릴레이 렌즈를 확보해 잠실권을 통과한다.",
        entry_event_id: "EV_CH03_ENTRY",
        completion_event_id: "EV_CH03_EXTRACTION",
        objective_ids: ["obj_ch03_01", "obj_ch03_02", "obj_ch03_03"],
        unlock_when: [],
        reveal_cap: "confirmation"
      },
      {
        quest_track_id: "qt_ch03_blackout",
        kind: "side",
        title: "정전 복구",
        summary: "상층 전력을 복구해 안전한 통로를 만든다.",
        entry_event_id: "EV_CH03_BLACKOUT_REPAIR",
        completion_event_id: "EV_CH03_BLACKOUT_REPAIR",
        objective_ids: ["obj_ch03_05"],
        unlock_when: ["flag:ch03_started"],
        reveal_cap: "evidence"
      },
      {
        quest_track_id: "qt_ch03_rescue",
        kind: "side",
        title: "구조 신호",
        summary: "신호의 근원을 확인해 추가 보급을 확보한다.",
        entry_event_id: "EV_CH03_RESCUE_DETOUR",
        completion_event_id: "EV_CH03_RESCUE_DETOUR",
        objective_ids: ["obj_ch03_06"],
        unlock_when: ["flag:ch03_rescue_signal"],
        reveal_cap: "ambient"
      }
    ],
    events: [
      {
        event_id: "EV_CH03_SERVICE_AMBUSH",
        event_type: "combat",
        node_id: "JS-02",
        title: "서비스 계단 매복",
        repeatable: false,
        once_per_run: true,
        priority: 60,
        conditions: [],
        presentation: {
          layout: "dialogue",
          art_key: "bg_service_stair",
          music_key: "tension_mid",
          widget_overrides: []
        },
        text: {
          summary: "서비스 계단에서 창유체가 몰려와 퇴로를 끊는다.",
          body: [
            "계단 틈새로 금속 파편이 떨어지고, 유리 부스러기가 흩어진다.",
            "좁은 공간이라 회피가 어렵다.",
            "빠르게 끊고 나가야 상층으로 이동할 수 있다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [],
        on_enter_effects: [{ op: "add_stat", target: "noise", value: 1 }],
        on_complete_effects: [],
        next_event_id: "EV_CH03_VERTICAL_ROUTE",
        combat: {
          encounter_table_id: "enc_ch03_tower_mid",
          arena_tags: ["stair", "ambush"],
          victory_effects: [{ op: "set_flag", target: "flag:ch03_service_clear", value: true }],
          defeat_effects: [
            { op: "add_stat", target: "contamination", value: 5 },
            { op: "sub_stat", target: "hp", value: 10 }
          ]
        }
      },
      {
        event_id: "EV_CH03_SHOWROOM_CACHE",
        event_type: "scene",
        node_id: "JS-04",
        title: "쇼룸 보급품",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_jamsil_showroom",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "전시 캐비닛 뒤에 보급품이 숨겨져 있다.",
          body: [
            "유리 전시대가 깨져 있고, 바닥에는 흙물이 고여 있다.",
            "탐색을 오래 하면 위층 순찰에 들킬 수 있다.",
            "지금 확보할 것과 지나갈 것을 정해야 한다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch03_showroom_search",
            label: "깊게 수색",
            conditions: [],
            preview: "시간을 쓰고 보급품을 확보한다.",
            effects: [
              { op: "add_stat", target: "noise", value: 1 },
              { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 }
            ],
            next_event_id: "EV_CH03_POWER_ROUTING"
          },
          {
            choice_id: "ch03_showroom_pass",
            label: "흔적만 확인",
            conditions: [],
            preview: "빠르게 통과한다.",
            effects: [{ op: "add_stat", target: "noise", value: 0 }],
            next_event_id: "EV_CH03_POWER_ROUTING"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH03_BLACKOUT_REPAIR",
        event_type: "scene",
        node_id: "JS-05",
        title: "정전 복구",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_power_room",
          music_key: "signal_hiss",
          widget_overrides: []
        },
        text: {
          summary: "전력 분배를 재조정해 상층 통로를 살린다.",
          body: [
            "제어반은 차단되어 있고, 회로에서 열이 새어 나온다.",
            "상층 우선은 빠르지만 하층의 안전이 내려간다.",
            "균형 복구는 느리지만 전체 안전도가 높다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch03_blackout_upper",
            label: "상층 우선",
            conditions: [],
            preview: "빠르게 이동한다.",
            effects: [
              { op: "add_stat", target: "noise", value: 2 },
              { op: "set_flag", target: "flag:ch03_blackout_repair", value: true }
            ],
            next_event_id: "EV_CH03_UPPER_NEGOTIATION"
          },
          {
            choice_id: "ch03_blackout_balance",
            label: "균형 복구",
            conditions: [],
            preview: "안전을 확보한다.",
            effects: [
              { op: "add_stat", target: "contamination", value: 1 },
              { op: "set_flag", target: "flag:ch03_blackout_repair", value: true }
            ],
            next_event_id: "EV_CH03_UPPER_NEGOTIATION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH03_RESCUE_DETOUR",
        event_type: "scene",
        node_id: "JS-07",
        title: "구조 신호",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_skybridge",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "스카이브리지 너머에서 구조 신호가 끊어진다.",
          body: [
            "점멸하는 비상등이 방향을 가리킨다.",
            "우회하면 보급품을 얻을 수 있지만 전투 위험이 커진다.",
            "무시하고 통과하면 보스전에 바로 진입할 수 있다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch03_rescue_detour",
            label: "신호를 확인한다",
            conditions: [],
            preview: "우회해 보급품을 확보한다.",
            effects: [
              { op: "set_flag", target: "flag:ch03_rescue_detour_done", value: true },
              { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 }
            ],
            next_event_id: "EV_CH03_BOSS_GARDEN"
          },
          {
            choice_id: "ch03_rescue_skip",
            label: "무시하고 통과",
            conditions: [],
            preview: "위험을 줄인다.",
            effects: [
              { op: "set_flag", target: "flag:ch03_rescue_detour_done", value: true },
              { op: "add_stat", target: "noise", value: 1 }
            ],
            next_event_id: "EV_CH03_BOSS_GARDEN"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH03_EXTRACTION_PRESSURE",
        event_type: "scene",
        node_id: "JS-08",
        title: "추출 압박",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_rooftop_escape",
          music_key: "tension_mid",
          widget_overrides: []
        },
        text: {
          summary: "옥상 이탈 직전 추격 신호가 겹친다.",
          body: [
            "송신선이 흔들리고, 유리 파편이 바람에 실린다.",
            "연막을 쓰면 노이즈가 줄지만 장비가 소모된다.",
            "속도로 밀어붙이면 상처가 늘어난다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch03_extract_smoke",
            label: "연막 투입",
            conditions: [],
            preview: "소음을 낮춘다.",
            effects: [{ op: "sub_stat", target: "noise", value: 1 }],
            next_event_id: "EV_CH03_EXTRACTION"
          },
          {
            choice_id: "ch03_extract_push",
            label: "속도 유지",
            conditions: [],
            preview: "부상을 감수한다.",
            effects: [{ op: "sub_stat", target: "hp", value: 5 }],
            next_event_id: "EV_CH03_EXTRACTION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      }
    ],
    choiceUpdates: [],
    allChoiceUpdates: [
      { event_id: "EV_CH03_BASEMENT_MEET", next_event_id: "EV_CH03_SERVICE_AMBUSH" },
      { event_id: "EV_CH03_SHOWROOM_SWEEP", next_event_id: "EV_CH03_SHOWROOM_CACHE" },
      { event_id: "EV_CH03_POWER_ROUTING", next_event_id: "EV_CH03_BLACKOUT_REPAIR" },
      { event_id: "EV_CH03_SKYBRIDGE", next_event_id: "EV_CH03_RESCUE_DETOUR" },
      { event_id: "EV_CH03_BOSS_GARDEN", next_event_id: "EV_CH03_EXTRACTION_PRESSURE" }
    ]
  },
  CH04: {
    file: "codex_webgame_pack/data/chapters/ch04.json",
    objectives: [
      {
        objective_id: "obj_ch04_04",
        text: "터널 매복을 정리한다.",
        required: false,
        complete_when: ["flag:ch04_tunnel_clear"]
      },
      {
        objective_id: "obj_ch04_05",
        text: "선로 장애를 제거한다.",
        required: false,
        complete_when: ["flag:ch04_rail_jam_fixed"]
      },
      {
        objective_id: "obj_ch04_06",
        text: "정비창 거래를 마친다.",
        required: false,
        complete_when: ["flag:ch04_vendor_bartered"]
      }
    ],
    quest_tracks: [
      {
        quest_track_id: "qt_ch04_main",
        kind: "main",
        title: "상자들의 도시",
        summary: "배지와 진입권을 확보해 판교 구역을 통과한다.",
        entry_event_id: "EV_CH04_ENTRY",
        completion_event_id: "EV_CH04_EXTRACTION",
        objective_ids: ["obj_ch04_01", "obj_ch04_02", "obj_ch04_03"],
        unlock_when: [],
        reveal_cap: "confirmation"
      },
      {
        quest_track_id: "qt_ch04_rail",
        kind: "side",
        title: "선로 복구",
        summary: "선로 장애를 제거해 화물 이동을 안정화한다.",
        entry_event_id: "EV_CH04_RAIL_JAM",
        completion_event_id: "EV_CH04_RAIL_JAM",
        objective_ids: ["obj_ch04_05"],
        unlock_when: ["flag:ch04_started"],
        reveal_cap: "evidence"
      },
      {
        quest_track_id: "qt_ch04_vendor",
        kind: "side",
        title: "정비창 거래",
        summary: "정비창에서 필요한 보급과 정보를 확보한다.",
        entry_event_id: "EV_CH04_VENDOR_BARTER",
        completion_event_id: "EV_CH04_VENDOR_BARTER",
        objective_ids: ["obj_ch04_06"],
        unlock_when: ["flag:ch04_started"],
        reveal_cap: "ambient"
      }
    ],
    events: [
      {
        event_id: "EV_CH04_TUNNEL_AMBUSH",
        event_type: "combat",
        node_id: "MJ-01",
        title: "물류 터널 매복",
        repeatable: false,
        once_per_run: true,
        priority: 60,
        conditions: [],
        presentation: {
          layout: "dialogue",
          art_key: "bg_delivery_tunnel",
          music_key: "tension_mid",
          widget_overrides: []
        },
        text: {
          summary: "물류 터널에서 분류체가 몰려와 진입을 막는다.",
          body: [
            "컨베이어가 멈추며 쇳소리가 울린다.",
            "공간이 좁아 회피가 어렵다.",
            "빠르게 정리하지 않으면 뒤가 막힌다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [],
        on_enter_effects: [{ op: "add_stat", target: "noise", value: 1 }],
        on_complete_effects: [],
        next_event_id: "EV_CH04_COLD_ALLOC",
        combat: {
          encounter_table_id: "enc_ch04_logistics_floor",
          arena_tags: ["tunnel", "logistics"],
          victory_effects: [{ op: "set_flag", target: "flag:ch04_tunnel_clear", value: true }],
          defeat_effects: [
            { op: "add_stat", target: "contamination", value: 4 },
            { op: "sub_stat", target: "hp", value: 10 }
          ]
        }
      },
      {
        event_id: "EV_CH04_RAIL_JAM",
        event_type: "scene",
        node_id: "MJ-04",
        title: "선로 장애",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_rail_transfer",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "선로 분기 장치가 얼어붙어 길이 막혀 있다.",
          body: [
            "작업등이 깜박이며 냉기가 번진다.",
            "강제로 열면 소음이 크고, 복구하면 시간이 든다.",
            "어느 쪽이든 통로를 확보해야 한다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch04_rail_force",
            label: "강제로 개방",
            conditions: [],
            preview: "소음을 감수한다.",
            effects: [
              { op: "add_stat", target: "noise", value: 2 },
              { op: "set_flag", target: "flag:ch04_rail_jam_fixed", value: true }
            ],
            next_event_id: "EV_CH04_SECURITY_BADGES"
          },
          {
            choice_id: "ch04_rail_repair",
            label: "정상 복구",
            conditions: [],
            preview: "시간이 늘지만 안전하다.",
            effects: [
              { op: "add_stat", target: "contamination", value: 1 },
              { op: "set_flag", target: "flag:ch04_rail_jam_fixed", value: true }
            ],
            next_event_id: "EV_CH04_SECURITY_BADGES"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH04_VENDOR_BARTER",
        event_type: "scene",
        node_id: "MJ-06",
        title: "정비창 거래",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_security_office",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "정비창에서 보급과 정보를 맞교환한다.",
          body: [
            "남은 공구와 배지 조각이 테이블 위에 흩어져 있다.",
            "교환을 하면 다음 구역 정보가 열린다.",
            "흥정에 실패하면 소음만 남는다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch04_vendor_trade",
            label: "거래한다",
            conditions: [],
            preview: "보급품을 확보한다.",
            effects: [
              { op: "set_flag", target: "flag:ch04_vendor_bartered", value: true },
              { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 }
            ],
            next_event_id: "EV_CH04_LINE_DECISION"
          },
          {
            choice_id: "ch04_vendor_skip",
            label: "건너뛴다",
            conditions: [],
            preview: "시간을 줄인다.",
            effects: [{ op: "set_flag", target: "flag:ch04_vendor_bartered", value: true }],
            next_event_id: "EV_CH04_LINE_DECISION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH04_EXTRACTION_PREP",
        event_type: "scene",
        node_id: "MJ-07",
        title: "추출 정리",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_delivery_tunnel",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "추출 직전 장비와 경로를 다시 정리한다.",
          body: [
            "분류기가 멈춘 틈에 적막이 흐른다.",
            "지금 챙길 보급이 이후 루프에 영향을 준다.",
            "서두르면 흔적이 남는다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch04_extract_sort",
            label: "정리 후 이동",
            conditions: [],
            preview: "보급품을 챙긴다.",
            effects: [{ op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 }],
            next_event_id: "EV_CH04_EXTRACTION"
          },
          {
            choice_id: "ch04_extract_run",
            label: "즉시 이탈",
            conditions: [],
            preview: "속도를 우선한다.",
            effects: [{ op: "add_stat", target: "noise", value: 1 }],
            next_event_id: "EV_CH04_EXTRACTION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      }
    ],
    choiceUpdates: [],
    allChoiceUpdates: [
      { event_id: "EV_CH04_ENTRY", next_event_id: "EV_CH04_TUNNEL_AMBUSH" },
      { event_id: "EV_CH04_ROUTE_SELECTION", next_event_id: "EV_CH04_RAIL_JAM" },
      { event_id: "EV_CH04_SECURITY_BADGES", next_event_id: "EV_CH04_VENDOR_BARTER" },
      { event_id: "EV_CH04_BOSS_PICKER", next_event_id: "EV_CH04_EXTRACTION_PREP" }
    ]
  },
  CH05: {
    file: "codex_webgame_pack/data/chapters/ch05.json",
    objectives: [
      {
        objective_id: "obj_ch05_04",
        text: "진입 램프를 정리한다.",
        required: false,
        complete_when: ["flag:ch05_ramp_cleared"]
      },
      {
        objective_id: "obj_ch05_05",
        text: "보안 콘솔을 활성화한다.",
        required: false,
        complete_when: ["flag:ch05_security_console"]
      },
      {
        objective_id: "obj_ch05_06",
        text: "서버 흔적을 정리한다.",
        required: false,
        complete_when: ["flag:ch05_server_purged"]
      }
    ],
    quest_tracks: [
      {
        quest_track_id: "qt_ch05_main",
        kind: "main",
        title: "미러센터 돌파",
        summary: "접근 키와 인증값을 확보해 최종 신호를 완성한다.",
        entry_event_id: "EV_CH05_ENTRY",
        completion_event_id: "EV_CH05_EXTRACTION",
        objective_ids: ["obj_ch05_01", "obj_ch05_02", "obj_ch05_03"],
        unlock_when: [],
        reveal_cap: "confirmation"
      },
      {
        quest_track_id: "qt_ch05_ramp",
        kind: "side",
        title: "진입 램프 확보",
        summary: "초입 램프를 정리해 후퇴 경로를 확보한다.",
        entry_event_id: "EV_CH05_RAMP_SWARM",
        completion_event_id: "EV_CH05_RAMP_SWARM",
        objective_ids: ["obj_ch05_04"],
        unlock_when: ["flag:ch05_started"],
        reveal_cap: "ambient"
      },
      {
        quest_track_id: "qt_ch05_server",
        kind: "side",
        title: "서버 정리",
        summary: "서버홀 흔적을 정리해 추적을 차단한다.",
        entry_event_id: "EV_CH05_SERVER_PURGE",
        completion_event_id: "EV_CH05_SERVER_PURGE",
        objective_ids: ["obj_ch05_06"],
        unlock_when: ["flag:ch05_map_obtained"],
        reveal_cap: "evidence"
      }
    ],
    events: [
      {
        event_id: "EV_CH05_RAMP_SWARM",
        event_type: "combat",
        node_id: "PG-01",
        title: "램프 난전",
        repeatable: false,
        once_per_run: true,
        priority: 60,
        conditions: [],
        presentation: {
          layout: "dialogue",
          art_key: "bg_pangyo_interchange",
          music_key: "tension_mid",
          widget_overrides: []
        },
        text: {
          summary: "진입 램프에서 에코어가 몰려와 발을 붙잡는다.",
          body: [
            "교차로 표지판이 흔들리고, 잔해가 미끄러진다.",
            "짧게 끊고 나가야 로비로 접근할 수 있다.",
            "교전이 길어질수록 오염이 쌓인다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [],
        on_enter_effects: [{ op: "add_stat", target: "contamination", value: 2 }],
        on_complete_effects: [],
        next_event_id: "EV_CH05_LOBBY_MAPPING",
        combat: {
          encounter_table_id: "enc_ch05_cooling",
          arena_tags: ["ramp", "interchange"],
          victory_effects: [{ op: "set_flag", target: "flag:ch05_ramp_cleared", value: true }],
          defeat_effects: [
            { op: "add_stat", target: "contamination", value: 6 },
            { op: "sub_stat", target: "hp", value: 10 }
          ]
        }
      },
      {
        event_id: "EV_CH05_SECURITY_CONSOLE",
        event_type: "scene",
        node_id: "PG-02",
        title: "보안 콘솔",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_pangyo_lobby",
          music_key: "signal_hiss",
          widget_overrides: []
        },
        text: {
          summary: "로비 보안 콘솔을 조작해 통로를 연다.",
          body: [
            "가동 로그가 남아 있어 추적 위험이 있다.",
            "수동 조작은 느리지만 흔적이 적다.",
            "자동 재가동은 빠르지만 소음이 커진다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch05_console_manual",
            label: "수동 조작",
            conditions: [],
            preview: "조용하지만 시간이 든다.",
            effects: [
              { op: "add_stat", target: "noise", value: 1 },
              { op: "set_flag", target: "flag:ch05_security_console", value: true }
            ],
            next_event_id: "EV_CH05_SKYWALK"
          },
          {
            choice_id: "ch05_console_auto",
            label: "자동 재가동",
            conditions: [],
            preview: "빠르지만 흔적이 남는다.",
            effects: [
              { op: "add_stat", target: "noise", value: 3 },
              { op: "set_flag", target: "flag:ch05_security_console", value: true }
            ],
            next_event_id: "EV_CH05_SKYWALK"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH05_SERVER_PURGE",
        event_type: "scene",
        node_id: "PG-05",
        title: "서버 정리",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_arkp_serverhall",
          music_key: "tension_mid",
          widget_overrides: []
        },
        text: {
          summary: "서버홀에서 흔적 삭제 또는 데이터 확보를 선택한다.",
          body: [
            "쿨링 팬이 멈추며 열기가 밀려온다.",
            "흔적을 지우면 추적이 줄지만 보상도 줄어든다.",
            "데이터를 더 확보하면 위험이 커진다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch05_server_purge",
            label: "흔적 삭제",
            conditions: [],
            preview: "추적을 줄인다.",
            effects: [{ op: "set_flag", target: "flag:ch05_server_purged", value: true }],
            next_event_id: "EV_CH05_BOSS_LINES"
          },
          {
            choice_id: "ch05_server_grab",
            label: "데이터 추가 확보",
            conditions: [],
            preview: "보상을 노린다.",
            effects: [
              { op: "set_flag", target: "flag:ch05_server_purged", value: true },
              { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 }
            ],
            next_event_id: "EV_CH05_BOSS_LINES"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      },
      {
        event_id: "EV_CH05_EXIT_PRESSURE",
        event_type: "scene",
        node_id: "PG-07",
        title: "출구 압박",
        repeatable: false,
        once_per_run: true,
        priority: 55,
        conditions: [],
        presentation: {
          layout: "choice",
          art_key: "bg_arkp_exit",
          music_key: "tension_low",
          widget_overrides: []
        },
        text: {
          summary: "출구 방호막이 흔들리고 추격 신호가 번진다.",
          body: [
            "방호막이 깨지기 전에 통로를 확보해야 한다.",
            "연막을 쓰면 소음을 줄일 수 있다.",
            "서두르면 체력이 소모된다."
          ]
        },
        npc_ids: [],
        loot_table_ids: [],
        choices: [
          {
            choice_id: "ch05_exit_smoke",
            label: "연막 투입",
            conditions: [],
            preview: "소음을 낮춘다.",
            effects: [{ op: "sub_stat", target: "noise", value: 1 }],
            next_event_id: "EV_CH05_EXTRACTION"
          },
          {
            choice_id: "ch05_exit_push",
            label: "속도 유지",
            conditions: [],
            preview: "체력을 소모한다.",
            effects: [{ op: "sub_stat", target: "hp", value: 5 }],
            next_event_id: "EV_CH05_EXTRACTION"
          }
        ],
        on_enter_effects: [],
        on_complete_effects: []
      }
    ],
    choiceUpdates: [],
    allChoiceUpdates: [
      { event_id: "EV_CH05_ENTRY", next_event_id: "EV_CH05_RAMP_SWARM" },
      { event_id: "EV_CH05_LOBBY_MAPPING", next_event_id: "EV_CH05_SECURITY_CONSOLE" },
      { event_id: "EV_CH05_DATA_ACCESS", next_event_id: "EV_CH05_SERVER_PURGE" },
      { event_id: "EV_CH05_BOSS_LINES", next_event_id: "EV_CH05_EXIT_PRESSURE" }
    ]
  }
};

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function upsertById(list, items, idKey) {
  const map = new Map((list ?? []).map((entry) => [entry[idKey], entry]));
  for (const item of items ?? []) {
    map.set(item[idKey], item);
  }
  return Array.from(map.values());
}

function setChoiceNextEvent(data, eventId, choiceId, nextEventId) {
  const event = data.events.find((entry) => entry.event_id === eventId);
  if (!event) {
    throw new Error(`Event ${eventId} not found`);
  }
  const choice = event.choices.find((entry) => entry.choice_id === choiceId);
  if (!choice) {
    throw new Error(`Choice ${choiceId} not found in ${eventId}`);
  }
  choice.next_event_id = nextEventId;
}

function setAllChoicesNextEvent(data, eventId, nextEventId) {
  const event = data.events.find((entry) => entry.event_id === eventId);
  if (!event) {
    throw new Error(`Event ${eventId} not found`);
  }
  for (const choice of event.choices) {
    choice.next_event_id = nextEventId;
  }
}

for (const [chapterId, patch] of Object.entries(patches)) {
  const data = loadJson(patch.file);
  data.objectives = upsertById(data.objectives ?? [], patch.objectives, "objective_id");
  data.quest_tracks = patch.quest_tracks;
  data.events = upsertById(data.events ?? [], patch.events, "event_id");

  for (const update of patch.choiceUpdates ?? []) {
    setChoiceNextEvent(data, update.event_id, update.choice_id, update.next_event_id);
  }

  for (const update of patch.allChoiceUpdates ?? []) {
    setAllChoicesNextEvent(data, update.event_id, update.next_event_id);
  }

  saveJson(patch.file, data);
  console.log(`patched ${chapterId}`);
}
