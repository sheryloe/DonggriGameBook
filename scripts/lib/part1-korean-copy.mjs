/**
 * Shared vocabulary and sentence frames for the Part 1 Korean repair pass.
 *
 * Background: a long chain of one-off "polish/upgrade" scripts injected a
 * `{수식어} {슬롯명사}` token in front of every gain/cost/risk label and then
 * rebuilt `label` and `preview` on top of the contaminated values. The result was
 * "북문 기록 시야 확보가 필요하다면 북문 기록 위치 노출을 받아들인다." — three
 * repetitions of a token that means nothing to the player. These tables let the
 * repair pass strip the injected slot and rebuild readable Korean.
 */

/** Modifier half of the injected slot, per chapter. */
export const SLOT_MODIFIERS = new Set([
  "서측", "남측", "동측", "북측", "북문", "후문", "정문", "옥상", "지하", "외곽", "중앙", "내부",
  "건조", "침수", "상층", "저층", "잔광", "정적", "회색", "푸른", "검은", "붉은", "흐린", "높은",
  "낮은", "짧은", "긴", "오른편", "왼편", "바깥", "안쪽", "젖은", "마른", "차가운", "따뜻한",
]);

/**
 * Noun half of the injected slot.
 *
 * Derived from the real corpus: each of these follows a SLOT_MODIFIERS token
 * ~100 times across CH01-CH05, which no hand-written phrase does.
 */
export const SLOT_NOUNS = new Set([
  "표식", "루트", "신호", "지도", "문턱", "계단", "복도", "물자", "차단", "검문", "보급", "흔적",
  "잠금", "가방", "기록", "퇴로", "난간", "경보", "열쇠", "침묵", "불신", "체류", "사각", "소리",
  "폐쇄", "손잡이", "냉기", "혼선", "무게", "시선", "증언", "소란", "반향", "동행", "망설임", "균열",
  "셔터", "우회", "단서", "배관", "교신", "전원", "평판", "점수",
]);

/**
 * Action phrase at the tail of a broken label → natural Korean sentence.
 * Several sources were truncated mid-word ("짧은 교신만 남"), so the table also
 * restores those.
 */
