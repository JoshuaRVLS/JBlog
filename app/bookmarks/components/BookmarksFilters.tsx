"use client";

import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Heart,
  MessageCircle,
  Eye,
} from "lucide-react";
import { SortOption, TimeRange, Collection } from "../types";

interface BookmarksFiltersProps {
  showFilters: boolean;
  collections: Collection[];
  selectedCollection: string | null;
  onCollectionSelect: (collectionId: string | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  tags: any[];
  selectedTags: string[];
  onTagToggle: (tagSlug: string) => void;
  minReadingTime: number | null;
  maxReadingTime: number | null;
  onReadingTimeChange: (min: number | null, max: number | null) => void;
}

export default function BookmarksFilters({
  showFilters,
  collections,
  selectedCollection,
  onCollectionSelect,
  sortBy,
  onSortChange,
  timeRange,
  onTimeRangeChange,
  tags,
  selectedTags,
  onTagToggle,
  minReadingTime,
  maxReadingTime,
  onReadingTimeChange,
}: BookmarksFiltersProps) {
  if (!showFilters) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden mb-6"
    >
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Collections Filter */}
        <div>
          <label className="text-sm font-medium mb-3 block">Collections</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCollectionSelect(null)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCollection === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              All
            </button>
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => onCollectionSelect(collection.id)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  selectedCollection === collection.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: collection.color }}
                />
                {collection.name} ({collection._count.bookmarks})
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="text-sm font-medium mb-3 block">Sort By</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { value: "newest", label: "Newest", icon: Calendar },
              { value: "oldest", label: "Oldest", icon: Clock },
              { value: "mostClapped", label: "Most Clapped", icon: Heart },
              { value: "mostCommented", label: "Most Commented", icon: MessageCircle },
              { value: "mostViewed", label: "Most Viewed", icon: Eye },
              { value: "readingTime", label: "Reading Time", icon: Clock },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value as SortOption)}
                className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                  sortBy === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent"
                }`}
              >
                <option.icon className="h-4 w-4" />
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div>
          <label className="text-sm font-medium mb-3 block">Time Range</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { value: "all", label: "All Time" },
              { value: "today", label: "Today" },
              { value: "week", label: "This Week" },
              { value: "month", label: "This Month" },
              { value: "year", label: "This Year" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value as TimeRange)}
                className={`p-3 rounded-lg border transition-colors ${
                  timeRange === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent"
                }`}
              >
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags Filter */}
        <div>
          <label className="text-sm font-medium mb-3 block">Filter by Tags</label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {tags.slice(0, 20).map((tag: any) => (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.slug)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag.slug)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Reading Time Filter */}
        <div>
          <label className="text-sm font-medium mb-3 block">Reading Time (minutes)</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min</label>
              <input
                type="number"
                min="0"
                value={minReadingTime || ""}
                onChange={(e) => onReadingTimeChange(e.target.value ? parseInt(e.target.value) : null, maxReadingTime)}
                placeholder="Any"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max</label>
              <input
                type="number"
                min="0"
                value={maxReadingTime || ""}
                onChange={(e) => onReadingTimeChange(minReadingTime, e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Any"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

