import React, { useState, useEffect } from "react";

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
  className = "" 
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    
    let timeout: number;
    let index = 0;

    const type = () => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        timeout = window.setTimeout(type, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    const startTimeout = window.setTimeout(type, delay);

    return () => {
      window.clearTimeout(startTimeout);
      window.clearTimeout(timeout);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <span className={`typing-container ${className}`}>
      {displayedText}
      {!isComplete && <span className="typing-cursor" />}
    </span>
  );
};
