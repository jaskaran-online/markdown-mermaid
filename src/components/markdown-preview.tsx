import { useMemo } from 'react'
import { Button } from '@/components/ui/button'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const renderedContent = useMemo(() => {
    // Simple markdown rendering - in a real app, you'd use a library like remark
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>')
  }, [content])

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
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>
    </div>
  )
}