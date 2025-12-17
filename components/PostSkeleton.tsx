"use client";

import { SkeletonRectangle, SkeletonLine, SkeletonCircle, SkeletonCard } from "@/components/ui/Skeleton";

export default function PostSkeleton() {
  return (
    <SkeletonCard className="overflow-hidden">
      <SkeletonRectangle width="100%" height={192} className="w-full h-48" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <SkeletonCircle size={24} />
          <SkeletonLine width="96px" />
        </div>
        <SkeletonLine width="75%" height="1.5rem" />
        <div className="space-y-2">
          <SkeletonLine />
          <SkeletonLine width="83%" />
        </div>
        <div className="flex items-center gap-4">
          <SkeletonLine width="64px" />
          <SkeletonLine width="64px" />
          <SkeletonLine width="64px" />
        </div>
      </div>
    </SkeletonCard>
  );
}

