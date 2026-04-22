import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CHAPTER_DIR = path.join(ROOT, "private", "content", "data", "chapters");
const TARGETS = ["ch06", "ch07", "ch08", "ch09", "ch10"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function eventMap(chapter) {
  const map = new Map();
  for (const ev of chapter.events ?? []) {
    map.set(ev.event_id, ev);
  }
  return map;
}

function replaceSpeakerPlaceholders(node, speaker) {
  if (typeof node === "string") {
    return node.replace(/^\?\?\?:\s*/u, `${speaker}: `);
  }
  if (Array.isArray(node)) {
    return node.map((item) => replaceSpeakerPlaceholders(item, speaker));
  }
  if (node && typeof node === "object") {
    const next = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === "speaker_label" && value === "???") {
        next[key] = speaker;
      } else {
        next[key] = replaceSpeakerPlaceholders(value, speaker);
      }
    }
    return next;
  }
  return node;
}

function setResultEventText(ev, payload) {
  if (!ev) return;
  ev.text.summary = payload.summary;
  ev.text.body = payload.body;
  ev.text.scene_blocks = payload.scene_blocks;
  ev.text.carry_line = payload.carry_line;
  if (Array.isArray(ev.choices) && Array.isArray(payload.choice_previews)) {
    for (let i = 0; i < ev.choices.length; i += 1) {
      if (payload.choice_previews[i]) {
        ev.choices[i].preview = payload.choice_previews[i];
      }
    }
  }
}

