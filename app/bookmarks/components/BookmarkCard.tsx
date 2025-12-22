"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Heart,
  MessageCircle,
  User,
  CheckSquare,
  Square,
  Folder,
} from "lucide-react";
import toast from "react-hot-toast";
import AxiosInstance from "@/utils/api";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import { BookmarkedPost, Collection } from "../types";

interface BookmarkCardProps {
  bookmark: BookmarkedPost;
  onUnbookmark: (postId: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  collections: Collection[];
  onCollectionChange: () => void;
}

export default function BookmarkCard({
  bookmark,
  onUnbookmark,
  isSelected,
  onToggleSelect,
  collections,
  onCollectionChange,
}: BookmarkCardProps) {
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);

  const handleMoveToCollection = async (collectionId: string | null) => {
    try {
      await AxiosInstance.put(`/bookmarks/${bookmark.id}/collection`, { collectionId });
      onCollectionChange();
      setShowCollectionMenu(false);
      toast.success("Bookmark moved");
    } catch (error: any) {
      console.error("Error moving bookmark:", error);
      toast.error("Gagal memindahkan bookmark");
    }
  };

  const post = bookmark.post;
  const currentCollection = collections.find((c) => c.id === bookmark.collectionId);

  return (
    <article className={`bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all ${
      isSelected ? "border-primary ring-2 ring-primary" : "border-border"
    }`}>
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggleSelect}
          className="mt-1 p-1 hover:bg-accent rounded transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1">
          {post.coverImage && (
            <Link href={`/posts/${post.id}`}>
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
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
          <div className="p-4">
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

            {bookmark.notes && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground italic">"{bookmark.notes}"</p>
              </div>
            )}

            {currentCollection && (
              <div className="mb-4 flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  In: <span style={{ color: currentCollection.color }}>{currentCollection.name}</span>
                </span>
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
              <div className="relative">
                <button
                  onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Move to Collection"
                >
                  <Folder className="h-4 w-4" />
                </button>
                {showCollectionMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px]">
                    <button
                      onClick={() => handleMoveToCollection(null)}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
                    >
                      No Collection
                    </button>
                    {collections.map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => handleMoveToCollection(collection.id)}
                        className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: collection.color }}
                        />
                        {collection.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <BookmarkButton
                postId={post.id}
                initialBookmarked={true}
                onToggle={(bookmarked) => {
                  if (!bookmarked) {
                    onUnbookmark(post.id);
                  }
                }}
              />
              <ShareButton postId={post.id} title={post.title} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

