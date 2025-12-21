import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITE_URL?.replace(":3000", ":8000") || "https://api.jblog.space";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];

  // Fetch published posts untuk sitemap
  try {
    const response = await fetch(`${backendUrl}/api/posts?published=true&limit=1000`, {
      next: { revalidate: 3600 }, // Revalidate setiap 1 jam
    });

    if (response.ok) {
      const data = await response.json();
      const posts = data.posts || [];

      const postPages: MetadataRoute.Sitemap = posts.map((post: any) => ({
        url: `${baseUrl}/posts/${post.id}`,
        lastModified: new Date(post.updatedAt || post.createdAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

      return [...staticPages, ...postPages];
    }
  } catch (error) {
    console.error("Error fetching posts for sitemap:", error);
  }

  return staticPages;
}

