import { useState, useEffect, useRef } from "react";
import type { Block, BlockType, BlockTemplate } from "../types";
import { parseMarkdownToBlocks, blocksToMarkdown, createId } from "../utils";

export function useBlockEditor(initialValue: string, onChange: (markdown: string) => void) {
  const [blocks, setBlocks] = useState<Block[]>(() =>
    parseMarkdownToBlocks(initialValue),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const textareaRefs = useRef<
    Map<string, HTMLTextAreaElement | HTMLInputElement>
  >(new Map());

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
        newBlock = { id: createId(), type: "paragraph", text: "" };
        break;
      case "heading":
        newBlock = { id: createId(), type: "heading", level: 2, text: "" };
        break;
      case "quote":
        newBlock = { id: createId(), type: "quote", text: "" };
        break;
      case "list":
        newBlock = { id: createId(), type: "list", items: "" };
        break;
      case "code":
        newBlock = { id: createId(), type: "code", language: "", code: "" };
        break;
      case "divider":
        newBlock = { id: createId(), type: "divider" };
        break;
      case "embed":
        newBlock = { id: createId(), type: "embed", url: "" };
        break;
      case "image":
      default:
        newBlock = { id: createId(), type: "image", imageUrl: null, caption: "" };
        break;
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const addBlocks = (newBlocks: Block[]) => {
    setBlocks((prev) => [...prev, ...newBlocks]);
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

  return {
    blocks,
    draggingId,
    textareaRefs,
    updateBlock,
    addBlock,
    removeBlock,
    addBlocks,
    onDragStart,
    onDragOver,
    onDrop,
  };
}

