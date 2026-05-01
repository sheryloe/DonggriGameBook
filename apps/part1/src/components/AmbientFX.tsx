import React from "react";
import { useGameStore } from "../store/gameStore";
import { prefersReducedMotion } from "../utils/frameFx";

interface ParticleSeed {
  left: number;
  top: number;
  delay: number;
  duration: number;
}

function particleTypeForChapter(chapterId: string | null | undefined): "ash" | "rain" | "glass" | "spark" | "data" {
  if (chapterId === "CH01") return "ash";
  if (chapterId === "CH02") return "rain";
  if (chapterId === "CH03") return "glass";
  if (chapterId === "CH04") return "spark";
  return "data";
}

function particleCount(): number {
  if (typeof window === "undefined") return 12;
  if (prefersReducedMotion()) return 0;
  return window.innerWidth <= 560 ? 8 : 16;
}

function makeParticles(count: number): ParticleSeed[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 5,
  }));
}

export const AmbientFX: React.FC = () => {
  const { currentChapterId } = useGameStore();
  const [count, setCount] = React.useState(particleCount);
  const particleType = particleTypeForChapter(currentChapterId);
  const particles = React.useMemo(() => makeParticles(count), [count, currentChapterId]);

  React.useEffect(() => {
    const update = () => setCount(particleCount());
    update();
    window.addEventListener("resize", update);
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    media?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("resize", update);
      media?.removeEventListener?.("change", update);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <div
      className={`ambient-container ${particleType}`}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
        opacity: 0.32,
      }}
    >
      {particles.map((particle, i) => (
        <div
          key={`${currentChapterId}-${i}`}
          className="particle"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
};