export const ACTION_LABELS = Object.freeze({
  "다음 이동": "다음 구역으로 이동한다",
  "기록 회수": "기록을 회수한다",
  "냉각로 확인": "냉각로를 확인한다",
  "신호 확인": "신호를 확인한다",
  "우회 통과": "우회로로 돌아 통과한다",
  "이탈 준비": "이탈을 준비한다",
  "잔해 수색": "잔해를 수색한다",
  "압박 돌파": "밀어붙여 돌파한다",
  "보류 판단": "판단을 보류한다",
  "장애물 정리": "장애물을 치운다",
  "생존자 확인": "생존자를 확인한다",
  준비: "채비를 갖춘다",
  "스캔 확대": "탐색 범위를 넓힌다",
  "반복 확인": "한 번 더 확인한다",
  "보관함 개방": "보관함을 연다",
  "보관함 보류": "보관함을 그대로 둔다",
  "준비 압박": "서둘러 채비한다",
  "손을 덜 쓰는": "손을 덜 쓰는 쪽을 고른다",
  "통제 확인": "통제 상태를 확인한다",
  "정면 압박": "정면으로 압박한다",
  "추가 탐색": "조금 더 뒤진다",
  "장부 확인": "장부를 확인한다",
  수리: "고장 난 곳을 고친다",
  "짧은 교신만 남": "짧은 교신만 남긴다",
  "소리를 죽이고": "소리를 죽이고 접근한다",
  "불빛을 낮춰 정": "불빛을 낮추고 정리한다",
  "위협을 끊고 틈": "위협을 끊고 틈을 만든다",
  "강행 돌파": "강행 돌파한다",
  "창고 수색": "창고를 수색한다",
  "천막 확인": "천막을 확인한다",
  "거래 성사": "거래를 성사시킨다",
  "흔적 은폐 후 이탈": "흔적을 지우고 빠진다",
  "부상 위험 낮추기": "부상 위험을 낮춘다",
  "탈출 빠른": "빠른 길로 탈출한다",
  "탈출 안전": "안전한 길로 탈출한다",
  "지도에 빈칸을": "지도에 빈칸을 남긴다",
  복구: "끊긴 것을 복구한다",
  "안전 확보": "안전을 확보한다",
  "후퇴 가능한 거": "후퇴 가능한 거리를 지킨다",
  탈출: "탈출한다",
  "탈출 보류": "탈출을 보류한다",
  "탈출 보트": "보트로 탈출한다",
  "탈출 육로": "육로로 탈출한다",
  "개방 확인": "개방 상태를 확인한다",
  "철수선을 열어": "철수선을 열어 둔다",
  "물자 분류": "물자를 분류한다",
  지하: "지하로 내려간다",
  "감염 흔적 우회": "감염 흔적을 우회한다",
  "퇴로를 먼저 표": "퇴로를 먼저 표시한다",
  "정면 돌입": "정면으로 돌입한다",
  "준비 완료": "채비를 끝낸다",
  "과부하 수리": "과부하를 잡는다",
  "과부하 보류": "과부하를 그대로 둔다",
  회수: "챙길 것만 회수한다",
  "고정 확보": "고정을 확보한다",
  "무전 기록 대조": "무전 기록을 대조한다",
  "준비 가동": "준비를 가동한다",
  채집: "쓸 만한 것을 채집한다",
  "복구 거래": "복구를 조건으로 거래한다",
  "복구 가동": "복구를 가동한다",
  "복구 우회": "복구를 미루고 우회한다",
  "보관함 채집": "보관함을 턴다",
  "하늘다리 빠": "하늘다리로 빠르게 건넌다",
  "하늘다리 하": "하늘다리 아래로 돌아간다",
  "자료 정리": "자료를 정리한다",
  "핵심 회수": "핵심만 회수한다",
  "부상 낮추는 기록 확인": "부상을 줄이며 기록을 확인한다",
  "부상 낮추는 절단": "부상을 줄이며 끊어 낸다",
  "단서와 시간을": "단서와 시간을 맞바꾼다",
  "보급품을 나눠": "보급품을 나눈다",
  "동행자 위치 확인": "동행자 위치를 확인한다",
  "신중 접근": "신중하게 접근한다",
  "동행자의 위치를": "동행자의 위치를 잡는다",
  "잠긴 문을 조용": "잠긴 문을 조용히 연다",
  "보트 이동": "보트로 이동한다",
  "육로 이동": "육로로 이동한다",
  "지하 지원": "지하를 지원한다",
  "계단 이동": "계단으로 이동한다",
  "외곽 우회": "외곽으로 우회한다",
  "위험 구역을 낮": "위험 구역을 낮춰 지난다",
  "연막 이탈": "연막을 치고 빠진다",
  "냉각로 안전값 확인": "냉각로 안전값을 확인한다",
  "선로 가동": "선로를 가동한다",
  "선로 차단": "선로를 차단한다",
  선로: "선로를 살핀다",
  "자료 기록": "자료를 기록한다",
  자료: "자료를 챙긴다",
  "자료 송출": "자료를 송출한다",
  "젖은 좌표 접기": "젖은 좌표를 접는다",
  "손의 파편 감싸기": "손의 파편을 감싼다",
  "경계를 세우고": "경계를 세운다",
});

/**
 * Sino-Korean action nouns that a label may end on. A choice label should read as
 * something the player does, so a trailing bare noun gets "한다" appended rather
 * than being left as a fragment ("… 낮게 통과" → "… 낮게 통과한다").
 */
export const ACTION_NOUNS = new Set([
  "통과", "확인", "회수", "수색", "정리", "이동", "준비", "돌파", "탈출", "우회", "복구", "수리",
  "점검", "배분", "협상", "거래", "채집", "송출", "차단", "가동", "보류", "정찰", "지원", "봉쇄",
]);

/**
 * Hand-authored previews that were correct but shorter than the flow audit's
 * readability floor. Extended by hand so the original voice survives instead of
 * being replaced with a generated frame.
 */
export const PREVIEW_EXTENSIONS = Object.freeze({
  ch02_pier_land:
    "수로 지도 1장을 얻지만 오염이 5 올라간다. 육로는 빠른 대신 매복이 붙기 좋은 길이라, 지도값을 몸으로 치르는 선택이 된다.",
  ch05_lobby_map:
    "안전 지도를 확보하고 소음을 1 낮춘다. 대신 서버 로그는 포기하게 되고, 삭제된 기록이 무엇이었는지는 끝까지 확인할 수 없다.",
  ch05_cooling_stable:
    "냉각 젤 1개를 얻고 안정화 경로를 기록한다. 다만 안정화에 시간이 들어 김아라의 도착이 그만큼 늦어진다.",
  ch05_cooling_bypass:
    "냉각실을 빠르게 지나가지만 소음이 3 오른다. 우회 회로를 강제로 열었으니 코어 경보가 먼저 깨어날 수 있다.",
});

