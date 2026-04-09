import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const GAME_ID = "dokdo_arc_webgame";
const CHAPTER_DIR = path.join(ROOT, "codex_webgame_pack", "data", "chapters");
const UI_DIR = path.join(ROOT, "ui");
const FILES = {
  manifest: path.join(ROOT, "package_manifest.json"),
  index: path.join(ROOT, "codex_webgame_pack", "data", "chapters.index.json"),
  npc: path.join(ROOT, "codex_webgame_pack", "data", "npc.registry.json"),
  enemy: path.join(ROOT, "codex_webgame_pack", "data", "enemy.registry.json"),
  encounter: path.join(ROOT, "codex_webgame_pack", "data", "encounter_tables.json"),
  overview: path.join(UI_DIR, "UI_FLOW_OVERVIEW.md"),
  stitch: path.join(UI_DIR, "STITCH_PART_THEME_BRIEF.md")
};

const PART_STYLE = {
  P2: { screen: "route_select", screen_title: "회랑 선택", ui_title: "남하 회랑", visual: "적색 경고등, 젖은 콘크리트, 차단봉, 좁은 통로, 군중 압박", motion: "직선 추격, 검문 스캔, 패널 슬라이드, 빠른 경보 점멸", widgets: ["checkpoint_priority", "route_compare", "crowd_pressure"], music: "red_corridor", loot: "lt_ch04_logistics" },
  P3: { screen: "safehouse", screen_title: "격리 기지", ui_title: "동해 격리선", visual: "푸른 응급등, 백색 서리, 철골, 넓은 음영, 구조 기록 보드", motion: "주파수 스윕, 무거운 패널, 느린 페이드, 저온 브레스", widgets: ["rail_switch_map", "cold_exposure", "frequency_map"], music: "echo_base", loot: "lt_ch05_server" },
  P4: { screen: "route_select", screen_title: "최종 선택", ui_title: "외해 관문", visual: "염분 바람, 새벽 회색, 수기 명단, 방송 장비, 공공 배급 보드", motion: "대기열 갱신, 방송 파형, 무거운 페이드, 선택 후 잔향", widgets: ["public_queue", "ending_matrix", "broadcast_prep"], music: "salt_station", loot: "lt_global_basic_office" }
};

