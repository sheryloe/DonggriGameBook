let audioContext: AudioContext | null = null;
let bgmElement: HTMLAudioElement | null = null;
let humElement: HTMLAudioElement | null = null;
let lastTickAt = 0;
const oneShotPools = new Map<string, HTMLAudioElement[]>();

declare global {
  interface Window {
    __part1AudioDebug?: {
      bgmStarts: number;
      humStarts: number;
      voiceLines: number;
      textTicks: number;
      signalBursts: number;
      choiceSelects: number;
      oneShots: string[];
    };
  }
}

function markAudioEvent(key: "bgmStarts" | "humStarts" | "voiceLines" | "textTicks" | "signalBursts" | "choiceSelects", src?: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.__part1AudioDebug ??= { bgmStarts: 0, humStarts: 0, voiceLines: 0, textTicks: 0, signalBursts: 0, choiceSelects: 0, oneShots: [] };
  window.__part1AudioDebug[key]++;
  if (src) {
    window.__part1AudioDebug.oneShots.push(src);
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextCtor = window.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContext = new AudioContextCtor();
  }
  return audioContext;
}

export async function unlockAudio(): Promise<void> {
  const context = getAudioContext();
  if (context?.state === "suspended") {
    await context.resume().catch(() => undefined);
  }
}

export async function startStoryBgm(src = "/audio/story1.mp3", volume = 0.22): Promise<void> {
  if (typeof window === "undefined") return;
  await unlockAudio();
  const resolvedSrc = new URL(src, window.location.href).href;
  if (!bgmElement || bgmElement.src !== resolvedSrc) {
    bgmElement?.pause();
    bgmElement = new Audio(src);
    bgmElement.loop = true;
    bgmElement.preload = "auto";
  }
  bgmElement.volume = volume;
  markAudioEvent("bgmStarts", src);
  await bgmElement.play().catch(() => undefined);
}

export async function startEmergencyHum(src = "/generated/audio/sfx/P1/CH01/P1_CH01_LOW_EMERGENCY_HUM_LOOP.wav", volume = 0.12): Promise<void> {
  if (typeof window === "undefined") return;
  await unlockAudio();
  const resolvedSrc = new URL(src, window.location.href).href;
  if (!humElement || humElement.src !== resolvedSrc) {
    humElement?.pause();
    humElement = new Audio(src);
    humElement.loop = true;
    humElement.preload = "auto";
  }
  humElement.volume = volume;
  markAudioEvent("humStarts", src);
  await humElement.play().catch(() => undefined);
}

export function stopStoryBgm(): void {
  bgmElement?.pause();
  humElement?.pause();
}

function playTone(frequency: number, duration: number, volume: number, type: OscillatorType = "square"): void {
  const context = getAudioContext();
  if (!context || context.state === "suspended") return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
}

function playNoise(duration: number, volume: number, filterFrequency = 1800): void {
  const context = getAudioContext();
  if (!context || context.state === "suspended") return;
  const buffer = context.createBuffer(1, Math.max(1, context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index++) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = filterFrequency;
  filter.Q.value = 4;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start();
}

function playOneShot(src: string, volume: number, key?: "signalBursts" | "choiceSelects" | "voiceLines" | "textTicks"): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const pool = oneShotPools.get(src) ?? [];
  let audio = pool.find((entry) => entry.paused || entry.ended);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    if (pool.length < 6) {
      pool.push(audio);
      oneShotPools.set(src, pool);
    }
  }
  audio.currentTime = 0;
  audio.volume = volume;
  if (key) {
    markAudioEvent(key, src);
  } else {
    window.__part1AudioDebug?.oneShots.push(src);
  }
  void audio.play().catch(() => undefined);
  return audio;
}

export function playTextTick(): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastTickAt < 70) return;
  lastTickAt = now;
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_TEXT_TICK.wav", 0.22, "textTicks");
}

export function playSignalBurst(): void {
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_CORRUPTED_SIGNAL_BURST.wav", 0.32, "signalBursts");
  playNoise(0.22, 0.035, 1250);
  playTone(190, 0.08, 0.015, "sawtooth");
}

export function playChoiceSelect(): void {
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_CHOICE_SIGNAL_CUT.wav", 0.42, "choiceSelects");
  playTone(420, 0.05, 0.025, "triangle");
  window.setTimeout(() => playNoise(0.12, 0.018, 2300), 20);
}

export type FrameAudioCue = "scene-enter" | "choice" | "encounter-start" | "encounter-impact" | "encounter-resolve" | "encounter-watch";

export function playFrameCue(cue: FrameAudioCue): void {
  if (cue === "choice") {
    playChoiceSelect();
    return;
  }
  if (cue === "scene-enter") {
    playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_RADIO_STATIC_CHIRP.wav", 0.1, "signalBursts");
    window.setTimeout(() => playNoise(0.16, 0.014, 1500), 40);
    return;
  }
  if (cue === "encounter-start") {
    playNoise(0.24, 0.028, 860);
    window.setTimeout(() => playTone(115, 0.12, 0.018, "sawtooth"), 80);
    return;
  }
  if (cue === "encounter-impact") {
    playTone(150, 0.08, 0.032, "sawtooth");
    window.setTimeout(() => playNoise(0.18, 0.024, 620), 30);
    return;
  }
  if (cue === "encounter-resolve") {
    playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_ARCHIVE_CONFIRM_BEEP.wav", 0.2);
    window.setTimeout(() => playTone(520, 0.08, 0.016, "triangle"), 40);
    return;
  }
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_RADIO_STATIC_CHIRP.wav", 0.12);
  window.setTimeout(() => playTone(880, 0.05, 0.012, "sine"), 50);
}

export function playPanelToggle(open: boolean): void {
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_ARCHIVE_CONFIRM_BEEP.wav", open ? 0.26 : 0.18);
  playTone(open ? 760 : 460, 0.05, 0.02, "triangle");
  if (open) {
    window.setTimeout(() => playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_RADIO_STATIC_CHIRP.wav", 0.08), 20);
  }
}

export function playInventoryGain(): void {
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_ARCHIVE_CONFIRM_BEEP.wav", 0.28);
  playTone(920, 0.06, 0.024, "triangle");
}

export function playInventoryRemove(): void {
  playTone(260, 0.05, 0.02, "triangle");
  window.setTimeout(() => playNoise(0.08, 0.01, 900), 10);
}

export function playBattleAction(action: "attack" | "guard" | "scan" | "retreat"): void {
  if (action === "attack") {
    playTone(180, 0.06, 0.03, "sawtooth");
    window.setTimeout(() => playTone(120, 0.05, 0.02, "triangle"), 40);
    return;
  }
  if (action === "guard") {
    playTone(420, 0.05, 0.018, "square");
    window.setTimeout(() => playTone(320, 0.07, 0.016, "triangle"), 30);
    return;
  }
  if (action === "scan") {
    playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_RADIO_STATIC_CHIRP.wav", 0.16);
    playTone(880, 0.04, 0.016, "sine");
    window.setTimeout(() => playTone(1040, 0.05, 0.012, "sine"), 60);
    return;
  }
  playTone(240, 0.05, 0.02, "triangle");
  window.setTimeout(() => playTone(180, 0.06, 0.012, "sine"), 40);
}

export function playResultReveal(): void {
  playOneShot("/generated/audio/sfx/P1/CH01/P1_CH01_RADIO_STATIC_CHIRP.wav", 0.12);
  playTone(560, 0.06, 0.018, "triangle");
}

export function playVoiceLine(src: string, volume = 0.86): HTMLAudioElement | null {
  return playOneShot(src, volume, "voiceLines");
}
