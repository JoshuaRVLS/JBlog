import { Metadata } from "next";
import { notFound } from "next/navigation";
import PostDetailClient from "./PostDetailClient";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  published: boolean;
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
}

// Fetch post data untuk SEO (server-side)
async function getPost(id: string): Promise<Post | null> {
  try {
    if (!id || id === "undefined") {
      console.error("Invalid post ID:", id);
      return null;
    }

    // Construct backend URL untuk server-side fetch
    // Di production, gunakan absolute URL
    let apiBaseUrl: string;
    
    if (process.env.NEXT_PUBLIC_API_URL) {
      // Jika NEXT_PUBLIC_API_URL sudah di-set, gunakan itu
      apiBaseUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
    } else {
      // Fallback: construct dari SITE_URL atau default
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
      if (siteUrl.includes(":3000")) {
        // Development: replace port
        apiBaseUrl = siteUrl.replace(":3000", ":8000");
      } else if (siteUrl.includes("jblog.space") && !siteUrl.includes("api.")) {
        // Production: replace domain
        apiBaseUrl = siteUrl.replace("jblog.space", "api.jblog.space");
      } else {
        // Default fallback
        apiBaseUrl = "https://api.jblog.space";
      }
    }
    
    // Pastikan URL valid dengan protocol
    if (!apiBaseUrl.startsWith("http://") && !apiBaseUrl.startsWith("https://")) {
      apiBaseUrl = `https://${apiBaseUrl}`;
    }
    
    const fullUrl = `${apiBaseUrl}/api/posts/${id}/public`;
    
    // Gunakan endpoint public untuk SEO (tidak increment views)
    const response = await fetch(fullUrl, {
      next: { revalidate: 300 }, // Revalidate setiap 5 menit
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`[SEO] Failed to fetch post ${id}: ${response.status} ${response.statusText}`);
      if (response.status === 404) {
        return null;
      }
      return null;
    }

    const data = await response.json();
    console.log(`[SEO] Successfully fetched post ${id}`);
    return data;
  } catch (error) {
    console.error(`[SEO] Error fetching post ${id}:`, error);
    return null;
  }
}

// Generate metadata untuk SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  if (!id || id === "undefined") {
    return {
      title: "Post Not Found | JBlog",
      description: "The post you are looking for does not exist.",
    };
  }

  // Try to fetch post for metadata
  const post = await getPost(id);

  // Jika post tidak ditemukan atau tidak published, return generic metadata
  // Client component akan fetch dan update title sendiri
  if (!post || !post.published) {
    return {
      title: "JBlog - Modern Blogging Platform",
      description: "Platform blogging modern dengan fitur lengkap untuk berbagi ide, pengalaman, dan pengetahuan.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
  const postUrl = `${siteUrl}/posts/${post.id}`;
  const postImage = post.coverImage || `${siteUrl}/og-image.png`;
  const postExcerpt = post.excerpt || post.content.substring(0, 160).replace(/[#*`]/g, "");

  return {
    title: `${post.title} | JBlog`,
    description: postExcerpt,
    keywords: post.tags.map((t) => t.tag.name).join(", "),
    authors: [{ name: post.author.name }],
    openGraph: {
      type: "article",
      url: postUrl,
      title: post.title,
      description: postExcerpt,
      images: [
        {
          url: postImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      siteName: "JBlog",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: postExcerpt,
      images: [postImage],
      creator: `@${post.author.name.replace(/\s+/g, "")}`,
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

// Server component wrapper
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params karena di Next.js 15+ params adalah Promise
  const { id } = await params;
  
  if (!id || id === "undefined") {
    console.error("[PostPage] Invalid post ID:", id);
    notFound();
  }
  
  // Fetch post data untuk initial render (SEO)
  // Jika gagal, client component akan fetch sendiri
  const post = await getPost(id);

  // Jika post tidak ditemukan di server-side, tetap render client component
  // Client component akan handle fetch dan error sendiri
  // Jangan langsung notFound() karena mungkin masalah network/server-side fetch
  const postWithDefaults = post ? {
    ...post,
    hasClapped: false,
    isBookmarked: false,
    isReposted: false,
  } : null;

  return <PostDetailClient initialPost={postWithDefaults} postId={id} />;
}