const CHAPTER_ROWS = `
CH06|하강 관문|남하 진입과 공식선/우회선 충돌|P2|6|southern_gate_collapse|checkpoint_priority,route_compare,crowd_pressure|gate_mauler|관문 압쇄체|enc_ch06_gate_field|enc_ch06_gate_boss|runner:2,erosion_basic:2|gate_mauler:1,runner:2|npc_do_jaeyoon,npc_yoo_minha,npc_jung_noah|하강 관문 검문장>붕괴 버스 차선>우회 격리 복도>남부 중계 방벽|공식 검문과 우회선 사이에서 사람과 명단을 넘긴다.|관문 대기 가족|검문장에 남겨진 가족 단위를 통과시킬지 정한다.|폐기된 통행 장부|남하 검문 기록에서 누가 버려졌는지 확인한다.|route_select
CH07|적색 회랑|여의도 대기 명단 구조와 추격전|P2|7|red_corridor_pursuit|red_line_alarm,escort_manifest,pursuit_meter|red_tracker|적색 추적자|enc_ch07_corridor_field|enc_ch07_corridor_boss|runner:2,echoer:1|red_tracker:1,runner:2|npc_jang_taehun,npc_jung_noah|붉은 비상 회랑>붕괴 고가 하부>중계선 출구 펌프실>회랑 잠금문|명단 속 사람을 데리고 긴 회랑을 빠져나온다.|붉은 신호탄|고립 생존자에게 신호탄 상자를 전달하거나 회수한다.|끊긴 라디오|회랑 내부 거래 채널을 복구해 우회 시간을 확보한다.|route_select
CH08|봉쇄선의 방|공식 대기 명단 원본과 배신자 정보 확보|P2|8|blockade_bureau_autopsy|stamp_auth,queue_record,betrayal_trace|seal_guardian|인장 수호체|enc_ch08_bureau_field|enc_ch08_bureau_boss|echoer:2,erosion_basic:1|seal_guardian:1,echoer:2|npc_sim_gyuseok,npc_bae_suhyeon,npc_jung_noah|행정 통제실>문서 보관 서버실>비상 전원 분배실>인장 보관실|누가 명단을 지웠고 누가 승인했는지 확인한다.|미반송 문서함|반송된 피난자 사유를 복원한다.|잠긴 인장실|정식 인장 세트와 위조 문서 원형을 추적한다.|route_select
CH09|연기 저장고|명단 호송용 연료와 배터리 확보|P2|9|smoke_depot_toxic|smoke_density,cargo_split,respirator_status|smoke_warehouse_mass|연기 창고군|enc_ch09_smoke_field|enc_ch09_smoke_boss|spore_sac_small:2,erosion_basic:2|smoke_warehouse_mass:1,spore_sac_small:2|npc_han_somyeong,npc_jang_taehun,npc_lee_soran|연료 저장 탱크 구역>배터리 적재장>연기 배출 제어실>보급 하역 램프|호송 인원과 연료 적재를 동시에 맞춘다.|필터 카트리지|호송 대상자용 필터를 확보한다.|마지막 배송표|외해 플랫폼 우선 보급 흔적을 추적한다.|route_select
CH10|침하 항만|해상 운송권과 백도형 증언 확보|P2|10|sinking_harbor_contract|tide_depth,cargo_crane_risk,boarding_slot|sinking_dock_hauler|침하 하역귀|enc_ch10_port_field|enc_ch10_port_boss|floater:2,runner:1|sinking_dock_hauler:1,floater:2|npc_seo_jinseo,npc_nam_jaewook,npc_baek_dohyeong|침하 부두>컨테이너 야드>해상 계약실>외항 슬립웨이|백도형을 생포하고 동해 접근용 슬롯을 확보한다.|침수된 선적 명부|우선 승선 집단의 흔적을 복원한다.|부서진 신호부표|동해 진입용 해상 신호를 복구한다.|route_select
CH11|철의 우회|동해 우회선 확보와 이동 집단 규칙 노출|P3|11|iron_detour_frost|rail_switch_map,cold_exposure,route_weight|rail_guide|레일 인도자|enc_ch11_rail_field|enc_ch11_rail_boss|runner:1,echoer:1,erosion_basic:2|rail_guide:1,runner:2|npc_park_isaac,npc_ryu_seon|폐 신호소>우회 선로 분기점>정비 화차>잔향 기지 외곽|증언과 장비를 실은 채 냉기 어린 우회선을 통과한다.|선로반장의 편지|마지막 점검자의 기록을 회수한다.|폐화차 냉각코어|후속 장비 수리를 위한 냉각 코어를 확보한다.|safehouse
CH12|잔향 기지|해안 접근 좌표와 차문식 논리 해독|P3|12|echo_base_signal|signal_decoder,archive_trace,frequency_map|resonance_priest|잔향 사제|enc_ch12_echo_field|enc_ch12_echo_boss|echoer:2,spore_sac_small:1|resonance_priest:1,echoer:2|npc_nam_suryeon,npc_park_isaac,npc_kim_ara|안테나 경사면>지휘 벙커>송신 어레이 옥상>잔향 보존실|죽은 명령 체계와 살아 있는 기록을 함께 해독한다.|마지막 호출부호|사라진 중계반의 음성을 복원한다.|지워진 접근좌표|삭제된 해안 좌표 조각을 복구한다.|safehouse
CH13|백색 야적장|의약품과 은폐된 증거 사이 선택|P3|13|white_yard_ethics|freeze_meter,evidence_balance,cargo_temperature|white_yard_tower|백색 견인체|enc_ch13_white_field|enc_ch13_white_boss|erosion_basic:1,spore_sac_small:1,echoer:1|white_yard_tower:1,erosion_basic:2|npc_han_somyeong,npc_oh_gyeongtae,npc_ryu_seon|냉동 컨테이너 통로>적재 사무실>백색 보관동>야적장 출고문|약과 증거, 누구를 위해 남겨진 물자인지를 판단한다.|백색 상차증|우선 이동 화물의 정체를 확인한다.|냉동보관실 아이|생존자 또는 유품을 통해 은폐의 대가를 확인한다.|safehouse
CH14|해무 변전소|모든 라인을 살릴 수 없다는 사실 확정|P3|14|sea_fog_grid|fog_density,power_router,line_priority|mist_transformer|변압수|enc_ch14_fog_field|enc_ch14_fog_boss|echoer:1,runner:1,erosion_basic:1|mist_transformer:1,echoer:1|npc_ahn_bogyeong,npc_park_isaac|해무 해안로>스위치야드>변전소 제어벙커>해안 송전 터널|어느 라인을 살리고 어느 라인을 포기할지 결정한다.|안개 속 전선|대체 배선과 우회 전력을 확보한다.|변전 일지|운영 시간표와 검문 기준의 연결을 확인한다.|safehouse
CH15|격리 파수|안보경 희생과 외해 접근권 확보|P3|15|quarantine_watch_cliff|checkpoint_auth,breaker_load,sacrifice_state|quarantine_sentinel|파수 사령체|enc_ch15_watch_field|enc_ch15_watch_boss|runner:2,echoer:1|quarantine_sentinel:1,runner:2|npc_ahn_bogyeong,npc_nam_suryeon,npc_ryu_seon|절벽 검문선>파수 막사>브레이커 타워>외해 진입문|검문선을 열고 안보경의 빈자리를 남긴 채 앞으로 밀려난다.|파수병의 인장|끝까지 남은 경비의 표식을 기록으로 남긴다.|허위 검역 기록|조작된 부적격 판정 사례를 수집한다.|safehouse
CH16|균열 사구|안보경 이후 역할 승계와 최종 허브 이동|P4|16|fractured_dune_loss|loss_loadout,rope_stability,salt_exposure|dune_cutter|사구 절개체|enc_ch16_dune_field|enc_ch16_dune_boss|erosion_basic:2,runner:1|dune_cutter:1,runner:2|npc_seo_jinseo,npc_shin_dogyeom,npc_han_somyeong|붕괴 해안로>모래 침식 터널>임시 현수교>소금 정거장 초입|누가 안보경의 역할을 이어받을지 정하며 마지막 허브로 이동한다.|붕괴 해안로 표식|후속 길잡이용 표식을 회수한다.|떠내려온 구명함|해안에 밀려온 유품과 보급을 구한다.|route_select
CH17|파편 수문|수문 개방과 반입량 결정|P4|17|fragment_gate_corrosion|floodgate_pressure,boarding_manifest,corrosion_meter|fragment_gate_breaker|수문 분쇄체|enc_ch17_gate_field|enc_ch17_gate_boss|spore_sac_small:1,erosion_basic:2|fragment_gate_breaker:1,erosion_basic:2|npc_shin_dogyeom,npc_mo_eunjae,npc_moon_rahee|수문 외곽 적치장>정비 캣워크>펌프실>정거장 반입 데크|장비와 사람의 반입 우선순위를 고정한다.|부식된 수문 열쇠|백업 수문 열쇠 세트를 확보한다.|염분 측정지|외해 진입 가능 시간을 가늠할 기록을 확보한다.|route_select
CH18|소금 정거장|공동체 배분과 공개 방송 준비|P4|18|salt_station_judgement|public_queue,ration_balance,broadcast_prep|salt_ration_wretch|염정 배급체|enc_ch18_salt_field|enc_ch18_salt_boss|erosion_basic:2,runner:1|salt_ration_wretch:1,erosion_basic:2|npc_yoon_haein,npc_nam_suryeon,npc_shin_dogyeom,npc_mo_eunjae,npc_moon_rahee,npc_ryu_seon|소금 창고>배급 홀>등대 플랫폼>승선 대기 울타리|누구를 태울지 공개적으로 말하고 기록 공개파를 실제로 세운다.|남은 배급표|배급표를 잃은 가족의 이름을 되찾는다.|지워진 증언|반송 음성 기록을 회수해 공개 방송의 근거를 보강한다.|safehouse
CH19|외해 전초|차문식과 공개 대면, 플랫폼 장악|P4|19|outer_sea_platform_politics|platform_vote,auth_stack,storm_pressure|outer_wave_lord|외해 파고체|enc_ch19_outer_field|enc_ch19_outer_boss|echoer:1,runner:2|outer_wave_lord:1,runner:2|npc_cha_munsik,npc_yoon_haein,npc_kim_ara,npc_nam_suryeon,npc_ryu_seon|외해 승선 덱>등록 홀>파도 차단벽>독도 접근 게이트|차문식 논리와 공개 논리가 군중 앞에서 충돌한다.|인증권의 가격|승인권을 사기 위해 버려진 사람들의 흔적을 수집한다.|파도 위 방송|끊긴 방송 신호를 복원해 공개파를 강화한다.|route_select
CH20|독도의 문|세 가지 엔딩 선택과 코어 처리|P4|20|dokdo_gate_core|core_state,ending_matrix,record_release|dokdo_gate_warden|관문 집행체|enc_ch20_dokdo_field|enc_ch20_dokdo_boss|echoer:1,spore_sac_small:1,erosion_basic:1|dokdo_gate_warden:1,echoer:1|npc_cha_munsik,npc_yoon_haein,npc_kim_ara,npc_nam_suryeon|독도 검역 터널>기록 보관실>코어 제어실>관문 개방 데크|세 가지 미래 중 하나를 고르고 기록을 어떻게 남길지 결정한다.|마지막 수신자|도착하지 못한 사람의 마지막 메시지를 회수한다.|봉인 기록|기존 기준과 수정 기준의 차이를 기록으로 남긴다.|route_select
`.trim();

