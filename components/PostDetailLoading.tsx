"use client";

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image Skeleton */}
          <div className="h-64 md:h-96 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            {/* Author & Meta */}
            <div className="flex items-center gap-4 pb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/50 animate-pulse"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-gradient-to-r from-muted to-muted/50 rounded w-24 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <div className="h-10 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-muted via-muted/80 to-muted rounded w-1/2 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            </div>
            
            {/* Content Paragraphs */}
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className={`h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded animate-pulse`}
                  style={{
                    width: i % 3 === 0 ? "90%" : i % 2 === 0 ? "95%" : "100%",
                    animationDelay: `${0.3 + i * 0.1}s`,
                  }}
                ></div>
              ))}
            </div>

            {/* Image Placeholder */}
            <div className="h-64 bg-gradient-to-br from-muted via-muted/50 to-muted rounded-xl relative overflow-hidden my-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            </div>

            {/* More Content */}
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-4 bg-gradient-to-r from-muted via-muted/80 to-muted rounded animate-pulse`}
                  style={{
                    width: i % 3 === 0 ? "85%" : i % 2 === 0 ? "100%" : "92%",
                    animationDelay: `${1.1 + i * 0.1}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

