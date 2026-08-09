/**
 * Part 1 deadline fairness tests.
 *
 * An agent playthrough on 2026-08-08 lost the CH02 tide-scan quest while still in
 * CH01: deadlines were absolute clock hours, every choice costs at least an hour,
 * and CH01 alone holds 134 choices. A quest must never fail before its chapter
 * has been entered.
 *
 * These assert the rules directly against the shipped table so a future edit that
 * reintroduces an absolute clock fails here.
 */

import fs from "node:fs";
import path from "node:path";
import { readReach, MARGIN, MAX_SLACK } from "./audit-part1-deadline-reach.mjs";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "apps", "part1", "src", "utils", "survival.ts"), "utf8");

let pass = 0;
const failures = [];
function check(label, condition, detail) {
  if (condition) { pass += 1; return; }
  failures.push(detail ? `${label}: ${detail}` : label);
}

// --- table shape -------------------------------------------------------------
check("절대 시각 필드가 남아 있지 않다", !/deadlineHour\s*:/.test(source), "deadlineHour 가 아직 존재한다");
check("챕터 상대 필드를 쓴다", /hoursAfterChapterEntry\s*:\s*number/.test(source));

const entries = [...source.matchAll(/questId:\s*"([^"]+)",\s*\n\s*label:[^\n]*\n\s*chapterId:\s*"([^"]+)",\s*\n\s*completionEventId:\s*"([^"]+)",\s*\n\s*hoursAfterChapterEntry:\s*(\d+)/g)]
  .map((m) => ({ questId: m[1], chapterId: m[2], completionEventId: m[3], hours: Number(m[4]) }));

check("기한 6개를 모두 읽었다", entries.length === 6, `읽은 개수 ${entries.length}`);
for (const e of entries) {
  check(`${e.questId} 예산이 양수`, e.hours > 0, `${e.hours}`);
  check(`${e.questId} 완료 이벤트가 자기 챕터`, e.completionEventId.includes(e.chapterId), `${e.completionEventId}`);
}

// --- reachability ------------------------------------------------------------
/**
 * A flat cap said nothing useful: CH03 takes 36 in-game hours to cross, so a
 * 24-hour ceiling there guaranteed the quest failed while a 24-hour ceiling in
 * CH01 was generous. What matters is the gap between the deadline and the
 * earliest the completion event can actually be reached, so the bound is
 * measured from the chapter graph rather than picked.
 */
const reach = readReach();
for (const e of entries) {
  const earliest = reach.get(e.chapterId)?.dist.get(e.completionEventId);
  check(`${e.questId} 완료 이벤트에 도달할 수 있다`, earliest !== undefined, "그래프상 닿지 않는다");
  if (earliest === undefined) continue;
  check(
    `${e.questId} 기한 안에 도달 가능하다`,
    e.hours >= earliest + MARGIN,
    `최단 ${earliest}시간인데 기한이 ${e.hours}시간`,
  );
  check(
    `${e.questId} 기한이 압박으로 남는다`,
    e.hours <= earliest + MAX_SLACK,
    `최단 ${earliest}시간 대비 여유 ${e.hours - earliest}시간`,
  );
}

// --- gating rules ------------------------------------------------------------
check(
  "진입하지 않은 챕터는 기한이 흐르지 않는다",
  /if\s*\(enteredAt === undefined\)\s*return null;/.test(source),
  "deadlineAbsoluteHour 가 미진입 챕터를 null 로 막지 않는다",
);
check(
  "만료 루프가 미진입 챕터를 건너뛴다",
  /if\s*\(firesAt === null\)\s*continue;/.test(source),
  "expireDeadlinesForState 가 null 을 건너뛰지 않는다",
);
check(
  "임박 표시도 미진입 챕터를 제외한다",
  /if\s*\(firesAt === null\)\s*return false;/.test(source),
  "getDeadlineUrgency 가 null 을 제외하지 않는다",
);

// --- store wiring ------------------------------------------------------------
const store = fs.readFileSync(path.join(root, "apps", "part1", "src", "store", "gameStore.ts"), "utf8");
check("챕터 진입 시각을 기록한다", /chapterEnteredAt/.test(store), "gameStore 에 chapterEnteredAt 이 없다");
check(
  "진입 시각은 최초 1회만 기록한다",
  /chapterEnteredAt\?\.\[chapterId\] === undefined/.test(store),
  "재진입 때 시각이 덮어써진다",
);
const types = fs.readFileSync(path.join(root, "apps", "part1", "src", "types", "game.ts"), "utf8");
check("상태 타입에 진입 시각이 있다", /chapterEnteredAt:\s*Record<string, number>/.test(types));

// --- pace sanity -------------------------------------------------------------
// Every choice costs at least one hour, so a chapter's budget has to be smaller
// than the number of choices the player can burn inside it.
const chapterDir = path.join(root, "private", "content", "data", "chapters");
for (const e of entries) {
  const file = path.join(chapterDir, `${e.chapterId.toLowerCase()}.json`);
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const choices = (data.events ?? []).reduce((n, ev) => n + (ev.choices ?? []).length, 0);
  check(
    `${e.questId} 예산이 ${e.chapterId} 안에서 소진 가능하다`,
    e.hours < choices,
    `예산 ${e.hours}시간 vs 선택 ${choices}개`,
  );
}

if (failures.length > 0) {
  console.error(JSON.stringify({ pass: false, passed: pass, failed: failures.length, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ pass: true, passed: pass, failed: 0, deadlines: entries }, null, 2));