const NPC_ROWS = `
npc_do_jaeyoon|도재윤|CH06|남부 중계 거점 실무 책임자|남부 중계 거점|실무,냉정,배분|지금 통과시키면 누군가를 뒤에 남겨야 한다.;명단은 숫자가 아니라 체온이다.;내가 고른 순서가 밤마다 돌아온다.
npc_yoo_minha|유민하|CH06|우회선 구조 담당 간호사|남부 중계 거점|이상,압박,회복|지금 숨 쉬는 사람부터 보자.;규칙은 살리는 데 쓰일 때만 의미가 있다.;남겨진 사람 이름을 내가 적어 둘게.
npc_sim_gyuseok|심규석|CH08|봉쇄 행정실 보안 책임자|봉쇄 행정국|의심,행정,통제|삭제된 줄이 가장 큰 증거다.;문서는 거짓말을 안 한다. 사람이 덧칠할 뿐이다.;누가 인장을 쥐었는지 찾으면 방향이 바뀐다.
npc_jang_taehun|장태훈|CH07|적색 회랑 브로커|우회선 브로커단|거래,재빠름,생존|살아남는 길은 늘 공식선 바깥에 있다.;난 팔아먹은 게 아니라 시간을 번 거다.;회랑은 빠른 사람보다 멈추지 않는 사람이 산다.
npc_bae_suhyeon|배수현|CH08|행정 기록 복원 담당|봉쇄 행정국|침착,분석,죄책|지운 이름은 서버보다 사람 표정에 먼저 남는다.;복원할수록 누가 무엇을 버렸는지 선명해진다.;이번에는 끝까지 읽고 넘기자.
npc_lee_soran|이소란|CH09|창고 배출 제어 기사|연기 저장고|불안,현장,책임|밸브를 닫으면 사람들이 갇히고 열면 감염이 번진다.;연기는 항상 늦게 값을 받는다.;나는 오늘 한쪽만 미워할 수 없다.
npc_nam_jaewook|남재욱|CH10|침하 항만 계약 중개인|침하 항만 계약선|계산,보존,냉소|선적표는 총보다 오래 남는다.;증언은 돈보다 비싸질 때가 있다.;백도형을 잡으면 바다가 열린다.
npc_park_isaac|박이삭|CH11|잔향 기지 운영병|잔향 기지|규율,기계,의무|선로는 거짓말을 못 한다.;우리는 움직이는 순서로 누구를 포기했는지 안다.;기지는 남겨 두는 기록으로 버틴다.
npc_nam_suryeon|남수련|CH12|기록 공개파 방송 기사|기록 공개파|선명,집요,공개|묻어 두면 다음 선별은 더 빨라진다.;누가 지워졌는지 말하는 순간부터 공동체가 시작된다.;방송은 감정이 아니라 책임의 형식이다.
npc_oh_gyeongtae|오경태|CH13|백색 야적장 경비대장|백색 야적장|완고,의혹,방어|약을 지키려면 거짓도 창고에 쌓인다.;우린 약을 숨긴 게 아니라 시간을 숨겼다.;보관실 문을 열면 더는 돌아갈 수 없다.
npc_shin_dogyeom|신도겸|CH16|소금 정거장 장비반장|소금 정거장|실무,무거움,책임|보경이 하던 걸 누가 맡든 오늘부터는 멈추면 안 된다.;장비는 핑계가 아니라 약속이다.;정거장은 사람보다 느리게 무너진다.
npc_mo_eunjae|모은재|CH17|배급 홀 관리자|소금 정거장|기록,균형,불면|배급표가 찢긴 자리마다 사연이 있다.;오늘 공정한 분배는 내일의 증오를 늦출 뿐이다.;나는 숫자를 적지만 얼굴을 지우진 못한다.
npc_moon_rahee|문라희|CH17|외해 승선 명단 담당|소금 정거장|행정,불신,피로|명단은 늘 마지막에 욕을 먹는다.;나는 기준을 고친 적 없고 적용했을 뿐이다.;그래서 더 많은 밤을 못 잔다.
npc_cha_munsik|차문식|CH19|선별 체계 설계 총괄|검역 코어|논리,통제,정당화|당신이 감당 못 할 숫자를 내가 대신 잘랐다.;기준 없는 연민은 더 많은 시체를 만든다.;공개는 쉽다. 운영은 누가 할 건가.
`.trim();

