"use client";

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { 
  Clock, Heart, MessageCircle, User, BookmarkCheck, Filter, Grid3x3, List, 
  Calendar, TrendingUp, Search, X, ChevronDown, ArrowUpDown, Eye, 
  Trash2, FolderPlus, Folder, CheckSquare, Square, Download, FileText,
  Tag as TagIcon, User as UserIcon, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import BookmarkButton from "@/components/BookmarkButton";
import RepostButton from "@/components/RepostButton";
import ShareButton from "@/components/ShareButton";
import { useQuery } from "@tanstack/react-query";

interface BookmarkedPost {
  id: string;
  createdAt: string;
  notes: string | null;
  collectionId: string | null;
  post: {
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
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: {
    bookmarks: number;
  };
}

type SortOption = "newest" | "oldest" | "mostClapped" | "mostCommented" | "mostViewed" | "readingTime";
type TimeRange = "all" | "today" | "week" | "month" | "year";
type ViewMode = "grid" | "list";

export default function BookmarksPage() {
  const router = useRouter();
  const { authenticated, userId, loading: authLoading } = useContext(AuthContext);
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Advanced filters
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showFilters, setShowFilters] = useState(false);
  const [minReadingTime, setMinReadingTime] = useState<number | null>(null);
  const [maxReadingTime, setMaxReadingTime] = useState<number | null>(null);
  
  // Bulk actions
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState("#3b82f6");
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch collections
  const { data: collections = [], refetch: refetchCollections } = useQuery<Collection[]>({
    queryKey: ["bookmark-collections", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await AxiosInstance.get("/bookmarks/collections");
      return response.data.collections || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

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
    fetchBookmarks(1, true);
  }, [authenticated, authLoading, sortBy, timeRange, selectedTags, searchQuery, selectedCollection, minReadingTime, maxReadingTime]);

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
      fetchBookmarks(page, false);
    }
  }, [page]);

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

  const handleUnbookmark = (postId: string) => {
    setBookmarks((prev) => prev.filter((b) => b.post.id !== postId));
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
    setSelectedCollection(null);
    setMinReadingTime(null);
    setMaxReadingTime(null);
  };

  const hasActiveFilters = searchQuery || sortBy !== "newest" || timeRange !== "all" || selectedTags.length > 0 || selectedCollection !== null || minReadingTime !== null || maxReadingTime !== null;

  // Bulk actions
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
      fetchBookmarks(1, true);
    } catch (error: any) {
      console.error("Error moving bookmarks:", error);
      toast.error("Gagal memindahkan bookmarks");
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }

    try {
      await AxiosInstance.post("/bookmarks/collections", {
        name: newCollectionName.trim(),
        color: newCollectionColor,
      });
      
      setNewCollectionName("");
      setShowCollectionModal(false);
      refetchCollections();
      toast.success("Collection created");
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast.error(error.response?.data?.error || "Gagal membuat collection");
    }
  };

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
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-gradient">
                  <BookmarkCheck className="h-10 w-10" />
                  My Bookmarks
                </h1>
                <p className="text-muted-foreground">
                  Posts you've saved for later
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
                <button
                  onClick={() => setShowCollectionModal(true)}
                  className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                  title="Create Collection"
                >
                  <FolderPlus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search in your bookmarks..."
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

            {/* Bulk Actions Bar */}
            {selectedBookmarks.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {selectedBookmarks.size} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <Folder className="h-4 w-4" />
                      Move to Collection
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showBulkActions && (
                      <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-64 overflow-y-auto">
                        <button
                          onClick={() => {
                            handleBulkMoveToCollection("");
                            setShowBulkActions(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                        >
                          No Collection
                        </button>
                        {collections.map((collection) => (
                          <button
                            key={collection.id}
                            onClick={() => {
                              handleBulkMoveToCollection(collection.id);
                              setShowBulkActions(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: collection.color }}
                            />
                            {collection.name} ({collection._count.bookmarks})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBookmarks(new Set())}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            )}

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
                {selectedCollection && (
                  <button
                    onClick={() => setSelectedCollection(null)}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2 hover:bg-primary/30"
                  >
                    Collection: {collections.find((c) => c.id === selectedCollection)?.name}
                    <X className="h-3 w-3" />
                  </button>
                )}
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
                  {/* Collections Filter */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Collections</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCollection(null)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedCollection === null
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-accent"
                        }`}
                      >
                        All
                      </button>
                      {collections.map((collection) => (
                        <button
                          key={collection.id}
                          onClick={() => setSelectedCollection(collection.id)}
                          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                            selectedCollection === collection.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-accent"
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: collection.color }}
                          />
                          {collection.name} ({collection._count.bookmarks})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Sort By</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: "newest", label: "Newest", icon: Calendar },
                        { value: "oldest", label: "Oldest", icon: Clock },
                        { value: "mostClapped", label: "Most Clapped", icon: Heart },
                        { value: "mostCommented", label: "Most Commented", icon: MessageCircle },
                        { value: "mostViewed", label: "Most Viewed", icon: Eye },
                        { value: "readingTime", label: "Reading Time", icon: Clock },
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

          {/* Create Collection Modal */}
          <AnimatePresence>
            {showCollectionModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-xl p-6 shadow-lg max-w-md w-full"
                >
                  <h2 className="text-2xl font-bold mb-4">Create Collection</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Color</label>
                      <input
                        type="color"
                        value={newCollectionColor}
                        onChange={(e) => setNewCollectionColor(e.target.value)}
                        className="w-full h-12 rounded-lg border border-border"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreateCollection}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCollectionModal(false);
                          setNewCollectionName("");
                        }}
                        className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Bookmarks */}
          {loading && bookmarks.length === 0 ? (
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
          ) : bookmarks.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <BookmarkCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No bookmarks found</h2>
              <p className="text-muted-foreground mb-6">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more bookmarks"
                  : "Start bookmarking posts to save them for later!"}
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
              {/* Select All */}
              <div className="mb-4">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  {selectedBookmarks.size === bookmarks.length ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  <span>Select All</span>
                </button>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onUnbookmark={handleUnbookmark}
                      isSelected={selectedBookmarks.has(bookmark.id)}
                      onToggleSelect={() => toggleSelectBookmark(bookmark.id)}
                      collections={collections}
                      onCollectionChange={() => fetchBookmarks(1, true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {bookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      onUnbookmark={handleUnbookmark}
                      isSelected={selectedBookmarks.has(bookmark.id)}
                      onToggleSelect={() => toggleSelectBookmark(bookmark.id)}
                      collections={collections}
                      onCollectionChange={() => fetchBookmarks(1, true)}
                    />
                  ))}
                </div>
              )}
              
              {/* Infinite Scroll Trigger */}
              <div ref={loadMoreRef} className="h-10" />
              
              {loading && bookmarks.length > 0 && (
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

function BookmarkCard({
  bookmark,
  onUnbookmark,
  isSelected,
  onToggleSelect,
  collections,
  onCollectionChange,
}: {
  bookmark: BookmarkedPost;
  onUnbookmark: (postId: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  collections: Collection[];
  onCollectionChange: () => void;
}) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);

  const handleMoveToCollection = async (collectionId: string | null) => {
    try {
      await AxiosInstance.put(`/bookmarks/${bookmark.id}/collection`, { collectionId });
      onCollectionChange();
      setShowCollectionMenu(false);
      toast.success("Bookmark moved");
    } catch (error: any) {
      console.error("Error moving bookmark:", error);
      toast.error("Gagal memindahkan bookmark");
    }
  };

  const post = bookmark.post;
  const currentCollection = collections.find((c) => c.id === bookmark.collectionId);

  return (
    <article className={`bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all ${
      isSelected ? "border-primary ring-2 ring-primary" : "border-border"
    }`}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggleSelect}
          className="mt-1 p-1 hover:bg-accent rounded transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1">
          {post.coverImage && (
            <Link href={`/posts/${post.id}`}>
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
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
          <div className="p-4">
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

            {bookmark.notes && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground italic">"{bookmark.notes}"</p>
              </div>
            )}

            {currentCollection && (
              <div className="mb-4 flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  In: <span style={{ color: currentCollection.color }}>{currentCollection.name}</span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{post._count.claps}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span>{post._count.comments}</span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Move to Collection"
                >
                  <Folder className="h-4 w-4" />
                </button>
                {showCollectionMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
                    <button
                      onClick={() => handleMoveToCollection(null)}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                    >
                      No Collection
                    </button>
                    {collections.map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => handleMoveToCollection(collection.id)}
                        className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: collection.color }}
                        />
                        {collection.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <BookmarkButton
                postId={post.id}
                initialBookmarked={true}
                onToggle={(bookmarked) => {
                  if (!bookmarked) {
                    onUnbookmark(post.id);
                  }
                }}
              />
              <ShareButton postId={post.id} title={post.title} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
