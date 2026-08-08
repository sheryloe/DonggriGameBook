/**
 * Korean particle (조사) engine.
 *
 * APR-032 follow-up: the Part 1 director/polish passes hard-coded particles into
 * template literals (`${chapter.signal}이 …`, `${chapter.exit}을 …`). Because the
 * slot noun changes per chapter, every chapter inherited the wrong particle for
 * its own noun — 204 occurrences across CH01-CH05. Never write a particle next to
 * an interpolated noun again; call `withJosa()` instead.
 */

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const JONGSEONG_RIEUL = 8;

/** Particle pairs keyed by the batchim-form (받침 O) variant. */
export const JOSA_PAIRS = Object.freeze({
  "이/가": ["이", "가"],
  "을/를": ["을", "를"],
  "은/는": ["은", "는"],
  "과/와": ["과", "와"],
  "으로/로": ["으로", "로"],
  "아/야": ["아", "야"],
  "이나/나": ["이나", "나"],
  "이란/란": ["이란", "란"],
  "이라/라": ["이라", "라"],
  "으로서/로서": ["으로서", "로서"],
  "으로써/로써": ["으로써", "로써"],
  "이며/며": ["이며", "며"],
  "이다/다": ["이다", "다"],
  "이고/고": ["이고", "고"],
  "이었다/였다": ["이었다", "였다"],
});

