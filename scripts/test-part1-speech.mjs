/**
 * Tests for the spoken-vs-narrative classifier.
 *
 * 131 of 221 CH01-CH05 dialogue lines were narrative sentences filed under a
 * speaker, which is why one operator appeared to monopolise the script. Moving
 * them is only safe if polite speech is never mistaken for narration, so both
 * directions are pinned here with real lines from the corpus.
 */

import fs from "node:fs";
import path from "node:path";

import { isSpokenLine } from "./lib/part1-korean-copy.mjs";

let pass = 0;
const failures = [];
const expect = (line, want, label) => {
  const got = isSpokenLine(line);
  if (got === want) { pass += 1; return; }
  failures.push(`${label}: "${line.slice(0, 60)}" → ${got}, 기대 ${want}`);
};

// 실제 대사 (반말)
expect("들었지? 살아 있어.", true, "반말 의문");
expect("기록을 건질지 사람부터 찾을지, 안에 들어가면 바로 정해야 해.", true, "-해");
expect("조용히 가면 흔적을 더 볼 수 있어.", true, "-어");
expect("창고부터 가면 보급은 건져.", true, "-져");
expect("길게 싸우지 마.", true, "명령");
expect("여기선 번호보다 얼굴을 먼저 봐.", true, "-봐");
expect("한 건물인데도 위와 아래가 서로를 외부인처럼 취급해.", true, "-해 2");

// 실제 대사 (존댓말) — 이 방향을 놓치면 진짜 대사를 나레이션으로 버린다
expect("끄면 사람부터 보낼 수 있지만 의료품은 멈춥니다.", true, "-습니다");
expect("우리가 원하는 건 충성이 아니라 오늘 밤까지 버틸 순서예요.", true, "-예요");
expect("약은 차갑게 남았는데 받을 사람의 순서만 뜨거워졌어요.", true, "-어요");
expect("다만 아무 편도 들지 않겠다는 말도 누군가에게는 거절로 들려요.", true, "-려요");
expect("모두를 들이면 모두가 죽습니다.", true, "-습니다 2");
expect("지하층 사람들은 구조가 아니라 점거를 원해요.", true, "-해요");

// 나레이션 (대사 블록에 잘못 들어간 것)
expect("바닥은 지나간 몸을 오래 붙든다.", false, "-든다");
expect("덮인 소리만큼 젖은 냄새가 남는다.", false, "-는다");
expect("사람의 목소리는 한 번 묻히면 다시 같은 높이로 돌아오지 않는다.", false, "-않는다");
expect("방송동 로비의 남은 선택은 빠르게 작아지고 있었다.", false, "-었다");
expect("깨진 반사광이 첫 신호처럼 스쳤다.", false, "-쳤다");
expect("조용한 만큼 무엇을 삼켰는지도 늦게 알려 준다.", false, "-준다");
expect("스카이브리지의 불빛이 한 번 더 깜빡이기 전에 발을 옮긴다.", false, "-옮긴다");

// 코퍼스 전수: 존댓말 종결이 나레이션으로 분류되면 안 된다
const base = path.join(process.cwd(), "private", "content", "data", "chapters");
const politeMisses = [];
if (fs.existsSync(base)) {
  for (const ch of ["ch01", "ch02", "ch03", "ch04", "ch05"]) {
    const file = path.join(base, `${ch}.json`);
    if (!fs.existsSync(file)) continue;
    const d = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const e of d.events ?? []) {
      for (const b of e.text?.scene_blocks ?? []) {
        for (const l of b.lines ?? []) {
          const tail = String(l).trim().split(/(?<=[.!?…])\s+/u).pop() ?? "";
          if (/(습니다|어요|에요|예요|세요|네요)[.!?…"'”]*$/u.test(tail) && !isSpokenLine(l)) politeMisses.push(`${ch}: ${l.slice(0, 70)}`);
        }
      }
    }
  }
}
if (politeMisses.length === 0) pass += 1;
else failures.push(`존댓말 대사를 나레이션으로 분류: ${politeMisses.length}건 (${politeMisses[0]})`);

if (failures.length > 0) {
  console.error(JSON.stringify({ pass: false, passed: pass, failed: failures.length, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ pass: true, passed: pass, failed: 0 }, null, 2));
