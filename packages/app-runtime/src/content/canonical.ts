import type { ContentAlias } from "../types/game";

type ContentAliasKind = ContentAlias["kind"];

export const CONTENT_CANONICAL_ALIASES: ContentAlias[] = [
  {
    kind: "npc",
    source_name: "윤해인",
    canonical_id: "npc_yoon_haein",
    display_name: "윤해인",
    note: "문서와 runtime registry가 일치하는 메인 오퍼레이터다."
  },
  {
    kind: "npc",
    source_name: "정노아",
    canonical_id: "npc_jung_noah",
    display_name: "정노아",
    note: "암시장 전령이며 CH02 거래 루트 해금의 핵심 인물이다."
  },
  {
    kind: "npc",
    source_name: "서진서",
    canonical_id: "npc_seo_jinseo",
    display_name: "서진서",
    note: "폐선착장 선주로, 보트/육로 분기와 함께 다뤄야 한다."
  },
  {
    kind: "npc",
    source_name: "안보경",
    canonical_id: "npc_ahn_bogyeong",
    display_name: "안보경",
    note: "잠실 하층의 실무형 리더로 문서와 registry가 일치한다."
  },
  {
    kind: "npc",
    source_name: "류세온",
    canonical_id: "npc_ryu_seon",
    display_name: "류세온",
    note: "잠실 상층 대표. 문서에서는 계층 갈등 축의 대표 인물로 강조된다."
  },
  {
    kind: "npc",
    source_name: "한소명",
    canonical_id: "npc_han_somyeong",
    display_name: "한소명",
    note: "문정 자동분류센터 내부자. 라인 on/off 선택과 연결된다."
  },
  {
    kind: "npc",
    source_name: "김아라",
    canonical_id: "npc_kim_ara",
    display_name: "김아라",
    note: "CH05 구조 대상이자 후속 아크 핵심 동료다."
  },
  {
    kind: "npc",
    source_name: "백도형",
    canonical_id: "npc_baek_dohyeong",
    display_name: "백도형",
    note: "registry에는 존재하지만 portrait/event 전개는 아직 얕다."
  },
  {
    kind: "npc",
    source_name: "한예지",
    canonical_id: "npc_support_writer",
    display_name: "한예지",
    note: "CH01 문서의 고립 생존자. runtime은 generic support writer 아트 키만 갖고 있다."
  },
  {
    kind: "npc",
    source_name: "오태식",
    canonical_id: "text_only_oh_taesik",
    display_name: "오태식",
    note: "CH01 문서에만 있는 기록국 경비 노장이다. 현재 runtime NPC registry에는 없다."
  },
  {
    kind: "npc",
    source_name: "최무결",
    canonical_id: "text_only_choi_mugyeol",
    display_name: "최무결",
    note: "NPC 바이블과 CH04 문서 기준 현장 복구 파트 인물이다. 현재는 텍스트 placeholder만 필요하다."
  },
  {
    kind: "npc",
    source_name: "차문식",
    canonical_id: "text_only_cha_munsik",
    display_name: "차문식",
    note: "CH05 로그와 음성으로만 암시되는 장기 빌런이다."
  },
  {
    kind: "enemy",
    source_name: "침식자",
    canonical_id: "erosion_basic",
    display_name: "침식자",
    note: "문서의 기본형 감염체가 runtime enemy_id erosion_basic으로 구현돼 있다."
  },
  {
    kind: "enemy",
    source_name: "질주체",
    canonical_id: "runner",
    display_name: "질주체",
    note: "문서의 고속 돌진형 감염체가 runtime enemy_id runner와 대응한다."
  },
  {
    kind: "enemy",
    source_name: "매복체",
    canonical_id: "text_only_ambusher",
    display_name: "매복체",
    note: "천장/벽 부착형 설명은 문서에 있으나 runtime enemy registry에는 독립 엔트리가 아직 없다."
  },
  {
    kind: "enemy",
    source_name: "포낭체",
    canonical_id: "spore_sac_small",
    display_name: "포낭체",
    note: "일반 포낭체는 소형 포낭체 엔트리로 시작하고 보스 파생형이 분기된다."
  },
  {
    kind: "enemy",
    source_name: "부유자",
    canonical_id: "floater",
    display_name: "부유자",
    note: "수몰 구역 특화형 감염체와 runtime enemy_id floater가 대응한다."
  },
  {
    kind: "enemy",
    source_name: "창가체",
    canonical_id: "windowling",
    display_name: "창가체",
    note: "고층 외벽 기동형 감염체와 runtime enemy_id windowling이 대응한다."
  },
  {
    kind: "enemy",
    source_name: "분류체",
    canonical_id: "sorter",
    display_name: "분류체",
    note: "물류 자동화 적응형 감염체와 runtime enemy_id sorter가 대응한다."
  },
  {
    kind: "enemy",
    source_name: "메아리체",
    canonical_id: "echoer",
    display_name: "메아리체",
    note: "저주파/알람 반응 증폭형 감염체와 runtime enemy_id echoer가 대응한다."
  },
  {
    kind: "enemy",
    source_name: "편집괴",
    canonical_id: "editing_aberration",
    display_name: "편집괴",
    note: "CH01의 장치 연동형 보스다."
  },
  {
    kind: "enemy",
    source_name: "청음",
    canonical_id: "sluice_sac_cheongeum",
    display_name: "청음",
    note: "CH02 수문 포낭 보스의 runtime id다."
  },
  {
    kind: "enemy",
    source_name: "유리정원",
    canonical_id: "vista_amalgam_glassgarden",
    display_name: "유리정원",
    note: "CH03 전망 접합체 보스다."
  },
  {
    kind: "enemy",
    source_name: "피커",
    canonical_id: "picker_prime",
    display_name: "피커",
    note: "CH04 자동분류 접합 보스다."
  },
  {
    kind: "enemy",
    source_name: "회선",
    canonical_id: "mirror_core_lines",
    display_name: "회선",
    note: "CH05 미러코어 접합체 보스다."
  },
  {
    kind: "item",
    source_name: "단파 증폭기",
    canonical_id: "itm_shortwave_amplifier",
    display_name: "단파 증폭기",
    note: "CH01 핵심 장비. 문서와 runtime이 일치한다."
  },
  {
    kind: "item",
    source_name: "방송국 비상 명부",
    canonical_id: "itm_broadcast_log",
    display_name: "방송국 비상 송출 로그",
    note: "문서의 명부/기록 묶음이 runtime에서는 송출 로그 아이템으로 축약됐다."
  },
  {
    kind: "item",
    source_name: "방송국 비상 송출 로그",
    canonical_id: "itm_broadcast_log",
    display_name: "방송국 비상 송출 로그",
    note: "CH01 스토리 증거 아이템이다."
  },
  {
    kind: "item",
    source_name: "마지막 뉴스 오프닝 테이프",
    canonical_id: "itm_news_opening_tape",
    display_name: "마지막 뉴스 오프닝 테이프",
    note: "CH01 수집품. 문서와 runtime이 일치한다."
  },
  {
    kind: "item",
    source_name: "강변 중계배터리",
    canonical_id: "itm_river_relay_battery",
    display_name: "강변 중계배터리",
    note: "CH02 메인 목표 아이템이다."
  },
  {
    kind: "item",
    source_name: "수로 지도",
    canonical_id: "itm_waterway_map",
    display_name: "수로 지도",
    note: "CH02 보트/육로 분기와 같이 회수되는 핵심 문서형 아이템이다."
  },
  {
    kind: "item",
    source_name: "위조 검역 패스",
    canonical_id: "itm_counterfeit_quarantine_pass",
    display_name: "위조 검역 패스",
    note: "백도형 유통망의 핵심 증거 아이템이다."
  },
  {
    kind: "item",
    source_name: "고성능 축전지",
    canonical_id: "itm_highcap_capacitor",
    display_name: "고성능 축전지",
    note: "CH03 잠실 전력 축의 핵심 자원이다."
  },
  {
    kind: "item",
    source_name: "송신 릴레이 렌즈",
    canonical_id: "itm_relay_lens",
    display_name: "송신 릴레이 렌즈",
    note: "문서 표현을 runtime quest item 명칭에 맞춘 별칭이다."
  },
  {
    kind: "item",
    source_name: "릴레이 렌즈",
    canonical_id: "itm_relay_lens",
    display_name: "송신 릴레이 렌즈",
    note: "축약 호칭을 canonical item id로 묶는다."
  },
  {
    kind: "item",
    source_name: "데이터 키 조각",
    canonical_id: "itm_data_key_fragment",
    display_name: "데이터 키 조각",
    note: "판교 접근을 암시하는 CH03 후반 아이템이다."
  },
  {
    kind: "item",
    source_name: "배송 배지",
    canonical_id: "itm_delivery_badge",
    display_name: "배송 배지",
    note: "CH04 판교 접근용 핵심 배지다."
  },
  {
    kind: "item",
    source_name: "보안 배지",
    canonical_id: "itm_security_badge",
    display_name: "보안 배지",
    note: "CH04 ARK-P 깊은 구획 접근용 배지다."
  },
  {
    kind: "item",
    source_name: "판교 외곽 진입권",
    canonical_id: "itm_route_clearance_pangyo",
    display_name: "판교 진입권",
    note: "문서는 외곽 진입권, runtime은 판교 진입권으로 짧게 표기한다."
  },
  {
    kind: "item",
    source_name: "판교 진입권",
    canonical_id: "itm_route_clearance_pangyo",
    display_name: "판교 진입권",
    note: "runtime 표기명이다."
  },
  {
    kind: "item",
    source_name: "ARK-P 접근 키",
    canonical_id: "itm_arkp_access_key",
    display_name: "ARK-P 접근 키",
    note: "CH05 서버홀 접근 조건 아이템이다."
  },
  {
    kind: "item",
    source_name: "남부 회랑 데이터",
    canonical_id: "itm_southern_corridor_data",
    display_name: "남부 회랑 데이터",
    note: "CH05 후속 남하 아크를 여는 핵심 데이터다."
  },
  {
    kind: "item",
    source_name: "독도 신호 인증값",
    canonical_id: "itm_dokdo_signal_auth",
    display_name: "독도 신호 인증키",
    note: "문서는 인증값, runtime은 인증키로 표기한다."
  },
  {
    kind: "item",
    source_name: "독도 인증 프로토콜",
    canonical_id: "itm_dokdo_signal_auth",
    display_name: "독도 신호 인증키",
    note: "CH05 문서 희귀 루팅 표현을 runtime quest item과 연결한다."
  },
  {
    kind: "doc",
    source_name: "차문식 로그",
    canonical_id: "text_only_cha_munsik_log",
    display_name: "차문식 로그",
    note: "문서/음성 기반 떡밥으로만 존재한다."
  },
  {
    kind: "doc",
    source_name: "백도형 거래 목록",
    canonical_id: "text_only_baek_dohyeong_trade_sheet",
    display_name: "백도형 거래 목록",
    note: "CH02 문서 사이드 퀘스트 전용 증거물이다."
  },
  {
    kind: "doc",
    source_name: "내부망 관리자 ID",
    canonical_id: "text_only_internal_admin_id",
    display_name: "내부망 관리자 ID",
    note: "CH05 희귀 루팅 후보. 현재 runtime item id는 없다."
  }
];

export function findCanonicalAlias(kind: ContentAliasKind, canonicalId: string): ContentAlias | undefined {
  return CONTENT_CANONICAL_ALIASES.find((entry) => entry.kind === kind && entry.canonical_id === canonicalId);
}

export function findAliasBySourceName(kind: ContentAliasKind, sourceName: string): ContentAlias | undefined {
  return CONTENT_CANONICAL_ALIASES.find((entry) => entry.kind === kind && entry.source_name === sourceName);
}

export function findAliasByCanonicalId(canonicalId: string): ContentAlias | undefined {
  return CONTENT_CANONICAL_ALIASES.find((entry) => entry.canonical_id === canonicalId);
}

export function getCanonicalDisplayName(kind: ContentAliasKind, canonicalId: string, fallback: string): string {
  return findCanonicalAlias(kind, canonicalId)?.display_name ?? fallback;
}