function isHangulSyllable(char) {
  if (typeof char !== "string" || char.length === 0) return false;
  const code = char.codePointAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

/** Index of the trailing consonant: 0 means none. */
export function jongseongIndex(char) {
  if (!isHangulSyllable(char)) return -1;
  return (char.codePointAt(0) - HANGUL_START) % 28;
}

/**
 * Last meaningful character of a noun, ignoring trailing brackets/quotes/spaces
 * so that `기록(1건)` and `"방송 로그"` still resolve correctly.
 */
export function lastMeaningfulChar(word) {
  if (typeof word !== "string") return "";
  const trimmed = word.replace(/[\s"'`”’)\]}»〉》」』]+$/u, "");
  return trimmed.slice(-1);
}

/** Digits and Latin letters read aloud in Korean; used when a noun ends in one. */
const DIGIT_BATCHIM = { 0: true, 1: true, 3: true, 6: true, 7: true, 8: true, 2: false, 4: false, 5: false, 9: false };
const LATIN_BATCHIM = {
  l: true, m: true, n: true, r: true, g: true, b: true, k: true, p: true, t: true, c: true, d: true, s: true, x: true, z: true,
  a: false, e: false, i: false, o: false, u: false, f: false, h: false, j: false, q: false, v: false, w: false, y: false,
};

/**
 * True when the word ends in a trailing consonant (받침).
 * Returns null when it cannot be decided, so callers can fail loudly instead of guessing.
 */
export function hasBatchim(word) {
  const char = lastMeaningfulChar(word);
  if (!char) return null;
  if (isHangulSyllable(char)) return jongseongIndex(char) !== 0;
  if (/[0-9]/u.test(char)) return DIGIT_BATCHIM[char];
  if (/[A-Za-z]/u.test(char)) return LATIN_BATCHIM[char.toLowerCase()] ?? null;
  return null;
}

/** True when the word ends in ㄹ, which `(으)로` treats like an open syllable. */
export function endsWithRieul(word) {
  const char = lastMeaningfulChar(word);
  if (!isHangulSyllable(char)) return /[lr]/iu.test(char);
  return jongseongIndex(char) === JONGSEONG_RIEUL;
}

/**
 * Pick the correct particle for a noun.
 * @param {string} word noun the particle attaches to
 * @param {string} pair key of JOSA_PAIRS, or a raw "받침형/비받침형" string
 * @param {{fallback?: "batchim"|"open"}} [options]
 */
export function josa(word, pair, options = {}) {
  const forms = JOSA_PAIRS[pair] ?? pair.split("/");
  if (forms.length !== 2) throw new Error(`unsupported particle pair: ${pair}`);
  const [withBatchim, withoutBatchim] = forms;

  // (으)로 and its derivatives: ㄹ behaves like an open syllable.
  if (withBatchim.startsWith("으로") && endsWithRieul(word)) return withoutBatchim;

  const batchim = hasBatchim(word);
  if (batchim === null) {
    return options.fallback === "open" ? withoutBatchim : withBatchim;
  }
  return batchim ? withBatchim : withoutBatchim;
}

/** Noun + correct particle, e.g. withJosa("주파수", "이/가") === "주파수가". */
export function withJosa(word, pair, options) {
  return `${word}${josa(word, pair, options)}`;
}

/* ------------------------------------------------------------------ *
 * Repair pass for already-written text
 * ------------------------------------------------------------------ */

/**
 * Words whose final syllable only looks like a particle. Without this list a
 * repair pass would rewrite "릴레이" into "릴레가".
 */
const NOT_A_PARTICLE = new Set([
  "릴레이", "아이", "사이", "종이", "고양이", "길이", "높이", "깊이", "넓이", "놀이", "먹이",
  "손잡이", "목걸이", "나이", "허리", "마이", "구이", "덮이", "쌓이", "보이", "들이", "쓰이",
  "사과", "과일", "과거", "과제", "학과", "성과", "초과", "효과", "통과", "경과", "결과", "과정",
  "누구를", "이를", "그를", "저를", "너를", "나를",
]);

/**
 * Directions the repair pass is allowed to change.
 *
 * Measured against the real CH01-CH05 corpus: every `받침 + 가` hit was a noun
 * ending in 가 (증가, 상가, 누군가) or the verb form 잠가, so that direction is
 * pure noise and stays out. The remaining directions had no false positives once
 * NOT_A_PARTICLE was applied.
 */
const REPAIRABLE = [
  { char: "이", pair: "이/가", when: (j) => j === 0 },
  { char: "을", pair: "을/를", when: (j) => j === 0 },
  { char: "를", pair: "을/를", when: (j) => j > 0 },
  { char: "과", pair: "과/와", when: (j) => j === 0 },
  { char: "와", pair: "과/와", when: (j) => j > 0 },
];
const REPAIRABLE_BY_CHAR = new Map(REPAIRABLE.map((r) => [r.char, r]));

function isBoundary(char) {
  return char === undefined || /[\s.,!?;:…·"'”’)\]}]/u.test(char);
}

/**
 * Correct mismatched 이/가, 을/를, 과/와 in existing prose.
 *
 * Deliberately conservative: it only touches a particle that sits in particle
 * position (followed by a boundary), skips known non-particle words, and leaves
 * 은/는 alone because "먹는", "있는", "같은" are verb endings, not particles.
 *
 * @returns {{text: string, fixes: Array<{from: string, to: string, index: number}>}}
 */
export function repairJosa(text) {
  if (typeof text !== "string" || !text) return { text, fixes: [] };
  const chars = [...text];
  const fixes = [];

  for (let i = 1; i < chars.length; i += 1) {
    const cur = chars[i];
    const rule = REPAIRABLE_BY_CHAR.get(cur);
    if (!rule) continue;
    if (!isBoundary(chars[i + 1])) continue;
    const prev = chars[i - 1];
    if (!isHangulSyllable(prev)) continue;
    if (!rule.when(jongseongIndex(prev))) continue;

    // Whole word ending at this particle, e.g. "주파수이".
    let start = i;
    while (start > 0 && isHangulSyllable(chars[start - 1])) start -= 1;
    const word = chars.slice(start, i + 1).join("");
    if (NOT_A_PARTICLE.has(word)) continue;

    const stem = chars.slice(start, i).join("");
    if (!stem) continue;

    const correct = josa(stem, rule.pair);
    if (correct === cur) continue;

    fixes.push({ from: word, to: `${stem}${correct}`, index: i });
    chars[i] = correct;
  }

  return { text: chars.join(""), fixes };
}

/** Convenience wrapper that returns only the repaired string. */
export function fixJosa(text) {
  return repairJosa(text).text;
}