const ENEMY_ROWS = `
gate_mauler|관문 압쇄체|CH06|검문장 구조물과 융합된 압박형 감염체|무릎 관절,차단봉 고정점|itm_container_seal,itm_bandage|boss,gate,impact|220|18|1|9|6
red_tracker|적색 추적자|CH07|경광등과 진동에 반응해 직선 돌진하는 추적 개체|측면 시야,발목|itm_ration_bar,itm_bandage|boss,pursuit,corridor|210|17|3|12|5
seal_guardian|인장 수호체|CH08|인장실 주변 금속 가루를 두른 봉쇄형 개체|목 뒤 인장핵,손목|itm_security_badge,itm_battery_pack|boss,office,control|240|18|1|7|6
smoke_warehouse_mass|연기 창고군|CH09|연기와 포자를 두껍게 두른 대형 군체|호흡낭,등판|itm_filter_pad,itm_water_pack|boss,warehouse,smoke|250|16|1|8|8
sinking_dock_hauler|침하 하역귀|CH10|침수 하역 장비에 얽힌 수중 근접 개체|하역 훅,복부|itm_pump_gasket,itm_container_seal|boss,harbor,water|260|19|1|6|7
rail_guide|레일 인도자|CH11|분기 레일을 따라 방향을 비트는 저온 개체|레일 결속부,등뼈|itm_copper_wire,itm_battery_pack|boss,rail,cold|230|17|2|8|5
resonance_priest|잔향 사제|CH12|송신 주파수에 반응해 군체를 끌어모으는 음향 개체|안테나 돌기,가슴 공명판|itm_thermal_paste,itm_battery_pack|boss,signal,echo|255|18|2|13|6
white_yard_tower|백색 견인체|CH13|냉동 컨테이너를 등껍질처럼 두른 고중량 개체|컨테이너 잠금핀,목|itm_filter_pad,itm_water_pack|boss,yard,frost|280|20|1|5|7
mist_transformer|변압수|CH14|해무와 전류를 엮어 시야를 흐리는 변전 개체|변압 코일,팔 관절|itm_copper_wire,itm_thermal_paste|boss,fog,power|245|19|2|10|6
quarantine_sentinel|파수 사령체|CH15|격리 검문 장비를 끌어안은 장거리 지휘형 개체|안면 보호창,발전팩|itm_security_badge,itm_bandage|boss,watch,quarantine|300|22|2|11|7
dune_cutter|사구 절개체|CH16|모래와 철골을 끌며 길을 찢는 외해 접경 개체|측면 갈고리,척추|itm_water_pack,itm_cable_tie|boss,dune,erosion|260|20|2|8|7
fragment_gate_breaker|수문 분쇄체|CH17|부식된 수문을 몸으로 밀어내는 파괴형 개체|어깨 결절,하복부|itm_copper_wire,itm_pump_gasket|boss,floodgate,corrosion|285|21|1|9|8
salt_ration_wretch|염정 배급체|CH18|배급 홀을 배회하며 군중을 흩트리는 염분 군체|입 주변 균막,무릎|itm_ration_bar,itm_water_pack|boss,salt,queue|270|19|2|10|7
outer_wave_lord|외해 파고체|CH19|파도 차단벽을 타고 오르며 충격파를 퍼뜨리는 개체|등지느러미,흉곽|itm_battery_pack,itm_bandage|boss,outersea,shock|310|23|2|12|7
dokdo_gate_warden|관문 집행체|CH20|검역 코어 주변에서 선별 규칙을 물리적으로 강요하는 최종 개체|코어 노출부,목 뒤|itm_thermal_paste,itm_bandage|boss,final,gate|360|24|2|14|9
`.trim();

const parseUnits = (value) => value.split(",").map((unit) => {
  const [enemy_id, count] = unit.split(":");
  return { enemy_id, count: Number(count) };
});

const CHAPTERS = CHAPTER_ROWS ? CHAPTER_ROWS.split("\n").map((line) => {
  const [id, title, role, part, level, theme, widgets, bossEnemyId, bossNameKo, fieldEncounterId, bossEncounterId, fieldUnits, bossUnits, npcIds, nodeNames, summary, sideA, sideASummary, sideB, sideBSummary, screen] = line.split("|");
  return { id, title, role, part, level: Number(level), theme, widgets: widgets.split(","), bossEnemyId, bossNameKo, fieldEncounterId, bossEncounterId, fieldUnits: parseUnits(fieldUnits), bossUnits: parseUnits(bossUnits), npcIds: npcIds.split(","), nodeNames: nodeNames.split(">"), summary, sideA, sideASummary, sideB, sideBSummary, screen };
}) : [];

const NPCS = NPC_ROWS ? NPC_ROWS.split("\n").map((line) => {
  const [npc_id, name_ko, first_chapter, role, faction, tones, lines] = line.split("|");
  return { npc_id, name_ko, first_chapter, role, faction, tone_keywords: tones.split(","), sample_lines: lines.split(";") };
}) : [];

const ENEMIES = ENEMY_ROWS ? ENEMY_ROWS.split("\n").map((line) => {
  const [enemy_id, name_ko, introduced_in, behavior, weak_points, drops, tags, hp, attack, speed, noise_response, contamination_hit] = line.split("|");
  return { enemy_id, name_ko, archetype: "boss", introduced_in, tags: tags.split(","), base_stats: { hp: Number(hp), attack: Number(attack), speed: Number(speed), noise_response: Number(noise_response), contamination_hit: Number(contamination_hit) }, behavior, weak_points: weak_points.split(","), drops: drops.split(",") };
}) : [];

const SCREEN_TYPES = new Set(["chapter_briefing", "world_map", "event_dialogue", "loot_resolution", "boss_intro", "combat_arena", "result_summary", "route_select", "safehouse"]);
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const writeJson = async (file, value) => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8"); };
const writeText = async (file, value) => { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, `${value.trim()}\n`, "utf8"); };
const slug = (value) => value.toLowerCase();
const chapterNo = (value) => String(value).replace(/\D+/g, "").padStart(2, "0");
const mergeBy = (items, key, additions) => { const map = new Map(items.map((item) => [item[key], item])); for (const addition of additions) map.set(addition[key], addition); return [...map.values()]; };
const partStyle = (meta) => PART_STYLE[meta.part];
const themeArt = (meta, suffix) => `${slug(meta.id)}_${meta.theme}_${suffix}`;
const flagKey = (meta, suffix) => `flag:${slug(meta.id)}_${suffix}`;
const chapterDone = (meta) => `flag:chapter_${chapterNo(meta.id)}_completed`;
const partLoot = (meta) => partStyle(meta).loot;
const routeKey = (meta) => `${meta.part.toLowerCase()}_${meta.theme}`;

function objectives(meta) {
  return [
    { objective_id: `obj_${slug(meta.id)}_01`, text: `${meta.nodeNames[0]}에 진입한다.`, required: true, complete_when: [flagKey(meta, "entry")] },
    { objective_id: `obj_${slug(meta.id)}_02`, text: `${meta.nodeNames[1]}에서 주 경로를 확정한다.`, required: true, complete_when: [flagKey(meta, "route_locked")] },
    { objective_id: `obj_${slug(meta.id)}_03`, text: `${meta.nodeNames[2]}의 핵심 압박을 돌파한다.`, required: true, complete_when: [flagKey(meta, "anchor_secured")] },
    { objective_id: `obj_${slug(meta.id)}_04`, text: meta.sideA, required: false, complete_when: [flagKey(meta, "side_a_done")] },
    { objective_id: `obj_${slug(meta.id)}_05`, text: meta.sideB, required: false, complete_when: [flagKey(meta, "side_b_done")] }
  ];
}

