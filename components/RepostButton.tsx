"use client";

import { useState, useEffect } from "react";
import { Repeat, Repeat2 } from "lucide-react";
import { motion } from "motion/react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

interface RepostButtonProps {
  postId: string;
  initialReposted?: boolean;
  repostCount?: number;
  className?: string;
  onToggle?: (reposted: boolean) => void;
}

export default function RepostButton({
  postId,
  initialReposted = false,
  repostCount = 0,
  className = "",
  onToggle,
}: RepostButtonProps) {
  const [isReposted, setIsReposted] = useState(initialReposted);
  const [count, setCount] = useState(repostCount);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsReposted(initialReposted);
    setCount(repostCount);
  }, [initialReposted, repostCount]);

  const handleToggle = async () => {
    if (loading) return;

    // Optimistic update - update UI immediately
    const wasReposted = isReposted;
    const oldCount = count;
    
    if (wasReposted) {
      setIsReposted(false);
      setCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsReposted(true);
      setCount((prev) => prev + 1);
    }
    
    setIsAnimating(true);
    onToggle?.(!wasReposted);

    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 400);

    try {
      setLoading(true);

      if (wasReposted) {
        await AxiosInstance.delete(`/reposts/${postId}`);
        toast.success("Repost dibatalkan");
      } else {
        await AxiosInstance.post(`/reposts/${postId}`);
        toast.success("Post berhasil di-repost");
      }
    } catch (error: any) {
      console.error("Error toggling repost:", error);
      // Rollback on error
      setIsReposted(wasReposted);
      setCount(oldCount);
      onToggle?.(wasReposted);
      toast.error(error.response?.data?.error || "Gagal mengubah repost");
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
        isReposted
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <motion.div
        animate={isAnimating ? { rotate: [0, 180, 360] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {isReposted ? (
          <Repeat2 className="h-4 w-4" />
        ) : (
          <Repeat className="h-4 w-4" />
        )}
      </motion.div>
      <motion.span
        key={count}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 }}
        className="text-sm"
      >
        {count > 0 && count}
      </motion.span>
    </motion.button>
  );
}

