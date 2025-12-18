"use client";

import { useState, useEffect, useRef } from "react";
import {
  GripVertical,
  Image as ImageIcon,
  Plus,
  Trash2,
  Heading as HeadingIcon,
  Quote,
  Code2,
  List as ListIcon,
  Minus,
  Link2,
} from "lucide-react";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

type BlockType =
  | "paragraph"
  | "heading"
  | "quote"
  | "list"
  | "code"
  | "image"
  | "divider"
  | "embed";

interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}

interface HeadingBlock {
  id: string;
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
}

interface QuoteBlock {
  id: string;
  type: "quote";
  text: string;
}

interface ListBlock {
  id: string;
  type: "list";
  items: string; // one item per line
}

interface CodeBlock {
  id: string;
  type: "code";
  language: string;
  code: string;
}

interface ImageBlock {
  id: string;
  type: "image";
  imageUrl: string | null;
  caption: string;
}

interface DividerBlock {
  id: string;
  type: "divider";
}

interface EmbedBlock {
  id: string;
  type: "embed";
  url: string;
}

type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock
  | ImageBlock
  | DividerBlock
  | EmbedBlock;

type BlockTemplate = Omit<Block, "id">;

interface DragDropPostEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseMarkdownToBlocks(markdown: string): Block[] {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return [
      {
        id: createId(),
        type: "paragraph",
        text: "",
      },
    ];
  }

  const lines = trimmed.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    // Divider
    if (/^---\s*$/.test(line)) {
      blocks.push({ id: createId(), type: "divider" });
      i += 1;
      continue;
    }

    // Code block ```lang ... ```
    if (line.startsWith("```")) {
      const lang = line.replace(/```/, "").trim() || "";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      // Skip closing ```
      if (i < lines.length && lines[i].startsWith("```")) {
        i += 1;
      }
      blocks.push({
        id: createId(),
        type: "code",
        language: lang,
        code: codeLines.join("\n"),
      });
      continue;
    }

    const trimmedLine = line.trim();

    // Heading
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(trimmedLine);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      const text = headingMatch[2];
      blocks.push({
        id: createId(),
        type: "heading",
        level,
        text,
      });
      i += 1;
      continue;
    }

    // Quote (can span multiple lines starting with >)
    if (trimmedLine.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({
        id: createId(),
        type: "quote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // List (consecutive - or * lines)
    if (/^[-*]\s+/.test(trimmedLine)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({
        id: createId(),
        type: "list",
        items: items.join("\n"),
      });
      continue;
    }

    // Image block HTML (our custom format)
    if (trimmedLine.startsWith('<div class="image-block"')) {
      const imageLines: string[] = [];
      while (i < lines.length && !lines[i].includes("</div>")) {
        imageLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        imageLines.push(lines[i]);
        i += 1;
      }
      const html = imageLines.join("\n");
      const srcMatch = /<img[^>]+src="([^"]+)"[^>]*>/i.exec(html);
      const captionMatch =
        /<p[^>]*class="image-caption"[^>]*>\*?(.*?)\*?<\/p>/i.exec(html);
      blocks.push({
        id: createId(),
        type: "image",
        imageUrl: srcMatch ? srcMatch[1] : null,
        caption: captionMatch ? captionMatch[1] : "",
      });
      continue;
    }

    // Embed: single URL line
    if (
      /^https?:\/\//.test(trimmedLine) &&
      (i === 0 ||
        lines[i - 1].trim() === "") &&
      (i === lines.length - 1 || lines[i + 1].trim() === "")
    ) {
      blocks.push({
        id: createId(),
        type: "embed",
        url: trimmedLine,
      });
      i += 1;
      continue;
    }

    // Paragraph: consume until blank line
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      paraLines.push(lines[i]);
      i += 1;
    }
    // skip blank line
    while (i < lines.length && lines[i].trim() === "") {
      i += 1;
    }
    blocks.push({
      id: createId(),
      type: "paragraph",
      text: paraLines.join("\n"),
    });
  }

  return blocks;
}

