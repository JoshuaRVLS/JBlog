"use client";

export default function PostSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-muted"></div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </div>
        <div className="h-6 bg-muted rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

