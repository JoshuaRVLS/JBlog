import type { Block, BlockTemplate } from "./types";

export function createId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseMarkdownToBlocks(markdown: string): Block[] {
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

export function blocksToMarkdown(blocks: Block[]): string {
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

