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
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [user, setUser] = useState<{ isOwner?: boolean; isAdmin?: boolean } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    if (userId) {
      fetchData();
    }
  }, [userId, authenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await AxiosInstance.get(`/users/${userId}`);
      setUser(userRes.data);
      
      // Fetch posts berdasarkan role
      if (userRes.data.isOwner) {
        // Owner lihat semua posts (termasuk draft)
        const allPostsRes = await AxiosInstance.get(`/posts`);
        setPosts(allPostsRes.data.posts || []);
      } else {
        // User biasa lihat published posts + post mereka sendiri
        const postsRes = await AxiosInstance.get(`/posts`);
        // Filter: published posts atau post milik user
        const filteredPosts = (postsRes.data.posts || []).filter(
          (post: Post) => post.published || post.author.id === userId
        );
        setPosts(filteredPosts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = useCallback(async (postId: string) => {
    if (!confirm("Yakin mau hapus post ini?")) return;

    try {
      await AxiosInstance.delete(`/posts/${postId}`);
      toast.success("Post berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal menghapus post");
    }
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    // Filter posts yang dimiliki user
    const userPosts = posts.filter((p) => p.author.id === userId);
    const publishedCount = userPosts.filter((p) => p.published).length;
    const draftCount = userPosts.filter((p) => !p.published).length;
    const totalClaps = userPosts.reduce((sum, p) => sum + p._count.claps, 0);
    const totalComments = userPosts.reduce((sum, p) => sum + p._count.comments, 0);
    return { publishedCount, draftCount, totalClaps, totalComments };
  }, [posts, userId]);

  if (!authenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="pt-20 pb-16">
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
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Kelola post blog kamu
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Panel Admin
                  </Link>
                )}
                <Link
                  href="/dashboard/posts/new"
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  <Plus className="h-5 w-5" />
                  <span>Post Baru</span>
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
              <div className="text-3xl font-bold text-primary">{posts.filter((p) => p.author.id === userId).length}</div>
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
              {filteredPosts.map((post) => (
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

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <Link href={`/posts/${post.id}`}>
                            <h3 className="text-xl font-bold mb-2 hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                          </Link>
                          {post.excerpt && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                        {/* Author info */}
                        <div className="flex items-center gap-2">
                          {post.author.profilePicture ? (
                            <Image
                              src={post.author.profilePicture}
                              alt={post.author.name}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                          )}
                          <span className="text-muted-foreground font-medium">
                            {post.author.name}
                          </span>
                        </div>

                        {post.author.id === userId && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              post.published
                                ? "bg-green-500/10 text-green-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            }`}
                          >
                            {post.published ? "Terpublikasi" : "Draft"}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{post.readingTime} menit</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="h-4 w-4" />
                          <span>{post._count.claps}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post._count.comments}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/posts/${post.id}`}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          Baca Selengkapnya
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