function nodes(meta) {
  const ids = ["N01", "N02", "N03", "N04", "N05"].map((v) => `${meta.id}_${v}`);
  const names = [meta.nodeNames[0], meta.nodeNames[1], meta.nodeNames[2], meta.nodeNames[3], `${meta.bossNameKo} 대응 구역`];
  return [
    { node_id: ids[0], name: names[0], node_type: "travel", description: `${meta.summary}의 시작점.`, coordinates: { x: 10, y: 80 }, encounter_table_id: meta.fieldEncounterId, loot_table_ids: [partLoot(meta)], npc_ids: [], connections: [{ to: ids[1], travel_type: "walk", requires: [], cost: { time: 3, noise: 1, contamination: 1 } }], event_ids: [`EV_${meta.id}_ENTRY`], revisit_rule: "always", tags: ["entry", meta.part.toLowerCase()] },
    { node_id: ids[1], name: names[1], node_type: meta.screen === "safehouse" ? "safehouse" : "branch", description: `${meta.part} 전용 허브 리듬을 여는 구간.`, coordinates: { x: 28, y: 62 }, encounter_table_id: meta.fieldEncounterId, loot_table_ids: [partLoot(meta)], npc_ids: meta.npcIds.slice(0, 2), connections: [{ to: ids[2], travel_type: "corridor", requires: [], cost: { time: 2, noise: 2, contamination: 1 } }, { to: ids[3], travel_type: "detour", requires: [], cost: { time: 3, noise: 1, contamination: 2 } }], event_ids: [`EV_${meta.id}_ROUTE`], revisit_rule: "always", tags: ["route", meta.theme] },
    { node_id: ids[2], name: names[2], node_type: "exploration", description: meta.summary, coordinates: { x: 52, y: 48 }, encounter_table_id: meta.fieldEncounterId, loot_table_ids: [partLoot(meta)], npc_ids: meta.npcIds.slice(0, 3), connections: [{ to: ids[3], travel_type: "service_route", requires: [], cost: { time: 2, noise: 2, contamination: 1 } }, { to: ids[4], travel_type: "push_forward", requires: [flagKey(meta, "route_locked")], cost: { time: 2, noise: 3, contamination: 2 } }], event_ids: [`EV_${meta.id}_ANCHOR`], revisit_rule: "always", tags: ["main", meta.part.toLowerCase()] },
    { node_id: ids[3], name: names[3], node_type: "branch", description: "인물형/세계관형 사이드 퀘스트를 처리하는 보조 구역.", coordinates: { x: 70, y: 58 }, encounter_table_id: meta.fieldEncounterId, loot_table_ids: [partLoot(meta)], npc_ids: meta.npcIds, connections: [{ to: ids[4], travel_type: "return_route", requires: [], cost: { time: 2, noise: 1, contamination: 1 } }], event_ids: [`EV_${meta.id}_SIDE_A`, `EV_${meta.id}_SIDE_B`], revisit_rule: "after_clear", tags: ["side", meta.theme] },
    { node_id: ids[4], name: names[4], node_type: "boss", description: `${meta.bossNameKo}와 충돌하는 클라이맥스 구간.`, coordinates: { x: 90, y: 32 }, encounter_table_id: meta.bossEncounterId, loot_table_ids: [partLoot(meta)], npc_ids: meta.npcIds.slice(0, 2), connections: [], event_ids: [`EV_${meta.id}_BOSS`], revisit_rule: "after_clear", tags: ["boss", meta.part.toLowerCase()] }
  ];
}

