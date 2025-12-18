"use client";

export default function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown parser
  const parseMarkdown = (text: string) => {
    let html = text;
    
    // Handle image blocks first (before other parsing to preserve HTML structure)
    // Match: <div class="image-block">...</div>
    const imageBlockRegex = /<div class="image-block">[\s\S]*?<\/div>/g;
    const imageBlocks: string[] = [];
    html = html.replace(imageBlockRegex, (match) => {
      imageBlocks.push(match);
      // Gunakan placeholder yang tidak mengandung karakter markdown (tanpa _ atau *)
      return `JIMAGEBLOCKPLACEHOLDER${imageBlocks.length - 1}`;
    });

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3 class='text-2xl font-bold mb-2 mt-4'>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2 class='text-3xl font-bold mb-3 mt-6'>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1 class='text-4xl font-bold mb-4 mt-8'>$1</h1>");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold'>$1</strong>");
    html = html.replace(/__(.*?)__/g, "<strong class='font-bold'>$1</strong>");

    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>");
    html = html.replace(/_(.*?)_/g, "<em class='italic'>$1</em>");

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre class='bg-muted p-4 rounded-lg overflow-x-auto my-6'><code>$1</code></pre>");

    // Inline code
    html = html.replace(/`(.*?)`/g, "<code class='bg-muted px-2 py-1 rounded text-sm font-mono'>$1</code>");

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-primary hover:underline' target='_blank' rel='noopener noreferrer'>$1</a>");

    // Images - handle both ![](url) and ![](url "title")
    // Match: ![alt](url) or ![alt](url "title")
    // Also handle URLs that might have query parameters or fragments
    // IMPORTANT: Handle cases where URL might have extra quote marks or attributes
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, urlWithTitle) => {
      // First, try to extract title if present (format: url "title")
      const titleMatch = urlWithTitle.match(/^([^\s"]+)(?:\s+"([^"]*)")?\s*$/);
      let url = urlWithTitle;
      let title = "";
      
      if (titleMatch) {
        url = titleMatch[1].trim();
        title = titleMatch[2] || "";
      } else {
        // If no title match, try to clean up URL by removing any trailing quotes or attributes
        // Remove any trailing quote marks and text after them (like "img-xxx")
        url = urlWithTitle.replace(/\s*"[^"]*"\s*$/, "").trim();
        // Also remove any leading/trailing quote marks
        url = url.replace(/^["']|["']$/g, "");
      }
      
      // Clean up URL - remove any extra whitespace and invalid characters
      url = url.trim();
      
      // Remove any trailing attributes that might have been added incorrectly
      // Pattern: "img-xxxxx" or similar
      url = url.replace(/\s+"[^"]*"$/, "");
      url = url.replace(/\s+img-\d+$/, "");
      
      // If URL is empty or invalid, return original match
      if (!url || url.length === 0) {
        console.warn("Invalid image URL:", urlWithTitle);
        return match;
      }
      
      // Validate URL format (should start with http:// or https://)
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
        console.warn("Invalid image URL format:", url);
        return match;
      }
      
      const imgAlt = alt || "Image";
      const imgTitle = title ? ` title='${title.replace(/'/g, "&#39;")}'` : "";
      
      // Escape URL and alt for HTML (but preserve URL structure)
      const escapedUrl = url.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      const escapedAlt = imgAlt.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      
      return `<img src='${escapedUrl}' alt='${escapedAlt}'${imgTitle} class='rounded-lg my-6 w-full max-w-full h-auto' loading='lazy' />`;
    });

    // Lists
    html = html.replace(/^\* (.*$)/gim, "<li class='ml-4'>$1</li>");
    html = html.replace(/^- (.*$)/gim, "<li class='ml-4'>$1</li>");
    html = html.replace(/(<li[\s\S]*?<\/li>)/g, "<ul class='list-disc ml-6 mb-4'>$1</ul>");

    // Ordered lists
    html = html.replace(/^\d+\. (.*$)/gim, "<li class='ml-4'>$1</li>");
    html = html.replace(/(<li class='ml-4'>[\s\S]*?<\/li>)/g, "<ol class='list-decimal ml-6 mb-4'>$1</ol>");

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, "<blockquote class='border-l-4 border-primary pl-4 italic my-4'>$1</blockquote>");

    // Horizontal rules
    html = html.replace(/^---$/gim, "<hr class='my-8 border-border' />");

    // Paragraphs (handle remaining text)
    html = html.split("\n\n").map((para) => {
      if (!para.trim()) return "";
      if (para.startsWith("<")) return para; // Already formatted
      if (para.includes("JIMAGEBLOCKPLACEHOLDER")) return para; // Preserve image blocks
      return `<p class='mb-4 leading-7'>${para.replace(/\n/g, "<br />")}</p>`;
    }).join("");

    // Restore image blocks
    imageBlocks.forEach((block, index) => {
      // Style the image block properly
      const styledBlock = block
        .replace(/class="image-block"/, 'class="image-block my-8 p-6 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent border border-border/30 rounded-2xl text-center"')
        .replace(/class="image-container"/, 'class="image-container flex justify-center items-center mb-4"')
        .replace(/<img src="([^"]+)" alt="([^"]*)" \/>/g, '<img src="$1" alt="$2" class="max-w-full h-auto max-h-[500px] rounded-xl shadow-2xl object-contain bg-muted/20 p-2" loading="lazy" />')
        .replace(/class="image-caption"/, 'class="image-caption italic text-muted-foreground text-sm mt-3 text-center"');
      
      html = html.replace(`JIMAGEBLOCKPLACEHOLDER${index}`, styledBlock);
    });

    return html;
  };

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}

