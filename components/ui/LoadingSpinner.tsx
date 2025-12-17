"use client";

import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  showSparkles?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  message = "Memuat data...", 
  size = "md",
  showSparkles = false,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const sparkleSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={cn("text-center py-16", className)}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="relative">
          <Loader2 className={cn(sizeClasses[size], "text-primary animate-spin")} />
          {showSparkles && (
            <Sparkles 
              className={cn(
                sparkleSizeClasses[size], 
                "text-primary absolute -top-1 -right-1 animate-pulse"
              )} 
            />
          )}
        </div>
        {message && (
          <span className="text-lg font-medium text-foreground">{message}</span>
        )}
      </div>
    </div>
  );
}

