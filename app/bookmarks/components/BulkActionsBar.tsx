"use client";

import { motion } from "motion/react";
import { Trash2, Folder, ChevronDown, X } from "lucide-react";
import { Collection } from "../types";

interface BulkActionsBarProps {
  selectedCount: number;
  collections: Collection[];
  showBulkActions: boolean;
  onDelete: () => void;
  onMoveToCollection: (collectionId: string) => void;
  onToggleBulkActions: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsBar({
  selectedCount,
  collections,
  showBulkActions,
  onDelete,
  onMoveToCollection,
  onToggleBulkActions,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <span className="font-medium">
          {selectedCount} selected
        </span>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
        <div className="relative">
          <button
            onClick={onToggleBulkActions}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
          >
            <Folder className="h-4 w-4" />
            Move to Collection
            <ChevronDown className="h-4 w-4" />
          </button>
          {showBulkActions && (
            <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  onMoveToCollection("");
                  onToggleBulkActions();
                }}
                className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
              >
                No Collection
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => {
                    onMoveToCollection(collection.id);
                    onToggleBulkActions();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: collection.color }}
                  />
                  {collection.name} ({collection._count.bookmarks})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onClearSelection}
        className="p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </motion.div>
  );
}

