import {
  Plus,
  Heading as HeadingIcon,
  List as ListIcon,
  Quote,
  Code2,
  Image as ImageIcon,
  Minus,
  Link2,
} from "lucide-react";
import type { BlockType } from "./types";

interface EditorToolbarProps {
  onAddBlock: (type: BlockType) => void;
}

export default function EditorToolbar({ onAddBlock }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Susun konten kamu dengan blok seperti paragraf, heading, list, quote,
        gambar, dll. Blok bisa di-drag & drop untuk diurutkan.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAddBlock("paragraph")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Plus className="h-3 w-3" />
          Paragraf
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("heading")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <HeadingIcon className="h-3 w-3" />
          Heading
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("list")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <ListIcon className="h-3 w-3" />
          List
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("quote")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Quote className="h-3 w-3" />
          Quote
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("code")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Code2 className="h-3 w-3" />
          Code
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("image")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <ImageIcon className="h-3 w-3" />
          Gambar
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("divider")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Minus className="h-3 w-3" />
          Divider
        </button>
        <button
          type="button"
          onClick={() => onAddBlock("embed")}
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <Link2 className="h-3 w-3" />
          Embed
        </button>
      </div>
    </div>
  );
}

