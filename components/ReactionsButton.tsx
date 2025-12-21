"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Smile, Laugh, AlertCircle, Frown, Angry } from "lucide-react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const REACTION_TYPES = [
  { type: "like", icon: Heart, label: "Like", color: "text-red-500" },
  { type: "love", icon: Heart, label: "Love", color: "text-pink-500" },
  { type: "laugh", icon: Laugh, label: "Haha", color: "text-yellow-500" },
  { type: "wow", icon: AlertCircle, label: "Wow", color: "text-purple-500" },
  { type: "sad", icon: Frown, label: "Sad", color: "text-blue-500" },
  { type: "angry", icon: Angry, label: "Angry", color: "text-red-600" },
] as const;

interface ReactionsButtonProps {
  postId: string;
  className?: string;
}

export default function ReactionsButton({ postId, className = "" }: ReactionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fetch reactions for this post
  const { data: reactionsData, isLoading } = useQuery({
    queryKey: ["post-reactions", postId],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/posts/${postId}/reactions`);
      return response.data;
    },
  });

  const userReaction = reactionsData?.userReaction;
  const counts = reactionsData?.counts || {};
  const totalReactions = Object.values(counts).reduce((sum: number, count: any) => sum + (count || 0), 0);

  // Get current user's reaction type
  const currentReactionType = userReaction || null;

  // Get reaction icon and label for current reaction
  const currentReaction = REACTION_TYPES.find((r) => r.type === currentReactionType);
  const CurrentIcon = currentReaction?.icon || Heart;

  const handleReaction = async (reactionType: string) => {
    try {
      // If clicking the same reaction, remove it
      if (currentReactionType === reactionType) {
        await AxiosInstance.delete(`/posts/${postId}/reactions`);
        toast.success("Reaction dihapus");
      } else {
        // Add or change reaction
        await AxiosInstance.post(`/posts/${postId}/reactions`, { type: reactionType });
        toast.success(`${REACTION_TYPES.find((r) => r.type === reactionType)?.label || "Reaction"} ditambahkan`);
      }

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["post-reactions", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      // Close popup after a short delay (better UX on mobile)
      setTimeout(() => {
      setIsOpen(false);
        setIsHovered(false);
      }, 300);
    } catch (error: any) {
      console.error("Error reacting:", error);
      toast.error(error.response?.data?.msg || "Gagal menambahkan reaction");
    }
  };

  // Get top 2 reactions by count
  const topReactions = Object.entries(counts)
    .filter(([_, count]) => (count as number) > 0)
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
    .slice(0, 2)
    .map(([type]) => REACTION_TYPES.find((r) => r.type === type))
    .filter(Boolean);

  // Close popup when clicking outside (for mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        popupRef.current &&
        buttonRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsHovered(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Reaction Button */}
      <motion.button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all relative group touch-manipulation ${
          currentReactionType
            ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
            : "bg-muted text-muted-foreground hover:bg-accent border border-border"
        }`}
      >
        {/* Current Reaction Icon */}
        <motion.div
          animate={currentReactionType ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`${currentReaction?.color || "text-current"}`}
        >
          <CurrentIcon className={`h-5 w-5 ${currentReactionType === "like" || currentReactionType === "love" ? "fill-current" : ""}`} />
        </motion.div>

        {/* Show count or "React" text */}
        {totalReactions > 0 ? (
          <motion.span
            key={totalReactions}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.3 }}
            className="font-semibold"
          >
            {totalReactions}
          </motion.span>
        ) : (
          <span className="text-sm">React</span>
        )}

        {/* Show top reactions preview (small icons) */}
        {!isOpen && topReactions.length > 0 && (
          <div className="flex items-center gap-1 ml-1">
            {topReactions.map((reaction, idx) => {
              const Icon = reaction?.icon;
              if (!Icon) return null;
              return (
                <div key={reaction?.type} className="flex items-center" style={{ marginLeft: idx > 0 ? "-8px" : "0" }}>
                  <Icon
                    className={`h-4 w-4 ${reaction?.color || "text-current"} ${reaction?.type === "like" || reaction?.type === "love" ? "fill-current" : ""}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </motion.button>

      {/* Reactions Popup */}
      <AnimatePresence>
        {(isOpen || isHovered) && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-2xl p-2 shadow-2xl z-[100] flex items-center gap-2 touch-manipulation"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
              setIsHovered(false);
              // Only auto-close on desktop (not mobile)
              if (window.innerWidth >= 768) {
              setTimeout(() => setIsOpen(false), 200);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {REACTION_TYPES.map((reaction) => {
              const Icon = reaction.icon;
              const count = counts[reaction.type] || 0;
              const isActive = currentReactionType === reaction.type;

              return (
                <motion.button
                  key={reaction.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReaction(reaction.type);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleReaction(reaction.type);
                  }}
                  whileHover={{ scale: 1.2, y: -4 }}
                  whileTap={{ scale: 0.9 }}
                  className={`relative p-3 md:p-2 rounded-xl transition-all touch-manipulation ${
                    isActive ? "bg-primary/20" : "hover:bg-accent active:bg-accent"
                  }`}
                  title={`${reaction.label} (${count})`}
                >
                  <Icon
                    className={`h-6 w-6 ${reaction.color} ${reaction.type === "like" || reaction.type === "love" ? (isActive ? "fill-current" : "") : ""}`}
                  />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

