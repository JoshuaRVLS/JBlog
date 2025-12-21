"use client";

import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { 
  Clock, Heart, MessageCircle, UserPlus, Bookmark, Repeat, Share2, User, 
  Filter, Grid3x3, List, Calendar, TrendingUp, Search, X, ChevronDown,
  ArrowUpDown, Clock as ClockIcon, Eye, BookOpen, Sparkles, Save, Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import BookmarkButton from "@/components/BookmarkButton";
import RepostButton from "@/components/RepostButton";
import ShareButton from "@/components/ShareButton";
import { useQuery } from "@tanstack/react-query";

function ClapButton({ 
  postId, 
  hasClapped, 
  clapCount, 
  onClap 
}: { 
  postId: string; 
  hasClapped: boolean; 
  clapCount: number;
  onClap: (postId: string) => void;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
    onClap(postId);
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      animate={isAnimating ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        hasClapped
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <Heart className={`h-4 w-4 ${hasClapped ? "fill-current" : ""}`} />
      </motion.div>
      <motion.span
        key={clapCount}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.3 }}
      >
        {clapCount}
      </motion.span>
    </motion.button>
  );
}

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  createdAt: string;
  views: number;
  author: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    claps: number;
    comments: number;
    reposts: number;
  };
  hasClapped: boolean;
  isBookmarked: boolean;
  isReposted: boolean;
}

type SortOption = "newest" | "oldest" | "mostClapped" | "mostCommented" | "trending" | "mostViewed";
type TimeRange = "all" | "today" | "week" | "month" | "year";
type ViewMode = "grid" | "list";