function events(meta) {
  const ids = ["N01", "N02", "N03", "N04", "N05"].map((v) => `${meta.id}_${v}`);
  const style = partStyle(meta);
  return [
    { event_id: `EV_${meta.id}_ENTRY`, event_type: "briefing", node_id: ids[0], title: `${meta.title} 진입`, repeatable: false, once_per_run: true, priority: 100, conditions: [], presentation: { layout: "dialogue", art_key: themeArt(meta, "entry"), music_key: style.music, widget_overrides: ["objective_panel", ...meta.widgets] }, text: { summary: meta.summary, body: [`${meta.part}의 분위기는 ${style.visual}로 간다.`, `이번 장의 핵심은 ${meta.role}이다.`] }, npc_ids: meta.npcIds.slice(0, 1), loot_table_ids: [], choices: [{ choice_id: `${slug(meta.id)}_start`, label: "임무 시작", conditions: [], preview: "이번 장의 메인 루프를 연다.", effects: [{ op: "set_flag", target: flagKey(meta, "entry"), value: true }], next_event_id: `EV_${meta.id}_ROUTE` }], on_enter_effects: [], on_complete_effects: [] },
    { event_id: `EV_${meta.id}_ROUTE`, event_type: "choice", node_id: ids[1], title: `${style.screen_title} 확정`, repeatable: false, once_per_run: true, priority: 90, conditions: [flagKey(meta, "entry")], presentation: { layout: "choice", art_key: themeArt(meta, "route"), music_key: style.music, widget_overrides: meta.widgets }, text: { summary: `${style.ui_title}의 첫 인상에서 경로를 고른다.`, body: ["공식선과 우회선 중 어떤 리듬으로 갈지 결정한다.", `${style.motion}을 화면 전환에 반영한다.`] }, npc_ids: meta.npcIds.slice(0, 2), loot_table_ids: [], choices: [{ choice_id: `${slug(meta.id)}_official`, label: "공식선 유지", conditions: [], preview: "안전하지만 느리다.", effects: [{ op: "set_route", target: "route", value: `${routeKey(meta)}_official` }, { op: "set_flag", target: flagKey(meta, "route_locked"), value: true }], next_event_id: `EV_${meta.id}_ANCHOR` }, { choice_id: `${slug(meta.id)}_detour`, label: "우회선 강행", conditions: [], preview: "빠르지만 비용이 크다.", effects: [{ op: "set_route", target: "route", value: `${routeKey(meta)}_detour` }, { op: "add_stat", target: "noise", value: 3 }, { op: "set_flag", target: flagKey(meta, "route_locked"), value: true }], next_event_id: `EV_${meta.id}_ANCHOR` }], on_enter_effects: [], on_complete_effects: [] },
    { event_id: `EV_${meta.id}_ANCHOR`, event_type: "dialogue", node_id: ids[2], title: `${meta.title} 핵심 압박`, repeatable: false, once_per_run: true, priority: 80, conditions: [flagKey(meta, "route_locked")], presentation: { layout: "dialogue", art_key: themeArt(meta, "anchor"), music_key: style.music, widget_overrides: ["event_card", ...meta.widgets] }, text: { summary: meta.summary, body: [`핵심 NPC: ${meta.npcIds.join(", ")}`, "인물 앵커와 세계관 앵커를 동시에 밀어 넣는다."] }, npc_ids: meta.npcIds.slice(0, 3), loot_table_ids: [], choices: [{ choice_id: `${slug(meta.id)}_anchor`, label: "압박 돌파", conditions: [], preview: "사이드 퀘스트와 보스 구간을 연다.", effects: [{ op: "set_flag", target: flagKey(meta, "anchor_secured"), value: true }], next_event_id: `EV_${meta.id}_SIDE_A` }], on_enter_effects: [], on_complete_effects: [] },
    { event_id: `EV_${meta.id}_SIDE_A`, event_type: "exploration", node_id: ids[3], title: meta.sideA, repeatable: false, once_per_run: true, priority: 70, conditions: [flagKey(meta, "anchor_secured")], presentation: { layout: "choice", art_key: themeArt(meta, "side_a"), music_key: style.music, widget_overrides: ["choice_list", meta.widgets[0] ?? "objective_panel"] }, text: { summary: meta.sideASummary, body: ["인물형 사이드 퀘스트로 신뢰와 보급을 움직인다.", `Part ${meta.part.replace("P", "")}의 감정 리듬을 강화한다.`] }, npc_ids: meta.npcIds.slice(0, 2), loot_table_ids: [partLoot(meta)], choices: [{ choice_id: `${slug(meta.id)}_side_a`, label: "사이드 처리", conditions: [], preview: "신뢰와 보급을 확보한다.", effects: [{ op: "set_flag", target: flagKey(meta, "side_a_done"), value: true }, { op: "add_trust", target: meta.npcIds[0] ?? "party", value: 1 }, { op: "grant_loot_table", target: `loot:${partLoot(meta)}`, value: 1 }], next_event_id: `EV_${meta.id}_SIDE_B` }], on_enter_effects: [], on_complete_effects: [] },
    { event_id: `EV_${meta.id}_SIDE_B`, event_type: "exploration", node_id: ids[3], title: meta.sideB, repeatable: false, once_per_run: true, priority: 69, conditions: [flagKey(meta, "anchor_secured")], presentation: { layout: "choice", art_key: themeArt(meta, "side_b"), music_key: style.music, widget_overrides: ["choice_list", meta.widgets[1] ?? "objective_panel"] }, text: { summary: meta.sideBSummary, body: ["세계관형 사이드 퀘스트로 다음 장의 연결고리를 선행 공개한다.", `시각적으로는 ${style.visual}을 유지하되 더 깊은 공간감을 준다.`] }, npc_ids: meta.npcIds.slice(1, 3), loot_table_ids: [partLoot(meta)], choices: [{ choice_id: `${slug(meta.id)}_side_b`, label: "기록 회수", conditions: [], preview: "다음 장의 연결고리를 확보한다.", effects: [{ op: "set_flag", target: flagKey(meta, "side_b_done"), value: true }, { op: "grant_loot_table", target: `loot:${partLoot(meta)}`, value: 1 }], next_event_id: `EV_${meta.id}_BOSS` }], on_enter_effects: [], on_complete_effects: [] },
    { event_id: `EV_${meta.id}_BOSS`, event_type: "combat", node_id: ids[4], title: `${meta.bossNameKo} 제압`, repeatable: false, once_per_run: true, priority: 120, conditions: [flagKey(meta, "route_locked"), flagKey(meta, "anchor_secured")], presentation: { layout: "boss", art_key: themeArt(meta, "boss"), music_key: `${style.music}_boss`, widget_overrides: ["boss_hp", ...meta.widgets] }, text: { summary: `${meta.bossNameKo}가 ${meta.title}의 규칙을 물리적으로 강요한다.`, body: ["이번 전투는 파트별 톤 차이를 가장 강하게 보여주는 구간이다.", "전투 뒤 바로 다음 장으로 밀려나는 감정 잔향이 붙는다."] }, npc_ids: meta.npcIds.slice(0, 2), loot_table_ids: [partLoot(meta)], combat: { encounter_table_id: meta.bossEncounterId, boss_id: meta.bossEnemyId, arena_tags: [meta.theme, meta.part.toLowerCase()], victory_effects: [{ op: "set_flag", target: flagKey(meta, "boss_clear"), value: true }, { op: "set_flag", target: chapterDone(meta), value: true }, { op: "unlock_route", target: `chapter:${meta.id}:complete`, value: true }], defeat_effects: [{ op: "sub_stat", target: "hp", value: 18 }, { op: "add_stat", target: "contamination", value: 8 }] }, choices: [{ choice_id: `${slug(meta.id)}_engage`, label: "보스 교전", conditions: [], preview: "클라이맥스 전투를 시작한다.", effects: [], next_event_id: `EV_${meta.id}_BOSS` }], on_enter_effects: [], on_complete_effects: [] }
  ];
}

function questTracks(meta) {
  const objs = objectives(meta);
  return [
    { quest_track_id: `qt_${slug(meta.id)}_main`, kind: "main", title: meta.title, summary: meta.summary, entry_event_id: `EV_${meta.id}_ENTRY`, completion_event_id: `EV_${meta.id}_BOSS`, objective_ids: objs.slice(0, 3).map((v) => v.objective_id), reveal_cap: "confirmation" },
    { quest_track_id: `qt_${slug(meta.id)}_side_a`, kind: "side", title: meta.sideA, summary: meta.sideASummary, entry_event_id: `EV_${meta.id}_SIDE_A`, completion_event_id: `EV_${meta.id}_SIDE_A`, objective_ids: [objs[3].objective_id], unlock_when: [flagKey(meta, "anchor_secured")], reveal_cap: "evidence" },
    { quest_track_id: `qt_${slug(meta.id)}_side_b`, kind: "side", title: meta.sideB, summary: meta.sideBSummary, entry_event_id: `EV_${meta.id}_SIDE_B`, completion_event_id: `EV_${meta.id}_SIDE_B`, objective_ids: [objs[4].objective_id], unlock_when: [flagKey(meta, "anchor_secured")], reveal_cap: "evidence" }
  ];
}

