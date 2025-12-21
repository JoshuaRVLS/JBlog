"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Plus, Search, Edit, Eye, Trash2, Clock, Heart, MessageCircle, BookOpen, TrendingUp, User } from "lucide-react";
import toast from "react-hot-toast";
import DashboardPostsLoading from "@/components/DashboardPostsLoading";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Lazy load ActivityChart
const ActivityChart = dynamic(() => import("@/components/ActivityChart"), {
  loading: () => (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    </div>
  ),
  ssr: false,
});

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  readingTime: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  _count: {
    claps: number;
    comments: number;
  };
}

export default function Dashboard() {
  const { userId, authenticated, isSuspended, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (isSuspended && authenticated) {
      toast.error("Akun Anda telah di-suspend. Anda tidak dapat mengakses dashboard.");
      router.push("/");
    }
  }, [isSuspended, authenticated, router]);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Fetch user data dengan React Query (cached)
  const { data: user } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await AxiosInstance.get(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId && authenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 menit
  });

  // Fetch posts dengan React Query (cached dan optimized)
  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ["dashboard-posts", userId, user?.isOwner],
    queryFn: async () => {
      if (user?.isOwner) {
        // Owner lihat semua posts (termasuk draft)
        const response = await AxiosInstance.get(`/posts`, {
          params: { limit: 50 }, // Reduce initial load
        });
        return response.data.posts || [];
      } else {
        // User biasa: dashboard hanya untuk post milik sendiri (published + draft)
        const response = await AxiosInstance.get(`/posts`, {
          params: {
            authorId: userId,
            limit: 50, // Reduce initial load
          },
        });
        return response.data.posts || [];
      }
    },
    enabled: !!userId && authenticated && !authLoading && !!user,
    staleTime: 2 * 60 * 1000, // 2 menit cache
    refetchOnWindowFocus: false, // Jangan refetch saat window focus
  });

  const posts = postsData || [];

  useEffect(() => {
    if (authLoading) return;
    if (!authenticated) {
      router.push("/login");
    }
  }, [authenticated, authLoading, router]);


  // Delete mutation dengan optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await AxiosInstance.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      // Invalidate dan refetch posts
      queryClient.invalidateQueries({ queryKey: ["dashboard-posts"] });
      toast.success("Post berhasil dihapus");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Gagal menghapus post");
    },
  });

  const handleDelete = useCallback(async (postId: string) => {
    if (!confirm("Yakin mau hapus post ini?")) return;
    deleteMutation.mutate(postId);
  }, [deleteMutation]);

  const filteredPosts = useMemo(() => {
    return posts.filter(
      (post: Post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    if (!posts || !userId) return { publishedCount: 0, draftCount: 0, totalClaps: 0, totalComments: 0 };
    // Filter posts yang dimiliki user
    const userPosts = posts.filter((p: Post) => p.author.id === userId);
    const publishedCount = userPosts.filter((p: Post) => p.published).length;
    const draftCount = userPosts.filter((p: Post) => !p.published).length;
    const totalClaps = userPosts.reduce((sum: number, p: Post) => sum + p._count.claps, 0);
    const totalComments = userPosts.reduce((sum: number, p: Post) => sum + p._count.comments, 0);
    return { publishedCount, draftCount, totalClaps, totalComments };
  }, [posts, userId]);

  if (!authenticated) {
    return null;
  }

  const loading = authLoading || loadingPosts || !user;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-20 page-content">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <DashboardPostsLoading />
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user?.isOwner;
  const isAdmin = user?.isAdmin;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
        <main className="pt-24 page-content">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Dashboard
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Kelola post blog kamu
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm sm:text-base"
                  >
                    <span className="hidden sm:inline">Panel Admin</span>
                    <span className="sm:hidden">Admin</span>
                  </Link>
                )}
                <Link
                  href="/dashboard/posts/new"
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Post Baru</span>
                  <span className="sm:hidden">Baru</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Post</span>
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Edit className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">{posts.filter((p: Post) => p.author.id === userId).length}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.publishedCount} terpublikasi, {stats.draftCount} draft
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-accent/5 border border-green-500/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Terpublikasi</span>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Eye className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-500">{stats.publishedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.draftCount} draft
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 via-red-500/5 to-accent/5 border border-red-500/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Clap</span>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-500">{stats.totalClaps}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Semua post kamu
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-accent/5 border border-blue-500/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Komentar</span>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-500">{stats.totalComments}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Semua post kamu
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          {userId && (
            <div className="mb-8">
              <ActivityChart userId={userId} days={30} />
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari post kamu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Tidak ada post ditemukan" : "Belum ada post"}
              </p>
              {!searchQuery && (
                <Link
                  href="/dashboard/posts/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-5 w-5" />
                  <span>Buat post pertama kamu</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post: Post) => (
                <div
                  key={post.id}
                  className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/50 transition-all shadow-sm hover:shadow-xl card-hover"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {post.coverImage && (
                      <Link
                        href={`/posts/${post.id}`}
                        className="lg:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0 group"
                      >
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          width={192}
                          height={128}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <Link href={`/posts/${post.id}`}>
                            <h3 className="text-lg sm:text-xl font-bold mb-2 hover:text-primary transition-colors break-words">
                              {post.title}
                            </h3>
                          </Link>
                          {post.excerpt && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 break-words">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
                        {/* Author info */}
                        <div className="flex items-center gap-2">
                          <div className="relative w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
                            {post.author.profilePicture ? (
                              <Image
                                src={post.author.profilePicture}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                                sizes="20px"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                            )}
                          </div>
                          <span className="text-muted-foreground font-medium truncate max-w-[100px] sm:max-w-none">
                            {post.author.name}
                          </span>
                        </div>

                        {post.author.id === userId && (
                          <span
                            className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                              post.published
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {post.published ? "Terpublikasi" : "Draft"}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post.readingTime} m</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                          <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post._count.claps}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{post._count.comments}</span>
                        </div>
                        <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">
                          {new Date(post.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap sm:hidden">
                          {new Date(post.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/posts/${post.id}`}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs sm:text-sm font-medium"
                        >
                          <span className="hidden sm:inline">Baca Selengkapnya</span>
                          <span className="sm:hidden">Baca</span>
                        </Link>
                        {post.author.id === userId && (
                          <>
                            <Link
                              href={`/dashboard/posts/${post.id}/edit`}
                              className="p-2 hover:bg-accent rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {(isOwner || isAdmin) && post.author.id !== userId && (
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                            title="Hapus (Admin)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
