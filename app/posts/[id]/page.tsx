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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL?.replace(":3000", ":8000") || "https://api.jblog.space";
    const apiUrl = backendUrl.replace("/api", "");
    
    // Gunakan endpoint public untuk SEO (tidak increment views)
    const response = await fetch(`${apiUrl}/api/posts/${id}/public`, {
      next: { revalidate: 300 }, // Revalidate setiap 5 menit
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching post for SEO:", error);
    return null;
  }
}

// Generate metadata untuk SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(params.id);

  if (!post || !post.published) {
    return {
      title: "Post Not Found",
      description: "The post you are looking for does not exist or is not published.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
  const postUrl = `${siteUrl}/posts/${post.id}`;
  const postImage = post.coverImage || `${siteUrl}/og-image.png`;
  const postExcerpt = post.excerpt || post.content.substring(0, 160).replace(/[#*`]/g, "");

  return {
    title: post.title,
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
export default async function PostPage({ params }: { params: { id: string } }) {
  // Fetch post data untuk initial render (SEO)
  const post = await getPost(params.id);

  // Kalau post tidak ditemukan atau tidak published, return 404
  if (!post || !post.published) {
    notFound();
  }

  // Pass initial data ke client component
  return <PostDetailClient initialPost={post} postId={params.id} />;
}
