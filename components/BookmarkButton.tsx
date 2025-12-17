"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "motion/react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
  className?: string;
  onToggle?: (bookmarked: boolean) => void;
}

export default function BookmarkButton({
  postId,
  initialBookmarked = false,
  className = "",
  onToggle,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  const handleToggle = async () => {
    if (loading) return;

    // Optimistic update - update UI immediately
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    setIsAnimating(true);
    onToggle?.(!wasBookmarked);

    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);

    try {
      setLoading(true);

      if (wasBookmarked) {
        await AxiosInstance.delete(`/bookmarks/${postId}`);
        toast.success("Post dihapus dari bookmark");
      } else {
        await AxiosInstance.post(`/bookmarks/${postId}`);
        toast.success("Post ditambahkan ke bookmark");
      }
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      // Rollback on error
      setIsBookmarked(wasBookmarked);
      onToggle?.(wasBookmarked);
      toast.error(error.response?.data?.error || "Gagal mengubah bookmark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      whileTap={{ scale: 0.95 }}
      animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isBookmarked
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <motion.div
        animate={isAnimating ? { rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
      </motion.div>
      <span className="text-sm">
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </span>
    </motion.button>
  );
}

