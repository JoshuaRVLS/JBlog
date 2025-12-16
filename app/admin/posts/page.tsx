"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, Search, Eye, EyeOff, Trash2, Edit } from "lucide-react";
import toast from "react-hot-toast";
import AdminLoading from "@/components/AdminLoading";

export default function PostManagement() {
  const { userId, authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterPublished, setFilterPublished] = useState<string>("all");

  useEffect(() => {
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchPosts();
  }, [page, searchQuery, filterPublished]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (filterPublished !== "all") {
        params.append("published", filterPublished === "published" ? "true" : "false");
      }

      const response = await AxiosInstance.get(`/admin/posts?${params.toString()}`);
      setPosts(response.data.posts || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      if (error.response?.status === 403) {
        toast.error("Akses ditolak");
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (postId: string, published: boolean) => {
    try {
      await AxiosInstance.put(`/admin/posts/${postId}`, {
        published: !published,
      });
      toast.success(published ? "Post di-unpublish" : "Post dipublikasi");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal mengupdate post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Yakin mau hapus post ini?")) return;

    try {
      await AxiosInstance.delete(`/admin/posts/${postId}`);
      toast.success("Post dihapus");
      fetchPosts();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Gagal menghapus post");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Admin</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Kelola Post</h1>
            <p className="text-muted-foreground">Kelola semua post</p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari post..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filterPublished}
              onChange={(e) => {
                setFilterPublished(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Semua Post</option>
              <option value="published">Terpublikasi</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Posts List */}
          {loading ? (
            <AdminLoading />
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">No posts found</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-all"
                  >
                    <div className="flex gap-6">
                      {post.coverImage && (
                        <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            width={128}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">{post.title}</h3>
                            {post.excerpt && (
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                                {post.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span>By {post.author.name}</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            post.published
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            {post.published ? "Terpublikasi" : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/posts/${post.id}`}
                            className="p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(post.id, post.published)}
                            className={`p-2 rounded-lg transition-colors ${
                              post.published
                                ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                            }`}
                            title={post.published ? "Unpublish" : "Publish"}
                          >
                            {post.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-4 py-2 text-sm text-muted-foreground">
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg border border-border bg-card disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

