"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CodeBlock } from "@/lib/markdown/types";

export async function renderCodeBlocks(
  container: HTMLElement,
  blocks: CodeBlock[],
  theme: "light" | "dark"
) {
  const nonMermaid = blocks.filter((b) => !b.isMermaid);
  if (nonMermaid.length === 0) return;

  for (const block of nonMermaid) {
    const placeholder = container.querySelector(`[data-block-id="${block.id}"]`);
    if (!placeholder) continue;

    const root = document.createElement("div");
    placeholder.parentNode?.replaceChild(root, placeholder);

    const { createRoot } = await import("react-dom/client");
    createRoot(root).render(
      <SyntaxHighlighter
        language={block.language}
        style={theme === "dark" ? oneDark : oneLight}
        customStyle={{ margin: "1rem 0", borderRadius: "0.5rem", fontSize: "0.875rem" }}
      >
        {block.code}
      </SyntaxHighlighter>
    );
  }
}

