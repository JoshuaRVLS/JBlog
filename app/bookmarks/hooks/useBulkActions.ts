import { useState } from "react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { BookmarkedPost } from "../types";

interface UseBulkActionsProps {
  bookmarks: BookmarkedPost[];
  setBookmarks: React.Dispatch<React.SetStateAction<BookmarkedPost[]>>;
  onRefetch: () => void;
}

export function useBulkActions({
  bookmarks,
  setBookmarks,
  onRefetch,
}: UseBulkActionsProps) {
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const toggleSelectBookmark = (bookmarkId: string) => {
    setSelectedBookmarks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedBookmarks.size === bookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(bookmarks.map((b) => b.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookmarks.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedBookmarks).map((bookmarkId) => {
          const bookmark = bookmarks.find((b) => b.id === bookmarkId);
          return bookmark ? AxiosInstance.delete(`/bookmarks/${bookmark.post.id}`) : Promise.resolve();
        })
      );

      setBookmarks((prev) => prev.filter((b) => !selectedBookmarks.has(b.id)));
      setSelectedBookmarks(new Set());
      toast.success(`${selectedBookmarks.size} bookmark(s) deleted`);
    } catch (error: any) {
      console.error("Error deleting bookmarks:", error);
      toast.error("Gagal menghapus bookmarks");
    }
  };

  const handleBulkMoveToCollection = async (collectionId: string) => {
    if (selectedBookmarks.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedBookmarks).map((bookmarkId) =>
          AxiosInstance.put(`/bookmarks/${bookmarkId}/collection`, { collectionId })
        )
      );

      setSelectedBookmarks(new Set());
      toast.success(`Moved ${selectedBookmarks.size} bookmark(s) to collection`);
      onRefetch();
    } catch (error: any) {
      console.error("Error moving bookmarks:", error);
      toast.error("Gagal memindahkan bookmarks");
    }
  };

  return {
    selectedBookmarks,
    setSelectedBookmarks,
    showBulkActions,
    setShowBulkActions,
    toggleSelectBookmark,
    selectAll,
    handleBulkDelete,
    handleBulkMoveToCollection,
  };
}

