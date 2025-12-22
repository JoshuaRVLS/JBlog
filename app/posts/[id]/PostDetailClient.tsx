"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
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
import ReactionsButton from "@/components/ReactionsButton";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  customScript?: string | null;
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

interface PostDetailClientProps {
  initialPost: Post | null;
  postId: string;
}

export default function PostDetailClient({ initialPost, postId }: PostDetailClientProps) {
  const router = useRouter();
  const { authenticated, userId } = useContext(AuthContext);
  const [post, setPost] = useState<Post | null>(initialPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(!initialPost);
  const [clapping, setClapping] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [clapAnimating, setClapAnimating] = useState(false);

  // Update document title when post is loaded
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | JBlog`;
    } else if (!loading && !post) {
      document.title = "Post Not Found | JBlog";
    }
  }, [post, loading]);

  // Execute custom script after content is rendered
  useEffect(() => {
    if (post?.customScript && post?.content) {
      // Wait for content to be rendered in DOM
      const timer = setTimeout(() => {
        try {
          // Check if it's JSON config (new format) or plain script (old format)
          let scriptToExecute = post.customScript || "";
          
          try {
            const config = JSON.parse(post.customScript || "{}");
            if (config.script) {
              // New format: use the generated script (supports multiple APIs)
              scriptToExecute = config.script;
            } else if (config.apiUrl) {
              // Old single API format - still supported
              scriptToExecute = config.script || "";
            }
          } catch {
            // Old format: use as-is
          }

          // Create and inject script element
          const scriptId = `custom-script-${post.id}`;
          // Remove existing script if any
          const existingScript = document.getElementById(scriptId);
          if (existingScript) {
            existingScript.remove();
          }

          // Create new script element
          const script = document.createElement("script");
          script.id = scriptId;
          script.textContent = scriptToExecute;
          document.body.appendChild(script);
        } catch (error) {
          console.error("Error executing custom script:", error);
        }
      }, 200); // Delay to ensure DOM is ready

      return () => {
        clearTimeout(timer);
        // Cleanup: remove script on unmount
        const scriptId = `custom-script-${post.id}`;
        const script = document.getElementById(scriptId);
        if (script) {
          script.remove();
        }
      };
    }
  }, [post?.customScript, post?.content, post?.id]);

  useEffect(() => {
    if (!initialPost && postId) {
      fetchPost();
    }
    if (postId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]); // Hanya depend on postId, initialPost hanya untuk initial render

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await AxiosInstance.get(`/posts/${postId}`);
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
      const response = await AxiosInstance.get(`/comments/${postId}`);
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
      const response = await AxiosInstance.post(`/claps/${postId}`);
      // Server response should match optimistic update, but sync just in case
      if (post && response.data.clapped !== !wasClapped) {
        // Only update if server response differs from optimistic update
        setPost({
          ...post,
          hasClapped: response.data.clapped,
          _count: {
            ...post._count,
            claps: response.data.clapped ? post._count.claps + 1 : post._count.claps - 1,
          },
        });
      }
    } catch (error: any) {
      console.error("Error clapping:", error);
      // Revert optimistic update on error
      setPost({
        ...post,
        hasClapped: wasClapped,
        _count: {
          ...post._count,
          claps: oldClapCount,
        },
      });
      toast.error(error.response?.data?.msg || "Gagal clap");
    } finally {
      setClapping(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticated) {
      toast.error("Silakan login dulu untuk comment");
      router.push("/login");
      return;
    }

    if (!commentContent.trim() || !post) return;

    const newComment = {
      id: `temp-${Date.now()}`,
      content: commentContent,
      createdAt: new Date().toISOString(),
      user: {
        id: userId!,
        name: "You",
        profilePicture: null,
      },
      replies: [],
      hasLiked: false,
      likesCount: 0,
    };

    // Optimistic update
    setComments([newComment, ...comments]);
    setCommentContent("");

    try {
      setSubmittingComment(true);
      const response = await AxiosInstance.post(`/comments/${postId}`, {
        content: commentContent,
      });
      // Replace temp comment with real one
      setComments((prev) =>
        prev.map((c) => (c.id === newComment.id ? response.data.comment : c))
      );
      // Update comment count
      setPost({
        ...post,
        _count: {
          ...post._count,
          comments: post._count.comments + 1,
        },
      });
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      // Remove optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== newComment.id));
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
    // Jika masih loading atau belum fetch, show loading
    if (!initialPost && postId) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <PostDetailLoading />
        </div>
      );
    }
    
    // Jika sudah fetch tapi tidak ditemukan
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 text-center">
          <p className="text-xl text-muted-foreground">Post not found</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
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
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{post.author.name}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/90 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span>{post.readingTime} min read</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/90 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span>{new Date(post.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((postTag) => (
                  <Link
                    key={postTag.tag.id}
                    href={`/?tag=${postTag.tag.slug}`}
                    className="px-4 py-1.5 text-sm font-medium bg-muted text-primary rounded-full hover:bg-accent transition-colors"
                  >
                    #{postTag.tag.name}
                  </Link>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href={`/users/${post.author.id}`}
                  className="flex items-center gap-3"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    {post.author.profilePicture ? (
                      <Image
                        src={post.author.profilePicture}
                        alt={post.author.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{post.author.name}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{post.readingTime} min read</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg dark:prose-invert max-w-none" id="post-content">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-border">
              <motion.button
                onClick={handleClap}
                disabled={clapping}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                  post.hasClapped
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={clapAnimating ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <ThumbsUp className={`h-5 w-5 ${clapAnimating ? "text-primary" : ""}`} />
                </motion.div>
                <span>{post._count.claps}</span>
              </motion.button>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{post._count.comments}</span>
              </div>

              {post && (
                <>
                  <BookmarkButton
                    postId={post.id}
                    initialBookmarked={post.isBookmarked || false}
                    onToggle={(bookmarked) => {
                      setPost({ ...post, isBookmarked: bookmarked });
                    }}
                  />
                  <RepostButton
                    postId={post.id}
                    initialReposted={post.isReposted || false}
                    onToggle={(reposted) => {
                      setPost({ ...post, isReposted: reposted });
                    }}
                  />
                  <ShareButton postId={post.id} title={post.title} />
                  <ReactionsButton postId={post.id} />
                </>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-12 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6">Comments ({post._count.comments})</h2>

              {/* Comment Form */}
              {authenticated ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-4 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary mb-4 min-h-[100px]"
                    rows={4}
                  />
                  <button
                    type="submit"
                    disabled={!commentContent.trim() || submittingComment}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? "Submitting..." : "Submit Comment"}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 border border-border rounded-lg bg-muted text-center">
                  <p className="text-muted-foreground mb-4">
                    Please login to comment
                  </p>
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity inline-block"
                  >
                    Login
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-border pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {comment.user.profilePicture ? (
                            <Image
                              src={comment.user.profilePicture}
                              alt={comment.user.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              href={`/users/${comment.user.id}`}
                              className="font-semibold hover:underline"
                            >
                              {comment.user.name}
                            </Link>
                            <span className="text-sm text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("id-ID", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

