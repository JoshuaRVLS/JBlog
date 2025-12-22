export interface BookmarkedPost {
  id: string;
  createdAt: string;
  notes: string | null;
  collectionId: string | null;
  post: {
    id: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    readingTime: number;
    createdAt: string;
    views: number;
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

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: {
    bookmarks: number;
  };
}

export type SortOption = "newest" | "oldest" | "mostClapped" | "mostCommented" | "mostViewed" | "readingTime";
export type TimeRange = "all" | "today" | "week" | "month" | "year";
export type ViewMode = "grid" | "list";

