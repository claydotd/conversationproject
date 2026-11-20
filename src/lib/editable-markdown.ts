import {
  parseInlineMarkdown,
  type InlineToken,
} from "@shared/inline-markdown";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function tokensToHtml(tokens: InlineToken[]): string {
  return tokens
    .map((token) => {
      if (token.kind === "text") return escapeHtml(token.value);
      const children = tokensToHtml(token.children);
      if (token.kind === "bold") return `<strong>${children}</strong>`;
      if (token.kind === "italic") return `<em>${children}</em>`;
      if (token.kind === "underline") return `<u>${children}</u>`;
      if (token.kind === "link") {
        return `<a href="${escapeAttr(token.href)}">${children}</a>`;
      }
      return children;
    })
    .join("");
}

/** Convert stored markdown body into HTML for a contentEditable preview. */
export function markdownToEditableHtml(text: string): string {
  if (!text.trim()) return "<p><br></p>";
  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const html = paragraph
        .split("\n")
        .map((line) => tokensToHtml(parseInlineMarkdown(line)))
        .join("<br>");
      return `<p>${html || "<br>"}</p>`;
    })
    .join("");
}

function isBlockElement(node: Node): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  return /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|SECTION|ARTICLE)$/i.test(node.tagName);
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (!(node instanceof HTMLElement)) return "";

  const tag = node.tagName.toLowerCase();
  if (tag === "br") return "\n";

  const children = Array.from(node.childNodes).map(serializeInline).join("");

  if (tag === "strong" || tag === "b") return children ? `**${children}**` : "";
  if (tag === "em" || tag === "i") return children ? `*${children}*` : "";
  if (tag === "u") return children ? `__${children}__` : "";
  if (tag === "a") {
    const href = node.getAttribute("href")?.trim() ?? "";
    if (!children) return "";
    if (/^https?:\/\//i.test(href)) return `[${children}](${href})`;
    return children;
  }

  return children;
}

function serializeBlock(element: HTMLElement): string {
  const parts: string[] = [];
  let line = "";

  const flushLine = () => {
    parts.push(line);
    line = "";
  };

  for (const child of Array.from(element.childNodes)) {
    if (child instanceof HTMLElement && child.tagName.toLowerCase() === "br") {
      flushLine();
      continue;
    }
    if (isBlockElement(child)) {
      flushLine();
      const nested = serializeBlock(child);
      if (nested) parts.push(nested);
      continue;
    }
    line += serializeInline(child);
  }
  flushLine();

  return parts
    .map((part) => part.replace(/[ \t]+\n/g, "\n").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Convert contentEditable HTML back to the site's inline markdown format. */
export function editableHtmlToMarkdown(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html.trim() || "<p><br></p>";
  const root = document.createElement("div");
  root.append(...Array.from(template.content.childNodes));

  const blocks: string[] = [];
  let inlineBuffer = "";

  const flushInline = () => {
    const text = inlineBuffer.replace(/\n{3,}/g, "\n\n").trim();
    if (text) blocks.push(text);
    inlineBuffer = "";
  };

  for (const child of Array.from(root.childNodes)) {
    if (isBlockElement(child)) {
      flushInline();
      const block = serializeBlock(child);
      if (block) blocks.push(block);
      continue;
    }
    if (child instanceof HTMLElement && child.tagName.toLowerCase() === "br") {
      inlineBuffer += "\n";
      continue;
    }
    inlineBuffer += serializeInline(child);
  }
  flushInline();

  return blocks.join("\n\n").trim();
}
