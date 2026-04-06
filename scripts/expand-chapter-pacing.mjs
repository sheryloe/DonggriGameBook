import fs from "fs";
import path from "path";

const ROOT = path.resolve(process.cwd(), "codex_webgame_pack", "data", "chapters");

function chapterPath(id) {
  return path.join(ROOT, `${id}.json`);
}

function readChapter(id) {
  return JSON.parse(fs.readFileSync(chapterPath(id), "utf8"));
}

function writeChapter(id, data) {
  fs.writeFileSync(chapterPath(id), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function ensureArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function findEvent(chapter, eventId) {
  const event = chapter.events.find((entry) => entry.event_id === eventId);
  if (!event) {
    throw new Error(`Missing event ${eventId} in ${chapter.chapter_id}`);
  }
  return event;
}

function upsertEvent(chapter, event) {
  const index = chapter.events.findIndex((entry) => entry.event_id === event.event_id);
  if (index === -1) {
    chapter.events.push(event);
  } else {
    chapter.events[index] = event;
  }
}

function upsertObjective(chapter, objective) {
  chapter.objectives = ensureArray(chapter.objectives);
  const index = chapter.objectives.findIndex((entry) => entry.objective_id === objective.objective_id);
  if (index === -1) {
    chapter.objectives.push(objective);
  } else {
    chapter.objectives[index] = objective;
  }
}

function upsertQuestTrack(chapter, track) {
  chapter.quest_tracks = ensureArray(chapter.quest_tracks);
  const index = chapter.quest_tracks.findIndex((entry) => entry.quest_track_id === track.quest_track_id);
  if (index === -1) {
    chapter.quest_tracks.push(track);
  } else {
    chapter.quest_tracks[index] = track;
  }
}

function ensureNodeEvent(chapter, nodeId, eventId) {
  const node = chapter.nodes.find((entry) => entry.node_id === nodeId);
  if (!node) {
    throw new Error(`Missing node ${nodeId} in ${chapter.chapter_id}`);
  }
  if (!node.event_ids.includes(eventId)) {
    node.event_ids.push(eventId);
  }
}

function updateNextForAllChoices(event, nextEventId) {
  event.choices = ensureArray(event.choices);
  event.choices.forEach((choice) => {
    choice.next_event_id = nextEventId;
  });
}

function addChoice(event, choice) {
  event.choices = ensureArray(event.choices);
  if (!event.choices.find((entry) => entry.choice_id === choice.choice_id)) {
    event.choices.push(choice);
  }
}

function applyCh01(chapter) {
  upsertObjective(chapter, {
    objective_id: "obj_ch01_scavenge_route",
    text: "회랑 물자 루트를 확보한다.",
    required: false,
    complete_when: ["flag:ch01_scavenge_done"]
  });

  upsertQuestTrack(chapter, {
    quest_track_id: "qt_ch01_scavenge",
    kind: "side",
    title: "회랑 파밍 루트",
    summary: "방송동 회랑 잔해를 수색해 보급품을 확보한다.",
    entry_event_id: "EV_CH01_CONCOURSE_SCAVENGE",
    completion_event_id: "EV_CH01_CONCOURSE_CACHE",
    objective_ids: ["obj_ch01_scavenge_route"],
    unlock_when: ["flag:ch01_briefing_done"],
    reveal_cap: "ambient"
  });

  const newEvents = [
    {
      event_id: "EV_CH01_CONCOURSE_SCAVENGE",
      event_type: "exploration",
      node_id: "YD-02",
      title: "회랑 잔해 수색",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_sorting_hall",
        music_key: "tension_low"
      },
      text: {
        summary: "무너진 회랑에서 응급 물자를 찾는다.",
        body: [
          "부서진 방송 장비 사이에 비상 상자가 남아 있다.",
          "더 뒤질수록 소음과 오염이 늘어난다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch01_scavenge_open",
          label: "잔해를 뒤진다",
          conditions: [],
          preview: "보급품을 확보한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_scavenge_started",
              value: true
            },
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            }
          ],
          next_event_id: "EV_CH01_CONCOURSE_CACHE"
        },
        {
          choice_id: "ch01_scavenge_skip",
          label: "시간을 아낀다",
          conditions: [],
          preview: "서비스 터널로 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_scavenge_skipped",
              value: true
            }
          ],
          next_event_id: "EV_CH01_SERVICE_TUNNEL"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_CONCOURSE_CACHE",
      event_type: "exploration",
      node_id: "YD-02",
      title: "회랑 물자 더미",
      repeatable: true,
      once_per_run: false,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_sorting_hall",
        music_key: "tension_low"
      },
      text: {
        summary: "남은 상자를 추가로 뒤질 수 있다.",
        body: [
          "수색을 반복할수록 소음과 오염이 누적된다.",
          "필요한 만큼만 챙기고 빠져나가야 한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch01_scavenge_more",
          label: "추가 수색",
          conditions: [],
          preview: "보급품을 더 챙긴다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 3
            },
            {
              op: "add_stat",
              target: "contamination",
              value: 1
            }
          ],
          next_event_id: "EV_CH01_CONCOURSE_CACHE"
        },
        {
          choice_id: "ch01_scavenge_exit",
          label: "철수",
          conditions: [],
          preview: "터널로 복귀한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_scavenge_done",
              value: true
            }
          ],
          next_event_id: "EV_CH01_SERVICE_TUNNEL"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_SECURITY_LOCKER",
      event_type: "exploration",
      node_id: "YD-04",
      title: "보안실 락커",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_security_office",
        music_key: "tension_low"
      },
      text: {
        summary: "봉인된 락커에 예비 장비가 남아 있다.",
        body: [
          "열면 소음이 늘지만 필요한 장비를 얻을 수 있다.",
          "경로는 이미 정해졌다. 바로 이동할 수도 있다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch01_locker_archive_open",
          label: "락커 열고 자료실로 간다",
          conditions: ["flag:ch01_route_archive"],
          preview: "보급품을 챙기고 이동한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            },
            {
              op: "set_flag",
              target: "flag:ch01_security_locker_opened",
              value: true
            }
          ],
          next_event_id: "EV_CH01_ARCHIVE_DECISION"
        },
        {
          choice_id: "ch01_locker_archive_skip",
          label: "시간 아끼고 자료실로 간다",
          conditions: ["flag:ch01_route_archive"],
          preview: "소음을 줄이고 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_security_locker_skipped",
              value: true
            }
          ],
          next_event_id: "EV_CH01_ARCHIVE_DECISION"
        },
        {
          choice_id: "ch01_locker_writer_open",
          label: "락커 열고 편집실로 간다",
          conditions: ["flag:ch01_route_writer"],
          preview: "보급품을 챙기고 이동한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            },
            {
              op: "set_flag",
              target: "flag:ch01_security_locker_opened",
              value: true
            }
          ],
          next_event_id: "EV_CH01_WRITER_RESCUE"
        },
        {
          choice_id: "ch01_locker_writer_skip",
          label: "시간 아끼고 편집실로 간다",
          conditions: ["flag:ch01_route_writer"],
          preview: "소음을 줄이고 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_security_locker_skipped",
              value: true
            }
          ],
          next_event_id: "EV_CH01_WRITER_RESCUE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_ARCHIVE_RUINS",
      event_type: "exploration",
      node_id: "YD-05",
      title: "침수 통로 잔해",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_archive_flooded",
        music_key: "water_dread"
      },
      text: {
        summary: "자료실 입구가 무너져 길을 내야 한다.",
        body: [
          "잔해를 치우면 소음이 늘고 체력이 소모된다.",
          "우회하면 시간은 줄지만 진입이 지연된다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch01_archive_clear",
          label: "잔해를 치운다",
          conditions: [],
          preview: "소음을 감수하고 길을 만든다.",
          effects: [
            {
              op: "add_stat",
              target: "noise",
              value: 2
            }
          ],
          next_event_id: "EV_CH01_ARCHIVE_DECISION"
        },
        {
          choice_id: "ch01_archive_detour",
          label: "좁은 우회로",
          conditions: [],
          preview: "오염을 감수하고 우회한다.",
          effects: [
            {
              op: "add_stat",
              target: "contamination",
              value: 1
            }
          ],
          next_event_id: "EV_CH01_ARCHIVE_DECISION"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_WRITER_SAFEHOUSE",
      event_type: "dialogue",
      node_id: "YD-04",
      title: "편집실 임시 대피처",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_broadcast_corridor",
        music_key: "tension_low"
      },
      text: {
        summary: "잔류자를 진정시키고 장비를 점검한다.",
        body: [
          "응급 키트와 예비 필터가 남아 있다.",
          "머무르면 소음은 늘지만 회복 효과를 얻는다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch01_writer_safe_loot",
          label: "장비를 정리한다",
          conditions: [],
          preview: "보급품을 챙기고 이동한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 1
            },
            {
              op: "set_flag",
              target: "flag:ch01_writer_safehouse",
              value: true
            }
          ],
          next_event_id: "EV_CH01_CACHE_SEARCH"
        },
        {
          choice_id: "ch01_writer_safe_skip",
          label: "곧장 이동",
          conditions: [],
          preview: "시간을 아끼고 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_writer_safehouse_skip",
              value: true
            }
          ],
          next_event_id: "EV_CH01_CACHE_SEARCH"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_ROOFTOP_SWEEP",
      event_type: "exploration",
      node_id: "YD-07",
      title: "옥상 주변 정리",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_rooftop_signal",
        music_key: "tension_mid"
      },
      text: {
        summary: "송신기 주변을 정리해 안정성을 확보할지 결정한다.",
        body: [
          "정리하면 송신 안정성이 오르지만 시간이 든다.",
          "바로 보정하면 빠르지만 방해가 남는다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch01_rooftop_sweep",
          label: "주변 정리",
          conditions: [],
          preview: "안정성을 높인다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_rooftop_sweep",
              value: true
            },
            {
              op: "sub_stat",
              target: "noise",
              value: 1
            }
          ],
          next_event_id: "EV_CH01_SIGNAL_CALIBRATION"
        },
        {
          choice_id: "ch01_rooftop_skip",
          label: "바로 보정",
          conditions: [],
          preview: "시간을 아끼고 보정한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_rooftop_skip",
              value: true
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            }
          ],
          next_event_id: "EV_CH01_SIGNAL_CALIBRATION"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH01_ESCAPE_BACKTRACK",
      event_type: "exploration",
      node_id: "YD-08",
      title: "샛강 잔해 회수",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_saetgang_entry",
        music_key: "tension_mid"
      },
      text: {
        summary: "철수 직전에 남은 장비를 회수할지 결정한다.",
        body: [
          "추가 회수는 위험을 늘리지만 생존 자원을 늘린다.",
          "바로 이동하면 체력 소모를 줄일 수 있다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch01_escape_loot",
          label: "잔해를 회수한다",
          conditions: [],
          preview: "보급품을 추가 확보한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            },
            {
              op: "set_flag",
              target: "flag:ch01_escape_loot",
              value: true
            }
          ],
          next_event_id: "EV_CH01_EXTRACTION_PREP"
        },
        {
          choice_id: "ch01_escape_skip",
          label: "곧장 철수",
          conditions: [],
          preview: "빠르게 이탈한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch01_escape_skip",
              value: true
            }
          ],
          next_event_id: "EV_CH01_EXTRACTION_PREP"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ];

  newEvents.forEach((event) => upsertEvent(chapter, event));

  ensureNodeEvent(chapter, "YD-02", "EV_CH01_CONCOURSE_SCAVENGE");
  ensureNodeEvent(chapter, "YD-02", "EV_CH01_CONCOURSE_CACHE");
  ensureNodeEvent(chapter, "YD-04", "EV_CH01_SECURITY_LOCKER");
  ensureNodeEvent(chapter, "YD-04", "EV_CH01_WRITER_SAFEHOUSE");
  ensureNodeEvent(chapter, "YD-05", "EV_CH01_ARCHIVE_RUINS");
  ensureNodeEvent(chapter, "YD-07", "EV_CH01_ROOFTOP_SWEEP");
  ensureNodeEvent(chapter, "YD-08", "EV_CH01_ESCAPE_BACKTRACK");

  const concourse = findEvent(chapter, "EV_CH01_CONCOURSE_SKIRMISH");
  addChoice(concourse, {
    choice_id: "ch01_concourse_scavenge",
    label: "잔해 수색",
    conditions: [],
    preview: "보급품을 챙기고 이동한다.",
    effects: [
      {
        op: "add_stat",
        target: "noise",
        value: 1
      }
    ],
    next_event_id: "EV_CH01_CONCOURSE_SCAVENGE"
  });

  updateNextForAllChoices(findEvent(chapter, "EV_CH01_SECURITY_CLEAR"), "EV_CH01_SECURITY_LOCKER");
  updateNextForAllChoices(findEvent(chapter, "EV_CH01_ARCHIVE_KEYPAD"), "EV_CH01_ARCHIVE_RUINS");
  updateNextForAllChoices(findEvent(chapter, "EV_CH01_WRITER_RESCUE"), "EV_CH01_WRITER_SAFEHOUSE");
  updateNextForAllChoices(findEvent(chapter, "EV_CH01_ROOFTOP_SIGNAL"), "EV_CH01_ROOFTOP_SWEEP");
  updateNextForAllChoices(findEvent(chapter, "EV_CH01_ESCAPE_RUN"), "EV_CH01_ESCAPE_BACKTRACK");
}

