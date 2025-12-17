import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "default" | "shimmer" | "pulse";
  delay?: number;
}

function Skeleton({ 
  className, 
  variant = "default",
  delay = 0,
  ...props 
}: SkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-muted via-muted/80 to-muted rounded";
  
  const variantClasses = {
    default: "animate-pulse",
    shimmer: "relative overflow-hidden",
    pulse: "animate-pulse",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ animationDelay: `${delay}s` }}
      {...props}
    >
      {variant === "shimmer" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
    </div>
  );
}

// Pre-built skeleton components
function SkeletonLine({ width = "100%", height = "1rem", delay = 0, ...props }: { width?: string | number; height?: string | number; delay?: number } & React.ComponentProps<"div">) {
  return (
    <Skeleton 
      className="h-4" 
      style={{ width: typeof width === "number" ? `${width}px` : width, height: typeof height === "number" ? `${height}px` : height, animationDelay: `${delay}s` }}
      {...props}
    />
  );
}

function SkeletonCircle({ size = 40, delay = 0, ...props }: { size?: number; delay?: number } & React.ComponentProps<"div">) {
  return (
    <Skeleton 
      className="rounded-full" 
      style={{ width: size, height: size, animationDelay: `${delay}s` }}
      {...props}
    />
  );
}

function SkeletonRectangle({ width = "100%", height = 200, delay = 0, ...props }: { width?: string | number; height?: number; delay?: number } & React.ComponentProps<"div">) {
  return (
    <Skeleton 
      variant="shimmer"
      style={{ width: typeof width === "number" ? `${width}px` : width, height: `${height}px`, animationDelay: `${delay}s` }}
      {...props}
    />
  );
}

function SkeletonCard({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { 
  Skeleton, 
  SkeletonLine, 
  SkeletonCircle, 
  SkeletonRectangle,
  SkeletonCard 
};

