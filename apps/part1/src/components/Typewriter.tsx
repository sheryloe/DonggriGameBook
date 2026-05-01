import React, { useEffect, useState } from "react";
import { playTextTick } from "../utils/audio";
import { prefersReducedMotion } from "../utils/frameFx";

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  className = "",
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let frameId: number | undefined;
    let cancelled = false;
    let completed = false;
    let displayedCount = 0;
    const charMs = Math.max(1, speed);
    const startAt = performance.now() + Math.max(0, delay);

    const complete = () => {
      if (cancelled || completed) return;
      completed = true;
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
    };

    setDisplayedText("");
    setIsComplete(false);

    if (!text || prefersReducedMotion()) {
      complete();
      return () => {
        cancelled = true;
      };
    }

    const tick = (now: number) => {
      if (cancelled) return;

      if (document.hidden) {
        complete();
        return;
      }

      if (now < startAt) {
        frameId = window.requestAnimationFrame(tick);
        return;
      }

      const nextCount = Math.min(text.length, Math.floor((now - startAt) / charMs) + 1);
      if (nextCount > displayedCount) {
        const nextChar = text.charAt(nextCount - 1);
        if (nextChar.trim() && nextCount % 3 === 0) {
          playTextTick();
        }
        displayedCount = nextCount;
        setDisplayedText(text.slice(0, nextCount));
      }

      if (displayedCount >= text.length) {
        complete();
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) complete();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <span className={`typing-container ${className}`}>
      {displayedText}
      {!isComplete && <span className="typing-cursor" />}
    </span>
  );
};
