import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const chapterDir = path.join(root, "codex_webgame_pack", "data", "chapters");
const uiDir = path.join(root, "ui");
const videoPromptDir = path.join(root, "docs", "asset-prompt-pack", "part1-video-prompts");

const chapterCinematics = {
  CH01: {
    still_art_key: "briefing_p1_ch01",
    world_map_art_key: "map_p1_ch01",
    anchor_portrait_key: "portrait_yoon_haein",
    support_portrait_key: "npc_support_writer",
    boss_splash_key: "boss_editing_aberration",
    result_card_art_key: "result_p1_ch01",
    teaser_prompt_id: "P1_CH01_OPENING"
  },
  CH02: {
    still_art_key: "briefing_p1_ch02",
    world_map_art_key: "map_p1_ch02",
    anchor_portrait_key: "portrait_jung_noah",
    support_portrait_key: "portrait_seo_jinseo",
    boss_splash_key: "boss_cheongeum",
    result_card_art_key: "result_p1_ch02",
    teaser_prompt_id: "P1_CH02_OPENING"
  },
  CH03: {
    still_art_key: "briefing_p1_ch03",
    world_map_art_key: "map_p1_ch03",
    anchor_portrait_key: "portrait_ahn_bogyeong",
    support_portrait_key: "portrait_ryu_seon",
    boss_splash_key: "boss_glassgarden",
    result_card_art_key: "result_p1_ch03",
    teaser_prompt_id: "P1_CH03_OPENING"
  },
  CH04: {
    still_art_key: "briefing_p1_ch04",
    world_map_art_key: "map_p1_ch04",
    anchor_portrait_key: "portrait_han_somyeong",
    support_portrait_key: "portrait_jung_noah",
    boss_splash_key: "boss_picker_prime",
    result_card_art_key: "result_p1_ch04",
    teaser_prompt_id: "P1_CH04_OPENING"
  },
  CH05: {
    still_art_key: "briefing_p1_ch05",
    world_map_art_key: "map_p1_ch05",
    anchor_portrait_key: "portrait_kim_ara",
    support_portrait_key: "portrait_yoon_haein",
    boss_splash_key: "boss_mirror_lines",
    result_card_art_key: "result_p1_ch05",
    teaser_prompt_id: "P1_CH05_OPENING"
  }
};

