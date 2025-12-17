"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Clock, Heart, MessageCircle, User, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";
import BookmarkButton from "@/components/BookmarkButton";
import RepostButton from "@/components/RepostButton";
import ShareButton from "@/components/ShareButton";

interface BookmarkedPost {
  id: string;
  createdAt: string;
  post: {
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
      reposts: number;
    };
  };
}

export default function BookmarksPage() {
  const router = useRouter();
  const { authenticated, userId, loading: authLoading } = useContext(AuthContext);
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchBookmarks();
  }, [authenticated, page, authLoading]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(`/bookmarks?page=${page}&limit=10`);
      const newBookmarks = response.data.bookmarks || [];
      
      if (page === 1) {
        setBookmarks(newBookmarks);
      } else {
        setBookmarks((prev) => [...prev, ...newBookmarks]);
      }
      
      setHasMore(newBookmarks.length === 10);
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

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BookmarkCheck className="h-8 w-8" />
              My Bookmarks
            </h1>
            <p className="text-muted-foreground">
              Posts you've saved for later
            </p>
          </div>

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
              <h2 className="text-2xl font-bold mb-2">No bookmarks yet</h2>
              <p className="text-muted-foreground mb-6">
                Start bookmarking posts to save them for later!
              </p>
              <Link
                href="/blog"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Explore Posts
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {bookmarks.map((bookmark) => {
                const post = bookmark.post;
                return (
                  <article
                    key={bookmark.id}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
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
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Heart className="h-4 w-4" />
                          <span>{post._count.claps}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post._count.comments}</span>
                        </div>
                        <BookmarkButton
                          postId={post.id}
                          initialBookmarked={true}
                          onToggle={(bookmarked) => {
                            if (!bookmarked) {
                              handleUnbookmark(post.id);
                            }
                          }}
                        />
                        <ShareButton postId={post.id} title={post.title} />
                      </div>
                    </div>
                  </article>
                );
              })}

              {hasMore && (
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loading}
                  className="w-full py-4 bg-muted hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

