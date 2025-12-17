"use client";

import { useEffect, useRef, memo } from "react";

interface AnimatedGradientProps {
  className?: string;
  colors?: string[];
  speed?: number;
}

function AnimatedGradient({
  className = "",
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"],
  speed = 5,
}: AnimatedGradientProps) {
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gradientRef.current) return;

    let angle = 0;
    let animationFrameId: number;
    let lastTime = 0;
    const targetInterval = speed * 16; // Convert to ms for 60fps

    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= targetInterval) {
        angle = (angle + 1) % 360;
        if (gradientRef.current) {
          gradientRef.current.style.background = `linear-gradient(${angle}deg, ${colors.join(", ")})`;
        }
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [colors, speed]);

  return (
    <div
      ref={gradientRef}
      className={`absolute inset-0 opacity-20 blur-2xl ${className}`}
      style={{
        background: `linear-gradient(0deg, ${colors.join(", ")})`,
        willChange: "background",
      }}
    />
  );
}

export default memo(AnimatedGradient);

