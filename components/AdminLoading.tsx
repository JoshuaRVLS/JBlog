"use client";

import { Loader2, Sparkles } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="text-center py-16">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="relative">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="text-lg font-medium text-foreground">Memuat data...</span>
      </div>
    </div>
  );
}

