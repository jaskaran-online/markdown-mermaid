import { useRef } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor

    // Configure Monaco for Markdown
    monaco.languages.setMonarchTokensProvider('markdown', {
      tokenizer: {
        root: [
          // Headers
          [/^#{1,6}\s/, 'keyword'],
          // Bold
          [/\*\*[^*]+\*\*/, 'string'],
          // Italic
          [/\*[^*]+\*/, 'string'],
          // Code blocks
          [/```[\s\S]*?```/, 'comment'],
          // Inline code
          [/`[^`]+`/, 'comment'],
          // Links
          [/\[.*?\]\(.*?\)/, 'string'],
          // Lists
          [/^\s*[-*+]\s/, 'keyword'],
          [/^\s*\d+\.\s/, 'keyword'],
        ]
      }
    })

    // Set theme
    monaco.editor.setTheme('vs-dark')
  }

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '')
  }

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
          height="100%"
          language="markdown"
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
          }}
        />
      </div>
    </div>
  )
}