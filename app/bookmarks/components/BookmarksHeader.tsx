"use client";

import { BookmarkCheck, Grid3x3, List, Filter, FolderPlus } from "lucide-react";

interface BookmarksHeaderProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  showFilters: boolean;
  hasActiveFilters: boolean;
  onToggleFilters: () => void;
  onCreateCollection: () => void;
}

export default function BookmarksHeader({
  viewMode,
  onViewModeChange,
  showFilters,
  hasActiveFilters,
  onToggleFilters,
  onCreateCollection,
}: BookmarksHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-gradient">
            <BookmarkCheck className="h-10 w-10" />
            My Bookmarks
          </h1>
          <p className="text-muted-foreground">
            Posts you've saved for later
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewModeChange(viewMode === "grid" ? "list" : "grid")}
            className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
            title={viewMode === "grid" ? "List View" : "Grid View"}
          >
            {viewMode === "grid" ? <List className="h-5 w-5" /> : <Grid3x3 className="h-5 w-5" />}
          </button>
          <button
            onClick={onToggleFilters}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-accent"
            }`}
            title="Filters"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={onCreateCollection}
            className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
            title="Create Collection"
          >
            <FolderPlus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