const routeEffectMap = {
  CH01: {
    EV_CH01_ARCHIVE_DECISION: {
      ch01_archive_open: [
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "add_stat", target: "route.strain", value: 1 },
        { op: "set_flag", target: "flag:part1_evidence_ch01", value: true }
      ],
      ch01_archive_skip: [
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "add_stat", target: "route.truth_score", value: -1 }
      ]
    },
    EV_CH01_WRITER_RESCUE: {
      ch01_writer_rescue: [
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_stat", target: "route.compassion_score", value: 1 }
      ],
      ch01_writer_leave: [
        { op: "set_value", target: "route.compassion", value: "pragmatic" },
        { op: "add_stat", target: "route.compassion_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH01_ROOFTOP_SIGNAL: {
      ch01_signal_keep_broadcast: [
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "add_stat", target: "route.strain", value: 2 }
      ],
      ch01_signal_cut_broadcast: [
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "add_stat", target: "route.truth_score", value: -1 }
      ]
    },
    EV_CH01_CONTROL_RESTORE: {
      ch01_control_repair: [
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_stat", target: "route.control_score", value: 1 }
      ],
      ch01_control_bypass: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    }
  },
  CH02: {
    EV_CH02_BLACKMARKET: {
      ch02_market_trade: [
        { op: "set_value", target: "route.underworld", value: "clean" },
        { op: "add_stat", target: "route.underworld_score", value: 1 }
      ],
      ch02_market_rob: [
        { op: "set_value", target: "route.underworld", value: "forge" },
        { op: "add_stat", target: "route.underworld_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH02_DRAINAGE_CTRL: {
      ch02_drainage_open: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 }
      ],
      ch02_drainage_lock: [
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_stat", target: "route.control_score", value: 1 }
      ]
    },
    EV_CH02_SLUICE_OVERRIDE: {
      ch02_sluice_reset: [
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_stat", target: "route.control_score", value: 1 }
      ],
      ch02_sluice_bypass: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH02_BLACKMARKET_LEDGER: {
      ch02_ledger_take: [
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "set_flag", target: "flag:part1_evidence_ch02", value: true }
      ],
      ch02_ledger_skip: [
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "add_stat", target: "route.truth_score", value: -1 }
      ]
    }
  },
  CH03: {
    EV_CH03_SKYBRIDGE: {
      ch03_bridge_signal: [
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "add_stat", target: "route.strain", value: 2 },
        { op: "set_flag", target: "flag:part1_evidence_ch03", value: true }
      ],
      ch03_bridge_silent: [
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "add_stat", target: "route.truth_score", value: -1 }
      ]
    },
    EV_CH03_RESCUE_DETOUR: {
      ch03_rescue_help: [
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_stat", target: "route.compassion_score", value: 1 }
      ],
      ch03_rescue_mark: [
        { op: "set_value", target: "route.compassion", value: "pragmatic" },
        { op: "add_stat", target: "route.compassion_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH03_BLACKOUT_REPAIR: {
      ch03_blackout_fix: [
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_stat", target: "route.control_score", value: 1 }
      ],
      ch03_blackout_bypass: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ],
      ch03_blackout_skip: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    }
  },
  CH04: {
    EV_CH04_COLD_ALLOC: {
      ch04_cold_record: [
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 1 },
        { op: "set_flag", target: "flag:part1_evidence_ch04", value: true }
      ],
      ch04_cold_locals: [
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_stat", target: "route.compassion_score", value: 1 }
      ]
    },
    EV_CH04_SECURITY_BADGES: {
      ch04_badge_original: [
        { op: "set_value", target: "route.underworld", value: "clean" },
        { op: "add_stat", target: "route.underworld_score", value: 1 }
      ],
      ch04_badge_forge: [
        { op: "set_value", target: "route.underworld", value: "forge" },
        { op: "add_stat", target: "route.underworld_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH04_LINE_DECISION: {
      ch04_line_on: [
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_stat", target: "route.control_score", value: 1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ],
      ch04_line_off: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 }
      ]
    }
  },
  CH05: {
    EV_CH05_LOBBY_CHECKPOINT: {
      ch05_lobby_forge: [
        { op: "set_value", target: "route.underworld", value: "forge" },
        { op: "add_stat", target: "route.underworld_score", value: -1 }
      ],
      ch05_lobby_bypass: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH05_KIM_ARA: {
      ch05_ara_first: [
        { op: "set_value", target: "route.compassion", value: "rescue" },
        { op: "add_stat", target: "route.compassion_score", value: 1 },
        { op: "set_flag", target: "flag:ch05_kim_ara_alive", value: true }
      ],
      ch05_ara_wait: [
        { op: "set_value", target: "route.compassion", value: "pragmatic" },
        { op: "add_stat", target: "route.compassion_score", value: -1 },
        { op: "set_flag", target: "flag:ch05_kim_ara_alive", value: false },
        { op: "add_stat", target: "route.strain", value: 2 }
      ]
    },
    EV_CH05_DATA_ACCESS: {
      ch05_data_record: [
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "add_stat", target: "route.truth_score", value: -1 },
        { op: "set_flag", target: "flag:ch05_data_first", value: true }
      ],
      ch05_data_limited: [
        { op: "set_value", target: "route.truth", value: "silence" },
        { op: "set_flag", target: "flag:ch05_data_partial", value: true }
      ],
      ch05_data_broadcast: [
        { op: "set_value", target: "route.truth", value: "truth" },
        { op: "add_stat", target: "route.truth_score", value: 2 }
      ]
    },
    EV_CH05_ARC_RELAY: {
      ch05_relay_lock: [
        { op: "set_value", target: "route.control", value: "lock" },
        { op: "add_stat", target: "route.control_score", value: 1 }
      ],
      ch05_relay_bypass: [
        { op: "set_value", target: "route.control", value: "bypass" },
        { op: "add_stat", target: "route.control_score", value: -1 },
        { op: "add_stat", target: "route.strain", value: 1 }
      ]
    },
    EV_CH05_BOSS_LINES: {
      ch05_core_preserve: [
        { op: "set_flag", target: "flag:part1_hidden_evidence_ch05", value: false }
      ],
      ch05_core_break: [
        { op: "set_flag", target: "flag:part1_hidden_evidence_ch05", value: true },
        { op: "add_stat", target: "route.strain", value: 2 }
      ]
    }
  }
};

