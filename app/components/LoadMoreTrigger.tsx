"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface LoadMoreTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function LoadMoreTrigger({
  onLoadMore,
  isLoading,
  containerRef,
}: LoadMoreTriggerProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: "100px",
        root: containerRef?.current || null
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoadMore, isLoading, containerRef]);

  return (
    <div ref={observerRef} className="h-20 flex items-center justify-center">
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memuat update logs...</span>
        </div>
      )}
    </div>
  );
}