function patchCh06(chapter) {
  const map = eventMap(chapter);
  const speaker = "한소명";

  setResultEventText(map.get("EV_CH06_RESULT"), {
    summary: "하강 관문의 충돌이 끝나자 누가 문 안으로 들어갔고 누가 문턱에 남았는지가 같은 기록지에 고정됐다.",
    body: [
      "무너진 차단봉 아래로 물이 빠져나간 자리에는 갈라진 대기열과 서로 다른 표정만 남았다.",
      "한소명: 선택은 끝났어. 이제 중요한 건 이 기준이 다음 관문에서도 같은 얼굴을 밀어낼 수 있다는 사실을 잊지 않는 거야.",
      "남겨진 사람: 보호자와 잔류 사무원, 대기열 끝의 노인. 지워진 흔적: 빗물에 번진 임시 통행표. 기록된 장면: 같은 문턱을 두고 갈라진 손목띠와 빈손."
    ],
    scene_blocks: [
      {
        block_id: "b_sn84uc",
        kind: "narration",
        lines: ["무너진 차단봉 아래로 물이 빠져나간 자리에는 갈라진 대기열과 서로 다른 표정만 남았다."]
      },
      {
        block_id: "b_7320h8",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["선택은 끝났어.", "이제 중요한 건 이 기준이 다음 관문에서도 같은 얼굴을 밀어낼 수 있다는 사실을 잊지 않는 거야."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_eh24kk",
        kind: "narration",
        lines: ["남겨진 사람: 보호자와 잔류 사무원, 대기열 끝의 노인. 지워진 흔적: 빗물에 번진 임시 통행표. 기록된 장면: 같은 문턱을 두고 갈라진 손목띠와 빈손."]
      }
    ],
    carry_line: "하강 관문의 기준은 확정됐고, 그 기준에서 밀려난 얼굴도 함께 다음 장면으로 넘어간다.",
    choice_previews: [
      "검문 질서를 기준으로 다음 관문 기록을 고정한다.",
      "우회선을 연 대가와 생존 이득을 함께 넘긴다.",
      "목격 기록을 남겨 다음 관문의 판정 근거로 삼는다."
    ]
  });

  setResultEventText(map.get("EV_CH06_RESULT_OFFICIAL"), {
    summary: "검문 질서를 먼저 세운 선택은 줄을 안정시켰지만 줄 바깥 사람의 상실도 더 또렷하게 남겼다.",
    body: [
      "도장과 순번이 복구되자 이동은 안정됐지만, 도장 밖 이름들은 같은 속도로 문밖으로 밀려났다.",
      "한소명: 질서를 세운 건 맞아. 하지만 오늘 잘린 줄이 내일도 같은 사람을 자를 수 있다는 걸 잊지 마.",
      "남겨진 사람: 늦게 도착한 가족과 손목띠 없는 대기열. 지워진 흔적: 폐기 처리된 임시 카드. 기록된 장면: 통과 도장을 받은 손과 난간에 남은 손."
    ],
    scene_blocks: [
      {
        block_id: "b_bvmbv5",
        kind: "narration",
        lines: ["도장과 순번이 복구되자 이동은 안정됐지만, 도장 밖 이름들은 같은 속도로 문밖으로 밀려났다."]
      },
      {
        block_id: "b_59j2gj",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["질서를 세운 건 맞아.", "하지만 오늘 잘린 줄이 내일도 같은 사람을 자를 수 있다는 걸 잊지 마."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_icby7s",
        kind: "narration",
        lines: ["남겨진 사람: 늦게 도착한 가족과 손목띠 없는 대기열. 지워진 흔적: 폐기 처리된 임시 카드. 기록된 장면: 통과 도장을 받은 손과 난간에 남은 손."]
      }
    ],
    carry_line: "질서는 회복됐지만, 질서 밖으로 밀린 사람의 표정도 함께 남았다.",
    choice_previews: ["질서 중심 결과를 다음 챕터 기준으로 고정한다."]
  });

  setResultEventText(map.get("EV_CH06_RESULT_BROKER"), {
    summary: "배수관 우회 개방은 더 많은 이동을 만들었지만, 그 이동의 비용을 누가 떠안는지도 즉시 드러났다.",
    body: [
      "우회선은 살아났고 몇몇 가족은 빠져나갔지만, 우회 표식이 없는 줄은 더 깊은 물가에 남겨졌다.",
      "한소명: 사람을 더 움직였다는 말은 절반만 맞아. 못 탄 사람에게 그건 또 다른 방식의 배제일 수 있어.",
      "남겨진 사람: 우회 표식 없는 노인과 빈손 보호자. 지워진 흔적: 찢긴 임시 통행권. 기록된 장면: 열린 배수관과 닫힌 원줄의 간격."
    ],
    scene_blocks: [
      {
        block_id: "b_99lj7k",
        kind: "narration",
        lines: ["우회선은 살아났고 몇몇 가족은 빠져나갔지만, 우회 표식이 없는 줄은 더 깊은 물가에 남겨졌다."]
      },
      {
        block_id: "b_7gqa03",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["사람을 더 움직였다는 말은 절반만 맞아.", "못 탄 사람에게 그건 또 다른 방식의 배제일 수 있어."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_jj43cy",
        kind: "narration",
        lines: ["남겨진 사람: 우회 표식 없는 노인과 빈손 보호자. 지워진 흔적: 찢긴 임시 통행권. 기록된 장면: 열린 배수관과 닫힌 원줄의 간격."]
      }
    ],
    carry_line: "우회선은 열렸고, 우회선 바깥에 남은 줄의 무게도 함께 커졌다.",
    choice_previews: ["우회 개방 결과를 다음 챕터 이동 조건으로 넘긴다."]
  });

  setResultEventText(map.get("EV_CH06_RESULT_WITNESS"), {
    summary: "목격 기록을 남긴 선택은 속도를 줄였지만 누가 밀려났는지 숨길 수 없게 만들었다.",
    body: [
      "관문 벽면에는 통과자보다 탈락자의 이름이 더 오래 남았고, 그 기록은 다음 판단의 기준이 됐다.",
      "한소명: 오늘 못 보낸 사람을 내일 다시 부를 수 있는 건 이런 기록 덕분이야. 대신 이 기록을 넘긴 사람도 오늘 여기 남는다.",
      "남겨진 사람: 증언을 건넨 연락원과 보호자. 지워진 흔적: 젖은 검문 스티커. 기록된 장면: 벽면 이름표와 손바닥 자국."
    ],
    scene_blocks: [
      {
        block_id: "b_7qdk0n",
        kind: "narration",
        lines: ["관문 벽면에는 통과자보다 탈락자의 이름이 더 오래 남았고, 그 기록은 다음 판단의 기준이 됐다."]
      },
      {
        block_id: "b_cd19i6",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["오늘 못 보낸 사람을 내일 다시 부를 수 있는 건 이런 기록 덕분이야.", "대신 이 기록을 넘긴 사람도 오늘 여기 남는다."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_651udi",
        kind: "narration",
        lines: ["남겨진 사람: 증언을 건넨 연락원과 보호자. 지워진 흔적: 젖은 검문 스티커. 기록된 장면: 벽면 이름표와 손바닥 자국."]
      }
    ],
    carry_line: "증언 기록은 살아남았고, 기록을 남긴 사람의 부재도 함께 각인됐다.",
    choice_previews: ["기록 중심 결과를 다음 챕터 증언 체계로 연결한다."]
  });

  chapter.events = chapter.events.map((ev) => replaceSpeakerPlaceholders(ev, speaker));
}

function patchCh07(chapter) {
  const map = eventMap(chapter);
  const speaker = "정노아";

  setResultEventText(map.get("EV_CH07_RESULT"), {
    summary: "적색 회랑의 충돌이 끝나자 누가 명단 안에 남고 누가 벽면으로 밀렸는지가 같은 조명 아래에서 갈라졌다.",
    body: [
      "회랑 끝의 문은 닫혔고, 문 안쪽의 통과자보다 문 바깥 대기열의 표정이 더 길게 남았다.",
      "정노아: 어떤 노선을 골라도 누군가는 이 복도 바깥으로 밀려나. 중요한 건 그 얼굴을 지우지 않는 거야.",
      "남겨진 사람: 벽면 명단 끝의 보호자와 무표식 호송병. 지워진 흔적: 찢긴 호송 확인표. 기록된 장면: 빨간 비상등 아래 갈라진 두 줄."
    ],
    scene_blocks: [
      {
        block_id: "b_ch07_result_n1",
        kind: "narration",
        lines: ["회랑 끝의 문은 닫혔고, 문 안쪽의 통과자보다 문 바깥 대기열의 표정이 더 길게 남았다."]
      },
      {
        block_id: "b_ch07_result_d1",
        kind: "dialogue",
        speaker_id: "npc_jung_noah",
        speaker_label: "정노아",
        lines: ["어떤 노선을 골라도 누군가는 이 복도 바깥으로 밀려나.", "중요한 건 그 얼굴을 지우지 않는 거야."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_ch07_result_n2",
        kind: "narration",
        lines: ["남겨진 사람: 벽면 명단 끝의 보호자와 무표식 호송병. 지워진 흔적: 찢긴 호송 확인표. 기록된 장면: 빨간 비상등 아래 갈라진 두 줄."]
      }
    ],
    carry_line: "적색 회랑의 선택은 끝났고, 누가 벽에 남았는지가 다음 관문의 첫 문장이 됐다.",
    choice_previews: [
      "명단 우선의 대가를 안고 다음 챕터로 이동한다.",
      "호송 우선의 대가를 안고 다음 챕터로 이동한다.",
      "증언 우선의 대가를 안고 다음 챕터로 이동한다."
    ]
  });

  setResultEventText(map.get("EV_CH07_RESULT_OFFICIAL"), {
    summary: "명단 보호를 우선한 결과, 줄의 질서는 복구됐지만 줄 바깥 이름도 같은 속도로 늘어났다.",
    body: [
      "명단 봉인은 지켜졌고 통과 흐름은 안정됐지만, 늦게 도착한 사람들의 이름은 벽에 남았다.",
      "정노아: 질서가 필요하다는 건 알아. 하지만 질서가 같은 얼굴만 계속 잘라내면 그건 규칙이 아니라 습관이 돼.",
      "남겨진 사람: 벽면 마지막 번호의 가족. 지워진 흔적: 덧칠된 이름표. 기록된 장면: 봉인된 명단과 봉인 밖 대기열."
    ],
    scene_blocks: [
      {
        block_id: "b_ch07_result_off_n1",
        kind: "narration",
        lines: ["명단 봉인은 지켜졌고 통과 흐름은 안정됐지만, 늦게 도착한 사람들의 이름은 벽에 남았다."]
      },
      {
        block_id: "b_ch07_result_off_d1",
        kind: "dialogue",
        speaker_id: "npc_jung_noah",
        speaker_label: "정노아",
        lines: ["질서가 필요하다는 건 알아.", "하지만 질서가 같은 얼굴만 계속 잘라내면 그건 규칙이 아니라 습관이 돼."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_ch07_result_off_n2",
        kind: "narration",
        lines: ["남겨진 사람: 벽면 마지막 번호의 가족. 지워진 흔적: 덧칠된 이름표. 기록된 장면: 봉인된 명단과 봉인 밖 대기열."]
      }
    ],
    carry_line: "명단은 지켜졌고, 명단 밖 얼굴도 같은 벽에 고정됐다.",
    choice_previews: ["명단 중심 결과를 다음 기록으로 확정한다."]
  });

  setResultEventText(map.get("EV_CH07_RESULT_BROKER"), {
    summary: "호송선 우선 선택은 이동량을 살렸지만, 이동에서 밀린 사람의 상실도 더 선명하게 만들었다.",
    body: [
      "복도 옆 호송선이 열리며 더 많은 몸이 빠져나갔지만, 호송선 끝에서 잘린 줄은 더 길어졌다.",
      "정노아: 오늘 많이 보냈다는 말이 내일의 면죄부가 되진 않아. 못 보낸 사람은 오늘 밤 그대로 남아.",
      "남겨진 사람: 호송선 끝에서 끊긴 보호자. 지워진 흔적: 임시 호송 표식. 기록된 장면: 열린 통로와 닫힌 마지막 칸."
    ],
    scene_blocks: [
      {
        block_id: "b_ch07_result_bro_n1",
        kind: "narration",
        lines: ["복도 옆 호송선이 열리며 더 많은 몸이 빠져나갔지만, 호송선 끝에서 잘린 줄은 더 길어졌다."]
      },
      {
        block_id: "b_ch07_result_bro_d1",
        kind: "dialogue",
        speaker_id: "npc_jung_noah",
        speaker_label: "정노아",
        lines: ["오늘 많이 보냈다는 말이 내일의 면죄부가 되진 않아.", "못 보낸 사람은 오늘 밤 그대로 남아."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_ch07_result_bro_n2",
        kind: "narration",
        lines: ["남겨진 사람: 호송선 끝에서 끊긴 보호자. 지워진 흔적: 임시 호송 표식. 기록된 장면: 열린 통로와 닫힌 마지막 칸."]
      }
    ],
    carry_line: "호송선은 살아났고, 끝칸에서 밀려난 얼굴의 기억도 커졌다.",
    choice_previews: ["호송 우선 결과를 다음 기록으로 확정한다."]
  });

  setResultEventText(map.get("EV_CH07_RESULT_WITNESS"), {
    summary: "증언 줄을 붙든 선택은 속도를 잃었지만 누구를 벽에 남겼는지 숨기지 않게 만들었다.",
    body: [
      "두 겹 명단이 완성되자 회랑은 더 느려졌고, 대신 배제의 경로를 누구도 부정할 수 없게 됐다.",
      "정노아: 느려져도 괜찮아. 오늘 잘린 이름을 내일 다시 부를 수 있게 만드는 게 지금 우리가 지킬 최소선이야.",
      "남겨진 사람: 증언을 남기고 대기열로 돌아간 연락원. 지워진 흔적: 긁힌 검문 도장. 기록된 장면: 벽면의 이름과 멈춘 발자국."
    ],
    scene_blocks: [
      {
        block_id: "b_ch07_result_wit_n1",
        kind: "narration",
        lines: ["두 겹 명단이 완성되자 회랑은 더 느려졌고, 대신 배제의 경로를 누구도 부정할 수 없게 됐다."]
      },
      {
        block_id: "b_ch07_result_wit_d1",
        kind: "dialogue",
        speaker_id: "npc_jung_noah",
        speaker_label: "정노아",
        lines: ["느려져도 괜찮아.", "오늘 잘린 이름을 내일 다시 부를 수 있게 만드는 게 지금 우리가 지킬 최소선이야."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_ch07_result_wit_n2",
        kind: "narration",
        lines: ["남겨진 사람: 증언을 남기고 대기열로 돌아간 연락원. 지워진 흔적: 긁힌 검문 도장. 기록된 장면: 벽면의 이름과 멈춘 발자국."]
      }
    ],
    carry_line: "증언 줄은 유지됐고, 그 증언을 남긴 사람의 상실도 함께 기록됐다.",
    choice_previews: ["증언 우선 결과를 다음 기록으로 확정한다."]
  });

  chapter.events = chapter.events.map((ev) => replaceSpeakerPlaceholders(ev, speaker));
}

function patchCh08(chapter) {
  const map = eventMap(chapter);
  const speaker = "한소명";

  chapter.title = "봉쇄선의 방";
  chapter.role = "2부의 분기 중심 챕터. 죽은 행정실에서 장부, 위조 패스, 증언 사본 중 무엇을 우선할지 결정해 다음 항만의 기준을 고정한다.";

  if (Array.isArray(chapter.objectives)) {
    if (chapter.objectives[0]) chapter.objectives[0].text = "죽은 행정실 내부로 진입해 핵심 자료를 확보한다.";
    if (chapter.objectives[2]) chapter.objectives[2].text = "장부 앵커를 확보하고 분기 기준을 고정한다.";
    if (chapter.objectives[4]) chapter.objectives[4].text = "현장 작업 2개를 수행해 후속 판정 자원을 만든다.";
    if (chapter.objectives[7]) chapter.objectives[7].text = "결과 기록을 정리하고 다음 챕터로 연결한다.";
  }

  if (Array.isArray(chapter.quest_tracks)) {
    if (chapter.quest_tracks[0]) {
      chapter.quest_tracks[0].title = "장부 봉인 회수";
      chapter.quest_tracks[0].summary = "찢긴 봉인 장부를 회수해 누가 명단 바깥으로 밀렸는지 추적한다.";
    }
    if (chapter.quest_tracks[3]) chapter.quest_tracks[3].summary = "위조 패스 유통선을 확인해 통과 기준 왜곡 여부를 점검한다.";
    if (chapter.quest_tracks[4]) chapter.quest_tracks[4].summary = "증언 사본 보관함을 확보해 다음 챕터에 전달할 기록을 지킨다.";
  }

  if (Array.isArray(chapter.nodes)) {
    const labels = [
      ["백오피스 입구", "죽은 행정실 외곽 진입점."],
      ["장부 서랍실", "배신 장부와 봉인철을 찾는 구역."],
      ["위조 패스대", "통행 패스 위변조 흔적이 집중된 구역."],
      ["복사 기록실", "증언 사본과 인장 복제 기록 보관 구역."],
      ["봉쇄 제어실", "최종 충돌 직전 기준선을 확정하는 구역."]
    ];
    for (let i = 0; i < chapter.nodes.length && i < labels.length; i += 1) {
      chapter.nodes[i].name = labels[i][0];
      chapter.nodes[i].description = labels[i][1];
    }
  }

  if (map.get("EV_CH08_ENTRY")) map.get("EV_CH08_ENTRY").title = "죽은 행정실 진입";
  if (map.get("EV_CH08_BOSS")) map.get("EV_CH08_BOSS").title = "봉쇄 제어실 충돌";
  if (map.get("EV_CH08_RESULT")) map.get("EV_CH08_RESULT").title = "봉쇄선 결과 정리";

  setResultEventText(map.get("EV_CH08_RESULT"), {
    summary: "봉쇄선의 방 충돌이 끝나자 어떤 기준을 살렸는지와 어떤 얼굴을 밀어냈는지가 동시에 확정됐다.",
    body: [
      "장부철과 사본 상자, 위조 패스 뭉치가 바닥에 흩어진 뒤에도 누가 통과할 수 있는지는 더 좁아졌다.",
      "한소명: 여기서 고른 기준은 다음 항만에서도 반복될 거야. 그래서 오늘 누가 잘렸는지를 끝까지 남겨야 해.",
      "남겨진 사람: 봉인 바깥 대기열의 보호자와 전달원. 지워진 흔적: 파쇄된 인장표. 기록된 장면: 열린 서랍과 닫힌 출입문."
    ],
    scene_blocks: [
      {
        block_id: "b_g7rrvo",
        kind: "narration",
        lines: ["장부철과 사본 상자, 위조 패스 뭉치가 바닥에 흩어진 뒤에도 누가 통과할 수 있는지는 더 좁아졌다."]
      },
      {
        block_id: "b_4ujby8",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["여기서 고른 기준은 다음 항만에서도 반복될 거야.", "그래서 오늘 누가 잘렸는지를 끝까지 남겨야 해."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_nqqidy",
        kind: "narration",
        lines: ["남겨진 사람: 봉인 바깥 대기열의 보호자와 전달원. 지워진 흔적: 파쇄된 인장표. 기록된 장면: 열린 서랍과 닫힌 출입문."]
      }
    ],
    carry_line: "봉쇄선의 기준은 확정됐고, 잘린 이름의 기록도 함께 다음 장면으로 넘어간다.",
    choice_previews: [
      "배신 장부 중심 판정을 확정해 다음 챕터로 넘긴다.",
      "위조 패스 확장 판정을 확정해 다음 챕터로 넘긴다.",
      "증언 사본 유지 판정을 확정해 다음 챕터로 넘긴다."
    ]
  });

  setResultEventText(map.get("EV_CH08_RESULT_OFFICIAL"), {
    summary: "배신 장부를 확보한 선택은 공식 기준을 되살렸지만 장부 밖 사람의 상실도 더 명확해졌다.",
    body: [
      "원본 장부가 복구되자 통과 기준은 선명해졌고, 동시에 기준 밖 인원은 더 빠르게 탈락 처리됐다.",
      "한소명: 기준을 되살린 건 맞아. 하지만 기준 밖으로 밀린 사람을 기록하지 않으면 같은 배제가 반복돼.",
      "남겨진 사람: 인장 미일치 대기열. 지워진 흔적: 폐기된 위조 패스. 기록된 장면: 원본 장부와 잘려 나간 이름열."
    ],
    scene_blocks: [
      {
        block_id: "b_oetkff",
        kind: "narration",
        lines: ["원본 장부가 복구되자 통과 기준은 선명해졌고, 동시에 기준 밖 인원은 더 빠르게 탈락 처리됐다."]
      },
      {
        block_id: "b_rcyuwu",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["기준을 되살린 건 맞아.", "하지만 기준 밖으로 밀린 사람을 기록하지 않으면 같은 배제가 반복돼."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_dq125c",
        kind: "narration",
        lines: ["남겨진 사람: 인장 미일치 대기열. 지워진 흔적: 폐기된 위조 패스. 기록된 장면: 원본 장부와 잘려 나간 이름열."]
      }
    ],
    carry_line: "원본 장부는 지켜졌고, 장부 밖으로 밀린 얼굴도 같이 고정됐다.",
    choice_previews: ["장부 우선 결과를 다음 기록으로 넘긴다."]
  });

  setResultEventText(map.get("EV_CH08_RESULT_BROKER"), {
    summary: "위조 패스를 확장한 선택은 이동량을 높였지만 기준의 신뢰를 빠르게 잠식했다.",
    body: [
      "패스는 더 많이 통과했지만 누가 정당하게 통과했는지 구분이 무너지며 불신이 번졌다.",
      "한소명: 길이 넓어진다고 모두가 안전해지는 건 아니야. 불신이 커지면 다음 문은 더 세게 닫혀.",
      "남겨진 사람: 패스 미발급 대기열. 지워진 흔적: 취소 처리된 통과 인장. 기록된 장면: 늘어난 통과선과 늘어난 반송선."
    ],
    scene_blocks: [
      {
        block_id: "b_j6h34b",
        kind: "narration",
        lines: ["패스는 더 많이 통과했지만 누가 정당하게 통과했는지 구분이 무너지며 불신이 번졌다."]
      },
      {
        block_id: "b_h1djav",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["길이 넓어진다고 모두가 안전해지는 건 아니야.", "불신이 커지면 다음 문은 더 세게 닫혀."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_d1g0jb",
        kind: "narration",
        lines: ["남겨진 사람: 패스 미발급 대기열. 지워진 흔적: 취소 처리된 통과 인장. 기록된 장면: 늘어난 통과선과 늘어난 반송선."]
      }
    ],
    carry_line: "이동량은 늘었고, 통과 기준에 대한 불신도 같은 속도로 커졌다.",
    choice_previews: ["패스 확장 결과를 다음 기록으로 넘긴다."]
  });

  setResultEventText(map.get("EV_CH08_RESULT_WITNESS"), {
    summary: "증언 사본을 지킨 선택은 속도를 희생했지만 배제의 근거를 공개 상태로 남겼다.",
    body: [
      "복사 기록실의 사본이 살아남자 누가 어떤 인장에서 잘렸는지를 다음 관문도 확인할 수 있게 됐다.",
      "한소명: 오늘 다 못 보내도 괜찮아. 적어도 누가 잘렸는지 숨기지 않으면 내일 다시 부를 수 있어.",
      "남겨진 사람: 사본 전달을 맡은 연락원. 지워진 흔적: 파쇄된 원본 일부. 기록된 장면: 손에 남은 복사 잉크와 봉인된 문."
    ],
    scene_blocks: [
      {
        block_id: "b_02ck29",
        kind: "narration",
        lines: ["복사 기록실의 사본이 살아남자 누가 어떤 인장에서 잘렸는지를 다음 관문도 확인할 수 있게 됐다."]
      },
      {
        block_id: "b_h5vm00",
        kind: "dialogue",
        speaker_id: "npc_han_somyeong",
        speaker_label: "한소명",
        lines: ["오늘 다 못 보내도 괜찮아.", "적어도 누가 잘렸는지 숨기지 않으면 내일 다시 부를 수 있어."],
        emphasis: "선택의 대가가 얼굴로 남는 장면"
      },
      {
        block_id: "b_hhibrx",
        kind: "narration",
        lines: ["남겨진 사람: 사본 전달을 맡은 연락원. 지워진 흔적: 파쇄된 원본 일부. 기록된 장면: 손에 남은 복사 잉크와 봉인된 문."]
      }
    ],
    carry_line: "증언 사본은 살아남았고, 그 사본을 지킨 사람의 상실도 함께 기록됐다.",
    choice_previews: ["증언 사본 결과를 다음 기록으로 넘긴다."]
  });

  chapter.events = chapter.events.map((ev) => replaceSpeakerPlaceholders(ev, speaker));
}

function patchCh09(chapter) {
  const map = eventMap(chapter);
  if (map.get("EV_CH09_RESULT_OFFICIAL")) {
    map.get("EV_CH09_RESULT_OFFICIAL").text.carry_line = "승선 기준은 지켜졌지만, 기준 밖으로 밀린 얼굴도 같은 철문 앞에 남았다.";
  }
  if (map.get("EV_CH09_RESULT_BROKER")) {
    map.get("EV_CH09_RESULT_BROKER").text.carry_line = "보급은 지켜냈고, 그 보급을 위해 남겨진 사람의 표정도 함께 각인됐다.";
  }
  if (map.get("EV_CH09_RESULT_WITNESS")) {
    map.get("EV_CH09_RESULT_WITNESS").text.carry_line = "증언은 살아남았고, 증언을 건넨 사람이 문턱에 남은 장면도 같이 넘어간다.";
  }
}

function patchCh10(chapter) {
  const map = eventMap(chapter);
  const speaker = "서진서";
  const entry = map.get("EV_CH10_ENTRY");
  if (entry) {
    entry.text.summary = "침하 항만의 마지막 선적선 앞에서 누구를 태우고 누구를 남길지에 대한 최종 기준을 확정해야 한다.";
    entry.text.body = [
      "부두 조명 아래 공표문, 계약선 목록, 증언 묶음이 동시에 펼쳐지며 마지막 선택의 무게가 한꺼번에 내려앉았다.",
      "서진서: 마지막 기준은 하나만 남길 수 있어. 무엇을 지키든 다른 둘의 비용은 네가 함께 들고 가야 해.",
      "난간 바깥의 대기열은 이미 결과를 예감한 얼굴로 부두 끝을 바라보고 있었다."
    ];
    entry.text.scene_blocks = [
      {
        block_id: "b_njsntd",
        kind: "narration",
        lines: ["부두 조명 아래 공표문, 계약선 목록, 증언 묶음이 동시에 펼쳐지며 마지막 선택의 무게가 한꺼번에 내려앉았다."]
      },
      {
        block_id: "b_qmc10t",
        kind: "dialogue",
        speaker_id: "npc_seo_jinseo",
        speaker_label: "서진서",
        lines: ["마지막 기준은 하나만 남길 수 있어.", "무엇을 지키든 다른 둘의 비용은 네가 함께 들고 가야 해."],
        emphasis: "최종 판정 직전의 압축된 장면"
      },
      {
        block_id: "b_kwsba3",
        kind: "narration",
        lines: ["난간 바깥의 대기열은 이미 결과를 예감한 얼굴로 부두 끝을 바라보고 있었다."]
      }
    ];
    entry.text.carry_line = "최종 기준을 고르는 순간, 누가 배를 타고 누가 남는지가 사실상 결정된다.";
    if (Array.isArray(entry.choices) && entry.choices.length >= 3) {
      entry.choices[0].label = "공개 기준을 우선 고정한다";
      entry.choices[0].preview = "공표문과 줄 순서를 우선해 승인 기준의 일관성을 지킨다.";
      entry.choices[1].label = "계약선 이동량을 우선한다";
      entry.choices[1].preview = "실제 이송 수를 높이되 기준의 균열을 감수한다.";
      entry.choices[2].label = "증언 탈출선을 우선한다";
      entry.choices[2].preview = "기록을 보존해 다음 관문에서 다시 부를 근거를 남긴다.";
    }
  }

  const fixChoice = (eventId, labels, previews) => {
    const ev = map.get(eventId);
    if (!ev || !Array.isArray(ev.choices)) return;
    for (let i = 0; i < ev.choices.length; i += 1) {
      if (labels[i]) ev.choices[i].label = labels[i];
      if (previews[i]) ev.choices[i].preview = previews[i];
    }
  };

  fixChoice(
    "EV_CH10_RESULT_OFFICIAL",
    ["공개 호송 체계로 마감한다", "통제형 수송선으로 마감한다", "침하 기록 봉인으로 마감한다"],
    ["공개 기준의 대가와 효율을 함께 기록해 넘긴다.", "통제 중심 이동량을 다음 챕터 조건으로 넘긴다.", "봉인 기록을 남겨 후속 판정의 근거로 고정한다."]
  );
  fixChoice(
    "EV_CH10_RESULT_BROKER",
    ["브로커 이동선 확장으로 마감한다", "침하 구역 잔류 통제로 마감한다"],
    ["이송량 중심 판정을 확정하되 배제 비용도 함께 남긴다.", "잔류 통제 판정을 확정해 다음 구간 압력으로 넘긴다."]
  );
  fixChoice(
    "EV_CH10_RESULT_WITNESS",
    ["증언 탈출선 유지로 마감한다", "침하 잔류 기록 보존으로 마감한다"],
    ["증언선 유지 판정을 확정해 후속 관문 근거로 사용한다.", "남겨진 인원 기록을 보존해 다음 챕터로 연결한다."]
  );

  chapter.events = chapter.events.map((ev) => replaceSpeakerPlaceholders(ev, speaker));
}

function collectUnknownPaths(node, basePath = []) {
  const out = [];
  if (typeof node === "string") {
    if (node.includes("??") || node.includes("???")) {
      out.push(basePath.join("."));
    }
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((item, idx) => out.push(...collectUnknownPaths(item, [...basePath, `[${idx}]`])));
    return out;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      out.push(...collectUnknownPaths(value, [...basePath, key]));
    }
  }
  return out;
}

for (const chapterName of TARGETS) {
  const filePath = path.join(CHAPTER_DIR, `${chapterName}.json`);
  const chapter = readJson(filePath);
  if (chapterName === "ch06") patchCh06(chapter);
  if (chapterName === "ch07") patchCh07(chapter);
  if (chapterName === "ch08") patchCh08(chapter);
  if (chapterName === "ch09") patchCh09(chapter);
  if (chapterName === "ch10") patchCh10(chapter);
  writeJson(filePath, chapter);
}

let violations = 0;
for (const chapterName of TARGETS) {
  const filePath = path.join(CHAPTER_DIR, `${chapterName}.json`);
  const chapter = readJson(filePath);
  const unknownPaths = collectUnknownPaths(chapter);
  if (unknownPaths.length > 0) {
    violations += unknownPaths.length;
    console.log(`\n[${chapterName}] unresolved placeholder paths:`);
    for (const p of unknownPaths) {
      console.log(`- ${p}`);
    }
  }
}

if (violations > 0) {
  console.error(`\nUnresolved placeholders: ${violations}`);
  process.exit(1);
}

console.log("CH06~CH10 placeholder cleanup completed.");
