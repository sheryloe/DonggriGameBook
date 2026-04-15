import { IMPLEMENTED_CHAPTER_IDS, getChapterRuntimeConfig } from "@donggrol/world-registry";
import type { AssetGenerationJob, AssetModelRoute, ChapterId } from "../types/game";

export interface ImageMatrixEntry {
  key: string;
  group: "background" | "portrait" | "boss" | "document";
  chapter_id?: ChapterId;
  route: AssetModelRoute;
  prompt_hint: string;
  source: "runtime-json" | "doc-only";
  subject_id?: string;
  chapter_default_key?: string;
  existing_img_fallbacks: string[];
  note?: string;
}

export const EXISTING_IMAGE_FALLBACKS = [
  "img/?쒖옉 諛곌꼍.png",
  "img/?낆꽦 ?ъ궗援ъ뿭.png",
  "img/?쇨컙 寃뚯씠??png",
  "img/以묎퀎吏???꾪뙆 ?≪텧?μ튂.png",
  "img/?몃깽?좊━?곹깭 ?붾㈃???꾩씠??蹂대뱶.png",
  "img/?대━???붾㈃.png",
  "img/?ㅽ뙣 ?붾㈃.png",
  "img/寃뚯엫 ?ㅻ쾭 ?곗텧.png"
] as const;

export const CHAPTER_DEFAULT_ART_KEYS: Record<ChapterId, string> = Object.fromEntries(
  IMPLEMENTED_CHAPTER_IDS.map((chapterId) => [
    chapterId,
    getChapterRuntimeConfig(chapterId)?.default_art_key ?? `chapter_${chapterId.toLowerCase()}_placeholder`
  ])
) as Record<ChapterId, string>;

function entry(
  key: string,
  group: ImageMatrixEntry["group"],
  route: AssetModelRoute,
  promptHint: string,
  options: Omit<ImageMatrixEntry, "key" | "group" | "route" | "prompt_hint" | "source" | "existing_img_fallbacks"> & {
    source?: ImageMatrixEntry["source"];
  } = {}
): ImageMatrixEntry {
  return {
    key,
    group,
    route,
    prompt_hint: promptHint,
    source: options.source ?? "runtime-json",
    chapter_id: options.chapter_id,
    subject_id: options.subject_id,
    chapter_default_key: options.chapter_default_key,
    note: options.note,
    existing_img_fallbacks: [...EXISTING_IMAGE_FALLBACKS]
  };
}

