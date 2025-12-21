"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Clock, Heart, MessageCircle, UserPlus, Bookmark, Repeat, Share2, User } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import BookmarkButton from "@/components/BookmarkButton";
import RepostButton from "@/components/RepostButton";
import ShareButton from "@/components/ShareButton";

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

export default function FeedPage() {
  const router = useRouter();
  const { authenticated, userId, loading: authLoading } = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    if (!authenticated) {
      router.push("/login");
      return;
    }
    fetchFeed();
  }, [authenticated, page, authLoading]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(`/feed?page=${page}&limit=10`);
      const newPosts = response.data.posts || [];
      
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 10);
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

    // Optimistic update - update UI immediately
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
      // Use POST which toggles the clap state
      await AxiosInstance.post(`/claps/${postId}`);
    } catch (error: any) {
      console.error("Error clapping:", error);
      // Rollback on error
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

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 page-content">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Feed</h1>
            <p className="text-muted-foreground">
              Posts from users you follow
            </p>
          </div>

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
              <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
              <p className="text-muted-foreground mb-6">
                Start following users to see their posts in your feed!
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
              {posts.map((post) => (
                <article
                  key={post.id}
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
                      <ClapButton
                        postId={post.id}
                        hasClapped={post.hasClapped}
                        clapCount={post._count.claps}
                        onClap={handleClap}
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
              ))}

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

