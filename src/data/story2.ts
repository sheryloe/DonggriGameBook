import { StoryDefinition } from "../types/story";

export const story2: StoryDefinition = {
  id: "2",
  title: "Story 2 - Dispatch Control",
  startNodeId: "dispatch",
  initialState: {
    supplies: 5,
    noise: 3
  },
  nodes: {
    dispatch: {
      id: "dispatch",
      title: "지휘 통제실",
      description:
        "신규 지시가 내려왔다. Story 1과 동일한 상태 모델로 후속 파트를 운용한다.",
      asset: { kind: "ambient", tone: "control-room" },
      choices: [
        {
          id: "stable-route",
          label: "안정 경로로 전개",
          nextNodeId: "relay",
          effects: { supplies: -1, noise: -1 }
        },
        {
          id: "aggressive-route",
          label: "고속 전개",
          nextNodeId: "relay",
          effects: { supplies: -2, noise: 2 }
        }
      ]
    },
    relay: {
      id: "relay",
      title: "중계 지점",
      description: "중계소의 전력이 불안정하다. 소음이 낮을수록 송출 성공률이 높다.",
      asset: { kind: "ambient", tone: "tense" },
      choices: [
        {
          id: "secure-relay",
          label: "저소음 송출",
          nextNodeId: "ending-clear",
          requirements: { noise: 2 },
          effects: { supplies: -1, noise: -1 }
        },
        {
          id: "emergency-relay",
          label: "긴급 송출",
          nextNodeId: "ending-fail",
          effects: { supplies: -1, noise: 2 }
        }
      ]
    },
    "ending-clear": {
      id: "ending-clear",
      title: "송출 성공",
      description: "지시가 안전하게 전달되었다.",
      ending: {
        title: "Dispatch Clear",
        outcome: "clear",
        body: "후속 스토리 확장 가능한 런타임 구조를 검증했다."
      },
      choices: [
        {
          id: "restart",
          label: "Story 2 다시 시작",
          nextNodeId: "dispatch"
        }
      ]
    },
    "ending-fail": {
      id: "ending-fail",
      title: "송출 실패",
      description: "과도한 소음으로 송출 체계가 차단되었다.",
      ending: {
        title: "Dispatch Fail",
        outcome: "fail",
        body: "노이즈 관리 실패. 경로 전략을 조정해야 한다."
      },
      choices: [
        {
          id: "retry",
          label: "지휘실로 복귀",
          nextNodeId: "dispatch",
          effects: { noise: -2 }
        }
      ]
    }
  }
};