const endingMatrix = [
  {
    ending_id: "P1_END_MIRROR_WITNESS",
    title: "Mirror Witness",
    summary: "모든 기록과 증거를 들고 빠져나왔지만, 우회 회선의 흔적이 남아 이후 추적의 대가를 피할 수 없다.",
    priority: 100,
    hint: "모든 증거를 모으고 김아라를 살린 뒤, 마지막엔 우회 회선을 감수해야 한다.",
    conditions: [
      "route.truth=truth",
      "route.compassion=rescue",
      "route.control=bypass",
      "flag:part1_evidence_bundle_complete",
      "flag:part1_hidden_evidence_ch05",
      "flag:ch05_kim_ara_alive"
    ]
  },
  {
    ending_id: "P1_END_SIGNAL_KEEPERS",
    title: "Signal Keepers",
    summary: "기록은 살아 있고 사람도 살렸다. 그러나 선별 회선을 잠근 채 들고 나가야 하는 무게가 남는다.",
    priority: 80,
    hint: "진실, 구조, 잠금 루트를 끝까지 유지하고 strain을 낮게 눌러야 한다.",
    conditions: [
      "route.truth=truth",
      "route.compassion=rescue",
      "route.control=lock",
      "flag:ch05_kim_ara_alive",
      "route.strain<=6"
    ]
  },
  {
    ending_id: "P1_END_SMUGGLER_TIDE",
    title: "Smuggler Tide",
    summary: "위조와 우회로 살아남았지만, 공적인 기록과 공동체 신뢰는 대부분 떠내려갔다.",
    priority: 70,
    hint: "암시장과 위조 루트, 우회 제어를 밀어붙이면 이 결말에 가까워진다.",
    conditions: ["route.underworld=forge", "route.control=bypass"]
  },
  {
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    title: "Controlled Passage",
    summary: "질서는 지켰고 통로도 확보했다. 다만 진실은 일부만 남겨둔 채 다음 장으로 넘어간다.",
    priority: 60,
    hint: "통제는 잠그고, 데이터는 우선 확보하되 전면 공개는 피해야 한다.",
    conditions: ["route.control=lock", "flag:ch05_data_first", "route.truth=silence"]
  },
  {
    ending_id: "P1_END_ASHEN_ESCAPE",
    title: "Ashen Escape",
    summary: "생존만 겨우 건졌고, 구조와 증거는 재 속에 흩어졌다. 다음 여정은 소문과 후회 위에서 시작된다.",
    priority: 10,
    hint: "피로가 과도하게 쌓이거나 김아라를 놓치거나, 증거 수집에 실패하면 이 결말로 떨어진다.",
    conditions: ["route.strain>=7|!flag:ch05_kim_ara_alive|!flag:part1_evidence_bundle_complete"]
  }
];

