export type PartId = "P1" | "P2" | "P3" | "P4";

export type AppId =
  | "donggrolgamebook-p1"
  | "donggrolgamebook-p2"
  | "donggrolgamebook-p3"
  | "donggrolgamebook-p4";

export type RuntimeScreenType = "event_dialogue" | "route_select" | "safehouse";

export type LegacyFallbackSlot =
  | "start_background"
  | "inspection_background"
  | "gate_background"
  | "transmitter_background"
  | "inventory_board";

export interface PartManifest {
  part_id: PartId;
  app_id: AppId;
  title: string;
  summary: string;
  chapter_range: [string, string];
  start_chapter_id: string;
  end_chapter_id: string;
  docs_root: string;
  implemented: boolean;
}

export interface ChapterCatalogEntry {
  chapter_id: string;
  part_id: PartId;
  title: string;
  order_in_part: number;
  order_global: number;
  next_chapter_id?: string;
  synopsis_doc_path?: string;
  runtime_status: "implemented" | "planned";
}

export interface ChapterRuntimeConfig {
  chapter_id: string;
  entry_node_id: string;
  hub_node_id: string;
  deploy_node_id: string;
  respawn_node_id: string;
  default_art_key: string;
  legacy_fallback_slots: LegacyFallbackSlot[];
  special_screen_overrides?: Record<string, RuntimeScreenType>;
}

export interface SaveNamespace {
  app_id: AppId;
  slot_key: string;
}

export const PART_MANIFESTS: Record<PartId, PartManifest> = {
  P1: {
    part_id: "P1",
    app_id: "donggrolgamebook-p1",
    title: "Part 1: 서울 북서 기록선",
    summary: "여의도에서 판교까지 신호의 실체를 추적하는 1차 아크",
    chapter_range: ["CH01", "CH05"],
    start_chapter_id: "CH01",
    end_chapter_id: "CH05",
    docs_root: "docs/concept_arc_01_05_md",
    implemented: true
  },
  P2: {
    part_id: "P2",
    app_id: "donggrolgamebook-p2",
    title: "Part 2: 남하 회랑",
    summary: "판교 이후 남하 회랑을 관통하며 봉쇄선 남단 구조를 확인하는 아크",
    chapter_range: ["CH06", "CH10"],
    start_chapter_id: "CH06",
    end_chapter_id: "CH10",
    docs_root: "docs/world",
    implemented: true
  },
  P3: {
    part_id: "P3",
    app_id: "donggrolgamebook-p3",
    title: "Part 3: 동해 접근선",
    summary: "내륙 우회와 동해 접근을 통해 외해 전초까지 도달하는 아크",
    chapter_range: ["CH11", "CH15"],
    start_chapter_id: "CH11",
    end_chapter_id: "CH15",
    docs_root: "docs/world",
    implemented: true
  },
  P4: {
    part_id: "P4",
    app_id: "donggrolgamebook-p4",
    title: "Part 4: 독도 관문",
    summary: "외해 전초에서 독도 진입까지 이어지는 최종 생존선 아크",
    chapter_range: ["CH16", "CH20"],
    start_chapter_id: "CH16",
    end_chapter_id: "CH20",
    docs_root: "docs/world",
    implemented: true
  }
};

