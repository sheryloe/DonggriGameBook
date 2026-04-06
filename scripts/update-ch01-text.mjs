import fs from "fs";
import path from "path";

const filePath = path.join("codex_webgame_pack", "data", "chapters", "ch01.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const updates = {
  EV_CH01_BRIEFING: {
    summary: "윤해인이 폐방송동의 단파 증폭기와 송출 로그 회수를 지시한다.",
    body: [
      "사태 214일째, 기록국은 더 멀리 들리는 신호를 잡아낼 장비가 필요하다.",
      "윤해인은 이번 회수가 라디오망 복구의 첫 단추라며 단호하게 출발을 재촉한다."
    ]
  },
  EV_CH01_APPROACH: {
    summary: "잿길을 따라 폐방송동 외곽에 접근하며 기본 생존 루트를 점검한다.",
    body: [
      "재와 진흙이 뒤섞인 길, 멀리서 불규칙한 신호음이 들려온다.",
      "장비 점검과 소음 관리가 이 구역의 생존 조건이다."
    ]
  },
  EV_CH01_LOBBY_SEARCH: {
    summary: "멈춘 로비에서 내부 진입 루트를 확보한다.",
    body: [
      "로비는 침수와 파편으로 막혀 있고 안내 방송만 희미하게 반복된다.",
      "발자국과 금속 마찰 소리에 감염체가 반응한다."
    ]
  },
  EV_CH01_ARCHIVE_DECISION: {
    summary: "침수 자료실 진입을 결정하고 기록 보관함을 수색한다.",
    body: [
      "물에 잠긴 서고에서 방수 컨테이너가 반쯤 떠 있다.",
      "긴급 전력을 연결하면 로그를 추출할 수 있다."
    ]
  },
  EV_CH01_WRITER_RESCUE: {
    summary: "복도 끝 생존자와 접촉해 편집실 정보를 확보한다.",
    body: [
      "편집실 앞 복도에서 생존자가 비상등 아래 숨어 있다.",
      "그는 송신기 경로와 편집괴의 이동 루트를 알고 있다."
    ]
  },
  EV_CH01_ROOFTOP_SIGNAL: {
    summary: "옥상 송신기에 접근해 단파 증폭기 상태를 확인한다.",
    body: [
      "강한 바람과 잡음이 장비를 흔든다.",
      "증폭기는 살아 있지만 출력이 들쭉날쭉하다."
    ]
  },
  EV_CH01_BOSS_BROADCAST: {
    summary: "편집괴와 교전하며 송출 로그 회수의 분기점에 선다.",
    body: [
      "붕괴된 스튜디오에서 편집괴가 금속 프레임을 긁으며 돌진한다.",
      "이 싸움이 끝나야 로그와 증폭기를 들고 철수할 수 있다."
    ]
  },
  EV_CH01_EXTRACTION: {
    summary: "첫 귀환을 준비하며 회수물 상태를 점검한다.",
    body: [
      "침수 구간을 통과하며 확보한 장비를 되짚는다.",
      "윤해인의 교신이 짧게 끊겼다가 다시 돌아온다."
    ]
  },
  EV_CH01_SECURITY_OFFICE: {
    summary: "보안실 잔광을 수색해 방호 장비를 확인한다.",
    body: [
      "보안실 문틈에서 붉은 경광이 새어 나온다.",
      "남아 있는 장비는 제한적이지만 소음 억제에 도움이 된다."
    ]
  },
  EV_CH01_SIGNAL_CALIBRATION: {
    summary: "주파수 보정을 통해 송신기 출력을 안정화한다.",
    body: [
      "간이 스펙트럼을 맞추며 출력 곡선을 고정한다.",
      "노이즈가 줄어들자 교신이 선명해진다."
    ]
  },
  EV_CH01_SIGNAL_RELAY_DEFENSE: {
    summary: "중계기 주변을 방어해 보정 시간을 확보한다.",
    body: [
      "중계기 주변에 감염체가 몰려들며 구조물이 흔들린다.",
      "짧은 시간만 버티면 보정 작업이 끝난다."
    ]
  },
  EV_CH01_LOCKDOWN: {
    summary: "비상 봉쇄가 발생해 로비와 회랑이 차단된다.",
    body: [
      "자동 방호 셔터가 내려와 통로가 제한된다.",
      "우회 루트를 확보하는 것이 우선이다."
    ]
  },
  EV_CH01_ARCHIVE_AMBUSH: {
    summary: "기록 보관함 앞 매복을 회피하거나 돌파한다.",
    body: [
      "보관함 근처에 무너진 서가와 음산한 인기척이 있다.",
      "무리하게 돌파하면 소음이 급증한다."
    ]
  },
  EV_CH01_CORRIDOR_TRAP: {
    summary: "복도 함정을 해제해 통로를 확보한다.",
    body: [
      "바닥에 케이블이 늘어져 있고 문이 반쯤 잠겨 있다.",
      "걸리면 경보가 울릴 위험이 있다."
    ]
  },
  EV_CH01_CONTROL_RESTORE: {
    summary: "제어실을 복구해 내부 전력을 재가동한다.",
    body: [
      "제어실 콘솔은 젖어 있지만 수동 우회가 가능하다.",
      "전력을 올리면 엘리베이터와 기록 보관함이 살아난다."
    ]
  },
  EV_CH01_STUDIO_APPROACH: {
    summary: "스튜디오로 접근하며 편집괴의 흔적을 추적한다.",
    body: [
      "스튜디오 외곽에 긁힌 금속과 피 냄새가 섞여 있다.",
      "안쪽으로 갈수록 발신기는 불규칙한 고음으로 울린다."
    ]
  },
  EV_CH01_ESCAPE_RUN: {
    summary: "탈출을 위해 복도와 로비를 돌파한다.",
    body: [
      "회수물이 무게를 더해 움직임이 둔해졌다.",
      "짧은 거리라도 소음이 누적되면 위협이 커진다."
    ]
  },
  EV_CH01_SERVICE_TUNNEL: {
    summary: "서비스 터널로 진입해 비밀 루트를 확보한다.",
    body: [
      "정비용 터널은 어둡고 좁아 움직임이 느리다.",
      "대신 감염체의 시야에서 벗어날 수 있다."
    ]
  },
  EV_CH01_PATROL_AMBUSH: {
    summary: "순찰 감염체를 처리하거나 회피한다.",
    body: [
      "금속 소리를 따라 순찰체가 다가온다.",
      "공격을 허용하면 내구도가 빠르게 닳는다."
    ]
  },
  EV_CH01_POWER_RESET: {
    summary: "전력을 리셋해 송신기 라인을 복구한다.",
    body: [
      "전력 패널을 수동으로 올리면 불안정한 진동이 멈춘다.",
      "대신 소음이 순간적으로 폭증한다."
    ]
  },
  EV_CH01_EXTRACTION_PREP: {
    summary: "철수 준비를 마치고 탈출 경로를 정리한다.",
    body: [
      "확보물 묶음을 정리해 추적을 줄인다.",
      "윤해인의 교신으로 철수 시간을 재확인한다."
    ]
  },
  EV_CH01_CONCOURSE_SKIRMISH: {
    summary: "회랑에서 교전하며 통로를 확보한다.",
    body: [
      "회랑은 쓸려 나온 가구와 잔해로 가득하다.",
      "교전 없이 빠져나가면 물자 회수가 가능하다."
    ]
  },
  EV_CH01_ARCHIVE_VAULT: {
    summary: "기록 보관함 열쇠를 확보해 로그 추출을 가속한다.",
    body: [
      "잠금 장치 주변은 침수로 부식돼 있다.",
      "보관함 내부의 로그는 아직 건조 상태다."
    ]
  },
  EV_CH01_LOBBY_LOCKDOWN: {
    summary: "로비 락다운을 피해 외곽 루트로 우회한다.",
    body: [
      "락다운으로 정문이 봉쇄된다.",
      "비상 통로로 돌아가야 한다."
    ]
  },
  EV_CH01_ARCHIVE_KEYPAD: {
    summary: "침수 자료실 키패드를 해킹한다.",
    body: [
      "젖은 키패드는 반응이 느리다.",
      "짧은 코드 입력으로 잠금을 우회한다."
    ]
  },
  EV_CH01_STAIRWELL_AMBUSH: {
    summary: "계단실 매복을 회피하며 위층으로 진입한다.",
    body: [
      "계단실은 소리가 울려 감염체를 끌어들인다.",
      "천천히 올라가면 위험을 줄일 수 있다."
    ]
  },
  EV_CH01_ROOFTOP_CALIBRATION: {
    summary: "송신기 안정화를 마무리한다.",
    body: [
      "보정 결과가 안정권에 들어온다.",
      "이제 증폭기를 분리해도 교신이 유지된다."
    ]
  },
  EV_CH01_EXIT_CHECK: {
    summary: "철수 전에 장비 손상을 점검한다.",
    body: [
      "내구도와 탄약을 다시 확인한다.",
      "무리하면 복귀 루트에서 쓰러진다."
    ]
  },
  EV_CH01_SECURITY_CLEAR: {
    summary: "편집실 복도 매복을 정리한다.",
    body: [
      "편집실 앞 복도에 이상한 그림자가 맴돈다.",
      "정리하면 안전한 귀환 루트가 열린다."
    ]
  },
  EV_CH01_CACHE_SEARCH: {
    summary: "침수 캐시를 조사해 보급품을 확보한다.",
    body: [
      "물에 젖은 케이스가 구석에 숨겨져 있다.",
      "필터와 탄약이 남아 있다."
    ]
  },
  EV_CH01_POWER_RELAY: {
    summary: "송신기 릴레이를 복구해 출력 안정성을 높인다.",
    body: [
      "릴레이 박스에 결로가 차 있다.",
      "교체 후 출력이 안정된다."
    ]
  },
  EV_CH01_CONCOURSE_SCAVENGE: {
    summary: "회랑 잔해를 수색해 보급품을 찾는다.",
    body: [
      "잔해 틈에서 부품과 응급키트를 찾는다.",
      "소음이 늘어날수록 근처 움직임이 커진다."
    ]
  },
  EV_CH01_CONCOURSE_CACHE: {
    summary: "회랑 물자 더미를 회수한다.",
    body: [
      "물자 더미는 임시 적치장으로 쓰였던 흔적이다.",
      "여기에 남은 장비가 다음 루트를 돕는다."
    ]
  },
  EV_CH01_SECURITY_LOCKER: {
    summary: "보안실 락커를 개방해 남은 장비를 확인한다.",
    body: [
      "락커 안에 방독면 필터와 탄약이 남아 있다.",
      "공급품을 정리해 무게를 계산한다."
    ]
  },
  EV_CH01_ARCHIVE_RUINS: {
    summary: "침수 통로 잔해를 통과한다.",
    body: [
      "통로는 절반이 붕괴되어 물살이 강하다.",
      "밧줄 없이는 이동이 어렵다."
    ]
  },
  EV_CH01_WRITER_SAFEHOUSE: {
    summary: "편집실 임시 대피처를 확보한다.",
    body: [
      "편집실 일부가 아직 안전하다.",
      "생존자가 남긴 기록이 실마리를 준다."
    ]
  },
  EV_CH01_ROOFTOP_SWEEP: {
    summary: "옥상 주변을 정리해 후속 교신을 확보한다.",
    body: [
      "주변 감염체를 정리해 신호가 안정된다.",
      "교신이 이어져 다음 작전 계획이 선명해진다."
    ]
  },
  EV_CH01_ESCAPE_BACKTRACK: {
    summary: "샛강 잔해를 회수해 귀환 루트를 정리한다.",
    body: [
      "샛강 부근에 장비가 걸려 있다.",
      "가져가면 회수 점수가 오른다."
    ]
  }
};

let patched = 0;
data.events = data.events.map((event) => {
  const update = updates[event.event_id];
  if (!update) {
    return event;
  }
  patched += 1;
  return {
    ...event,
    text: {
      ...event.text,
      summary: update.summary,
      body: update.body
    }
  };
});

data.role = "튜토리얼·첫 교신·첫 보스: 폐방송동 회수전";

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`CH01 updated: ${patched} events`);