function applyCh02(chapter) {
  upsertObjective(chapter, {
    objective_id: "obj_ch02_farm_route",
    text: "수몰시장 파밍 루트를 정리한다.",
    required: false,
    complete_when: ["flag:ch02_market_route_done"]
  });

  upsertQuestTrack(chapter, {
    quest_track_id: "qt_ch02_scavenge",
    kind: "side",
    title: "수몰시장 파밍 루트",
    summary: "시장 뒤편과 냉각로를 수색해 보급품을 확보한다.",
    entry_event_id: "EV_CH02_MARKET_BACKALLEY",
    completion_event_id: "EV_CH02_MARKET_BACKALLEY_LOOP",
    objective_ids: ["obj_ch02_farm_route"],
    unlock_when: ["flag:ch02_started"],
    reveal_cap: "ambient"
  });

  const newEvents = [
    {
      event_id: "EV_CH02_MARKET_BACKALLEY",
      event_type: "exploration",
      node_id: "NR-02",
      title: "수몰시장 뒤편",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_flooded_market",
        music_key: "market_dread"
      },
      text: {
        summary: "뒤편 창고와 얼음 상자에서 보급품을 수색한다.",
        body: [
          "물에 잠긴 통로는 미끄럽고 시야가 낮다.",
          "더 깊이 들어가면 추가 파밍 루트가 열린다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch02_market_water"],
      choices: [
        {
          choice_id: "ch02_backalley_enter",
          label: "뒤편으로 들어간다",
          conditions: [],
          preview: "보급품을 확보한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_ch02_market_water",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            },
            {
              op: "set_flag",
              target: "flag:ch02_market_backalley",
              value: true
            }
          ],
          next_event_id: "EV_CH02_MARKET_BACKALLEY_LOOP"
        },
        {
          choice_id: "ch02_backalley_skip",
          label: "바로 빠져나간다",
          conditions: [],
          preview: "수위 스캔으로 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_market_backalley_skip",
              value: true
            }
          ],
          next_event_id: "EV_CH02_TIDE_SCAN"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_MARKET_BACKALLEY_LOOP",
      event_type: "exploration",
      node_id: "NR-02",
      title: "시장 파밍 루프",
      repeatable: true,
      once_per_run: false,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_flooded_market",
        music_key: "market_dread"
      },
      text: {
        summary: "남은 상자와 파손된 냉동고를 더 뒤질 수 있다.",
        body: [
          "수색을 반복할수록 소음이 누적된다.",
          "필요한 만큼 챙기고 철수해야 한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch02_market_water"],
      choices: [
        {
          choice_id: "ch02_backalley_more",
          label: "추가 수색",
          conditions: [],
          preview: "보급품을 더 챙긴다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_ch02_market_water",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 3
            },
            {
              op: "add_stat",
              target: "contamination",
              value: 1
            }
          ],
          next_event_id: "EV_CH02_MARKET_BACKALLEY_LOOP"
        },
        {
          choice_id: "ch02_backalley_exit",
          label: "철수",
          conditions: [],
          preview: "수위 스캔으로 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_market_route_done",
              value: true
            }
          ],
          next_event_id: "EV_CH02_TIDE_SCAN"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_COLD_CRAWL",
      event_type: "exploration",
      node_id: "NR-03",
      title: "냉각로 탐색",
      repeatable: true,
      once_per_run: false,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_cold_storage",
        music_key: "tension_mid"
      },
      text: {
        summary: "냉각로 안쪽에 보급품과 배선이 남아 있다.",
        body: [
          "깊게 들어갈수록 소음과 오염이 늘어난다.",
          "필요한 만큼 챙기고 빠져나가야 한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch02_market_water"],
      choices: [
        {
          choice_id: "ch02_cold_crawl_more",
          label: "냉각로 깊게 수색",
          conditions: [],
          preview: "보급품을 더 챙긴다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_ch02_market_water",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            },
            {
              op: "add_stat",
              target: "contamination",
              value: 1
            }
          ],
          next_event_id: "EV_CH02_COLD_CRAWL"
        },
        {
          choice_id: "ch02_cold_crawl_exit",
          label: "빠져나간다",
          conditions: [],
          preview: "침수 구간으로 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_cold_crawl_done",
              value: true
            }
          ],
          next_event_id: "EV_CH02_DROWNED_AMBUSH"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_BLACKMARKET_LEDGER",
      event_type: "dialogue",
      node_id: "NR-04",
      title: "암시장 장부",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "portrait_jung_noah",
        music_key: "under_market"
      },
      text: {
        summary: "천막촌 장부에 검역 패스 거래 루트가 적혀 있다.",
        body: [
          "장부를 확보하면 위험하지만 이후 협상에서 우위를 가진다.",
          "무시하면 빠르게 다음 구간으로 이동할 수 있다."
        ]
      },
      npc_ids: ["npc_jung_noah"],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch02_ledger_take",
          label: "장부를 확보한다",
          conditions: [],
          preview: "거래 루트를 손에 넣는다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_ledger_taken",
              value: true
            },
            {
              op: "add_reputation",
              target: "reputation.under_market",
              value: 1
            }
          ],
          next_event_id: "EV_CH02_DROWNED_AMBUSH"
        },
        {
          choice_id: "ch02_ledger_skip",
          label: "무시하고 이동",
          conditions: [],
          preview: "시간을 아낀다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_ledger_skip",
              value: true
            }
          ],
          next_event_id: "EV_CH02_DROWNED_AMBUSH"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_PIER_ENGINE",
      event_type: "exploration",
      node_id: "NR-05",
      title: "부두 엔진 점검",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_flooded_pier",
        music_key: "pier_tension"
      },
      text: {
        summary: "보트 엔진과 선착장 장비를 점검한다.",
        body: [
          "수리하면 이동 안정성이 높아지지만 소음이 늘어난다.",
          "무시하면 빠르지만 추가 위험이 남는다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch02_market_water"],
      choices: [
        {
          choice_id: "ch02_pier_engine_fix",
          label: "응급 수리",
          conditions: [],
          preview: "안정성을 확보한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_engine_checked",
              value: true
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            },
            {
              op: "grant_loot_table",
              target: "loot:lt_ch02_market_water",
              value: 1
            }
          ],
          next_event_id: "EV_CH02_SLUICE_DIAGNOSTIC"
        },
        {
          choice_id: "ch02_pier_engine_skip",
          label: "빠르게 이동",
          conditions: [],
          preview: "지체하지 않고 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_engine_skip",
              value: true
            }
          ],
          next_event_id: "EV_CH02_SLUICE_DIAGNOSTIC"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH02_SLUICE_PREP",
      event_type: "exploration",
      node_id: "NR-06",
      title: "배수문 방벽 정비",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_sluice_control",
        music_key: "tension_mid"
      },
      text: {
        summary: "제어실 주변을 정리해 보스전에 대비한다.",
        body: [
          "정비하면 안정성은 오르지만 시간과 소음이 늘어난다.",
          "바로 돌입하면 빠르지만 위험이 남는다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch02_sluice_prep",
          label: "방벽 정비",
          conditions: [],
          preview: "안정성을 높인다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_sluice_prepared",
              value: true
            },
            {
              op: "add_stat",
              target: "noise",
              value: 1
            }
          ],
          next_event_id: "EV_CH02_SLUICE_BOSS"
        },
        {
          choice_id: "ch02_sluice_rush",
          label: "바로 돌입",
          conditions: [],
          preview: "시간을 아낀다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch02_sluice_rushed",
              value: true
            }
          ],
          next_event_id: "EV_CH02_SLUICE_BOSS"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ];

  newEvents.forEach((event) => upsertEvent(chapter, event));

  ensureNodeEvent(chapter, "NR-02", "EV_CH02_MARKET_BACKALLEY");
  ensureNodeEvent(chapter, "NR-02", "EV_CH02_MARKET_BACKALLEY_LOOP");
  ensureNodeEvent(chapter, "NR-03", "EV_CH02_COLD_CRAWL");
  ensureNodeEvent(chapter, "NR-04", "EV_CH02_BLACKMARKET_LEDGER");
  ensureNodeEvent(chapter, "NR-05", "EV_CH02_PIER_ENGINE");
  ensureNodeEvent(chapter, "NR-06", "EV_CH02_SLUICE_PREP");

  updateNextForAllChoices(findEvent(chapter, "EV_CH02_MARKET_SWEEP"), "EV_CH02_MARKET_BACKALLEY");
  updateNextForAllChoices(findEvent(chapter, "EV_CH02_COLD_STORAGE"), "EV_CH02_COLD_CRAWL");
  updateNextForAllChoices(findEvent(chapter, "EV_CH02_BLACKMARKET"), "EV_CH02_BLACKMARKET_LEDGER");
  updateNextForAllChoices(findEvent(chapter, "EV_CH02_PIER_BARGAIN"), "EV_CH02_PIER_ENGINE");
  updateNextForAllChoices(findEvent(chapter, "EV_CH02_SLUICE_DIAGNOSTIC"), "EV_CH02_SLUICE_PREP");
}

