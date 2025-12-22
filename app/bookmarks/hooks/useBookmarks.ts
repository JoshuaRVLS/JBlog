import { useState, useEffect, useRef } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { BookmarkedPost, SortOption, TimeRange } from "../types";

interface UseBookmarksProps {
  sortBy: SortOption;
  timeRange: TimeRange;
  selectedTags: string[];
  selectedCollection: string | null;
  searchQuery: string;
  minReadingTime: number | null;
  maxReadingTime: number | null;
}

export function useBookmarks({
  sortBy,
  timeRange,
  selectedTags,
  selectedCollection,
  searchQuery,
  minReadingTime,
  maxReadingTime,
}: UseBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchBookmarks = async (pageNum: number, reset: boolean) => {
    try {
      if (reset) setLoading(true);

      const params: any = {
        page: pageNum,
        limit: 12,
        sortBy,
        timeRange,
      };

      if (searchQuery) params.search = searchQuery;
      if (selectedTags.length > 0) params.tags = selectedTags.join(",");
      if (selectedCollection) params.collectionId = selectedCollection;
      if (minReadingTime !== null) params.minReadingTime = minReadingTime;
      if (maxReadingTime !== null) params.maxReadingTime = maxReadingTime;

      const response = await AxiosInstance.get("/bookmarks", { params });
      const newBookmarks = response.data.bookmarks || [];

      if (reset) {
        setBookmarks(newBookmarks);
      } else {
        setBookmarks((prev) => [...prev, ...newBookmarks]);
      }

      setHasMore(newBookmarks.length === 12);
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error);
      toast.error(error.response?.data?.error || "Gagal mengambil bookmarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchBookmarks(1, true);
  }, [sortBy, timeRange, selectedTags, searchQuery, selectedCollection, minReadingTime, maxReadingTime]);

  useEffect(() => {
    if (page > 1) {
      fetchBookmarks(page, false);
    }
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const handleUnbookmark = (postId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
  };

  return {
    bookmarks,
    setBookmarks,
    loading,
    hasMore,
    loadMoreRef,
    handleUnbookmark,
    refetch: () => fetchBookmarks(1, true),
  };
}

