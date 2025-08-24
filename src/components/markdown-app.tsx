import { useState } from 'react'
import { MarkdownEditor } from './markdown-editor'
import { MarkdownPreview } from './markdown-preview'

export function MarkdownApp() {
  const [content, setContent] = useState(`# Welcome to Markdown + Mermaid Editor

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
`)

  return (
    <div className="h-screen flex">
      <div className="flex-1 border-r">
        <MarkdownEditor
          value={content}
          onChange={setContent}
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
  )
}