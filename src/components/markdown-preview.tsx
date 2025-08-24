"use client"

import { useMemo, useEffect, useRef } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import mermaid from 'mermaid'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/theme-context'

interface MarkdownPreviewProps {
  content: string
  className?: string
  previewRef?: React.RefObject<HTMLDivElement | null>
}

export function MarkdownPreview({ content, className, previewRef }: MarkdownPreviewProps) {
  const internalRef = useRef<HTMLDivElement>(null)
  const actualRef = previewRef || internalRef
  const { theme } = useTheme()

  // Initialize and update Mermaid theme
  useEffect(() => {
    const mermaidTheme = theme === 'dark' ? 'dark' : 'default'
    mermaid.initialize({
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose',
    })
  }, [theme])

  const renderedContent = useMemo(() => {
    try {
      // First, preprocess the content to identify Mermaid blocks
      const processedContent = content.replace(
        /```mermaid\s*\n([\s\S]*?)\n```/g,
        (_, diagramCode) => {
          const diagramId = `mermaid-${Math.random().toString(36).substring(2, 11)}`
          return `<div class="mermaid" data-mermaid-id="${diagramId}">${diagramCode.trim()}</div>`
        }
      )

      const processed = remark()
        .use(remarkGfm)
        .use(remarkHtml, { sanitize: false })
        .processSync(processedContent)

      return processed.toString()
    } catch (error) {
      console.error('Error processing markdown:', error)
      return '<p>Error rendering markdown</p>'
    }
  }, [content])

  // Render Mermaid diagrams after content is updated
  useEffect(() => {
    if (actualRef.current) {
      const mermaidElements = actualRef.current.querySelectorAll('.mermaid')
      mermaidElements.forEach(async (element) => {
        const diagramId = element.getAttribute('data-mermaid-id') || `mermaid-${Math.random().toString(36).substring(2, 11)}`
        const diagramCode = element.textContent || ''

        try {
          const { svg } = await mermaid.render(diagramId, diagramCode)
          element.innerHTML = svg
        } catch (error) {
          console.error('Error rendering mermaid diagram:', error)
          element.innerHTML = `<div class="text-red-500 p-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
            <strong>Mermaid Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}
            <pre class="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">${diagramCode}</pre>
          </div>`
        }
      })
    }
  }, [renderedContent, actualRef])

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
          ref={actualRef}
          className="markdown-content prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>
    </div>
  )
}