export const CHAPTER_CATALOG: Record<string, ChapterCatalogEntry> = {
  CH01: {
    chapter_id: "CH01",
    part_id: "P1",
    title: "잿빛 개장",
    order_in_part: 1,
    order_global: 1,
    next_chapter_id: "CH02",
    synopsis_doc_path: "docs/concept_arc_01_05_md/CHAPTER_01_잿빛_개장.md",
    runtime_status: "implemented"
  },
  CH02: {
    chapter_id: "CH02",
    part_id: "P1",
    title: "검은 수로",
    order_in_part: 2,
    order_global: 2,
    next_chapter_id: "CH03",
    synopsis_doc_path: "docs/concept_arc_01_05_md/CHAPTER_02_검은_수로.md",
    runtime_status: "implemented"
  },
  CH03: {
    chapter_id: "CH03",
    part_id: "P1",
    title: "유리정원",
    order_in_part: 3,
    order_global: 3,
    next_chapter_id: "CH04",
    synopsis_doc_path: "docs/concept_arc_01_05_md/CHAPTER_03_유리정원.md",
    runtime_status: "implemented"
  },
  CH04: {
    chapter_id: "CH04",
    part_id: "P1",
    title: "상자들의 도시",
    order_in_part: 4,
    order_global: 4,
    next_chapter_id: "CH05",
    synopsis_doc_path: "docs/concept_arc_01_05_md/CHAPTER_04_상자들의_도시.md",
    runtime_status: "implemented"
  },
  CH05: {
    chapter_id: "CH05",
    part_id: "P1",
    title: "미러센터",
    order_in_part: 5,
    order_global: 5,
    next_chapter_id: "CH06",
    synopsis_doc_path: "docs/concept_arc_01_05_md/CHAPTER_05_미러센터.md",
    runtime_status: "implemented"
  },
  CH06: {
    chapter_id: "CH06",
    part_id: "P2",
    title: "하강 관문",
    order_in_part: 1,
    order_global: 6,
    next_chapter_id: "CH07",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch06-하강-관문",
    runtime_status: "implemented"
  },
  CH07: {
    chapter_id: "CH07",
    part_id: "P2",
    title: "적색 회랑",
    order_in_part: 2,
    order_global: 7,
    next_chapter_id: "CH08",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch07-적색-회랑",
    runtime_status: "implemented"
  },
  CH08: {
    chapter_id: "CH08",
    part_id: "P2",
    title: "봉쇄선의 방",
    order_in_part: 3,
    order_global: 8,
    next_chapter_id: "CH09",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch08-봉쇄선의-방",
    runtime_status: "implemented"
  },
  CH09: {
    chapter_id: "CH09",
    part_id: "P2",
    title: "연기 저장고",
    order_in_part: 4,
    order_global: 9,
    next_chapter_id: "CH10",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch09-연기-저장고",
    runtime_status: "implemented"
  },
  CH10: {
    chapter_id: "CH10",
    part_id: "P2",
    title: "침하 항만",
    order_in_part: 5,
    order_global: 10,
    next_chapter_id: "CH11",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch10-침하-항만",
    runtime_status: "implemented"
  },
  CH11: {
    chapter_id: "CH11",
    part_id: "P3",
    title: "철의 우회",
    order_in_part: 1,
    order_global: 11,
    next_chapter_id: "CH12",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch11-철의-우회",
    runtime_status: "implemented"
  },
  CH12: {
    chapter_id: "CH12",
    part_id: "P3",
    title: "잔향 기지",
    order_in_part: 2,
    order_global: 12,
    next_chapter_id: "CH13",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch12-잔향-기지",
    runtime_status: "implemented"
  },
  CH13: {
    chapter_id: "CH13",
    part_id: "P3",
    title: "백색 야적장",
    order_in_part: 3,
    order_global: 13,
    next_chapter_id: "CH14",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch13-백색-야적장",
    runtime_status: "implemented"
  },
  CH14: {
    chapter_id: "CH14",
    part_id: "P3",
    title: "해무 변전소",
    order_in_part: 4,
    order_global: 14,
    next_chapter_id: "CH15",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch14-해무-변전소",
    runtime_status: "implemented"
  },
  CH15: {
    chapter_id: "CH15",
    part_id: "P3",
    title: "격리 파수",
    order_in_part: 5,
    order_global: 15,
    next_chapter_id: "CH16",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch15-격리-파수",
    runtime_status: "implemented"
  },
  CH16: {
    chapter_id: "CH16",
    part_id: "P4",
    title: "균열 사구",
    order_in_part: 1,
    order_global: 16,
    next_chapter_id: "CH17",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch16-균열-사구",
    runtime_status: "implemented"
  },
  CH17: {
    chapter_id: "CH17",
    part_id: "P4",
    title: "파편 수문",
    order_in_part: 2,
    order_global: 17,
    next_chapter_id: "CH18",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch17-파편-수문",
    runtime_status: "implemented"
  },
  CH18: {
    chapter_id: "CH18",
    part_id: "P4",
    title: "소금 정거장",
    order_in_part: 3,
    order_global: 18,
    next_chapter_id: "CH19",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch18-소금-정거장",
    runtime_status: "implemented"
  },
  CH19: {
    chapter_id: "CH19",
    part_id: "P4",
    title: "외해 전초",
    order_in_part: 4,
    order_global: 19,
    next_chapter_id: "CH20",
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch19-외해-전초",
    runtime_status: "implemented"
  },
  CH20: {
    chapter_id: "CH20",
    part_id: "P4",
    title: "독도의 문",
    order_in_part: 5,
    order_global: 20,
    synopsis_doc_path: "docs/world/chapter-synopsis-ch06-ch20.md#ch20-독도의-문",
    runtime_status: "implemented"
  }
};

export const IMPLEMENTED_CHAPTER_IDS = Object.values(CHAPTER_CATALOG)
  .filter((entry) => entry.runtime_status === "implemented")
  .sort((left, right) => left.order_global - right.order_global)
  .map((entry) => entry.chapter_id);

