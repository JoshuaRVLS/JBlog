"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar/Navbar";
import SearchBar from "@/components/SearchBar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import PostsLoading from "@/components/PostsLoading";
import { Clock, Heart, MessageCircle, TrendingUp, UserPlus, User } from "lucide-react";
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
  const { authenticated, userId } = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [tags, setTags] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [followStatuses, setFollowStatuses] = useState<Record<string, {
    isFollowing: boolean;
    isFollowedBy: boolean;
    isFriend: boolean;
    shouldFollowBack: boolean;
  }>>({});
  const [followingLoading, setFollowingLoading] = useState<string | null>(null);

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
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Temukan Cerita Saya
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Baca, tulis, dan bagikan pemikiranmu
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar />
          </div>

          {/* Sort & Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            {/* Sort Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy("recent")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === "recent"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent/50"
                  }`}
              >
                Terbaru
              </button>
              <button
                onClick={() => setSortBy("popular")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortBy === "popular"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent/50"
                  }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Populer
              </button>
            </div>

            {/* Tags Filter */}
            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
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
                    onClick={() => setSelectedTag(tag.slug)}
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
            )}
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Posts Feed */}
            <div className="lg:col-span-3">
              {loading ? (
                <PostsLoading />
              ) : posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-xl text-muted-foreground">Tidak ada post ditemukan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/50 transition-all hover:shadow-xl card-hover"
                    >
                      {post.coverImage && (
                        <div className="relative w-full h-48 overflow-hidden">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          {post.author.profilePicture ? (
                            <Image
                              src={post.author.profilePicture}
                              alt={post.author.name}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/20"></div>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {post.author.name}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{post.readingTime} menit</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{post._count.claps}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post._count.comments}</span>
                          </div>
                        </div>
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {post.tags.slice(0, 3).map((postTag) => (
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
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Recommended Users */}
              {authenticated && recommendedUsers.length > 0 && (
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Rekomendasi User</h3>
                  </div>
                  <div className="space-y-4">
                    {recommendedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <Link href={`/users/${user.id}`} className="flex items-center gap-3 flex-1">
                          <Image
                            src={user.profilePicture || generateAvatarUrl(user.name)}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="font-semibold text-sm truncate">{user.name}</p>
                              {user.isVerified && (
                                <span className="text-primary text-xs">✓</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {user._count.followers} followers
                            </p>
                          </div>
                        </Link>
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={followingLoading === user.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
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
                <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Post Populer</h3>
                  </div>
                  <div className="space-y-4">
                    {popularPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="block p-3 rounded-lg hover:bg-accent transition-colors group"
                      >
                        <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
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
