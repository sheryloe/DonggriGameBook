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
    source_path: "private/story/concept_arc_01_05/CHAPTER_01_?용튆_媛쒖옣.md",
    headline: "CH01? ?λ퉬 ?뚯닔蹂대떎 湲곕줉/援먯떊 ?댁꽍 異뺤씠 以묒슂?섎떎",
    summary:
      "?⑦뙆 利앺룺湲??뚯닔肉??꾨땲??留덉?留??앸갑??吏곸쟾 湲곕줉, 鍮꾩긽 紐낅?, ?몃쫱-?낅룄 ?몄쬆 ?좏샇瑜??④퍡 ?쎈뒗 ?μ쑝濡??ㅺ퀎???덈떎.",
    runtime_links: ["itm_shortwave_amplifier", "itm_broadcast_log", "itm_news_opening_tape", "npc_yoon_haein"]
  },
  {
    id: "note_ch01_han_yeji_mapping",
    chapter_id: "CH01",
    subject_id: "npc_support_writer",
    source_path: "private/story/concept_arc_01_05/CHAPTER_01_?용튆_媛쒖옣.md",
    headline: "怨좊┰ ?앹〈???대쫫? ?쒖삁吏濡??뺣━?섎뒗 ?몄씠 留욌떎",
    summary:
      "runtime ?대깽?몃뒗 generic support writer留??몄텧?섏?留? 臾몄꽌??援ъ“ 媛?ν븳 ?앹〈?먮뒗 ?쒖삁吏?쇰뒗 怨좎쑀 ?대쫫??媛吏꾨떎.",
    runtime_links: ["EV_CH01_WRITER_RESCUE", "npc_support_writer"],
    risk: "濡쒕뜑媛 ?꾩쭅 ??蹂꾩묶??pack.content_aliases濡?二쇱엯?섏? ?딆쑝硫?UI ?쒖떆紐낆? 湲곗〈 generic ?쒗쁽??癒몃Ц??"
  },
  {
    id: "note_ch02_gate_choice_consequence",
    chapter_id: "CH02",
    subject_id: "CH02",
    source_path: "private/story/concept_arc_01_05/CHAPTER_02_寃?_?섎줈.md",
    headline: "CH02???듭떖 遺꾧린??諛곗닔臾?媛쒗룓? 洹??諛⑹떇?대떎",
    summary:
      "諛곗닔臾?媛쒕갑? 鍮좊Ⅸ 吏꾩엯 猷⑦듃瑜? ?먯뇙???앹〈??蹂댄샇? ?덉쟾???고쉶瑜??섎??섎ŉ ?쒖쭊???뺣끂??愿怨꾩뿉???ы뙆媛 ?⑤뒗??",
    runtime_links: ["flag:ch02_gate_opened", "flag:ch02_gate_closed", "route.current", "npc_jung_noah", "npc_seo_jinseo"]
  },
  {
    id: "note_ch02_baek_dohyeong_evidence",
    chapter_id: "CH02",
    subject_id: "npc_baek_dohyeong",
    source_path: "private/story/concept_arc_01_05/CHAPTER_02_寃?_?섎줈.md",
    headline: "諛깅룄?뺤? ?꾩“ ?⑥뒪留뚯씠 ?꾨땲??嫄곕옒 紐⑸줉源뚯? ?④꺼?????ㅻ뱷???덈떎",
    summary:
      "臾몄꽌?먮뒗 諛깅룄??嫄곕옒 紐⑸줉, ?꾩“ ?꾩옣, ?붿떆???λ? 議곌컖 媛숈? 利앷굅 ?먮쫫???덈떎. ?꾩옱 runtime? ?꾩“ 寃???⑥뒪 ???μ쑝濡?異뺤빟???덈떎.",
    runtime_links: ["itm_counterfeit_quarantine_pass", "text_only_baek_dohyeong_trade_sheet"],
    risk: "?꾩냽 ?곗씠??蹂닿컯 ?꾧퉴吏???쒖궗 利앷굅 諛?꾧? ??븘 蹂댁씪 ???덈떎."
  },
  {
    id: "note_ch03_brand_risk_fictionalized",
    chapter_id: "CH03",
    subject_id: "CH03",
    source_path: "private/story/concept_arc_01_05/README_ARC_01_05.md",
    headline: "?좎떎 怨좎링沅뚯? ?ㅼ옱 釉뚮옖?????罹먯뒳???덉??섏뒪濡??좎??댁빞 ?쒕떎",
    summary:
      "臾몄꽌 ?⑹? ?ㅼ옱 ?μ냼媛먯? ?좎??섎릺 怨좎쑀 釉뚮옖??諛?1:1 ?앸퀎 ?붿냼???쇳븯??諛⑺뼢??紐낆떆?쒕떎.",
    runtime_links: ["bg_jamsil_lobby", "bg_jamsil_showroom", "boss_glassgarden"]
  },
  {
    id: "note_ch03_vertical_fear",
    chapter_id: "CH03",
    subject_id: "vista_amalgam_glassgarden",
    source_path: "private/story/concept_arc_01_05/CHAPTER_03_?좊━?뺤썝.md",
    headline: "CH03??怨듯룷 異뺤? ?섑룊 ?꾪닾蹂대떎 ?섏쭅 遺뺢눼??,
    summary:
      "李쎄?泥? ?숉븯, ?ㅼ뭅?대툕由ъ? ?띿븬, ?≫뭾湲곗? 愿??諛몃툕瑜?議곗옉?섎뒗 怨듦컙 ?꾪닾媛 ?듭떖 ?ㅺ퀎濡??≫? ?덈떎.",
    runtime_links: ["windowling", "bg_skybridge", "bg_rooftop_escape", "boss_glassgarden"]
  },
  {
    id: "note_ch04_choi_mugyeol_hook",
    chapter_id: "CH04",
    subject_id: "text_only_choi_mugyeol",
    source_path: "private/story/concept_arc_01_05/CHAPTER_04_?곸옄?ㅼ쓽_?꾩떆.md",
    headline: "理쒕Т寃곗? CH04 ?섏꽌 泥좊룄??遺꾧린? 媛??媛뺥븯寃?寃고빀?쒕떎",
    summary:
      "臾몄꽌??理쒕Т寃곗? 泥좊룄/?꾨젰 蹂듦뎄??????몃Ъ?대씪 ?섏꽌 ?곌껐?좉낵 臾댁쟾 吏?? 臾쇰쪟??? 泥좊룄??遺꾧린?먯꽌 ?먯뿰?ㅻ읇??",
    runtime_links: ["MJ-04", "bg_rail_transfer", "route.current"],
    risk: "?꾩옱 runtime?먮뒗 ?ㅼ껜 NPC媛 ?놁쑝誘濡??⑸쪟 ?대깽?몃? ?쒕몮???ｊ린蹂대떎 ?쇰뵒???낆쑝濡?源붿븘 ?먮뒗 ?몄씠 ?덉쟾?섎떎."
  },
  {
    id: "note_ch04_hub_fate",
    chapter_id: "CH04",
    subject_id: "CH04",
    source_path: "private/story/concept_arc_01_05/CHAPTER_04_?곸옄?ㅼ쓽_?꾩떆.md",
    headline: "遺꾨쪟?쇳꽣???쇳쉶???섏쟾???꾨땲??諛섎났 ?뚮컢 ?덈툕 ?대챸??怨좊Ⅴ???μ씠??,
    summary:
      "?쇱씤 ?ш????щ?媛 ?댄썑 ?덈툕 媛移? ?뚯쓬, ?꾪닾 ?⑦꽩???④퍡 諛붽씀??寃껋씠 臾몄꽌???듭떖 ?ъ씤?몃떎.",
    runtime_links: ["boss_picker_prime", "bg_sorting_hall", "flag:ch04_line_restarted", "flag:ch04_line_shutdown"]
  },
  {
    id: "note_ch05_arkp_ethics",
    chapter_id: "CH05",
    subject_id: "CH05",
    source_path: "private/story/concept_arc_01_05/CHAPTER_05_誘몃윭?쇳꽣.md",
    headline: "CH05???뺣낫 ?띾뱷蹂대떎 ?좊퀎 泥닿퀎瑜??쒕윭?대뒗 ?ㅻ━ ?μ씠??,
    summary:
      "?낅룄 ?좏샇媛 吏꾩쭨?몄? ?뺤씤?섎뒗 ?숈떆?? 洹??덉쟾吏?媛 紐⑤몢???쇰궃泥섍? ?꾨땺 ???덈떎???먯쓣 ?쒕윭?대뒗 寃껋씠 蹂명렪 ?뚮쭏??",
    runtime_links: ["itm_southern_corridor_data", "itm_dokdo_signal_auth", "npc_kim_ara", "mirror_core_lines"]
  },
  {
    id: "note_ch05_kim_ara_priority",
    chapter_id: "CH05",
    subject_id: "npc_kim_ara",
    source_path: "private/story/concept_arc_01_05/CHAPTER_05_誘몃윭?쇳꽣.md",
    headline: "源?꾨씪 援ъ“ ?곗꽑 ?щ?媛 ?⑥닚 trust媛 ?꾨땲???댁꽍 ?쒖씠?꾩? ?⑤꼸 ?묎렐?먮룄 ?곌껐?쒕떎",
    summary:
      "臾몄꽌??源?꾨씪媛 ?꾪꽣/?듭젣???곌뎄? ?쒕쾭 ?⑤꼸 ?댁젣??湲곗뿬?섎뒗 ?몃Ъ濡??ㅺ퀎?섏뼱 ?덈떎.",
    runtime_links: ["EV_CH05_KIM_ARA", "itm_arkp_access_key", "portrait_kim_ara"]
  },
  {
    id: "note_ch05_cha_munsik_log_only",
    chapter_id: "CH05",
    subject_id: "text_only_cha_munsik_log",
    source_path: "private/story/concept_arc_01_05/NPC_BIBLE_01_05.md",
    headline: "李⑤Ц?앹? ???쒖젏?먯꽌 濡쒓렇/?뚯꽦留??좎??섎뒗 寃껋씠 留욌떎",
    summary:
      "?쇨뎬 ?녿뒗 ?κ린 鍮뚮윴?쇰줈 ?④꺼 ?먯뼱???꾩냽 ?꾪겕?먯꽌 ?듭젣 吏묒갑怨??ㅻ━ 怨듬갚?????ш쾶 ?쒕윭?????덈떎.",
    runtime_links: ["text_only_cha_munsik", "text_only_cha_munsik_log", "bg_arkp_serverhall"]
  }
];

export function listChapterNotes(chapterId: ChapterId): DocumentDrivenNote[] {
  return DOCUMENT_DRIVEN_NOTES.filter((note) => note.chapter_id === chapterId);
}

export function listSubjectNotes(subjectId: string): DocumentDrivenNote[] {
  return DOCUMENT_DRIVEN_NOTES.filter((note) => note.subject_id === subjectId);
}

