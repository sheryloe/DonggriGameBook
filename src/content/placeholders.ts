export type PlaceholderKind = "npc" | "enemy" | "item" | "doc" | "route";

export interface ContentPlaceholder {
  id: string;
  kind: PlaceholderKind;
  display_name: string;
  source_path: string;
  summary: string;
  body: string[];
  related_ids: string[];
  suggested_art_key?: string;
}

export const CONTENT_PLACEHOLDERS: Record<string, ContentPlaceholder> = {
  npc_support_writer: {
    id: "npc_support_writer",
    kind: "npc",
    display_name: "한예지",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_01_잿빛_개장.md",
    summary: "CH01 편집실에 고립된 보조 작가 생존자.",
    body: [
      "자동 송출만 멈추면 끝날 줄 알았지만, 소리가 꺼져도 감염체는 멈추지 않았다는 증언을 남긴다.",
      "구조 시 기록국 인원 증가와 후속 대사 확장을 담당하는 인물로 해석하는 편이 문서 톤과 맞다."
    ],
    related_ids: ["EV_CH01_WRITER_RESCUE", "portrait_yoon_haein"],
    suggested_art_key: "npc_support_writer"
  },
  text_only_oh_taesik: {
    id: "text_only_oh_taesik",
    kind: "npc",
    display_name: "오태식",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_01_잿빛_개장.md",
    summary: "기록국의 노장 경비로 CH01 브리핑 톤을 보강하는 텍스트 전용 인물.",
    body: [
      "첫 임무면 못 주운 건 버린 거고, 못 돌아온 건 죽은 거라는 식의 냉혹한 현장 규율을 상징한다.",
      "현재 runtime에는 직접 등장하지 않으므로 브리핑 로그나 라디오 멘트용 카드 정도로만 쓰는 게 안전하다."
    ],
    related_ids: ["CH01", "YD-01"],
    suggested_art_key: "portrait_yoon_haein"
  },
  text_only_choi_mugyeol: {
    id: "text_only_choi_mugyeol",
    kind: "npc",
    display_name: "최무결",
    source_path: "docs/concept_arc_01_05_md/NPC_BIBLE_01_05.md",
    summary: "철도/배수문/전력 설비 복구를 맡는 현장형 인물.",
    body: [
      "문서상 첫 등장은 Chapter 2 후반이며, Chapter 4 수서 철도선 분기와 특히 잘 맞는다.",
      "지금 범위에서는 무전, 현장 메모, 후속 합류 예고 카드로 처리하는 편이 현재 JSON 구조와 충돌이 없다."
    ],
    related_ids: ["CH02", "CH04", "MJ-04"],
    suggested_art_key: "bg_rail_transfer"
  },
  text_only_cha_munsik: {
    id: "text_only_cha_munsik",
    kind: "npc",
    display_name: "차문식",
    source_path: "docs/concept_arc_01_05_md/NPC_BIBLE_01_05.md",
    summary: "낙원 인프라 잔당 핵심으로 암시되는 장기 빌런.",
    body: [
      "Chapter 5 시점에서는 얼굴 없는 지시자이며, 로그와 음성만으로 합리주의적 잔혹함을 드러낸다.",
      "직접 캐릭터 카드보다 로그 묶음과 관리자 음성 파편으로 유지하는 쪽이 현재 아크 완성도와 맞다."
    ],
    related_ids: ["CH05", "text_only_cha_munsik_log"],
    suggested_art_key: "bg_arkp_serverhall"
  },
  text_only_cha_munsik_log: {
    id: "text_only_cha_munsik_log",
    kind: "doc",
    display_name: "차문식 로그",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_05_미러센터.md",
    summary: "선별과 군집 유도를 비용 효율로 말하는 관리 로그.",
    body: [
      "유도 성공. 군집은 경보 주파수 18Hz 대역에서 가장 안정적이라는 문장을 핵심 문구로 삼는다.",
      "대피는 비효율적이며 선별은 비용 대비 효과가 높다는 기록이 후속 윤리 갈등의 출발점이다."
    ],
    related_ids: ["CH05", "mirror_core_lines"],
    suggested_art_key: "bg_arkp_serverhall"
  },
  text_only_ambusher: {
    id: "text_only_ambusher",
    kind: "enemy",
    display_name: "매복체",
    source_path: "docs/concept_arc_01_05_md/INFECTED_BIBLE_01_05.md",
    summary: "벽과 천장에 부착된 채 탐지를 피하는 감염체 아키타입.",
    body: [
      "팔과 갈비가 비정상적으로 벌어져 구조물에 걸쳐 있고, 어둠 속에서는 젖은 숨소리만 먼저 들린다.",
      "현재 runtime enemy registry에는 독립 엔트리가 없으므로, 천장 경고 연출과 choice 리스크 설명 텍스트로 우선 소비하는 편이 안전하다."
    ],
    related_ids: ["CH01", "CH03", "CH05"],
    suggested_art_key: "bg_service_stair"
  },
  text_only_baek_dohyeong_trade_sheet: {
    id: "text_only_baek_dohyeong_trade_sheet",
    kind: "doc",
    display_name: "백도형 거래 목록",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_02_검은_수로.md",
    summary: "위조 검역 패스와 사람 이동 경로를 묶어 둔 거래 증거.",
    body: [
      "암시장 천막촌과 낙원회 유통망을 연결하는 종이 증거물로, 이후 백도형을 쫓는 핵심 실마리로 쓸 수 있다.",
      "현재 runtime item은 위조 검역 패스 하나뿐이라, 이 문서는 별도 카드 또는 lore 패널 placeholder가 적절하다."
    ],
    related_ids: ["npc_baek_dohyeong", "itm_counterfeit_quarantine_pass"],
    suggested_art_key: "portrait_jung_noah"
  },
  text_only_internal_admin_id: {
    id: "text_only_internal_admin_id",
    kind: "doc",
    display_name: "내부망 관리자 ID",
    source_path: "docs/concept_arc_01_05_md/CHAPTER_05_미러센터.md",
    summary: "ARK-P 내부망 관리자 권한 조각을 나타내는 희귀 문서형 보상.",
    body: [
      "로비동이나 서버홀 희귀 루팅으로 배치하면 내부망 로그, 추가 패널 해제, 비공개 관리자 기록 접근과 자연스럽게 이어진다.",
      "현재 runtime quest item에는 없으므로, 후속 루팅 확장 전까지는 문서 카드 placeholder로 유지하는 편이 안전하다."
    ],
    related_ids: ["CH05", "PG-02", "PG-05"],
    suggested_art_key: "bg_pangyo_lobby"
  }
};

export function getPlaceholder(id: string): ContentPlaceholder | null {
  return CONTENT_PLACEHOLDERS[id] ?? null;
}

export function listPlaceholdersByKind(kind: PlaceholderKind): ContentPlaceholder[] {
  return Object.values(CONTENT_PLACEHOLDERS).filter((entry) => entry.kind === kind);
}
