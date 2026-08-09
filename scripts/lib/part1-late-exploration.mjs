/**
 * Side content for the two thinnest chapters.
 *
 * CH04 and CH05 carry 47 and 57 events against CH01's 99, and only 17 and 20
 * decision points against 35. The gap is one event type: CH01 has eleven
 * exploration beats, CH02 ten, CH03 eight — CH04 and CH05 have three each.
 * Exploration is the only type in this game that is always multi-choice, so
 * missing it is missing the decisions.
 *
 * It shows in the map too. 탄천 둑길 and 판교 외곽 인터체인지 are entry nodes
 * with two events and nothing to decide, and 연구 격리실 has three events and one
 * choice — places the player walks through rather than visits.
 *
 * Each of these is optional and ends by handing back to the map, which is what
 * makes it a real use of the deadline: time spent here is time not spent on the
 * main route. Every one trades a different resource and commits to a route, so
 * the side content feeds the ending rather than just padding the count.
 *
 * CH04 grants are doubled and CH05 tripled, matching the late-chapter weighting.
 */

/** @type {Array<{chapter: string, node: string, event: object}>} */
export const LATE_EXPLORATION = [
  // --- CH04 · 문정 물류 -----------------------------------------------------
  {
    chapter: "ch04", node: "MJ-01",
    event: {
      event_id: "EV_CH04_EMBANKMENT_SWEEP",
      title: "둑길 적재물",
      art_key: "bg_tancheon_embankment",
      music_key: "open_ground",
      summary: "탄천 둑길에 트럭 한 대가 옆으로 누워 있다. 적재함은 열려 있고, 안쪽은 아직 아무도 손대지 않았다.",
      narration: [
        "둑길 아래로 물이 낮게 흐른다. 트럭은 바퀴를 하늘로 두고 멈춰 있다.",
        "적재함 문틈으로 상자 모서리가 보인다. 꺼내려면 둑 아래로 내려가야 한다.",
      ],
      choices: [
        {
          choice_id: "ch04_embankment_haul",
          label: "둑 아래로 내려가 적재함을 연다",
          intent_tags: ["수색", "단서"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
            { op: "add_stat", target: "carry_weight", value: 2 },
            { op: "add_reputation", target: "reputation.munjeong_logistics", value: 2 },
          ],
        },
        {
          choice_id: "ch04_embankment_mark",
          label: "위치만 표시하고 둑길을 지난다",
          intent_tags: ["관찰", "포기"],
          effects: [
            { op: "sub_stat", target: "noise", value: 1 },
            { op: "set_value", target: "route.truth", value: "truth" },
            { op: "add_stat", target: "route.truth_score", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-01",
    event: {
      event_id: "EV_CH04_EMBANKMENT_WATCH",
      title: "둑길 관측",
      art_key: "bg_tancheon_embankment",
      music_key: "open_ground",
      summary: "둑 위에서는 분류센터 지붕까지 한눈에 들어온다. 오래 서 있을수록 보이는 것도 많아진다.",
      narration: [
        "바람이 둑을 타고 정면으로 분다. 아래쪽 물소리가 발소리를 지운다.",
        "센터 지붕의 환기구가 하나만 돌고 있다. 어느 쪽 전기가 살아 있는지 읽을 수 있다.",
      ],
      choices: [
        {
          choice_id: "ch04_embankment_survey",
          label: "환기구가 도는 쪽을 끝까지 센다",
          intent_tags: ["관찰", "정찰"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.control", value: "logistics" },
            { op: "add_stat", target: "route.control_score", value: 2 },
          ],
        },
        {
          choice_id: "ch04_embankment_move",
          label: "바람이 멎기 전에 둑을 건넌다",
          intent_tags: ["거리 확보", "강행"],
          effects: [
            { op: "add_stat", target: "noise", value: 2 },
            { op: "add_reputation", target: "reputation.under_market", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-04",
    event: {
      event_id: "EV_CH04_RAIL_MANIFEST",
      title: "인계장 장부",
      art_key: "bg_rail_transfer",
      music_key: "steel_hum",
      summary: "인계장 사무실 책상에 마지막 인계 장부가 펼쳐진 채 남아 있다. 마지막 서명은 사흘 전이다.",
      narration: [
        "장부의 마지막 줄에서 글씨가 흐트러진다. 쓰다 만 이름이 반쯤 남아 있다.",
        "옆 칸에는 수령 예정자 명단이 붙어 있다. 절반은 이미 지워졌다.",
      ],
      choices: [
        {
          choice_id: "ch04_rail_copy_manifest",
          label: "명단을 베껴 기록국으로 넘긴다",
          intent_tags: ["단서", "교신"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.truth", value: "truth" },
            { op: "add_stat", target: "route.truth_score", value: 2 },
            { op: "add_reputation", target: "reputation.record_bureau", value: 2 },
          ],
        },
        {
          choice_id: "ch04_rail_take_stock",
          label: "장부는 두고 남은 수령품만 챙긴다",
          intent_tags: ["수색", "포기"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
            { op: "add_stat", target: "noise", value: 2 },
            { op: "add_reputation", target: "reputation.under_market", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-06",
    event: {
      event_id: "EV_CH04_SECURITY_LOCKERS",
      title: "보안실 사물함",
      art_key: "bg_security_office",
      music_key: "steel_hum",
      summary: "보안 사무실 뒤편 사물함 열이 반쯤 열려 있다. 야간 근무자들이 두고 간 것이 그대로다.",
      narration: [
        "사물함 문마다 이름표가 붙어 있다. 절반은 테이프로 덧씌워졌다.",
        "맨 끝 칸만 자물쇠가 걸려 있다. 안에서 무언가 굴러다니는 소리가 난다.",
      ],
      choices: [
        {
          choice_id: "ch04_lockers_force",
          label: "잠긴 칸을 부수고 안을 확인한다",
          intent_tags: ["강행", "수색"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
            { op: "add_stat", target: "noise", value: 3 },
            { op: "set_value", target: "route.control", value: "breach" },
          ],
        },
        {
          choice_id: "ch04_lockers_names",
          label: "이름표만 옮겨 적고 닫아 둔다",
          intent_tags: ["단서", "관찰"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "add_reputation", target: "reputation.record_bureau", value: 2 },
            { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-07",
    event: {
      event_id: "EV_CH04_TUNNEL_SIDING",
      title: "터널 대피선",
      art_key: "bg_delivery_tunnel",
      music_key: "steel_hum",
      summary: "배송 터널 중간에 짧은 대피선이 갈라져 나간다. 끝은 어둡고, 안쪽에서 찬 바람이 나온다.",
      narration: [
        "대피선 입구에 카트 두 대가 가로놓여 있다. 누군가 일부러 막아 둔 모양이다.",
        "그 너머로 통로가 이어진다. 얼마나 깊은지는 들어가 봐야 안다.",
      ],
      choices: [
        {
          choice_id: "ch04_siding_enter",
          label: "카트를 밀어내고 대피선으로 들어간다",
          intent_tags: ["우회", "수색"],
          effects: [
            { op: "add_stat", target: "contamination", value: 2 },
            { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
            { op: "set_value", target: "route.underworld", value: "service" },
            { op: "add_reputation", target: "reputation.under_market", value: 2 },
          ],
        },
        {
          choice_id: "ch04_siding_seal",
          label: "카트를 더 쌓아 대피선을 막는다",
          intent_tags: ["봉쇄", "판단"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 2 },
            { op: "set_value", target: "route.control", value: "lock" },
            { op: "add_stat", target: "route.control_score", value: 2 },
            { op: "add_reputation", target: "reputation.jamsil_upper", value: 2 },
          ],
        },
      ],
    },
  },

  // --- CH05 · 판교 -----------------------------------------------------------
  {
    chapter: "ch05", node: "PG-01",
    event: {
      event_id: "EV_CH05_INTERCHANGE_WRECK",
      title: "인터체인지 정체",
      art_key: "bg_pangyo_interchange",
      music_key: "wind_high",
      summary: "인터체인지 진입로에 차량이 세 겹으로 멈춰 있다. 대부분 문이 열린 채다.",
      narration: [
        "차 사이로 지나가려면 몸을 옆으로 세워야 한다. 유리 조각이 발밑에서 계속 밟힌다.",
        "가운데 승합차만 문이 닫혀 있다. 안쪽 유리에 김이 서려 있다.",
      ],
      choices: [
        {
          choice_id: "ch05_interchange_check_van",
          label: "닫힌 승합차를 열어 안을 확인한다",
          intent_tags: ["구조", "수색"],
          effects: [
            { op: "add_stat", target: "injury", value: 2 },
            { op: "set_value", target: "route.compassion", value: "rescue" },
            { op: "add_stat", target: "route.compassion_score", value: 3 },
            { op: "add_reputation", target: "reputation.jamsil_lower", value: 3 },
          ],
        },
        {
          choice_id: "ch05_interchange_slip",
          label: "차 사이로 몸을 세워 조용히 지난다",
          intent_tags: ["숨기", "거리 확보"],
          effects: [
            { op: "sub_stat", target: "noise", value: 1 },
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.compassion", value: "pragmatic" },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch05", node: "PG-01",
    event: {
      event_id: "EV_CH05_INTERCHANGE_SIGN",
      title: "무너진 안내판",
      art_key: "bg_pangyo_interchange",
      music_key: "wind_high",
      summary: "도로 안내판이 지지대째 꺾여 길을 반쯤 덮고 있다. 아래로 케이블 다발이 드러나 있다.",
      narration: [
        "안내판 뒷면에 손글씨가 층층이 덧쓰여 있다. 날짜가 하루씩 밀려 있다.",
        "드러난 케이블 중 하나는 아직 피복이 따뜻하다.",
      ],
      choices: [
        {
          choice_id: "ch05_sign_tap_cable",
          label: "따뜻한 케이블을 따라 전원을 되짚는다",
          intent_tags: ["정찰", "단서"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 2 },
            { op: "set_value", target: "route.control", value: "stabilize" },
            { op: "add_stat", target: "route.control_score", value: 3 },
          ],
        },
        {
          choice_id: "ch05_sign_read_notes",
          label: "덧쓰인 손글씨를 날짜순으로 읽는다",
          intent_tags: ["단서", "관찰"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.truth", value: "witness" },
            { op: "add_stat", target: "route.truth_score", value: 3 },
            { op: "add_reputation", target: "reputation.record_bureau", value: 3 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch05", node: "PG-03",
    event: {
      event_id: "EV_CH05_SKYWALK_CACHE",
      title: "보행로 은닉물",
      art_key: "bg_pangyo_skywalk",
      music_key: "wind_high",
      summary: "공중 보행로 화단 아래에 방수포로 싼 짐이 밀어 넣어져 있다. 최근에 둔 것이다.",
      narration: [
        "방수포 모서리가 아직 젖지 않았다. 비가 오기 전에 놓고 간 것이다.",
        "화단 흙 위에 발자국이 한 방향으로만 나 있다.",
      ],
      choices: [
        {
          choice_id: "ch05_skywalk_take",
          label: "방수포를 풀어 짐을 가져간다",
          intent_tags: ["수색", "강행"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_ch05_server", value: 1 },
            { op: "add_stat", target: "noise", value: 2 },
            { op: "add_reputation", target: "reputation.under_market", value: 3 },
          ],
        },
        {
          choice_id: "ch05_skywalk_leave",
          label: "발자국 방향만 기록하고 그대로 둔다",
          intent_tags: ["관찰", "포기"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.compassion", value: "rescue" },
            { op: "add_reputation", target: "reputation.pangyo_survivors", value: 3 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch05", node: "PG-06",
    event: {
      event_id: "EV_CH05_ISOLATION_LOGBOOK",
      title: "격리실 관찰지",
      art_key: "bg_arkp_exit",
      music_key: "cold_room",
      summary: "연구 격리실 문 옆에 관찰 기록지가 클립보드째 걸려 있다. 마지막 칸은 비어 있다.",
      narration: [
        "기록지의 시간 간격이 뒤로 갈수록 벌어진다. 마지막 두 줄은 필체가 다르다.",
        "문 안쪽 유리에는 손자국이 안에서 바깥으로 나 있다.",
      ],
      choices: [
        {
          choice_id: "ch05_isolation_take_log",
          label: "관찰지를 떼어 증거로 챙긴다",
          intent_tags: ["단서", "교신"],
          effects: [
            { op: "add_stat", target: "contamination", value: 2 },
            { op: "set_value", target: "route.truth", value: "forensics" },
            { op: "add_stat", target: "route.truth_score", value: 3 },
            { op: "add_reputation", target: "reputation.record_bureau", value: 3 },
          ],
        },
        {
          choice_id: "ch05_isolation_seal_door",
          label: "문을 다시 봉하고 표식을 남긴다",
          intent_tags: ["봉쇄", "판단"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 2 },
            { op: "set_value", target: "route.control", value: "lock" },
            { op: "add_stat", target: "route.control_score", value: 3 },
            { op: "add_reputation", target: "reputation.jamsil_upper", value: 3 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-02",
    event: {
      event_id: "EV_CH04_COLD_ROOM_TALLY",
      title: "냉장창고 재고",
      art_key: "bg_cold_warehouse",
      music_key: "cold_room",
      summary: "냉장창고 안쪽 선반은 아직 차갑다. 남은 약품 상자에는 수령 예정자 이름이 붙어 있다.",
      narration: [
        "문을 열자 남은 냉기가 발목까지 내려앉는다. 전원은 아직 이쪽만 살아 있다.",
        "상자마다 붙은 이름표 중 몇 장은 이미 젖어 번져 있다.",
      ],
      choices: [
        {
          choice_id: "ch04_cold_take_all",
          label: "이름표를 떼고 약품을 전부 싣는다",
          intent_tags: ["강행", "수색"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_global_basic_office", value: 1 },
            { op: "add_stat", target: "carry_weight", value: 2 },
            { op: "set_value", target: "route.compassion", value: "pragmatic" },
            { op: "add_reputation", target: "reputation.munjeong_logistics", value: 2 },
          ],
        },
        {
          choice_id: "ch04_cold_keep_names",
          label: "이름표대로만 나누어 싣는다",
          intent_tags: ["판단", "구조"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 2 },
            { op: "set_value", target: "route.compassion", value: "rescue" },
            { op: "add_stat", target: "route.compassion_score", value: 2 },
            { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-03",
    event: {
      event_id: "EV_CH04_LOBBY_BOARD",
      title: "로비 게시판",
      art_key: "bg_sorting_hall",
      music_key: "steel_hum",
      summary: "로비 게시판에 배송 지연 공지가 층층이 붙어 있다. 맨 위 장은 아직 마르지 않았다.",
      narration: [
        "공지 아래로 손으로 쓴 쪽지가 여러 장 겹쳐 있다. 찾는 사람 이름이 적혀 있다.",
        "가장 최근 쪽지의 잉크가 아직 번진다. 누군가 오늘 다녀갔다.",
      ],
      choices: [
        {
          choice_id: "ch04_board_photograph",
          label: "쪽지를 전부 촬영해 남긴다",
          intent_tags: ["단서", "교신"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.truth", value: "witness" },
            { op: "add_stat", target: "route.truth_score", value: 2 },
            { op: "add_reputation", target: "reputation.record_bureau", value: 2 },
          ],
        },
        {
          choice_id: "ch04_board_wait",
          label: "게시판 옆에서 다녀간 사람을 기다린다",
          intent_tags: ["관찰", "신뢰"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 2 },
            { op: "sub_stat", target: "noise", value: 1 },
            { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch04", node: "MJ-05",
    event: {
      event_id: "EV_CH04_MAINHALL_CHUTE",
      title: "메인홀 낙하 슈트",
      art_key: "bg_logistics_main",
      music_key: "steel_hum",
      summary: "메인홀 천장에서 낙하 슈트가 아래층으로 이어진다. 아직 막히지 않은 유일한 통로다.",
      narration: [
        "슈트 입구에 손자국이 남아 있다. 누군가 여기로 내려갔다.",
        "아래에서 올라오는 공기가 미지근하다. 아직 사람이 있다는 뜻이다.",
      ],
      choices: [
        {
          choice_id: "ch04_chute_descend",
          label: "슈트를 타고 아래층으로 내려간다",
          intent_tags: ["강행", "구조"],
          effects: [
            { op: "add_stat", target: "injury", value: 2 },
            { op: "set_value", target: "route.compassion", value: "rescue" },
            { op: "add_stat", target: "route.compassion_score", value: 2 },
            { op: "add_reputation", target: "reputation.jamsil_lower", value: 2 },
          ],
        },
        {
          choice_id: "ch04_chute_signal",
          label: "슈트에 대고 신호만 내려보낸다",
          intent_tags: ["교신", "관찰"],
          effects: [
            { op: "add_stat", target: "noise", value: 2 },
            { op: "set_value", target: "route.control", value: "logistics" },
            { op: "add_reputation", target: "reputation.munjeong_logistics", value: 2 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch05", node: "PG-02",
    event: {
      event_id: "EV_CH05_LOBBY_RECEPTION",
      title: "로비 접수대",
      art_key: "bg_pangyo_lobby",
      music_key: "cold_room",
      summary: "캠퍼스 로비 접수대 뒤에 방문자 명부가 펼쳐진 채 남아 있다. 마지막 장은 뜯겨 나갔다.",
      narration: [
        "명부의 남은 장에는 사흘치 방문자가 적혀 있다. 마지막 날만 통째로 없다.",
        "접수대 아래 서랍이 반쯤 열려 있다. 안쪽에서 무언가 빛을 반사한다.",
      ],
      choices: [
        {
          choice_id: "ch05_reception_drawer",
          label: "서랍을 끝까지 열어 확인한다",
          intent_tags: ["수색", "단서"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_ch05_server", value: 1 },
            { op: "add_stat", target: "noise", value: 2 },
            { op: "add_reputation", target: "reputation.under_market", value: 3 },
          ],
        },
        {
          choice_id: "ch05_reception_ledger",
          label: "남은 명부를 통째로 챙긴다",
          intent_tags: ["단서", "교신"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.truth", value: "truth" },
            { op: "add_stat", target: "route.truth_score", value: 3 },
            { op: "add_reputation", target: "reputation.record_bureau", value: 3 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch05", node: "PG-07",
    event: {
      event_id: "EV_CH05_BUNKER_RATIONS",
      title: "벙커 배급대",
      art_key: "bg_arkp_exit",
      music_key: "cold_room",
      summary: "하부 비상벙커 배급대에 남은 물자가 정확히 절반으로 나뉘어 쌓여 있다. 한쪽에는 손을 안 댄 흔적이다.",
      narration: [
        "두 무더기 사이에 분필로 선이 그어져 있다. 지워졌다가 다시 그어진 자국이다.",
        "손대지 않은 쪽 상자 위에 이름 목록이 눌려 있다.",
      ],
      choices: [
        {
          choice_id: "ch05_bunker_respect_line",
          label: "분필선을 지키고 내 몫만 가져간다",
          intent_tags: ["판단", "신뢰"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.control", value: "lock" },
            { op: "add_reputation", target: "reputation.pangyo_survivors", value: 3 },
          ],
        },
        {
          choice_id: "ch05_bunker_cross_line",
          label: "선을 넘어 남은 쪽까지 챙긴다",
          intent_tags: ["강행", "포기"],
          effects: [
            { op: "grant_loot_table", target: "loot:lt_ch05_server", value: 1 },
            { op: "add_stat", target: "carry_weight", value: 2 },
            { op: "set_value", target: "route.underworld", value: "force" },
            { op: "add_reputation", target: "reputation.under_market", value: 3 },
          ],
        },
      ],
    },
  },
  {
    chapter: "ch05", node: "PG-04",
    event: {
      event_id: "EV_CH05_COOLING_MANIFOLD",
      title: "냉각 분배관",
      art_key: "bg_cooling_room",
      music_key: "cold_room",
      summary: "냉각 분배관 밸브 여섯 개 중 두 개만 열려 있다. 나머지는 누군가 손으로 잠갔다.",
      narration: [
        "잠긴 밸브 손잡이마다 테이프가 감겨 있다. 급하게 감은 자국이다.",
        "열린 두 개 쪽에서만 관이 떨린다. 나머지 구역은 이미 포기한 모양이다.",
      ],
      choices: [
        {
          choice_id: "ch05_manifold_open_all",
          label: "잠긴 밸브를 모두 다시 연다",
          intent_tags: ["강행", "구조"],
          effects: [
            { op: "add_stat", target: "noise", value: 3 },
            { op: "add_stat", target: "route.strain", value: 1 },
            { op: "set_value", target: "route.compassion", value: "rescue" },
            { op: "add_reputation", target: "reputation.pangyo_survivors", value: 3 },
          ],
        },
        {
          choice_id: "ch05_manifold_keep_two",
          label: "두 개만 남기고 나머지를 잠근다",
          intent_tags: ["판단", "봉쇄"],
          effects: [
            { op: "add_stat", target: "route.strain", value: 2 },
            { op: "set_value", target: "route.control", value: "medical_priority" },
            { op: "add_stat", target: "route.control_score", value: 3 },
            { op: "add_reputation", target: "reputation.munjeong_logistics", value: 3 },
          ],
        },
      ],
    },
  },
];
