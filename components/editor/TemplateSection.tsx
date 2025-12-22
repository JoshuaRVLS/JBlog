import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import type { Block, BlockTemplate, HeadingBlock, ParagraphBlock, ListBlock } from "./types";
import { createId } from "./utils";

interface TemplateSectionProps {
  blocks: Block[];
  onAddBlocks: (blocks: Block[]) => void;
}

export default function TemplateSection({
  blocks,
  onAddBlocks,
}: TemplateSectionProps) {
  const [savedSnippets, setSavedSnippets] = useState<
    { id: string; name: string; blocks: BlockTemplate[] }[]
  >([]);
  const [snippetName, setSnippetName] = useState("");

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("jblog-editor-snippets")
          : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedSnippets(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persistSnippets = (
    next: { id: string; name: string; blocks: BlockTemplate[] }[]
  ) => {
    setSavedSnippets(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("jblog-editor-snippets", JSON.stringify(next));
      }
    } catch {
      // ignore
    }
  };

  const handleSaveCurrentAsSnippet = () => {
    const name = snippetName.trim();
    if (!name) {
      toast.error("Kasih nama dulu untuk snippet ini.");
      return;
    }
    if (blocks.length === 0) {
      toast.error("Tidak ada blok untuk disimpan.");
      return;
    }
    const templateBlocks: BlockTemplate[] = blocks.map(({ id, ...rest }) => rest);
    const newSnippet = { id: createId(), name, blocks: templateBlocks };
    const next = [newSnippet, ...savedSnippets].slice(0, 15);
    persistSnippets(next);
    setSnippetName("");
    toast.success("Template disimpan");
  };

  const handleInsertSnippet = (snippetId: string) => {
    const snippet = savedSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    const newBlocks: Block[] = snippet.blocks.map((b): Block => ({
      ...(b as any),
      id: createId(),
    }));
    onAddBlocks(newBlocks);
    toast.success("Template ditambahkan");
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-muted-foreground">Template:</span>
        <button
          type="button"
          onClick={() => {
            const base: BlockTemplate[] = [
              { type: "heading", level: 1, text: "Judul Utama" } as HeadingBlock,
              {
                type: "paragraph",
                text: "Tulis pembukaan artikel di sini...",
              } as ParagraphBlock,
            ];
            onAddBlocks(base.map((b) => ({ ...b, id: createId() } as Block)));
          }}
          className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
        >
          Artikel
        </button>
        <button
          type="button"
          onClick={() => {
            const base: BlockTemplate[] = [
              {
                type: "heading",
                level: 2,
                text: "✨ Perubahan Baru",
              } as HeadingBlock,
              {
                type: "list",
                items: "Fitur 1\nFitur 2\nPerbaikan bug",
              } as ListBlock,
            ];
            onAddBlocks(base.map((b) => ({ ...b, id: createId() } as Block)));
          }}
          className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
        >
          Changelog
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
        <input
          type="text"
          value={snippetName}
          onChange={(e) => setSnippetName(e.target.value)}
          placeholder="Nama template, misal: 'FAQ section'"
          className="min-w-[180px] flex-1 rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
        />
        <button
          type="button"
          onClick={handleSaveCurrentAsSnippet}
          className="rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
        >
          Simpan blok ini
        </button>
        {savedSnippets.length > 0 && (
          <select
            onChange={(e) => {
              if (!e.target.value) return;
              handleInsertSnippet(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
            className="min-w-[140px] rounded-full border border-border bg-background/70 px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
          >
            <option value="">Pakai template…</option>
            {savedSnippets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

