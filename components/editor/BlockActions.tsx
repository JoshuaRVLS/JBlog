import { GripVertical, Trash2 } from "lucide-react";
import type { Block } from "./types";

interface BlockActionsProps {
  block: Block;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function BlockActions({
  block,
  draggingId,
  onDragStart,
  onRemove,
}: BlockActionsProps) {
  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <button
        type="button"
        draggable
        onDragStart={() => onDragStart(block.id)}
        className="cursor-grab rounded-md border border-dashed border-border bg-muted/60 p-1.5 text-muted-foreground hover:bg-accent/70 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(block.id)}
        className="rounded-md p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