/** Internal route/flag identifiers that leaked into player-facing system lines. */
export const INTERNAL_TERMS = Object.freeze({
  "route.truth_score": "진실 점수",
  "route.control_score": "통제 점수",
  "route.compassion_score": "연민 점수",
  "route.underworld_score": "뒷길 점수",
  "route.truth": "진실 기록",
  "route.control": "통제 기록",
  "route.compassion": "연민 기록",
  "route.underworld": "뒷길 기록",
  "route.strain": "부담 기록",
  "route.current": "현재 경로",
  "carry_weight": "적재 무게",
  "reserve_lane": "예비 통로",
});

/** Preview sentence frames. Index-selected so neighbouring choices differ. */
export const PREVIEW_FRAMES = [
  ({ g, c, r }) => `${g("을/를")} 먼저 잡고 빠진다. 다만 ${c("과/와")} ${r("이/가")} 함께 남는다.`,
  ({ g, c, r }) => `${g("을/를")} 챙긴다. 대신 ${c("이/가")} 생기고 ${r("이/가")} 커진다.`,
  ({ g, c, r }) => `${g("이/가")} 필요하다면 ${c("을/를")} 받아들인다. 그만큼 ${r("이/가")} 따라온다.`,
  ({ g, c, r }) => `${c("을/를")} 감수하고 ${g("을/를")} 노린다. 실패하면 ${r("이/가")} 남는다.`,
  ({ g, c, r }) => `${r("을/를")} 무릅쓰는 대신 ${g("을/를")} 챙긴다. ${c("이/가")} 발목을 잡는다.`,
];

/**
 * Outcome opening lines.
 *
 * Every frame has to read correctly with a bare noun phrase ("즉시 돌파",
 * "소음 1 감소·물자 수색", "방송 로그 1건"), so the verb never has to agree with
 * the shape of the slot.
 */
export const OUTCOME_GAIN_FRAMES = [
  ({ g }) => `이번 선택으로 ${g("을/를")} 얻었다.`,
  ({ g }) => `손에 남은 것은 ${g("이다/다")}.`,
  ({ g }) => `${g("을/를")} 챙기고 자리를 떴다.`,
  ({ g }) => `확보한 것은 ${g("이다/다")}.`,
];

/** Outcome closing lines: the price paid, and the risk that follows. */
export const OUTCOME_COST_FRAMES = [
  ({ c, r }) => `치른 값은 ${c("이다/다")}. 남은 위험은 ${r("이다/다")}.`,
  ({ c, r }) => `대가로 ${c("을/를")} 내줬고, ${r("은/는")} 다음 구간까지 따라붙는다.`,
  ({ c, r }) => `${c("을/를")} 값으로 치렀다. 뒤에는 ${r("이/가")} 남는다.`,
  ({ c, r }) => `내준 것은 ${c("이다/다")}. 그 자리에 ${r("이/가")} 들어섰다.`,
];

/** Outcome summary lines shown on the receipt. */
export const OUTCOME_SUMMARY_FRAMES = [
  ({ g, c }) => `${g("을/를")} 얻고 ${c("을/를")} 내줬다.`,
  ({ g, c }) => `얻은 것은 ${g("이고/고")}, 치른 것은 ${c("이다/다")}.`,
  ({ g, c }) => `${g("을/를")} 가져가는 값으로 ${c("을/를")} 치렀다.`,
];

/**
 * Stat shorthand carried in gain/cost/risk labels reads like a spreadsheet inside
 * prose. Narrative frames run it through here first.
 */
export function humanizeStat(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/([가-힣A-Za-z0-9 ]*?)\s*\+(\d+)/gu, (_, noun, n) => `${noun.trim()} ${n} 상승`)
    .replace(/(9mm 탄|탄약|탄)\s*-(\d+)/gu, (_, noun, n) => `${noun} ${n}발 소모`)
    .replace(/(평판|점수|신뢰)\s*-(\d+)/gu, (_, noun, n) => `${noun} ${n} 하락`)
    .replace(/([가-힣A-Za-z0-9 ]*?)\s*-(\d+)/gu, (_, noun, n) => `${noun.trim()} ${n} 감소`)
    .replace(/\s{2,}/gu, " ")
    .trim();
}

/** Carry-line frame used when the original was a slash-joined fragment list. */
export const CARRY_FRAMES = [
  ({ g, c }) => `${g("과/와")} ${c("이/가")} 다음 구간의 조건으로 넘어간다.`,
  ({ g, c }) => `${g("은/는")} 뒤를 받치고, ${c("은/는")} 다음 방에서 다시 계산된다.`,
];