const videoPrompts = [
  {
    video_id: "P1_CH01_OPENING",
    scene_id: "CH01_OPENING_SIGNAL",
    chapter_id: "CH01",
    kind: "opening",
    duration: 15,
    aspect_ratio: "16:9",
    prompt_en: "A tense Korean disaster-thriller opening over a ruined Yeouido broadcast district, ash in the air, emergency rooftop antenna, survivors moving through a dim lobby, cinematic realism.",
    prompt_ko_context: "여의도 방송국 폐허와 구조 신호, 윤해인의 첫 진입을 보여주는 오프닝 티저.",
    camera_notes: "Start with a wide aerial drift, push into the broken lobby, finish on the rooftop antenna silhouette.",
    audio_notes: "Distant emergency siren, analog radio noise, low heartbeat percussion.",
    source_art_key: "briefing_p1_ch01"
  },
  {
    video_id: "P1_CH02_OPENING",
    scene_id: "CH02_OPENING_MARKET",
    chapter_id: "CH02",
    kind: "opening",
    duration: 15,
    aspect_ratio: "16:9",
    prompt_en: "Flooded Noryangjin market alleys, hanging tarps, black water, barter violence and diesel smoke, a Korean post-apocalypse thriller with wet industrial realism.",
    prompt_ko_context: "검은 물과 암시장 거래, 정노아와 서진서의 영역으로 들어가는 Part 1 두 번째 티저.",
    camera_notes: "Low handheld glide through water, cut to a close barter exchange, end on a sluice gate silhouette.",
    audio_notes: "Water slosh, distant shouting, muffled diesel engine rumble.",
    source_art_key: "briefing_p1_ch02"
  },
  {
    video_id: "P1_CH03_OPENING",
    scene_id: "CH03_OPENING_VERTICAL",
    chapter_id: "CH03",
    kind: "opening",
    duration: 15,
    aspect_ratio: "16:9",
    prompt_en: "A cold luxury high-rise in Jamsil after blackout, broken skybridge, glass reflections, vertical dread, Korean cinematic realism with survivor factions watching each other.",
    prompt_ko_context: "잠실 고층 잔존 공동체와 안보경, 류세온의 갈등 구도를 여는 티저.",
    camera_notes: "Slow elevator rise, hard cut to the skybridge, end on a fractured greenhouse silhouette.",
    audio_notes: "Wind shear, elevator hum dying out, distant glass crack.",
    source_art_key: "briefing_p1_ch03"
  },
  {
    video_id: "P1_CH04_OPENING",
    scene_id: "CH04_OPENING_SORTING_HALL",
    chapter_id: "CH04",
    kind: "opening",
    duration: 15,
    aspect_ratio: "16:9",
    prompt_en: "A sprawling Korean logistics belt with dead conveyors, warning strobes, medicine crates and forged badges, cinematic industrial realism.",
    prompt_ko_context: "문정-판교 물류권에 진입하며 보안, 배분, 위조가 핵심이 되는 분위기 티저.",
    camera_notes: "Wide pan across conveyors, medium insert on badges and medicine cases, finish on a red warning lane.",
    audio_notes: "Mechanical clatter echoes, distant alarm chirps, subdued synth pulse.",
    source_art_key: "briefing_p1_ch04"
  },
  {
    video_id: "P1_CH05_OPENING",
    scene_id: "CH05_OPENING_MIRROR_CENTER",
    chapter_id: "CH05",
    kind: "opening",
    duration: 15,
    aspect_ratio: "16:9",
    prompt_en: "A Korean disaster mirror center in Pangyo, sealed server hall, blue warning light, Kim Ara trapped behind glass, survival team entering under pressure, cinematic realism.",
    prompt_ko_context: "김아라와 미러센터, 독도 인증의 첫 실체가 드러나는 CH05 진입 티저.",
    camera_notes: "Begin in a sterile server corridor, reveal Kim Ara behind glass, end on the relay core pulsing in darkness.",
    audio_notes: "Server fan drone, biometric scan tone, restrained tension strings.",
    source_art_key: "briefing_p1_ch05"
  },
  {
    video_id: "P1_END_SIGNAL_KEEPERS",
    scene_id: "ENDING_SIGNAL_KEEPERS",
    chapter_id: "CH05",
    ending_id: "P1_END_SIGNAL_KEEPERS",
    kind: "ending",
    duration: 18,
    aspect_ratio: "16:9",
    prompt_en: "Hopeful but heavy ending stinger, survivors walking away with sealed signal archives, dawn haze over a Korean expressway, realistic cinematic mood.",
    prompt_ko_context: "가장 희망적이지만 무거운 대가가 남는 Signal Keepers 엔딩 스팅어.",
    camera_notes: "Track from archive case to group silhouette, hold on a locked signal panel, close on the road south.",
    audio_notes: "Thin hopeful string line over radio static and soft wind.",
    source_art_key: "ending_p1_signal_keepers"
  },
  {
    video_id: "P1_END_CONTROLLED_PASSAGE",
    scene_id: "ENDING_CONTROLLED_PASSAGE",
    chapter_id: "CH05",
    ending_id: "P1_END_CONTROLLED_PASSAGE",
    kind: "ending",
    duration: 18,
    aspect_ratio: "16:9",
    prompt_en: "Controlled, restrained ending stinger with locked gates, selective data handoff, a Korean evac route opening under armed order, cold cinematic realism.",
    prompt_ko_context: "질서는 지켰지만 진실은 일부만 남긴 Controlled Passage 엔딩 스팅어.",
    camera_notes: "Static gate composition, slow dolly toward controlled checkpoint, end on a half-hidden data drive.",
    audio_notes: "Low industrial hum, clipped radio commands, restrained percussion.",
    source_art_key: "ending_p1_controlled_passage"
  },
  {
    video_id: "P1_END_SMUGGLER_TIDE",
    scene_id: "ENDING_SMUGGLER_TIDE",
    chapter_id: "CH05",
    ending_id: "P1_END_SMUGGLER_TIDE",
    kind: "ending",
    duration: 18,
    aspect_ratio: "16:9",
    prompt_en: "A morally compromised escape through a hidden Korean smuggler channel, wet concrete, forged passes, engine wake in black water, grim cinematic realism.",
    prompt_ko_context: "위조 통로와 검은 거래로 살아남는 Smuggler Tide 엔딩 스팅어.",
    camera_notes: "Close on forged badge, cut to fast water wake, end with the party disappearing into fog.",
    audio_notes: "Outboard motor, dripping hull, low mistrustful bass pulse.",
    source_art_key: "ending_p1_smuggler_tide"
  },
  {
    video_id: "P1_END_ASHEN_ESCAPE",
    scene_id: "ENDING_ASHEN_ESCAPE",
    chapter_id: "CH05",
    ending_id: "P1_END_ASHEN_ESCAPE",
    kind: "ending",
    duration: 18,
    aspect_ratio: "16:9",
    prompt_en: "A bitter ash-covered Korean evacuation, missing survivors, burned evidence drifting through gray light, cinematic realism with exhausted movement.",
    prompt_ko_context: "진실도 사람도 충분히 건지지 못한 Ashen Escape 엔딩 스팅어.",
    camera_notes: "Open on abandoned evidence ash, slow pan to survivors crossing a blasted road, hold on empty silence.",
    audio_notes: "Dry wind, distant alarms fading, sparse piano notes.",
    source_art_key: "ending_p1_ashen_escape"
  },
  {
    video_id: "P1_END_MIRROR_WITNESS",
    scene_id: "ENDING_MIRROR_WITNESS",
    chapter_id: "CH05",
    ending_id: "P1_END_MIRROR_WITNESS",
    kind: "ending",
    duration: 18,
    aspect_ratio: "16:9",
    prompt_en: "A truth-heavy ending stinger, stolen mirror-center evidence, a bypassed relay still flickering behind the team, Korean thriller realism with dangerous momentum.",
    prompt_ko_context: "가장 많은 진실을 손에 넣지만 추적의 대가가 커지는 Mirror Witness 엔딩 스팅어.",
    camera_notes: "Start on recovered hidden files, reveal the broken relay, finish on Kim Ara and the team moving into a hostile dawn.",
    audio_notes: "Persistent relay pulse, tense cello, sharp static bursts.",
    source_art_key: "ending_p1_mirror_witness"
  },
  {
    video_id: "P1_TRAILER_MAIN",
    scene_id: "PART1_TRAILER",
    kind: "trailer",
    duration: 45,
    aspect_ratio: "16:9",
    prompt_en: "A cinematic Korean apocalypse trailer moving from Yeouido to Pangyo, survivors, flooded markets, vertical terror, logistics warfare, a mirror center and five possible fates, realistic grounded tension.",
    prompt_ko_context: "Part 1 전체를 묶는 트레일러. 여의도, 노량진, 잠실, 물류권, 판교 미러센터, 그리고 다섯 결말의 분위기를 순차적으로 보여준다.",
    camera_notes: "Build in five chapters: signal, flood, vertical dread, industrial logistics, mirror-center climax. End on five ending silhouettes without revealing the canon.",
    audio_notes: "Starts with analog radio, rises to industrial percussion and choral tension, ends on a cutoff relay tone.",
    source_art_key: "ending_p1_signal_keepers"
  }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function effectKey(effect) {
  return `${effect.op}|${effect.target}|${JSON.stringify(effect.value)}|${JSON.stringify(effect.meta ?? {})}`;
}

function appendEffects(choice, extraEffects) {
  const existing = new Set((choice.effects ?? []).map(effectKey));
  for (const effect of extraEffects) {
    if (!existing.has(effectKey(effect))) {
      choice.effects.push(effect);
      existing.add(effectKey(effect));
    }
  }
}

function isValidNode(node) {
  return Boolean(node?.node_id && node?.coordinates && Array.isArray(node?.event_ids) && typeof node?.revisit_rule === "string");
}

function isValidEvent(event) {
  return Boolean(
    event?.event_id &&
      event?.event_type &&
      event?.node_id &&
      Array.isArray(event?.conditions) &&
      event?.presentation &&
      event?.text &&
      Array.isArray(event?.choices) &&
      Array.isArray(event?.on_enter_effects) &&
      Array.isArray(event?.on_complete_effects)
  );
}

function updateChapter(chapterId) {
  const chapterFile = path.join(chapterDir, `${chapterId.toLowerCase()}.json`);
  const data = readJson(chapterFile);
  data.nodes = data.nodes.filter(isValidNode);
  data.events = data.events.filter(isValidEvent);

  const validNodeIds = new Set(data.nodes.map((node) => node.node_id));
  const validEventIds = new Set(data.events.map((event) => event.event_id));
  data.nodes = data.nodes.map((node) => ({
    ...node,
    connections: (node.connections ?? []).filter((connection) => validNodeIds.has(connection.to)),
    event_ids: (node.event_ids ?? []).filter((eventId) => validEventIds.has(eventId))
  }));
  data.events = data.events.map((event) => ({
    ...event,
    presentation: {
      ...event.presentation,
      widget_overrides: event.presentation?.widget_overrides ?? []
    }
  }));
  data.chapter_cinematic = chapterCinematics[chapterId];

  const routeEvents = routeEffectMap[chapterId] ?? {};
  for (const [eventId, choiceMap] of Object.entries(routeEvents)) {
    const event = data.events.find((entry) => entry.event_id === eventId);
    if (!event) {
      continue;
    }

    for (const choice of event.choices ?? []) {
      const extraEffects = choiceMap[choice.choice_id];
      if (extraEffects) {
        appendEffects(choice, extraEffects);
      }
    }
  }

  if (data.boss_event_id) {
    const bossEvent = data.events.find((entry) => entry.event_id === data.boss_event_id);
    if (bossEvent) {
      bossEvent.presentation = {
        ...bossEvent.presentation,
        cinematic_still_key: chapterCinematics[chapterId].boss_splash_key,
        result_variant: "boss_resolution"
      };
    }
  }

  const extractionEvent = data.events.find((entry) => entry.event_id === `EV_${chapterId}_EXTRACTION`);
  if (extractionEvent) {
    extractionEvent.presentation = {
      ...extractionEvent.presentation,
      cinematic_still_key: chapterCinematics[chapterId].result_card_art_key,
      result_variant: chapterId === "CH05" ? "part1_ending" : "chapter_result"
    };
  }

  if (chapterId === "CH05") {
    data.ending_matrix = endingMatrix;
  }

  writeJson(chapterFile, data);
}

function updateCh05UiFlow() {
  const filePath = path.join(uiDir, "ch05.ui_flow.json");
  const data = readJson(filePath);
  const resultScreen = data.screens.find((screen) => screen.screen_id === "CH05_RESULT");
  if (resultScreen) {
    resultScreen.widgets = ["chapter_result", "ending_key_art", "ending_unlock_status", "signal_summary", "party_summary"];
    resultScreen.data_sources = ["chapter_outcome", "trust_state", "route_state", "ending_gallery"];
    resultScreen.primary_actions = ["confirm", "open_gallery", "start_new_run"];
  }

  if (!data.screens.find((screen) => screen.screen_id === "CH05_ENDING_GALLERY")) {
    data.screens.push({
      screen_id: "CH05_ENDING_GALLERY",
      screen_type: "ending_gallery",
      title: "Part 1 엔딩 갤러리",
      purpose: "다섯 엔딩의 해금 상태와 키아트를 다시 확인한다.",
      widgets: ["ending_grid", "ending_thumb", "ending_summary", "next_part_hook"],
      data_sources: ["ending_gallery", "chapter_outcome"],
      primary_actions: ["close_gallery", "start_new_run"],
      notes: ["미해금 엔딩은 실루엣과 힌트만 노출한다."]
    });
  }

  const requiredTransitions = [
    {
      from_screen_id: "CH05_RESULT",
      to_screen_id: "CH05_ENDING_GALLERY",
      trigger: "open_gallery",
      conditions: [],
      notes: "엔딩 결과 화면에서 갤러리로 이동"
    },
    {
      from_screen_id: "CH05_ENDING_GALLERY",
      to_screen_id: "CH05_RESULT",
      trigger: "close_gallery",
      conditions: [],
      notes: "갤러리 닫기"
    },
    {
      from_screen_id: "CH05_ENDING_GALLERY",
      to_screen_id: "CH01_BRIEF",
      trigger: "start_new_run",
      conditions: [],
      notes: "Part 1 새 런 시작"
    }
  ];

  const existingKeys = new Set(
    data.transitions.map((transition) => `${transition.from_screen_id}|${transition.to_screen_id}|${transition.trigger}`)
  );
  for (const transition of requiredTransitions) {
    const key = `${transition.from_screen_id}|${transition.to_screen_id}|${transition.trigger}`;
    if (!existingKeys.has(key)) {
      data.transitions.push(transition);
      existingKeys.add(key);
    }
  }

  writeJson(filePath, data);
}

function generateVideoPromptFiles() {
  ensureDir(videoPromptDir);
  const manifest = {
    version: "1.0.0",
    scope: "part1-video-prompts",
    count: videoPrompts.length,
    prompts: videoPrompts.map((prompt) => ({
      video_id: prompt.video_id,
      scene_id: prompt.scene_id,
      chapter_id: prompt.chapter_id ?? null,
      ending_id: prompt.ending_id ?? null,
      kind: prompt.kind,
      file: `${prompt.video_id}.json`,
      source_art_key: prompt.source_art_key
    }))
  };

  for (const prompt of videoPrompts) {
    writeJson(path.join(videoPromptDir, `${prompt.video_id}.json`), prompt);
  }

  writeJson(path.join(videoPromptDir, "manifest.json"), manifest);
}

for (const chapterId of ["CH01", "CH02", "CH03", "CH04", "CH05"]) {
  updateChapter(chapterId);
}

updateCh05UiFlow();
generateVideoPromptFiles();

console.log("Part 1 enhancements generated.");
