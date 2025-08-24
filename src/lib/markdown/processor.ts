import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import type { CodeBlock, ProcessedMarkdown } from "./types";

/**
 * Process Markdown into HTML and extract fenced code blocks (incl. mermaid)
 * Replaces code blocks with placeholder divs for later client rendering.
 */
export function processMarkdown(content: string): ProcessedMarkdown {
  try {
    const cleanedContent = content
      .replace(/````mermaid/g, "```mermaid")
      .replace(/```mermaid\n\n/g, "```mermaid\n")
      .replace(/\n\n```/g, "\n```");

    const codeBlocks: CodeBlock[] = [];
    let blockCounter = 0;

    // Mermaid blocks first
    let processedContent = cleanedContent.replace(
      /```mermaid\s*\n([\s\S]*?)\n```/g,
      (match, diagramCode) => {
        const blockId = `block-${blockCounter++}`;
        const cleanCode = String(diagramCode).trim();

        if (cleanCode && !cleanCode.includes("```") && hasMermaidSignal(cleanCode) && !hasHtmlArtifacts(cleanCode)) {
          codeBlocks.push({ id: blockId, language: "mermaid", code: cleanCode, isMermaid: true });
          return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
        }

        codeBlocks.push({ id: blockId, language: "text", code: match, isMermaid: false });
        return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
      }
    );

    // Regular fenced blocks (exclude mermaid)
    processedContent = processedContent.replace(
      /```(?!mermaid)(\w+)?\s*\n([\s\S]*?)\n```/g,
      (_, language, code) => {
        const blockId = `block-${blockCounter++}`;
        codeBlocks.push({ id: blockId, language: language || "text", code: String(code).trim(), isMermaid: false });
        return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
      }
    );

    const processed = remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).processSync(processedContent);

    return { html: processed.toString(), codeBlocks };
  } catch (error) {
    console.error("Error processing markdown:", error);
    return { html: "<p>Error rendering markdown</p>", codeBlocks: [] };
  }
}

function hasMermaidSignal(code: string): boolean {
  return (
    code.includes("flowchart") ||
    code.includes("graph") ||
    code.includes("sequenceDiagram") ||
    code.includes("classDiagram") ||
    code.includes("erDiagram") ||
    code.includes("gantt") ||
    code.includes("pie") ||
    code.includes("journey") ||
    code.includes("gitgraph") ||
    code.includes("stateDiagram") ||
    code.includes("C4Context") ||
    code.includes("mindmap")
  );
}

function hasHtmlArtifacts(code: string): boolean {
  return /<\/?(div|span)[^>]*>/i.test(code) || /class=|data-block-id=/i.test(code);
}

