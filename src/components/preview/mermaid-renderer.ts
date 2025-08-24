"use client";

import mermaid from "mermaid";
import type { CodeBlock } from "@/lib/markdown/types";
import { attachMermaidZoom } from "@/lib/mermaid-zoom";

let renderSeq = 0;
function nextToken() {
  renderSeq += 1;
  return String(renderSeq);
}

function preprocess(code: string) {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<div[^>]*>/g, "")
    .replace(/<\/div>/g, "")
    .replace(/<span[^>]*>/g, "")
    .replace(/<\/span>/g, "");
}

export async function renderMermaidBlocks(
  container: HTMLElement,
  blocks: CodeBlock[],
  openDownload: (code: string, title: string) => void,
  token?: string
) {
  const mermaidBlocks = blocks.filter((b) => b.isMermaid);
  for (const block of mermaidBlocks) {
    const placeholder = container.querySelector(`[data-block-id="${block.id}"]`);
    if (!placeholder) continue;
    if (placeholder.querySelector(".mermaid-container")) continue; // already rendered

    try {
      placeholder.innerHTML = "";
      const renderToken = token ?? nextToken();
      (placeholder as HTMLElement).dataset.renderToken = renderToken;
      const diagramId = `mermaid-${block.id}-${Date.now()}`;
      const processedCode = preprocess(block.code);

      const { svg } = await mermaid.render(diagramId, processedCode);

      // Skip if a newer render has been scheduled for this placeholder
      if ((placeholder as HTMLElement).dataset.renderToken !== renderToken) {
        continue;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "relative group mermaid-container";

      const svgContainer = document.createElement("div");
      svgContainer.innerHTML = svg;
      wrapper.appendChild(svgContainer);

      // Apply persisted zoom from placeholder and attach zoom handlers
      attachMermaidZoom(placeholder as HTMLElement, wrapper, svgContainer);

      const downloadButton = document.createElement("button");
      downloadButton.className =
        "absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90";
      downloadButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>`;
      downloadButton.title = "Download diagram";
      downloadButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDownload(block.code, `Diagram ${block.id}`);
      });

      wrapper.appendChild(downloadButton);
      placeholder.appendChild(wrapper);
    } catch (error) {
      placeholder.innerHTML = `
        <div class="text-red-500 p-3 border border-red-300 rounded bg-red-50 dark:bg-red-900/20 mb-4">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <strong class="block mb-1">Mermaid Diagram Error</strong>
              <p class="text-sm mb-2">Could not render diagram. Please check the syntax.</p>
              <details class="text-xs">
                <summary class="cursor-pointer hover:text-red-700 dark:hover:text-red-300">Show diagram code</summary>
                <pre class="mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto text-xs">${
                  block.code
                }</pre>
              </details>
              <details class="text-xs mt-2">
                <summary class="cursor-pointer hover:text-red-700 dark:hover:text-red-300">Show full error</summary>
                <pre class="mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto text-xs">${
                  (error as Error)?.message || "Unknown error"
                }</pre>
              </details>
            </div>
          </div>
        </div>`;
    }
  }
}

export async function rerenderMermaidForTheme(
  container: HTMLElement,
  blocks: CodeBlock[]
) {
  const mermaidContainers = container.querySelectorAll(".mermaid-container");
  if (mermaidContainers.length === 0) return;

  for (const containerEl of Array.from(mermaidContainers)) {
    const placeholder = containerEl.closest("[data-block-id]") as HTMLElement | null;
    if (!placeholder) continue;
    const blockId = placeholder.getAttribute("data-block-id");
    const block = blocks.find((b) => b.id === blockId);
    if (!block || !block.isMermaid) continue;

    try {
      const svgContainer = containerEl.querySelector("div");
      if (!svgContainer) continue;
      const diagramId = `mermaid-${blockId}-${Date.now()}`;
      const processedCode = preprocess(block.code);
      const { svg } = await mermaid.render(diagramId, processedCode);
      svgContainer.innerHTML = svg;
    } catch (error) {
      // Silent fail; initial render already surfaced errors
      console.error("Error updating Mermaid for theme:", error);
    }
  }
}

export async function refreshMermaidBlocks(
  container: HTMLElement,
  blocks: CodeBlock[],
  openDownload: (code: string, title: string) => void
) {
  // Remove existing rendered mermaid containers to force re-render
  container.querySelectorAll(".mermaid-container").forEach((el) => el.remove());
  // Mark placeholders with a new token to cancel in-flight renders
  const token = nextToken();
  const placeholders = container.querySelectorAll('[data-block-id]');
  placeholders.forEach((ph) => {
    (ph as HTMLElement).dataset.renderToken = token;
  });
  await renderMermaidBlocks(container, blocks, openDownload, token);
}