function chapterDoc(meta) {
  return { version: "1.0.0", game_id: GAME_ID, chapter_id: meta.id, title: meta.title, role: meta.role, entry_node_id: `${meta.id}_N01`, exit_node_ids: [`${meta.id}_N05`], recommended_level: meta.level, ui_profile: { theme: meta.theme, special_widgets: [...new Set([...partStyle(meta).widgets, ...meta.widgets])] }, objectives: objectives(meta), quest_tracks: questTracks(meta), nodes: nodes(meta), events: events(meta), boss_event_id: `EV_${meta.id}_BOSS` };
}

function uiDoc(meta) {
  const style = partStyle(meta);
  return {
    version: "1.0.0",
    game_id: GAME_ID,
    chapter_id: meta.id,
    title: `${meta.title} UI Flow`,
    entry_screen_id: `${meta.id}_BRIEF`,
    screens: [
      { screen_id: `${meta.id}_BRIEF`, screen_type: "chapter_briefing", title: `${meta.title} 브리핑`, purpose: meta.summary, widgets: ["objective_panel", ...meta.widgets], data_sources: ["chapter_meta", "player_stats"], primary_actions: ["start_mission"], notes: [`visual:${style.visual}`] },
      { screen_id: `${meta.id}_HUB`, screen_type: meta.screen, title: style.screen_title, purpose: `${meta.part} 전용 호흡과 선택 압박을 주는 화면.`, widgets: [...new Set([...style.widgets, ...meta.widgets])], data_sources: ["route_state", "player_flags", "trust_state"], primary_actions: [meta.screen === "safehouse" ? "leave_safehouse" : "confirm_route"], notes: [`motion:${style.motion}`] },
      { screen_id: `${meta.id}_MAP`, screen_type: "world_map", title: `${meta.title} 노드`, purpose: meta.nodeNames.join(" -> "), widgets: ["map_overlay", ...meta.widgets.slice(0, 2)], data_sources: [`${slug(meta.id)}.nodes`, "player_flags"], primary_actions: ["select_node", "open_inventory"], notes: [`theme:${meta.theme}`] },
      { screen_id: `${meta.id}_EVENT`, screen_type: "event_dialogue", title: `${meta.title} 이벤트`, purpose: "메인/사이드 선택과 텍스트 이벤트를 처리한다.", widgets: ["event_card", "choice_list", ...meta.widgets.slice(0, 2)], data_sources: [`${slug(meta.id)}.events`, "trust_state", "player_flags"], primary_actions: ["pick_choice", "back_to_map"], notes: [`stitch:${style.ui_title}`] },
      { screen_id: `${meta.id}_LOOT`, screen_type: "loot_resolution", title: `${meta.title} 루팅`, purpose: "사이드 퀘스트 결과와 보급 확보를 정산한다.", widgets: ["loot_grid", meta.widgets[0] ?? "objective_panel"], data_sources: ["loot_table", "player_inventory"], primary_actions: ["take_selected", "discard"], notes: [] },
      { screen_id: `${meta.id}_BOSS_INTRO`, screen_type: "boss_intro", title: `${meta.bossNameKo} 등장`, purpose: "클라이맥스 전투 규칙과 비주얼 압박을 소개한다.", widgets: ["boss_splash", ...meta.widgets.slice(0, 2)], data_sources: ["boss_meta", "player_flags"], primary_actions: ["enter_boss"], notes: [`boss:${meta.bossEnemyId}`] },
      { screen_id: `${meta.id}_COMBAT`, screen_type: "combat_arena", title: `${meta.title} 전투`, purpose: "보스전과 파트별 HUD 밀도를 반영한다.", widgets: ["combat_hud", "boss_hp", ...meta.widgets.slice(0, 2)], data_sources: ["combat_state", "enemy_state", "player_stats"], primary_actions: ["attack", "skill", "item", "move"], notes: [] },
      { screen_id: `${meta.id}_RESULT`, screen_type: "result_summary", title: `${meta.title} 결과`, purpose: "다음 장으로 밀려나는 결과와 Part 감정 잔향을 정리한다.", widgets: ["chapter_result", "party_summary", meta.widgets[0] ?? "objective_panel"], data_sources: ["chapter_outcome", "trust_state", "route_state"], primary_actions: ["confirm"], notes: [`immersion:${style.ui_title}`] }
    ],
    transitions: [
      { from_screen_id: `${meta.id}_BRIEF`, to_screen_id: `${meta.id}_HUB`, trigger: "start_mission", conditions: [], notes: "" },
      { from_screen_id: `${meta.id}_HUB`, to_screen_id: `${meta.id}_MAP`, trigger: meta.screen === "safehouse" ? "leave_safehouse" : "confirm_route", conditions: [], notes: "파트별 분위기 전용 허브 화면" },
      { from_screen_id: `${meta.id}_MAP`, to_screen_id: `${meta.id}_EVENT`, trigger: "select_node", conditions: ["node.has_event=true"], notes: "" },
      { from_screen_id: `${meta.id}_EVENT`, to_screen_id: `${meta.id}_LOOT`, trigger: "choice_resolved", conditions: ["event.grants_loot=true"], notes: "" },
      { from_screen_id: `${meta.id}_EVENT`, to_screen_id: `${meta.id}_BOSS_INTRO`, trigger: `event_id=EV_${meta.id}_BOSS`, conditions: [], notes: "" },
      { from_screen_id: `${meta.id}_LOOT`, to_screen_id: `${meta.id}_MAP`, trigger: "loot_closed", conditions: [], notes: "" },
      { from_screen_id: `${meta.id}_BOSS_INTRO`, to_screen_id: `${meta.id}_COMBAT`, trigger: "enter_boss", conditions: [], notes: "" },
      { from_screen_id: `${meta.id}_COMBAT`, to_screen_id: `${meta.id}_RESULT`, trigger: "combat_victory", conditions: [chapterDone(meta)], notes: "" }
    ],
    notes: [`part:${meta.part}`, `visual:${style.visual}`, `motion:${style.motion}`, `stitch_theme:${meta.theme}`]
  };
}

