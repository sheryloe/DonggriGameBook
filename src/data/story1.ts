import { StoryDefinition } from "../types/story";

export const story1: StoryDefinition = {
  id: "1",
  title: "Story 1 - Night Intake",
  startNodeId: "intake",
  initialState: {
    supplies: 6,
    noise: 2
  },
  nodes: {
    intake: {
      id: "intake",
      title: "행정동 입구",
      description:
        "야간 점검 명령서가 도착했다. 보급품과 소음을 관리하며 폐쇄 구역 게이트까지 이동해야 한다.",
      asset: { kind: "ambient", tone: "cold-office" },
      choices: [
        {
          id: "check-rations",
          label: "보급품 재정비 후 이동",
          nextNodeId: "night-gate",
          effects: { supplies: 1, noise: -2 }
        },
        {
          id: "rush-move",
          label: "빠르게 이동한다",
          nextNodeId: "night-gate",
          effects: { supplies: -1, noise: 2 }
        }
      ]
    },
    "night-gate": {
      id: "night-gate",
      title: "야간 출입 게이트",
      description:
        "게이트 센서가 민감하다. 소음이 높으면 즉시 경보가 울리고, 낮으면 통과 가능하다.",
      asset: { kind: "ambient", tone: "night-pressure" },
      choices: [
        {
          id: "careful-pass",
          label: "센서를 우회해 조용히 통과",
          nextNodeId: "ending-clear",
          requirements: { noise: 1 },
          effects: { supplies: -1, noise: -1 }
        },
        {
          id: "force-open",
          label: "강제로 개방하고 돌파",
          nextNodeId: "ending-fail",
          effects: { supplies: -2, noise: 3 }
        }
      ]
    },
    "ending-clear": {
      id: "ending-clear",
      title: "작전 완료",
      description: "경보 없이 구역을 통과했다. 야간 조사 팀이 후속 탐사를 시작한다.",
      asset: { kind: "ambient", tone: "quiet-success" },
      ending: {
        title: "Clear",
        outcome: "clear",
        body: "보급과 소음을 안정적으로 관리해 임무를 완료했다."
      },
      choices: [
        {
          id: "restart",
          label: "Story 1 다시 시작",
          nextNodeId: "intake"
        }
      ]
    },
    "ending-fail": {
      id: "ending-fail",
      title: "경보 발령",
      description: "센서가 과부하되어 임무가 중단됐다.",
      asset: { kind: "ambient", tone: "alarm" },
      ending: {
        title: "Fail",
        outcome: "fail",
        body: "소음 누적으로 탐지되었다. 접근 방식을 다시 설계해야 한다."
      },
      choices: [
        {
          id: "retry",
          label: "체계를 정비하고 재시도",
          nextNodeId: "intake",
          effects: { supplies: 1, noise: -2 }
        }
      ]
    }
  }
};
