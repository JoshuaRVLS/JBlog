"use client";

import { useRef, useEffect } from "react";
import { X } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

interface TagsInputProps {
  tags: string[];
  tagInput: string;
  availableTags: Tag[];
  filteredTags: Tag[];
  showTagDropdown: boolean;
  onTagInputChange: (value: string) => void;
  onShowTagDropdown: (show: boolean) => void;
  onAddTag: (tagName?: string) => void;
  onSelectTag: (tag: Tag) => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagsInput({
  tags,
  tagInput,
  availableTags,
  filteredTags,
  showTagDropdown,
  onTagInputChange,
  onShowTagDropdown,
  onAddTag,
  onSelectTag,
  onRemoveTag,
}: TagsInputProps) {
  const tagInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagInputRef.current && !tagInputRef.current.contains(event.target as Node)) {
        onShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onShowTagDropdown]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Tags</label>
      <div ref={tagInputRef} className="relative">
        <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-card min-h-[48px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="hover:text-primary/70"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              onTagInputChange(e.target.value);
              onShowTagDropdown(true);
            }}
            onFocus={() => onShowTagDropdown(true)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddTag();
              }
            }}
            placeholder={tags.length === 0 ? "Add tags..." : ""}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        {showTagDropdown && filteredTags.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => onSelectTag(tag)}
                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
              >
                <span>#{tag.name}</span>
                {tag._count && (
                  <span className="text-xs text-muted-foreground">
                    {tag._count.posts} posts
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

