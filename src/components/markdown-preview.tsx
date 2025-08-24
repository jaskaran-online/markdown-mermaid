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
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { Modal } from "@/components/ui/modal";
import { LargePreview } from "@/components/large-preview";
import { MermaidDownloadModal } from "@/components/mermaid-download-modal";
import { Maximize2, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export function MarkdownPreview({
  content,
  className,
  previewRef,
}: MarkdownPreviewProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const actualRef = previewRef || internalRef;
  const { theme } = useTheme();
  const [isLargePreviewOpen, setIsLargePreviewOpen] = useState(false);
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
        fontSize: 14,
        logLevel: 1, // Only show errors
        htmlLabels: true, // Enable HTML labels for <br/> tags
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
      console.log("Mermaid initialized with theme:", mermaidTheme);
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
  }, [theme]);

  const processedContent = useMemo(() => {
    try {
      console.log("Processing content:", content);

      // Clean up common mermaid formatting issues
      const cleanedContent = content
        .replace(/````mermaid/g, "```mermaid") // Fix 4 backticks
        .replace(/```mermaid\n\n/g, "```mermaid\n") // Remove extra newlines
        .replace(/\n\n```/g, "\n```"); // Remove extra newlines before closing

      // Extract code blocks and mermaid blocks
      const codeBlocks: {
        id: string;
        language: string;
        code: string;
        isMermaid: boolean;
      }[] = [];
      let blockCounter = 0;

      // First, handle Mermaid blocks specifically - more robust regex
      let processedContent = cleanedContent.replace(
        /```mermaid\s*\n([\s\S]*?)\n```/g,
        (match, diagramCode) => {
          const blockId = `block-${blockCounter++}`;
          const cleanCode = diagramCode.trim();
          console.log("Found Mermaid block:", cleanCode);

          // Validate mermaid code before adding
          if (cleanCode && !cleanCode.includes("```")) {
            // Additional validation for complex mermaid diagrams
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

            // Check for HTML artifacts that might cause parsing issues
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
              // If it doesn't have valid mermaid syntax or has HTML artifacts, treat as text
              codeBlocks.push({
                id: blockId,
                language: "text",
                code: match,
                isMermaid: false,
              });
              return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
            }
          } else {
            // If malformed, treat as regular code block
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

      // Then handle regular code blocks (excluding mermaid)
      processedContent = processedContent.replace(
        /```(?!mermaid)(\w+)?\s*\n([\s\S]*?)\n```/g,
        (_, language, code) => {
          const blockId = `block-${blockCounter++}`;
          codeBlocks.push({
            id: blockId,
            language: language || "text",
            code: code.trim(),
            isMermaid: false,
          });
          return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`;
        }
      );

      console.log("Code blocks found:", codeBlocks);

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

  // Render code blocks after HTML is inserted
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      processedContent.codeBlocks.forEach((block) => {
        const placeholder = actualRef.current?.querySelector(
          `[data-block-id="${block.id}"]`
        );
        if (placeholder && !block.isMermaid) {
          const root = document.createElement("div");
          placeholder.parentNode?.replaceChild(root, placeholder);

          // Use React to render the syntax highlighter
          import("react-dom/client").then(({ createRoot }) => {
            createRoot(root).render(
              <SyntaxHighlighter
                language={block.language}
                style={theme === "dark" ? oneDark : oneLight}
                customStyle={{
                  margin: "1rem 0",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                {block.code}
              </SyntaxHighlighter>
            );
          });
        }
      });
    }
  }, [processedContent, theme, actualRef]);

  // Render Mermaid diagrams after content is updated
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      const renderDiagrams = async () => {
        // Only clear mermaid diagrams if content has actually changed
        const mermaidBlocks = processedContent.codeBlocks.filter(
          (block) => block.isMermaid
        );

        for (const block of mermaidBlocks) {
          const placeholder = actualRef.current?.querySelector(
            `[data-block-id="${block.id}"]`
          );

          // Skip if already rendered and content hasn't changed
          if (!placeholder) continue;

          if (placeholder) {
            try {
              // Clear the placeholder first
              placeholder.innerHTML = "";

              // Create a unique ID for this diagram
              const diagramId = `mermaid-${block.id}-${Date.now()}`;

              // Preprocess the mermaid code to handle HTML tags better
              let processedCode = block.code;

              // Ensure proper line endings
              processedCode = processedCode
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n");

              // Remove any potential HTML artifacts that might have been introduced
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
              svgContainer.className = "svg-container";
              svgContainer.innerHTML = svg;
              svgContainer.style.position = "relative";
              svgContainer.style.overflow = "auto";
              svgContainer.style.maxHeight = "600px";
              container.appendChild(svgContainer);

              // Create zoom controls container
              const zoomControls = document.createElement("div");
              zoomControls.className =
                "absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1 flex gap-1";
              zoomControls.style.zIndex = "10";

              // Zoom in button
              const zoomInButton = document.createElement("button");
              zoomInButton.className =
                "p-1 hover:bg-muted rounded transition-colors";
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
              zoomOutButton.className =
                "p-1 hover:bg-muted rounded transition-colors";
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
              resetZoomButton.className =
                "p-1 hover:bg-muted rounded transition-colors";
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
              const zoomId = `mermaid-${block.id}`;
              const currentZoom = zoomLevels[zoomId] || 1;

              const updateZoom = (newZoom: number) => {
                const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
                setZoomLevels((prev) => ({
                  ...prev,
                  [zoomId]: clampedZoom,
                }));

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
      };

      // Call the async function
      renderDiagrams();
    }
  }, [processedContent, actualRef]);

  // Handle theme changes for existing Mermaid diagrams
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      const mermaidContainers =
        actualRef.current.querySelectorAll(".mermaid-container");
      if (mermaidContainers.length > 0) {
        // Add a small delay to ensure diagrams are rendered first
        const timeoutId = setTimeout(() => {
          // Re-render only Mermaid diagrams when theme changes
          const renderDiagrams = async () => {
            for (const container of mermaidContainers) {
              const placeholder = container.closest("[data-block-id]");
              if (placeholder) {
                const blockId = placeholder.getAttribute("data-block-id");
                const block = processedContent.codeBlocks.find(
                  (b) => b.id === blockId
                );

                if (block && block.isMermaid) {
                  try {
                    // Find the SVG container and preserve zoom state
                    const svgContainer = container.querySelector(".svg-container") as HTMLElement;
                    if (svgContainer) {
                      // Get current zoom level
                      const zoomId = `mermaid-${blockId}`;
                      const currentZoom = zoomLevels[zoomId] || 1;
                      
                      const diagramId = `mermaid-${blockId}-${Date.now()}`;
                      const processedCode = block.code
                        .replace(/\r\n/g, "\n")
                        .replace(/\r/g, "\n")
                        .replace(/<div[^>]*>/g, "")
                        .replace(/<\/div>/g, "")
                        .replace(/<span[^>]*>/g, "")
                        .replace(/<\/span>/g, "");

                      const { svg } = await mermaid.render(
                        diagramId,
                        processedCode
                      );
                      
                      // Update SVG content while preserving zoom
                      svgContainer.innerHTML = svg;
                      
                      // Re-apply zoom transform
                      svgContainer.style.transform = `scale(${currentZoom})`;
                      svgContainer.style.transformOrigin = "top left";
                      svgContainer.style.transition = "transform 0.2s ease-in-out";
                    }
                  } catch (error) {
                    console.error("Error updating mermaid diagram theme:", error);
                  }
                }
              }
            }
          };

          renderDiagrams();
        }, 100); // Small delay to ensure diagrams are rendered

        return () => clearTimeout(timeoutId);
      }
    }
  }, [theme, actualRef, zoomLevels, processedContent.codeBlocks]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLargePreviewOpen(true)}
            className="flex items-center gap-1"
          >
            <Maximize2 className="h-3 w-3" />
            Full Screen
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div
          ref={actualRef}
          className="markdown-content prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: processedContent.html }}
        />
      </div>

      {/* Large Preview Modal */}
      <Modal
        isOpen={isLargePreviewOpen}
        onClose={() => setIsLargePreviewOpen(false)}
        title="Document Preview"
        size="full"
      >
        <LargePreview content={content} />
      </Modal>

      {/* Mermaid Download Modal */}
      <MermaidDownloadModal
        isOpen={downloadModalState.isOpen}
        onClose={() =>
          setDownloadModalState({ ...downloadModalState, isOpen: false })
        }
        mermaidCode={downloadModalState.mermaidCode}
        diagramTitle={downloadModalState.diagramTitle}
      />
    </div>
  );
}
