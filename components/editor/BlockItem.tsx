import BlockActions from "./BlockActions";
import BlockRenderer from "./BlockRenderer";
import InlineToolbar from "./InlineToolbar";
import SlashMenu from "./SlashMenu";
import PlaceholderAutocompleteMenu from "./PlaceholderAutocompleteMenu";
import type { Block, BlockType } from "./types";

interface BlockItemProps {
  block: Block;
  draggingId: string | null;
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
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, overId: string) => void;
  onDrop: () => void;
  onRemove: (id: string) => void;
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

export default function BlockItem({
  block,
  draggingId,
  textareaRefs,
  selection,
  slashMenu,
  filteredSlashCommands,
  placeholderMenu,
  filteredPlaceholders,
  onDragStart,
  onDragOver,
  onDrop,
  onRemove,
  onUpdate,
  onSelectionChange,
  onSlashMenuChange,
  onPlaceholderMenuChange,
  onApplySlashCommand,
  onApplyPlaceholder,
  onApplyInlineFormat,
  onImageUploadClick,
}: BlockItemProps) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, block.id)}
      onDrop={onDrop}
      className={`group flex gap-3 rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-lg ${
        draggingId === block.id ? "opacity-70 ring-2 ring-primary/40" : ""
      }`}
    >
      <BlockActions
        block={block}
        draggingId={draggingId}
        onDragStart={onDragStart}
        onRemove={onRemove}
      />

      <div className="flex-1">
        <BlockRenderer
          block={block}
          textareaRefs={textareaRefs}
          selection={selection}
          slashMenu={slashMenu}
          filteredSlashCommands={filteredSlashCommands}
          placeholderMenu={placeholderMenu}
          filteredPlaceholders={filteredPlaceholders}
          onUpdate={onUpdate}
          onSelectionChange={onSelectionChange}
          onSlashMenuChange={onSlashMenuChange}
          onPlaceholderMenuChange={onPlaceholderMenuChange}
          onApplySlashCommand={onApplySlashCommand}
          onApplyPlaceholder={onApplyPlaceholder}
          onApplyInlineFormat={onApplyInlineFormat}
          onImageUploadClick={onImageUploadClick}
        />

        {selection.blockId === block.id &&
          (block.type === "paragraph" ||
            block.type === "heading" ||
            block.type === "quote" ||
            block.type === "list" ||
            block.type === "code") && (
            <InlineToolbar onFormat={onApplyInlineFormat} />
          )}

        {slashMenu.blockId === block.id &&
          block.type === "paragraph" && (
            <SlashMenu
              commands={filteredSlashCommands}
              onSelect={(type) => onApplySlashCommand(block.id, type)}
            />
          )}

        {placeholderMenu.blockId === block.id &&
          (block.type === "paragraph" ||
            block.type === "heading" ||
            block.type === "quote" ||
            block.type === "list" ||
            block.type === "code") && (
            <PlaceholderAutocompleteMenu
              placeholders={filteredPlaceholders}
              onSelect={(placeholder) => onApplyPlaceholder(block.id, placeholder)}
              position={placeholderMenu.position}
            />
          )}
      </div>
    </div>
  );
}

