"use client";

import { SkeletonRectangle, SkeletonLine, SkeletonCircle, SkeletonCard } from "@/components/ui/Skeleton";

export default function PostsLoading() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} className="overflow-hidden group p-0">
            {/* Cover Image Skeleton */}
            <SkeletonRectangle 
              width="100%" 
              height={192} 
              className="w-full h-48" 
              delay={i * 0.1}
            />
            
            {/* Content Skeleton */}
            <div className="p-6 space-y-4">
              {/* Author */}
              <div className="flex items-center gap-2">
                <SkeletonCircle size={32} delay={i * 0.1} />
                <SkeletonLine width="112px" height="0.75rem" delay={i * 0.1} />
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <SkeletonLine width="75%" height="1.5rem" delay={i * 0.1} />
                <SkeletonLine width="50%" height="1.5rem" delay={i * 0.1 + 0.1} />
              </div>
              
              {/* Excerpt */}
              <div className="space-y-2 pt-2">
                <SkeletonLine delay={i * 0.1 + 0.2} />
                <SkeletonLine width="83%" delay={i * 0.1 + 0.3} />
                <SkeletonLine width="80%" delay={i * 0.1 + 0.4} />
              </div>
              
              {/* Meta */}
              <div className="flex items-center gap-4 pt-2">
                <SkeletonLine width="64px" height="0.75rem" delay={i * 0.1 + 0.5} />
                <SkeletonLine width="48px" height="0.75rem" delay={i * 0.1 + 0.6} />
                <SkeletonLine width="48px" height="0.75rem" delay={i * 0.1 + 0.7} />
              </div>
              
              {/* Tags */}
              <div className="flex gap-2 pt-2">
                <SkeletonLine width="80px" height="1.5rem" className="rounded-full" delay={i * 0.1 + 0.8} />
                <SkeletonLine width="96px" height="1.5rem" className="rounded-full" delay={i * 0.1 + 0.9} />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}