export const CHAPTER_RUNTIME_CONFIGS: Partial<Record<string, ChapterRuntimeConfig>> = {
  CH01: {
    chapter_id: "CH01",
    entry_node_id: "YD-01",
    hub_node_id: "YD-01",
    deploy_node_id: "YD-02",
    respawn_node_id: "YD-01",
    default_art_key: "bg_yeouido_ashroad",
    legacy_fallback_slots: ["start_background", "inspection_background", "transmitter_background"]
  },
  CH02: {
    chapter_id: "CH02",
    entry_node_id: "NR-01",
    hub_node_id: "NR-01",
    deploy_node_id: "NR-02",
    respawn_node_id: "NR-01",
    default_art_key: "bg_noryangjin_market",
    legacy_fallback_slots: ["gate_background", "inspection_background", "start_background"]
  },
  CH03: {
    chapter_id: "CH03",
    entry_node_id: "JS-01",
    hub_node_id: "JS-01",
    deploy_node_id: "JS-02",
    respawn_node_id: "JS-01",
    default_art_key: "bg_jamsil_lobby",
    legacy_fallback_slots: ["inspection_background", "gate_background", "transmitter_background"]
  },
  CH04: {
    chapter_id: "CH04",
    entry_node_id: "MJ-01",
    hub_node_id: "MJ-01",
    deploy_node_id: "MJ-02",
    respawn_node_id: "MJ-01",
    default_art_key: "bg_sorting_hall",
    legacy_fallback_slots: ["inventory_board", "inspection_background", "gate_background"]
  },
  CH05: {
    chapter_id: "CH05",
    entry_node_id: "PG-01",
    hub_node_id: "PG-01",
    deploy_node_id: "PG-02",
    respawn_node_id: "PG-01",
    default_art_key: "bg_pangyo_lobby",
    legacy_fallback_slots: ["transmitter_background", "gate_background", "inspection_background"],
    special_screen_overrides: {
      EV_CH05_EXTRACTION: "event_dialogue"
    }
  },
  CH06: {
    chapter_id: "CH06",
    entry_node_id: "CH06_N01",
    hub_node_id: "CH06_N02",
    deploy_node_id: "CH06_N03",
    respawn_node_id: "CH06_N01",
    default_art_key: "ch06_southern_gate_collapse_entry",
    legacy_fallback_slots: ["start_background", "inspection_background", "gate_background"]
  },
  CH07: {
    chapter_id: "CH07",
    entry_node_id: "CH07_N01",
    hub_node_id: "CH07_N02",
    deploy_node_id: "CH07_N03",
    respawn_node_id: "CH07_N01",
    default_art_key: "ch07_red_corridor_pursuit_entry",
    legacy_fallback_slots: ["start_background", "inspection_background", "gate_background"]
  },
  CH08: {
    chapter_id: "CH08",
    entry_node_id: "CH08_N01",
    hub_node_id: "CH08_N02",
    deploy_node_id: "CH08_N03",
    respawn_node_id: "CH08_N01",
    default_art_key: "ch08_blockade_bureau_autopsy_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "inventory_board"]
  },
  CH09: {
    chapter_id: "CH09",
    entry_node_id: "CH09_N01",
    hub_node_id: "CH09_N02",
    deploy_node_id: "CH09_N03",
    respawn_node_id: "CH09_N01",
    default_art_key: "ch09_smoke_depot_toxic_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "inventory_board"]
  },
  CH10: {
    chapter_id: "CH10",
    entry_node_id: "CH10_N01",
    hub_node_id: "CH10_N02",
    deploy_node_id: "CH10_N03",
    respawn_node_id: "CH10_N01",
    default_art_key: "ch10_sinking_harbor_contract_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "transmitter_background"]
  },
  CH11: {
    chapter_id: "CH11",
    entry_node_id: "CH11_N01",
    hub_node_id: "CH11_N02",
    deploy_node_id: "CH11_N03",
    respawn_node_id: "CH11_N01",
    default_art_key: "ch11_iron_detour_frost_entry",
    legacy_fallback_slots: ["inspection_background", "transmitter_background", "gate_background"]
  },
  CH12: {
    chapter_id: "CH12",
    entry_node_id: "CH12_N01",
    hub_node_id: "CH12_N02",
    deploy_node_id: "CH12_N03",
    respawn_node_id: "CH12_N01",
    default_art_key: "ch12_echo_base_signal_entry",
    legacy_fallback_slots: ["inspection_background", "transmitter_background", "gate_background"]
  },
  CH13: {
    chapter_id: "CH13",
    entry_node_id: "CH13_N01",
    hub_node_id: "CH13_N02",
    deploy_node_id: "CH13_N03",
    respawn_node_id: "CH13_N01",
    default_art_key: "ch13_white_yard_ethics_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "inventory_board"]
  },
  CH14: {
    chapter_id: "CH14",
    entry_node_id: "CH14_N01",
    hub_node_id: "CH14_N02",
    deploy_node_id: "CH14_N03",
    respawn_node_id: "CH14_N01",
    default_art_key: "ch14_sea_fog_grid_entry",
    legacy_fallback_slots: ["inspection_background", "transmitter_background", "gate_background"]
  },
  CH15: {
    chapter_id: "CH15",
    entry_node_id: "CH15_N01",
    hub_node_id: "CH15_N02",
    deploy_node_id: "CH15_N03",
    respawn_node_id: "CH15_N01",
    default_art_key: "ch15_quarantine_watch_cliff_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "transmitter_background"]
  },
  CH16: {
    chapter_id: "CH16",
    entry_node_id: "CH16_N01",
    hub_node_id: "CH16_N02",
    deploy_node_id: "CH16_N03",
    respawn_node_id: "CH16_N01",
    default_art_key: "ch16_fractured_dune_loss_entry",
    legacy_fallback_slots: ["start_background", "inspection_background", "gate_background"]
  },
  CH17: {
    chapter_id: "CH17",
    entry_node_id: "CH17_N01",
    hub_node_id: "CH17_N02",
    deploy_node_id: "CH17_N03",
    respawn_node_id: "CH17_N01",
    default_art_key: "ch17_fragment_gate_corrosion_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "transmitter_background"]
  },
  CH18: {
    chapter_id: "CH18",
    entry_node_id: "CH18_N01",
    hub_node_id: "CH18_N02",
    deploy_node_id: "CH18_N03",
    respawn_node_id: "CH18_N01",
    default_art_key: "ch18_salt_station_judgement_entry",
    legacy_fallback_slots: ["inspection_background", "inventory_board", "gate_background"]
  },
  CH19: {
    chapter_id: "CH19",
    entry_node_id: "CH19_N01",
    hub_node_id: "CH19_N02",
    deploy_node_id: "CH19_N03",
    respawn_node_id: "CH19_N01",
    default_art_key: "ch19_outer_sea_platform_politics_entry",
    legacy_fallback_slots: ["inspection_background", "transmitter_background", "gate_background"]
  },
  CH20: {
    chapter_id: "CH20",
    entry_node_id: "CH20_N01",
    hub_node_id: "CH20_N02",
    deploy_node_id: "CH20_N03",
    respawn_node_id: "CH20_N01",
    default_art_key: "ch20_dokdo_gate_core_entry",
    legacy_fallback_slots: ["inspection_background", "gate_background", "transmitter_background"]
  }
};

