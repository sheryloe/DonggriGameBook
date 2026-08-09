#!/usr/bin/env node
/**
 * Put the two registered-but-absent NPCs on screen.
 *
 * 오태식 and 한예지 are in `npc.registry.json` with roles, tones and sample
 * lines, and neither appears in any of the twenty chapters. Meanwhile CH01's
 * briefing has 윤해인 doing all three jobs herself: reading the signal, handing
 * out the kit, and asking the question that frames the chapter's first choice.
 *
 * Their registered roles are exactly the two she should not be doing —
 * 오태식 is the hub's recovery lead and 한예지 its records assistant and
 * contact — so this splits the briefing three ways rather than inventing a
 * reason for them to be there. 오태식 speaks in procedure and paperwork,
 * 한예지 in questions, which is what their tone keywords say.
 *
 * Usage:
 *   node scripts/repair-part1-hub-cast.mjs
 *   node scripts/repair-part1-hub-cast.mjs --apply --confirm-part1-hub-cast
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER = join(ROOT, "private", "content", "data", "chapters", "ch01.json");
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-hub-cast", "backup",
);

const TARGET_EVENT = "EV_CH01_BRIEFING";
const HUB_NODE = "YD-01";

/** Inserted after 윤해인's line, before the system block that closes the scene. */
const BLOCKS = [
  {
    block_id: "EV_CH01_BRIEFING_hub_oh_taesik",
    kind: "dialogue",
    speaker_id: "npc_oh_taesik",
    speaker_label: "오태식",
    lines: [
      "장비는 여섯 점. 수령표에 손도장부터 찍고 나가라.",
      "가져간 건 전부 적힌다. 두고 온 것도 적힌다.",
    ],
    emphasis: "회수 책임자는 사람보다 목록을 먼저 센다",
  },
  {
    block_id: "EV_CH01_BRIEFING_hub_han_yeji",
    kind: "dialogue",
    speaker_id: "npc_han_yeji",
    speaker_label: "한예지",
    lines: [
      "저기… 안에서 둘 다는 못 데려온다는 거죠?",
      "그럼 뭘 먼저 부를지, 지금 정해 두는 게 낫지 않아요?",
    ],
    emphasis: "연락책은 답 대신 질문을 남긴다",
  },
];

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-hub-cast");

const chapter = JSON.parse(readFileSync(CHAPTER, "utf8"));
const event = chapter.events.find((e) => e.event_id === TARGET_EVENT);
const node = chapter.nodes.find((n) => n.node_id === HUB_NODE);
if (!event || !node) throw new Error("CH01 briefing 또는 허브 노드를 찾지 못했다");

const existing = new Set((event.text?.scene_blocks ?? []).map((b) => b.block_id));
const adding = BLOCKS.filter((b) => !existing.has(b.block_id));

if (adding.length) {
  const blocks = event.text.scene_blocks ?? [];
  // Before the closing system note, which is the scene's last beat.
  const systemAt = blocks.findIndex((b) => b.kind === "system");
  const at = systemAt === -1 ? blocks.length : systemAt;
  if (apply && confirmed) event.text.scene_blocks = [...blocks.slice(0, at), ...adding, ...blocks.slice(at)];
}

const ids = ["npc_oh_taesik", "npc_han_yeji"];
const addedToEvent = ids.filter((id) => !(event.npc_ids ?? []).includes(id));
const addedToNode = ids.filter((id) => !(node.npc_ids ?? []).includes(id));
if (apply && confirmed) {
  event.npc_ids = [...(event.npc_ids ?? []), ...addedToEvent];
  node.npc_ids = [...(node.npc_ids ?? []), ...addedToNode];
}

for (const b of adding) console.log(`  대사 추가: ${b.speaker_label} — ${b.lines[0]}`);
console.log(`\n장면 블록 ${adding.length}개, 이벤트 npc_ids +${addedToEvent.length}, 노드 npc_ids +${addedToNode.length}`);

if (apply && confirmed) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = join(BACKUP_DIR, "ch01.json");
  if (!existsSync(backup)) copyFileSync(CHAPTER, backup);
  writeFileSync(CHAPTER, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
} else if (apply) {
  console.log("--confirm-part1-hub-cast 없이는 쓰지 않는다.");
  process.exitCode = 1;
} else {
  console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-hub-cast");
}
