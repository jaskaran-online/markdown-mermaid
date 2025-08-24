"use client"

import { useMemo, useEffect, useRef } from 'react'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import mermaid from 'mermaid'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
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

  const processedContent = useMemo(() => {
    try {
      console.log('Processing content:', content)
      // Extract code blocks and mermaid blocks
      const codeBlocks: { id: string; language: string; code: string; isMermaid: boolean }[] = []
      let blockCounter = 0

      // First, handle regular code blocks (excluding mermaid)
      let processedContent = content.replace(
        /```(?!mermaid)(\w+)?\s*\n([\s\S]*?)\n```/g,
        (_, language, code) => {
          const blockId = `block-${blockCounter++}`
          codeBlocks.push({
            id: blockId,
            language: language || 'text',
            code: code.trim(),
            isMermaid: false
          })
          return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`
        }
      )

      // Then handle Mermaid blocks specifically
      processedContent = processedContent.replace(
        /```mermaid\s*\n([\s\S]*?)\n```/g,
        (_, diagramCode) => {
          const blockId = `block-${blockCounter++}`
          console.log('Found Mermaid block:', diagramCode.trim())
          codeBlocks.push({
            id: blockId,
            language: 'mermaid',
            code: diagramCode.trim(),
            isMermaid: true
          })
          return `<div class="code-block-placeholder" data-block-id="${blockId}"></div>`
        }
      )

      console.log('Code blocks found:', codeBlocks)

      // Process markdown to HTML
      const processed = remark()
        .use(remarkGfm)
        .use(remarkHtml, { sanitize: false })
        .processSync(processedContent)

      return {
        html: processed.toString(),
        codeBlocks
      }
    } catch (error) {
      console.error('Error processing markdown:', error)
      return {
        html: '<p>Error rendering markdown</p>',
        codeBlocks: []
      }
    }
  }, [content])

  // Render code blocks after HTML is inserted
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      processedContent.codeBlocks.forEach((block) => {
        const placeholder = actualRef.current?.querySelector(`[data-block-id="${block.id}"]`)
        if (placeholder && !block.isMermaid) {
          const root = document.createElement('div')
          placeholder.parentNode?.replaceChild(root, placeholder)

          // Use React to render the syntax highlighter
          import('react-dom/client').then(({ createRoot }) => {
            createRoot(root).render(
              <SyntaxHighlighter
                language={block.language}
                style={theme === 'dark' ? oneDark : oneLight}
                customStyle={{
                  margin: '1rem 0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {block.code}
              </SyntaxHighlighter>
            )
          })
        }
      })
    }
  }, [processedContent, theme, actualRef])

  // Render Mermaid diagrams after content is updated
  useEffect(() => {
    if (actualRef.current && processedContent.codeBlocks.length > 0) {
      processedContent.codeBlocks.forEach(async (block) => {
        if (block.isMermaid) {
          const placeholder = actualRef.current?.querySelector(`[data-block-id="${block.id}"]`)
          if (placeholder) {
            try {
              const { svg } = await mermaid.render(block.id, block.code)
              placeholder.innerHTML = svg
            } catch (error) {
              console.error('Error rendering mermaid diagram:', error)
              placeholder.innerHTML = `<div class="text-red-500 p-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20">
                <strong>Mermaid Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}
                <pre class="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">${block.code}</pre>
              </div>`
            }
          }
        }
      })
    }
  }, [processedContent, actualRef])

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
          dangerouslySetInnerHTML={{ __html: processedContent.html }}
        />
      </div>
    </div>
  )
}
