import type { AppId, PartId } from "../../world-registry/src";

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
    primary_manifest_path: "package_manifest.json",
    docs: [
      "docs/concept_arc_01_05_md/README_ARC_01_05.md",
      "docs/concept_arc_01_05_md/MASTER_PACK_01_05.md"
    ],
    note: "CH01~CH05 runtime JSON과 문서가 현재 저장소에 존재한다."
  },
  P2: {
    part_id: "P2",
    app_id: "donggrolgamebook-p2",
    status: "implemented",
    primary_manifest_path: "package_manifest.json",
    docs: [
      "docs/world/part-02-world-expansion.md",
      "docs/world/chapter-synopsis-ch06-ch20.md"
    ],
    note: "CH06~CH10은 세계관/시놉시스 문서를 먼저 확정한 뒤 JSON으로 내린다."
  },
  P3: {
    part_id: "P3",
    app_id: "donggrolgamebook-p3",
    status: "implemented",
    primary_manifest_path: "package_manifest.json",
    docs: [
      "docs/world/part-03-world-expansion.md",
      "docs/world/chapter-synopsis-ch06-ch20.md"
    ],
    note: "CH11~CH15는 동해 접근선과 외해 전초 규칙을 먼저 정한다."
  },
  P4: {
    part_id: "P4",
    app_id: "donggrolgamebook-p4",
    status: "implemented",
    primary_manifest_path: "package_manifest.json",
    docs: [
      "docs/world/part-04-world-expansion.md",
      "docs/world/chapter-synopsis-ch06-ch20.md"
    ],
    note: "CH16~CH20은 독도 진입 루트와 최종 생존 규칙을 중심으로 설계한다."
  }
};
