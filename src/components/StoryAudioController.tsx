import { useCallback, useEffect, useRef, useState } from "react";

interface StoryAudioControllerProps {
  enabled: boolean;
  path: string;
  isActive: boolean;
}

export default function StoryAudioController({ enabled, path, isActive }: StoryAudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isOn, setIsOn] = useState(true);
  const [volume, setVolume] = useState(0.45);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const stopAndReset = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
  }, []);

  const tryPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !enabled || !isActive || !isOn) {
      return;
    }

    try {
      await audio.play();
      setAutoplayBlocked(false);
    } catch {
      setAutoplayBlocked(true);
    }
  }, [enabled, isActive, isOn]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const audio = new Audio(path);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [enabled, path]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!isActive || !isOn) {
      stopAndReset();
      return;
    }

    void tryPlay();
  }, [enabled, isActive, isOn, stopAndReset, tryPlay]);

  if (!enabled) {
    return null;
  }

  const toggle = () => {
    setIsOn((prev) => {
      const next = !prev;
      if (!next) {
        stopAndReset();
      }
      return next;
    });
  };

  return (
    <section className="audio-controller" aria-label="Story 1 BGM control">
      <button type="button" onClick={toggle} className="audio-btn">
        BGM {isOn ? "ON" : "OFF"}
      </button>
      <label className="audio-volume" htmlFor="bgm-volume">
        Vol
      </label>
      <input
        id="bgm-volume"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(event) => setVolume(Number(event.target.value))}
      />
      {autoplayBlocked && isOn && isActive ? (
        <button type="button" onClick={() => void tryPlay()} className="audio-btn ghost">
          재생 허용
        </button>
      ) : null}
    </section>
  );
}
