"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import SearchBar from "@/components/SearchBar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import PostsLoading from "@/components/PostsLoading";
import { Clock, Heart, MessageCircle, TrendingUp, UserPlus, User, BookOpen, Sparkles, Filter, Grid3x3, List, Calendar, Eye } from "lucide-react";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import toast from "react-hot-toast";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  createdAt: string;
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
  };
}

interface RecommendedUser {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

export default function BlogPage() {
  const { authenticated, userId, isSuspended } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (isSuspended && authenticated) {
      toast.error("Akun Anda telah di-suspend. Anda tidak dapat mengakses halaman ini.");
      router.push("/");
    }
  }, [isSuspended, authenticated, router]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tags, setTags] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [followStatuses, setFollowStatuses] = useState<Record<string, {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isFriend: boolean;
    shouldFollowBack: boolean;
  }>>({});
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchTags();
    fetchPopularPosts();
    if (authenticated) {
      fetchRecommendedUsers();
    }
  }, [selectedTag, sortBy, authenticated]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      if (sortBy === "popular") {
        const response = await AxiosInstance.get("/search/popular", {
          params: { limit: 20 },
        });
        setPosts(response.data.posts || []);
      } else {
        const params = new URLSearchParams({
          published: "true",
          page: "1",
          limit: "20",
        });
        if (selectedTag) params.append("tag", selectedTag);

        const response = await AxiosInstance.get(`/posts?${params.toString()}`);
        setPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularPosts = async () => {
    try {
      const response = await AxiosInstance.get("/search/popular", {
        params: { limit: 5 },
      });
      setPopularPosts(response.data.posts || []);
    } catch (error) {
      console.error("Error fetching popular posts:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await AxiosInstance.get("/tags");
      setTags(response.data.tags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchRecommendedUsers = async () => {
    try {
      const response = await AxiosInstance.get("/search/recommended-users", {
        params: { limit: 5 },
      });
      setRecommendedUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching recommended users:", error);
    }
  };

  const fetchFollowStatuses = async () => {
    if (!authenticated || !userId) return;
    try {
      const statuses: Record<string, any> = {};
      for (const user of recommendedUsers) {
        try {
          const response = await AxiosInstance.get(`/users/${user.id}/follow-status`);
          statuses[user.id] = response.data;
        } catch (error) {
          console.error(`Error fetching follow status for ${user.id}:`, error);
        }
      }
      setFollowStatuses(statuses);
    } catch (error) {
      console.error("Error fetching follow statuses:", error);
    }
  };

  useEffect(() => {
    if (recommendedUsers.length > 0 && authenticated) {
      fetchFollowStatuses();
    }
  }, [recommendedUsers, authenticated]);

  const handleFollow = useCallback(async (targetUserId: string) => {
    if (!authenticated) {
      toast.error("Harus login dulu untuk follow user");
      return;
    }

    try {
      setFollowingLoading(targetUserId);
      const currentStatus = followStatuses[targetUserId];
      const isFollowing = currentStatus?.isFollowing || false;

      if (isFollowing) {
        await AxiosInstance.delete(`/users/${targetUserId}/follow`);
        setFollowStatuses((prev) => ({
          ...prev,
          [targetUserId]: {
            ...prev[targetUserId],
            isFollowing: false,
            isFriend: false,
          },
        }));
        toast.success("Berhasil unfollow");
      } else {
        const response = await AxiosInstance.post(`/users/${targetUserId}/follow`);
        setFollowStatuses((prev) => ({
          ...prev,
          [targetUserId]: {
            ...prev[targetUserId],
            isFollowing: true,
            isFriend: response.data.isFriend || false,
          },
        }));
        if (response.data.isFriend) {
          toast.success("Berhasil follow! Sekarang kalian sudah berteman!");
        } else {
          toast.success("Berhasil follow");
        }
      }
    } catch (error: any) {
      console.error("Error following user:", error);
      toast.error(error.response?.data?.msg || "Gagal follow/unfollow");
    } finally {
      setFollowingLoading(null);
    }
  }, [authenticated, followStatuses]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border/50">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Temukan Inspirasi</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
                Jelajahi Blog
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Temukan cerita menarik, pelajari hal baru, dan bagikan pemikiranmu dengan komunitas
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative z-[100]">
                <SearchBar />
              </div>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Sort & View Toggle */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                  <button
                    onClick={() => setSortBy("recent")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      sortBy === "recent"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Calendar className="h-4 w-4 inline mr-1.5" />
                    Terbaru
                  </button>
                  <button
                    onClick={() => setSortBy("popular")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      sortBy === "popular"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 inline mr-1.5" />
                    Populer
                  </button>
                </div>

                <div className="h-6 w-px bg-border"></div>

                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Tags Filter */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>
            </div>

            {/* Tags Filter Dropdown */}
            {showFilters && tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedTag(null);
                      setShowFilters(false);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTag === null
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-accent/50"
                    }`}
                  >
                    Semua
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTag(tag.slug);
                        setShowFilters(false);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTag === tag.slug
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-accent/50"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Posts Feed */}
            <div className="lg:col-span-3">
              {loading ? (
                <PostsLoading />
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-xl font-semibold text-foreground mb-2">Tidak ada post ditemukan</p>
                  <p className="text-muted-foreground">Coba ubah filter atau cari dengan kata kunci lain</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="group bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:-translate-y-1"
                    >
                      {post.coverImage && (
                        <div className="relative w-full h-56 overflow-hidden bg-muted">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative">
                            {post.author.profilePicture ? (
                              <Image
                                src={post.author.profilePicture}
                                alt={post.author.name}
                                width={32}
                                height={32}
                                className="rounded-full ring-2 ring-border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {post.author.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                        </div>
                        <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{post.readingTime} min</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Heart className="h-3.5 w-3.5" />
                              <span>{post._count.claps}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>{post._count.comments}</span>
                            </div>
                          </div>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                            {post.tags.slice(0, 3).map((postTag) => (
                              <span
                                key={postTag.tag.id}
                                className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium"
                              >
                                {postTag.tag.name}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="px-2.5 py-1 text-muted-foreground rounded-md text-xs">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="group flex gap-6 bg-card rounded-xl border border-border/50 p-6 hover:border-primary/50 transition-all hover:shadow-lg"
                    >
                      {post.coverImage && (
                        <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          {post.author.profilePicture ? (
                            <Image
                              src={post.author.profilePicture}
                              alt={post.author.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent"></div>
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {post.author.name}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short"
                            })}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>{post.readingTime} min</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Heart className="h-4 w-4" />
                              <span>{post._count.claps}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MessageCircle className="h-4 w-4" />
                              <span>{post._count.comments}</span>
                            </div>
                          </div>
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 2).map((postTag) => (
                                <span
                                  key={postTag.tag.id}
                                  className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                                >
                                  {postTag.tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Recommended Users */}
              {authenticated && recommendedUsers.length > 0 && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm sticky top-24">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Rekomendasi</h3>
                  </div>
                  <div className="space-y-3">
                    {recommendedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                      >
                        <Link href={`/users/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <Image
                              src={user.profilePicture || generateAvatarUrl(user.name)}
                              alt={user.name}
                              width={44}
                              height={44}
                              className="rounded-full ring-2 ring-border"
                            />
                            {user.isVerified && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-[8px] text-primary-foreground">✓</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user._count.followers} followers • {user._count.posts} posts
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={followingLoading === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex-shrink-0 ${
                            followStatuses[user.id]?.isFollowing
                              ? "bg-muted text-foreground hover:bg-accent"
                              : "bg-primary text-primary-foreground hover:opacity-90"
                          }`}
                        >
                          {followingLoading === user.id ? (
                            "Loading..."
                          ) : followStatuses[user.id]?.isFriend ? (
                            "Friends"
                          ) : followStatuses[user.id]?.shouldFollowBack ? (
                            "Follow Back"
                          ) : followStatuses[user.id]?.isFollowing ? (
                            "Following"
                          ) : (
                            "Follow"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Posts */}
              {popularPosts.length > 0 && (
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Trending</h3>
                  </div>
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="block p-3 rounded-xl hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{post._count.claps}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{post._count.comments}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
