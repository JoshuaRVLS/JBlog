"use client";

export default function DashboardPostsLoading() {
  return (
    <div className="space-y-4">
      {/* Skeleton Posts */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cover Image Skeleton */}
            <div className="lg:w-48 h-32 rounded-lg bg-gradient-to-br from-muted via-muted/50 to-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-6 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-3/4 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-full animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.1}s` }}></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-5/6 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-4/5 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.3}s` }}></div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-20 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.4}s` }}></div>
                <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.5}s` }}></div>
                <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.6}s` }}></div>
                <div className="h-4 bg-gradient-to-r from-muted to-muted/50 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.7}s` }}></div>
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex lg:flex-col items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.8}s` }}></div>
              <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.9}s` }}></div>
              <div className="w-10 h-10 bg-gradient-to-br from-muted to-muted/50 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1 + 1}s` }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