export const CORE_IMAGE_GENERATION_MATRIX: ImageMatrixEntry[] = [
  entry("bg_archive_flooded", "background", "nanobanana", "Flooded archive room inside a Korean broadcast facility, cassette shelves, damp documents, waist-high water", { chapter_id: "CH01", chapter_default_key: "bg_yeouido_ashroad" }),
  entry("bg_arkp_exit", "background", "nanobanana", "Emergency exit corridor leaving a Korean disaster mirror center, red alarms, hard industrial lighting", { chapter_id: "CH05", chapter_default_key: "bg_pangyo_interchange" }),
  entry("bg_arkp_serverhall", "background", "nanobanana", "Disaster mirror center server hall in Pangyo, cold blue racks, warning strips, Korean apocalypse mood", { chapter_id: "CH05", chapter_default_key: "bg_pangyo_interchange" }),
  entry("bg_broadcast_lobby", "background", "nanobanana", "Collapsed broadcast station lobby in Yeouido, dead security gates, cracked glass, dim ash light", { chapter_id: "CH01", chapter_default_key: "bg_yeouido_ashroad" }),
  entry("bg_cold_storage", "background", "nanobanana", "Flooded cold storage warehouse in Noryangjin, misty refrigeration air, slick concrete", { chapter_id: "CH02", chapter_default_key: "bg_noryangjin_market" }),
  entry("bg_cold_warehouse", "background", "nanobanana", "Rotting refrigerated logistics warehouse, hanging plastic strips, dead cold chain atmosphere", { chapter_id: "CH04", chapter_default_key: "bg_tancheon_embankment" }),
  entry("bg_cooling_room", "background", "nanobanana", "Industrial cooling plant room for a disaster data center, pipes, frost, warning lights", { chapter_id: "CH05", chapter_default_key: "bg_pangyo_interchange" }),
  entry("bg_delivery_tunnel", "background", "nanobanana", "Underground delivery tunnel toward Pangyo, low ceiling, wet concrete, logistics arrows", { chapter_id: "CH04", chapter_default_key: "bg_tancheon_embankment" }),
  entry("bg_dongjak_culvert", "background", "nanobanana", "Stealth culvert exit near Dongjak, shallow black water, concrete arches, emergency route", { chapter_id: "CH02", chapter_default_key: "bg_noryangjin_market" }),
  entry("bg_emergency_stairs", "background", "nanobanana", "Emergency stairwell escape in a ruined broadcast building, damp metal stairs, hazard lighting", { chapter_id: "CH01", chapter_default_key: "bg_yeouido_ashroad" }),
  entry("bg_jamsil_lobby", "background", "nanobanana", "Luxury high-rise residence lobby in Jamsil after blackout, marble debris, elite ruin", { chapter_id: "CH03", chapter_default_key: "bg_jamsil_lobby" }),
  entry("bg_jamsil_showroom", "background", "nanobanana", "Model house showroom zone in a Korean high-rise complex, broken glass corridors, staged luxury decay", { chapter_id: "CH03", chapter_default_key: "bg_jamsil_lobby" }),
  entry("bg_noryangjin_market", "background", "nanobanana", "Flooded fish market alley in Noryangjin, overturned ice boxes, dark water, Korean apocalypse", { chapter_id: "CH02", chapter_default_key: "bg_noryangjin_market" }),
  entry("bg_pangyo_interchange", "background", "nanobanana", "Pangyo outskirts interchange with autonomous shuttle wrecks and sealed barriers, post-apocalypse Korea", { chapter_id: "CH05", chapter_default_key: "bg_pangyo_interchange" }),
  entry("bg_pangyo_lobby", "background", "nanobanana", "Tech campus lobby in Pangyo with dead kiosks and security gates, clean but fatal atmosphere", { chapter_id: "CH05", chapter_default_key: "bg_pangyo_interchange" }),
  entry("bg_pangyo_skywalk", "background", "nanobanana", "Skywalk garden between Pangyo buildings, glass canopy, alarm echo, high drop fear", { chapter_id: "CH05", chapter_default_key: "bg_pangyo_interchange" }),
  entry("bg_power_room", "background", "nanobanana", "Emergency power room in a high-rise residence, breaker panels, exposed cabling, tension", { chapter_id: "CH03", chapter_default_key: "bg_jamsil_lobby" }),
  entry("bg_rail_transfer", "background", "nanobanana", "Rail transfer underpass near Suseo logistics link, maintenance lamps, industrial rail grime", { chapter_id: "CH04", chapter_default_key: "bg_tancheon_embankment" }),
  entry("bg_rooftop_escape", "background", "nanobanana", "Rooftop extraction point on a Korean super-high-rise, storm wind, emergency beacons, vertigo", { chapter_id: "CH03", chapter_default_key: "bg_jamsil_lobby" }),
  entry("bg_rooftop_signal", "background", "nanobanana", "Broadcast rooftop signal platform, shortwave antenna, gale wind, city haze", { chapter_id: "CH01", chapter_default_key: "bg_yeouido_ashroad" }),
  entry("bg_saetgang_entry", "background", "nanobanana", "Saetgang riverside entry route, soaked tents, muddy embankment, humid danger", { chapter_id: "CH02", chapter_default_key: "bg_noryangjin_market" }),
  entry("bg_security_office", "background", "nanobanana", "Security office inside automated logistics center, badge readers, paperwork, dim fluorescent light", { chapter_id: "CH04", chapter_default_key: "bg_tancheon_embankment" }),
  entry("bg_service_stair", "background", "nanobanana", "Dark service stairwell in a luxury residence, narrow walls, ceiling threat, maintenance signs", { chapter_id: "CH03", chapter_default_key: "bg_jamsil_lobby" }),
  entry("bg_skybridge", "background", "nanobanana", "Glass skybridge over a ruined district, violent wind, broken panels, vertical terror", { chapter_id: "CH03", chapter_default_key: "bg_jamsil_lobby" }),
  entry("bg_sorting_hall", "background", "nanobanana", "Massive package sorting hall with conveyors and suspended mechanical arms, Korean logistics apocalypse", { chapter_id: "CH04", chapter_default_key: "bg_tancheon_embankment" }),
  entry("bg_tancheon_embankment", "background", "nanobanana", "Tancheon embankment approach with levee, wet grass, distant logistics belt, gray sky", { chapter_id: "CH04", chapter_default_key: "bg_tancheon_embankment" }),
  entry("bg_yeouido_ashroad", "background", "nanobanana", "Ash-covered road in front of the National Assembly area, buses wrecked, tents abandoned", { chapter_id: "CH01", chapter_default_key: "bg_yeouido_ashroad" }),

  entry("npc_support_writer", "portrait", "character-25", "Portrait of a young Korean female assistant writer survivor, exhausted, newsroom survivor look", {
    chapter_id: "CH01",
    subject_id: "npc_support_writer",
    chapter_default_key: "bg_yeouido_ashroad",
    note: "臾몄꽌???대쫫? ?쒖삁吏??"
  }),
  entry("portrait_ahn_bogyeong", "portrait", "character-25", "Half-body portrait of Ahn Bogyeong, Korean facilities team leader, practical, worn maintenance gear", {
    chapter_id: "CH03",
    subject_id: "npc_ahn_bogyeong",
    chapter_default_key: "bg_jamsil_lobby"
  }),
  entry("portrait_han_somyeong", "portrait", "character-25", "Half-body portrait of Han Somyeong, burnt-out Korean logistics supervisor, dry expression, field clothes", {
    chapter_id: "CH04",
    subject_id: "npc_han_somyeong",
    chapter_default_key: "bg_tancheon_embankment"
  }),
  entry("portrait_jung_noah", "portrait", "character-25", "Half-body portrait of Jung Noah, sly Korean black-market courier, waterproof layers, sharp eyes", {
    chapter_id: "CH02",
    subject_id: "npc_jung_noah",
    chapter_default_key: "bg_noryangjin_market"
  }),
  entry("portrait_kim_ara", "portrait", "npc-main-pro", "Main NPC portrait of Kim Ara, Korean disaster mirror center researcher, guilt and focus, premium key art", {
    chapter_id: "CH05",
    subject_id: "npc_kim_ara",
    chapter_default_key: "bg_pangyo_interchange"
  }),
  entry("portrait_ryu_seon", "portrait", "character-25", "Half-body portrait of Ryu Seon, upper-tier Korean survivor leader, elegant, cold, controlled", {
    chapter_id: "CH03",
    subject_id: "npc_ryu_seon",
    chapter_default_key: "bg_jamsil_lobby"
  }),
  entry("portrait_seo_jinseo", "portrait", "character-25", "Half-body portrait of Seo Jinseo, Korean pier owner and water scavenger, blunt and survival-first", {
    chapter_id: "CH02",
    subject_id: "npc_seo_jinseo",
    chapter_default_key: "bg_noryangjin_market"
  }),
  entry("portrait_yoon_haein", "portrait", "npc-main-pro", "Main NPC portrait of Yoon Haein, Korean radio operator, tense, relentless, premium key art", {
    chapter_id: "CH01",
    subject_id: "npc_yoon_haein",
    chapter_default_key: "bg_yeouido_ashroad"
  }),

  entry("boss_cheongeum", "boss", "character-25", "Boss key art of Cheongeum, giant sluice spore sac fused with floodgate machinery", {
    chapter_id: "CH02",
    subject_id: "sluice_sac_cheongeum",
    chapter_default_key: "bg_noryangjin_market"
  }),
  entry("boss_editing_aberration", "boss", "character-25", "Boss key art of the Editing Aberration, newsroom staff and camera rails fused into one mutant", {
    chapter_id: "CH01",
    subject_id: "editing_aberration",
    chapter_default_key: "bg_yeouido_ashroad"
  }),
  entry("boss_glassgarden", "boss", "character-25", "Boss key art of the Glassgarden amalgam, rooftop greenhouse, cables, shattered glass, vertical horror", {
    chapter_id: "CH03",
    subject_id: "vista_amalgam_glassgarden",
    chapter_default_key: "bg_jamsil_lobby"
  }),
  entry("boss_mirror_lines", "boss", "character-25", "Boss key art of the Mirror Core Lines, disaster bunker alarms, cooling fans, low-frequency monstrosity", {
    chapter_id: "CH05",
    subject_id: "mirror_core_lines",
    chapter_default_key: "bg_pangyo_interchange"
  }),
  entry("boss_picker_prime", "boss", "character-25", "Boss key art of Picker Prime, conveyor-line logistics horror with grabbing sorting arms", {
    chapter_id: "CH04",
    subject_id: "picker_prime",
    chapter_default_key: "bg_tancheon_embankment"
  })
];

