import { Heading as HeadingIcon, Code2, ImageIcon, Link2 } from "lucide-react";
import type {
  Block,
  BlockType,
  ParagraphBlock,
  HeadingBlock,
  QuoteBlock,
  ListBlock,
  CodeBlock,
  ImageBlock,
  EmbedBlock,
} from "./types";

interface BlockRendererProps {
  block: Block;
  textareaRefs: React.MutableRefObject<
    Map<string, HTMLTextAreaElement | HTMLInputElement>
  >;
  selection: {
    blockId: string | null;
    start: number;
    end: number;
  };
  slashMenu: {
    blockId: string | null;
    query: string;
  };
  filteredSlashCommands: Array<{
    type: BlockType;
    label: string;
    description: string;
  }>;
  placeholderMenu: {
    blockId: string | null;
    query: string;
    position: { top: number; left: number } | null;
  };
  filteredPlaceholders: Array<{
    placeholder: string;
    apiField: string;
  }>;
  availablePlaceholders: Array<{
    placeholder: string;
    apiField: string;
  }>;
  onUpdate: (id: string, updater: (block: Block) => Block) => void;
  onSelectionChange: (selection: {
    blockId: string | null;
    start: number;
    end: number;
  }) => void;
  onSlashMenuChange: (menu: { blockId: string | null; query: string }) => void;
  onPlaceholderMenuChange: (menu: {
    blockId: string | null;
    query: string;
    position: { top: number; left: number } | null;
  }) => void;
  onApplySlashCommand: (blockId: string, type: BlockType) => void;
  onApplyPlaceholder: (blockId: string, placeholder: string) => void;
  onApplyInlineFormat: (format: "bold" | "italic" | "code" | "link") => void;
  onImageUploadClick: (blockId: string) => void;
}