function overview() {
  return `# UI Flow Overview (CH01~CH20)

## 공통 화면 계층
1. \`chapter_briefing\`
2. \`route_select\` / \`safehouse\`
3. \`world_map\`
4. \`event_dialogue\`
5. \`loot_resolution\`
6. \`boss_intro\` -> \`combat_arena\`
7. \`result_summary\`

## Part별 디자인 리듬
- **P2 남하 회랑:** ${PART_STYLE.P2.visual}
- **P3 동해 격리선:** ${PART_STYLE.P3.visual}
- **P4 외해 관문:** ${PART_STYLE.P4.visual}

## 신규 장 전용 위젯
${CHAPTERS.map((meta) => `- **${meta.id} ${meta.title}:** ${meta.widgets.join(", ")}`).join("\n")}
`;
}

function stitch() {
  return `# Stitch Part Theme Brief

## 목표
- Part 2, Part 3, Part 4는 같은 게임이지만 장이 갈수록 몰입이 깊어지도록 배경과 UI 리듬을 분리한다.

## Part 2 - 남하 회랑
- 분위기: 급박함, 검문 압박, 젖은 콘크리트
- 색/질감: 적색 경고등, 소듐 오렌지, 회색 콘크리트
- Stitch prompt:
  - "korean urban apocalypse checkpoint corridor, wet concrete, red emergency lights, narrow military barricades, crowded survivors, industrial realism, cinematic game UI, high tension, scan line overlays, grounded materials, no fantasy"

## Part 3 - 동해 격리선
- 분위기: 차가움, 정지된 시간, 기록 해독
- 색/질감: 청록 응급등, 백색 서리, 바랜 철골
- Stitch prompt:
  - "cold korean quarantine base on the east coast, blue emergency lights, white frost, exposed steel beams, abandoned rail junction, cinematic survival game UI, sparse layout, archival overlays, realistic weathered textures, no fantasy"

## Part 4 - 외해 관문
- 분위기: 공개 심판, 배급 질서, 새벽의 최종성
- 색/질감: 염분 회색, 새벽 청색, 수기 명단, 방송 장비
- Stitch prompt:
  - "korean offshore quarantine station at dawn, salt-stained concrete, handwritten boarding lists, broadcast equipment, civic queue boards, cinematic survival game UI, moral tension, public allocation hall, realistic sea wind atmosphere, no fantasy"

## 챕터별 테마 매핑
${CHAPTERS.map((meta) => `- ${meta.id} ${meta.title}: ${meta.theme}`).join("\n")}
`;
}

function validate(chapters, uiFlows, enemies, encounterTables) {
  const enemyIds = new Set(enemies.map((enemy) => enemy.enemy_id));
  const encounterIds = new Set(encounterTables.map((table) => table.encounter_table_id));
  for (const chapter of chapters) {
    if (chapter.objectives.length < 5 || chapter.objectives.length > 8) throw new Error(`${chapter.chapter_id} objective count is out of range.`);
    if (chapter.quest_tracks.length < 3) throw new Error(`${chapter.chapter_id} requires main + 2 side quest tracks.`);
    if (chapter.nodes.length !== 5) throw new Error(`${chapter.chapter_id} must keep a 5-node skeleton.`);
    for (const node of chapter.nodes) if (node.encounter_table_id && !encounterIds.has(node.encounter_table_id)) throw new Error(`${chapter.chapter_id} references missing encounter ${node.encounter_table_id}.`);
  }
  for (const table of encounterTables) for (const unit of table.units) if (!enemyIds.has(unit.enemy_id)) throw new Error(`Encounter ${table.encounter_table_id} references missing enemy ${unit.enemy_id}.`);
  for (const ui of uiFlows) for (const screen of ui.screens) if (!SCREEN_TYPES.has(screen.screen_type)) throw new Error(`${ui.chapter_id} has unsupported screen ${screen.screen_type}.`);
}

async function main() {
  const [manifest, index, npc, enemy, encounter] = await Promise.all([readJson(FILES.manifest), readJson(FILES.index), readJson(FILES.npc), readJson(FILES.enemy), readJson(FILES.encounter)]);
  const chapters = CHAPTERS.map(chapterDoc);
  const uiFlows = CHAPTERS.map(uiDoc);
  const encounters = CHAPTERS.flatMap((meta) => ([{ encounter_table_id: meta.fieldEncounterId, threat_level: "high", units: meta.fieldUnits }, { encounter_table_id: meta.bossEncounterId, threat_level: "boss", units: meta.bossUnits }]));
  manifest.title = "Dokdo Arc Webgame Pack (CH01~CH20)";
  manifest.ui.chapters = ["ui/ch01.ui_flow.json", "ui/ch02.ui_flow.json", "ui/ch03.ui_flow.json", "ui/ch04.ui_flow.json", "ui/ch05.ui_flow.json", ...CHAPTERS.map((meta) => `ui/${slug(meta.id)}.ui_flow.json`)];
  index.chapters = [...index.chapters.filter((entry) => Number(chapterNo(entry.chapter_id)) <= 5), ...CHAPTERS.map((meta) => ({ chapter_id: meta.id, title: meta.title, file: `data/chapters/${slug(meta.id)}.json` }))];
  npc.npcs = mergeBy(npc.npcs, "npc_id", NPCS);
  enemy.enemies = mergeBy(enemy.enemies, "enemy_id", ENEMIES);
  encounter.encounter_tables = mergeBy(encounter.encounter_tables, "encounter_table_id", encounters);
  validate(chapters, uiFlows, enemy.enemies, encounter.encounter_tables);
  await Promise.all([writeJson(FILES.manifest, manifest), writeJson(FILES.index, index), writeJson(FILES.npc, npc), writeJson(FILES.enemy, enemy), writeJson(FILES.encounter, encounter), writeText(FILES.overview, overview()), writeText(FILES.stitch, stitch()), ...chapters.map((chapter) => writeJson(path.join(CHAPTER_DIR, `${slug(chapter.chapter_id)}.json`), chapter)), ...uiFlows.map((flow) => writeJson(path.join(UI_DIR, `${slug(flow.chapter_id)}.ui_flow.json`), flow))]);
  console.log(`generated ${chapters.length} chapters, ${uiFlows.length} ui flows`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
