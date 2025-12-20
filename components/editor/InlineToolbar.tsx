interface InlineToolbarProps {
  onFormat: (format: "bold" | "italic" | "code" | "link") => void;
}

export default function InlineToolbar({ onFormat }: InlineToolbarProps) {
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-1 text-xs shadow-sm">
      <button
        type="button"
        onClick={() => onFormat("bold")}
        className="rounded-full px-2 py-1 font-semibold hover:bg-accent"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => onFormat("italic")}
        className="rounded-full px-2 py-1 italic hover:bg-accent"
      >
        I
      </button>
      <button
        type="button"
        onClick={() => onFormat("code")}
        className="rounded-full px-2 py-1 font-mono text-[11px] hover:bg-accent"
      >
        {"</>"}
      </button>
      <button
        type="button"
        onClick={() => onFormat("link")}
        className="rounded-full px-2 py-1 hover:bg-accent"
      >
        Link
      </button>
    </div>
  );
}