export const PART1_RUNTIME_IMAGE_MATRIX: ImageMatrixEntry[] = [
  entry("briefing_p1_ch01", "background", "nanobanana", "Chapter 1 briefing still, ruined Yeouido broadcast district at dawn, grounded Korean disaster realism", {
    chapter_id: "CH01",
    chapter_default_key: "bg_yeouido_ashroad"
  }),
  entry("briefing_p1_ch02", "background", "nanobanana", "Chapter 2 briefing still, flooded Noryangjin corridor with market pressure and dim red lamps", {
    chapter_id: "CH02",
    chapter_default_key: "bg_noryangjin_market"
  }),
  entry("briefing_p1_ch03", "background", "nanobanana", "Chapter 3 briefing still, cold Jamsil tower interior and fractured glass skybridge", {
    chapter_id: "CH03",
    chapter_default_key: "bg_jamsil_lobby"
  }),
  entry("briefing_p1_ch04", "background", "nanobanana", "Chapter 4 briefing still, logistics belt with medicine crates, warning strobes and dead conveyors", {
    chapter_id: "CH04",
    chapter_default_key: "bg_tancheon_embankment"
  }),
  entry("briefing_p1_ch05", "background", "nanobanana", "Chapter 5 briefing still, Pangyo mirror center entrance with sealed gates and cold blue security light", {
    chapter_id: "CH05",
    chapter_default_key: "bg_pangyo_interchange"
  }),
  entry("map_p1_ch01", "background", "nanobanana", "Hero map background for Chapter 1, Yeouido ash roads and broadcast tower silhouette", {
    chapter_id: "CH01",
    chapter_default_key: "bg_yeouido_ashroad"
  }),
  entry("map_p1_ch02", "background", "nanobanana", "Hero map background for Chapter 2, flooded Noryangjin market with black water paths", {
    chapter_id: "CH02",
    chapter_default_key: "bg_noryangjin_market"
  }),
  entry("map_p1_ch03", "background", "nanobanana", "Hero map background for Chapter 3, layered high-rise floors and exposed skybridge void", {
    chapter_id: "CH03",
    chapter_default_key: "bg_jamsil_showroom"
  }),
  entry("map_p1_ch04", "background", "nanobanana", "Hero map background for Chapter 4, logistics embankment and industrial delivery tunnel access", {
    chapter_id: "CH04",
    chapter_default_key: "bg_tancheon_embankment"
  }),
  entry("map_p1_ch05", "background", "nanobanana", "Hero map background for Chapter 5, Pangyo mirror-center interchange with sealed access lanes", {
    chapter_id: "CH05",
    chapter_default_key: "bg_pangyo_interchange"
  }),
  entry("result_p1_ch01", "background", "nanobanana", "Chapter 1 result card art, rooftop signal aftermath above a ruined Korean broadcast district", {
    chapter_id: "CH01",
    chapter_default_key: "bg_rooftop_signal"
  }),
  entry("result_p1_ch02", "background", "nanobanana", "Chapter 2 result card art, drenched drainage route and improvised evac line at the pier", {
    chapter_id: "CH02",
    chapter_default_key: "bg_dongjak_culvert"
  }),
  entry("result_p1_ch03", "background", "nanobanana", "Chapter 3 result card art, survivors crossing a rooftop escape with glass shards and cold dawn", {
    chapter_id: "CH03",
    chapter_default_key: "bg_rooftop_escape"
  }),
  entry("result_p1_ch04", "background", "nanobanana", "Chapter 4 result card art, medicine convoy path through dead sorting infrastructure", {
    chapter_id: "CH04",
    chapter_default_key: "bg_delivery_tunnel"
  }),
  entry("result_p1_ch05", "background", "nanobanana", "Chapter 5 result card art, mirror-center exit with the southern road opening ahead", {
    chapter_id: "CH05",
    chapter_default_key: "bg_arkp_exit"
  }),
  entry("ending_p1_signal_keepers", "background", "nanobanana", "Part 1 ending art, survivors preserving signal archives and leaving under a pale hopeful dawn", {
    chapter_id: "CH05",
    chapter_default_key: "bg_arkp_exit"
  }),
  entry("ending_p1_controlled_passage", "background", "nanobanana", "Part 1 ending art, controlled checkpoint opening while sealed records remain guarded", {
    chapter_id: "CH05",
    chapter_default_key: "bg_pangyo_lobby"
  }),
  entry("ending_p1_smuggler_tide", "background", "nanobanana", "Part 1 ending art, forged passage over black water with a morally compromised escape team", {
    chapter_id: "CH05",
    chapter_default_key: "bg_dongjak_culvert"
  }),
  entry("ending_p1_ashen_escape", "background", "nanobanana", "Part 1 ending art, ash-blown evac road and burned evidence drifting through gray light", {
    chapter_id: "CH05",
    chapter_default_key: "bg_arkp_exit"
  }),
  entry("ending_p1_mirror_witness", "background", "nanobanana", "Part 1 ending art, hidden evidence and bypassed mirror relay behind the departing team", {
    chapter_id: "CH05",
    chapter_default_key: "bg_arkp_serverhall"
  }),
  entry("ending_thumb_p1_signal_keepers", "document", "asset-nano", "Gallery thumbnail card for Signal Keepers ending", {
    chapter_id: "CH05",
    chapter_default_key: "ending_p1_signal_keepers"
  }),
  entry("ending_thumb_p1_controlled_passage", "document", "asset-nano", "Gallery thumbnail card for Controlled Passage ending", {
    chapter_id: "CH05",
    chapter_default_key: "ending_p1_controlled_passage"
  }),
  entry("ending_thumb_p1_smuggler_tide", "document", "asset-nano", "Gallery thumbnail card for Smuggler Tide ending", {
    chapter_id: "CH05",
    chapter_default_key: "ending_p1_smuggler_tide"
  }),
  entry("ending_thumb_p1_ashen_escape", "document", "asset-nano", "Gallery thumbnail card for Ashen Escape ending", {
    chapter_id: "CH05",
    chapter_default_key: "ending_p1_ashen_escape"
  }),
  entry("ending_thumb_p1_mirror_witness", "document", "asset-nano", "Gallery thumbnail card for Mirror Witness ending", {
    chapter_id: "CH05",
    chapter_default_key: "ending_p1_mirror_witness"
  })
];

