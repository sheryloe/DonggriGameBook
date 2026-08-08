import { withJosa, hasBatchim, repairJosa, josa } from "./lib/korean-josa.mjs";

let pass = 0;
const failures = [];

function eq(got, want, label) {
  if (got === want) {
    pass += 1;
    return;
  }
  failures.push(`${label}: got "${got}" want "${want}"`);
}

// 받침 있는 명사 → 이/을/은/과/으로, 없는 명사 → 가/를/는/와/로
eq(withJosa("주파수", "이/가"), "주파수가", "주파수+이/가");
eq(withJosa("수위", "이/가"), "수위가", "수위+이/가");
eq(withJosa("신호", "이/가"), "신호가", "신호+이/가");
eq(withJosa("그림자", "이/가"), "그림자가", "그림자+이/가");
eq(withJosa("반사광", "이/가"), "반사광이", "반사광+이/가");
eq(withJosa("엘리베이터", "을/를"), "엘리베이터를", "엘리베이터+을/를");
eq(withJosa("철수선", "을/를"), "철수선을", "철수선+을/를");
eq(withJosa("기록", "은/는"), "기록은", "기록+은/는");
eq(withJosa("로비", "은/는"), "로비는", "로비+은/는");
eq(withJosa("사람", "과/와"), "사람과", "사람+과/와");
eq(withJosa("기록자", "과/와"), "기록자와", "기록자+과/와");

// (으)로는 ㄹ 받침을 열린 음절처럼 다룬다
eq(withJosa("계단", "으로/로"), "계단으로", "계단+으로/로");
eq(withJosa("통로", "으로/로"), "통로로", "통로+으로/로");
eq(withJosa("서울", "으로/로"), "서울로", "ㄹ 예외");
eq(withJosa("옥상", "으로/로"), "옥상으로", "옥상+으로/로");

// 숫자와 라틴 문자는 한국어 독음 기준
eq(withJosa("3", "이/가"), "3이", "3=삼");
eq(withJosa("5", "이/가"), "5가", "5=오");
eq(withJosa("CH01", "이/가"), "CH01이", "CH01=일");

// 실제 손상 데이터 복원
eq(repairJosa("죽은 주파수이 낮게 흔들리고").text, "죽은 주파수가 낮게 흔들리고", "주파수이 복원");
eq(repairJosa("저층 엘리베이터을 다시 접어").text, "저층 엘리베이터를 다시 접어", "엘리베이터을 복원");
eq(repairJosa("검은 수위이 낮게").text, "검은 수위가 낮게", "수위이 복원");
eq(repairJosa("컨베이어 그림자이 낮게").text, "컨베이어 그림자가 낮게", "그림자이 복원");
eq(repairJosa("독도 신호이 낮게").text, "독도 신호가 낮게", "신호이 복원");

// 이미 올바른 문장은 건드리지 않는다
eq(repairJosa("깨진 반사광이 낮게").text, "깨진 반사광이 낮게", "반사광이 유지");
eq(repairJosa("샛강 철수선을 다시").text, "샛강 철수선을 다시", "철수선을 유지");
eq(repairJosa("물이 허리까지 차오르고 있다.").text, "물이 허리까지 차오르고 있다.", "물이 유지");

// 조사처럼 보이지만 단어의 일부인 경우
eq(repairJosa("송신기 릴레이 복구").text, "송신기 릴레이 복구", "릴레이 오탐 방지");
eq(repairJosa("누군가 마른 기침을 삼켰다.").text, "누군가 마른 기침을 삼켰다.", "누군가 오탐 방지");
eq(repairJosa("문을 잠가 안전한 수위를 지킬지").text, "문을 잠가 안전한 수위를 지킬지", "잠가 오탐 방지");
eq(repairJosa("휘어진 수산 상가.").text, "휘어진 수산 상가.", "상가 오탐 방지");
eq(repairJosa("진입 시간 증가").text, "진입 시간 증가", "증가 오탐 방지");
eq(repairJosa("소음 부담 추격 상승과 동선 증가").text, "소음 부담 추격 상승과 동선 증가", "받침+가 미개입");
eq(repairJosa("사과 한 알").text, "사과 한 알", "사과 오탐 방지");
eq(repairJosa("수색 결과 남은 것").text, "수색 결과 남은 것", "결과 오탐 방지");

// 은/는은 관형형 어미와 구분이 불가능하므로 복원 대상에서 제외한다
eq(repairJosa("먹는 것과 남는 것").text, "먹는 것과 남는 것", "관형형 -는 미개입");
eq(repairJosa("같은 말을 다른 방향으로").text, "같은 말을 다른 방향으로", "관형형 -은 미개입");

eq(String(hasBatchim("주파수")), "false", "hasBatchim 주파수");
eq(String(hasBatchim("기록")), "true", "hasBatchim 기록");
eq(josa("퇴로", "으로/로"), "로", "josa 퇴로");

if (failures.length > 0) {
  console.error(JSON.stringify({ pass: false, passed: pass, failed: failures.length, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ pass: true, passed: pass, failed: 0 }, null, 2));
