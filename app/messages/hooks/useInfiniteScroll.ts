import { useEffect, useRef } from "react";

interface UseInfiniteScrollProps {
  containerRef: React.RefObject<HTMLDivElement>;
  triggerRef: React.RefObject<HTMLDivElement>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<any>;
}

export function useInfiniteScroll({
  containerRef,
  triggerRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseInfiniteScrollProps) {
  useEffect(() => {
    const container = containerRef.current;
    const loadMoreTrigger = triggerRef.current;

    if (!container || !loadMoreTrigger || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          const previousScrollHeight = container.scrollHeight;
          fetchNextPage().then(() => {
            setTimeout(() => {
              const newScrollHeight = container.scrollHeight;
              const scrollDiff = newScrollHeight - previousScrollHeight;
              container.scrollTop += scrollDiff;
            }, 50);
          });
        }
      },
      {
        root: container,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreTrigger);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, triggerRef, hasNextPage, isFetchingNextPage, fetchNextPage]);
}

