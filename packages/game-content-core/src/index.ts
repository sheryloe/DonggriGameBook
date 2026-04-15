import type { AppId, PartId } from "@donggrol/world-registry";

export interface PartContentBundle {
  part_id: PartId;
  app_id: AppId;
  status: "implemented" | "planned";
  primary_manifest_path?: string;
  docs: string[];
  note: string;
}

export const PART_CONTENT_BUNDLES: Record<PartId, PartContentBundle> = {
  P1: {
    part_id: "P1",
    app_id: "donggrolgamebook-p1",
    status: "implemented",
    primary_manifest_path: "private/content/package_manifest.json",
    docs: [
      "private/story/concept_arc_01_05/README_ARC_01_05.md",
      "private/story/concept_arc_01_05/MASTER_PACK_01_05.md"
    ],
    note: "CH01~CH05 runtime JSON怨?臾몄꽌媛 ?꾩옱 ??μ냼??議댁옱?쒕떎."
  },
  P2: {
    part_id: "P2",
    app_id: "donggrolgamebook-p2",
    status: "implemented",
    primary_manifest_path: "private/content/package_manifest.json",
    docs: [
      "private/story/world/part-02-world-expansion.md",
      "private/story/world/chapter-synopsis-ch06-ch20.md"
    ],
    note: "CH06~CH10? ?멸퀎愿/?쒕냹?쒖뒪 臾몄꽌瑜?癒쇱? ?뺤젙????JSON?쇰줈 ?대┛??"
  },
  P3: {
    part_id: "P3",
    app_id: "donggrolgamebook-p3",
    status: "implemented",
    primary_manifest_path: "private/content/package_manifest.json",
    docs: [
      "private/story/world/part-03-world-expansion.md",
      "private/story/world/chapter-synopsis-ch06-ch20.md"
    ],
    note: "CH11~CH15???숉빐 ?묎렐?좉낵 ?명빐 ?꾩큹 洹쒖튃??癒쇱? ?뺥븳??"
  },
  P4: {
    part_id: "P4",
    app_id: "donggrolgamebook-p4",
    status: "implemented",
    primary_manifest_path: "private/content/package_manifest.json",
    docs: [
      "private/story/world/part-04-world-expansion.md",
      "private/story/world/chapter-synopsis-ch06-ch20.md"
    ],
    note: "CH16~CH20? ?낅룄 吏꾩엯 猷⑦듃? 理쒖쥌 ?앹〈 洹쒖튃??以묒떖?쇰줈 ?ㅺ퀎?쒕떎."
  }
};


