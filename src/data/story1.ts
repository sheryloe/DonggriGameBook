import { applyEffects } from "../lib/storyEngine";
import { story1Assets } from "./story1Assets";
import {
  StoryBootstrap,
  StoryDefinition,
  StoryLogEntry,
  StoryNode,
  StoryState,
} from "../types/story";

const startNodeId = "intake";
const initialState: StoryState = {
  supplies: 2,
  noise: 1,
};

const nodes: Record<string, StoryNode> = {
  intake: {
    id: "intake",
    title: "입성 심사",
    visual: "intake",
    body: [
      "여의도 외곽 RB 심사선은 사람을 맞이하지 않는다. 손 씻는 소독수 냄새와 바닥의 열감지 격자, 손등 형광 스탬프, 체류 질문서가 먼저 줄을 선다. 기록관은 질문지 상단에 {name}보다 {dossierId}를 먼저 적고, 네 이전 직무인 {role}을 '활용 가능 인력' 칸에 눌러쓴다.",
      "옆 칸에서는 경비실 확성기가 같은 규칙을 세 번 반복한다. 상처 은폐 적발 시 임시 격리, 거짓 진술 적발 시 배급 보류, 복귀 지연 시 체류권 재심사. 한국말인데도 듣고 있으면 사람을 받는 절차가 아니라 물자와 서류를 받는 절차에 더 가깝다.",
    ],
    choices: [
      {
        label: "질문지와 이전 직무를 빠짐없이 제출한다",
        to: "scan-corridor",
        effects: { supplies: 1 },
        hint: "기본 신뢰와 정량 배급을 받는 가장 조용한 길이다.",
        badge: "공식",
        tone: "official",
      },
      {
        label: "팔의 긁힌 자국을 소매로 가리고 답변을 짧게 한다",
        to: "scan-corridor",
        effects: { noise: 1 },
        hint: "입성은 빨라지지만 감시 메모가 남는다.",
        badge: "은폐",
        tone: "risky",
      },
    ],
  },
  "scan-corridor": {
    id: "scan-corridor",
    title: "소독 통로",
    visual: "intake",
    body: [
      "입성 심사를 넘기면 바로 소독 통로가 이어진다. 하얀 천막 아래에서 손목띠가 다시 한 번 확인되고, 열감지 프레임은 이름이 아니라 체온과 숨의 길이만 읽는다. 누군가는 기침 한 번으로 줄 끝으로 밀리고, 누군가는 짐 가방이 닫히는 소리만으로 눈총을 받는다.",
      "여의도의 첫 병목은 감염보다 절차에 가깝다. 줄이 길어질수록 사람들은 서로를 밀어내는 방식으로만 빨리 지나가려 하고, 그게 여기서는 가장 흔한 자기보호가 된다.",
    ],
    choices: [
      {
        label: "벽면을 따라 조용히 지나간다",
        to: "barracks",
        effects: {},
        hint: "불필요한 시선을 덜 받는다.",
        badge: "대기",
        tone: "quiet",
      },
      {
        label: "방송이 끊기기 전에 짧게 확인 질문을 던진다",
        to: "barracks",
        effects: { noise: 1 },
        hint: "절차는 빨라지지만 기록이 남는다.",
        badge: "질문",
        tone: "risky",
      },
      {
        label: "공지판 쪽으로 잠깐 빠져 다음 호출을 확인한다",
        to: "notice-board",
        effects: { noise: -1 },
        hint: "줄을 늦추는 대신 다음 공지를 먼저 읽을 수 있다.",
        badge: "우회",
        tone: "official",
      },
    ],
  },
  barracks: {
    id: "barracks",
    title: "임시 배정",
    visual: "barracks",
    body: [
      "B-17B 숙영동은 아파트 임시대피소와 군용 창고의 중간쯤 같다. 침상 번호표, 정전 시간표, 분리수거 공지, 세탁 순번, 배급 대기선이 같은 벽에 겹쳐 붙어 있다. 누군가 배급 줄에서 팔목을 숨기다 들키자, 주변 사람들은 경비실 쪽을 보지도 않고 말없이 한 걸음씩 뒤로 물러난다.",
      "네 손목에는 {wristband}, 침상에는 {assignedZone} 표지가 붙는다. 여기서는 이름보다 줄 설 권리가 먼저 정해지고, 줄 설 권리는 배급표와 소문, 그리고 누가 그날 관리실에서 누구와 말을 나눴는지가 결정한다.",
    ],
    choices: [
      {
        label: "정량 배급만 받고 눈을 피한 채 물러난다",
        to: "courtyard-call",
        effects: { supplies: 1 },
        hint: "가장 덜 튀고 다음 줄에도 영향을 덜 준다.",
        badge: "저위험",
        tone: "quiet",
      },
      {
        label: "침상 아래 숨겨진 통조림까지 슬쩍 챙긴다",
        to: "courtyard-call",
        effects: { supplies: 2, noise: 1 },
        hint: "배는 든든해지지만 옆 침상의 시선과 공제표가 따라온다.",
        badge: "획득",
        tone: "risky",
      },
      {
        label: "배급 줄 끝에서 공지판 위치부터 다시 확인한다",
        to: "notice-board",
        effects: { noise: -1 },
        hint: "한 번 더 둘러보면 소문과 호출 순서가 보인다.",
        badge: "확인",
        tone: "official",
      },
    ],
  },
  "courtyard-call": {
    id: "courtyard-call",
    title: "중정 호출",
    visual: "barracks",
    body: [
      "숙영동 앞 중정에는 임시 공지판과 세탁 순번, 배급 대기선이 한 줄로 엉켜 있다. 관리실 직원은 새로 들어온 사람들 앞에서 층별 정전 시간표와 공제표를 읽고, 경비실 방송은 그 사이에 누가 어디서부터 서 있을지 다시 부른다.",
      "누군가는 가족 단위로 우선 배정을 받고, 누군가는 상처 재확인 도장 때문에 한 걸음씩 뒤로 밀린다. 여기서는 사적인 사정이 늘 공지문 언어로 번역되고, 그 번역본이 네 체류 자격이 된다.",
    ],
    choices: [
      {
        label: "공지문을 다시 읽고 침상번호만 확인한다",
        to: "notice-board",
        effects: { noise: -1 },
        hint: "말을 아끼면 다음 줄이 덜 시끄럽다.",
        badge: "조용",
        tone: "quiet",
      },
      {
        label: "배급 줄 옆에서 관리실 소문을 물어본다",
        to: "notice-board",
        effects: { noise: 1 },
        hint: "정보를 얻지만 누군가 네 얼굴을 기억한다.",
        badge: "소문",
        tone: "community",
      },
      {
        label: "중정 호출을 넘기고 브리핑실 바로 앞까지 간다",
        to: "briefing",
        effects: { supplies: -1 },
        hint: "절차는 줄지만 질문은 남고, 기록도 길어진다.",
        badge: "연결",
        tone: "official",
      },
    ],
  },
  "notice-board": {
    id: "notice-board",
    title: "배급 공지판",
    visual: "briefing",
    body: [
      "배급 줄 끝에서 누군가의 소매가 풀린다. 손목까지 올라간 붉은 자국이 보이자, 앞줄의 사람들이 동시에 조용해진다. 관리실 직원은 말없이 공지판 아래에 새 종이를 붙인다. '상처 은폐 의심자, 오늘 분 배급 후 확인'. 지우개 자국과 테이프가 여러 겹 겹친 문장이다.",
      "이곳은 폭력이 크게 터지지 않는다. 대신 누가 먼저 시선을 거두고, 누가 먼저 줄을 비우고, 누가 어떤 말도 하지 않았는지가 기록된다. 여의도의 공지는 언제나 공동체를 보호한다는 문장으로 시작하지만, 실제로는 사람을 줄 세우는 문장으로 끝난다.",
    ],
    choices: [
      {
        label: "보지 못한 척하고 공지판 옆을 지난다",
        to: "briefing",
        effects: { noise: -1 },
        hint: "한 사람의 시선만 피하고 다음 줄로 넘어간다.",
        badge: "침묵",
        tone: "quiet",
      },
      {
        label: "관리실 직원에게 확인 전이라며 잠깐 멈춰달라고 한다",
        to: "briefing",
        effects: { noise: 1 },
        hint: "기록은 남지만 사건의 흐름은 늦출 수 있다.",
        badge: "개입",
        tone: "community",
      },
      {
        label: "밀려난 사람의 통조림을 들어주며 소독 통로를 물어본다",
        to: "shutter",
        effects: { supplies: -1, noise: -1 },
        hint: "배급은 줄지만 다음 병목에서 보이는 얼굴이 바뀐다.",
        badge: "동행",
        tone: "community",
      },
    ],
  },
  briefing: {
    id: "briefing",
    title: "첫 지시",
    visual: "briefing",
    body: [
      "FR 브리핑 벽에는 회수 구역 지도와 규정 위반자 명단이 같은 핀에 꽂혀 있다. 유용한 사람은 바깥으로 나가고, 쓸모없다고 분류된 사람은 배급 줄 뒤로 밀린다. 네 이름 옆에는 아직 평가 보류 대신 '출동 가능'이 남아 있고, 그 옆 칸에는 비상방송이 들키지 않게 적어 둔 근무 조가 붙는다.",
      "오늘 밤 임무는 여의도 서쪽 상가와 약국 셔터에서 의약품과 전지를 회수해 북문으로 복귀하는 것. 간단하다는 말은 이곳에서 늘 인원을 움직이게 만드는 행정 문구다. 실제로는 회수, 은폐, 보고가 한 세트다.",
    ],
    choices: [
      {
        label: "약국-서비스복도 우회 지도를 받는다",
        to: "shutter",
        effects: { noise: -1 },
        hint: "돌아가지만 복귀 소문이 덜 남고 검문 메모도 짧다.",
        badge: "우회",
        tone: "official",
      },
      {
        label: "한강 제방 지름길과 전지 회수 구간을 요청한다",
        to: "shutter",
        effects: { supplies: 1, noise: 1 },
        hint: "성과가 커지는 대신 경로가 거칠고 설명도 복잡해진다.",
        badge: "성과",
        tone: "risky",
      },
      {
        label: "공지판 뒤 소독 통로를 따라 먼저 내려간다",
        to: "night-gate",
        effects: { noise: 1 },
        hint: "더 빨리 나오지만 출발부터 흔적이 남는다.",
        badge: "병목",
        tone: "risky",
      },
    ],
  },
  shutter: {
    id: "shutter",
    title: "방화셔터 병목",
    visual: "briefing",
    body: [
      "외벽으로 나가기 전 마지막 구간은 소독 통로와 반쯤 열린 방화셔터다. 정비조가 먼저 지나가고, 회수반은 그 뒤를 붙는다. 셔터 폭은 사람 하나 겨우 비켜갈 정도라, 누가 먼저 통과하느냐가 곧 작은 권력이고, 뒤에 누구를 남기느냐가 곧 책임이다.",
      "뒤에서 누군가 기침하자 줄이 순간 갈라진다. 감염 때문인지 공포 때문인지는 아무도 묻지 않는다. 이런 공간에서 진실보다 빨리 움직이는 건 눈치와 자기보호다.",
    ],
    choices: [
      {
        label: "방송 지시에 맞춰 끝까지 순서를 기다린다",
        to: "night-gate",
        effects: {},
        hint: "시간은 쓰지만 기록은 깨끗하고 민원도 없다.",
        badge: "대기",
        tone: "official",
      },
      {
        label: "정비조 뒤를 바짝 붙어 먼저 빠져나간다",
        to: "night-gate",
        effects: { supplies: 1, noise: 1 },
        hint: "조금 앞서가지만 민원과 시선이 함께 남는다.",
        badge: "선점",
        tone: "risky",
      },
      {
        label: "보수팀 틈에서 출입문 쪽 안내판만 먼저 확인한다",
        to: "bridge-lock",
        effects: { noise: -1 },
        hint: "조금 더 돌아가지만 검문 동선이 보인다.",
        badge: "점검",
        tone: "official",
      },
    ],
  },
  "night-gate": {
    id: "night-gate",
    title: "야간 진입",
    visual: "night-gate",
    body: [
      "W-03 서문이 열리자 바깥의 공기가 먼저 들어온다. 한강 제방 경보등, 뒤집힌 교회 봉고차, 버스 정류장 표지, 약국 간판의 반쯤 뜯긴 유리, 젖은 콘크리트 냄새가 한꺼번에 밀려든다. 여의도 안에서는 질서가 너를 지켰지만, 바깥에서는 네가 질서를 증명해야만 살아 돌아올 수 있다.",
      "복귀선의 말단 기록관은 늘 같은 말을 한다. 살아 돌아오는 것과 통과 판정을 받는 것은 다른 일이라고. 네게 필요한 건 생존 그 자체보다 '설명 가능한 생존'이다. 누구와 붙었는지, 어디서 멈췄는지, 무엇을 남겼는지까지 설명해야 한다.",
    ],
    choices: [
      {
        label: "서쪽 서비스 통로를 따라 벽에 붙는다",
        to: "bridge-lock",
        effects: {},
        hint: "느리지만 감염자와 검문 둘 다 피하기 좋다.",
        badge: "은밀",
        tone: "quiet",
      },
      {
        label: "교회 봉고차 잔해를 넘어 제방 쪽으로 끊는다",
        to: "bridge-lock",
        effects: { supplies: 1, noise: 2 },
        hint: "빨리 움직이지만 흔적과 소문이 많이 남는다.",
        badge: "돌파",
        tone: "risky",
      },
      {
        label: "제방 차단문을 건너뛰고 상가로 먼저 붙는다",
        to: "arcade",
        effects: { noise: -1 },
        hint: "검문은 건너뛰지만 회수 흔적은 더 길어질 수 있다.",
        badge: "관찰",
        tone: "official",
      },
    ],
  },
  "bridge-lock": {
    id: "bridge-lock",
    title: "제방 차단문",
    visual: "night-gate",
    body: [
      "한강 제방 출입문은 차량보다 사람을 더 세밀하게 자른다. 북문으로 이어지는 길 앞에는 순번표와 통행증 색깔이 함께 걸리고, 근무조는 누가 먼저 물러나느냐에 따라 말투를 바꾼다.",
      "멀리 보면 다리가 길어 보이지만, 실제로는 누가 앞에 서고 누가 뒤에 남는지 정해지는 검문 구간이 먼저다. 바깥은 넓어 보여도 병목은 늘 여기서 시작된다.",
    ],
    choices: [
      {
        label: "정해진 순번대로 끝까지 기다린다",
        to: "arcade",
        effects: {},
        hint: "통과는 늦지만 기록은 정돈된다.",
        badge: "순번",
        tone: "official",
      },
      {
        label: "정비용 사다리 옆 좁은 틈으로 먼저 넘어간다",
        to: "arcade",
        effects: { supplies: 1, noise: 1 },
        hint: "조금 앞서가지만 설명이 복잡해진다.",
        badge: "우회",
        tone: "risky",
      },
      {
        label: "차단문 문구를 메모하고 상가 쪽 회수선을 먼저 잡는다",
        to: "rooftop-check",
        effects: { noise: -1 },
        hint: "더 돌아가지만 검문 표식이 선명해진다.",
        badge: "기록",
        tone: "official",
      },
    ],
  },
  arcade: {
    id: "arcade",
    title: "자원 수색",
    visual: "arcade",
    body: [
      "폐업한 상가 내부는 아직 서울의 생활 냄새를 버리지 못했다. 약국 셔터에는 손글씨 재고표가 붙어 있고, 편의점 창고에는 라면 박스와 배터리 포장지가 눅눅하게 들러붙어 있다. 엘리베이터 대신 계단으로 오르내리던 흔적, 식당가 배수구에 남은 소독약 냄새까지 아직 다 안 빠졌다.",
      "회수반 수기 메모가 남은 선반을 훑다 보면, 바깥도 완전한 무법지가 아니라는 걸 알게 된다. 다만 그 질서는 공문이 아니라 낙서, 거래, 숨겨둔 상자, 충전 순번 같은 방식으로 남아 있을 뿐이다.",
    ],
    choices: [
      {
        label: "약국 셔터와 진열대를 먼저 턴다",
        to: "rooftop-check",
        effects: { supplies: 2, noise: 1 },
        hint: "가치가 큰 대신 오래 머물고 흔적도 많아진다.",
        badge: "의약품",
        tone: "risky",
      },
      {
        label: "편의점 창고와 전지 박스만 챙긴다",
        to: "rooftop-check",
        effects: { supplies: 1 },
        hint: "실속은 줄지만 시간이 절약되고 소문도 덜 난다.",
        badge: "회수",
        tone: "quiet",
      },
      {
        label: "옥상으로 바로 올라가 아래층 루트를 다시 훑는다",
        to: "collapse",
        effects: { noise: -1 },
        hint: "멈추는 대신 소음이 먼저 낮아진다.",
        badge: "점검",
        tone: "official",
      },
    ],
  },
  "rooftop-check": {
    id: "rooftop-check",
    title: "옥상 점검",
    visual: "arcade",
    body: [
      "상가 옥상으로 올라가면 여의도 조명과 바깥의 어둠이 반으로 갈라진다. 물탱크 옆 임시 무전기는 누군가의 목소리를 잡았다 놓고, 아래층에서는 누가 먼저 내려갈지에 대한 작은 다툼이 이어진다.",
      "여기서는 지도를 보는 것보다 아래를 내려다보는 시간이 길다. 살아남은 사람은 모두 자기 편의 루트를 정당화하고, 그 정당화는 종종 다른 사람의 소음을 떠넘기는 방식으로 완성된다.",
    ],
    choices: [
      {
        label: "난간에서 바닥 동선을 다시 체크한다",
        to: "collapse",
        effects: { noise: -1 },
        hint: "속도는 늦어지지만 노출이 줄어든다.",
        badge: "관찰",
        tone: "quiet",
      },
      {
        label: "무전기를 챙기며 급히 내려간다",
        to: "collapse",
        effects: { supplies: 1, noise: 1 },
        hint: "도움이 될 장비를 얻지만 흔적도 남긴다.",
        badge: "장비",
        tone: "risky",
      },
      {
        label: "아래층 소리만 확인하고 사람 발자국을 먼저 센다",
        to: "contact",
        effects: { noise: -1 },
        hint: "한 번 더 늦지만 접촉 흔적은 줄어든다.",
        badge: "감시",
        tone: "official",
      },
    ],
  },
  collapse: {
    id: "collapse",
    title: "감염자 회피",
    visual: "collapse",
    body: [
      "유리 조각이 한 번 긁히자 복도 끝의 소리가 방향을 바꾼다. 셋인지 넷인지 셀 틈도 없다. 셔터 아래 낮은 틈, 옆 복도의 소방문, 젖은 바닥의 발자국이 한꺼번에 눈에 들어온다. 안으로 숨을지, 밖으로 밀어낼지, 누구 하나는 반드시 계산해야 한다.",
      "이런 순간의 공포는 이빨보다 먼저 군중을 닮는다. 누가 먼저 밀고, 누가 먼저 막고, 누가 가장 늦게 소리 내는지가 곧 생존 순서를 정한다. 여의도는 이런 실수를 소음 수치로 적지만, 현장은 얼굴을 기억한다.",
    ],
    choices: [
      {
        label: "유리 파편을 피해 셔터 밑으로 기어간다",
        to: "contact",
        effects: { supplies: -1, noise: -1 },
        hint: "물자는 조금 잃지만 흔적과 목격담은 크게 줄어든다.",
        badge: "잠복",
        tone: "quiet",
      },
      {
        label: "소방문을 걷어차 군집을 옆 복도로 돌린다",
        to: "contact",
        effects: { noise: 2 },
        hint: "빠르게 빠질 수 있지만 다른 누군가가 위험해진다.",
        badge: "고위험",
        tone: "risky",
      },
      {
        label: "한 번 더 숨고 서비스 복도 인원을 확인한다",
        to: "north-queue",
        effects: { noise: -1 },
        hint: "길은 길어지지만 다음 검문 앞에서 덜 흔들린다.",
        badge: "재정렬",
        tone: "community",
      },
    ],
  },
  contact: {
    id: "contact",
    title: "생존자 접촉",
    visual: "contact",
    body: [
      "상가 뒤편 서비스 복도에서 누군가가 손전등을 두 번, 쉬고 한 번 더 켠다. 공식 신호가 아니라 바깥 사람들끼리 쓰는 생존 신호다. 그는 자신을 예전 관리실 출신이라고 소개하고, 여의도 안에 남겨 둔 가족을 들이기 위해 북문 근무조 소문과 공제표 사본을 모으고 있다고 말한다.",
      "그의 손에는 배터리, 재입장 금지 출입증, 숨은 통로 메모가 차례로 나온다. 거래는 도움처럼 보이지만, 여의도는 도움보다 접촉 기록과 말 바꾼 흔적을 오래 기억한다.",
    ],
    choices: [
      {
        label: "식량 일부를 내고 배터리와 복귀 소문을 산다",
        to: "return",
        effects: { supplies: 1, noise: 1 },
        hint: "성과는 는다. 대신 누군가 네 얼굴과 말투를 기억한다.",
        badge: "교환",
        tone: "community",
      },
      {
        label: "재입장 금지 출입증만 빼앗고 바로 이탈한다",
        to: "return",
        effects: { noise: 2 },
        hint: "시간은 아끼지만 뒤가 지저분하고 확인 절차도 길어진다.",
        badge: "탈취",
        tone: "risky",
      },
      {
        label: "식량을 나누고 숨은 통로와 근무조 성향을 듣는다",
        to: "north-queue",
        effects: { supplies: -1, noise: -1 },
        hint: "보급은 줄지만 복귀선이 조용해지고, 북문 대처가 쉬워진다.",
        badge: "정보",
        tone: "community",
      },
    ],
  },
  recheck: {
    id: "recheck",
    title: "재확인 구역",
    visual: "return",
    body: [
      "북문 바로 앞의 임시 재확인 구역에는 정식 검문보다 느린 침묵이 걸려 있다. 검문관은 가방을 다시 열라고 하지 않는다. 대신 네가 본 것, 들은 것, 그리고 고개를 돌린 이유를 묻는다. 여기서 중요한 건 물자보다 목격담의 정합성이다.",
      "재확인은 구출이 아니다. 누군가의 말이 네 소음 수치보다 더 높은 값을 가질 때가 있고, 그럴 때는 '살아 돌아왔다'는 문장도 잠시 보류된다. 여의도는 실패를 바로 말하지 않고, 재검토라고 부른다.",
    ],
    choices: [
      {
        label: "검문관에게 본 것을 짧게 요약한다",
        to: "return",
        effects: { noise: 1 },
        hint: "정직하지만 조용하지는 않다.",
        badge: "보고",
        tone: "official",
      },
      {
        label: "목격담을 정리한 쪽지를 건넨 뒤 정식 통과를 요청한다",
        to: "ending-debt",
        effects: { supplies: -1 },
        hint: "증거를 넘기고서야 문이 조금 열린다.",
        badge: "정리",
        tone: "community",
      },
      {
        label: "검문을 미루고 다시 정문 줄로 돌아간다",
        to: "return",
        effects: { noise: 1 },
        hint: "시간을 벌지만 줄과 시선은 다시 처음부터 쌓인다.",
        badge: "보류",
        tone: "risky",
      },
    ],
  },
  "north-queue": {
    id: "north-queue",
    title: "북문 대기선",
    visual: "return",
    body: [
      "N-01 북문 앞에는 돌아온 사람들의 숨과 대기번호가 뒤섞여 있다. 줄을 서 있는 동안 서로가 서로의 증언이 되고, 누군가는 방금 당신을 스쳐 간 사람의 표정을 기억해 둔다.",
      "여의도 검문은 감염 여부만 묻지 않는다. 누구와 접촉했는지, 어떤 말을 주고받았는지, 그리고 줄을 얼마나 조용히 섰는지까지 기록관의 메모가 된다.",
    ],
    choices: [
      {
        label: "검문관이 부를 때까지 말없이 선다",
        to: "return",
        effects: { noise: -1 },
        hint: "마지막 병목에서 흔적을 더 줄인다.",
        badge: "정숙",
        tone: "quiet",
      },
      {
        label: "대기표를 먼저 내밀고 순번 확인을 재촉한다",
        to: "return",
        effects: { noise: 1 },
        hint: "통과는 빨라질 수 있지만 태도가 기록된다.",
        badge: "재촉",
        tone: "community",
      },
      {
        label: "앞선 사람들의 목격담을 적어 재확인 구역으로 넘긴다",
        to: "recheck",
        effects: { noise: -1 },
        hint: "줄은 늦어지지만 기록은 더 단단해진다.",
        badge: "분류",
        tone: "official",
      },
    ],
  },
  return: {
    id: "return",
    title: "귀환 판단",
    visual: "return",
    body: [
      "N-01 북문 검문대의 탐조등이 네 얼굴, 가방, 신발 밑창을 번갈아 훑는다. 여기서는 감염 검사만으로 끝나지 않는다. 줄을 함께 섰던 사람들의 목격담, 복귀 시간, 회수물 양, 접촉 흔적, 그리고 누구 앞에서 먼저 멈췄는지가 한 장 보고서로 묶인다.",
      "{name}이라는 이름은 검문대에서 거의 불리지 않는다. 대신 {callSign}, 회수량, 소음 수치, 접촉 여부가 더 크게 읽힌다. 여의도가 고르는 건 네 기분이 아니라 네 행정 상태고, 검문관의 성향까지 포함한 결과다.",
    ],
    choices: [
      {
        label: "표준 복귀 절차를 밟고 보고서를 제출한다",
        to: "ending-clear",
        effects: {},
        requirements: [
          { stat: "supplies", op: "gte", value: 5 },
          { stat: "noise", op: "lte", value: 3 },
        ],
        hint: "충분한 회수 실적과 낮은 노출, 그리고 깨끗한 증언이 필요하다.",
        badge: "N-CLEAR",
        tone: "official",
      },
      {
        label: "회수물 일부를 넘기고 조건부 통과를 요청한다",
        to: "ending-debt",
        effects: { supplies: -2 },
        requirements: [{ stat: "supplies", op: "gte", value: 3 }],
        hint: "살아남지만 다음 차례가 더 무거워지고 줄 서는 순서도 밀린다.",
        badge: "A-DEBT",
        tone: "community",
      },
      {
        label: "외벽 격리동 라인으로 빠져 판정을 미룬다",
        to: "ending-quarantine",
        effects: { noise: 1 },
        hint: "즉시 추방은 피하지만 실패 기록과 관찰 태그가 남는다.",
        badge: "Q-HOLD",
        tone: "risky",
      },
    ],
  },
  "ending-clear": {
    id: "ending-clear",
    title: "엔딩 · 정식 임무 자격 확보",
    visual: "ending-clear",
    body: [
      "검문 기록관은 네 보고서에 초록색 N-CLEAR 인장을 찍고, {callSign}을 다음 주 FR 예비 호출표에 올린다. {name}, 첫 출동치고는 조용했고 회수물도 충분하다는 말이 뒤따르지만, 그 말에는 축하보다 배치 통지가 더 많이 섞여 있다.",
      "여의도는 너를 환영하지 않는다. 대신 유용한 사람으로 분류한다. 이곳에서 승인이라는 말은 대부분 더 자주 바깥으로 나가도 된다는 뜻이고, 다음 배급 순서에서 조금 더 앞설 수 있다는 뜻이다.",
    ],
    choices: [
      {
        label: "새 기록으로 다시 시작한다",
        to: "intake",
        effects: {},
        hint: "다른 루트와 행정 상태를 확인한다.",
        badge: "RETRY",
        tone: "official",
      },
    ],
    ending: {
      code: "clear",
      headline: "정식 임무 자격 확보",
      debrief: "회수 실적과 낮은 노출로 북문 검문대를 무난히 통과했다.",
      tags: ["N-CLEAR", "FR Candidate", "Approved"],
      recommendation: "다음 스토리에서는 외곽 보급 루트나 종로 정찰 파견으로 이어진다.",
    },
  },
  "ending-debt": {
    id: "ending-debt",
    title: "엔딩 · 부채 태그 부착",
    visual: "ending-debt",
    body: [
      "회수물 일부가 검문대에서 바로 공제되고, 기록관은 네 손목띠 아래에 A-DEBT 메모를 덧붙인다. 살아 돌아온 건 인정되지만, {name}의 복귀는 여의도 입장에서는 '비용이 많이 든 성공'으로 기록된다.",
      "안으로는 들어왔지만 줄 설 순서와 숙영 우선권이 달라진다. 여의도에서 빚은 숫자가 아니라, 네가 다음에 어느 줄 끝에 서게 되는지, 그리고 관리실이 네 이름을 얼마나 자주 부르는지로 체감된다.",
    ],
    choices: [
      {
        label: "새 기록으로 다시 시작한다",
        to: "intake",
        effects: {},
        hint: "더 조용한 복귀를 노려볼 수 있다.",
        badge: "RETRY",
        tone: "official",
      },
    ],
    ending: {
      code: "debt",
      headline: "부채·위험 태그를 달고 생존",
      debrief: "살아는 돌아왔지만 회수물 공제와 감시 태그가 붙었다.",
      tags: ["A-DEBT", "Conditional Return", "Tracked"],
      recommendation: "다음 기록에서는 거래 흔적과 복귀선 소문 관리가 더 중요해진다.",
    },
  },
  "ending-quarantine": {
    id: "ending-quarantine",
    title: "엔딩 · 격리 또는 임무 실패",
    visual: "ending-quarantine",
    body: [
      "Q-2 격리동 셔터가 닫히는 소리는 바깥의 군집보다 낮지만 더 오래 남는다. 북문 기록관은 네 보고서를 폐기하지도 승인하지도 않은 채 보류함에 넣는다. 여의도에서 보류는 종종 추방보다 길다.",
      "{callSign}은 살아 있다. 하지만 살아 있다는 사실이 거주 자격을 보장하지는 않는다. 다음 문이 열릴 때까지, 너는 사람이라기보다 관리 대상에 가깝다.",
    ],
    choices: [
      {
        label: "새 기록으로 다시 시작한다",
        to: "intake",
        effects: {},
        hint: "보급과 소음을 더 안정적으로 관리한다.",
        badge: "RETRY",
        tone: "official",
      },
    ],
    ending: {
      code: "quarantine",
      headline: "격리 또는 임무 실패",
      debrief: "귀환은 했지만 검문을 통과하지 못했고, 거주 자격도 보류됐다.",
      tags: ["Q-HOLD", "Quarantine", "Failure"],
      recommendation: "다음 시도에서는 병목 구간과 접촉 기록을 더 조용하게 처리하는 편이 낫다.",
    },
  },
};

