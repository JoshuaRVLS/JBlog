"use client";

import { SkeletonRectangle, SkeletonLine, SkeletonCircle } from "@/components/ui/Skeleton";

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image Skeleton */}
          <SkeletonRectangle 
            height={384} 
            className="h-64 md:h-96 rounded-xl mb-8" 
          />

          {/* Content Skeleton */}
          <div className="space-y-6">
            {/* Author & Meta */}
            <div className="flex items-center gap-4 pb-4">
              <SkeletonCircle size={48} />
              <div className="space-y-2 flex-1">
                <SkeletonLine width="128px" />
                <SkeletonLine width="96px" height="0.75rem" delay={0.1} />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <SkeletonLine width="75%" height="2.5rem" />
              <SkeletonLine width="50%" height="1.5rem" delay={0.2} />
            </div>
            
            {/* Content Paragraphs */}
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonLine
                  key={i}
                  width={i % 3 === 0 ? "90%" : i % 2 === 0 ? "95%" : "100%"}
                  delay={0.3 + i * 0.1}
                />
              ))}
            </div>

            {/* Image Placeholder */}
            <SkeletonRectangle 
              height={256} 
              className="rounded-xl my-6" 
            />

            {/* More Content */}
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonLine
                  key={i}
                  width={i % 3 === 0 ? "85%" : i % 2 === 0 ? "100%" : "92%"}
                  delay={1.1 + i * 0.1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

