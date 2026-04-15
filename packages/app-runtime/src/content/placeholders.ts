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
    display_name: "?쒖삁吏",
    source_path: "private/story/concept_arc_01_05/CHAPTER_01_?용튆_媛쒖옣.md",
    summary: "CH01 ?몄쭛?ㅼ뿉 怨좊┰??蹂댁“ ?묎? ?앹〈??",
    body: [
      "?먮룞 ?≪텧留?硫덉텛硫??앸궇 以??뚯븯吏留? ?뚮━媛 爰쇱졇??媛먯뿼泥대뒗 硫덉텛吏 ?딆븯?ㅻ뒗 利앹뼵???④릿??",
      "援ъ“ ??湲곕줉援??몄썝 利앷?? ?꾩냽 ????뺤옣???대떦?섎뒗 ?몃Ъ濡??댁꽍?섎뒗 ?몄씠 臾몄꽌 ?ㅺ낵 留욌떎."
    ],
    related_ids: ["EV_CH01_WRITER_RESCUE", "portrait_yoon_haein"],
    suggested_art_key: "npc_support_writer"
  },
  text_only_oh_taesik: {
    id: "text_only_oh_taesik",
    kind: "npc",
    display_name: "?ㅽ깭??,
    source_path: "private/story/concept_arc_01_05/CHAPTER_01_?용튆_媛쒖옣.md",
    summary: "湲곕줉援?쓽 ?몄옣 寃쎈퉬濡?CH01 釉뚮━???ㅼ쓣 蹂닿컯?섎뒗 ?띿뒪???꾩슜 ?몃Ъ.",
    body: [
      "泥??꾨Т硫?紐?二쇱슫 嫄?踰꾨┛ 嫄곌퀬, 紐??뚯븘??嫄?二쎌? 嫄곕씪???앹쓽 ?됲샊???꾩옣 洹쒖쑉???곸쭠?쒕떎.",
      "?꾩옱 runtime?먮뒗 吏곸젒 ?깆옣?섏? ?딆쑝誘濡?釉뚮━??濡쒓렇???쇰뵒??硫섑듃??移대뱶 ?뺣룄濡쒕쭔 ?곕뒗 寃??덉쟾?섎떎."
    ],
    related_ids: ["CH01", "YD-01"],
    suggested_art_key: "portrait_yoon_haein"
  },
  text_only_choi_mugyeol: {
    id: "text_only_choi_mugyeol",
    kind: "npc",
    display_name: "理쒕Т寃?,
    source_path: "private/story/concept_arc_01_05/NPC_BIBLE_01_05.md",
    summary: "泥좊룄/諛곗닔臾??꾨젰 ?ㅻ퉬 蹂듦뎄瑜?留〓뒗 ?꾩옣???몃Ъ.",
    body: [
      "臾몄꽌??泥??깆옣? Chapter 2 ?꾨컲?대ŉ, Chapter 4 ?섏꽌 泥좊룄??遺꾧린? ?뱁엳 ??留욌뒗??",
      "吏湲?踰붿쐞?먯꽌??臾댁쟾, ?꾩옣 硫붾え, ?꾩냽 ?⑸쪟 ?덇퀬 移대뱶濡?泥섎━?섎뒗 ?몄씠 ?꾩옱 JSON 援ъ“? 異⑸룎???녿떎."
    ],
    related_ids: ["CH02", "CH04", "MJ-04"],
    suggested_art_key: "bg_rail_transfer"
  },
  text_only_cha_munsik: {
    id: "text_only_cha_munsik",
    kind: "npc",
    display_name: "李⑤Ц??,
    source_path: "private/story/concept_arc_01_05/NPC_BIBLE_01_05.md",
    summary: "?숈썝 ?명봽???붾떦 ?듭떖?쇰줈 ?붿떆?섎뒗 ?κ린 鍮뚮윴.",
    body: [
      "Chapter 5 ?쒖젏?먯꽌???쇨뎬 ?녿뒗 吏?쒖옄?대ŉ, 濡쒓렇? ?뚯꽦留뚯쑝濡??⑸━二쇱쓽???뷀샊?⑥쓣 ?쒕윭?몃떎.",
      "吏곸젒 罹먮┃??移대뱶蹂대떎 濡쒓렇 臾띠쓬怨?愿由ъ옄 ?뚯꽦 ?뚰렪?쇰줈 ?좎??섎뒗 履쎌씠 ?꾩옱 ?꾪겕 ?꾩꽦?꾩? 留욌떎."
    ],
    related_ids: ["CH05", "text_only_cha_munsik_log"],
    suggested_art_key: "bg_arkp_serverhall"
  },
  text_only_cha_munsik_log: {
    id: "text_only_cha_munsik_log",
    kind: "doc",
    display_name: "李⑤Ц??濡쒓렇",
    source_path: "private/story/concept_arc_01_05/CHAPTER_05_誘몃윭?쇳꽣.md",
    summary: "?좊퀎怨?援곗쭛 ?좊룄瑜?鍮꾩슜 ?⑥쑉濡?留먰븯??愿由?濡쒓렇.",
    body: [
      "?좊룄 ?깃났. 援곗쭛? 寃쎈낫 二쇳뙆??18Hz ???뿉??媛???덉젙?곸씠?쇰뒗 臾몄옣???듭떖 臾멸뎄濡??쇰뒗??",
      "??쇰뒗 鍮꾪슚?⑥쟻?대ŉ ?좊퀎? 鍮꾩슜 ?鍮??④낵媛 ?믩떎??湲곕줉???꾩냽 ?ㅻ━ 媛덈벑??異쒕컻?먯씠??"
    ],
    related_ids: ["CH05", "mirror_core_lines"],
    suggested_art_key: "bg_arkp_serverhall"
  },
  text_only_ambusher: {
    id: "text_only_ambusher",
    kind: "enemy",
    display_name: "留ㅻ났泥?,
    source_path: "private/story/concept_arc_01_05/INFECTED_BIBLE_01_05.md",
    summary: "踰쎄낵 泥쒖옣??遺李⑸맂 梨??먯?瑜??쇳븯??媛먯뿼泥??꾪궎???",
    body: [
      "?붽낵 媛덈퉬媛 鍮꾩젙?곸쟻?쇰줈 踰뚯뼱??援ъ“臾쇱뿉 嫄몄퀜 ?덇퀬, ?대몺 ?띿뿉?쒕뒗 ?뽰? ?⑥냼由щ쭔 癒쇱? ?ㅻ┛??",
      "?꾩옱 runtime enemy registry?먮뒗 ?낅┰ ?뷀듃由ш? ?놁쑝誘濡? 泥쒖옣 寃쎄퀬 ?곗텧怨?choice 由ъ뒪???ㅻ챸 ?띿뒪?몃줈 ?곗꽑 ?뚮퉬?섎뒗 ?몄씠 ?덉쟾?섎떎."
    ],
    related_ids: ["CH01", "CH03", "CH05"],
    suggested_art_key: "bg_service_stair"
  },
  text_only_baek_dohyeong_trade_sheet: {
    id: "text_only_baek_dohyeong_trade_sheet",
    kind: "doc",
    display_name: "諛깅룄??嫄곕옒 紐⑸줉",
    source_path: "private/story/concept_arc_01_05/CHAPTER_02_寃?_?섎줈.md",
    summary: "?꾩“ 寃???⑥뒪? ?щ엺 ?대룞 寃쎈줈瑜?臾띠뼱 ??嫄곕옒 利앷굅.",
    body: [
      "?붿떆??泥쒕쭑珥뚭낵 ?숈썝???좏넻留앹쓣 ?곌껐?섎뒗 醫낆씠 利앷굅臾쇰줈, ?댄썑 諛깅룄?뺤쓣 已볥뒗 ?듭떖 ?ㅻ쭏由щ줈 ?????덈떎.",
      "?꾩옱 runtime item? ?꾩“ 寃???⑥뒪 ?섎굹肉먯씠?? ??臾몄꽌??蹂꾨룄 移대뱶 ?먮뒗 lore ?⑤꼸 placeholder媛 ?곸젅?섎떎."
    ],
    related_ids: ["npc_baek_dohyeong", "itm_counterfeit_quarantine_pass"],
    suggested_art_key: "portrait_jung_noah"
  },
  text_only_internal_admin_id: {
    id: "text_only_internal_admin_id",
    kind: "doc",
    display_name: "?대?留?愿由ъ옄 ID",
    source_path: "private/story/concept_arc_01_05/CHAPTER_05_誘몃윭?쇳꽣.md",
    summary: "ARK-P ?대?留?愿由ъ옄 沅뚰븳 議곌컖???섑??대뒗 ?ш? 臾몄꽌??蹂댁긽.",
    body: [
      "濡쒕퉬?숈씠???쒕쾭? ?ш? 猷⑦똿?쇰줈 諛곗튂?섎㈃ ?대?留?濡쒓렇, 異붽? ?⑤꼸 ?댁젣, 鍮꾧났媛?愿由ъ옄 湲곕줉 ?묎렐怨??먯뿰?ㅻ읇寃??댁뼱吏꾨떎.",
      "?꾩옱 runtime quest item?먮뒗 ?놁쑝誘濡? ?꾩냽 猷⑦똿 ?뺤옣 ?꾧퉴吏??臾몄꽌 移대뱶 placeholder濡??좎??섎뒗 ?몄씠 ?덉쟾?섎떎."
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