export default function BlockRenderer({
  block,
  textareaRefs,
  selection,
  slashMenu,
  filteredSlashCommands,
  placeholderMenu,
  filteredPlaceholders,
  availablePlaceholders,
  onUpdate,
  onSelectionChange,
  onSlashMenuChange,
  onPlaceholderMenuChange,
  onApplySlashCommand,
  onApplyPlaceholder,
  onApplyInlineFormat,
  onImageUploadClick,
}: BlockRendererProps) {
  const setRef = (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    const map = textareaRefs.current;
    if (el) {
      map.set(block.id, el);
    } else {
      map.delete(block.id);
    }
  };

  const handleSelect = (target: HTMLTextAreaElement | HTMLInputElement) => {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    if (end > start) {
      onSelectionChange({ blockId: block.id, start, end });
    } else if (selection.blockId === block.id) {
      onSelectionChange({ blockId: null, start: 0, end: 0 });
    }
  };

  const handleBlur = () => {
    if (selection.blockId === block.id) {
      onSelectionChange({ blockId: null, start: 0, end: 0 });
    }
    // Close placeholder menu on blur
    if (placeholderMenu.blockId === block.id) {
      onPlaceholderMenuChange({ blockId: null, query: "", position: null });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    getValue: () => string
  ) => {
    // Only show menu if we have placeholders available
    if (availablePlaceholders.length === 0) {
      if (placeholderMenu.blockId === block.id) {
        onPlaceholderMenuChange({ blockId: null, query: "", position: null });
      }
      return;
    }
    
    const target = e.currentTarget;
    const cursorPos = target.selectionStart ?? 0;
    const value = getValue();
    
    const beforeCursor = value.slice(0, cursorPos);
    const lastBraceIndex = beforeCursor.lastIndexOf('{');
    
    console.log('[BlockRenderer] Input change:', {
      blockId: block.id,
      cursorPos,
      beforeCursor,
      lastBraceIndex,
      availablePlaceholders: availablePlaceholders.length,
    });
    
    if (lastBraceIndex !== -1) {
      // Check if there's a closing brace after the last opening brace
      const afterBrace = beforeCursor.slice(lastBraceIndex + 1);
      const closingBraceIndex = afterBrace.indexOf('}');
      
      // Only show menu if there's no closing brace yet
      if (closingBraceIndex === -1) {
        const query = afterBrace;
        
        // Calculate position for menu - use getBoundingClientRect for accurate positioning
        const rect = target.getBoundingClientRect();
        
        // Position below the input, aligned to left
        // Use getBoundingClientRect which gives viewport-relative coordinates
        const top = rect.bottom + 8; // 8px below input
        const left = rect.left; // Aligned to left of input
        
        console.log('[BlockRenderer] Showing placeholder menu:', {
          blockId: block.id,
          query,
          position: { top, left },
          filteredCount: filteredPlaceholders.length,
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right },
        });
        
        onPlaceholderMenuChange({
          blockId: block.id,
          query,
          position: { top, left },
        });
      } else {
        // Close menu if closing brace exists
        if (placeholderMenu.blockId === block.id) {
          onPlaceholderMenuChange({ blockId: null, query: "", position: null });
        }
      }
    } else {
      // Close menu if no opening brace
      if (placeholderMenu.blockId === block.id) {
        onPlaceholderMenuChange({ blockId: null, query: "", position: null });
      }
    }
  };

  if (block.type === "paragraph") {
    return (
      <textarea
        ref={setRef}
        value={(block as ParagraphBlock).text}
        onChange={(e) => {
          onUpdate(block.id, (prev) => ({
            ...prev,
            text: e.target.value,
          }));
          handleInputChange(e, () => e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "/" && !e.shiftKey && (block as ParagraphBlock).text.length === 0) {
            onSlashMenuChange({ blockId: block.id, query: "" });
          }
          // Close placeholder menu on Escape
          if (e.key === "Escape" && placeholderMenu.blockId === block.id) {
            onPlaceholderMenuChange({ blockId: null, query: "", position: null });
          }
        }}
        onSelect={(e) => handleSelect(e.currentTarget)}
        onBlur={handleBlur}
        placeholder="Tulis paragraf di sini... (markdown sederhana tetap didukung: **bold**, *italic*, dll.)"
        rows={4}
        className="min-h-[100px] w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    );
  }

  if (block.type === "heading") {
    const headingBlock = block as HeadingBlock;
    return (
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <HeadingIcon className="h-4 w-4" />
            Heading
          </p>
          <div className="flex gap-1">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() =>
                  onUpdate(block.id, (prev) => ({
                    ...(prev as HeadingBlock),
                    level: lvl as 1 | 2 | 3,
                  }))
                }
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  headingBlock.level === lvl
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                H{lvl}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          ref={setRef}
          value={headingBlock.text}
          onChange={(e) => {
            onUpdate(block.id, (prev) => ({
              ...prev,
              text: e.target.value,
            }));
            handleInputChange(e, () => e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && placeholderMenu.blockId === block.id) {
              onPlaceholderMenuChange({ blockId: null, query: "", position: null });
            }
          }}
          onSelect={(e) => handleSelect(e.currentTarget)}
          onBlur={handleBlur}
          placeholder="Judul section..."
          className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <textarea
        ref={setRef}
        value={(block as QuoteBlock).text}
        onChange={(e) => {
          onUpdate(block.id, (prev) => ({
            ...prev,
            text: e.target.value,
          }));
          handleInputChange(e, () => e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && placeholderMenu.blockId === block.id) {
            onPlaceholderMenuChange({ blockId: null, query: "", position: null });
          }
        }}
        onSelect={(e) => handleSelect(e.currentTarget)}
        onBlur={handleBlur}
        placeholder="Tulis quote atau highlight di sini..."
        rows={3}
        className="min-h-[80px] w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm italic text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    );
  }

  if (block.type === "list") {
    return (
      <textarea
        ref={setRef}
        value={(block as ListBlock).items}
        onChange={(e) => {
          onUpdate(block.id, (prev) => ({
            ...prev,
            items: e.target.value,
          }));
          handleInputChange(e, () => e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && placeholderMenu.blockId === block.id) {
            onPlaceholderMenuChange({ blockId: null, query: "", position: null });
          }
        }}
        onSelect={(e) => handleSelect(e.currentTarget)}
        onBlur={handleBlur}
        placeholder={"Satu item per baris.\nContoh:\n- Item 1\n- Item 2"}
        rows={4}
        className="min-h-[100px] w-full resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    );
  }

  if (block.type === "code") {
    const codeBlock = block as CodeBlock;
    return (
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Code2 className="h-4 w-4" />
            Code Block
          </p>
          <input
            type="text"
            value={codeBlock.language}
            onChange={(e) =>
              onUpdate(block.id, (prev) => ({
                ...(prev as CodeBlock),
                language: e.target.value,
              }))
            }
            placeholder="Bahasa (misal: ts, js, bash)"
            className="w-40 rounded-lg border border-border bg-background/60 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
          />
        </div>
        <textarea
          ref={setRef}
          value={codeBlock.code}
          onChange={(e) => {
            onUpdate(block.id, (prev) => ({
              ...(prev as CodeBlock),
              code: e.target.value,
            }));
            handleInputChange(e, () => e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && placeholderMenu.blockId === block.id) {
              onPlaceholderMenuChange({ blockId: null, query: "", position: null });
            }
          }}
          onSelect={(e) => handleSelect(e.currentTarget)}
          onBlur={handleBlur}
          placeholder="Tempel atau tulis kode di sini..."
          rows={6}
          className="min-h-[140px] w-full resize-y rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
    );
  }

  if (block.type === "image") {
    const imageBlock = block as ImageBlock;
    return (
      <div className="flex-1 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ImageIcon className="h-4 w-4" />
            Blok Gambar
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onImageUploadClick(block.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              <ImageIcon className="h-3 w-3" />
              {imageBlock.imageUrl ? "Ganti Gambar" : "Upload Gambar"}
            </button>
          </div>
        </div>

        {imageBlock.imageUrl ? (
          <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageBlock.imageUrl}
              alt={imageBlock.caption || "Gambar"}
              className="max-h-[320px] w-full object-contain bg-background/40"
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
            Belum ada gambar. Klik &quot;Upload Gambar&quot; atau drag & drop
            gambar ke editor.
          </div>
        )}

        <input
          type="text"
          value={imageBlock.caption}
          onChange={(e) =>
            onUpdate(block.id, (prev) => ({
              ...prev,
              caption: e.target.value,
            }))
          }
          placeholder="Caption / deskripsi gambar (opsional)"
          className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div className="flex-1">
        <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    );
  }

  if (block.type === "embed") {
    const embedBlock = block as EmbedBlock;
    return (
      <div className="flex-1 space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Link2 className="h-4 w-4" />
          Embed (URL)
        </p>
        <input
          type="text"
          value={embedBlock.url}
          onChange={(e) =>
            onUpdate(block.id, (prev) => ({
              ...prev,
              url: e.target.value,
            }))
          }
          placeholder="Tempel URL (YouTube, Tweet, link eksternal, dll.)"
          className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
    );
  }

  return null;
}

