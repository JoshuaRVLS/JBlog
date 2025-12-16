"use client";

import { Loader2, Sparkles } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-medium text-foreground animate-pulse">
          Memuat...
        </p>
      </div>
    </div>
  );
}