export const APP_ORIGINS: Record<AppId, readonly string[]> = {
  "donggrolgamebook-p1": [
    "https://donggrolgamebook-p1.apps.tossmini.com",
    "https://donggrolgamebook-p1.private-apps.tossmini.com"
  ],
  "donggrolgamebook-p2": [
    "https://donggrolgamebook-p2.apps.tossmini.com",
    "https://donggrolgamebook-p2.private-apps.tossmini.com"
  ],
  "donggrolgamebook-p3": [
    "https://donggrolgamebook-p3.apps.tossmini.com",
    "https://donggrolgamebook-p3.private-apps.tossmini.com"
  ],
  "donggrolgamebook-p4": [
    "https://donggrolgamebook-p4.apps.tossmini.com",
    "https://donggrolgamebook-p4.private-apps.tossmini.com"
  ]
};

export function listPartManifests(): PartManifest[] {
  return Object.values(PART_MANIFESTS);
}

export function getPartManifest(partId: PartId): PartManifest {
  return PART_MANIFESTS[partId];
}

export function getPartManifestByChapter(chapterId: string): PartManifest | null {
  const chapter = CHAPTER_CATALOG[chapterId];
  return chapter ? PART_MANIFESTS[chapter.part_id] : null;
}

export function getChapterCatalogEntry(chapterId: string): ChapterCatalogEntry | null {
  return CHAPTER_CATALOG[chapterId] ?? null;
}

export function listChaptersForPart(partId: PartId): ChapterCatalogEntry[] {
  return Object.values(CHAPTER_CATALOG)
    .filter((entry) => entry.part_id === partId)
    .sort((left, right) => left.order_in_part - right.order_in_part);
}

export function getChapterRuntimeConfig(chapterId: string): ChapterRuntimeConfig | null {
  return CHAPTER_RUNTIME_CONFIGS[chapterId] ?? null;
}

export function getAppOrigins(appId: AppId): readonly string[] {
  return APP_ORIGINS[appId];
}

export function getAllAppOrigins(): string[] {
  return Object.values(APP_ORIGINS).flatMap((origins) => [...origins]);
}

export function createSaveNamespace(appId: AppId, slotKey: string): SaveNamespace {
  return {
    app_id: appId,
    slot_key: slotKey
  };
}