export default function FeedPage() {
  const router = useRouter();
  const { authenticated, userId, loading: authLoading } = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Advanced filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);
  const [minReadingTime, setMinReadingTime] = useState<number | null>(null);
  const [maxReadingTime, setMaxReadingTime] = useState<number | null>(null);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch tags for filtering
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await AxiosInstance.get("/tags");
      return response.data.tags || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      router.push("/login");
      return;
    }
    setPage(1);
    fetchFeed(1, true);
  }, [authenticated, authLoading, sortBy, timeRange, selectedTags, searchQuery, minReadingTime, maxReadingTime]);

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

  useEffect(() => {
    if (page > 1) {
      fetchFeed(page, false);
    }
  }, [page]);

  const fetchFeed = async (pageNum: number, reset: boolean) => {
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
      if (minReadingTime !== null) params.minReadingTime = minReadingTime;
      if (maxReadingTime !== null) params.maxReadingTime = maxReadingTime;

      const response = await AxiosInstance.get("/feed", { params });
      const newPosts = response.data.posts || [];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 12);
    } catch (error: any) {
      console.error("Error fetching feed:", error);
      toast.error(error.response?.data?.error || "Gagal mengambil feed");
    } finally {
      setLoading(false);
    }
  };

  const handleClap = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasClapped = post.hasClapped;
    const oldClapCount = post._count.claps;
    
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              hasClapped: !wasClapped,
              _count: {
                ...p._count,
                claps: wasClapped ? oldClapCount - 1 : oldClapCount + 1,
              },
            }
          : p
      )
    );

    try {
      await AxiosInstance.post(`/claps/${postId}`);
    } catch (error: any) {
      console.error("Error clapping:", error);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                hasClapped: wasClapped,
                _count: {
                  ...p._count,
                  claps: oldClapCount,
                },
              }
            : p
        )
      );
      toast.error("Gagal mengubah clap");
    }
  };

  const toggleTag = (tagSlug: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagSlug)
        ? prev.filter((t) => t !== tagSlug)
        : [...prev, tagSlug]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
    setTimeRange("all");
    setSelectedTags([]);
    setMinReadingTime(null);
    setMaxReadingTime(null);
  };

  const hasActiveFilters = searchQuery || sortBy !== "newest" || timeRange !== "all" || selectedTags.length > 0 || minReadingTime !== null || maxReadingTime !== null;

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 page-content">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-gradient">Your Feed</h1>
                <p className="text-muted-foreground">
                  Posts from users you follow
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                  title={viewMode === "grid" ? "List View" : "Grid View"}
                >
                  {viewMode === "grid" ? <List className="h-5 w-5" /> : <Grid3x3 className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg border transition-colors ${
                    showFilters || hasActiveFilters
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-accent"
                  }`}
                  title="Filters"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search in your feed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {selectedTags.map((tagSlug) => {
                  const tag = tags.find((t: any) => t.slug === tagSlug);
                  return tag ? (
                    <button
                      key={tagSlug}
                      onClick={() => toggleTag(tagSlug)}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2 hover:bg-primary/30"
                    >
                      #{tag.name}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null;
                })}
                {sortBy !== "newest" && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm">
                    Sort: {sortBy}
                  </span>
                )}
                {timeRange !== "all" && (
                  <span className="px-3 py-1 bg-muted rounded-full text-sm">
                    {timeRange}
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 bg-destructive/20 text-destructive rounded-full text-sm hover:bg-destructive/30"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Sort By</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: "newest", label: "Newest", icon: ClockIcon },
                        { value: "oldest", label: "Oldest", icon: Calendar },
                        { value: "mostClapped", label: "Most Clapped", icon: Heart },
                        { value: "mostCommented", label: "Most Commented", icon: MessageCircle },
                        { value: "trending", label: "Trending", icon: TrendingUp },
                        { value: "mostViewed", label: "Most Viewed", icon: Eye },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value as SortOption)}
                          className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                            sortBy === option.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-accent"
                          }`}
                        >
                          <option.icon className="h-4 w-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Range */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Time Range</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { value: "all", label: "All Time" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "This Week" },
                        { value: "month", label: "This Month" },
                        { value: "year", label: "This Year" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTimeRange(option.value as TimeRange)}
                          className={`p-3 rounded-lg border transition-colors ${
                            timeRange === option.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-accent"
                          }`}
                        >
                          <span className="text-sm">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Filter by Tags</label>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {tags.slice(0, 20).map((tag: any) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.slug)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTags.includes(tag.slug)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reading Time Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Reading Time (minutes)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                        <input
                          type="number"
                          min="0"
                          value={minReadingTime || ""}
                          onChange={(e) => setMinReadingTime(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Any"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                        <input
                          type="number"
                          min="0"
                          value={maxReadingTime || ""}
                          onChange={(e) => setMaxReadingTime(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Any"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-6 animate-pulse"
                >
                  <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No posts found</h2>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more posts"
                  : "Start following users to see their posts in your feed!"}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/blog"
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Explore Posts
                </Link>
              )}
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onClap={handleClap} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} onClap={handleClap} />
                  ))}
                </div>
              )}
              
              {/* Infinite Scroll Trigger */}
              <div ref={loadMoreRef} className="h-10" />
              
              {loading && posts.length > 0 && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function PostCard({ post, onClap }: { post: Post; onClap: (postId: string) => void }) {
  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      {post.coverImage && (
        <Link href={`/posts/${post.id}`}>
          <div className="relative w-full h-64">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        </Link>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/users/${post.author.id}`}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              {post.author.profilePicture ? (
                <Image
                  src={post.author.profilePicture}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
          </Link>
          <div>
            <Link
              href={`/users/${post.author.id}`}
              className="font-semibold hover:underline"
            >
              {post.author.name}
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{post.readingTime} min read</span>
            </div>
          </div>
        </div>

        <Link href={`/posts/${post.id}`}>
          <h2 className="text-2xl font-bold mb-2 hover:text-primary transition-colors">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {post.excerpt}
            </p>
          )}
        </Link>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-accent transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <ClapButton
            postId={post.id}
            hasClapped={post.hasClapped}
            clapCount={post._count.claps}
            onClap={onClap}
          />
          <Link
            href={`/posts/${post.id}#comments`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post._count.comments}</span>
          </Link>
          <RepostButton
            postId={post.id}
            initialReposted={post.isReposted}
            repostCount={post._count.reposts}
          />
          <BookmarkButton
            postId={post.id}
            initialBookmarked={post.isBookmarked}
          />
          <ShareButton postId={post.id} title={post.title} />
        </div>
      </div>
    </article>
  );
}
