"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArticleJsonLd } from "next-seo";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Clock, Heart, MessageCircle, User, ArrowLeft, ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import toast from "react-hot-toast";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import PostDetailLoading from "@/components/PostDetailLoading";
import BookmarkButton from "@/components/BookmarkButton";
import RepostButton from "@/components/RepostButton";
import ShareButton from "@/components/ShareButton";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    profilePicture: string | null;
    bio: string | null;
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
    reposts?: number;
  };
  hasClapped: boolean;
  isBookmarked?: boolean;
  isReposted?: boolean;
}

interface CommentLikeMeta {
  userId: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  replies: Comment[];
  likes?: CommentLikeMeta[];
  hasLiked?: boolean;
  likesCount?: number;
}

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, userId } = useContext(AuthContext);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clapping, setClapping] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [clapAnimating, setClapAnimating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost();
      fetchComments();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(`/posts/${params.id}`);
      setPost(response.data);
    } catch (error: any) {
      console.error("Error fetching post:", error);
      if (error.response?.status === 404) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await AxiosInstance.get(`/comments/${params.id}`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleClap = async () => {
    if (!authenticated) {
      toast.error("Silakan login dulu untuk clap");
      router.push("/login");
      return;
    }

    if (!post) return;

    // Optimistic update - update UI immediately
    const wasClapped = post.hasClapped;
    const oldClapCount = post._count.claps;
    
    setPost({
      ...post,
      hasClapped: !wasClapped,
      _count: {
        ...post._count,
        claps: wasClapped ? oldClapCount - 1 : oldClapCount + 1,
      },
    });
    
    setClapAnimating(true);
    setTimeout(() => setClapAnimating(false), 400);

    try {
      setClapping(true);
      // Use POST which toggles the clap state
      const response = await AxiosInstance.post(`/claps/${params.id}`);
      // Server response should match optimistic update, but sync just in case
      if (post && response.data.clapped !== !wasClapped) {
        // Only update if server response differs from optimistic update
        setPost({
          ...post,
          hasClapped: response.data.clapped,
          _count: {
            ...post._count,
            claps: response.data.clapped ? oldClapCount + 1 : Math.max(0, oldClapCount - 1),
          },
        });
      }
    } catch (error: any) {
      console.error("Error toggling clap:", error);
      // Rollback on error
      setPost({
        ...post,
        hasClapped: wasClapped,
        _count: {
          ...post._count,
          claps: oldClapCount,
        },
      });
      toast.error(error.response?.data?.msg || "Failed to clap");
    } finally {
      setClapping(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      toast.error("Please login to comment");
      router.push("/login");
      return;
    }

    if (!commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      await AxiosInstance.post(`/comments/${params.id}`, {
        content: commentContent,
      });
      setCommentContent("");
      toast.success("Komentar berhasil ditambahkan");
      fetchComments();
      if (post) {
        setPost({
          ...post,
          _count: {
            ...post._count,
            comments: post._count.comments + 1,
          },
        });
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast.error(error.response?.data?.msg || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <PostDetailLoading />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 text-center">
          <p className="text-xl text-muted-foreground">Post not found</p>
        </div>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/posts/${post.id}`;
  const postImage = post.coverImage || `${siteUrl}/og-image.png`;
  const postExcerpt = post.excerpt || post.content.substring(0, 160).replace(/[#*`]/g, "");

  return (
    <div className="min-h-screen bg-background">
      <ArticleJsonLd
        type="BlogPosting"
        headline={post.title}
        description={postExcerpt}
        url={postUrl}
        datePublished={post.createdAt}
        dateModified={post.updatedAt}
        author={[
          {
            name: post.author.name,
            url: `${siteUrl}/users/${post.author.id}`,
          },
        ]}
        image={postImage}
        publisher={{
          name: "JBlog",
          url: siteUrl,
        }}
      />
      <Navbar />
      <article className="pt-20">
        {/* Hero Section with Cover Image */}
        {post.coverImage ? (
          <div className="relative w-full h-[60vh] md:h-[70vh] mb-16">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              quality={100}
              unoptimized
            />
            <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((postTag) => (
                    <Link
                      key={postTag.tag.id}
                      href={`/?tag=${postTag.tag.slug}`}
                      className="px-4 py-1.5 text-sm font-medium bg-background/90 backdrop-blur-sm text-primary rounded-full hover:bg-background transition-colors border border-primary/20"
                    >
                      #{postTag.tag.name}
                    </Link>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground drop-shadow-lg">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="text-lg md:text-xl text-muted-foreground/90 mb-6 max-w-3xl drop-shadow">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    href={`/users/${post.author.id}`}
                    className="flex items-center gap-3 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-background transition-colors"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {post.author.profilePicture ? (
                        <Image
                          src={post.author.profilePicture}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{post.author.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} min
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali</span>
              </Link>
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((postTag) => (
                  <Link
                    key={postTag.tag.id}
                    href={`/?tag=${postTag.tag.slug}`}
                    className="px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  >
                    #{postTag.tag.name}
                  </Link>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{post.title}</h1>
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-4 pb-6 border-b border-border">
                <Link
                  href={`/users/${post.author.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    {post.author.profilePicture ? (
                      <Image
                        src={post.author.profilePicture}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{post.author.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readingTime} menit baca
                      </span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-3xl mx-auto">
            {/* Content */}
            <div className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none mb-12">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Actions */}
            <div className="sticky bottom-4 bg-card border border-border rounded-2xl p-4 mb-12 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <motion.button
                  onClick={handleClap}
                  disabled={clapping}
                  whileTap={{ scale: 0.95 }}
                  animate={clapAnimating ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                    post.hasClapped
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <motion.div
                    animate={clapAnimating ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <Heart className={`h-5 w-5 ${post.hasClapped ? "fill-current" : ""}`} />
                  </motion.div>
                  <motion.span
                    key={post._count.claps}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {post._count.claps}
                  </motion.span>
                </motion.button>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-muted rounded-xl text-muted-foreground">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post._count.comments}</span>
                </div>
                <RepostButton
                  postId={post.id}
                  initialReposted={post.isReposted || false}
                  repostCount={post._count.reposts || 0}
                  className="px-5 py-2.5 rounded-xl"
                />
                <BookmarkButton
                  postId={post.id}
                  initialBookmarked={post.isBookmarked || false}
                  className="px-5 py-2.5 rounded-xl"
                />
                <ShareButton postId={post.id} title={post.title} className="px-5 py-2.5 rounded-xl" />
              </div>
            </div>

            {/* Comments Section */}
            <section className="border-t border-border pt-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Komentar</h2>
                <span className="text-muted-foreground">{post._count.comments} komentar</span>
              </div>

              {/* Comment Form */}
              {authenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-12">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Tulis komentar kamu..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentContent.trim()}
                        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? "Mengirim..." : "Kirim Komentar"}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-12 p-6 bg-muted/50 border border-border rounded-2xl text-center">
                  <p className="text-muted-foreground">
                    Silakan{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      login
                    </Link>{" "}
                    untuk menulis komentar
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-8">
                {comments.length === 0 ? (
                  <div className="text-center py-16">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-lg">Belum ada komentar</p>
                    <p className="text-sm text-muted-foreground mt-2">Jadilah yang pertama untuk berkomentar!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      onCommentUpdated={fetchComments}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}

function CommentItem({ comment, postId, onCommentUpdated }: { comment: Comment; postId: string; onCommentUpdated?: () => void }) {
  const { authenticated } = useContext(AuthContext);
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(comment.likesCount ?? 0);
  const [hasLiked, setHasLiked] = useState<boolean>(comment.hasLiked ?? false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      toast.error("Silakan login dulu untuk membalas komentar");
      router.push("/login");
      return;
    }
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      await AxiosInstance.post(`/comments/${postId}`, {
        content: replyContent,
        parentId: comment.id,
      });
      setReplyContent("");
      setReplying(false);
      toast.success("Balasan berhasil ditambahkan");
      onCommentUpdated?.();
    } catch (error: any) {
      console.error("Error submitting reply:", error);
      toast.error(error.response?.data?.msg || "Gagal menambahkan balasan");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleLike = async () => {
    if (!authenticated) {
      toast.error("Silakan login dulu untuk menyukai komentar");
      router.push("/login");
      return;
    }

    try {
      // Optimistic update
      const prevLiked = hasLiked;
      const prevCount = likesCount;
      setHasLiked(!prevLiked);
      setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

      const response = await AxiosInstance.post(`/comments/${comment.id}/like`);
      if (typeof response.data.liked === "boolean" && typeof response.data.likesCount === "number") {
        setHasLiked(response.data.liked);
        setLikesCount(response.data.likesCount);
      }
    } catch (error: any) {
      console.error("Error toggling comment like:", error);
      toast.error(error.response?.data?.msg || "Gagal menyukai komentar");
      // We don't know exact previous value from server, so safest is to refetch comments
      onCommentUpdated?.();
    }
  };
  return (
    <div className="group">
      <div className="flex items-start gap-4">
        <Link href={`/users/${comment.user.id}`} className="flex-shrink-0">
          {comment.user.profilePicture ? (
            <Image
              src={comment.user.profilePicture}
              alt={comment.user.name}
              width={44}
              height={44}
              className="rounded-full"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <Link
                href={`/users/${comment.user.id}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {comment.user.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setReplying((prev) => !prev)}
              className="font-medium hover:text-primary transition-colors"
            >
              Balas
            </button>
            <button
              type="button"
              onClick={handleToggleLike}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs transition-colors ${
                hasLiked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/60 hover:text-primary"
              }`}
            >
              <ThumbsUp className={`h-3 w-3 ${hasLiked ? "fill-primary" : ""}`} />
              <span>{likesCount}</span>
            </button>
          </div>
          {replying && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tulis balasan kamu..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              />
              <div className="flex justify-end mt-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplying(false);
                    setReplyContent("");
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-accent text-muted-foreground transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReply ? "Mengirim..." : "Kirim Balasan"}
                </button>
              </div>
            </form>
          )}
          {Array.isArray(comment.replies) && comment.replies.length > 0 && (
            <div className="mt-4 ml-4 space-y-4 border-l-2 border-border pl-4">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} postId={postId} onCommentUpdated={onCommentUpdated} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