function buildBootstrap(choiceIndexes: number[]): StoryBootstrap {
  const timeline: StoryLogEntry[] = [
    {
      nodeId: startNodeId,
      title: nodes[startNodeId].title,
      note: "여의도 임시 심사선에 등록됐다.",
    },
  ];

  let state = { ...initialState };
  let currentNodeId = startNodeId;

  choiceIndexes.forEach((choiceIndex, stepIndex) => {
    const currentNode = nodes[currentNodeId];
    const choice = currentNode.choices[choiceIndex];

    if (!choice) {
      throw new Error(
        `Invalid bootstrap choice ${choiceIndex} at step ${stepIndex + 1} for node "${currentNodeId}" in story-01`,
      );
    }

    const targetNode = nodes[choice.to];

    if (!targetNode) {
      throw new Error(`Missing bootstrap target "${choice.to}" from "${currentNodeId}" in story-01`);
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
        : `${targetNode.title} 구역에 진입했다.`,
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
  intake: [],
  "scan-corridor": [0],
  barracks: [0, 0],
  "courtyard-call": [0, 0, 0],
  "notice-board": [0, 0, 0, 0],
  briefing: [0, 0, 0, 0, 0],
  shutter: [0, 0, 0, 0, 0, 0],
  "night-gate": [0, 0, 0, 0, 0, 0, 0],
  "bridge-lock": [0, 0, 0, 0, 0, 0, 0, 0],
  arcade: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  "rooftop-check": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  collapse: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  contact: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "north-queue": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  recheck: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
  return: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "ending-clear": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "ending-debt": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  "ending-quarantine": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
};

const bootstrap = Object.fromEntries(
  Object.entries(bootstrapRoutes).map(([nodeId, route]) => [nodeId, buildBootstrap(route)]),
) as Record<string, StoryBootstrap>;

export const story1: StoryDefinition = {
  id: "story-01",
  routeId: "1",
  version: "1.1.0",
  nodeOrder: [
    "intake",
    "scan-corridor",
    "barracks",
    "courtyard-call",
    "notice-board",
    "briefing",
    "shutter",
    "night-gate",
    "bridge-lock",
    "arcade",
    "rooftop-check",
    "collapse",
    "contact",
    "north-queue",
    "recheck",
    "return",
  ],
  title: "스토리 1 · 여의도 입성",
  tagline: "이름이 등록된 첫 밤, 거주 자격과 귀환 판정이 동시에 걸린다.",
  routeBase: "/story/1",
  startNodeId,
  initialState,
  assets: story1Assets,
  nodes,
  bootstrap,
};