function blocksToMarkdown(blocks: Block[]): string {
  const segments = blocks.map((block) => {
    switch (block.type) {
      case "paragraph":
        return block.text.trim();
      case "heading": {
        const hashes = "#".repeat(block.level);
        return `${hashes} ${block.text.trim()}`;
      }
      case "quote":
        return block.text
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
      case "list":
        return block.items
          .split("\n")
          .filter((item) => item.trim().length > 0)
          .map((item) => `- ${item.trim()}`)
          .join("\n");
      case "code":
        return [
          `\`\`\`${block.language || ""}`.trimEnd(),
          block.code,
          "```",
        ].join("\n");
      case "divider":
        return "---";
      case "embed":
        return block.url.trim();
      case "image": {
        if (!block.imageUrl) return "";
        const safeCaption = (block.caption || "Deskripsi gambar").replace(
          /\*/g,
          "",
        );
        return [
          `<div class="image-block">`,
          `  <div class="image-container">`,
          `    <img src="${block.imageUrl}" alt="${safeCaption}" />`,
          `  </div>`,
          `  <p class="image-caption">*${safeCaption}*</p>`,
          `</div>`,
        ].join("\n");
      }
      default:
        return "";
    }
  });

  return segments.filter(Boolean).join("\n\n");
}

export default function DragDropPostEditor({
  value,
  onChange,
}: DragDropPostEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    parseMarkdownToBlocks(value),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRefs = useRef<
    Map<string, HTMLTextAreaElement | HTMLInputElement>
  >(
    new Map<string, HTMLTextAreaElement | HTMLInputElement>(),
  );
  const [selection, setSelection] = useState<{
    blockId: string | null;
    start: number;
    end: number;
  }>({ blockId: null, start: 0, end: 0 });
  const [slashMenu, setSlashMenu] = useState<{
    blockId: string | null;
    query: string;
  }>({ blockId: null, query: "" });
  const [savedSnippets, setSavedSnippets] = useState<
    { id: string; name: string; blocks: BlockTemplate[] }[]
  >([]);
  const [snippetName, setSnippetName] = useState("");

  // Push markdown up whenever blocks change
  useEffect(() => {
    onChange(blocksToMarkdown(blocks));
  }, [blocks, onChange]);

  const updateBlock = (id: string, updater: (block: Block) => Block) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? updater(block) : block)),
    );
  };

  const addBlock = (type: BlockType) => {
    let newBlock: Block;

    switch (type) {
      case "paragraph":
        newBlock = {
          id: createId(),
          type: "paragraph",
          text: "",
        };
        break;
      case "heading":
        newBlock = {
          id: createId(),
          type: "heading",
          level: 2,
          text: "",
        };
        break;
      case "quote":
        newBlock = {
          id: createId(),
          type: "quote",
          text: "",
        };
        break;
      case "list":
        newBlock = {
          id: createId(),
          type: "list",
          items: "",
        };
        break;
      case "code":
        newBlock = {
          id: createId(),
          type: "code",
          language: "",
          code: "",
        };
        break;
      case "divider":
        newBlock = {
          id: createId(),
          type: "divider",
        };
        break;
      case "embed":
        newBlock = {
          id: createId(),
          type: "embed",
          url: "",
        };
        break;
      case "image":
      default:
        newBlock = {
          id: createId(),
          type: "image",
          imageUrl: null,
          caption: "",
        };
        break;
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const onDragStart = (id: string) => {
    setDraggingId(id);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>, overId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;

    setBlocks((prev) => {
      const currentIndex = prev.findIndex((b) => b.id === draggingId);
      const overIndex = prev.findIndex((b) => b.id === overId);
      if (currentIndex === -1 || overIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(overIndex, 0, moved);
      return updated;
    });
  };

  const onDrop = () => {
    setDraggingId(null);
  };

  const handleImageUploadClick = (blockId: string) => {
    setUploadingBlockId(blockId);
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingBlockId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await AxiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl: string = response.data.url;
      const cleanUrl = imageUrl.trim().replace(/^["']|["']$/g, "");

      updateBlock(uploadingBlockId, (block) => {
        if (block.type !== "image") return block;
        return {
          ...block,
          imageUrl: cleanUrl,
        };
      });

      toast.success("Gambar berhasil diupload");
    } catch (error: any) {
      console.error("Error uploading image block:", error);
      toast.error(
        error?.response?.data?.error || "Gagal upload gambar untuk block ini",
      );
    } finally {
      setUploadingBlockId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRootDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Allow file drops (images) on the whole editor area
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
    }
  };

  const handleRootDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya file gambar yang diizinkan untuk drag & drop");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 10MB");
      return;
    }

    try {
      const tempId = createId();
      // Tambah blok image kosong dulu biar terasa instan
      setBlocks((prev) => [
        ...prev,
        {
          id: tempId,
          type: "image",
          imageUrl: null,
          caption: "",
        } as ImageBlock,
      ]);

      const formData = new FormData();
      formData.append("image", file);

      const response = await AxiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl: string = response.data.url;
      const cleanUrl = imageUrl.trim().replace(/^["']|["']$/g, "");

      updateBlock(tempId, (block) => {
        if (block.type !== "image") return block;
        return {
          ...block,
          imageUrl: cleanUrl,
        };
      });

      toast.success("Gambar berhasil diupload dari drag & drop");
    } catch (error: any) {
      console.error("Error uploading dropped image:", error);
      toast.error(
        error?.response?.data?.error ||
          "Gagal upload gambar dari drag & drop",
      );
    }
  };

  const filteredSlashCommands = (() => {
    const all: { type: BlockType; label: string; description: string }[] = [
      { type: "paragraph", label: "Paragraph", description: "Teks biasa" },
      { type: "heading", label: "Heading", description: "Judul section" },
      { type: "list", label: "List", description: "Daftar poin" },
      { type: "quote", label: "Quote", description: "Kutipan / highlight" },
      { type: "code", label: "Code", description: "Blok kode" },
      { type: "image", label: "Image", description: "Blok gambar" },
      { type: "divider", label: "Divider", description: "Garis pemisah" },
      { type: "embed", label: "Embed", description: "URL embed (YouTube, dll.)" },
    ];
    if (!slashMenu.query) return all;
    const q = slashMenu.query.toLowerCase();
    return all.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q),
    );
  })();

  const applySlashCommand = (blockId: string, type: BlockType) => {
    setSlashMenu({ blockId: null, query: "" });
    setSelection({ blockId: null, start: 0, end: 0 });

    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        switch (type) {
          case "paragraph":
            return { id: block.id, type: "paragraph", text: "" };
          case "heading":
            return { id: block.id, type: "heading", level: 2, text: "" };
          case "quote":
            return { id: block.id, type: "quote", text: "" };
          case "list":
            return { id: block.id, type: "list", items: "" };
          case "code":
            return { id: block.id, type: "code", language: "", code: "" };
          case "divider":
            return { id: block.id, type: "divider" };
          case "embed":
            return { id: block.id, type: "embed", url: "" };
          case "image":
          default:
            return {
              id: block.id,
              type: "image",
              imageUrl: null,
              caption: "",
            };
        }
      }),
    );
  };

  const applyInlineFormat = (format: "bold" | "italic" | "code" | "link") => {
    if (!selection.blockId) return;
    const ref = textareaRefs.current.get(selection.blockId);
    if (!ref) return;

    const { start, end } = selection;
    if (end <= start) return;

    const value = ref.value;
    const selected = value.slice(start, end);
    if (!selected) return;

    let formatted = selected;

    if (format === "bold") {
      formatted = `**${selected}**`;
    } else if (format === "italic") {
      formatted = `*${selected}*`;
    } else if (format === "code") {
      formatted = `\`${selected}\``;
    } else if (format === "link") {
      formatted = `[${selected}](https://)`;
    }

    const updatedValue = value.slice(0, start) + formatted + value.slice(end);

    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== selection.blockId) return block;
        switch (block.type) {
          case "paragraph":
          case "heading":
          case "quote":
            return { ...block, text: updatedValue } as Block;
          case "list":
            return { ...block, items: updatedValue } as Block;
          case "code":
            return { ...(block as CodeBlock), code: updatedValue } as Block;
          default:
            return block;
        }
      }),
    );

    const newStart = start;
    const newEnd = start + formatted.length;

    requestAnimationFrame(() => {
      try {
        ref.focus();
        ref.setSelectionRange(newStart, newEnd);
      } catch {
        // ignore
      }
    });
  };

  // Load saved snippets from localStorage
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

  const persistSnippets = (next: { id: string; name: string; blocks: BlockTemplate[] }[]) => {
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
    toast.success("Blok berhasil disimpan sebagai template.");
  };

  const handleInsertSnippet = (snippetId: string) => {
    const snippet = savedSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    const newBlocks: Block[] = snippet.blocks.map((b): Block => ({
      ...(b as any),
      id: createId(),
    }));
    setBlocks((prev) => [...prev, ...newBlocks]);
    toast.success("Template berhasil dimasukkan ke editor.");
  };

  return (
    <div
      className="space-y-4"
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Susun konten kamu dengan blok seperti paragraf, heading, list, quote,
          gambar, dll. Blok bisa di-drag & drop untuk diurutkan.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addBlock("paragraph")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="h-3 w-3" />
            Paragraf
          </button>
          <button
            type="button"
            onClick={() => addBlock("heading")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <HeadingIcon className="h-3 w-3" />
            Heading
          </button>
          <button
            type="button"
            onClick={() => addBlock("list")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <ListIcon className="h-3 w-3" />
            List
          </button>
          <button
            type="button"
            onClick={() => addBlock("quote")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Quote className="h-3 w-3" />
            Quote
          </button>
          <button
            type="button"
            onClick={() => addBlock("code")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Code2 className="h-3 w-3" />
            Code
          </button>
          <button
            type="button"
            onClick={() => addBlock("image")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <ImageIcon className="h-3 w-3" />
            Gambar
          </button>
          <button
            type="button"
            onClick={() => addBlock("divider")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Minus className="h-3 w-3" />
            Divider
          </button>
          <button
            type="button"
            onClick={() => addBlock("embed")}
            className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Link2 className="h-3 w-3" />
            Embed
          </button>
        </div>
      </div>

      {/* Template & reusable blocks */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-muted-foreground">
            Template cepat:
          </span>
          <button
            type="button"
            onClick={() => {
              // Simple "article" template: heading + paragraph
              const base: BlockTemplate[] = [
                { type: "heading", level: 1, text: "Judul Utama" } as HeadingBlock,
                {
                  type: "paragraph",
                  text: "Tulis pembukaan artikel di sini...",
                } as ParagraphBlock,
              ];
              setBlocks((prev) => [
                ...prev,
                ...base.map((b) => ({ ...b, id: createId() } as Block)),
              ]);
            }}
            className="rounded-full bg-background px-3 py-1 text-[11px] font-medium text-foreground hover:bg-accent"
          >
            Artikel
          </button>
          <button
            type="button"
            onClick={() => {
              // Simple "changelog" template
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
              setBlocks((prev) => [
                ...prev,
                ...base.map((b) => ({ ...b, id: createId() } as Block)),
              ]);
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      <div className="space-y-3">
        {blocks.map((block) => (
          <div
            key={block.id}
            onDragOver={(e) => onDragOver(e, block.id)}
            onDrop={onDrop}
            className={`group flex gap-3 rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg ${
              draggingId === block.id ? "opacity-70 ring-2 ring-primary/40" : ""
            }`}
          >
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
                onClick={() => removeBlock(block.id)}
                className="rounded-md p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {block.type === "paragraph" && (
              <textarea
                ref={(el) => {
                  const map = textareaRefs.current;
                  if (el) {
                    map.set(block.id, el);
                  } else {
                    map.delete(block.id);
                  }
                }}
                value={block.text}
                onChange={(e) =>
                  updateBlock(block.id, (prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "/" && !e.shiftKey && block.text.length === 0) {
                    // open slash menu for this block
                    setSlashMenu({ blockId: block.id, query: "" });
                  }
                }}
                onSelect={(e) => {
                  const target = e.currentTarget;
                  const start = target.selectionStart ?? 0;
                  const end = target.selectionEnd ?? 0;
                  if (end > start) {
                    setSelection({ blockId: block.id, start, end });
                  } else if (selection.blockId === block.id) {
                    setSelection({ blockId: null, start: 0, end: 0 });
                  }
                }}
                onBlur={() => {
                  if (selection.blockId === block.id) {
                    setSelection({ blockId: null, start: 0, end: 0 });
                  }
                }}
                placeholder="Tulis paragraf di sini... (markdown sederhana tetap didukung: **bold**, *italic*, dll.)"
                rows={4}
                className="min-h-[100px] flex-1 resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}

            {block.type === "heading" && (
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
                          updateBlock(block.id, (prev) => ({
                            ...(prev as HeadingBlock),
                            level: lvl as 1 | 2 | 3,
                          }))
                        }
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          block.level === lvl
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
                  ref={(el) => {
                    const map = textareaRefs.current;
                    if (el) {
                      map.set(block.id, el);
                    } else {
                      map.delete(block.id);
                    }
                  }}
                  value={block.text}
                  onChange={(e) =>
                    updateBlock(block.id, (prev) => ({
                      ...prev,
                      text: e.target.value,
                    }))
                  }
                  onSelect={(e) => {
                    const target = e.currentTarget;
                    const start = target.selectionStart ?? 0;
                    const end = target.selectionEnd ?? 0;
                    if (end > start) {
                      setSelection({ blockId: block.id, start, end });
                    } else if (selection.blockId === block.id) {
                      setSelection({ blockId: null, start: 0, end: 0 });
                    }
                  }}
                  onBlur={() => {
                    if (selection.blockId === block.id) {
                      setSelection({ blockId: null, start: 0, end: 0 });
                    }
                  }}
                  placeholder="Judul section..."
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {block.type === "quote" && (
              <textarea
                ref={(el) => {
                  const map = textareaRefs.current;
                  if (el) {
                    map.set(block.id, el);
                  } else {
                    map.delete(block.id);
                  }
                }}
                value={block.text}
                onChange={(e) =>
                  updateBlock(block.id, (prev) => ({
                    ...prev,
                    text: e.target.value,
                  }))
                }
                onSelect={(e) => {
                  const target = e.currentTarget;
                  const start = target.selectionStart ?? 0;
                  const end = target.selectionEnd ?? 0;
                  if (end > start) {
                    setSelection({ blockId: block.id, start, end });
                  } else if (selection.blockId === block.id) {
                    setSelection({ blockId: null, start: 0, end: 0 });
                  }
                }}
                onBlur={() => {
                  if (selection.blockId === block.id) {
                    setSelection({ blockId: null, start: 0, end: 0 });
                  }
                }}
                placeholder="Tulis quote atau highlight di sini..."
                rows={3}
                className="min-h-[80px] flex-1 resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm italic text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}

            {block.type === "list" && (
              <textarea
                ref={(el) => {
                  const map = textareaRefs.current;
                  if (el) {
                    map.set(block.id, el);
                  } else {
                    map.delete(block.id);
                  }
                }}
                value={block.items}
                onChange={(e) =>
                  updateBlock(block.id, (prev) => ({
                    ...prev,
                    items: e.target.value,
                  }))
                }
                onSelect={(e) => {
                  const target = e.currentTarget;
                  const start = target.selectionStart ?? 0;
                  const end = target.selectionEnd ?? 0;
                  if (end > start) {
                    setSelection({ blockId: block.id, start, end });
                  } else if (selection.blockId === block.id) {
                    setSelection({ blockId: null, start: 0, end: 0 });
                  }
                }}
                onBlur={() => {
                  if (selection.blockId === block.id) {
                    setSelection({ blockId: null, start: 0, end: 0 });
                  }
                }}
                placeholder={"Satu item per baris.\nContoh:\n- Item 1\n- Item 2"}
                rows={4}
                className="min-h-[100px] flex-1 resize-y rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}

            {block.type === "code" && (
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Code2 className="h-4 w-4" />
                    Code Block
                  </p>
                  <input
                    type="text"
                    value={block.language}
                    onChange={(e) =>
                      updateBlock(block.id, (prev) => ({
                        ...(prev as CodeBlock),
                        language: e.target.value,
                      }))
                    }
                    placeholder="Bahasa (misal: ts, js, bash)"
                    className="w-40 rounded-lg border border-border bg-background/60 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <textarea
                  ref={(el) => {
                    const map = textareaRefs.current;
                    if (el) {
                      map.set(block.id, el);
                    } else {
                      map.delete(block.id);
                    }
                  }}
                  value={block.code}
                  onChange={(e) =>
                    updateBlock(block.id, (prev) => ({
                      ...(prev as CodeBlock),
                      code: e.target.value,
                    }))
                  }
                  onSelect={(e) => {
                    const target = e.currentTarget;
                    const start = target.selectionStart ?? 0;
                    const end = target.selectionEnd ?? 0;
                    if (end > start) {
                      setSelection({ blockId: block.id, start, end });
                    } else if (selection.blockId === block.id) {
                      setSelection({ blockId: null, start: 0, end: 0 });
                    }
                  }}
                  onBlur={() => {
                    if (selection.blockId === block.id) {
                      setSelection({ blockId: null, start: 0, end: 0 });
                    }
                  }}
                  placeholder="Tempel atau tulis kode di sini..."
                  rows={6}
                  className="min-h-[140px] flex-1 resize-y rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {block.type === "image" && (
              <div className="flex-1 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ImageIcon className="h-4 w-4" />
                    Blok Gambar
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleImageUploadClick(block.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                    >
                      <ImageIcon className="h-3 w-3" />
                      {block.imageUrl ? "Ganti Gambar" : "Upload Gambar"}
                    </button>
                  </div>
                </div>

                {block.imageUrl ? (
                  <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={block.imageUrl}
                      alt={block.caption || "Gambar"}
                      className="max-h-[320px] w-full object-contain bg-background/40"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                    Belum ada gambar. Klik &quot;Upload Gambar&quot; atau drag &
                    drop gambar ke editor.
                  </div>
                )}

                <input
                  type="text"
                  value={block.caption}
                  onChange={(e) =>
                    updateBlock(block.id, (prev) => ({
                      ...prev,
                      caption: e.target.value,
                    }))
                  }
                  placeholder="Caption / deskripsi gambar (opsional)"
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {block.type === "divider" && (
              <div className="flex-1">
                <div className="my-3 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
              </div>
            )}

            {block.type === "embed" && (
              <div className="flex-1 space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Link2 className="h-4 w-4" />
                  Embed (URL)
                </p>
                <input
                  type="text"
                  value={block.url}
                  onChange={(e) =>
                    updateBlock(block.id, (prev) => ({
                      ...prev,
                      url: e.target.value,
                    }))
                  }
                  placeholder="Tempel URL (YouTube, Tweet, link eksternal, dll.)"
                  className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Inline toolbar (bold / italic / code / link) */}
            {selection.blockId === block.id &&
              (block.type === "paragraph" ||
                block.type === "heading" ||
                block.type === "quote" ||
                block.type === "list" ||
                block.type === "code") && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-1 text-xs shadow-sm">
                  <button
                    type="button"
                    onClick={() => applyInlineFormat("bold")}
                    className="rounded-full px-2 py-1 font-semibold hover:bg-accent"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInlineFormat("italic")}
                    className="rounded-full px-2 py-1 italic hover:bg-accent"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInlineFormat("code")}
                    className="rounded-full px-2 py-1 font-mono text-[11px] hover:bg-accent"
                  >
                    {"</>"}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyInlineFormat("link")}
                    className="rounded-full px-2 py-1 hover:bg-accent"
                  >
                    Link
                  </button>
                </div>
              )}

            {/* Slash command menu */}
            {slashMenu.blockId === block.id &&
              block.type === "paragraph" && (
                <div className="mt-2 w-full max-w-xs rounded-lg border border-border bg-popover p-2 text-xs shadow-lg">
                  {filteredSlashCommands.length === 0 ? (
                    <div className="px-2 py-1 text-muted-foreground">
                      Tidak ada hasil
                    </div>
                  ) : (
                    filteredSlashCommands.map((cmd) => (
                      <button
                        key={cmd.type}
                        type="button"
                        onClick={() => applySlashCommand(block.id, cmd.type)}
                        className="flex w-full flex-col items-start rounded-md px-2 py-1 text-left hover:bg-accent"
                      >
                        <span className="font-medium text-foreground">
                          {cmd.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {cmd.description}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
          </div>
        ))}

        {blocks.length === 0 && (
          <button
            type="button"
            onClick={() => addBlock("paragraph")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Tambah blok pertama
          </button>
        )}
      </div>
    </div>
  );
}


