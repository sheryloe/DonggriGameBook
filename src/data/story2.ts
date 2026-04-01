import { applyEffects } from "../lib/storyEngine";
import { story2Assets } from "./story2Assets";
import {
  StoryBootstrap,
  StoryDefinition,
  StoryLogEntry,
  StoryNode,
  StoryState,
} from "../types/story";

const routeId = "2";
const version = "0.2.0";
const startNodeId = "dispatch";
const nodeOrder = [
  "dispatch",
  "floodwall",
  "tollgate",
  "market",
  "relay",
  "sluice",
  "depot",
  "return",
];

const initialState: StoryState = {
  supplies: 3,
  noise: 1,
};

const nodes: Record<string, StoryNode> = {
  dispatch: {
    id: "dispatch",
    title: "보급 배차",
    visual: "dispatch",
    body: [
      "여의도 외곽 보급반의 아침은 늘 문서보다 먼저 시작된다. 배차실 형광등은 절반만 켜져 있고, 화물 목록은 수정 테이프가 덧댄 문장 위에 다시 적혀 있다. {name}의 호출표는 아직 사람보다 먼저 배정된 물건처럼 취급된다.",
      "오늘 루트는 북문에서 서쪽 제방을 따라 외곽 중계창고까지 나가 식수, 배터리, 약품을 회수하고, 다시 같은 축으로 복귀하는 일이다. 여의도 안에서는 간단한 작업처럼 보이지만, 바깥으로 나가는 순간부터는 배차와 통행권과 우선권의 순서가 사람을 흔든다.",
    ],
    choices: [
      {
        label: "공식 배차표를 그대로 받아 호송 조에 오른다",
        to: "floodwall",
        effects: { supplies: 1 },
        hint: "기본 신뢰를 얻지만 출발이 느리다.",
        badge: "공식",
        tone: "official",
      },
      {
        label: "외곽 길잡이와 합류해 빠른 길을 택한다",
        to: "floodwall",
        effects: { supplies: 1, noise: 1 },
        hint: "빠르지만 소문과 빚이 함께 붙는다.",
        badge: "길잡이",
        tone: "community",
      },
    ],
  },
  floodwall: {
    id: "floodwall",
    title: "제방 진입",
    visual: "floodwall",
    body: [
      "한강 제방 상부 도로는 반쯤 끊긴 도시의 뼈대처럼 보인다. 경광등은 젖은 콘크리트 위를 훑고, 수문 쪽 바람은 기름과 비 냄새를 한 겹 더 얹는다. 서울 외곽은 폐허라기보다 아직 정리가 끝나지 않은 작업장에 가깝다.",
      "정비반은 상부 도로를 고수하라고 했지만, 길잡이는 점검로 아래로 내려가면 소음이 줄고 도착도 빨라진다고 말한다. 둘 다 틀린 말은 아니다. 다만 어느 쪽도 공짜는 아니다.",
    ],
    choices: [
      {
        label: "제방 상부 도로를 끝까지 유지한다",
        to: "tollgate",
        effects: { noise: -1 },
        hint: "노출이 적고 검문 설명도 간단하다.",
        badge: "상부",
        tone: "quiet",
      },
      {
        label: "점검로 아래로 내려가 빠르게 끊는다",
        to: "tollgate",
        effects: { supplies: 1, noise: 1 },
        hint: "더 빨리 도착하지만 젖은 흔적이 남는다.",
        badge: "하부",
        tone: "risky",
      },
    ],
  },
  tollgate: {
    id: "tollgate",
    title: "외곽 검문선",
    visual: "tollgate",
    body: [
      "교량 톨게이트 자리는 지금도 검문소다. 차단바 대신 출입증이, 요금 대신 화물 목록이 올라간다. 외곽에서는 길 하나가 곧 사람 하나의 신분이 된다.",
      "검문 조는 화물 박스보다 운반자의 눈을 먼저 본다. 목소리가 빠르면 숨은 것이 있다고 생각하고, 너무 차분하면 미리 연습한 거라고 의심한다. 여의도식 문서는 이 병목에서 늘 한 박자 늦는다.",
    ],
    choices: [
      {
        label: "공식 문서와 화물 목록을 전부 보여준다",
        to: "market",
        effects: {},
        hint: "정직하지만 시간이 길게 걸린다.",
        badge: "서류",
        tone: "official",
      },
      {
        label: "비상 배차표를 내밀고 후문 줄에 붙는다",
        to: "market",
        effects: { supplies: 1, noise: 2 },
        hint: "통과는 빠르지만 검문 메모가 남는다.",
        badge: "우회",
        tone: "risky",
      },
    ],
  },
  market: {
    id: "market",
    title: "교환 장터",
    visual: "market",
    body: [
      "교량 아래 장터에는 물통, 배터리, 통행권, 비상약이 서로 다른 상자에 담겨 있다. 누군가는 거래하고 누군가는 줄을 섰고, 누군가는 줄에 서는 척만 한다. 바깥은 무법이 아니라 공문보다 빠른 상호부조와 교환의 장이다.",
      "외곽 주민들은 물자보다 신뢰를 먼저 깎아 쓴다. 먼저 나눠 주면 나중에 줄을 설 수 있고, 먼저 의심하면 나중에 화물은 남는다. 어느 쪽이든 서울의 생존 문법은 계산이 먼저다.",
    ],
    choices: [
      {
        label: "배터리 두 팩을 물과 교환한다",
        to: "relay",
        effects: { supplies: 1, noise: 1 },
        hint: "회수량은 유지되지만 교환 흔적이 남는다.",
        badge: "교환",
        tone: "community",
      },
      {
        label: "주민 우선 배급을 먼저 나눠 신뢰를 얻는다",
        to: "relay",
        effects: { supplies: -1, noise: -1 },
        hint: "보급은 줄지만 다음 차례가 조용해진다.",
        badge: "분배",
        tone: "community",
      },
    ],
  },
  relay: {
    id: "relay",
    title: "중계창고",
    visual: "relay",
    body: [
      "외곽 중계창고는 정식 접수와 비공식 재분배가 충돌하는 곳이다. 컨테이너 문마다 번호가 붙어 있고, 바닥엔 배터리 상자와 공문 사본이 함께 쌓여 있다. 여의도에서의 질서가 바깥으로 나가면, 절차는 곧 거래가 된다.",
      "창고 관리인은 한 박스만 더 숨기면 다음 회차 배차 때 이름을 올려 주겠다고 말한다. 이런 말은 보상이라기보다 빚의 계산 방식에 가깝다. 외곽에서는 도움도 기록으로 남는다.",
    ],
    choices: [
      {
        label: "정식 접수로 남기고 추가 상자는 포기한다",
        to: "sluice",
        effects: { supplies: 1 },
        hint: "깨끗하지만 수익은 낮다.",
        badge: "접수",
        tone: "official",
      },
      {
        label: "추가 상자를 숨겨 다음 회차를 노린다",
        to: "sluice",
        effects: { supplies: 2, noise: 1 },
        hint: "이득은 크지만 검문 설명이 어려워진다.",
        badge: "은닉",
        tone: "risky",
      },
    ],
  },
  sluice: {
    id: "sluice",
    title: "수문 구간",
    visual: "floodwall",
    body: [
      "중계창고 뒤편의 수문 구간은 길이라기보다 기다림의 압력을 다루는 장소다. 수위계는 반쯤 젖어 있고, 서비스 통로 바닥에는 오래된 물자 끌림 자국과 최신 발자국이 겹쳐 있다. 여의도 외곽에서는 물이 흐르는 방향보다 물이 막히는 순간이 더 중요한 신호다.",
      "수문 경보가 한 번 울리면 호송 조는 걸음을 늦추고, 길잡이는 숨을 줄이고, 경비는 기록을 먼저 고친다. 바깥의 재난은 대개 사람보다 절차가 먼저 반응한다.",
    ],
    choices: [
      {
        label: "수문 주기를 기다리며 경보등이 잠길 때까지 선다",
        to: "depot",
        effects: { noise: -1 },
        hint: "느리지만 노출이 줄고 복귀 설명이 쉬워진다.",
        badge: "대기",
        tone: "quiet",
      },
      {
        label: "점검 틈을 타 서비스 통로를 먼저 끊는다",
        to: "depot",
        effects: { supplies: 1, noise: 1 },
        hint: "속도는 빠르지만 젖은 흔적과 소문이 남는다.",
        badge: "돌파",
        tone: "risky",
      },
    ],
  },
  depot: {
    id: "depot",
    title: "임시 적치장",
    visual: "relay",
    body: [
      "임시 적치장은 거대한 회색 주차장 같지만, 실제로는 배달과 회수와 유예가 모두 모이는 계산대에 가깝다. 팔레트 위 상자에는 모두 같은 테이프가 둘려 있지만, 그 속에는 누구의 생존 시간이 먼저 들어 있는지가 다르다.",
      "현장 회수반은 화물량보다 봉인 상태를 먼저 본다. 하나만 더 챙기면 좋겠다는 말은 늘 여기서 나온다. 하지만 외곽에서 챙긴 물자는 돌아올 때도 설명을 요구한다.",
    ],
    choices: [
      {
        label: "봉인을 확인하고 적재량을 그대로 기록한다",
        to: "return",
        effects: { supplies: 1, noise: -1 },
        hint: "깨끗한 복귀를 향한 가장 조용한 선택이다.",
        badge: "기록",
        tone: "official",
      },
      {
        label: "남는 상자 하나를 더 빼서 복귀한다",
        to: "return",
        effects: { supplies: 2, noise: 1 },
        hint: "회수량은 늘지만 검문에서 설명이 길어진다.",
        badge: "추가",
        tone: "risky",
      },
    ],
  },
  return: {
    id: "return",
    title: "복귀 판정",
    visual: "return",
    body: [
      "북문 복귀선에 들어서면 모든 것이 다시 문서가 된다. 회수량, 누적 소음, 장터 접촉 흔적, 수문 통과 시간, 적치장 봉인 상태가 한 장의 보고서로 묶인다. 살아 돌아오는 것과 승인되는 것은 여전히 다른 일이다.",
      "{name}의 호출표는 돌아왔지만, 검문관은 물자보다 증언을 더 오래 본다. 외곽 보급 루트는 물자를 살리는 대신, 누가 언제 누구와 붙었는지를 남긴다.",
    ],
    choices: [
      {
        label: "정상 복귀 보고를 제출한다",
        to: "ending-clear",
        effects: {},
        requirements: [
          { stat: "supplies", op: "gte", value: 6 },
          { stat: "noise", op: "lte", value: 3 },
        ],
        hint: "충분한 물자와 낮은 노출이 필요하다.",
        badge: "N-CLEAR",
        tone: "official",
      },
      {
        label: "일부 물자를 공제받는 조건으로 통과를 요청한다",
        to: "ending-debt",
        effects: { supplies: -2 },
        requirements: [{ stat: "supplies", op: "gte", value: 5 }],
        hint: "살아 돌아오지만 다음 배차가 무거워진다.",
        badge: "A-DEBT",
        tone: "community",
      },
      {
        label: "복귀 판정을 미루고 격리동으로 빠진다",
        to: "ending-quarantine",
        effects: { noise: 1 },
        hint: "즉시 추방은 피하지만 임무는 실패로 남는다.",
        badge: "Q-HOLD",
        tone: "risky",
      },
    ],
  },
  "ending-clear": {
    id: "ending-clear",
    title: "엔딩 · 보급망 복구",
    visual: "ending-clear",
    body: [
      "검문관은 네 보고서에 초록색 N-CLEAR 인장을 찍는다. 외곽 보급 루트는 끊기지 않았고, 창고는 오늘도 여의도 쪽으로 다시 연결된다.",
      "환영은 없다. 대신 다음 배차표가 나온다. Story 02의 다음 이야기는 이제 물자가 아니라, 누가 그 물자를 계속 옮길 수 있는지로 이어진다.",
    ],
    choices: [
      {
        label: "다음 배차를 기다리며 처음으로 돌아간다",
        to: "dispatch",
        effects: {},
        hint: "다른 동선으로 외곽을 다시 볼 수 있다.",
        badge: "RETRY",
        tone: "official",
      },
    ],
    ending: {
      code: "clear",
      headline: "보급망 복구",
      debrief: "외곽 보급을 성공적으로 마쳐 여의도와 중계창고의 연결을 회복했다.",
      tags: ["N-CLEAR", "Supply Route", "Recovered"],
      recommendation: "다음 확장에서는 길잡이와 장터 세력을 더 깊게 다루면 좋다.",
    },
  },
  "ending-debt": {
    id: "ending-debt",
    title: "엔딩 · 공제 귀환",
    visual: "ending-debt",
    body: [
      "검문대는 물자를 절반만 인정하고 A-DEBT 태그를 남긴다. 외곽 보급은 살렸지만, 공제표는 네 이름을 다음 배차의 마지막 줄로 밀어 넣는다.",
      "살아남았다는 사실은 인정된다. 다만 여의도에서 살아남는 일은 곧바로 다음 노동을 의미한다. 빚은 숫자가 아니라 출발 순서로 남는다.",
    ],
    choices: [
      {
        label: "배차부로 돌아가 다시 기록한다",
        to: "dispatch",
        effects: {},
        hint: "더 조용한 수송을 노릴 수 있다.",
        badge: "RETRY",
        tone: "official",
      },
    ],
    ending: {
      code: "debt",
      headline: "공제 귀환",
      debrief: "보급은 돌아왔지만 공제와 감시 태그가 남았다.",
      tags: ["A-DEBT", "Conditional Return", "Tracked"],
      recommendation: "다음 확장에서는 거래와 공제의 경계를 더 세밀하게 다루면 좋다.",
    },
  },
  "ending-quarantine": {
    id: "ending-quarantine",
    title: "엔딩 · 격리 보류",
    visual: "ending-quarantine",
    body: [
      "Q-HOLD 셔터가 내려오면 외곽은 바로 멀어진다. 복귀는 했지만 검문은 끝나지 않았고, 보고서는 격리동으로 넘어간다.",
      "이 루트는 끝났지만, 네 이름은 삭제되지 않는다. 여의도는 실패한 기록도 다음 배차를 위해 보관한다.",
    ],
    choices: [
      {
        label: "배차부로 돌아가 다시 기록한다",
        to: "dispatch",
        effects: {},
        hint: "보급과 소음을 다시 조정할 수 있다.",
        badge: "RETRY",
        tone: "official",
      },
    ],
    ending: {
      code: "quarantine",
      headline: "격리 보류",
      debrief: "복귀는 했지만 검문을 통과하지 못해 임무가 보류됐다.",
      tags: ["Q-HOLD", "Quarantine", "Failure"],
      recommendation: "다음 시도에서는 톨게이트와 수문 구간의 소음을 더 낮추는 편이 낫다.",
    },
  },
};

