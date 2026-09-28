/** Minimal inline markdown: **bold**, *italic*, __underline__. */

export type InlineMark = "bold" | "italic" | "underline";

const MARK_WRAPPERS: Record<InlineMark, [string, string]> = {
  bold: ["**", "**"],
  italic: ["*", "*"],
  underline: ["__", "__"],
};

export function wrapInlineMarkdown(
  value: string,
  start: number,
  end: number,
  mark: InlineMark,
): { value: string; selectionStart: number; selectionEnd: number } {
  const [open, close] = MARK_WRAPPERS[mark];
  const selected = value.slice(start, end);

  if (
    selected.startsWith(open) &&
    selected.endsWith(close) &&
    selected.length >= open.length + close.length
  ) {
    const unwrapped = selected.slice(open.length, selected.length - close.length);
    const next = value.slice(0, start) + unwrapped + value.slice(end);
    return {
      value: next,
      selectionStart: start,
      selectionEnd: start + unwrapped.length,
    };
  }

  const before = value.slice(0, start);
  const after = value.slice(end);
  if (
    before.endsWith(open) &&
    after.startsWith(close) &&
    selected.length > 0
  ) {
    const next =
      before.slice(0, before.length - open.length) + selected + after.slice(close.length);
    const nextStart = start - open.length;
    return {
      value: next,
      selectionStart: nextStart,
      selectionEnd: nextStart + selected.length,
    };
  }

  const wrapped = `${open}${selected || "text"}${close}`;
  const next = value.slice(0, start) + wrapped + value.slice(end);
  const contentStart = start + open.length;
  const contentEnd = contentStart + (selected || "text").length;
  return {
    value: next,
    selectionStart: contentStart,
    selectionEnd: contentEnd,
  };
}

type Token =
  | { kind: "text"; value: string }
  | { kind: "bold" | "italic" | "underline"; children: Token[] };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    if (input.startsWith("**", i)) {
      const close = input.indexOf("**", i + 2);
      if (close !== -1) {
        tokens.push({
          kind: "bold",
          children: tokenize(input.slice(i + 2, close)),
        });
        i = close + 2;
        continue;
      }
    }

    if (input.startsWith("__", i)) {
      const close = input.indexOf("__", i + 2);
      if (close !== -1) {
        tokens.push({
          kind: "underline",
          children: tokenize(input.slice(i + 2, close)),
        });
        i = close + 2;
        continue;
      }
    }

    if (input[i] === "*") {
      const close = input.indexOf("*", i + 1);
      if (close !== -1) {
        tokens.push({
          kind: "italic",
          children: tokenize(input.slice(i + 1, close)),
        });
        i = close + 1;
        continue;
      }
    }

    let end = i + 1;
    while (end < input.length) {
      if (
        input.startsWith("**", end) ||
        input.startsWith("__", end) ||
        input[end] === "*"
      ) {
        break;
      }
      end += 1;
    }
    tokens.push({ kind: "text", value: input.slice(i, end) });
    i = end;
  }

  return tokens;
}

export function parseInlineMarkdown(text: string): Token[] {
  return tokenize(text);
}
