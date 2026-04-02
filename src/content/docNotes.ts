import type { ChapterId } from "../types/game";

export interface DocumentDrivenNote {
  id: string;
  chapter_id?: ChapterId;
  subject_id: string;
  source_path: string;
  headline: string;
  summary: string;
  runtime_links: string[];
  risk?: string;
}

export const DOCUMENT_DRIVEN_NOTES: DocumentDrivenNote[] = [
  {
    id: "note_ch01_broadcast_record_axis",
    chapter_id: "CH01",
    subject_id: "CH01",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_01_잿빛_개장.md",
    headline: "CH01은 장비 회수보다 기록/교신 해석 축이 중요하다",
    summary:
      "단파 증폭기 회수뿐 아니라 마지막 생방송 직전 기록, 비상 명부, 울릉-독도 인증 신호를 함께 읽는 장으로 설계돼 있다.",
    runtime_links: ["itm_shortwave_amplifier", "itm_broadcast_log", "itm_news_opening_tape", "npc_yoon_haein"]
  },
  {
    id: "note_ch01_han_yeji_mapping",
    chapter_id: "CH01",
    subject_id: "npc_support_writer",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_01_잿빛_개장.md",
    headline: "고립 생존자 이름은 한예지로 정리하는 편이 맞다",
    summary:
      "runtime 이벤트는 generic support writer만 노출하지만, 문서상 구조 가능한 생존자는 한예지라는 고유 이름을 가진다.",
    runtime_links: ["EV_CH01_WRITER_RESCUE", "npc_support_writer"],
    risk: "로더가 아직 이 별칭을 pack.content_aliases로 주입하지 않으면 UI 표시명은 기존 generic 표현에 머문다."
  },
  {
    id: "note_ch02_gate_choice_consequence",
    chapter_id: "CH02",
    subject_id: "CH02",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_02_검은_수로.md",
    headline: "CH02의 핵심 분기는 배수문 개폐와 귀환 방식이다",
    summary:
      "배수문 개방은 빠른 진입 루트를, 폐쇄는 생존자 보호와 안전한 우회를 의미하며 서진서/정노아 관계에도 여파가 남는다.",
    runtime_links: ["flag:ch02_gate_opened", "flag:ch02_gate_closed", "route.current", "npc_jung_noah", "npc_seo_jinseo"]
  },
  {
    id: "note_ch02_baek_dohyeong_evidence",
    chapter_id: "CH02",
    subject_id: "npc_baek_dohyeong",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_02_검은_수로.md",
    headline: "백도형은 위조 패스만이 아니라 거래 목록까지 남겨야 더 설득력 있다",
    summary:
      "문서에는 백도형 거래 목록, 위조 도장, 암시장 장부 조각 같은 증거 흐름이 있다. 현재 runtime은 위조 검역 패스 한 장으로 축약돼 있다.",
    runtime_links: ["itm_counterfeit_quarantine_pass", "text_only_baek_dohyeong_trade_sheet"],
    risk: "후속 데이터 보강 전까지는 서사 증거 밀도가 낮아 보일 수 있다."
  },
  {
    id: "note_ch03_brand_risk_fictionalized",
    chapter_id: "CH03",
    subject_id: "CH03",
    source_path: "docs/concept_arc_01_05_md/README_ARC_01_05.md",
    headline: "잠실 고층권은 실재 브랜드 대신 캐슬원 레지던스로 유지해야 한다",
    summary:
      "문서 팩은 실재 장소감은 유지하되 고유 브랜드 및 1:1 식별 요소는 피하는 방향을 명시한다.",
    runtime_links: ["bg_jamsil_lobby", "bg_jamsil_showroom", "boss_glassgarden"]
  },
  {
    id: "note_ch03_vertical_fear",
    chapter_id: "CH03",
    subject_id: "vista_amalgam_glassgarden",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_03_유리정원.md",
    headline: "CH03의 공포 축은 수평 전투보다 수직 붕괴다",
    summary:
      "창가체, 낙하, 스카이브리지 풍압, 송풍기와 관수 밸브를 조작하는 공간 전투가 핵심 설계로 잡혀 있다.",
    runtime_links: ["windowling", "bg_skybridge", "bg_rooftop_escape", "boss_glassgarden"]
  },
  {
    id: "note_ch04_choi_mugyeol_hook",
    chapter_id: "CH04",
    subject_id: "text_only_choi_mugyeol",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_04_상자들의_도시.md",
    headline: "최무결은 CH04 수서 철도선 분기와 가장 강하게 결합된다",
    summary:
      "문서상 최무결은 철도/전력 복구의 대표 인물이라 수서 연결선과 무전 지원, 물류선 대 철도선 분기에서 자연스럽다.",
    runtime_links: ["MJ-04", "bg_rail_transfer", "route.current"],
    risk: "현재 runtime에는 실체 NPC가 없으므로 합류 이벤트를 서둘러 넣기보다 라디오 훅으로 깔아 두는 편이 안전하다."
  },
  {
    id: "note_ch04_hub_fate",
    chapter_id: "CH04",
    subject_id: "CH04",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_04_상자들의_도시.md",
    headline: "분류센터는 일회성 던전이 아니라 반복 파밍 허브 운명을 고르는 장이다",
    summary:
      "라인 재가동 여부가 이후 허브 가치, 소음, 전투 패턴을 함께 바꾸는 것이 문서의 핵심 포인트다.",
    runtime_links: ["boss_picker_prime", "bg_sorting_hall", "flag:ch04_line_restarted", "flag:ch04_line_shutdown"]
  },
  {
    id: "note_ch05_arkp_ethics",
    chapter_id: "CH05",
    subject_id: "CH05",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_05_미러센터.md",
    headline: "CH05는 정보 획득보다 선별 체계를 드러내는 윤리 장이다",
    summary:
      "독도 신호가 진짜인지 확인하는 동시에, 그 안전지대가 모두의 피난처가 아닐 수 있다는 점을 드러내는 것이 본편 테마다.",
    runtime_links: ["itm_southern_corridor_data", "itm_dokdo_signal_auth", "npc_kim_ara", "mirror_core_lines"]
  },
  {
    id: "note_ch05_kim_ara_priority",
    chapter_id: "CH05",
    subject_id: "npc_kim_ara",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_05_미러센터.md",
    headline: "김아라 구조 우선 여부가 단순 trust가 아니라 해석 난이도와 패널 접근에도 연결된다",
    summary:
      "문서는 김아라가 필터/억제제 연구와 서버 패널 해제에 기여하는 인물로 설계되어 있다.",
    runtime_links: ["EV_CH05_KIM_ARA", "itm_arkp_access_key", "portrait_kim_ara"]
  },
  {
    id: "note_ch05_cha_munsik_log_only",
    chapter_id: "CH05",
    subject_id: "text_only_cha_munsik_log",
    source_path: "docs/concept_arc_01_05_md/NPC_BIBLE_01_05.md",
    headline: "차문식은 현 시점에서 로그/음성만 유지하는 것이 맞다",
    summary:
      "얼굴 없는 장기 빌런으로 남겨 두어야 후속 아크에서 통제 집착과 윤리 공백을 더 크게 드러낼 수 있다.",
    runtime_links: ["text_only_cha_munsik", "text_only_cha_munsik_log", "bg_arkp_serverhall"]
  }
];

export function listChapterNotes(chapterId: ChapterId): DocumentDrivenNote[] {
  return DOCUMENT_DRIVEN_NOTES.filter((note) => note.chapter_id === chapterId);
}

export function listSubjectNotes(subjectId: string): DocumentDrivenNote[] {
  return DOCUMENT_DRIVEN_NOTES.filter((note) => note.subject_id === subjectId);
}
