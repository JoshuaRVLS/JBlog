"use client";

export default function PostsLoading() {
  return (
    <div className="w-full">
      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border overflow-hidden group"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {/* Cover Image Skeleton */}
            <div className="w-full h-48 bg-gradient-to-br from-muted via-muted/50 to-muted relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            </div>
            
            {/* Content Skeleton */}
            <div className="p-6 space-y-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted/50 animate-pulse"></div>
                <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-28 animate-pulse"></div>
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <div className="h-6 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-6 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-1/2 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
              </div>
              
              {/* Excerpt */}
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-5/6 animate-pulse" style={{ animationDelay: "0.3s" }}></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-4/5 animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
              
              {/* Meta */}
              <div className="flex items-center gap-4 pt-2">
                <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-16 animate-pulse" style={{ animationDelay: "0.5s" }}></div>
                <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-12 animate-pulse" style={{ animationDelay: "0.6s" }}></div>
                <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-12 animate-pulse" style={{ animationDelay: "0.7s" }}></div>
              </div>
              
              {/* Tags */}
              <div className="flex gap-2 pt-2">
                <div className="h-6 bg-gradient-to-r from-muted to-muted/50 rounded-full w-20 animate-pulse" style={{ animationDelay: "0.8s" }}></div>
                <div className="h-6 bg-gradient-to-r from-muted to-muted/50 rounded-full w-24 animate-pulse" style={{ animationDelay: "0.9s" }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

