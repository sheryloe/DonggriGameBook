import fs from "node:fs";
import path from "node:path";

const chapterRoot = path.join(process.cwd(), "private", "content", "data", "chapters");
const chapterFiles = ["ch01.json", "ch02.json", "ch03.json", "ch04.json", "ch05.json"];

const chapterFlavor = {
  CH01: {
    field: "무전 잡음과 잿빛 복도 사이로 움직인다. 통로는 열리지만 방송동 안쪽의 인기척도 함께 가까워진다.",
    stealth: "발소리를 낮춰 잔향을 피한다. 이동은 느려지지만 끊긴 주파수 사이의 구조 신호를 더 오래 붙잡을 수 있다.",
    force: "정면에서 흐름을 끊고 빠르게 밀고 간다. 시간을 벌지만 로비와 복도에 소음이 넓게 번진다.",
    search: "남은 기록과 장비 흔적을 훑는다. 단서는 늘어나지만 오래 머무는 만큼 로비의 위험도 쌓인다.",
    support: "동료의 판단을 먼저 세운다. 대열은 안정되지만 회수해야 할 장비와 시간이 더 묶인다.",
  },
  CH02: {
    field: "젖은 발판과 검은 물길을 따라 움직인다. 다음 구역은 가까워지지만 배수로의 매복 가능성도 올라간다.",
    stealth: "물소리를 덮개 삼아 낮게 접근한다. 추적은 줄지만 수문 안쪽의 체류 시간이 길어진다.",
    force: "막힌 길을 밀어붙여 흐름을 만든다. 통로는 빨리 열리지만 수압과 소음이 동시에 오른다.",
    search: "시장 아래의 흔적을 확인한다. 물자 정보는 늘지만 젖은 바닥에 남긴 발자국이 추적 단서가 된다.",
    support: "거래와 보급선을 먼저 정리한다. 선택지는 넓어지지만 안전한 철수 시간은 짧아진다.",
  },
  CH03: {
    field: "유리 반사와 고층 바람 사이로 경로를 잡는다. 시야는 트이지만 노출되는 각도도 넓어진다.",
    stealth: "그림자와 반사면을 타고 접근한다. 감시는 피하지만 전력 불안정 때문에 대기 시간이 늘어난다.",
    force: "금이 간 구조물을 빠르게 통과한다. 압박은 줄지만 유리 파편음이 정원 전체로 퍼진다.",
    search: "시설 기록과 전력 흐름을 확인한다. 우회로는 보이지만 감시 루틴에 흔적이 남는다.",
    support: "동료의 시야와 이동선을 맞춘다. 대열은 단단해지지만 전력 배분 선택이 더 무거워진다.",
  },
  CH04: {
    field: "상자 더미와 차가운 레일 사이로 이동한다. 동선은 짧아지지만 물류 라인의 금속음이 따라붙는다.",
    stealth: "컨테이너 그림자에 붙어 지나간다. 노출은 줄지만 냉장 구역에 머무는 시간이 길어진다.",
    force: "레일과 문을 강제로 열어 길을 만든다. 속도는 붙지만 금속 충돌음이 구역 전체를 깨운다.",
    search: "물류 기록과 보안 장치를 뒤진다. 보급 단서는 생기지만 창고 로그에 접근 흔적이 남는다.",
    support: "현장 인력과 장비 상태를 먼저 정돈한다. 전선은 안정되지만 즉시 쓸 수 있는 자원은 줄어든다.",
  },
  CH05: {
    field: "냉각풍과 감시 로그 사이에서 접근 기록을 조절한다. 길은 선명해지지만 격리 절차가 빠르게 조여 온다.",
    stealth: "서버 랙 사이의 사각으로 들어간다. 경보는 늦추지만 차단문이 닫히기 전 시간이 줄어든다.",
    force: "통제 구역까지 바로 압박한다. 돌파력은 생기지만 감시망과 냉각 경보가 동시에 올라간다.",
    search: "데이터 흔적과 접근 로그를 확인한다. 진실에 가까워지지만 추적 경로도 더 뚜렷해진다.",
    support: "분석 판단과 대열 위치를 맞춘다. 판단은 선명해지지만 남은 시간이 냉각 경보에 묶인다.",
  },
};

function choiceMode(label, eventType) {
  const text = String(label || "");
  if (/조심|조용|기다|우회|숨|낮|살핀|피해|틈|잠복|닫아/u.test(text)) return "stealth";
  if (/정면|돌파|공격|압박|강행|격파|맞선|무리|뚫|턴다|연다|장악|파기|탈출/u.test(text)) return "force";
  if (/수색|확인|조사|기록|회수|탐색|뒤진|본다|읽|열람/u.test(text)) return "search";
  if (/설득|공유|지원|치료|복구|정비|보조|돕|재활용|안정/u.test(text)) return "support";
  if (["danger", "combat", "boss"].includes(eventType)) return "force";
  if (["dialogue", "briefing"].includes(eventType)) return "support";
  if (["exploration", "scene"].includes(eventType)) return "search";
  return "field";
}

function leadFor(eventType, label, mode) {
  if (mode === "force") return `‘${label}’ 쪽으로 강하게 밀어붙인다.`;
  if (mode === "stealth") return `‘${label}’ 쪽으로 조용히 흐름을 돌린다.`;
  if (mode === "search") return `‘${label}’ 쪽으로 현장 단서를 더 파고든다.`;
  if (mode === "support") return `‘${label}’ 쪽으로 대열과 판단을 먼저 정리한다.`;
  if (eventType === "boss") return `‘${label}’ 판단으로 결전의 주도권을 당긴다.`;
  if (eventType === "combat") return `‘${label}’ 판단으로 충돌 거리를 다시 정한다.`;
  if (eventType === "danger") return `‘${label}’ 판단으로 위험 신호에 먼저 대응한다.`;
  if (eventType === "extraction") return `‘${label}’ 판단으로 철수 경로를 확정한다.`;
  if (eventType === "dialogue") return `‘${label}’ 판단으로 대화의 무게중심을 옮긴다.`;
  if (eventType === "briefing") return `‘${label}’ 판단으로 작전의 첫 방향을 고정한다.`;
  if (eventType === "exploration") return `‘${label}’ 판단으로 현장 단서를 따라간다.`;
  if (eventType === "scene") return `‘${label}’ 판단으로 다음 장면의 리듬을 바꾼다.`;
  return `‘${label}’ 판단으로 다음 행동을 실행한다.`;
}

let changed = 0;
const perChapter = {};

for (const file of chapterFiles) {
  const filePath = path.join(chapterRoot, file);
  const chapter = JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/u, ""));
  perChapter[chapter.chapter_id] = 0;

  for (const event of chapter.events || []) {
    for (const choice of event.choices || []) {
      const mode = choiceMode(choice.label, event.event_type);
      const flavor = chapterFlavor[chapter.chapter_id]?.[mode] ?? chapterFlavor[chapter.chapter_id]?.field;
      const preview = `${leadFor(event.event_type, choice.label, mode)} ${flavor}`;
      if (choice.preview !== preview) {
        choice.preview = preview;
        changed += 1;
        perChapter[chapter.chapter_id] += 1;
      }
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(chapter, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({ changed, perChapter }, null, 2));
