"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Clock, Heart, MessageCircle, User, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import PostDetailLoading from "@/components/PostDetailLoading";

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
  };
  hasClapped: boolean;
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
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost();
      fetchComments();
    }
  }, [params.id]);

  // Handle scroll to hide/show cover image
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Hide cover image after scrolling 300px
      setIsScrolled(scrollPosition > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

    try {
      setClapping(true);
      const response = await AxiosInstance.post(`/claps/${params.id}`);
      if (post) {
        setPost({
          ...post,
          hasClapped: response.data.clapped,
          _count: {
            ...post._count,
            claps: response.data.clapped
              ? post._count.claps + 1
              : post._count.claps - 1,
          },
        });
      }
    } catch (error: any) {
      console.error("Error toggling clap:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="pt-20 pb-16">
        {/* Back Button */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke home</span>
          </Link>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div
            className={`w-full relative mb-12 transition-all duration-500 ease-in-out ${
              isScrolled
                ? "h-0 mb-0 opacity-0 overflow-hidden"
                : "h-[400px] md:h-[500px] opacity-100"
            }`}
          >
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((postTag) => (
                  <Link
                    key={postTag.tag.id}
                    href={`/?tag=${postTag.tag.slug}`}
                    className="px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  >
                    {postTag.tag.name}
                  </Link>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
              )}

              {/* Author Info */}
              <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  {post.author.profilePicture ? (
                    <Image
                      src={post.author.profilePicture}
                      alt={post.author.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/users/${post.author.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {post.author.name}
                    </Link>
                    {post.author.bio && (
                      <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readingTime} menit baca</span>
                  </div>
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pb-8 border-b border-border mb-8">
              <button
                onClick={handleClap}
                disabled={clapping}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  post.hasClapped
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                <Heart className={`h-5 w-5 ${post.hasClapped ? "fill-current" : ""}`} />
                <span>{post._count.claps}</span>
              </button>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{post._count.comments} komentar</span>
              </div>
            </div>

            {/* Comments Section */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Komentar</h2>

              {/* Comment Form */}
              {authenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Tulis komentar..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentContent.trim()}
                    className="mt-3 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? "Mengirim..." : "Kirim Komentar"}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground mb-2">
                    Silakan{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      login
                    </Link>{" "}
                    untuk komentar
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Belum ada komentar. Jadilah yang pertama!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
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

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="border-l-2 border-border pl-4">
      <div className="flex items-start gap-3 mb-2">
        {comment.user.profilePicture ? (
          <Image
            src={comment.user.profilePicture}
            alt={comment.user.name}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/users/${comment.user.id}`}
              className="font-semibold hover:text-primary transition-colors"
            >
              {comment.user.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="mt-4 ml-8 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

