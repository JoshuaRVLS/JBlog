import { useState } from "react";
import type { BlockType } from "../types";

export function useSlashMenu() {
  const [slashMenu, setSlashMenu] = useState<{
    blockId: string | null;
    query: string;
  }>({ blockId: null, query: "" });

  const allCommands: { type: BlockType; label: string; description: string }[] = [
    { type: "paragraph", label: "Paragraph", description: "Teks biasa" },
    { type: "heading", label: "Heading", description: "Judul section" },
    { type: "list", label: "List", description: "Daftar poin" },
    { type: "quote", label: "Quote", description: "Kutipan / highlight" },
    { type: "code", label: "Code", description: "Blok kode" },
    { type: "image", label: "Image", description: "Blok gambar" },
    { type: "divider", label: "Divider", description: "Garis pemisah" },
    { type: "embed", label: "Embed", description: "URL embed (YouTube, dll.)" },
  ];

  const filteredSlashCommands = (() => {
    if (!slashMenu.query) return allCommands;
    const q = slashMenu.query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q),
    );
  })();

  return {
    slashMenu,
    setSlashMenu,
    filteredSlashCommands,
  };
}

