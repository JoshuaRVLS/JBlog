"use client";

import { ReactNode } from "react";

interface GlowEffectProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export default function GlowEffect({
  children,
  className = "",
  glowColor = "rgba(59, 130, 246, 0.5)",
}: GlowEffectProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 blur-2xl opacity-50"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

