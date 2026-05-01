export type Part1FrameTone = "broadcast" | "flood" | "glass" | "logistics" | "server" | "encounter";
export type FrameCue =
  | "scene-enter"
  | "choice"
  | "encounter-start"
  | "encounter-impact"
  | "encounter-resolve"
  | "map-ripple"
  | "result-reveal"
  | "briefing-boot"
  | "critical-glitch";

const CHAPTER_TONE: Record<string, Part1FrameTone> = {
  CH01: "broadcast",
  CH02: "flood",
  CH03: "glass",
  CH04: "logistics",
  CH05: "server",
};

export const SIGNAL_CUT_MS = 180;
export const CHOICE_LOCK_MS = 190;

export const CUE_DURATION_MS: Record<FrameCue, number> = {
  "scene-enter": 620,
  choice: 220,
  "encounter-start": 760,
  "encounter-impact": 360,
  "encounter-resolve": 720,
  "map-ripple": 560,
  "result-reveal": 680,
  "briefing-boot": 720,
  "critical-glitch": 420,
};

export function part1FrameTone(chapterId: string | null | undefined): Part1FrameTone {
  return chapterId ? CHAPTER_TONE[chapterId] ?? "broadcast" : "broadcast";
}

export function frameToneLabel(tone: Part1FrameTone): string {
  const labels: Record<Part1FrameTone, string> = {
    broadcast: "비상 송출",
    flood: "침수 통로",
    glass: "유리 고층",
    logistics: "물류 라인",
    server: "서버 격리",
    encounter: "감염체 조우",
  };
  return labels[tone] ?? "현장 기록";
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyFrameTone(chapterId: string | null | undefined, overrideTone?: Part1FrameTone): Part1FrameTone {
  const tone = overrideTone ?? part1FrameTone(chapterId);
  if (typeof document !== "undefined") {
    document.body.dataset.frameTone = tone;
  }
  return tone;
}

export function runFrameCue(cue: FrameCue, chapterId: string | null | undefined, overrideTone?: Part1FrameTone): void {
  if (typeof document === "undefined") return;
  const tone = applyFrameTone(chapterId, overrideTone);
  const allCueClasses = Object.keys(CUE_DURATION_MS).map((name) => `hf-cue-${name}`);
  document.body.classList.remove(...allCueClasses);
  document.body.dataset.frameCue = cue;
  document.body.dataset.frameTone = tone;

  if (prefersReducedMotion()) {
    delete document.body.dataset.frameCue;
    return;
  }

  const className = `hf-cue-${cue}`;
  void document.body.offsetWidth;
  document.body.classList.add(className);

  window.setTimeout(() => {
    document.body.classList.remove(className);
    if (document.body.dataset.frameCue === cue) {
      delete document.body.dataset.frameCue;
    }
  }, CUE_DURATION_MS[cue]);
}