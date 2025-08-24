import { useState, useEffect, useCallback } from 'react'
import { MarkdownEditor } from './markdown-editor'
import { MarkdownPreview } from './markdown-preview'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { Button } from '@/components/ui/button'

const DEFAULT_CONTENT = `# Welcome to Markdown + Mermaid Editor

This is a **live preview** editor with *Mermaid diagram* support.

## Features

- Two-pane layout (editor + preview)
- Live preview updates
- Markdown syntax highlighting
- Export capabilities

## Example Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B[Edit Markdown]
    B --> C[See Preview]
    C --> D[Export Document]
\`\`\`

## More Content

You can type here and see the preview update in real-time!

- Item 1
- Item 2
- Item 3

> This is a blockquote
>
> With multiple lines

\`\`\`javascript
console.log('Hello, World!');
\`\`\`
`

export function MarkdownApp() {
  const {
    currentDocument,
    isLoading,
    createDocument,
    updateDocument,
    autosaveDocument,
  } = useLocalStorage()

  const [content, setContent] = useState(DEFAULT_CONTENT)

  // Load current document on mount
  useEffect(() => {
    if (!isLoading && currentDocument) {
      setContent(currentDocument.content)
    } else if (!isLoading && !currentDocument) {
      // Create a new document if none exists
      const newDoc = createDocument('Untitled', DEFAULT_CONTENT)
      setContent(newDoc.content)
    }
  }, [isLoading, currentDocument, createDocument])

  // Autosave with debouncing
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)

    // Debounced autosave
    const timeoutId = setTimeout(() => {
      autosaveDocument(newContent)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [autosaveDocument])

  const handleNewDocument = () => {
    const newDoc = createDocument('Untitled', DEFAULT_CONTENT)
    setContent(newDoc.content)
  }

  const handleSave = () => {
    if (currentDocument) {
      updateDocument(currentDocument.id, { content })
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Markdown + Mermaid Editor</h1>
          {currentDocument && (
            <span className="text-sm text-muted-foreground">
              {currentDocument.title}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNewDocument}>
            New
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        <div className="flex-1 border-r">
          <MarkdownEditor
            value={content}
            onChange={handleContentChange}
            className="h-full"
          />
        </div>
        <div className="flex-1">
          <MarkdownPreview
            content={content}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}