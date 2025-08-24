import { useMemo, useEffect, useRef } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import mermaid from 'mermaid'
import { Button } from '@/components/ui/button'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })
  }, [])

  const renderedContent = useMemo(() => {
    try {
      const processed = remark()
        .use(remarkGfm)
        .use(remarkHtml, { sanitize: false })
        .processSync(content)
      return processed.toString()
    } catch (error) {
      console.error('Error processing markdown:', error)
      return '<p>Error rendering markdown</p>'
    }
  }, [content])

  // Render Mermaid diagrams after content is updated
  useEffect(() => {
    if (previewRef.current) {
      const mermaidElements = previewRef.current.querySelectorAll('.mermaid')
      mermaidElements.forEach(async (element) => {
        try {
          const { svg } = await mermaid.render(`mermaid-${Math.random()}`, element.textContent || '')
          element.innerHTML = svg
        } catch (error) {
          console.error('Error rendering mermaid diagram:', error)
          element.innerHTML = `<div class="text-red-500 p-2 border border-red-300 rounded">
            <strong>Mermaid Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}
          </div>`
        }
      })
    }
  }, [renderedContent])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div
          ref={previewRef}
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>
    </div>
  )
}