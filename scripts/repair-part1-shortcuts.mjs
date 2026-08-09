#!/usr/bin/env node
/**
 * Let the player decide how much of a chapter to walk.
 *
 * CH03's main route is twenty-six events in a straight line: every choice leads
 * to one outcome which leads to one next event, all the way to the boss. There
 * is no way past any of it. The other forty-five events in the chapter are
 * alternatives inside that corridor, not detours off it — so a player cannot
 * trade coverage for time, which is the decision a survival game with deadlines
 * is supposed to be about. CH04 and CH05 have the same shape, shorter.
 *
 * These add a way forward that skips a segment. Nothing is deleted: the skipped
 * events stay exactly where they are for the player who wants them. What changes
 * is that going through them becomes a choice, and the deadline finally has
 * something to press against.
 *
 * The cost of skipping is the segment's own rewards, which the player simply
 * never collects — that is already the strongest possible cost, so the choices
 * themselves only charge what rushing actually costs.
 *
 * Usage:
 *   node scripts/repair-part1-shortcuts.mjs
 *   node scripts/repair-part1-shortcuts.mjs --apply --confirm-part1-shortcuts
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHAPTER_DIR = join(ROOT, "private", "content", "data", "chapters");
const P1 = ["ch01", "ch02", "ch03", "ch04", "ch05"];
const BACKUP_DIR = join(
  "G:", "Donggri_DevDrive", "storage", "codex-control", "reports", "DonggrolGameBook",
  "2026-08-09", "part1-shortcuts", "backup",
);

const SHORTCUTS = [
  // --- CH03: a twenty-six event corridor ------------------------------------
  {
    from: "EV_CH03_BASEMENT_MEET", to: "EV_CH03_SERVICE_SPIRAL",
    choice_id: "ch03_skip_basement",
    label: "지하 물자는 두고 곧장 서비스로로 오른다",
    intent_tags: ["포기", "거리 확보", "판단"],
    effects: [{ op: "add_stat", target: "route.strain", value: 1 }],
  },
  {
    from: "EV_CH03_SERVICE_SPIRAL", to: "EV_CH03_UPPER_NEGOTIATION",
    choice_id: "ch03_skip_blackout",
    label: "정전 구역을 지나치고 상층부터 만난다",
    intent_tags: ["포기", "협상", "우회"],
    effects: [{ op: "add_stat", target: "noise", value: 2 }],
  },
  {
    from: "EV_CH03_UPPER_NEGOTIATION", to: "EV_CH03_SKYBRIDGE_ACCESS",
    choice_id: "ch03_skip_upper_supply",
    label: "상층 보급을 미루고 연결교로 향한다",
    intent_tags: ["포기", "철수", "판단"],
    effects: [{ op: "add_stat", target: "route.strain", value: 1 }],
  },
  {
    from: "EV_CH03_SKYBRIDGE_ACCESS", to: "EV_CH03_GLASS_PREP",
    choice_id: "ch03_skip_skybridge_wind",
    label: "바람이 잦아들기를 기다리지 않고 건넌다",
    intent_tags: ["강행", "노출", "거리 확보"],
    effects: [
      { op: "add_stat", target: "injury", value: 2 },
      { op: "add_stat", target: "route.strain", value: 1 },
    ],
  },
  {
    from: "EV_CH03_GLASS_PREP", to: "EV_CH03_GARDEN_APPROACH",
    choice_id: "ch03_skip_armory",
    label: "무기고를 열지 않고 정원으로 붙는다",
    intent_tags: ["포기", "강행", "판단"],
    effects: [{ op: "add_stat", target: "route.strain", value: 1 }],
  },

  // --- CH04 -----------------------------------------------------------------
  {
    from: "EV_CH04_ROUTE_SELECTION", to: "EV_CH04_LINE_DECISION",
    choice_id: "ch04_skip_rail",
    label: "철도 인계장을 건너뛰고 분류선으로 간다",
    intent_tags: ["포기", "우회", "판단"],
    effects: [
      { op: "add_stat", target: "route.strain", value: 2 },
      { op: "add_stat", target: "noise", value: 2 },
    ],
  },
  {
    from: "EV_CH04_LINE_DECISION", to: "EV_CH04_BOSS_PICKER",
    choice_id: "ch04_skip_tunnel_cache",
    label: "터널 보관함을 지나쳐 메인홀로 들어간다",
    intent_tags: ["포기", "강행", "철수"],
    effects: [{ op: "add_stat", target: "route.strain", value: 2 }],
  },

  // --- CH05 -----------------------------------------------------------------
  {
    // Skipping here means never meeting 김아라, and the witness ending needs her
    // alive. The cost of this shortcut is an entire ending.
    from: "EV_CH05_LOBBY_MAPPING", to: "EV_CH05_ARC_RELAY",
    choice_id: "ch05_skip_lobby",
    label: "로비 수색을 접고 중계실로 직행한다",
    intent_tags: ["포기", "강행", "철수"],
    effects: [
      { op: "add_stat", target: "route.strain", value: 3 },
      { op: "add_stat", target: "noise", value: 2 },
    ],
  },
  {
    from: "EV_CH05_DATA_ACCESS", to: "EV_CH05_BOSS_LINES",
    choice_id: "ch05_skip_core_prep",
    label: "코어 채비 없이 회선 앞에 선다",
    intent_tags: ["강행", "노출", "판단"],
    effects: [
      { op: "add_stat", target: "route.strain", value: 3 },
      { op: "add_stat", target: "injury", value: 2 },
    ],
  },
];

const apply = process.argv.includes("--apply");
const confirmed = process.argv.includes("--confirm-part1-shortcuts");

const byFrom = new Map();
for (const s of SHORTCUTS) {
  if (!byFrom.has(s.from)) byFrom.set(s.from, []);
  byFrom.get(s.from).push(s);
}

let added = 0;
let already = 0;
const problems = [];

for (const id of P1) {
  const path = join(CHAPTER_DIR, `${id}.json`);
  const chapter = JSON.parse(readFileSync(path, "utf8"));
  const ids = new Set(chapter.events.map((e) => e.event_id));
  let touched = 0;

  for (const event of chapter.events) {
    for (const shortcut of byFrom.get(event.event_id) ?? []) {
      if (!ids.has(shortcut.to)) { problems.push(`${shortcut.from} → ${shortcut.to} 대상이 없다`); continue; }
      if ((event.choices ?? []).some((c) => c.choice_id === shortcut.choice_id)) { already += 1; continue; }

      event.choices = [...(event.choices ?? []), {
        choice_id: shortcut.choice_id,
        label: shortcut.label,
        conditions: [],
        preview: "",
        effects: shortcut.effects,
        next_event_id: shortcut.to,
        intent_tags: shortcut.intent_tags,
        gain_label: "",
        cost_label: "",
        risk_label: "",
      }];
      console.log(`  ${chapter.chapter_id}  ${shortcut.from.padEnd(30)} → ${shortcut.to}`);
      added += 1;
      touched += 1;
    }
  }

  if (apply && confirmed && touched) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const backup = join(BACKUP_DIR, `${id}.json`);
    if (!existsSync(backup)) copyFileSync(path, backup);
    writeFileSync(path, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
  }
}

console.log(`\n지름길 ${added}개 추가, 이미 있음 ${already}개`);
for (const p of problems) console.log(`  문제: ${p}`);

if (apply && confirmed) console.log(`적용 완료. 백업: ${BACKUP_DIR}`);
else if (apply) { console.log("--confirm-part1-shortcuts 없이는 쓰지 않는다."); process.exitCode = 1; }
else console.log("계획만 출력했다. 적용하려면 --apply --confirm-part1-shortcuts");
