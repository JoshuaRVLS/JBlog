"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { DragDropPostEditorProps } from "./types";
import { createId } from "./utils";
import { useBlockEditor } from "./hooks/useBlockEditor";
import { useImageUpload } from "./hooks/useImageUpload";
import { useSlashMenu } from "./hooks/useSlashMenu";
import { usePlaceholderAutocomplete } from "./hooks/usePlaceholderAutocomplete";
import { useTextSelection } from "./hooks/useTextSelection";
import EditorToolbar from "./EditorToolbar";
import TemplateSection from "./TemplateSection";
import BlockItem from "./BlockItem";
import type { Block, BlockType, CodeBlock } from "./types";

export default function DragDropPostEditor({
  value,
  onChange,
  customScript,
}: DragDropPostEditorProps) {
  const {
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
  } = useBlockEditor(value, onChange);

  const {
    fileInputRef,
    handleImageUploadClick,
    handleImageFileChange,
    handleRootDrop,
    handleRootDragOver,
  } = useImageUpload(updateBlock, addBlocks, createId);

  const { slashMenu, setSlashMenu, filteredSlashCommands } = useSlashMenu();
  const {
    placeholderMenu,
    setPlaceholderMenu,
    filteredPlaceholders,
  } = usePlaceholderAutocomplete(customScript);
  const { selection, setSelection } = useTextSelection();

  const applySlashCommand = (blockId: string, type: BlockType) => {
    setSlashMenu({ blockId: null, query: "" });
    setSelection({ blockId: null, start: 0, end: 0 });

    updateBlock(blockId, (block) => {
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
    });
  };

  const applyPlaceholder = (blockId: string, placeholder: string) => {
    setPlaceholderMenu({ blockId: null, query: "", position: null });
    const ref = textareaRefs.current.get(blockId);
    if (!ref) return;

    const cursorPos = ref.selectionStart ?? 0;
    const value = ref.value;
    
    // Find the position of the last '{' before cursor
    const beforeCursor = value.slice(0, cursorPos);
    const lastBraceIndex = beforeCursor.lastIndexOf('{');
    
    if (lastBraceIndex === -1) return;
    
    // Replace from '{' to cursor with '{placeholder}'
    const newValue = 
      value.slice(0, lastBraceIndex) + 
      `{${placeholder}}` + 
      value.slice(cursorPos);

    updateBlock(blockId, (block) => {
      switch (block.type) {
        case "paragraph":
        case "heading":
        case "quote":
          return { ...block, text: newValue } as Block;
        case "list":
          return { ...block, items: newValue } as Block;
        case "code":
          return { ...(block as CodeBlock), code: newValue } as Block;
        default:
          return block;
      }
    });

    // Set cursor after the placeholder
    const newCursorPos = lastBraceIndex + `{${placeholder}}`.length;
    requestAnimationFrame(() => {
      try {
        ref.focus();
        ref.setSelectionRange(newCursorPos, newCursorPos);
      } catch {
        // ignore
      }
    });
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

    updateBlock(selection.blockId, (block) => {
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
    });

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

  return (
    <div
      className="space-y-4"
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
    >
      <EditorToolbar onAddBlock={addBlock} />

      <TemplateSection blocks={blocks} onAddBlocks={addBlocks} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      <div className="space-y-3">
        {blocks.map((block) => (
          <BlockItem
            key={block.id}
            block={block}
            draggingId={draggingId}
            textareaRefs={textareaRefs}
            selection={selection}
            slashMenu={slashMenu}
            filteredSlashCommands={filteredSlashCommands}
            placeholderMenu={placeholderMenu}
            filteredPlaceholders={filteredPlaceholders}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onRemove={removeBlock}
            onUpdate={updateBlock}
            onSelectionChange={setSelection}
            onSlashMenuChange={setSlashMenu}
            onPlaceholderMenuChange={setPlaceholderMenu}
            onApplySlashCommand={applySlashCommand}
            onApplyPlaceholder={applyPlaceholder}
            onApplyInlineFormat={applyInlineFormat}
            onImageUploadClick={handleImageUploadClick}
          />
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