function applyCh03(chapter) {
  upsertObjective(chapter, {
    objective_id: "obj_ch03_luxury_route",
    text: "상층 파밍 루트를 정리한다.",
    required: false,
    complete_when: ["flag:ch03_luxury_route_done"]
  });

  upsertQuestTrack(chapter, {
    quest_track_id: "qt_ch03_scavenge",
    kind: "side",
    title: "상층 파밍 루트",
    summary: "쇼룸과 상층 보급 라인을 수색해 장비를 확보한다.",
    entry_event_id: "EV_CH03_SHOWROOM_STORAGE",
    completion_event_id: "EV_CH03_LUXURY_SCAVENGE",
    objective_ids: ["obj_ch03_luxury_route"],
    unlock_when: ["flag:ch03_showroom_cleared"],
    reveal_cap: "ambient"
  });

  const newEvents = [
    {
      event_id: "EV_CH03_BASEMENT_SURVEY",
      event_type: "dialogue",
      node_id: "JS-02",
      title: "지하 구역 정찰",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_basement_cache",
        music_key: "basement_safe"
      },
      text: {
        summary: "지하 구역을 훑어보며 이동 경로를 확정한다.",
        body: [
          "물과 전력 라인이 갈라져 있어 선택이 필요하다.",
          "정찰을 길게 하면 상층 경계가 강화될 수 있다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_basement_scout",
          label: "정찰을 마친다",
          conditions: [],
          preview: "캐시 지역으로 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_basement_scouted",
              value: true
            }
          ],
          next_event_id: "EV_CH03_BASEMENT_CACHE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_SERVICE_SPIRAL",
      event_type: "danger",
      node_id: "JS-02",
      title: "서비스 계단 교전",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "boss",
        art_key: "bg_service_stair",
        music_key: "tension_mid",
        widget_overrides: ["boss_hp", "noise_meter"]
      },
      text: {
        summary: "서비스 계단에서 감염체가 길을 막아선다.",
        body: [
          "정리하지 않으면 상층 이동이 지연된다.",
          "소음이 커지면 상층 경계가 강화된다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch03_service_clear",
          label: "계단을 정리한다",
          conditions: [],
          preview: "상층으로 이동한다.",
          effects: [],
          next_event_id: "EV_CH03_SERVICE_AMBUSH"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch03_tower_mid",
        arena_tags: ["service", "stairs"],
        victory_effects: [
          {
            op: "set_flag",
            target: "flag:ch03_service_clear",
            value: true
          },
          {
            op: "grant_loot_table",
            target: "loot:lt_global_basic_office",
            value: 1
          }
        ],
        defeat_effects: [
          {
            op: "add_stat",
            target: "contamination",
            value: 5
          },
          {
            op: "sub_stat",
            target: "hp",
            value: 10
          }
        ]
      }
    },
    {
      event_id: "EV_CH03_SHOWROOM_STORAGE",
      event_type: "exploration",
      node_id: "JS-04",
      title: "쇼룸 보급 라인",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_jamsil_showroom",
        music_key: "glass_creak"
      },
      text: {
        summary: "전시장 뒤편의 보급 라인이 열려 있다.",
        body: [
          "고급 자원 라인을 열면 파밍 루프가 가능하다.",
          "바로 통과하면 전력실로 빠르게 이동한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch03_upper_luxury"],
      choices: [
        {
          choice_id: "ch03_showroom_route",
          label: "보급 라인 연다",
          conditions: [],
          preview: "추가 파밍 루트를 연다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_showroom_route_open",
              value: true
            }
          ],
          next_event_id: "EV_CH03_LUXURY_SCAVENGE"
        },
        {
          choice_id: "ch03_showroom_route_skip",
          label: "바로 통과",
          conditions: [],
          preview: "전력실로 이동한다.",
          effects: [],
          next_event_id: "EV_CH03_SHOWROOM_CACHE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_LUXURY_SCAVENGE",
      event_type: "exploration",
      node_id: "JS-04",
      title: "상층 파밍 루프",
      repeatable: true,
      once_per_run: false,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "bg_jamsil_showroom",
        music_key: "glass_creak"
      },
      text: {
        summary: "고급 전시장과 라운지에서 파밍을 반복할 수 있다.",
        body: [
          "수색을 반복할수록 소음이 누적된다.",
          "필요한 만큼 확보하고 빠져나가야 한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch03_upper_luxury"],
      choices: [
        {
          choice_id: "ch03_luxury_more",
          label: "추가 수색",
          conditions: [],
          preview: "고급 자원을 확보한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_ch03_upper_luxury",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 3
            },
            {
              op: "add_stat",
              target: "contamination",
              value: 1
            }
          ],
          next_event_id: "EV_CH03_LUXURY_SCAVENGE"
        },
        {
          choice_id: "ch03_luxury_exit",
          label: "철수",
          conditions: [],
          preview: "전력실로 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_luxury_route_done",
              value: true
            }
          ],
          next_event_id: "EV_CH03_SHOWROOM_CACHE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_POWER_OVERRUN",
      event_type: "choice",
      node_id: "JS-05",
      title: "전력 과부하 조치",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_power_room",
        music_key: "power_hum"
      },
      text: {
        summary: "분배 직후 과부하 경고가 울린다.",
        body: [
          "안정화하면 소음이 줄지만 시간이 늘어난다.",
          "우회하면 빠르지만 정전 위험이 남는다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_overrun_fix",
          label: "안정화",
          conditions: [],
          preview: "정전을 줄인다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_overrun_fixed",
              value: true
            },
            {
              op: "sub_stat",
              target: "noise",
              value: 1
            }
          ],
          next_event_id: "EV_CH03_BLACKOUT_REPAIR"
        },
        {
          choice_id: "ch03_overrun_skip",
          label: "우회한다",
          conditions: [],
          preview: "빠르게 이동한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_overrun_skip",
              value: true
            }
          ],
          next_event_id: "EV_CH03_BLACKOUT_REPAIR"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_UPPER_SECURITY_SWEEP",
      event_type: "combat",
      node_id: "JS-06",
      title: "상층 경계 정리",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "boss",
        art_key: "bg_jamsil_lobby",
        music_key: "tension_mid",
        widget_overrides: ["boss_hp", "noise_meter"]
      },
      text: {
        summary: "상층 경계조가 스카이브릿지 접근을 막아선다.",
        body: [
          "정리하지 않으면 협상 루트가 막힌다.",
          "소음이 커지면 상층이 더욱 닫힌다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_upper_clear",
          label: "경계를 정리한다",
          conditions: [],
          preview: "보급 라인으로 이동한다.",
          effects: [],
          next_event_id: "EV_CH03_UPPER_SUPPLY"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: [],
      combat: {
        encounter_table_id: "enc_ch03_tower_mid",
        arena_tags: ["lobby", "upper"],
        victory_effects: [
          {
            op: "set_flag",
            target: "flag:ch03_upper_sweep",
            value: true
          }
        ],
        defeat_effects: [
          {
            op: "add_stat",
            target: "contamination",
            value: 6
          },
          {
            op: "sub_stat",
            target: "hp",
            value: 10
          }
        ]
      }
    },
    {
      event_id: "EV_CH03_UPPER_SUPPLY",
      event_type: "exploration",
      node_id: "JS-06",
      title: "상층 보급 라운지",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_jamsil_lobby",
        music_key: "tension_low"
      },
      text: {
        summary: "상층 라운지에 비축 물자가 남아 있다.",
        body: [
          "확보하면 보스전 대비가 쉬워진다.",
          "시간을 늘리면 순찰이 돌아온다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_ch03_upper_luxury"],
      choices: [
        {
          choice_id: "ch03_upper_supply_take",
          label: "보급품 확보",
          conditions: [],
          preview: "고급 자원을 얻는다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_ch03_upper_luxury",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            }
          ],
          next_event_id: "EV_CH03_SKYBRIDGE_ACCESS"
        },
        {
          choice_id: "ch03_upper_supply_skip",
          label: "빠르게 이동",
          conditions: [],
          preview: "스카이브릿지로 간다.",
          effects: [],
          next_event_id: "EV_CH03_SKYBRIDGE_ACCESS"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_SKYBRIDGE_WIND",
      event_type: "exploration",
      node_id: "JS-07",
      title: "스카이브릿지 돌풍",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_skybridge",
        music_key: "glass_creak"
      },
      text: {
        summary: "돌풍이 유리 교각을 뒤흔든다.",
        body: [
          "안전 장치를 설치하면 시간과 소음이 늘어난다.",
          "강행하면 빠르지만 위험이 크다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_bridge_secure",
          label: "안전 장치 설치",
          conditions: [],
          preview: "안정성을 높인다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_bridge_secure",
              value: true
            },
            {
              op: "add_stat",
              target: "noise",
              value: 2
            }
          ],
          next_event_id: "EV_CH03_SKYBRIDGE"
        },
        {
          choice_id: "ch03_bridge_rush",
          label: "강행",
          conditions: [],
          preview: "빠르게 통과한다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_bridge_rush",
              value: true
            },
            {
              op: "add_stat",
              target: "contamination",
              value: 1
            }
          ],
          next_event_id: "EV_CH03_SKYBRIDGE"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_GLASS_ARMORY",
      event_type: "exploration",
      node_id: "JS-08",
      title: "유리정원 전초 정비",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "choice",
        art_key: "bg_rooftop_escape",
        music_key: "tension_low"
      },
      text: {
        summary: "보스전에 앞서 장비를 정비할 마지막 기회다.",
        body: [
          "정비하면 안정성이 높아지지만 시간은 늘어난다.",
          "강행하면 빠르지만 체력 부담이 남는다."
        ]
      },
      npc_ids: [],
      loot_table_ids: ["lt_global_basic_office"],
      choices: [
        {
          choice_id: "ch03_glass_armory",
          label: "정비한다",
          conditions: [],
          preview: "장비를 보강한다.",
          effects: [
            {
              op: "grant_loot_table",
              target: "loot:lt_global_basic_office",
              value: 1
            },
            {
              op: "add_stat",
              target: "noise",
              value: 1
            },
            {
              op: "set_flag",
              target: "flag:ch03_prep_done",
              value: true
            }
          ],
          next_event_id: "EV_CH03_GARDEN_APPROACH"
        },
        {
          choice_id: "ch03_glass_rush",
          label: "바로 돌입",
          conditions: [],
          preview: "시간을 아낀다.",
          effects: [
            {
              op: "set_flag",
              target: "flag:ch03_prep_rushed",
              value: true
            }
          ],
          next_event_id: "EV_CH03_GARDEN_APPROACH"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    },
    {
      event_id: "EV_CH03_GARDEN_APPROACH",
      event_type: "dialogue",
      node_id: "JS-08",
      title: "유리정원 접근",
      repeatable: false,
      once_per_run: true,
      priority: 55,
      conditions: [],
      presentation: {
        layout: "dialogue",
        art_key: "boss_glassgarden",
        music_key: "tension_mid"
      },
      text: {
        summary: "유리정원 중심부가 드러난다.",
        body: [
          "중앙으로 접근할수록 상층의 압박이 커진다.",
          "마지막 결정을 내려야 한다."
        ]
      },
      npc_ids: [],
      loot_table_ids: [],
      choices: [
        {
          choice_id: "ch03_garden_enter",
          label: "정면 돌입",
          conditions: [],
          preview: "보스전에 진입한다.",
          effects: [],
          next_event_id: "EV_CH03_BOSS_GARDEN"
        }
      ],
      on_enter_effects: [],
      on_complete_effects: []
    }
  ];

  newEvents.forEach((event) => upsertEvent(chapter, event));

  ensureNodeEvent(chapter, "JS-02", "EV_CH03_BASEMENT_SURVEY");
  ensureNodeEvent(chapter, "JS-02", "EV_CH03_SERVICE_SPIRAL");
  ensureNodeEvent(chapter, "JS-04", "EV_CH03_SHOWROOM_STORAGE");
  ensureNodeEvent(chapter, "JS-04", "EV_CH03_LUXURY_SCAVENGE");
  ensureNodeEvent(chapter, "JS-05", "EV_CH03_POWER_OVERRUN");
  ensureNodeEvent(chapter, "JS-06", "EV_CH03_UPPER_SECURITY_SWEEP");
  ensureNodeEvent(chapter, "JS-06", "EV_CH03_UPPER_SUPPLY");
  ensureNodeEvent(chapter, "JS-07", "EV_CH03_SKYBRIDGE_WIND");
  ensureNodeEvent(chapter, "JS-08", "EV_CH03_GLASS_ARMORY");
  ensureNodeEvent(chapter, "JS-08", "EV_CH03_GARDEN_APPROACH");

  updateNextForAllChoices(findEvent(chapter, "EV_CH03_BASEMENT_MEET"), "EV_CH03_BASEMENT_SURVEY");
  updateNextForAllChoices(findEvent(chapter, "EV_CH03_BASEMENT_CACHE"), "EV_CH03_SERVICE_SPIRAL");
  updateNextForAllChoices(findEvent(chapter, "EV_CH03_SHOWROOM_AMBUSH"), "EV_CH03_SHOWROOM_STORAGE");
  updateNextForAllChoices(findEvent(chapter, "EV_CH03_POWER_ROUTING"), "EV_CH03_POWER_OVERRUN");
  updateNextForAllChoices(findEvent(chapter, "EV_CH03_UPPER_NEGOTIATION"), "EV_CH03_UPPER_SECURITY_SWEEP");
  updateNextForAllChoices(findEvent(chapter, "EV_CH03_SKYBRIDGE_ACCESS"), "EV_CH03_SKYBRIDGE_WIND");
  updateNextForAllChoices(findEvent(chapter, "EV_CH03_GLASS_PREP"), "EV_CH03_GLASS_ARMORY");
}

const chapters = [
  { id: "ch01", apply: applyCh01 },
  { id: "ch02", apply: applyCh02 },
  { id: "ch03", apply: applyCh03 }
];

for (const { id, apply } of chapters) {
  const data = readChapter(id);
  apply(data);
  writeChapter(id, data);
  console.log(`${id}: events=${data.events.length}, objectives=${data.objectives.length}, tracks=${(data.quest_tracks ?? []).length}`);
}
