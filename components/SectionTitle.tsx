"use client";

import { forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  align?: "left" | "center" | "right";
}

const SectionTitle = forwardRef<HTMLDivElement, SectionTitleProps>(({
  title,
  subtitle,
  icon: Icon,
  className = "",
  align = "center",
}, ref) => {
  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  };

  return (
    <div ref={ref} className={`mb-12 md:mb-16 ${alignClasses[align]} ${className}`}>
      {/* Badge/Icon Section */}
      <div className={`flex ${align === "center" ? "justify-center" : align === "left" ? "justify-start" : "justify-end"} mb-4`}>
        <div className="inline-flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-primary/50 via-primary to-transparent"></div>
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full border border-primary/20">
            {subtitle || "Section"}
          </span>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-primary/50 via-primary to-transparent"></div>
        </div>
      </div>

      {/* Title */}
      <h2 className="section-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 relative inline-block">
        <span className="relative z-10 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
          {title}
        </span>
        {/* Decorative underline */}
        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50"></span>
      </h2>

      {/* Subtle glow effect */}
      <div className="relative -mt-8 h-8 blur-2xl opacity-20 pointer-events-none">
        <div className={`h-full w-64 bg-primary ${align === "center" ? "mx-auto" : align === "left" ? "ml-0" : "ml-auto"}`}></div>
      </div>
    </div>
  );
});

SectionTitle.displayName = "SectionTitle";

export default SectionTitle;

