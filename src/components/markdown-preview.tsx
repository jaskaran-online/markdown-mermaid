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
import { Maximize2, Download } from "lucide-react";

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
      // Add a small delay to ensure theme change is applied
      const renderDiagrams = async () => {
        // Clear any existing mermaid diagrams first
        const existingMermaidElements =
          actualRef.current?.querySelectorAll(".mermaid");
        existingMermaidElements?.forEach((el) => el.remove());

                for (const block of processedContent.codeBlocks) {
          if (block.isMermaid) {
            const placeholder = actualRef.current?.querySelector(
              `[data-block-id="${block.id}"]`
            );
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
                
                console.log("Rendering mermaid diagram:", diagramId);
                console.log("Original mermaid code:", block.code);
                console.log("Processed mermaid code:", processedCode);
                
                const { svg } = await mermaid.render(diagramId, processedCode);
                
                // Create container for diagram and download button
                const container = document.createElement("div");
                container.className = "relative group";
                
                // Add the SVG
                const svgContainer = document.createElement("div");
                svgContainer.innerHTML = svg;
                container.appendChild(svgContainer);
                
                // Add download button overlay
                const downloadButton = document.createElement("button");
                downloadButton.className = "absolute top-2 right-2 bg-background/80 backdrop-blur-sm border border-border rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90";
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
        }
      };

      // Call the async function
      renderDiagrams();
    }
  }, [processedContent, actualRef, theme]);

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
        onClose={() => setDownloadModalState({ ...downloadModalState, isOpen: false })}
        mermaidCode={downloadModalState.mermaidCode}
        diagramTitle={downloadModalState.diagramTitle}
      />
    </div>
  );
}
