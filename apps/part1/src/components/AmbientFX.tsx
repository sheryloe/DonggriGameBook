import React from "react";
import { useGameStore } from "../store/gameStore";

export const AmbientFX: React.FC = () => {
  const { currentChapterId } = useGameStore();

  // Ash particles for CH01, Rain for CH02, etc.
  const particleType = currentChapterId === "CH01" ? "ash" : currentChapterId === "CH02" ? "rain" : "dust";

  return (
    <div className={`ambient-container ${particleType}`} aria-hidden="true" style={{ 
      position: "fixed", 
      inset: 0, 
      pointerEvents: "none", 
      zIndex: 5,
      opacity: 0.4
    }}>
      {/* Generate 20 random particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
};
