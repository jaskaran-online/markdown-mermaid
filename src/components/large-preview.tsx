"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import mermaid from "mermaid";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/contexts/theme-context";
import { MermaidDownloadModal } from "@/components/mermaid-download-modal";

interface LargePreviewProps {
  content: string;
  className?: string;
}

export function LargePreview({ content, className }: LargePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [downloadModalState, setDownloadModalState] = useState<{
    isOpen: boolean;
    mermaidCode: string;
    diagramTitle: string;
  }>({
    isOpen: false,
    mermaidCode: "",
    diagramTitle: "",
  });

  // Zoom state for Mermaid diagrams
  const [zoomLevels, setZoomLevels] = useState<{ [key: string]: number }>({});

  // Initialize and update Mermaid theme
  useEffect(() => {
    try {
      const mermaidTheme = theme === "dark" ? "dark" : "default";
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: "loose",
        fontFamily: "monospace",
        fontSize: 16, // Larger font for modal
        logLevel: 1,
        htmlLabels: true,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
        },
        sequence: {
          useMaxWidth: true,
        },
        er: {
          useMaxWidth: true,
        },
      });
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
  }, [theme]);

  const processedContent = useMemo(() => {
    try {
      // Clean up common mermaid formatting issues
      const cleanedContent = content
        .replace(/````mermaid/g, "```mermaid")
        .replace(/```mermaid\n\n/g, "```mermaid\n")
        .replace(/\n\n```/g, "\n```");

      // Extract code blocks and mermaid blocks
      const codeBlocks: {
        id: string;
        language: string;
        code: string;
        isMermaid: boolean;
      }[] = [];
      let blockCounter = 0;

      // Handle Mermaid blocks
      let processedContent = cleanedContent.replace(
        /```mermaid\s*\n([\s\S]*?)\n```/g,
        (match, diagramCode) => {
          const blockId = `large-block-${blockCounter++}`;
          const cleanCode = diagramCode.trim();

          if (cleanCode && !cleanCode.includes("```")) {
            const hasValidSyntax =
              cleanCode.includes("flowchart") ||
              cleanCode.includes("graph") ||
              cleanCode.includes("sequenceDiagram") ||
              cleanCode.includes("classDiagram") ||
              cleanCode.includes("erDiagram") ||
              cleanCode.includes("gantt") ||
              cleanCode.includes("pie") ||
              cleanCode.includes("journey") ||
              cleanCode.includes("gitgraph") ||
              cleanCode.includes("stateDiagram") ||
              cleanCode.includes("C4Context") ||
              cleanCode.includes("mindmap");

            const hasHtmlArtifacts =
              cleanCode.includes("<div") ||
              cleanCode.includes("</div>") ||
              cleanCode.includes("<span") ||
              cleanCode.includes("</span>") ||
              cleanCode.includes("class=") ||
              cleanCode.includes("data-block-id=");

            if (hasValidSyntax && !hasHtmlArtifacts) {
              codeBlocks.push({
                id: blockId,
                language: "mermaid",
                code: cleanCode,
                isMermaid: true,
              });
              return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
            } else {
              codeBlocks.push({
                id: blockId,
                language: "text",
                code: match,
                isMermaid: false,
              });
              return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
            }
          } else {
            codeBlocks.push({
              id: blockId,
              language: "text",
              code: match,
              isMermaid: false,
            });
            return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
          }
        }
      );

      // Handle regular code blocks
      processedContent = processedContent.replace(
        /```(?!mermaid)(\w+)?\s*\n([\s\S]*?)\n```/g,
        (_, language, code) => {
          const blockId = `large-block-${blockCounter++}`;
          codeBlocks.push({
            id: blockId,
            language: language || "text",
            code: code.trim(),
            isMermaid: false,
          });
          return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
        }
      );

      // Process markdown to HTML
      const processed = remark()
        .use(remarkGfm)
        .use(remarkHtml, { sanitize: false })
        .processSync(processedContent);

      return {
        html: processed.toString(),
        codeBlocks,
      };
    } catch (error) {
      console.error("Error processing markdown:", error);
      return {
        html: "<p>Error rendering markdown</p>",
        codeBlocks: [],
      };
    }
  }, [content]);

  // Render code blocks
  useEffect(() => {
    if (previewRef.current && processedContent.codeBlocks.length > 0) {
      processedContent.codeBlocks.forEach((block) => {
        const placeholder = previewRef.current?.querySelector(
          `[data-block-id="${block.id}"]`
        );
        if (placeholder && !block.isMermaid) {
          const root = document.createElement("div");
          placeholder.parentNode?.replaceChild(root, placeholder);

          import("react-dom/client").then(({ createRoot }) => {
            createRoot(root).render(
              <SyntaxHighlighter
                language={block.language}
                style={theme === "dark" ? oneDark : oneLight}
                customStyle={{
                  margin: "1.5rem 0",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                }}
              >
                {block.code}
              </SyntaxHighlighter>
            );
          });
        }
      });
    }
  }, [processedContent, theme, previewRef]);

  // Render Mermaid diagrams
  useEffect(() => {
    if (previewRef.current && processedContent.codeBlocks.length > 0) {
      const renderDiagrams = async () => {
        const existingMermaidElements =
          previewRef.current?.querySelectorAll(".mermaid");
        existingMermaidElements?.forEach((el) => el.remove());

        for (const block of processedContent.codeBlocks) {
          if (block.isMermaid) {
            const placeholder = previewRef.current?.querySelector(
              `[data-block-id="${block.id}"]`
            );
            if (placeholder) {
              try {
                placeholder.innerHTML = "";

                const diagramId = `large-mermaid-${block.id}-${Date.now()}`;

                let processedCode = block.code;
                processedCode = processedCode
                  .replace(/\r\n/g, "\n")
                  .replace(/\r/g, "\n");
                processedCode = processedCode
                  .replace(/<div[^>]*>/g, "")
                  .replace(/<\/div>/g, "");
                processedCode = processedCode
                  .replace(/<span[^>]*>/g, "")
                  .replace(/<\/span>/g, "");

                const { svg } = await mermaid.render(diagramId, processedCode);

                // Create container for diagram and download button
                const container = document.createElement("div");
                container.className = "relative group mermaid-container";
                container.style.position = "relative";
                container.style.overflow = "hidden";
                container.style.borderRadius = "8px";
                container.style.border = "1px solid hsl(var(--border))";

                // Add the SVG
                const svgContainer = document.createElement("div");
                svgContainer.innerHTML = svg;
                svgContainer.style.position = "relative";
                svgContainer.style.overflow = "auto";
                svgContainer.style.maxHeight = "800px";
                container.appendChild(svgContainer);

                // Create zoom controls container
                const zoomControls = document.createElement("div");
                zoomControls.className = "absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1 flex gap-1";
                zoomControls.style.zIndex = "10";

                // Zoom in button
                const zoomInButton = document.createElement("button");
                zoomInButton.className = "p-1 hover:bg-muted rounded transition-colors";
                zoomInButton.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                    <path d="M11 8v6"/>
                    <path d="M8 11h6"/>
                  </svg>
                `;
                zoomInButton.title = "Zoom In";

                // Zoom out button
                const zoomOutButton = document.createElement("button");
                zoomOutButton.className = "p-1 hover:bg-muted rounded transition-colors";
                zoomOutButton.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                    <path d="M8 11h6"/>
                  </svg>
                `;
                zoomOutButton.title = "Zoom Out";

                // Reset zoom button
                const resetZoomButton = document.createElement("button");
                resetZoomButton.className = "p-1 hover:bg-muted rounded transition-colors";
                resetZoomButton.innerHTML = `
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                `;
                resetZoomButton.title = "Reset Zoom";

                // Add zoom functionality
                const zoomId = `large-mermaid-${block.id}`;
                const currentZoom = zoomLevels[zoomId] || 1;

                const updateZoom = (newZoom: number) => {
                  const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
                  setZoomLevels(prev => ({ ...prev, [zoomId]: clampedZoom }));
                  
                  // Apply zoom transform to SVG container
                  svgContainer.style.transform = `scale(${clampedZoom})`;
                  svgContainer.style.transformOrigin = "top left";
                  svgContainer.style.transition = "transform 0.2s ease-in-out";
                };

                zoomInButton.onclick = () => updateZoom(currentZoom + 0.25);
                zoomOutButton.onclick = () => updateZoom(currentZoom - 0.25);
                resetZoomButton.onclick = () => updateZoom(1);

                // Apply current zoom level
                updateZoom(currentZoom);

                // Add buttons to zoom controls
                zoomControls.appendChild(zoomInButton);
                zoomControls.appendChild(zoomOutButton);
                zoomControls.appendChild(resetZoomButton);

                // Add download button overlay
                const downloadButton = document.createElement("button");
                downloadButton.className =
                  "absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90";
                downloadButton.innerHTML = `
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                `;
                downloadButton.title = "Download diagram";

                // Add click handler for download
                downloadButton.addEventListener("click", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDownloadModalState({
                    isOpen: true,
                    mermaidCode: block.code,
                    diagramTitle: `Diagram ${block.id}`,
                  });
                });

                container.appendChild(zoomControls);
                container.appendChild(downloadButton);
                placeholder.appendChild(container);
              } catch (error) {
                console.error("Error rendering mermaid diagram:", error);
                placeholder.innerHTML = `
                  <div class="text-red-500 p-4 border border-red-300 rounded bg-red-50 dark:bg-red-900/20 mb-4">
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
                            error instanceof Error
                              ? error.message
                              : "Unknown error"
                          }</pre>
                        </details>
                      </div>
                    </div>
                  </div>
                `;
              }
            }
          }
        }
      };

      renderDiagrams();
    }
  }, [processedContent, previewRef, theme]);

  return (
    <div className={`w-full h-full ${className}`}>
      <div
        ref={previewRef}
        className="markdown-content prose prose-lg max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: processedContent.html }}
      />

      {/* Mermaid Download Modal */}
      <MermaidDownloadModal
        isOpen={downloadModalState.isOpen}
        onClose={() => setDownloadModalState({ ...downloadModalState, isOpen: false })}
        mermaidCode={downloadModalState.mermaidCode}
        diagramTitle={downloadModalState.diagramTitle}
      />
    </div>
  );
}
