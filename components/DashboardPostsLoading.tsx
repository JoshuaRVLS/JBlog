"use client";

import { SkeletonRectangle, SkeletonLine, SkeletonCircle, SkeletonCard } from "@/components/ui/Skeleton";

export default function DashboardPostsLoading() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i}>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Cover Image Skeleton */}
            <SkeletonRectangle 
              width="192px" 
              height={128} 
              className="lg:w-48 h-32 rounded-lg" 
              delay={i * 0.1}
            />

            {/* Content Skeleton */}
            <div className="flex-1 space-y-4">
              <SkeletonLine width="75%" height="1.5rem" delay={i * 0.1} />
              <div className="space-y-2">
                <SkeletonLine delay={i * 0.1 + 0.1} />
                <SkeletonLine width="83%" delay={i * 0.1 + 0.2} />
                <SkeletonLine width="80%" delay={i * 0.1 + 0.3} />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <SkeletonLine width="80px" delay={i * 0.1 + 0.4} />
                <SkeletonLine width="64px" delay={i * 0.1 + 0.5} />
                <SkeletonLine width="64px" delay={i * 0.1 + 0.6} />
                <SkeletonLine width="64px" delay={i * 0.1 + 0.7} />
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex lg:flex-col items-center gap-2">
              <SkeletonCircle size={40} className="rounded-lg" delay={i * 0.1 + 0.8} />
              <SkeletonCircle size={40} className="rounded-lg" delay={i * 0.1 + 0.9} />
              <SkeletonCircle size={40} className="rounded-lg" delay={i * 0.1 + 1} />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

