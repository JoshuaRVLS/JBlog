export type BlockType =
  | "paragraph"
  | "heading"
  | "quote"
  | "list"
  | "code"
  | "image"
  | "divider"
  | "embed";

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}

export interface HeadingBlock {
  id: string;
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
}

export interface QuoteBlock {
  id: string;
  type: "quote";
  text: string;
}

export interface ListBlock {
  id: string;
  type: "list";
  items: string; // one item per line
}

export interface CodeBlock {
  id: string;
  type: "code";
  language: string;
  code: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  imageUrl: string | null;
  caption: string;
}

export interface DividerBlock {
  id: string;
  type: "divider";
}

export interface EmbedBlock {
  id: string;
  type: "embed";
  url: string;
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock
  | ImageBlock
  | DividerBlock
  | EmbedBlock;

export type BlockTemplate = Omit<Block, "id">;

export interface DragDropPostEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