function zeroRoute(stepCount: number) {
  return Array.from({ length: stepCount }, () => 0);
}

function buildBootstrap(choiceIndexes: number[]): StoryBootstrap {
  const timeline: StoryLogEntry[] = [
    {
      nodeId: startNodeId,
      title: nodes[startNodeId].title,
      note: "외곽 보급 배차를 받았다.",
    },
  ];

  let state = { ...initialState };
  let currentNodeId = startNodeId;

  choiceIndexes.forEach((choiceIndex, stepIndex) => {
    const currentNode = nodes[currentNodeId];
    const choice = currentNode.choices[choiceIndex];

    if (!choice) {
      throw new Error(
        `Invalid bootstrap choice ${choiceIndex} at step ${stepIndex + 1} for node "${currentNodeId}" in ${routeId}`,
      );
    }

    const targetNode = nodes[choice.to];

    if (!targetNode) {
      throw new Error(`Missing bootstrap target "${choice.to}" from "${currentNodeId}" in ${routeId}`);
    }

    state = applyEffects(state, choice.effects);
    state = applyEffects(state, targetNode.effects);

    timeline.push({
      nodeId: currentNode.id,
      title: currentNode.title,
      note: choice.label,
      delta: choice.effects,
    });
    timeline.push({
      nodeId: targetNode.id,
      title: targetNode.title,
      note: targetNode.ending
        ? targetNode.ending.headline
        : `${targetNode.title} 구간에 도착했다.`,
      delta: targetNode.effects,
    });

    currentNodeId = targetNode.id;
  });

  return {
    state,
    timeline,
    status: nodes[currentNodeId].ending ? "ended" : "in_progress",
  };
}

const bootstrapRoutes: Record<string, number[]> = {
  dispatch: [],
  floodwall: zeroRoute(1),
  tollgate: zeroRoute(2),
  market: zeroRoute(3),
  relay: zeroRoute(4),
  sluice: zeroRoute(5),
  depot: zeroRoute(6),
  return: zeroRoute(7),
  "ending-clear": zeroRoute(8),
  "ending-debt": [...zeroRoute(7), 1],
  "ending-quarantine": [...zeroRoute(7), 2],
};

const bootstrap = Object.fromEntries(
  Object.entries(bootstrapRoutes).map(([nodeId, route]) => [nodeId, buildBootstrap(route)]),
) as Record<string, StoryBootstrap>;

export const story2: StoryDefinition = {
  id: "story-02",
  routeId,
  version,
  title: "스토리 2 · 외곽 보급 루트",
  tagline: "여의도와 바깥 창고를 잇는 배차, 검문, 교환, 복귀의 기록.",
  routeBase: "/story/2",
  startNodeId,
  nodeOrder,
  initialState,
  assets: story2Assets,
  nodes,
  bootstrap,
};
