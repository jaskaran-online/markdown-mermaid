"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { Modal } from "@/components/ui/modal";
import { LargePreview } from "@/components/large-preview";
import { MermaidDownloadModal } from "@/components/mermaid-download-modal";
import { processMarkdown } from "@/lib/markdown/processor";
import { initMermaid } from "@/lib/mermaid-theme";
import { PreviewHeader } from "@/components/preview/PreviewHeader";
import { renderCodeBlocks } from "@/components/preview/code-block-renderer";
import { renderMermaidBlocks, rerenderMermaidForTheme } from "@/components/preview/mermaid-renderer";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export function MarkdownPreview({ content, className, previewRef }: MarkdownPreviewProps) {
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
      initMermaid(theme === "dark" ? "dark" : "light");
    } catch (error) {
      console.error("Error initializing mermaid:", error);
    }
  }, [theme]);

  const processedContent = useMemo(() => processMarkdown(content), [content]);

  // Render code blocks after HTML is inserted
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      renderCodeBlocks(
        actualRef.current,
        processedContent.codeBlocks,
        theme === "dark" ? "dark" : "light"
      );
    }
  }, [processedContent, theme, actualRef]);

  // Render Mermaid diagrams after content is updated
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      renderMermaidBlocks(
        actualRef.current,
        processedContent.codeBlocks,
        (code, title) => setDownloadModalState({ isOpen: true, mermaidCode: code, diagramTitle: title })
      );
    }
  }, [processedContent, actualRef]);

  // Handle theme changes for existing Mermaid diagrams
  useEffect(() => {
    if (actualRef.current) {
      rerenderMermaidForTheme(actualRef.current, processedContent.codeBlocks);
    }
  }, [theme, actualRef, processedContent.codeBlocks]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <PreviewHeader onFullScreen={() => setIsLargePreviewOpen(true)} onExport={() => {}} />
      <div className="flex-1 p-4 overflow-auto">
        <div
          ref={actualRef}
          className="markdown-content prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: processedContent.html }}
        />
      </div>

      {/* Large Preview Modal */}
      <Modal isOpen={isLargePreviewOpen} onClose={() => setIsLargePreviewOpen(false)} title="Document Preview" size="full">
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

