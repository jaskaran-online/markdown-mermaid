"use client";

import { useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { Button } from "@/components/ui/button";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
}: MarkdownEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = (
    editor: MonacoEditor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    console.log("Monaco Editor mounted successfully");

    // Configure Monaco for Markdown
    try {
      monaco.languages.setMonarchTokensProvider("markdown", {
        tokenizer: {
          root: [
            // Headers
            [/^#{1,6}\s/, "keyword"],
            // Bold
            [/\*\*[^*]+\*\*/, "string"],
            // Italic
            [/\*[^*]+\*/, "string"],
            // Code blocks
            [/```[\s\S]*?```/, "comment"],
            // Inline code
            [/`[^`]+`/, "comment"],
            // Links
            [/\[.*?\]\(.*?\)/, "string"],
            // Lists
            [/^\s*[-*+]\s/, "keyword"],
            [/^\s*\d+\.\s/, "keyword"],
          ],
        },
      });
      console.log("Markdown syntax highlighting configured");
    } catch (error) {
      console.error("Error configuring Markdown syntax:", error);
    }

    // Set theme based on current theme
    const isDark = document.documentElement.classList.contains("dark");
    monaco.editor.setTheme(isDark ? "vs-dark" : "vs");
    console.log("Editor theme set to:", isDark ? "vs-dark" : "vs");

    // Preserve cursor position and selection
    editor.onDidChangeCursorPosition(() => {
      // This helps maintain cursor position during updates
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-sm font-medium">Editor</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            New
          </Button>
          <Button variant="outline" size="sm">
            Save
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          key="markdown-editor"
          height="100%"
          language="markdown"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
          }}
        />
      </div>
    </div>
  );
}
