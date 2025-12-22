"use client";

import { X } from "lucide-react";
import { SortOption, TimeRange } from "../types";

interface ActiveFiltersProps {
  selectedTags: string[];
  tags: any[];
  onTagRemove: (tagSlug: string) => void;
  selectedCollection: string | null;
  collections: any[];
  onCollectionRemove: () => void;
  sortBy: SortOption;
  timeRange: TimeRange;
  onClearAll: () => void;
}

export default function ActiveFilters({
  selectedTags,
  tags,
  onTagRemove,
  selectedCollection,
  collections,
  onCollectionRemove,
  sortBy,
  timeRange,
  onClearAll,
}: ActiveFiltersProps) {
  const hasActiveFilters = selectedTags.length > 0 || selectedCollection !== null || sortBy !== "newest" || timeRange !== "all";

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {selectedTags.map((tagSlug) => {
        const tag = tags.find((t: any) => t.slug === tagSlug);
        return tag ? (
          <button
            key={tagSlug}
            onClick={() => onTagRemove(tagSlug)}
            className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2 hover:bg-primary/30"
          >
            #{tag.name}
            <X className="h-3 w-3" />
          </button>
        ) : null;
      })}
      {selectedCollection && (
        <button
          onClick={onCollectionRemove}
          className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2 hover:bg-primary/30"
        >
          Collection: {collections.find((c) => c.id === selectedCollection)?.name}
          <X className="h-3 w-3" />
        </button>
      )}
      {sortBy !== "newest" && (
        <span className="px-3 py-1 bg-muted rounded-full text-sm">
          Sort: {sortBy}
        </span>
      )}
      {timeRange !== "all" && (
        <span className="px-3 py-1 bg-muted rounded-full text-sm">
          {timeRange}
        </span>
      )}
      <button
        onClick={onClearAll}
        className="px-3 py-1 bg-destructive/20 text-destructive rounded-full text-sm hover:bg-destructive/30"
      >
        Clear all
      </button>
    </div>
  );
}