export const SUPPLEMENTAL_DOCUMENT_IMAGE_MATRIX: ImageMatrixEntry[] = [
  entry("doc_broadcast_emergency_roster", "document", "asset-nano", "Flat document card for a broadcast station emergency roster, Korean paperwork UI", {
    chapter_id: "CH01",
    source: "doc-only",
    subject_id: "itm_broadcast_log"
  }),
  entry("doc_baek_dohyeong_trade_sheet", "document", "asset-nano", "Flat evidence card showing Baek Dohyeong smuggling trade records and forged passes", {
    chapter_id: "CH02",
    source: "doc-only",
    subject_id: "text_only_baek_dohyeong_trade_sheet"
  }),
  entry("doc_cha_munsik_log", "document", "asset-nano", "Flat classified log card for Cha Munsik, disaster control directives and 18Hz notes", {
    chapter_id: "CH05",
    source: "doc-only",
    subject_id: "text_only_cha_munsik_log"
  }),
  entry("doc_internal_admin_id", "document", "asset-nano", "Flat admin badge card for Pangyo internal network administrator credentials", {
    chapter_id: "CH05",
    source: "doc-only",
    subject_id: "text_only_internal_admin_id"
  }),
  entry("doc_military_quarantine_sticker", "document", "asset-nano", "Flat military quarantine sticker asset card with hazard markings and Korean text", {
    chapter_id: "CH02",
    source: "doc-only",
    subject_id: "itm_counterfeit_quarantine_pass"
  }),
  entry("doc_pangyo_admin_protocol", "document", "asset-nano", "Flat protocol sheet for Pangyo ARK-P access rules and emergency classification", {
    chapter_id: "CH05",
    source: "doc-only",
    subject_id: "itm_arkp_access_key"
  })
];

export const CONTENT_IMAGE_GENERATION_MATRIX: ImageMatrixEntry[] = [
  ...CORE_IMAGE_GENERATION_MATRIX,
  ...PART1_RUNTIME_IMAGE_MATRIX,
  ...SUPPLEMENTAL_DOCUMENT_IMAGE_MATRIX
];

export function listCoreImageGenerationJobs(): AssetGenerationJob[] {
  return [...CORE_IMAGE_GENERATION_MATRIX, ...PART1_RUNTIME_IMAGE_MATRIX].map((entryItem) => ({
    key: entryItem.key,
    group: entryItem.group,
    route: entryItem.route,
    prompt_hint: entryItem.prompt_hint
  }));
}

export function listSupplementalImageGenerationJobs(): AssetGenerationJob[] {
  return SUPPLEMENTAL_DOCUMENT_IMAGE_MATRIX.map((entryItem) => ({
    key: entryItem.key,
    group: entryItem.group,
    route: entryItem.route,
    prompt_hint: entryItem.prompt_hint
  }));
}

export function findImageMatrixEntry(key: string): ImageMatrixEntry | undefined {
  return CONTENT_IMAGE_GENERATION_MATRIX.find((entryItem) => entryItem.key === key);
}


