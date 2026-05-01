import { playVoiceLine } from "./audio";
import type { GameEvent, SceneBlock } from "../types/game";

type NarrationMood = "dialogue" | "narration" | "system";

interface NarrationOptions {
  mood?: NarrationMood;
  delay?: number;
  volume?: number;
}

let currentTimeout: number | null = null;
let lastNarrationKey = "";
let lastNarrationAt = 0;

declare global {
  interface Window {
    __part1NarrationDebug?: {
      authoredVoice: number;
      browserTts: number;
      scheduled: number;
      cancelled: number;
      lastText: string;
      lastAudioSrc?: string;
      lastSource: "authored" | "browser" | "none";
    };
  }
}

function markDebug(source: "authored" | "browser" | "none", text = ""): void {
  if (typeof window === "undefined") return;
  window.__part1NarrationDebug ??= {
    authoredVoice: 0,
    browserTts: 0,
    scheduled: 0,
    cancelled: 0,
    lastText: "",
    lastSource: "none",
  };
  if (source === "authored") window.__part1NarrationDebug.authoredVoice += 1;
  if (source === "browser") window.__part1NarrationDebug.browserTts += 1;
  window.__part1NarrationDebug.lastSource = source;
  window.__part1NarrationDebug.lastText = text;
}

export function cancelNarration(): void {
  if (typeof window === "undefined") return;
  if (currentTimeout !== null) {
    window.clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  window.__part1NarrationDebug ??= {
    authoredVoice: 0,
    browserTts: 0,
    scheduled: 0,
    cancelled: 0,
    lastText: "",
    lastSource: "none",
  };
  window.__part1NarrationDebug.cancelled += 1;
}

function pickKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ko")) ??
    voices.find((voice) => /korean|heami|hyemi|seoyun|sunhi/i.test(voice.name)) ??
    null
  );
}

function normalizeText(text: string): string {
  return text
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

function voiceSettings(mood: NarrationMood): { rate: number; pitch: number } {
  if (mood === "system") return { rate: 0.86, pitch: 0.82 };
  if (mood === "dialogue") return { rate: 0.92, pitch: 0.94 };
  return { rate: 0.88, pitch: 0.88 };
}

export function speakBrowserTts(text: string, options: NarrationOptions = {}): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    markDebug("none");
    return;
  }

  const spokenText = normalizeText(text);
  if (!spokenText) {
    markDebug("none");
    return;
  }

  cancelNarration();
  const mood = options.mood ?? "narration";
  const delay = options.delay ?? 450;
  const { rate, pitch } = voiceSettings(mood);

  currentTimeout = window.setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = "ko-KR";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = options.volume ?? 0.86;
    const voice = pickKoreanVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    markDebug("browser", spokenText);
    currentTimeout = null;
  }, delay);
}

export function playAuthoredOrBrowserTts(audioSrc: string | null, fallbackText: string, options: NarrationOptions = {}): void {
  cancelNarration();
  const spokenText = normalizeText(fallbackText);
  if (typeof window !== "undefined") {
    window.__part1NarrationDebug ??= {
      authoredVoice: 0,
      browserTts: 0,
      scheduled: 0,
      cancelled: 0,
      lastText: "",
      lastSource: "none",
    };
    window.__part1NarrationDebug.scheduled += 1;
    window.__part1NarrationDebug.lastAudioSrc = audioSrc ?? undefined;
    window.__part1NarrationDebug.lastText = spokenText;
  }
  const narrationKey = `${audioSrc ?? "browser"}:${spokenText}`;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (currentTimeout !== null && narrationKey === lastNarrationKey && now - lastNarrationAt < 1400) {
    return;
  }
  lastNarrationKey = narrationKey;
  lastNarrationAt = now;

  if (audioSrc) {
    currentTimeout = window.setTimeout(() => {
      const audio = playVoiceLine(audioSrc, options.volume ?? 0.86);
      audio?.addEventListener(
        "error",
        () => {
          speakBrowserTts(spokenText, { ...options, delay: 0 });
        },
        { once: true },
      );
      markDebug("authored", fallbackText);
      currentTimeout = null;
    }, options.delay ?? 450);
    return;
  }
  speakBrowserTts(fallbackText, options);
}

function firstSpeakableLine(blocks: SceneBlock[], body: string[]): { text: string; mood: NarrationMood } {
  const dialogue = blocks.find((block) => block.kind === "dialogue" && block.lines.some((line) => line.trim()));
  if (dialogue) {
    return { text: dialogue.lines.join(" "), mood: "dialogue" };
  }
  const system = blocks.find((block) => block.kind === "system" && block.lines.some((line) => line.trim()));
  if (system) {
    return { text: system.lines.join(" "), mood: "system" };
  }
  const firstBlock = blocks.find((block) => block.lines.some((line) => line.trim()));
  if (firstBlock) {
    return { text: firstBlock.lines.join(" "), mood: "narration" };
  }
  return { text: body.join(" "), mood: "narration" };
}

export function eventNarrationText(event: GameEvent | undefined): { text: string; mood: NarrationMood } {
  if (!event) return { text: "", mood: "narration" };
  return firstSpeakableLine(event.text?.scene_blocks ?? [], event.text?.body ?? []);
}
